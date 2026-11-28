import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  X,
  AlertTriangle,
  Lock,
  Star,
  FileText,
  User,
  Building,
  Check,
  ShieldAlert,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Send,
  HardDrive,
  Cpu,
  RefreshCw,
  Download,
  ExternalLink,
  Laptop,
  CheckSquare,
  DollarSign,
  CreditCard,
  Layers,
  FileCheck,
  SlidersHorizontal,
  Headphones,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  getComplaintDisputes,
  saveComplaintDispute,
  canCloseDispute,
  ComplaintDisputeItem,
  DisputeCategory,
  DisputePriority,
} from '../../data/communicationDisputeStore.js';
import {
  getInteriorProjects,
  InteriorProject,
} from '../../data/interiorDesignerStore.js';

export type SupportViewMode =
  | 'RAISE_TICKET'
  | 'TECHNICAL_SUPPORT'
  | 'PAYMENT_SUPPORT'
  | 'PROJECT_DISPUTES'
  | 'HELP_CENTER';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  projectName?: string;
  description: string;
  createdAt: string;
  slaResponseHours: number;
  replies?: Array<{
    sender: string;
    role: 'DESIGNER' | 'ADMIN' | 'SUPPORT_AGENT';
    message: string;
    timestamp: string;
  }>;
}

interface PaymentSupportItem {
  id: string;
  ticketCode: string;
  milestoneTitle: string;
  projectName: string;
  amount: number;
  queryType: 'ESCROW_RELEASE_DELAY' | 'TDS_CERTIFICATE' | 'GST_CORRECTION' | 'BANK_CHANGE';
  status: 'INVESTIGATING' | 'ESCALATED_TO_BANK' | 'SETTLED';
  assignedFinanceOfficer: string;
  filedDate: string;
  resolutionEta: string;
  notes: string;
}

