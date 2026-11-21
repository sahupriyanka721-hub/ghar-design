import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { MaterialOrder } from '@ghar-design/shared';
import { TaxInvoiceModal } from '../../components/materials/TaxInvoiceModal.js';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  RotateCcw,
  Eye,
  X,
  FileText,
  MapPin,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CreditCard,
  Building,
  Navigation,
  Ban,
  FileCheck,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const MyPurchases: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter & Search
  const [statusTab, setStatusTab] = useState<'ALL' | 'DISPATCHED' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable live tracker
  const [expandedTrackingOrderId, setExpandedTrackingOrderId] = useState<string | null>(null);

  // Modals
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState<MaterialOrder | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<MaterialOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<MaterialOrder | null>(null);

  // Forms
  const [returnReason, setReturnReason] = useState('Offloading damage / torn bags');
  const [returnNotes, setReturnNotes] = useState('');
  const [actionDoneMsg, setActionDoneMsg] = useState('');

  // Load orders: Fetch from API and merge with localStorage
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      let loaded: MaterialOrder[] = [];

      // 1. Check localStorage first
      const storedOrdersJson = localStorage.getItem('material_orders');
      if (storedOrdersJson) {
        try {
          const parsed = JSON.parse(storedOrdersJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
            loaded = parsed.filter((o: any) => {
              // Exclude dummy legacy records
              if (o.customerId === 'usr-cust-1' || o.customerName?.toLowerCase().includes('vikram') || o.customerPhone?.includes('9876543220')) return false;
              if (user?.id && o.customerId === user.id) return true;
              if (rawUserPhone) {
                const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
                if (oPhone && oPhone === rawUserPhone) return true;
              }
              if (user?.name && o.customerName && o.customerName.toLowerCase() === user.name.toLowerCase()) return true;
              return false;
            });
          }
        } catch {
          // ignore
        }
      }

      // 2. Fetch from backend API
      try {
        const res = await apiRequest('/customer/materials/orders');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiOrders = res.data;
          const existingCodes = new Set(loaded.map((o) => o.orderCode));
          for (const apiOrd of apiOrders) {
            if (
              !existingCodes.has(apiOrd.orderCode) &&
              apiOrd.customerId !== 'usr-cust-1' &&
              !apiOrd.customerName?.toLowerCase().includes('vikram') &&
              !apiOrd.customerPhone?.includes('9876543220')
            ) {
              loaded.push(apiOrd);
            }
          }
        }
      } catch {
        // Fallback for client builds
      }

      setOrders(loaded);
      if (loaded.length > 0) {
        setExpandedTrackingOrderId(loaded[0].id);
      }
      setLoading(false);
    };

    loadOrders();
  }, [user?.phone, user?.id]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Tab filter
      if (statusTab === 'CONFIRMED' && ord.fulfillmentStatus !== 'CONFIRMED' && ord.fulfillmentStatus !== 'PROCESSING') {
        return false;
      }
      if (statusTab === 'DISPATCHED' && ord.fulfillmentStatus !== 'DISPATCHED' && ord.fulfillmentStatus !== 'OUT_FOR_DELIVERY') {
        return false;
      }
      if (statusTab === 'DELIVERED' && ord.fulfillmentStatus !== 'DELIVERED') {
        return false;
      }
      if (statusTab === 'CANCELLED' && ord.fulfillmentStatus !== 'CANCELLED' && (ord.fulfillmentStatus as any) !== 'RETURN_REQUESTED') {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = ord.orderCode.toLowerCase().includes(q);
        const matchTracking = (ord.trackingNumber || '').toLowerCase().includes(q);
        const matchItems = ord.items.some((it) => it.name.toLowerCase().includes(q));
        const matchAddress = (ord.deliveryAddress?.city || '').toLowerCase().includes(q) || (ord.deliveryAddress?.street || '').toLowerCase().includes(q);
        return matchCode || matchTracking || matchItems || matchAddress;
      }

      return true;
    });
  }, [orders, statusTab, searchQuery]);

  // Handle Order Cancellation
  const handleConfirmCancel = (orderToCancel: MaterialOrder) => {
    const updated = orders.map((o) =>
      o.id === orderToCancel.id ? { ...o, fulfillmentStatus: 'CANCELLED' as const } : o
    );
    setOrders(updated);
    localStorage.setItem('material_orders', JSON.stringify(updated));
    setCancelModalOrder(null);
    setActionDoneMsg(`Order ${orderToCancel.orderCode} has been cancelled. Any pre-authorized charges will reverse within 24-48 hours.`);
  };

  // Handle Return Claim Submission
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    const updated = orders.map((o) =>
      o.id === returnModalOrder.id ? { ...o, fulfillmentStatus: 'RETURN_REQUESTED' as any } : o
    );
    setOrders(updated);
    localStorage.setItem('material_orders', JSON.stringify(updated));
    setActionDoneMsg(
      `Return / Quality Claim registered for ${returnModalOrder.orderCode}. GharDesign Site Engineer will inspect the material on-site within 24 hours.`
    );
    setReturnModalOrder(null);
    setReturnNotes('');
  };

  return (
    <div className="space-y-6 text-xs pb-16 font-sans">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        <Link to="/dashboard" className="hover:text-navy-950 transition">Dashboard</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">Material Management</span>
        <span className="text-slate-300">/</span>
        <span className="text-navy-950 font-bold">My Purchase</span>
      </div>

      {/* Top Header */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold uppercase tracking-wider text-[11px] mb-2 font-mono">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Direct Material Fulfillment & Transit Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-navy-950">
              My Material Orders & <span className="text-blue-700">Site Dispatches</span>
            </h1>
            <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time multi-axle freight tracking, weighbridge receipts, computerized GST Tax Invoices, and offloading assurance for your construction materials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-white/90 border border-blue-200/90 rounded-2xl text-center shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Site Orders</div>
              <div className="text-xl font-display font-black text-blue-700 mt-0.5">{orders.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionDoneMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionDoneMsg}</span>
          </div>
          <button onClick={() => setActionDoneMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar & Status Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID (e.g. GHR-ORD-2026-9042), product name, or tracking code..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-navy-900 focus:bg-white transition"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Purchases' },
            { id: 'DISPATCHED', label: 'In Transit / Dispatched' },
            { id: 'CONFIRMED', label: 'Confirmed / Mill Allocation' },
            { id: 'DELIVERED', label: 'Delivered at Site' },
            { id: 'CANCELLED', label: 'Cancelled / Returned' },
          ].map((tab) => {
            const isSelected = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-navy-950 text-gold-400 border-navy-950 shadow-md shadow-navy-950/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
            <Package className="w-14 h-14 mx-auto text-slate-300" />
            <p className="font-display font-bold text-base text-slate-800">No material orders found</p>
            <p className="text-xs max-w-sm mx-auto">
              You don't have any orders matching the selected status filter or search keyword.
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isTrackingExpanded = expandedTrackingOrderId === ord.id;
            const isCancellable = ord.fulfillmentStatus === 'CONFIRMED' || ord.fulfillmentStatus === 'PROCESSING';

            // Delivery Status Pill Styling
            let badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
            if (ord.fulfillmentStatus === 'DELIVERED') {
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            } else if (ord.fulfillmentStatus === 'DISPATCHED' || ord.fulfillmentStatus === 'OUT_FOR_DELIVERY') {
              badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
            } else if (ord.fulfillmentStatus === 'CANCELLED') {
              badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
            } else if ((ord.fulfillmentStatus as any) === 'RETURN_REQUESTED') {
              badgeBg = 'bg-purple-100 text-purple-800 border-purple-200';
            }

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-navy-950 text-gold-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-navy-950 text-base">
                          {ord.orderCode}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                          {ord.fulfillmentStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Ordered on {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-700">
                          Tracking: <strong className="text-navy-950">{ord.trackingNumber || 'TRANSIT-DIRECT'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total & Payment Badge */}
                  <div className="text-left sm:text-right flex flex-col sm:items-end">
                    <div className="text-xl font-display font-black text-navy-950">
                      ₹{(ord.totalAmountPaise / 100).toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{ord.paymentStatus === 'PAYMENT_SUCCESSFUL' ? 'PAID (18% ITC)' : 'COD PENDING'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {ord.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Ordered Building Materials ({ord.items.length} Lines)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(ord.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3"
                      >
                        <img
                          src={it.imageUrl}
                          alt={it.name}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-navy-950 truncate">{it.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Qty: <strong className="text-slate-800">{it.quantity} {it.unit}</strong>
                          </div>
                          <div className="font-display font-black text-xs text-navy-950 mt-1">
                            ₹{(it.totalPaise / 100).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Offloading Destination Banner */}
                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-gold-600 shrink-0" />
                      <span>
                        Project Site Destination:{' '}
                        <strong className="text-slate-800">
                          {ord.deliveryAddress?.houseNo}, {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city} ({ord.deliveryAddress?.pinCode})
                        </strong>
                      </span>
                    </div>

                    <div className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Est. Site Arrival:{' '}
                        <strong className="text-navy-950">
                          {new Date(ord.expectedDeliveryDate || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* 10-Stage Dispatch Timeline Accordion Trigger */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedTrackingOrderId(isTrackingExpanded ? null : ord.id)}
                      className="w-full px-4 py-3 bg-slate-100/70 hover:bg-slate-100 flex items-center justify-between text-left transition"
                    >
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-navy-950" />
                        <span className="font-bold text-xs text-navy-950">
                          10-Stage Live Dispatch & Offload Tracking
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-gold-500/20 text-navy-950 font-bold rounded-md">
                          Live Satellite GPS
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <span>{isTrackingExpanded ? 'Hide Timeline' : 'View Full Timeline'}</span>
                        {isTrackingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Timeline Expanded Content */}
                    {isTrackingExpanded && (
                      <div className="p-5 bg-white space-y-4 border-t border-slate-200">
                        {/* Driver & Transit Vehicle Info */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gold-600" />
                            <span>
                              Transit Vehicle: <strong className="text-navy-950 font-mono">HR-26-EE-9042 (Hydraulic Flatbed)</strong>
                            </span>
                          </div>
                          <div>
                            Driver In-Charge: <strong className="text-slate-800">Surender Singh (+91 98112-88210)</strong>
                          </div>
                          <div className="text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>GPS Signal Active</span>
                          </div>
                        </div>

                        {/* 10-Milestone Step Track */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                          {(ord.trackingSteps || []).map((step, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                                step.completed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[9px] font-bold">
                                  Stage {idx + 1}
                                </span>
                                {step.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                )}
                              </div>
                              <div className="font-bold text-[10px] leading-tight line-clamp-2">
                                {step.status}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-2 font-mono">
                                {step.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer Bar */}
                <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Need on-site assistance? Call Dispatch Hub: <strong className="text-slate-800">1800-419-GHAR</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Tax Invoice Modal */}
                    <button
                      onClick={() => setTaxInvoiceOrder(ord)}
                      className="px-3.5 py-2 bg-navy-950 hover:bg-gold-500 hover:text-navy-950 text-gold-400 font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs font-display text-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download GST Tax Invoice</span>
                    </button>

                    {/* Return / Claim */}
                    <button
                      onClick={() => setReturnModalOrder(ord)}
                      className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Report Damage / Claim</span>
                    </button>

                    {/* Cancellation (if permitted) */}
                    {isCancellable && (
                      <button
                        onClick={() => setCancelModalOrder(ord)}
                        className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold rounded-xl transition flex items-center gap-1 text-xs"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official GST Tax Invoice Modal */}
      {taxInvoiceOrder && (
        <TaxInvoiceModal
          order={taxInvoiceOrder}
          onClose={() => setTaxInvoiceOrder(null)}
        />
      )}

      {/* Damage / Quality Claim Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  GharDesign Direct Quality Assurance
                </span>
                <h3 className="font-display font-black text-base text-navy-950 mt-0.5">
                  Report Offloading Damage / Return
                </h3>
                <div className="text-[11px] font-mono text-slate-500">{returnModalOrder.orderCode}</div>
              </div>
              <button onClick={() => setReturnModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Damaged bags, bent steel rebar, or broken tiles can be claimed for full replacement within 48 hours of site delivery with zero questions asked.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Offloading damage / torn bags">Offloading damage / torn bags</option>
                  <option value="Moisture lumps / hardened cement">Moisture lumps / hardened cement</option>
                  <option value="Surface rust / deformed rebar ribs">Surface rust / deformed rebar ribs</option>
                  <option value="Chipped vitrified tile edges">Chipped vitrified tile edges</option>
                  <option value="Quantity short in delivery challan">Quantity short in delivery challan</option>
                  <option value="Wrong grade / variant delivered">Wrong grade / variant delivered</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description & Quantity Affected</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-display font-black rounded-xl shadow-xs"
                >
                  Submit Return Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-black text-base text-navy-950">Cancel Material Order?</h3>
              <button onClick={() => setCancelModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel order <strong>{cancelModalOrder.orderCode}</strong>? Because the order has not yet been loaded onto transit trucks, full cancellation and refund is permitted.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleConfirmCancel(cancelModalOrder)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-display font-black rounded-xl shadow-xs"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
