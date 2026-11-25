import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Bell,
  CheckCircle2,
  Info,
  Check,
  CreditCard,
  Truck,
  Layers,
  Settings,
  ShieldCheck,
  Building,
  Trash2,
} from 'lucide-react';
import { NotificationItem } from '@ghar-design/shared';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-active',
    type: 'SUCCESS',
    title: 'Milestone 2 Escrow Payment Verified',
    message: '₹2,50,000 for Ground Floor RCC Framing milestone has been released to contractor after your site inspection approval.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'usr-active',
    type: 'INFO',
    title: '150 Bags UltraTech Cement Dispatched',
    message: 'Material depot order GHR-ORD-8821 is out for delivery. Vehicle: HR-26-AB-1234. Expected delivery: 02:30 PM.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'usr-active',
    type: 'INFO',
    title: '3D Front Facade Render v2.0 Published',
    message: 'Ar. Rajesh Verma has uploaded the updated exterior night render in Section 7.3 Design Approvals for your review.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'notif-4',
    userId: 'usr-active',
    type: 'SUCCESS',
    title: 'Daily Site Report & Video Uploaded',
    message: 'Senior Site Engineer logged today’s shuttering inspection with 6 high-definition photos and drone walkthrough video.',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'notif-5',
    userId: 'usr-active',
    type: 'INFO',
    title: 'GST Tax Invoice Generated',
    message: 'Official Tax Invoice #INV-2026-042 with 18% GST breakdown for Foundation Casting is now available under Billing & Payments.',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PROJECTS' | 'PAYMENTS' | 'MATERIALS' | 'APPROVALS'>('ALL');

  useEffect(() => {
    apiRequest('/notifications')
      .then((res) => {
        const filtered = (res.data || []).filter(
          (n: any) =>
            n.userId !== 'usr-cust-1' &&
            !n.message?.includes('GHR-REQ-2026-1001') &&
            !n.message?.toLowerCase().includes('vikram')
        );
        if (filtered.length > 0) {
          setNotifications(filtered);
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS);
        }
      })
      .catch(() => {
        setNotifications(DEFAULT_NOTIFICATIONS);
      });
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (categoryFilter === 'ALL') return true;
    const msg = (n.title + ' ' + n.message).toLowerCase();
    if (categoryFilter === 'PROJECTS') return msg.includes('site') || msg.includes('rcc') || msg.includes('framing') || msg.includes('slab');
    if (categoryFilter === 'PAYMENTS') return msg.includes('payment') || msg.includes('escrow') || msg.includes('invoice') || msg.includes('₹');
    if (categoryFilter === 'MATERIALS') return msg.includes('cement') || msg.includes('material') || msg.includes('steel') || msg.includes('dispatched');
    if (categoryFilter === 'APPROVALS') return msg.includes('render') || msg.includes('approval') || msg.includes('design') || msg.includes('facade');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <Bell className="w-4 h-4" />
            <span>Section 11 &bull; Real-Time Alerts & Notification Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Project Alerts, Milestone Releases & Deliveries
          </h1>
          <p className="text-slate-500 mt-1">
            Live operational updates regarding your architectural designs, site visits, and material trucks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/notification-preferences"
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>11.2 Preferences</span>
          </Link>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="px-3.5 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'ALL', label: `All Alerts (${notifications.length})` },
            { id: 'PROJECTS', label: 'Site & Milestones' },
            { id: 'PAYMENTS', label: 'Payments & Escrow' },
            { id: 'MATERIALS', label: 'Material Dispatch' },
            { id: 'APPROVALS', label: 'Design Approvals' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                categoryFilter === cat.id
                  ? 'bg-navy-950 text-gold-400 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-slate-400 hover:text-rose-600 font-bold px-2 py-1 flex items-center gap-1 text-[11px] transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear List</span>
          </button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No Notifications in this Category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are fully up to date! Live status updates on your construction project and material dispatches will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isPayment = n.title.toLowerCase().includes('payment') || n.title.toLowerCase().includes('escrow') || n.title.toLowerCase().includes('invoice');
            const isMaterial = n.title.toLowerCase().includes('cement') || n.title.toLowerCase().includes('dispatched') || n.title.toLowerCase().includes('material');
            const isDesign = n.title.toLowerCase().includes('render') || n.title.toLowerCase().includes('elevation') || n.title.toLowerCase().includes('drawing');

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex items-start gap-4 transition shadow-2xs ${
                  !n.isRead
                    ? 'bg-amber-50/50 border-gold-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPayment
                      ? 'bg-emerald-100 text-emerald-700'
                      : isMaterial
                      ? 'bg-purple-100 text-purple-700'
                      : isDesign
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-navy-100 text-navy-950'
                  }`}
                >
                  {isPayment ? (
                    <CreditCard className="w-5 h-5" />
                  ) : isMaterial ? (
                    <Truck className="w-5 h-5" />
                  ) : isDesign ? (
                    <Layers className="w-5 h-5" />
                  ) : (
                    <Building className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-gold-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
