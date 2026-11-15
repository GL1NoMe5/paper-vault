import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Transaction } from '../../types';
import { formatCurrency, getDualCurrencyDisplay } from '../../utils/currency';
import { getMonthlyFamilyTotals } from '../../utils/family';
import { AddFamilyTransferDrawer } from './AddFamilyTransferDrawer';
import { EditFamilyTransferDrawer } from './EditFamilyTransferDrawer';
import { Heart, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export const FamilyView: React.FC = () => {
  const { state, addTransaction, updateTransaction, deleteTransaction } = usePlanner();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const currentMonthKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  // Compute family totals in base currency
  const familyTotals = useMemo(() => {
    return getMonthlyFamilyTotals(
      state.transactions,
      currentMonthKey,
      state.baseCurrency,
      state.rates
    );
  }, [state.transactions, currentMonthKey, state.baseCurrency, state.rates]);

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Month Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="washi-tape washi-tape-rose text-xs font-bold text-[#6E2D38] inline-block mb-1">
            Семья & Родители
          </span>
          <h2 className="font-heading font-bold text-xl text-[#3D352E] dark:text-[#F5EFEB] capitalize">
            {monthName}
          </h2>
        </div>

        {/* Primary Action Button */}
        <motion.button
          type="button"
          data-testid="open-family-drawer-btn"
          onClick={() => setIsAddOpen(true)}
          whileTap={{ scale: 0.95 }}
          className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#6E2D38] text-[#FAF6F0] font-heading font-bold text-xs flex items-center gap-1.5 shadow-cozy hover:bg-[#58242D] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Перевод от родителей</span>
        </motion.button>
      </div>

      {/* Monthly Summary Card */}
      <div
        data-testid="family-monthly-card"
        className="card-cozy p-4 sm:p-5 border border-[#EFECE6] dark:border-[#3E3835] bg-white/90 dark:bg-[#292524] rounded-3xl shadow-cozy space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2C6CE]/35 text-[#7A2E1D] dark:text-[#F2C6CE] flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-xs text-[#8C7F70] dark:text-[#A89F91] uppercase tracking-wider">
              Получено от родителей в этом месяце
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8C7F70] dark:text-[#A89F91]">
            {familyTotals.count} {familyTotals.count === 1 ? 'перевод' : 'переводов'}
          </span>
        </div>

        {/* Big Total in Base Currency */}
        <div>
          <p className="font-heading font-black text-3xl text-[#2F5233] dark:text-[#A3C9A8] leading-tight">
            +<NumberFlow value={familyTotals.totalReceivedBase} /> {formatCurrency(0, state.baseCurrency).replace(/^[0,\s]+/, '')}
          </p>
          <p className="text-xs text-[#8C7F70] dark:text-[#A89F91] mt-0.5">
            Итоговая сумма в основной валюте ({state.baseCurrency})
          </p>
        </div>

        {/* Sender Breakdown Chips if any */}
        {Object.keys(familyTotals.sendersMap).length > 0 && (
          <div className="pt-2 border-t border-[#EFECE6] dark:border-[#3E3835] flex items-center gap-2 flex-wrap">
            {Object.entries(familyTotals.sendersMap).map(([snd, sum]) => (
              <span
                key={snd}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF6F0] dark:bg-[#201D1B] border border-[#EFECE6] dark:border-[#3E3835] text-xs font-medium text-[#3D352E] dark:text-[#F5EFEB]"
              >
                <span>{snd}:</span>
                <span className="font-bold text-[#2F5233] dark:text-[#A3C9A8]">
                  +{formatCurrency(sum, state.baseCurrency)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* History Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-bold text-sm text-[#3D352E] dark:text-[#F5EFEB]">
            История переводов
          </h3>
          <span className="text-xs text-[#8C7F70] dark:text-[#A89F91]">
            Всего: {familyTotals.count}
          </span>
        </div>

        {familyTotals.transactions.length === 0 ? (
          <div className="card-cozy p-8 text-center bg-white/80 dark:bg-[#292524] rounded-2xl border border-dashed border-[#E5DEC9] dark:border-[#3E3835]">
            <Heart className="w-10 h-10 mx-auto text-[#8C7F70]/60 dark:text-[#A89F91]/60 mb-2" />
            <p className="font-heading font-bold text-sm text-[#3D352E] dark:text-[#F5EFEB]">
              Пока нет переводов от родителей
            </p>
            <p className="text-xs text-[#8C7F70] dark:text-[#A89F91] mt-1 max-w-[280px] mx-auto">
              Нажмите «+ Перевод от родителей», чтобы записать помощь с живой конвертацией валют
            </p>
          </div>
        ) : (
          <div className="card-cozy overflow-hidden divide-y divide-[#EFECE6] dark:divide-[#3E3835] bg-white/95 dark:bg-[#292524] rounded-2xl shadow-cozy">
            {familyTotals.transactions.map((tx) => {
              const details = tx.familyDetails;
              const senderName = details?.sender || 'Родители';
              const dual = getDualCurrencyDisplay(tx.amount, tx.currency, state.baseCurrency, state.rates);
              const txDate = new Date(tx.date);
              const dateStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(txDate);

              return (
                <div
                  key={tx.id}
                  data-testid={`family-row-${tx.id}`}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/50 dark:hover:bg-[#201D1B]/50 transition-colors"
                >
                  {/* Left: Sender & Note */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#F2C6CE]/35 border border-[#F2C6CE]/50 flex items-center justify-center text-[#7A2E1D] dark:text-[#F2C6CE] shrink-0">
                      <Heart className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          data-testid={`family-sender-badge-${tx.id}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F2C6CE]/40 text-[#6E2D38] dark:text-[#F2C6CE] text-[11px] font-bold"
                        >
                          {senderName}
                        </span>
                        <span className="text-[11px] text-[#8C7F70] dark:text-[#A89F91]">
                          • {dateStr}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8C7F70] dark:text-[#A89F91] truncate mt-0.5">
                        {tx.note || 'Помощь от родителей'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      {/* Original Amount */}
                      <p
                        data-testid={`family-amount-${tx.id}`}
                        className="font-heading font-bold text-sm text-[#2F5233] dark:text-[#A3C9A8]"
                      >
                        +{formatCurrency(tx.amount, tx.currency)}
                      </p>

                      {/* Live Converted Base Amount */}
                      {dual.isDifferent && dual.approximateText && (
                        <p
                          data-testid={`family-converted-${tx.id}`}
                          className="text-[10px] text-[#8C7F70] dark:text-[#A89F91] font-mono"
                        >
                          {dual.approximateText}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      data-testid={`family-edit-btn-${tx.id}`}
                      onClick={() => handleOpenEdit(tx)}
                      aria-label="Редактировать перевод"
                      className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] dark:text-[#A89F91] hover:text-[#2F5233] dark:hover:text-[#A3C9A8] hover:bg-[#A3C9A8]/20 transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      data-testid={`family-delete-btn-${tx.id}`}
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Удалить перевод"
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

      {/* Add Drawer */}
      <AddFamilyTransferDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onSaveTransfer={addTransaction}
      />

      {/* Edit Drawer */}
      <EditFamilyTransferDrawer
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        transaction={editingTransaction}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
      />
    </div>
  );
};
