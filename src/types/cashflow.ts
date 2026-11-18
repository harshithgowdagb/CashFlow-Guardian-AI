/**
 * Types for CashFlow Guardian AI
 */

export type TransactionType = 'inflow' | 'outflow';

export type TransactionCategory =
  | 'customer_payment'
  | 'cash_sales'
  | 'supplier_bill'
  | 'payroll'
  | 'loan_instalment'
  | 'operating_expense'
  | 'tax'
  | 'other';

export type TransactionStatus =
  | 'actual'     // Cleared / received / paid
  | 'expected'   // Invoiced / scheduled with firm due date
  | 'estimated'; // Recurring projection / speculative

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  party: string;             // Customer name or Vendor/Payee name
  description: string;
  amount: number;            // Must be positive number
  date: string;              // YYYY-MM-DD
  dueDate?: string;          // For invoices
  invoiceNumber?: string;
  contactPhone?: string;     // Customer phone for WhatsApp payment follow-up
  contactEmail?: string;
  isOverdue?: boolean;
  notes?: string;
}

export interface BusinessProfile {
  businessName: string;
  currentCashBalance: number;
  lastReconciledDate: string;
  minCashReserve: number;
  currency: string;
  ownerPhone?: string;
  dashboardUrl?: string;
}

export interface ScenarioModifiers {
  customerDelayDays: number;       // 0, 7, 15, 30
  salesReductionPct: number;       // 0, 10, 20, 30
  unexpectedExpenseAmount: number; // e.g. 2500
  unexpectedExpenseDate: string;   // YYYY-MM-DD
  supplierCostIncreasePct: number; // e.g. 10
  supplierPaymentDelayDays: number;// e.g. 14 (defer payables)
}

export interface RecoveryAction {
  id: string;
  title: string;
  category:
    | 'receivable_acceleration'
    | 'supplier_negotiation'
    | 'discretionary_cut'
    | 'capex_postponement'
    | 'partial_payment';
  description: string;
  assumptions: string;
  disclaimer: string;
  estimatedCashImpact: number;
  timelineDays: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  targetParty?: string;
  applied: boolean;
}

export interface ForecastDay {
  date: string;
  dayOfWeek: string;
  inflowsActual: number;
  inflowsExpected: number;
  inflowsEstimated: number;
  outflowsActual: number;
  outflowsExpected: number;
  outflowsEstimated: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  closingBalance: number;
  isBelowZero: boolean;
  isBelowReserve: boolean;
  shortageBelowZero: number;
  shortageBelowReserve: number;
  keyEvents: {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    status: TransactionStatus;
    party: string;
  }[];
}

export interface CulpritTransaction {
  id: string;
  party: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'delayed_income';
  reason: string;
}

export interface ConfidenceAssessment {
  score: number;           // 0 - 100 based on rigorous heuristics
  level: 'High' | 'Medium' | 'Low';
  factors: {
    label: string;
    status: 'positive' | 'warning' | 'negative';
    detail: string;
  }[];
}

export interface ForecastSummary {
  startDate: string;
  endDate: string;
  currentCash: number;
  minCashReserve: number;
  totalActualReceived: number;
  totalExpectedReceipts: number;
  totalOutstandingReceivables: number;
  totalUpcomingExpenses: number;
  breakdownByExpenseCategory: Record<TransactionCategory, number>;
  minProjectedBalance: number;
  minProjectedDate: string;
  firstZeroShortageDate: string | null;
  firstZeroShortageAmount: number;
  firstReserveShortageDate: string | null;
  firstReserveShortageAmount: number;
  culprits: CulpritTransaction[];
  runwayDays: number;
  healthStatus: 'Healthy' | 'Tight Liquidity' | 'Critical Shortage';
  healthExplanation: string;
  confidence: ConfidenceAssessment;
  days: ForecastDay[];
}
