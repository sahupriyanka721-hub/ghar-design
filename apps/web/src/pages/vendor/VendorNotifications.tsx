import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Megaphone,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../lib/utils.js';
import {
  getVendorNotifications,
  markVendorNotificationAsRead,
  markAllVendorNotificationsAsRead,
} from '../../data/vendorStore.js';
import { VendorNotification } from '@ghar-design/shared';

export const VendorNotifications: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ORDER' | 'PAYMENT' | 'PRODUCT' | 'ANNOUNCEMENT'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const notifications = useMemo(() => {
    return getVendorNotifications(vendorId);
  }, [vendorId, refreshKey]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory === 'ALL') return true;
      return n.category === activeCategory;
    });
  }, [notifications, activeCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    markVendorNotificationAsRead(id);
    setRefreshKey((k) => k + 1);
  };

  const handleMarkAllRead = () => {
    markAllVendorNotificationsAsRead(vendorId);
    success('All depot alerts marked as read.');
    setRefreshKey((k) => k + 1);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ORDER':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'PRODUCT':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Depot Notifications & Alerts
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sub-order notifications, bank payout alerts, product review statuses and platform announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 bg-sky-50/30 hover:bg-slate-100 text-slate-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Alerts', value: 'ALL' },
            { label: 'Orders', value: 'ORDER' },
            { label: 'Payouts & Banking', value: 'PAYMENT' },
            { label: 'Product Approvals', value: 'PRODUCT' },
            { label: 'Platform Announcements', value: 'ANNOUNCEMENT' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeCategory === tab.value
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-100 border border-blue-200/80 rounded-xl overflow-hidden bg-white">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No notifications in this category.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition flex items-start justify-between gap-4 ${
                  !item.isRead ? 'bg-blue-50/40' : 'hover:bg-sky-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border border-blue-200/80 shadow-2xs shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      )}
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <Link
                      to={item.link}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition"
                      title="Mark as read"
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
