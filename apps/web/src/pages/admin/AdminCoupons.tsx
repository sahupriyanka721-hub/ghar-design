import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Check,
  ArrowRight,
  XCircle,
  Clock,
  Sparkles,
  Percent,
  IndianRupee,
  Calendar,
  Layers,
  Copy,
  Trash2,
  X,
  ArrowLeft,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import {
  PlatformCoupon,
  getPlatformCoupons,
  savePlatformCoupon,
  togglePlatformCouponStatus,
  deletePlatformCoupon,
  recordPlatformAuditLog,
} from '../../data/adminStore.js';

export const AdminCoupons: React.FC = () => {
  const { success, error } = useToast();
  const [coupons, setCoupons] = useState<PlatformCoupon[]>(() => getPlatformCoupons());
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [couponStep, setCouponStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<PlatformCoupon['discountType']>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderRupees, setMinOrderRupees] = useState<number>(5000);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState<number>(2500);
  const [validUntil, setValidUntil] = useState<string>('2026-12-31');
  const [usageLimit, setUsageLimit] = useState<number>(200);
  const [applicableScope, setApplicableScope] = useState<PlatformCoupon['applicableScope']>('ALL');

  const refreshData = () => {
    setCoupons(getPlatformCoupons());
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && c.isActive) ||
        (selectedStatus === 'INACTIVE' && !c.isActive);
      const matchesScope = selectedScope === 'ALL' || c.applicableScope === selectedScope;

      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [coupons, search, selectedStatus, selectedScope]);

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((c) => c.isActive).length,
      inactive: coupons.filter((c) => !c.isActive).length,
      totalRedemptions: coupons.reduce((sum, c) => sum + c.usedCount, 0),
    };
  }, [coupons]);

  const handleToggle = (couponId: string, currentStatus: boolean, couponCode: string) => {
    try {
      const updated = togglePlatformCouponStatus(couponId);
      setCoupons(updated);

      recordPlatformAuditLog({
        action: 'TOGGLE_COUPON',
        module: 'PROMOTIONS',
        targetId: couponCode,
        performedBy: 'Super Administrator',
        notes: `Coupon ${couponCode} toggled to ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}`,
      });

      success(`Coupon ${couponCode} is now ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}`);
    } catch {
      error('Failed to toggle coupon status');
    }
  };

  const handleDelete = (couponId: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete promo coupon ${couponCode}?`)) return;

    try {
      const updated = deletePlatformCoupon(couponId);
      setCoupons(updated);

      recordPlatformAuditLog({
        action: 'DELETE_COUPON',
        module: 'PROMOTIONS',
        targetId: couponCode,
        performedBy: 'Super Administrator',
        notes: `Coupon ${couponCode} deleted permanently`,
      });

      success(`Coupon ${couponCode} deleted.`);
    } catch {
      error('Failed to delete coupon');
    }
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    success(`Coupon code ${couponCode} copied to clipboard!`);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode || !title.trim()) {
      error('Please fill coupon code and campaign title.');
      return;
    }

    try {
      const saved = savePlatformCoupon({
        code: cleanCode,
        title: title.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderPaise: Number(minOrderRupees) * 100,
        maxDiscountPaise: Number(maxDiscountRupees) * 100,
        validUntil,
        usageLimit: Number(usageLimit),
        applicableScope,
        isActive: true,
      });

      recordPlatformAuditLog({
        action: 'CREATE_COUPON',
        module: 'PROMOTIONS',
        targetId: saved.code,
        performedBy: 'Super Administrator',
        notes: `New promo coupon ${saved.code} created (${discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue}`} discount)`,
      });

      success(`Campaign coupon ${saved.code} created successfully!`);
      setCouponStep(1);
    setShowCreateModal(false);
      setCode('');
      setTitle('');
      refreshData();
    } catch {
      error('Failed to save coupon');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-950">Coupons & Promo Engine</h1>
              <p className="text-xs text-slate-500">
                Manage promotional discount campaigns, homeowner welcome vouchers, and seasonal festival offers
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Campaigns</p>
          <p className="text-2xl font-black text-navy-950 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All registered vouchers</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Coupons</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Live for homeowner checkout</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inactive / Expired</p>
          <p className="text-2xl font-black text-slate-600 mt-1">{stats.inactive}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Paused or expired promos</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Total Redemptions</p>
          <p className="text-2xl font-black text-sky-600 mt-1">{stats.totalRedemptions}</p>
          <p className="text-[10px] text-sky-600/70 mt-0.5">Claimed orders & milestones</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupons by code or campaign title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="ALL">All Scopes</option>
              <option value="SERVICES">Design & Architectural Services</option>
              <option value="MATERIALS">Building Materials</option>
              <option value="DESIGN">Interior Decor Packages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Campaign Title</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min. Cart & Max Cap</th>
                <th className="py-3.5 px-4">Applicable Scope</th>
                <th className="py-3.5 px-4">Usage / Redemptions</th>
                <th className="py-3.5 px-4">Valid Until</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No promotional coupons found.</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-navy-950 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          title="Copy Code"
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-flex items-center gap-1">
                        {c.discountType === 'PERCENTAGE' ? (
                          <>
                            <Percent className="w-3 h-3" />
                            <span>{c.discountValue}% OFF</span>
                          </>
                        ) : (
                          <>
                            <IndianRupee className="w-3 h-3" />
                            <span>₹{c.discountValue} FLAT</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600 font-mono">
                      <p>Min: ₹{(c.minOrderPaise / 100).toLocaleString('en-IN')}</p>
                      <p className="text-slate-400">Cap: ₹{(c.maxDiscountPaise / 100).toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                        {c.applicableScope}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold text-navy-950">{c.usedCount}</span>
                          <span className="text-slate-400">/ {c.usageLimit}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-600 rounded-full"
                            style={{
                              width: `${Math.min(100, (c.usedCount / (c.usageLimit || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {c.validUntil}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(c.id, c.isActive, c.code)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {c.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>INACTIVE</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        title="Delete Coupon"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showCreateModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Platform Discount Coupon
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Coupon Management • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {[
                  { step: 1, title: '1. Coupon Code & Discount', desc: 'Code Nomenclature, Campaign & Discount Tier' },
                  { step: 2, title: '2. Applicability & Limits', desc: 'Scope, Usage Thresholds & Validity Date' },
                ].map((s) => {
                  const isActive = couponStep === s.step;
                  const isCompleted = couponStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setCouponStep(s.step as 1 | 2)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                          : isCompleted
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-amber-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateCoupon} className="space-y-6 text-xs text-slate-700">
                {/* STEP 1: CODE & DISCOUNT */}
                {couponStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: Coupon Code & Discount Values</h3>
                      <p className="text-xs text-slate-500">Define promo promotional code and cash / percentage deduction.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-navy-950 uppercase focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Campaign Title *</label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                        >
                          <option value="PERCENTAGE">Percentage (%) Off</option>
                          <option value="FLAT_AMOUNT">Flat Amount (₹) Off</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Flat Value (₹) *'}
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={discountType === 'PERCENTAGE' ? 100 : 500000}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Min Order Value (₹)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={minOrderRupees}
                          onChange={(e) => setMinOrderRupees(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Max Discount Cap (₹)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={maxDiscountRupees}
                          onChange={(e) => setMaxDiscountRupees(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!code.trim() || !title.trim()) {
                            alert('Please enter Coupon Code and Campaign Title.');
                            return;
                          }
                          setCouponStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Applicability & Limits</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: APPLICABILITY & LIMITS */}
                {couponStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Service Scope & Usage Limits</h3>
                      <p className="text-xs text-slate-500">Configure eligible platform services, redemptions count, and calendar expiry.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Applicable Scope</label>
                          <select
                            value={applicableScope}
                            onChange={(e) => setApplicableScope(e.target.value as any)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                          >
                            <option value="ALL">Entire BuildGhar Platform</option>
                            <option value="SERVICES">Design & Architecture Services</option>
                            <option value="MATERIALS">Building Materials Cart</option>
                            <option value="DESIGN">Turnkey Interior Packages</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Total Usage Limit</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={usageLimit}
                            onChange={(e) => setUsageLimit(Number(e.target.value))}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Validity Expiration Date</label>
                        <input
                          type="date"
                          required
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Promo Preview Card */}
                      <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80">
                        <div className="text-[11px] font-bold text-amber-900 uppercase mb-2">Coupon Code Preview</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-slate-500 block text-[10px]">Code:</span> <span className="font-mono font-bold text-amber-700 text-sm">{code}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Discount:</span> <span className="font-bold text-navy-950">{discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Min Cart:</span> <span className="font-bold text-slate-800">₹{minOrderRupees}</span></div>
                          <div><span className="text-slate-500 block text-[10px]">Expires:</span> <span className="font-bold text-slate-800">{validUntil || 'None'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCouponStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Create & Launch Coupon</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
