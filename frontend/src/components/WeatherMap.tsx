import { Box } from '@mui/material';

type WeatherMapProps = {
  latitude: number;
  longitude: number;
};

export default function WeatherMap({ latitude, longitude }: WeatherMapProps) {
  const delta = 0.2;
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 420, bgcolor: '#e8edf5' }}>
      <iframe
        title="city-weather-map"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 420 }}
        loading="lazy"
      />
    </Box>
  );
}
