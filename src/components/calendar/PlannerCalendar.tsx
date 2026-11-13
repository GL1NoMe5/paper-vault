/**
 * src/components/calendar/PlannerCalendar.tsx
 * Monthly bullet journal paper wall planner grid.
 * Russian weekday headers (Monday first), sticker dots for recurring bills, and tactile day cells.
 */

import React, { useState } from 'react';
import { RecurringBill } from '../../types';
import {
  RUSSIAN_WEEKDAYS,
  RUSSIAN_MONTH_NAMES,
  getMonthCalendarGrid,
  CalendarDayCell,
} from '../../utils/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'motion/react';

export interface PlannerCalendarProps {
  bills: RecurringBill[];
  selectedMonth?: string; // YYYY-MM
  onSelectDate?: (dateKey: string) => void;
  className?: string;
}

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  bills,
  selectedMonth,
  onSelectDate,
  className = '',
}) => {
  const initialDate = selectedMonth
    ? new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1, 1)
    : new Date();

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(initialDate.getMonth());
  const [selectedCell, setSelectedCell] = useState<CalendarDayCell | null>(null);

  const grid = getMonthCalendarGrid(currentYear, currentMonthIndex, bills, new Date());

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonthIndex(11);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
    setSelectedCell(null);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonthIndex(0);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
    setSelectedCell(null);
  };

  const handleCellClick = (cell: CalendarDayCell) => {
    setSelectedCell(cell);
    if (onSelectDate) {
      onSelectDate(cell.dateKey);
    }
  };

  const monthTitle = `${RUSSIAN_MONTH_NAMES[currentMonthIndex]} ${currentYear}`;

  return (
    <div
      data-testid="planner-calendar"
      className={`card-cozy p-4 sm:p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-3.5 ${className}`}
    >
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F9E29C]/40 text-[#6E5611] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3
              data-testid="calendar-month-title"
              className="font-heading font-bold text-sm text-[#3D352E]"
            >
              {monthTitle}
            </h3>
            <p className="text-[11px] text-[#8C7F70]">
              Настенный планер списаний
            </p>
          </div>
        </div>

        {/* Month Arrows */}
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            data-testid="calendar-prev-month"
            onClick={handlePrevMonth}
            aria-label="Предыдущий месяц"
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            data-testid="calendar-next-month"
            onClick={handleNextMonth}
            aria-label="Следующий месяц"
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Weekday Russian Headers (Monday First) */}
      <div className="grid grid-cols-7 gap-1 text-center border-b border-[#EFECE6] pb-2">
        {RUSSIAN_WEEKDAYS.map((day, idx) => {
          const isWeekend = idx >= 5;
          return (
            <span
              key={day}
              className={`text-[11px] font-heading font-bold ${
                isWeekend ? 'text-[#7A2E1D]/70' : 'text-[#8C7F70]'
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>

      {/* 7-Column Day Grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Сетка календаря">
        {grid.map((cell) => {
          const isSelected = selectedCell?.dateKey === cell.dateKey;

          return (
            <motion.button
              key={cell.dateKey}
              type="button"
              role="gridcell"
              whileTap={{ scale: 0.96 }}
              data-testid={`calendar-cell-${cell.dateKey}`}
              onClick={() => handleCellClick(cell)}
              className={`
                min-h-[44px] py-1 px-0.5 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer relative
                ${!cell.isCurrentMonth ? 'opacity-35 text-[#8C7F70]' : 'text-[#3D352E]'}
                ${cell.isToday ? 'ring-2 ring-[#A3C9A8] font-black' : ''}
                ${isSelected 
                  ? 'bg-[#A3C9A8]/30 font-bold border border-[#A3C9A8]' 
                  : 'hover:bg-[#FAF6F0] border border-transparent'
                }
              `}
            >
              {/* Day Number */}
              <span className="text-xs font-heading font-bold leading-none mt-1">
                {cell.dayNumber}
              </span>

              {/* Recurring Bill Sticker Dots */}
              <div className="flex items-center gap-0.5 mt-0.5 min-h-[6px]" aria-label={`${cell.bills.length} списаний`}>
                {cell.bills.slice(0, 3).map((bill) => (
                  <span
                    key={bill.id}
                    data-testid={`calendar-sticker-dot-${bill.id}`}
                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: bill.color || '#F4A28C' }}
                    title={bill.title}
                  />
                ))}
                {cell.bills.length > 3 && (
                  <span className="text-[8px] font-bold text-[#8C7F70] leading-none">
                    +
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Day Bill Detail Peek */}
      {selectedCell && selectedCell.bills.length > 0 && (
        <div
          data-testid="selected-day-bills-detail"
          className="p-3 bg-[#FAF6F0] border border-[#EFECE6] rounded-2xl space-y-1.5 animate-fadeIn"
        >
          <span className="text-[11px] font-bold text-[#3D352E] block">
            Списания на {selectedCell.dayNumber} {RUSSIAN_MONTH_NAMES[selectedCell.monthIndex]}:
          </span>
          <div className="space-y-1">
            {selectedCell.bills.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: b.color || '#F4A28C' }}
                  />
                  <span className="font-medium text-[#3D352E]">{b.title}</span>
                </div>
                <span className="font-bold text-[#3D352E]">
                  {b.amount} {b.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
