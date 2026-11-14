/**
 * src/test/calendar.test.tsx
 * Comprehensive unit and integration tests for Tab 2: "Календарь" (Planner Calendar,
 * 5-day due banner, subscriptions list, and AddSubscriptionDrawer).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlannerProvider } from '../context/PlannerContext';
import { UpcomingBillsBanner } from '../components/calendar/UpcomingBillsBanner';
import { PlannerCalendar } from '../components/calendar/PlannerCalendar';
import { SubscriptionsList } from '../components/calendar/SubscriptionsList';
import { AddSubscriptionDrawer } from '../components/calendar/AddSubscriptionDrawer';
import { EditSubscriptionDrawer } from '../components/calendar/EditSubscriptionDrawer';
import { CalendarView } from '../components/calendar/CalendarView';
import { DEFAULT_RATES_RUB } from '../utils/currency';
import { RecurringBill } from '../types';

describe('Tab 2 ("Календарь") & Subscriptions Planner Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  const mockBills: RecurringBill[] = [
    {
      id: 'bill-1',
      title: 'Яндекс Плюс',
      amount: 299,
      currency: 'RUB',
      dayOfMonth: 15,
      category: 'Подписки',
      color: '#F9E29C',
      paidMonths: [],
      createdAt: '2026-11-01',
    },
    {
      id: 'bill-2',
      title: 'Домашний Интернет',
      amount: 750,
      currency: 'RUB',
      dayOfMonth: 17,
      category: 'Жилье и уют',
      color: '#A3C9A8',
      paidMonths: [],
      createdAt: '2026-11-01',
    },
    {
      id: 'bill-3',
      title: 'Литрес Подписка',
      amount: 399,
      currency: 'RUB',
      dayOfMonth: 5,
      category: 'Подписки',
      color: '#D8C2E8',
      paidMonths: ['2026-11'],
      createdAt: '2026-11-01',
    },
  ];

  describe('UpcomingBillsBanner Component', () => {
    it('renders bills due within next 5 days with correct label and triggers onPayBill', () => {
      // Mock reference date: November 14, 2026 (day 14)
      // bill-1 is on day 15 (diff 1 -> 'Завтра')
      // bill-2 is on day 17 (diff 3 -> 'Через 3 дн.')
      // bill-3 is on day 5 and already paid in 2026-11
      const refDate = new Date('2026-11-14T10:00:00Z');
      const handlePay = vi.fn();

      render(
        <UpcomingBillsBanner
          bills={mockBills}
          currentDate={refDate}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onPayBill={handlePay}
        />
      );

      expect(screen.getByTestId('upcoming-bills-banner')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-bills-count')).toHaveTextContent('2');

      expect(screen.getByText('Яндекс Плюс')).toBeInTheDocument();
      expect(screen.getByText('Завтра')).toBeInTheDocument();

      expect(screen.getByText('Домашний Интернет')).toBeInTheDocument();
      expect(screen.getByText('Через 3 дн.')).toBeInTheDocument();

      // Click "Оплачено" on bill-1
      const payBtn = screen.getByTestId('pay-bill-btn-bill-1');
      fireEvent.click(payBtn);
      expect(handlePay).toHaveBeenCalledWith('bill-1', '2026-11');
    });

    it('returns null when no bills are due in the next 5 days', () => {
      // Mock reference date: November 25, 2026
      const refDate = new Date('2026-11-25T10:00:00Z');
      const { container } = render(
        <UpcomingBillsBanner
          bills={mockBills}
          currentDate={refDate}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onPayBill={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('PlannerCalendar Component', () => {
    it('renders Russian weekday headers starting with Monday', () => {
      render(<PlannerCalendar bills={mockBills} selectedMonth="2026-11" />);
      expect(screen.getByText('Пн')).toBeInTheDocument();
      expect(screen.getByText('Вт')).toBeInTheDocument();
      expect(screen.getByText('Ср')).toBeInTheDocument();
      expect(screen.getByText('Чт')).toBeInTheDocument();
      expect(screen.getByText('Пт')).toBeInTheDocument();
      expect(screen.getByText('Сб')).toBeInTheDocument();
      expect(screen.getByText('Вс')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-month-title')).toHaveTextContent('Ноябрь 2026');
    });

    it('renders colored sticker dots for days with recurring payments and allows day peeking', () => {
      render(<PlannerCalendar bills={mockBills} selectedMonth="2026-11" />);

      // November 15, 2026 cell
      const cell15 = screen.getByTestId('calendar-cell-2026-11-15');
      expect(cell15).toBeInTheDocument();
      expect(screen.getByTestId('calendar-sticker-dot-bill-1')).toBeInTheDocument();

      // Click cell 15 to peek bill details
      fireEvent.click(cell15);
      expect(screen.getByTestId('selected-day-bills-detail')).toBeInTheDocument();
      expect(screen.getByText('Списания на 15 Ноябрь:')).toBeInTheDocument();
    });

    it('navigates to next and previous months via arrow buttons', () => {
      render(<PlannerCalendar bills={mockBills} selectedMonth="2026-11" />);
      expect(screen.getByTestId('calendar-month-title')).toHaveTextContent('Ноябрь 2026');

      fireEvent.click(screen.getByTestId('calendar-next-month'));
      expect(screen.getByTestId('calendar-month-title')).toHaveTextContent('Декабрь 2026');

      fireEvent.click(screen.getByTestId('calendar-prev-month'));
      expect(screen.getByTestId('calendar-month-title')).toHaveTextContent('Ноябрь 2026');
    });
  });

  describe('SubscriptionsList Component', () => {
    it('displays all bills with payment badges and one-tap payment trigger', () => {
      const handlePay = vi.fn();
      render(
        <SubscriptionsList
          bills={mockBills}
          currentMonthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onPayBill={handlePay}
        />
      );

      // bill-3 is paid in 2026-11
      expect(screen.getByTestId('subscription-paid-badge-bill-3')).toHaveTextContent('Оплачено');

      // bill-1 is unpaid, should show "Оплатить" button
      const payBtn = screen.getByTestId('subscription-pay-btn-bill-1');
      expect(payBtn).toHaveTextContent('Оплатить');
      fireEvent.click(payBtn);
      expect(handlePay).toHaveBeenCalledWith('bill-1', '2026-11');
    });
  });

  describe('AddSubscriptionDrawer Component', () => {
    it('validates fields and saves new subscription', () => {
      const handleAdd = vi.fn();
      const handleClose = vi.fn();

      render(
        <AddSubscriptionDrawer
          isOpen={true}
          onClose={handleClose}
          baseCurrency="RUB"
          onAddBill={handleAdd}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Submit empty should show validation errors
      fireEvent.click(screen.getByTestId('submit-add-sub-btn'));
      expect(screen.getByText('Введите название платежа')).toBeInTheDocument();
      expect(handleAdd).not.toHaveBeenCalled();

      // Enter valid fields
      fireEvent.change(screen.getByTestId('sub-title-input'), { target: { value: 'Spotify Premium' } });
      fireEvent.change(screen.getByTestId('sub-amount-input'), { target: { value: '199' } });
      fireEvent.change(screen.getByTestId('sub-day-input'), { target: { value: '20' } });

      fireEvent.click(screen.getByTestId('submit-add-sub-btn'));

      expect(handleAdd).toHaveBeenCalledWith({
        title: 'Spotify Premium',
        amount: 199,
        currency: 'RUB',
        dayOfMonth: 20,
        category: 'Подписки',
        color: expect.any(String),
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('CalendarView Full Integration', () => {
    it('renders unpaid metric, allows paying bill, updates remaining metric, and records expense', () => {
      render(
        <PlannerProvider>
          <CalendarView />
        </PlannerProvider>
      );

      // In initial demo data, 2 bills are unpaid for 2026-11:
      // sub-yandex (299 RUB) + sub-internet (750 RUB) = 1 049 RUB
      const totalMetric = screen.getByTestId('unpaid-bills-total');
      expect(totalMetric).toHaveTextContent('1 049 ₽');

      // Pay sub-yandex
      const payBtn = screen.getByTestId('subscription-pay-btn-sub-yandex');
      fireEvent.click(payBtn);

      // Remaining should now be 750 ₽
      expect(screen.getByTestId('unpaid-bills-total')).toHaveTextContent('750 ₽');
      expect(screen.getByTestId('subscription-paid-badge-sub-yandex')).toHaveTextContent('Оплачено');
    });

    it('allows editing subscription and recalculates unpaid metric in real time', () => {
      render(
        <PlannerProvider>
          <CalendarView />
        </PlannerProvider>
      );

      // Initially unpaid is 1 049 ₽ (sub-yandex 299 + sub-internet 750)
      expect(screen.getByTestId('unpaid-bills-total')).toHaveTextContent('1 049 ₽');

      // Click edit on sub-yandex
      const editBtn = screen.getByTestId('subscription-edit-btn-sub-yandex');
      expect(editBtn).toBeInTheDocument();
      fireEvent.click(editBtn);

      // Edit drawer is open
      expect(screen.getByTestId('edit-sub-drawer-container')).toBeInTheDocument();
      const amountInput = screen.getByTestId('edit-sub-amount-input');
      expect(amountInput).toHaveValue('299');

      // Change amount to 500
      fireEvent.change(amountInput, { target: { value: '500' } });

      // Save
      fireEvent.click(screen.getByTestId('edit-sub-submit-btn'));

      // Drawer closed, unpaid now 500 + 750 = 1 250 ₽
      expect(screen.queryByTestId('edit-sub-drawer-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('unpaid-bills-total')).toHaveTextContent('1 250 ₽');
    });

    it('allows deleting subscription and updates unpaid metric and list', () => {
      render(
        <PlannerProvider>
          <CalendarView />
        </PlannerProvider>
      );

      // Initially 3 subscriptions (sub-litres, sub-yandex, sub-internet)
      expect(screen.getByTestId('subscription-item-sub-internet')).toBeInTheDocument();

      // Click delete button on sub-internet
      const deleteBtn = screen.getByTestId('subscription-delete-btn-sub-internet');
      expect(deleteBtn).toBeInTheDocument();
      fireEvent.click(deleteBtn);

      // sub-internet is gone
      expect(screen.queryByTestId('subscription-item-sub-internet')).not.toBeInTheDocument();

      // Only sub-yandex is unpaid: 299 ₽
      expect(screen.getByTestId('unpaid-bills-total')).toHaveTextContent('299 ₽');
    });
  });

  describe('SubscriptionsList and EditSubscriptionDrawer Component Tests', () => {
    it('SubscriptionsList renders edit and delete buttons with >= 44px touch targets', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <SubscriptionsList
          bills={mockBills}
          currentMonthKey="2026-11"
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onPayBill={vi.fn()}
          onEditBill={handleEdit}
          onDeleteBill={handleDelete}
        />
      );

      const editBtn = screen.getByTestId('subscription-edit-btn-bill-1');
      const deleteBtn = screen.getByTestId('subscription-delete-btn-bill-1');

      expect(editBtn).toHaveClass('min-h-[44px]');
      expect(editBtn).toHaveClass('min-w-[44px]');
      expect(deleteBtn).toHaveClass('min-h-[44px]');
      expect(deleteBtn).toHaveClass('min-w-[44px]');

      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledWith(mockBills[0]);

      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith('bill-1');
    });

    it('EditSubscriptionDrawer modifies fields and submits updates', () => {
      const handleUpdate = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditSubscriptionDrawer
          isOpen={true}
          onClose={handleClose}
          bill={mockBills[0]}
          baseCurrency="RUB"
          onUpdateBill={handleUpdate}
        />
      );

      expect(screen.getByTestId('edit-sub-drawer-container')).toBeInTheDocument();

      // Change title
      fireEvent.change(screen.getByTestId('edit-sub-title-input'), { target: { value: 'Яндекс Плюс Мульти' } });
      // Change amount
      fireEvent.change(screen.getByTestId('edit-sub-amount-input'), { target: { value: '399' } });
      // Change day
      fireEvent.change(screen.getByTestId('edit-sub-day-input'), { target: { value: '25' } });

      fireEvent.click(screen.getByTestId('edit-sub-submit-btn'));

      expect(handleUpdate).toHaveBeenCalledWith('bill-1', expect.objectContaining({
        title: 'Яндекс Плюс Мульти',
        amount: 399,
        dayOfMonth: 25,
      }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('EditSubscriptionDrawer calls onDeleteBill when delete button clicked', () => {
      const handleDelete = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditSubscriptionDrawer
          isOpen={true}
          onClose={handleClose}
          bill={mockBills[0]}
          baseCurrency="RUB"
          onUpdateBill={vi.fn()}
          onDeleteBill={handleDelete}
        />
      );

      const delBtn = screen.getByTestId('edit-sub-delete-btn');
      fireEvent.click(delBtn);

      expect(handleDelete).toHaveBeenCalledWith('bill-1');
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
