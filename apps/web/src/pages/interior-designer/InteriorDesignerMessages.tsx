import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  User,
  Building,
  HardHat,
  Filter,
  Sparkles,
  ArrowRight,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  getCommunicationThreads,
  getCommunicationThreadById,
  sendRoutedMessage,
  getVisibleMessagesForRole,
  CommunicationThread,
  CommunicationMessage,
  MessageSenderRole,
} from '../../data/communicationDisputeStore.js';
import { getInteriorProjects } from '../../data/interiorDesignerStore.js';

export const InteriorDesignerMessages: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<string>('ALL');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);

  // New thread form state
  const [newProjectId, setNewProjectId] = useState('');
  const [newRecipientRole, setNewRecipientRole] = useState<'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR'>('CUSTOMER');
  const [newSubject, setNewSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  const projects = getInteriorProjects();

  const loadThreads = () => {
    try {
      const all = getCommunicationThreads();
      // Filter threads relevant to interior designer
      const designerThreads = all.filter(
        (t) =>
          t.designerId === 'INT-DES-2026-001' ||
          t.designerId === 'id-101' ||
          t.direction.startsWith('DESIGNER') ||
          t.direction.endsWith('DESIGNER') ||
          t.id.includes('INT')
      );
      setThreads(designerThreads);
      if (designerThreads.length > 0 && !selectedThreadId) {
        setSelectedThreadId(designerThreads[0].id);
      }
    } catch (e) {
      console.error('Failed to load communication threads:', e);
    }
  };

  useEffect(() => {
    loadThreads();
    const handleUpdate = () => loadThreads();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('COMMUNICATION_THREADS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('COMMUNICATION_THREADS_UPDATED', handleUpdate);
    };
  }, []);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  // Filter messages visible to Interior Designer (Section 15 & Test 7)
  const visibleMessages = activeThread
    ? getVisibleMessagesForRole(activeThread, 'INTERIOR_DESIGNER')
    : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThread) return;

    setIsSending(true);
    try {
      // Determine recipient role based on direction or active party
      const isCustomerTarget =
        activeThread.direction.includes('CUSTOMER') || !activeThread.architectId;
      const recipientRole: MessageSenderRole = isCustomerTarget
        ? 'CUSTOMER'
        : activeThread.contractorId
        ? 'CONTRACTOR'
        : 'ARCHITECT';

      const recipientName =
        recipientRole === 'CUSTOMER'
          ? activeThread.customerName
          : recipientRole === 'CONTRACTOR'
          ? activeThread.contractorName || 'Assigned Contractor'
          : activeThread.architectName || 'Assigned Architect';

      sendRoutedMessage({
        threadId: activeThread.id,
        senderRole: 'INTERIOR_DESIGNER',
        senderName: user?.name || 'Aanya Sharma (Interior Designer)',
        recipientRole,
        recipientName,
        content: replyContent.trim(),
      });

      setReplyContent('');
      loadThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (recipientFilter === 'CUSTOMER') {
      return t.direction.includes('CUSTOMER');
    }
    if (recipientFilter === 'ARCHITECT') {
      return t.direction.includes('ARCHITECT') || !!t.architectId;
    }
    if (recipientFilter === 'CONTRACTOR') {
      return t.direction.includes('CONTRACTOR') || !!t.contractorId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Centralized Admin-Moderated Communication Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Project Communications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            BuildGhar security workflow: All messages to Homeowners, Architects, and Contractors are audited and routed through the Admin Desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Direct Client Contact Restricted (Section 15 Policy)</span>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Thread List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                Conversations ({filteredThreads.length})
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setRecipientFilter('ALL')}
                className={`py-1 rounded-lg transition ${
                  recipientFilter === 'ALL' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRecipientFilter('CUSTOMER')}
                className={`py-1 rounded-lg transition ${
                  recipientFilter === 'CUSTOMER' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => setRecipientFilter('ARCHITECT')}
                className={`py-1 rounded-lg transition ${
                  recipientFilter === 'ARCHITECT' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Architect
              </button>
              <button
                onClick={() => setRecipientFilter('CONTRACTOR')}
                className={`py-1 rounded-lg transition ${
                  recipientFilter === 'CONTRACTOR' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Site/Vendor
              </button>
            </div>
          </div>

          {/* Threads Scroll List */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No conversations found in this category.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = t.id === activeThread?.id;
                const lastMsg = t.messages[t.messages.length - 1];
                const hasPending = t.messages.some(
                  (m) => m.senderRole === 'INTERIOR_DESIGNER' && m.routingStatus === 'PENDING_ADMIN_ROUTING'
                );

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {t.threadCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(t.latestMessageAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="font-black text-slate-900 text-xs truncate">
                      {t.subject}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{t.customerName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 truncate">{t.projectTitle}</span>
                    </div>

                    {hasPending && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Awaiting Admin Routing</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Stream (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50/50">
          {activeThread ? (
            <>
              {/* Top Chat Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {activeThread.threadCode}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {activeThread.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {activeThread.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Project: <strong className="text-slate-700">{activeThread.projectTitle}</strong></span>
                    <span>•</span>
                    <span>Customer: <strong className="text-slate-700">{activeThread.customerName}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      activeThread.status === 'FORWARDED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeThread.status === 'FORWARDED' ? 'Route Active' : 'Under Admin Review'}
                  </span>
                </div>
              </div>

              {/* Security Advisory Bar */}
              <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Admin Mediation Guarantee:</strong> Your outgoing messages are first reviewed by BuildGhar QA before forwarding to client. Direct payment discussions or contract revisions must go through official BuildGhar quotation modules.
                </span>
              </div>

              {/* Messages Stream */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 max-h-[480px]">
                {visibleMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No messages in this conversation yet. Send a message below to start routed discussion.
                  </div>
                ) : (
                  visibleMessages.map((msg) => {
                    const isDesigner = msg.senderRole === 'INTERIOR_DESIGNER';
                    const isPending = msg.routingStatus === 'PENDING_ADMIN_ROUTING';
                    const isForwarded = msg.routingStatus === 'FORWARDED_TO_TARGET';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isDesigner ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700">{msg.senderName}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs text-xs space-y-2 ${
                            isDesigner
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="pt-2 border-t border-white/20 space-y-1">
                              {msg.attachments.map((att, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center justify-between p-2 rounded-xl text-[11px] ${
                                    isDesigner ? 'bg-blue-700/60' : 'bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span className="font-medium truncate">{att.name}</span>
                                  </div>
                                  <span className="font-mono opacity-80 text-[10px]">
                                    {att.size}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Routing Badge Footer */}
                          <div className="pt-1 flex items-center justify-end gap-1.5 text-[10px] font-bold">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 text-amber-200 bg-amber-900/40 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-amber-300" />
                                <span>Pending Admin Review</span>
                              </span>
                            )}
                            {isForwarded && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                                  isDesigner
                                    ? 'text-emerald-100 bg-emerald-800/40'
                                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Forwarded by Admin Desk</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Reply Form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
                    <textarea
                      rows={2}
                      placeholder="Type your design query or technical update (Will be reviewed by BuildGhar Admin before routing)..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-xs text-slate-900 resize-none p-1"
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Shift + Enter for new line</span>
                      <span>Admin-Controlled Channel</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !replyContent.trim()}
                    className="h-14 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition"
                  >
                    <span>Send to Admin</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Thread Selected</h3>
              <p className="text-xs mt-1 max-w-sm">
                Select an active conversation from the left panel to review moderated messages and project updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};