import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Filter,
  Sparkles,
  Download,
  ThumbsUp,
  TrendingUp,
  Search,
  X,
  Share2,
  Check,
  Send,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  getInteriorReviews,
  getInteriorProjects,
  InteriorReview,
} from '../../data/interiorDesignerStore.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export type ReviewsViewMode = 'CUSTOMER_REVIEWS' | 'PROJECT_FEEDBACK' | 'RATINGS_HISTORY';

interface DesignerReplyState {
  [reviewId: string]: string;
}

export const InteriorDesignerReviews: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active View Mode
  const currentView = (searchParams.get('view') as ReviewsViewMode) || 'CUSTOMER_REVIEWS';
  const setViewMode = (mode: ReviewsViewMode) => {
    setSearchParams({ view: mode });
  };

  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reviews Data
  const [reviewsList, setReviewsList] = useState<InteriorReview[]>(() => getInteriorReviews('id-101'));
  const [designerReplies, setDesignerReplies] = useState<DesignerReplyState>({
    'BG-REV-INT-101': 'Thank you Vikramaditya! It was an absolute delight collaborating on the cove illumination and spatial geometry for your penthouse.',
  });
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Handle designer replying to a review
  const handleSubmitReply = (reviewId: string) => {
    if (!replyInput.trim()) return;
    setDesignerReplies((prev) => ({
      ...prev,
      [reviewId]: replyInput.trim(),
    }));
    setReplyingReviewId(null);
    setReplyInput('');
    success('Your acknowledgment was published and sent to the client!');
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      if (selectedProjectId !== 'ALL' && rev.projectId !== selectedProjectId) return false;
      if (selectedRatingFilter !== 'ALL') {
        const ratingNum = Math.floor(rev.rating);
        if (selectedRatingFilter === '5' && ratingNum !== 5) return false;
        if (selectedRatingFilter === '4' && ratingNum !== 4) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          rev.customerName.toLowerCase().includes(query) ||
          rev.projectName.toLowerCase().includes(query) ||
          rev.reviewText.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [reviewsList, selectedProjectId, selectedRatingFilter, searchQuery]);

  // Overall metrics
  const totalReviewsCount = reviewsList.length;
  const averageRating = useMemo(() => {
    if (reviewsList.length === 0) return 4.9;
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  // Nav tabs with real-time badges
  const navTabs: { id: ReviewsViewMode; label: string; count: number | string; badgeColor: string }[] = [
    { id: 'CUSTOMER_REVIEWS', label: 'Customer Reviews', count: reviewsList.length, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'PROJECT_FEEDBACK', label: 'Project Feedback', count: projects.length, badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'RATINGS_HISTORY', label: 'Ratings History', count: `${averageRating} ★`, badgeColor: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ----------------- TOP HERO HEADER ----------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-200 border border-amber-400/30 font-mono">
                Module 13: Reputation Management
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Verified Homeowners
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-400 shrink-0 fill-amber-400" />
              <span>Reviews & Ratings</span>
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Client testimonials, milestone satisfaction feedback, and performance rating history vetted through BuildGhar verified platform delivery.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => success('Exporting verified Ratings Certificate (PDF)...')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg hover:shadow-amber-400/20"
            >
              <Download className="w-4 h-4" />
              <span>Export Rating Dossier</span>
            </button>
          </div>
        </div>

        {/* 4 Scorecard Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Overall Rating</span>
            <div className="text-2xl font-black text-amber-300 flex items-center gap-1.5 mt-0.5">
              <span>{averageRating}</span>
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>
            <span className="text-[10px] text-amber-200 block mt-0.5">Top 5% Elite Partner</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Spatial Creativity</span>
            <span className="text-lg font-black text-white">5.0 / 5.0</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">100% Client Approval</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Execution Quality</span>
            <span className="text-lg font-black text-white">4.8 / 5.0</span>
            <span className="text-[10px] text-blue-300 block mt-0.5">Zero-Defect Snags</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200 text-[11px] block font-mono">Punctuality Score</span>
            <span className="text-lg font-black text-emerald-300">4.9 / 5.0</span>
            <span className="text-[10px] text-emerald-200 block mt-0.5">94% Ahead of SLA</span>
          </div>
        </div>
      </div>

      {/* ----------------- SUBMENU VIEW SELECTOR & PILLS ----------------- */}
      <div className="space-y-3">
        {/* Mobile View Switcher */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1">
            Reviews View Mode
          </label>
          <select
            value={currentView}
            onChange={(e) => setViewMode(e.target.value as ReviewsViewMode)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            {navTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop 3-Pill Horizontal Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- SEARCH & FILTERS BAR ----------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, project, or review feedback..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars & Above</option>
          </select>
        </div>
      </div>

      {/* ----------------- SUB-VIEW 1: CUSTOMER REVIEWS ----------------- */}
      {currentView === 'CUSTOMER_REVIEWS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => {
              const reply = designerReplies[rev.id];
              const isReplying = replyingReviewId === rev.id;

              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-amber-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{rev.customerName}</span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Client</span>
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 font-medium block mt-0.5">{rev.projectName}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-black text-amber-800 text-xs font-mono">{rev.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    "{rev.reviewText}"
                  </p>

                  {/* 4 Category Sub-Scores */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Design</span>
                      <strong className="text-xs text-slate-900">{rev.categories.designQuality}★</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Response</span>
                      <strong className="text-xs text-slate-900">{rev.categories.responsiveness}★</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Timeline</span>
                      <strong className="text-xs text-slate-900">{rev.categories.timeliness}★</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Conduct</span>
                      <strong className="text-xs text-slate-900">{rev.categories.professionalism}★</strong>
                    </div>
                  </div>

                  {/* Designer Reply Stream */}
                  {reply && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-blue-900 font-bold">
                        <span>Your Public Response:</span>
                        <span className="text-[10px] text-blue-600 font-mono">Verified Designer</span>
                      </div>
                      <p className="text-slate-700">{reply}</p>
                    </div>
                  )}

                  {/* Reply Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{new Date(rev.createdAt).toLocaleDateString()}</span>

                    {!reply && !isReplying && (
                      <button
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyInput('');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply to Client</span>
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {isReplying && (
                    <div className="pt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Type your thank-you note or acknowledgment..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingReviewId(null)}
                          className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitReply(rev.id)}
                          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 2: PROJECT FEEDBACK ----------------- */}
      {currentView === 'PROJECT_FEEDBACK' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400 font-bold block">{proj.id}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{proj.title || proj.name}</h3>
                    <span className="text-xs text-blue-600 font-semibold">Client: {proj.clientName || 'Aman Saxena'}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    5.0 ★ Rating
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <strong className="text-slate-800 block">Stage 1: Space Planning Reaction</strong>
                    <p className="text-slate-600 leading-relaxed">
                      "Loved the vastu-compliant kitchen layout and the unobstructed corridor sightline to the terrace."
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <strong className="text-slate-800 block">Stage 3: 3D Visualization Sign-Off</strong>
                    <p className="text-slate-600 leading-relaxed">
                      "The cove lighting illumination scenes in 4K V-Ray gave our family complete clarity before civil work."
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Status: Completed & Approved</span>
                  <button
                    onClick={() => info(`Opening full feedback dossier for ${proj.title || proj.name}...`)}
                    className="text-blue-600 hover:text-blue-800 font-bold font-sans flex items-center gap-1"
                  >
                    <span>View All Milestones</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUB-VIEW 3: RATINGS HISTORY ----------------- */}
      {currentView === 'RATINGS_HISTORY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Ratings Trendline & Star Distribution</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Historical satisfaction metrics audited by BuildGhar QA over the past 12 months.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-300">
                Avg Rating: 4.9 / 5.0
              </span>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-16 font-mono font-bold text-slate-700">5 Stars</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="w-12 text-right font-mono font-bold text-slate-800">85% (27)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-mono font-bold text-slate-700">4 Stars</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <span className="w-12 text-right font-mono font-bold text-slate-800">15% (5)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-mono font-bold text-slate-400">3 Stars</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-slate-300 h-full rounded-full" style={{ width: '0%' }} />
                </div>
                <span className="w-12 text-right font-mono text-slate-400">0%</span>
              </div>
            </div>

            {/* Reputation Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Top 5% Partner</h4>
                  <span className="text-xs text-amber-800">Recognized for high spatial quality</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
                <ThumbsUp className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">100% Recommended</h4>
                  <span className="text-xs text-emerald-800">32 Homeowners recommend</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Verified Escrow Pass</h4>
                  <span className="text-xs text-blue-800">Zero arbitration snags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
