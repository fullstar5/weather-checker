import { demo_user } from '../data/store';
import type { User } from '../types/auth.types';


export const findUser = (username: string, password: string): User | undefined => {
  return demo_user.find((u) => u.username === username && u.password === password);
};

export const existsUser = (username: string): boolean => {
  return demo_user.some((u) => u.username === username);
};

export const createUser = (username: string, password: string): User => {
  const newUser: User = { username, password };
  demo_user.push(newUser);
  return newUser;
};

export const createDemoToken = (username: string): string => {
  return Buffer.from(`${username}:${Date.now()}`).toString('base64');
};