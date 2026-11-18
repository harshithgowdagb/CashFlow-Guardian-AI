/**
 * CashFlow Guardian AI — Calculation Engine & Predictive Shortage Logic
 * Pure, deterministic functions decoupled from UI for strict unit-testability.
 */

import {
  BusinessProfile,
  ConfidenceAssessment,
  CulpritTransaction,
  ForecastDay,
  ForecastSummary,
  RecoveryAction,
  ScenarioModifiers,
  Transaction,
  TransactionCategory,
  TransactionType
} from '../types/cashflow';

// Helper to format ISO date string
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function diffDays(dateA: string, dateB: string): number {
  const da = parseDate(dateA).getTime();
  const db = parseDate(dateB).getTime();
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

export const DEFAULT_SCENARIOS: ScenarioModifiers = {
  customerDelayDays: 0,
  salesReductionPct: 0,
  unexpectedExpenseAmount: 0,
  unexpectedExpenseDate: '',
  supplierCostIncreasePct: 0,
  supplierPaymentDelayDays: 0,
};

/**
 * Applies What-if scenarios and Recovery Actions to a single transaction
 */
export function transformTransaction(
  tx: Transaction,
  scenario: ScenarioModifiers,
  appliedActions: RecoveryAction[]
): Transaction[] {
  let effectiveTx: Transaction = { ...tx };

  // 1. What-If Scenario: Customer payment delays (shifts expected / estimated inflows)
  if (effectiveTx.type === 'inflow' && effectiveTx.status !== 'actual') {
    if (scenario.customerDelayDays > 0) {
      effectiveTx.date = addDays(effectiveTx.date, scenario.customerDelayDays);
    }
    if (scenario.salesReductionPct > 0) {
      const factor = (100 - scenario.salesReductionPct) / 100;
      effectiveTx.amount = Math.round(effectiveTx.amount * factor * 100) / 100;
    }
  }

  // 2. What-If Scenario: Supplier costs & payment shifts
  if (effectiveTx.type === 'outflow' && effectiveTx.category === 'supplier_bill') {
    if (scenario.supplierCostIncreasePct > 0) {
      const factor = (100 + scenario.supplierCostIncreasePct) / 100;
      effectiveTx.amount = Math.round(effectiveTx.amount * factor * 100) / 100;
    }
    if (scenario.supplierPaymentDelayDays > 0 && effectiveTx.status !== 'actual') {
      effectiveTx.date = addDays(effectiveTx.date, scenario.supplierPaymentDelayDays);
    }
  }

  // 3. Recovery Actions modifications
  for (const action of appliedActions) {
    if (!action.applied) continue;

    // Discretionary spending reduction (25% off operating expenses)
    if (
      action.category === 'discretionary_cut' &&
      effectiveTx.category === 'operating_expense' &&
      effectiveTx.status !== 'actual'
    ) {
      effectiveTx.amount = Math.round(effectiveTx.amount * 0.75 * 100) / 100;
    }

    // Postpone Capex / Equipment purchase
    if (
      action.category === 'capex_postponement' &&
      effectiveTx.description.toLowerCase().includes('equipment') &&
      effectiveTx.status !== 'actual'
    ) {
      // Delay capex by 30 days
      effectiveTx.date = addDays(effectiveTx.date, 30);
    }

    // Supplier negotiation (delay supplier bills by 14 days)
    if (
      action.category === 'supplier_negotiation' &&
      effectiveTx.category === 'supplier_bill' &&
      effectiveTx.status !== 'actual'
    ) {
      effectiveTx.date = addDays(effectiveTx.date, 14);
    }

    // Partial customer payment: accelerate 50% of invoice to 2 days from now
    if (
      action.category === 'partial_payment' &&
      action.targetParty &&
      effectiveTx.party.toLowerCase().includes(action.targetParty.toLowerCase()) &&
      effectiveTx.type === 'inflow' &&
      effectiveTx.status !== 'actual'
    ) {
      const halfAmount = Math.round((effectiveTx.amount / 2) * 100) / 100;
      const acceleratedPart: Transaction = {
        ...effectiveTx,
        id: `${effectiveTx.id}-part1`,
        description: `${effectiveTx.description} (50% Expedited Advance)`,
        amount: halfAmount,
        date: addDays(formatDate(new Date()), 2), // 2 days turnaround
      };
      const remainingPart: Transaction = {
        ...effectiveTx,
        id: `${effectiveTx.id}-part2`,
        description: `${effectiveTx.description} (50% Balance on Term)`,
        amount: effectiveTx.amount - halfAmount,
      };
      return [acceleratedPart, remainingPart];
    }
  }

  return [effectiveTx];
}

/**
 * Evaluates forecast confidence and transparency audit factors
 */
export function assessConfidence(
  profile: BusinessProfile,
  transactions: Transaction[],
  todayStr: string
): ConfidenceAssessment {
  const factors: { label: string; status: 'positive' | 'warning' | 'negative'; detail: string }[] = [];
  let score = 100;

  // 1. Bank Reconciliation freshness
  const daysSinceReconciliation = diffDays(todayStr, profile.lastReconciledDate);
  if (daysSinceReconciliation <= 2) {
    factors.push({
      label: 'Bank Reconciliation Fresh',
      status: 'positive',
      detail: `Current cash reconciled ${daysSinceReconciliation} day(s) ago (${profile.lastReconciledDate}).`,
    });
  } else if (daysSinceReconciliation <= 7) {
    factors.push({
      label: 'Bank Reconciliation Acceptable',
      status: 'warning',
      detail: `Reconciled ${daysSinceReconciliation} days ago. Consider linking fresh bank statement.`,
    });
    score -= 10;
  } else {
    factors.push({
      label: 'Outdated Bank Balance',
      status: 'negative',
      detail: `Bank balance was last reconciled ${daysSinceReconciliation} days ago. Shortage dates may shift.`,
    });
    score -= 25;
  }

  // 2. Overdue Receivables check
  const overdueTxs = transactions.filter(
    (t) => t.type === 'inflow' && t.status !== 'actual' && t.date < todayStr
  );
  if (overdueTxs.length === 0) {
    factors.push({
      label: 'No Overdue Receivables',
      status: 'positive',
      detail: 'All customer invoices are scheduled in the future with no past-due debt.',
    });
  } else {
    const overdueTotal = overdueTxs.reduce((sum, t) => sum + t.amount, 0);
    factors.push({
      label: `${overdueTxs.length} Overdue Customer Invoices`,
      status: 'negative',
      detail: `$${overdueTotal.toLocaleString()} is past due. Late receipts weaken cash forecast reliability.`,
    });
    score -= Math.min(25, overdueTxs.length * 8);
  }

  // 3. Firm Expected vs Speculative Estimated ratio
  const futureInflows = transactions.filter(
    (t) => t.type === 'inflow' && t.date >= todayStr
  );
  const estimatedCount = futureInflows.filter((t) => t.status === 'estimated').length;
  const expectedCount = futureInflows.filter((t) => t.status === 'expected').length;
  const totalFutureInflows = futureInflows.length;

  if (totalFutureInflows > 0) {
    const firmRatio = expectedCount / totalFutureInflows;
    if (firmRatio >= 0.7) {
      factors.push({
        label: 'High Invoicing Certainty',
        status: 'positive',
        detail: `${Math.round(firmRatio * 100)}% of future receipts are backed by formal issued invoices.`,
      });
    } else {
      factors.push({
        label: 'High Speculative Inflows',
        status: 'warning',
        detail: `${estimatedCount} of ${totalFutureInflows} future receipts are estimates without signed invoices.`,
      });
      score -= 15;
    }
  } else {
    factors.push({
      label: 'No Future Inflows Recorded',
      status: 'warning',
      detail: 'Forecast relies entirely on existing cash reserve without recorded future customer sales.',
    });
    score -= 15;
  }

  // 4. Expense Schedule coverage
  const futureOutflows = transactions.filter(
    (t) => t.type === 'outflow' && t.date >= todayStr
  );
  const hasPayroll = futureOutflows.some((t) => t.category === 'payroll');
  const hasSuppliers = futureOutflows.some((t) => t.category === 'supplier_bill');

  if (hasPayroll && hasSuppliers) {
    factors.push({
      label: 'Comprehensive Expense Schedule',
      status: 'positive',
      detail: 'Payroll commitments, supplier bills, and recurring operating overhead are scheduled.',
    });
  } else {
    factors.push({
      label: 'Missing Expense Categories',
      status: 'warning',
      detail: `${!hasPayroll ? 'Payroll ' : ''}${!hasSuppliers ? 'Supplier bills ' : ''}not scheduled in forecast window.`,
    });
    score -= 10;
  }

  const finalScore = Math.max(20, Math.min(98, score));
  const level = finalScore >= 80 ? 'High' : finalScore >= 55 ? 'Medium' : 'Low';

  return {
    score: finalScore,
    level,
    factors,
  };
}

/**
 * Calculates day-by-day cash forecast, shortage date/amount, and root culprits
 */
export function calculateForecast(
  profile: BusinessProfile,
  transactions: Transaction[],
  options?: {
    startDate?: string;
    horizonDays?: number;
    scenario?: ScenarioModifiers;
    appliedActions?: RecoveryAction[];
  }
): ForecastSummary {
  const todayStr = options?.startDate || formatDate(new Date());
  const horizonDays = options?.horizonDays || 35; // Default 5 weeks
  const scenario = options?.scenario || DEFAULT_SCENARIOS;
  const appliedActions = options?.appliedActions || [];

  // Transform transactions based on scenarios and actions
  const effectiveTransactions: Transaction[] = [];
  for (const tx of transactions) {
    const transformed = transformTransaction(tx, scenario, appliedActions);
    effectiveTransactions.push(...transformed);
  }

  // Inject unexpected expense scenario if present
  if (
    scenario.unexpectedExpenseAmount > 0 &&
    scenario.unexpectedExpenseDate &&
    scenario.unexpectedExpenseDate >= todayStr
  ) {
    effectiveTransactions.push({
      id: 'unexpected-scenario-expense',
      type: 'outflow',
      category: 'operating_expense',
      status: 'estimated',
      party: 'Scenario Simulator',
      description: `Simulated Unexpected Outflow: $${scenario.unexpectedExpenseAmount.toLocaleString()}`,
      amount: scenario.unexpectedExpenseAmount,
      date: scenario.unexpectedExpenseDate,
    });
  }

  // Aggregate metrics
  let totalActualReceived = 0;
  let totalExpectedReceipts = 0;
  let totalOutstandingReceivables = 0;
  let totalUpcomingExpenses = 0;

  const breakdownByExpenseCategory: Record<TransactionCategory, number> = {
    customer_payment: 0,
    cash_sales: 0,
    supplier_bill: 0,
    payroll: 0,
    loan_instalment: 0,
    operating_expense: 0,
    tax: 0,
    other: 0,
  };

  for (const t of effectiveTransactions) {
    if (t.type === 'inflow') {
      if (t.status === 'actual') {
        totalActualReceived += t.amount;
      } else {
        totalExpectedReceipts += t.amount;
        if (t.category === 'customer_payment' || t.status === 'expected') {
          totalOutstandingReceivables += t.amount;
        }
      }
    } else {
      if (t.date >= todayStr) {
        totalUpcomingExpenses += t.amount;
        breakdownByExpenseCategory[t.category] = (breakdownByExpenseCategory[t.category] || 0) + t.amount;
      }
    }
  }

  // Map dates to daily arrays
  const days: ForecastDay[] = [];
  let runningBalance = profile.currentCashBalance;
  let minProjectedBalance = runningBalance;
  let minProjectedDate = todayStr;

  let firstZeroShortageDate: string | null = null;
  let firstZeroShortageAmount = 0;

  let firstReserveShortageDate: string | null = null;
  let firstReserveShortageAmount = 0;

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < horizonDays; i++) {
    const dateStr = addDays(todayStr, i);
    const dayDate = parseDate(dateStr);
    const dayOfWeek = weekdayNames[dayDate.getDay()];

    // Find transactions falling on this day
    const dayTxs = effectiveTransactions.filter((t) => t.date === dateStr);

    let inflowsActual = 0;
    let inflowsExpected = 0;
    let inflowsEstimated = 0;
    let outflowsActual = 0;
    let outflowsExpected = 0;
    let outflowsEstimated = 0;

    const keyEvents: ForecastDay['keyEvents'] = [];

    for (const tx of dayTxs) {
      if (tx.type === 'inflow') {
        if (tx.status === 'actual') inflowsActual += tx.amount;
        else if (tx.status === 'expected') inflowsExpected += tx.amount;
        else inflowsEstimated += tx.amount;
      } else {
        if (tx.status === 'actual') outflowsActual += tx.amount;
        else if (tx.status === 'expected') outflowsExpected += tx.amount;
        else outflowsEstimated += tx.amount;
      }

      keyEvents.push({
        id: tx.id,
        title: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        status: tx.status,
        party: tx.party,
      });
    }

    const totalInflows = inflowsActual + inflowsExpected + inflowsEstimated;
    const totalOutflows = outflowsActual + outflowsExpected + outflowsEstimated;
    const netCashFlow = totalInflows - totalOutflows;

    runningBalance = Math.round((runningBalance + netCashFlow) * 100) / 100;

    if (runningBalance < minProjectedBalance) {
      minProjectedBalance = runningBalance;
      minProjectedDate = dateStr;
    }

    const isBelowZero = runningBalance < 0;
    const isBelowReserve = runningBalance < profile.minCashReserve;
    const shortageBelowZero = isBelowZero ? Math.abs(runningBalance) : 0;
    const shortageBelowReserve = isBelowReserve ? profile.minCashReserve - runningBalance : 0;

    if (isBelowZero && !firstZeroShortageDate) {
      firstZeroShortageDate = dateStr;
      firstZeroShortageAmount = shortageBelowZero;
    }

    if (isBelowReserve && !firstReserveShortageDate) {
      firstReserveShortageDate = dateStr;
      firstReserveShortageAmount = shortageBelowReserve;
    }

    days.push({
      date: dateStr,
      dayOfWeek,
      inflowsActual,
      inflowsExpected,
      inflowsEstimated,
      outflowsActual,
      outflowsExpected,
      outflowsEstimated,
      totalInflows,
      totalOutflows,
      netCashFlow,
      closingBalance: runningBalance,
      isBelowZero,
      isBelowReserve,
      shortageBelowZero,
      shortageBelowReserve,
      keyEvents,
    });
  }

  // Identify root causes / culprits
  const culprits: CulpritTransaction[] = [];
  const targetShortageDate = firstZeroShortageDate || firstReserveShortageDate;

  if (targetShortageDate) {
    // Culprit 1: Large outflows scheduled on or before the shortage date
    const priorOutflows = effectiveTransactions
      .filter((t) => t.type === 'outflow' && t.date >= todayStr && t.date <= targetShortageDate)
      .sort((a, b) => b.amount - a.amount);

    for (const out of priorOutflows.slice(0, 3)) {
      culprits.push({
        id: out.id,
        party: out.party,
        description: out.description,
        amount: out.amount,
        date: out.date,
        type: 'expense',
        reason: `${out.category.replace('_', ' ').toUpperCase()} due on ${out.date} drains liquid cash reserve before receipts clear.`,
      });
    }

    // Culprit 2: Invoices that arrive AFTER the shortage date (timing mismatch)
    const delayedInflows = effectiveTransactions
      .filter((t) => t.type === 'inflow' && t.date > targetShortageDate)
      .sort((a, b) => b.amount - a.amount);

    for (const inf of delayedInflows.slice(0, 2)) {
      culprits.push({
        id: inf.id,
        party: inf.party,
        description: inf.description,
        amount: inf.amount,
        date: inf.date,
        type: 'delayed_income',
        reason: `Expected receipt from ${inf.party} ($${inf.amount.toLocaleString()}) arrives on ${inf.date}, too late to cover commitments on ${targetShortageDate}.`,
      });
    }
  }

  // Calculate Runway Days
  let runwayDays = horizonDays;
  for (let i = 0; i < days.length; i++) {
    if (days[i].closingBalance <= 0) {
      runwayDays = i;
      break;
    }
  }

  // Financial Health Status
  let healthStatus: ForecastSummary['healthStatus'] = 'Healthy';
  let healthExplanation = 'Cash reserves remain comfortably above safety thresholds across the forecast horizon.';

  if (firstZeroShortageDate) {
    healthStatus = 'Critical Shortage';
    healthExplanation = `Cash balance turns negative (-$${firstZeroShortageAmount.toLocaleString()}) on ${firstZeroShortageDate}. Immediate recovery actions required.`;
  } else if (firstReserveShortageDate) {
    healthStatus = 'Tight Liquidity';
    healthExplanation = `Cash dips below your $${profile.minCashReserve.toLocaleString()} minimum safety buffer on ${firstReserveShortageDate}.`;
  }

  const confidence = assessConfidence(profile, transactions, todayStr);

  return {
    startDate: todayStr,
    endDate: addDays(todayStr, horizonDays - 1),
    currentCash: profile.currentCashBalance,
    minCashReserve: profile.minCashReserve,
    totalActualReceived,
    totalExpectedReceipts,
    totalOutstandingReceivables,
    totalUpcomingExpenses,
    breakdownByExpenseCategory,
    minProjectedBalance,
    minProjectedDate,
    firstZeroShortageDate,
    firstZeroShortageAmount,
    firstReserveShortageDate,
    firstReserveShortageAmount,
    culprits,
    runwayDays,
    healthStatus,
    healthExplanation,
    confidence,
    days,
  };
}

