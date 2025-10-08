import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const resolveSchema = z.object({
  resolvedById: z.string().optional(),
  notes: z.string().optional(),
});

export const reviewRouter = Router();

reviewRouter.get('/', async (_req, res) => {
  const queues = await prisma.reviewItem.findMany({
    orderBy: { createdAt: 'asc' },
  });
  res.json(queues);
});

reviewRouter.post('/:id/resolve', async (req, res, next) => {
  try {
    const data = resolveSchema.parse(req.body);
    const item = await prisma.reviewItem.update({
      where: { id: req.params.id },
      data: {
        resolvedAt: new Date(),
        resolvedById: data.resolvedById,
        notes: data.notes,
      },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});
