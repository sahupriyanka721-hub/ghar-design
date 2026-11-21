import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getVendorByPhone, saveRegisteredVendor } from '../../data/vendorStore.js';
import {
  Sliders,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Bell,
  Lock,
  Smartphone,
  Check,
} from 'lucide-react';

export const VendorSettings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const currentVendor = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'MOBILE' | 'NOTIFICATIONS' | 'SECURITY'>('PROFILE');

  // Profile Form Data
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    gstin: '',
    panNumber: '',
    city: 'New Delhi',
    state: 'Delhi',
    pinCode: '',
  });

  // Mobile Change Form
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    whatsappOrderAlerts: true,
    smsDispatchUpdates: true,
    emailDailySummary: true,
    payoutAlerts: true,
  });

  // Security PIN
  const [securityPin, setSecurityPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    if (currentVendor) {
      setFormData({
        businessName: currentVendor.businessName || '',
        ownerName: currentVendor.ownerName || '',
        phone: currentVendor.phone || user?.phone || '',
        email: currentVendor.email || '',
        gstin: currentVendor.gstin || '',
        panNumber: currentVendor.panNumber || '',
        city: currentVendor.address?.city || 'New Delhi',
        state: currentVendor.address?.state || 'Delhi',
        pinCode: currentVendor.address?.pinCode || '110020',
      });
    }
  }, [currentVendor, user?.phone]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    saveRegisteredVendor({
      ...currentVendor,
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      email: formData.email,
      address: {
        ...currentVendor.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
      },
    });

    success('Depot profile and settings saved successfully!');
  };

  const handleRequestMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setOtpStep(true);
    setMobileOtp('123456');
    success('Verification OTP dispatched to new mobile number: 123456');
  };

  const handleVerifyChangeMobile = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileOtp.trim() !== '123456') {
      error('Invalid verification code');
      return;
    }
    if (!currentVendor) return;

    const clean = newMobile.replace(/\D/g, '').slice(-10);
    saveRegisteredVendor({
      ...currentVendor,
      phone: `+91 ${clean}`,
    });

    success(`Registered mobile number updated to +91 ${clean}!`);
    setOtpStep(false);
    setNewMobile('');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      error('Security PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      error('Security PIN confirmation does not match');
      return;
    }

    setSecurityPin(newPin);
    setNewPin('');
    setConfirmPin('');
    success('Security PIN updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Depot Account & Security Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store profile, authenticated mobile number change, dispatch notification channels and security PIN.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
          {[
            { label: 'Store Profile', value: 'PROFILE', icon: Building },
            { label: 'Change Mobile', value: 'MOBILE', icon: Smartphone },
            { label: 'Notification Channels', value: 'NOTIFICATIONS', icon: Bell },
            { label: 'Security PIN', value: 'SECURITY', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.value
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Business / Depot Name</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Authorized Owner Name</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Depot City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN REGISTRATION</span>
                <span className="font-mono font-bold text-slate-900">{formData.gstin || '07AAAAA0000A1Z5'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PAN NUMBER</span>
                <span className="font-mono font-bold text-slate-900">{formData.panNumber || 'ABCDE1234F'}</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Depot Profile</span>
            </button>
          </form>
        )}

        {/* TAB 2: CHANGE MOBILE */}
        {activeTab === 'MOBILE' && (
          <div className="space-y-4 text-xs max-w-md">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-950 space-y-1">
              <strong>Current Registered Number:</strong>
              <div className="font-mono font-bold text-sm text-blue-900">{currentVendor?.phone || user?.phone}</div>
              <p className="text-[11px] text-blue-800">
                Changing your mobile number requires 2-step OTP verification to protect depot order history and payouts.
              </p>
            </div>

            {!otpStep ? (
              <form onSubmit={handleRequestMobileOtp} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New 10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="Enter new 10-digit number"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  Send Verification OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyChangeMobile} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Enter OTP sent to +91 {newMobile}</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-black text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                  >
                    Confirm & Update Number
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-3 text-xs max-w-lg">
            <h4 className="font-bold text-slate-900">Configure Depot Notification Preferences</h4>
            <div className="space-y-2 border border-blue-200/80 rounded-2xl p-4 bg-sky-50/30/50">
              {[
                {
                  key: 'whatsappOrderAlerts',
                  title: 'WhatsApp New Order Dispatch Alerts',
                  desc: 'Receive immediate WhatsApp messages when customers place orders.',
                },
                {
                  key: 'smsDispatchUpdates',
                  title: 'SMS Driver & Dispatch Notifications',
                  desc: 'Automated SMS when heavy tipper trucks are assigned or offloaded.',
                },
                {
                  key: 'emailDailySummary',
                  title: 'Daily Financial & Sales Summary (Email)',
                  desc: 'End-of-day digest with daily turnover, top items and returns.',
                },
                {
                  key: 'payoutAlerts',
                  title: 'Bank Settlement & UTR Credit Alerts',
                  desc: 'Instant alerts whenever bank payouts are cleared.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200/80 cursor-pointer hover:border-blue-200 transition"
                >
                  <div>
                    <strong className="text-slate-900 block">{item.title}</strong>
                    <span className="text-slate-500 text-[11px]">{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(notifPrefs as any)[item.key]}
                    onChange={(e) =>
                      setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={() => success('Notification preferences updated!')}
              className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md"
            >
              Save Preferences
            </button>
          </div>
        )}

        {/* TAB 4: SECURITY PIN */}
        {activeTab === 'SECURITY' && (
          <form onSubmit={handleUpdatePin} className="space-y-3 text-xs max-w-md">
            <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-1">
              <strong className="text-slate-900">4-Digit Security PIN:</strong>
              <p className="text-[11px] text-slate-500">
                Used to authorize payout account changes and bulk price/stock adjustments. Current PIN is configured.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold text-center tracking-widest text-base"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Confirm 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold text-center tracking-widest text-base"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md transition"
            >
              Update Security PIN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
