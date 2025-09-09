import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'theme';
const VALID_THEMES = ['light', 'dark', 'system'];

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getStoredTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  return VALID_THEMES.includes(stored) ? stored : 'system';
};

const getSystemPreference = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme) => {
  return theme === 'system' ? getSystemPreference() : theme;
};

const applyThemeToDOM = (resolvedTheme) => {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getStoredTheme);

  // Apply theme and listen for system preference changes
  useEffect(() => {
    applyThemeToDOM(resolveTheme(theme));

    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyThemeToDOM(getSystemPreference());

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    localStorage.setItem(THEME_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  // Cycle: dark → light → system → dark
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const cycle = { dark: 'light', light: 'system', system: 'dark' };
      const next = cycle[prev];
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    resolvedTheme: resolveTheme(theme),
    isDark: resolveTheme(theme) === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
