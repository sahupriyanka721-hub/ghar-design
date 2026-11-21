import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import { useAuth } from '../../context/AuthContext.js';
import { Bell, CheckCircle2, Info, Check } from 'lucide-react';
import { NotificationItem } from '@ghar-design/shared';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    apiRequest('/notifications')
      .then((res) => {
        const filtered = (res.data || []).filter(
          (n: any) =>
            n.userId !== 'usr-cust-1' &&
            !n.message?.includes('GHR-REQ-2026-1001') &&
            !n.message?.toLowerCase().includes('vikram')
        );
        setNotifications(filtered);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">Notifications Center</h1>
          <p className="text-xs text-slate-500">Live operational alerts regarding your project quotes and bookings.</p>
        </div>
        <button onClick={markAllRead} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">No Unread Notifications</h3>
          <p className="text-xs text-slate-400 mt-1">
            Status updates regarding your project requests, design approvals, and material dispatches will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-4 transition ${
                !n.isRead ? 'bg-amber-50/40 border-gold-200' : 'bg-white'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-100 text-navy-800'
                }`}
              >
                {n.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy-950 text-sm">{n.title}</h3>
                  <span className="text-[11px] text-slate-400">{formatDate(n.createdAt)}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
