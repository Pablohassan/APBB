import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiError } from '../middleware/error-handler';

const clientPayloadSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
  sites: z
    .array(
      z.object({
        label: z.string(),
        addressLine1: z.string(),
        addressLine2: z.string().optional(),
        postalCode: z.string(),
        city: z.string(),
        country: z.string().default('France'),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        accessNotes: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
      }),
    )
    .default([]),
});

const sitePayloadSchema = clientPayloadSchema.shape.sites.element.pick({
  label: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  accessNotes: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
});

export const clientsRouter = Router();

clientsRouter.get('/', async (_req, res) => {
  const clients = await prisma.client.findMany({
    include: {
      sites: true,
    },
    orderBy: { name: 'asc' },
  });
  res.json(clients);
});

clientsRouter.post('/', async (req, res, next) => {
  try {
    const data = clientPayloadSchema.parse(req.body);
    const client = await prisma.client.create({
      data: {
        name: data.name,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        billingAddress: data.billingAddress,
        notes: data.notes,
        sites: {
          create: data.sites.map((site) => ({
            ...site,
          })),
        },
      },
      include: { sites: true },
    });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        sites: {
          include: {
            devices: true,
          },
        },
        cases: {
          include: {
            interventions: true,
            quotes: true,
          },
        },
      },
    });
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
});

clientsRouter.post('/:id/sites', async (req, res, next) => {
  try {
    const data = sitePayloadSchema.parse(req.body);
    const site = await prisma.site.create({
      data: {
        ...data,
        clientId: req.params.id,
      },
    });
    res.status(201).json(site);
  } catch (error) {
    next(error);
  }
});

clientsRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = clientPayloadSchema.partial().parse(req.body);
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...data,
        sites: undefined,
      },
    });
    res.json(client);
  } catch (error) {
    next(error);
  }
});
