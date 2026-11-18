import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateForecast,
  DEFAULT_SCENARIOS,
  generateWhatsAppAlert,
  generateOverduePaymentMessage,
  addDays,
  diffDays,
} from './engine';
import { BusinessProfile, RecoveryAction, Transaction } from '../types/cashflow';

const mockProfile: BusinessProfile = {
  businessName: 'Apex Artisan Roasters',
  currentCashBalance: 12000,
  lastReconciledDate: '2026-10-23',
  minCashReserve: 5000,
  currency: '$',
  ownerPhone: '+1 (555) 234-5678',
  dashboardUrl: 'https://ais-dev-othpqex7aqrspk6cyw2t4v-474852656497.asia-southeast1.run.app',
};

const mockTransactions: Transaction[] = [
  // Outflow 1: Payroll on Day 3 ($7,000)
  {
    id: 'tx-1',
    type: 'outflow',
    category: 'payroll',
    status: 'expected',
    party: 'Bi-Weekly Staff Payroll',
    description: 'Store & Roastery Payroll',
    amount: 7000,
    date: '2026-10-27',
  },
  // Outflow 2: Green Coffee Beans Supplier on Day 5 ($8,500)
  {
    id: 'tx-2',
    type: 'outflow',
    category: 'supplier_bill',
    status: 'expected',
    party: 'Origin Green Importers',
    description: 'Bulk Specialty Arabica Lot',
    amount: 8500,
    date: '2026-10-29',
  },
  // Inflow 1: Major Wholesale Customer on Day 10 ($14,000)
  {
    id: 'tx-3',
    type: 'inflow',
    category: 'customer_payment',
    status: 'expected',
    party: 'Metro Coffee Bars Network',
    description: 'Wholesale Quarterly Supply Invoice #108',
    amount: 14000,
    date: '2026-11-03',
    invoiceNumber: 'INV-108',
  },
  // Outflow 3: Commercial Roaster Lease on Day 12 ($3,000)
  {
    id: 'tx-4',
    type: 'outflow',
    category: 'loan_instalment',
    status: 'expected',
    party: 'EquipLease Capital',
    description: 'Loring S35 Roaster Lease',
    amount: 3000,
    date: '2026-11-05',
  },
];

test('calculateForecast calculates correct daily balances without pre-crediting future receivables', () => {
  const result = calculateForecast(mockProfile, mockTransactions, {
    startDate: '2026-10-24',
    horizonDays: 15,
  });

  // Day 0 (2026-10-24): initial cash is 12000
  assert.equal(result.days[0].closingBalance, 12000);

  // Before Payroll: Day 0, Day 1, Day 2 balance is 12000
  assert.equal(result.days[1].closingBalance, 12000);
  assert.equal(result.days[2].closingBalance, 12000);

  // Day 3 (2026-10-27): Payroll ($7,000) deducted -> balance is 5000
  const day3 = result.days.find((d) => d.date === '2026-10-27');
  assert.ok(day3);
  assert.equal(day3.closingBalance, 5000);

  // Day 5 (2026-10-29): Supplier ($8,500) deducted -> balance is 5000 - 8500 = -3500!
  const day5 = result.days.find((d) => d.date === '2026-10-29');
  assert.ok(day5);
  assert.equal(day5.closingBalance, -3500);
  assert.equal(day5.isBelowZero, true);

  // First zero shortage identified accurately on Day 5
  assert.equal(result.firstZeroShortageDate, '2026-10-29');
  assert.equal(result.firstZeroShortageAmount, 3500);

  // First reserve shortage was reached when balance dropped to <= 5000 (Day 3 at 5000 or below min reserve 5000)
  assert.ok(result.firstReserveShortageDate !== null);

  // Inflow does NOT arrive until 2026-11-03: verifies customer payments are never treated as money already received
  const dayBeforeInflow = result.days.find((d) => d.date === '2026-11-02');
  assert.ok(dayBeforeInflow);
  assert.equal(dayBeforeInflow.closingBalance, -3500);

  // Day 10 (2026-11-03): Inflow arrives (+$14,000) -> balance becomes -3500 + 14000 = 10500
  const dayInflow = result.days.find((d) => d.date === '2026-11-03');
  assert.ok(dayInflow);
  assert.equal(dayInflow.closingBalance, 10500);
});

test('What-If Scenario: Customer payment delay shifts receipt and deepens deficit', () => {
  const result = calculateForecast(mockProfile, mockTransactions, {
    startDate: '2026-10-24',
    horizonDays: 25,
    scenario: {
      ...DEFAULT_SCENARIOS,
      customerDelayDays: 15, // Inflow pushed from Nov 3 to Nov 18
    },
  });

  // On Nov 5, Roaster Lease ($3000) hits without the Nov 3 inflow
  const nov5 = result.days.find((d) => d.date === '2026-11-05');
  assert.ok(nov5);
  // -3500 - 3000 = -6500 deficit
  assert.equal(nov5.closingBalance, -6500);
});

