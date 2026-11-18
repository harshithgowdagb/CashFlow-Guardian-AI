import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Phone,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { BusinessProfile, ForecastSummary, RecoveryAction } from '../types/cashflow';
import { generateWhatsAppAlert } from '../utils/engine';

interface WhatsAppAlertHubProps {
  profile: BusinessProfile;
  summary: ForecastSummary;
  recoveryActions: RecoveryAction[];
  onOpenProfileModal: () => void;
}

export const WhatsAppAlertHub: React.FC<WhatsAppAlertHubProps> = ({
  profile,
  summary,
  recoveryActions,
  onOpenProfileModal,
}) => {
  const [recipientPhone, setRecipientPhone] = useState(profile.ownerPhone || '+1 (555) 382-9912');
  const [copied, setCopied] = useState(false);

  const alert = generateWhatsAppAlert(
    { ...profile, ownerPhone: recipientPhone },
    summary,
    recoveryActions
  );

  const [message, setMessage] = useState(alert.messageText);

  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShortage = summary.firstZeroShortageDate !== null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">WhatsApp Cash Alert Dispatcher</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Equip your small business with instant, actionable deficit warnings delivered straight to WhatsApp. Pre-formatted with exact shortage dates, amounts, root causes, and top 3 recovery actions.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400 self-start md:self-auto"
          >
            <Send className="w-4 h-4" />
            <span>Send via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Simulator (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>WhatsApp Screen Preview</span>
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 font-semibold">
              Live Preview
            </span>
          </div>

          {/* Smartphone Simulator Mockup */}
          <div className="bg-[#111b21] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {/* WhatsApp App Bar */}
            <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center gap-3 border-b border-[#2a3942]">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                CG
              </div>
              <div>
                <div className="text-xs font-bold text-white">CashFlow Guardian AI</div>
                <div className="text-[10px] text-emerald-400">Online • Alert Dispatcher</div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3.5 min-h-[380px] bg-[#0b141a] bg-opacity-95 flex flex-col justify-end">
              <div className="bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none p-3 shadow text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text">
                {message}
                <div className="text-[9px] text-emerald-300/80 text-right font-sans flex items-center justify-end gap-1 mt-1.5">
                  <span>10:42 AM</span>
                  <Check className="w-3 h-3 text-cyan-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customization & Dispatch Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Recipient Number Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white">Dispatch Configuration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Recipient Phone (Owner / Partner):
                </label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="bg-transparent text-white focus:outline-none w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Business Entity Name:
                </label>
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 flex items-center justify-between">
                  <span>{profile.businessName}</span>
                  <button
                    onClick={onOpenProfileModal}
                    className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Text Area Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Custom Message Editor:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setMessage(
                      generateWhatsAppAlert(
                        { ...profile, ownerPhone: recipientPhone },
                        summary,
                        recoveryActions
                      ).messageText
                    )
                  }
                  className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Regenerate Default
                </button>
                <button
                  onClick={handleCopy}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Compliance & WhatsApp Cloud API Guidance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-bold text-white">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Click-to-Chat Protocol vs WhatsApp Business API</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              <strong>Standard Click-to-Chat (Active):</strong> Generates an authentic, pre-filled WhatsApp link using official universal protocol (<code className="text-emerald-400">api.whatsapp.com/send?text=...</code>). Requires no API tokens or paid subscriptions. You review and tap Send.
            </p>
            <p className="leading-relaxed text-[11px]">
              <strong>Automated Scheduled Webhooks (Enterprise):</strong> Automatic headless background delivery can be configured via Meta WhatsApp Business Platform Cloud API with registered Meta App Credentials and approved HSM templates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
