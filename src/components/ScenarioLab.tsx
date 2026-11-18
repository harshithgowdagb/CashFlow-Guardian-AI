import React from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  Send,
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, ScenarioModifiers } from '../types/cashflow';
import { TrajectoryChart } from './TrajectoryChart';
import { DEFAULT_SCENARIOS, addDays, formatDate } from '../utils/engine';

interface ScenarioLabProps {
  profile: BusinessProfile;
  baselineSummary: ForecastSummary;
  scenarioSummary: ForecastSummary;
  scenarioModifiers: ScenarioModifiers;
  onUpdateScenario: (newModifiers: ScenarioModifiers) => void;
  onResetScenario: () => void;
  onOpenWhatsAppAlertWithScenario: () => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  profile,
  baselineSummary,
  scenarioSummary,
  scenarioModifiers,
  onUpdateScenario,
  onResetScenario,
  onOpenWhatsAppAlertWithScenario,
}) => {
  const isModified =
    scenarioModifiers.customerDelayDays > 0 ||
    scenarioModifiers.salesReductionPct > 0 ||
    scenarioModifiers.unexpectedExpenseAmount > 0 ||
    scenarioModifiers.supplierCostIncreasePct > 0 ||
    scenarioModifiers.supplierPaymentDelayDays > 0;

  const balanceDelta = scenarioSummary.minProjectedBalance - baselineSummary.minProjectedBalance;

  const todayStr = formatDate(new Date());
  const defaultUnexpectedDate = addDays(todayStr, 7);

  return (
    <div className="space-y-6">
      {/* Header card with quick reset */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">What-If Scenario Stress Lab</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate payment delays, sales dips, cost spikes, and deferred bills. Combine multiple stress events to see how your runway reacts before real-world shocks hit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <button
              onClick={onResetScenario}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          )}

          <button
            onClick={onOpenWhatsAppAlertWithScenario}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Generate WhatsApp Alert for Scenario</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Lowest Projected Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Lowest Projected Balance
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] text-slate-500">Baseline</div>
              <div className="text-base font-bold text-slate-200">
                ${baselineSummary.minProjectedBalance.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-amber-400 font-semibold">Scenario</div>
              <div
                className={`text-lg font-black ${
                  scenarioSummary.minProjectedBalance < 0
                    ? 'text-rose-400'
                    : scenarioSummary.minProjectedBalance < profile.minCashReserve
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                ${scenarioSummary.minProjectedBalance.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400 flex items-center justify-between">
            <span>Net Delta:</span>
            <span className={balanceDelta < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {balanceDelta < 0 ? `-$${Math.abs(balanceDelta).toLocaleString()}` : `+$${balanceDelta.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Metric 2: Shortage Date */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            First Insolvency Date ($0)
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] text-slate-500">Baseline</div>
              <div className="text-sm font-semibold text-slate-300">
                {baselineSummary.firstZeroShortageDate || 'None in 35d'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-amber-400 font-semibold">Scenario</div>
              <div className="text-sm font-bold text-rose-400">
                {scenarioSummary.firstZeroShortageDate || 'None in 35d'}
              </div>
            </div>
          </div>
          <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400 flex items-center justify-between">
            <span>Deficit Amount:</span>
            <span className="font-bold text-rose-400">
              {scenarioSummary.firstZeroShortageAmount > 0
                ? `$${scenarioSummary.firstZeroShortageAmount.toLocaleString()}`
                : '$0'}
            </span>
          </div>
        </div>

        {/* Metric 3: Minimum Safety Reserve Breach */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Reserve Breach (${profile.minCashReserve.toLocaleString()})
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] text-slate-500">Baseline</div>
              <div className="text-sm font-semibold text-slate-300">
                {baselineSummary.firstReserveShortageDate || 'Never'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-amber-400 font-semibold">Scenario</div>
              <div className="text-sm font-bold text-amber-300">
                {scenarioSummary.firstReserveShortageDate || 'Never'}
              </div>
            </div>
          </div>
          <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400 flex items-center justify-between">
            <span>Buffer Deficit:</span>
            <span className="font-bold text-amber-400">
              {scenarioSummary.firstReserveShortageAmount > 0
                ? `$${scenarioSummary.firstReserveShortageAmount.toLocaleString()}`
                : '$0'}
            </span>
          </div>
        </div>

        {/* Metric 4: Safe Runway Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Solvent Runway
          </span>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] text-slate-500">Baseline</div>
              <div className="text-base font-bold text-slate-300">
                {baselineSummary.runwayDays} Days
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-amber-400 font-semibold">Scenario</div>
              <div className="text-lg font-black text-rose-400">
                {scenarioSummary.runwayDays} Days
              </div>
            </div>
          </div>
          <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-400 flex items-center justify-between">
            <span>Runway Shift:</span>
            <span className="font-bold text-slate-200">
              {scenarioSummary.runwayDays - baselineSummary.runwayDays} Days
            </span>
          </div>
        </div>
      </div>

      {/* Overlaid Trajectory Chart (Baseline vs Scenario) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Visual Trajectory Comparison: Baseline (Blue) vs Stress Scenario (Amber Dashed)</span>
          </h3>
          <span className="text-xs text-slate-400">Hover over points to inspect divergence</span>
        </div>

        <TrajectoryChart
          baselineDays={baselineSummary.days}
          scenarioDays={scenarioSummary.days}
          minCashReserve={profile.minCashReserve}
          height={260}
        />
      </div>

      {/* Simulator Control Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Customer Payment Delay */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Customer Payment Delay</span>
            </label>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              +{scenarioModifiers.customerDelayDays} Days
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Simulate customers postponing payment remittances past agreed credit terms.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 7, 15, 30].map((days) => (
              <button
                key={days}
                onClick={() => onUpdateScenario({ ...scenarioModifiers, customerDelayDays: days })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  scenarioModifiers.customerDelayDays === days
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {days === 0 ? '0 days' : `+${days}d`}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Sales Reduction */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-rose-400" />
              <span>Sales & Receipts Drop</span>
            </label>
            <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              -{scenarioModifiers.salesReductionPct}%
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Stress-test sudden downturns in walk-in sales or reduced wholesale volume.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 10, 20, 30].map((pct) => (
              <button
                key={pct}
                onClick={() => onUpdateScenario({ ...scenarioModifiers, salesReductionPct: pct })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  scenarioModifiers.salesReductionPct === pct
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {pct === 0 ? 'Normal' : `-${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Unexpected One-Off Expense */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Unexpected Emergency Outflow</span>
            </label>
            <span className="text-xs font-bold text-rose-400">
              ${scenarioModifiers.unexpectedExpenseAmount.toLocaleString()}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Equipment repair, sudden tax bill, or emergency facility maintenance.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-xs text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={scenarioModifiers.unexpectedExpenseAmount || ''}
                placeholder="0"
                onChange={(e) =>
                  onUpdateScenario({
                    ...scenarioModifiers,
                    unexpectedExpenseAmount: Math.max(0, Number(e.target.value)),
                    unexpectedExpenseDate: scenarioModifiers.unexpectedExpenseDate || defaultUnexpectedDate,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <input
              type="date"
              value={scenarioModifiers.unexpectedExpenseDate || defaultUnexpectedDate}
              onChange={(e) =>
                onUpdateScenario({
                  ...scenarioModifiers,
                  unexpectedExpenseDate: e.target.value,
                })
              }
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 4. Increased Supplier Costs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Supplier Cost Inflation</span>
            </label>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              +{scenarioModifiers.supplierCostIncreasePct}%
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Coffee bean spot price spikes, shipping surcharges, or packaging price hikes.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 5, 10, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => onUpdateScenario({ ...scenarioModifiers, supplierCostIncreasePct: pct })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  scenarioModifiers.supplierCostIncreasePct === pct
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {pct === 0 ? '0%' : `+${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Changed Supplier Payment Dates (Deferral) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Supplier Payment Deferral</span>
            </label>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              +{scenarioModifiers.supplierPaymentDelayDays} Days
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Shift supplier bill settlement forward by negotiating Net-45 or Net-60 terms.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 7, 14, 21].map((days) => (
              <button
                key={days}
                onClick={() => onUpdateScenario({ ...scenarioModifiers, supplierPaymentDelayDays: days })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  scenarioModifiers.supplierPaymentDelayDays === days
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {days === 0 ? '0 days' : `+${days}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Combinations */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-indigo-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Preset Stress Presets</span>
          </div>

          <p className="text-[11px] text-slate-400">
            One-click test combinations representing standard small business liquidity shocks:
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() =>
                onUpdateScenario({
                  customerDelayDays: 15,
                  salesReductionPct: 10,
                  unexpectedExpenseAmount: 2500,
                  unexpectedExpenseDate: defaultUnexpectedDate,
                  supplierCostIncreasePct: 10,
                  supplierPaymentDelayDays: 0,
                })
              }
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <div className="font-bold text-amber-300">Severe Liquidity Crunch</div>
              <div className="text-[10px] text-slate-400">15d customer delay + 10% sales drop + $2.5k emergency</div>
            </button>

            <button
              onClick={() =>
                onUpdateScenario({
                  customerDelayDays: 30,
                  salesReductionPct: 20,
                  unexpectedExpenseAmount: 0,
                  unexpectedExpenseDate: '',
                  supplierCostIncreasePct: 0,
                  supplierPaymentDelayDays: 14,
                })
              }
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <div className="font-bold text-blue-300">Late Accounts with Supplier Buffer</div>
              <div className="text-[10px] text-slate-400">30d customer delay offset by 14d supplier deferral</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
