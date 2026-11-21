import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, ShieldCheck, ArrowRight, Printer, Home } from 'lucide-react';
import { formatINR } from '../../lib/utils.js';
import { getPlatformBookings } from '../../data/customerStore.js';

export const BookingConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get('code') || '';

  const booking = useMemo(() => {
    if (!bookingCode) return null;
    const all = getPlatformBookings();
    return all.find((b) => b.bookingCode === bookingCode) || null;
  }, [bookingCode]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-center">
      <div className="card p-8 sm:p-10 space-y-6 bg-white border border-slate-200 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 font-mono">
            Booking Confirmed
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
            Congratulations! Service Booked
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your engineering engagement has been successfully recorded. The selected professional has been notified.
          </p>
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 text-left">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Booking Reference:</span>
            <span className="font-mono font-bold text-navy-950 text-sm">{booking?.bookingCode || bookingCode || 'GHR-BK-CONFIRMED'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Contract Service:</span>
            <span className="font-semibold text-slate-800">{booking?.serviceTitle || booking?.serviceType || 'Professional Engagement'}</span>
          </div>
          {booking?.firmName && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Contract Firm:</span>
              <span className="font-semibold text-slate-800">{booking.firmName}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Total Contract Value:</span>
            <span className="font-bold text-navy-950">{booking ? formatINR(booking.totalAmountPaise) : 'Verified on Agreement'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Advance Escrow Deposit:</span>
            <span className="font-bold text-emerald-700">{booking?.advancePaise ? formatINR(booking.advancePaise) : 'Escrow Secured'}</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">GharDesign Escrow Protection Active</div>
            <p className="text-[11px] leading-relaxed">
              Your advance payment remains locked under platform escrow and is only disbursed to the professional upon
              your verified sign-off of Milestone 1 concept layouts.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/dashboard/bookings"
            className="btn-gold py-2.5 px-6 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <span>Go to My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="btn-outline py-2.5 px-6 text-xs font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Customer Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
