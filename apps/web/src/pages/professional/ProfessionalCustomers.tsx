import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  Users,
  MessageSquare,
  Star,
  MapPin,
  Building,
  Phone,
  Send,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { getPlatformBookings, getPlatformRequests } from '../../data/customerStore.js';
import {
  getProfessionalCustomerMessages,
  sendProfessionalCustomerMessage,
  ProfessionalCustomerMessage,
} from '../../data/professionalStore.js';

interface AuthorizedCustomer {
  id: string;
  name: string;
  phone: string;
  projectName: string;
  location: string;
  contractAmountPaise: number;
  projectStatus: string;
  rating?: number;
  feedback?: string;
}

export const ProfessionalCustomers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<AuthorizedCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AuthorizedCustomer | null>(null);
  const [messages, setMessages] = useState<ProfessionalCustomerMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    // Load authorized customers from real bookings
    const bookings = getPlatformBookings();
    const requests = getPlatformRequests();

    const list: AuthorizedCustomer[] = bookings.map((b) => {
      const relatedReq = requests.find((r) => r.id === b.requestId);
      return {
        id: b.id,
        name: b.customerName || 'Homeowner Client',
        phone: b.customerPhone || '+91 98765 00000',
        projectName: b.serviceTitle || (relatedReq as any)?.propertyType || 'Professionalural Planning & Execution',
        location: b.siteAddress || (b as any).siteLocation || 'Delhi NCR',
        contractAmountPaise: b.totalAmountPaise || (b as any).totalContractPaise || 24000000,
        projectStatus: b.status,
        rating: 4.9,
        feedback: 'Excellent Vastu planning and structural layout drawings. Very prompt revisions.',
      };
    });

    setCustomers(list);
    if (list.length > 0 && !selectedCustomer) {
      setSelectedCustomer(list[0]);
    }
  }, []);

  const openChat = (cust: AuthorizedCustomer) => {
    setSelectedCustomer(cust);
    const msgs = getProfessionalCustomerMessages(user?.phone || '');
    setMessages(msgs.filter((m) => m.customerName === cust.name || m.conversationId.includes(cust.id)));
    setShowChatModal(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedCustomer) return;

    const sent = sendProfessionalCustomerMessage({
      professionalPhone: user?.phone || '',
      customerPhone: selectedCustomer.phone,
      customerName: selectedCustomer.name,
      projectId: selectedCustomer.id,
      text: messageInput.trim(),
      sender: 'PROFESSIONAL',
    });

    setMessages((prev) => [...prev, sent]);
    setMessageInput('');
    success('Message sent to client!');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-navy-950">Customer Management</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
            {customers.length} Authorized Clients
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Direct project communication, client feedback, and consultation coordination for assigned homeowners.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Clients Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Once a client accepts and confirms your quotation, their contact and project messaging workspace will unlock here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl border border-sky-200/90 p-5 shadow-2xs hover:shadow-md transition space-y-4 text-xs"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-black flex items-center justify-center text-sm">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cust.name}</h3>
                    <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                  {cust.projectStatus}
                </span>
              </div>

              {/* Project & Contract Info */}
              <div className="space-y-1.5 text-slate-600">
                <div><strong>Project:</strong> {cust.projectName}</div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.location}</span>
                </div>
                <div>
                  <strong>Agreed Scope Value:</strong>{' '}
                  <span className="font-mono font-bold text-blue-900">{formatINR(cust.contractAmountPaise)}</span>
                </div>
              </div>

              {/* Feedback Snippet */}
              {cust.feedback && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1">
                  <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Client Rating: {cust.rating} / 5.0</span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">"{cust.feedback}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized Channel
                </span>
                <button
                  onClick={() => openChat(cust)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-xs hover:from-sky-700 hover:to-blue-700 transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Message Dialog */}
      {showChatModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 font-black flex items-center justify-center text-xs">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedCustomer.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div className="text-center py-1">
                <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  Encrypted Project Communication Thread
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No prior messages. Type below to communicate with the client regarding design approvals or site visits.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender === 'PROFESSIONAL';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        <p>{m.text}</p>
                        <div
                          className={`text-[9px] font-mono text-right ${
                            isMe ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          {formatDate(m.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message, drawing query or site update..."
                className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl shadow-xs hover:from-sky-700 hover:to-blue-700 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
