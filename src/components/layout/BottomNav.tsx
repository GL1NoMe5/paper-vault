import React from 'react';
import { Tab } from '../../types';
import { LucideIcon, BookOpen, Briefcase, Heart, Calendar, PieChart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface TabItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
  markerBg: string;
  textColor: string;
  testId: string;
}

const TABS: TabItem[] = [
  {
    id: 'journal',
    label: 'Дневник',
    icon: BookOpen,
    markerBg: 'bg-[#A3C9A8]/30 dark:bg-[#A3C9A8]/25',
    textColor: 'text-[#2F5233] dark:text-[#A3C9A8]',
    testId: 'tab-journal',
  },
  {
    id: 'work',
    label: 'Работа',
    icon: Briefcase,
    markerBg: 'bg-[#F9E29C]/40 dark:bg-[#F9E29C]/25',
    textColor: 'text-[#6E5611] dark:text-[#F9E29C]',
    testId: 'tab-work',
  },
  {
    id: 'family',
    label: 'Семья',
    icon: Heart,
    markerBg: 'bg-[#F2C6CE]/40 dark:bg-[#F2C6CE]/25',
    textColor: 'text-[#7A2E1D] dark:text-[#F2C6CE]',
    testId: 'tab-family',
  },
  {
    id: 'calendar',
    label: 'Календарь',
    icon: Calendar,
    markerBg: 'bg-[#D8C2E8]/35 dark:bg-[#D8C2E8]/25',
    textColor: 'text-[#4A3362] dark:text-[#D8C2E8]',
    testId: 'tab-calendar',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    icon: PieChart,
    markerBg: 'bg-[#A3C9A8]/30 dark:bg-[#A3C9A8]/25',
    textColor: 'text-[#2F5233] dark:text-[#A3C9A8]',
    testId: 'tab-analytics',
  },
  {
    id: 'goals',
    label: 'Мечта',
    icon: Sparkles,
    markerBg: 'bg-[#F4A28C]/30 dark:bg-[#F4A28C]/25',
    textColor: 'text-[#7A2E1D] dark:text-[#F4A28C]',
    testId: 'tab-goals',
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav 
      aria-label="Основная навигация" 
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[460px] z-40"
    >
      <div 
        role="tablist" 
        aria-label="Разделы дневника"
        className="bg-white/95 dark:bg-[#292524]/95 backdrop-blur-md border border-[#EFECE6] dark:border-[#3E3835] rounded-2xl shadow-cozy p-1 flex items-center justify-between gap-0.5 transition-colors"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <motion.button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              data-testid={tab.testId}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              whileTap={{ scale: 0.94 }}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex-1 min-h-[48px] min-w-[44px] py-1 px-0.5 rounded-xl 
                flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer select-none
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A3C9A8]
                ${isActive 
                  ? `${tab.textColor} font-semibold` 
                  : 'text-[#8C7F70] dark:text-[#A89F91] hover:text-[#3D352E] dark:hover:text-[#F5EFEB] hover:bg-[#FAF6F0]/70 dark:hover:bg-[#201D1B]/70 font-medium'
                }
              `}
            >
              {/* Shared Layout Active Pill */}
              {isActive && (
                <motion.span
                  layoutId="active-tab-pill"
                  className={`absolute inset-0 rounded-xl ${tab.markerBg} shadow-xs`}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                />
              )}

              {/* Icon & Label */}
              <span className="relative z-10 flex flex-col items-center">
                <IconComponent 
                  className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} 
                  strokeWidth={isActive ? 2.4 : 1.8} 
                />
                <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight">
                  {tab.label}
                </span>
              </span>

              {/* Non-color-alone indicator for WCAG 1.4.1 */}
              {isActive && (
                <span 
                  className="relative z-10 bottom-0.5 w-4 h-0.5 rounded-full bg-current opacity-60 mt-0.5" 
                  aria-hidden="true" 
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
