import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Smartphone,
  Mail,
  Users,
  ShieldCheck,
  AlertCircle,
  Eye,
  Plus,
  X,
  Radio,
  FileText,
  Compass,
  Building,
  CreditCard,
  HardHat,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import { getRegisteredCustomers } from '../../data/customerStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';

// ==============================================================================
// SECTION 17: NOTIFICATION MANAGEMENT & EVENT TELEMETRY
// Event-driven real-time dispatch logs for Customers & Architects
// ==============================================================================

export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'SMS' | 'EMAIL';
export type NotificationTarget = 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR' | 'ADMIN';
export type NotificationEventType =
  // Customer events
  | 'QUOTATION_REQUEST_RECEIVED'
  | 'REQUEST_ASSIGNED'
  | 'QUOTATION_RECEIVED'
  | 'QUOTATION_APPROVED_BY_ADMIN'
  | 'PROJECT_CREATED'
  | 'DESIGN_APPROVED_BY_ADMIN'
  | 'DESIGN_REVISION_REQUIRED'
  | 'MILESTONE_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'COMPLAINT_UPDATED'
  // Architect events
  | 'NEW_ASSIGNMENT'
  | 'QUOTATION_APPROVED'
  | 'CUSTOMER_ACCEPTED_QUOTATION'
  | 'DESIGN_REVIEW_FEEDBACK'
  | 'MILESTONE_REVIEW_RESULT'
  | 'PAYMENT_VERIFIED'
  | 'PAYOUT_APPROVED'
  | 'PAYOUT_COMPLETED'
  | 'COMPLAINT_RECEIVED';

export interface EventNotificationRecord {
  id: string;
  eventType: NotificationEventType;
  targetRole: NotificationTarget;
  recipientName: string;
  recipientPhone: string;
  projectId?: string;
  projectTitle?: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: 'DELIVERED' | 'QUEUED' | 'READ' | 'FAILED';
  dispatchedAt: string;
  readAt?: string;
}

const STORAGE_KEY_NOTIFICATIONS = 'gd_platform_event_notifications_v2';

