import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorQuotations,
  saveVendorQuotation,
  getVendorMaterialRequests,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import { VendorMaterialQuotation, VendorMaterialRequest } from '../../data/vendorStore.js';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  User,
  MapPin,
  Calendar,
  Truck,
  IndianRupee,
  ShieldCheck,
  Send,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export const VendorQuotations: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const currentVendor = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const [quotations, setQuotations] = useState<VendorMaterialQuotation[]>([]);
  const [openRequests, setOpenRequests] = useState<VendorMaterialRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotationForView, setSelectedQuotationForView] = useState<VendorMaterialQuotation | null>(null);

  // Form State for New Quotation
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [activeRequest, setActiveRequest] = useState<VendorMaterialRequest | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [materialItem, setMaterialItem] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState('Bags');
  const [unitPriceRupees, setUnitPriceRupees] = useState<number>(380);
  const [deliveryDays, setDeliveryDays] = useState<number>(2);
  const [freightCharge, setFreightCharge] = useState<number>(2500);
  const [vehicleTypeOffered, setVehicleTypeOffered] = useState<string>('Dedicated 16-Ton Hydraulic Truck');
  const [boqItemRates, setBoqItemRates] = useState<Record<string, { rate: number; brand: string }>>({});
  const [deliveryTerms, setDeliveryTerms] = useState(
    'Includes crane unloading inside boundary wall. Minimum order guaranteed batch certified with test certificate.'
  );

  const loadData = () => {
    const quotes = getVendorQuotations(currentVendor?.id);
    setQuotations(quotes);
    const reqs = getVendorMaterialRequests();
    setOpenRequests(reqs);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [currentVendor?.id]);

  // When request selected from dropdown, prefill form
  const handleRequestSelection = (reqId: string) => {
    setSelectedRequestId(reqId);
    if (!reqId) {
      setActiveRequest(null);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryLocation('');
      setMaterialItem('');
      setQuantity(100);
      setUnit('Bags');
      setBoqItemRates({});
      return;
    }
    const req = openRequests.find((r) => r.id === reqId);
    if (req) {
      setActiveRequest(req);
      setCustomerName(req.customerName);
      setCustomerPhone(req.customerPhone);
      setDeliveryLocation(`${req.deliverySiteAddress}, ${req.city}, ${req.state}`);
      setMaterialItem(req.materialItem);
      setQuantity(req.requiredQuantity);
      setUnit(req.unit);

      // Pre-fill default item rates if this is a BOQ request
      if (req.items && req.items.length > 0) {
        const initialRates: Record<string, { rate: number; brand: string }> = {};
        req.items.forEach((it) => {
          if (it.category === 'Cement') {
            initialRates[it.id] = { rate: 380, brand: 'UltraTech Super / ACC' };
          } else if (it.category === 'Sand') {
            initialRates[it.id] = { rate: 52, brand: 'M-Sand River Coarse' };
          } else if (it.category === 'Gitti') {
            initialRates[it.id] = { rate: 46, brand: 'Blue Granite 20mm Aggregates' };
          } else if (it.category === 'Steel') {
            initialRates[it.id] = { rate: 62000, brand: 'Tata Tiscon 550D Fe' };
          } else if (it.category === 'Bricks') {
            initialRates[it.id] = { rate: 9, brand: 'First Class Red Clay Bricks' };
          } else {
            initialRates[it.id] = { rate: 100, brand: 'Standard Depot Grade' };
          }
        });
        setBoqItemRates(initialRates);
      }
    }
  };

  // Check URL params on mount
  useEffect(() => {
    if (openRequests.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const reqIdParam = params.get('requestId');
      if (reqIdParam) {
        handleRequestSelection(reqIdParam);
        setIsModalOpen(true);
      }
    }
  }, [openRequests.length]);

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialItem.trim() || !customerName.trim()) {
      error('Please complete all mandatory quotation fields');
      return;
    }

    let newQuote: VendorMaterialQuotation;

    if (activeRequest?.items && activeRequest.items.length > 0) {
      const itemPrices = (activeRequest.items || []).map((item) => {
        const rate = boqItemRates[item.id]?.rate || 100;
        const brand = boqItemRates[item.id]?.brand || 'Standard Depot Supply';
        const totalAmount = Math.round(item.quantity * rate);
        return {
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          brandOffered: brand,
          ratePerUnit: rate,
          totalAmount,
        };
      });

      const materialSubtotal = itemPrices.reduce((sum, it) => sum + it.totalAmount, 0);
      const freightDeliveryCharge = freightCharge;
      const gstAmount = Math.round(materialSubtotal * 0.18);
      const grandTotal = materialSubtotal + freightDeliveryCharge + gstAmount;

      newQuote = saveVendorQuotation({
        vendorId: currentVendor?.id || 'vnd-default',
        vendorName: currentVendor?.businessName || user?.name || 'Authorized Material Depot',
        vendorBusinessName: currentVendor?.businessName || user?.name || 'Authorized Material Depot',
        vendorPhone: currentVendor?.phone || user?.phone || '',
        vendorCity: currentVendor?.city || activeRequest.city || 'Wholesale Depot',
        vendorRating: 4.8,
        requestId: selectedRequestId || undefined,
        requestCode: activeRequest.requestCode,
        customerName,
        customerPhone,
        deliveryLocation,
        materialItem,
        quantity: 1,
        unit: 'House BOQ Package',
        itemPrices,
        materialSubtotal,
        freightDeliveryCharge,
        gstAmount,
        grandTotal,
        quotedUnitPricePaise: Math.round(grandTotal * 100),
        quotedTotalPaise: Math.round(grandTotal * 100),
        deliveryDays,
        vehicleTypeOffered,
        deliveryTerms,
        status: 'APPROVED',
      });
    } else {
      const unitPricePaise = Math.round(unitPriceRupees * 100);
      const totalPaise = Math.round(quantity * unitPricePaise);
      const grandTotal = totalPaise / 100;

      newQuote = saveVendorQuotation({
        vendorId: currentVendor?.id || 'vnd-default',
        vendorName: currentVendor?.businessName || user?.name || 'Authorized Material Depot',
        vendorBusinessName: currentVendor?.businessName || user?.name || 'Authorized Material Depot',
        vendorPhone: currentVendor?.phone || user?.phone || '',
        vendorCity: currentVendor?.city || 'Local Depot',
        vendorRating: 4.8,
        requestId: selectedRequestId || undefined,
        customerName,
        customerPhone,
        deliveryLocation,
        materialItem,
        quantity,
        unit,
        materialSubtotal: grandTotal,
        freightDeliveryCharge: 0,
        gstAmount: Math.round(grandTotal * 0.18),
        grandTotal: grandTotal,
        quotedUnitPricePaise: unitPricePaise,
        quotedTotalPaise: totalPaise,
        deliveryDays,
        vehicleTypeOffered,
        deliveryTerms,
        status: 'APPROVED',
      });
    }

    success(`Quotation ${newQuote.quotationCode} created and sent to customer!`);
    setIsModalOpen(false);
    loadData();

    // Reset form
    setSelectedRequestId('');
    setActiveRequest(null);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryLocation('');
    setMaterialItem('');
    setQuantity(100);
    setUnitPriceRupees(380);
    setBoqItemRates({});
  };

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCode = q.quotationCode?.toLowerCase().includes(query);
        const matchCust = q.customerName?.toLowerCase().includes(query);
        const matchItem = q.materialItem?.toLowerCase().includes(query);
        if (!matchCode && !matchCust && !matchItem) return false;
      }
      return true;
    });
  }, [quotations, filterStatus, searchQuery]);

  const totalQuotedValue = useMemo(() => {
    return quotations.reduce((sum, q) => sum + (q.quotedTotalPaise || 0), 0);
  }, [quotations]);

  const pendingAdminCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'SUBMITTED_TO_ADMIN').length;
  }, [quotations]);

  const approvedCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'APPROVED_BY_ADMIN' || q.status === 'PUBLISHED_TO_CUSTOMER').length;
  }, [quotations]);

  return (
    <div className="space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-blue-200/80/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gold-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            <span>Procurement & B2B Wholesale</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-950">Material Quotations Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit custom pricing for bulk homeowner & builder requests. All quotations undergo Admin verification before being delivered to the customer.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRequestId('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Submit Custom Quotation</span>
        </button>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Quotations</span>
            <span className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-navy-950">{quotations.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total quotation proposals logged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Admin Review</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{pendingAdminCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting admin review & validation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Admin Approved / Active</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Live and visible to homeowners</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Quotation Value</span>
            <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-navy-950">{formatINR(totalQuotedValue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative quoted pipeline</p>
        </div>
      </div>

      {/* ---------------- FILTERS & SEARCH ---------------- */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by quote code, customer or material item..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Quotes' },
            { id: 'SUBMITTED_TO_ADMIN', label: 'Under Review' },
            { id: 'APPROVED_BY_ADMIN', label: 'Approved' },
            { id: 'PUBLISHED_TO_CUSTOMER', label: 'Published' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-navy-950 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- QUOTATIONS TABLE / LIST ---------------- */}
      <div className="bg-white rounded-2xl border border-blue-200/80/80 shadow-2xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-navy-950">No Quotations Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You haven't submitted any material quotations matching this filter. Review inbound customer material requests or prepare a custom proposal.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-950 text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Quotation</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/30 border-b border-blue-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Quote Code</th>
                  <th className="py-3.5 px-4">Customer & Site</th>
                  <th className="py-3.5 px-4">Material Specification</th>
                  <th className="py-3.5 px-4">Quoted Rate</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Admin Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => {
                  const statusConfig = {
                    SUBMITTED_TO_ADMIN: {
                      label: 'Under Admin Review',
                      bg: 'bg-amber-50 text-amber-700 border-blue-200',
                      icon: Clock,
                    },
                    APPROVED_BY_ADMIN: {
                      label: 'Approved by Admin',
                      bg: 'bg-blue-50 text-blue-700 border-blue-200',
                      icon: CheckCircle2,
                    },
                    PUBLISHED_TO_CUSTOMER: {
                      label: 'Delivered to Customer',
                      bg: 'bg-purple-50 text-purple-700 border-purple-200',
                      icon: Send,
                    },
                    ACCEPTED: {
                      label: 'Customer Accepted',
                      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      icon: CheckCircle2,
                    },
                    REJECTED: {
                      label: 'Admin Rejected',
                      bg: 'bg-rose-50 text-rose-700 border-rose-200',
                      icon: AlertCircle,
                    },
                  }[quote.status] || {
                    label: quote.status,
                    bg: 'bg-sky-50/30 text-slate-700 border-blue-200/80',
                    icon: Clock,
                  };

                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={quote.id} className="hover:bg-blue-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-navy-950 block">{quote.quotationCode}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(quote.createdAt)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{quote.customerName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{quote.deliveryLocation}</span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{quote.materialItem}</p>
                        <p className="text-[11px] text-slate-500">
                          {quote.quantity} {quote.unit} • Est. Transit: {quote.deliveryDays} Days
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {formatINR(quote.quotedUnitPricePaise)} / {quote.unit}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-navy-950 text-sm">
                          {formatINR(quote.quotedTotalPaise)}
                        </span>
                        <span className="block text-[10px] text-slate-400">GST Included</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                        {quote.adminFeedback && (
                          <span className="block text-[10px] text-amber-700 mt-1 italic">
                            Note: {quote.adminFeedback}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedQuotationForView(quote)}
                          className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition"
                          title="View Quotation Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- NEW QUOTATION MODAL ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200/80 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-blue-200/80 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-gold-500" />
                  <span>Prepare Custom Material Quotation</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quoted prices are audited by GharDesign before customer delivery
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4">
              {/* Optional: Pick from open requests */}
              {openRequests.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Inbound Customer Request (Optional)
                  </label>
                  <select
                    value={selectedRequestId}
                    onChange={(e) => handleRequestSelection(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="">-- Manual Custom Quotation --</option>
                    {openRequests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.requestCode}: {r.materialItem} ({r.requiredQuantity} {r.unit}) - {r.customerName} ({r.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Site Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Delivery Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Plot 45, Sector 57, Gurugram, Haryana"
                  className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Multi-Item BOQ Pricing if request has items */}
              {activeRequest?.items && activeRequest.items.length > 0 ? (
                <div className="space-y-3 p-3 bg-sky-50/30 rounded-2xl border border-blue-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-950 uppercase tracking-wide">
                      Bill of Quantities (Quote Rates per Item)
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-md">
                      {activeRequest.builtUpAreaSqFt} sq.ft Package
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(activeRequest.items || []).map((item) => {
                      const curRate = boqItemRates[item.id]?.rate || 0;
                      const curBrand = boqItemRates[item.id]?.brand || '';
                      const itemTotal = item.quantity * curRate;

                      return (
                        <div key={item.id} className="p-2.5 bg-white rounded-xl border border-blue-200/80 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="font-mono font-bold text-navy-950">
                              {item.quantity.toLocaleString()} {item.unit}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Brand offered"
                                value={curBrand}
                                onChange={(e) =>
                                  setBoqItemRates((prev) => ({
                                    ...prev,
                                    [item.id]: { rate: curRate, brand: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1 text-xs bg-sky-50/30 border border-blue-200/80 rounded-lg focus:bg-white"
                              />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="text-[11px] text-slate-400 pl-1 mr-1">₹</span>
                                <input
                                  type="number"
                                  placeholder="Rate/unit"
                                  value={curRate}
                                  onChange={(e) =>
                                    setBoqItemRates((prev) => ({
                                      ...prev,
                                      [item.id]: { rate: Number(e.target.value), brand: curBrand },
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-xs bg-sky-50/30 border border-blue-200/80 rounded-lg font-mono font-bold text-navy-950 focus:bg-white"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1 text-right self-center font-mono font-bold text-xs text-slate-700">
                              ₹{itemTotal.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Freight and Transit fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200/80">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Truck Freight / Transit Fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={freightCharge}
                        onChange={(e) => setFreightCharge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200/80 rounded-xl font-mono font-bold text-navy-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Offloading Vehicle Offered
                      </label>
                      <input
                        type="text"
                        value={vehicleTypeOffered}
                        onChange={(e) => setVehicleTypeOffered(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200/80 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Computed Grand Total */}
                  <div className="p-3 bg-navy-950 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gold-400 font-bold block">Quotation Grand Total (BOQ)</span>
                      <span className="text-[10px] text-slate-300">Materials + Freight + 18% GST</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black font-mono text-gold-400">
                        ₹
                        {(
                          activeRequest.items.reduce(
                            (sum, it) => sum + it.quantity * (boqItemRates[it.id]?.rate || 0),
                            0
                          ) +
                          freightCharge +
                          Math.round(
                            activeRequest.items.reduce(
                              (sum, it) => sum + it.quantity * (boqItemRates[it.id]?.rate || 0),
                              0
                            ) * 0.18
                          )
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Single Material Item & Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Material Specification & Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={materialItem}
                      onChange={(e) => setMaterialItem(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Bags / MT / Bricks"
                        className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rate per Unit (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={unitPriceRupees}
                        onChange={(e) => setUnitPriceRupees(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500 font-mono font-bold text-navy-950"
                      />
                    </div>
                  </div>

                  {/* Total Calculation Preview */}
                  <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-600">Calculated Gross Proposal</span>
                      <span className="text-[10px] text-slate-400 block">
                        {quantity} {unit} × ₹{unitPriceRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-navy-950">
                        ₹{(quantity * unitPriceRupees).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">GST Included</span>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transit & Dispatch Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform Commission (5%)
                  </label>
                  <div className="px-3 py-2 bg-slate-100 rounded-xl border border-blue-200/80 text-xs font-mono font-bold text-slate-700">
                    ₹{Math.round(
                      (activeRequest?.items && activeRequest.items.length > 0
                        ? activeRequest.items.reduce((s, i) => s + i.quantity * (boqItemRates[i.id]?.rate || 0), 0)
                        : quantity * unitPriceRupees) * 0.05
                    ).toLocaleString('en-IN')}{' '}
                    (5% Platform Fee)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery & Offloading Terms
                </label>
                <textarea
                  rows={2}
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:bg-white focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Admin Gate Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-blue-200/80 flex items-start gap-2.5 text-xs text-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Admin Approval Required:</strong> Once submitted, this quotation will be checked by GharDesign Quality & Pricing Team to verify market rates before being transmitted to the homeowner.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-gold-400" />
                  <span>Submit to Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- VIEW QUOTATION DETAIL MODAL ---------------- */}
      {selectedQuotationForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200/80 max-w-lg w-full p-6">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold">
                  Quotation Proposal
                </span>
                <h3 className="text-lg font-bold text-navy-950">{selectedQuotationForView.quotationCode}</h3>
              </div>
              <button
                onClick={() => setSelectedQuotationForView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">{selectedQuotationForView.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-900">{selectedQuotationForView.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Site:</span>
                  <span className="font-semibold text-slate-900">{selectedQuotationForView.deliveryLocation}</span>
                </div>
              </div>

              <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Item:</span>
                  <span className="font-bold text-navy-950">{selectedQuotationForView.materialItem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Volume:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedQuotationForView.quantity} {selectedQuotationForView.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quoted Rate:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(selectedQuotationForView.quotedUnitPricePaise)} / {selectedQuotationForView.unit}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200/80">
                  <span className="font-bold text-navy-950">Total Gross:</span>
                  <span className="font-mono font-bold text-navy-950 text-sm">
                    {formatINR(selectedQuotationForView.quotedTotalPaise)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80">
                <span className="text-slate-500 block mb-1">Offloading & Dispatch Terms:</span>
                <p className="text-slate-800 italic">{selectedQuotationForView.deliveryTerms}</p>
              </div>

              {selectedQuotationForView.adminFeedback && (
                <div className="p-3 bg-amber-50 rounded-xl border border-blue-200 text-amber-900">
                  <strong className="block text-[11px] font-bold">Admin Feedback Note:</strong>
                  <p className="mt-0.5">{selectedQuotationForView.adminFeedback}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedQuotationForView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
