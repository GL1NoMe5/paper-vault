import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getMonthlyFamilyTotals } from '../utils/family';
import { convertCurrency, rebaseRates, DEFAULT_RATES_RUB } from '../utils/currency';
import { PlannerProvider } from '../context/PlannerContext';
import { FamilyView } from '../components/family/FamilyView';
import { Transaction } from '../types';

describe('Tab "Семья" (Parental Transfers & Currency Conversion)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'fam-1',
      type: 'income',
      amount: 300000,
      currency: 'KZT',
      category: 'Помощь родителей',
      date: '2026-11-02T10:00:00Z',
      note: 'Мама отправила 300 000 тенге',
      familyDetails: {
        sender: '❤️ Мама',
        originalAmount: 300000,
        originalCurrency: 'KZT',
      },
      createdAt: '2026-11-02T10:00:00Z',
    },
    {
      id: 'fam-2',
      type: 'income',
      amount: 25000,
      currency: 'RUB',
      category: 'Помощь родителей',
      date: '2026-11-10T12:00:00Z',
      note: 'Папа помог на аренду',
      familyDetails: {
        sender: '👨 Папа',
        originalAmount: 25000,
        originalCurrency: 'RUB',
      },
      createdAt: '2026-11-10T12:00:00Z',
    },
  ];

  describe('getMonthlyFamilyTotals & Currency Conversion', () => {
    it('accurately converts 300 000 KZT to CZK per prompt requirement', () => {
      // Rebase rates to CZK
      const czkRates = rebaseRates(DEFAULT_RATES_RUB, 'CZK');
      const inCzk = convertCurrency(300000, 'KZT', 'CZK', czkRates);
      // 300000 * (0.188 / 3.95) ≈ 14278.48 Kč
      expect(inCzk).toBeGreaterThan(14000);
      expect(inCzk).toBeLessThan(15000);
    });

    it('aggregates monthly family transfers converted into base currency', () => {
      const totals = getMonthlyFamilyTotals(sampleTransactions, '2026-11', 'RUB', DEFAULT_RATES_RUB);
      expect(totals.count).toBe(2);
      // 300 000 KZT * 0.188 = 56 400 RUB; + 25 000 RUB = 81 400 RUB
      expect(totals.totalReceivedBase).toBe(81400);
      expect(totals.sendersMap['❤️ Мама']).toBe(56400);
      expect(totals.sendersMap['👨 Папа']).toBe(25000);
    });
  });

  describe('FamilyView Component Integration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('renders monthly summary card and "+ Перевод от родителей" button', () => {
      render(
        <PlannerProvider>
          <FamilyView />
        </PlannerProvider>
      );

      expect(screen.getByText('Семья & Родители')).toBeInTheDocument();
      expect(screen.getByTestId('family-monthly-card')).toBeInTheDocument();
      expect(screen.getByTestId('open-family-drawer-btn')).toBeInTheDocument();
      expect(screen.getByText('История переводов')).toBeInTheDocument();
    });

    it('opens drawer, selects sender "❤️ Мама", enters 300 000 KZT, sees live conversion, and records transfer', async () => {
      render(
        <PlannerProvider>
          <FamilyView />
        </PlannerProvider>
      );

      // Open drawer
      fireEvent.click(screen.getByTestId('open-family-drawer-btn'));
      expect(screen.getByTestId('add-family-drawer')).toBeInTheDocument();

      // Select sender
      const mamaBtn = screen.getByTestId('family-sender-❤️ Мама');
      fireEvent.click(mamaBtn);

      // Select KZT currency
      const kztBtn = screen.getByTestId('family-currency-KZT');
      fireEvent.click(kztBtn);

      // Enter amount 300000
      const amountInput = screen.getByTestId('family-amount-input');
      fireEvent.change(amountInput, { target: { value: '300000' } });

      // Live conversion card should display original amount and approximate conversion
      const liveCard = screen.getByTestId('family-live-conversion');
      expect(liveCard).toHaveTextContent('300 000 ₸');
      expect(liveCard).toHaveTextContent('≈');

      // Submit
      fireEvent.click(screen.getByTestId('family-submit-btn'));

      // Wait for drawer to close
      await waitFor(() => {
        expect(screen.queryByTestId('add-family-drawer')).not.toBeInTheDocument();
      });

      // Verify transfer in history feed with dual currency display
      expect(screen.getByText('+300 000 ₸')).toBeInTheDocument();
      expect(screen.getByText('❤️ Мама')).toBeInTheDocument();
    });

    it('allows deleting a family transfer', async () => {
      render(
        <PlannerProvider>
          <FamilyView />
        </PlannerProvider>
      );

      // Add a transfer of 88 888 RUB
      fireEvent.click(screen.getByTestId('open-family-drawer-btn'));
      fireEvent.click(screen.getByTestId('family-currency-RUB'));
      fireEvent.change(screen.getByTestId('family-amount-input'), { target: { value: '88888' } });
      fireEvent.click(screen.getByTestId('family-submit-btn'));

      await waitFor(() => {
        expect(screen.getAllByText('+88 888 ₽').length).toBeGreaterThan(0);
      });

      // Click delete button
      const deleteButtons = screen.getAllByLabelText('Удалить перевод');
      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      expect(screen.queryByLabelText('Удалить перевод')).not.toBeInTheDocument();
    });
  });
});
