import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Percent,
  IndianRupee,
  Clock,
  Shield,
  CreditCard,
  MessageSquare,
  Lock,
  RotateCcw,
  KeyRound,
  FileText,
  FileCheck2,
  UploadCloud,
  Check,
  Send,
  Sparkles,
  Server,
  Terminal,
  ShieldCheck,
  Layers,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useToast } from '../../context/ToastContext.js';

import {
  MasterPlatformSettings,
  getMasterPlatformSettings,
  saveMasterPlatformSettings,
  restoreFactorySettings,
  DEFAULT_PLATFORM_MASTER_SETTINGS,
} from '../../data/platformSettingsStore.js';

import { recordPlatformAuditLog } from '../../data/adminStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export type PlatformSettingsView =
  | 'GENERAL_SETTINGS'
  | 'PAYMENT_GATEWAY'
  | 'PAYOUT_SETTINGS'
  | 'OTP_SETTINGS'
  | 'EMAIL_SMS_SETTINGS'
  | 'TAX_SETTINGS'
  | 'DOCUMENT_SETTINGS'
  | 'SECURITY_SETTINGS';

interface ViewTabMeta {
  key: PlatformSettingsView;
  label: string;
  icon: any;
  shortDesc: string;
}

const VIEW_TABS: ViewTabMeta[] = [
  {
    key: 'GENERAL_SETTINGS',
    label: 'General Settings',
    icon: Building,
    shortDesc: 'Platform brand identity, legal registration, corporate headquarters and maintenance controls',
  },
  {
    key: 'PAYMENT_GATEWAY',
    label: 'Payment Gateway Settings',
    icon: CreditCard,
    shortDesc: 'Razorpay, Cashfree & UPI escrow payment collection credentials, webhooks, and surcharges',
  },
  {
    key: 'PAYOUT_SETTINGS',
    label: 'Payout Settings',
    icon: IndianRupee,
    shortDesc: 'Automated escrow disbursements, cooling hold windows, penny-drop verification, and thresholds',
  },
  {
    key: 'OTP_SETTINGS',
    label: 'OTP Settings',
    icon: Smartphone,
    shortDesc: 'Mobile authentication gateways, DLT routes, expiration windows, and test number whitelists',
  },
  {
    key: 'EMAIL_SMS_SETTINGS',
    label: 'Email/SMS Settings',
    icon: MessageSquare,
    shortDesc: 'Transactional notification providers, verified sender identities, and automated event triggers',
  },
  {
    key: 'TAX_SETTINGS',
    label: 'Tax Settings',
    icon: Percent,
    shortDesc: 'Corporate GSTIN, standard 18% GST rules, SAC classification codes, and TDS deductions',
  },
  {
    key: 'DOCUMENT_SETTINGS',
    label: 'Document Settings',
    icon: FileText,
    shortDesc: 'CAD/BIM file format limits, drawing watermarking policies, and cloud storage buckets',
  },
  {
    key: 'SECURITY_SETTINGS',
    label: 'Security Settings',
    icon: Shield,
    shortDesc: 'Mandatory 2FA, session timeout limits, brute-force lockout, and PII masking rules',
  },
];

