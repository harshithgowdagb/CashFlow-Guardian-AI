import React from 'react';
import {
  ShieldAlert,
  Send,
  PlusCircle,
  RotateCcw,
  Building2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { BusinessProfile, ForecastSummary } from '../types/cashflow';

interface HeaderProps {
  profile: BusinessProfile;
  summary: ForecastSummary;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWhatsAppAlert: () => void;
  onOpenAddTransaction: () => void;
  onResetSampleData: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  summary,
  activeTab,
  setActiveTab,
  onOpenWhatsAppAlert,
  onOpenAddTransaction,
  onResetSampleData,
  onOpenProfileModal,
}) => {
  const isShortage = summary.firstZeroShortageDate !== null;
  const isTight = !isShortage && summary.firstReserveShortageDate !== null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Banner with Quick Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Business Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  CashFlow Guardian AI
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Predictive Defense
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <button
                  onClick={onOpenProfileModal}
                  className="font-medium text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-2 transition-colors cursor-pointer"
                  title="Click to edit business name and cash reserve"
                >
                  {profile.businessName}
                </button>
                <span>•</span>
                <span>Bank Reconciled: {profile.lastReconciledDate}</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium uppercase">Current Cash</span>
              <span className="text-sm font-bold text-white">${profile.currentCashBalance.toLocaleString()}</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium uppercase">Min Reserve</span>
              <span className="text-sm font-semibold text-amber-300">${profile.minCashReserve.toLocaleString()}</span>
            </div>

            {/* Health Status Pill */}
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 border font-semibold text-xs transition-colors ${
                isShortage
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : isTight
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isShortage ? (
                <>
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  <span>Shortage: {summary.firstZeroShortageDate} (-${summary.firstZeroShortageAmount.toLocaleString()})</span>
                </>
              ) : isTight ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Reserve Dip: {summary.firstReserveShortageDate}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Healthy Runway ({summary.runwayDays}+ Days)</span>
                </>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 ml-auto md:ml-2">
              <button
                onClick={onOpenWhatsAppAlert}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer border border-emerald-400/40"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Generate WhatsApp Cash Alert</span>
              </button>

              <button
                onClick={onOpenAddTransaction}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Add income or expense transaction"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Transaction</span>
              </button>

              <button
                onClick={onResetSampleData}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-2.5 py-2 rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Reset to fresh demo scenario"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Reset Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs font-medium scrollbar-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'forecast', label: 'Cash Forecast & Shortages' },
            { id: 'scenarios', label: 'What-If Scenario Lab' },
            { id: 'advisor', label: 'Recovery Advisor' },
            { id: 'transactions', label: 'Transactions & Invoices' },
            { id: 'whatsapp', label: 'WhatsApp Alert Hub' },
            { id: 'reports', label: 'Audit & Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
