import { getCurrentAndUpcomingForecast } from './weather.service';
import type { PushPreferences, WeatherMessagePayload } from '../types/realtime.types';



export const DEFAULT_FREQUENCY_SECONDS = 30;
export const DEFAULT_UPCOMING_HOURS = 3;

const MIN_FREQUENCY_SECONDS = 10;
const MAX_FREQUENCY_SECONDS = 3600;
const MIN_UPCOMING_HOURS = 1;
const MAX_UPCOMING_HOURS = 24;

const toSafeNumber = (value: number, fallback: number): number => {
  return Number.isFinite(value) ? value : fallback;
};

export const normalizePreferences = (input?: Partial<PushPreferences>): PushPreferences => {
    const frequencyRaw = toSafeNumber(
      input?.frequencySeconds ?? DEFAULT_FREQUENCY_SECONDS,
      DEFAULT_FREQUENCY_SECONDS
    );
    const upcomingRaw = toSafeNumber(
      input?.upcomingHours ?? DEFAULT_UPCOMING_HOURS,
      DEFAULT_UPCOMING_HOURS
    );

    const frequencySeconds = Math.min(
        MAX_FREQUENCY_SECONDS, 
        Math.max(
            MIN_FREQUENCY_SECONDS, 
            Math.floor(frequencyRaw)
        )
    );

    const upcomingHours = Math.min(
        MAX_UPCOMING_HOURS,
        Math.max(MIN_UPCOMING_HOURS, Math.floor(upcomingRaw))
    );

    return {frequencySeconds, upcomingHours};
};

export const buildWeatherMessage = async(
    city: string,
    preferences: PushPreferences
): Promise<WeatherMessagePayload> => {
    const weatherApiKey = process.env.WEATHER_API_KEY;
    if (!weatherApiKey) {
        throw new Error('Weather API key is missing');
    }

    const weatherData = await getCurrentAndUpcomingForecast(
      city,
      weatherApiKey,
      preferences.upcomingHours
    );

    return {
        city: `${weatherData.city}${weatherData.country ? `,${weatherData.country}` : ''}`,
        generatedAt: new Date().toISOString(),
        preferences,
        current: weatherData.current,
        upcoming: weatherData.upcoming,
    };
};

