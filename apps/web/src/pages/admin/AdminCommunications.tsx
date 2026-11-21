import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Bell,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Plus,
  X,
  Radio,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformBroadcastNotification,
  getPlatformBroadcastNotifications,
  sendPlatformBroadcastNotification,
  recordPlatformAuditLog,
  getPlatformContractors,
} from '../../data/adminStore.js';
import { getRegisteredCustomers } from '../../data/customerStore.js';
import { getArchitectAccounts } from '../../data/architectStore.js';
import { getInteriorDesignerAccounts } from '../../data/interiorDesignerStore.js';
import { getRegisteredVendors } from '../../data/vendorStore.js';

export const AdminCommunications: React.FC = () => {
  const { success, error } = useToast();
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcastNotification[]>(() =>
    getPlatformBroadcastNotifications()
  );
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  // Compose State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<PlatformBroadcastNotification['targetRole']>('ALL');
  const [channel, setChannel] = useState<PlatformBroadcastNotification['channel']>('IN_APP');
  const [isSending, setIsSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const refreshData = () => {
    setBroadcasts(getPlatformBroadcastNotifications());
  };

  const customersCount = getRegisteredCustomers().length;
  const architectsCount = getArchitectAccounts().length;
  const designersCount = getInteriorDesignerAccounts().length;
  const contractorsCount = getPlatformContractors().length;
  const vendorsCount = getRegisteredVendors().length;
  const totalUsers = customersCount + architectsCount + designersCount + contractorsCount + vendorsCount;

  const roleCounts: Record<PlatformBroadcastNotification['targetRole'], number> = {
    ALL: totalUsers,
    CUSTOMERS: customersCount,
    ARCHITECTS: architectsCount,
    INTERIOR_DESIGNERS: designersCount,
    CONTRACTORS: contractorsCount,
    VENDORS: vendorsCount,
  };

  const templates = [
    {
      title: 'Monsoon Site Protection & Waterproofing Protocol',
      message: 'Notice to all contractors & site engineers: Cover open excavation, cure foundation concrete, and safeguard cement bags from rain moisture.',
      role: 'CONTRACTORS' as const,
      channel: 'WHATSAPP' as const,
    },
    {
      title: 'Diwali Festive Discount: Flat 10% Off on Interior Packages',
      message: 'Celebrate this festive season with BuildGhar! Enjoy exclusive design consultations and 10% milestone savings on turnkey home interiors.',
      role: 'CUSTOMERS' as const,
      channel: 'SMS' as const,
    },
    {
      title: 'Mandatory GST & BIS Certification Verification Notice',
      message: 'Dear Material Vendor Partner, please ensure updated BIS certificates and GST filings are uploaded in your vendor portal before billing cycle.',
      role: 'VENDORS' as const,
      channel: 'IN_APP' as const,
    },
  ];

  const handleApplyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setTargetRole(tpl.role);
    setChannel(tpl.channel);
    success('Template loaded into composer');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      error('Please specify both title and message.');
      return;
    }

    setIsSending(true);
    try {
      const recipientEst = roleCounts[targetRole] || 150;
      const sent = sendPlatformBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
        targetRole,
        channel,
        sentBy: 'Super Administrator',
        recipientCount: recipientEst,
      });

      recordPlatformAuditLog({
        action: 'SEND_BROADCAST',
        module: 'COMMUNICATIONS',
        targetId: sent.id,
        performedBy: 'Super Administrator',
        notes: `Broadcast dispatched to ${targetRole} via ${channel} (${recipientEst} recipients)`,
      });

      success(`Broadcast successfully sent to ${recipientEst} recipients via ${channel}!`);
      setTitle('');
      setMessage('');
      refreshData();
    } catch {
      error('Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.message.toLowerCase().includes(search.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || b.targetRole === selectedRole;
      const matchesChannel = selectedChannel === 'ALL' || b.channel === selectedChannel;
      return matchesSearch && matchesRole && matchesChannel;
    });
  }, [broadcasts, search, selectedRole, selectedChannel]);

  const getChannelIcon = (ch: PlatformBroadcastNotification['channel']) => {
    switch (ch) {
      case 'IN_APP':
        return <Bell className="w-3.5 h-3.5 text-sky-600" />;
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Communications & Broadcast Hub</h1>
              <p className="text-xs text-slate-500">
                Multi-channel push notifications, SMS gateways, WhatsApp Business alerts, and platform announcements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Gateways Active</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Composer on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                <span>Compose Broadcast Notice</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                Est. {roleCounts[targetRole] || 150} Recipients
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Preset Templates</span>
              </p>
              <div className="space-y-1.5">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 text-xs transition group cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 group-hover:text-sky-700">{tpl.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{tpl.message}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Composer Form */}
            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Target Audience</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ALL', 'CUSTOMERS', 'ARCHITECTS', 'INTERIOR_DESIGNERS', 'CONTRACTORS', 'VENDORS'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRole(r)}
                      className={`p-2 rounded-xl text-center font-bold text-[10px] transition border cursor-pointer ${
                        targetRole === r
                          ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Dispatch Channel</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['IN_APP', 'SMS', 'WHATSAPP', 'EMAIL'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={`p-2 rounded-xl text-center font-bold text-[10px] flex flex-col items-center gap-1 transition border cursor-pointer ${
                        channel === ch
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getChannelIcon(ch)}
                      <span>{ch.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notice Headline / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 block">Message Body *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{message.length}/500 chars</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  placeholder="Write announcement body clearly. This will be broadcasted to all selected stakeholders..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Message Live Preview Card */}
              {title.trim() && (
                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5">
                  <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Live Recipient Preview ({channel})</span>
                  </p>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{message || 'Your message will appear here...'}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Transmitting Broadcast...' : `Dispatch Broadcast (${roleCounts[targetRole] || 150} Recipients)`}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Broadcast History & Analytics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by title or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMERS">Customers</option>
                <option value="ARCHITECTS">Architects</option>
                <option value="INTERIOR_DESIGNERS">Designers</option>
                <option value="CONTRACTORS">Contractors</option>
                <option value="VENDORS">Vendors</option>
              </select>

              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="IN_APP">In-App</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
          </div>

          {/* Broadcast Logs List */}
          <div className="space-y-3">
            {filteredBroadcasts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm">No broadcast history found.</p>
              </div>
            ) : (
              filteredBroadcasts.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-navy-950">{b.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1">
                          {getChannelIcon(b.channel)}
                          <span>{b.channel}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{b.message}</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{b.status}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">
                        Target: <span className="text-navy-950">{b.targetRole.replace(/_/g, ' ')}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Recipients: <span className="font-mono font-bold text-sky-700">{b.recipientCount}</span>
                      </span>
                      <span>•</span>
                      <span>Sender: {b.sentBy}</span>
                    </div>

                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(b.sentAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunications;
