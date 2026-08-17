/**
 * Aegis AI – UI Redux Slice
 *
 * Manages theme, sidebar, and layout state.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    const savedTheme = localStorage.getItem('aegis_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch {
    // localStorage not accessible
  }

  if (typeof window.matchMedia === 'function') {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  return 'dark';
};

const applyThemeToDocument = (theme: 'dark' | 'light') => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  try {
    localStorage.setItem('aegis_theme', theme);
  } catch {
    // localStorage not accessible
  }
};

const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

const initialState: UiState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  theme: initialTheme,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      applyThemeToDocument(state.theme);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(state.theme);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapse,
  setTheme,
  toggleTheme,
} = uiSlice.actions;
export default uiSlice.reducer;

