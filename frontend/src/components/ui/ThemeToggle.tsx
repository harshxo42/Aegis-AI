import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('aegis_theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
      setIsLight(true);
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsLight((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('light');
        localStorage.setItem('aegis_theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        localStorage.setItem('aegis_theme', 'dark');
      }
      return next;
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--primary-400)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
      aria-label="Toggle theme"
    >
      {isLight ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
