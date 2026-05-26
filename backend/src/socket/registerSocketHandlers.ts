import type { Server, Socket } from 'socket.io';
import { clientSubscriptions } from '../data/realtime.store';
import {
  buildWeatherMessage,
  normalizePreferences,
} from '../services/weather-message.service';
import type { PushPreferences } from '../types/realtime.types';

type JoinCityPayload = {
  city?: string;
  frequencySeconds?: number;
  upcomingHours?: number;
};

type UpdatePreferencesPayload = {
  frequencySeconds?: number;
  upcomingHours?: number;
};

const stopTimer = (socketId: string): void => {
  const state = clientSubscriptions.get(socketId);
  if (!state || !state.timer) return;
  clearInterval(state.timer);
  state.timer = null;
};

const emitCachedToSocket = (socket: Socket): void => {
  const state = clientSubscriptions.get(socket.id);
  if (!state || !state.latestMessage) return;
  socket.emit('weather-message', state.latestMessage);
};

const fetchAndEmitFresh = async (socket: Socket): Promise<void> => {
  const state = clientSubscriptions.get(socket.id);
  if (!state) return;
  try {
    const payload = await buildWeatherMessage(state.city, state.preferences);
    state.latestMessage = payload;
    socket.emit('weather-message', payload);
  } catch (error) {
    socket.emit('weather-error', {
      message: error instanceof Error ? error.message : 'Failed to fetch weather message',
    });
  }
};

const restartPushLoop = (socket: Socket): void => {
  const state = clientSubscriptions.get(socket.id);
  if (!state) return;

  stopTimer(socket.id);

  state.timer = setInterval(() => {
    emitCachedToSocket(socket);
  }, state.preferences.frequencySeconds * 1000);
};

const applyPreferences = (
  socketId: string,
  partial: Partial<PushPreferences>
): { preferences: PushPreferences; upcomingHoursChanged: boolean } | null => {
  const state = clientSubscriptions.get(socketId);
  if (!state) return null;

  const nextPreferences = normalizePreferences({
    frequencySeconds: partial.frequencySeconds ?? state.preferences.frequencySeconds,
    upcomingHours: partial.upcomingHours ?? state.preferences.upcomingHours,
  });
  const upcomingHoursChanged = nextPreferences.upcomingHours !== state.preferences.upcomingHours;
  state.preferences = nextPreferences;

  return {
    preferences: nextPreferences,
    upcomingHoursChanged,
  };
};

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', (socket) => {
    socket.on('join-city', async (payload: JoinCityPayload) => {
      const city = String(payload?.city ?? '').trim();
      if (!city) {
        socket.emit('subscription-error', { message: 'city is required' });
        return;
      }
      const existing = clientSubscriptions.get(socket.id);
      if (existing?.city) {
        stopTimer(socket.id);
        socket.leave(existing.city);
      }
      const preferences = normalizePreferences({
        frequencySeconds: payload?.frequencySeconds,
        upcomingHours: payload?.upcomingHours,
      });
      clientSubscriptions.set(socket.id, {
        city,
        preferences,
        timer: null,
        latestMessage: null,
      });
      await fetchAndEmitFresh(socket);
      restartPushLoop(socket);
      socket.join(city);
      socket.emit('subscription-updated', { city, preferences });
    });

    socket.on('update-preferences', (payload: UpdatePreferencesPayload) => {
      const next = applyPreferences(socket.id, {
        frequencySeconds: payload?.frequencySeconds,
        upcomingHours: payload?.upcomingHours,
      });

      if (!next) {
        socket.emit('subscription-error', {
          message: 'join-city before updating preferences',
        });
        return;
      }

      const state = clientSubscriptions.get(socket.id);
      if (!state) return;
      if (next.upcomingHoursChanged) {
        state.latestMessage = null;
        void fetchAndEmitFresh(socket);
      } else {
        emitCachedToSocket(socket);
      }
      restartPushLoop(socket);
      socket.emit('subscription-updated', { preferences: next.preferences });
    });

    socket.on('refresh-weather', () => {
      const state = clientSubscriptions.get(socket.id);
      if (!state) {
        socket.emit('subscription-error', {
          message: 'join-city before refreshing weather',
        });
        return;
      }
      state.latestMessage = null;
      void fetchAndEmitFresh(socket);
      restartPushLoop(socket);
    });

    socket.on('leave-city', () => {
      const state = clientSubscriptions.get(socket.id);
      if (!state) return;

      stopTimer(socket.id);
      socket.leave(state.city);
      clientSubscriptions.delete(socket.id);

      socket.emit('subscription-updated', { city: null });
    });

    socket.on('disconnect', () => {
      stopTimer(socket.id);
      clientSubscriptions.delete(socket.id);
    });
  });
};