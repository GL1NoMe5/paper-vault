import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { calculateWorkPayout, parseWorkInput } from '../utils/work';
import { PlannerProvider } from '../context/PlannerContext';
import { WorkView } from '../components/work/WorkView';

describe('Tab "Работа" (Job & Taxes)', () => {
  describe('calculateWorkPayout Pure Calculation', () => {
    it('calculates gross, tax, net and formula accurately with 15% tax', () => {
      // 2 500 * 8 = 20 000 gross; 15% tax = 3 000; 17 000 net
      const res = calculateWorkPayout(2500, 8, 15);
      expect(res.grossAmount).toBe(20000);
      expect(res.taxAmount).toBe(3000);
      expect(res.netAmount).toBe(17000);
      expect(res.formula).toBe('8 ч. × 2500 = 20000 | Налог 15% (3000) | На руки: 17000');
    });

    it('calculates 0% tax accurately', () => {
      const res = calculateWorkPayout(3000, 10, 0);
      expect(res.grossAmount).toBe(30000);
      expect(res.taxAmount).toBe(0);
      expect(res.netAmount).toBe(30000);
    });

    it('calculates 6% self-employed tax and 13% NDFL accurately', () => {
      const res6 = calculateWorkPayout(1000, 10, 6);
      expect(res6.grossAmount).toBe(10000);
      expect(res6.taxAmount).toBe(600);
      expect(res6.netAmount).toBe(9400);

      const res13 = calculateWorkPayout(1000, 10, 13);
      expect(res13.grossAmount).toBe(10000);
      expect(res13.taxAmount).toBe(1300);
      expect(res13.netAmount).toBe(8700);
    });

    it('handles negative, NaN, and zero gracefully', () => {
      const res = calculateWorkPayout(-500, NaN, 15);
      expect(res.grossAmount).toBe(0);
      expect(res.taxAmount).toBe(0);
      expect(res.netAmount).toBe(0);
    });

    it('parseWorkInput handles comma and spaces', () => {
      expect(parseWorkInput('2 500,50')).toBe(2500.5);
      expect(parseWorkInput('15')).toBe(15);
      expect(parseWorkInput('')).toBeNull();
    });
  });

  describe('WorkView Component Integration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('renders monthly summary card and "+ Записать смену" action button', () => {
      render(
        <PlannerProvider>
          <WorkView />
        </PlannerProvider>
      );

      expect(screen.getByText('Работа & Налоги')).toBeInTheDocument();
      expect(screen.getByTestId('work-monthly-summary-card')).toBeInTheDocument();
      expect(screen.getByTestId('open-work-drawer-btn')).toBeInTheDocument();
      expect(screen.getByText('История смен и выплат')).toBeInTheDocument();
    });

    it('opens drawer, enters rate/hours/tax, previews live calc, and records new work entry', async () => {
      render(
        <PlannerProvider>
          <WorkView />
        </PlannerProvider>
      );

      // Open drawer
      fireEvent.click(screen.getByTestId('open-work-drawer-btn'));
      expect(screen.getByTestId('work-calculator-drawer')).toBeInTheDocument();

      // Enter rate 2000, hours 5, tax 10%
      const rateInput = screen.getByTestId('work-rate-input');
      const hoursInput = screen.getByTestId('work-hours-input');
      const taxInput = screen.getByTestId('work-tax-input');

      fireEvent.change(rateInput, { target: { value: '2000' } });
      fireEvent.change(hoursInput, { target: { value: '5' } });
      fireEvent.change(taxInput, { target: { value: '10' } });

      // Check live calculation card: gross 10000, tax 1000, net 9000
      expect(screen.getByTestId('work-live-calc')).toHaveTextContent('9 000');
      expect(screen.getByTestId('work-live-calc')).toHaveTextContent('-1 000');

      // Submit form
      fireEvent.click(screen.getByTestId('work-submit-btn'));

      // Wait for drawer to close and entry to appear
      await waitFor(() => {
        expect(screen.queryByTestId('work-calculator-drawer')).not.toBeInTheDocument();
      });

      // Entry with +9 000 ₽ should be in the history feed
      expect(screen.getByText('+9 000 ₽')).toBeInTheDocument();
    });

    it('allows deleting a work entry', async () => {
      render(
        <PlannerProvider>
          <WorkView />
        </PlannerProvider>
      );

      // Open drawer and add a unique entry of 12 345 ₽
      fireEvent.click(screen.getByTestId('open-work-drawer-btn'));
      fireEvent.change(screen.getByTestId('work-rate-input'), { target: { value: '12345' } });
      fireEvent.change(screen.getByTestId('work-hours-input'), { target: { value: '1' } });
      fireEvent.change(screen.getByTestId('work-tax-input'), { target: { value: '0' } });
      fireEvent.click(screen.getByTestId('work-submit-btn'));

      await waitFor(() => {
        expect(screen.getByText('+12 345 ₽')).toBeInTheDocument();
      });

      // Find the row and click delete button
      const deleteButtons = screen.getAllByLabelText('Удалить смену');
      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      expect(screen.queryByText('+12 345 ₽')).not.toBeInTheDocument();
    });
  });
});
