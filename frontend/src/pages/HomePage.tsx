import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { geocodeCityApi, getWeatherApi } from '../api/weatherApi';
import type { WeatherData } from '../types/weather';
import type { PushPreferences, WeatherMessagePayload, ChatMessagePayload} from '../types/realtime';
import { clearAuth, getUsername } from '../utils/authStorage';
import { disconnectSocket, getSocket } from '../socket/client';
import WeatherMap from '../components/WeatherMap';
import { sendMessageApi } from '../api/messageApi';

const FREQUENCY_OPTIONS = [10, 30, 60, 120];
const UPCOMING_HOURS_OPTIONS = [3, 6, 9, 12, 24];

const DEFAULT_PREFERENCES: PushPreferences = {
  frequencySeconds: 30,
  upcomingHours: 3,
};

export default function HomePage() {
  const navigate = useNavigate();
  const username = getUsername();
  const [cityInput, setCityInput] = useState<string>('Melbourne,AU');
  const [city, setCity] = useState<string>('Melbourne,AU');
  const [mapCenter, setMapCenter] = useState({ latitude: -37.8136, longitude: 144.9631 });
  const [preferences, setPreferences] = useState<PushPreferences>(DEFAULT_PREFERENCES);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [liveMessage, setLiveMessage] = useState<WeatherMessagePayload | null>(null);
  const [lastLiveSummary, setLastLiveSummary] = useState<string>('-');
  const [mapTickerText, setMapTickerText] = useState<string>('');
  const [mapTickerVisible, setMapTickerVisible] = useState(false);
  const [mapTickerKey, setMapTickerKey] = useState(0);
  const [tickerQueue, setTickerQueue] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const hasJoinedRef = useRef(false);


  // popup for snackbar
  const [popup, setPopup] = useState<{
    open: boolean;
    message: string;
    severity: 'info' | 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [chatInput, setChatInput] = useState('');
  const [chatMessage, setChatMessage] = useState<ChatMessagePayload[]>([]); 

  const showMessage = (severity: 'success' | 'error' | 'info', message: string) => {
    setTickerQueue((prev) => [...prev, message]);

    setPopup({
      open: true,
      message,
      severity,
    });
  };

  const clearTickerQueue = () => {
    setTickerQueue([]);
    setMapTickerVisible(false);
    setMapTickerText('');
  };

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const data = await getWeatherApi(city);
      setCurrentWeather(data);
    } catch {
      showMessage('error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async () => {
    const query = cityInput.trim();
    if (!query) {
      showMessage('error', 'Please input a city name');
      return;
    }

    setLoading(true);
    try {
      const geo = await geocodeCityApi(query);
      const formattedCity = `${geo.name}${geo.country ? `,${geo.country}` : ''}`;

      setCity(formattedCity);
      setCityInput(formattedCity);
      setMapCenter({ latitude: geo.lat, longitude: geo.lon });
      showMessage('success', `Jumped to ${formattedCity}`);
    } catch {
      showMessage('error', 'City not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWeather();
  }, [city, preferences.upcomingHours]);

  useEffect(() => {
    const socket = getSocket();

    const handleWeatherMessage = (payload: WeatherMessagePayload) => {
      setLiveMessage(payload);
      setLastLiveSummary(
        `${payload.current.condition ?? '-'} ${payload.current.temperature ?? '-'}C`
      );
      const upcomingPreview = payload.upcoming
        ?.map((item) => `${item.at} ${item.condition ?? '-'} ${item.temperature ?? '-'}C`)
        .join(' | ');
      showMessage(
        'info',
        `${payload.city} | Now: ${payload.current.condition ?? '-'} ${
          payload.current.temperature ?? '-'
        }C | Next: ${upcomingPreview || 'No upcoming data'}`
      );
    };

    const handleChatMessage = (payload: ChatMessagePayload) => {
      setChatMessage((prev) => [...prev, payload]);
    };

    const handleSubscriptionError = (payload: { message?: string }) => {
      showMessage('error', payload.message ?? 'Subscription error');
    };

    const handleWeatherError = (payload: { message?: string }) => {
      showMessage('error', payload.message ?? 'Realtime weather error');
    };

    socket.on('weather-message', handleWeatherMessage);
    socket.on('chat-message', handleChatMessage);
    socket.on('subscription-error', handleSubscriptionError);
    socket.on('weather-error', handleWeatherError);


    return () => {
      socket.off('weather-message', handleWeatherMessage);
      socket.off('chat-message', handleChatMessage);
      socket.off('subscription-error', handleSubscriptionError);
      socket.off('weather-error', handleWeatherError);
      socket.emit('leave-city');
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (mapTickerVisible || tickerQueue.length === 0) {
      return;
    }

    const [nextMessage, ...rest] = tickerQueue;
    setTickerQueue(rest);
    setMapTickerText(nextMessage);
    setMapTickerVisible(true);
    setMapTickerKey((prev) => prev + 1);
  }, [mapTickerVisible, tickerQueue]);

  useEffect(() => {
    if (!mapTickerVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMapTickerVisible(false);
    }, 8500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mapTickerVisible, mapTickerKey]);

  useEffect(() => {
    clearTickerQueue();
    setChatMessage([]);
    const socket = getSocket();
    socket.emit('join-city', {
      city,
      frequencySeconds: preferences.frequencySeconds,
      upcomingHours: preferences.upcomingHours,
    });
    hasJoinedRef.current = true;
  }, [city, preferences.upcomingHours]);

  const handleRefreshWeather = async () => {
    clearTickerQueue();
    await fetchWeather();
    const socket = getSocket();
    socket.emit('refresh-weather');
  };

  const handleSendChatMessage = async() => {
    const text = chatInput.trim();
    if (!text) return

    const username = getUsername() ?? 'failed to display username';

    try {
      await sendMessageApi({
        username,
        city,
        message:text,
      });
      setChatInput('');
    }
    catch {
      showMessage('error', 'Failed to send message');
    }
  }

  useEffect(() => {
    if (!hasJoinedRef.current) {
      return;
    }

    const socket = getSocket();
    socket.emit('update-preferences', {
      frequencySeconds: preferences.frequencySeconds,
    });
  }, [preferences.frequencySeconds]);

  const handleLogout = () => {
    clearAuth();
    disconnectSocket();
    navigate('/login');
  };

  const weatherCells: Array<{ label: string; value: string; gradient: string }> = [
    {
      label: 'City',
      value: currentWeather?.city ?? city,
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    },
    {
      label: 'Temperature',
      value: currentWeather?.temperature !== undefined ? `${currentWeather.temperature} C` : '-',
      gradient: 'linear-gradient(135deg, #fb923c, #ea580c)',
    },
    {
      label: 'Condition',
      value: currentWeather?.condition ?? '-',
      gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    },
    {
      label: 'Description',
      value: currentWeather?.description ?? '-',
      gradient: 'linear-gradient(135deg, #334155, #1f2937)',
    },
    {
      label: 'Humidity',
      value: currentWeather?.humidity !== undefined ? `${currentWeather.humidity}%` : '-',
      gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    },
    {
      label: 'Wind',
      value: currentWeather?.windSpeed !== undefined ? `${currentWeather.windSpeed} m/s` : '-',
      gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    },
    {
      label: 'Realtime Summary',
      value: lastLiveSummary,
      gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    },
    {
      label: 'Last Push',
      value: liveMessage?.generatedAt
        ? new Date(liveMessage.generatedAt).toLocaleTimeString()
        : '-',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome {username ?? 'User'}
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ height: 'calc(100vh - 120px)' }}>
        <Paper sx={{ flex: 1, overflow: 'hidden', borderRadius: 3, position: 'relative' }}>
          {mapTickerVisible ? (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                zIndex: 20,
                py: 1,
                px: 0,
                borderRadius: 2,
                overflow: 'hidden',
                background:
                  'linear-gradient(90deg, rgba(107,114,128,0) 0%, rgba(107,114,128,0.9) 12%, rgba(107,114,128,0.9) 88%, rgba(107,114,128,0) 100%)',
              }}
            >
              <Box
                key={mapTickerKey}
                sx={{
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  pl: '100%',
                  pr: 2,
                  fontSize: 14,
                  animation: 'mapTickerMove 8s linear forwards',
                  '@keyframes mapTickerMove': {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                  },
                }}
              >
                {mapTickerText}
              </Box>
            </Box>
          ) : null}
          <WeatherMap latitude={mapCenter.latitude} longitude={mapCenter.longitude} />
        </Paper>

        <Paper
          sx={{
            width: { xs: '100%', lg: 380 },
            p: 2,
            borderRadius: 3,
            overflowY: 'auto',
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="City"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleCitySearch();
                }
              }}
              size="small"
              fullWidth
            />

            <Button variant="contained" onClick={() => void handleCitySearch()} disabled={loading}>
              {loading ? 'Searching...' : 'Search And Jump'}
            </Button>

            <FormControl size="small" fullWidth>
              <InputLabel id="frequency-seconds-label">Broadcast Frequency</InputLabel>
              <Select
                labelId="frequency-seconds-label"
                value={preferences.frequencySeconds}
                label="Frequency"
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    frequencySeconds: Number(e.target.value),
                  }))
                }
              >
                {FREQUENCY_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} seconds
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="upcoming-hours-label">Upcoming Hours</InputLabel>
              <Select
                labelId="upcoming-hours-label"
                value={preferences.upcomingHours}
                label="Upcoming Hours"
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    upcomingHours: Number(e.target.value),
                  }))
                }
              >
                {UPCOMING_HOURS_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value} hours
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" onClick={() => void handleRefreshWeather()} disabled={loading}>
              Refresh Weather
            </Button>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
              }}
            >
              {weatherCells.map((cell) => (
                <Paper
                  key={cell.label}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: cell.gradient,
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(248,250,252,0.82)' }}>
                    {cell.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cell.value}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Paper sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                City Chat Room
              </Typography>
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 1,
                  mb: 1,
                  backgroundColor: '#fff',
                }}
              >
                {chatMessage.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No messages yet for this city.
                  </Typography>
                ) : (
                  chatMessage.map((item, idx) => (
                    <Typography key={`${item.sender}-${idx}`} variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{item.sender}</strong>: {item.message}
                    </Typography>
                  ))
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSendChatMessage();
                    }
                  }}
                />
                <Button variant="contained" onClick={() => void handleSendChatMessage()}>
                  Send
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Paper>
      </Stack>
      <Snackbar
          open={popup.open}
          autoHideDuration={2200}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={popup.severity}
            variant="filled"
            onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
            sx={{ width: '100%' }}
          >
            {popup.message}
          </Alert>
      </Snackbar>
    </Box>
  );
}
