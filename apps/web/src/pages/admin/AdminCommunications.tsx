import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Paperclip,
  Check,
  AlertTriangle,
  RotateCcw,
  CornerDownRight,
  Compass,
  User,
  Building,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
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
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import {
  getCommunicationThreads,
  getCommunicationThreadById,
  saveCommunicationThread,
  forwardMessageToTarget,
  requestClarificationOnMessage,
  holdRejectMessage,
  addAdminInternalNote,
  sendAdminRouterMessage,
  CommunicationThread,
  CommunicationMessage,
  CommunicationCategory,
} from '../../data/communicationDisputeStore.js';

export const AdminCommunications: React.FC = () => {
  const { success, error } = useToast();

  // Primary Workspace Mode: 'ROUTER' (Section 14) vs 'BROADCASTS'
  const [activeMode, setActiveMode] = useState<'ROUTER' | 'BROADCASTS'>('ROUTER');

  // ==========================================
  // SECTION 14: CENTRAL ROUTER STATE
  // ==========================================
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Router
  const [forwardModalMsg, setForwardModalMsg] = useState<{ threadId: string; msg: CommunicationMessage } | null>(null);
  const [forwardNotes, setForwardNotes] = useState('Reviewed and forwarded by BuildGhar Admin Desk.');

  const [clarifyModalMsg, setClarifyModalMsg] = useState<{ threadId: string; msg: CommunicationMessage } | null>(null);
  const [clarifyReason, setClarifyReason] = useState('');

  const [holdModalMsg, setHoldModalMsg] = useState<{ threadId: string; msg: CommunicationMessage } | null>(null);
  const [holdReason, setHoldReason] = useState('');

  const [newInternalNote, setNewInternalNote] = useState('');
  const [adminDirectMsg, setAdminDirectMsg] = useState('');
  const [adminDirectTarget, setAdminDirectTarget] = useState<'CUSTOMER' | 'ARCHITECT'>('CUSTOMER');

  // ==========================================
  // BROADCAST NOTIFICATION STATE
  // ==========================================
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcastNotification[]>(() =>
    getPlatformBroadcastNotifications()
  );
  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [broadcastRoleFilter, setBroadcastRoleFilter] = useState<string>('ALL');
  const [broadcastChannelFilter, setBroadcastChannelFilter] = useState<string>('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<PlatformBroadcastNotification['targetRole']>('ALL');
  const [channel, setChannel] = useState<PlatformBroadcastNotification['channel']>('IN_APP');
  const [isSending, setIsSending] = useState(false);

  const loadData = () => {
    try {
      const thList = getCommunicationThreads();
      setThreads([...thList]);
      if (thList.length > 0 && !selectedThreadId) {
        setSelectedThreadId(thList[0].id);
      }
      setBroadcasts(getPlatformBroadcastNotifications());
    } catch (e) {
      console.error('Error loading communications:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('COMMUNICATION_THREADS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('COMMUNICATION_THREADS_UPDATED', handleUpdate);
    };
  }, []);

  const activeThread = useMemo(() => {
    if (!selectedThreadId) return threads[0] || null;
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  // Filtered Threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.threadCode.toLowerCase().includes(q);
        const matchSubj = t.subject.toLowerCase().includes(q);
        const matchCust = t.customerName.toLowerCase().includes(q);
        const matchArc = t.architectName.toLowerCase().includes(q) || t.architectFirm.toLowerCase().includes(q);
        const matchProj = t.projectId.toLowerCase().includes(q) || t.projectTitle.toLowerCase().includes(q);
        return matchCode || matchSubj || matchCust || matchArc || matchProj;
      }
      return true;
    });
  }, [threads, statusFilter, categoryFilter, searchQuery]);

  // Router Metrics
  const routerStats = useMemo(() => {
    let pendingMessages = 0;
    threads.forEach((t) => {
      t.messages.forEach((m) => {
        if (m.routingStatus === 'PENDING_ADMIN_ROUTING') pendingMessages++;
      });
    });

    const pendingReviewThreads = threads.filter((t) => t.status === 'PENDING_ADMIN_REVIEW').length;
    const forwardedThreads = threads.filter((t) => t.status === 'FORWARDED').length;
    const clarificationThreads = threads.filter((t) => t.status === 'CLARIFICATION_REQUESTED').length;
    const heldThreads = threads.filter((t) => t.status === 'HELD').length;

    return {
      pendingMessages,
      pendingReviewThreads,
      forwardedThreads,
      clarificationThreads,
      heldThreads,
      totalThreads: threads.length,
    };
  }, [threads]);

  // Router Actions
  const handleConfirmForward = () => {
    if (!forwardModalMsg) return;
    try {
      const updated = forwardMessageToTarget(forwardModalMsg.threadId, forwardModalMsg.msg.id, {
        forwardedBy: 'Super Admin',
        forwardingNotes: forwardNotes,
      });

      if (updated) {
        logAdminAuditAction({
          action: 'COMMUNICATION_FORWARDED',
          targetType: 'THREAD',
          targetId: updated.threadCode,
          description: `Admin forwarded message from ${forwardModalMsg.msg.senderName} (${forwardModalMsg.msg.senderRole}) to ${forwardModalMsg.msg.recipientName} (${forwardModalMsg.msg.recipientRole})`,
          metadata: { threadId: updated.id, messageId: forwardModalMsg.msg.id },
        });

        success(`Message routed & forwarded to ${forwardModalMsg.msg.recipientName} successfully!`);
        loadData();
        setForwardModalMsg(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to forward message');
    }
  };

  const handleConfirmClarification = () => {
    if (!clarifyModalMsg) return;
    if (!clarifyReason.trim()) {
      error('Please specify the clarification needed');
      return;
    }

    try {
      const updated = requestClarificationOnMessage(clarifyModalMsg.threadId, clarifyModalMsg.msg.id, {
        requestedBy: 'Super Admin',
        reason: clarifyReason.trim(),
      });

      if (updated) {
        logAdminAuditAction({
          action: 'COMMUNICATION_CLARIFICATION_REQUESTED',
          targetType: 'THREAD',
          targetId: updated.threadCode,
          description: `Clarification requested from ${clarifyModalMsg.msg.senderName}: ${clarifyReason.trim()}`,
        });

        success(`Clarification request sent to ${clarifyModalMsg.msg.senderName}.`);
        loadData();
        setClarifyModalMsg(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to request clarification');
    }
  };

  const handleConfirmHold = () => {
    if (!holdModalMsg) return;
    if (!holdReason.trim()) {
      error('Please specify why this message is being held or rejected');
      return;
    }

    try {
      const updated = holdRejectMessage(holdModalMsg.threadId, holdModalMsg.msg.id, {
        heldBy: 'Super Admin',
        reason: holdReason.trim(),
        action: 'HELD',
      });

      if (updated) {
        logAdminAuditAction({
          action: 'COMMUNICATION_HELD',
          targetType: 'THREAD',
          targetId: updated.threadCode,
          description: `Blocked/Held communication message: ${holdReason.trim()}`,
        });

        success(`Message flagged and held. Recipient will not receive this content.`);
        loadData();
        setHoldModalMsg(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to hold message');
    }
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newInternalNote.trim()) return;

    try {
      addAdminInternalNote(activeThread.id, newInternalNote.trim());
      logAdminAuditAction({
        action: 'COMMUNICATION_INTERNAL_NOTE_ADDED',
        targetType: 'THREAD',
        targetId: activeThread.threadCode,
        description: `Added private internal note on project ${activeThread.projectId}`,
      });
      success('Internal note saved (Private to Admin).');
      setNewInternalNote('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to add note');
    }
  };

  const handleSendAdminRouterMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !adminDirectMsg.trim()) return;

    try {
      sendAdminRouterMessage(activeThread.id, {
        content: adminDirectMsg.trim(),
        targetRole: adminDirectTarget,
        adminName: 'BuildGhar Central Admin Desk',
      });

      logAdminAuditAction({
        action: 'ADMIN_ROUTER_DIRECT_MESSAGE',
        targetType: 'THREAD',
        targetId: activeThread.threadCode,
        description: `Admin sent advisory message to ${adminDirectTarget} on ${activeThread.projectTitle}`,
      });

      success(`Official Admin message delivered to ${adminDirectTarget}.`);
      setAdminDirectMsg('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to send direct message');
    }
  };

  // Broadcast handlers
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      error('Please enter both title and message body');
      return;
    }
    setIsSending(true);
    try {
      const newBroadcast = sendPlatformBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
        targetRole,
        channel,
        sentBy: 'Super Admin',
      });

      recordPlatformAuditLog({
        action: 'BROADCAST_NOTIFICATION_SENT',
        entityType: 'NOTIFICATION',
        entityId: newBroadcast.id,
        performedBy: 'Super Admin',
        details: `Sent ${channel} announcement to ${targetRole}: "${title.trim()}"`,
      });

      setBroadcasts(getPlatformBroadcastNotifications());
      success(`Broadcast dispatched via ${channel} to ${targetRole}!`);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      error(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Communication Router & In-Flight Messaging
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 14 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Governance: All Customer ⇄ Architect dialogue passes through Admin Routing for review, mediation, and audit tracking.
          </p>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('ROUTER')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeMode === 'ROUTER'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Central Router Desk</span>
            {routerStats.pendingMessages > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono animate-pulse">
                {routerStats.pendingMessages}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMode('BROADCASTS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeMode === 'BROADCASTS'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Broadcasts & Alerts</span>
          </button>
        </div>
      </div>

      {activeMode === 'ROUTER' ? (
        <>
          {/* Router KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/20 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                <span>Pending Admin Routing</span>
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-950 font-display">
                {routerStats.pendingMessages}
              </div>
              <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Across {routerStats.pendingReviewThreads} thread(s) awaiting approval</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Forwarded & In-Flight</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-navy-950 font-display">
                {routerStats.forwardedThreads}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                Successfully routed business conversations
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Clarification Pending</span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-950 font-display">
                {routerStats.clarificationThreads}
              </div>
              <div className="text-[11px] text-blue-700 font-medium">
                Sent back to sender for details
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Held / Flagged Content</span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-950 font-display">
                {routerStats.heldThreads}
              </div>
              <div className="text-[11px] text-rose-700 font-medium">
                Blocked contractually or policy violations
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search threads by Subject, Customer Name, Architect Name, Project ID (BG-2026-XXXX)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="ALL">All Routing Statuses</option>
                <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
                <option value="FORWARDED">Forwarded</option>
                <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
                <option value="HELD">Held / Flagged</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="DESIGN_INQUIRY">Design Inquiry</option>
                <option value="TECHNICAL_CLARIFICATION">Technical Clarification</option>
                <option value="TIMELINE_QUERY">Timeline Query</option>
                <option value="BUDGET_REVISION">Budget Revision</option>
                <option value="SITE_CONDITION">Site Condition</option>
              </select>
            </div>
          </div>

          {/* Master-Detail Split Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Thread List (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Active Communication Threads</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700 font-mono">
                  {filteredThreads.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No communication threads matching criteria
                  </div>
                ) : (
                  filteredThreads.map((t) => {
                    const isSelected = activeThread?.id === t.id;
                    const hasPending = t.messages.some((m) => m.routingStatus === 'PENDING_ADMIN_ROUTING');

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedThreadId(t.id)}
                        className={`p-4 cursor-pointer transition relative hover:bg-slate-50/90 ${
                          isSelected
                            ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                            : 'border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {t.projectId}
                            </span>
                            <span className="text-[11px] font-bold text-navy-950 truncate max-w-[140px]">
                              {t.threadCode}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDate(t.latestMessageAt)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1.5">
                          {t.subject}
                        </h4>

                        {/* Parties info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-800">{t.customerName}</span>
                            <span className="text-slate-400">⇄</span>
                            <span className="font-medium text-blue-700 truncate max-w-[130px]">
                              {t.designerName ? `Interior: ${t.designerName}` : t.architectName || 'Assigned Partner'}
                            </span>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center justify-between gap-1.5">
                          <Badge
                            variant={
                              t.category === 'DESIGN_INQUIRY'
                                ? 'purple'
                                : t.category === 'TECHNICAL_CLARIFICATION'
                                ? 'blue'
                                : 'slate'
                            }
                            className="text-[9px] font-bold"
                          >
                            {t.category.replace(/_/g, ' ')}
                          </Badge>

                          {hasPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Needs Routing</span>
                            </span>
                          ) : t.status === 'FORWARDED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Forwarded</span>
                            </span>
                          ) : t.status === 'CLARIFICATION_REQUESTED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                              <HelpCircle className="w-3 h-3 text-blue-600" />
                              <span>Clarifying</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Held</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Message Routing Canvas (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {activeThread ? (
                <>
                  {/* Thread Context Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {activeThread.projectId}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 font-bold">
                            {activeThread.threadCode}
                          </span>
                        </div>
                        <h2 className="text-sm font-bold text-navy-950 mt-1">{activeThread.subject}</h2>
                        <div className="text-[11px] text-slate-500">{activeThread.projectTitle}</div>
                      </div>

                      <div className="text-right">
                        <Badge variant="blue" className="text-[10px] font-bold uppercase tracking-wider">
                          {activeThread.direction.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Parties Overview */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</div>
                        <div className="font-bold text-slate-900">{activeThread.customerName}</div>
                        <div className="text-[11px] text-slate-500">{activeThread.customerPhone}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {activeThread.designerName ? 'Interior Designer' : 'Architect Partner'}
                        </div>
                        <div className="font-bold text-blue-950">
                          {activeThread.designerName || activeThread.architectName || 'Assigned Partner'}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {activeThread.designerFirm || activeThread.architectFirm || 'Design Partner'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-4">
                    {activeThread.messages.map((msg) => {
                      const isCustomer = msg.senderRole === 'CUSTOMER';
                      const isArchitect = msg.senderRole === 'ARCHITECT';
                      const isAdmin = msg.senderRole === 'ADMIN';

                      return (
                        <div
                          key={msg.id}
                          className={`rounded-2xl border p-4 text-xs space-y-3 transition shadow-2xs ${
                            isAdmin
                              ? 'bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-blue-950'
                              : msg.routingStatus === 'PENDING_ADMIN_ROUTING'
                              ? 'bg-amber-50/40 border-amber-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/50">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isAdmin
                                    ? 'bg-white text-navy-950'
                                    : isCustomer
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {isAdmin ? 'BG' : msg.senderName.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{msg.senderName}</span>
                                  <Badge
                                    variant={isAdmin ? 'emerald' : isCustomer ? 'purple' : 'blue'}
                                    className="text-[9px] py-0"
                                  >
                                    {msg.senderRole}
                                  </Badge>
                                </div>
                                <div
                                  className={`text-[10px] ${
                                    isAdmin ? 'text-blue-200' : 'text-slate-400'
                                  }`}
                                >
                                  To: {msg.recipientName} ({msg.recipientRole}) • {formatDate(msg.timestamp)}
                                </div>
                              </div>
                            </div>

                            {/* Routing Status */}
                            <div>
                              {msg.routingStatus === 'PENDING_ADMIN_ROUTING' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Needs Admin Routing</span>
                                </span>
                              )}
                              {msg.routingStatus === 'FORWARDED_TO_TARGET' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Forwarded by Admin</span>
                                </span>
                              )}
                              {msg.routingStatus === 'CLARIFICATION_PENDING' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <HelpCircle className="w-3 h-3 text-blue-600" />
                                  <span>Clarification Requested</span>
                                </span>
                              )}
                              {msg.routingStatus === 'HELD_FLAGGED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Held by Admin</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className={`text-xs leading-relaxed ${isAdmin ? 'text-blue-50' : 'text-slate-800'}`}>
                            {msg.content}
                          </div>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-2">
                              {msg.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-[11px] ${
                                    isAdmin
                                      ? 'bg-blue-800/50 border-blue-700 text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="font-medium">{att.name}</span>
                                  {att.size && <span className="text-[10px] opacity-70">({att.size})</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Forwarding / Clarification Audit Notes */}
                          {msg.forwardingNotes && (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                              <span className="font-bold">Admin Forwarding Note: </span>
                              {msg.forwardingNotes}
                            </div>
                          )}
                          {msg.clarificationRequest && (
                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                              <span className="font-bold">Clarification Sent to Sender: </span>
                              {msg.clarificationRequest}
                            </div>
                          )}
                          {msg.holdReason && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                              <span className="font-bold">Hold Reason: </span>
                              {msg.holdReason}
                            </div>
                          )}

                          {/* Admin Action Buttons for Pending Message */}
                          {msg.routingStatus === 'PENDING_ADMIN_ROUTING' && (
                            <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setHoldModalMsg({ threadId: activeThread.id, msg });
                                  setHoldReason('');
                                }}
                                className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1 transition"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Hold / Reject</span>
                              </button>

                              <button
                                onClick={() => {
                                  setClarifyModalMsg({ threadId: activeThread.id, msg });
                                  setClarifyReason('');
                                }}
                                className="px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-1 transition"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Ask Clarification</span>
                              </button>

                              <button
                                onClick={() => {
                                  setForwardModalMsg({ threadId: activeThread.id, msg });
                                  setForwardNotes(
                                    `Reviewed and forwarded by BuildGhar Admin Desk for ${msg.recipientName}.`
                                  );
                                }}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                              >
                                <Check className="w-4 h-4" />
                                <span>Forward to {msg.recipientRole}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Private Internal Admin Notes (Strictly Confidential - Section 14) */}
                  <div className="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Internal Admin Notes (Strictly Confidential)
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-full">
                        Never visible to Customer or Architect
                      </span>
                    </div>

                    {activeThread.internalAdminNotes && activeThread.internalAdminNotes.length > 0 && (
                      <div className="space-y-1.5">
                        {activeThread.internalAdminNotes.map((note, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 font-medium"
                          >
                            • {note}
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleAddInternalNote} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add confidential internal admin observation or checklist note..."
                        value={newInternalNote}
                        onChange={(e) => setNewInternalNote(e.target.value)}
                        className="flex-1 p-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                      />
                      <button
                        type="submit"
                        disabled={!newInternalNote.trim()}
                        className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        Add Private Note
                      </button>
                    </form>
                  </div>

                  {/* Send Admin Advisory Message (Direct Intervention) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Send Official Platform Routing Message</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Recipient:</span>
                        <select
                          value={adminDirectTarget}
                          onChange={(e) => setAdminDirectTarget(e.target.value as any)}
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
                        >
                          <option value="CUSTOMER">Customer ({activeThread.customerName})</option>
                          <option value="ARCHITECT">Architect ({activeThread.architectName})</option>
                        </select>
                      </div>
                    </div>

                    <form onSubmit={handleSendAdminRouterMessage} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder={`Type official guidance or contractual advice for ${adminDirectTarget}...`}
                        value={adminDirectMsg}
                        onChange={(e) => setAdminDirectMsg(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!adminDirectMsg.trim()}
                          className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Deliver Official Advice</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  Select a communication thread from the left to begin admin routing.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* BROADCAST NOTIFICATIONS WORKSPACE */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Compose Broadcast (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Compose Platform Broadcast</h3>
                  <p className="text-[11px] text-slate-500">Dispatch SMS, WhatsApp, or In-App alerts</p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Stakeholder Group</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="ALL">All Platform Users ({getRegisteredCustomers().length + getArchitectAccounts().length + getPlatformContractors().length})</option>
                    <option value="CUSTOMERS">Homeowners / Customers ({getRegisteredCustomers().length})</option>
                    <option value="ARCHITECTS">Architect Partners ({getArchitectAccounts().length})</option>
                    <option value="CONTRACTORS">Civil Contractors ({getPlatformContractors().length})</option>
                    <option value="VENDORS">Material Vendors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispatch Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['IN_APP', 'WHATSAPP', 'SMS'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                          channel === ch
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ch.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsoon Site Protection Advisory..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Message Body</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type broadcast announcement message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-gold w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Dispatching...' : 'Dispatch Platform Broadcast'}</span>
                </button>
              </form>
            </div>

            {/* Broadcast History (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-950">Broadcast Audit Log</h3>
                  <p className="text-[11px] text-slate-500">Historical announcements and delivery telemetry</p>
                </div>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  {broadcasts.length} Dispatched
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                {broadcasts.map((b) => (
                  <div key={b.id} className="p-4 hover:bg-slate-50 transition space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-navy-950 flex items-center gap-1.5">
                        <span>{b.title}</span>
                        <Badge variant="blue" className="text-[9px] py-0">
                          {b.targetRole}
                        </Badge>
                        <Badge variant="slate" className="text-[9px] py-0">
                          {b.channel}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(b.sentAt)}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">{b.message}</p>

                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100">
                      <span>Sender: {b.sentBy || 'Super Admin'}</span>
                      <span className="font-semibold text-emerald-600">DELIVERED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardModalMsg && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Forward Message Through Admin Router</h3>
                  <p className="text-[11px] text-slate-500">
                    To: {forwardModalMsg.msg.recipientName} ({forwardModalMsg.msg.recipientRole})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForwardModalMsg(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                "{forwardModalMsg.msg.content}"
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Admin Forwarding Remark / Regulatory Note
                </label>
                <textarea
                  rows={2}
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                <span className="font-bold">Governance Check: </span>
                This message will now appear in {forwardModalMsg.msg.recipientRole}'s portal with verified BuildGhar routing stamp.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setForwardModalMsg(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForward}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {clarifyModalMsg && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Request Clarification from Sender</h3>
                  <p className="text-[11px] text-slate-500">
                    To: {clarifyModalMsg.msg.senderName} ({clarifyModalMsg.msg.senderRole})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClarifyModalMsg(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Specify Clarification Required <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Please specify the room dimensions or attach structural engineer calculation sheet before we forward to architect..."
                  value={clarifyReason}
                  onChange={(e) => setClarifyReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setClarifyModalMsg(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClarification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send Clarification Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {holdModalMsg && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Hold / Block Inappropriate Message</h3>
                  <p className="text-[11px] text-slate-500">
                    From: {holdModalMsg.msg.senderName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHoldModalMsg(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for Holding / Blocking Content <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Direct contact details sharing violation or unapproved scope expansion..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setHoldModalMsg(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHold}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Freeze & Block Message</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
