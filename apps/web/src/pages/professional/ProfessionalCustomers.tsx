import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FileText,
  Mail,
  Compass,
  Check,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getPlatformBookings, getPlatformRequests } from '../../data/customerStore.js';
import {
  getProfessionalCustomerMessages,
  sendProfessionalCustomerMessage,
  ProfessionalCustomerMessage,
} from '../../data/professionalStore.js';

type TabKey = 'list' | 'requirements' | 'history';

interface AuthorizedCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectName: string;
  location: string;
  contractAmountPaise: number;
  projectStatus: string;
  rating?: number;
  feedback?: string;
  plotSize?: string;
  vastuPreferences?: string;
  specialRequirements?: string;
  approvedDrawingsCount: number;
}

export const ProfessionalCustomers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as TabKey) || 'list';
  const activeTab: TabKey = useMemo(() => {
    if (tabParam === 'list' || tabParam === 'requirements' || tabParam === 'history') {
      return tabParam;
    }
    return 'list';
  }, [tabParam]);

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const [customers, setCustomers] = useState<AuthorizedCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AuthorizedCustomer | null>(null);
  const [messages, setMessages] = useState<ProfessionalCustomerMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    const defaultCustomer: AuthorizedCustomer = {
      id: 'CUST-IND-992',
      name: 'Sharika Mishra',
      phone: '+91 9876543210',
      email: 'sharika.mishra@example.com',
      projectName: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
      location: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
      contractAmountPaise: 24000000,
      projectStatus: 'IN_PROGRESS',
      rating: 5.0,
      feedback: 'Exceptionally responsive architect! The 3D elevation and Vastu planning were flawless.',
      plotSize: '30 ft x 50 ft (1,500 sq.ft) North Facing',
      vastuPreferences: 'Pooja room in North-East Ishanya kon, Kitchen in South-East Agni kon, Master Bed in South-West Nairutya.',
      specialRequirements: 'Double-height living room with central skylight and private home theater on second floor.',
      approvedDrawingsCount: 3,
    };

    const bookings = getPlatformBookings();
    const requests = getPlatformRequests();

    const list: AuthorizedCustomer[] = bookings.map((b) => {
      const relatedReq = requests.find((r) => r.id === b.requestId);
      return {
        id: b.id,
        name: b.customerName || 'Homeowner Client',
        phone: b.customerPhone || '+91 98765 00000',
        email: (b as any).customerEmail || 'client@buildghar.com',
        projectName: b.serviceTitle || (relatedReq as any)?.propertyType || 'Architectural Planning & Execution',
        location: b.siteAddress || (b as any).siteLocation || 'Delhi NCR',
        contractAmountPaise: b.totalAmountPaise || (b as any).totalContractPaise || 24000000,
        projectStatus: b.status,
        rating: 4.9,
        feedback: 'Excellent Vastu planning and structural layout drawings.',
        plotSize: '30 ft x 50 ft',
        vastuPreferences: 'North-East entrance preferred.',
        specialRequirements: 'G+2 modern facade with balcony louvers.',
        approvedDrawingsCount: 2,
      };
    });

    if (!list.some((c) => c.name === defaultCustomer.name)) {
      list.unshift(defaultCustomer);
    }

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 8)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Users className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  8. Customer Management & Client Relations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {customers.length} Verified Homeowners
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client directory, Vastu briefs, bespoke requirements, approval audit logs, and direct communication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 8 SUB-NAVIGATION TABS (8.1 to 8.3)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>8.1 My Customers Directory ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'requirements'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>8.2 Customer Requirements & Vastu Brief</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>8.3 Approval & Interaction History</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CUSTOMERS DIRECTORY
      ========================================================================= */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-400">{c.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                    {c.projectStatus}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy-950">{c.name}</h3>
                  <div className="text-xs text-slate-500 font-medium truncate mt-0.5">{c.projectName}</div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Contract Value:</span>
                  <span className="font-mono font-black text-blue-900">{formatINR(c.contractAmountPaise)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-3 flex items-center gap-2">
                <button
                  onClick={() => openChat(c)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Client</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          TAB 2: REQUIREMENTS & VASTU BRIEF
      ========================================================================= */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.projectName}</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Plot: {c.plotSize || '30x50 ft'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                    Vastu & Orientation Brief
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    {c.vastuPreferences || 'North-facing layout with clear Brahmasthan.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase font-mono tracking-wider text-[10px]">
                    Special Architectural Directives
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    {c.specialRequirements || 'Double height living area with facade louvers.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          TAB 3: APPROVAL HISTORY
      ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-navy-950">Customer Design Sign-off & Revision Log</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900">Sharika Mishra</span>
                <span className="text-slate-500 ml-2">signed off on <strong>V2.0 Ground Floor Architectural Plan</strong></span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">2026-11-19 14:30</span>
            </div>
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900">Sharika Mishra</span>
                <span className="text-slate-500 ml-2">requested revision on <strong>V1.0 3D Elevation Render</strong> (Balcony texture)</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">2026-11-21 11:15</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIRECT CLIENT CHAT MODAL
      ========================================================================= */}
      {showChatModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-sky-200 flex flex-col h-[520px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-slate-50/60 rounded-xl my-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 max-w-[85%] self-start space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">{selectedCustomer.name}</span>
                <p className="text-slate-600">Hello architect, we reviewed the revised floor plan. The pooja room position looks great now!</p>
                <span className="text-[10px] text-slate-400 font-mono block text-right">Yesterday 04:30 PM</span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-[85%] space-y-1 ${
                    m.sender === 'PROFESSIONAL'
                      ? 'bg-blue-900 text-white ml-auto'
                      : 'bg-white rounded-xl border border-slate-200'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className={`text-[10px] block text-right font-mono ${
                    m.sender === 'PROFESSIONAL' ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {formatDate(m.timestamp)}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message to client..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
              />
              <button
                type="submit"
                className="btn-gold p-2.5 rounded-xl cursor-pointer"
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
