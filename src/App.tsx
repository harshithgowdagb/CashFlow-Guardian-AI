/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { CashForecast } from './components/CashForecast';
import { ScenarioLab } from './components/ScenarioLab';
import { RecoveryAdvisor } from './components/RecoveryAdvisor';
import { TransactionsManager } from './components/TransactionsManager';
import { WhatsAppAlertHub } from './components/WhatsAppAlertHub';
import { WhatsAppAlertModal } from './components/WhatsAppAlertModal';
import { OverdueReminderModal } from './components/OverdueReminderModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportsView } from './components/ReportsView';
import { getInitialSampleData } from './data/sampleData';
import {
  BusinessProfile,
  ForecastSummary,
  RecoveryAction,
  ScenarioModifiers,
  Transaction,
} from './types/cashflow';
import {
  calculateForecast,
  DEFAULT_SCENARIOS,
  formatDate,
} from './utils/engine';

export default function App() {
  const initial = useMemo(() => getInitialSampleData(), []);

  const [profile, setProfile] = useState<BusinessProfile>(initial.profile);
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>(initial.recoveryActions);
  const [scenarioModifiers, setScenarioModifiers] = useState<ScenarioModifiers>(DEFAULT_SCENARIOS);

  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modals
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [overdueModalTx, setOverdueModalTx] = useState<Transaction | null>(null);

  // Sync with backend API on mount
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API not available, fallback to local');
      })
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        if (data.transactions) setTransactions(data.transactions);
        if (data.recoveryActions) setRecoveryActions(data.recoveryActions);
      })
      .catch((_err) => {
        // Fallback to local sample data if running without backend server
        console.log('Operating in standalone mode with embedded local store.');
      });
  }, []);

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // 1. Baseline forecast (no scenario, no applied actions)
  const baselineSummary = useMemo(() => {
    return calculateForecast(profile, transactions, {
      startDate: todayStr,
      horizonDays: 35,
    });
  }, [profile, transactions, todayStr]);

  // 2. Scenario forecast (with What-If scenario modifiers)
  const scenarioSummary = useMemo(() => {
    return calculateForecast(profile, transactions, {
      startDate: todayStr,
      horizonDays: 35,
      scenario: scenarioModifiers,
    });
  }, [profile, transactions, todayStr, scenarioModifiers]);

  // 3. Simulated recovery forecast (with applied recovery actions)
  const simulatedRecoverySummary = useMemo(() => {
    return calculateForecast(profile, transactions, {
      startDate: todayStr,
      horizonDays: 35,
      appliedActions: recoveryActions,
    });
  }, [profile, transactions, todayStr, recoveryActions]);

  // Handler: Add or Update Transaction
  const handleAddOrUpdateTransaction = (tx: Transaction) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = tx;
        return copy;
      }
      return [tx, ...prev];
    });

    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    }).catch((e) => console.log('Stored in local state', e));
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    fetch(`/api/transactions/${id}`, { method: 'DELETE' }).catch((e) =>
      console.log('Deleted locally', e)
    );
  };

  // Handler: Reset Sample Data
  const handleResetSampleData = () => {
    const fresh = getInitialSampleData();
    setProfile(fresh.profile);
    setTransactions(fresh.transactions);
    setRecoveryActions(fresh.recoveryActions);
    setScenarioModifiers(DEFAULT_SCENARIOS);

    fetch('/api/reset-sample', { method: 'POST' }).catch((e) =>
      console.log('Reset locally', e)
    );
  };

  // Handler: Toggle Recovery Action
  const handleToggleAction = (id: string, applied: boolean) => {
    setRecoveryActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, applied } : a))
    );

    fetch('/api/recovery-actions/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, applied }),
    }).catch((e) => console.log('Toggled locally', e));
  };

  // Handler: Update Profile
  const handleSaveProfile = (updated: BusinessProfile) => {
    setProfile(updated);
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((e) => console.log('Saved profile locally', e));
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Type',
      'Category',
      'Status',
      'Date',
      'Amount',
      'Party',
      'Description',
      'InvoiceNumber',
      'Notes',
    ];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.category,
      t.status,
      t.date,
      t.amount,
      `"${(t.party || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.invoiceNumber || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cashflow_ledger_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Handler: Import CSV
  const handleImportCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) throw new Error('CSV must contain at least one data row.');

    const newTxs: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 6) {
        const type = parts[0]?.toLowerCase() === 'outflow' ? 'outflow' : 'inflow';
        const category = (parts[1] || 'customer_payment') as any;
        const status = (parts[2] || 'expected') as any;
        const date = parts[3] || todayStr;
        const amount = Math.abs(parseFloat(parts[4])) || 100;
        const party = parts[5] || 'Unknown Party';
        const description = parts[6] || party;
        const invoiceNumber = parts[7] || '';

        newTxs.push({
          id: `tx-import-${Date.now()}-${i}`,
          type,
          category,
          status,
          date,
          amount,
          party,
          description,
          invoiceNumber,
          isOverdue: type === 'inflow' && status !== 'actual' && date < todayStr,
        });
      }
    }

    if (newTxs.length === 0) {
      throw new Error('No valid transactions could be parsed. Check column ordering.');
    }

    setTransactions((prev) => [...newTxs, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        profile={profile}
        summary={baselineSummary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWhatsAppAlert={() => setIsWhatsAppModalOpen(true)}
        onOpenAddTransaction={() => {
          setActiveTab('transactions');
        }}
        onResetSampleData={handleResetSampleData}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <Overview
            profile={profile}
            summary={baselineSummary}
            transactions={transactions}
            onNavigateTab={setActiveTab}
            onOpenWhatsAppAlert={() => setIsWhatsAppModalOpen(true)}
            onOpenOverdueReminder={(tx) => setOverdueModalTx(tx)}
          />
        )}

        {activeTab === 'forecast' && (
          <CashForecast profile={profile} summary={baselineSummary} />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioLab
            profile={profile}
            baselineSummary={baselineSummary}
            scenarioSummary={scenarioSummary}
            scenarioModifiers={scenarioModifiers}
            onUpdateScenario={setScenarioModifiers}
            onResetScenario={() => setScenarioModifiers(DEFAULT_SCENARIOS)}
            onOpenWhatsAppAlertWithScenario={() => setIsWhatsAppModalOpen(true)}
          />
        )}

        {activeTab === 'advisor' && (
          <RecoveryAdvisor
            profile={profile}
            baselineSummary={baselineSummary}
            simulatedSummary={simulatedRecoverySummary}
            recoveryActions={recoveryActions}
            onToggleAction={handleToggleAction}
            onOpenWhatsAppAlert={() => setIsWhatsAppModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsManager
            transactions={transactions}
            onAddOrUpdateTransaction={handleAddOrUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenOverdueReminder={(tx) => setOverdueModalTx(tx)}
            onResetSampleData={handleResetSampleData}
            onExportCSV={handleExportCSV}
            onImportCSV={handleImportCSV}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppAlertHub
            profile={profile}
            summary={baselineSummary}
            recoveryActions={recoveryActions}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            profile={profile}
            summary={baselineSummary}
            transactions={transactions}
            onExportCSV={handleExportCSV}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CashFlow Guardian AI • Predictive Cash-Flow Management for Small Businesses
          </span>
          <span className="text-slate-600">
            Click-to-Chat WhatsApp Enabled • Deterministic Calculation Engine
          </span>
        </div>
      </footer>

      {/* Modals */}
      <WhatsAppAlertModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        profile={profile}
        summary={activeTab === 'scenarios' ? scenarioSummary : baselineSummary}
        recoveryActions={recoveryActions}
        onUpdatePhone={(phone) => setProfile((p) => ({ ...p, ownerPhone: phone }))}
      />

      <OverdueReminderModal
        isOpen={overdueModalTx !== null}
        onClose={() => setOverdueModalTx(null)}
        profile={profile}
        transaction={overdueModalTx}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
