/**
 * State Persistence & Context Engine
 * Feature 7: Personal Finance & Cozy Planner ("Уютный Бюджет / Дневник Финансов")
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Category,
  CurrencyCode,
  DreamGoal,
  ExchangeRates,
  FinanceContextType,
  FinanceState,
  RecurringBill,
  Transaction,
} from '../types';
import { rebaseRates, roundTo } from '../utils/currency';
import { createInitialState } from './initialData';

export const STORAGE_KEY = 'money_tracker_finance_state_v1';

/**
 * Safely loads state from localStorage with validation.
 * Falls back gracefully to null on parsing error, corruption, or restricted environments.
 */
export function loadStateFromStorage(key: string = STORAGE_KEY): FinanceState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.transactions) &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.recurringBills) &&
      Array.isArray(parsed.goals) &&
      typeof parsed.baseCurrency === 'string' &&
      typeof parsed.rates === 'object'
    ) {
      return parsed as FinanceState;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
    return null;
  }
}

/**
 * Safely saves state to localStorage with quota protection.
 */
export function saveStateToStorage(state: FinanceState, key: string = STORAGE_KEY): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state to localStorage:', err);
  }
}

/**
 * Pure helper for goal deposits and milestone threshold detection (25%, 50%, 75%, 100%).
 */
export function depositToGoalCalculation(
  goal: DreamGoal,
  amount: number
): { updatedGoal: DreamGoal; triggeredMilestones: number[] } {
  if (!Number.isFinite(amount) || isNaN(amount) || amount <= 0) {
    return {
      updatedGoal: { ...goal },
      triggeredMilestones: [],
    };
  }

  const oldSaved = goal.savedAmount;
  const newSaved = roundTo(oldSaved + amount, 2);
  const target = goal.targetAmount <= 0 ? 1 : goal.targetAmount;

  const oldPercent = (oldSaved / target) * 100;
  const newPercent = (newSaved / target) * 100;

  const milestones = [25, 50, 75, 100];
  const celebrated = [...(goal.celebratedMilestones || [])];
  const triggered: number[] = [];

  for (const m of milestones) {
    if (oldPercent < m && newPercent >= m && !celebrated.includes(m)) {
      triggered.push(m);
      celebrated.push(m);
    }
  }

  return {
    updatedGoal: {
      ...goal,
      savedAmount: newSaved,
      celebratedMilestones: celebrated,
    },
    triggeredMilestones: triggered,
  };
}

/**
 * Extended Context Type with both single milestone and full milestone array support
 */
