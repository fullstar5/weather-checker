export type PushPreferences = {
  frequencySeconds: number;
  upcomingHours: number;
};

export type CurrentWeatherSnapshot = {
  temperature?: number;
  humidity?: number;
  condition?: string;
  description?: string;
};

export type UpcomingWeatherSnapshot = {
  at: string;
  temperature?: number;
  condition?: string;
  description?: string;
};

export type WeatherMessagePayload = {
  city: string;
  generatedAt: string;
  preferences: PushPreferences;
  current: CurrentWeatherSnapshot;
  upcoming: UpcomingWeatherSnapshot[];
};
