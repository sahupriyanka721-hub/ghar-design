import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext.js';
import { Bell, ShieldCheck, Mail, MessageSquare, Smartphone, Save } from 'lucide-react';

export const NotificationPreferences: React.FC = () => {
  const { success } = useToast();

  const [dailyReports, setDailyReports] = useState(true);
  const [milestoneApprovals, setMilestoneApprovals] = useState(true);
  const [materialDispatches, setMaterialDispatches] = useState(true);
  const [designSubmissions, setDesignSubmissions] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Notification preferences updated successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold font-display text-navy-950">Notification Preferences</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure how and when you receive project site reports, milestone payment alerts, and contractor messages.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-400">Site Execution & Milestone Alerts</h2>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">Daily Site Reports (DSR) Notifications</div>
              <div className="text-[11px] text-slate-500">Alert me when the site engineer posts daily logs and work photos.</div>
            </div>
            <input
              type="checkbox"
              checked={dailyReports}
              onChange={(e) => setDailyReports(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">Milestone Review & Escrow Release Alerts</div>
              <div className="text-[11px] text-slate-500">Notify me immediately when contractor claims milestone completion.</div>
            </div>
            <input
              type="checkbox"
              checked={milestoneApprovals}
              onChange={(e) => setMilestoneApprovals(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">Building Material Dispatch & Delivery Tracking</div>
              <div className="text-[11px] text-slate-500">Alerts when cement, TMT steel, or sand trucks arrive at site.</div>
            </div>
            <input
              type="checkbox"
              checked={materialDispatches}
              onChange={(e) => setMaterialDispatches(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">Engineering Drawing & 3D Render Approvals</div>
              <div className="text-[11px] text-slate-500">Alerts when new 2D floor plans or 3D elevations are ready for sign-off.</div>
            </div>
            <input
              type="checkbox"
              checked={designSubmissions}
              onChange={(e) => setDesignSubmissions(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase text-slate-400">Communication Channels</h2>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900">WhatsApp Instant Alerts</div>
                <div className="text-[11px] text-slate-500">Real-time alerts sent to your registered mobile number.</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-bold text-slate-900">Email Summaries</div>
                <div className="text-[11px] text-slate-500">Weekly project summary and financial statements.</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-600" />
              <div>
                <div className="font-bold text-slate-900">SMS Notifications</div>
                <div className="text-[11px] text-slate-500">High-priority transactional alerts and OTP verifications.</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="h-4 w-4 rounded text-navy-900 focus:ring-navy-900"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-navy-950 hover:bg-navy-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Save className="w-4 h-4 text-gold-400" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
