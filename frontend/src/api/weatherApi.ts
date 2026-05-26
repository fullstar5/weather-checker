import { http } from './http';
import type { GeocodeResult, WeatherData } from '../types/weather';

export const getWeatherApi = async (city: string): Promise<WeatherData> => {
  const res = await http.get<WeatherData>('/api/weather', {
    params: { city },
  });
  return res.data;
};

export const geocodeCityApi = async (city: string): Promise<GeocodeResult> => {
  const res = await http.get<GeocodeResult>('/api/weather/geocode', {
    params: { city },
  });
  return res.data;
};
