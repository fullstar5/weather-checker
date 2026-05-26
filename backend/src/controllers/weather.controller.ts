import axios from 'axios';
import type { Request, Response } from 'express';
import { getCurrentWeather } from '../services/weather.service';


export const getWeather = async (req: Request, res: Response): Promise<Response> => {

  try {
    const city = String(req.query.city || '').trim();
    const weatherApiKey = process.env.WEATHER_API_KEY;
    if (!city) {
      return res.status(400).json({ message: 'city query is required' });
    }
    if (!weatherApiKey) {
      return res.status(500).json({ message: 'WEATHER_API_KEY is missing in .env' });
    }
    const result = await getCurrentWeather(city, weatherApiKey);
    return res.status(200).json(result);
  } 
  
  catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ message: 'city not found' });
    }
    return res.status(502).json({ message: 'failed to fetch weather from provider' });
  }
  
};