import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Home,
  Info,
  PhoneCall,
  HelpCircle,
  FileText,
  Shield,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles,
  Search,
  Building,
  MapPin,
  Mail,
  Smartphone,
  Check,
  AlertCircle,
  HardHat,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDate } from '../../lib/utils.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';
import {
  getPlatformCMS,
  savePlatformCMS,
  PlatformCMSStore,
  FAQItem,
  HomepageContentData,
  AboutUsContentData,
  ContactUsContentData,
  LegalPolicyContentData,
} from '../../data/cmsContentStore.js';

// ==============================================================================
// 17. CMS & PLATFORM CONTENT MANAGEMENT
// Sub-Features:
// 1. Homepage Content
// 2. About Us
// 3. Contact Us
// 4. FAQ
// 5. Terms & Conditions
// 6. Privacy Policy
// 7. Cancellation Policy
// 8. Refund Policy
// ==============================================================================

export type CMSSubView =
  | 'HOMEPAGE_CONTENT'
  | 'ABOUT_US'
  | 'CONTACT_US'
  | 'FAQ'
  | 'TERMS_CONDITIONS'
  | 'PRIVACY_POLICY'
  | 'CANCELLATION_POLICY'
  | 'REFUND_POLICY';

export const CMS_VIEWS: Record<
  CMSSubView,
  { label: string; icon: any; badgeColor: string; description: string }
> = {
  HOMEPAGE_CONTENT: {
    label: 'Homepage Content',
    icon: Home,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Hero banners, call-to-actions, live statistics counters, and platform value pillars.',
  },
  ABOUT_US: {
    label: 'About Us',
    icon: Info,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Founding story, engineering integrity mission, IS 456 technical standards, and leadership team.',
  },
  CONTACT_US: {
    label: 'Contact Us',
    icon: PhoneCall,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Corporate headquarters, 3 regional hubs, toll-free hotlines, and grievance escalation desks.',
  },
  FAQ: {
    label: 'FAQ',
    icon: HelpCircle,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Categorized Q&As for Homeowners, Architects, Escrow Payments, and Structural Engineering.',
  },
  TERMS_CONDITIONS: {
    label: 'Terms & Conditions',
    icon: FileText,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Master service agreement, architect bidding rules, CAD licensing, and arbitration clauses.',
  },
  PRIVACY_POLICY: {
    label: 'Privacy Policy',
    icon: Shield,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'DPDP Act 2023 compliance, 256-bit AES encryption standards, and property data protection.',
  },
  CANCELLATION_POLICY: {
    label: 'Cancellation Policy',
    icon: XCircle,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Pre-kickoff, design phase, and structural work stoppage rules and partner mobilization fees.',
  },
  REFUND_POLICY: {
    label: 'Refund Policy',
    icon: RotateCcw,
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    description: '100% escrow protection guarantee, inspection failure refunds, and 3-5 day banking reversal SLAs.',
  },
};

