const TOKEN_KEY = 'weather_token';
const USERNAME_KEY = 'weather_username';

export const saveAuth = (token: string, username: string): void => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USERNAME_KEY, username);
};

export const clearAuth = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
};

export const getToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY);
};

export const getUsername = (): string | null => {
  return sessionStorage.getItem(USERNAME_KEY);
};

export const isAuthed = (): boolean => {
  return Boolean(getToken());
};
