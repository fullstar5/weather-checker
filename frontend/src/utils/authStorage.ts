const TOKEN_KEY = 'weather_token';
const USERNAME_KEY = 'weather_username';

export const saveAuth = (token: string, username: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUsername = (): string | null => {
  return localStorage.getItem(USERNAME_KEY);
};

export const isAuthed = (): boolean => {
  return Boolean(getToken());
};
