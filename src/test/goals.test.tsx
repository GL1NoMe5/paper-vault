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
import { AddGoalDrawer } from '../components/goals/AddGoalDrawer';
import { EditGoalDrawer } from '../components/goals/EditGoalDrawer';
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

    it('allows editing goal and updates title, target and saved amount in GoalsView', () => {
      render(
        <PlannerProvider>
          <GoalsView />
        </PlannerProvider>
      );

      // Click edit on goal-prague
      const editBtn = screen.getByTestId('goal-edit-btn-goal-prague');
      expect(editBtn).toBeInTheDocument();
      fireEvent.click(editBtn);

      // Drawer is open
      expect(screen.getByTestId('edit-goal-drawer-container')).toBeInTheDocument();

      // Change title
      fireEvent.change(screen.getByTestId('edit-goal-title-input'), {
        target: { value: 'Поездка в Рим' },
      });
      // Change target to 200000
      fireEvent.change(screen.getByTestId('edit-goal-target-input'), {
        target: { value: '200000' },
      });

      // Save
      fireEvent.click(screen.getByTestId('edit-goal-submit-btn'));

      // Drawer closed, card updated
      expect(screen.queryByTestId('edit-goal-drawer-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('goal-title-goal-prague')).toHaveTextContent('Поездка в Рим');
      expect(screen.getByTestId('goal-target-goal-prague')).toHaveTextContent('200 000 ₽');
    });

    it('allows deleting goal, displays empty state with create-goal-empty-btn, and creates a new goal', () => {
      render(
        <PlannerProvider>
          <GoalsView />
        </PlannerProvider>
      );

      // Initially goal-prague exists
      expect(screen.getByTestId('goal-card-goal-prague')).toBeInTheDocument();

      // Delete goal
      fireEvent.click(screen.getByTestId('goal-delete-btn-goal-prague'));

      // Now empty state is displayed
      expect(screen.queryByTestId('goal-card-goal-prague')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-goals-empty')).toBeInTheDocument();
      const createEmptyBtn = screen.getByTestId('create-goal-empty-btn');
      expect(createEmptyBtn).toBeInTheDocument();

      // Click create goal from empty state
      fireEvent.click(createEmptyBtn);
      expect(screen.getByTestId('add-goal-drawer-container')).toBeInTheDocument();

      // Fill form
      fireEvent.change(screen.getByTestId('add-goal-title-input'), {
        target: { value: 'Новый MacBook' },
      });
      fireEvent.change(screen.getByTestId('add-goal-target-input'), {
        target: { value: '180000' },
      });

      // Submit
      fireEvent.click(screen.getByTestId('add-goal-submit-btn'));

      // New goal is created and rendered, empty state is gone
      expect(screen.queryByTestId('no-goals-empty')).not.toBeInTheDocument();
      expect(screen.getByText('Новый MacBook')).toBeInTheDocument();
      expect(screen.getByText('180 000 ₽')).toBeInTheDocument();
    });

    it('allows adding goal via header open-add-goal-btn', () => {
      render(
        <PlannerProvider>
          <GoalsView />
        </PlannerProvider>
      );

      const openAddBtn = screen.getByTestId('open-add-goal-btn');
      expect(openAddBtn).toBeInTheDocument();
      fireEvent.click(openAddBtn);

      expect(screen.getByTestId('add-goal-drawer-container')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('add-goal-title-input'), {
        target: { value: 'Подушка безопасности' },
      });
      fireEvent.change(screen.getByTestId('add-goal-target-input'), {
        target: { value: '300000' },
      });

      fireEvent.click(screen.getByTestId('add-goal-submit-btn'));

      expect(screen.getByText('Подушка безопасности')).toBeInTheDocument();
    });
  });

  describe('GoalCard, AddGoalDrawer, and EditGoalDrawer Component Tests', () => {
    it('GoalCard renders edit and delete buttons with >= 44px touch targets', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <GoalCard
          goal={sampleGoal}
          baseCurrency="RUB"
          onOpenDeposit={vi.fn()}
          onEditGoal={handleEdit}
          onDeleteGoal={handleDelete}
        />
      );

      const editBtn = screen.getByTestId('goal-edit-btn-goal-prague');
      const deleteBtn = screen.getByTestId('goal-delete-btn-goal-prague');

      expect(editBtn).toHaveClass('min-h-[44px]');
      expect(editBtn).toHaveClass('min-w-[44px]');
      expect(deleteBtn).toHaveClass('min-h-[44px]');
      expect(deleteBtn).toHaveClass('min-w-[44px]');

      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledWith(sampleGoal);

      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith('goal-prague');
    });

    it('AddGoalDrawer validates inputs and calls onAddGoal', () => {
      const handleAdd = vi.fn();
      const handleClose = vi.fn();

      render(
        <AddGoalDrawer
          isOpen={true}
          onClose={handleClose}
          baseCurrency="RUB"
          onAddGoal={handleAdd}
        />
      );

      // Attempt submit empty
      fireEvent.click(screen.getByTestId('add-goal-submit-btn'));
      expect(screen.getByText('Введите название цели')).toBeInTheDocument();

      // Enter valid fields
      fireEvent.change(screen.getByTestId('add-goal-title-input'), {
        target: { value: 'Велосипед' },
      });
      fireEvent.change(screen.getByTestId('add-goal-target-input'), {
        target: { value: '45000' },
      });

      fireEvent.click(screen.getByTestId('add-goal-submit-btn'));

      expect(handleAdd).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Велосипед',
        targetAmount: 45000,
        currency: 'RUB',
      }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('EditGoalDrawer updates saved amount and recalculates celebrated milestones', () => {
      const handleUpdate = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditGoalDrawer
          isOpen={true}
          onClose={handleClose}
          goal={sampleGoal}
          baseCurrency="RUB"
          onUpdateGoal={handleUpdate}
        />
      );

      // Target is 150000. Set saved to 120000 (80% progress -> milestones [25, 50, 75])
      fireEvent.change(screen.getByTestId('edit-goal-saved-input'), {
        target: { value: '120000' },
      });

      fireEvent.click(screen.getByTestId('edit-goal-submit-btn'));

      expect(handleUpdate).toHaveBeenCalledWith('goal-prague', expect.objectContaining({
        savedAmount: 120000,
        celebratedMilestones: [25, 50, 75],
      }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('EditGoalDrawer calls onDeleteGoal on delete button click', () => {
      const handleDelete = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditGoalDrawer
          isOpen={true}
          onClose={handleClose}
          goal={sampleGoal}
          baseCurrency="RUB"
          onUpdateGoal={vi.fn()}
          onDeleteGoal={handleDelete}
        />
      );

      fireEvent.click(screen.getByTestId('edit-goal-delete-btn'));

      expect(handleDelete).toHaveBeenCalledWith('goal-prague');
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