export const InteriorDesignerSupport: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Sync
  const currentView = (searchParams.get('view') as SupportViewMode) || 'RAISE_TICKET';
  const setView = (v: SupportViewMode) => {
    setSearchParams({ view: v });
  };

  // Projects State
  const [projects, setProjects] = useState<InteriorProject[]>([]);

  // Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 't-1',
      ticketNumber: 'TKT-ID-8821',
      subject: 'GST Invoice validation for Stage 2 Escrow Disbursement',
      category: 'Billing & Payouts',
      priority: 'HIGH',
      status: 'RESOLVED',
      projectName: 'Modern Minimalist 3BHK Penthouse',
      description: 'Submitted tax invoice for Stage 2 3D Renders approval. Need validation confirmation from accounts desk.',
      createdAt: '2026-11-18',
      slaResponseHours: 4,
      replies: [
        {
          sender: 'Accounts Team (Vikram)',
          role: 'ADMIN',
          message: 'GST invoice verified with ICICI Bank Trustee Escrow. Milestone payout of ₹1,20,000 released.',
          timestamp: '2026-11-18 14:30',
        },
      ],
    },
    {
      id: 't-2',
      ticketNumber: 'TKT-ID-8904',
      subject: 'Assistance with 4K Render Upload storage limit',
      category: 'Design Center & CAD',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      projectName: 'Contemporary Villa Living Room Renovation',
      description: 'V-Ray 4K output file size is 480MB, getting network timeout during upload.',
      createdAt: '2026-11-25',
      slaResponseHours: 12,
      replies: [
        {
          sender: 'CAD Support Desk (Pooja)',
          role: 'SUPPORT_AGENT',
          message: 'Temporary upload threshold increased to 1GB for your workspace. Please retry with chunked upload.',
          timestamp: '2026-11-25 11:15',
        },
      ],
    },
    {
      id: 't-3',
      ticketNumber: 'TKT-ID-8942',
      subject: 'Client requested unauthorized changes in MEP wall chasing',
      category: 'Project Execution & Coordination',
      priority: 'URGENT',
      status: 'OPEN',
      projectName: 'Luxury 4BHK Master Suite & Walk-in Closet',
      description: 'Client is directing site contractor to alter electrical conduits outside approved 2D lighting drawing.',
      createdAt: '2026-11-27',
      slaResponseHours: 2,
      replies: [],
    },
  ]);

  // Raise Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical & CAD');
  const [ticketPriority, setTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [ticketProjectId, setTicketProjectId] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAttachmentName, setTicketAttachmentName] = useState('');
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState(false);

  // Search & Filter in Tickets
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Active Ticket Reply Modal State
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Project Disputes State (Section 16)
  const [disputes, setDisputes] = useState<ComplaintDisputeItem[]>([]);
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>('SITE_ACCESS_PROBLEMS');
  const [disputePriority, setDisputePriority] = useState<DisputePriority>('HIGH');
  const [disputeProjectId, setDisputeProjectId] = useState('');
  const [disputeSubject, setDisputeSubject] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidenceName, setDisputeEvidenceName] = useState('');
  const [disputeCategoryFilter, setDisputeCategoryFilter] = useState<string>('ALL');

  // Payment Support State
  const [paymentSupportItems, setPaymentSupportItems] = useState<PaymentSupportItem[]>([
    {
      id: 'pay-1',
      ticketCode: 'PAY-ESC-2026-081',
      milestoneTitle: 'Stage 3: 3D Visualization & VR Walkthrough',
      projectName: 'Modern Minimalist 3BHK Penthouse',
      amount: 145000,
      queryType: 'ESCROW_RELEASE_DELAY',
      status: 'SETTLED',
      assignedFinanceOfficer: 'Rajesh Mehra (Treasury Desk)',
      filedDate: '2026-11-15',
      resolutionEta: 'Resolved within 6 hrs',
      notes: 'Customer signed milestone in portal; bank gateway batch processed same day.',
    },
    {
      id: 'pay-2',
      ticketCode: 'PAY-TDS-2026-104',
      milestoneTitle: 'Stage 1: Concept & Space Planning',
      projectName: 'Contemporary Villa Living Room Renovation',
      amount: 65000,
      queryType: 'TDS_CERTIFICATE',
      status: 'INVESTIGATING',
      assignedFinanceOfficer: 'Sneha Deshmukh (Taxation)',
      filedDate: '2026-11-24',
      resolutionEta: '24 Hours',
      notes: 'Form 16A generation for Q2 2026 being synced with TRACES portal.',
    },
    {
      id: 'pay-3',
      ticketCode: 'PAY-ESC-2026-129',
      milestoneTitle: 'Stage 4: Complete BOQ & Material Specifications',
      projectName: 'Luxury 4BHK Master Suite & Walk-in Closet',
      amount: 180000,
      queryType: 'ESCROW_RELEASE_DELAY',
      status: 'ESCALATED_TO_BANK',
      assignedFinanceOfficer: 'Anil Saxena (ICICI Escrow Liaison)',
      filedDate: '2026-11-27',
      resolutionEta: '4 Hours',
      notes: 'Pending RTGS dual authorization approval from bank trustee officer.',
    },
  ]);
  const [isPaymentQueryOpen, setIsPaymentQueryOpen] = useState(false);
  const [payMilestoneTitle, setPayMilestoneTitle] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payQueryType, setPayQueryType] = useState<'ESCROW_RELEASE_DELAY' | 'TDS_CERTIFICATE' | 'GST_CORRECTION' | 'BANK_CHANGE'>('ESCROW_RELEASE_DELAY');
  const [payNotes, setPayNotes] = useState('');

  // Technical Diagnostics State
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Help Center FAQ State
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<string>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(1);

  // Load Initial Data
  const loadData = () => {
    try {
      const allProjects = getInteriorProjects();
      setProjects(allProjects);
      if (allProjects.length > 0 && !ticketProjectId) {
        setTicketProjectId(allProjects[0].id);
        setDisputeProjectId(allProjects[0].id);
      }

      const allDisputes = getComplaintDisputes();
      const designerDisputes = allDisputes.filter(
        (d) =>
          d.complainantRole === 'INTERIOR_DESIGNER' ||
          d.id.includes('INT') ||
          d.disputeCode.includes('INT')
      );
      setDisputes(designerDisputes);
    } catch (e) {
      console.error('Failed to load support data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('COMPLAINTS_DISPUTES_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('COMPLAINTS_DISPUTES_UPDATED', handleUpdate);
    };
  }, []);

  // Handler: Create Support Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const matchedProj = projects.find((p) => p.id === ticketProjectId);

    const slaHours =
      ticketPriority === 'URGENT' ? 2 : ticketPriority === 'HIGH' ? 4 : ticketPriority === 'MEDIUM' ? 12 : 24;

    const newTkt: SupportTicket = {
      id: `t-${Date.now()}`,
      ticketNumber: `TKT-INT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      status: 'OPEN',
      projectName: matchedProj?.title || 'General Account Inquiry',
      description: ticketDescription.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      slaResponseHours: slaHours,
      replies: [
        {
          sender: 'BuildGhar Automated Dispatch',
          role: 'ADMIN',
          message: `Ticket received and routed to ${ticketCategory} operations desk. Guaranteed response within ${slaHours} hours.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setTickets([newTkt, ...tickets]);
    setTicketSubject('');
    setTicketDescription('');
    setTicketAttachmentName('');
    setTicketSuccessNotice(true);
    setTimeout(() => setTicketSuccessNotice(false), 5000);
  };

  // Handler: Add Reply to Ticket
  const handleSendTicketReply = () => {
    if (!selectedTicketForReply || !replyText.trim()) return;

    const updated = tickets.map((t) => {
      if (t.id === selectedTicketForReply.id) {
        return {
          ...t,
          replies: [
            ...(t.replies || []),
            {
              sender: user?.name || 'Aanya Sharma (Interior Designer)',
              role: 'DESIGNER' as const,
              message: replyText.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      }
      return t;
    });

    setTickets(updated);
    const updatedSelected = updated.find((t) => t.id === selectedTicketForReply.id) || null;
    setSelectedTicketForReply(updatedSelected);
    setReplyText('');
  };

  // Handler: Create Dispute (Section 16)
  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSubject.trim() || !disputeDescription.trim()) return;

    const proj = projects.find((p) => p.id === disputeProjectId) || projects[0];

    const newDisp: ComplaintDisputeItem = {
      id: `DISP-INT-${Date.now()}`,
      disputeCode: `DISP-INT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: proj ? proj.id : 'BG-INT-2026-001',
      projectTitle: proj ? proj.title : 'Modern Minimalist 3BHK Penthouse',
      complainantRole: 'INTERIOR_DESIGNER',
      complainantName: user?.name || 'Aanya Sharma (Interior Designer)',
      complainantPhone: user?.phone || '+91 98110 55990',
      complainantEmail: user?.email || 'aanya@aurastudio.in',
      respondentRole: 'CONTRACTOR',
      respondentName: 'Apex MEP Contractors / Homeowner',
      disputeType: disputeCategory,
      priority: disputePriority,
      subject: disputeSubject,
      description: disputeDescription,
      evidenceFiles: disputeEvidenceName
        ? [{ name: disputeEvidenceName, type: 'DOCUMENT', url: '#' }]
        : [{ name: 'Site_Access_Log_Photos.pdf', type: 'PDF', url: '#' }],
      status: 'OPEN_RECEIVED',
      assignedAdmin: 'Senior Mediator Rajiv Nambiar (Appointed)',
      holdAssociatedPayout: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'COMPLAINT_FILED',
          actor: `${user?.name || 'Interior Designer'} (Designer)`,
          details: `Dispute filed under Section 16 clause: ${disputeSubject}`,
        },
      ],
    };

    saveComplaintDispute(newDisp);
    setIsNewDisputeOpen(false);
    setDisputeSubject('');
    setDisputeDescription('');
    setDisputeEvidenceName('');
    loadData();
  };

  // Handler: Create Payment Query
  const handleCreatePaymentQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMilestoneTitle.trim() || !payAmount) return;

    const newPay: PaymentSupportItem = {
      id: `pay-${Date.now()}`,
      ticketCode: `PAY-ESC-2026-${Math.floor(200 + Math.random() * 800)}`,
      milestoneTitle: payMilestoneTitle,
      projectName: projects[0]?.title || 'Active Project',
      amount: parseFloat(payAmount) || 0,
      queryType: payQueryType,
      status: 'INVESTIGATING',
      assignedFinanceOfficer: 'Sneha Deshmukh (Escrow Operations)',
      filedDate: new Date().toISOString().slice(0, 10),
      resolutionEta: '6 Hours',
      notes: payNotes || 'Escrow milestone inquiry submitted.',
    };

    setPaymentSupportItems([newPay, ...paymentSupportItems]);
    setIsPaymentQueryOpen(false);
    setPayMilestoneTitle('');
    setPayAmount('');
    setPayNotes('');
  };

  // Handler: Run Technical Diagnostic
  const handleRunDiagnostic = () => {
    setIsRunningDiagnostic(true);
    setDiagnosticResult(null);
    setTimeout(() => {
      setIsRunningDiagnostic(false);
      setDiagnosticResult(
        'All Core Engines Operational: LocalStorage Active (0 Conflicts) • WebGL 2.0 GPU Shader Verified • Render API Sync Latency: 22ms • Storage Quota: 35.2 GB Free.'
      );
    }, 1200);
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        ticketSearch === '' ||
        t.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (t.projectName && t.projectName.toLowerCase().includes(ticketSearch.toLowerCase()));

      const matchStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, ticketSearch, ticketStatusFilter]);

  // Filtered Disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (disputeCategoryFilter === 'ALL') return true;
      return d.disputeType === disputeCategoryFilter;
    });
  }, [disputes, disputeCategoryFilter]);

  // FAQs Data
  const faqs = [
    {
      id: 1,
      category: 'ESCROW_PAYMENTS',
      question: 'How does BuildGhar Escrow protect my interior design fees?',
      answer:
        'When the homeowner accepts your quotation, 100% of the milestone design fee is locked into the BuildGhar ICICI Bank Trustee Escrow Account before you start design work. Once you submit drawings and the homeowner or Admin approves the milestone, funds are automatically disbursed into your registered bank account within 24 hours.',
    },
    {
      id: 2,
      category: 'DESIGN_MILESTONES',
      question: 'What happens if a homeowner demands repeated revisions beyond standard agreement?',
      answer:
        'BuildGhar standard terms permit up to 2 major design iterations per milestone. For subsequent revisions, go to Module 3 (Quotation Management) -> "Generate Quotation" and submit a "Scope Variation / Add-On Quotation". The client must approve the additional variation before you are obligated to deliver revised 3D renders.',
    },
    {
      id: 3,
      category: 'SITE_INSPECTIONS',
      question: 'How do I report site delays or denial of access by society or builder?',
      answer:
        'If the apartment site is locked, under society restriction, or delayed by civil contractors, navigate to "Project Disputes" tab and log a "Site Access Problem" under Section 16 with photo evidence. BuildGhar Customer Success Team immediately contacts the homeowner to resolve site access without penalizing your timeline.',
    },
    {
      id: 4,
      category: 'BOQ_MATERIALS',
      question: 'Can contractors substitute materials different from my approved BOQ specifications?',
      answer:
        'Strictly prohibited. All executed materials must match the approved brand, grade, and finish codes submitted in Module 6 (BOQ & Cost Estimation). Any unilateral deviation can be reported via "Work Inspection" in Module 8 or flagged as a Material Quality Dispute here.',
    },
    {
      id: 5,
      category: 'DISPUTE_PROTOCOLS',
      question: 'Why does Section 16 prevent unilateral dispute closure?',
      answer:
        'To ensure neutral fairness and prevent coercion. An interior designer or homeowner cannot close a formal dispute unilaterally. All resolutions must be certified by an appointed BuildGhar Dispute Mediation Officer after written concurrence from both parties.',
    },
    {
      id: 6,
      category: 'TECHNICAL',
      question: 'What are the recommended 3D render formats and maximum upload file sizes?',
      answer:
        'For 3D renders: High-res JPEG or PNG (minimum 2560x1440, recommended 3840x2160). For interactive 3D: GLTF/GLB or packaged SketchUp/3ds Max archive. Standard maximum file size is 500MB per bundle. If you require higher storage limits, raise a ticket under Technical Support.',
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchCat = faqCategory === 'ALL' || f.category === faqCategory;
      const matchQuery =
        faqSearch === '' ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [faqCategory, faqSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ---------------- TOP BANNER & HEADER ---------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-black tracking-wide">
              <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
              <span>Module 15: Partner Support & Mediation Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Support, Help Center & Dispute Desk
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Dedicated assistance center for Interior Designers: Escrow milestone clearance, Section 16 dispute mediation, CAD & 3D render technical diagnostics, and priority partner support.
            </p>
          </div>

          {/* Quick Contact Desk */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <a
              href="tel:+9118004194427"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition shadow-xs"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-[10px] text-blue-200 font-normal">Toll-Free Partner Line</div>
                <div className="font-mono text-xs">1800-419-GHAR</div>
              </div>
            </a>

            <button
              onClick={() => setView('RAISE_TICKET')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow-lg shadow-blue-900/50"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Support Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- VIEW SELECTOR & MULTI-PILL ACTION STRIP ---------------- */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Top Dropdown View Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Select View Mode:</label>
          <select
            value={currentView}
            onChange={(e) => setView(e.target.value as SupportViewMode)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="RAISE_TICKET">Raise Support Ticket ({tickets.filter((t) => t.status !== 'RESOLVED').length} Active)</option>
            <option value="TECHNICAL_SUPPORT">Technical Support (CAD / 3D Health)</option>
            <option value="PAYMENT_SUPPORT">Payment Support (Escrow Desk)</option>
            <option value="PROJECT_DISPUTES">Project Disputes (Section 16 Desk)</option>
            <option value="HELP_CENTER">Help Center & Designer SOPs</option>
          </select>
        </div>

        {/* 5-Pill Interactive Quick Switcher Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setView('RAISE_TICKET')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'RAISE_TICKET'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Ticket</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              currentView === 'RAISE_TICKET' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {tickets.length}
            </span>
          </button>

          <button
            onClick={() => setView('TECHNICAL_SUPPORT')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'TECHNICAL_SUPPORT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Technical</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setView('PAYMENT_SUPPORT')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'PAYMENT_SUPPORT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payment Desk</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              currentView === 'PAYMENT_SUPPORT' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {paymentSupportItems.length}
            </span>
          </button>

          <button
            onClick={() => setView('PROJECT_DISPUTES')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'PROJECT_DISPUTES'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>Disputes (Sec 16)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              currentView === 'PROJECT_DISPUTES' ? 'bg-rose-700 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {disputes.length}
            </span>
          </button>

          <button
            onClick={() => setView('HELP_CENTER')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'HELP_CENTER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center</span>
          </button>
        </div>
      </div>

      {/* ---------------- VIEW 1: RAISE SUPPORT TICKET ---------------- */}
      {currentView === 'RAISE_TICKET' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {ticketSuccessNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div>Support Ticket Raised Successfully!</div>
                <div className="font-normal text-emerald-700">
                  Our operations team has received your ticket and will reply within the designated SLA hours.
                </div>
              </div>
            </motion.div>
          )}

          {/* Ticket Creation Card & Live Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Raise New Ticket</h3>
                  <p className="text-[11px] text-slate-500">Fast 2-4 hr partner SLA response</p>
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Category *</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs"
                  >
                    <option value="Technical & CAD">Technical & CAD Rendering</option>
                    <option value="Billing & Payouts">Billing & Escrow Milestone Payout</option>
                    <option value="Project Execution & Coordination">Project Execution & Contractor Delay</option>
                    <option value="Customer Dispute">Customer Communication & Scope Dispute</option>
                    <option value="Platform Account">Platform Account & Permissions</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority Level *</label>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTicketPriority(p)}
                        className={`py-1.5 rounded-lg border font-black text-[10px] transition ${
                          ticketPriority === p
                            ? p === 'URGENT'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : p === 'HIGH'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    SLA Response: {ticketPriority === 'URGENT' ? '2 Hours' : ticketPriority === 'HIGH' ? '4 Hours' : ticketPriority === 'MEDIUM' ? '12 Hours' : '24 Hours'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Associated Project (Optional)</label>
                  <select
                    value={ticketProjectId}
                    onChange={(e) => setTicketProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs"
                  >
                    <option value="">General (No Specific Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject / Summary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3D V-Ray render texture error"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe exact issue, error messages or steps to reproduce..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Attachment Filename (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Error_Log_Render.png"
                      value={ticketAttachmentName}
                      onChange={(e) => setTicketAttachmentName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket to Helpdesk</span>
                </button>
              </form>
            </div>

            {/* Tickets List Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search tickets by ID, title..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs font-bold overflow-x-auto">
                  {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                        ticketStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Cards */}
              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div className="text-sm font-bold text-slate-700">No Tickets Found</div>
                    <div className="text-xs text-slate-400 mt-1">Try adjusting search or status filters.</div>
                  </div>
                ) : (
                  filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-200 hover:shadow-md transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                            {t.ticketNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{t.category}</span>
                          {t.projectName && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                                {t.projectName}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              t.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : t.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {t.priority}
                          </span>

                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              t.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900">{t.subject}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                      </div>

                      {/* Ticket Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                          <span>Raised: {t.createdAt}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>SLA: {t.slaResponseHours}h Guaranteed</span>
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedTicketForReply(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Thread ({t.replies?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 2: TECHNICAL SUPPORT ---------------- */}
      {currentView === 'TECHNICAL_SUPPORT' && (
        <div className="space-y-6">
          {/* Health Diagnostics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500">3D CAD & Render Storage</div>
              <div className="text-xl font-black text-slate-900">14.8 GB / 50 GB</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '29%' }} />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Supports Max, SKP, DWG, FBX (500MB/file)</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500">Cloud Sync & Local Cache</div>
              <div className="text-xl font-black text-emerald-600 flex items-center gap-2">
                <span>Healthy</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium">0 Conflict logs • Sync Latency: 22ms</div>
              <div className="text-[10px] text-slate-400 font-medium">Auto-saves every 30 seconds</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500">WebGL & GPU Acceleration</div>
              <div className="text-xl font-black text-slate-900">WebGL 2.0 (Active)</div>
              <div className="text-[11px] text-slate-500 font-medium">60 FPS Hardware Viewport Rendering</div>
              <div className="text-[10px] text-slate-400 font-medium">Chrome / Edge / Firefox Verified</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-500">Mobile & Tablet Companion</div>
              <div className="text-xl font-black text-slate-900">Paired (2 Devices)</div>
              <div className="text-[11px] text-slate-500 font-medium">iPad Pro & iPhone 15 Pro synced</div>
              <div className="text-[10px] text-slate-400 font-medium">Direct site camera measurement uploads</div>
            </div>
          </div>

          {/* Interactive Diagnostic Runner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">System & 3D Render Diagnostic Engine</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Run an instant self-diagnostic scan on your local graphics driver, cloud synchronization, and DWG parser.
                </p>
              </div>

              <button
                onClick={handleRunDiagnostic}
                disabled={isRunningDiagnostic}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
                <span>{isRunningDiagnostic ? 'Running Diagnostic...' : 'Run Diagnostics Now'}</span>
              </button>
            </div>

            {diagnosticResult && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 shadow-inner flex items-start gap-3"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{diagnosticResult}</div>
              </motion.div>
            )}
          </div>

          {/* Common Technical Issues & Solutions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Troubleshooting Guides for Designers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>3D V-Ray Texture Missing on Customer Portal</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  When exporting scenes from 3ds Max or SketchUp, ensure all texture bitmaps are collected using "Archive Scene" (ZIP) with relative paths. Uploading unbundled absolute path assets causes missing maps on client viewports.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>AutoCAD 2D DWG Scale Discrepancy (Inches vs mm)</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  BuildGhar's automated BOQ quantity takeoff engine operates in metric millimeters (mm). Type <code className="bg-slate-200 px-1 rounded font-mono">INSUNITS</code> in AutoCAD and set it to 4 (millimeters) before saving your DWG file.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>360-Degree Panorama VR Distortion</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Equirectangular panoramic renders must adhere strictly to a 2:1 aspect ratio (e.g. 4096x2048 or 6000x3000). Renders rendered in non-2:1 ratios will pinch at poles when viewed through BuildGhar VR headsets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Live Remote Desktop Assistance</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Need a senior BuildGhar CAD specialist to troubleshoot your layout or 3D scene? Schedule an AnyDesk or Google Meet screen share session with our technical team.
                </p>
                <button
                  onClick={() => {
                    setView('RAISE_TICKET');
                    setTicketSubject('Request Remote Desktop Assistance with CAD Specialist');
                    setTicketCategory('Technical & CAD');
                  }}
                  className="mt-1 text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Request Screen Share Session</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 3: PAYMENT SUPPORT ---------------- */}
      {currentView === 'PAYMENT_SUPPORT' && (
        <div className="space-y-6">
          {/* Escrow Protection Assurance Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 text-white border border-emerald-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600 text-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>BuildGhar 100% Escrow Guarantee</span>
              </div>
              <h2 className="text-xl font-black">ICICI Bank Trustee Escrow Milestone Protection</h2>
              <p className="text-emerald-100 text-xs max-w-2xl leading-relaxed">
                Your professional design fees are deposited into the escrow trustee account prior to project kickoff. Once you complete milestone deliverables and client/admin signs off, disbursements are non-retractable.
              </p>
            </div>

            <button
              onClick={() => setIsPaymentQueryOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs transition shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Payment Inquiry</span>
            </button>
          </div>

          {/* Payment Support Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-500">Total Escrow Disbursed</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹4,85,000</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">100% On-Time Record</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-500">Pending Milestone Holds</div>
              <div className="text-2xl font-black text-amber-600 mt-1">₹1,80,000</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">1 Stage awaiting bank RTGS batch</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="text-xs font-bold text-slate-500">TDS 194J Credits Logged</div>
              <div className="text-2xl font-black text-blue-600 mt-1">₹48,500</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Reflected in TRACES / 26AS</div>
            </div>
          </div>

          {/* Payment Tickets & Escrow Tracker Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Escrow & Payout Inquiries</h3>
                <p className="text-xs text-slate-500">Track clearance status with BuildGhar Treasury</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {paymentSupportItems.map((pay) => (
                <div key={pay.id} className="p-5 hover:bg-slate-50 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {pay.ticketCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{pay.milestoneTitle}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{pay.projectName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm text-slate-900">
                        ₹{pay.amount.toLocaleString()}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          pay.status === 'SETTLED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pay.status === 'ESCALATED_TO_BANK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {pay.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{pay.notes}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                    <div>
                      Assigned Officer: <strong className="text-slate-700">{pay.assignedFinanceOfficer}</strong>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Filed: {pay.filedDate}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">ETA: {pay.resolutionEta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 4: PROJECT DISPUTES (SECTION 16) ---------------- */}
      {currentView === 'PROJECT_DISPUTES' && (
        <div className="space-y-6">
          {/* Section 16 Mandatory Clause Alert */}
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-start gap-4 text-xs text-rose-950 shadow-xs">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black text-rose-900 text-sm">
                BuildGhar Unilateral Closure Restriction (Section 16 Clause 4.2)
              </div>
              <div className="text-rose-800 leading-relaxed">
                To prevent coercion and unfair leverage, neither an interior designer nor a homeowner can unilaterally close a registered project dispute. All disputes undergo formal evidence audit and must be officially certified and closed by the appointed BuildGhar Mediation Arbitrator.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold scrollbar-none">
              {(['ALL', 'SITE_ACCESS_PROBLEMS', 'SCOPE_DISPUTES', 'PAYMENT_COMPLAINTS'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDisputeCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    disputeCategoryFilter === cat
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsNewDisputeOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition shrink-0"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Raise Formal Dispute (Section 16)</span>
            </button>
          </div>

          {/* Disputes List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredDisputes.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <div className="text-sm font-bold text-slate-700">No Active Project Disputes</div>
                  <div className="text-slate-400 mt-1">All design milestones and site coordination are running smoothly.</div>
                </div>
              ) : (
                filteredDisputes.map((disp) => (
                  <div key={disp.id} className="p-5 space-y-3 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          {disp.disputeCode}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {disp.disputeType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-700 font-bold">{disp.projectTitle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            disp.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {disp.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900">{disp.subject}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{disp.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">
                          Mediator: <strong className="text-blue-700">{disp.assignedAdmin}</strong>
                        </span>
                        {disp.holdAssociatedPayout && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Escrow Disbursement Locked During Mediation</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Filed on {new Date(disp.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 5: HELP CENTER ---------------- */}
      {currentView === 'HELP_CENTER' && (
        <div className="space-y-6">
          {/* FAQ Search Bar & Category Filters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search knowledge base: e.g. Escrow payouts, 3D render revision limits, site measurement SOP..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              {[
                { key: 'ALL', label: 'All Topics' },
                { key: 'ESCROW_PAYMENTS', label: 'Escrow & Payouts' },
                { key: 'DESIGN_MILESTONES', label: 'Design Milestones' },
                { key: 'SITE_INSPECTIONS', label: 'Site Inspection SOP' },
                { key: 'BOQ_MATERIALS', label: 'BOQ & Materials' },
                { key: 'DISPUTE_PROTOCOLS', label: 'Section 16 Disputes' },
                { key: 'TECHNICAL', label: 'CAD & 3D Formats' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFaqCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
                    faqCategory === c.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion FAQs */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredFaqs.map((faq) => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <div key={faq.id} className="p-5 transition hover:bg-slate-50/50">
                  <button
                    onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4"
                  >
                    <span className="text-sm font-black text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 text-xs text-slate-600 leading-relaxed pr-6"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Downloadable Designer Resources */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Official Designer Policy Documents & Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Standard Interior Agreement</div>
                  <div className="text-[11px] text-slate-500">Milestone terms & revision scope (PDF)</div>
                  <button className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 pt-1">
                    <Download className="w-3 h-3" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Material Specification Guide</div>
                  <div className="text-[11px] text-slate-500">2026 Grade standard codes (PDF)</div>
                  <button className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 pt-1">
                    <Download className="w-3 h-3" />
                    <span>Download Guidelines</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Section 16 Dispute Charter</div>
                  <div className="text-[11px] text-slate-500">Arbitration rules & escrow holds (PDF)</div>
                  <button className="text-rose-700 font-bold hover:underline inline-flex items-center gap-1 pt-1">
                    <Download className="w-3 h-3" />
                    <span>Download Charter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 1: TICKET CONVERSATION THREAD ---------------- */}
      <AnimatePresence>
        {selectedTicketForReply && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedTicketForReply.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{selectedTicketForReply.category}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{selectedTicketForReply.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicketForReply(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
                {/* Initial Description */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-800">Initial Request Description</div>
                  <p className="text-slate-600 leading-relaxed">{selectedTicketForReply.description}</p>
                </div>

                {selectedTicketForReply.replies?.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl max-w-[85%] space-y-1 ${
                      rep.role === 'DESIGNER'
                        ? 'ml-auto bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-80 font-bold">
                      <span>{rep.sender}</span>
                      <span>{rep.timestamp}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{rep.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input Box */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your response to support agent..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendTicketReply();
                  }}
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSendTicketReply}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: NEW DISPUTE (SECTION 16) ---------------- */}
      <AnimatePresence>
        {isNewDisputeOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-800 font-black text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Raise Formal Dispute (Section 16)</span>
                </div>
                <button
                  onClick={() => setIsNewDisputeOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Associated Project *</label>
                  <select
                    value={disputeProjectId}
                    onChange={(e) => setDisputeProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispute Category (Section 16) *</label>
                  <select
                    value={disputeCategory}
                    onChange={(e) => setDisputeCategory(e.target.value as DisputeCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-xs"
                  >
                    <option value="PAYMENT_COMPLAINTS">Payment Complaints & Escrow Withholding</option>
                    <option value="SCOPE_DISPUTES">Scope Creep & Unpaid Revisions</option>
                    <option value="CUSTOMER_REQUIREMENT_DISPUTES">Customer Requirement / Spec Contradiction</option>
                    <option value="SITE_ACCESS_PROBLEMS">Site Access Denied / Lockout by Society</option>
                    <option value="MATERIAL_QUALITY_ISSUES">Contractor Material Substitution Deviation</option>
                    <option value="PROJECT_DELAY_ISSUES">Third-Party Civil / MEP Project Delays</option>
                    <option value="TECHNICAL_ISSUES">Technical & Structural Feasibility Conflict</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Specific grievance summary..."
                    value={disputeSubject}
                    onChange={(e) => setDisputeSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Chronology & Evidence *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide exact dates, contract clauses, and parties involved..."
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supporting Evidence Filename</label>
                  <input
                    type="text"
                    placeholder="e.g. Site_Access_Log_Photos.pdf"
                    value={disputeEvidenceName}
                    onChange={(e) => setDisputeEvidenceName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewDisputeOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition"
                  >
                    Submit Formal Dispute
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: PAYMENT INQUIRY MODAL ---------------- */}
      <AnimatePresence>
        {isPaymentQueryOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-base">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Raise Escrow Payout Inquiry</span>
                </div>
                <button
                  onClick={() => setIsPaymentQueryOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePaymentQuery} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Query Type *</label>
                  <select
                    value={payQueryType}
                    onChange={(e) => setPayQueryType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                  >
                    <option value="ESCROW_RELEASE_DELAY">Escrow Milestone Payout Delay (&gt;24 hrs)</option>
                    <option value="TDS_CERTIFICATE">TDS Form 16A / TRACES Credit Inquiry</option>
                    <option value="GST_CORRECTION">GST Tax Invoice Correction</option>
                    <option value="BANK_CHANGE">Change of Registered Payout Bank IFSC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Milestone Name / Stage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stage 3: 3D Visualization Renders"
                    value={payMilestoneTitle}
                    onChange={(e) => setPayMilestoneTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount in Question (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 145000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Explanation & Notes *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide reference numbers, milestone sign-off dates..."
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPaymentQueryOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition"
                  >
                    Submit to Treasury Desk
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
