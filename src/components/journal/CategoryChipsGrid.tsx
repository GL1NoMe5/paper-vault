import React, { useContext } from 'react';
import { Category } from '../../types';
import { PlannerContext } from '../../context/PlannerContext';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export interface CategoryChipsGridProps {
  categories?: Category[];
  onSelectCategory: (category: Category) => void;
  onOpenAddCustomCategory: () => void;
  className?: string;
}

export const CategoryChipsGrid: React.FC<CategoryChipsGridProps> = ({
  categories,
  onSelectCategory,
  onOpenAddCustomCategory,
  className = '',
}) => {
  const context = useContext(PlannerContext);
  const allCategories = categories ?? context?.state.categories ?? [];
  const expenseCategories = allCategories.filter((c) => c.type === 'expense');

  return (
    <div data-testid="category-chips-grid" className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-heading font-bold text-sm text-[#3D352E]">
            Быстрая запись расхода
          </h3>
          <p className="text-[11px] text-[#8C7F70]">
            Нажмите категорию, чтобы записать сумму в 2 клика
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {expenseCategories.map((category) => (
          <motion.button
            key={category.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            data-testid={`category-chip-${category.id}`}
            onClick={() => onSelectCategory(category)}
            className="group min-h-[48px] px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#EFECE6] hover:border-[#A3C9A8]/60 shadow-2xs hover:shadow-cozy transition-all flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${category.color}35`,
                color: category.color,
              }}
            >
              <CategoryIcon name={category.icon} className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-xs text-[#3D352E] truncate min-w-0">
              {category.name}
            </span>
          </motion.button>
        ))}

        {/* "+ Своя категория" Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          data-testid="add-custom-category-chip"
          onClick={onOpenAddCustomCategory}
          className="min-h-[48px] px-3 py-2 rounded-xl border border-dashed border-[#A3C9A8] bg-[#A3C9A8]/10 hover:bg-[#A3C9A8]/20 text-[#2F5233] transition-all flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#A3C9A8]/30 flex items-center justify-center shrink-0 text-[#2F5233]">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-xs text-[#2F5233] truncate min-w-0">
            + Своя категория
          </span>
        </motion.button>
      </div>
    </div>
  );
};
