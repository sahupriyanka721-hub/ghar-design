import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Check,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import {
  getArchitectNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  ArchitectNotificationItem,
} from '../../data/architectPanelStore.js';

export const ArchitectNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ArchitectNotificationItem[]>(() =>
    getArchitectNotifications()
  );
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const reloadNotifications = () => {
    setNotifications(getArchitectNotifications());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadNotifications);
    return () => window.removeEventListener('storage', reloadNotifications);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
    reloadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    reloadNotifications();
  };

  const filtered = notifications.filter((n) => (filter === 'UNREAD' ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider font-mono">
                Section 14 & 19 Notifications
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Real-time System Triggers
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              System Notifications & Alert Center
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl mt-1 leading-relaxed">
              Stay alerted on new homeowner assignments, Admin quotation approvals, client design sign-offs, and milestone escrow payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 rounded-xl bg-white text-navy-950 font-bold text-xs hover:bg-slate-100 transition shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'UNREAD'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const isAlert = item.severity === 'ALERT';
              const isWarning = item.severity === 'WARNING';
              const isSuccess = item.severity === 'SUCCESS';

              return (
                <div
                  key={item.id}
                  className={`py-3.5 flex items-start justify-between gap-4 transition ${
                    !item.read ? 'bg-sky-50/40 px-3 rounded-2xl' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isAlert
                          ? 'bg-rose-100 text-rose-600'
                          : isWarning
                          ? 'bg-amber-100 text-amber-600'
                          : isSuccess
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isAlert || isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-950">{item.title}</span>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.linkPath && (
                      <Link
                        to={item.linkPath}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!item.read && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2 text-slate-400">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
