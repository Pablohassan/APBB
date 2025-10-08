import dotenv from 'dotenv';
import { createServer } from './server';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createServer();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