export const AdminCMSContent: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get('view');
  const selectedView: CMSSubView =
    rawView && Object.keys(CMS_VIEWS).includes(rawView)
      ? (rawView as CMSSubView)
      : 'HOMEPAGE_CONTENT';

  const handleSelectView = (newView: CMSSubView) => {
    setSearchParams({ view: newView });
  };

  const [cmsData, setCmsData] = useState<PlatformCMSStore>(getPlatformCMS());
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddFaqModalOpen, setIsAddFaqModalOpen] = useState(false);
  const [newFaq, setNewFaq] = useState<{
    category: FAQItem['category'];
    question: string;
    answer: string;
  }>({
    category: 'HOMEOWNER',
    question: '',
    answer: '',
  });

  const loadData = () => {
    setCmsData(getPlatformCMS());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('CMS_CONTENT_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('CMS_CONTENT_UPDATED', handleUpdate);
    };
  }, []);

  // SubCounts for all 8 views
  const subCounts = useMemo(() => {
    return {
      HOMEPAGE_CONTENT: cmsData.homepage.stats.length + cmsData.homepage.pillars.length,
      ABOUT_US: cmsData.aboutUs.standards.length + cmsData.aboutUs.leadership.length,
      CONTACT_US: cmsData.contactUs.regionalHubs.length + 1,
      FAQ: cmsData.faqs.length,
      TERMS_CONDITIONS: cmsData.termsConditions.sections.length,
      PRIVACY_POLICY: cmsData.privacyPolicy.sections.length,
      CANCELLATION_POLICY: cmsData.cancellationPolicy.sections.length,
      REFUND_POLICY: cmsData.refundPolicy.sections.length,
    };
  }, [cmsData]);

  // Save current CMS state
  const handleSaveCMS = (sectionName: string) => {
    savePlatformCMS(cmsData);
    logAdminAuditAction({
      action: 'CMS_CONTENT_PUBLISHED',
      targetType: 'PLATFORM_SETTINGS',
      targetId: selectedView,
      description: `Published updates to ${sectionName} (${selectedView})`,
    });
    success(`${sectionName} published to live platform successfully!`);
  };

  // Add FAQ Question
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      error('Please fill both question and answer');
      return;
    }

    const item: FAQItem = {
      id: `FAQ-${Date.now()}`,
      category: newFaq.category,
      question: newFaq.question.trim(),
      answer: newFaq.answer.trim(),
      order: cmsData.faqs.length + 1,
    };

    const updated = {
      ...cmsData,
      faqs: [...cmsData.faqs, item],
    };

    setCmsData(updated);
    savePlatformCMS(updated);
    success('New FAQ added and published!');
    setNewFaq({ category: 'HOMEOWNER', question: '', answer: '' });
    setIsAddFaqModalOpen(false);
  };

  // Delete FAQ
  const handleDeleteFaq = (id: string) => {
    const updated = {
      ...cmsData,
      faqs: cmsData.faqs.filter((f) => f.id !== id),
    };
    setCmsData(updated);
    savePlatformCMS(updated);
    success('FAQ deleted successfully.');
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return cmsData.faqs.filter((f) => {
      if (faqCategoryFilter !== 'ALL' && f.category !== faqCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cmsData.faqs, faqCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans">
      {/* ---------------- Top Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold font-display text-navy-950">
                  17. CMS & Platform Content Management
                </h1>
                <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
                  Module 17 Compliant
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage public-facing website copy, company narrative, engineering standards, regional contact hubs, FAQs, and statutory policies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Top Dropdown View Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
            <label htmlFor="cms-view-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Content Section:
            </label>
            <div className="relative">
              <select
                id="cms-view-select"
                value={selectedView}
                onChange={(e) => handleSelectView(e.target.value as CMSSubView)}
                className="text-xs font-bold bg-transparent text-navy-950 pr-6 py-0.5 focus:outline-hidden cursor-pointer"
              >
                {(Object.keys(CMS_VIEWS) as CMSSubView[]).map((v) => (
                  <option key={v} value={v}>
                    {CMS_VIEWS[v].label} ({subCounts[v]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Toggle Live Preview */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              isPreviewMode
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
          </button>

          <button
            onClick={() => handleSaveCMS(CMS_VIEWS[selectedView].label)}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Publish to Live</span>
          </button>
        </div>
      </div>

      {/* ---------------- 8-Pill Action Strip ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {(Object.keys(CMS_VIEWS) as CMSSubView[]).map((v) => {
          const info = CMS_VIEWS[v];
          const IconComp = info.icon;
          const count = subCounts[v];
          const isSelected = selectedView === v;
          return (
            <button
              key={v}
              onClick={() => handleSelectView(v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-blue-200 shadow-md ring-2 ring-blue-500 ring-offset-1'
                  : 'bg-white hover:bg-blue-50/80 text-slate-700 border border-slate-200/80'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              <span>{info.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- Contextual Feature Header Banner ---------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-700">
            {React.createElement(CMS_VIEWS[selectedView].icon, { className: 'w-5 h-5' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy-950 font-display">
                {CMS_VIEWS[selectedView].label}
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CMS_VIEWS[selectedView].badgeColor}`}>
                Status: LIVE & PUBLISHED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {CMS_VIEWS[selectedView].description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Section ID:</span>
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px] font-bold">
            {selectedView}
          </span>
        </div>
      </div>

      {/* ==============================================================================
          1. HOMEPAGE CONTENT EDITOR
      ============================================================================== */}
      {selectedView === 'HOMEPAGE_CONTENT' && (
        <div className="space-y-6">
          {/* Top Notice Banner Setting */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Top Sticky Notice Banner</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={cmsData.homepage.bannerNotice.enabled}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        bannerNotice: {
                          ...cmsData.homepage.bannerNotice,
                          enabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Enable Notice Banner on Public Website</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Badge Text</label>
                <input
                  type="text"
                  value={cmsData.homepage.bannerNotice.badge}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        bannerNotice: {
                          ...cmsData.homepage.bannerNotice,
                          badge: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Banner Announcement Text</label>
                <input
                  type="text"
                  value={cmsData.homepage.bannerNotice.text}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        bannerNotice: {
                          ...cmsData.homepage.bannerNotice,
                          text: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Hero Section Copy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm">Hero Header & Call to Actions</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Hero Sub-Badge</label>
                <input
                  type="text"
                  value={cmsData.homepage.hero.badge}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        hero: { ...cmsData.homepage.hero, badge: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-blue-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Main Headline (H1)</label>
                <input
                  type="text"
                  value={cmsData.homepage.hero.headline}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        hero: { ...cmsData.homepage.hero, headline: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 text-navy-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subheadline Description</label>
                <textarea
                  rows={2}
                  value={cmsData.homepage.hero.subheadline}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      homepage: {
                        ...cmsData.homepage,
                        hero: { ...cmsData.homepage.hero, subheadline: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 resize-none text-slate-700 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Primary CTA Button</div>
                  <input
                    type="text"
                    value={cmsData.homepage.hero.primaryCtaText}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        homepage: {
                          ...cmsData.homepage,
                          hero: { ...cmsData.homepage.hero, primaryCtaText: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Secondary CTA Button</div>
                  <input
                    type="text"
                    value={cmsData.homepage.hero.secondaryCtaText}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        homepage: {
                          ...cmsData.homepage,
                          hero: { ...cmsData.homepage.hero, secondaryCtaText: e.target.value },
                        },
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm">Key Platform Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cmsData.homepage.stats.map((stat, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const updated = [...cmsData.homepage.stats];
                        updated[idx].label = e.target.value;
                        setCmsData({
                          ...cmsData,
                          homepage: { ...cmsData.homepage, stats: updated },
                        });
                      }}
                      className="w-full p-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Counter Value
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...cmsData.homepage.stats];
                        updated[idx].value = e.target.value;
                        setCmsData({
                          ...cmsData,
                          homepage: { ...cmsData.homepage, stats: updated },
                        });
                      }}
                      className="w-full p-1.5 text-base font-bold font-display border border-slate-200 rounded-lg bg-white text-navy-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Helper Note
                    </label>
                    <input
                      type="text"
                      value={stat.helper}
                      onChange={(e) => {
                        const updated = [...cmsData.homepage.stats];
                        updated[idx].helper = e.target.value;
                        setCmsData({
                          ...cmsData,
                          homepage: { ...cmsData.homepage, stats: updated },
                        });
                      }}
                      className="w-full p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          2. ABOUT US EDITOR
      ============================================================================== */}
      {selectedView === 'ABOUT_US' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm">Company Narrative & Philosophy</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Page Title</label>
                <input
                  type="text"
                  value={cmsData.aboutUs.title}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      aboutUs: { ...cmsData.aboutUs, title: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 text-navy-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={cmsData.aboutUs.subtitle}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      aboutUs: { ...cmsData.aboutUs, subtitle: e.target.value },
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Founding Story & Engineering Mission</label>
                <textarea
                  rows={5}
                  value={cmsData.aboutUs.story}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      aboutUs: { ...cmsData.aboutUs, story: e.target.value },
                    })
                  }
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Core Mission</label>
                  <textarea
                    rows={3}
                    value={cmsData.aboutUs.mission}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        aboutUs: { ...cmsData.aboutUs, mission: e.target.value },
                      })
                    }
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 leading-relaxed resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Long-term Vision</label>
                  <textarea
                    rows={3}
                    value={cmsData.aboutUs.vision}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        aboutUs: { ...cmsData.aboutUs, vision: e.target.value },
                      })
                    }
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 leading-relaxed resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Standards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm">Mandatory Engineering & IS Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cmsData.aboutUs.standards.map((std, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    {std.code}
                  </span>
                  <input
                    type="text"
                    value={std.title}
                    onChange={(e) => {
                      const updated = [...cmsData.aboutUs.standards];
                      updated[idx].title = e.target.value;
                      setCmsData({
                        ...cmsData,
                        aboutUs: { ...cmsData.aboutUs, standards: updated },
                      });
                    }}
                    className="w-full p-1.5 text-xs font-bold text-navy-950 border border-slate-200 rounded-lg bg-white"
                  />
                  <textarea
                    rows={3}
                    value={std.description}
                    onChange={(e) => {
                      const updated = [...cmsData.aboutUs.standards];
                      updated[idx].description = e.target.value;
                      setCmsData({
                        ...cmsData,
                        aboutUs: { ...cmsData.aboutUs, standards: updated },
                      });
                    }}
                    className="w-full p-2 text-[11px] text-slate-600 border border-slate-200 rounded-lg bg-white resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          3. CONTACT US EDITOR
      ============================================================================== */}
      {selectedView === 'CONTACT_US' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Corporate Headquarters</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Office Address</label>
                  <input
                    type="text"
                    value={cmsData.contactUs.corporateOffice.address}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        contactUs: {
                          ...cmsData.contactUs,
                          corporateOffice: {
                            ...cmsData.contactUs.corporateOffice,
                            address: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">City</label>
                    <input
                      type="text"
                      value={cmsData.contactUs.corporateOffice.city}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          contactUs: {
                            ...cmsData.contactUs,
                            corporateOffice: {
                              ...cmsData.contactUs.corporateOffice,
                              city: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">State</label>
                    <input
                      type="text"
                      value={cmsData.contactUs.corporateOffice.state}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          contactUs: {
                            ...cmsData.contactUs,
                            corporateOffice: {
                              ...cmsData.contactUs.corporateOffice,
                              state: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={cmsData.contactUs.corporateOffice.pincode}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          contactUs: {
                            ...cmsData.contactUs,
                            corporateOffice: {
                              ...cmsData.contactUs.corporateOffice,
                              pincode: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Corporate Hotline</label>
                  <input
                    type="text"
                    value={cmsData.contactUs.corporateOffice.phone}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        contactUs: {
                          ...cmsData.contactUs,
                          corporateOffice: {
                            ...cmsData.contactUs.corporateOffice,
                            phone: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Support Email</label>
                  <input
                    type="email"
                    value={cmsData.contactUs.corporateOffice.email}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        contactUs: {
                          ...cmsData.contactUs,
                          corporateOffice: {
                            ...cmsData.contactUs.corporateOffice,
                            email: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Hubs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Regional Innovation Hubs</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cmsData.contactUs.regionalHubs.map((hub, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-950 text-sm">{hub.city} Hub</span>
                    <Badge variant="emerald" className="text-[10px]">ACTIVE</Badge>
                  </div>
                  <input
                    type="text"
                    value={hub.hubName}
                    onChange={(e) => {
                      const updated = [...cmsData.contactUs.regionalHubs];
                      updated[idx].hubName = e.target.value;
                      setCmsData({
                        ...cmsData,
                        contactUs: { ...cmsData.contactUs, regionalHubs: updated },
                      });
                    }}
                    className="w-full p-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                  />
                  <textarea
                    rows={2}
                    value={hub.address}
                    onChange={(e) => {
                      const updated = [...cmsData.contactUs.regionalHubs];
                      updated[idx].address = e.target.value;
                      setCmsData({
                        ...cmsData,
                        contactUs: { ...cmsData.contactUs, regionalHubs: updated },
                      });
                    }}
                    className="w-full p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white resize-none text-slate-600"
                  />
                  <input
                    type="text"
                    value={hub.phone}
                    onChange={(e) => {
                      const updated = [...cmsData.contactUs.regionalHubs];
                      updated[idx].phone = e.target.value;
                      setCmsData({
                        ...cmsData,
                        contactUs: { ...cmsData.contactUs, regionalHubs: updated },
                      });
                    }}
                    className="w-full p-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          4. FAQ EDITOR
      ============================================================================== */}
      {selectedView === 'FAQ' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs by question or answer keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="HOMEOWNER">Homeowner</option>
                <option value="ESCROW_PAYMENT">Escrow & Payment</option>
                <option value="ARCHITECT">Architect Partners</option>
                <option value="IS456_STANDARDS">IS 456 Standards</option>
                <option value="DISPUTES">Disputes & Revisions</option>
              </select>

              <button
                onClick={() => setIsAddFaqModalOpen(true)}
                className="btn-gold px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add FAQ</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {faq.category} • #{idx + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const updated = cmsData.faqs.map((f) =>
                        f.id === faq.id ? { ...f, question: e.target.value } : f
                      );
                      setCmsData({ ...cmsData, faqs: updated });
                    }}
                    className="w-full p-2 text-xs font-bold text-navy-950 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Answer
                  </label>
                  <textarea
                    rows={3}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = cmsData.faqs.map((f) =>
                        f.id === faq.id ? { ...f, answer: e.target.value } : f
                      );
                      setCmsData({ ...cmsData, faqs: updated });
                    }}
                    className="w-full p-2.5 text-xs text-slate-700 border border-slate-200 rounded-lg bg-slate-50 leading-relaxed resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================================
          5, 6, 7, 8: LEGAL POLICIES (Terms / Privacy / Cancellation / Refund)
      ============================================================================== */}
      {(selectedView === 'TERMS_CONDITIONS' ||
        selectedView === 'PRIVACY_POLICY' ||
        selectedView === 'CANCELLATION_POLICY' ||
        selectedView === 'REFUND_POLICY') && (
        <div className="space-y-6">
          {(() => {
            const policyKey =
              selectedView === 'TERMS_CONDITIONS'
                ? 'termsConditions'
                : selectedView === 'PRIVACY_POLICY'
                ? 'privacyPolicy'
                : selectedView === 'CANCELLATION_POLICY'
                ? 'cancellationPolicy'
                : 'refundPolicy';
            const policy: LegalPolicyContentData = (cmsData as any)[policyKey];

            return (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-navy-950 text-base">{policy.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{policy.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        Version {policy.version}
                      </span>
                      <Badge variant="emerald" className="text-[10px] font-bold">LEGALLY ENFORCEABLE</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Executive Summary</label>
                    <textarea
                      rows={2}
                      value={policy.summary}
                      onChange={(e) => {
                        const updated = {
                          ...cmsData,
                          [policyKey]: {
                            ...policy,
                            summary: e.target.value,
                          },
                        };
                        setCmsData(updated);
                      }}
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Sections List */}
                <div className="space-y-4">
                  {policy.sections.map((sec, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          Section #{sIdx + 1}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Clause Heading
                        </label>
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => {
                            const updatedSecs = [...policy.sections];
                            updatedSecs[sIdx].heading = e.target.value;
                            setCmsData({
                              ...cmsData,
                              [policyKey]: {
                                ...policy,
                                sections: updatedSecs,
                              },
                            });
                          }}
                          className="w-full p-2 text-xs font-bold text-navy-950 border border-slate-200 rounded-lg bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Statutory Content & Provisions
                        </label>
                        <textarea
                          rows={4}
                          value={sec.content}
                          onChange={(e) => {
                            const updatedSecs = [...policy.sections];
                            updatedSecs[sIdx].content = e.target.value;
                            setCmsData({
                              ...cmsData,
                              [policyKey]: {
                                ...policy,
                                sections: updatedSecs,
                              },
                            });
                          }}
                          className="w-full p-3 text-xs text-slate-700 border border-slate-200 rounded-lg bg-slate-50 leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------- MODAL: Add New FAQ ---------------- */}
      <AnimatePresence>
        {isAddFaqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-navy-950 text-base">Add New Platform FAQ</h3>
                </div>
                <button
                  onClick={() => setIsAddFaqModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddFaq} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newFaq.category}
                    onChange={(e) =>
                      setNewFaq({ ...newFaq, category: e.target.value as FAQItem['category'] })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="HOMEOWNER">Homeowner & Clients</option>
                    <option value="ESCROW_PAYMENT">Escrow & Milestone Payments</option>
                    <option value="ARCHITECT">Architect Partners</option>
                    <option value="IS456_STANDARDS">IS 456 Structural Codes</option>
                    <option value="DISPUTES">Disputes & Revision Rights</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Question</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How do I inspect structural drawings before approving milestone?"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Answer</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide a clear, legally sound, and concise explanation..."
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddFaqModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gold px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Save & Publish FAQ
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
