import axios from 'axios';
import type { WeatherResponse } from '../types/weather.types';


export const getCurrentWeather = async (
  city: string,
  weatherApiKey: string
): Promise<WeatherResponse> => {

  const weatherResponse = await axios.get(
    'https://api.openweathermap.org/data/2.5/weather',
    {
      params: {
        q: city,
        appid: weatherApiKey,
        units: 'metric',
      },
    }
  );
  
  const data = weatherResponse.data;

  return {
    city: data.name,
    country: data.sys?.country,
    temperature: data.main?.temp,
    humidity: data.main?.humidity,
    condition: data.weather?.[0]?.main,
    description: data.weather?.[0]?.description,
    windSpeed: data.wind?.speed,
  };
};