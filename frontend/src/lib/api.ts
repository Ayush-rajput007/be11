import axios from 'axios';
import { API_V1_URL } from '../config/env.js';

export const api = axios.create({
  baseURL: API_V1_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token & Visitor ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('be11_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const visitorId = localStorage.getItem('be11_visitor_id');
    if (visitorId && config.headers) {
      config.headers['x-visitor-id'] = visitorId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
