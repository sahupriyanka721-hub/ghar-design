import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../lib/utils.js';
import {
  LifeBuoy,
  MessageSquare,
  PlusCircle,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  getProfessionalTickets,
  createProfessionalTicket,
  addTicketReply,
  ProfessionalSupportTicket,
} from '../../data/professionalStore.js';

export const ProfessionalSupport: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [tickets, setTickets] = useState<ProfessionalSupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ProfessionalSupportTicket | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<ProfessionalSupportTicket['category']>('QUOTATION');
  const [priority, setPriority] = useState<ProfessionalSupportTicket['priority']>('MEDIUM');
  const [description, setDescription] = useState('');

  const loadTickets = () => {
    const list = getProfessionalTickets(user?.phone || '');
    setTickets(list);
    if (list.length > 0 && !selectedTicket) {
      setSelectedTicket(list[0]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      error('Please fill in both subject and detailed description');
      return;
    }

    const created = createProfessionalTicket({
      professionalPhone: user?.phone || '',
      subject: subject.trim(),
      category,
      priority,
      description: description.trim(),
    });

    success(`Support Ticket ${created.ticketNumber} opened! Admin support cell notified.`);
    setShowNewTicketModal(false);
    setSubject('');
    setDescription('');
    loadTickets();
    setSelectedTicket(created);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const updated = addTicketReply(
      selectedTicket.id,
      replyText.trim(),
      user?.name || 'Partner Workspace',
      true
    );

    if (updated) {
      setSelectedTicket(updated);
      setReplyText('');
      loadTickets();
      success('Reply sent to GharDesign Admin!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">Support & Admin Communication</h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct coordination with GharDesign Admin Verification Desk, dispute resolution, and professionalural guidelines.
          </p>
        </div>

        <button
          onClick={() => setShowNewTicketModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition flex items-center gap-2 text-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Left List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Active Tickets ({tickets.length})
          </h3>

          {tickets.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No tickets raised yet. Click "Raise Support Ticket" to contact Admin.
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2 ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-1 ring-sky-400'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-xs">{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        t.status === 'RESOLVED'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="font-bold text-slate-800 line-clamp-1">{t.subject}</div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{t.category}</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Quick FAQ Card */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-sky-900">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Standard Support Timelines</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Quotation revisions and client mediation inquiries are addressed within 4 to 8 business hours by our professionalural verification officer.
            </p>
          </div>
        </div>

        {/* Ticket Chat View */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-sky-200/90 shadow-2xs p-5 sm:p-6 space-y-5 flex flex-col h-[580px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md text-xs">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h2 className="text-base font-bold text-navy-950">{selectedTicket.subject}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Category: <strong>{selectedTicket.category}</strong>  Priority:{' '}
                    <strong>{selectedTicket.priority}</strong>
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black self-start ${
                    selectedTicket.status === 'RESOLVED'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                {/* Initial query */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <strong className="text-slate-700">Initial Inquiry</strong>
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <p className="text-slate-700">{selectedTicket.description}</p>
                </div>

                {/* Responses */}
                {(selectedTicket.responses || []).map((r) => {
                  const isMe = r.sender === 'PROFESSIONAL';
                  return (
                    <div key={r.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono gap-4">
                          <span className={isMe ? 'text-sky-200 font-bold' : 'text-sky-700 font-bold'}>
                            {r.senderName}
                          </span>
                          <span className={isMe ? 'text-sky-200' : 'text-slate-400'}>
                            {formatDate(r.timestamp)}
                          </span>
                        </div>
                        <p className="leading-relaxed">{r.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply to Admin Verification Desk..."
                  className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-xs hover:from-sky-700 hover:to-blue-700 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a ticket to review conversation history.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Raise Support Inquiry with Admin</h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject / Issue Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="QUOTATION">Quotation Management</option>
                    <option value="PAYMENT">Payment & Escrow</option>
                    <option value="KYC_VERIFICATION">KYC & IEI Documents</option>
                    <option value="TECHNICAL">Technical / CAD Uploads</option>
                    <option value="CLIENT_DISPUTE">Client Dispute Mediation</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="LOW">Low - General Information</option>
                    <option value="MEDIUM">Medium - Normal Workflow</option>
                    <option value="HIGH">High - Urgent Site Block</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your inquiry with references to request numbers, project codes or bank details..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
