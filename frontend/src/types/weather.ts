export type WeatherData = {
  city: string;
  country?: string;
  temperature?: number;
  humidity?: number;
  condition?: string;
  description?: string;
  windSpeed?: number;
};

export type GeocodeResult = {
  name: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
};