export const AdminPlatformSettings: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View from URL (?view=)
  const rawView = searchParams.get('view') as PlatformSettingsView | null;
  const activeView: PlatformSettingsView = rawView && VIEW_TABS.some((t) => t.key === rawView)
    ? rawView
    : 'GENERAL_SETTINGS';

  const setView = (newView: PlatformSettingsView) => {
    setSearchParams({ view: newView });
  };

  const [settings, setSettings] = useState<MasterPlatformSettings>(() => getMasterPlatformSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getMasterPlatformSettings());
    };
    window.addEventListener('PLATFORM_SETTINGS_UPDATED', handleUpdate);
    return () => window.removeEventListener('PLATFORM_SETTINGS_UPDATED', handleUpdate);
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = saveMasterPlatformSettings(settings);
      setSettings(updated);

      recordPlatformAuditLog({
        action: 'UPDATE_PLATFORM_SETTINGS',
        module: 'CONFIG',
        targetId: activeView,
        performedBy: 'Super Administrator',
        notes: `Platform settings updated for section ${activeView}`,
      });

      logAdminAuditAction({
        action: 'UPDATE_GLOBAL_SETTINGS',
        targetType: 'PLATFORM_SETTINGS',
        targetId: activeView,
        description: `Updated platform configuration for view ${activeView}`,
      });

      success('Platform settings successfully saved and applied!');
    } catch {
      error('Failed to update platform settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to restore all platform settings to factory defaults?')) {
      const restored = restoreFactorySettings();
      setSettings(restored);
      success('Platform settings restored to factory defaults');
    }
  };

  const activeMeta = VIEW_TABS.find((t) => t.key === activeView) || VIEW_TABS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & VIEW SWITCHER DROPDOWN                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-950">20. Platform Settings</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Global Configuration
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure gateways, escrow payouts, OTP authentication, DLT routes, GST taxes, drawing policies, and security defenses
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Selector Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={activeView}
                onChange={(e) => setView(e.target.value as PlatformSettingsView)}
                className="w-full sm:w-64 pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                {VIEW_TABS.map((tab, idx) => (
                  <option key={tab.key} value={tab.key}>
                    {idx + 1}. {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>

            <button
              onClick={handleResetDefaults}
              title="Restore Factory Defaults"
              className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HORIZONTAL PILL NAV BAR (ALL 8 VIEWS)                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          {VIEW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-950'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CONTEXTUAL FEATURE HEADER BANNER                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-navy-950 uppercase tracking-wider">
                Module 20
              </span>
              <h2 className="text-base font-bold text-white">{activeMeta.label}</h2>
            </div>
            <p className="text-xs text-sky-200 max-w-2xl">{activeMeta.shortDesc}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-emerald-300">{settings.general.currencySymbol}</div>
              <div className="text-[10px] text-sky-200 uppercase">Currency</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-amber-300">{settings.payout.escrowHoldDays}d</div>
              <div className="text-[10px] text-sky-200 uppercase">Escrow Window</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-sky-300">{settings.tax.standardGstRatePercent}%</div>
              <div className="text-[10px] text-sky-200 uppercase">GST Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-purple-300">{settings.paymentGateway.primaryGateway}</div>
              <div className="text-[10px] text-sky-200 uppercase">Gateway</div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* ==================================================================== */}
        {/* VIEW 1: GENERAL SETTINGS                                             */}
        {/* ==================================================================== */}
        {activeView === 'GENERAL_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Platform Brand Identity & Operating Controls</h3>
              <p className="text-xs text-slate-500">Corporate legal identity, official support contacts, and maintenance mode</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.general.tagline}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, tagline: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Legal Corporate Entity</label>
                <input
                  type="text"
                  value={settings.general.legalEntityName}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, legalEntityName: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate CIN Number</label>
                <input
                  type="text"
                  value={settings.general.cinNumber}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, cinNumber: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Help Helpline Number</label>
                <input
                  type="tel"
                  value={settings.general.supportPhone}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportPhone: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Corporate Registered Address</label>
                <input
                  type="text"
                  value={settings.general.headquartersAddress}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, headquartersAddress: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Timezone</label>
                <input
                  type="text"
                  value={settings.general.defaultTimezone}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, defaultTimezone: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operating Currency Symbol</label>
                <input
                  type="text"
                  value={settings.general.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currencySymbol: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {/* Maintenance Mode Warning Card */}
            <div className={`p-4 rounded-xl border transition ${settings.general.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, general: { ...settings.general, maintenanceMode: e.target.checked } })}
                  className="w-4 h-4 mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div>
                  <span className={`font-bold text-xs ${settings.general.maintenanceMode ? 'text-red-800' : 'text-slate-800'}`}>
                    Activate Platform Maintenance Mode
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When active, public homeowner bookings show maintenance splash notice. Admin consoles remain unrestricted.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: PAYMENT GATEWAY SETTINGS                                     */}
        {/* ==================================================================== */}
        {activeView === 'PAYMENT_GATEWAY' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Payment Collection Gateway Integration</h3>
              <p className="text-xs text-slate-500">Configure Indian online payment aggregators for customer escrow deposits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Payment Gateway Provider</label>
                <select
                  value={settings.paymentGateway.primaryGateway}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, primaryGateway: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-navy-950"
                >
                  <option value="RAZORPAY">Razorpay (Escrow Verified Route)</option>
                  <option value="CASHFREE">Cashfree Payments (Escrow Suite)</option>
                  <option value="STRIPE">Stripe India</option>
                  <option value="PAYU">PayU Money India</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Environment Mode</label>
                <select
                  value={settings.paymentGateway.environment}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, environment: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="SANDBOX">SANDBOX / TEST MODE</option>
                  <option value="PRODUCTION">PRODUCTION / LIVE MODE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Merchant Key ID / App ID</label>
                <input
                  type="text"
                  value={settings.paymentGateway.keyId}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, keyId: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Merchant Key Secret</label>
                <div className="relative">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    value={settings.paymentGateway.keySecret}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, keySecret: e.target.value } })}
                    className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Webhook Secret Key</label>
                <input
                  type="text"
                  value={settings.paymentGateway.webhookSecret}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, webhookSecret: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Webhook Endpoint URL</label>
                <input
                  type="text"
                  value={settings.paymentGateway.webhookEndpoint}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, webhookEndpoint: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Supported Payment Channels */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-navy-950 mb-3">Accepted Payment Instruments</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway.enableUpi}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, enableUpi: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-bold text-slate-800">UPI (GPay / PhonePe)</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway.enableCards}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, enableCards: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Credit / Debit Cards</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway.enableNetbanking}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, enableNetbanking: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Netbanking (50+ Banks)</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateway.enableEmi}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, enableEmi: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Cardless & Bank EMI</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 3: PAYOUT SETTINGS                                              */}
        {/* ==================================================================== */}
        {activeView === 'PAYOUT_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Architect & Contractor Escrow Payout Engine</h3>
              <p className="text-xs text-slate-500">Configure automated NEFT/RTGS disbursements, escrow holding periods and penny-drop verification</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Route</label>
                <select
                  value={settings.payout.payoutEngine}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, payoutEngine: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="RAZORPAY_X">RazorpayX (Instant IMPS/NEFT)</option>
                  <option value="CASHFREE_PAYOUTS">Cashfree Payouts Suite</option>
                  <option value="DIRECT_BANK_NEFT">ICICI/HDFC Corporate Direct API</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Escrow Cooling Hold Window (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.payout.escrowHoldDays}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, escrowHoldDays: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Auto-Approval Threshold (₹ INR)</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={settings.payout.autoApproveThresholdRupees}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, autoApproveThresholdRupees: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Payouts below this threshold auto-release post milestone customer sign-off</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Single Payout Limit (₹ INR)</label>
                <input
                  type="number"
                  min={10000}
                  step={50000}
                  value={settings.payout.maxSinglePayoutRupees}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, maxSinglePayoutRupees: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payout.pennyDropVerification}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, pennyDropVerification: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Bank Beneficiary Penny-Drop Validation</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Deposit ₹1 into professional bank account to verify registered legal account name matching PAN/COA before approving payouts.
                  </p>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payout.dualSignOffRequired}
                  onChange={(e) => setSettings({ ...settings, payout: { ...settings.payout, dualSignOffRequired: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Dual Authorization for Large Disbursals</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Requires secondary authorization from Super Admin for any single payout exceeding ₹1,00,000.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 4: OTP SETTINGS                                                 */}
        {/* ==================================================================== */}
        {activeView === 'OTP_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Mobile Login & Customer OTP Verification</h3>
              <p className="text-xs text-slate-500">DLT registered SMS gateway, countdown timers, WhatsApp fallback, and test number whitelists</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary SMS Gateway Provider</label>
                <select
                  value={settings.otp.otpGatewayProvider}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, otpGatewayProvider: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="FAST2SMS_DLT">Fast2SMS (Indian DLT Direct)</option>
                  <option value="TWILIO">Twilio India Route</option>
                  <option value="MSG91">MSG91 Enterprise</option>
                  <option value="GUPSHUP">Gupshup SMS Hub</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">OTP Digit Length</label>
                <select
                  value={settings.otp.otpLength}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, otpLength: Number(e.target.value) as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value={6}>6 Digits (Recommended for Security)</option>
                  <option value={4}>4 Digits (Fast)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">OTP Validity Window (Seconds)</label>
                <input
                  type="number"
                  min={60}
                  max={600}
                  value={settings.otp.otpValiditySeconds}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, otpValiditySeconds: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resend Cooldown Timer (Seconds)</label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  value={settings.otp.resendCooldownSeconds}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, resendCooldownSeconds: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">QA / Testing Bypass Mobile Numbers (Comma Separated)</label>
                <input
                  type="text"
                  value={settings.otp.testBypassPhoneNumbers}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, testBypassPhoneNumbers: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  These numbers bypass external SMS gateway using universal test OTP: <strong className="font-mono text-slate-800">{settings.otp.universalTestOtp}</strong>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.otp.enableWhatsAppFallback}
                  onChange={(e) => setSettings({ ...settings, otp: { ...settings.otp, enableWhatsAppFallback: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Automated WhatsApp OTP Fallback</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    If telecom SMS delivery report is not received within {settings.otp.whatsAppFallbackSeconds} seconds, automatically dispatch OTP via WhatsApp Business API.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 5: EMAIL / SMS SETTINGS                                         */}
        {/* ==================================================================== */}
        {activeView === 'EMAIL_SMS_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Transactional Notification Infrastructure</h3>
              <p className="text-xs text-slate-500">SMTP mail server, DLT entity registration, and automated customer triggers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMTP Gateway Provider</label>
                <select
                  value={settings.emailSms.smtpProvider}
                  onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, smtpProvider: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="AWS_SES">Amazon Web Services SES (Mumbai)</option>
                  <option value="SENDGRID">Twilio SendGrid</option>
                  <option value="POSTMARK">Postmark</option>
                  <option value="GOOGLE_WORKSPACE">Google Workspace SMTP Relay</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sender Email Identity</label>
                <input
                  type="email"
                  value={settings.emailSms.senderEmail}
                  onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, senderEmail: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">India DLT Sender Header ID (6 Letters)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={settings.emailSms.dltSenderHeader}
                  onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, dltSenderHeader: e.target.value.toUpperCase() } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DLT Principal Entity ID</label>
                <input
                  type="text"
                  value={settings.emailSms.dltEntityId}
                  onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, dltEntityId: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Notification Triggers */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-navy-950 mb-3">Automated Trigger Notifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailSms.notifyOnQuotationSubmitted}
                    onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, notifyOnQuotationSubmitted: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Email & SMS when Architect Submits Quotation</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailSms.notifyOnMilestoneReleased}
                    onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, notifyOnMilestoneReleased: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Alert Homeowner on Milestone Escrow Release</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailSms.notifyOnInspectionSigned}
                    onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, notifyOnInspectionSigned: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Inspection Completion Report Delivery</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailSms.notifyOnPayoutSettled}
                    onChange={(e) => setSettings({ ...settings, emailSms: { ...settings.emailSms, notifyOnPayoutSettled: e.target.checked } })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Bank UTR Notification to Architect on Payout</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 6: TAX SETTINGS                                                 */}
        {/* ==================================================================== */}
        {activeView === 'TAX_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Statutory Tax & Compliance Schedules</h3>
              <p className="text-xs text-slate-500">Corporate GSTIN, SAC codes, standard GST 18%, and statutory TDS deductions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate GSTIN Number</label>
                <input
                  type="text"
                  value={settings.tax.corporateGstin}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, corporateGstin: e.target.value.toUpperCase() } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate PAN Number</label>
                <input
                  type="text"
                  value={settings.tax.corporatePan}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, corporatePan: e.target.value.toUpperCase() } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard GST Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={28}
                  value={settings.tax.standardGstRatePercent}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, standardGstRatePercent: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Split as 9% CGST + 9% SGST (Intrastate) or 18% IGST (Interstate)</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SAC Code for Architectural Services</label>
                <input
                  type="text"
                  value={settings.tax.hsnSacArchitecture}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, hsnSacArchitecture: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TDS u/s 194-O (E-Commerce Operator %)</label>
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={settings.tax.tdsEcommerceSection194O}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, tdsEcommerceSection194O: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Tax Invoice Prefix</label>
                <input
                  type="text"
                  value={settings.tax.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, invoicePrefix: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 7: DOCUMENT SETTINGS                                            */}
        {/* ==================================================================== */}
        {activeView === 'DOCUMENT_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Architectural Drawing & Document Protection</h3>
              <p className="text-xs text-slate-500">Allowed CAD extensions, escrow watermarking on unpaid blueprints, and cloud storage buckets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Whitelisted File Extensions</label>
                <input
                  type="text"
                  value={settings.document.allowedExtensions}
                  onChange={(e) => setSettings({ ...settings, document: { ...settings.document, allowedExtensions: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Supports AutoCAD DWG, Revit RVT, SketchUp SKP, PDF blueprints, and 3D textures</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Upload Archive Size (MB)</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={settings.document.maxUploadSizeMb}
                  onChange={(e) => setSettings({ ...settings, document: { ...settings.document, maxUploadSizeMb: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cloud Storage Provider</label>
                <select
                  value={settings.document.storageProvider}
                  onChange={(e) => setSettings({ ...settings, document: { ...settings.document, storageProvider: e.target.value as any } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="AWS_S3_MUMBAI">Amazon S3 (ap-south-1 Mumbai)</option>
                  <option value="CLOUDFLARE_R2">Cloudflare R2 Object Storage</option>
                  <option value="GOOGLE_CLOUD_MUMBAI">Google Cloud Storage (asia-south1)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Confidential Watermark Stamp Text</label>
                <input
                  type="text"
                  value={settings.document.watermarkText}
                  onChange={(e) => setSettings({ ...settings, document: { ...settings.document, watermarkText: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.document.watermarkUnpaidDrawings}
                  onChange={(e) => setSettings({ ...settings, document: { ...settings.document, watermarkUnpaidDrawings: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Enforce Watermarking on Unpaid Milestone Previews</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    All 2D drawings, sections, and 3D renders render with an overlay watermark preventing customer download until milestone escrow funds are cleared.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 8: SECURITY SETTINGS                                            */}
        {/* ==================================================================== */}
        {activeView === 'SECURITY_SETTINGS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Platform Cyber Security & Data Privacy Defenses</h3>
              <p className="text-xs text-slate-500">Two-Factor enforcement, session expiry, IP firewalls, and DPDP Act 2023 PII masking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Idle Session Timeout (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeoutMinutes: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Failed Logins Before Account Lockout</label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={settings.security.maxFailedLoginsBeforeLock}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxFailedLoginsBeforeLock: Number(e.target.value) } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Whitelisted Office IPs for Super Admin (CIDR Notation)</label>
                <input
                  type="text"
                  value={settings.security.whitelistedIps}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, whitelistedIps: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.enforceAdminMfa}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, enforceAdminMfa: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Enforce Mandatory Two-Factor Authentication (2FA) for All Admins</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Requires second-factor SMS / WhatsApp OTP verification on every admin login session.
                  </p>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.maskPiiInUi}
                  onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maskPiiInUi: e.target.checked } })}
                  className="w-4 h-4 text-sky-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800">Mask Sensitive Customer & Professional PII in Console</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Obfuscates Aadhaar, PAN, and Bank Account numbers (revealing only last 4 digits) to comply with Digital Personal Data Protection (DPDP) Act 2023.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPlatformSettings;
