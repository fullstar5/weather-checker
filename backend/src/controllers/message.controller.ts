import type { Request, Response } from 'express';
import { getSocketServer } from '../socket/socketServer';
import {
  buildWeatherMessage,
  DEFAULT_FREQUENCY_SECONDS,
  DEFAULT_UPCOMING_HOURS,
  normalizePreferences,
} from '../services/weather-message.service';

type PushBody = {
  city?: string;
  upcomingHours?: number;
};

export const pushWeatherMessage = async (
  req: Request<unknown, unknown, PushBody>,
  res: Response
): Promise<Response> => {
  try {
    const city = String(req.body.city ?? '').trim();
    if (!city) {
      return res.status(400).json({ message: 'city is required' });
    }

    const preferences = normalizePreferences({
      frequencySeconds: DEFAULT_FREQUENCY_SECONDS,
      upcomingHours: req.body.upcomingHours ?? DEFAULT_UPCOMING_HOURS,
    });

    const payload = await buildWeatherMessage(city, preferences);
    const io = getSocketServer();
    io.to(city).emit('weather-message', payload);

    return res.status(200).json({
      message: 'weather message pushed',
      city,
      deliveredToRoom: city,
      generatedAt: payload.generatedAt,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(502).json({
        message: 'failed to push weather message',
        error: error.message,
      });
    }
    return res.status(502).json({ message: 'failed to push weather message' });
  }
};