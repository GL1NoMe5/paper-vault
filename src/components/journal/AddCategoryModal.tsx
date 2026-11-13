import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { CategoryIcon } from '../ui/CategoryIcon';
import { X, Check, AlertCircle, PlusCircle } from 'lucide-react';

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
}

const AVAILABLE_ICONS = [
  'ShoppingCart', 'Coffee', 'Bus', 'Home', 'Smile', 'CreditCard', 'Sparkles', 'ShoppingBag',
  'BookOpen', 'Heart', 'Dumbbell', 'Music', 'PawPrint', 'Film', 'Gift', 'Briefcase',
  'GraduationCap', 'Utensils', 'Plane', 'Car',
];

const AVAILABLE_COLORS = [
  { hex: '#A3C9A8', name: 'Шалфей' },
  { hex: '#F4A28C', name: 'Коралл' },
  { hex: '#F9E29C', name: 'Сливочный' },
  { hex: '#D8C2E8', name: 'Лаванда' },
  { hex: '#F2C6CE', name: 'Роза' },
  { hex: '#FFF6D6', name: 'Стикер' },
  { hex: '#A8D0E6', name: 'Небесный' },
  { hex: '#B8E0D2', name: 'Мята' },
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [selectedColor, setSelectedColor] = useState('#D8C2E8');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedIcon('BookOpen');
      setSelectedColor('#D8C2E8');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название категории');
      return;
    }

    onAddCategory({
      name: trimmed,
      icon: selectedIcon,
      color: selectedColor,
      type: 'expense',
      isCustom: true,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
      data-testid="add-category-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D352E]/40 backdrop-blur-xs overscroll-contain"
    >
      <div
        data-testid="add-category-modal-container"
        className="w-full max-w-md bg-[#FAF6F0] border border-[#EFECE6] rounded-2xl shadow-[0_16px_36px_-6px_rgba(139,115,85,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Decorative Tape Strip */}
        <div
          className="h-2.5 w-full border-b border-[#E5DEC9]"
          style={{ backgroundColor: `${selectedColor}66` }}
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D8C2E8]/40 flex items-center justify-center text-[#4A3362]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="add-category-title" className="font-heading font-bold text-base text-[#3D352E]">
                Новая категория
              </h2>
              <p className="text-[11px] text-[#8C7F70]">Добавление категории в дневник</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="add-category-modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть"
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Live Preview Card */}
          <div>
            <label className="block text-xs font-semibold text-[#8C7F70] uppercase mb-1.5">
              Предпросмотр:
            </label>
            <div
              data-testid="custom-category-preview"
              className="p-3 rounded-xl bg-white border border-[#EFECE6] flex items-center gap-3 shadow-2xs"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors"
                style={{
                  backgroundColor: `${selectedColor}35`,
                  color: selectedColor,
                }}
              >
                <CategoryIcon name={selectedIcon} className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-heading font-bold text-sm text-[#3D352E] block truncate">
                  {name.trim() || 'Название категории'}
                </span>
                <span className="text-[11px] text-[#8C7F70] block">
                  Пользовательская категория
                </span>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="custom-category-name" className="block text-xs font-semibold text-[#3D352E] mb-1.5">
              Название категории:
            </label>
            <input
              id="custom-category-name"
              type="text"
              data-testid="custom-category-name-input"
              placeholder="Например: Книги и хобби"
              maxLength={30}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#EFECE6] text-xs font-medium text-[#3D352E] outline-none focus:border-[#A3C9A8] focus:ring-2 focus:ring-[#A3C9A8]/30 placeholder:text-[#8C7F70]/50"
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Icon Picker Grid */}
          <div>
            <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
              Иконка категории:
            </label>
            <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white/60 border border-[#EFECE6] rounded-xl">
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    data-testid={`custom-category-icon-${iconName}`}
                    onClick={() => setSelectedIcon(iconName)}
                    className={`
                      min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer
                      ${isSelected
                        ? 'bg-[#A3C9A8] text-[#2F5233] shadow-xs scale-105 ring-2 ring-[#8FB894]'
                        : 'bg-white hover:bg-[#FAF6F0] text-[#3D352E] border border-[#EFECE6]'
                      }
                    `}
                  >
                    <CategoryIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Picker Swatches */}
          <div>
            <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
              Цвет метки:
            </label>
            <div className="flex flex-wrap gap-2 p-1">
              {AVAILABLE_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    type="button"
                    data-testid={`custom-category-color-${col.hex}`}
                    title={col.name}
                    onClick={() => setSelectedColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`
                      min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center
                      transition-transform cursor-pointer border border-black/10 shadow-2xs
                      ${isSelected ? 'scale-110 ring-2 ring-[#3D352E] shadow-cozy' : 'hover:scale-105'}
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 text-[#3D352E]" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              data-testid="create-custom-category-btn"
              className="w-full min-h-[48px] rounded-2xl bg-[#A3C9A8] hover:bg-[#8FB894] active:scale-98 text-[#2F5233] font-heading font-bold text-sm shadow-cozy flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5" strokeWidth={2.5} />
              <span>Создать категорию</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
