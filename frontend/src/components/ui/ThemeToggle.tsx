import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleTheme } from '@/store/uiSlice';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--primary-400)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isLight ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}

