import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/auth.routes';
import weatherRouter from './routes/weather.routes';
import messageRouter from './routes/message.routes';
import { setSocketServer } from './socket/socketServer';
import { registerSocketHandlers } from './socket/registerSocketHandlers';

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
app.use('/api/message', messageRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setSocketServer(io);
registerSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});