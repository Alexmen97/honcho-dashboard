import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

export const THEME_STORAGE_KEY = 'honcho-theme';

/**
 * Safely reads the persisted theme preference from localStorage.
 * Defaults to 'system' on empty, invalid, or throwing storage access.
 */
export function getStoredTheme(): ThemePreference {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'system';
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
    return 'system';
  } catch {
    // Storage access exception (e.g. disabled cookies, SecurityError, quota)
    return 'system';
  }
}

/**
 * Safely writes the theme preference to localStorage.
 * Silently catches exceptions if storage is restricted or throws.
 */
export function setStoredTheme(theme: ThemePreference): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Fail safe: storage disabled or restricted in sandboxed environments
  }
}

/**
 * Detects the OS color scheme preference via media query.
 * Falls back to 'dark' if matchMedia is unavailable.
 */
export function getSystemTheme(): ResolvedTheme {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  } catch {
    // Fallback
  }
  return 'dark';
}

/**
 * Updates DOM documentElement classes and native color-scheme style property.
 */
export function applyThemeToDOM(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemePreference;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    return initialTheme || getStoredTheme();
  });

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const pref = initialTheme || getStoredTheme();
    if (pref === 'system') {
      return getSystemTheme();
    }
    return pref;
  });

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);

    const nextResolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(nextResolved);
    applyThemeToDOM(nextResolved);
  }, []);

  // Synchronize DOM on mount and preference changes
  useEffect(() => {
    const currentResolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(currentResolved);
    applyThemeToDOM(currentResolved);

    // Only attach OS listener when in 'system' mode
    if (theme !== 'system') {
      return;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }

    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themeRef.current !== 'system') return;
      const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(nextResolved);
      applyThemeToDOM(nextResolved);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (typeof (mediaQuery as any).addListener === 'function') {
      (mediaQuery as any).addListener(handleMediaChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (typeof (mediaQuery as any).removeListener === 'function') {
        (mediaQuery as any).removeListener(handleMediaChange);
      }
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
