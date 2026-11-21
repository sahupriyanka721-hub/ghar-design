import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  getInteriorBookings,
  saveInteriorBooking,
  InteriorBooking,
  getInteriorDesignerByPhone,
} from '../../data/interiorDesignerStore.js';
import { Link } from 'react-router-dom';

export const InteriorDesignerBookings: React.FC = () => {
  const { user } = useAuth();
  const designer = user?.phone ? getInteriorDesignerByPhone(user.phone) : null;
  const [bookings, setBookings] = useState<InteriorBooking[]>(() =>
    getInteriorBookings(designer?.id || 'id-101')
  );
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<InteriorBooking | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.projectAddress.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'CONFIRMED') return b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS';
    if (filterTab === 'SITE_VISIT') return b.status === 'SITE_VISIT_SCHEDULED';
    if (filterTab === 'COMPLETED') return b.status === 'COMPLETED';
    return true;
  });

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const updated = saveInteriorBooking({
      id: selectedBooking.id,
      status: 'SITE_VISIT_SCHEDULED',
      scheduledStartDate: newVisitDate || selectedBooking.scheduledStartDate,
      specialInstructions: meetingNotes
        ? `${selectedBooking.specialInstructions || ''} | Scheduled Visit: ${meetingNotes}`
        : selectedBooking.specialInstructions,
    });
    setBookings(getInteriorBookings(designer?.id || 'id-101'));
    setSelectedBooking(updated);
    setIsScheduleModalOpen(false);
    setMeetingNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Consultation & Site Visit Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Booking Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage confirmed homeowner consultations, site measurements, and interior project bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/interior-designer/quotations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>View Quotations</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Bookings</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Direct Homeowner Conversions</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Active Consultations</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In Design / Execution</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Upcoming Site Visits</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {bookings.filter((b) => b.status === 'SITE_VISIT_SCHEDULED').length}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">Measurements & Briefing</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Advance Escrow Paid</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {bookings.filter((b) => b.advancePaymentStatus === 'PAID').length}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">100% Escrow Protected</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Bookings' },
            { id: 'CONFIRMED', label: 'Confirmed & Active' },
            { id: 'SITE_VISIT', label: 'Site Visits Scheduled' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, ID or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">No Bookings Found</div>
            <div className="text-xs text-slate-500 mt-1">
              Bookings will automatically appear here once homeowners accept your submitted quotations.
            </div>
          </div>
        ) : (
          filteredBookings.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11px] font-bold">
                      {b.bookingId}
                    </span>
                    <span className="text-slate-400 text-xs">|</span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      Quote: {b.quotationNumber}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      b.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : b.status === 'SITE_VISIT_SCHEDULED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : b.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>{b.customerName}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>+91 {b.customerPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{b.projectAddress}</span>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {(b.selectedServices || []).map((svc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>

                  {b.specialInstructions && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 mt-2">
                      <span className="font-bold">Client Note: </span>
                      {b.specialInstructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Booking Advance</div>
                  <div className="text-sm font-black text-slate-900">
                    ₹{b.bookingAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Escrow Verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsScheduleModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold text-xs transition flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Schedule Visit</span>
                  </button>

                  <Link
                    to="/interior-designer/projects"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>View Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Schedule / Reschedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Schedule Site Consultation</span>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleVisit} className="space-y-4 mt-4 text-xs">
                <div>
                  <div className="text-slate-500 font-semibold mb-1">Customer & Project</div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800">
                    {selectedBooking.customerName} ({selectedBooking.bookingId})
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      {selectedBooking.projectAddress}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Select Visit Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newVisitDate}
                    onChange={(e) => setNewVisitDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Meeting Agenda / Preparation Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder=""
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Confirm & Notify Customer
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
