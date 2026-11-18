import React, { useState } from 'react';
import { ForecastDay } from '../types/cashflow';

interface TrajectoryChartProps {
  baselineDays: ForecastDay[];
  scenarioDays?: ForecastDay[];
  minCashReserve: number;
  height?: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  baselineDays,
  scenarioDays,
  minCashReserve,
  height = 240,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!baselineDays || baselineDays.length === 0) {
    return <div className="text-sm text-slate-500 py-8 text-center">No forecast data to chart.</div>;
  }

  // Calculate scales
  const allBalances = baselineDays.map((d) => d.closingBalance);
  if (scenarioDays) {
    allBalances.push(...scenarioDays.map((d) => d.closingBalance));
  }
  allBalances.push(0);
  allBalances.push(minCashReserve);

  const rawMin = Math.min(...allBalances);
  const rawMax = Math.max(...allBalances);
  const padding = (rawMax - rawMin) * 0.1 || 2000;
  const minY = Math.floor((rawMin - padding) / 1000) * 1000;
  const maxY = Math.ceil((rawMax + padding) / 1000) * 1000;
  const rangeY = maxY - minY || 1;

  const width = 800;
  const chartHeight = height;
  const paddingX = 40;
  const paddingY = 24;
  const innerW = width - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const getX = (idx: number) => paddingX + (idx / (baselineDays.length - 1)) * innerW;
  const getY = (val: number) => paddingY + innerH - ((val - minY) / rangeY) * innerH;

  const zeroY = getY(0);
  const reserveY = getY(minCashReserve);

  // Generate SVG path for baseline
  const baselinePath = baselineDays
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.closingBalance).toFixed(1)}`)
    .join(' ');

  // Baseline Area (gradient fill down to zero)
  const baselineArea = `${baselinePath} L ${getX(baselineDays.length - 1).toFixed(1)} ${getY(minY).toFixed(1)} L ${getX(0).toFixed(1)} ${getY(minY).toFixed(1)} Z`;

  // Generate SVG path for scenario if present
  let scenarioPath = '';
  if (scenarioDays && scenarioDays.length === baselineDays.length) {
    scenarioPath = scenarioDays
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.closingBalance).toFixed(1)}`)
      .join(' ');
  }

  const activeDay = hoverIndex !== null ? baselineDays[hoverIndex] : baselineDays[0];
  const activeScenarioDay = hoverIndex !== null && scenarioDays ? scenarioDays[hoverIndex] : undefined;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
            <span className="text-slate-700 font-semibold">Baseline Cash Forecast</span>
          </span>
          {scenarioDays && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-dashed rounded"></span>
              <span className="text-amber-800 font-semibold">What-If Scenario</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 border-dashed rounded"></span>
            <span>$0 Solvency Line</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border-dotted rounded"></span>
            <span>Min Reserve (${minCashReserve.toLocaleString()})</span>
          </span>
        </div>

        {activeDay && (
          <div className="text-right text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">{activeDay.date} ({activeDay.dayOfWeek}): </span>
            <span className={activeDay.closingBalance < 0 ? 'text-rose-600 font-bold' : activeDay.closingBalance < minCashReserve ? 'text-amber-600 font-bold' : 'text-emerald-700 font-bold'}>
              ${activeDay.closingBalance.toLocaleString()}
            </span>
            {activeScenarioDay && (
              <span className="text-amber-700 ml-2">
                (Scenario: ${activeScenarioDay.closingBalance.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="deficitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x={paddingX - 4} y={zeroY + 3} textAnchor="end" className="text-[10px] fill-rose-600 font-semibold">
            $0
          </text>

          {reserveY >= paddingY && reserveY <= chartHeight - paddingY && (
            <>
              <line
                x1={paddingX}
                y1={reserveY}
                x2={width - paddingX}
                y2={reserveY}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <text x={paddingX - 4} y={reserveY + 3} textAnchor="end" className="text-[10px] fill-amber-600 font-medium">
                ${minCashReserve >= 1000 ? `${(minCashReserve / 1000).toFixed(0)}k` : minCashReserve}
              </text>
            </>
          )}

          {/* Area under baseline */}
          <path d={baselineArea} fill="url(#baselineGradient)" />

          {/* Scenario Line */}
          {scenarioPath && (
            <path
              d={scenarioPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}

          {/* Baseline Line */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points & hover triggers */}
          {baselineDays.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.closingBalance);
            const isNegative = d.closingBalance < 0;
            const isBelowRes = d.closingBalance < minCashReserve;
            const isHovered = hoverIndex === i;

            return (
              <g key={d.date}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={chartHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : isNegative ? 4.5 : isBelowRes ? 3.5 : 2.5}
                  fill={isNegative ? '#dc2626' : isBelowRes ? '#d97706' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1.5}
                />

                {/* Invisible hover zone */}
                <rect
                  x={cx - (innerW / baselineDays.length) / 2}
                  y={paddingY}
                  width={innerW / baselineDays.length}
                  height={innerH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            );
          })}

          {/* Date labels at intervals */}
          {baselineDays.map((d, i) => {
            if (i % Math.ceil(baselineDays.length / 7) !== 0 && i !== baselineDays.length - 1) return null;
            const cx = getX(i);
            return (
              <text
                key={`label-${d.date}`}
                x={cx}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 font-medium"
              >
                {d.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
