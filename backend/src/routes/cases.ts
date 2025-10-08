import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiError } from '../middleware/error-handler';

const createCaseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(['STANDARD', 'URGENT']).default('STANDARD'),
  clientId: z.string(),
  siteId: z.string(),
  driveFolderUrl: z.string().url().optional(),
  calendarEventId: z.string().optional(),
  plannedAt: z.coerce.date().optional(),
  createdById: z.string(),
});

const updateCaseSchema = createCaseSchema.partial().extend({
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_PARTS', 'REPORT_PENDING', 'COMPLETED', 'CLOSED'])
    .optional(),
  closedById: z.string().optional(),
  closedAt: z.coerce.date().optional(),
});

const createInterventionSchema = z.object({
  title: z.string().min(3),
  type: z.enum(['URGENT', 'STANDARD', 'ASTREINTE', 'INSTALLATION', 'MAINTENANCE', 'QUOTE_ONLY']),
  priority: z.enum(['STANDARD', 'URGENT']).default('STANDARD'),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  technicianId: z.string().optional(),
  notes: z.string().optional(),
  driveFolderUrl: z.string().optional(),
});

export const casesRouter = Router();

casesRouter.get('/', async (_req, res) => {
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      site: true,
      interventions: {
        include: { technician: true },
      },
      quotes: true,
    },
  });
  res.json(cases);
});

casesRouter.post('/', async (req, res, next) => {
  try {
    const data = createCaseSchema.parse(req.body);
    const newCase = await prisma.case.create({
      data,
      include: {
        client: true,
        site: true,
      },
    });
    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
});

casesRouter.get('/:id', async (req, res, next) => {
  try {
    const dossier = await prisma.case.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        site: true,
        interventions: {
          include: {
            technician: true,
            logs: true,
            media: true,
            quoteRequests: true,
            deviceProposals: true,
          },
        },
        quotes: true,
      },
    });
    if (!dossier) {
      throw new ApiError(404, 'Case not found');
    }
    res.json(dossier);
  } catch (error) {
    next(error);
  }
});

casesRouter.post('/:id/interventions', async (req, res, next) => {
  try {
    const data = createInterventionSchema.parse(req.body);
    const intervention = await prisma.intervention.create({
      data: {
        ...data,
        caseId: req.params.id,
        status: data.technicianId ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
      },
      include: {
        technician: true,
        case: true,
      },
    });

    if (data.technicianId) {
      await prisma.interventionLog.create({
        data: {
          interventionId: intervention.id,
          statusFrom: 'PENDING_ASSIGNMENT',
          statusTo: 'ASSIGNED',
          createdById: data.technicianId,
          note: 'Assignation initiale',
        },
      });
    }

    res.status(201).json(intervention);
  } catch (error) {
    next(error);
  }
});

casesRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = updateCaseSchema.parse(req.body);
    const updated = await prisma.case.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

casesRouter.post('/:id/close', async (req, res, next) => {
  const schema = z.object({
    closedById: z.string(),
    note: z.string().optional(),
  });
  try {
    const data = schema.parse(req.body);
    const closed = await prisma.case.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: data.closedById,
      },
    });

    await prisma.reviewItem.create({
      data: {
        queue: 'REPORT',
        label: `Clôture du dossier ${closed.title}`,
        referenceId: closed.id,
        notes: req.body.note,
      },
    });

    res.json(closed);
  } catch (error) {
    next(error);
  }
});
