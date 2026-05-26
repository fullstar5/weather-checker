import { http } from './http';
import type { LoginResponse, RegisterResponse } from '../types/auth';

export const loginApi = async (payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> => {
  const res = await http.post<LoginResponse>('/api/auth/login', payload);
  return res.data;
};

export const registerApi = async (payload: {
  username: string;
  password: string;
}): Promise<RegisterResponse> => {
  const res = await http.post<RegisterResponse>('/api/auth/register', payload);
  return res.data;
};
