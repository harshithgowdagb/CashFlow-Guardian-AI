import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Send,
  SlidersHorizontal,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  Users,
  CreditCard,
  Receipt
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, Transaction } from '../types/cashflow';
import { TrajectoryChart } from './TrajectoryChart';

interface OverviewProps {
  profile: BusinessProfile;
  summary: ForecastSummary;
  transactions: Transaction[];
  onNavigateTab: (tab: string) => void;
  onOpenWhatsAppAlert: () => void;
  onOpenOverdueReminder: (tx: Transaction) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  profile,
  summary,
  transactions,
  onNavigateTab,
  onOpenWhatsAppAlert,
  onOpenOverdueReminder,
}) => {
  const isShortage = summary.firstZeroShortageDate !== null;
  const isReserveShortage = !isShortage && summary.firstReserveShortageDate !== null;

  // Find overdue receivables
  const overdueReceivables = transactions.filter(
    (t) => t.type === 'inflow' && t.status !== 'actual' && t.isOverdue
  );
  const totalOverdueAmount = overdueReceivables.reduce((sum, t) => sum + t.amount, 0);

  // Breakdown of upcoming expenses
  const upcomingSupplier = summary.breakdownByExpenseCategory.supplier_bill || 0;
  const upcomingPayroll = summary.breakdownByExpenseCategory.payroll || 0;
  const upcomingLoans = summary.breakdownByExpenseCategory.loan_instalment || 0;
  const upcomingOpex = summary.breakdownByExpenseCategory.operating_expense || 0;

  return (
    <div className="space-y-6">
      {/* Shortage Emergency or Healthy Status Banner */}
      {isShortage ? (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 border-2 border-rose-500/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <AlertOctagon className="w-48 h-48 text-rose-500" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                  <AlertOctagon className="w-3.5 h-3.5" /> Shortage Imminent
                </span>
                <span className="text-xs text-rose-300 font-medium">
                  Financial runway: <strong className="text-white">{summary.runwayDays} days</strong>
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Projected Cash Deficit of ${summary.firstZeroShortageAmount.toLocaleString()} on {summary.firstZeroShortageDate}
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl">
                {summary.culprits.length > 0
                  ? summary.culprits[0].reason
                  : 'Upcoming commitments exceed cleared bank balance before future customer invoices are scheduled to settle.'}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <button
                onClick={onOpenWhatsAppAlert}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer border border-emerald-400"
              >
                <Send className="w-4 h-4" />
                <span>Generate WhatsApp Cash Alert</span>
              </button>

              <button
                onClick={() => onNavigateTab('advisor')}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>View Recovery Actions</span>
              </button>
            </div>
          </div>
        </div>
      ) : isReserveShortage ? (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-500/70 rounded-2xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> Tight Liquidity Warning
                </span>
                <span className="text-xs text-amber-300">Reserve buffer breached</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Cash balance dips below safety reserve (${profile.minCashReserve.toLocaleString()}) on {summary.firstReserveShortageDate}
              </h2>
              <p className="text-xs text-slate-300">
                Projected minimum cash reaches ${summary.minProjectedBalance.toLocaleString()}. Buffer drops by ${summary.firstReserveShortageAmount.toLocaleString()} below your safety threshold.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('scenarios')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Simulate Delays in Test Lab</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cash Runway Safe across 35-Day Horizon</h3>
              <p className="text-xs text-slate-300">
                Projected lowest cash is <strong className="text-emerald-400">${summary.minProjectedBalance.toLocaleString()}</strong> on {summary.minProjectedDate}, staying well above the ${profile.minCashReserve.toLocaleString()} reserve.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('scenarios')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            Stress test runway <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 Key Metric Cards (Actual vs Expected vs Estimated strictly separated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Current Available Cash */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Available Cash</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            ${profile.currentCashBalance.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Actual Cleared Bank Balance</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Safety reserve: ${profile.minCashReserve.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Expected Customer Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Expected Receipts</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ${summary.totalExpectedReceipts.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Scheduled across 35 days</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            *Never treated as money received
          </div>
        </div>

        {/* Card 3: Actual Received Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Actual Received</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            ${summary.totalActualReceived.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cleared remittances to date</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Confirmed in bank ledger
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Total Receivables</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            ${summary.totalOutstandingReceivables.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Uncollected Invoices</span>
            {totalOverdueAmount > 0 && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                ${totalOverdueAmount.toLocaleString()} late
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Pending client remittances
          </div>
        </div>

        {/* Card 5: Upcoming Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Upcoming Expenses</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            ${summary.totalUpcomingExpenses.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Total commitments 35d</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Suppliers, Payroll, Loans, OpEx
          </div>
        </div>
      </div>

      {/* Main Interactive Forecast Graph & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 35-Day Cash Trajectory */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>35-Day Cash-Flow Trajectory</span>
                <span className="text-xs font-normal text-slate-400">
                  (Daily net projection)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Identifies solvency threshold ($0) and minimum required reserve ($
                {profile.minCashReserve.toLocaleString()}).
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Detailed table <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <TrajectoryChart
            baselineDays={summary.days}
            minCashReserve={profile.minCashReserve}
            height={260}
          />
        </div>

        {/* Right Col: Upcoming Commitments Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Commitments Breakdown</span>
          </h3>
          <p className="text-xs text-slate-400">
            Categorized upcoming outflows over the forecast window:
          </p>

          <div className="space-y-3">
            {/* Supplier Bills */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Supplier Bills</div>
                  <div className="text-[10px] text-slate-400">Raw materials & packaging</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  ${upcomingSupplier.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  {summary.totalUpcomingExpenses > 0
                    ? `${Math.round((upcomingSupplier / summary.totalUpcomingExpenses) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Payroll */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Staff Payroll</div>
                  <div className="text-[10px] text-slate-400">Salary & barista teams</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  ${upcomingPayroll.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  {summary.totalUpcomingExpenses > 0
                    ? `${Math.round((upcomingPayroll / summary.totalUpcomingExpenses) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Loan Instalments */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Loan & Equipment</div>
                  <div className="text-[10px] text-slate-400">Roaster fixed leases</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  ${upcomingLoans.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  {summary.totalUpcomingExpenses > 0
                    ? `${Math.round((upcomingLoans / summary.totalUpcomingExpenses) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Rent & Operating Overhead</div>
                  <div className="text-[10px] text-slate-400">Utilities, lease, software</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  ${upcomingOpex.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  {summary.totalUpcomingExpenses > 0
                    ? `${Math.round((upcomingOpex / summary.totalUpcomingExpenses) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Overdue Invoices Alert Section */}
      {overdueReceivables.length > 0 && (
        <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Action Required: {overdueReceivables.length} Overdue Customer Invoices ($
                {totalOverdueAmount.toLocaleString()})
              </h3>
            </div>
            <span className="text-xs text-rose-300 font-medium">
              Collecting these eliminates cash deficit risks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueReceivables.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-800/80 border border-rose-900/60 rounded-xl p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{tx.party}</span>
                    <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                      Due: {tx.date}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {tx.description} ({tx.invoiceNumber || 'No Ref'})
                  </div>
                  <div className="text-sm font-extrabold text-amber-300 mt-1">
                    ${tx.amount.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => onOpenOverdueReminder(tx)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
