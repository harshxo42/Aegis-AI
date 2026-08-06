/**
 * Aegis AI – Axios API Client
 *
 * Configured with JWT interceptors, refresh token logic,
 * and centralized error handling.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout, setTokens } from '@/store/authSlice';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT Token ───────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle Errors & Token Refresh ─────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 – Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } =
          response.data.data;

        store.dispatch(
          setTokens({
            accessToken: access_token,
            refreshToken: newRefreshToken,
          })
        );

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;


// ── API Service Functions ───────────────────────────────────────

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: Record<string, string>) =>
    api.put('/auth/change-password', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const usersAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/users/me', data),
  getStats: () => api.get('/users/stats'),
  toggleActive: (id: string) => api.put(`/users/${id}/toggle-active`),
};

export const patientsAPI = {
  getMyProfile: () => api.get('/patients/me'),
  updateMyProfile: (data: Record<string, unknown>) =>
    api.put('/patients/me', data),
  list: (params?: Record<string, unknown>) =>
    api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
};

export const hospitalsAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/hospitals', { params }),
  getById: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/hospitals', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/hospitals/${id}`, data),
  updateBeds: (id: string, data: Record<string, unknown>) =>
    api.put(`/hospitals/${id}/beds`, data),
  delete: (id: string) => api.delete(`/hospitals/${id}`),
};

export const emergenciesAPI = {
  create: (data: Record<string, unknown>) =>
    api.post('/emergencies', data),
  list: (params?: Record<string, unknown>) =>
    api.get('/emergencies', { params }),
  getActive: () => api.get('/emergencies/active'),
  getById: (id: string) => api.get(`/emergencies/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/emergencies/${id}`, data),
  updateStatus: (id: string, data: Record<string, unknown>) =>
    api.put(`/emergencies/${id}/status`, data),
  cancel: (id: string) => api.put(`/emergencies/${id}/cancel`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEmergencyTrends: (days?: number) =>
    api.get('/analytics/emergency-trends', { params: { days } }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};
