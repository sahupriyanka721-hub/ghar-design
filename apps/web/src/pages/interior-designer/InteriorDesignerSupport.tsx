import React, { useState, useEffect } from 'react';
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
  getInteriorReviews,
  getInteriorProjects,
  InteriorReview,
} from '../../data/interiorDesignerStore.js';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export const InteriorDesignerSupport: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DISPUTES' | 'TICKETS' | 'REVIEWS'>('DISPUTES');

  // Disputes State (Section 16)
  const [disputes, setDisputes] = useState<ComplaintDisputeItem[]>([]);
  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>('SITE_ACCESS_PROBLEMS');
  const [disputePriority, setDisputePriority] = useState<DisputePriority>('HIGH');
  const [disputeProjectId, setDisputeProjectId] = useState('');
  const [disputeSubject, setDisputeSubject] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidenceName, setDisputeEvidenceName] = useState('');

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 't-1',
      ticketNumber: 'TKT-ID-8821',
      subject: 'GST Invoice validation for Stage 2 Escrow Disbursement',
      category: 'Billing & Payouts',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      createdAt: '2026-10-25',
    },
    {
      id: 't-2',
      ticketNumber: 'TKT-ID-8904',
      subject: 'Assistance with 4K Render Upload storage limit',
      category: 'Design Center & CAD',
      priority: 'LOW',
      status: 'RESOLVED',
      createdAt: '2026-10-28',
    },
  ]);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Billing & Payouts');
  const [ticketDescription, setTicketDescription] = useState('');

  // Reviews State
  const [reviews, setReviews] = useState<InteriorReview[]>([]);

  const projects = getInteriorProjects();

  const loadData = () => {
    try {
      const allDisputes = getComplaintDisputes();
      const designerDisputes = allDisputes.filter(
        (d) =>
          d.complainantRole === 'INTERIOR_DESIGNER' ||
          d.id.includes('INT') ||
          d.disputeCode.includes('INT')
      );
      setDisputes(designerDisputes);
      setReviews(getInteriorReviews());
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
        : [{ name: 'Site_Inspection_Notice.pdf', type: 'PDF', url: '#' }],
      status: 'OPEN_RECEIVED',
      assignedAdmin: 'Pending Assignment by Admin Desk',
      holdAssociatedPayout: false,
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

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTkt: SupportTicket = {
      id: `t-${Date.now()}`,
      ticketNumber: `TKT-ID-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketSubject,
      category: ticketCategory,
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTickets([newTkt, ...tickets]);
    setIsNewTicketOpen(false);
    setTicketSubject('');
    setTicketDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
            <span>Partner Operations & Disputes Resolution Desk (Section 16)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Support, Complaints & Disputes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            BuildGhar grievance and mediation center: Contract disputes, site access issues, scope creep, and verified homeowner feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'DISPUTES' && (
            <button
              onClick={() => setIsNewDisputeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Raise Project Dispute</span>
            </button>
          )}

          {activeTab === 'TICKETS' && (
            <button
              onClick={() => setIsNewTicketOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Helpdesk Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'DISPUTES'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Project Disputes & Grievances ({disputes.length})
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'TICKETS'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          General Helpdesk Tickets ({tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('REVIEWS')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'REVIEWS'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Verified Client Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab 1: Project Disputes & Grievances */}
      {activeTab === 'DISPUTES' && (
        <div className="space-y-4">
          {/* Dispute Policy Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">BuildGhar Unilateral Closure Restriction (Section 16)</div>
              <div className="mt-0.5 text-amber-800">
                To guarantee fairness, neither an interior designer nor a customer can unilaterally close an active dispute. All resolutions must be reviewed and officially certified by the assigned BuildGhar Dispute Officer.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {disputes.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No active disputes or complaints filed.
                </div>
              ) : (
                disputes.map((disp) => (
                  <div key={disp.id} className="p-5 space-y-3 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          {disp.disputeCode}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          {disp.disputeType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-semibold">{disp.projectTitle}</span>
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
                          Assigned Officer: <strong className="text-blue-700">{disp.assignedAdmin}</strong>
                        </span>
                        {disp.holdAssociatedPayout && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Associated Escrow Payout Held</span>
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

      {/* Tab 2: General Helpdesk Tickets */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Priority Partner Hotline</div>
                <div className="font-mono font-black text-slate-900 text-sm mt-0.5">+91 1800-419-GHAR</div>
                <div className="text-[11px] text-blue-700 font-bold">Mon-Sat (9 AM - 8 PM)</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Partner Manager WhatsApp</div>
                <div className="font-mono font-black text-slate-900 text-sm mt-0.5">+91 98110 55990</div>
                <div className="text-[11px] text-emerald-700 font-bold">Instant Escalation</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Operations Helpdesk</div>
                <div className="font-mono font-black text-slate-900 text-sm mt-0.5">designers@buildghar.in</div>
                <div className="text-[11px] text-blue-700 font-bold">Guaranteed 2-Hour Response</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {t.ticketNumber}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-semibold">{t.category}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mt-1">{t.subject}</h4>
                    <div className="text-[11px] text-slate-400 mt-0.5">Raised on {t.createdAt}</div>
                  </div>

                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Feedback & Reviews */}
      {activeTab === 'REVIEWS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(rev.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="font-black text-slate-900 text-xs ml-1.5">{rev.rating}.0</span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified Customer
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{rev.reviewText}"
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{rev.customerName}</div>
                    <div className="text-[11px] text-slate-400">{rev.projectName}</div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString([], {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Dispute Modal (Section 16) */}
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="PAYMENT_COMPLAINTS">Payment Complaints</option>
                    <option value="SCOPE_DISPUTES">Scope Disputes</option>
                    <option value="CUSTOMER_REQUIREMENT_DISPUTES">Customer Requirement Disputes</option>
                    <option value="SITE_ACCESS_PROBLEMS">Site Access Problems</option>
                    <option value="MATERIAL_QUALITY_ISSUES">Material Quality Issues</option>
                    <option value="PROJECT_DELAY_ISSUES">Project Delay Issues</option>
                    <option value="TECHNICAL_ISSUES">Technical Issues</option>
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Explanation & Chronology *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide exact dates, contract clauses, and parties involved..."
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supporting Evidence Filename</label>
                  <input
                    type="text"
                    placeholder="e.g. Site_Access_Log_Photos.pdf"
                    value={disputeEvidenceName}
                    onChange={(e) => setDisputeEvidenceName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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

      {/* New Helpdesk Ticket Modal */}
      <AnimatePresence>
        {isNewTicketOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <LifeBuoy className="w-5 h-5 text-blue-600" />
                  <span>Raise Partner Ticket</span>
                </div>
                <button
                  onClick={() => setIsNewTicketOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Category *</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Billing & Payouts">Billing & Escrow Payouts</option>
                    <option value="Customer Dispute">Customer Communication or Site Delay</option>
                    <option value="Material Depot">BuildGhar Material Orders & Supply</option>
                    <option value="Design Center">Design Center & File Uploads</option>
                    <option value="Other">Other Technical Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your query"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please include project ID, booking reference, or invoice number if applicable..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewTicketOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Submit Ticket
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