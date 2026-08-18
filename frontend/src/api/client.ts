/**
 * Aegis AI – Centralized Axios API Client
 *
 * Features:
 * - Centralized API configuration
 * - JWT authentication
 * - Automatic access-token refresh
 * - Failed-request queue
 * - Centralized 401 handling
 * - Consistent API services
 * - Safe request retry
 */

import axios, {
  AxiosError,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { store } from '@/store';
import {
  logout,
  setTokens,
} from '@/store/authSlice';

/* ============================================================
   CONFIGURATION
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL?.trim();

const API_BASE_URL = API_URL
  ? `${API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

if (import.meta.env.DEV && !API_URL) {
  console.warn(
    '[Aegis AI] VITE_API_URL is not configured. Falling back to /api/v1.'
  );
}

/* ============================================================
   AXIOS INSTANCE
   ============================================================ */

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/* ============================================================
   TYPES
   ============================================================ */

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

/* ============================================================
   REFRESH STATE
   ============================================================ */

let isRefreshing = false;

let failedQueue: QueueItem[] = [];

/* ============================================================
   PROCESS FAILED REQUEST QUEUE
   ============================================================ */

function processQueue(
  error: unknown,
  token: string | null
): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    } else {
      reject(
        new Error(
          'Authentication refresh failed.'
        )
      );
    }
  });

  failedQueue = [];
}

/* ============================================================
   REQUEST INTERCEPTOR
   ============================================================ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
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
      error.config as
        | RetryableRequestConfig
        | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    /*
     * Only handle 401 errors.
     */
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /*
     * Never refresh authentication endpoints.
     */
    const requestUrl =
      originalRequest.url ?? '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (isAuthEndpoint) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    /*
     * Prevent infinite retry loop.
     */
    if (originalRequest._retry) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    /*
     * If another request is already refreshing,
     * wait for the new access token.
     */
    if (isRefreshing) {
      return new Promise<string>(
        (resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        }
      ).then((newAccessToken) => {
        if (!originalRequest.headers) {
          originalRequest.headers = {} as AxiosRequestHeaders;
        }
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      });
    }

    /*
     * This request owns the refresh operation.
     */
    originalRequest._retry = true;
    isRefreshing = true;

    const state = store.getState();

    const refreshToken =
      state.auth.refreshToken;

    /*
     * No refresh token available.
     */
    if (!refreshToken) {
      const refreshError = new Error(
        'No refresh token available.'
      );

      isRefreshing = false;

      processQueue(
        refreshError,
        null
      );

      store.dispatch(logout());

      return Promise.reject(refreshError);
    }

    try {
      /*
       * IMPORTANT:
       * Use standalone axios here.
       *
       * Do NOT use `api.post()`
       * because that could trigger another
       * authentication refresh loop.
       */
      const refreshResponse =
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            timeout: 30000,
          }
        );

      /*
       * Support both:
       *
       * {
       *   data: {
       *     access_token,
       *     refresh_token
       *   }
       * }
       *
       * and:
       *
       * {
       *   access_token,
       *   refresh_token
       * }
       */
      const responseBody =
        refreshResponse.data;

      const responseData =
        responseBody?.data ??
        responseBody;

      const newAccessToken =
        responseData?.access_token;

      const newRefreshToken =
        responseData?.refresh_token ??
        refreshToken;

      if (!newAccessToken) {
        throw new Error(
          'Refresh endpoint did not return access_token.'
        );
      }

      /*
       * Save tokens.
       */
      store.dispatch(
        setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );

      /*
       * Resolve all queued requests.
       */
      processQueue(
        null,
        newAccessToken
      );

      /*
       * Retry original request.
       */
      if (!originalRequest.headers) {
        originalRequest.headers = {} as AxiosRequestHeaders;
      }
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      /*
       * Refresh failed.
       */
      processQueue(
        refreshError,
        null
      );

      store.dispatch(logout());

      return Promise.reject(
        refreshError
      );
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
  }) =>
    api.post(
      '/auth/login',
      data
    ),

  register: (
    data: Record<string, unknown>
  ) =>
    api.post(
      '/auth/register',
      data
    ),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (
    data: Record<string, string>
  ) =>
    api.put(
      '/auth/change-password',
      data
    ),

  refresh: (
    refreshToken: string
  ) =>
    api.post(
      '/auth/refresh',
      {
        refresh_token: refreshToken,
      }
    ),

  logout: () =>
    api.post('/auth/logout'),
};


/* ============================================================
   USERS API
   ============================================================ */

