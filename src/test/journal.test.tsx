import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { PlannerProvider, usePlanner, loadStateFromStorage, STORAGE_KEY } from '../context/PlannerContext';
import { groupTransactionsByDate, formatTransactionTime } from '../utils/date';
import { BalanceCard, getMonthlyTotals, formatMonthTitle } from '../components/journal/BalanceCard';
import { CategoryChipsGrid } from '../components/journal/CategoryChipsGrid';
import { ExpenseModal } from '../components/journal/ExpenseModal';
import { AddCategoryModal } from '../components/journal/AddCategoryModal';
import { HourlyIncomeSheet } from '../components/journal/HourlyIncomeSheet';
import { TransactionRow } from '../components/journal/TransactionRow';
import { JournalFeed } from '../components/journal/JournalFeed';
import { JournalView } from '../components/journal/JournalView';
import { EditTransactionDrawer } from '../components/journal/EditTransactionDrawer';
import { App } from '../App';
import { DEFAULT_RATES_RUB } from '../utils/currency';
import { Category, Transaction } from '../types';

describe('Tab 1 ("Дневник") & State Persistence Integration Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('PlannerContext & State Persistence', () => {
    const TestConsumer: React.FC = () => {
      const { state, addTransaction, deleteTransaction, addCategory, setBaseCurrency, resetToDemoData } = usePlanner();
      return (
        <div>
          <span data-testid="test-base-currency">{state.baseCurrency}</span>
          <span data-testid="test-tx-count">{state.transactions.length}</span>
          <span data-testid="test-bills-count">{state.recurringBills.length}</span>
          <span data-testid="test-goals-count">{state.goals.length}</span>
          <button
            data-testid="test-add-tx"
            onClick={() =>
              addTransaction({
                type: 'expense',
                amount: 500,
                currency: 'RUB',
                category: 'Еда и продукты',
                date: '2026-11-14T12:00:00Z',
              })
            }
          >
            Add Tx
          </button>
          <button data-testid="test-delete-tx" onClick={() => deleteTransaction(state.transactions[0].id)}>
            Delete Tx
          </button>
          <button
            data-testid="test-add-cat"
            onClick={() =>
              addCategory({
                name: 'Хобби',
                icon: 'Heart',
                color: '#F2C6CE',
                type: 'expense',
              })
            }
          >
            Add Cat
          </button>
          <button data-testid="test-switch-currency" onClick={() => setBaseCurrency('USD')}>
            Switch USD
          </button>
          <button data-testid="test-reset-demo" onClick={resetToDemoData}>
            Reset
          </button>
        </div>
      );
    };

    it('initializes with pre-populated Russian demo data (8 transactions, 3 subscriptions, 1 goal)', () => {
      render(
        <PlannerProvider>
          <TestConsumer />
        </PlannerProvider>
      );

      expect(screen.getByTestId('test-base-currency').textContent).toBe('RUB');
      expect(screen.getByTestId('test-tx-count').textContent).toBe('8');
      expect(screen.getByTestId('test-bills-count').textContent).toBe('3');
      expect(screen.getByTestId('test-goals-count').textContent).toBe('1');

      const stored = loadStateFromStorage(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(stored?.transactions).toHaveLength(8);
    });

    it('adds transactions, deletes transactions, and syncs to localStorage', () => {
      render(
        <PlannerProvider>
          <TestConsumer />
        </PlannerProvider>
      );

      fireEvent.click(screen.getByTestId('test-add-tx'));
      expect(screen.getByTestId('test-tx-count').textContent).toBe('9');
      let stored = loadStateFromStorage(STORAGE_KEY);
      expect(stored?.transactions).toHaveLength(9);

      fireEvent.click(screen.getByTestId('test-delete-tx'));
      expect(screen.getByTestId('test-tx-count').textContent).toBe('8');
      stored = loadStateFromStorage(STORAGE_KEY);
      expect(stored?.transactions).toHaveLength(8);
    });

    it('switches base currency and rebases rates', () => {
      render(
        <PlannerProvider>
          <TestConsumer />
        </PlannerProvider>
      );

      fireEvent.click(screen.getByTestId('test-switch-currency'));
      expect(screen.getByTestId('test-base-currency').textContent).toBe('USD');
      const stored = loadStateFromStorage(STORAGE_KEY);
      expect(stored?.baseCurrency).toBe('USD');
      expect(stored?.rates.USD).toBe(1.0);
    });

    it('resets state back to demo data', () => {
      render(
        <PlannerProvider>
          <TestConsumer />
        </PlannerProvider>
      );

      fireEvent.click(screen.getByTestId('test-delete-tx'));
      expect(screen.getByTestId('test-tx-count').textContent).toBe('7');

      fireEvent.click(screen.getByTestId('test-reset-demo'));
      expect(screen.getByTestId('test-tx-count').textContent).toBe('8');
    });
  });

  describe('Date Grouping Utility (src/utils/date.ts)', () => {
    const fixedNow = new Date('2026-11-14T12:00:00Z');

    it('groups transactions by "Сегодня", "Вчера", and Russian localized date', () => {
      const mockTxs: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          amount: 100,
          currency: 'RUB',
          category: 'Кафе и кофе',
          date: '2026-11-14T10:00:00Z',
          createdAt: '2026-11-14T10:00:00Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 200,
          currency: 'RUB',
          category: 'Транспорт',
          date: '2026-11-13T09:00:00Z',
          createdAt: '2026-11-13T09:00:00Z',
        },
        {
          id: '3',
          type: 'income',
          amount: 5000,
          currency: 'RUB',
          category: 'Фриланс',
          date: '2026-11-10T14:00:00Z',
          createdAt: '2026-11-10T14:00:00Z',
        },
      ];

      const grouped = groupTransactionsByDate(mockTxs, fixedNow);
      expect(grouped).toHaveLength(3);
      expect(grouped[0].dateLabel).toBe('Сегодня');
      expect(grouped[0].transactions).toHaveLength(1);
      expect(grouped[1].dateLabel).toBe('Вчера');
      expect(grouped[1].transactions).toHaveLength(1);
      expect(grouped[2].dateLabel).toBe('10 ноября');
      expect(grouped[2].transactions).toHaveLength(1);
    });

    it('returns empty array when transactions list is empty', () => {
      expect(groupTransactionsByDate([])).toEqual([]);
    });

    it('formats transaction time in Russian 24-hour format', () => {
      const time = formatTransactionTime('2026-11-14T14:35:00Z');
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('BalanceCard Component', () => {
    it('calculates totals correctly with foreign currency conversion', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 100000,
          currency: 'RUB',
          category: 'Основная работа',
          date: '2026-11-05T09:00:00Z',
          createdAt: '2026-11-05T09:00:00Z',
        },
        {
          id: '2',
          type: 'expense',
          amount: 20000,
          currency: 'RUB',
          category: 'Еда и продукты',
          date: '2026-11-06T10:00:00Z',
          createdAt: '2026-11-06T10:00:00Z',
        },
        // Foreign currency: 50 USD = 50 * 92.5 = 4625 RUB
        {
          id: '3',
          type: 'expense',
          amount: 50,
          currency: 'USD',
          category: 'Шопинг',
          date: '2026-11-07T12:00:00Z',
          createdAt: '2026-11-07T12:00:00Z',
        },
      ];

      const totals = getMonthlyTotals(txs, '2026-11', 'RUB', DEFAULT_RATES_RUB);
      expect(totals.totalIncome).toBe(100000);
      expect(totals.totalExpenses).toBe(24625);
      expect(totals.netBalance).toBe(75375);
      expect(totals.savingsRate).toBeCloseTo(0.7538, 3);
    });

    it('renders positive balance with green styling and "В плюсе" badge', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          type: 'income',
          amount: 50000,
          currency: 'RUB',
          category: 'Основная работа',
          date: '2026-11-01',
          createdAt: '2026-11-01',
        },
      ];

      render(<BalanceCard transactions={txs} baseCurrency="RUB" rates={DEFAULT_RATES_RUB} monthKey="2026-11" />);
      expect(screen.getByTestId('balance-card-net')).toHaveTextContent('+50 000 ₽');
      expect(screen.getByTestId('balance-card-badge')).toHaveTextContent('В плюсе');
      expect(screen.getByTestId('balance-card-savings-meter')).toBeInTheDocument();
    });

    it('renders negative balance with "Перерасход" badge', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          amount: 15000,
          currency: 'RUB',
          category: 'Шопинг',
          date: '2026-11-01',
          createdAt: '2026-11-01',
        },
      ];

      render(<BalanceCard transactions={txs} baseCurrency="RUB" rates={DEFAULT_RATES_RUB} monthKey="2026-11" />);
      expect(screen.getByTestId('balance-card-net')).toHaveTextContent('-15 000 ₽');
      expect(screen.getByTestId('balance-card-badge')).toHaveTextContent('Перерасход');
    });

    it('formats month title correctly', () => {
      expect(formatMonthTitle('2026-11')).toBe('Ноябрь 2026');
    });
  });

  describe('CategoryChipsGrid & ExpenseModal (2-Click Logger)', () => {
    const mockCategories: Category[] = [
      { id: 'cat-1', name: 'Еда и продукты', icon: 'ShoppingCart', color: '#A3C9A8', type: 'expense' },
      { id: 'cat-2', name: 'Кафе и кофе', icon: 'Coffee', color: '#F9E29C', type: 'expense' },
      { id: 'cat-3', name: 'Основная работа', icon: 'Briefcase', color: '#A3C9A8', type: 'income' },
    ];

    it('renders expense category chips with touch targets >= 44px', () => {
      const handleSelect = vi.fn();
      const handleOpenCustom = vi.fn();

      render(
        <CategoryChipsGrid
          categories={mockCategories}
          onSelectCategory={handleSelect}
          onOpenAddCustomCategory={handleOpenCustom}
        />
      );

      const foodChip = screen.getByTestId('category-chip-cat-1');
      expect(foodChip).toBeInTheDocument();
      expect(foodChip.className).toContain('min-h-[48px]');

      fireEvent.click(foodChip);
      expect(handleSelect).toHaveBeenCalledWith(mockCategories[0]);

      const addCustomChip = screen.getByTestId('add-custom-category-chip');
      fireEvent.click(addCustomChip);
      expect(handleOpenCustom).toHaveBeenCalledTimes(1);
    });

    it('opens ExpenseModal and logs expense with positive amount', () => {
      const handleSave = vi.fn();
      const handleClose = vi.fn();

      render(
        <ExpenseModal
          isOpen={true}
          onClose={handleClose}
          selectedCategory={mockCategories[1]}
          baseCurrency="RUB"
          onSaveExpense={handleSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Кафе и кофе')).toBeInTheDocument();

      const amountInput = screen.getByTestId('expense-amount-input');
      const submitBtn = screen.getByTestId('save-expense-btn');

      // Attempt submit with 0
      fireEvent.click(submitBtn);
      expect(screen.getByText('Введите сумму больше 0')).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();

      // Enter valid amount and submit
      fireEvent.change(amountInput, { target: { value: '420,50' } });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledWith({
        amount: 420.5,
        currency: 'RUB',
        category: 'Кафе и кофе',
        date: expect.any(String),
        note: undefined,
        type: 'expense',
      });
      expect(handleClose).toHaveBeenCalled();
    });

    it('allows selecting foreign currency and yesterday date', () => {
      const handleSave = vi.fn();
      render(
        <ExpenseModal
          isOpen={true}
          onClose={vi.fn()}
          selectedCategory={mockCategories[0]}
          baseCurrency="RUB"
          onSaveExpense={handleSave}
        />
      );

      fireEvent.click(screen.getByTestId('expense-currency-pill-USD'));
      fireEvent.click(screen.getByTestId('expense-date-yesterday-btn'));
      fireEvent.change(screen.getByTestId('expense-amount-input'), { target: { value: '25' } });
      fireEvent.change(screen.getByTestId('expense-note-input'), { target: { value: 'Супермаркет' } });

      fireEvent.click(screen.getByTestId('save-expense-btn'));

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          currency: 'USD',
          category: 'Еда и продукты',
          note: 'Супермаркет',
        })
      );
    });
  });

  describe('AddCategoryModal Component', () => {
    it('validates empty name and creates custom category with selected icon and color', () => {
      const handleAdd = vi.fn();
      const handleClose = vi.fn();

      render(<AddCategoryModal isOpen={true} onClose={handleClose} onAddCategory={handleAdd} />);

      const submitBtn = screen.getByTestId('create-custom-category-btn');
      fireEvent.click(submitBtn);
      expect(screen.getByText('Введите название категории')).toBeInTheDocument();
      expect(handleAdd).not.toHaveBeenCalled();

      const nameInput = screen.getByTestId('custom-category-name-input');
      fireEvent.change(nameInput, { target: { value: '  Книги и комиксы  ' } });

      const iconBtn = screen.getByTestId('custom-category-icon-BookOpen');
      fireEvent.click(iconBtn);

      const colorBtn = screen.getByTestId('custom-category-color-#D8C2E8');
      fireEvent.click(colorBtn);

      fireEvent.click(submitBtn);

      expect(handleAdd).toHaveBeenCalledWith({
        name: 'Книги и комиксы',
        icon: 'BookOpen',
        color: '#D8C2E8',
        type: 'expense',
        isCustom: true,
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('HourlyIncomeSheet Component', () => {
    it('calculates hourly income live and records transaction with metadata', () => {
      const handleSave = vi.fn();
      const handleClose = vi.fn();

      render(
        <HourlyIncomeSheet
          isOpen={true}
          onClose={handleClose}
          baseCurrency="RUB"
          onSaveIncome={handleSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('live-income-total')).toHaveTextContent('+20 000'); // 2500 * 8

      // Select preset 4 hours
      fireEvent.click(screen.getByTestId('hours-preset-4'));
      expect(screen.getByTestId('live-income-total')).toHaveTextContent('+10 000'); // 2500 * 4

      // Select source Фриланс
      fireEvent.click(screen.getByTestId('hourly-source-freelance'));

      // Submit
      fireEvent.click(screen.getByTestId('hourly-submit-btn'));

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          amount: 10000,
          currency: 'RUB',
          category: 'Фриланс',
          calculationMetadata: {
            hourlyRate: 2500,
            hoursWorked: 4,
            formula: '4 ч. × 2 500 = 10 000',
          },
        })
      );
    });

    it('validates rate and hours inputs', () => {
      const handleSave = vi.fn();
      render(
        <HourlyIncomeSheet
          isOpen={true}
          onClose={vi.fn()}
          baseCurrency="RUB"
          onSaveIncome={handleSave}
        />
      );

      fireEvent.change(screen.getByTestId('hourly-rate-input'), { target: { value: '0' } });
      fireEvent.click(screen.getByTestId('hourly-submit-btn'));

      expect(screen.getByText('Укажите ставку больше 0')).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();
    });
  });

  describe('TransactionRow & JournalFeed', () => {
    const sampleTx: Transaction = {
      id: 'tx-test-1',
      type: 'income',
      amount: 37500,
      currency: 'RUB',
      category: 'Фриланс',
      date: '2026-11-08T15:00:00Z',
      note: 'Дизайн лендинга',
      calculationMetadata: {
        hourlyRate: 2500,
        hoursWorked: 15,
        formula: '15 ч. × 2 500 = 37 500',
      },
      createdAt: '2026-11-08T15:00:00Z',
    };

    it('renders formula pill badge and triggers delete on click', () => {
      const handleDelete = vi.fn();
      render(
        <TransactionRow
          transaction={sampleTx}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onDelete={handleDelete}
        />
      );

      expect(screen.getByTestId('tx-formula-badge-tx-test-1')).toHaveTextContent('15 ч. × 2 500 = 37 500');
      expect(screen.getByTestId('tx-amount-tx-test-1')).toHaveTextContent('+37 500 ₽');
      expect(screen.getByText('Дизайн лендинга')).toBeInTheDocument();

      const deleteBtn = screen.getByTestId('tx-delete-tx-test-1');
      expect(deleteBtn.className).toContain('min-h-[44px]');
      expect(deleteBtn.className).toContain('min-w-[44px]');

      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith('tx-test-1');
    });

    it('renders dual-currency display when transaction is in foreign currency', () => {
      const foreignTx: Transaction = {
        id: 'tx-foreign',
        type: 'expense',
        amount: 20,
        currency: 'USD',
        category: 'Кафе и кофе',
        date: '2026-11-09',
        createdAt: '2026-11-09',
      };

      render(
        <TransactionRow
          transaction={foreignTx}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByTestId('tx-amount-tx-foreign')).toHaveTextContent('-20 $');
      expect(screen.getByTestId('tx-converted-tx-foreign')).toHaveTextContent('≈ 1 850 ₽');
    });

    it('renders empty state when no transactions exist in feed', () => {
      render(
        <JournalFeed
          transactions={[]}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onDeleteTransaction={vi.fn()}
        />
      );

      expect(screen.getByTestId('journal-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Дневник чист и свеж')).toBeInTheDocument();
    });
  });

  describe('Full End-to-End Journal Integration via App', () => {
    it('allows logging an expense and updates balance and feed', async () => {
      render(<App />);

      // Verify initial demo state is rendered in Tab 1
      expect(screen.getByTestId('balance-card')).toBeInTheDocument();
      expect(screen.getByTestId('category-chips-grid')).toBeInTheDocument();
      expect(screen.getByTestId('open-hourly-sheet-btn')).toBeInTheDocument();

      // Click on 'Кафе и кофе' chip
      const coffeeChip = screen.getByTestId('category-chip-cat-coffee');
      fireEvent.click(coffeeChip);

      // Modal opens
      expect(screen.getByTestId('expense-modal-container')).toBeInTheDocument();

      // Enter amount 650
      const amountInput = screen.getByTestId('expense-amount-input');
      fireEvent.change(amountInput, { target: { value: '650' } });

      // Save expense
      fireEvent.click(screen.getByTestId('save-expense-btn'));

      // Modal closed
      expect(screen.queryByTestId('expense-modal-container')).not.toBeInTheDocument();

      // Feed now contains 9 items
      expect(screen.getByText('9 записей')).toBeInTheDocument();
    });

    it('allows logging hourly income and displays formula in feed', () => {
      render(<App />);

      // Open hourly sheet
      fireEvent.click(screen.getByTestId('open-hourly-sheet-btn'));
      expect(screen.getByTestId('hourly-income-sheet-container')).toBeInTheDocument();

      // Set rate 3000 and preset 8 hours
      fireEvent.change(screen.getByTestId('hourly-rate-input'), { target: { value: '3000' } });
      fireEvent.click(screen.getByTestId('hours-preset-8'));

      // Submit
      fireEvent.click(screen.getByTestId('hourly-submit-btn'));

      // Verified submission
      expect(screen.getByText('8 ч. × 3 000 = 24 000')).toBeInTheDocument();
    });

    it('renders JournalView in isolation inside PlannerProvider', () => {
      render(
        <PlannerProvider>
          <JournalView />
        </PlannerProvider>
      );
      expect(screen.getByTestId('balance-card')).toBeInTheDocument();
      expect(screen.getByTestId('category-chips-grid')).toBeInTheDocument();
      expect(screen.getByTestId('open-hourly-sheet-btn')).toBeInTheDocument();
    });
  });

  describe('Universal Edit & Delete CRUD (Tab 1: Дневник)', () => {
    it('context updateTransaction modifies amount, category, note and syncs to storage', () => {
      let contextRef: any;
      const TestConsumer: React.FC = () => {
        contextRef = usePlanner();
        return (
          <div>
            <span data-testid="tx-amount">{contextRef.state.transactions[0].amount}</span>
            <span data-testid="tx-category">{contextRef.state.transactions[0].category}</span>
          </div>
        );
      };

      render(
        <PlannerProvider>
          <TestConsumer />
        </PlannerProvider>
      );

      const firstTxId = contextRef.state.transactions[0].id;
      act(() => {
        contextRef.updateTransaction(firstTxId, {
          amount: 1234,
          category: 'Шопинг',
          note: 'Новая кофта',
        });
      });

      expect(screen.getByTestId('tx-amount')).toHaveTextContent('1234');
      expect(screen.getByTestId('tx-category')).toHaveTextContent('Шопинг');

      const stored = loadStateFromStorage(STORAGE_KEY);
      const storedTx = stored?.transactions.find((t: Transaction) => t.id === firstTxId);
      expect(storedTx?.amount).toBe(1234);
      expect(storedTx?.category).toBe('Шопинг');
    });

    it('TransactionRow renders edit button and invokes onEdit callback', () => {
      const mockTx: Transaction = {
        id: 'tx-test-edit',
        type: 'expense',
        amount: 850,
        currency: 'RUB',
        category: 'Кафе и кофе',
        date: '2026-11-14T10:00:00Z',
        createdAt: '2026-11-14T10:00:00Z',
      };
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <TransactionRow
          transaction={mockTx}
          baseCurrency="RUB"
          rates={DEFAULT_RATES_RUB}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      );

      const editBtn = screen.getByTestId('tx-edit-tx-test-edit');
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).toHaveClass('min-h-[44px]');
      expect(editBtn).toHaveClass('min-w-[44px]');

      fireEvent.click(editBtn);
      expect(handleEdit).toHaveBeenCalledWith(mockTx);
    });

    it('EditTransactionDrawer renders prefilled data, modifies fields, and saves', () => {
      const mockTx: Transaction = {
        id: 'tx-edit-drawer',
        type: 'expense',
        amount: 450,
        currency: 'RUB',
        category: 'Еда и продукты',
        date: '2026-11-14T10:00:00Z',
        note: 'Перекус',
        createdAt: '2026-11-14T10:00:00Z',
      };
      const mockCategories: Category[] = [
        { id: 'cat-1', name: 'Еда и продукты', icon: 'ShoppingCart', color: '#A3C9A8', type: 'expense' },
        { id: 'cat-2', name: 'Шопинг', icon: 'ShoppingBag', color: '#F4A28C', type: 'expense' },
      ];
      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditTransactionDrawer
          isOpen={true}
          onClose={handleClose}
          transaction={mockTx}
          baseCurrency="RUB"
          categories={mockCategories}
          onUpdateTransaction={handleUpdate}
          onDeleteTransaction={handleDelete}
        />
      );

      expect(screen.getByTestId('edit-tx-container')).toBeInTheDocument();
      const amountInput = screen.getByTestId('edit-tx-amount-input') as HTMLInputElement;
      expect(amountInput.value).toBe('450');

      // Change amount to 990
      fireEvent.change(amountInput, { target: { value: '990' } });

      // Change category to 'Шопинг'
      fireEvent.click(screen.getByTestId('edit-tx-category-Шопинг'));

      // Submit
      fireEvent.click(screen.getByTestId('edit-tx-submit-btn'));

      expect(handleUpdate).toHaveBeenCalledWith('tx-edit-drawer', expect.objectContaining({
        amount: 990,
        category: 'Шопинг',
      }));
      expect(handleClose).toHaveBeenCalled();
    });

    it('EditTransactionDrawer triggers deletion on delete button click', () => {
      const mockTx: Transaction = {
        id: 'tx-del-drawer',
        type: 'expense',
        amount: 500,
        currency: 'RUB',
        category: 'Транспорт',
        date: '2026-11-14T10:00:00Z',
        createdAt: '2026-11-14T10:00:00Z',
      };
      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();
      const handleClose = vi.fn();

      render(
        <EditTransactionDrawer
          isOpen={true}
          onClose={handleClose}
          transaction={mockTx}
          baseCurrency="RUB"
          categories={[]}
          onUpdateTransaction={handleUpdate}
          onDeleteTransaction={handleDelete}
        />
      );

      const deleteBtn = screen.getByTestId('edit-tx-delete-btn');
      expect(deleteBtn).toBeInTheDocument();
      fireEvent.click(deleteBtn);

      expect(handleDelete).toHaveBeenCalledWith('tx-del-drawer');
      expect(handleClose).toHaveBeenCalled();
    });

    it('full Tab 1 integration: editing transaction updates row in JournalView', () => {
      render(
        <PlannerProvider>
          <JournalView />
        </PlannerProvider>
      );

      // In initial demo data, tx-4 is coffee (420 RUB)
      const editBtn = screen.getByTestId('tx-edit-tx-4');
      expect(editBtn).toBeInTheDocument();

      // Click edit
      fireEvent.click(editBtn);

      // Drawer is open
      expect(screen.getByTestId('edit-tx-container')).toBeInTheDocument();
      const amountInput = screen.getByTestId('edit-tx-amount-input');
      expect(amountInput).toHaveValue('420');

      // Update amount to 520
      fireEvent.change(amountInput, { target: { value: '520' } });

      // Save
      fireEvent.click(screen.getByTestId('edit-tx-submit-btn'));

      // Drawer closed and row displays updated amount 520
      expect(screen.queryByTestId('edit-tx-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('tx-amount-tx-4')).toHaveTextContent('-520 ₽');
    });
  });
});
