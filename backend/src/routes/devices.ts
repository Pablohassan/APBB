import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiError } from '../middleware/error-handler';

const updateDeviceSchema = z.object({
  label: z.string().min(2).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['PENDING_VALIDATION', 'ACTIVE', 'RETIRED', 'REPLACED']).optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  accessLocation: z.string().optional(),
  notes: z.string().optional(),
  installedAt: z.coerce.date().optional(),
  retiredAt: z.coerce.date().optional(),
});

const validateProposalSchema = z.object({
  validatedById: z.string(),
  status: z.enum(['ACTIVE', 'REJECTED', 'REPLACED']).default('ACTIVE'),
  notes: z.string().optional(),
});

export const devicesRouter = Router();

devicesRouter.get('/', async (_req, res) => {
  const devices = await prisma.device.findMany({
    include: {
      site: { include: { client: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(devices);
});

devicesRouter.get('/proposals', async (_req, res) => {
  const proposals = await prisma.deviceProposal.findMany({
    where: { status: 'PENDING_VALIDATION' },
    include: {
      site: { include: { client: true } },
      intervention: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(proposals);
});

devicesRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = updateDeviceSchema.parse(req.body);
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data,
    });
    res.json(device);
  } catch (error) {
    next(error);
  }
});

devicesRouter.post('/proposals/:id/validate', async (req, res, next) => {
  try {
    const data = validateProposalSchema.parse(req.body);
    const proposal = await prisma.deviceProposal.findUnique({ where: { id: req.params.id } });
    if (!proposal) {
      throw new ApiError(404, 'Proposal not found');
    }

    const shouldCreateDevice = data.status === 'ACTIVE';

    const result = await prisma.$transaction(async (tx) => {
      let deviceId = proposal.previousDeviceId;

      if (shouldCreateDevice) {
        const device = await tx.device.create({
          data: {
            siteId: proposal.siteId,
            label: proposal.label,
            brand: proposal.brand,
            model: proposal.model,
            serialNumber: proposal.serialNumber,
            gpsLatitude: proposal.gpsLatitude,
            gpsLongitude: proposal.gpsLongitude,
            accessLocation: proposal.accessLocation,
            notes: proposal.notes,
            status: 'ACTIVE',
            installedAt: new Date(),
          },
        });
        deviceId = device.id;
      }

      if (proposal.previousDeviceId && shouldCreateDevice) {
        await tx.device.update({
          where: { id: proposal.previousDeviceId },
          data: { status: 'REPLACED', retiredAt: new Date() },
        });
      }

      const updatedProposal = await tx.deviceProposal.update({
        where: { id: proposal.id },
        data: {
          status: shouldCreateDevice
            ? 'ACTIVE'
            : data.status === 'REPLACED'
              ? 'REPLACED'
              : 'REJECTED',
          validatedAt: new Date(),
          validatedById: data.validatedById,
          notes: data.notes,
        },
      });

      await tx.reviewItem.updateMany({
        where: { referenceId: proposal.id, resolvedAt: null },
        data: { resolvedAt: new Date(), notes: data.notes },
      });

      return { updatedProposal, deviceId };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

devicesRouter.post('/proposals/:id/reject', async (req, res, next) => {
  const schema = z.object({
    validatedById: z.string(),
    rejectionNote: z.string().min(5),
  });
  try {
    const data = schema.parse(req.body);
    const proposal = await prisma.deviceProposal.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectionNote: data.rejectionNote,
        rejectedAt: new Date(),
        validatedById: data.validatedById,
      },
    });
    res.json(proposal);
  } catch (error) {
    next(error);
  }
});
