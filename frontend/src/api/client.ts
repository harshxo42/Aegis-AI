/**
 * Aegis AI – Axios API Client
 *
 * Centralized API client with:
 * - JWT authentication
 * - Automatic access-token refresh
 * - Failed-request queue during refresh
 * - Centralized error handling
 * - All backend API service functions
 */

import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import { store } from '@/store';
import { logout, setTokens } from '@/store/authSlice';

/* ============================================================
   API CONFIGURATION
   ============================================================ */

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* ============================================================
   REQUEST TYPES
   ============================================================ */

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/* ============================================================
   TOKEN REFRESH QUEUE
   ============================================================ */

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (
  error: unknown,
  token: string | null = null
): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    } else {
      reject(new Error('Token refresh failed'));
    }
  });

  failedQueue = [];
};

/* ============================================================
   REQUEST INTERCEPTOR
   ============================================================ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   RESPONSE INTERCEPTOR
   ============================================================ */

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined;

    /*
     * If there is no request config, simply reject.
     */
    if (!originalRequest) {
      return Promise.reject(error);
    }

    /*
     * Only handle 401 Unauthorized.
     */
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /*
     * Prevent infinite retry loops.
     */
    if (originalRequest._retry) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    /*
     * If another request is already refreshing the token,
     * wait until that refresh finishes.
     */
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return api(originalRequest);
        })
        .catch((queueError) => {
          return Promise.reject(queueError);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    /*
     * No refresh token means the session cannot be recovered.
     */
    if (!refreshToken) {
      isRefreshing = false;
      store.dispatch(logout());

      return Promise.reject(error);
    }

    try {
      /*
       * Use plain axios here instead of `api` so the refresh
       * request does not trigger the same interceptor again.
       */
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000,
        }
      );

      const responseData = refreshResponse.data?.data;

      const newAccessToken = responseData?.access_token;
      const newRefreshToken =
        responseData?.refresh_token ?? refreshToken;

      /*
       * Validate refresh response.
       */
      if (!newAccessToken) {
        throw new Error(
          'Refresh endpoint did not return an access token'
        );
      }

      /*
       * Save new tokens in Redux.
       */
      store.dispatch(
        setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );

      /*
       * Release all requests waiting for the refresh.
       */
      processQueue(null, newAccessToken);

      /*
       * Retry original request with the new token.
       */
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      /*
       * Reject every request waiting in the queue.
       */
      processQueue(refreshError, null);

      /*
       * Refresh failed → session is no longer valid.
       */
      store.dispatch(logout());

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/* ============================================================
   AUTH API
   ============================================================ */

export const authAPI = {
  login: (data: {
    email: string;
    password: string;
  }) => api.post('/auth/login', data),

  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (
    data: Record<string, string>
  ) =>
    api.put('/auth/change-password', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', {
      refresh_token: refreshToken,
    }),
};

/* ============================================================
   USERS API
   ============================================================ */

export const usersAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/users', { params }),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  updateProfile: (
    data: Record<string, unknown>
  ) =>
    api.put('/users/me', data),

  getStats: () =>
    api.get('/users/stats'),

  toggleActive: (id: string) =>
    api.put(`/users/${id}/toggle-active`),
};

/* ============================================================
   PATIENTS API
   ============================================================ */

export const patientsAPI = {
  getMyProfile: () =>
    api.get('/patients/me'),

  updateMyProfile: (
    data: Record<string, unknown>
  ) =>
    api.put('/patients/me', data),

  list: (params?: Record<string, unknown>) =>
    api.get('/patients', { params }),

  getById: (id: string) =>
    api.get(`/patients/${id}`),
};

/* ============================================================
   HOSPITALS API
   ============================================================ */

export const hospitalsAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/hospitals', { params }),

  getById: (id: string) =>
    api.get(`/hospitals/${id}`),

  create: (
    data: Record<string, unknown>
  ) =>
    api.post('/hospitals', data),

  update: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(`/hospitals/${id}`, data),

  updateBeds: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(`/hospitals/${id}/beds`, data),

  delete: (id: string) =>
    api.delete(`/hospitals/${id}`),
};

/* ============================================================
   EMERGENCIES API
   ============================================================ */

export const emergenciesAPI = {
  /*
   * Create SOS / emergency request.
   *
   * POST /api/v1/emergencies/
   */
  create: (
    data: Record<string, unknown>
  ) =>
    api.post('/emergencies/', data),

  /*
   * List emergencies.
   *
   * GET /api/v1/emergencies/
   */
  list: (
    params?: Record<string, unknown>
  ) =>
    api.get('/emergencies/', { params }),

  /*
   * Get currently active emergencies.
   *
   * GET /api/v1/emergencies/active
   */
  getActive: () =>
    api.get('/emergencies/active'),

  /*
   * Get one emergency.
   *
   * GET /api/v1/emergencies/{id}
   */
  getById: (id: string) =>
    api.get(`/emergencies/${id}`),

  /*
   * Update emergency.
   *
   * PUT /api/v1/emergencies/{id}
   */
  update: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(`/emergencies/${id}`, data),

  /*
   * Update emergency status.
   *
   * NOTE:
   * Keep this only if the backend actually exposes
   * /emergencies/{id}/status.
   */
  updateStatus: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(`/emergencies/${id}/status`, data),

  /*
   * Cancel emergency.
   *
   * PUT /api/v1/emergencies/{id}/cancel
   */
  cancel: (id: string) =>
    api.put(`/emergencies/${id}/cancel`),
};

/* ============================================================
   ANALYTICS API
   ============================================================ */

export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),

  getEmergencyTrends: (days?: number) =>
    api.get('/analytics/emergency-trends', {
      params: { days },
    }),
};

/* ============================================================
   NOTIFICATIONS API
   ============================================================ */

export const notificationsAPI = {
  list: () =>
    api.get('/notifications'),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
};

/* ============================================================
   AI API
   ============================================================ */

export const aiAPI = {
  chat: (data: { message: string }) =>
    api.post('/ai/chat', data),

  predict: (data: Record<string, unknown>) =>
    api.post('/ai/predict', data),

  analyzeReport: (formData: FormData) =>
    api.post('/ai/analyze-report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

/* ============================================================
   EXPORT
   ============================================================ */

export default api;