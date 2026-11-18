import React, { useState } from 'react';
import {
  PlusCircle,
  Download,
  Upload,
  Trash2,
  Edit,
  Send,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Transaction, TransactionCategory, TransactionStatus, TransactionType } from '../types/cashflow';

interface TransactionsManagerProps {
  transactions: Transaction[];
  onAddOrUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenOverdueReminder: (tx: Transaction) => void;
  onResetSampleData: () => void;
  onExportCSV: () => void;
  onImportCSV: (csvText: string) => void;
}

export const TransactionsManager: React.FC<TransactionsManagerProps> = ({
  transactions,
  onAddOrUpdateTransaction,
  onDeleteTransaction,
  onOpenOverdueReminder,
  onResetSampleData,
  onExportCSV,
  onImportCSV,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TransactionCategory>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('inflow');
  const [formCategory, setFormCategory] = useState<TransactionCategory>('customer_payment');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('expected');
  const [formParty, setFormParty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importError, setImportError] = useState('');

  const openAddModal = () => {
    setEditingTx(null);
    setFormType('inflow');
    setFormCategory('customer_payment');
    setFormStatus('expected');
    setFormParty('');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate('');
    setFormInvoiceNumber('');
    setFormPhone('');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormStatus(tx.status);
    setFormParty(tx.party);
    setFormDescription(tx.description);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date);
    setFormDueDate(tx.dueDate || '');
    setFormInvoiceNumber(tx.invoiceNumber || '');
    setFormPhone(tx.contactPhone || '');
    setFormNotes(tx.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(formAmount);
    if (!formParty.trim()) {
      setFormError('Party / Counterparty name is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be a positive number greater than zero.');
      return;
    }
    if (!formDate) {
      setFormError('A valid transaction date (YYYY-MM-DD) is required.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = formType === 'inflow' && formStatus !== 'actual' && formDate < todayStr;

    const newTx: Transaction = {
      id: editingTx ? editingTx.id : `tx-${Date.now()}`,
      type: formType,
      category: formCategory,
      status: formStatus,
      party: formParty.trim(),
      description: formDescription.trim() || formParty.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      date: formDate,
      dueDate: formDueDate || formDate,
      invoiceNumber: formInvoiceNumber.trim(),
      contactPhone: formPhone.trim(),
      isOverdue,
      notes: formNotes.trim(),
    };

    onAddOrUpdateTransaction(newTx);
    setIsModalOpen(false);
  };

  const handleImportSubmit = () => {
    setImportError('');
    if (!csvInput.trim()) {
      setImportError('Please paste valid CSV content.');
      return;
    }
    try {
      onImportCSV(csvInput);
      setIsImportModalOpen(false);
      setCsvInput('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse CSV.');
    }
  };

  // Filtered list
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        tx.party.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Transaction & Invoice Ledger</span>
            <span className="text-xs text-slate-400 font-normal">
              ({transactions.length} entries recorded)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Actual cleared payments, firm customer invoices, supplier POs, payroll, and recurring expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={onExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Download CSV export"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Import custom CSV transactions"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onResetSampleData}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Restore sample business data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sample</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search party, invoice #, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types (In & Out)</option>
            <option value="inflow">Inflows (Receipts)</option>
            <option value="outflow">Outflows (Payments)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="actual">Actual (Cleared)</option>
            <option value="expected">Expected (Invoiced)</option>
            <option value="estimated">Estimated (Projected)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="customer_payment">Customer Invoices</option>
            <option value="cash_sales">Walk-In Sales</option>
            <option value="supplier_bill">Supplier Bills</option>
            <option value="payroll">Payroll</option>
            <option value="loan_instalment">Loan Instalments</option>
            <option value="operating_expense">Operating Overhead</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Party & Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Invoice Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-sans">
                    No transactions match your search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-850/80 transition-colors ${
                      tx.isOverdue ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {tx.date}
                      {tx.isOverdue && (
                        <span className="block text-[10px] font-bold text-rose-400 font-sans">
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'inflow'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          tx.status === 'actual'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : tx.status === 'expected'
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-800/60'
                            : 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white text-xs">{tx.party}</div>
                      <div className="text-[11px] text-slate-400">{tx.description}</div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {tx.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {tx.invoiceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-xs whitespace-nowrap">
                      <span
                        className={tx.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'}
                      >
                        {tx.type === 'inflow' ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.isOverdue && (
                          <button
                            onClick={() => onOpenOverdueReminder(tx)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                            title="Send WhatsApp payment follow-up"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingTx ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Flow Type:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as TransactionType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="inflow">Inflow (Customer Receipt)</option>
                    <option value="outflow">Outflow (Expense / Bill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Certainty:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TransactionStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="actual">Actual (Cleared in Bank)</option>
                    <option value="expected">Expected (Invoiced / Firm Due Date)</option>
                    <option value="estimated">Estimated (Speculative / Budget)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TransactionCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="customer_payment">Customer Payment</option>
                    <option value="cash_sales">Cash Sales</option>
                    <option value="supplier_bill">Supplier Bill</option>
                    <option value="payroll">Staff Payroll</option>
                    <option value="loan_instalment">Loan / Lease Instalment</option>
                    <option value="operating_expense">Operating Overhead / Rent</option>
                    <option value="tax">Tax Remittance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Amount ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 4500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Party / Counterparty Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Grocers, Origin Imports, Staff Pool"
                  value={formParty}
                  onChange={(e) => setFormParty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Date (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Invoice / Reference #:</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2045"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Customer WhatsApp Phone (for follow-ups):</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description / Notes:</label>
                <input
                  type="text"
                  placeholder="Memo, line items, payment terms..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
                >
                  {editingTx ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Import CSV Transactions</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Paste CSV text with columns: <br />
                <code className="text-blue-300 font-mono text-[11px]">
                  Type, Category, Status, Date, Amount, Party, Description, InvoiceNumber
                </code>
              </p>

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
                  {importError}
                </div>
              )}

              <textarea
                rows={8}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={`inflow,customer_payment,expected,2026-11-05,5000,"Acme Corp","Coffee contract","INV-990"\noutflow,supplier_bill,expected,2026-11-08,3200,"EcoBags","Packaging","PO-112"`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
              >
                Load Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
