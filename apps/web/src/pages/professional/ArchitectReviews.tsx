import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Send,
  Building2,
  Calendar,
  Sparkles,
  Award,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';
import {
  getArchitectReviews,
  saveArchitectReviewReply,
  ArchitectReviewItem,
} from '../../data/architectPanelStore.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';

export const ArchitectReviews: React.FC = () => {
  const { success } = useToast();

  const ensureDefaultReviews = (): ArchitectReviewItem[] => {
    const stored = getArchitectReviews();
    if (stored.length > 0) return stored;

    const defaultReviews: ArchitectReviewItem[] = [
      {
        id: 'rev-01',
        projectId: 'PRJ-2026-ARCH-01',
        projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerId: 'CUST-IND-992',
        customerName: 'Sharika Mishra',
        rating: 5.0,
        comment:
          'Exceptional spatial flow and Vastu layout! The architect positioned the North-East pooja and South-East kitchen with great precision. Municipal sanction drawings passed on the first submission without any objections.',
        verifiedClient: true,
        createdAt: '2026-11-20T10:00:00Z',
        architectReply:
          'Thank you Sharika! It was a delight designing your family villa with natural light and Vastu harmony.',
        replyDate: '2026-11-21T09:00:00Z',
      },
      {
        id: 'rev-02',
        projectId: 'PRJ-2026-ARCH-02',
        projectTitle: 'Contemporary 3BHK Duplex Residence - Nipania',
        customerId: 'CUST-IND-741',
        customerName: 'Vikram Patel',
        rating: 4.9,
        comment:
          'The 3D photorealistic facade renders were breathtaking. Terracotta louvers and evening warm lighting matched exactly what we envisioned. Very patient with revision requests.',
        verifiedClient: true,
        createdAt: '2026-11-15T14:30:00Z',
        architectReply:
          'Thank you Vikram! We are thrilled that the facade texturing matched your expectations.',
        replyDate: '2026-11-16T11:00:00Z',
      },
      {
        id: 'rev-03',
        projectId: 'PRJ-2026-ARCH-03',
        projectTitle: 'Commercial Studio Office & Retail Outlet - Vijay Nagar',
        customerId: 'CUST-IND-512',
        customerName: 'Rajesh Sharma',
        rating: 4.8,
        comment:
          'Highly professional IS 456 structural coordination drawings. Bar bending schedule (BBS) and column footing schedules were clear and straightforward for our civil contractor to execute.',
        verifiedClient: true,
        createdAt: '2026-11-08T16:00:00Z',
      },
    ];

    try {
      localStorage.setItem('ghar_architect_reviews', JSON.stringify(defaultReviews));
    } catch {}
    return defaultReviews;
  };

  const [reviews, setReviews] = useState<ArchitectReviewItem[]>(ensureDefaultReviews);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const reloadReviews = () => {
    setReviews(getArchitectReviews());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadReviews);
    return () => window.removeEventListener('storage', reloadReviews);
  }, []);

  const handleSendReply = (reviewId: string) => {
    const text = replyTextMap[reviewId]?.trim();
    if (!text) return;

    saveArchitectReviewReply(reviewId, text);
    reloadReviews();
    setReplyTextMap((prev) => ({ ...prev, [reviewId]: '' }));
    success('Reply published to client review!');
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '4.9';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 13)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Star className="w-5 h-5 text-blue-900 fill-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  13. Client Reviews & Professional Ratings
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {avgRating} / 5.0 Star Rating
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified homeowner feedback, design rating criteria, and public architect responses.
              </p>
            </div>
          </div>
        </div>

        {/* Rating Gauge */}
        <div className="flex items-center gap-4 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-900 flex items-center justify-center gap-1 font-mono">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="text-[10px] font-bold text-blue-900 mt-0.5">
              Based on {reviews.length} Verified Homeowners
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RATING CRITERIA BREAKDOWN CARDS
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Design Quality</span>
          <div className="text-xl font-black text-navy-950 font-mono">5.0 / 5.0</div>
          <span className="text-[11px] text-slate-500">Spatial flow & aesthetic appeal</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">Vastu Adherence</span>
          <div className="text-xl font-black text-blue-900 font-mono">5.0 / 5.0</div>
          <span className="text-[11px] text-blue-900 font-medium">Brahmasthan & Ishanya zoning</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Turnaround SLA</span>
          <div className="text-xl font-black text-slate-900 font-mono">4.8 / 5.0</div>
          <span className="text-[11px] text-slate-500">Revision response speed</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-900 uppercase block">Structural Detailing</span>
          <div className="text-xl font-black text-blue-900 font-mono">4.9 / 5.0</div>
          <span className="text-[11px] text-blue-900 font-medium">IS 456 constructability</span>
        </div>
      </div>

      {/* =========================================================================
          REVIEWS LIST & REPLY INPUTS
      ========================================================================= */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                  {r.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-navy-950">{r.customerName}</span>
                    {r.verifiedClient && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-900 border border-blue-200">
                        <CheckCircle2 className="w-3 h-3 text-blue-900" />
                        <span>Verified Homeowner</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{r.projectTitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(r.rating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs font-bold text-slate-800">{r.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-mono text-[11px] ml-2">{formatDate(r.createdAt)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans">{r.comment}</p>

            {/* Official Architect Reply */}
            {r.architectReply ? (
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                    <span>Official Architect Response</span>
                  </span>
                  {r.replyDate && (
                    <span className="text-[10px] font-mono text-blue-900">{formatDate(r.replyDate)}</span>
                  )}
                </div>
                <p className="text-blue-900">{r.architectReply}</p>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Publish an official architectural response to this homeowner review..."
                  value={replyTextMap[r.id] || ''}
                  onChange={(e) => setReplyTextMap({ ...replyTextMap, [r.id]: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden"
                />
                <button
                  onClick={() => handleSendReply(r.id)}
                  className="btn-gold px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Post Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
