/**
 * src/components/goals/GoalsView.tsx
 * Tab 4: "Мечта" - Goal tracker cards with visual progress, quick deposits, and confetti celebrations.
 */

import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { DreamGoal } from '../../types';
import { GoalCard } from './GoalCard';
import { DepositDrawer } from './DepositDrawer';
import { AddGoalDrawer } from './AddGoalDrawer';
import { EditGoalDrawer } from './EditGoalDrawer';
import { Sparkles, Heart, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const GoalsView: React.FC = () => {
  const { state, depositToGoal, addDreamGoal, updateDreamGoal, deleteDreamGoal } = usePlanner();
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<DreamGoal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DreamGoal | null>(null);

  const handleOpenDeposit = (goal: DreamGoal) => {
    setSelectedGoalForDeposit(goal);
  };

  return (
    <section id="panel-goals" aria-labelledby="tab-goals" className="space-y-4">
      {/* Goals Header Card */}
      <div
        data-testid="goals-header-card"
        className="card-cozy p-5 bg-white border border-[#EFECE6] rounded-3xl shadow-cozy space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="washi-tape washi-tape-coral text-xs font-bold text-[#7A2E1D]">
            Коплю на мечту
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8C7F70]">
            <Sparkles className="w-3.5 h-3.5 text-[#F4A28C]" />
            <span>{state.goals.length} активная цель</span>
          </div>
        </div>

        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[#3D352E] tracking-tight">
            Копилка желаний
          </h2>
          <p className="text-xs text-[#8C7F70] mt-0.5">
            Откладывайте даже небольшие суммы, отмечайте контрольные точки и празднуйте победы!
          </p>
        </div>

        {/* Add Goal Header Button */}
        <div className="pt-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            data-testid="open-add-goal-btn"
            onClick={() => setIsAddGoalOpen(true)}
            className="w-full min-h-[48px] rounded-2xl bg-[#F4A28C] hover:bg-[#E8927C] text-[#7A2E1D] font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>+ Добавить новую цель</span>
          </motion.button>
        </div>
      </div>

      {/* Goal Cards List */}
      {state.goals.length === 0 ? (
        <div
          data-testid="no-goals-empty"
          className="p-8 border border-dashed border-[#E5DEC9] bg-[#FDFBF7] rounded-3xl text-center space-y-3"
        >
          <Heart className="w-8 h-8 text-[#F4A28C] mx-auto" />
          <h4 className="font-heading font-bold text-sm text-[#3D352E]">
            Пока нет активных целей
          </h4>
          <p className="text-xs text-[#8C7F70]">
            Создайте свою первую финансовую цель и начните копить шаг за шагом.
          </p>
          <div className="pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              data-testid="create-goal-empty-btn"
              onClick={() => setIsAddGoalOpen(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F4A28C] hover:bg-[#E8927C] text-[#7A2E1D] font-heading font-bold text-xs shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>+ Создать мечту</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-4" data-testid="goals-cards-list">
          {state.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              baseCurrency={state.baseCurrency}
              onOpenDeposit={handleOpenDeposit}
              onEditGoal={setEditingGoal}
              onDeleteGoal={deleteDreamGoal}
            />
          ))}
        </div>
      )}

      {/* Quick Deposit Bottom Drawer */}
      <DepositDrawer
        isOpen={selectedGoalForDeposit !== null}
        onClose={() => setSelectedGoalForDeposit(null)}
        goal={selectedGoalForDeposit}
        baseCurrency={state.baseCurrency}
        onDeposit={depositToGoal}
      />

      {/* Add Goal Drawer */}
      <AddGoalDrawer
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        baseCurrency={state.baseCurrency}
        onAddGoal={addDreamGoal}
      />

      {/* Edit Goal Drawer */}
      <EditGoalDrawer
        isOpen={editingGoal !== null}
        onClose={() => setEditingGoal(null)}
        goal={editingGoal}
        baseCurrency={state.baseCurrency}
        onUpdateGoal={updateDreamGoal}
        onDeleteGoal={deleteDreamGoal}
      />
    </section>
  );
};
