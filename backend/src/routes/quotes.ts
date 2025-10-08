import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiError } from '../middleware/error-handler';

const createQuoteSchema = z.object({
  caseId: z.string(),
  requestedById: z.string(),
  label: z.string().optional(),
  notes: z.string().optional(),
});

const updateQuoteSchema = z.object({
  status: z.enum(['REQUESTED', 'IN_PROGRESS', 'SENT', 'ACCEPTED', 'DECLINED']).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  documentUrl: z.string().url().optional(),
  handledById: z.string().optional(),
  notes: z.string().optional(),
});

export const quotesRouter = Router();

quotesRouter.get('/', async (_req, res) => {
  const quotes = await prisma.quote.findMany({
    include: {
      case: { include: { client: true, site: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(quotes);
});

quotesRouter.post('/', async (req, res, next) => {
  try {
    const data = createQuoteSchema.parse(req.body);
    const quote = await prisma.quote.create({
      data: {
        ...data,
      },
      include: {
        case: true,
      },
    });

    await prisma.reviewItem.create({
      data: {
        queue: 'QUOTE',
        label: `Devis à traiter - ${quote.label ?? quote.id}`,
        referenceId: quote.id,
      },
    });

    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
});

quotesRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = updateQuoteSchema.parse(req.body);
    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data,
    });

    if (data.status && ['SENT', 'ACCEPTED', 'DECLINED'].includes(data.status)) {
      await prisma.reviewItem.updateMany({
        where: { referenceId: quote.id, queue: 'QUOTE', resolvedAt: null },
        data: { resolvedAt: new Date(), notes: data.notes },
      });
    }

    res.json(quote);
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/link-request/:requestId', async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        quoteRequests: {
          update: {
            where: { id: requestId },
            data: {
              quoteId: id,
              status: 'IN_PROGRESS',
            },
          },
        },
      },
    });
    res.json(quote);
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/mark-sent', async (req, res, next) => {
  const schema = z.object({ sentAt: z.coerce.date().optional(), handledById: z.string().optional() });
  try {
    const data = schema.parse(req.body);
    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: {
        status: 'SENT',
        sentAt: data.sentAt ?? new Date(),
        handledById: data.handledById,
      },
    });

    await prisma.reviewItem.updateMany({
      where: { referenceId: quote.id, queue: 'QUOTE', resolvedAt: null },
      data: { resolvedAt: new Date() },
    });

    res.json(quote);
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/mark-accepted', async (req, res, next) => {
  const schema = z.object({ acceptedAt: z.coerce.date().optional() });
  try {
    const data = schema.parse(req.body);
    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: data.acceptedAt ?? new Date(),
      },
    });
    res.json(quote);
  } catch (error) {
    next(error);
  }
});

quotesRouter.get('/:id', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        case: true,
        quoteRequests: true,
      },
    });
    if (!quote) {
      throw new ApiError(404, 'Quote not found');
    }
    res.json(quote);
  } catch (error) {
    next(error);
  }
});
