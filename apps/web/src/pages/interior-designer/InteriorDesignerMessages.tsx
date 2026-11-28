import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  X,
  Plus,
  HelpCircle,
  History,
  Download,
  Check,
  Compass,
  Layers,
  ChevronRight,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  SendHorizontal,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  getCommunicationThreads,
  getCommunicationThreadById,
  sendRoutedMessage,
  getVisibleMessagesForRole,
  CommunicationThread,
  CommunicationMessage,
  MessageSenderRole,
  saveCommunicationThread,
} from '../../data/communicationDisputeStore.js';
import { getInteriorProjects } from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';

export type MessageViewMode =
  | 'ADMIN_MESSAGES'
  | 'PROJECT_COMMUNICATION'
  | 'CUSTOMER_MESSAGES_ROUTED'
  | 'ARCHITECT_COORDINATION'
  | 'CLARIFICATION_REQUESTS'
  | 'MESSAGE_HISTORY';

interface ClarificationTicket {
  id: string;
  rfiCode: string;
  projectId: string;
  projectTitle: string;
  targetDiscipline: 'ADMIN' | 'ARCHITECT' | 'CONTRACTOR' | 'PMC_ENGINEER';
  subject: string;
  description: string;
  drawingRef?: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  status: 'PENDING_ADMIN_RESPONSE' | 'CLARIFIED' | 'UNDER_SITE_INSPECTION';
  requestedAt: string;
  responseNote?: string;
  respondedAt?: string;
  respondedBy?: string;
}

const INITIAL_RFIS: ClarificationTicket[] = [
  {
    id: 'rfi-101',
    rfiCode: 'RFI-INT-2026-081',
    projectId: 'prj-int-1',
    projectTitle: 'DLF The Crest Penthouse Oasis',
    targetDiscipline: 'ARCHITECT',
    subject: 'Column Grid C-4 Drop Beam Elevation Level for False Ceiling Pelmet',
    description: 'Require approved structural beam bottom level to fix living room curtain pelmet drop without fouling sprinkler line.',
    drawingRef: 'DWG-STR-BEAM-04',
    priority: 'HIGH',
    status: 'CLARIFIED',
    requestedAt: '2026-11-22T10:30:00Z',
    responseNote: 'Sanctioned beam bottom level is +2850mm SSL. Maintain 150mm pelmet drop with GI suspenders anchored to main slab.',
    respondedAt: '2026-11-23T14:15:00Z',
    respondedBy: 'Ar. Rajesh Verma (Principal Architect)',
  },
  {
    id: 'rfi-102',
    rfiCode: 'RFI-INT-2026-082',
    projectId: 'prj-int-1',
    projectTitle: 'DLF The Crest Penthouse Oasis',
    targetDiscipline: 'PMC_ENGINEER',
    subject: 'Civil Contractor Trap Offset for Master Bathroom Freestanding Tub',
    description: 'Plumbing outlet rough-in is offset by 85mm from center of vanity axis. Request permission to core cut 50mm offset trap.',
    drawingRef: 'DWG-PLUMB-MBR-02',
    priority: 'CRITICAL',
    status: 'CLARIFIED',
    requestedAt: '2026-11-24T09:00:00Z',
    responseNote: 'Core cutting approved in screed layer only. Do not penetrate structural PT post-tension slab.',
    respondedAt: '2026-11-24T16:00:00Z',
    respondedBy: 'Er. Rakesh Sharma (BuildGhar PMC)',
  },
  {
    id: 'rfi-103',
    rfiCode: 'RFI-INT-2026-083',
    projectId: 'prj-int-1',
    projectTitle: 'DLF The Crest Penthouse Oasis',
    targetDiscipline: 'ADMIN',
    subject: 'Society RWA Working Hours Restriction for Sunday Veneer Sanding',
    description: 'RWA issued penalty notice for noisy woodworking on Sunday. Need Admin mediation for silent hand-polishing shift approval.',
    priority: 'NORMAL',
    status: 'PENDING_ADMIN_RESPONSE',
    requestedAt: '2026-11-27T11:45:00Z',
  },
];