export const usersAPI = {
  list: (
    params?: Record<string, unknown>
  ) =>
    api.get(
      '/users',
      {
        params,
      }
    ),

  getById: (
    id: string
  ) =>
    api.get(
      `/users/${id}`
    ),

  updateProfile: (
    data: Record<string, unknown>
  ) =>
    api.put(
      '/users/me',
      data
    ),

  getStats: () =>
    api.get(
      '/users/stats'
    ),

  toggleActive: (
    id: string
  ) =>
    api.put(
      `/users/${id}/toggle-active`
    ),
};

/* ============================================================
   PATIENTS API
   ============================================================ */

export const patientsAPI = {
  getMyProfile: () =>
    api.get(
      '/patients/me'
    ),

  updateMyProfile: (
    data: Record<string, unknown>
  ) =>
    api.put(
      '/patients/me',
      data
    ),

  list: (
    params?: Record<string, unknown>
  ) =>
    api.get(
      '/patients',
      {
        params,
      }
    ),

  getById: (
    id: string
  ) =>
    api.get(
      `/patients/${id}`
    ),
};

/* ============================================================
   HOSPITALS API
   ============================================================ */

export const hospitalsAPI = {
  list: (
    params?: Record<string, unknown>
  ) =>
    api.get(
      '/hospitals',
      {
        params,
      }
    ),

  getById: (
    id: string
  ) =>
    api.get(
      `/hospitals/${id}`
    ),

  create: (
    data: Record<string, unknown>
  ) =>
    api.post(
      '/hospitals',
      data
    ),

  update: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(
      `/hospitals/${id}`,
      data
    ),

  updateBeds: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(
      `/hospitals/${id}/beds`,
      data
    ),

  delete: (
    id: string
  ) =>
    api.delete(
      `/hospitals/${id}`
    ),
};

/* ============================================================
   EMERGENCIES API
   ============================================================ */

export const emergenciesAPI = {
  /*
   * Create emergency / SOS
   * POST /api/v1/emergencies
   */
  create: (
    data: Record<string, unknown>
  ) =>
    api.post(
      '/emergencies',
      data
    ),

  /*
   * List emergencies
   * GET /api/v1/emergencies
   */
  list: (
    params?: Record<string, unknown>
  ) =>
    api.get(
      '/emergencies',
      {
        params,
      }
    ),

  /*
   * Active emergencies
   * GET /api/v1/emergencies/active
   */
  getActive: () =>
    api.get(
      '/emergencies/active'
    ),

  /*
   * Single emergency
   * GET /api/v1/emergencies/:id
   */
  getById: (
    id: string
  ) =>
    api.get(
      `/emergencies/${id}`
    ),

  /*
   * Update emergency
   * PUT /api/v1/emergencies/:id
   */
  update: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(
      `/emergencies/${id}`,
      data
    ),

  /*
   * Update emergency status
   */
  updateStatus: (
    id: string,
    data: Record<string, unknown>
  ) =>
    api.put(
      `/emergencies/${id}/status`,
      data
    ),

  /*
   * Cancel emergency
   */
  cancel: (
    id: string
  ) =>
    api.put(
      `/emergencies/${id}/cancel`
    ),
};

/* ============================================================
   ANALYTICS API
   ============================================================ */

export const analyticsAPI = {
  getDashboard: () =>
    api.get(
      '/analytics/dashboard'
    ),

  getEmergencyTrends: (
    days = 7
  ) =>
    api.get(
      '/analytics/emergency-trends',
      {
        params: {
          days,
        },
      }
    ),
};

/* ============================================================
   NOTIFICATIONS API
   ============================================================ */

export const notificationsAPI = {
  list: () =>
    api.get(
      '/notifications'
    ),

  markRead: (
    id: string
  ) =>
    api.put(
      `/notifications/${id}/read`
    ),
};

/* ============================================================
   AI API
   ============================================================ */

export const aiAPI = {
  chat: (
    data: {
      message: string;
    }
  ) =>
    api.post(
      '/ai/chat',
      data
    ),

  predict: (
    data: Record<string, unknown>
  ) =>
    api.post(
      '/ai/predict',
      data
    ),

  analyzeReport: (
    formData: FormData
  ) =>
    api.post(
      '/ai/analyze-report',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    ),
};

/* ============================================================
   GENERIC API ERROR HELPER
   ============================================================ */

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (
      typeof data?.message ===
      'string'
    ) {
      return data.message;
    }

    if (
      typeof data?.detail ===
      'string'
    ) {
      return data.detail;
    }

    if (
      typeof data?.error ===
      'string'
    ) {
      return data.error;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

/* ============================================================
   EXPORT
   ============================================================ */

export default api;