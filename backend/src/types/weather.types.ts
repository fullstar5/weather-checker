export type WeatherResponse = {
    city: string;
    country?: string;
    temperature?: number;
    humidity?: number;
    condition?: string;
    description?: string;
    windSpeed?: number;
}