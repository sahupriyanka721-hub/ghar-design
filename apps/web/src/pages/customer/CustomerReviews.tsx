import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getPlatformBookings, PlatformBooking } from '../../data/customerStore.js';
import {
  Star,
  CheckCircle2,
  Building,
  User,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<any>(null);

  // Load real customer bookings
  useEffect(() => {
    const rawPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
    const all = getPlatformBookings().filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawPhone && b.customerPhone && b.customerPhone.replace(/\D/g, '').slice(-10) === rawPhone) return true;
      return false;
    });

    setBookings(all);
    if (all.length > 0) {
      setSelectedBookingId(all[0].id);
    }
  }, [user]);

  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId) || bookings[0] || null;
  }, [bookings, selectedBookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      error('Please share your experience in the review box.');
      return;
    }
    if (!activeBooking) {
      error('No confirmed booking selected to review.');
      return;
    }

    setIsSubmitting(true);
    const newRev = {
      id: `rev-${Date.now()}`,
      bookingId: activeBooking.id,
      bookingCode: activeBooking.bookingCode,
      professionalFirm: activeBooking.firmName || 'Partner Firm',
      serviceTitle: activeBooking.serviceTitle,
      customerName: user?.name || 'Verified Homeowner',
      overallRating,
      qualityRating,
      punctualityRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const existingReviews = JSON.parse(localStorage.getItem('platform_customer_reviews') || '[]');
      localStorage.setItem('platform_customer_reviews', JSON.stringify([newRev, ...existingReviews]));
    } catch {}

    setSubmittedReview(newRev);
    setIsSubmitting(false);
    success('Thank you! Your verified rating and feedback have been published.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-700 mx-auto flex items-center justify-center font-bold">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-xl font-display font-bold text-slate-900">
          Rate & Review Verified Professional
        </h1>
        <p className="text-slate-500">
          Your feedback maintains accountability, quality standards, and integrity for all certified contractors and engineers on GharDesign.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs max-w-md mx-auto">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm font-display">No Service Bookings Eligible for Review</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reviews can be submitted once you accept a quotation or book an engineering consultation. This ensures 100% of reviews on the platform come from real clients.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/book-services"
              className="btn-gold text-xs py-2 px-4 font-bold rounded-xl inline-block"
            >
              Book a Service
            </Link>
          </div>
        </div>
      ) : submittedReview ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Review Published!</h2>
            <p className="text-slate-500 mt-1">
              Your verified rating for <strong className="text-slate-800">{submittedReview.professionalFirm}</strong> ({submittedReview.bookingCode}) has been recorded.
            </p>
          </div>
          <div className="flex justify-center gap-1 text-gold-500">
            {[...Array(submittedReview.overallRating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <p className="italic text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            "{submittedReview.comment}"
          </p>
          <button
            onClick={() => setSubmittedReview(null)}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-xs"
          >
            Submit Another Review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
          {/* Associated Professional Card / Selector */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Select Booking to Review:</span>
              {bookings.length > 1 && (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingCode} - {b.serviceTitle}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {activeBooking?.firmName || 'Accredited Associate Firm'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {activeBooking?.serviceTitle} • <span className="font-mono">{activeBooking?.bookingCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating 1: Overall Experience */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">1. Overall Platform Experience</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className={`p-1.5 rounded-lg transition ${
                    star <= overallRating ? 'text-gold-500' : 'text-slate-300'
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="font-bold text-slate-700 ml-2">{overallRating} / 5 Stars</span>
            </div>
          </div>

          {/* Rating 2: Technical Work Quality */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">2. Technical Drawing & Structural Accuracy</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setQualityRating(star)}
                  className={`p-1.5 rounded-lg transition ${
                    star <= qualityRating ? 'text-gold-500' : 'text-slate-300'
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="font-bold text-slate-700 ml-2">{qualityRating} / 5 Stars</span>
            </div>
          </div>

          {/* Rating 3: Timeline & Communication */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">3. Milestone Timeliness & Communication</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setPunctualityRating(star)}
                  className={`p-1.5 rounded-lg transition ${
                    star <= punctualityRating ? 'text-gold-500' : 'text-slate-300'
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="font-bold text-slate-700 ml-2">{punctualityRating} / 5 Stars</span>
            </div>
          </div>

          {/* Comment Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Detailed Feedback & Experience</label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience regarding design iterations, site inspections, BOQ clarity, and responsiveness..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
          >
            <span>{isSubmitting ? 'Publishing...' : 'Publish Verified Customer Review'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
