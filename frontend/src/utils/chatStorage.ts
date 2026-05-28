import type { ChatMessagePayload } from '../types/realtime';

const keyOf = (username: string, city: string): string =>
  `chat_messages:${username}:${city}`;

export const loadUserCityChat = (
  username: string,
  city: string
): ChatMessagePayload[] => {
  try {
    const raw = sessionStorage.getItem(keyOf(username, city));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveUserCityChat = (
  username: string,
  city: string,
  messages: ChatMessagePayload[]
): void => {
  sessionStorage.setItem(keyOf(username, city), JSON.stringify(messages));
};


