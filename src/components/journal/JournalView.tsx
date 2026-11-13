/**
 * src/components/journal/JournalView.tsx
 * Tab 1 ("Дневник"): BalanceCard, CategoryChipsGrid, HourlyIncomeSheet trigger, and JournalFeed.
 */

import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Category, Transaction } from '../../types';
import { BalanceCard } from './BalanceCard';
import { CategoryChipsGrid } from './CategoryChipsGrid';
import { ExpenseModal, ExpenseSavePayload } from './ExpenseModal';
import { AddCategoryModal } from './AddCategoryModal';
import { HourlyIncomeSheet } from './HourlyIncomeSheet';
import { JournalFeed } from './JournalFeed';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const JournalView: React.FC = () => {
  const { state, addTransaction, deleteTransaction, addCategory } = usePlanner();

  const [selectedCategoryForExpense, setSelectedCategoryForExpense] = useState<Category | null>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isHourlySheetOpen, setIsHourlySheetOpen] = useState(false);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategoryForExpense(cat);
  };

  const handleSaveExpense = (payload: ExpenseSavePayload) => {
    addTransaction({
      type: 'expense',
      amount: payload.amount,
      currency: payload.currency,
      category: payload.category,
      date: payload.date,
      note: payload.note,
    });
  };

  const handleSaveHourlyIncome = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    addTransaction(tx);
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    addCategory(newCat);
  };

  return (
    <section id="panel-journal" aria-labelledby="tab-journal" className="space-y-4">
      {/* 1. Monthly Balance Card */}
      <BalanceCard
        transactions={state.transactions}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
      />

      {/* 2. 2-Click Quick Expense Chips */}
      <CategoryChipsGrid
        categories={state.categories}
        onSelectCategory={handleSelectCategory}
        onOpenAddCustomCategory={() => setIsAddCategoryModalOpen(true)}
      />

      {/* 3. Hourly Income Action Card */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        data-testid="open-hourly-sheet-btn"
        onClick={() => setIsHourlySheetOpen(true)}
        className="w-full card-cozy p-3.5 min-h-[56px] flex items-center justify-between hover:border-[#A3C9A8] transition-all cursor-pointer group rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#A3C9A8]/25 text-[#2F5233] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-heading font-bold text-xs text-[#3D352E]">
              Почасовой доход
            </h4>
            <p className="text-[11px] text-[#8C7F70]">
              Записать заработок по формуле: ставка × часы
            </p>
          </div>
        </div>
        <span className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#A3C9A8]/30 text-[#2F5233] font-heading font-bold text-xs flex items-center gap-1 group-hover:bg-[#A3C9A8] transition-colors">
          + Записать
        </span>
      </motion.button>

      {/* 4. Date-Grouped Transaction Feed */}
      <JournalFeed
        transactions={state.transactions}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onDeleteTransaction={deleteTransaction}
        categories={state.categories}
      />

      {/* Quick Expense Modal */}
      <ExpenseModal
        isOpen={selectedCategoryForExpense !== null}
        onClose={() => setSelectedCategoryForExpense(null)}
        selectedCategory={selectedCategoryForExpense}
        baseCurrency={state.baseCurrency}
        onSaveExpense={handleSaveExpense}
      />

      {/* Custom Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      {/* Hourly Income Bottom Sheet */}
      <HourlyIncomeSheet
        isOpen={isHourlySheetOpen}
        onClose={() => setIsHourlySheetOpen(false)}
        baseCurrency={state.baseCurrency}
        onSaveIncome={handleSaveHourlyIncome}
      />
    </section>
  );
};
