/**
 * src/components/goals/GoalCard.tsx
 * Interactive bullet journal goal tracking card with animated progress bar,
 * NumberFlow metrics, milestone badges, and quick deposit action.
 */

import React from 'react';
import { DreamGoal, CurrencyCode } from '../../types';
import { getCurrencySymbol, formatCurrency } from '../../utils/currency';
import { Trophy, Plus, Check, Flag } from 'lucide-react';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';

export interface GoalCardProps {
  goal: DreamGoal;
  baseCurrency: CurrencyCode;
  onOpenDeposit: (goal: DreamGoal) => void;
  className?: string;
}

const MILESTONES = [25, 50, 75, 100];

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  baseCurrency,
  onOpenDeposit,
  className = '',
}) => {
  const symbol = getCurrencySymbol(goal.currency || baseCurrency);
  const target = goal.targetAmount > 0 ? goal.targetAmount : 1;
  const percentage = Math.min(100, Math.round((goal.savedAmount / target) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

  return (
    <div
      data-testid={`goal-card-${goal.id}`}
      className={`card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-4 ${className}`}
    >
      {/* Top Tape and Goal Title */}
      <div className="flex items-center justify-between">
        <span className="washi-tape washi-tape-coral text-xs font-bold text-[#7A2E1D]">
          Цель накоплений
        </span>
        <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#7A2E1D] bg-[#F4A28C]/20 px-2.5 py-0.5 rounded-full">
          <Trophy className="w-3.5 h-3.5" />
          <span data-testid={`goal-percentage-${goal.id}`}>
            <NumberFlow value={percentage} suffix="%" />
          </span>
        </div>
      </div>

      {/* Main Goal Headline */}
      <div>
        <h3
          data-testid={`goal-title-${goal.id}`}
          className="font-heading font-extrabold text-lg text-[#3D352E] tracking-tight"
        >
          {goal.title}
        </h3>
        <p className="text-xs text-[#8C7F70] mt-0.5">
          Осталось собрать: {formatCurrency(remaining, goal.currency)}
        </p>
      </div>

      {/* Core Numbers Display with NumberFlow */}
      <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EFECE6] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#8C7F70] tracking-wider block">
            Собрано
          </span>
          <span
            data-testid={`goal-saved-${goal.id}`}
            className="font-heading font-extrabold text-xl text-[#2F5233] mt-0.5 block"
          >
            <NumberFlow value={goal.savedAmount} suffix={` ${symbol}`} locales="ru-RU" />
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-[#8C7F70] tracking-wider block">
            Цель
          </span>
          <span
            data-testid={`goal-target-${goal.id}`}
            className="font-heading font-extrabold text-base text-[#3D352E] mt-0.5 block"
          >
            {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>
      </div>

      {/* Animated Multi-Stop Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3.5 bg-[#FAF6F0] border border-[#EFECE6] rounded-full overflow-hidden p-0.5">
          <motion.div
            data-testid={`goal-progress-bar-${goal.id}`}
            className="h-full bg-[#A3C9A8] rounded-full shadow-2xs"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          />
        </div>

        {/* Milestone Step Badges (25%, 50%, 75%, 100%) */}
        <div className="flex justify-between items-center px-1 pt-1">
          {MILESTONES.map((m) => {
            const isReached = percentage >= m;

            return (
              <div
                key={m}
                data-testid={`milestone-badge-${m}`}
                className={`flex items-center gap-1 text-[11px] font-heading font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                  isReached
                    ? 'text-[#2F5233] bg-[#A3C9A8]/30'
                    : 'text-[#8C7F70] bg-transparent'
                }`}
              >
                {isReached ? (
                  <Check className="w-3 h-3 text-[#2F5233]" strokeWidth={3} />
                ) : (
                  <Flag className="w-3 h-3 text-[#8C7F70]/60" />
                )}
                <span>{m}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button: Deposit */}
      <div className="pt-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          data-testid={`deposit-to-goal-btn-${goal.id}`}
          onClick={() => onOpenDeposit(goal)}
          className="w-full min-h-[48px] rounded-2xl bg-[#F4A28C] hover:bg-[#E8927C] text-[#7A2E1D] font-heading font-bold text-xs sm:text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>+ Пополнить копилку</span>
        </motion.button>
      </div>
    </div>
  );
};
