import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { CurrencyCode, Tab } from '../../types';

export interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  baseCurrency: CurrencyCode;
  onOpenCurrencyModal: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  baseCurrency,
  onOpenCurrencyModal,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex justify-center text-[#3D352E] font-sans selection:bg-[#F9E29C] selection:text-[#3D352E]">
      {/* Centered Mobile-First 480px Container */}
      <div 
        data-testid="app-layout-container"
        className="w-full max-w-[480px] min-h-screen relative flex flex-col bg-[#FAF6F0] bg-dot-grid sm:border-x sm:border-[#E5DEC9] sm:shadow-[0_8px_30px_rgba(139,115,85,0.08)]"
      >
        {/* Sticky Header */}
        <Header 
          baseCurrency={baseCurrency} 
          onOpenCurrencyModal={onOpenCurrencyModal} 
        />

        {/* Scrollable Journal Page Body with Clearance for Floating Dock */}
        <main 
          role="main"
          className="flex-1 w-full px-4 pt-3 pb-28 overflow-x-hidden overflow-y-auto"
        >
          {children}
        </main>

        {/* Floating Bottom Navigation */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      </div>
    </div>
  );
};
