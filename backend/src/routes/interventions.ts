import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiError } from '../middleware/error-handler';

const statusTransitionSchema = z.object({
  status: z.enum(['PENDING_ASSIGNMENT', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'REPORT_PENDING', 'COMPLETED', 'CANCELLED']),
  userId: z.string(),
  note: z.string().optional(),
  timestamp: z.coerce.date().optional(),
});

const assignmentSchema = z.object({
  technicianId: z.string(),
  assignedById: z.string(),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  note: z.string().optional(),
});

const mediaSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  mediaType: z.enum(['PHOTO', 'DOCUMENT']).default('PHOTO'),
});

const quoteRequestSchema = z.object({
  description: z.string().min(5),
  templateKey: z.string().optional(),
});

const deviceProposalSchema = z.object({
  label: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  accessLocation: z.string().optional(),
  notes: z.string().optional(),
  photosFolderUrl: z.string().url().optional(),
  siteId: z.string(),
  previousDeviceId: z.string().optional(),
});

export const interventionsRouter = Router();

interventionsRouter.get('/', async (_req, res) => {
  const interventions = await prisma.intervention.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      case: { include: { client: true, site: true } },
      technician: true,
      logs: true,
      media: true,
      quoteRequests: true,
      deviceProposals: true,
    },
  });
  res.json(interventions);
});

interventionsRouter.get('/:id', async (req, res, next) => {
  try {
    const intervention = await prisma.intervention.findUnique({
      where: { id: req.params.id },
      include: {
        case: { include: { client: true, site: true } },
        technician: true,
        logs: { orderBy: { createdAt: 'asc' } },
        media: true,
        quoteRequests: true,
        deviceProposals: true,
      },
    });
    if (!intervention) {
      throw new ApiError(404, 'Intervention not found');
    }
    res.json(intervention);
  } catch (error) {
    next(error);
  }
});

interventionsRouter.post('/:id/assign', async (req, res, next) => {
  try {
    const data = assignmentSchema.parse(req.body);
    const intervention = await prisma.intervention.update({
      where: { id: req.params.id },
      data: {
        technicianId: data.technicianId,
        status: 'ASSIGNED',
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
      },
      include: { technician: true },
    });

    await prisma.interventionLog.create({
      data: {
        interventionId: intervention.id,
        statusFrom: 'PENDING_ASSIGNMENT',
        statusTo: 'ASSIGNED',
        createdById: data.assignedById,
        note: data.note ?? 'Assignation',
      },
    });

    res.json(intervention);
  } catch (error) {
    next(error);
  }
});

interventionsRouter.post('/:id/status', async (req, res, next) => {
  try {
    const data = statusTransitionSchema.parse(req.body);
    const intervention = await prisma.intervention.update({
      where: { id: req.params.id },
      data: {
        status: data.status,
        actualStart: data.status === 'ON_SITE' ? data.timestamp ?? new Date() : undefined,
        actualEnd: data.status === 'COMPLETED' ? data.timestamp ?? new Date() : undefined,
      },
    });

    await prisma.interventionLog.create({
      data: {
        interventionId: intervention.id,
        statusFrom: undefined,
        statusTo: data.status,
        note: data.note,
        createdById: data.userId,
      },
    });

    if (data.status === 'REPORT_PENDING') {
      await prisma.reviewItem.create({
        data: {
          queue: 'REPORT',
          label: `Compte rendu à valider - ${intervention.title}`,
          referenceId: intervention.id,
        },
      });
    }

    if (data.status === 'COMPLETED') {
      await prisma.reviewItem.updateMany({
        where: { referenceId: intervention.id, resolvedAt: null },
        data: { resolvedAt: new Date(), notes: 'Intervention terminée' },
      });
    }

    res.json(intervention);
  } catch (error) {
    next(error);
  }
});

interventionsRouter.post('/:id/media', async (req, res, next) => {
  try {
    const data = mediaSchema.parse(req.body);
    const media = await prisma.interventionMedia.create({
      data: {
        ...data,
        interventionId: req.params.id,
      },
    });
    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
});

interventionsRouter.post('/:id/quote-request', async (req, res, next) => {
  try {
    const data = quoteRequestSchema.parse(req.body);
    const request = await prisma.quoteRequest.create({
      data: {
        ...data,
        interventionId: req.params.id,
      },
    });

    await prisma.reviewItem.create({
      data: {
        queue: 'QUOTE',
        label: `Demande de devis - ${request.description.substring(0, 40)}`,
        referenceId: request.id,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

interventionsRouter.post('/:id/device-proposals', async (req, res, next) => {
  try {
    const data = deviceProposalSchema.parse(req.body);
    const proposal = await prisma.deviceProposal.create({
      data: {
        ...data,
        interventionId: req.params.id,
      },
    });

    await prisma.reviewItem.create({
      data: {
        queue: 'DEVICE_VALIDATION',
        label: `Nouvel appareil à valider - ${data.label}`,
        referenceId: proposal.id,
      },
    });

    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
});
