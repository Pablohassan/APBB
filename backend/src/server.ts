import express from 'express';
import cors from 'cors';
import { clientsRouter } from './routes/clients';
import { casesRouter } from './routes/cases';
import { interventionsRouter } from './routes/interventions';
import { devicesRouter } from './routes/devices';
import { quotesRouter } from './routes/quotes';
import { reviewRouter } from './routes/review';
import { errorHandler } from './middleware/error-handler';

export const createServer = () => {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_BASE_URL || '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/clients', clientsRouter);
  app.use('/cases', casesRouter);
  app.use('/interventions', interventionsRouter);
  app.use('/devices', devicesRouter);
  app.use('/quotes', quotesRouter);
  app.use('/reviews', reviewRouter);

  app.use(errorHandler);

  return app;
};
