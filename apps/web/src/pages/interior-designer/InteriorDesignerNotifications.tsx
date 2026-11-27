import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  FileCheck2,
  HardHat,
  AlertTriangle,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  getInteriorNotifications,
  markInteriorNotificationRead,
  markAllInteriorNotificationsRead,
  InteriorNotification,
  InteriorNotificationEventType,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InteriorNotification[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  const loadNotifications = () => {
    try {
      const list = getInteriorNotifications(user?.phone || 'id-101');
      setNotifications([...list]);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('interior_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('interior_notifications_updated', handleUpdate);
    };
  }, [user]);

  const handleMarkAsRead = (id: string) => {
    markInteriorNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllInteriorNotificationsRead(user?.phone || 'id-101');
    loadNotifications();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.read;
    if (filterType === 'PAYMENTS') {
      return (
        n.eventType === 'PAYMENT_VERIFIED' ||
        n.eventType === 'PAYOUT_APPROVED' ||
        n.eventType === 'PAYOUT_COMPLETED'
      );
    }
    if (filterType === 'DESIGNS') {
      return (
        n.eventType === 'DESIGN_REVIEW_FEEDBACK' ||
        n.eventType === 'DESIGN_APPROVED' ||
        n.eventType === 'REVISION_REQUESTED'
      );
    }
    if (filterType === 'QUOTATIONS') {
      return (
        n.eventType === 'NEW_ASSIGNMENT' ||
        n.eventType === 'QUOTATION_APPROVED' ||
        n.eventType === 'CUSTOMER_ACCEPTED_QUOTATION'
      );
    }
    if (filterType === 'DISPUTES') {
      return n.eventType === 'COMPLAINT_UPDATE';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getEventIcon = (type: InteriorNotificationEventType) => {
    switch (type) {
      case 'PAYOUT_APPROVED':
      case 'PAYOUT_COMPLETED':
      case 'PAYMENT_VERIFIED':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'DESIGN_APPROVED':
      case 'DESIGN_REVIEW_FEEDBACK':
      case 'REVISION_REQUESTED':
        return <FileCheck2 className="w-5 h-5 text-blue-600" />;
      case 'CUSTOMER_ACCEPTED_QUOTATION':
      case 'QUOTATION_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
      case 'COMPLAINT_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Channel Notification Dispatcher (Section 18)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Notifications Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time verified platform events: In-App, Email, SMS, and WhatsApp alerts for project milestones, escrow payouts, and customer reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <Check className="w-4 h-4 text-slate-500" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { key: 'ALL', label: `All Alerts (${notifications.length})` },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'PAYMENTS', label: 'Payments & Payouts' },
          { key: 'DESIGNS', label: 'Designs & Approvals' },
          { key: 'QUOTATIONS', label: 'Quotations & Bids' },
          { key: 'DISPUTES', label: 'Complaints & Audits' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
              filterType === tab.key
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No notifications found in this category.
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                  notif.read ? 'hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                    {getEventIcon(notif.eventType)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                      <span className="font-mono">
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <span>•</span>

                      {/* Multi-channel delivery badges */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Delivered via:</span>
                        {notif.channels.map((ch) => (
                          <span
                            key={ch}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold"
                          >
                            {ch === 'IN_APP' && <Bell className="w-2.5 h-2.5" />}
                            {ch === 'EMAIL' && <Mail className="w-2.5 h-2.5" />}
                            {ch === 'SMS' && <Smartphone className="w-2.5 h-2.5" />}
                            {ch === 'WHATSAPP' && <MessageSquare className="w-2.5 h-2.5" />}
                            <span>{ch}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};