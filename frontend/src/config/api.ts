// src/config/api.ts

// The only place you need to update the API URL
export const API_BASE_URL = 'https://fliply-backend.onrender.com/api';

// Simple helper to build URLs
export const getApiUrl = (endpoint: string): string => {
  // Make sure we don't double-slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};