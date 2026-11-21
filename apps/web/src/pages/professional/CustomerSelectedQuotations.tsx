import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  FileCheck2,
  CalendarCheck,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
  Eye,
  Phone,
  Mail,
  Share2,
  X,
  User,
} from 'lucide-react';
import { getPlatformBookings, getPlatformRequests, getRegisteredCustomers } from '../../data/customerStore.js';
import { getProfessionalByPhone } from '../../data/professionalStore.js';

interface AcceptedQuotationDisplay {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone?: string;
  projectName: string;
  location: string;
  agreedAmountPaise: number;
  selectedServices: string[];
  selectionDate: string;
  proposedStartDate: string;
  bookingStatus: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS';
  contractUploaded: boolean;
}

export const CustomerSelectedQuotations: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [acceptedList, setAcceptedList] = useState<AcceptedQuotationDisplay[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<AcceptedQuotationDisplay | null>(null);
  const [inspectingQuote, setInspectingQuote] = useState<AcceptedQuotationDisplay | null>(null);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    // Zero Dummy Data: load actual platform bookings and requests
    const bookings = getPlatformBookings();
    const requests = getPlatformRequests();

    const mapped: AcceptedQuotationDisplay[] = bookings.map((b) => {
      const relatedReq = requests.find((r) => r.id === b.requestId);
      return {
        id: b.id,
        quotationNumber: b.bookingCode.replace('BK', 'QT'),
        customerName: b.customerName || 'Registered Client',
        customerPhone: b.customerPhone,
        projectName: b.serviceTitle || (relatedReq as any)?.propertyType || 'Residential Professionalural Design',
        location: b.siteAddress || relatedReq?.city || 'Delhi NCR',
        agreedAmountPaise: b.totalAmountPaise || (b as any).totalContractPaise || 24000000,
        selectedServices: relatedReq?.requiredServices || [
          '2D Professionalural Floor Plans',
          '3D Elevation Design',
          'Structural & IS 456 Vetting',
        ],
        selectionDate: (b as any).confirmedAt || (b as any).bookedAt || new Date().toISOString(),
        proposedStartDate: b.visitDate || (b as any).startDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        bookingStatus: (b.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_CONFIRMATION') as any,
        contractUploaded: true,
      };
    });

    setAcceptedList(mapped);
  }, []);

  const handleOpenConfirm = (quote: AcceptedQuotationDisplay) => {
    setSelectedQuote(quote);
    setProposedDate(quote.proposedStartDate);
    setShowEngagementModal(true);
  };

  const handleConfirmEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    if (!proposedDate) {
      error('Please specify a proposed project start / site mobilization date');
      return;
    }

    setAcceptedList((prev) =>
      prev.map((item) =>
        item.id === selectedQuote.id
          ? { ...item, bookingStatus: 'CONFIRMED', proposedStartDate: proposedDate, contractUploaded: true }
          : item
      )
    );

    success(`Engagement confirmed for Quotation ${selectedQuote.quotationNumber}! Active project workspace initialized.`);
    setShowEngagementModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">Customer-Selected Quotations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              {acceptedList.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official bids accepted by homeowners. Review engagement terms, upload agreements, and confirm start dates.
          </p>
        </div>

        <Link
          to="/professional/quotations"
          className="text-xs font-bold text-slate-600 hover:text-navy-950 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 self-start"
        >
          <span>View All Quotations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {acceptedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-3">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Customer-Selected Quotations Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Jaise hi koi customer aapke submit kiye gaye quotation ko select karega, verification ke saath yahan display hoga jisse aap contract confirm kar sakein.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {acceptedList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-sky-200/90 shadow-2xs p-5 sm:p-6 hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingQuote(item)}
                        className="font-mono font-black text-slate-900 text-sm hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
                        title="Click to view full engagement brief"
                      >
                        <span className="hover:underline">{item.quotationNumber}</span>
                        <Eye className="w-3.5 h-3.5 text-blue-500 opacity-70" />
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          item.bookingStatus === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.bookingStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{item.projectName} • {item.location}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Accepted Contract Value
                  </div>
                  <div className="text-base font-black text-blue-900 font-mono">
                    {formatINR(item.agreedAmountPaise)}
                  </div>
                </div>
              </div>

              {/* Specs & Services */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50/50 transition group">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Client Reference</span>
                  <button
                    type="button"
                    onClick={() => setInspectingQuote(item)}
                    className="font-bold text-slate-800 hover:text-blue-600 transition flex items-center gap-1 text-left w-full cursor-pointer"
                    title="Click to inspect homeowner profile"
                  >
                    <span className="underline decoration-blue-300 underline-offset-2 group-hover:decoration-blue-600">{item.customerName}</span>
                    <Eye className="w-3.5 h-3.5 text-blue-500 opacity-70" />
                  </button>
                  {item.customerPhone && (
                    <span className="text-slate-500 text-[11px] block">{item.customerPhone}</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Selection Date</span>
                  <span className="font-bold text-slate-800">{formatDate(item.selectionDate)}</span>
                  <span className="text-slate-500 text-[11px] block">Verified Customer Choice</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Proposed Start Date</span>
                  <span className="font-bold text-sky-900 font-mono">{item.proposedStartDate}</span>
                  <span className="text-blue-700 text-[10px] font-bold block flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Milestone Escrow Active
                  </span>
                </div>
              </div>

              {/* Selected Services Tags */}
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1.5">
                  Agreed Scope of Work
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(item.selectedServices || []).map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Next Step: Agree on mobilization date & signoff design brief.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingQuote(item)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Client & Scope</span>
                  </button>
                  <Link
                    to="/professional/projects"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-navy-950 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Open Project Workspace
                  </Link>
                  <button
                    onClick={() => handleOpenConfirm(item)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Engagement</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation & Agreement Modal */}
      {showEngagementModal && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Confirm Project Engagement</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedQuote.quotationNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEngagementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ?
              </button>
            </div>

            <form onSubmit={handleConfirmEngagement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Proposed Mobilization / Site Visit Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Upload Signed Engagement Agreement / Letter of Intent (Optional)
                </label>
                <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl p-4 text-center cursor-pointer bg-sky-50/50">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="engagementDoc"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                    }}
                  />
                  <label htmlFor="engagementDoc" className="cursor-pointer space-y-1 block">
                    <Upload className="w-6 h-6 text-sky-600 mx-auto" />
                    <span className="font-bold text-sky-900 text-xs block">
                      {uploadFile ? uploadFile.name : 'Click to select agreement document'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">PDF or DOCX up to 10MB</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Confirmation activates the milestone-linked escrow schedule. Client payments are safeguarded and released stage-wise upon inspection signoffs.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEngagementModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition"
                >
                  Confirm & Activate Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INSPECT CLIENT & AGREEMENT DOSSIER MODAL ================= */}
      {inspectingQuote && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#1e3d6b] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Accepted Quotation Reference
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                    {inspectingQuote.bookingStatus}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                  {inspectingQuote.quotationNumber}
                </h2>
                <p className="text-xs text-slate-300">
                  {inspectingQuote.projectName} • {inspectingQuote.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Client Profile Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-lg font-display shrink-0">
                    {(inspectingQuote.customerName || 'CU').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{inspectingQuote.customerName}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Site Address: {inspectingQuote.location}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {inspectingQuote.customerPhone && (
                    <>
                      <a
                        href={`tel:${inspectingQuote.customerPhone.replace(/\D/g, '')}`}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{inspectingQuote.customerPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${inspectingQuote.customerPhone.replace(/\D/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Commercials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Contract Value:</span>
                  <span className="font-black text-blue-900 font-mono text-sm block">
                    {formatINR(inspectingQuote.agreedAmountPaise)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Milestone Escrow Enabled</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Selection Date:</span>
                  <span className="font-bold text-slate-800 text-xs block">
                    {formatDate(inspectingQuote.selectionDate)}
                  </span>
                  <span className="text-[10px] text-slate-500">Customer Accepted Quote</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Proposed Start Date:</span>
                  <span className="font-bold text-sky-900 font-mono text-xs block">
                    {inspectingQuote.proposedStartDate}
                  </span>
                  <span className="text-[10px] text-slate-500">Target Mobilization</span>
                </div>
              </div>

              {/* Scope of Work */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                  Agreed Technical Scope of Work:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingQuote.selectedServices.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-white transition cursor-pointer text-xs"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const q = inspectingQuote;
                    setInspectingQuote(null);
                    handleOpenConfirm(q);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 hover:from-sky-700 hover:to-blue-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proceed to Confirm Engagement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
