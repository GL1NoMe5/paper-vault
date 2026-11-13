/**
 * src/components/analytics/MonthlyStoryDrawer.tsx
 * 9:16 Aesthetic Story Card preview and high-resolution PNG export ("itogi-mesyaca.png")
 * powered by Vaul bottom-sheet and html-to-image.
 */

import React, { useRef, useState } from 'react';
import { Transaction, DreamGoal, CurrencyCode, ExchangeRates } from '../../types';
import { calculateMonthlyTotals, calculateCategoryBreakdown } from '../../utils/analytics';
import { formatCurrency } from '../../utils/currency';
import { formatMonthTitle } from '../../utils/date';
import { toPng } from 'html-to-image';
import { Drawer } from 'vaul';
import { motion } from 'motion/react';
import { Download, Sparkles, X, Heart, Check } from 'lucide-react';

export interface MonthlyStoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  goals: DreamGoal[];
  monthKey: string;
  baseCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export const MonthlyStoryDrawer: React.FC<MonthlyStoryDrawerProps> = ({
  isOpen,
  onClose,
  transactions,
  goals,
  monthKey,
  baseCurrency,
  rates,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const { totalIncome, totalExpenses, netBalance, savingsRate } = calculateMonthlyTotals(
    transactions,
    monthKey,
    baseCurrency,
    rates
  );

  const categories = calculateCategoryBreakdown(transactions, monthKey, baseCurrency, rates);
  const topCategories = categories.slice(0, 3);
  const activeGoal = goals[0];

  const monthTitle = formatMonthTitle ? formatMonthTitle(monthKey) : monthKey;

  const statusBadge =
    netBalance > 0 && savingsRate >= 0.25
      ? '🚀 Звездный накопитель'
      : netBalance > 0
      ? '✨ В плюсе и уюте'
      : '🍂 Работа над балансом';

  const handleDownloadPng = async () => {
    if (!cardRef.current || isExporting) return;

    try {
      setIsExporting(true);
      // Generate PNG using html-to-image
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2, // High resolution
        cacheBust: true,
      });

      // Trigger browser download
      const link = document.createElement('a');
      link.download = 'itogi-mesyaca.png';
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export story card PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          data-testid="story-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-[#3D352E]/40 backdrop-blur-sm z-50 overscroll-contain"
        />
        <Drawer.Content
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-drawer-title"
          data-testid="monthly-story-drawer"
          className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50 bg-[#FAF6F0] border-t border-[#EFECE6] rounded-t-3xl shadow-[0_-8px_30px_rgba(61,53,46,0.12)] max-h-[94vh] flex flex-col focus:outline-none"
        >
          {/* Grab Handle */}
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 bg-[#E5DEC9] rounded-full" />
          </div>

          {/* Top Washi Accent */}
          <div className="h-2 bg-[#D8C2E8]/80 border-b border-[#EFECE6] shrink-0" aria-hidden="true" />

          {/* Header */}
          <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-[#EFECE6] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D8C2E8]/30 text-[#4A3362] flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <Drawer.Title id="story-drawer-title" className="font-heading font-bold text-base text-[#3D352E]">
                  Открытка месяца
                </Drawer.Title>
                <Drawer.Description className="text-[11px] text-[#8C7F70]">
                  Формат 9:16 для сохранения и соцсетей
                </Drawer.Description>
              </div>
            </div>
            <button
              type="button"
              data-testid="story-drawer-close-btn"
              onClick={onClose}
              aria-label="Закрыть"
              className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center text-[#8C7F70] hover:text-[#3D352E] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Container with 9:16 Card Canvas */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1 flex flex-col items-center">
            {/* The 9:16 Story Card */}
            <div
              ref={cardRef}
              data-testid="monthly-story-card"
              className="w-full max-w-[340px] aspect-[9/16] bg-[#FAF6F0] bg-dot-grid border-2 border-[#EFECE6] rounded-3xl p-5 shadow-cozy-md flex flex-col justify-between text-[#3D352E] relative overflow-hidden"
            >
              {/* Card Header Tape Accent */}
              <div className="w-24 h-4 bg-[#F9E29C]/80 border border-[#E5DEC9] mx-auto rounded-xs rotate-[1deg] shadow-2xs mb-2" />

              {/* Title & Badge */}
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7F70]">
                  Уютный Бюджет
                </span>
                <h2 className="font-heading font-extrabold text-xl text-[#3D352E]">
                  {monthTitle}
                </h2>
                <div className="inline-block mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-heading font-bold bg-[#A3C9A8]/25 text-[#2F5233] border border-[#A3C9A8]/40 shadow-2xs">
                    {statusBadge}
                  </span>
                </div>
              </div>

              {/* Core Financial Numbers Card */}
              <div className="bg-white/90 backdrop-blur-xs border border-[#EFECE6] rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8C7F70] font-medium">Заработано:</span>
                  <span className="font-heading font-bold text-[#2F5233]">
                    +{formatCurrency(totalIncome, baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8C7F70] font-medium">Потрачено:</span>
                  <span className="font-heading font-bold text-[#7A2E1D]">
                    -{formatCurrency(totalExpenses, baseCurrency)}
                  </span>
                </div>
                <div className="border-t border-dashed border-[#E5DEC9] pt-2 flex justify-between items-center text-xs">
                  <span className="text-[#3D352E] font-bold">Итог месяца:</span>
                  <span className={`font-heading font-extrabold ${netBalance >= 0 ? 'text-[#2F5233]' : 'text-[#7A2E1D]'}`}>
                    {netBalance >= 0 ? `+${formatCurrency(netBalance, baseCurrency)}` : formatCurrency(netBalance, baseCurrency)}
                  </span>
                </div>
              </div>

              {/* Top 3 Categories */}
              {topCategories.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xs border border-[#EFECE6] rounded-2xl p-3 space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7F70] block">
                    Топ трат месяца
                  </span>
                  {topCategories.map((cat, i) => (
                    <div key={cat.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-[#8C7F70] text-[10px]">{i + 1}.</span>
                        <span className="font-medium text-[#3D352E] truncate">{cat.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#8C7F70] shrink-0">
                        {cat.percentage}% ({formatCurrency(cat.amount, baseCurrency)})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Dream Goal Peek */}
              {activeGoal && (
                <div className="bg-white/90 backdrop-blur-xs border border-[#EFECE6] rounded-2xl p-3 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7F70]">
                      Коплю на мечту
                    </span>
                    <span className="font-heading font-bold text-xs text-[#2F5233]">
                      {Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs font-heading font-bold text-[#3D352E] truncate">
                    {activeGoal.title}
                  </p>
                  <div className="w-full h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#A3C9A8] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((activeGoal.savedAmount / activeGoal.targetAmount) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Footer Stamp */}
              <div className="text-center pt-1 border-t border-[#E5DEC9]">
                <p className="text-[10px] font-medium text-[#8C7F70] flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-[#F4A28C]" />
                  <span>Уютный Дневник Финансов</span>
                </p>
              </div>
            </div>

            {/* Action Download Button */}
            <div className="w-full max-w-[340px] pt-1 pb-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                data-testid="download-story-png-btn"
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full min-h-[48px] rounded-2xl bg-[#D8C2E8] hover:bg-[#C9AEE0] text-[#4A3362] font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-cozy cursor-pointer transition-colors"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                    <span>Открытка сохранена!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>{isExporting ? 'Создание PNG...' : 'Скачать открытку (PNG)'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
