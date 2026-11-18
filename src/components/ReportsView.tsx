import React from 'react';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, Transaction } from '../types/cashflow';

interface ReportsViewProps {
  profile: BusinessProfile;
  summary: ForecastSummary;
  transactions: Transaction[];
  onExportCSV: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  profile,
  summary,
  transactions,
  onExportCSV,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ profile, summary, transactions }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cashflow_guardian_report_${summary.startDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Missing or outdated data warnings
  const warnings: string[] = [];
  const overdueTxs = transactions.filter((t) => t.type === 'inflow' && t.isOverdue);
  if (overdueTxs.length > 0) {
    warnings.push(`${overdueTxs.length} customer invoice(s) are past their payment due date without received funds.`);
  }

  const missingDueDate = transactions.filter((t) => !t.date);
  if (missingDueDate.length > 0) {
    warnings.push(`${missingDueDate.length} transaction(s) have incomplete dates.`);
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Executive Cash-Flow Brief & Audit</span>
          </h2>
          <p className="text-xs text-slate-400">
            Exportable solvency analysis, stress test audit, and data health verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={onExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Data Health & Warnings Panel */}
      {warnings.length > 0 && (
        <div className="bg-amber-950/25 border border-amber-500/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Data Health & Outdated Records Notice</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            {warnings.map((w, idx) => (
              <li key={idx} className="leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formal Printable Document Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6 print:bg-white print:text-black print:border-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 print:border-slate-300 gap-2">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest print:text-blue-600">
              CashFlow Guardian AI • Predictive Report
            </div>
            <h1 className="text-xl font-black text-white print:text-black mt-0.5">
              {profile.businessName}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Forecast Horizon: {summary.startDate} to {summary.endDate} (35 Days)
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="text-slate-400 print:text-slate-600">Generated: {new Date().toLocaleDateString()}</div>
            <div className="font-bold text-white print:text-black">
              Bank Cleared Cash: ${profile.currentCashBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-800/60 rounded-xl print:bg-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Financial Status</div>
            <div className={`text-base font-extrabold ${summary.healthStatus === 'Critical Shortage' ? 'text-rose-400 print:text-rose-600' : 'text-emerald-400 print:text-emerald-600'}`}>
              {summary.healthStatus}
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl print:bg-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Runway to $0</div>
            <div className="text-base font-extrabold text-white print:text-black">
              {summary.runwayDays} Days
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl print:bg-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Scheduled Inflows</div>
            <div className="text-base font-extrabold text-emerald-400 print:text-emerald-600">
              +${summary.totalExpectedReceipts.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl print:bg-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Scheduled Outflows</div>
            <div className="text-base font-extrabold text-rose-400 print:text-rose-600">
              -${summary.totalUpcomingExpenses.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Shortage Analysis Paragraph */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
            Shortage Timing & Vulnerability Analysis
          </h3>
          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            {summary.healthExplanation}
          </p>

          {summary.firstZeroShortageDate && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 print:text-rose-800">
              <strong>Shortage Projection: </strong>
              On <strong>{summary.firstZeroShortageDate}</strong>, the cash balance drops to -$
              {summary.firstZeroShortageAmount.toLocaleString()}. Primary drivers include large immediate bills falling due before expected customer receivables settle.
            </div>
          )}
        </div>

        {/* Confidence Assessment Factor Details */}
        <div className="space-y-3 pt-3 border-t border-slate-800 print:border-slate-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
              Data Confidence & Integrity Audit
            </h3>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800">
              Confidence Score: {summary.confidence.score}/100 ({summary.confidence.level})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {summary.confidence.factors.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-800/50 print:bg-slate-50 border border-slate-700/60 print:border-slate-200">
                <div className="font-semibold text-white print:text-black">{f.label}</div>
                <div className="text-[11px] text-slate-400 print:text-slate-600">{f.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
