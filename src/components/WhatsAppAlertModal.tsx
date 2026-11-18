import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  Copy,
  Check,
  Phone,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, RecoveryAction } from '../types/cashflow';
import { generateWhatsAppAlert } from '../utils/engine';

interface WhatsAppAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  summary: ForecastSummary;
  recoveryActions: RecoveryAction[];
  onUpdatePhone?: (phone: string) => void;
}

export const WhatsAppAlertModal: React.FC<WhatsAppAlertModalProps> = ({
  isOpen,
  onClose,
  profile,
  summary,
  recoveryActions,
  onUpdatePhone,
}) => {
  const [recipientPhone, setRecipientPhone] = useState(profile.ownerPhone || '');
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Regenerate message when summary or profile changes
  useEffect(() => {
    if (isOpen) {
      const alert = generateWhatsAppAlert(
        { ...profile, ownerPhone: recipientPhone },
        summary,
        recoveryActions
      );
      setCustomMessage(alert.messageText);
    }
  }, [isOpen, profile, summary, recoveryActions, recipientPhone]);

  if (!isOpen) return null;

  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(customMessage);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    if (onUpdatePhone) onUpdatePhone(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>WhatsApp Cash Alert Generator</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Click-to-Chat
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Review and dispatch a high-priority cash-flow deficit briefing directly to your phone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Recipient Phone Configuration */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-semibold text-slate-300">
                Recipient WhatsApp Number (Owner / CFO):
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-44"
              />
            </div>
          </div>

          {/* Tab Switcher: Formatted Preview vs Raw Text Editor */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                WhatsApp Bubble Preview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Edit Message Text
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Tab 1: WhatsApp Bubble Simulator */}
          {activeTab === 'preview' ? (
            <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 relative font-sans text-xs">
              <div className="max-w-md ml-auto bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none p-3.5 shadow-md space-y-2 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11.5px]">
                {customMessage}
                <div className="text-[10px] text-emerald-300/80 text-right font-sans flex items-center justify-end gap-1 mt-1">
                  <span>Just now</span>
                  <Check className="w-3.5 h-3.5 text-cyan-300" />
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Raw Text Editor */
            <textarea
              rows={12}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          )}

          {/* Delivery & Security Transparency Notice */}
          <div className="p-3 bg-slate-850 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>How WhatsApp Delivery Works:</span>
            </div>
            <p>
              Clicking <strong>Send via WhatsApp</strong> opens the official WhatsApp Web or mobile app via a pre-filled, securely URL-encoded link. You retain 100% control to review, edit, or cancel before hitting send. (No message is ever sent invisibly without your manual confirmation).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {summary.firstZeroShortageDate ? (
              <span className="text-rose-400 font-semibold">
                ⚠️ Deficit detected on {summary.firstZeroShortageDate}
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                🟢 Cash position healthy across 35 days
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
            >
              Close
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
