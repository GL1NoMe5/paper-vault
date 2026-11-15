import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';

describe('Layout Components (AppLayout, Header, BottomNav)', () => {
  describe('Header Component', () => {
    it('renders the Russian app title and subtitle', () => {
      render(<Header baseCurrency="KZT" onOpenCurrencyModal={vi.fn()} />);
      expect(screen.getByText('Уютный Бюджет')).toBeInTheDocument();
      expect(screen.getByText('Дневник финансов')).toBeInTheDocument();
    });

    it('displays the active base currency flag, symbol, and code', () => {
      const { rerender } = render(<Header baseCurrency="KZT" onOpenCurrencyModal={vi.fn()} />);
      expect(screen.getByText('₸ KZT')).toBeInTheDocument();
      expect(screen.getByText('🇰🇿')).toBeInTheDocument();

      rerender(<Header baseCurrency="RUB" onOpenCurrencyModal={vi.fn()} />);
      expect(screen.getByText('₽ RUB')).toBeInTheDocument();
      expect(screen.getByText('🇷🇺')).toBeInTheDocument();

      rerender(<Header baseCurrency="USD" onOpenCurrencyModal={vi.fn()} />);
      expect(screen.getByText('$ USD')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    });

    it('triggers onOpenCurrencyModal when currency pill button is clicked', () => {
      const handleOpen = vi.fn();
      render(<Header baseCurrency="KZT" onOpenCurrencyModal={handleOpen} />);
      const btn = screen.getByTestId('header-currency-button');
      fireEvent.click(btn);
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });

    it('guarantees currency button touch target meets min height of 44px', () => {
      render(<Header baseCurrency="KZT" onOpenCurrencyModal={vi.fn()} />);
      const btn = screen.getByTestId('header-currency-button');
      expect(btn.className).toContain('min-h-[44px]');
      expect(btn.className).toContain('min-w-[44px]');
    });
  });

  describe('BottomNav Component', () => {
    it('renders all 6 tabs with Russian labels and accessible tablist semantics', () => {
      render(<BottomNav activeTab="journal" onTabChange={vi.fn()} />);
      expect(screen.getByText('Дневник')).toBeInTheDocument();
      expect(screen.getByText('Работа')).toBeInTheDocument();
      expect(screen.getByText('Семья')).toBeInTheDocument();
      expect(screen.getByText('Календарь')).toBeInTheDocument();
      expect(screen.getByText('Аналитика')).toBeInTheDocument();
      expect(screen.getByText('Мечта')).toBeInTheDocument();

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);
    });

    it('sets aria-selected="true" on active tab and "false" on inactive tabs', () => {
      render(<BottomNav activeTab="work" onTabChange={vi.fn()} />);
      expect(screen.getByTestId('tab-work')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-family')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-calendar')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-journal')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-analytics')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-goals')).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onTabChange with correct tab id when a tab is clicked', () => {
      const handleTabChange = vi.fn();
      render(<BottomNav activeTab="journal" onTabChange={handleTabChange} />);
      fireEvent.click(screen.getByTestId('tab-work'));
      expect(handleTabChange).toHaveBeenCalledWith('work');

      fireEvent.click(screen.getByTestId('tab-family'));
      expect(handleTabChange).toHaveBeenCalledWith('family');

      fireEvent.click(screen.getByTestId('tab-analytics'));
      expect(handleTabChange).toHaveBeenCalledWith('analytics');

      fireEvent.click(screen.getByTestId('tab-goals'));
      expect(handleTabChange).toHaveBeenCalledWith('goals');
    });

    it('guarantees all tab buttons satisfy min touch targets of >= 44px', () => {
      render(<BottomNav activeTab="journal" onTabChange={vi.fn()} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab.className).toContain('min-h-[48px]');
      });
    });
  });

  describe('AppLayout Component', () => {
    it('renders desktop-centered 480px frame and children content', () => {
      render(
        <AppLayout
          activeTab="journal"
          onTabChange={vi.fn()}
          baseCurrency="KZT"
          onOpenCurrencyModal={vi.fn()}
        >
          <div data-testid="test-child">Журнал расходов</div>
        </AppLayout>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      const container = screen.getByTestId('app-layout-container');
      expect(container.className).toContain('max-w-[480px]');
      expect(container.className).toContain('bg-dot-grid');
    });
  });
});
