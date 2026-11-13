/**
 * src/test/goals.test.tsx
 * Comprehensive unit and integration tests for Tab 4: "Мечта" (GoalCard,
 * DepositDrawer, quick deposits, milestone badges, and canvas-confetti celebration triggers).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlannerProvider } from '../context/PlannerContext';
import { GoalCard } from '../components/goals/GoalCard';
import { DepositDrawer } from '../components/goals/DepositDrawer';
import { GoalsView } from '../components/goals/GoalsView';
import { triggerMilestoneCelebration } from '../components/goals/CelebrationEffect';
import { DreamGoal } from '../types';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Tab 4 ("Мечта") & Goal Tracker Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleGoal: DreamGoal = {
    id: 'goal-prague',
    title: 'Поездка в Прагу на каникулы',
    targetAmount: 150000,
    savedAmount: 55000, // 36.7% progress
    currency: 'RUB',
    celebratedMilestones: [25],
    createdAt: '2026-11-01',
  };

  describe('CelebrationEffect', () => {
    it('triggers canvas-confetti with appropriate configs for milestones', () => {
      triggerMilestoneCelebration(25);
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({ particleCount: 35 })
      );

      triggerMilestoneCelebration(50);
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({ particleCount: 50 })
      );

      triggerMilestoneCelebration(75);
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({ particleCount: 70 })
      );

      triggerMilestoneCelebration(100);
      expect(confetti).toHaveBeenCalled();
    });
  });

  describe('GoalCard Component', () => {
    it('renders goal details, percentage with NumberFlow, milestone badges, and deposit button', () => {
      const handleOpenDeposit = vi.fn();
      render(
        <GoalCard
          goal={sampleGoal}
          baseCurrency="RUB"
          onOpenDeposit={handleOpenDeposit}
        />
      );

      expect(screen.getByTestId('goal-card-goal-prague')).toBeInTheDocument();
      expect(screen.getByTestId('goal-title-goal-prague')).toHaveTextContent('Поездка в Прагу на каникулы');
      expect(screen.getByTestId('goal-percentage-goal-prague')).toHaveTextContent('37%');
      expect(screen.getByTestId('goal-saved-goal-prague')).toHaveTextContent('55 000 ₽');
      expect(screen.getByTestId('goal-target-goal-prague')).toHaveTextContent('150 000 ₽');

      // Milestones: 25% should be reached (check icon), 50% not yet reached
      expect(screen.getByTestId('milestone-badge-25')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-badge-50')).toBeInTheDocument();

      // Click deposit button
      const depositBtn = screen.getByTestId('deposit-to-goal-btn-goal-prague');
      fireEvent.click(depositBtn);
      expect(handleOpenDeposit).toHaveBeenCalledWith(sampleGoal);
    });
  });

  describe('DepositDrawer Component', () => {
    it('allows depositing via quick preset chip and triggers milestone celebration', () => {
      const handleDeposit = vi.fn().mockReturnValue({
        triggeredMilestone: 50,
        triggeredMilestones: [50],
      });
      const handleClose = vi.fn();

      render(
        <DepositDrawer
          isOpen={true}
          onClose={handleClose}
          goal={sampleGoal}
          baseCurrency="RUB"
          onDeposit={handleDeposit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click +25 000 quick preset
      const presetBtn = screen.getByTestId('quick-deposit-btn-25000');
      fireEvent.click(presetBtn);

      expect(handleDeposit).toHaveBeenCalledWith('goal-prague', 25000);
      expect(confetti).toHaveBeenCalled(); // Triggered celebration for 50%
      expect(handleClose).toHaveBeenCalled();
    });

    it('allows depositing custom amount and validates input', () => {
      const handleDeposit = vi.fn().mockReturnValue({});
      render(
        <DepositDrawer
          isOpen={true}
          onClose={vi.fn()}
          goal={sampleGoal}
          baseCurrency="RUB"
          onDeposit={handleDeposit}
        />
      );

      const customInput = screen.getByTestId('custom-deposit-input');
      const submitBtn = screen.getByTestId('custom-deposit-submit-btn');

      // Submit 0 should show error
      fireEvent.change(customInput, { target: { value: '0' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText('Укажите сумму больше 0')).toBeInTheDocument();
      expect(handleDeposit).not.toHaveBeenCalled();

      // Submit valid custom amount
      fireEvent.change(customInput, { target: { value: '12 500' } });
      fireEvent.click(submitBtn);
      expect(handleDeposit).toHaveBeenCalledWith('goal-prague', 12500);
    });
  });

  describe('GoalsView Full Integration', () => {
    it('renders goal from context and deposits to goal, updating saved amount', () => {
      render(
        <PlannerProvider>
          <GoalsView />
        </PlannerProvider>
      );

      expect(screen.getByTestId('goals-header-card')).toBeInTheDocument();
      expect(screen.getByTestId('goal-card-goal-prague')).toBeInTheDocument();

      // Open Deposit Drawer
      fireEvent.click(screen.getByTestId('deposit-to-goal-btn-goal-prague'));
      expect(screen.getByTestId('deposit-goal-drawer')).toBeInTheDocument();

      // Deposit +50 000
      fireEvent.click(screen.getByTestId('quick-deposit-btn-50000'));

      // 55 000 + 50 000 = 105 000 (70% progress)
      expect(screen.getByTestId('goal-saved-goal-prague')).toHaveTextContent('105 000 ₽');
      expect(screen.getByTestId('goal-percentage-goal-prague')).toHaveTextContent('70%');
    });
  });
});
