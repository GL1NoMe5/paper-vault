/**
 * Core Domain Models and TypeScript Interfaces
 * Personal Finance & Cozy Planner ("Уютный Бюджет / Дневник Финансов")
 */

// 1. Currencies
export type CurrencyCode = 'KZT' | 'RUB' | 'USD' | 'EUR' | 'CZK';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export type ExchangeRates = Record<CurrencyCode, number>;

// 2. Transactions & Hourly Income
export type TransactionType = 'expense' | 'income';

export interface CalculationMetadata {
  hourlyRate: number;
  hoursWorked: number;
  formula: string; // e.g. "15 ч. × 2 500 = 37 500"
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  date: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
  note?: string;
  calculationMetadata?: CalculationMetadata;
  subscriptionId?: string; // Set when auto-generated from paying a recurring bill
  createdAt: string;
}

// 3. Categories
export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name, e.g. 'ShoppingCart', 'Coffee'
  color: string; // Hex color code, e.g. '#A3C9A8'
  type: TransactionType;
  isCustom?: boolean;
}

// 4. Recurring Bills (Subscriptions)
export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  dayOfMonth: number; // 1 to 31
  category: string;
  icon?: string;
  color?: string;
  paidMonths: string[]; // ['2026-11']
  createdAt: string;
}

// 5. Dream Goals ("Коплю на мечту")
export interface DreamGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  currency: CurrencyCode;
  icon?: string;
  color?: string;
  celebratedMilestones: number[]; // [25, 50, 75, 100]
  createdAt: string;
}

// 6. Navigation Tabs
export type Tab = 'journal' | 'calendar' | 'analytics' | 'goals';

// 7. Smart Savings Advisor Tips
export type SmartTipSeverity = 'warning' | 'info' | 'success';

export interface SmartTip {
  id: string;
  ruleId: 'coffee' | 'subscriptions' | 'overspending' | 'savings_rate' | 'harmony';
  badge: string; // e.g. "☕ Кофеман", "✨ Отличный темп"
  message: string;
  severity: SmartTipSeverity;
  icon?: string;
}

// 8. Hourly Income Calculation
export interface HourlyCalculationResult {
  amount: number;
  formula: string;
  metadata: CalculationMetadata;
}

// 9. Postcard Export Data (9:16 PNG)
export interface StoryCardData {
  monthName: string;
  year: number;
  baseCurrency: CurrencyCode;
  totalEarned: number;
  totalSpent: number;
  netSavings: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  goalProgress?: { title: string; percentage: number };
  statusBadge: string;
}

// 10. Finance State
export interface FinanceState {
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
  transactions: Transaction[];
  categories: Category[];
  recurringBills: RecurringBill[];
  goals: DreamGoal[];
}

// 11. Context API Interface
export interface FinanceContextType {
  state: FinanceState;
  setBaseCurrency: (code: CurrencyCode) => void;
  updateRates: (newRates: ExchangeRates) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  addRecurringBill: (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => void;
  markBillPaid: (billId: string, month: string) => void;
  depositToGoal: (goalId: string, amount: number) => { triggeredMilestone?: number };
  resetToDemoData: () => void;
}
