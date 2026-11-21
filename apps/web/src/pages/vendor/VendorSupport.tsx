import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../lib/utils.js';
import {
  getVendorSupportTickets,
  createVendorSupportTicket,
  replyToVendorTicket,
  closeVendorSupportTicket,
} from '../../data/vendorStore.js';
import { VendorSupportTicket } from '@ghar-design/shared';

export const VendorSupport: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';
  const vendorName = user?.name || 'Verified Supplier';

  const [activeTab, setActiveTab] = useState<'TICKETS' | 'FAQS' | 'CONTACT'>('TICKETS');
  const [refreshKey, setRefreshKey] = useState(0);

  // New Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<any>('PAYMENTS_SETTLEMENT');
  const [priority, setPriority] = useState<any>('MEDIUM');
  const [description, setDescription] = useState('');

  // Ticket Conversation Drawer
  const [selectedTicket, setSelectedTicket] = useState<VendorSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tickets = useMemo(() => {
    return getVendorSupportTickets(vendorId);
  }, [vendorId, refreshKey]);

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      error('Please fill in both subject and description');
      return;
    }

    createVendorSupportTicket({
      vendorId,
      vendorName,
      subject: subject.trim(),
      category,
      priority,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: vendorId,
          senderRole: 'VENDOR',
          senderName: vendorName,
          text: description.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    });

    success('Support ticket submitted successfully. Platform team will respond within 4 hours.');
    setShowCreateModal(false);
    setSubject('');
    setDescription('');
    setRefreshKey((k) => k + 1);
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    replyToVendorTicket(
      selectedTicket.id,
      vendorId,
      'VENDOR',
      vendorName,
      replyMessage.trim()
    );

    success('Reply posted to support desk!');
    setReplyMessage('');
    setRefreshKey((k) => k + 1);

    // Refresh selected ticket in drawer
    const updated = getVendorSupportTickets(vendorId).find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const handleCloseTicket = (ticketId: string) => {
    closeVendorSupportTicket(ticketId);
    success('Ticket closed successfully.');
    setSelectedTicket(null);
    setRefreshKey((k) => k + 1);
  };

  const faqs = [
    {
      q: 'How does BuildGhar process vendor payment settlements?',
      a: 'Settlements are processed directly to your registered bank account via NEFT/RTGS/IMPS within 48 hours of confirmed customer delivery. The platform commission (e.g. 5%) and GST TDS/TCS (1%) are automatically deducted with transparent UTR transaction logs.',
    },
    {
      q: 'Can I deliver orders using my own depot vehicles?',
      a: 'Yes! BuildGhar fully supports self-delivery. When processing an order, simply select your carrier type (Tipper truck, flatbed, tractor trolley) and provide the vehicle plate number and driver contact.',
    },
    {
      q: 'How do product reviews work on the marketplace?',
      a: 'Only verified customers who ordered from your depot and received delivery can leave reviews. You have the right to post an official depot response on any customer review.',
    },
    {
      q: 'What if a customer requests a return or replacement?',
      a: 'Construction materials are inspected on-site during offloading. In case of defective batches or transit damage, a return request is routed to your Orders panel with photo proof for depot replacement.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Support Desk & Communication
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Direct ticketing with BuildGhar platform administrators, financial reconciliation queries and supplier help.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'TICKETS'
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('FAQS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'FAQS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            Vendor Knowledgebase & FAQs
          </button>
          <button
            onClick={() => setActiveTab('CONTACT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'CONTACT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Contact Platform Operations
          </button>
        </div>

        {/* TAB 1: TICKETS LIST */}
        {activeTab === 'TICKETS' && (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                <tr>
                  <th className="py-3 px-3.5">Ticket ID</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Priority</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Last Updated</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No support tickets opened.</p>
                      <p className="text-[11px] mt-0.5">Need help with settlements, product approvals or orders? Raise a ticket.</p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50/70 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{t.ticketCode}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{t.subject}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{t.category.replace('_', ' ')}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.priority === 'URGENT' || t.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDate(t.updatedAt || t.createdAt)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>View Thread</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: FAQS */}
        {activeTab === 'FAQS' && (
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-blue-200/80 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-sky-50/30 transition"
                >
                  <span className="font-bold text-slate-900 text-xs">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 text-slate-600 text-xs leading-relaxed border-t border-slate-100 bg-sky-50/30/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CONTACT PLATFORM OPS */}
        {activeTab === 'CONTACT' && (
          <div className="p-6 bg-sky-50/30 rounded-2xl border border-blue-200/80 space-y-4 max-w-lg">
            <h3 className="font-bold text-sm text-navy-950">BuildGhar Vendor Desk Support</h3>
            <p className="text-xs text-slate-600">
              For urgent depot logistics emergencies, crane offloading issues or bank settlement disputes:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Vendor Helpline: <strong>+91 8319955741</strong> (Mon - Sat, 9am - 8pm)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Partner Support: <strong>vendors@buildghar.com</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE TICKET */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-navy-950">Raise Support Ticket</h3>
                  <p className="text-[11px] text-slate-500">Dedicated assistance from BuildGhar operations</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicketSubmit} className="p-5 space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issue Category *</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                  >
                    <option value="PAYMENTS_SETTLEMENT">Payment Settlement / Bank Transfer</option>
                    <option value="ORDER_DISPUTE">Sub-Order Fulfillment or Cancellation</option>
                    <option value="PRODUCT_APPROVAL">Product Catalog Moderation & Approvals</option>
                    <option value="COMMISSION_QUERY">Commission Rate or GST Deductions</option>
                    <option value="TECHNICAL_SUPPORT">Technical Dashboard Issue</option>
                    <option value="GENERAL">General Operational Inquiry</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Impacts Delivery)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief headline of the problem"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mention order code, UTR number or exact details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Ticket</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TICKET THREAD DRAWER */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {selectedTicket.ticketCode}
                  </span>
                  <h3 className="font-bold text-sm text-navy-950 mt-1">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Thread */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {(selectedTicket.messages || []).map((msg) => {
                  const isVendor = msg.senderRole === 'VENDOR';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl space-y-1 ${
                        isVendor
                          ? 'bg-blue-50/70 border border-blue-200/80 ml-6 text-slate-800'
                          : 'bg-purple-50/70 border border-purple-200/80 mr-6 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={isVendor ? 'text-blue-800' : 'text-purple-800'}>
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-slate-400 font-mono">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendTicketReply} className="p-4 bg-sky-50/30 border-t border-blue-200/80 flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message to Platform Support..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
