import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Transaction } from '../../types';
import { formatCurrency, getDualCurrencyDisplay } from '../../utils/currency';
import { getMonthlyWorkTotals } from '../../utils/work';
import { WorkCalculatorDrawer } from './WorkCalculatorDrawer';
import { Briefcase, Plus, Clock, Percent, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export const WorkView: React.FC = () => {
  const { state, addTransaction, updateTransaction, deleteTransaction } = usePlanner();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Month key: current month YYYY-MM
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  // Compute monthly work totals
  const workStats = useMemo(() => {
    return getMonthlyWorkTotals(
      state.transactions,
      currentMonthKey,
      state.baseCurrency,
      state.rates
    );
  }, [state.transactions, currentMonthKey, state.baseCurrency, state.rates]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsDrawerOpen(true);
  };

  const handleSaveWork = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Month Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="washi-tape washi-tape-butter text-xs font-bold text-[#6E5611] inline-block mb-1">
            Работа & Налоги
          </span>
          <h2 className="font-heading font-bold text-xl text-[#3D352E] dark:text-[#F5EFEB] capitalize">
            {monthName}
          </h2>
        </div>

        {/* Primary Action Button */}
        <motion.button
          type="button"
          data-testid="open-work-drawer-btn"
          onClick={handleOpenAdd}
          whileTap={{ scale: 0.95 }}
          className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#2F5233] text-[#FAF6F0] font-heading font-bold text-xs flex items-center gap-1.5 shadow-cozy hover:bg-[#244027] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Записать смену</span>
        </motion.button>
      </div>

      {/* Monthly Summary Card */}
      <div
        data-testid="work-monthly-summary-card"
        className="card-cozy p-4 sm:p-5 border border-[#EFECE6] dark:border-[#3E3835] bg-white/90 dark:bg-[#292524] rounded-3xl shadow-cozy space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F9E29C]/35 text-[#6E5611] dark:text-[#F9E29C] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-xs text-[#8C7F70] dark:text-[#A89F91] uppercase tracking-wider">
              Заработано в этом месяце (на руки)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8C7F70] dark:text-[#A89F91]">
            {workStats.count} {workStats.count === 1 ? 'смена' : 'смен'}
          </span>
        </div>

        {/* Net Big Total */}
        <div>
          <p className="font-heading font-black text-3xl text-[#2F5233] dark:text-[#A3C9A8] leading-tight">
            +<NumberFlow value={workStats.totalNetBase} /> {formatCurrency(0, state.baseCurrency).replace(/^[0,\s]+/, '')}
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EFECE6] dark:border-[#3E3835] text-center">
          <div className="p-2 rounded-xl bg-[#FAF6F0] dark:bg-[#201D1B]">
            <p className="text-[10px] text-[#8C7F70] dark:text-[#A89F91] flex items-center justify-center gap-0.5">
              <DollarSign className="w-3 h-3" /> Начислено
            </p>
            <p className="font-heading font-bold text-xs text-[#3D352E] dark:text-[#F5EFEB] mt-0.5 truncate">
              {formatCurrency(workStats.totalGrossBase, state.baseCurrency)}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-[#FAF6F0] dark:bg-[#201D1B]">
            <p className="text-[10px] text-[#8C7F70] dark:text-[#A89F91] flex items-center justify-center gap-0.5">
              <Percent className="w-3 h-3 text-[#7A2E1D] dark:text-[#F4A28C]" /> Налог
            </p>
            <p className="font-heading font-bold text-xs text-[#7A2E1D] dark:text-[#F4A28C] mt-0.5 truncate">
              -{formatCurrency(workStats.totalTaxBase, state.baseCurrency)}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-[#FAF6F0] dark:bg-[#201D1B]">
            <p className="text-[10px] text-[#8C7F70] dark:text-[#A89F91] flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3 text-[#2F5233] dark:text-[#A3C9A8]" /> Часы
            </p>
            <p className="font-heading font-bold text-xs text-[#2F5233] dark:text-[#A3C9A8] mt-0.5 truncate">
              {workStats.totalHours} ч.
            </p>
          </div>
        </div>
      </div>

      {/* Payout History List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-sm text-[#3D352E] dark:text-[#F5EFEB]">
            История смен и выплат
          </h3>
          <span className="text-xs text-[#8C7F70] dark:text-[#A89F91]">
            Всего: {workStats.count}
          </span>
        </div>

        {workStats.transactions.length === 0 ? (
          <div className="card-cozy p-8 text-center bg-white/80 dark:bg-[#292524] rounded-2xl border border-dashed border-[#E5DEC9] dark:border-[#3E3835]">
            <Briefcase className="w-10 h-10 mx-auto text-[#8C7F70]/60 dark:text-[#A89F91]/60 mb-2" />
            <p className="font-heading font-bold text-sm text-[#3D352E] dark:text-[#F5EFEB]">
              Пока нет записанных смен
            </p>
            <p className="text-xs text-[#8C7F70] dark:text-[#A89F91] mt-1 max-w-[280px] mx-auto">
              Нажмите «+ Записать смену», чтобы рассчитать доход по ставке, часам и налогам
            </p>
          </div>
        ) : (
          <div className="card-cozy overflow-hidden divide-y divide-[#EFECE6] dark:divide-[#3E3835] bg-white/95 dark:bg-[#292524] rounded-2xl shadow-cozy">
            {workStats.transactions.map((tx) => {
              const details = tx.workDetails;
              const dual = getDualCurrencyDisplay(tx.amount, tx.currency, state.baseCurrency, state.rates);
              const txDate = new Date(tx.date);
              const dateStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(txDate);

              return (
                <div
                  key={tx.id}
                  data-testid={`work-row-${tx.id}`}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/50 dark:hover:bg-[#201D1B]/50 transition-colors"
                >
                  {/* Left: Date & Calculation Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#F9E29C]/30 dark:bg-[#F9E29C]/20 border border-[#F9E29C]/50 flex items-center justify-center text-[#6E5611] dark:text-[#F9E29C] shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-xs text-[#3D352E] dark:text-[#F5EFEB]">
                          {dateStr}
                        </span>

                        {/* Tax Badge */}
                        {details && (
                          <span
                            data-testid={`work-tax-badge-${tx.id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F4A28C]/25 text-[#7A2E1D] dark:text-[#F4A28C] text-[10px] font-mono font-bold"
                          >
                            {details.taxPercent}% • -{formatCurrency(details.taxAmount, tx.currency)}
                          </span>
                        )}
                      </div>

                      {/* Formula or Note */}
                      <p className="text-[11px] text-[#8C7F70] dark:text-[#A89F91] truncate mt-0.5 font-mono">
                        {tx.calculationMetadata?.formula || tx.note || 'Смена'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Net Amount & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p
                        data-testid={`work-net-amount-${tx.id}`}
                        className="font-heading font-bold text-sm text-[#2F5233] dark:text-[#A3C9A8]"
                      >
                        +{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      {dual.isDifferent && dual.approximateText && (
                        <p className="text-[10px] text-[#8C7F70] dark:text-[#A89F91] font-mono">
                          {dual.approximateText}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      data-testid={`work-edit-btn-${tx.id}`}
                      onClick={() => handleOpenEdit(tx)}
                      aria-label="Редактировать смену"
                      className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] dark:text-[#A89F91] hover:text-[#2F5233] dark:hover:text-[#A3C9A8] hover:bg-[#A3C9A8]/20 transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      data-testid={`work-delete-btn-${tx.id}`}
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Удалить смену"
                      className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] dark:text-[#A89F91] hover:text-[#7A2E1D] dark:hover:text-[#F4A28C] hover:bg-[#F4A28C]/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calculator Drawer */}
      <WorkCalculatorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onSaveWork={handleSaveWork}
        initialTransaction={editingTransaction}
        onDelete={deleteTransaction}
      />
    </div>
  );
};
