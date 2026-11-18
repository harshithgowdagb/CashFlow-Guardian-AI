import React, { useState } from 'react';
import { Send, X, Copy, Check, ExternalLink, Phone, MessageSquare } from 'lucide-react';
import { BusinessProfile, Transaction } from '../types/cashflow';
import { generateOverduePaymentMessage } from '../utils/engine';

interface OverdueReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  transaction: Transaction | null;
}

export const OverdueReminderModal: React.FC<OverdueReminderModalProps> = ({
  isOpen,
  onClose,
  profile,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const [phone, setPhone] = useState(transaction.contactPhone || '');
  const [isCopied, setIsCopied] = useState(false);

  const { messageText } = generateOverduePaymentMessage(profile, transaction);
  const [text, setText] = useState(messageText);

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Customer Payment Follow-Up
              </h3>
              <p className="text-[11px] text-slate-400">
                {transaction.party} — {transaction.invoiceNumber || transaction.description}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Overdue Amount:</span>
            <span className="font-extrabold text-amber-300 font-mono text-sm">
              ${transaction.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
            <Phone className="w-4 h-4 text-emerald-400" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Customer WhatsApp Number (e.g. +1 555 123 4567)"
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full font-mono"
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Message Preview & Editor:</span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