test('What-If Scenario: Sales reduction of 20% reduces receivable amount', () => {
  const result = calculateForecast(mockProfile, mockTransactions, {
    startDate: '2026-10-24',
    horizonDays: 15,
    scenario: {
      ...DEFAULT_SCENARIOS,
      salesReductionPct: 20, // $14,000 -> $11,200
    },
  });

  const dayInflow = result.days.find((d) => d.date === '2026-11-03');
  assert.ok(dayInflow);
  // -3500 + 11200 = 7700
  assert.equal(dayInflow.closingBalance, 7700);
});

test('Recovery Action: Applying supplier negotiation postpones supplier bill', () => {
  const supplierNegotiationAction: RecoveryAction = {
    id: 'act-1',
    title: 'Negotiate Supplier Bill (+14 Days)',
    category: 'supplier_negotiation',
    description: 'Postpone Origin Green Importers bill by 14 days',
    assumptions: 'Vendor agrees to net-45 terms with no penalty',
    disclaimer: 'Subject to supplier approval',
    estimatedCashImpact: 8500,
    timelineDays: 1,
    riskLevel: 'Low',
    applied: true,
  };

  const result = calculateForecast(mockProfile, mockTransactions, {
    startDate: '2026-10-24',
    horizonDays: 15,
    appliedActions: [supplierNegotiationAction],
  });

  // Supplier bill postponed from 2026-10-29 to 2026-11-12.
  // On 2026-10-29, balance remains at 5000 (after payroll) instead of dropping to -3500!
  const day5 = result.days.find((d) => d.date === '2026-10-29');
  assert.ok(day5);
  assert.equal(day5.closingBalance, 5000);
  assert.equal(day5.isBelowZero, false);
});

test('WhatsApp Alert Generator produces complete message with proper URL encoding', () => {
  const summary = calculateForecast(mockProfile, mockTransactions, {
    startDate: '2026-10-24',
    horizonDays: 15,
  });

  const actions: RecoveryAction[] = [
    {
      id: 'act-1',
      title: 'Negotiate Supplier Deferral',
      category: 'supplier_negotiation',
      description: 'Request 14-day extension from Origin Green',
      assumptions: 'Supplier relationship is strong',
      disclaimer: 'Supplier may decline',
      estimatedCashImpact: 8500,
      timelineDays: 2,
      riskLevel: 'Low',
      applied: false,
    },
    {
      id: 'act-2',
      title: 'Request 50% Advance',
      category: 'partial_payment',
      description: 'Request early 50% deposit from Metro Coffee',
      assumptions: 'Client has liquidity',
      disclaimer: 'Client might request discount',
      estimatedCashImpact: 7000,
      timelineDays: 2,
      riskLevel: 'Medium',
      applied: false,
    },
  ];

  const alert = generateWhatsAppAlert(mockProfile, summary, actions);

  // Message verification
  assert.ok(alert.messageText.includes(mockProfile.businessName.toUpperCase()));
  assert.ok(alert.messageText.includes('CRITICAL SHORTAGE'));
  assert.ok(alert.messageText.includes('2026-10-29')); // Predicted shortage date
  assert.ok(alert.messageText.includes('3,500')); // Deficit amount
  assert.ok(alert.messageText.includes('Top 3 Recommended Recovery Actions'));
  assert.ok(alert.messageText.includes(mockProfile.dashboardUrl!));

  // WhatsApp click-to-chat URL verification
  assert.ok(alert.whatsappUrl.startsWith('https://api.whatsapp.com/send?'));
  assert.ok(alert.whatsappUrl.includes('phone=15552345678'));
  assert.ok(alert.whatsappUrl.includes('text='));
  // Ensure message is valid URI encoded (no naked spaces in query param)
  assert.ok(!alert.whatsappUrl.includes(' '));
});

test('Overdue Payment Follow-Up Message is formatted with customer and invoice details', () => {
  const overdueTx: Transaction = {
    id: 'tx-overdue',
    type: 'inflow',
    category: 'customer_payment',
    status: 'expected',
    party: 'Coastal Bistro Group',
    description: 'Catering and Bean Supply',
    amount: 3450,
    date: '2026-10-10',
    invoiceNumber: 'INV-094',
    contactPhone: '+1-555-987-6543',
  };

  const followUp = generateOverduePaymentMessage(mockProfile, overdueTx);
  assert.ok(followUp.messageText.includes('Coastal Bistro Group'));
  assert.ok(followUp.messageText.includes('INV-094'));
  assert.ok(followUp.messageText.includes('$3,450'));
  assert.ok(followUp.whatsappUrl.includes('phone=15559876543'));
});
