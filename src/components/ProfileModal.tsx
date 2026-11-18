import React, { useState } from 'react';
import { X, Building2, Wallet, Shield, Phone, Calendar, Globe } from 'lucide-react';
import { BusinessProfile } from '../types/cashflow';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSave: (updated: BusinessProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  if (!isOpen) return null;

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [currentCashBalance, setCurrentCashBalance] = useState(String(profile.currentCashBalance));
  const [minCashReserve, setMinCashReserve] = useState(String(profile.minCashReserve));
  const [lastReconciledDate, setLastReconciledDate] = useState(profile.lastReconciledDate);
  const [ownerPhone, setOwnerPhone] = useState(profile.ownerPhone || '');
  const [dashboardUrl, setDashboardUrl] = useState(profile.dashboardUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      businessName: businessName.trim() || 'My Business',
      currentCashBalance: Math.max(0, parseFloat(currentCashBalance) || 0),
      minCashReserve: Math.max(0, parseFloat(minCashReserve) || 0),
      lastReconciledDate: lastReconciledDate || new Date().toISOString().split('T')[0],
      ownerPhone: ownerPhone.trim(),
      dashboardUrl: dashboardUrl.trim() || window.location.origin,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Business Settings & Cash Reserves</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Business Legal Name:</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
                <span>Cleared Cash ($):</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={currentCashBalance}
                onChange={(e) => setCurrentCashBalance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Min Reserve ($):</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={minCashReserve}
                onChange={(e) => setMinCashReserve(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Reconciled Date:</span>
              </label>
              <input
                type="date"
                required
                value={lastReconciledDate}
                onChange={(e) => setLastReconciledDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Owner Phone:</span>
              </label>
              <input
                type="text"
                placeholder="+1 555 123 4567"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Public Dashboard Link (for WhatsApp alerts):</span>
            </label>
            <input
              type="text"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
            >
              Update Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