export const InteriorDesignerMessages: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Mode
  const currentView = (searchParams.get('view') as MessageViewMode) || 'ADMIN_MESSAGES';
  const setViewMode = (mode: MessageViewMode) => {
    setSearchParams({ view: mode });
  };

  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<string>('ALL');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // RFI Clarification Requests State
  const [rfis, setRfis] = useState<ClarificationTicket[]>(INITIAL_RFIS);
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [newRfiSubject, setNewRfiSubject] = useState('');
  const [newRfiDiscipline, setNewRfiDiscipline] = useState<ClarificationTicket['targetDiscipline']>('ARCHITECT');
  const [newRfiPriority, setNewRfiPriority] = useState<ClarificationTicket['priority']>('HIGH');
  const [newRfiDesc, setNewRfiDesc] = useState('');
  const [newRfiDrawing, setNewRfiDrawing] = useState('DWG-INT-001');

  // New Thread Modal State
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadRecipient, setNewThreadRecipient] = useState<'ADMIN' | 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR'>('ADMIN');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');

  const loadThreads = () => {
    try {
      const all = getCommunicationThreads();
      // Ensure seed threads exist or fallback to mock
      const designerThreads = all.filter(
        (t) =>
          t.designerId === 'INT-DES-2026-001' ||
          t.designerId === 'id-101' ||
          t.direction.startsWith('DESIGNER') ||
          t.direction.endsWith('DESIGNER') ||
          t.direction === 'ADMIN_BROADCAST' ||
          t.id.includes('INT') ||
          t.projectId === selectedProjectId
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
  }, [selectedProjectId]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  const visibleMessages = activeThread
    ? getVisibleMessagesForRole(activeThread, 'INTERIOR_DESIGNER')
    : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThread) return;

    setIsSending(true);
    try {
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
      success('Message sent! Routed through BuildGhar Admin Desk for moderation.');
    } catch (err) {
      console.error('Failed to send message:', err);
      error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateRfi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfiSubject.trim() || !newRfiDesc.trim()) {
      error('Please enter subject and description');
      return;
    }
    const ticket: ClarificationTicket = {
      id: `rfi-${Date.now()}`,
      rfiCode: `RFI-INT-2026-${Math.floor(100 + Math.random() * 900)}`,
      projectId: selectedProjectId,
      projectTitle: projects.find((p) => p.id === selectedProjectId)?.title || 'DLF The Crest Penthouse Oasis',
      targetDiscipline: newRfiDiscipline,
      subject: newRfiSubject,
      description: newRfiDesc,
      drawingRef: newRfiDrawing,
      priority: newRfiPriority,
      status: 'PENDING_ADMIN_RESPONSE',
      requestedAt: new Date().toISOString(),
    };
    setRfis([ticket, ...rfis]);
    setShowRfiModal(false);
    setNewRfiSubject('');
    setNewRfiDesc('');
    success(`Clarification Request ${ticket.rfiCode} filed with BuildGhar Admin Desk!`);
  };

  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadSubject.trim() || !newThreadMessage.trim()) {
      error('Please fill subject and message');
      return;
    }

    const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    const newThread: CommunicationThread = {
      id: `TH-INT-${Date.now()}`,
      threadCode: `TH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: selectedProjectId,
      projectTitle: currentProject?.title || 'Interior Project',
      customerId: 'CUST-DLF-001',
      customerName: 'Aman Saxena',
      customerPhone: '+91 98110 55432',
      designerId: 'INT-DES-2026-001',
      designerName: user?.name || 'Aanya Sharma',
      subject: newThreadSubject,
      category: newThreadRecipient === 'ADMIN' ? 'ADMIN_COMMUNICATION' : 'TECHNICAL_QUERY',
      direction:
        newThreadRecipient === 'ADMIN'
          ? 'ADMIN_BROADCAST'
          : newThreadRecipient === 'CUSTOMER'
          ? 'DESIGNER_TO_CUSTOMER'
          : newThreadRecipient === 'ARCHITECT'
          ? 'DESIGNER_TO_ARCHITECT'
          : 'DESIGNER_TO_CONTRACTOR',
      status: 'PENDING_ADMIN_REVIEW',
      latestMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `MSG-${Date.now()}`,
          threadId: `TH-INT-${Date.now()}`,
          senderRole: 'INTERIOR_DESIGNER',
          senderName: user?.name || 'Aanya Sharma (Interior Designer)',
          recipientRole:
            newThreadRecipient === 'ADMIN'
              ? 'ADMIN'
              : newThreadRecipient === 'CUSTOMER'
              ? 'CUSTOMER'
              : newThreadRecipient === 'ARCHITECT'
              ? 'ARCHITECT'
              : 'CONTRACTOR',
          recipientName:
            newThreadRecipient === 'ADMIN'
              ? 'BuildGhar Admin Desk'
              : newThreadRecipient === 'CUSTOMER'
              ? 'Aman Saxena'
              : newThreadRecipient === 'ARCHITECT'
              ? 'Ar. Rajesh Verma'
              : 'Site Contractor',
          content: newThreadMessage,
          timestamp: new Date().toISOString(),
          routingStatus: 'PENDING_ADMIN_ROUTING',
        },
      ],
    };

    saveCommunicationThread(newThread);
    loadThreads();
    setSelectedThreadId(newThread.id);
    setShowNewThreadModal(false);
    setNewThreadSubject('');
    setNewThreadMessage('');
    success(`Communication thread ${newThread.threadCode} initialized with Admin!`);
  };

  // Filtered lists for distinct sub-views
  const adminThreads = useMemo(() => {
    return threads.filter(
      (t) =>
        t.direction === 'ADMIN_BROADCAST' ||
        t.category === 'ADMIN_COMMUNICATION' ||
        t.subject.toLowerCase().includes('admin') ||
        t.subject.toLowerCase().includes('escrow') ||
        t.subject.toLowerCase().includes('compliance')
    );
  }, [threads]);

  const customerRoutedThreads = useMemo(() => {
    return threads.filter(
      (t) =>
        t.direction.includes('CUSTOMER') ||
        t.customerName.toLowerCase().includes('aman') ||
        t.category === 'DESIGN_FEEDBACK' ||
        t.category === 'MATERIAL_SELECTION'
    );
  }, [threads]);

  const architectThreads = useMemo(() => {
    return threads.filter(
      (t) =>
        t.direction.includes('ARCHITECT') ||
        t.architectName ||
        t.subject.toLowerCase().includes('cad') ||
        t.subject.toLowerCase().includes('beam') ||
        t.subject.toLowerCase().includes('structural')
    );
  }, [threads]);

  const navTabs: { id: MessageViewMode; label: string; count: number; badgeColor: string }[] = useMemo(() => {
    return [
      { id: 'ADMIN_MESSAGES', label: 'Admin Messages', count: adminThreads.length, badgeColor: 'bg-blue-100 text-blue-800' },
      { id: 'PROJECT_COMMUNICATION', label: 'Project Communication', count: threads.length, badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'CUSTOMER_MESSAGES_ROUTED', label: 'Customer Messages Routed', count: customerRoutedThreads.length, badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'ARCHITECT_COORDINATION', label: 'Architect Coordination', count: architectThreads.length, badgeColor: 'bg-indigo-100 text-indigo-800' },
      { id: 'CLARIFICATION_REQUESTS', label: 'Clarification Requests', count: rfis.length, badgeColor: 'bg-amber-100 text-amber-800' },
      { id: 'MESSAGE_HISTORY', label: 'Message History', count: threads.reduce((acc, t) => acc + t.messages.length, 0), badgeColor: 'bg-slate-100 text-slate-800' },
    ];
  }, [adminThreads, threads, customerRoutedThreads, architectThreads, rfis]);

  return (
    <div className="space-y-6 pb-20">
      {/* ----------------- TOP HERO HEADER ----------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                Module 10: Communication Desk
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Shield className="w-3.5 h-3.5" />
                Section 15 Admin-Moderated
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-amber-400 shrink-0" />
              <span>Communication Management</span>
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Official communication center: Admin priority dispatches, cross-discipline architectural coordination, formal RFI clarification tickets, and client conversations routed through Admin moderation.
            </p>
          </div>

          {/* Project Picker & New Message Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 px-3 flex flex-col justify-center">
              <label className="text-[10px] uppercase font-bold text-blue-200 font-mono">Active Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                    {p.name || p.title} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewThreadModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg hover:shadow-amber-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>
        </div>

        {/* Security Rule 15 Advisory Tag */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-blue-200 gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Rule 15 Privacy Protocol:</strong> Direct phone numbers and off-platform payment solicitations are prohibited. All stakeholder discussions are auditable and protected by BuildGhar escrow.
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Audit Stream Active
          </span>
        </div>
      </div>

      {/* ----------------- SUBMENU VIEW SELECTOR & PILLS ----------------- */}
      <div className="space-y-3">
        {/* Mobile View Switcher */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">
            Communication View
          </label>
          <select
            value={currentView}
            onChange={(e) => setViewMode(e.target.value as MessageViewMode)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {navTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop 6-Pill Horizontal Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- VIEW 1: ADMIN MESSAGES ----------------- */}
      {currentView === 'ADMIN_MESSAGES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>BuildGhar Admin & PMC Compliance Broadcasts</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Official notices regarding milestone releases, drawing audit approvals, and site regulatory advisories.
              </p>
            </div>
            <button
              onClick={() => {
                setNewThreadRecipient('ADMIN');
                setNewThreadSubject('Admin Inquiry: ');
                setShowNewThreadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact Admin Desk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-3xl border border-blue-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {thread.threadCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{thread.subject}</h4>
                    <span className="text-xs text-slate-400 font-mono">{thread.projectTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Official Notice
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                  <p className="leading-relaxed font-normal">
                    {thread.messages[thread.messages.length - 1]?.content || 'Admin broadcast delivered.'}
                  </p>
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] pt-1 border-t border-slate-200/50">
                    <span>From: BuildGhar Admin PMC</span>
                    <span>{new Date(thread.latestMessageAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setViewMode('PROJECT_COMMUNICATION');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                  >
                    <span>View Conversation Stream</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 2: PROJECT COMMUNICATION (FULL CHAT WORKSPACE) ----------------- */}
      {currentView === 'PROJECT_COMMUNICATION' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* Left Column: Thread List (4 Cols) */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                  Conversations ({threads.length})
                </span>
                <button
                  onClick={() => setShowNewThreadModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
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
                  Site
                </button>
              </div>
            </div>

            {/* Threads Scroll List */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[560px]">
              {threads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No conversations found. Click "New Conversation" to start.
                </div>
              ) : (
                threads.map((t) => {
                  const isSelected = t.id === activeThread?.id;
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
                    <strong>Admin Mediation Guarantee:</strong> Your outgoing messages are first reviewed by BuildGhar QA before forwarding to client.
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 max-h-[460px]">
                  {visibleMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No messages in this conversation yet. Send a message below to start routed discussion.
                    </div>
                  ) : (
                    visibleMessages.map((msg) => {
                      const isDesigner = msg.senderRole === 'INTERIOR_DESIGNER';
                      const isPending = msg.routingStatus === 'PENDING_ADMIN_ROUTING';

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
                                ? 'bg-blue-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            <div className="pt-1 flex items-center justify-between text-[10px] opacity-80 border-t border-white/20">
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>{isPending ? 'Queued with Admin' : 'Admin Audited'}</span>
                              </span>
                              <span>To: {msg.recipientName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Reply Composer */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 p-2">
                      <textarea
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type message to route via BuildGhar Admin Desk..."
                        className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSending || !replyContent.trim()}
                      className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold transition shadow-xs flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a thread from the left pane to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 3: CUSTOMER MESSAGES ROUTED THROUGH ADMIN ----------------- */}
      {currentView === 'CUSTOMER_MESSAGES_ROUTED' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-950">
            <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold text-purple-900 mb-0.5">
                Section 15 Homeowner Communication Gateway
              </strong>
              <span>
                All inquiries regarding revisions, finishes, and layout clarifications from clients are filtered and routed through BuildGhar PMC Admin Desk to protect escrow conditions and contract scope.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerRoutedThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-3xl border border-purple-200 p-5 shadow-xs hover:border-purple-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {thread.threadCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{thread.subject}</h4>
                    <span className="text-xs text-slate-500">Customer: <strong className="text-slate-800">{thread.customerName}</strong></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Admin Routed
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <p className="leading-relaxed">
                    {thread.messages[thread.messages.length - 1]?.content || 'Customer inquiry routed through platform.'}
                  </p>
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] pt-1">
                    <span>Target Project: {thread.projectTitle}</span>
                    <span>{new Date(thread.latestMessageAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Status: {thread.status}</span>
                  <button
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setViewMode('PROJECT_COMMUNICATION');
                    }}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                  >
                    <span>Reply via Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 4: ARCHITECT COORDINATION ----------------- */}
      {currentView === 'ARCHITECT_COORDINATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <span>Cross-Discipline Architectural Alignment Desk</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Coordination with Principal Architect Ar. Rajesh Verma on sanctioned column grids, beam drops, and plumbing stack alignment.
              </p>
            </div>
            <button
              onClick={() => {
                setNewRfiDiscipline('ARCHITECT');
                setShowRfiModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Request Drawing Clarification</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architectThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-3xl border border-indigo-200 p-5 shadow-xs hover:border-indigo-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {thread.threadCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{thread.subject}</h4>
                    <span className="text-xs text-indigo-600 font-medium">Architect: Ar. Rajesh Verma</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    CAD Coordinated
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  {thread.messages[thread.messages.length - 1]?.content || 'Structural DWG coordinated for pelmet drop.'}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Date: {new Date(thread.latestMessageAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setViewMode('PROJECT_COMMUNICATION');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <span>Open CAD Discussion</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 5: CLARIFICATION REQUESTS (RFI DESK) ----------------- */}
      {currentView === 'CLARIFICATION_REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>Request For Information (RFI) & Technical Clarifications</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Formal RFI tickets logged by designer for structural beam levels, society permits, and MEP offsets.
                </p>
              </div>

              <button
                onClick={() => setShowRfiModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Raise New RFI Ticket</span>
              </button>
            </div>

            <div className="space-y-3">
              {rfis.map((rfi) => (
                <div
                  key={rfi.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {rfi.rfiCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{rfi.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rfi.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : rfi.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rfi.priority}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rfi.status === 'CLARIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rfi.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {rfi.description}
                  </p>

                  {rfi.responseNote && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                      <div className="font-bold flex items-center justify-between text-emerald-900">
                        <span>Resolution by {rfi.respondedBy}:</span>
                        <span className="font-mono text-[10px] text-emerald-700">{rfi.respondedAt ? new Date(rfi.respondedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-slate-700">{rfi.responseNote}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/50">
                    <span>Discipline: {rfi.targetDiscipline} {rfi.drawingRef ? `• Drawing: ${rfi.drawingRef}` : ''}</span>
                    <span>Raised: {new Date(rfi.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIEW 6: MESSAGE HISTORY & AUDIT ARCHIVE ----------------- */}
      {currentView === 'MESSAGE_HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <span>Searchable Communication & Audit Transcript Archive</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Complete historical record of all routed communications, moderator approval stamps, and timestamps.
              </p>
            </div>
            <button
              onClick={() => success('Exporting encrypted communication audit transcript (PDF)...')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Transcript</span>
            </button>
          </div>

          <div className="space-y-3">
            {threads.flatMap((t) => t.messages).map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 hover:bg-white hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-sans">{msg.senderName}</strong>
                    <span>$\rightarrow$</span>
                    <span className="text-slate-700">{msg.recipientName}</span>
                  </div>
                  <span>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">{msg.content}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Message ID: {msg.id}</span>
                  <span className="text-emerald-700 font-bold">Admin Verified Log</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- MODAL: RAISE NEW RFI ----------------- */}
      <AnimatePresence>
        {showRfiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>Raise Technical Clarification Request (RFI)</span>
                </h3>
                <button
                  onClick={() => setShowRfiModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRfi} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RFI Subject / Query *</label>
                  <input
                    type="text"
                    required
                    value={newRfiSubject}
                    onChange={(e) => setNewRfiSubject(e.target.value)}
                    placeholder="e.g. Column Grid Beam Drop Elevation for Pelmet"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Discipline</label>
                    <select
                      value={newRfiDiscipline}
                      onChange={(e) => setNewRfiDiscipline(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="ARCHITECT">Principal Architect</option>
                      <option value="PMC_ENGINEER">PMC Site Engineer</option>
                      <option value="ADMIN">BuildGhar Admin Desk</option>
                      <option value="CONTRACTOR">Lead Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={newRfiPriority}
                      onChange={(e) => setNewRfiPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Priority</option>
                      <option value="CRITICAL">Critical Site Stop</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reference Drawing Ref (DWG/PDF)</label>
                  <input
                    type="text"
                    value={newRfiDrawing}
                    onChange={(e) => setNewRfiDrawing(e.target.value)}
                    placeholder="e.g. DWG-STR-BEAM-04"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Technical Query *</label>
                  <textarea
                    rows={3}
                    required
                    value={newRfiDesc}
                    onChange={(e) => setNewRfiDesc(e.target.value)}
                    placeholder="Describe specific dimensional ambiguities, level discrepancies or coordination requirements..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRfiModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold shadow-xs transition"
                  >
                    Submit RFI Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: NEW CONVERSATION THREAD ----------------- */}
      <AnimatePresence>
        {showNewThreadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Start New Project Conversation</span>
                </h3>
                <button
                  onClick={() => setShowNewThreadModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewThread} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Recipient</label>
                  <select
                    value={newThreadRecipient}
                    onChange={(e) => setNewThreadRecipient(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="ADMIN">BuildGhar Admin / PMC Desk</option>
                    <option value="CUSTOMER">Homeowner (Routed via Admin)</option>
                    <option value="ARCHITECT">Principal Architect</option>
                    <option value="CONTRACTOR">Contractor / Site Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Conversation Subject *</label>
                  <input
                    type="text"
                    required
                    value={newThreadSubject}
                    onChange={(e) => setNewThreadSubject(e.target.value)}
                    placeholder="e.g. Master Bedroom Wall Panel Sample Verification"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Message Content *</label>
                  <textarea
                    rows={4}
                    required
                    value={newThreadMessage}
                    onChange={(e) => setNewThreadMessage(e.target.value)}
                    placeholder="Write message to be routed through BuildGhar Admin moderation desk..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewThreadModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
                  >
                    Send Routed Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
