import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Eye,
  RotateCcw,
  XCircle,
  Download,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  Sparkles,
  UserCheck,
  MessageSquare,
  CalendarPlus,
  ExternalLink,
  Star,
  Printer,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.js';
import { getPlatformBookings, updatePlatformBookingStatus, PlatformBooking } from '../../data/customerStore.js';

export const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all'; // 'all' | 'visits' | 'professionals'

  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<PlatformBooking | null>(null);

  // Reschedule Modal
  const [rescheduleBooking, setRescheduleBooking] = useState<PlatformBooking | null>(null);
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('11:30 AM - 01:30 PM');
  const [actionMsg, setActionMsg] = useState('');

  // Cancel Modal
  const [cancelBooking, setCancelBooking] = useState<PlatformBooking | null>(null);

  // New Visit Modal
  const [newVisitModalOpen, setNewVisitModalOpen] = useState(false);

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
    if (filter === 'UPCOMING') {
      return (b.status === 'CONFIRMED' || b.status === 'RESCHEDULED') && (!b.visitDate || new Date(b.visitDate) >= new Date(new Date().toDateString()));
    }
    if (filter === 'CONFIRMED') return b.status === 'CONFIRMED' || b.status === 'RESCHEDULED';
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED';
    return b.status === filter;
  });

  const downloadSlip = (b: PlatformBooking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(`Download slip for ${b.bookingCode}`);
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>BuildGhar Booking Slip - ${b.bookingCode}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 800; color: #0a1128; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .val { font-size: 14px; font-weight: 600; margin-top: 4px; }
            .footer { border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">BUILDGHAR CONSTRUCTION PLATFORM</div>
              <div style="font-size: 12px; color: #64748b;">Official Booking Confirmation & Escrow Voucher</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">CONFIRMED & ESCROW SECURED</span>
              <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 6px;">${b.bookingCode}</div>
            </div>
          </div>
          <div class="grid">
            <div class="card">
              <div class="label">Booked Service</div>
              <div class="val">${b.serviceTitle}</div>
            </div>
            <div class="card">
              <div class="label">Scheduled Appointment</div>
              <div class="val">${b.visitDate || 'To be scheduled'} (${b.visitTimeSlot || 'Standard Slot'})</div>
            </div>
            <div class="card">
              <div class="label">Assigned Professional</div>
              <div class="val">${b.professionalName || b.firmName || 'BuildGhar Registered Lead Architect'}</div>
              <div style="font-size: 12px; color: #64748b;">${b.professionalRole || 'Certified Technical Expert'}</div>
            </div>
            <div class="card">
              <div class="label">Project Site Location</div>
              <div class="val">${b.siteAddress || 'Registered Homeowner Site'}</div>
            </div>
          </div>
          <div class="card" style="margin-bottom: 20px;">
            <div class="label">Advance Payment & Escrow Guarantee</div>
            <div class="val" style="color: #15803d; font-size: 16px;">₹${((b.totalAmountPaise || 0) / 100).toLocaleString('en-IN')} Paid via Escrow</div>
            <p style="font-size: 12px; color: #475569; margin: 4px 0 0 0;">
              100% advance is held securely in the BuildGhar Project Escrow account. Funds are only transferred after client satisfaction sign-off.
            </p>
          </div>
          <div class="footer">
            BuildGhar Technologies Pvt Ltd &bull; 100% On-Time & Quality Guarantee &bull; Support: support@buildghar.in
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Build list of distinct assigned professionals from bookings & projects
  const verifiedProfessionals = [
    {
      id: 'pro-1',
      name: 'Ar. Rajesh Verma',
      firm: 'Verma Architecture & Structural Consultants',
      role: 'COA Registered Senior Architect',
      license: 'COA/2012/58941',
      rating: 4.9,
      reviews: 48,
      experience: '14+ Years in Residential Superstructures',
      phone: '+91 98112 34567',
      email: 'ar.verma@buildghar.in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      projectsCount: 32,
      specialization: 'House Plans, 3D Elevation, Vastu Compliance',
    },
    {
      id: 'pro-2',
      name: 'Er. Alok Sengupta',
      firm: 'Chartered Structural & Geotech Engineers',
      role: 'IEI Chartered Structural Engineer',
      license: 'IEI/M-148920/CIVIL',
      rating: 5.0,
      reviews: 62,
      experience: '18+ Years in RCC & High-Rise Framing',
      phone: '+91 98450 11223',
      email: 'alok.structural@buildghar.in',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      projectsCount: 75,
      specialization: 'IS 456 RCC Vetting, Soil Testing, Beam Schedules',
    },
    {
      id: 'pro-3',
      name: 'Pooja Singhania',
      firm: 'Singhania Interior Studios & Spatial Design',
      role: 'Principal Interior Designer',
      license: 'IIID/DES/2016/910',
      rating: 4.8,
      reviews: 39,
      experience: '11+ Years in Modern Luxury Interiors',
      phone: '+91 98711 54321',
      email: 'pooja.interiors@buildghar.in',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      projectsCount: 44,
      specialization: '3D Mood Boards, False Ceiling, Lighting, Modular Kitchens',
    },
    {
      id: 'pro-4',
      name: 'Er. Sandeep Mittal',
      firm: 'BuildGhar Execution Wing',
      role: 'Turnkey Construction Specialist',
      license: 'PWD/CL-1/2015/002',
      rating: 4.9,
      reviews: 84,
      experience: '16+ Years Turnkey Construction',
      phone: '+91 99551 22334',
      email: 'sandeep.construction@buildghar.in',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      projectsCount: 92,
      specialization: 'Complete Turnkey Construction, Rebar Audits, Cube Tests',
    },
  ];

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Section 5 &bull; Booking Management System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            {activeTab === 'visits'
              ? 'Site Visits & Appointments'
              : activeTab === 'professionals'
              ? 'Assigned Professionals Directory'
              : 'Booking List & Confirmed Services'}
          </h1>
          <p className="text-slate-500 mt-1">
            {activeTab === 'visits'
              ? 'Track, schedule, or reschedule on-site inspections, laser boundary measurements, and quality audits.'
              : activeTab === 'professionals'
              ? 'Verified registered architects, structural engineers, and site managers assigned to your project.'
              : 'Manage booked consultations, turnkey construction appointments, and verified contracts.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/book-services"
            className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New Service</span>
          </Link>
        </div>
      </div>

      {/* Primary Section Switcher (5.2, 5.3, 5.4) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-navy-950 text-gold-400 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>5.2 Booking List ({bookings.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'visits' })}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'visits'
              ? 'bg-navy-950 text-gold-400 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>5.3 Site Visits & Appointments</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'professionals' })}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'professionals'
              ? 'bg-navy-950 text-gold-400 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>5.4 Assigned Professionals</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* TAB 1: 5.2 BOOKING LIST */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Sub-status filter pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start max-w-fit border border-slate-200 text-[11px]">
            {['ALL', 'UPCOMING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filter === st ? 'bg-navy-950 text-gold-400 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Bookings' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center space-y-3 bg-white border border-slate-200 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-display">No Bookings in this Category</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Book a verified architecture consultation, structural audit, or turnkey construction inspection to get started.
              </p>
              <div className="pt-2">
                <Link to="/dashboard/book-services" className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-1.5">
                  <CalendarPlus className="w-4 h-4" />
                  <span>Book Services Now</span>
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
                            b.status === 'CONFIRMED' || b.status === 'RESCHEDULED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : b.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
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
                      ₹{((b.totalAmountPaise || 0) / 100).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>100% Escrow Secured</span>
                    </span>
                  </div>
                </div>

                {/* Middle Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Assigned Professional</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {b.professionalName || b.firmName || 'BuildGhar Registered Expert'}
                    </span>
                    <div className="text-slate-500 mt-0.5">{b.professionalRole || 'Certified Technical Consultant'}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Site Location</span>
                    <span className="text-slate-800 font-medium line-clamp-2">{b.siteAddress || 'Registered Homeowner Site'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Appointment Slot</span>
                    <div className="flex items-center gap-1.5 text-navy-950 font-bold mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                      <span>{b.nextAppointment || `${b.visitDate} (${b.visitTimeSlot})`}</span>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => downloadSlip(b)}
                    className="text-slate-600 hover:text-navy-950 font-bold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Confirmation Slip</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
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
            ))
          )}
        </div>
      )}

      {/* TAB 2: 5.3 SITE VISITS & APPOINTMENTS */}
      {activeTab === 'visits' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-navy-950 to-navy-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-gold-400 font-bold text-[11px] uppercase tracking-wider block">
                5.3 Field Inspections & Ground Audits
              </span>
              <h2 className="text-lg font-bold font-display mt-0.5">Need a Professional On-Site Visit?</h2>
              <p className="text-slate-300 text-xs mt-1 max-w-lg">
                Book a senior civil engineer or surveyor for total station plot measurement, boundary demarcation, soil testing, or stage-by-stage RCC inspection.
              </p>
            </div>
            <Link
              to="/dashboard/book-services"
              className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule Site Visit</span>
            </Link>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Scheduled & Past Field Visits</h3>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No Site Visits Scheduled</p>
                <p className="text-xs text-slate-400">Schedule your first site visit to have an engineer inspect your plot.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-navy-100 text-navy-950 font-mono font-bold text-[10px]">
                        {b.bookingCode}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{b.serviceTitle}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold-600" />
                        <strong>{b.visitDate}</strong> ({b.visitTimeSlot})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.siteAddress}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.professionalName || 'Lead Inspector'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg font-bold"
                    >
                      Visit Details
                    </button>
                    {b.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setRescheduleBooking(b)}
                        className="px-3 py-1.5 bg-navy-950 text-gold-400 hover:bg-navy-900 rounded-lg font-bold"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 5.4 ASSIGNED PROFESSIONALS */}
      {activeTab === 'professionals' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">Verified Project Professional Profiles</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              All professionals on BuildGhar hold valid council registrations (COA / IEI), verified ID credentials, and minimum 10+ years of residential construction experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifiedProfessionals.map((pro) => (
              <div key={pro.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={pro.avatar}
                      alt={pro.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{pro.name}</h4>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{pro.rating} ({pro.reviews})</span>
                        </div>
                      </div>
                      <div className="text-slate-600 font-semibold text-[11px]">{pro.role}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Reg: {pro.license}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Specialization:</span>
                      <span className="font-medium text-slate-800">{pro.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Experience:</span>
                      <span className="font-medium text-slate-800">{pro.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Delivered Projects:</span>
                      <span className="font-bold text-navy-950">{pro.projectsCount} Superstructures</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${pro.phone}`}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${pro.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(pro.name)},%20I%20am%20contacting%20you%20regarding%20my%20BuildGhar%20construction%20project.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:${pro.email}`}
                    className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL (selectedBooking) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl border border-slate-100 space-y-4 z-10 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Booking Reference</span>
                  <div className="font-mono font-bold text-slate-900 text-base">{selectedBooking.bookingCode}</div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Service Type:</span>
                  <span className="font-bold text-slate-900">{selectedBooking.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Appointment:</span>
                  <span className="font-bold text-navy-950">
                    {selectedBooking.nextAppointment || `${selectedBooking.visitDate} (${selectedBooking.visitTimeSlot})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Site Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs">{selectedBooking.siteAddress}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-bold">Advance Fee Paid:</span>
                  <span className="font-extrabold text-emerald-700">
                    ₹{((selectedBooking.totalAmountPaise || 0) / 100).toLocaleString('en-IN')} (via Escrow)
                  </span>
                </div>
              </div>

              {/* Professional card in modal */}
              <div className="p-4 bg-navy-950 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gold-400">5.4 Assigned Professional</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Verified Lead
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    {selectedBooking.professionalName || selectedBooking.firmName || 'BuildGhar Registered Lead Architect'}
                  </div>
                  <div className="text-slate-300 text-[11px]">{selectedBooking.professionalRole || 'Certified Technical Consultant'}</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`tel:${selectedBooking.professionalPhone || '+919811234567'}`}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-gold-400" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`https://wa.me/${(selectedBooking.professionalPhone || '9811234567').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => downloadSlip(selectedBooking)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 bg-navy-950 text-gold-400 font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
