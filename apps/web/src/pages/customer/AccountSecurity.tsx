import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@ghar-design/shared';
import { useAuth } from '../../context/AuthContext.js';
import {
  ShieldCheck,
  Key,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const AccountSecurity: React.FC = () => {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-1',
      device: 'Google Chrome on Windows 11',
      ip: '122.161.49.201 (Gurugram, IN)',
      lastActive: 'Active Now',
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: 'sess-2',
      device: 'Safari Mobile on iPhone 15 Pro',
      ip: '122.161.49.205 (New Delhi, IN)',
      lastActive: '3 hours ago',
      isCurrent: false,
      icon: Smartphone,
    },
  ]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      invalidateOtherSessions: true,
    },
  });

  const newPasswordValue = watch('newPassword', '');

  // Password Strength Criteria
  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasLowercase = /[a-z]/.test(newPasswordValue);
  const hasNumber = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPasswordValue);

  const passedCriteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const onPasswordSubmit = (data: any) => {
    setSuccessMsg('Account password updated securely! Other sessions have been invalidated.');
    reset();
    if (data.invalidateOtherSessions) {
      setActiveSessions(activeSessions.filter((s) => s.isCurrent));
    }
  };

  const handleRevokeSession = (id: string) => {
    setActiveSessions(activeSessions.filter((s) => s.id !== id));
    setSuccessMsg('Session terminated successfully.');
  };

  const handleRevokeAllOtherSessions = () => {
    setActiveSessions(activeSessions.filter((s) => s.isCurrent));
    setSuccessMsg('Signed out of all other devices successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Customer Authentication & Account Protection</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Account Security & Password Controls
          </h1>
          <p className="text-slate-500 mt-1">
            Configure mobile OTP verification, password setup, and manage active browser login sessions.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* OTP Authentication Overview Card */}
      <div className="p-4 bg-navy-950 text-white rounded-2xl shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gold-400">Mobile OTP Primary Login Method</h3>
          <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
            Your primary login is passwordless via verified 10-digit Indian mobile number ({user?.phone ? `+91 ${user.phone}` : 'registered mobile'}) with 6-digit cryptographic OTPs. Setting an optional password provides dual-factor backup access.
          </p>
        </div>
      </div>

      {/* Change Password Form (Section 2.3 & 11.2) */}
      <form onSubmit={handleSubmit(onPasswordSubmit)} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold-600" />
          <span>Set or Change Backup Password</span>
        </h2>

        <div className="space-y-4 max-w-lg">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Current Password (Leave blank if setting for the first time)</label>
            <input
              {...register('currentPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">New Password</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
            {errors.newPassword && <p className="text-rose-600 text-[11px]">{errors.newPassword.message as string}</p>}
          </div>

          {/* Password Strength Meter */}
          {newPasswordValue && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-700">Password Strength:</span>
                <span
                  className={`font-bold ${
                    passedCriteria <= 2
                      ? 'text-rose-600'
                      : passedCriteria <= 4
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {passedCriteria <= 2 ? 'Weak' : passedCriteria <= 4 ? 'Moderate' : 'Strong & Secure'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passedCriteria <= 2
                      ? 'bg-rose-500 w-1/3'
                      : passedCriteria <= 4
                      ? 'bg-amber-500 w-2/3'
                      : 'bg-emerald-500 w-full'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                <div className={hasMinLength ? 'text-emerald-700 font-bold' : ''}>
                  {hasMinLength ? '✓' : '•'} 8+ Characters
                </div>
                <div className={hasUppercase ? 'text-emerald-700 font-bold' : ''}>
                  {hasUppercase ? '✓' : '•'} Uppercase Letter
                </div>
                <div className={hasLowercase ? 'text-emerald-700 font-bold' : ''}>
                  {hasLowercase ? '✓' : '•'} Lowercase Letter
                </div>
                <div className={hasNumber ? 'text-emerald-700 font-bold' : ''}>
                  {hasNumber ? '✓' : '•'} Number
                </div>
                <div className={hasSpecial ? 'text-emerald-700 font-bold' : ''}>
                  {hasSpecial ? '✓' : '•'} Special Symbol (@, #, $)
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Confirm New Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Re-type new password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
            {errors.confirmPassword && <p className="text-rose-600 text-[11px]">{errors.confirmPassword.message as string}</p>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              {...register('invalidateOtherSessions')}
              type="checkbox"
              id="invalidate"
              className="w-4 h-4 text-navy-950 rounded"
            />
            <label htmlFor="invalidate" className="text-slate-700 font-medium">
              Sign out from all other devices and active browser sessions
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-xs transition"
          >
            Update Password
          </button>
        </div>
      </form>

      {/* Active Login Sessions (Section 11.2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Active Login Sessions</h2>
            <p className="text-slate-500 text-[11px]">
              Review all browsers and mobile apps currently authorized with your customer credentials.
            </p>
          </div>

          {activeSessions.length > 1 && (
            <button
              onClick={handleRevokeAllOtherSessions}
              className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Other Devices</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {activeSessions.map((sess) => {
            const Icon = sess.icon;
            return (
              <div
                key={sess.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sess.device}</span>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          This Device
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      IP: {sess.ip} • <span className="font-semibold text-slate-700">{sess.lastActive}</span>
                    </div>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