export interface ExtendedFinanceContextType extends FinanceContextType {
  depositToGoal: (
    goalId: string,
    amount: number
  ) => { triggeredMilestone?: number; triggeredMilestones: number[] };
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  addCategory: (cat: Omit<Category, 'id'>) => Category;
  addRecurringBill: (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => RecurringBill;
  markBillPaid: (billId: string, month: string) => Transaction | null;
}

/**
 * Context Definition
 */
export const PlannerContext = createContext<ExtendedFinanceContextType | undefined>(undefined);
export const FinanceContext = PlannerContext;

export interface PlannerProviderProps {
  children: React.ReactNode;
  initialValue?: FinanceState;
  storageKey?: string;
}

export const PlannerProvider: React.FC<PlannerProviderProps> = ({
  children,
  initialValue,
  storageKey = STORAGE_KEY,
}) => {
  // Initialize state from prop, localStorage, or fallback to fresh initialDemoState
  const [state, setState] = useState<FinanceState>(() => {
    if (initialValue) {
      return JSON.parse(JSON.stringify(initialValue));
    }
    const stored = loadStateFromStorage(storageKey);
    if (stored) {
      return stored;
    }
    const fresh = createInitialState();
    saveStateToStorage(fresh, storageKey);
    return fresh;
  });

  // Synchronous state ref guarantees non-stale reads for chained dispatches
  const stateRef = useRef<FinanceState>(state);
  stateRef.current = state;

  // Sync to storage on state changes
  useEffect(() => {
    saveStateToStorage(state, storageKey);
  }, [state, storageKey]);

  // 1. setBaseCurrency
  const setBaseCurrency = useCallback(
    (code: CurrencyCode) => {
      const current = stateRef.current;
      if (code === current.baseCurrency) return;

      const newRates = rebaseRates(current.rates, code);
      const nextState: FinanceState = {
        ...current,
        baseCurrency: code,
        rates: newRates,
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);
    },
    [storageKey]
  );

  // 2. updateRates
  const updateRates = useCallback(
    (newRates: ExchangeRates) => {
      const current = stateRef.current;
      const nextState: FinanceState = {
        ...current,
        rates: {
          ...newRates,
          [current.baseCurrency]: 1.0,
        },
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);
    },
    [storageKey]
  );

  // 3. addTransaction
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
      const current = stateRef.current;
      const sanitizedAmount = Math.max(0, Number.isFinite(tx.amount) ? tx.amount : 0);
      const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const createdAt = new Date().toISOString();

      const newTx: Transaction = {
        ...tx,
        amount: sanitizedAmount,
        date: tx.date || new Date().toISOString(),
        id,
        createdAt,
      };

      const nextState: FinanceState = {
        ...current,
        transactions: [newTx, ...current.transactions],
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);

      return newTx;
    },
    [storageKey]
  );

  // 4. deleteTransaction
  const deleteTransaction = useCallback(
    (id: string) => {
      const current = stateRef.current;
      const nextState: FinanceState = {
        ...current,
        transactions: current.transactions.filter((t) => t.id !== id),
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);
    },
    [storageKey]
  );

  // 5. addCategory
  const addCategory = useCallback(
    (cat: Omit<Category, 'id'>): Category => {
      const current = stateRef.current;
      const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newCat: Category = {
        ...cat,
        id,
        isCustom: cat.isCustom ?? true,
      };

      const nextState: FinanceState = {
        ...current,
        categories: [...current.categories, newCat],
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);

      return newCat;
    },
    [storageKey]
  );

  // 6. addRecurringBill
  const addRecurringBill = useCallback(
    (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>): RecurringBill => {
      const current = stateRef.current;
      const id = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const createdAt = new Date().toISOString();
      const newBill: RecurringBill = {
        ...bill,
        id,
        paidMonths: [],
        createdAt,
      };

      const nextState: FinanceState = {
        ...current,
        recurringBills: [...current.recurringBills, newBill],
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);

      return newBill;
    },
    [storageKey]
  );

  // 7. markBillPaid (idempotent, records expense transaction)
  const markBillPaid = useCallback(
    (billId: string, month: string): Transaction | null => {
      const current = stateRef.current;
      const bill = current.recurringBills.find((b) => b.id === billId);
      if (!bill) return null;

      if (bill.paidMonths?.includes(month)) {
        return null; // Idempotency guard: already marked paid for this month
      }

      const updatedBill: RecurringBill = {
        ...bill,
        paidMonths: [...(bill.paidMonths || []), month],
      };

      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const createdAt = new Date().toISOString();
      const newTx: Transaction = {
        id: txId,
        type: 'expense',
        amount: bill.amount,
        currency: bill.currency,
        category: bill.category,
        note: `Оплата: ${bill.title}`,
        date: new Date().toISOString(),
        subscriptionId: bill.id,
        createdAt,
      };

      const nextState: FinanceState = {
        ...current,
        recurringBills: current.recurringBills.map((b) => (b.id === billId ? updatedBill : b)),
        transactions: [newTx, ...current.transactions],
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);

      return newTx;
    },
    [storageKey]
  );

  // 8. depositToGoal (calculates milestones and updates celebrated list)
  const depositToGoal = useCallback(
    (
      goalId: string,
      amount: number
    ): { triggeredMilestone?: number; triggeredMilestones: number[] } => {
      const current = stateRef.current;
      const goal = current.goals.find((g) => g.id === goalId);
      if (!goal) {
        return { triggeredMilestone: undefined, triggeredMilestones: [] };
      }

      const { updatedGoal, triggeredMilestones } = depositToGoalCalculation(goal, amount);
      const nextState: FinanceState = {
        ...current,
        goals: current.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
      };

      stateRef.current = nextState;
      setState(nextState);
      saveStateToStorage(nextState, storageKey);

      return {
        triggeredMilestone: triggeredMilestones[0],
        triggeredMilestones,
      };
    },
    [storageKey]
  );

  // 9. resetToDemoData
  const resetToDemoData = useCallback(() => {
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    saveStateToStorage(fresh, storageKey);
  }, [storageKey]);

  const contextValue: ExtendedFinanceContextType = useMemo(
    () => ({
      state,
      setBaseCurrency,
      updateRates,
      addTransaction,
      deleteTransaction,
      addCategory,
      addRecurringBill,
      markBillPaid,
      depositToGoal,
      resetToDemoData,
    }),
    [
      state,
      setBaseCurrency,
      updateRates,
      addTransaction,
      deleteTransaction,
      addCategory,
      addRecurringBill,
      markBillPaid,
      depositToGoal,
      resetToDemoData,
    ]
  );

  return <PlannerContext.Provider value={contextValue}>{children}</PlannerContext.Provider>;
};

export const FinanceProvider = PlannerProvider;

/**
 * Hook to consume the Finance / Planner state and actions.
 */
export const usePlanner = (): ExtendedFinanceContextType => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};

export const useFinance = usePlanner;
