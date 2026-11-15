import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlannerProvider, usePlanner, THEME_STORAGE_KEY } from '../context/PlannerContext';
import { Header } from '../components/layout/Header';

const ThemeConsumer: React.FC = () => {
  const { theme, toggleTheme } = usePlanner();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('Theme Mode ("Уютная ночная бумага")', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light theme when localStorage is empty', () => {
    render(
      <PlannerProvider>
        <ThemeConsumer />
      </PlannerProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('loads dark theme if stored in localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(
      <PlannerProvider>
        <ThemeConsumer />
      </PlannerProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles theme between light and dark, updating DOM class and localStorage', () => {
    render(
      <PlannerProvider>
        <ThemeConsumer />
      </PlannerProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to dark
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Toggle back to light
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('updates meta theme-color tag dynamically on toggle', () => {
    render(
      <PlannerProvider>
        <ThemeConsumer />
      </PlannerProvider>
    );

    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta).not.toBeNull();
    expect(meta.content).toBe('#FAF6F0');

    fireEvent.click(screen.getByTestId('toggle-btn'));
    meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta.content).toBe('#1C1917');

    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(meta.content).toBe('#FAF6F0');
  });

  it('Header renders theme toggle button with touch target >= 44px and switches theme', () => {
    render(
      <PlannerProvider>
        <Header baseCurrency="RUB" onOpenCurrencyModal={vi.fn()} />
      </PlannerProvider>
    );

    const headerThemeBtn = screen.getByTestId('theme-toggle-btn');
    expect(headerThemeBtn).toBeInTheDocument();
    expect(headerThemeBtn.className).toContain('min-h-[44px]');
    expect(headerThemeBtn.className).toContain('min-w-[44px]');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(headerThemeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(headerThemeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
