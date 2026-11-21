import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Booking } from '@ghar-design/shared';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Eye,
  RotateCcw,
  XCircle,
  Download,
  HelpCircle,
  CheckCircle2,
  Filter,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.js';
import { getPlatformBookings, updatePlatformBookingStatus, PlatformBooking } from '../../data/customerStore.js';

export const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Reschedule Modal
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null);
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('11:30 AM - 01:30 PM');
  const [actionMsg, setActionMsg] = useState('');

  // Cancel Modal
  const [cancelBooking, setCancelBooking] = useState<any | null>(null);

  const loadBookings = () => {
    const stored = getPlatformBookings();
    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    const userBookings = stored.filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawUserPhone) {
        const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
        if (bPhone && bPhone === rawUserPhone) return true;
      }
      if (user?.name && b.customerName && b.customerName.toLowerCase() === user.name.toLowerCase()) return true;
      return false;
    });

    setBookings(userBookings);
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 30000);
    window.addEventListener('storage', loadBookings);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadBookings);
    };
  }, [user?.phone, user?.id]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking) return;
    updatePlatformBookingStatus(rescheduleBooking.id, 'RESCHEDULED');
    rescheduleBooking.visitDate = newDate;
    rescheduleBooking.visitTimeSlot = newSlot;
    rescheduleBooking.nextAppointment = `${newDate} at ${newSlot}`;
    setActionMsg(`Booking ${rescheduleBooking.bookingCode} rescheduled to ${newDate} (${newSlot}).`);
    setRescheduleBooking(null);
    loadBookings();
  };

  const handleCancelSubmit = async () => {
    if (!cancelBooking) return;
    updatePlatformBookingStatus(cancelBooking.id, 'CANCELLED');
    cancelBooking.status = 'CANCELLED';
    setActionMsg(`Booking ${cancelBooking.bookingCode} has been cancelled per escrow refund policy.`);
    setCancelBooking(null);
    loadBookings();
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Service Engagements & Contract Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Booking List & Confirmed Appointments
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your booked engineering consultations, structural inspections, and ongoing construction contracts.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200 text-[11px]">
          {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filter === st ? 'bg-navy-950 text-gold-400 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center space-y-3 bg-white border border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display">No Confirmed Service Bookings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you accept an contractor quotation or book a verified service, your confirmed appointments and contract milestones will appear here.
            </p>
            <div className="pt-2">
              <Link to="/dashboard/requests" className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <span>View Quotations to Book</span>
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-950 text-gold-400 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{b.bookingCode}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Service: <strong className="text-slate-800">{b.serviceTitle}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-navy-950">
                  ₹{(b.totalAmountPaise / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Advance Paid: ₹{(b.advancePaidPaise / 100).toLocaleString('en-IN')} (Escrow Secured)
                </span>
              </div>
            </div>

            {/* Middle Grid: Firm, Address & Appointment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Assigned Firm</span>
                <span className="font-bold text-slate-900 text-xs">{b.professionalName}</span>
                <div className="text-slate-500 mt-0.5">IEI Certified Contractorure Firm</div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Site Location</span>
                <span className="text-slate-800 font-medium line-clamp-2">{b.siteAddress || 'Gurugram Project Site'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Next Appointment</span>
                <div className="flex items-center gap-1.5 text-navy-950 font-bold mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <span>{b.nextAppointment || `${b.visitDate} (${b.visitTimeSlot})`}</span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={() => alert(`Downloading Confirmation Slip ${b.bookingCode}...`)}
                className="text-slate-600 hover:text-navy-950 font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Confirmation Slip</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBooking(b)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {b.status !== 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => setRescheduleBooking(b)}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      onClick={() => setCancelBooking(b)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">
              Reschedule Appointment: {rescheduleBooking.bookingCode}
            </h3>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Available Slot</label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="09:30 AM - 11:30 AM">09:30 AM - 11:30 AM</option>
                  <option value="11:30 AM - 01:30 PM">11:30 AM - 01:30 PM</option>
                  <option value="02:30 PM - 04:30 PM">02:30 PM - 04:30 PM</option>
                  <option value="04:30 PM - 06:30 PM">04:30 PM - 06:30 PM</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">
              Cancel Booking: {cancelBooking.bookingCode}
            </h3>
            <p className="text-slate-600 text-xs">
              Are you sure you want to cancel this booking? If cancelled 24 hours prior to appointment, 100% of the advance fee will be refunded back to your source account.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelBooking(null)}
                className="flex-1 py-2 border border-slate-300 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