/**
 * WhatsApp Cash Alert Generator
 * Produces structured message with exact required fields & click-to-chat URL.
 */
export function generateWhatsAppAlert(
  profile: BusinessProfile,
  summary: ForecastSummary,
  topActions: RecoveryAction[]
): {
  messageText: string;
  whatsappUrl: string;
  recipientPhone: string;
} {
  const recipientPhone = profile.ownerPhone || '';
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

  const shortagePredicted = summary.firstZeroShortageDate !== null || summary.firstReserveShortageDate !== null;
  const shortageDate = summary.firstZeroShortageDate || summary.firstReserveShortageDate || 'None in next 35 days';
  const shortageAmount = summary.firstZeroShortageDate
    ? summary.firstZeroShortageAmount
    : summary.firstReserveShortageAmount;

  const culpritDetail = summary.culprits.length > 0
    ? summary.culprits[0].reason
    : 'Balanced cash flow with healthy buffer.';

  // Pick top 3 recommendations
  const actionList = topActions.slice(0, 3).map((a, idx) => {
    return `${idx + 1}. *${a.title}*: ${a.description} (Est. +$${a.estimatedCashImpact.toLocaleString()})`;
  });

  const dashboardLink = profile.dashboardUrl || 'https://cashflow-guardian.applet.local';

  let messageText = '';

  if (shortagePredicted) {
    messageText = [
      `🚨 *CASH-FLOW DEFICIT ALERT — ${profile.businessName.toUpperCase()}*`,
      `----------------------------------------`,
      `⚠️ *Status:* ${summary.healthStatus.toUpperCase()}`,
      `💰 *Current Available Cash:* $${profile.currentCashBalance.toLocaleString()}`,
      `📉 *Predicted Shortage Date:* ${shortageDate}`,
      `💥 *Estimated Deficit Amount:* $${shortageAmount.toLocaleString()}`,
      `----------------------------------------`,
      `📊 *Period Outlook:*`,
      `• Expected Receipts: $${summary.totalExpectedReceipts.toLocaleString()}`,
      `• Upcoming Expenses: $${summary.totalUpcomingExpenses.toLocaleString()}`,
      `• Min Safety Reserve: $${profile.minCashReserve.toLocaleString()}`,
      `----------------------------------------`,
      `🔍 *Primary Root Cause:*`,
      `${culpritDetail}`,
      `----------------------------------------`,
      `🎯 *Top 3 Recommended Recovery Actions:*`,
      actionList.join('\n'),
      `----------------------------------------`,
      `🌐 *Live Interactive Dashboard:*`,
      `${dashboardLink}`,
      `\n_Generated securely by CashFlow Guardian AI._`,
    ].join('\n');
  } else {
    messageText = [
      `✅ *CASH-FLOW HEALTH UPDATE — ${profile.businessName.toUpperCase()}*`,
      `----------------------------------------`,
      `🟢 *Status:* Healthy Runway (${summary.runwayDays}+ days)`,
      `💰 *Current Available Cash:* $${profile.currentCashBalance.toLocaleString()}`,
      `🛡️ *Minimum Cash Buffer:* $${profile.minCashReserve.toLocaleString()}`,
      `📈 *Lowest Projected Balance:* $${summary.minProjectedBalance.toLocaleString()} on ${summary.minProjectedDate}`,
      `----------------------------------------`,
      `📊 *Upcoming 35 Days:*`,
      `• Expected Receipts: $${summary.totalExpectedReceipts.toLocaleString()}`,
      `• Upcoming Outflows: $${summary.totalUpcomingExpenses.toLocaleString()}`,
      `----------------------------------------`,
      `🌐 *Review Full Forecast:*`,
      `${dashboardLink}`,
    ].join('\n');
  }

  // Proper URL encoding for WhatsApp Click-to-Chat protocol
  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return {
    messageText,
    whatsappUrl,
    recipientPhone,
  };
}

/**
 * Generates an Overdue Invoice Follow-Up WhatsApp message
 */
export function generateOverduePaymentMessage(
  profile: BusinessProfile,
  tx: Transaction
): {
  messageText: string;
  whatsappUrl: string;
} {
  const cleanPhone = (tx.contactPhone || '').replace(/[^0-9]/g, '');
  const invoiceNum = tx.invoiceNumber ? `Invoice #${tx.invoiceNumber}` : `Invoice for ${tx.description}`;

  const messageText = [
    `Dear ${tx.party},`,
    ``,
    `Hope you are having a productive week!`,
    ``,
    `This is a friendly reminder from *${profile.businessName}* regarding *${invoiceNum}* in the amount of *$${tx.amount.toLocaleString()}*, which had an agreed due date of *${tx.date}*.`,
    ``,
    `To ensure smooth continuation of accounts, could you kindly confirm when the remittance will be processed? If you need a duplicate copy of the invoice or banking details, please let us know.`,
    ``,
    `Thank you for your valued business!`,
    `Warm regards,`,
    `*${profile.businessName} Accounts Team*`,
  ].join('\n');

  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return { messageText, whatsappUrl };
}
