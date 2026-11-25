import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { SupportTicket } from '@ghar-design/shared';
import { getPlatformRequests, getPlatformBookings } from '../../data/customerStore.js';
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
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [category, setCategory] = useState<'QUOTATION' | 'BILLING' | 'PROJECT_EXECUTION' | 'MATERIALS' | 'GENERAL'>('PROJECT_EXECUTION');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedReference, setRelatedReference] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [availableReferences, setAvailableReferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real user references (Requests, Bookings, Orders)
  useEffect(() => {
    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    // Real Requests
    const myReqs = getPlatformRequests().filter((r) => {
      if (r.customerId === 'usr-cust-1' || r.customerName?.toLowerCase().includes('vikram') || r.customerPhone?.includes('9876543220')) return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawUserPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return false;
    });

    // Real Bookings
    const myBks = getPlatformBookings().filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawUserPhone && b.customerPhone) {
        return b.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return false;
    });

    // Real Material Orders
    let myOrds: any[] = [];
    try {
      const ordersJson = localStorage.getItem('material_orders');
      if (ordersJson) {
        const parsed = JSON.parse(ordersJson);
        if (Array.isArray(parsed)) {
          myOrds = parsed.filter((o: any) => {
            if (o.customerId === 'usr-cust-1' || o.customerName?.toLowerCase().includes('vikram') || o.customerPhone?.includes('9876543220')) return false;
            if (user?.id && o.customerId === user.id) return true;
            if (rawUserPhone) {
              const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
              if (oPhone && oPhone === rawUserPhone) return true;
            }
            return false;
          });
        }
      }
    } catch {}

    const refs: string[] = [];
    myReqs.forEach((r) => refs.push(`${r.requestCode} (${r.propertyType})`));
    myBks.forEach((b) => refs.push(`${b.bookingCode} (${b.serviceTitle})`));
    myOrds.forEach((o) => refs.push(`${o.orderCode} (Materials)`));

    setAvailableReferences(refs);
    if (refs.length > 0) {
      setRelatedReference(refs[0]);
    } else {
      setRelatedReference('General Account Inquiry');
    }

    // Load stored tickets for this user
    try {
      const stored = localStorage.getItem(`customer_tickets_${user?.id || rawUserPhone}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTickets(parsed);
          if (parsed.length > 0) setSelectedTicket(parsed[0]);
        }
      }
    } catch {}

    setLoading(false);
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
    localStorage.setItem(`customer_tickets_${user?.id || rawUserPhone}`, JSON.stringify(updated));

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
    localStorage.setItem(`customer_tickets_${user?.id || rawUserPhone}`, JSON.stringify(updatedList));

    setReplyMessage('');
    success('Reply dispatched to the support desk.');
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Dedicated Customer Care & Technical Escalation Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Support Tickets & Project Assistance
          </h1>
          <p className="text-slate-500 mt-1">
            Raise technical disputes, verify BOQ rate variances, report material dispatch issues, or request site re-inspections.
          </p>
        </div>

        <button
          onClick={() => setNewTicketModalOpen(true)}
          className="px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-sm flex items-center gap-1.5 self-start md:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Support Ticket</span>
        </button>
      </div>

      {/* 9-Section Navigation Tabs (Master Prompt) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'messages', label: '9.1 Project Messages' },
          { id: 'tickets', label: `9.2 Support Tickets (${tickets.length})` },
          { id: 'complaints', label: '9.3 Complaints & Disputes' },
          { id: 'faqs', label: '9.4 Help Center & FAQs' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-navy-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'faqs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">9.4 Help Center & Knowledge Base</h2>
              <p className="text-slate-500">Frequently asked questions regarding BuildGhar escrow, site supervision, and BOQ revisions.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does BuildGhar Escrow Protection work for homeowners?',
                a: 'All project milestone payments are held securely in a dedicated bank escrow account. Funds are released to your assigned contractor or architect firm only after you inspect and approve each stage completion on your project dashboard.',
              },
              {
                q: 'What should I do if a contractor or vendor delays work?',
                a: 'Navigate to "9.3 Complaints & Disputes" to lodge a formal delay report. BuildGhar platform administrators will review daily site reports and enforce the agreed contract timeline and penalty terms.',
              },
              {
                q: 'How are architectural drawings and 3D elevations approved?',
                a: 'Your architect uploads CAD working blueprints, structural layouts, and 3D models to your "7. Design & Documents" portal. You can review, download PDF packages, and digitally approve or request specific revisions.',
              },
              {
                q: 'Can I return building materials ordered through the Material Store?',
                a: 'Yes. Unopened and intact building materials can be returned within 48 hours of on-site delivery. Check "6.6 Return & Refund" under Material Management to initiate a collection request.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-navy-950 text-sm">{faq.q}</div>
                <p className="text-slate-600 leading-relaxed text-xs">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="text-base font-bold text-navy-950 font-display">9.3 Formal Complaints & Technical Disputes</h2>
                <p className="text-slate-500">Direct escalation channel to Super Admin Governance Desk for defect liability and delay resolution.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCategory('PROJECT_EXECUTION');
                setPriority('URGENT');
                setNewTicketModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" />
              <span>File Formal Dispute</span>
            </button>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-slate-800 text-sm">Escrow Dispute Protection Active</div>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
              When a formal dispute is opened, milestone payments for the disputed stage are immediately frozen in escrow until technical resolution by BuildGhar Chief Engineer.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-navy-950 font-display">9.1 Direct Project Messages</h2>
              <p className="text-slate-500">Real-time messaging with your assigned architect, contractor, and site supervisor.</p>
            </div>
          </div>

          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700 text-sm">Direct Project Message Threads</div>
            <p className="max-w-md mx-auto">
              Real-time message threads are linked to your active project workspace.
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard/projects/active?tab=messages"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl text-xs"
              >
                <span>Open Project Chat Room</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3 max-w-md mx-auto">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm font-display">No Active Support Tickets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need assistance with your drawings, site engineer visits, or material orders? Click "Raise New Support Ticket" to get dedicated resolution within 4 hours.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setNewTicketModalOpen(true)}
              className="btn-gold text-xs py-2 px-4 font-bold rounded-xl inline-block"
            >
              Raise a Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tickets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-bold text-slate-700">Your Tickets ({tickets.length})</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((t) => (
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
                          {m.senderName} ({m.senderRole === 'CUSTOMER' ? 'You' : 'GharDesign Support Desk'})
                        </span>
                        <span className="text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type your response to the support officer..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
        )
      )}

      {/* New Ticket Modal */}
      {newTicketModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setNewTicketModalOpen(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-navy-950 text-sm">Raise Customer Support Ticket</h3>
                <button onClick={() => setNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Issue Category</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value="PROJECT_EXECUTION">Project Execution & Site Delay</option>
                      <option value="QUOTATION">Quotation & Scope Verification</option>
                      <option value="BILLING">Billing, GST Invoice & Escrow</option>
                      <option value="MATERIALS">Building Materials & Delivery</option>
                      <option value="GENERAL">General Account / Technical Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Priority Level</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="LOW">Low (General Query)</option>
                      <option value="MEDIUM">Medium (Within 24 Hours)</option>
                      <option value="HIGH">High (Within 6 Hours)</option>
                      <option value="URGENT">Urgent (Site Stoppage / Escalation)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Related Project / Booking / Order</label>
                  {availableReferences.length > 0 ? (
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                      value={relatedReference}
                      onChange={(e) => setRelatedReference(e.target.value)}
                    >
                      {availableReferences.map((ref) => (
                        <option key={ref} value={ref}>
                          {ref}
                        </option>
                      ))}
                      <option value="General Account Inquiry">General Account Inquiry</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder=""
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                      value={relatedReference}
                      onChange={(e) => setRelatedReference(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide full context regarding your query, site location, drawings involved, or required actions..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    <Plus className="w-3.5 h-3.5" />
                    <span>Submit Ticket</span>
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
