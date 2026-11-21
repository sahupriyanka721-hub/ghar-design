import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  HardHat,
  Compass,
  Palette,
  Eye,
  Plus,
  X,
  User,
  ShieldCheck,
  ArrowLeft,
  Check,
  Calendar,
  MapPin,
  CreditCard,
  Building,
  Ban,
  Phone,
  FileCheck2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getPlatformBookings,
  savePlatformBooking,
  updatePlatformBookingStatus,
  PlatformBooking,
} from '../../data/customerStore.js';
import { getRegisteredArchitects } from '../../data/architectStore.js';
import { getRegisteredInteriorDesigners } from '../../data/interiorDesignerStore.js';
import { getPlatformContractors, recordPlatformAuditLog } from '../../data/adminStore.js';

export const AdminBookings: React.FC = () => {
  const { success, error } = useToast();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected booking for drawer
  const [selectedBooking, setSelectedBooking] = useState<PlatformBooking | null>(null);

  // Assign Team modal
  const [assignModalBooking, setAssignModalBooking] = useState<PlatformBooking | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState('');

  const bookings = useMemo(() => getPlatformBookings(), [refreshKey]);
  const architects = useMemo(() => getRegisteredArchitects(), [refreshKey]);
  const designers = useMemo(() => getRegisteredInteriorDesigners(), [refreshKey]);
  const contractors = useMemo(() => getPlatformContractors(), [refreshKey]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.customerPhone.includes(search) ||
        b.serviceCategory.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (filterStatus === 'ALL') return true;
      return b.status === filterStatus;
    });
  }, [bookings, search, filterStatus]);

  const handleConfirmBooking = (bookingId: string, code: string) => {
    updatePlatformBookingStatus(bookingId, 'CONFIRMED');
    recordPlatformAuditLog({
      action: 'CONFIRM_BOOKING',
      module: 'BOOKING_MANAGEMENT',
      entity: `Booking #${code}`,
      newValue: 'Status: CONFIRMED',
    });
    success(`Booking ${code} marked confirmed and advance escrow verified!`);
    setSelectedBooking(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCancelBooking = (bookingId: string, code: string) => {
    updatePlatformBookingStatus(bookingId, 'CANCELLED');
    recordPlatformAuditLog({
      action: 'CANCEL_BOOKING',
      module: 'BOOKING_MANAGEMENT',
      entity: `Booking #${code}`,
      newValue: 'Status: CANCELLED',
    });
    error(`Booking ${code} has been cancelled.`);
    setSelectedBooking(null);
    setRefreshKey((k) => k + 1);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalBooking) return;

    const arch = architects.find((a) => a.id === selectedProfessionalId);
    const des = designers.find((d) => d.id === selectedProfessionalId);
    const cnt = contractors.find((c) => c.id === selectedContractorId);

    const proName = arch ? `${arch.name} (${arch.firmName})` : des ? `${des.name} (${des.businessName})` : 'Assigned Lead Expert';
    const cntName = cnt?.firmName || 'Assigned Civil Contractor';

    savePlatformBooking({
      ...assignModalBooking,
      assignedProfessionalName: proName,
      status: 'CONFIRMED',
    });

    recordPlatformAuditLog({
      action: 'ASSIGN_BOOKING_TEAM',
      module: 'BOOKING_MANAGEMENT',
      entity: `Booking #${assignModalBooking.bookingCode}`,
      newValue: `Professional: ${proName}, Contractor: ${cntName}`,
    });

    success(`Team assigned to Booking ${assignModalBooking.bookingCode}!`);
    setAssignModalBooking(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-700 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Customer Service Bookings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed architectural floor plans, turnkey construction milestones, advance escrow receipts and site kickoff.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            Total Bookings: <span className="font-mono font-black text-purple-700">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'All Bookings', value: 'ALL', count: bookings.length },
              {
                label: 'Pending Confirmation',
                value: 'PENDING_CONFIRMATION',
                count: bookings.filter((b) => b.status === 'PENDING_CONFIRMATION').length,
              },
              {
                label: 'Confirmed',
                value: 'CONFIRMED',
                count: bookings.filter((b) => b.status === 'CONFIRMED').length,
              },
              {
                label: 'Completed',
                value: 'COMPLETED',
                count: bookings.filter((b) => b.status === 'COMPLETED').length,
              },
              {
                label: 'Cancelled',
                value: 'CANCELLED',
                count: bookings.filter((b) => b.status === 'CANCELLED').length,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  filterStatus === tab.value
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filterStatus === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booking code, customer, service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-sans"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service Scope</th>
                <th className="py-3 px-3">Assigned Team</th>
                <th className="py-3 px-3 text-right">Booking Value</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No service bookings match your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isPending = b.status === 'PENDING_CONFIRMATION';
                  const isConfirmed = b.status === 'CONFIRMED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <strong className="font-mono text-xs text-navy-950 block">{b.bookingCode}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(b.bookingDate)}</span>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block">{b.customerName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{b.customerPhone}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{b.serviceCategory}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.projectCity}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {b.assignedProfessionalName ? (
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <UserCheck className="w-3 h-3 text-purple-600" />
                            <span>{b.assignedProfessionalName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            Assignment Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(b.totalAmountPaise)}
                        <span className="text-[10px] text-emerald-700 block font-normal">
                          Advance: {formatINR(b.advancePaidPaise)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          <span>{b.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleConfirmBooking(b.id, b.bookingCode)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition"
                            >
                              Confirm
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedProfessionalId(''); setSelectedContractorId(''); setAssignModalBooking(b); }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Team</span>
                          </button>

                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASSIGN TEAM TO BOOKING (Full-Screen Executive Mode) */}
      {assignModalBooking && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Service Bookings</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Assign Service Team to Booking
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Booking #{assignModalBooking.bookingCode} • Category: {assignModalBooking.serviceCategory}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <div className="p-4 bg-purple-50/70 border border-purple-200/70 rounded-2xl">
                <p className="text-xs text-purple-900 font-semibold">
                  Deploy verified architects, interior designers, or contractors to fulfill customer booking <strong>#{assignModalBooking.bookingCode}</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-6 text-xs text-slate-700">
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-sm block">
                    Select Lead Professional (Architect / Designer) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProfessionalId}
                    onChange={(e) => setSelectedProfessionalId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">-- Choose Professional --</option>
                    <optgroup label="Architects">
                      {architects.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} - {a.firmName} ({a.city})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Interior Designers">
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} - {d.businessName} ({d.city})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-sm block">
                    Select Certified Contractor (Optional)
                  </label>
                  <select
                    value={selectedContractorId}
                    onChange={(e) => setSelectedContractorId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">-- Choose Contractor --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firmName} ({c.name} - {c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAssignModalBooking(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Team Assignment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW BOOKING MANIFEST */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
            <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Back to Service Bookings</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                    <CalendarCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                        {selectedBooking.bookingCode}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40">
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Category: {selectedBooking.serviceCategory} • Customer: {selectedBooking.customerName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {selectedBooking.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id, selectedBooking.bookingCode)}
                    className="px-3.5 py-2 text-rose-300 hover:bg-rose-950/50 border border-rose-700/60 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Service Value</span>
                  <div className="text-2xl font-black font-display text-navy-950 mt-1">
                    {formatINR(selectedBooking.totalAmountPaise)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Civil Consultation Package</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Advance Escrow Paid</span>
                  <div className="text-2xl font-black font-display text-emerald-700 mt-1">
                    {formatINR(selectedBooking.advancePaidPaise)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Escrow Reserved</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Balance Payable</span>
                  <div className="text-2xl font-black font-display text-blue-700 mt-1">
                    {formatINR(Math.max(0, selectedBooking.totalAmountPaise - selectedBooking.advancePaidPaise))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Upon Milestone Signoff</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Site Location</span>
                  <div className="text-2xl font-black font-display text-navy-950 mt-1">
                    {selectedBooking.projectCity}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Direct Field Service</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Client & Service Information</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between">
                        <span className="text-slate-500">Customer Name:</span>
                        <span className="font-bold text-slate-900">{selectedBooking.customerName}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Mobile Number:</span>
                        <span className="font-mono font-bold text-blue-700">{selectedBooking.customerPhone}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Service Category:</span>
                        <span className="font-bold text-purple-900">{selectedBooking.serviceCategory}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                        <span className="text-slate-500">Assigned Professional:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedBooking.assignedProfessionalName || 'Awaiting Allocation'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Financial Escrow Guarantee</span>
                    </h3>
                    <div className="p-5 bg-navy-950 text-white rounded-2xl space-y-3">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Total Service Value:</span>
                        <span className="font-mono font-bold">{formatINR(selectedBooking.totalAmountPaise)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gold-300">
                        <span>Advance Escrow Paid:</span>
                        <span className="font-mono font-bold">{formatINR(selectedBooking.advancePaidPaise)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                        <span className="text-slate-400">Escrow Security:</span>
                        <span className="font-bold text-emerald-400">100% Guaranteed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
