/**
 * src/test/analytics.test.tsx
 * Comprehensive unit and integration tests for Tab 3: "Аналитика" (EarnedVsSpentBar,
 * CategoryDonutChart, SmartSavingsAdvisor rules, and MonthlyStoryDrawer 9:16 export).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlannerProvider } from '../context/PlannerContext';
import { EarnedVsSpentBar } from '../components/analytics/EarnedVsSpentBar';
import { CategoryDonutChart } from '../components/analytics/CategoryDonutChart';
import { SmartSavingsAdvisor } from '../components/analytics/SmartSavingsAdvisor';
import { MonthlyStoryDrawer } from '../components/analytics/MonthlyStoryDrawer';
import { AnalyticsView } from '../components/analytics/AnalyticsView';
import { DEFAULT_RATES_RUB } from '../utils/currency';
import { Transaction, RecurringBill, DreamGoal } from '../types';

describe('Tab 3 ("Аналитика") & Financial Advisor Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 100000,
      currency: 'RUB',
      category: 'Основная работа',
      date: '2026-11-05T10:00:00Z',
      createdAt: '2026-11-05',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 30000,
      currency: 'RUB',
      category: 'Еда и продукты',
      date: '2026-11-06T12:00:00Z',
      createdAt: '2026-11-06',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 18000, // 18000 / 58000 ≈ 31% > 15% (Coffee rule triggered)
      currency: 'RUB',
      category: 'Кафе и кофе',
      date: '2026-11-07T14:00:00Z',
      createdAt: '2026-11-07',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 10000,
      currency: 'RUB',
      category: 'Транспорт',
      date: '2026-11-08T09:00:00Z',
      createdAt: '2026-11-08',
    },
  ];

  const sampleBills: RecurringBill[] = [
    {
      id: 'bill-1',
      title: 'Яндекс Плюс',
      amount: 299,
      currency: 'RUB',
      dayOfMonth: 15,
      category: 'Подписки',
      paidMonths: [],
      createdAt: '2026-11-01',
    },
  ];

  const sampleGoals: DreamGoal[] = [
    {
      id: 'goal-1',
      title: 'Поездка в Прагу',
      targetAmount: 150000,
      savedAmount: 60000,
      currency: 'RUB',
      celebratedMilestones: [25],
      createdAt: '2026-11-01',
    },
  ];

  describe('EarnedVsSpentBar Component', () => {
    it('calculates totals and displays positive net balance and savings rate', () => {
      render(
        <EarnedVsSpentBar
          transactions={sampleTransactions}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );

      expect(screen.getByTestId('earned-vs-spent-card')).toBeInTheDocument();
      expect(screen.getByTestId('analytics-earned-box')).toHaveTextContent('+100 000 ₽');
      expect(screen.getByTestId('analytics-spent-box')).toHaveTextContent('-58 000 ₽');
      expect(screen.getByTestId('analytics-net-badge')).toHaveTextContent('В плюсе: +42 000 ₽');
      expect(screen.getByTestId('analytics-savings-rate')).toHaveTextContent('42% (+42 000 ₽)');
    });
  });

  describe('CategoryDonutChart Component', () => {
    it('renders category percentage breakdown in legend and center total', () => {
      render(
        <CategoryDonutChart
          transactions={sampleTransactions}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );

      expect(screen.getByTestId('category-donut-card')).toBeInTheDocument();
      expect(screen.getByTestId('donut-total-spent')).toHaveTextContent('58 000 ₽');

      // Check categories in legend
      expect(screen.getByText('Еда и продукты')).toBeInTheDocument();
      expect(screen.getByText('Кафе и кофе')).toBeInTheDocument();
      expect(screen.getByText('Транспорт')).toBeInTheDocument();
    });

    it('renders cozy empty state when there are no expenses', () => {
      render(
        <CategoryDonutChart
          transactions={[]}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );
      expect(screen.getByTestId('donut-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('Нет расходов в этом месяце')).toBeInTheDocument();
    });
  });

  describe('SmartSavingsAdvisor Component', () => {
    it('triggers coffee rule when coffee expenses exceed 15% and high savings rule when savings > 20%', () => {
      render(
        <SmartSavingsAdvisor
          transactions={sampleTransactions}
          bills={sampleBills}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );

      expect(screen.getByTestId('smart-savings-advisor')).toBeInTheDocument();
      expect(screen.getByText('☕ Кофеман')).toBeInTheDocument();
      expect(screen.getByText('✨ Отличный темп')).toBeInTheDocument();
    });

    it('triggers harmony fallback when budget has no warnings', () => {
      const balancedTxs: Transaction[] = [
        {
          id: 'tx-1',
          type: 'income',
          amount: 50000,
          currency: 'RUB',
          category: 'Основная работа',
          date: '2026-11-01',
          createdAt: '2026-11-01',
        },
        {
          id: 'tx-2',
          type: 'expense',
          amount: 45000, // 90% (triggers overspend) -> let's make it 80%: 40000
          currency: 'RUB',
          category: 'Еда и продукты',
          date: '2026-11-02',
          createdAt: '2026-11-02',
        },
      ];
      // income 50000, expense 40000 (80% <= 85%), savings 10000 (20% <= 20%), coffee 0, subs 0
      balancedTxs[1].amount = 40000;

      render(
        <SmartSavingsAdvisor
          transactions={balancedTxs}
          bills={[]}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );

      expect(screen.getByText('🌿 Гармония')).toBeInTheDocument();
    });
  });

  describe('MonthlyStoryDrawer 9:16 Export Component', () => {
    it('renders 9:16 card elements and triggers PNG export', () => {
      const handleClose = vi.fn();
      render(
        <MonthlyStoryDrawer
          isOpen={true}
          onClose={handleClose}
          transactions={sampleTransactions}
          goals={sampleGoals}
          monthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
        />
      );

      expect(screen.getByTestId('monthly-story-card')).toBeInTheDocument();
      expect(screen.getByText('Поездка в Прагу')).toBeInTheDocument();
      expect(screen.getByTestId('download-story-png-btn')).toBeInTheDocument();
    });
  });

  describe('AnalyticsView Full Integration', () => {
    it('renders all sections and opens story card drawer on click', () => {
      render(
        <PlannerProvider>
          <AnalyticsView />
        </PlannerProvider>
      );

      expect(screen.getByTestId('analytics-header-card')).toBeInTheDocument();
      expect(screen.getByTestId('earned-vs-spent-card')).toBeInTheDocument();
      expect(screen.getByTestId('category-donut-card')).toBeInTheDocument();
      expect(screen.getByTestId('smart-savings-advisor')).toBeInTheDocument();

      // Open Story Drawer
      const openDrawerBtn = screen.getByTestId('open-story-drawer-btn');
      fireEvent.click(openDrawerBtn);
      expect(screen.getByTestId('monthly-story-drawer')).toBeInTheDocument();
    });
  });
});
