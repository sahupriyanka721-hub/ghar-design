import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getRegisteredVendors,
  updateVendorStatus,
  getVendorProducts,
  updateVendorProductApproval,
  getVendorQuotations,
  updateVendorQuotationStatus,
  getVendorPayouts,
  createVendorPayoutSettlement,
  settleVendorPayout,
  getVendorOrders,
  getVendorBrands,
  updateVendorBrandStatus,
  getVendorCategoryRequests,
  updateVendorCategoryRequestStatus,
} from '../../data/vendorStore.js';
import {
  RegisteredVendor,
  VendorProduct,
  VendorMaterialQuotation,
  VendorCommissionPayout,
  VendorBrandItem,
  VendorCategoryRequest,
} from '@ghar-design/shared';
import { syncChannel } from '../../data/customerStore.js';
import {
  Store,
  Package,
  FileCheck2,
  Layers,
  Award,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  Eye,
  MapPin,
  Phone,
  Building,
  Building2,
  User,
  IndianRupee,
  Truck,
  ExternalLink,
  Check,
  X,
  ArrowLeft,
  FileText,
  Sparkles,
} from 'lucide-react';

export const AdminVendors: React.FC = () => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'VENDORS' | 'PRODUCTS' | 'CATEGORIES' | 'BRANDS' | 'QUOTATIONS' | 'PAYOUTS'>('VENDORS');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Data State
  const [vendors, setVendors] = useState<RegisteredVendor[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [quotations, setQuotations] = useState<VendorMaterialQuotation[]>([]);
  const [payouts, setPayouts] = useState<VendorCommissionPayout[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [brands, setBrands] = useState<VendorBrandItem[]>([]);
  const [catRequests, setCatRequests] = useState<VendorCategoryRequest[]>([]);

  // Modals & Action States
  const [selectedVendorForModal, setSelectedVendorForModal] = useState<RegisteredVendor | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<VendorProduct | null>(null);
  const [selectedQuotationForModal, setSelectedQuotationForModal] = useState<VendorMaterialQuotation | null>(null);
  const [rejectionModalTarget, setRejectionModalTarget] = useState<{
    type: 'VENDOR' | 'PRODUCT' | 'QUOTATION';
    id: string;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Settlement Form Modal State
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementVendorId, setSettlementVendorId] = useState('');
  const [settlementUtr, setSettlementUtr] = useState('');
  const [settlementPayoutTarget, setSettlementPayoutTarget] = useState<VendorCommissionPayout | null>(null);

  const loadAllData = () => {
    setVendors(getRegisteredVendors());
    setProducts(getVendorProducts());
    setQuotations(getVendorQuotations());
    setPayouts(getVendorPayouts());
    setOrders(getVendorOrders());
    setBrands(getVendorBrands());
    setCatRequests(getVendorCategoryRequests());
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000);

    const onSync = (e: MessageEvent) => {
      if (
        e.data?.type === 'VENDORS_UPDATED' ||
        e.data?.type === 'VENDOR_PRODUCTS_UPDATED' ||
        e.data?.type === 'ORDERS_UPDATED' ||
        e.data?.type === 'PAYOUTS_UPDATED'
      ) {
        loadAllData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    window.addEventListener('storage', loadAllData);

    return () => {
      clearInterval(interval);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', loadAllData);
    };
  }, []);

  // Counts for Badges
  const pendingVendorsCount = useMemo(
    () => vendors.filter((v) => v.status === 'PENDING_APPROVAL').length,
    [vendors]
  );
  const pendingProductsCount = useMemo(
    () => products.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length,
    [products]
  );
  const pendingQuotesCount = useMemo(
    () => quotations.filter((q) => q.status === 'SUBMITTED_TO_ADMIN').length,
    [quotations]
  );

  // ---------------- ACTION HANDLERS ----------------
    const handleApproveBrand = (brandId: string) => {
    const updated = updateVendorBrandStatus(brandId, 'ACTIVE');
    setBrands(updated);
    success('Brand approved and listed on marketplace!');
  };

  const handleRejectBrand = (brandId: string) => {
    const updated = updateVendorBrandStatus(brandId, 'REJECTED');
    setBrands(updated);
    error('Brand request rejected.');
  };

  const handleApproveCategoryRequest = (reqId: string) => {
    const updated = updateVendorCategoryRequestStatus(reqId, 'APPROVED', 'Approved by BuildGhar Taxonomy Team');
    setCatRequests(updated);
    success('Category request approved and added to active taxonomy!');
  };

  const handleRejectCategoryRequest = (reqId: string) => {
    const updated = updateVendorCategoryRequestStatus(reqId, 'REJECTED', 'Category does not meet platform criteria');
    setCatRequests(updated);
    error('Category request rejected.');
  };

  const handleApproveVendor = (vendorId: string) => {
    const updated = updateVendorStatus(vendorId, 'APPROVED');
    setVendors(updated);
    success('Vendor depot account approved! Vendor can now access marketplace features.');
    if (selectedVendorForModal?.id === vendorId) setSelectedVendorForModal(null);
  };

  const handleApproveProduct = (productId: string) => {
    const updated = updateVendorProductApproval(productId, 'APPROVED', 'Verified by Admin Quality Standards');
    setProducts(updated);
    success('Product approved! It is now live in the customer Buy Materials store.');
    if (selectedProductForModal?.id === productId) setSelectedProductForModal(null);
  };

  const handleApproveQuotation = (quotationId: string) => {
    const updated = updateVendorQuotationStatus(
      quotationId,
      'APPROVED_BY_ADMIN',
      'Verified by Admin Procurement Desk'
    );
    setQuotations(updated);
    success('Quotation proposal approved and published to customer!');
    if (selectedQuotationForModal?.id === quotationId) setSelectedQuotationForModal(null);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalTarget) return;

    if (rejectionModalTarget.type === 'VENDOR') {
      const updated = updateVendorStatus(rejectionModalTarget.id, 'REJECTED', rejectionReason);
      setVendors(updated);
      success('Vendor application rejected with feedback note.');
    } else if (rejectionModalTarget.type === 'PRODUCT') {
      const updated = updateVendorProductApproval(rejectionModalTarget.id, 'REJECTED', rejectionReason);
      setProducts(updated);
      success('Product rejected with feedback note.');
    } else if (rejectionModalTarget.type === 'QUOTATION') {
      const updated = updateVendorQuotationStatus(rejectionModalTarget.id, 'REJECTED', rejectionReason);
      setQuotations(updated);
      success('Quotation proposal rejected with feedback note.');
    }

    setRejectionModalTarget(null);
    setRejectionReason('');
  };

  const handleSettlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementPayoutTarget || !settlementUtr.trim()) {
      error('Please enter valid bank UTR / IMPS transaction reference number');
      return;
    }

    const updated = settleVendorPayout(settlementPayoutTarget.id, settlementUtr.trim());
    setPayouts(updated);
    success(`Payout ${settlementPayoutTarget.payoutCode} marked as SETTLED!`);
    setSettlementPayoutTarget(null);
    setSettlementUtr('');
  };

  // Filtered lists
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.businessName?.toLowerCase().includes(q) ||
        v.ownerName?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.gstin?.toLowerCase().includes(q)
      );
    });
  }, [vendors, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.quotationCode?.toLowerCase().includes(query) ||
        item.customerName?.toLowerCase().includes(query) ||
        item.materialItem?.toLowerCase().includes(query) ||
        item.vendorName?.toLowerCase().includes(query)
      );
    });
  }, [quotations, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Admin Control Center</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-950">Vendor & Depot Management Desk</h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit newly registered wholesale depots, review submitted building materials catalog items, inspect customer quotations, and manage 5% platform commission disbursements.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingVendorsCount + pendingProductsCount + pendingQuotesCount} Action Items</span>
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- NAVIGATION TABS ---------------- */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveTab('VENDORS');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[160px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'VENDORS'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor Accounts</span>
          {pendingVendorsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-navy-950 rounded-full text-[10px] font-extrabold">
              {pendingVendorsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('PRODUCTS');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[160px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'PRODUCTS'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Approvals</span>
          {pendingProductsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-navy-950 rounded-full text-[10px] font-extrabold">
              {pendingProductsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('QUOTATIONS');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[160px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'QUOTATIONS'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Material Quotations</span>
          {pendingQuotesCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-navy-950 rounded-full text-[10px] font-extrabold">
              {pendingQuotesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('CATEGORIES');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'CATEGORIES'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Requests</span>
          {catRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-navy-950 rounded-full text-[10px] font-extrabold">
              {catRequests.filter((r) => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('BRANDS');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'BRANDS'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Brand Requests</span>
          {brands.filter((b) => b.status === 'PENDING_APPROVAL').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-navy-950 rounded-full text-[10px] font-extrabold">
              {brands.filter((b) => b.status === 'PENDING_APPROVAL').length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('PAYOUTS');
            setSearchQuery('');
          }}
          className={`flex-1 min-w-[160px] py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'PAYOUTS'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>5% Commission & Payouts</span>
        </button>
      </div>

      {/* ---------------- SEARCH BAR ---------------- */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'VENDORS'
                ? 'Search vendors by firm name, owner, mobile, GSTIN or city...'
                : activeTab === 'PRODUCTS'
                ? 'Search products by title, brand, SKU or vendor name...'
                : activeTab === 'QUOTATIONS'
                ? 'Search quotations by code, customer or material...'
                : 'Search payouts...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VENDOR ACCOUNTS APPROVAL                                            */}
      {/* ========================================================================= */}
      {activeTab === 'VENDORS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {filteredVendors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-navy-950">No Vendors Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No vendors are currently registered or match your search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Firm / Depot</th>
                    <th className="py-3.5 px-4">Owner & Contact</th>
                    <th className="py-3.5 px-4">Tax / GSTIN</th>
                    <th className="py-3.5 px-4">Dispatch Yard</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setSelectedVendorForModal(vendor)}
                          className="cursor-pointer group"
                          title="Click to inspect vendor dossier"
                        >
                          <p className="font-bold text-navy-950 text-sm group-hover:text-blue-600 transition-colors">
                            {vendor.businessName}
                          </p>
                          <p className="text-[11px] text-slate-500 group-hover:text-slate-700">{vendor.businessCategory}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Registered: {formatDate(vendor.registeredAt)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setSelectedVendorForModal(vendor)}
                          className="cursor-pointer group"
                          title="Click to inspect vendor dossier"
                        >
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {vendor.ownerName}
                          </p>
                          <p className="text-[11px] text-slate-600 font-mono mt-0.5">{vendor.phone}</p>
                          {vendor.email && (
                            <p className="text-[10px] text-slate-400">{vendor.email}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono text-[11px] font-bold text-slate-800">
                          {vendor.gstin || 'Not Provided'}
                        </p>
                        {vendor.panNumber && (
                          <p className="text-[10px] text-slate-400 font-mono">PAN: {vendor.panNumber}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{vendor.city}, {vendor.state}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {vendor.warehouseAddress} (PIN: {vendor.pinCode})
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {vendor.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : vendor.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedVendorForModal(vendor)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            title="Inspect Vendor Full Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>

                          {vendor.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproveVendor(vendor.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Approve Vendor Account"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {vendor.status !== 'REJECTED' && (
                            <button
                              onClick={() =>
                                setRejectionModalTarget({
                                  type: 'VENDOR',
                                  id: vendor.id,
                                  title: vendor.businessName,
                                })
                              }
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Reject Vendor Application"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCT APPROVALS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-navy-950">No Products Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No vendor products are waiting for approval or match your query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Item & SKU</th>
                    <th className="py-3.5 px-4">Depot / Vendor</th>
                    <th className="py-3.5 px-4">Selling Rate</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Admin Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-navy-950">{prod.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {prod.brand} • <span className="font-mono">{prod.sku}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{prod.vendorName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{prod.vendorPhone}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                        {formatINR(prod.pricePaise)} / {prod.unit}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {prod.stockQuantity} {prod.unit}s
                      </td>

                      <td className="py-3.5 px-4">
                        {prod.approvalStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved (In Store)</span>
                          </span>
                        ) : prod.approvalStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProductForModal(prod)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                            title="Inspect Product Specifications"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>

                          {prod.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproveProduct(prod.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Publish Product to Store Catalog"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {prod.approvalStatus !== 'REJECTED' && (
                            <button
                              onClick={() =>
                                setRejectionModalTarget({
                                  type: 'PRODUCT',
                                  id: prod.id,
                                  title: prod.name,
                                })
                              }
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Reject Product"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MATERIAL QUOTATIONS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'QUOTATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-navy-950">No Quotations Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No vendor has submitted a quotation proposal for customer requests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Quote Code</th>
                    <th className="py-3.5 px-4">Depot</th>
                    <th className="py-3.5 px-4">Customer & Site</th>
                    <th className="py-3.5 px-4">Item & Rate</th>
                    <th className="py-3.5 px-4">Gross Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                        {quote.quotationCode}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{quote.vendorName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{quote.vendorPhone}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{quote.customerName}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {quote.deliveryLocation}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{quote.materialItem}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {quote.quantity} {quote.unit} @ {formatINR(quote.quotedUnitPricePaise)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-navy-950 text-sm">
                        {formatINR(quote.quotedTotalPaise)}
                      </td>

                      <td className="py-3.5 px-4">
                        {quote.status === 'APPROVED_BY_ADMIN' || quote.status === 'PUBLISHED_TO_CUSTOMER' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : quote.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedQuotationForModal(quote)}
                            className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition"
                            title="Inspect Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {quote.status !== 'APPROVED_BY_ADMIN' && quote.status !== 'PUBLISHED_TO_CUSTOMER' && (
                            <button
                              onClick={() => handleApproveQuotation(quote.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Approve & Send to Customer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {quote.status !== 'REJECTED' && (
                            <button
                              onClick={() =>
                                setRejectionModalTarget({
                                  type: 'QUOTATION',
                                  id: quote.id,
                                  title: quote.quotationCode,
                                })
                              }
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Reject Quotation"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 5% COMMISSION & SETTLEMENTS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-6">
          {/* Commission Calculation KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Gross Material Turnover</span>
              <p className="text-2xl font-bold text-navy-950 mt-1">
                {formatINR(
                  orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0)
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">All material checkout purchases</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">
                GharDesign Platform Commission (5%)
              </span>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatINR(
                  Math.round(
                    orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0) * 0.05
                  )
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Platform service fee revenue</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Net Disbursable to Vendors</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatINR(
                  Math.round(
                    orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0) * 0.95
                  )
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">95% net payable to vendor depots</p>
            </div>
          </div>

          {/* Settlement Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Vendor Payout Disbursals</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track vendor settlements and record bank wire UTR references
                </p>
              </div>

              {vendors.length > 0 && orders.length > 0 && (
                <button
                  onClick={() => {
                    const gross = orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);
                    if (gross <= 0) {
                      error('No order revenue to settle');
                      return;
                    }
                    const v = vendors[0];
                    const newP = createVendorPayoutSettlement(
                      v.id,
                      v.businessName,
                      orders.map((o) => o.orderCode || o.id),
                      gross,
                      5
                    );
                    setPayouts(getVendorPayouts());
                    success(`Generated settlement batch ${newP.payoutCode}`);
                  }}
                  className="px-3.5 py-1.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  <span>Generate New Settlement Batch</span>
                </button>
              )}
            </div>

            {payouts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-navy-950">No Settlement Batches Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  When orders are fulfilled, settlement batches can be created and marked settled with UTR bank reference numbers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Payout Code</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Gross Sales</th>
                      <th className="py-3 px-4">5% Commission</th>
                      <th className="py-3 px-4">Net Payout</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-navy-950">
                          {payout.payoutCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {payout.vendorName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          {formatINR(payout.grossSalesPaise)}
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                          {formatINR(payout.commissionAmountPaise)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {formatINR(payout.netPayoutPaise)}
                        </td>
                        <td className="py-3 px-4">
                          {payout.status === 'SETTLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled ({payout.transactionRef || 'UTR Recorded'})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Pending Settlement</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {payout.status !== 'SETTLED' && (
                            <button
                              onClick={() => {
                                setSettlementPayoutTarget(payout);
                                setSettlementUtr(`UTR-AXIS-${Math.floor(10000000 + Math.random() * 90000000)}`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                            >
                              Mark Settled
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON FULL-SCREEN VIEW                                         */}
      {/* ========================================================================= */}
      {rejectionModalTarget && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setRejectionModalTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Vendor Desk</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  Reject {rejectionModalTarget.type}: {rejectionModalTarget.title}
                </h2>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Compliance Audit & Rejection Desk • GharDesign Materials Admin
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRejectionModalTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <p className="text-xs text-slate-600">
                Target Entity: <strong className="text-navy-950 font-bold">{rejectionModalTarget.title}</strong>
              </p>

              <form onSubmit={handleConfirmRejection} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Official Reason for Rejection <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder=""
                    className="w-full p-4 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRejectionModalTarget(null)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD SETTLEMENT UTR FULL-SCREEN VIEW                                    */}
      {/* ========================================================================= */}
      {settlementPayoutTarget && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setSettlementPayoutTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Payouts Desk</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                  Record Wire Settlement & Bank UTR
                </h2>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Payout #{settlementPayoutTarget.payoutCode} • Supplier: {settlementPayoutTarget.vendorName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSettlementPayoutTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1000px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Payout ID</span>
                  <span className="font-mono font-bold text-navy-950 text-sm mt-0.5 block">{settlementPayoutTarget.payoutCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Supplier Account</span>
                  <span className="font-bold text-navy-950 text-sm mt-0.5 block">{settlementPayoutTarget.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Net Payable Amount</span>
                  <span className="font-mono font-black text-emerald-600 text-base mt-0.5 block">{formatINR(settlementPayoutTarget.netPayoutPaise)}</span>
                </div>
              </div>

              <form onSubmit={handleSettlePayoutSubmit} className="space-y-6 text-xs">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Bank UTR / IMPS Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settlementUtr}
                    onChange={(e) => setSettlementUtr(e.target.value)}
                    placeholder=""
                    className="w-full p-4 font-mono text-sm uppercase bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Enter the unique 16 or 22-digit IMPS/NEFT/RTGS transaction reference from corporate banking.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSettlementPayoutTarget(null)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
                  >
                    Save Settlement & Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VENDOR DOSSIER MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedVendorForModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSelectedVendorForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Vendors Directory</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedVendorForModal.businessName}
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      {selectedVendorForModal.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    GSTIN: {selectedVendorForModal.gstin || 'N/A'} • Owner: {selectedVendorForModal.ownerName}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {selectedVendorForModal.status !== 'APPROVED' && (
                <button
                  onClick={() => handleApproveVendor(selectedVendorForModal.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Vendor</span>
                </button>
              )}
              <button
                onClick={() => setSelectedVendorForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Depot City</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">{selectedVendorForModal.city}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{selectedVendorForModal.state} - {selectedVendorForModal.pinCode}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Owner Contact</span>
                <div className="text-lg font-bold font-mono text-blue-700 mt-1">{selectedVendorForModal.phone}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{selectedVendorForModal.ownerName}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Compliance</span>
                <div className="text-base font-bold font-mono text-emerald-700 mt-1">{selectedVendorForModal.gstin || 'Verified GSTIN'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">PAN: {selectedVendorForModal.panNumber || 'N/A'}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Settlement Channel</span>
                <div className="text-lg font-bold font-display text-slate-900 mt-1">Escrow Payout</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Direct Bank IMPS / RTGS</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Vendor Registration & Contact</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Business Legal Name:</span>
                      <span className="font-bold text-slate-900">{selectedVendorForModal.businessName}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Authorized Owner:</span>
                      <span className="font-bold text-slate-900">{selectedVendorForModal.ownerName}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Direct Mobile:</span>
                      <span className="font-mono font-bold text-blue-700">{selectedVendorForModal.phone}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Official Email:</span>
                      <span className="font-semibold text-slate-800">{selectedVendorForModal.email || 'None on file'}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-slate-500 block">Dispatch Yard / Warehouse Address:</span>
                      <p className="font-bold text-slate-900 text-sm">
                        {selectedVendorForModal.warehouseAddress}, {selectedVendorForModal.city}, {selectedVendorForModal.state} - {selectedVendorForModal.pinCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Settlement Bank & Escrow Details</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex justify-between">
                      <span className="text-slate-500">Account Holder:</span>
                      <span className="font-bold text-slate-900">
                        {selectedVendorForModal.bankDetails?.accountHolder || selectedVendorForModal.ownerName}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Bank Account Number:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedVendorForModal.bankDetails?.accountNumber || 'Pending Configuration'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Bank IFSC Code:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {selectedVendorForModal.bankDetails?.ifsc || 'Pending Configuration'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-slate-500">Instant UPI VPA:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedVendorForModal.bankDetails?.upiId || 'Pending'}
                      </span>
                    </div>
                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">B2B Material Deliveries:</span>
                      <span className="font-bold text-blue-900">Direct Site Offload Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT SPECIFICATION FULL-SCREEN VIEW */}
      {selectedProductForModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSelectedProductForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Materials Catalog</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedProductForModal.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                      {selectedProductForModal.approvalStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    SKU: {selectedProductForModal.sku} • Brand: {selectedProductForModal.brand}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {selectedProductForModal.approvalStatus !== 'APPROVED' && (
                <button
                  onClick={() => handleApproveProduct(selectedProductForModal.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve for Store</span>
                </button>
              )}
              <button
                onClick={() => setSelectedProductForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Selling Price</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {formatINR(selectedProductForModal.pricePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Per {selectedProductForModal.unit}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Market / MSRP</span>
                <div className="text-xl font-bold font-mono text-slate-400 line-through mt-1">
                  {formatINR(selectedProductForModal.marketPricePaise)}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Direct Wholesale Rate</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Available Stock</span>
                <div className="text-2xl font-black font-display text-blue-700 mt-1">
                  {selectedProductForModal.stockQuantity} {selectedProductForModal.unit}s
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">In Depot Inventory</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Transit Time</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {selectedProductForModal.deliveryDays} Days
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Direct Site Offload</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  {selectedProductForModal.imageUrl && (
                    <img
                      src={selectedProductForModal.imageUrl}
                      alt={selectedProductForModal.name}
                      className="w-full h-64 object-cover rounded-2xl border border-slate-200"
                    />
                  )}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">Supplier Depot:</span>
                      <span className="font-bold text-navy-950">{selectedProductForModal.vendorName}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">Brand:</span>
                      <span className="font-bold text-navy-950">{selectedProductForModal.brand}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">Product SKU:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedProductForModal.sku}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Technical Specifications & Grade</span>
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedProductForModal.specifications}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUOTATION PROPOSAL FULL-SCREEN VIEW */}
      {selectedQuotationForModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSelectedQuotationForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Material RFQs</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedQuotationForModal.quotationCode}
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                      {selectedQuotationForModal.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Vendor: {selectedQuotationForModal.vendorName} • Buyer: {selectedQuotationForModal.customerName}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {selectedQuotationForModal.status !== 'APPROVED_BY_ADMIN' && (
                <button
                  onClick={() => handleApproveQuotation(selectedQuotationForModal.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Deliver to Customer</span>
                </button>
              )}
              <button
                onClick={() => setSelectedQuotationForModal(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Quoted Total</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {formatINR(selectedQuotationForModal.quotedTotalPaise)}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Includes GST & Offloading</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Quantity</span>
                <div className="text-2xl font-black font-display text-blue-700 mt-1">
                  {selectedQuotationForModal.quantity} {selectedQuotationForModal.unit}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{selectedQuotationForModal.materialItem}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Unit Price</span>
                <div className="text-2xl font-black font-display text-slate-900 mt-1">
                  {formatINR(selectedQuotationForModal.quotedUnitPricePaise)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Per {selectedQuotationForModal.unit}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Site</span>
                <div className="text-xl font-bold font-display text-navy-950 mt-1 truncate">
                  {selectedQuotationForModal.deliveryLocation}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Customer Delivery Location</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Vendor & Buyer Particulars</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Quoting Vendor Depot:</span>
                      <span className="font-bold text-navy-950">{selectedQuotationForModal.vendorName}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Homeowner / Buyer:</span>
                      <span className="font-bold text-navy-950">{selectedQuotationForModal.customerName}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                      <span className="text-slate-500">Material Requested:</span>
                      <span className="font-bold text-blue-800">{selectedQuotationForModal.materialItem}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Transit Terms & Logistics</span>
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-800 italic leading-relaxed">
                    {selectedQuotationForModal.deliveryTerms}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
