import React, { useState } from 'react';
import { CurrencyCode, ExchangeRates, Tab } from './types';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { AppLayout } from './components/layout/AppLayout';
import { CurrencyModal } from './components/layout/CurrencyModal';
import { JournalView } from './components/journal/JournalView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GoalsView } from './components/goals/GoalsView';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('journal');
  const { state, setBaseCurrency, updateRates } = usePlanner();
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const handleSaveCurrency = (newBase: CurrencyCode, newRates: ExchangeRates) => {
    if (newBase !== state.baseCurrency) {
      setBaseCurrency(newBase);
    }
    updateRates(newRates);
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      baseCurrency={state.baseCurrency}
      onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
    >
      {/* 4 Interactive Bullet Journal Tabs */}
      {activeTab === 'journal' && <JournalView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'goals' && <GoalsView />}

      {/* Global Currency & Exchange Rates Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        baseCurrency={state.baseCurrency}
        rates={state.rates}
        onSave={handleSaveCurrency}
      />
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <PlannerProvider>
      <AppContent />
    </PlannerProvider>
  );
};

export default App;
