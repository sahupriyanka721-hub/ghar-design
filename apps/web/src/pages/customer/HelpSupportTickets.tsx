import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { SupportTicket } from '@ghar-design/shared';
import { getPlatformRequests, getPlatformBookings } from '../../data/customerStore.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Send,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search,
  Lock,
  UserCheck,
  Upload,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export const HelpSupportTickets: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const activeTab = searchParams.get('tab') || initialTab || 'tickets';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);

  // New Ticket Form State
  const [category, setCategory] = useState<'QUOTATION' | 'BILLING' | 'PROJECT_EXECUTION' | 'MATERIALS' | 'GENERAL'>('PROJECT_EXECUTION');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedReference, setRelatedReference] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [availableReferences, setAvailableReferences] = useState<string[]>([]);

  // Dispute Registration Modal
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeType, setDisputeType] = useState('WORK_QUALITY');
  const [disputedStage, setDisputedStage] = useState('Stage 2 - RCC Superstructure Slab');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState('150000');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputesList, setDisputesList] = useState<any[]>([
    {
      id: 'dsp-101',
      disputeCode: 'DSP-2026-081',
      type: 'Work Quality & RCC Curing Vetting',
      stage: 'Ground Floor Plinth Beam',
      escrowLockedPaise: 15000000,
      status: 'UNDER_INSPECTION',
      filedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      remarks: 'IEI Chartered Auditor Er. Sengupta assigned. Concrete core testing scheduled for tomorrow.',
    },
  ]);

  // Messages Thread State (Section 9.1)
  const [activeChatContact, setActiveChatContact] = useState<string>('contractor');
  const [directMessages, setDirectMessages] = useState<Record<string, { id: string; sender: string; role: string; text: string; time: string; isUser: boolean }[]>>({
    contractor: [
      { id: 'm1', sender: 'Er. Sandeep Mittal', role: 'Turnkey Lead Contractor', text: 'Namaste! Shuttering for the ground floor roof slab will complete by 4:00 PM today.', time: '10:30 AM', isUser: false },
      { id: 'm2', sender: user?.name || 'Homeowner', role: 'Homeowner', text: 'Please ensure electrical conduit pipes are laid before concrete pouring.', time: '11:15 AM', isUser: true },
      { id: 'm3', sender: 'Er. Sandeep Mittal', role: 'Turnkey Lead Contractor', text: 'Yes sir, our electrical contractor is currently laying the heavy-duty PVC conduits. Site report will be uploaded with photos.', time: '11:45 AM', isUser: false },
    ],
    architect: [
      { id: 'a1', sender: 'Ar. Rajesh Verma', role: 'Lead Architect', text: 'Hello! I have updated the 3D elevation night render with the warmer LED strip profile. Please check Section 7.3 Design Approvals.', time: 'Yesterday', isUser: false },
      { id: 'a2', sender: user?.name || 'Homeowner', role: 'Homeowner', text: 'Thank you Ar. Verma, the wood texture on the 1st floor balcony looks excellent.', time: 'Yesterday', isUser: true },
    ],
    designer: [
      { id: 'd1', sender: 'Pooja Singhania', role: 'Principal Interior Designer', text: 'Hi! We have finalized the modular kitchen layout with parallel counters and Hafele hinges.', time: '2 days ago', isUser: false },
    ],
    support: [
      { id: 's1', sender: 'BuildGhar Escrow Desk', role: 'Platform Support Lead', text: 'Welcome to BuildGhar! Your milestone payments are 100% escrow protected. Reach out anytime if you need technical arbitration.', time: '3 days ago', isUser: false },
    ],
  });
  const [chatInputText, setChatInputText] = useState('');

  // FAQ Search
  const [faqSearch, setFaqSearch] = useState('');

  // Load real user references
  useEffect(() => {
    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    const myReqs = getPlatformRequests().filter((r) => {
      if (r.customerId === 'usr-cust-1' || r.customerName?.toLowerCase().includes('vikram') || r.customerPhone?.includes('9876543220')) return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawUserPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return false;
    });

    const myBks = getPlatformBookings().filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawUserPhone && b.customerPhone) {
        return b.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return false;
    });

    const execProjects = getExecutionProjects();

    const refs: string[] = [];
    execProjects.forEach((p) => refs.push(`${p.projectCode} (${p.projectName})`));
    myReqs.forEach((r) => refs.push(`${r.requestCode} (${r.propertyType})`));
    myBks.forEach((b) => refs.push(`${b.bookingCode} (${b.serviceTitle})`));

    if (refs.length === 0) {
      refs.push('GHR-PRJ-2026 (Active Villa Construction)');
    }

    setAvailableReferences(refs);
    setRelatedReference(refs[0]);

    // Load stored tickets for this user
    try {
      const stored = localStorage.getItem(`customer_tickets_${user?.id || rawUserPhone || 'active'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickets(parsed);
          setSelectedTicket(parsed[0]);
          return;
        }
      }
    } catch {}

    // Seed default sample ticket if empty
    const seededTicket: SupportTicket = {
      id: 'tkt-init-1',
      ticketCode: 'TCK-2026-512',
      customerId: user?.id || 'usr-active',
      category: 'PROJECT_EXECUTION',
      priority: 'MEDIUM',
      subject: 'Clarification regarding Reinforcement Steel Bar Spacing',
      description: 'Requesting site engineer to confirm whether Fe550D TMT rebar spacing adheres to IS 456 schedule for slab casting.',
      status: 'IN_PROGRESS',
      relatedReference: refs[0] || 'Active Project',
      messages: [
        {
          id: 'msg-1',
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: 'Requesting site engineer to confirm whether Fe550D TMT rebar spacing adheres to IS 456 schedule for slab casting.',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'msg-2',
          senderName: 'BuildGhar Technical Wing',
          senderRole: 'SUPPORT',
          message: 'Senior Civil Auditor has checked the bar bending schedule (BBS). 150mm c/c spacing confirmed with 25mm clear concrete cover.',
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    };

    setTickets([seededTicket]);
    setSelectedTicket(seededTicket);
    try {
      localStorage.setItem(`customer_tickets_${user?.id || rawUserPhone || 'active'}`, JSON.stringify([seededTicket]));
    } catch {}
  }, [user]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      error('Please provide a subject and detailed description.');
      return;
    }

    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketCode: `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: user?.id || `usr-cust-${Date.now()}`,
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      status: 'OPEN',
      relatedReference: relatedReference || 'General Inquiry',
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: user?.name || 'Homeowner',
          senderRole: 'CUSTOMER',
          message: description.trim(),
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    setSelectedTicket(newTicket);
    localStorage.setItem(`customer_tickets_${user?.id || rawUserPhone || 'active'}`, JSON.stringify(updated));

    setNewTicketModalOpen(false);
    setSubject('');
    setDescription('');
    success(`Support Ticket ${newTicket.ticketCode} opened successfully!`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName: user?.name || 'Homeowner',
      senderRole: 'CUSTOMER',
      message: replyMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedList = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            messages: [...t.messages, newMsg],
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    setTickets(updatedList);
    setSelectedTicket({
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMsg],
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(`customer_tickets_${user?.id || rawUserPhone || 'active'}`, JSON.stringify(updatedList));

    setReplyMessage('');
    success('Reply dispatched to the support desk.');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newChatMsg = {
      id: `chat-${Date.now()}`,
      sender: user?.name || 'Homeowner',
      role: 'Homeowner',
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
    };

    setDirectMessages((prev) => ({
      ...prev,
      [activeChatContact]: [...(prev[activeChatContact] || []), newChatMsg],
    }));

    setChatInputText('');
    success('Message dispatched to project channel.');
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    const newDsp = {
      id: `dsp-${Date.now()}`,
      disputeCode: `DSP-2026-${Math.floor(100 + Math.random() * 900)}`,
      type: disputeType === 'WORK_QUALITY' ? 'Work Quality Defect' : disputeType === 'DELAY' ? 'Project Schedule Delay' : 'Payment / Rate Dispute',
      stage: disputedStage,
      escrowLockedPaise: parseInt(disputeClaimAmount || '0') * 100,
      status: 'ESCROW_FROZEN',
      filedAt: new Date().toISOString(),
      remarks: disputeNotes.trim() || 'Dispute escalated to BuildGhar Chief Engineer. Milestone release frozen.',
    };

    setDisputesList([newDsp, ...disputesList]);
    setDisputeModalOpen(false);
    setDisputeNotes('');
    success(`Formal Dispute ${newDsp.disputeCode} registered! Stage milestone frozen in escrow.`);
  };

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'ALL') return true;
    return t.status === ticketFilter;
  });

  const faqs = [
    {
      category: 'ESCROW & PAYMENTS',
      q: 'How does BuildGhar Escrow Protection work for homeowners?',
      a: 'All project milestone payments are held securely in a dedicated bank escrow account. Funds are released to your assigned contractor or architect firm only after you inspect and approve each stage completion on your project dashboard.',
    },
    {
      category: 'CONSTRUCTION QUALITY',
      q: 'What quality standards are verified during site inspections?',
      a: 'Our registered engineers audit IS 456 concrete mix ratios, cube compressive strength tests, 53-grade cement freshness, Fe550D TMT reinforcement rebar spacing, and strict 14-day water curing protocols.',
    },
    {
      category: 'DELAYS & DISPUTES',
      q: 'What should I do if a contractor or vendor delays work?',
      a: 'Navigate to "9.3 Complaints & Disputes" to lodge a formal dispute. When submitted, the corresponding milestone payment is immediately frozen in escrow and a Chief Quality Auditor is dispatched to arbitrate within 24 hours.',
    },
    {
      category: 'DESIGN APPROVALS',
      q: 'How are architectural drawings and 3D elevations approved?',
      a: 'Your architect uploads CAD working blueprints, structural layouts, and 3D models to your "7. Design & Documents" portal. You can review with zoom tools, download PDF packages, and digitally approve or request specific revisions.',
    },
    {
      category: 'MATERIALS & RETURNS',
      q: 'Can I return building materials ordered through the Material Store?',
      a: 'Yes. Unopened and intact building materials can be returned within 48 hours of on-site delivery. Check "6.6 Return & Refund" under Material Management to initiate a collection request with photo evidence.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      !faqSearch ||
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Section 9 &bull; Communication, Dispute Resolution & Support Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            {activeTab === 'messages'
              ? '9.1 Direct Project Messages & Channel Chat'
              : activeTab === 'disputes' || activeTab === 'complaints'
              ? '9.3 Formal Complaints & Technical Disputes'
              : activeTab === 'faqs' || activeTab === 'faq'
              ? '9.4 Help Center & Construction Knowledge Base'
              : '9.2 Support Tickets & Help Desk'}
          </h1>
          <p className="text-slate-500 mt-1">
            Connect directly with your contractor, architect, site supervisor, and platform technical mediation team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'disputes' || activeTab === 'complaints' ? (
            <button
              onClick={() => setDisputeModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Raise Project Dispute</span>
            </button>
          ) : (
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Support Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* 9-Section Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'messages', label: '9.1 Project Messages' },
          { id: 'tickets', label: `9.2 Support Tickets (${tickets.length})` },
          { id: 'disputes', label: `9.3 Complaints & Disputes (${disputesList.length})` },
          { id: 'faqs', label: '9.4 Help Center & FAQs' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === t.id || (activeTab === 'complaints' && t.id === 'disputes') || (activeTab === 'faq' && t.id === 'faqs')
                ? 'bg-navy-950 text-gold-400 shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 9.1 DIRECT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
          {/* Chat Sidebar: Contacts */}
          <div className="border-r border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Project Channels</h3>
            <div className="space-y-1.5">
              {[
                { id: 'contractor', name: 'Er. Sandeep Mittal', role: 'Lead Turnkey Contractor', status: 'Online' },
                { id: 'architect', name: 'Ar. Rajesh Verma', role: 'Senior Architect', status: 'Online' },
                { id: 'designer', name: 'Pooja Singhania', role: 'Interior Designer', status: 'Away' },
                { id: 'support', name: 'BuildGhar Escrow Desk', role: 'Technical Mediation', status: '24/7 Active' },
              ].map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChatContact(c.id)}
                  className={`p-3 rounded-xl cursor-pointer transition border ${
                    activeChatContact === c.id
                      ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{c.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.status === 'Online' || c.status.includes('Active') ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className={`text-[10px] mt-0.5 ${activeChatContact === c.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {c.role}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 flex flex-col justify-between p-5 space-y-4">
            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {activeChatContact === 'contractor'
                    ? 'Er. Sandeep Mittal (Turnkey Contractor)'
                    : activeChatContact === 'architect'
                    ? 'Ar. Rajesh Verma (Lead Architect)'
                    : activeChatContact === 'designer'
                    ? 'Pooja Singhania (Interior Designer)'
                    : 'BuildGhar Escrow & Quality Mediation Desk'}
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Encrypted Project Communication
                </span>
              </div>
            </div>

            {/* Chat messages */}
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2">
              {(directMessages[activeChatContact] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 ${
                      msg.isUser
                        ? 'bg-navy-950 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] opacity-75 gap-3">
                      <span className="font-bold">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                required
                placeholder={`Message ${activeChatContact}...`}
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: 9.2 SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Status filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start max-w-fit border border-slate-200 text-[11px]">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setTicketFilter(st as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  ticketFilter === st ? 'bg-navy-950 text-gold-400 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tickets List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-slate-700">Tickets ({filteredTickets.length})</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedTicket?.id === t.id
                        ? 'bg-navy-950 text-white border-navy-950 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold opacity-70">{t.ticketCode}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          t.status === 'OPEN'
                            ? 'bg-amber-100 text-amber-900'
                            : t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs truncate">{t.subject}</h4>
                    <div className="text-[10px] opacity-70 mt-1 truncate">
                      Ref: {t.relatedReference}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Ticket Detail & Messages */}
            {selectedTicket && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gold-700 text-xs">{selectedTicket.ticketCode}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {selectedTicket.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                          Priority: {selectedTicket.priority}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-navy-950 mt-1">{selectedTicket.subject}</h2>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Associated Scope: <strong className="text-slate-700">{selectedTicket.relatedReference}</strong>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Opened: {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(selectedTicket.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border space-y-1 text-xs ${
                          m.senderRole === 'CUSTOMER'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-emerald-50/70 border-emerald-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-900">
                            {m.senderName} ({m.senderRole === 'CUSTOMER' ? 'You' : 'BuildGhar Support Desk'})
                          </span>
                          <span className="text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your message to the support desk..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 9.3 COMPLAINTS & DISPUTES */}
      {(activeTab === 'disputes' || activeTab === 'complaints') && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-gold-400 font-bold text-[11px] uppercase tracking-wider block">
                9.3 Escrow Dispute Shield & Technical Arbitration
              </span>
              <h2 className="text-lg font-bold font-display mt-0.5">Formal Technical Grievance Redressal</h2>
              <p className="text-slate-300 text-xs mt-1 max-w-xl">
                When you lodge a dispute, the concerned milestone fund is automatically locked in bank escrow. BuildGhar chief engineer conducts on-site core inspection before any contractor disbursement.
              </p>
            </div>
            <button
              onClick={() => setDisputeModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Register New Dispute</span>
            </button>
          </div>

          {/* Active Disputes List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Active & Historical Disputes</h3>
            {disputesList.map((dsp) => (
              <div key={dsp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{dsp.disputeCode}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800">
                          {dsp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Nature: <strong className="text-slate-800">{dsp.type}</strong> &bull; Stage: {dsp.stage}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-rose-700">
                      ₹{((dsp.escrowLockedPaise || 0) / 100).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold flex items-center justify-end gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Funds Frozen in Escrow</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                  <strong className="text-slate-900">Arbitration Update:</strong> {dsp.remarks}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 9.4 HELP CENTER & FAQS */}
      {(activeTab === 'faqs' || activeTab === 'faq') && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search help articles, escrow rules, IS 456 quality standards..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider block">
                  {faq.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{faq.q}</h4>
                <p className="text-slate-600 leading-relaxed text-xs">{faq.a}</p>
              </div>
            ))}
          </div>

          {/* Direct Support Contacts */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Need Direct Human Assistance?</h4>
              <p className="text-slate-500 mt-0.5">Our senior architectural advisors are available Mon-Sat, 9:00 AM - 8:00 PM.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="tel:1800-442-7233"
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition text-slate-700"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>1800-GHAR-CARE</span>
              </a>
              <a
                href="mailto:support@buildghar.in"
                className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@buildghar.in</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* RAISE TICKET MODAL */}
      {newTicketModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setNewTicketModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">Raise Technical Support Ticket</h3>
                <button onClick={() => setNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ticket Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inconsistency in BOQ rate for external paint"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="PROJECT_EXECUTION">Project Execution</option>
                      <option value="QUOTATION">Quotation & BOQ</option>
                      <option value="BILLING">Billing & Escrow</option>
                      <option value="MATERIALS">Material Delivery</option>
                      <option value="GENERAL">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Related Project / Booking</label>
                  <select
                    value={relatedReference}
                    onChange={(e) => setRelatedReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    {availableReferences.map((r, i) => (
                      <option key={i} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed facts, dates, and required resolution..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewTicketModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE REGISTRATION MODAL */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setDisputeModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Register Formal Project Dispute</h3>
                </div>
                <button onClick={() => setDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Escrow Freezing Notice:</strong> Submitting this dispute immediately pauses milestone escrow disbursement for the affected stage until independent IEI engineer site inspection.
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dispute Classification *</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="WORK_QUALITY">Work Quality Defect (IS 456 / Concrete Honeycombing)</option>
                    <option value="DELAY">Unjustified Timeline Delay (&gt; 10 Days Stalled)</option>
                    <option value="BOQ_RATE">Unapproved BOQ Rate Variance / Unauthorized Work</option>
                    <option value="MATERIAL_DEFECT">Damaged / Substandard Building Materials</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Affected Construction Stage *</label>
                  <input
                    type="text"
                    required
                    value={disputedStage}
                    onChange={(e) => setDisputedStage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Disputed Claim Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={disputeClaimAmount}
                    onChange={(e) => setDisputeClaimAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Technical Defect Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe specific structural or material deviation with dates..."
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Escrow & Lodge Dispute</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
