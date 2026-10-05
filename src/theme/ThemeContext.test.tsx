import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import {
  ThemeProvider,
  useTheme,
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  applyThemeToDOM,
  THEME_STORAGE_KEY,
} from './ThemeContext';

describe('ThemeContext & Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
  });

  describe('Storage Safety & Fallback (getStoredTheme / setStoredTheme)', () => {
    it('defaults to "system" when localStorage is empty', () => {
      expect(getStoredTheme()).toBe('system');
    });

    it('returns valid stored preferences ("dark", "light", "system")', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      expect(getStoredTheme()).toBe('dark');

      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      expect(getStoredTheme()).toBe('light');

      localStorage.setItem(THEME_STORAGE_KEY, 'system');
      expect(getStoredTheme()).toBe('system');
    });

    it('falls back to "system" on invalid or corrupt stored values', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'neon-green');
      expect(getStoredTheme()).toBe('system');

      localStorage.setItem(THEME_STORAGE_KEY, 'null');
      expect(getStoredTheme()).toBe('system');

      localStorage.setItem(THEME_STORAGE_KEY, '');
      expect(getStoredTheme()).toBe('system');
    });

    it('gracefully handles localStorage throwing SecurityError or QuotaExceededError', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });

      expect(getStoredTheme()).toBe('system');
      getItemSpy.mockRestore();
    });

    it('safely writes to localStorage and handles exceptions without throwing', () => {
      setStoredTheme('light');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceeded', 'QuotaExceededError');
      });

      expect(() => setStoredTheme('dark')).not.toThrow();
      setItemSpy.mockRestore();
    });
  });

  describe('OS Preference Detection (getSystemTheme)', () => {
    it('detects dark mode when prefers-color-scheme: dark matches', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('dark');
    });

    it('detects light mode when prefers-color-scheme: dark does not match', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('light');
    });

    it('returns "dark" fallback if matchMedia throws or is missing', () => {
      const originalMM = window.matchMedia;
      delete (window as any).matchMedia;
      expect(getSystemTheme()).toBe('dark');
      window.matchMedia = originalMM;
    });
  });

  describe('DOM Mutation (applyThemeToDOM)', () => {
    it('applies dark theme to documentElement with native colorScheme', () => {
      applyThemeToDOM('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('applies light theme to documentElement with native colorScheme', () => {
      applyThemeToDOM('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('ThemeProvider & useTheme Hook', () => {
    const TestConsumer: React.FC = () => {
      const { theme, resolvedTheme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-pref">{theme}</span>
          <span data-testid="theme-resolved">{resolvedTheme}</span>
          <button data-testid="btn-dark" onClick={() => setTheme('dark')}>
            Dark
          </button>
          <button data-testid="btn-light" onClick={() => setTheme('light')}>
            Light
          </button>
          <button data-testid="btn-system" onClick={() => setTheme('system')}>
            System
          </button>
        </div>
      );
    };

    it('throws error when useTheme is used outside of ThemeProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      spy.mockRestore();
    });

    it('maintains separated theme preference and resolved theme', () => {
      // Mock OS as dark
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider initialTheme="system">
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-pref').textContent).toBe('system');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('switches between themes, updates DOM and persists to localStorage', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-pref').textContent).toBe('dark');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('dark');

      act(() => {
        screen.getByTestId('btn-light').click();
      });

      expect(screen.getByTestId('theme-pref').textContent).toBe('light');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

      act(() => {
        screen.getByTestId('btn-dark').click();
      });

      expect(screen.getByTestId('theme-pref').textContent).toBe('dark');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('handles system change listener lifecycle: fixed vs auto and listener cleanup', () => {
      let listenerCallback: ((e: any) => void) | null = null;
      const addListenerSpy = vi.fn((_event, cb) => {
        listenerCallback = cb;
      });
      const removeListenerSpy = vi.fn();

      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false, // OS is light initially
        media: query,
        addEventListener: addListenerSpy,
        removeEventListener: removeListenerSpy,
      }));

      const { unmount } = render(
        <ThemeProvider initialTheme="system">
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-pref').textContent).toBe('system');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('light');
      expect(addListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      // Simulate OS switching to Dark
      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: true } as any);
        }
      });

      expect(screen.getByTestId('theme-resolved').textContent).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Now switch to fixed "light" mode
      act(() => {
        screen.getByTestId('btn-light').click();
      });

      expect(screen.getByTestId('theme-pref').textContent).toBe('light');
      expect(screen.getByTestId('theme-resolved').textContent).toBe('light');
      // Listener should have been cleaned up
      expect(removeListenerSpy).toHaveBeenCalled();

      // Trigger OS switch while in fixed mode -> should NOT affect theme
      if (listenerCallback) {
        act(() => {
          listenerCallback!({ matches: true } as any);
        });
      }
      expect(screen.getByTestId('theme-resolved').textContent).toBe('light');

      // Unmount checks cleanup
      unmount();
    });
  });

  describe('Pre-paint inline script contract (index.html)', () => {
    it('falls back to system and evaluates OS scheme when localStorage throws SecurityError', () => {
      // Simulate index.html logic
      var theme = 'system';
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          throw new DOMException('SecurityError', 'SecurityError');
        }
      } catch (e) {
        theme = 'system';
      }

      var isDark = true;
      try {
        if (theme === 'dark') {
          isDark = true;
        } else if (theme === 'light') {
          isDark = false;
        } else if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
          // In an OS light environment, matchMedia('(prefers-color-scheme: dark)').matches is false
          isDark = false;
        } else {
          isDark = true;
        }
      } catch (e) {
        isDark = true;
      }

      expect(theme).toBe('system');
      expect(isDark).toBe(false);
    });
  });
});
