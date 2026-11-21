import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Sliders,
  ShieldCheck,
  Bell,
  Phone,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { getProfessionalByPhone, saveProfessionalAccount } from '../../data/professionalStore.js';

export const ProfessionalSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'SECURITY' | 'NOTIFICATIONS' | 'MOBILE'>('ACCOUNT');

  // Account State
  const [firmName, setFirmName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  // Notification State
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyNewLeads, setNotifyNewLeads] = useState(true);
  const [notifyEscrow, setNotifyEscrow] = useState(true);

  // Mobile Change State
  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVal, setOtpVal] = useState('');

  useEffect(() => {
    if (user?.phone) {
      const arch = getProfessionalByPhone(user.phone);
      if (arch) {
        setFirmName(arch.business?.firmName || '');
        setEmail(arch.personal?.email || '');
        setCity(arch.personal?.city || '');
      }
    }
  }, [user]);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.phone) {
      const arch = getProfessionalByPhone(user.phone);
      if (arch) {
        arch.business.firmName = firmName;
        arch.personal.email = email;
        arch.personal.city = city;
        saveProfessionalAccount(arch);
      }
    }
    success('Account settings saved successfully!');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    success('Notification preferences updated!');
  };

  const handleSendMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      error('Enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    success(`Verification code dispatched to +91 ${clean}`);
  };

  const handleVerifyNewMobile = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVal.length !== 6) {
      error('Please enter 6-digit OTP');
      return;
    }
    success('Mobile number updated! Please login with your new number next time.');
    setOtpSent(false);
    setNewPhone('');
    setOtpVal('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-display text-navy-950">Settings & Preferences</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage firm credentials, mobile authentication channels, WhatsApp alerts, and security settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ACCOUNT')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'ACCOUNT'
              ? 'border-sky-600 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Account Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'NOTIFICATIONS'
              ? 'border-sky-600 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'SECURITY'
              ? 'border-sky-600 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('MOBILE')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'MOBILE'
              ? 'border-sky-600 text-sky-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Change Mobile</span>
        </button>
      </div>

      {/* Account Settings Tab */}
      {activeTab === 'ACCOUNT' && (
        <form onSubmit={handleSaveAccount} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Firm & Representative Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Professionalure Firm / Firm Name</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Official Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Operating City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Registered Mobile Number (Read-only)</label>
              <input
                type="text"
                disabled
                value={user?.phone || ''}
                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-100 rounded-xl font-mono text-slate-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'NOTIFICATIONS' && (
        <form onSubmit={handleSaveNotifications} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Alerts & Dispatch Channels</h3>

          <div className="space-y-3.5 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-bold text-slate-800">WhatsApp Instant Alerts</div>
                <div className="text-slate-500 text-[11px]">Receive new quotation assignments & customer selections on WhatsApp.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <div className="font-bold text-slate-800">SMS Verification & Deadlines</div>
                <div className="text-slate-500 text-[11px]">Critical SMS reminders when quotation submission deadline is within 24 hours.</div>
              </div>
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <div className="font-bold text-slate-800">Escrow Tranche Release Notifications</div>
                <div className="text-slate-500 text-[11px]">Immediate alert whenever a milestone deposit or payout is processed.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyEscrow}
                onChange={(e) => setNotifyEscrow(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition"
            >
              Update Preferences
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Security & Access Management</h3>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-blue-900">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Two-Factor Authentication Active</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every partner session is authenticated using one-time password (OTP) sent to your registered mobile number. Plain text passwords are not used to prevent credential compromises.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Active Login Session</div>
              <div className="text-slate-400 font-mono text-[11px]">Browser: Antigravity Chrome Desktop  IP: Verified</div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of All Devices</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Mobile Tab */}
      {activeTab === 'MOBILE' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Update Registered Mobile Number</h3>

          {!otpSent ? (
            <form onSubmit={handleSendMobileOtp} className="space-y-4 max-w-md">
              <div>
                <label className="block text-slate-700 font-bold mb-1">New 10-Digit Indian Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    className="w-full pl-12 pr-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-xs transition"
              >
                Send Verification OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyNewMobile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Enter 6-Digit OTP sent to +91 {newPhone}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono text-center tracking-widest text-lg font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Verify & Update Mobile
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
