import axios from 'axios';
import type { GeocodeResult, WeatherResponse } from '../types/weather.types';
import type { UpcomingWeatherSnapshot } from '../types/realtime.types';

type WeatherCurrentResponse = {
  main?: {
    temp?: number;
    humidity?: number;
  };
  weather?: Array<{ main?: string; description?: string }>;
  wind?: {
    speed?: number;
  };
};

type ForecastResponse = {
  city?: {
    timezone?: number;
  };
  list?: Array<{
    dt: number;
    main?: { temp?: number };
    weather?: Array<{ main?: string; description?: string }>;
  }>;
};

type WeatherBundle = {
  city: string;
  country?: string;
  current: {
    temperature?: number;
    humidity?: number;
    condition?: string;
    description?: string;
    windSpeed?: number;
  };
  upcoming: UpcomingWeatherSnapshot[];
};

const formatHourlyTime = (unixSeconds: number, timezoneOffsetSeconds = 0): string => {
  const utcDate = new Date(unixSeconds * 1000);
  const localTargetTime = new Date(utcDate.getTime() + timezoneOffsetSeconds * 1000);
  const hh = `${localTargetTime.getUTCHours()}`.padStart(2, '0');
  const mm = `${localTargetTime.getUTCMinutes()}`.padStart(2, '0');
  return `${hh}:${mm}`;
};


/**
 * 
 * @param city 
 * @param weatherApiKey 
 * @param upcomingHours 
 * @returns current && upcoming weather info
 */
export const getCurrentAndUpcomingForecast = async (
  city: string,
  weatherApiKey: string,
  upcomingHours: number
): Promise<WeatherBundle> => {
  const geocode = await getCityCoordinates(city, weatherApiKey);
  if (!geocode) {
    throw new Error('city not found');
  }

  let currentResponse;
  let forecastResponse;
  try {
    currentResponse = await axios.get<WeatherCurrentResponse>(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat: geocode.lat,
          lon: geocode.lon,
          appid: weatherApiKey,
          units: 'metric',
        },
      }
    );
    forecastResponse = await axios.get<ForecastResponse>(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat: geocode.lat,
          lon: geocode.lon,
          appid: weatherApiKey,
          units: 'metric',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const providerMessage =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : error.message;
      throw new Error(
        `OpenWeather request failed (${error.response?.status ?? 'unknown'}): ${providerMessage}`
      );
    }
    throw error;
  }
  
  const data = currentResponse.data;
  const timezoneOffset = forecastResponse.data.city?.timezone ?? 0;
  const safeHours = Math.max(1, Math.floor(upcomingHours));
  const slotCount = Math.max(1, Math.ceil(safeHours / 3));
  const upcoming = (forecastResponse.data.list ?? []).slice(0, slotCount).map((item) => ({
    at: formatHourlyTime(item.dt, timezoneOffset),
    temperature: item.main?.temp,
    condition: item.weather?.[0]?.main,
    description: item.weather?.[0]?.description,
  }));

  return {
    city: geocode.name,
    country: geocode.country,
    current: {
      temperature: data.main?.temp,
      humidity: data.main?.humidity,
      condition: data.weather?.[0]?.main,
      description: data.weather?.[0]?.description,
      windSpeed: data.wind?.speed,
    },
    upcoming,
  };
};

export const toWeatherResponse = (bundle: WeatherBundle): WeatherResponse => ({
  city: bundle.city,
  country: bundle.country,
  temperature: bundle.current.temperature,
  humidity: bundle.current.humidity,
  condition: bundle.current.condition,
  description: bundle.current.description,
  windSpeed: bundle.current.windSpeed,
});

type OpenWeatherGeocodeResponse = Array<{
  name: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
}>;


/**
 * 
 * @param city 
 * @param weatherApiKey 
 * @returns city coordinates
 */
export const getCityCoordinates = async (
  city: string,
  weatherApiKey: string
): Promise<GeocodeResult | null> => {
  const response = await axios.get<OpenWeatherGeocodeResponse>(
    'https://api.openweathermap.org/geo/1.0/direct',
    {
      params: {
        q: city,
        limit: 1,
        appid: weatherApiKey,
      },
    }
  );

  const result = response.data[0];
  if (!result) {
    return null;
  }

  return {
    name: result.name,
    country: result.country,
    state: result.state,
    lat: result.lat,
    lon: result.lon,
  };
};