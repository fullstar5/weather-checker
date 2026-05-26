import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRouter from './routes/auth.routes';
import weatherRouter from './routes/weather.routes';


dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'weather-checker-backend' });
});

app.use('/api/auth', authRouter);

app.use('/api/weather', weatherRouter);

app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});