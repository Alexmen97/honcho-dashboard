import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '../../theme/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';

describe('ThemeSwitcher Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('renders in compact variant with radiogroup accessibility semantics', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeSwitcher variant="compact" />
      </ThemeProvider>
    );

    const radiogroup = screen.getByRole('radiogroup', { name: /Selettore Tema/i });
    expect(radiogroup).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    const darkBtn = radios[0];
    const lightBtn = radios[1];
    const systemBtn = radios[2];

    expect(darkBtn).toHaveAttribute('aria-checked', 'true');
    expect(lightBtn).toHaveAttribute('aria-checked', 'false');
    expect(systemBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('renders in expanded variant with distinct layout grid', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeSwitcher variant="expanded" />
      </ThemeProvider>
    );

    const radiogroup = screen.getByRole('radiogroup', { name: /Selettore Tema Display/i });
    expect(radiogroup).toBeInTheDocument();
    expect(radiogroup.className).toContain('grid-cols-3');

    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('switches theme on button click', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeSwitcher variant="compact" />
      </ThemeProvider>
    );

    const radios = screen.getAllByRole('radio');
    const lightBtn = radios[1];

    act(() => {
      fireEvent.click(lightBtn);
    });

    expect(lightBtn).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('supports roving/arrow keyboard navigation (ArrowRight, ArrowLeft, Home, End)', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeSwitcher variant="expanded" />
      </ThemeProvider>
    );

    const radiogroup = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    // Currently dark is index 0
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');

    // ArrowRight -> index 1 (Light)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight', code: 'ArrowRight' });
    });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');

    // ArrowRight -> index 2 (System)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight', code: 'ArrowRight' });
    });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');

    // ArrowRight wraps around -> index 0 (Dark)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight', code: 'ArrowRight' });
    });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');

    // ArrowLeft wraps backwards -> index 2 (System)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'ArrowLeft', code: 'ArrowLeft' });
    });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');

    // Home -> index 0 (Dark)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'Home', code: 'Home' });
    });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');

    // End -> index 2 (System)
    act(() => {
      fireEvent.keyDown(radiogroup, { key: 'End', code: 'End' });
    });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');
  });
});
