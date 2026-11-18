import React from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Send,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, RecoveryAction } from '../types/cashflow';
import { TrajectoryChart } from './TrajectoryChart';

interface RecoveryAdvisorProps {
  profile: BusinessProfile;
  baselineSummary: ForecastSummary;
  simulatedSummary: ForecastSummary;
  recoveryActions: RecoveryAction[];
  onToggleAction: (id: string, applied: boolean) => void;
  onOpenWhatsAppAlert: () => void;
}

export const RecoveryAdvisor: React.FC<RecoveryAdvisorProps> = ({
  profile,
  baselineSummary,
  simulatedSummary,
  recoveryActions,
  onToggleAction,
  onOpenWhatsAppAlert,
}) => {
  // Sort actions by estimated cash impact descending
  const sortedActions = [...recoveryActions].sort(
    (a, b) => b.estimatedCashImpact - a.estimatedCashImpact
  );

  const appliedCount = recoveryActions.filter((a) => a.applied).length;
  const totalAppliedImpact = recoveryActions
    .filter((a) => a.applied)
    .reduce((sum, a) => sum + a.estimatedCashImpact, 0);

  const baselineShortage = baselineSummary.firstZeroShortageDate !== null;
  const simulatedShortage = simulatedSummary.firstZeroShortageDate !== null;
  const shortageResolved = baselineShortage && !simulatedShortage;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Recovery Action Advisor</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Ranked options to avoid or eliminate projected cash shortages. Toggle actions below to simulate their financial effect in real-time before initiating real-world negotiations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Applied Actions</div>
              <div className="text-sm font-extrabold text-white">
                {appliedCount} / {recoveryActions.length} (${totalAppliedImpact.toLocaleString()} simulated)
              </div>
            </div>

            <button
              onClick={onOpenWhatsAppAlert}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Generate WhatsApp Alert</span>
            </button>
          </div>
        </div>

        {/* Impact Notification Pill */}
        {shortageResolved && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white">Shortage Completely Averted! </span>
                <span className="text-xs text-emerald-300">
                  Applied recovery measures keep your cash balance positive ($
                  {simulatedSummary.minProjectedBalance.toLocaleString()}) throughout the forecast window.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory comparison: Baseline vs Simulated with applied actions */}
      {appliedCount > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Financial Impact Simulation: Baseline (Blue) vs With Applied Actions (Amber Dashed)
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              Lowest Cash: ${baselineSummary.minProjectedBalance.toLocaleString()} → ${simulatedSummary.minProjectedBalance.toLocaleString()}
            </span>
          </div>

          <TrajectoryChart
            baselineDays={baselineSummary.days}
            scenarioDays={simulatedSummary.days}
            minCashReserve={profile.minCashReserve}
            height={220}
          />
        </div>
      )}

      {/* Action Cards Ranked by Impact */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Recommended Actions Ranked by Estimated Cash Impact</span>
            <span className="text-xs font-normal text-slate-400">
              (High impact first)
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Check the box to simulate applying to cash flow
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortedActions.map((action, index) => {
            return (
              <div
                key={action.id}
                className={`border rounded-2xl p-5 transition-all ${
                  action.applied
                    ? 'bg-emerald-950/20 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        index === 0
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : index === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-white">{action.title}</h4>
                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {action.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            action.riskLevel === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          Risk: {action.riskLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {action.description}
                      </p>

                      {/* Assumptions & Disclaimers */}
                      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-slate-850/80 border border-slate-800">
                          <span className="font-semibold text-slate-300">Underlying Assumption: </span>
                          <span className="text-slate-400">{action.assumptions}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300/90">
                          <span className="font-semibold text-amber-300">Important Disclaimer: </span>
                          <span>{action.disclaimer}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact & Toggle Control */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Impact</div>
                      <div className="text-xl font-black text-emerald-400">
                        +${action.estimatedCashImpact.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center sm:justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>~{action.timelineDays} day execution</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={action.applied}
                        onChange={(e) => onToggleAction(action.id, e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`text-xs font-bold ${action.applied ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {action.applied ? 'Simulated in Model' : 'Simulate Action'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
