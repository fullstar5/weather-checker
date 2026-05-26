import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is missing in frontend .env');
}

export const http = axios.create({
  baseURL,
  timeout: 10000,
});
