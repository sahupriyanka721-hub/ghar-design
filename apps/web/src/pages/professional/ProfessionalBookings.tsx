import React, { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  CalendarCheck,
  ShieldCheck,
  Phone,
  MapPin,
  Building,
  Calendar,
  Eye,
  X,
  Mail,
  Share2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  getPlatformBookings,
  getRegisteredCustomers,
  getPlatformRequests,
  PlatformBooking,
  syncChannel,
} from '../../data/customerStore.js';

export const ProfessionalBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const loadBookings = () => {
    const realBookings = getPlatformBookings();
    apiRequest('/professional/bookings')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const filtered = res.data.filter(
            (b: any) => b.bookingCode !== 'BK-2026-8492' && b.requestId !== 'req-1001'
          );
          setBookings(filtered.length > 0 ? filtered : realBookings);
        } else {
          setBookings(realBookings);
        }
      })
      .catch(() => {
        setBookings(realBookings);
      });
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener('storage', loadBookings);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'BOOKINGS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED'
      ) {
        loadBookings();
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }

    return () => {
      window.removeEventListener('storage', loadBookings);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBooking(null);
    };
    if (selectedBooking) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBooking]);

  // Match full customer record from central store when a booking is selected
  const matchedCustomer = useMemo(() => {
    if (!selectedBooking) return null;
    const customers = getRegisteredCustomers();
    const rawPhone = (selectedBooking.customerPhone || '').replace(/\D/g, '').slice(-10);
    return (
      customers.find((c) => {
        if (selectedBooking.customerId && c.id === selectedBooking.customerId) return true;
        if (rawPhone && c.phone.replace(/\D/g, '').slice(-10) === rawPhone) return true;
        if (
          selectedBooking.customerName &&
          c.name.toLowerCase().trim() === selectedBooking.customerName.toLowerCase().trim()
        )
          return true;
        return false;
      }) || null
    );
  }, [selectedBooking]);

  // Match associated project request if available
  const matchedRequest = useMemo(() => {
    if (!selectedBooking) return null;
    const requests = getPlatformRequests();
    return (
      requests.find(
        (r) =>
          r.id === selectedBooking.requestId ||
          r.requestCode === selectedBooking.requestId ||
          r.requestCode === selectedBooking.quoteCode
      ) || null
    );
  }, [selectedBooking]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-navy-950">
            Confirmed Project Bookings
          </h1>
          <p className="text-xs text-slate-500">
            Contracts won through customer quotation acceptance. Inspect client profile, site details & milestone escrow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-mono text-xs font-bold border border-emerald-200">
            {bookings.length} Confirmed Engagements
          </span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">No Confirmed Bookings Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Once a client accepts your quotation and deposits the milestone advance into escrow, your booking will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="font-bold font-display text-navy-950 hover:text-blue-600 text-base transition flex items-center gap-1.5 cursor-pointer group text-left"
                    title="Click to inspect client profile & project details"
                  >
                    <span className="group-hover:underline">{b.bookingCode}</span>
                    <Eye className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <Badge status={b.status} />
                  {b.visitDate && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Visit: {formatDate(b.visitDate)}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Contract Value</span>
                    <div className="text-lg font-black font-display text-navy-950">
                      {formatINR(b.totalAmountPaise)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Client & Scope</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl group hover:bg-blue-50/50 transition">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Customer / Client:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="font-bold text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer text-left w-full"
                    title="Click to view customer dossier"
                  >
                    <span className="underline decoration-blue-300 underline-offset-2 group-hover:decoration-blue-600">
                      {b.customerName || 'Registered Homeowner'}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-blue-500 opacity-70 group-hover:opacity-100 shrink-0" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Contract Service:</span>
                  <span className="font-semibold text-slate-800">
                    {b.serviceTitle || b.serviceType || 'Architectural Planning & Engineering'}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block mb-0.5 text-[11px] font-semibold">
                    Milestone Advance Escrow:
                  </span>
                  <span className="font-black text-sm">
                    {formatINR(b.advancePaise || Math.round(b.totalAmountPaise * 0.25))}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">Funds secured in BuildGhar escrow</span>
                </div>
              </div>

              {b.siteAddress && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>Site Address:</strong> {b.siteAddress}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= FULL BOOKING & CUSTOMER DOSSIER MODAL ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#1e3d6b] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Confirmed Project Contract
                  </span>
                  <Badge status={selectedBooking.status} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                  {selectedBooking.bookingCode}
                </h2>
                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                  <span>Client: <strong>{selectedBooking.customerName || 'Registered Homeowner'}</strong></span>
                  <span>•</span>
                  <span>Service: <strong>{selectedBooking.serviceTitle || selectedBooking.serviceType}</strong></span>
                  {selectedBooking.confirmedAt && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-300">Booked on {formatDate(selectedBooking.confirmedAt)}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/60 flex-1 text-xs">
              {/* Homeowner Profile Strip */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-xl font-display shrink-0">
                      {(selectedBooking.customerName || 'CU').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedBooking.customerName || 'Registered Homeowner'}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {matchedCustomer?.status || 'VERIFIED HOMEOWNER'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Customer ID: {matchedCustomer?.id || `BG/${(selectedBooking.customerName || 'CUS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}/0001`}
                        {matchedCustomer?.registeredAt && ` • Member since ${formatDate(matchedCustomer.registeredAt)}`}
                      </div>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedBooking.customerPhone && (
                      <a
                        href={`tel:${selectedBooking.customerPhone.replace(/\D/g, '')}`}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold border border-blue-200 transition flex items-center gap-1.5"
                        title="Call Client"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedBooking.customerPhone}</span>
                      </a>
                    )}
                    {selectedBooking.customerPhone && (
                      <a
                        href={`https://wa.me/91${selectedBooking.customerPhone.replace(/\D/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold border border-emerald-200 transition flex items-center gap-1.5"
                        title="Chat on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {selectedBooking.customerEmail && (
                      <a
                        href={`mailto:${selectedBooking.customerEmail}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Site Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Plot / House Address:</span>
                    <span className="font-semibold text-slate-800">
                      {matchedCustomer?.housePlotNumber || selectedBooking.siteAddress || 'Site Plot Specified'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Locality / Sector:</span>
                    <span className="font-semibold text-slate-800">
                      {matchedCustomer?.streetLocality || 'Locality Confirmed'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">City & State:</span>
                    <span className="font-semibold text-slate-800">
                      {matchedCustomer?.city || 'Delhi NCR'}, {matchedCustomer?.state || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Escrow Summary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Escrow Financial Breakdown</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px] mb-1">Total Agreed Contract</span>
                    <div className="text-xl font-black text-navy-950">
                      {formatINR(selectedBooking.totalAmountPaise)}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Itemized BOQ Contract Value</span>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 block text-[11px] font-semibold mb-1">
                      Milestone Advance in Escrow (25%)
                    </span>
                    <div className="text-xl font-black text-emerald-800">
                      {formatINR(selectedBooking.advancePaise || Math.round(selectedBooking.totalAmountPaise * 0.25))}
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-1">✓ Secured in BuildGhar Vault</span>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-blue-700 block text-[11px] font-semibold mb-1">
                      Remaining Milestone Payouts (75%)
                    </span>
                    <div className="text-xl font-black text-blue-900">
                      {formatINR(selectedBooking.totalAmountPaise - (selectedBooking.advancePaise || Math.round(selectedBooking.totalAmountPaise * 0.25)))}
                    </div>
                    <span className="text-[10px] text-blue-600 block mt-1">Payable on milestone approvals</span>
                  </div>
                </div>
              </div>

              {/* Site Visit Schedule & Scope */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Scheduled Site Visit & Technical Scope</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Visit Date & Time Slot:</span>
                      <span className="font-bold text-slate-900">
                        {selectedBooking.visitDate ? formatDate(selectedBooking.visitDate) : 'Coordination in progress'} • {selectedBooking.visitTimeSlot || '10:00 AM - 01:00 PM'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gold-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Associated References:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedBooking.quoteCode ? `Quotation: ${selectedBooking.quoteCode}` : ''}
                        {selectedBooking.requestId ? ` • Request: ${selectedBooking.requestId}` : ''}
                        {!selectedBooking.quoteCode && !selectedBooking.requestId && 'Direct Contract'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <strong className="text-slate-700 block mb-1">Contract Notes:</strong>
                    <p className="text-slate-600 leading-relaxed">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>BuildGhar Guaranteed Project Contract</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProfessionalProfile } from './ProfessionalProfile.js';
