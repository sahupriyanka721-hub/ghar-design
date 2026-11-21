import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformSupportTicket,
  getPlatformSupportTickets,
  createPlatformSupportTicket,
  updatePlatformSupportTicketStatus,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';

export const AdminSupportTickets: React.FC = () => {
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>(() => getPlatformSupportTickets());
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Detail / Resolution Modal
  const [activeTicket, setActiveTicket] = useState<PlatformSupportTicket | null>(null);
  const [editStatus, setEditStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED'>('OPEN');
  const [editNotes, setEditNotes] = useState('');
  const [editResolution, setEditResolution] = useState('');
  const [editAgent, setEditAgent] = useState('');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketStep, setTicketStep] = useState<1 | 2>(1);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCategory, setNewCategory] = useState<PlatformSupportTicket['category']>('QUOTATION_ISSUES');
  const [newPriority, setNewPriority] = useState<PlatformSupportTicket['priority']>('MEDIUM');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEntityId, setNewEntityId] = useState('');

  const refreshData = () => {
    setTickets(getPlatformSupportTickets());
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.customerPhone.includes(search) ||
        t.subject.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, search, selectedStatus, selectedPriority, selectedCategory]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
      escalated: tickets.filter((t) => t.status === 'ESCALATED' || t.priority === 'URGENT').length,
    };
  }, [tickets]);

  const handleOpenDetail = (t: PlatformSupportTicket) => {
    setActiveTicket(t);
    setEditStatus(t.status);
    setEditNotes(t.internalNotes || '');
    setEditResolution(t.resolutionSummary || '');
    setEditAgent(t.assignedAgent || 'Operations Desk');
  };

  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      const updatedList = updatePlatformSupportTicketStatus(
        activeTicket.id,
        editStatus,
        editNotes,
        editResolution
      );
      setTickets(updatedList);

      recordPlatformAuditLog({
        action: 'UPDATE_TICKET',
        module: 'SUPPORT',
        targetId: activeTicket.ticketCode,
        performedBy: 'Super Administrator',
        notes: `Ticket ${activeTicket.ticketCode} status set to ${editStatus}`,
      });

      success(`Ticket ${activeTicket.ticketCode} updated to ${editStatus}`);
      setActiveTicket(null);
    } catch {
      error('Failed to update ticket status');
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newSubject || !newDescription) {
      error('Please complete all required fields.');
      return;
    }

    try {
      const created = createPlatformSupportTicket({
        customerName: newCustName.trim(),
        customerPhone: newCustPhone.trim(),
        category: newCategory,
        priority: newPriority,
        subject: newSubject.trim(),
        description: newDescription.trim(),
        relatedEntityId: newEntityId.trim() || undefined,
        assignedAgent: 'Operations Desk',
      });

      recordPlatformAuditLog({
        action: 'CREATE_TICKET',
        module: 'SUPPORT',
        targetId: created.ticketCode,
        performedBy: 'Super Administrator',
        notes: `Manual support ticket raised for ${newCustName}`,
      });

      success(`Support ticket ${created.ticketCode} created successfully.`);
      setTicketStep(1);
    setShowCreateModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewSubject('');
      setNewDescription('');
      setNewEntityId('');
      refreshData();
    } catch {
      error('Failed to create ticket');
    }
  };

  const getPriorityBadge = (p: PlatformSupportTicket['priority']) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">URGENT</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
    }
  };

  const getStatusBadge = (s: PlatformSupportTicket['status']) => {
    switch (s) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><Clock className="w-3 h-3" /> OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">CLOSED</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-600" /> ESCALATED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Support & Grievance Desk</h1>
              <p className="text-xs text-slate-500">
                Centralized ticket resolution, SLA compliance, contractor disputes, and escrow refund escalation
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Tickets</p>
          <p className="text-2xl font-black text-navy-950 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All customer grievances</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Open Tickets</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.open}</p>
          <p className="text-[10px] text-blue-600/70 mt-0.5">Awaiting agent response</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">In Progress</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.inProgress}</p>
          <p className="text-[10px] text-amber-600/70 mt-0.5">Under site investigation</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Resolved / Closed</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Successfully solved</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Escalated / Urgent</p>
          <p className="text-2xl font-black text-red-600 mt-1">{stats.escalated}</p>
          <p className="text-[10px] text-red-600/70 mt-0.5">Immediate director review</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by ID, customer name, phone, or issue subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="QUOTATION_ISSUES">Quotation & Scope</option>
              <option value="CONSTRUCTION_QUALITY">Construction Quality</option>
              <option value="PROJECT_DELAYS">Site Delays</option>
              <option value="MATERIAL_ORDER">Material & Delivery</option>
              <option value="PAYMENT_ISSUES">Payment & Escrow</option>
              <option value="REFUND_DISPUTE">Refund Disputes</option>
              <option value="PROFESSIONAL_ISSUES">Architect/Designer Issues</option>
              <option value="OTHER">Other Inquiries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ticket Code</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Category & Subject</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Agent</th>
                <th className="py-3.5 px-4">Logged At</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <LifeBuoy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No support tickets match the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                      {ticket.ticketCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-navy-950 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.customerName}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ticket.customerPhone}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {ticket.category.replace(/_/g, ' ')}
                      </span>
                      <p className="font-semibold text-slate-900 mt-1 line-clamp-1">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">
                        {ticket.assignedAgent || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(ticket)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Review & Action Modal */}
      <AnimatePresence>
        {activeTicket && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setActiveTicket(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Support Desk</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <LifeBuoy className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {activeTicket.subject}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                        {activeTicket.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Code: {activeTicket.ticketCode} • From: {activeTicket.raisedByName} ({activeTicket.raisedByRole})
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setActiveTicket(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              

              <form onSubmit={handleUpdateTicket} className="p-6 space-y-4 text-xs">
                {/* Customer Details Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
                    <p className="font-bold text-slate-900 mt-0.5">{activeTicket.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</p>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{activeTicket.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Related Reference</p>
                    <p className="font-bold text-sky-700 mt-0.5 font-mono">{activeTicket.relatedEntityId || 'N/A'}</p>
                  </div>
                </div>

                {/* Grievance Description */}
                <div>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Customer Grievance Statement</p>
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-slate-800 leading-relaxed">
                    {activeTicket.description}
                  </div>
                </div>

                {/* Update Status and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ticket Resolution Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      <option value="OPEN">Open (Awaiting Inspection)</option>
                      <option value="IN_PROGRESS">In Progress (Action Underway)</option>
                      <option value="RESOLVED">Resolved (Grievance Solved)</option>
                      <option value="CLOSED">Closed (Completed)</option>
                      <option value="ESCALATED">Escalated to Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Support Agent / Officer</label>
                    <input
                      type="text"
                      value={editAgent}
                      onChange={(e) => setEditAgent(e.target.value)}
                      placeholder=""
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Internal Officer Notes */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Internal Operations Notes (Confidential)</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add site engineer observations, contractor remarks, or internal instructions..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Resolution Summary */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Resolution Summary (Shared with Homeowner)</label>
                  <textarea
                    rows={2}
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value)}
                    placeholder="Enter final resolution details, refund confirmation, or site rectifications provided..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Resolution Updates</span>
                  </button>
                </div>
              </form>
            
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Support Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <LifeBuoy className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Raise Support Grievance Ticket
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Support Help Desk • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {[
                  { step: 1, title: '1. Complainant & Classification', desc: 'Customer Details, Category & Priority' },
                  { step: 2, title: '2. Grievance Description', desc: 'Issue Details, Root Cause & SLA Target' },
                ].map((s) => {
                  const isActive = ticketStep === s.step;
                  const isCompleted = ticketStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setTicketStep(s.step as 1 | 2)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20'
                          : isCompleted
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-sky-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateTicket} className="space-y-6 text-xs text-slate-700">
                {/* STEP 1: COMPLAINANT & CLASSIFICATION */}
                {ticketStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: Complainant Identity & Grievance Category</h3>
                      <p className="text-xs text-slate-500">Specify affected customer credentials and severity tier.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newCustName}
                          onChange={(e) => setNewCustName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder=""
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Issue Category *</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                        >
                          <option value="QUOTATION_ISSUES">Quotation & Scope</option>
                          <option value="CONSTRUCTION_QUALITY">Construction Quality</option>
                          <option value="PROJECT_DELAYS">Site Delays</option>
                          <option value="MATERIAL_ORDER">Material & Delivery</option>
                          <option value="PAYMENT_ISSUES">Payment & Escrow</option>
                          <option value="REFUND_DISPUTE">Refund Disputes</option>
                          <option value="PROFESSIONAL_ISSUES">Architect / Designer Issue</option>
                          <option value="OTHER">Other Query</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Priority Level *</label>
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                        >
                          <option value="LOW">Low (48h Turnaround)</option>
                          <option value="MEDIUM">Medium (24h Turnaround)</option>
                          <option value="HIGH">High (12h Turnaround)</option>
                          <option value="URGENT">Urgent (Immediate Site Escalation)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Related Reference / Project Code</label>
                      <input
                        type="text"
                        placeholder=""
                        value={newEntityId}
                        onChange={(e) => setNewEntityId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCustName.trim() || !newCustPhone.trim()) {
                            alert('Please enter Customer Name and Mobile Number.');
                            return;
                          }
                          setTicketStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Grievance Description</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: GRIEVANCE DESCRIPTION & SLA */}
                {ticketStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Grievance Details & Resolution SLA</h3>
                      <p className="text-xs text-slate-500">Provide clear documentation of the dispute and target turnaround hours.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Subject / Short Heading *</label>
                        <input
                          type="text"
                          required
                          placeholder="Brief summary of the grievance..."
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Detailed Description *</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Enter complete description of the issue faced by homeowner..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Resolution SLA Target (Hours)</label>
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={slaHours}
                          onChange={(e) => setSlaHours(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Ticket Summary Preview */}
                      <div className="bg-sky-50/60 rounded-2xl p-4 border border-sky-200/80">
                        <div className="text-[11px] font-bold text-sky-900 uppercase mb-2">Grievance Ticket Overview</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-slate-500 block text-[10px]">Customer:</span> <span className="font-bold text-navy-950">{newCustName}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Category:</span> <span className="font-bold text-sky-800">{newCategory}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Priority:</span> <span className="font-bold text-amber-700">{newPriority}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">SLA:</span> <span className="font-bold text-slate-800">{slaHours} Hours</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setTicketStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Register Grievance Ticket</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSupportTickets;
