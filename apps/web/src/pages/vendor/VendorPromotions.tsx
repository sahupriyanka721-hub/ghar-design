import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Percent,
  Plus,
  Search,
  Tag,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  Flame,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorPromotions,
  saveVendorPromotion,
  toggleVendorPromotion,
  getVendorProducts,
} from '../../data/vendorStore.js';
import { VendorPromotionRule } from '@ghar-design/shared';

export const VendorPromotions: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'COUPONS' | 'FEATURED_REQUESTS'>('COUPONS');
  const [refreshKey, setRefreshKey] = useState(0);

  // Create Coupon Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT_DISCOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<number>(5000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [requestFeatured, setRequestFeatured] = useState(false);

  // Featured Product Request Modal
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const promotions = useMemo(() => {
    return getVendorPromotions(vendorId);
  }, [vendorId, refreshKey]);

  const products = useMemo(() => {
    return getVendorProducts(vendorId);
  }, [vendorId]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'FEATURED_REQUESTS') {
        return !!p.featuredPlacementRequested;
      }
      return true;
    });
  }, [promotions, search, activeTab]);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      error('Please provide a campaign title and coupon code');
      return;
    }

    saveVendorPromotion({
      vendorId,
      title: title.trim(),
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minPurchasePaise: minPurchase * 100,
      applicableProductIds: [],
      startDate,
      endDate,
      isActive: true,
      featuredPlacementRequested: requestFeatured,
      featuredStatus: requestFeatured ? 'PENDING' : undefined,
    });

    success(`Promotional Coupon ${code.toUpperCase()} launched successfully!`);
    setShowCreateModal(false);
    setTitle('');
    setCode('');
    setRefreshKey((k) => k + 1);
  };

  const handleToggleActive = (promoId: string, currentStatus: boolean) => {
    toggleVendorPromotion(promoId, !currentStatus);
    success(`Promotion ${!currentStatus ? 'activated' : 'paused'}`);
    setRefreshKey((k) => k + 1);
  };

  const handleRequestProductFeatured = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      error('Please select a product to sponsor for featured placement');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    saveVendorPromotion({
      vendorId,
      title: `Featured Showcase: ${prod?.title || 'Selected Product'}`,
      code: `FEATURED-${Date.now().toString().slice(-4)}`,
      discountType: 'PERCENTAGE',
      discountValue: 5,
      minPurchasePaise: 100000,
      applicableProductIds: [selectedProductId],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      isActive: true,
      featuredPlacementRequested: true,
      featuredStatus: 'PENDING',
    });

    success('Featured placement submitted to BuildGhar Admin for spotlight review!');
    setShowFeaturedModal(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 text-rose-700 rounded-xl">
              <Percent className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Offers, Discounts & Promotions
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create coupon codes, volume discounts, seasonal clearance promotions and request marketplace featured banners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFeaturedModal(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Request Featured Placement</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('COUPONS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'COUPONS'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Discounts ({promotions.length})
            </button>
            <button
              onClick={() => setActiveTab('FEATURED_REQUESTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'FEATURED_REQUESTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
              }`}
            >
              Featured Placement Requests ({promotions.filter((p) => p.featuredPlacementRequested).length})
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promotion by name or coupon code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-rose-500 font-sans"
            />
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPromotions.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No active promotions or coupons found.</p>
              <p className="text-[11px] mt-0.5">Click "Create New Offer" to run a discount for site contractors.</p>
            </div>
          ) : (
            filteredPromotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border border-blue-200/80/90 p-5 space-y-3.5 hover:border-blue-200 transition shadow-2xs relative overflow-hidden"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                      <Tag className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{promo.title}</h3>
                      <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {promo.code}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      promo.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {promo.isActive ? 'Active Live' : 'Paused'}
                  </span>
                </div>

                {/* Offer Details */}
                <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount Offered:</span>
                    <strong className="text-slate-900">
                      {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} FLAT OFF`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min Order Value:</span>
                    <span className="font-mono text-slate-800">{formatINR(promo.minPurchasePaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Validity Window:</span>
                    <span>
                      {promo.startDate} to {promo.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-blue-200/80">
                    <span className="text-slate-500">Redemptions:</span>
                    <strong className="text-emerald-700 font-mono">{promo.usedCount || 0} home orders</strong>
                  </div>
                </div>

                {/* Featured Badge if requested */}
                {promo.featuredPlacementRequested && (
                  <div className="p-2.5 bg-amber-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Marketplace Spotlight Banner:</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-blue-300">
                      {promo.featuredStatus || 'PENDING REVIEW'}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleToggleActive(promo.id, promo.isActive)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                      promo.isActive
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {promo.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: CREATE NEW PROMOTION / COUPON */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-600 text-white rounded-xl">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-navy-950">Create Promotional Offer</h3>
                    <p className="text-[11px] text-slate-500">Launch a coupon code for homeowners and contractors</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="p-5 space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Offer Title *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e: any) => setDiscountType(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (%) Off</option>
                      <option value="FLAT_DISCOUNT">Flat Amount (₹) Off</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Discount Value ({discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={discountType === 'PERCENTAGE' ? 90 : 50000}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Min Order Cart (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-3 bg-amber-50 border border-blue-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestFeatured}
                    onChange={(e) => setRequestFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-amber-950 block">Request Spotlight Banner Placement</span>
                    <span className="text-[11px] text-amber-800">
                      Submit for top placement on BuildGhar materials landing page (subject to Admin review).
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish Offer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REQUEST FEATURED PRODUCT PLACEMENT */}
      <AnimatePresence>
        {showFeaturedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-600 text-white rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-navy-950">Marketplace Featured Spotlight</h3>
                    <p className="text-[11px] text-slate-500">Put your flagship product in front of thousands of daily builders</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFeaturedModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestProductFeatured} className="p-5 space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Catalog Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-blue-200 text-amber-950 space-y-1">
                  <strong>Featured Placement Benefits:</strong>
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-800">
                    <li>Top carousel placement on Material Marketplace home.</li>
                    <li>Highlighted "Featured Verified Depot" badge on product cards.</li>
                    <li>Admin review within 24 hours.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowFeaturedModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit for Admin Approval</span>
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
