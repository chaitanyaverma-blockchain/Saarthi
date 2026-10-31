import { createContext, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    try {
      localStorage.removeItem('saarthi_theme');
      const root = document.documentElement;
      const body = document.body;
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } catch (e) {
      console.warn('Theme initialization error:', e);
    }
  }, []);

  const value = {
    theme: 'light',
    isDark: false,
    setTheme: () => {},
    toggleTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { useTheme };
export default ThemeContext;
