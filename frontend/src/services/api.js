import axios from 'axios';

/**
 * Resolve API Base URL:
 * 1. Checks for VITE_API_URL (configured on Vercel for production).
 * 2. If not defined, defaults to relative path /api (supported by Vite proxy locally or Vercel rewrites).
 */
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let cleanUrl = envUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    return cleanUrl;
  }
  return '';
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

export default api;
