import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorOrders,
  updateVendorOrderStatus,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Eye,
  X,
  Search,
  Filter,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  Printer,
  Navigation,
  RotateCcw,
  Ban,
  ArrowRight,
  Package,
  Layers,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react';

export const VendorOrders: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal for status & dispatch update
  const [statusModalOrder, setStatusModalOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('PROCESSING');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  // Printable slip view
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadOrders = () => {
    const list = getVendorOrders(user?.phone || vendorRecord?.id);
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [user?.phone, vendorRecord?.id]);

  // Status Filter Tabs
  const statusTabs = [
    { label: 'All Orders', value: 'ALL', count: orders.length },
    {
      label: 'New Orders',
      value: 'CONFIRMED',
      count: orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'NEW').length,
    },
    {
      label: 'Processing',
      value: 'PROCESSING',
      count: orders.filter((o) => o.fulfillmentStatus === 'PROCESSING').length,
    },
    {
      label: 'Dispatched',
      value: 'DISPATCHED',
      count: orders.filter((o) => o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'OUT_FOR_DELIVERY').length,
    },
    {
      label: 'Delivered',
      value: 'DELIVERED',
      count: orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length,
    },
    {
      label: 'Cancelled / Returned',
      value: 'CANCELLED_OR_RETURN',
      count: orders.filter((o) => o.fulfillmentStatus === 'CANCELLED' || o.fulfillmentStatus === 'RETURNED').length,
    },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (o.customerPhone && o.customerPhone.includes(search));

      if (!matchSearch) return false;

      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'CONFIRMED') return o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'NEW';
      if (filterStatus === 'PROCESSING') return o.fulfillmentStatus === 'PROCESSING';
      if (filterStatus === 'DISPATCHED') return o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'OUT_FOR_DELIVERY';
      if (filterStatus === 'DELIVERED') return o.fulfillmentStatus === 'DELIVERED';
      if (filterStatus === 'CANCELLED_OR_RETURN') return o.fulfillmentStatus === 'CANCELLED' || o.fulfillmentStatus === 'RETURNED';

      return o.fulfillmentStatus === filterStatus;
    });
  }, [orders, search, filterStatus]);

  const handleOpenStatusModal = (ord: any) => {
    setStatusModalOrder(ord);
    setNewStatus(
      ord.fulfillmentStatus === 'CONFIRMED' || ord.fulfillmentStatus === 'NEW'
        ? 'PROCESSING'
        : ord.fulfillmentStatus === 'PROCESSING'
        ? 'DISPATCHED'
        : 'DELIVERED'
    );
    setTrackingNumber(ord.trackingNumber || `TRK-HR-${Math.floor(100000 + Math.random() * 900000)}`);
    setDispatchNote(ord.vendorDispatchNote || 'Offloaded via depot flatbed carrier. Driver signed.');
  };

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    updateVendorOrderStatus(statusModalOrder.id, newStatus, {
      trackingNumber,
      dispatchNote,
    });

    success(`Order ${statusModalOrder.orderCode} updated to ${newStatus}`);
    setStatusModalOrder(null);
    loadOrders();
  };

  const handleQuickAccept = (orderId: string, orderCode: string) => {
    updateVendorOrderStatus(orderId, 'PROCESSING', {
      dispatchNote: 'Accepted by depot manager. Order packing in progress.',
    });
    success(`Sub-Order ${orderCode} accepted for fulfillment!`);
    loadOrders();
  };

  const handleQuickReject = (orderId: string, orderCode: string) => {
    updateVendorOrderStatus(orderId, 'CANCELLED', {
      dispatchNote: 'Rejected due to depot stock unavailability. Homeowner refunded.',
    });
    error(`Sub-Order ${orderCode} marked rejected/cancelled.`);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Customer Order Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multi-vendor sub-orders, stage-by-stage order fulfillment, dispatch slips and customer delivery updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-sky-50/30 border border-blue-200/80 rounded-xl text-xs font-bold text-slate-700">
            Active Sub-Orders: <span className="text-blue-600 font-mono font-black">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  filterStatus === tab.value
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    filterStatus === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-blue-200/80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
              <tr>
                <th className="py-3 px-3.5">Order Ref</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer & Location</th>
                <th className="py-3 px-3">Materials / Items</th>
                <th className="py-3 px-3 text-right">Order Amount</th>
                <th className="py-3 px-3 text-center">Fulfillment Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No orders matching your filter.</p>
                    <p className="text-[11px] mt-0.5">Orders placed by customers will automatically appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isNew = ord.fulfillmentStatus === 'CONFIRMED' || ord.fulfillmentStatus === 'NEW';
                  const isDelivered = ord.fulfillmentStatus === 'DELIVERED';
                  const isCancelled = ord.fulfillmentStatus === 'CANCELLED' || ord.fulfillmentStatus === 'RETURNED';

                  return (
                    <tr key={ord.id} className="hover:bg-blue-50/70 transition">
                      {/* Order Code */}
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-slate-900 text-xs">{ord.orderCode}</div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Prepaid'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(ord.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{ord.deliveryAddress?.city || 'Delhi NCR'}</span>
                        </div>
                      </td>

                      {/* Items summary */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {(ord.items || []).map((i: any) => `${i.name} (${i.quantity} ${i.unit || ''})`).join(', ')}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {(ord.items || []).length} SKU{(ord.items || []).length > 1 ? 's' : ''} listed
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right">
                        <strong className="font-mono font-black text-slate-900 text-sm">
                          {formatINR(ord.totalAmountPaise)}
                        </strong>
                        <span className="text-[10px] text-slate-400 block">
                          Net: {formatINR(Math.round(ord.totalAmountPaise * 0.95))}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isNew
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-blue-200'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 className="w-3 h-3" />}
                          {isCancelled && <Ban className="w-3 h-3" />}
                          {isNew && <Clock className="w-3 h-3" />}
                          {!isDelivered && !isCancelled && !isNew && <Truck className="w-3 h-3" />}
                          <span>{ord.fulfillmentStatus}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isNew && (
                            <>
                              <button
                                onClick={() => handleQuickAccept(ord.id, ord.orderCode)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition"
                                title="Accept Order"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleQuickReject(ord.id, ord.orderCode)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition"
                                title="Reject Order"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {!isDelivered && !isCancelled && !isNew && (
                            <button
                              onClick={() => handleOpenStatusModal(ord)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="View Manifest & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPrintOrder(ord)}
                            className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition"
                            title="Print Dispatch Challan"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: UPDATE LOGISTICS & DISPATCH STATUS */}
      <AnimatePresence>
        {statusModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {statusModalOrder.orderCode}
                  </span>
                  <h3 className="font-bold text-sm text-navy-950 mt-1">Update Fulfillment & Transit</h3>
                </div>
                <button
                  onClick={() => setStatusModalOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Fulfillment Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="PROCESSING">PROCESSING (Mill / Yard Allocation)</option>
                    <option value="DISPATCHED">DISPATCHED (Out on Carrier Vehicle)</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Approaching Site)</option>
                    <option value="DELIVERED">DELIVERED (Offloaded & Delivery Proof Signed)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle / Transit LR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Depot Dispatch Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Driver name, contact number, batch details..."
                    value={dispatchNote}
                    onChange={(e) => setDispatchNote(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/30 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalOrder(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Status</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ORDER DETAILS MANIFEST & TIMELINE */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-xs"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {selectedOrder.orderCode}
                  </span>
                  <h3 className="font-bold text-sm text-navy-950 mt-1">Order Manifest & Fulfillment</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* Customer and Delivery info */}
                <div className="p-3.5 bg-sky-50/30 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Name:</span>
                    <strong className="text-slate-900">{selectedOrder.customerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200/80 pt-2">
                    <span className="text-slate-500">Delivery Address:</span>
                    <span className="text-right text-slate-800 font-medium max-w-xs">
                      {selectedOrder.deliveryAddress?.houseNo} {selectedOrder.deliveryAddress?.street},{' '}
                      {selectedOrder.deliveryAddress?.city} ({selectedOrder.deliveryAddress?.pinCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Prepaid'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Items Ordered</h4>
                  <div className="divide-y divide-slate-100 border border-blue-200/80 rounded-xl overflow-hidden bg-white">
                    {(selectedOrder.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{it.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {it.quantity} {it.unit} @ {formatINR(it.unitPricePaise)} / {it.unit}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-navy-950">
                          {formatINR(it.totalPaise || it.unitPricePaise * it.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="p-3.5 bg-navy-950 text-white rounded-xl space-y-1.5 font-sans">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatINR(selectedOrder.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>GST:</span>
                    <span className="font-mono">{formatINR(selectedOrder.taxPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Shipping Charges:</span>
                    <span className="font-mono">{formatINR(selectedOrder.deliveryFeePaise || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-amber-400 border-t border-navy-800 pt-1.5">
                    <span>Grand Total:</span>
                    <span className="font-mono">{formatINR(selectedOrder.totalAmountPaise)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sky-50/30 border-t border-blue-200/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setPrintOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-navy-950 text-white font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINTABLE DISPATCH CHALLAN SLIP */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-blue-200 text-slate-900 font-sans">
            <div className="border-b border-blue-200 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  BuildGhar Delivery Challan / Dispatch Slip
                </span>
                <h2 className="text-xl font-black text-navy-950">SUB-ORDER DISPATCH SLIP</h2>
                <span className="font-mono font-bold text-xs text-blue-700">{printOrder.orderCode}</span>
              </div>
              <button
                onClick={() => setPrintOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border p-3 rounded-xl bg-sky-50/30">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">SUPPLIED BY</span>
                <strong>{vendorRecord?.businessName || 'BuildGhar Verified Depot'}</strong>
                <p className="text-slate-500 text-[11px]">{vendorRecord?.address?.city || 'Delhi NCR'}</p>
                <p className="text-slate-500 text-[11px]">GSTIN: {vendorRecord?.gstin || '07AAAAA0000A1Z5'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">DELIVER TO</span>
                <strong>{printOrder.customerName}</strong>
                <p className="text-slate-500 text-[11px]">
                  {printOrder.deliveryAddress?.houseNo} {printOrder.deliveryAddress?.street}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {printOrder.deliveryAddress?.city} - {printOrder.deliveryAddress?.pinCode}
                </p>
                <p className="text-slate-500 text-[11px]">Phone: {printOrder.customerPhone}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Item Description</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Unit Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(printOrder.items || []).map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2 font-bold">{it.name}</td>
                    <td className="p-2 text-right font-mono">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="p-2 text-right font-mono">{formatINR(it.unitPricePaise)}</td>
                    <td className="p-2 text-right font-mono font-bold">
                      {formatINR(it.totalPaise || it.unitPricePaise * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block">Driver / Receiver Signature: __________________</span>
                <span className="text-slate-400 text-[10px]">Weighbridge / Dispatch verified by BuildGhar Depot</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Grand Total</span>
                <strong className="text-base font-black font-mono">{formatINR(printOrder.totalAmountPaise)}</strong>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setPrintOrder(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50/30"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-navy-900 transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Challan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
