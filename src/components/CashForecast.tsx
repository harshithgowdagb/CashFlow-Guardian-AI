import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { BusinessProfile, ForecastDay, ForecastSummary } from '../types/cashflow';
import { TrajectoryChart } from './TrajectoryChart';

interface CashForecastProps {
  profile: BusinessProfile;
  summary: ForecastSummary;
}

export const CashForecast: React.FC<CashForecastProps> = ({ profile, summary }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [filterMode, setFilterMode] = useState<'all' | 'shortages' | 'activity'>('all');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Filter daily forecast
  const filteredDays = summary.days.filter((day) => {
    if (filterMode === 'shortages') return day.isBelowZero || day.isBelowReserve;
    if (filterMode === 'activity') return day.totalInflows > 0 || day.totalOutflows > 0;
    return true;
  });

  // Weekly aggregation
  interface WeeklyBucket {
    weekNumber: number;
    startDate: string;
    endDate: string;
    totalInflows: number;
    totalOutflows: number;
    netChange: number;
    closingBalance: number;
    minBalance: number;
    hasShortage: boolean;
  }

  const weeklyBuckets: WeeklyBucket[] = [];
  const chunkSize = 7;
  for (let i = 0; i < summary.days.length; i += chunkSize) {
    const chunk = summary.days.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const totalInflows = chunk.reduce((sum, d) => sum + d.totalInflows, 0);
    const totalOutflows = chunk.reduce((sum, d) => sum + d.totalOutflows, 0);
    const minBalance = Math.min(...chunk.map((d) => d.closingBalance));
    const closingBalance = chunk[chunk.length - 1].closingBalance;
    const hasShortage = chunk.some((d) => d.isBelowZero || d.isBelowReserve);

    weeklyBuckets.push({
      weekNumber: Math.floor(i / chunkSize) + 1,
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      totalInflows,
      totalOutflows,
      netChange: totalInflows - totalOutflows,
      closingBalance,
      minBalance,
      hasShortage,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Explanation & Confidence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Explanation Panel (Differentiated Feature) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Why is this Cash Trajectory Predicted?
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {summary.healthExplanation}
          </p>

          {/* Root Culprit Breakdown */}
          {summary.culprits.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Identified Cash Timing Bottlenecks:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {summary.culprits.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-white">{c.party}</span>
                      <span className={c.type === 'expense' ? 'text-rose-400' : 'text-amber-400'}>
                        {c.type === 'expense' ? `-$${c.amount.toLocaleString()}` : `+$${c.amount.toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{c.reason}</p>
                    <div className="text-[10px] text-slate-500 font-mono">Date: {c.date}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All scheduled customer receipts clear comfortably prior to major supplier invoices and payroll runs.
              </span>
            </div>
          )}
        </div>

        {/* Data Confidence Indicator (Differentiated Feature - Rigorous Audit Factors) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Forecast Confidence</h3>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                summary.confidence.level === 'High'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : summary.confidence.level === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {summary.confidence.level} Confidence ({summary.confidence.score}/100)
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Assessed transparently from date reliability, bank reconciliation freshness, and invoice certainty.
          </p>

          <div className="space-y-2 pt-1 border-t border-slate-800">
            {summary.confidence.factors.map((f, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    f.status === 'positive'
                      ? 'bg-emerald-400'
                      : f.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-200">{f.label}: </span>
                  <span className="text-[11px] text-slate-400">{f.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <TrajectoryChart
          baselineDays={summary.days}
          minCashReserve={profile.minCashReserve}
          height={240}
        />
      </div>

      {/* Forecast Table Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Detailed Cash Movement Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Separating Cleared Actuals, Firm Expected Invoices, and Estimated Projections
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs font-semibold">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'weekly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
            </div>

            {/* Filter Toggle (Daily only) */}
            {viewMode === 'daily' && (
              <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs font-medium">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterMode === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All (35d)
                </button>
                <button
                  onClick={() => setFilterMode('shortages')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterMode === 'shortages' ? 'bg-rose-900/60 text-rose-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Shortages Only
                </button>
                <button
                  onClick={() => setFilterMode('activity')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterMode === 'activity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active Days
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Daily View Table */}
        {viewMode === 'daily' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Day</th>
                  <th className="py-3 px-3">
                    <span className="text-emerald-400">Actual Inflows</span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="text-blue-400">Expected Inflows</span>
                  </th>
                  <th className="py-3 px-3">
                    <span className="text-cyan-400">Estimated Inflows</span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span className="text-rose-400">Upcoming Outflows</span>
                  </th>
                  <th className="py-3 px-3 text-right">Net Daily</th>
                  <th className="py-3 px-4 text-right">Closing Cash</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredDays.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No days match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredDays.map((d) => {
                    const isExpanded = expandedDay === d.date;
                    const isDeficit = d.isBelowZero;
                    const isReserveDip = !isDeficit && d.isBelowReserve;

                    return (
                      <React.Fragment key={d.date}>
                        <tr
                          className={`hover:bg-slate-850/80 transition-colors ${
                            isDeficit
                              ? 'bg-rose-950/25 border-l-4 border-rose-500'
                              : isReserveDip
                              ? 'bg-amber-950/20 border-l-4 border-amber-500'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-white">{d.date}</td>
                          <td className="py-3 px-3 text-slate-400">{d.dayOfWeek}</td>
                          <td className="py-3 px-3 text-emerald-400">
                            {d.inflowsActual > 0 ? `+$${d.inflowsActual.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-blue-300">
                            {d.inflowsExpected > 0 ? `+$${d.inflowsExpected.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-cyan-300">
                            {d.inflowsEstimated > 0 ? `+$${d.inflowsEstimated.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right text-rose-300">
                            {d.totalOutflows > 0 ? `-$${d.totalOutflows.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-medium">
                            <span
                              className={
                                d.netCashFlow > 0
                                  ? 'text-emerald-400'
                                  : d.netCashFlow < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                              }
                            >
                              {d.netCashFlow > 0
                                ? `+$${d.netCashFlow.toLocaleString()}`
                                : d.netCashFlow < 0
                                ? `-$${Math.abs(d.netCashFlow).toLocaleString()}`
                                : '$0'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-sm">
                            <span
                              className={
                                isDeficit
                                  ? 'text-rose-400 font-extrabold'
                                  : isReserveDip
                                  ? 'text-amber-400 font-bold'
                                  : 'text-slate-200'
                              }
                            >
                              ${d.closingBalance.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-sans">
                            {isDeficit ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-600/30 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/50">
                                <AlertOctagon className="w-3 h-3" /> Shortage
                              </span>
                            ) : isReserveDip ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                                <AlertTriangle className="w-3 h-3" /> Under Reserve
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-medium text-emerald-400">
                                Safe
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {d.keyEvents.length > 0 && (
                              <button
                                onClick={() => setExpandedDay(isExpanded ? null : d.date)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 cursor-pointer"
                                title="View scheduled events on this date"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Collapsible Key Events Breakdown */}
                        {isExpanded && d.keyEvents.length > 0 && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={10} className="p-3 px-6 font-sans">
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Scheduled Transactions for {d.date}:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {d.keyEvents.map((ev) => (
                                    <div
                                      key={ev.id}
                                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-white">{ev.party}: </span>
                                        <span className="text-slate-400">{ev.title}</span>
                                        <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                          {ev.status}
                                        </span>
                                      </div>
                                      <span
                                        className={`font-mono font-bold ${
                                          ev.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}
                                      >
                                        {ev.type === 'inflow' ? `+$${ev.amount.toLocaleString()}` : `-$${ev.amount.toLocaleString()}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Weekly View Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Date Span</th>
                  <th className="py-3 px-4 text-emerald-400">Weekly Inflows</th>
                  <th className="py-3 px-4 text-rose-400">Weekly Outflows</th>
                  <th className="py-3 px-4">Net Cash Movement</th>
                  <th className="py-3 px-4">Lowest Projected Cash</th>
                  <th className="py-3 px-4 text-right">Week-End Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {weeklyBuckets.map((w) => (
                  <tr
                    key={w.weekNumber}
                    className={`hover:bg-slate-850/80 transition-colors ${
                      w.minBalance < 0
                        ? 'bg-rose-950/20'
                        : w.minBalance < profile.minCashReserve
                        ? 'bg-amber-950/20'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-white font-sans">Week {w.weekNumber}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {w.startDate} → {w.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">
                      +${w.totalInflows.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 font-bold">
                      -${w.totalOutflows.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className={w.netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {w.netChange >= 0 ? `+$${w.netChange.toLocaleString()}` : `-$${Math.abs(w.netChange).toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={w.minBalance < 0 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}>
                        ${w.minBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${w.closingBalance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      {w.minBalance < 0 ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800">
                          Critical Deficit
                        </span>
                      ) : w.minBalance < profile.minCashReserve ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                          Reserve Buffer Breach
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-400">Comfortable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
