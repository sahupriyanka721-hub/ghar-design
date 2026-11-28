import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Award,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Eye,
  Check,
  X,
  Send,
  Sparkles,
  User,
  Building,
  HardHat,
  Compass,
  Palette,
  TrendingUp,
  Sliders,
  Calendar,
  ShieldCheck,
  Clock,
  Flag,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../lib/utils.js';

export type ReviewsSubView = 'CUSTOMER_REVIEWS' | 'PROJECT_FEEDBACK' | 'RATINGS_HISTORY';

export const REVIEWS_SUBVIEWS: Array<{ key: ReviewsSubView; label: string; icon: any; desc: string }> = [
  { key: 'CUSTOMER_REVIEWS', label: '1. Customer Reviews', icon: Star, desc: 'Verified homeowner reviews, ratings moderation, sentiment analysis & admin replies' },
  { key: 'PROJECT_FEEDBACK', label: '2. Project Feedback Surveys', icon: MessageSquare, desc: 'Post-handover detailed client satisfaction scorecards, NPS & finishing feedback' },
  { key: 'RATINGS_HISTORY', label: '3. Professional Ratings History', icon: Award, desc: 'Leaderboard scorecards for Architects, Contractors & Interior Designers' },
];

export const AdminReviews: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = (searchParams.get('view') as ReviewsSubView) || 'CUSTOMER_REVIEWS';
  const [activeView, setActiveView] = useState<ReviewsSubView>(urlView);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | number>('ALL');

  const handleSelectView = (v: ReviewsSubView) => {
    setActiveView(v);
    setSearchParams({ view: v });
  };

  // 1. Customer Reviews State
  const [reviews, setReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('admin_customer_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'REV-801',
        customerName: 'Vikramaditya Solanki',
        customerLocation: 'Indore, MP (Scheme 140)',
        partnerName: 'Ar. Rajesh Verma (Lead Architect)',
        partnerRole: 'ARCHITECT',
        projectTitle: 'Solanki Modern Luxury Bungalow',
        rating: 5,
        reviewDate: '2026-11-24',
        status: 'PUBLISHED',
        title: 'Exceptional architectural planning and prompt design revisions!',
        comment:
          'Ar. Rajesh Verma and the BuildGhar team were outstanding. The 3D elevations and vastu-compliant floor plans matched our dream layout exactly. Curing guidance and structural drawings were very clear.',
        verifiedPurchase: true,
        helpfulCount: 14,
        adminReply: 'Thank you Vikramaditya ji! We are delighted to have partnered in building your dream home.',
      },
      {
        id: 'REV-802',
        customerName: 'Dr. Sunita Jain',
        customerLocation: 'Bhopal, MP (Gulmohar Colony)',
        partnerName: 'Apex Buildtech & Civil Works',
        partnerRole: 'CONTRACTOR',
        projectTitle: 'Jain Family Residence & Clinic',
        rating: 4,
        reviewDate: '2026-11-20',
        status: 'PUBLISHED',
        title: 'Quality of construction is solid, timely concrete casting',
        comment:
          'Civil work finished right on schedule. M-Sand plaster finish was very smooth. Small delay in window frame supply due to transporter strike, but Admin resolved it quickly.',
        verifiedPurchase: true,
        helpfulCount: 8,
        adminReply: '',
      },
      {
        id: 'REV-803',
        customerName: 'Anand Pachori',
        customerLocation: 'Ujjain, MP (Nanakheda)',
        partnerName: 'Elegance Interiors Indore',
        partnerRole: 'INTERIOR_DESIGNER',
        projectTitle: 'Pachori Duplex Modular Interiors',
        rating: 5,
        reviewDate: '2026-11-26',
        status: 'PENDING_MODERATION',
        title: 'Outstanding false ceiling lighting & Italian marble TV console',
        comment:
          'Very professional interior design and material execution. German fittings in modular kitchen are flawless. 10/10 recommendation for BuildGhar!',
        verifiedPurchase: true,
        helpfulCount: 3,
        adminReply: '',
      },
    ];
  });

  // 2. Project Feedback Surveys
  const [feedbackSurveys] = useState<any[]>([
    {
      id: 'FB-901',
      customerName: 'Rohit & Neha Sharma',
      projectName: 'Shri Sharma Luxury Duplex Villa',
      overallScore: 9.6,
      npsCategory: 'PROMOTER',
      qualityScore: 9.8,
      timelinessScore: 9.4,
      costTransparencyScore: 10.0,
      communicationScore: 9.2,
      recommendation: 'Definitely Recommend BuildGhar to Friends & Family',
      highlight: 'Centralized escrow payments and Admin milestone verification gave us 100% peace of mind.',
      handoverDate: '2026-11-15',
    },
    {
      id: 'FB-902',
      customerName: 'Anil Verma',
      projectName: 'Verma Smart Residence',
      overallScore: 9.1,
      npsCategory: 'PROMOTER',
      qualityScore: 9.2,
      timelinessScore: 9.0,
      costTransparencyScore: 9.5,
      communicationScore: 8.8,
      recommendation: 'Very Satisfied',
      highlight: 'The 3D walkthroughs and daily progress reports kept us updated even while travelling.',
      handoverDate: '2026-11-10',
    },
  ]);

  // 3. Professional Ratings History Leaderboard
  const [partnerScorecards] = useState<any[]>([
    {
      id: 'PARTNER-01',
      name: 'Ar. Rajesh Verma',
      role: 'Architect (COA Certified)',
      averageRating: 4.9,
      totalReviews: 28,
      projectsCompleted: 19,
      onTimeDeliveryRate: '98%',
      repeatRate: '92%',
      fiveStarCount: 26,
      avatar: 'RV',
    },
    {
      id: 'PARTNER-02',
      name: 'Apex Buildtech & Civil Works',
      role: 'Lead General Contractor',
      averageRating: 4.7,
      totalReviews: 42,
      projectsCompleted: 31,
      onTimeDeliveryRate: '94%',
      repeatRate: '88%',
      fiveStarCount: 36,
      avatar: 'AB',
    },
    {
      id: 'PARTNER-03',
      name: 'Sanya Interior Studio',
      role: 'Interior Designer Specialist',
      averageRating: 4.8,
      totalReviews: 22,
      projectsCompleted: 15,
      onTimeDeliveryRate: '96%',
      repeatRate: '94%',
      fiveStarCount: 20,
      avatar: 'SI',
    },
  ]);

  // Reply modal
  const [replyModalReview, setReplyModalReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  const handlePublishReview = (id: string) => {
    const updated = reviews.map((r) =>
      r.id === id ? { ...r, status: 'PUBLISHED' } : r
    );
    setReviews(updated);
    localStorage.setItem('admin_customer_reviews', JSON.stringify(updated));
    success('Review approved and published to public showcase!');
  };

  const handleFlagReview = (id: string) => {
    const updated = reviews.map((r) =>
      r.id === id ? { ...r, status: 'FLAGGED' } : r
    );
    setReviews(updated);
    localStorage.setItem('admin_customer_reviews', JSON.stringify(updated));
    success('Review flagged for content audit.');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;
    const updated = reviews.map((r) =>
      r.id === replyModalReview.id ? { ...r, adminReply: replyText.trim() } : r
    );
    setReviews(updated);
    localStorage.setItem('admin_customer_reviews', JSON.stringify(updated));
    setReplyModalReview(null);
    setReplyText('');
    success('Official Admin response published!');
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.partnerName.toLowerCase().includes(search.toLowerCase());
      const matchRating = ratingFilter === 'ALL' || r.rating === ratingFilter;
      return matchSearch && matchRating;
    });
  }, [reviews, search, ratingFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* ---------------- TOP BANNER ---------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Star className="w-4 h-4 fill-amber-300" />
              <span>Module 13: Customer Reviews & Ratings Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Reviews, Ratings & Project Feedback Management
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Moderate verified customer ratings, post official platform responses, inspect post-handover NPS surveys & track professional scorecards.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div className="text-center px-3">
              <div className="text-2xl font-black text-amber-300">4.85 / 5.0</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">Platform Average</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-3">
              <div className="text-2xl font-black text-emerald-300">96%</div>
              <div className="text-[10px] text-blue-200 uppercase font-bold">NPS Promoter Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 3 SUB-FEATURE TABS ---------------- */}
      <div className="bg-white rounded-2xl border border-blue-200/80 p-2 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {REVIEWS_SUBVIEWS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectView(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-navy-950 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-blue-50/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300 fill-amber-300' : 'text-blue-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- VIEW 1: CUSTOMER REVIEWS ---------------- */}
      {activeView === 'CUSTOMER_REVIEWS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, project, architect, contractor..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Rating Filter:</span>
                {(['ALL', 5, 4, 3] as const).map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingFilter(star)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      ratingFilter === star
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {star === 'ALL' ? 'All Stars' : `${star} ★`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                        {rev.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                          <span>{rev.customerName}</span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Verified Project Client
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{rev.customerLocation} • {formatDate(rev.reviewDate)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          rev.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy-950">{rev.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rev.comment}</p>
                  </div>

                  <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-700">Project:</strong> {rev.projectTitle} • <strong className="text-slate-700">Partner:</strong> {rev.partnerName}
                    </div>
                    <span className="text-slate-400 text-[11px]">Helpful Count: {rev.helpfulCount}</span>
                  </div>

                  {rev.adminReply && (
                    <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 text-xs">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>BuildGhar Official Admin Response</span>
                      </div>
                      <p className="text-slate-700">{rev.adminReply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyModalReview(rev);
                        setReplyText(rev.adminReply || '');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      <span>{rev.adminReply ? 'Edit Admin Reply' : 'Post Admin Reply'}</span>
                    </button>
                    {rev.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        onClick={() => handlePublishReview(rev.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Publish Review</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFlagReview(rev.id)}
                      className="px-2.5 py-1 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Flag for audit"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 2: PROJECT FEEDBACK ---------------- */}
      {activeView === 'PROJECT_FEEDBACK' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Post-Handover Client Satisfaction Surveys (NPS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detailed 5-pillar client evaluation audits submitted upon key milestone delivery and final home handover.
              </p>
            </div>

            <div className="space-y-3">
              {feedbackSurveys.map((fb) => (
                <div
                  key={fb.id}
                  className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="text-xs font-bold text-navy-950">{fb.customerName}</div>
                      <div className="text-[11px] text-slate-500">{fb.projectName} • Handover: {formatDate(fb.handoverDate)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        Score: {fb.overallScore} / 10
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {fb.npsCategory}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-slate-400">Quality of Finish</div>
                      <div className="font-bold text-navy-950">{fb.qualityScore} / 10</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-slate-400">Timeline Adherence</div>
                      <div className="font-bold text-navy-950">{fb.timelinessScore} / 10</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-slate-400">Cost Transparency</div>
                      <div className="font-bold text-navy-950">{fb.costTransparencyScore} / 10</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-slate-400">Communication</div>
                      <div className="font-bold text-navy-950">{fb.communicationScore} / 10</div>
                    </div>
                  </div>

                  <div className="text-xs bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 text-slate-700">
                    <strong className="text-blue-950">Client Highlight:</strong> "{fb.highlight}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VIEW 3: RATINGS HISTORY ---------------- */}
      {activeView === 'RATINGS_HISTORY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span>Professional Partner Quality Scorecards & Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-500">
                Real-time performance rankings across registered Architects, Contractors and Interior Designers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {partnerScorecards.map((ps) => (
                <div
                  key={ps.id}
                  className="border border-blue-100 rounded-xl p-4 bg-white hover:border-blue-300 transition shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {ps.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-950">{ps.name}</h4>
                      <div className="text-xs text-slate-500">{ps.role}</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span className="text-base font-black text-amber-950">{ps.averageRating}</span>
                      <span className="text-xs text-amber-800">({ps.totalReviews} reviews)</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Top Rated
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Projects Completed:</span>
                      <strong className="text-navy-950">{ps.projectsCompleted}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>On-Time Delivery Rate:</span>
                      <strong className="text-emerald-700">{ps.onTimeDeliveryRate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Repeat Preference:</span>
                      <strong className="text-blue-900">{ps.repeatRate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>5-Star Perfect Ratings:</span>
                      <strong className="text-amber-700">{ps.fiveStarCount}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {ps.id}</span>
                    <button
                      type="button"
                      onClick={() => success(`Detailed audit scorecard generated for ${ps.name}`)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Full Scorecard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN REPLY MODAL ---------------- */}
      {replyModalReview && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-blue-200 max-w-lg w-full p-6 text-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-navy-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Post Official Admin Response</span>
              </h3>
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 space-y-1">
              <div><strong>Client:</strong> {replyModalReview.customerName} ({replyModalReview.projectTitle})</div>
              <div><strong>Review:</strong> "{replyModalReview.comment}"</div>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Response Message</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional acknowledgement and appreciation on behalf of BuildGhar..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyModalReview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Publish Response
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default AdminReviews;