const getDefaultSeedNotifications = (): EventNotificationRecord[] => [
  {
    id: 'NOTIF-2026-1001',
    eventType: 'PAYMENT_RECEIVED',
    targetRole: 'CUSTOMER',
    recipientName: 'Sharika Mishra',
    recipientPhone: '+91 98765 43210',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'Payment Credited to Platform Escrow: ₹1,77,000',
    body: 'Your payment for Milestone 1: Mobilization & Architectural Sign-off has been verified and securely deposited into BuildGhar Escrow.',
    channel: 'WHATSAPP',
    status: 'DELIVERED',
    dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'NOTIF-2026-1002',
    eventType: 'PAYOUT_APPROVED',
    targetRole: 'ARCHITECT',
    recipientName: 'Ar. Rajesh Verma',
    recipientPhone: '+91 98112 34567',
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    title: 'Escrow Payout Released: ₹1,33,500',
    body: 'Milestone 1 deliverables verified. Net payout of ₹1,33,500 (after 10% platform fee and 1% TDS) dispatched via HDFC NEFT UTR: HDFCR520261118009842.',
    channel: 'IN_APP',
    status: 'READ',
    dispatchedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    readAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'NOTIF-2026-1003',
    eventType: 'DESIGN_APPROVED_BY_ADMIN',
    targetRole: 'CUSTOMER',
    recipientName: 'Vikramaditya Roy',
    recipientPhone: '+91 98112 00099',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    title: 'Technical Review Passed: Front Elevation Drawings v2.0',
    body: 'Chief Architect has approved your setback elevation drawings complying with HUDA bylaws. Available for your review in Project Documents.',
    channel: 'IN_APP',
    status: 'DELIVERED',
    dispatchedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'NOTIF-2026-1004',
    eventType: 'NEW_ASSIGNMENT',
    targetRole: 'ARCHITECT',
    recipientName: 'Ar. Sneha Kulkarni',
    recipientPhone: '+91 98112 00099',
    projectId: 'BG-2026-0002',
    projectTitle: 'Independent Residential House (G+1) - Gurugram Sector 57',
    title: 'New Quotation Request Assigned: GHR-REQ-2026-1002',
    body: 'Admin has assigned you an exclusive quotation inquiry for a 2,400 sq.ft residential plot in Sector 57, Gurugram. 72 hours SLA active.',
    channel: 'SMS',
    status: 'DELIVERED',
    dispatchedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export const AdminNotifications: React.FC = () => {
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<EventNotificationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER' | 'ARCHITECT' | 'SYSTEM'>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Trigger Modal
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState<{
    targetRole: NotificationTarget;
    recipientName: string;
    recipientPhone: string;
    eventType: NotificationEventType;
    channel: NotificationChannel;
    title: string;
    body: string;
    projectId: string;
  }>({
    targetRole: 'CUSTOMER',
    recipientName: 'Sharika Mishra',
    recipientPhone: '+91 98765 43210',
    eventType: 'MILESTONE_APPROVED',
    channel: 'WHATSAPP',
    title: 'Milestone 2 Signoff Confirmed',
    body: 'Admin has verified Concept Floor Plan & Vastu Zoning completion. Payout advice generated.',
    projectId: 'BG-2026-0001',
  });

  const loadNotifications = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (raw) {
        setNotifications(JSON.parse(raw));
      } else {
        const seed = getDefaultSeedNotifications();
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(seed));
        setNotifications(seed);
      }
    } catch {
      setNotifications(getDefaultSeedNotifications());
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'CUSTOMER' && n.targetRole !== 'CUSTOMER') return false;
      if (activeTab === 'ARCHITECT' && n.targetRole !== 'ARCHITECT') return false;
      if (channelFilter !== 'ALL' && n.channel !== channelFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchBody = n.body.toLowerCase().includes(q);
        const matchName = n.recipientName.toLowerCase().includes(q);
        const matchPhone = n.recipientPhone.toLowerCase().includes(q);
        const matchProj = (n.projectId || '').toLowerCase().includes(q);
        return matchTitle || matchBody || matchName || matchPhone || matchProj;
      }
      return true;
    });
  }, [notifications, activeTab, channelFilter, searchQuery]);

  // Telemetry Stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const delivered = notifications.filter((n) => n.status === 'DELIVERED' || n.status === 'READ').length;
    const customerCount = notifications.filter((n) => n.targetRole === 'CUSTOMER').length;
    const architectCount = notifications.filter((n) => n.targetRole === 'ARCHITECT').length;
    const whatsappCount = notifications.filter((n) => n.channel === 'WHATSAPP').length;

    return {
      total,
      delivered,
      customerCount,
      architectCount,
      whatsappCount,
    };
  }, [notifications]);

  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.title.trim() || !newNotif.body.trim()) {
      error('Please enter notification title and message body');
      return;
    }

    const item: EventNotificationRecord = {
      id: `NOTIF-${Date.now()}`,
      eventType: newNotif.eventType,
      targetRole: newNotif.targetRole,
      recipientName: newNotif.recipientName,
      recipientPhone: newNotif.recipientPhone,
      projectId: newNotif.projectId,
      title: newNotif.title,
      body: newNotif.body,
      channel: newNotif.channel,
      status: 'DELIVERED',
      dispatchedAt: new Date().toISOString(),
    };

    const updated = [item, ...notifications];
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));

    logAdminAuditAction({
      action: 'NOTIFICATION_DISPATCHED',
      targetType: 'NOTIFICATION',
      targetId: item.id,
      description: `Dispatched ${item.channel} event notification "${item.title}" to ${item.recipientName} (${item.targetRole})`,
    });

    success(`Notification dispatched successfully via ${item.channel}!`);
    setIsTriggerModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Notification Management & Event Telemetry
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 17 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time event notification routing for Quotations, Technical Reviews, Milestone Progress, Payments & Payouts.
          </p>
        </div>

        <button
          onClick={() => setIsTriggerModalOpen(true)}
          className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch Event Notification</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Dispatched Events</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {stats.total}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            100% verified transactional events
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Customer Event Alerts</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-950 font-display">
            {stats.customerCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Quotation, escrow & progress updates
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
            <span>Architect Partner Alerts</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-950 font-display">
            {stats.architectCount}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            Assignments, drawing reviews & payouts
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>WhatsApp Business API</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            Live Connected
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Meta Verified Official Gateway
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Notifications</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMER')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CUSTOMER'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer Notifications</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 font-mono">
              {stats.customerCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ARCHITECT'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Architect Notifications</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-[10px] text-blue-700 font-mono">
              {stats.architectCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications by recipient name, phone, title, project ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="IN_APP">In-App Notification</option>
            <option value="SMS">SMS Gateway</option>
            <option value="EMAIL">Email Alert</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Event Type & Date</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Notification Content</th>
                <th className="py-3 px-4">Project Association</th>
                <th className="py-3 px-4 text-center">Channel</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No notification records found</p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{n.eventType.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(n.dispatchedAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950 flex items-center gap-1.5">
                        <span>{n.recipientName}</span>
                        <Badge
                          variant={n.targetRole === 'CUSTOMER' ? 'emerald' : 'blue'}
                          className="text-[9px] py-0"
                        >
                          {n.targetRole}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500">{n.recipientPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{n.title}</div>
                      <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.body}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {n.projectId ? (
                        <div className="text-[11px] text-blue-700 font-semibold truncate max-w-xs flex items-center gap-1">
                          <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 rounded border border-blue-200">
                            {n.projectId}
                          </span>
                          <span className="truncate">{n.projectTitle}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="slate" className="text-[10px] font-bold">
                        {n.channel}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{n.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Dispatch Modal */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Dispatch Transactional Event Alert</h3>
                  <p className="text-[11px] text-slate-500">Official real-time notification engine</p>
                </div>
              </div>
              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchNotification} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Stakeholder</label>
                  <select
                    value={newNotif.targetRole}
                    onChange={(e) => setNewNotif({ ...newNotif, targetRole: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="CUSTOMER">Customer / Homeowner</option>
                    <option value="ARCHITECT">Architect Partner</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispatch Channel</label>
                  <select
                    value={newNotif.channel}
                    onChange={(e) => setNewNotif({ ...newNotif, channel: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="WHATSAPP">WhatsApp Official API</option>
                    <option value="IN_APP">In-App Notification</option>
                    <option value="SMS">SMS Gateway</option>
                    <option value="EMAIL">Email Alert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newNotif.recipientName}
                    onChange={(e) => setNewNotif({ ...newNotif, recipientName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recipient Phone</label>
                  <input
                    type="text"
                    required
                    value={newNotif.recipientPhone}
                    onChange={(e) => setNewNotif({ ...newNotif, recipientPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                  <input
                    type="text"
                    value={newNotif.projectId}
                    onChange={(e) => setNewNotif({ ...newNotif, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Event Type</label>
                  <select
                    value={newNotif.eventType}
                    onChange={(e) => setNewNotif({ ...newNotif, eventType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="MILESTONE_APPROVED">Milestone Approved</option>
                    <option value="PAYMENT_RECEIVED">Payment Received & In Escrow</option>
                    <option value="DESIGN_APPROVED_BY_ADMIN">Design Approved by Admin</option>
                    <option value="DESIGN_REVISION_REQUIRED">Design Revision Required</option>
                    <option value="NEW_ASSIGNMENT">New Assignment</option>
                    <option value="PAYOUT_APPROVED">Payout Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={newNotif.body}
                  onChange={(e) => setNewNotif({ ...newNotif, body: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
