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
  DollarSign,
  User,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import {
  getArchitectNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  ArchitectNotificationItem,
} from '../../data/architectPanelStore.js';
import { formatDate } from '../../lib/utils.js';

export const ArchitectNotifications: React.FC = () => {
  const ensureDefaultNotifications = (): ArchitectNotificationItem[] => {
    const stored = getArchitectNotifications();
    if (stored.length > 0) return stored;

    const defaultNotifs: ArchitectNotificationItem[] = [
      {
        id: 'notif-1',
        type: 'QUOTATION',
        title: 'New Architectural Request Assigned',
        message: 'Homeowner Sharika Mishra requested quotation for 30x50 ft G+2 villa design in Indore.',
        timestamp: '2026-11-24T14:30:00Z',
        read: false,
        severity: 'INFO',
        linkPath: '/professional/assigned',
      },
      {
        id: 'notif-2',
        type: 'DESIGN_APPROVAL',
        title: 'Ground Floor Plan Approved',
        message: 'Sharika Mishra signed off on V2.0 Ground Floor Architectural Plan. Escrow release queued.',
        timestamp: '2026-11-23T11:00:00Z',
        read: false,
        severity: 'SUCCESS',
        linkPath: '/professional/designs?tab=approvals',
      },
      {
        id: 'notif-3',
        type: 'PAYMENT',
        title: 'Escrow Milestone Fee Released',
        message: '₹48,000 mobilization advance disbursed to your registered HDFC bank account (UTR: HDFCR202611130987654).',
        timestamp: '2026-11-22T16:00:00Z',
        read: true,
        severity: 'SUCCESS',
        linkPath: '/professional/billing?tab=history',
      },
      {
        id: 'notif-4',
        type: 'SYSTEM',
        title: 'Indore Master Plan 2021 Bylaw Update',
        message: 'Municipal council updated maximum permissible FAR guidelines for residential plots on 40ft sector roads.',
        timestamp: '2026-11-20T09:00:00Z',
        read: true,
        severity: 'WARNING',
        linkPath: '/professional/designs',
      },
    ];

    try {
      localStorage.setItem('ghar_architect_notifications', JSON.stringify(defaultNotifs));
    } catch {}
    return defaultNotifs;
  };

  const [notifications, setNotifications] = useState<ArchitectNotificationItem[]>(ensureDefaultNotifications);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 14)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Bell className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  14. System Notifications & Activity Feed
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {unreadCount} Unread Alerts
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time triggers for lead assignments, Admin reviews, client drawing sign-offs, and bank escrow payouts.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          NOTIFICATIONS LIST & FILTER BAR
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`py-4 px-3 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.read ? 'bg-sky-50/50' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.severity === 'SUCCESS'
                      ? 'bg-blue-100 text-blue-900'
                      : n.severity === 'WARNING'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-sky-100 text-sky-900'
                  }`}>
                    {n.severity === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : n.severity === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {formatDate(n.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.linkPath && (
                    <Link
                      to={n.linkPath}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No notifications found under this filter.
          </div>
        )}
      </div>
    </div>
  );
};
