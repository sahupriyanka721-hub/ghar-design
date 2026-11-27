import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Check,
  ArrowRight,
  XCircle,
  Plus,
  Eye,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Phone,
  User,
  Calendar,
  X,
  ArrowLeft,
  Send,
  Building,
  ShieldCheck,
  FileText,
  Lock,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Paperclip,
  Compass,
  DollarSign,
  Gavel,
  Flame,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import {
  getComplaintDisputes,
  getComplaintDisputeById,
  saveComplaintDispute,
  assignDisputeOfficer,
  updateDisputeStatus,
  toggleDisputePayoutHold,
  resolveDispute,
  escalateDisputeToSuperAdmin,
  ComplaintDisputeItem,
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
  ResolutionDecisionType,
} from '../../data/communicationDisputeStore.js';

export const AdminSupportTickets: React.FC = () => {
  const { success, error } = useToast();

  const [disputes, setDisputes] = useState<ComplaintDisputeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | DisputeStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [selectedDispute, setSelectedDispute] = useState<ComplaintDisputeItem | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isNewDisputeModalOpen, setIsNewDisputeModalOpen] = useState(false);

  // Forms
  const [resolveForm, setResolveForm] = useState<{
    decision: ResolutionDecisionType;
    resolutionNotes: string;
    releaseHold: boolean;
  }>({
    decision: 'CORRECTION_ORDERED',
    resolutionNotes: 'Architect must issue revised structural drawings within 48 hours as per contractual specifications.',
    releaseHold: true,
  });

  const [assignOfficerName, setAssignOfficerName] = useState('Grievance Officer (Legal & Compliance)');
  const [escalateReason, setEscalateReason] = useState('Breach of milestone deliverables SLA exceeding ₹1,00,000 threshold.');

  // New Grievance Form
  const [newDispute, setNewDispute] = useState({
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    complainantRole: 'CUSTOMER' as 'CUSTOMER' | 'ARCHITECT' | 'CONTRACTOR',
    complainantName: 'Sharika Mishra',
    complainantPhone: '+91 98765 43210',
    respondentRole: 'ARCHITECT' as 'ARCHITECT' | 'CUSTOMER',
    respondentName: 'Ar. Rajesh Verma',
    disputeType: 'DESIGN_QUALITY_COMPLAINT' as DisputeCategory,
    priority: 'HIGH' as DisputePriority,
    subject: 'Structural Beam Depth Discrepancy on Ground Floor Layout',
    description: 'The reinforcement detailing specifies a 450mm beam depth where ceiling clearance was contracted at minimum 3.0 meters.',
  });

  const loadData = () => {
    try {
      const list = getComplaintDisputes();
      setDisputes([...list]);
    } catch (e) {
      console.error('Error loading complaints/disputes:', e);
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

  // Filtered Disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (activeTab !== 'ALL' && d.status !== activeTab) return false;
      if (typeFilter !== 'ALL' && d.disputeType !== typeFilter) return false;
      if (priorityFilter !== 'ALL' && d.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = d.disputeCode.toLowerCase().includes(q);
        const matchSubj = d.subject.toLowerCase().includes(q);
        const matchComp = d.complainantName.toLowerCase().includes(q);
        const matchResp = d.respondentName.toLowerCase().includes(q);
        const matchProj = d.projectId.toLowerCase().includes(q) || d.projectTitle.toLowerCase().includes(q);
        return matchCode || matchSubj || matchComp || matchResp || matchProj;
      }
      return true;
    });
  }, [disputes, activeTab, typeFilter, priorityFilter, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const openCount = disputes.filter((d) => d.status === 'OPEN_RECEIVED' || d.status === 'INVESTIGATING').length;
    const criticalCount = disputes.filter((d) => d.priority === 'CRITICAL_URGENT' || d.status === 'ESCALATED_SUPER_ADMIN').length;
    const payoutHoldCount = disputes.filter((d) => d.holdAssociatedPayout === true && d.status !== 'RESOLVED').length;
    const resolvedCount = disputes.filter((d) => d.status === 'RESOLVED').length;

    return {
      total: disputes.length,
      openCount,
      criticalCount,
      payoutHoldCount,
      resolvedCount,
    };
  }, [disputes]);

  // Actions
  const handleAssignOfficer = () => {
    if (!selectedDispute) return;
    try {
      const updated = assignDisputeOfficer(selectedDispute.id, assignOfficerName);
      if (updated) {
        logAdminAuditAction({
          action: 'DISPUTE_OFFICER_ASSIGNED',
          targetType: 'DISPUTE',
          targetId: updated.disputeCode,
          description: `Dispute ${updated.disputeCode} assigned to ${assignOfficerName}`,
        });
        success(`Assigned to ${assignOfficerName}.`);
        loadData();
        setSelectedDispute(updated);
        setIsAssignModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to assign officer');
    }
  };

  const handleTogglePayoutHold = (hold: boolean) => {
    if (!selectedDispute) return;
    try {
      const updated = toggleDisputePayoutHold(selectedDispute.id, hold, 'Super Admin');
      if (updated) {
        logAdminAuditAction({
          action: hold ? 'DISPUTE_PAYOUT_FROZEN' : 'DISPUTE_PAYOUT_RELEASED',
          targetType: 'DISPUTE',
          targetId: updated.disputeCode,
          description: `${hold ? 'Frozen' : 'Released'} payout under dispute ${updated.disputeCode}`,
        });
        success(hold ? 'Partner payout frozen in platform escrow.' : 'Payout hold released.');
        loadData();
        setSelectedDispute(updated);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update payout hold');
    }
  };

  const handleResolveDispute = () => {
    if (!selectedDispute) return;
    if (!resolveForm.resolutionNotes.trim()) {
      error('Please write clear resolution notes for both parties');
      return;
    }

    try {
      const updated = resolveDispute(selectedDispute.id, {
        decision: resolveForm.decision,
        resolutionNotes: resolveForm.resolutionNotes.trim(),
        resolvedBy: 'Super Admin',
        releaseHold: resolveForm.releaseHold,
      });

      if (updated) {
        logAdminAuditAction({
          action: 'DISPUTE_RESOLVED',
          targetType: 'DISPUTE',
          targetId: updated.disputeCode,
          description: `Dispute resolved with decision: ${resolveForm.decision}`,
          metadata: { disputeId: updated.id, decision: resolveForm.decision },
        });

        success(`Dispute ${updated.disputeCode} resolved successfully! Both parties notified.`);
        loadData();
        setSelectedDispute(updated);
        setIsResolveModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to resolve dispute');
    }
  };

  const handleEscalateDispute = () => {
    if (!selectedDispute) return;
    try {
      const updated = escalateDisputeToSuperAdmin(selectedDispute.id, {
        escalatedBy: 'Grievance Officer',
        reason: escalateReason.trim(),
      });

      if (updated) {
        logAdminAuditAction({
          action: 'DISPUTE_ESCALATED',
          targetType: 'DISPUTE',
          targetId: updated.disputeCode,
          description: `Dispute escalated to Super Admin: ${escalateReason.trim()}`,
        });

        success(`Dispute ${updated.disputeCode} escalated to Super Admin with CRITICAL priority.`);
        loadData();
        setSelectedDispute(updated);
        setIsEscalateModalOpen(false);
      }
    } catch (err: any) {
      error(err.message || 'Failed to escalate dispute');
    }
  };

  const handleCreateNewDispute = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ComplaintDisputeItem = {
      id: `DISP-${Date.now()}`,
      disputeCode: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: newDispute.projectId,
      projectTitle: newDispute.projectTitle,
      complainantRole: newDispute.complainantRole,
      complainantName: newDispute.complainantName,
      complainantPhone: newDispute.complainantPhone,
      respondentRole: newDispute.respondentRole,
      respondentName: newDispute.respondentName,
      disputeType: newDispute.disputeType,
      priority: newDispute.priority,
      subject: newDispute.subject,
      description: newDispute.description,
      evidenceFiles: [],
      status: 'OPEN_RECEIVED',
      assignedAdmin: 'Grievance Officer (Legal & Compliance)',
      holdAssociatedPayout: newDispute.priority === 'CRITICAL_URGENT' || newDispute.priority === 'HIGH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'DISPUTE_REGISTERED',
          actor: 'Admin Desk',
          details: `Grievance registered under ${newDispute.disputeType}`,
        },
      ],
    };

    saveComplaintDispute(item);

    logAdminAuditAction({
      action: 'DISPUTE_REGISTERED',
      targetType: 'DISPUTE',
      targetId: item.disputeCode,
      description: `New dispute registered: ${item.subject} for ${item.projectTitle}`,
    });

    success(`Dispute ${item.disputeCode} registered and assigned for investigation!`);
    loadData();
    setIsNewDisputeModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Complaint & Dispute Resolution Management
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 15 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Grievance Governance: Evidence Review ➔ Investigation ➔ Payout Hold Enforcement ➔ Formal Contractual Resolution.
          </p>
        </div>

        <button
          onClick={() => setIsNewDisputeModalOpen(true)}
          className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Grievance / Dispute</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Open & Investigating</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-950 font-display">
            {stats.openCount}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Active grievances under review
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-red-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Critical / Super Admin Escalated</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-950 font-display">
            {stats.criticalCount}
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            Urgent SLA breach or structural risk
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-800 text-xs font-semibold">
            <span>Payouts On Escrow Hold</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-950 font-display">
            {stats.payoutHoldCount}
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            Protected escrow funds frozen
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Resolved Disputes</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {stats.resolvedCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Successfully settled & closed
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
            <span>All Disputes</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {disputes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('OPEN_RECEIVED')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OPEN_RECEIVED'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Open & Received</span>
          </button>

          <button
            onClick={() => setActiveTab('INVESTIGATING')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'INVESTIGATING'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Under Investigation</span>
          </button>

          <button
            onClick={() => setActiveTab('ESCALATED_SUPER_ADMIN')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ESCALATED_SUPER_ADMIN'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Escalated to Super Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'RESOLVED'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700">
              {stats.resolvedCount}
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
            placeholder="Search by Dispute Code (DISP-2026-XXXX), Complainant, Subject, Project ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Dispute Types</option>
            <option value="QUOTATION_DISPUTE">Quotation Dispute</option>
            <option value="DESIGN_QUALITY_COMPLAINT">Design Quality Complaint</option>
            <option value="DELAYED_DELIVERABLES">Delayed Deliverables</option>
            <option value="MILESTONE_COMPLETION_DISPUTE">Milestone Completion Dispute</option>
            <option value="PAYMENT_DISPUTE">Payment Dispute</option>
            <option value="PAYOUT_DISPUTE">Payout Dispute</option>
            <option value="PROJECT_CANCELLATION">Project Cancellation</option>
            <option value="COMMUNICATION_COMPLAINT">Communication Complaint</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL_URGENT">Critical / Urgent</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Dispute ID & Date</th>
                <th className="py-3 px-4">Parties (Complainant ➔ Respondent)</th>
                <th className="py-3 px-4">Subject & Project</th>
                <th className="py-3 px-4">Dispute Category</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Escrow Payout</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <LifeBuoy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No complaints or disputes found</p>
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{d.disputeCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(d.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950 flex items-center gap-1.5">
                        <span className="text-slate-800">{d.complainantName}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                          {d.complainantRole}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>Against: {d.respondentName} ({d.respondentRole})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">{d.subject}</div>
                      <div className="text-[11px] text-blue-700 font-medium truncate max-w-xs flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 rounded border border-blue-200">
                          {d.projectId}
                        </span>
                        <span className="truncate">{d.projectTitle}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="slate" className="text-[10px] font-bold">
                        {d.disputeType.replace(/_/g, ' ')}
                      </Badge>
                      <div className="text-[10px] text-slate-400 mt-0.5">Officer: {d.assignedAdmin}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.priority === 'CRITICAL_URGENT'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : d.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {d.priority === 'CRITICAL_URGENT' && <Flame className="w-3 h-3 text-rose-600" />}
                        <span>{d.priority.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {d.holdAssociatedPayout ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Frozen</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500">
                          <span>Unrestricted</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          d.status === 'RESOLVED'
                            ? 'emerald'
                            : d.status === 'ESCALATED_SUPER_ADMIN'
                            ? 'rose'
                            : d.status === 'INVESTIGATING'
                            ? 'blue'
                            : 'amber'
                        }
                        className="font-bold text-[10px]"
                      >
                        {d.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Investigation Drawer */}
      {selectedDispute && !isResolveModalOpen && !isAssignModalOpen && !isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-left">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                  {selectedDispute.disputeCode}
                </span>
                <h3 className="text-base font-bold text-navy-950">Grievance Investigation Desk</h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs flex-1">
              {/* Subject & Status Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="blue" className="text-[10px] font-bold">
                    {selectedDispute.disputeType.replace(/_/g, ' ')}
                  </Badge>
                  <Badge
                    variant={selectedDispute.status === 'RESOLVED' ? 'emerald' : 'amber'}
                    className="font-bold text-[10px]"
                  >
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h2 className="text-sm font-bold text-navy-950">{selectedDispute.subject}</h2>
                <div className="text-[11px] text-slate-600">
                  Project: <span className="font-semibold text-blue-700">{selectedDispute.projectTitle}</span> ({selectedDispute.projectId})
                </div>
              </div>

              {/* Complainant & Respondent Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complainant</div>
                  <div className="font-bold text-navy-950">{selectedDispute.complainantName}</div>
                  <div className="text-[11px] text-slate-500">{selectedDispute.complainantRole}</div>
                  <div className="text-[11px] text-slate-500">{selectedDispute.complainantPhone}</div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respondent</div>
                  <div className="font-bold text-navy-950">{selectedDispute.respondentName}</div>
                  <div className="text-[11px] text-slate-500">{selectedDispute.respondentRole}</div>
                  <div className="text-[11px] text-slate-500">Notice Dispatched: Yes</div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grievance Description</div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedDispute.description}
                </div>
              </div>

              {/* Evidence Documents */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evidence Submissions</div>
                {selectedDispute.evidenceFiles.length === 0 ? (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                    No evidence attachments submitted.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDispute.evidenceFiles.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">{ev.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({ev.type})</span>
                        </div>
                        <button className="text-blue-600 hover:underline font-bold text-[11px]">
                          Inspect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escrow Payout Protection Section 15 */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-purple-950">Escrow Payout Protection Gate</span>
                  </div>
                  {selectedDispute.holdAssociatedPayout ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      PAYOUT FROZEN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Under BuildGhar dispute rules, Admin can freeze partner payouts from escrow until technical corrections or quality disputes are settled.
                </p>
                <div className="flex gap-2">
                  {selectedDispute.holdAssociatedPayout ? (
                    <button
                      onClick={() => handleTogglePayoutHold(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs transition"
                    >
                      Release Payout Freeze
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTogglePayoutHold(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition"
                    >
                      Freeze Partner Payout
                    </button>
                  )}
                </div>
              </div>

              {/* Audit History Timeline */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audit Investigation Trail</div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedDispute.auditHistory.map((h, idx) => (
                    <div key={idx} className="p-3 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{h.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-mono text-slate-400">{formatDate(h.timestamp)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">{h.details}</div>
                      <div className="text-[10px] text-slate-400">Actor: {h.actor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolved Info if already settled */}
              {selectedDispute.status === 'RESOLVED' && selectedDispute.resolutionNotes && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Order: {selectedDispute.resolutionDecision?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedDispute.resolutionNotes}</p>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Settled on {formatDate(selectedDispute.resolutionDate || '')} by {selectedDispute.resolvedBy}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Reassign Officer
                  </button>
                  {selectedDispute.status !== 'ESCALATED_SUPER_ADMIN' && selectedDispute.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setIsEscalateModalOpen(true)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center gap-1"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Escalate</span>
                    </button>
                  )}
                </div>

                {selectedDispute.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setIsResolveModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Issue Formal Resolution Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {isResolveModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Issue Formal Resolution Order</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedDispute.disputeCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contractual Decision Type</label>
                <select
                  value={resolveForm.decision}
                  onChange={(e) => setResolveForm({ ...resolveForm, decision: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="CORRECTION_ORDERED">Correction Ordered (Architect must revise drawings)</option>
                  <option value="FULL_REFUND_APPROVED">Full Refund Approved to Customer</option>
                  <option value="PARTIAL_REFUND_APPROVED">Partial Refund Approved with revised scope</option>
                  <option value="MUTUAL_SETTLEMENT">Mutual Settlement (Both parties signed addendum)</option>
                  <option value="DISMISSED_INVALID">Dismissed Invalid (No contractual breach substantiated)</option>
                  <option value="PAYOUT_RELEASE_APPROVED">Milestone Approved & Payout Release Authorized</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Official Resolution Findings & Next Steps <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record binding findings based on contract clauses and architectural specifications..."
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Release Payout Freeze</div>
                  <div className="text-[10px] text-slate-500">Unfreeze architect payout in platform escrow</div>
                </div>
                <input
                  type="checkbox"
                  checked={resolveForm.releaseHold}
                  onChange={(e) => setResolveForm({ ...resolveForm, releaseHold: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Publish Binding Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Officer Modal */}
      {isAssignModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Assign Grievance Officer</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedDispute.disputeCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Investigating Officer</label>
                <select
                  value={assignOfficerName}
                  onChange={(e) => setAssignOfficerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Grievance Officer (Legal & Compliance)">Grievance Officer (Legal & Compliance)</option>
                  <option value="Chief Architect / Technical Reviewer">Chief Architect / Technical Reviewer</option>
                  <option value="Finance & Escrow Controller">Finance & Escrow Controller</option>
                  <option value="Super Administrator">Super Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Assign Officer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {isEscalateModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Escalate to Super Administrator</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedDispute.disputeCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px]">
                Escalating will raise priority to CRITICAL URGENT and trigger high-priority alerts on executive console.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason for High-Level Escalation <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify why normal mediation failed or why contract termination/litigation is threatened..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateDispute}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                <span>Escalate Urgently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Dispute Modal */}
      {isNewDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Register Grievance / Contract Dispute</h3>
                  <p className="text-[11px] text-slate-500">Section 15 Dispute Management Desk</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewDisputeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewDispute} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                  <input
                    type="text"
                    required
                    value={newDispute.projectId}
                    onChange={(e) => setNewDispute({ ...newDispute, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispute Category</label>
                  <select
                    value={newDispute.disputeType}
                    onChange={(e) => setNewDispute({ ...newDispute, disputeType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="DESIGN_QUALITY_COMPLAINT">Design Quality Complaint</option>
                    <option value="DELAYED_DELIVERABLES">Delayed Deliverables</option>
                    <option value="MILESTONE_COMPLETION_DISPUTE">Milestone Completion Dispute</option>
                    <option value="QUOTATION_DISPUTE">Quotation Dispute</option>
                    <option value="PAYMENT_DISPUTE">Payment Dispute</option>
                    <option value="PAYOUT_DISPUTE">Payout Dispute</option>
                    <option value="PROJECT_CANCELLATION">Project Cancellation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newDispute.projectTitle}
                  onChange={(e) => setNewDispute({ ...newDispute, projectTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Complainant Name</label>
                  <input
                    type="text"
                    required
                    value={newDispute.complainantName}
                    onChange={(e) => setNewDispute({ ...newDispute, complainantName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Respondent Name</label>
                  <input
                    type="text"
                    required
                    value={newDispute.respondentName}
                    onChange={(e) => setNewDispute({ ...newDispute, respondentName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Grievance Subject</label>
                <input
                  type="text"
                  required
                  value={newDispute.subject}
                  onChange={(e) => setNewDispute({ ...newDispute, subject: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDispute.description}
                  onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewDisputeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
