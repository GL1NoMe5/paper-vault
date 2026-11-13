/**
 * src/components/calendar/CalendarView.tsx
 * Tab 2: "Календарь" - Subscriptions & Bills Planner.
 * Metric for "Осталось заплатить в этом месяце" with NumberFlow,
 * wall planner grid, 5-day alert banner, and recurring payment drawer.
 */

import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getRemainingBillsTotal } from '../../utils/calendar';
import { getCurrencySymbol, CURRENCIES } from '../../utils/currency';
import { UpcomingBillsBanner } from './UpcomingBillsBanner';
import { PlannerCalendar } from './PlannerCalendar';
import { SubscriptionsList } from './SubscriptionsList';
import { AddSubscriptionDrawer } from './AddSubscriptionDrawer';
import { Plus, Receipt } from 'lucide-react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export const CalendarView: React.FC = () => {
  const { state, markBillPaid, addRecurringBill } = usePlanner();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const remainingUnpaid = getRemainingBillsTotal(
    state.recurringBills,
    currentMonthKey,
    state.baseCurrency,
    state.rates
  );

  const currencySymbol = getCurrencySymbol(state.baseCurrency);
  const decimals = CURRENCIES[state.baseCurrency]?.decimals ?? 0;

  const handlePayBill = (billId: string, monthKey: string) => {
    markBillPaid(billId, monthKey);
  };

  return (
    <section id="panel-calendar" aria-labelledby="tab-calendar" className="space-y-4">
      {/* 1. Header Card with Unpaid Metric and Add Trigger */}
      <div
        data-testid="calendar-header-card"
        className="card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="washi-tape washi-tape-butter text-xs font-bold text-[#6E5611]">
            Планер списаний
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8C7F70]">
            <Receipt className="w-3.5 h-3.5" />
            <span>{state.recurringBills.length} активных счетов</span>
          </div>
        </div>

        {/* Big Metric with NumberFlow */}
        <div>
          <span className="text-[11px] font-semibold text-[#8C7F70] uppercase tracking-wider block">
            Осталось оплатить в этом месяце
          </span>
          <h2
            data-testid="unpaid-bills-total"
            className="font-heading font-extrabold text-3xl sm:text-4xl text-[#3D352E] mt-1 tracking-tight"
          >
            <NumberFlow
              value={remainingUnpaid}
              suffix={` ${currencySymbol}`}
              locales="ru-RU"
              format={{
                minimumFractionDigits: decimals > 0 ? decimals : (remainingUnpaid % 1 !== 0 ? 2 : 0),
                maximumFractionDigits: 2,
              }}
            />
          </h2>
          <p className="text-xs text-[#8C7F70] mt-0.5">
            Сумма регулярных подписок, ожидающих оплаты до конца месяца
          </p>
        </div>

        {/* Add Subscription Button */}
        <div className="pt-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            data-testid="open-add-subscription-btn"
            onClick={() => setIsAddDrawerOpen(true)}
            className="w-full min-h-[48px] rounded-2xl bg-[#F9E29C] hover:bg-[#F2D785] text-[#6E5611] font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>+ Добавить регулярный платеж</span>
          </motion.button>
        </div>
      </div>

      {/* 2. 5-Day Alert Banner ("Скоро списание") */}
      <UpcomingBillsBanner
        bills={state.recurringBills}
        currentDate={currentDate}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onPayBill={handlePayBill}
      />

      {/* 3. Wall Planner Calendar Grid */}
      <PlannerCalendar bills={state.recurringBills} selectedMonth={currentMonthKey} />

      {/* 4. Subscriptions List */}
      <SubscriptionsList
        bills={state.recurringBills}
        currentMonthKey={currentMonthKey}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onPayBill={handlePayBill}
      />

      {/* 5. Add Subscription Vaul Drawer */}
      <AddSubscriptionDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        baseCurrency={state.baseCurrency}
        onAddBill={addRecurringBill}
      />
    </section>
  );
};
