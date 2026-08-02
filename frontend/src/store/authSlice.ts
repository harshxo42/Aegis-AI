/**
 * Aegis AI – Auth Redux Slice
 *
 * Manages authentication state, tokens, and user session.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Load persisted auth state from localStorage
const loadAuthState = (): Partial<AuthState> => {
  try {
    const stored = localStorage.getItem('aegis_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: !!parsed.accessToken,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return {};
};

const persistedState = loadAuthState();

const initialState: AuthState = {
  user: persistedState.user || null,
  accessToken: persistedState.accessToken || null,
  refreshToken: persistedState.refreshToken || null,
  isAuthenticated: persistedState.isAuthenticated || false,
  isLoading: false,
  error: null,
};

// ── Async Thunks ────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      return response.data.data;
    } catch {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      // Persist
      localStorage.setItem(
        'aegis_auth',
        JSON.stringify({
          user: state.user,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        })
      );
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('aegis_auth');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.access_token;
        state.refreshToken = action.payload.tokens.refresh_token;
        state.isAuthenticated = true;
        // Persist
        localStorage.setItem(
          'aegis_auth',
          JSON.stringify({
            user: action.payload.user,
            accessToken: action.payload.tokens.access_token,
            refreshToken: action.payload.tokens.refresh_token,
          })
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.access_token;
        state.refreshToken = action.payload.tokens.refresh_token;
        state.isAuthenticated = true;
        localStorage.setItem(
          'aegis_auth',
          JSON.stringify({
            user: action.payload.user,
            accessToken: action.payload.tokens.access_token,
            refreshToken: action.payload.tokens.refresh_token,
          })
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem('aegis_auth');
      });
  },
});

export const { setTokens, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
