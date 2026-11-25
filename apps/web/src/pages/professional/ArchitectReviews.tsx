import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Send,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  getArchitectReviews,
  saveArchitectReviewReply,
  ArchitectReviewItem,
} from '../../data/architectPanelStore.js';

export const ArchitectReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ArchitectReviewItem[]>(() => getArchitectReviews());
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
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-navy-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-200 border border-amber-400/30 uppercase tracking-wider font-mono">
                Section 13 & 18 Client Reviews
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Verified Homeowner Testimonials
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Client Reviews & Professional Ratings
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl mt-1 leading-relaxed">
              Review genuine feedback submitted by homeowners upon design handover. Respond with official architectural remarks visible on your public portfolio.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-black text-amber-300 flex items-center justify-center gap-1">
                <span>{avgRating}</span>
                <Star className="w-6 h-6 fill-amber-300 text-amber-300" />
              </div>
              <div className="text-[11px] font-bold text-slate-300 mt-1">
                Based on {reviews.length} Verified Reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {r.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy-950">{r.customerName}</span>
                        {r.verifiedClient && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified Homeowner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.customerCity} • Project: {r.projectTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">{r.reviewDate}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  "{r.feedback}"
                </p>

                {/* ARCHITECT OFFICIAL REPLY */}
                {r.architectReply ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-950">Architect's Official Reply</span>
                      <span className="text-[10px] text-slate-400">
                        {r.replyDate ? new Date(r.replyDate).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{r.architectReply}</p>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write an official response to this client review..."
                      value={replyTextMap[r.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap({ ...replyTextMap, [r.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => handleSendReply(r.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Reply</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-navy-950">No Customer Reviews Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Homeowner reviews and 5-star ratings will automatically appear here once projects reach final drawing handover and approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
