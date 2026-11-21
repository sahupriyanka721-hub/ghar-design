import React, { useState } from 'react';
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
} from 'lucide-react';

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
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Billing & Payouts');
  const [description, setDescription] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTkt: SupportTicket = {
      id: `t-${Date.now()}`,
      ticketNumber: `TKT-ID-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      category,
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTickets([newTkt, ...tickets]);
    setIsNewTicketOpen(false);
    setSubject('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
            <span>Dedicated Partner Operations Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Partner Support & Helpdesk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            24/7 dedicated support for verified interior design partners, milestone disbursements, and client disputes.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Support Contacts Card */}
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

      {/* Tickets List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <span className="font-black text-sm text-slate-900">
            Your Support Tickets ({tickets.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
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

      {/* New Ticket Modal */}
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please include project ID, booking reference, or invoice number if applicable..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
