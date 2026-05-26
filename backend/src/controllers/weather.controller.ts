import axios from 'axios';
import type { Request, Response } from 'express';
import {
  getCityCoordinates,
  getCurrentAndUpcomingForecast,
  toWeatherResponse,
} from '../services/weather.service';


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
    const weatherBundle = await getCurrentAndUpcomingForecast(city, weatherApiKey, 3);
    return res.status(200).json(toWeatherResponse(weatherBundle));
  } 
  
  catch (error) {
    if (error instanceof Error && error.message === 'city not found') {
      return res.status(404).json({ message: 'city not found' });
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ message: 'city not found' });
    }
    if (axios.isAxiosError(error)) {
      const providerMessage =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : error.message;
      return res.status(502).json({
        message: 'failed to fetch weather from provider',
        providerStatus: error.response?.status ?? null,
        providerMessage,
      });
    }
    return res.status(502).json({ message: 'failed to fetch weather from provider' });
  }
  
};

export const geocodeCity = async (req: Request, res: Response): Promise<Response> => {
  try {
    const city = String(req.query.city || '').trim();
    const weatherApiKey = process.env.WEATHER_API_KEY;

    if (!city) {
      return res.status(400).json({ message: 'city query is required' });
    }

    if (!weatherApiKey) {
      return res.status(500).json({ message: 'WEATHER_API_KEY is missing in .env' });
    }

    const result = await getCityCoordinates(city, weatherApiKey);
    if (!result) {
      return res.status(404).json({ message: 'city not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ message: 'city not found' });
    }
    if (axios.isAxiosError(error)) {
      const providerMessage =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : error.message;
      return res.status(502).json({
        message: 'failed to geocode city from provider',
        providerStatus: error.response?.status ?? null,
        providerMessage,
      });
    }

    return res.status(502).json({ message: 'failed to geocode city from provider' });
  }
};