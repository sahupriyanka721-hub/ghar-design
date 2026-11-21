import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformGlobalSettings,
  getPlatformGlobalSettings,
  savePlatformGlobalSettings,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';

export const AdminPlatformSettings: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<PlatformGlobalSettings>(() => getPlatformGlobalSettings());
  const [quotationFeeRupees, setQuotationFeeRupees] = useState<number>(settings.quotationFeePaise / 100);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof PlatformGlobalSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = savePlatformGlobalSettings({
        ...settings,
        quotationFeePaise: Math.round(Number(quotationFeeRupees) * 100),
      });
      setSettings(updated);

      recordPlatformAuditLog({
        action: 'UPDATE_SETTINGS',
        module: 'CONFIG',
        targetId: 'GLOBAL_SETTINGS',
        performedBy: 'Super Administrator',
        notes: `Platform rates and commission configuration updated`,
      });

      success('Global platform configurations successfully saved!');
    } catch {
      error('Failed to update platform settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Platform Global Settings & Commercial Rules</h1>
              <p className="text-xs text-slate-500">
                Configure commission fee schedules, escrow release hold windows, statutory GST taxes, and integration gateways
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-sky-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Platform Brand Identity & Support Contact */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-navy-950">Platform Identity & Official Support Contacts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Platform Brand / Enterprise Name</label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Support Desk Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Toll-Free / Help Helpline</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Tax & Commission Fee Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-navy-950">Platform Revenue Commission Matrix & Statutory Tax (GST)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Quotation Booking Fee (INR)</span>
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                min={0}
                value={quotationFeeRupees}
                onChange={(e) => setQuotationFeeRupees(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Charged when customer books quotation token</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Statutory GST Rate (%)</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">HSN/SAC</span>
              </label>
              <input
                type="number"
                min={0}
                max={28}
                value={settings.gstRatePercent}
                onChange={(e) => handleChange('gstRatePercent', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Applicable GST on platform invoices & materials</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Architect Booking Commission (%)</span>
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.architectCommissionPercent}
                onChange={(e) => handleChange('architectCommissionPercent', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deducted from architectural drawing packages</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Interior Designer Commission (%)</span>
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.interiorDesignerCommissionPercent}
                onChange={(e) => handleChange('interiorDesignerCommissionPercent', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deducted from 3D design & turnkey decor projects</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Contractor Milestone Commission (%)</span>
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.contractorCommissionPercent}
                onChange={(e) => handleChange('contractorCommissionPercent', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Platform take-rate upon milestone escrow release</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Material Depot Vendor Commission (%)</span>
                <Percent className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.vendorCommissionPercent}
                onChange={(e) => handleChange('vendorCommissionPercent', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deducted from vendor sales payout settlement</p>
            </div>
          </div>
        </div>

        {/* Section 3: Escrow & Risk Policy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-navy-950">Escrow Security, Hold Windows & Operational Toggles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Escrow Holding Window (Days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.escrowHoldDays}
                onChange={(e) => handleChange('escrowHoldDays', Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Cooling period before milestone funds can be disbursed to contractor account
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoApproveVerifiedVendors}
                  onChange={(e) => handleChange('autoApproveVerifiedVendors', e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Auto-Approve GST Verified Vendors</span>
                  <p className="text-[10px] text-slate-400">Automatically activate vendors whose GSTIN and PAN match successfully</p>
                </div>
              </label>
            </div>
          </div>

          {/* Maintenance Mode Warning Card */}
          <div className={`p-4 rounded-xl border transition ${settings.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-red-600 focus:ring-red-500"
              />
              <div>
                <span className={`font-bold text-xs ${settings.maintenanceMode ? 'text-red-800' : 'text-slate-800'}`}>
                  Activate Platform Maintenance Mode
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When enabled, all public booking and material cart checkouts will show a maintenance notice. Administrators will retain full access.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Gateways & Infrastructure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-navy-950">Payment Gateways & Communication Infrastructure</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Escrow Payment Gateway Engine</label>
              <input
                type="text"
                value={settings.paymentGatewayProvider}
                onChange={(e) => handleChange('paymentGatewayProvider', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">SMS & WhatsApp Business Route</label>
              <input
                type="text"
                value={settings.smsGatewayProvider}
                onChange={(e) => handleChange('smsGatewayProvider', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

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
