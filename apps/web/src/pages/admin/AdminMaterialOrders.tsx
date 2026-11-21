import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatRupees, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  Building,
  RotateCcw,
  AlertCircle,
  Download,
  Calendar,
  Phone,
  User,
  Plus,
  Layers,
  Sparkles,
  ShieldCheck,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import {
  registerNewCustomer,
  incrementCustomerActivity,
  broadcastStoreUpdate,
} from '../../data/customerStore.js';
import {
  getVendorMaterialRequests,
  getVendorQuotations,
  VendorMaterialRequest,
  VendorMaterialQuotation,
} from '../../data/vendorStore.js';

export interface AdminOrderRecord {
  id: string;
  orderCode: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    name: string;
    brand?: string;
    quantity: number;
    unit: string;
    unitPricePaise: number;
    totalPaise?: number;
    imageUrl?: string;
    variantName?: string;
  }>;
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  totalAmountPaise: number;
  deliveryAddress: {
    id?: string;
    label?: string;
    houseNo: string;
    street: string;
    locality?: string;
    city: string;
    state: string;
    pinCode: string;
    landmark?: string;
    phone?: string;
    customerName?: string;
  };
  paymentMethod: string;
  paymentStatus: 'PAYMENT_SUCCESSFUL' | 'PENDING_COLLECTION' | 'REFUNDED' | 'FAILED';
  fulfillmentStatus: 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  associatedProject?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  trackingNumber?: string;
  trackingSteps?: Array<{
    status: string;
    date: string;
    completed: boolean;
  }>;
}

// Zero hardcoded dummy orders. Only real customer purchases are loaded!
const DEFAULT_ORDERS: AdminOrderRecord[] = [];

export const AdminMaterialOrders: React.FC = () => {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [orderStep, setOrderStep] = useState<number>(1);

  // Tab Switcher between Retail Orders and Bulk BOQ Procurement Bids
  const [activeMainTab, setActiveMainTab] = useState<'RETAIL_ORDERS' | 'BOQ_BIDS'>('RETAIL_ORDERS');
  const [boqRequests, setBoqRequests] = useState<VendorMaterialRequest[]>([]);
  const [vendorQuotations, setVendorQuotations] = useState<VendorMaterialQuotation[]>([]);
  const [expandedBoqId, setExpandedBoqId] = useState<string | null>(null);
  const [boqSearchQuery, setBoqSearchQuery] = useState('');
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    productName: 'UltraTech Weather Plus Cement 50kg',
    brand: 'UltraTech',
    quantity: 100,
    unit: 'Bags',
    unitPriceRupees: 380,
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    paymentMethod: 'UPI / NetBanking',
    paymentStatus: 'PAYMENT_SUCCESSFUL' as AdminOrderRecord['paymentStatus'],
    fulfillmentStatus: 'CONFIRMED' as AdminOrderRecord['fulfillmentStatus'],
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName.trim()) {
      error('Customer name is required');
      return;
    }
    const cleanPhone = newOrder.customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `GHR-ORD-${year}-${randomCode}`;
    const unitPricePaise = Math.round((newOrder.unitPriceRupees || 0) * 100);
    const subtotalPaise = unitPricePaise * (newOrder.quantity || 1);
    const taxPaise = Math.round(subtotalPaise * 0.18);
    const deliveryFeePaise = 150000; // ₹1,500 hydraulic transit
    const totalAmountPaise = subtotalPaise + taxPaise + deliveryFeePaise;
    const customerId = `usr-cust-${Date.now()}`;

    const created: AdminOrderRecord = {
      id: `ord-${Date.now()}`,
      orderCode,
      customerId,
      customerName: newOrder.customerName.trim(),
      customerPhone: `+91 ${cleanPhone}`,
      items: [
        {
          productId: `prod-${Date.now()}`,
          name: newOrder.productName.trim(),
          brand: newOrder.brand.trim() || 'ISI Certified',
          quantity: Number(newOrder.quantity) || 1,
          unit: newOrder.unit,
          unitPricePaise,
          totalPaise: subtotalPaise,
        },
      ],
      subtotalPaise,
      taxPaise,
      deliveryFeePaise,
      totalAmountPaise,
      deliveryAddress: {
        houseNo: newOrder.houseNo.trim(),
        street: newOrder.street.trim(),
        locality: newOrder.street.trim(),
        city: newOrder.city.trim(),
        state: newOrder.state.trim(),
        pinCode: newOrder.pinCode.trim(),
        customerName: newOrder.customerName.trim(),
        phone: `+91 ${cleanPhone}`,
      },
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      fulfillmentStatus: newOrder.fulfillmentStatus,
      orderDate: new Date().toISOString(),
      associatedProject: 'Residential Site Construction',
    };

    const updated = [created, ...orders];
    setOrders(updated);
    localStorage.setItem('material_orders', JSON.stringify(updated));

    registerNewCustomer({
      id: customerId,
      name: newOrder.customerName.trim(),
      phone: `+91 ${cleanPhone}`,
      housePlotNumber: newOrder.houseNo.trim(),
      streetLocality: newOrder.street.trim(),
      city: newOrder.city.trim(),
      state: newOrder.state.trim(),
      pinCode: newOrder.pinCode.trim(),
      materialOrdersCount: 1,
    });
    incrementCustomerActivity(cleanPhone, 'materialOrdersCount');
    broadcastStoreUpdate('ORDERS_UPDATED', created);

    setShowAddOrderModal(false);
    setNewOrder({
      customerName: '',
      customerPhone: '',
      productName: 'UltraTech Weather Plus Cement 50kg',
      brand: 'UltraTech',
      quantity: 100,
      unit: 'Bags',
      unitPriceRupees: 380,
      houseNo: 'Plot 42',
      street: 'Sector 57, Golf Course Extension',
      city: 'Gurugram',
      state: 'Haryana',
      pinCode: '122002',
      paymentMethod: 'UPI / NetBanking',
      paymentStatus: 'PAYMENT_SUCCESSFUL',
      fulfillmentStatus: 'CONFIRMED',
    });
    success(`Material order ${orderCode} successfully recorded!`);
  };

  // Load orders
  const loadOrders = () => {
    try {
      const stored = localStorage.getItem('material_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realOrders = parsed.filter(
            (o: any) =>
              o.orderCode !== 'GHR-ORD-2026-9042' &&
              o.orderCode !== 'GHR-ORD-2026-8812' &&
              o.customerName !== 'Vikram Malhotra'
          );
          setOrders(realOrders);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setOrders([]);
  };

  const loadBoqData = () => {
    setBoqRequests(getVendorMaterialRequests());
    setVendorQuotations(getVendorQuotations());
  };

  useEffect(() => {
    loadOrders();
    loadBoqData();
    const interval = setInterval(() => {
      loadOrders();
      loadBoqData();
    }, 30000);
    const handleStorage = () => {
      loadOrders();
      loadBoqData();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Update order fulfillment status
  const handleUpdateStatus = (orderId: string, newStatus: AdminOrderRecord['fulfillmentStatus']) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          fulfillmentStatus: newStatus,
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem('material_orders', JSON.stringify(updated));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, fulfillmentStatus: newStatus });
    }
    success(`Order ${selectedOrder?.orderCode || orderId} status updated to ${newStatus}.`);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.fulfillmentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = o.orderCode.toLowerCase().includes(q);
        const matchesName = (o.customerName || o.deliveryAddress?.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (o.customerPhone || o.deliveryAddress?.phone || '').includes(q);
        const matchesCity = (o.deliveryAddress?.city || '').toLowerCase().includes(q);
        const matchesItems = o.items.some((it) => it.name.toLowerCase().includes(q) || (it.brand || '').toLowerCase().includes(q));
        return matchesCode || matchesName || matchesPhone || matchesCity || matchesItems;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);
    const confirmedCount = orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED').length;
    const inTransitCount = orders.filter((o) => o.fulfillmentStatus === 'DISPATCHED').length;
    const deliveredCount = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length;

    return {
      totalSales,
      totalOrders: orders.length,
      confirmedCount,
      inTransitCount,
      deliveredCount,
    };
  }, [orders]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-950">
            Material Orders & E-Commerce Fulfillment ({orders.length})
          </h1>
          <p className="text-xs text-slate-500">
            Monitor customer building material purchases, site delivery logistics, and status progression.
          </p>
        </div>

        <button
          onClick={() => setShowAddOrderModal(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Material Order</span>
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveMainTab('RETAIL_ORDERS')}
          className={`pb-3 font-display font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition ${
            activeMainTab === 'RETAIL_ORDERS'
              ? 'border-navy-950 text-navy-950'
              : 'border-transparent text-slate-500 hover:text-navy-950'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span>Retail Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('BOQ_BIDS')}
          className={`pb-3 font-display font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition ${
            activeMainTab === 'BOQ_BIDS'
              ? 'border-gold-600 text-navy-950 font-black'
              : 'border-transparent text-slate-500 hover:text-navy-950'
          }`}
        >
          <Layers className="w-4 h-4 text-gold-600" />
          <span>Bulk Material Bids & Procurement ({boqRequests.length})</span>
          {boqRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gold-100 text-gold-800">
              {boqRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeMainTab === 'RETAIL_ORDERS' ? (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Material Sales</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {formatINR(stats.totalSales)}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">
            Across {stats.totalOrders} total orders
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Dispatch</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-display">
            {stats.confirmedCount} Orders
          </div>
          <div className="text-[11px] text-slate-400">Warehouse stock allocation</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Transit (Flatbeds)</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-display">
            {stats.inTransitCount} En Route
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">GPS live tracking</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Delivered & Signed Off</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-display">
            {stats.deliveredCount} Completed
          </div>
          <div className="text-[11px] text-slate-400">Challan verified at site</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order code, customer name, phone, city, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="CONFIRMED">Confirmed / Allocated</option>
            <option value="DISPATCHED">In Transit (Dispatched)</option>
            <option value="DELIVERED">Delivered to Site</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden bg-white border border-slate-200 shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-4">Order Code</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4">Delivery Site</th>
                <th className="p-4">Amount & Payment</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No material orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-navy-950">
                      <div
                        onClick={() => setSelectedOrder(ord)}
                        className="cursor-pointer hover:text-blue-600 hover:underline transition"
                        title="Click to inspect order"
                      >
                        {ord.orderCode}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {formatDate(ord.orderDate)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div
                        onClick={() => setSelectedOrder(ord)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer transition"
                        title="Click to inspect order"
                      >
                        {ord.customerName || ord.deliveryAddress?.customerName || 'Homeowner'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {ord.customerPhone || ord.deliveryAddress?.phone || 'Contact on File'}
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate">
                        {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ') || 'Materials'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ord.items?.length || 0} unique item(s)
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-800">
                        {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PIN: {ord.deliveryAddress?.pinCode}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-navy-950 text-sm">
                        {formatINR(ord.totalAmountPaise)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {ord.paymentStatus === 'PAYMENT_SUCCESSFUL' ? '✓ Paid Online' : 'Cash on Delivery'}
                      </div>
                    </td>

                    <td className="p-4">
                      {ord.fulfillmentStatus === 'DELIVERED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
                        </span>
                      ) : ord.fulfillmentStatus === 'DISPATCHED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <Truck className="w-3 h-3 text-blue-600" /> In Transit
                        </span>
                      ) : ord.fulfillmentStatus === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Confirmed
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center gap-1.5 ml-auto border border-blue-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect Order</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
    ) : (
      /* ---------------- ACTIVE TAB 2: BULK MATERIAL BIDS & PROCUREMENT ---------------- */
      <div className="space-y-6">
        {/* BOQ Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total BOQ Inquiries</span>
              <Layers className="w-4 h-4 text-gold-600" />
            </div>
            <div className="text-2xl font-bold text-navy-950 font-display">
              {boqRequests.length}
            </div>
            <div className="text-[11px] text-gold-600 font-semibold">
              Customer Procurement Requests
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Vendor Quotes Received</span>
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 font-display">
              {vendorQuotations.length}
            </div>
            <div className="text-[11px] text-slate-400">
              Itemized Depot Submissions
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Confirmed Orders Placed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-display">
              {boqRequests.filter((r) => r.status === 'CONFIRMED').length}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              Customer Accepted & Dispatched
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Cities</span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 font-display">
              {new Set(boqRequests.map((r) => r.city)).size}
            </div>
            <div className="text-[11px] text-slate-400">
              Multi-City Wholesale Network
            </div>
          </div>
        </div>

        {/* Search Bar for BOQ Inquiries */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search BOQ inquiries by code, customer name, mobile, or city..."
              value={boqSearchQuery}
              onChange={(e) => setBoqSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-gold-600"
            />
          </div>
        </div>

        {/* BOQ Inquiries List */}
        {boqRequests.filter((r) => {
          if (boqSearchQuery.trim()) {
            const q = boqSearchQuery.toLowerCase();
            return (
              r.requestCode.toLowerCase().includes(q) ||
              r.customerName.toLowerCase().includes(q) ||
              r.customerPhone.includes(q) ||
              r.city.toLowerCase().includes(q)
            );
          }
          return true;
        }).length === 0 ? (
          <div className="card bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200 space-y-2">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Bulk Material Procurement Inquiries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Customer inquiries for full civil packages (Cement, Sand, Gitti, Steel, Bricks) will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {boqRequests
              .filter((r) => {
                if (boqSearchQuery.trim()) {
                  const q = boqSearchQuery.toLowerCase();
                  return (
                    r.requestCode.toLowerCase().includes(q) ||
                    r.customerName.toLowerCase().includes(q) ||
                    r.customerPhone.includes(q) ||
                    r.city.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((req) => {
                const quotesForReq = vendorQuotations.filter((q) => q.requestId === req.id);
                const isExpanded = expandedBoqId === req.id;
                const isConfirmed = req.status === 'CONFIRMED';

                return (
                  <div
                    key={req.id}
                    className={`card rounded-2xl border transition overflow-hidden bg-white ${
                      isConfirmed
                        ? 'border-emerald-200 shadow-xs'
                        : isExpanded
                        ? 'border-gold-500/50 shadow-md'
                        : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Header */}
                    <div
                      onClick={() => setExpandedBoqId(isExpanded ? null : req.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-navy-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {req.requestCode}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(req.createdAt)}
                          </span>
                          <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            {req.city}
                          </span>
                          {req.builtUpAreaSqFt && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              {req.builtUpAreaSqFt} sq.ft Package
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-navy-950">
                          {req.materialItem}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Customer: <strong>{req.customerName}</strong></span>
                          </div>
                          {req.customerPhone && (
                            <a
                              href={`tel:${req.customerPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-blue-700 hover:underline font-mono"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{req.customerPhone}</span>
                            </a>
                          )}
                          <div className="text-slate-400">
                            Site: {req.deliverySiteAddress}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          {isConfirmed ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Order Confirmed</span>
                            </div>
                          ) : quotesForReq.length > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-800 text-xs font-bold border border-gold-500/40">
                              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                              <span>{quotesForReq.length} Vendor Quotes Received</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Awaiting Depot Quotations</span>
                            </div>
                          )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                        {/* BOQ Items breakdown */}
                        {req.items && req.items.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              Required Bill of Quantities (BOQ):
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {(req.items || []).map((it, idx) => (
                                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-[10px] text-slate-400 block truncate">{it.name}</span>
                                  <span className="font-mono font-bold text-navy-950 text-xs">
                                    {it.quantity.toLocaleString()} {it.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Selected Vendor Callout */}
                        {req.selectedVendorName && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Homeowner Selected: <strong>{req.selectedVendorName}</strong></span>
                            </div>
                            <span className="text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                              Order Active in Retail Orders Tab
                            </span>
                          </div>
                        )}

                        {/* Vendor Quotations Received */}
                        <div className="space-y-2 pt-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                            <span>Depot Quotations Submitted ({quotesForReq.length}):</span>
                          </div>

                          {quotesForReq.length === 0 ? (
                            <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                              No city depots have submitted quotations for this inquiry yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {quotesForReq.map((q) => {
                                const total = q.grandTotal || (q.quotedTotalPaise ? q.quotedTotalPaise / 100 : 0);
                                const isSelected = q.status === 'ACCEPTED' || req.selectedQuotationId === q.id;

                                return (
                                  <div
                                    key={q.id}
                                    className={`p-4 rounded-xl border space-y-3 bg-white ${
                                      isSelected
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                        : 'border-slate-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-bold text-navy-950 text-sm flex items-center gap-1.5">
                                          <span>{q.vendorBusinessName || q.vendorName}</span>
                                          {isSelected && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                              CUSTOMER SELECTED
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-slate-500 text-[11px]">
                                          {q.vendorCity || req.city} • Rating: ⭐ {q.vendorRating || 4.8}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-mono font-black text-navy-950 text-base">
                                          {formatRupees(total)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block font-sans">
                                          Within {q.deliveryDays} Days
                                        </span>
                                      </div>
                                    </div>

                                    {/* Item rates */}
                                    {q.itemPrices && q.itemPrices.length > 0 && (
                                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                                        {(q.itemPrices || []).map((ip, idx) => (
                                          <div key={idx} className="flex justify-between">
                                            <span className="text-slate-600 truncate pr-2">
                                              {ip.itemName} {ip.brandOffered ? `(${ip.brandOffered})` : ''}
                                            </span>
                                            <span className="font-mono font-semibold text-slate-900 shrink-0">
                                              {formatRupees(ip.totalAmount)}
                                            </span>
                                          </div>
                                        ))}
                                        <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-slate-700">
                                          <span>Freight & Transit:</span>
                                          <span className="font-mono">{q.freightDeliveryCharge ? formatRupees(q.freightDeliveryCharge) : 'Included'}</span>
                                        </div>
                                      </div>
                                    )}

                                    <div className="text-[11px] text-slate-500 italic">
                                      Terms: "{q.deliveryTerms}"
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    )}

      {/* Order Full Detail & Status Dispatch Modal */}
      {selectedOrder && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          {/* Top Luminous Ambient Shining Edge */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />

          {/* Sticky Full-Page Header */}
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Material Orders</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                      {selectedOrder.orderCode}
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                      {selectedOrder.fulfillmentStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Placed: {formatDate(selectedOrder.orderDate)} • {selectedOrder.customerName || selectedOrder.deliveryAddress?.customerName || 'Registered Homeowner'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Delivery Logistics Status Updater */}
              <div className="hidden sm:flex items-center gap-2 bg-navy-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                <select
                  value={selectedOrder.fulfillmentStatus}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="CONFIRMED" className="bg-navy-950 text-white">Confirmed / Allocated</option>
                  <option value="DISPATCHED" className="bg-navy-950 text-white">Dispatched (En Route)</option>
                  <option value="DELIVERED" className="bg-navy-950 text-white">Delivered to Site</option>
                  <option value="CANCELLED" className="bg-navy-950 text-white">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Full Page Body */}
          <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Top 4 KPI Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Order Value</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {formatINR(selectedOrder.totalAmountPaise)}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {selectedOrder.paymentStatus === 'PAYMENT_SUCCESSFUL' ? '✓ Paid via Escrow' : 'Payment Pending'}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Ordered Items</span>
                <div className="text-2xl font-black font-display text-blue-700 mt-1">
                  {selectedOrder.items?.length || 0} Products
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Civil Construction Supplies</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Mode</span>
                <div className="text-base font-black font-display text-slate-900 mt-1.5">Direct Site Crane</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hydraulic Offloading</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Destination City</span>
                <div className="text-2xl font-black font-display text-navy-950 mt-1">
                  {selectedOrder.deliveryAddress?.city || 'NCR'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{selectedOrder.deliveryAddress?.pinCode || ''}</div>
              </div>
            </div>

            {/* 2-Column Wide Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 Cols) - Delivery Location & Customer */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Site Delivery & Buyer Information</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Customer / Homeowner</span>
                      <span className="font-bold text-navy-950 text-sm block">
                        {selectedOrder.customerName || selectedOrder.deliveryAddress?.customerName || 'Registered Homeowner'}
                      </span>
                      <span className="font-mono text-slate-600 text-xs">
                        {selectedOrder.customerPhone || selectedOrder.deliveryAddress?.phone || 'Contact on file'}
                      </span>
                      {selectedOrder.customerEmail && (
                        <span className="text-[11px] text-slate-500 block truncate">{selectedOrder.customerEmail}</span>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Site Delivery Address</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {selectedOrder.deliveryAddress?.houseNo}, {selectedOrder.deliveryAddress?.street || selectedOrder.deliveryAddress?.locality}
                      </div>
                      {selectedOrder.deliveryAddress?.landmark && (
                        <div className="text-slate-500 text-[11px]">Landmark: {selectedOrder.deliveryAddress.landmark}</div>
                      )}
                      <div className="text-slate-600 font-mono">
                        {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pinCode}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Associated Project</span>
                      <div className="font-bold text-navy-950 text-xs mt-0.5">
                        {selectedOrder.associatedProject || 'Residential Construction Site'}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                      <span className="text-[10px] text-blue-800 uppercase font-bold block">
                        Update Fulfillment Status
                      </span>
                      <select
                        value={selectedOrder.fulfillmentStatus}
                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-blue-300 bg-white text-blue-950 focus:outline-none cursor-pointer"
                      >
                        <option value="CONFIRMED">Confirmed / Allocated</option>
                        <option value="DISPATCHED">Dispatched (En Route)</option>
                        <option value="DELIVERED">Delivered to Site</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols) - Ordered Items & Financial Summary */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <span>Ordered Construction Materials</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                        {selectedOrder.items?.length || 0}
                      </span>
                    </h3>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedOrder.items?.map((it, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3.5">
                          {it.imageUrl && (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{it.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Brand: <span className="font-semibold text-slate-700">{it.brand || 'ISI Certified'}</span> • Unit: {it.unit}
                            </div>
                            <div className="text-[11px] text-blue-700 font-semibold font-mono mt-0.5">
                              Quantity: {it.quantity} {it.unit} @ {formatINR(it.unitPricePaise || 0)} / {it.unit}
                            </div>
                          </div>
                        </div>
                        <div className="font-black text-navy-950 font-display text-base text-right">
                          {formatINR(it.totalPaise || (it.unitPricePaise ? it.unitPricePaise * it.quantity : 0))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Bill Summary */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-sans">
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Materials Subtotal:</span>
                      <span className="font-mono font-semibold">{formatINR(selectedOrder.subtotalPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>GST (18% Civil Construction Supplies):</span>
                      <span className="font-mono font-semibold">{formatINR(selectedOrder.taxPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Hydraulic Transit & Safety Crane Offloading:</span>
                      <span className="font-mono font-semibold">{formatINR(selectedOrder.deliveryFeePaise)}</span>
                    </div>
                    <div className="flex justify-between font-black text-navy-950 text-base pt-3 border-t border-slate-200">
                      <span>Grand Total Order Value:</span>
                      <span className="text-blue-900 font-display text-xl">
                        {formatINR(selectedOrder.totalAmountPaise)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Material Order Creation Modal (Stepper Wizard) */}
      {showAddOrderModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddOrderModal(false);
                  setOrderStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Create Direct Material Order
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {orderStep} of 4 • Wholesale Building Materials Fulfillment
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddOrderModal(false);
                  setOrderStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { step: 1, title: 'Customer & Site', icon: User },
                  { step: 2, title: 'Materials & Specs', icon: Package },
                  { step: 3, title: 'Payment & Logistics', icon: Truck },
                  { step: 4, title: 'Review & Dispatch', icon: CheckCircle2 },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < orderStep) setOrderStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          orderStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : orderStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {orderStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          orderStep === item.step
                            ? 'text-blue-900'
                            : orderStep > item.step
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mb-5 transition ${
                          orderStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateOrder}>
                {/* STEP 1: CUSTOMER & SITE */}
                {orderStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Homeowner & Unloading Site Destination
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify customer name, verified delivery mobile, and exact site GPS destination.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Customer Full Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newOrder.customerName}
                          onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Customer Mobile Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit number"
                            value={newOrder.customerPhone}
                            onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Plot / House No. <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newOrder.houseNo}
                          onChange={(e) => setNewOrder({ ...newOrder, houseNo: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Street / Sector <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newOrder.street}
                          onChange={(e) => setNewOrder({ ...newOrder, street: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">City <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newOrder.city}
                          onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">PIN Code <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder=""
                          value={newOrder.pinCode}
                          onChange={(e) => setNewOrder({ ...newOrder, pinCode: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: MATERIALS & SPECS */}
                {orderStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Building Materials & Bill of Quantities
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select product SKU, manufacturer brand, quantity, and unit rate.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Product / Material Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newOrder.productName}
                          onChange={(e) => setNewOrder({ ...newOrder, productName: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Manufacturer / Brand</label>
                        <input
                          type="text"
                          placeholder=""
                          value={newOrder.brand}
                          onChange={(e) => setNewOrder({ ...newOrder, brand: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Order Quantity <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min="1"
                          value={newOrder.quantity}
                          onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Unit of Measure</label>
                        <select
                          value={newOrder.unit}
                          onChange={(e) => setNewOrder({ ...newOrder, unit: e.target.value })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="Bags">Bags (50kg)</option>
                          <option value="Tonnes">Tonnes (MT)</option>
                          <option value="Pieces">Pieces / Blocks</option>
                          <option value="Brass">Brass (100 cu ft)</option>
                          <option value="Sq.Ft">Sq. Ft (Tiles/Granite)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-bold text-slate-800 text-sm">Unit Wholesale Price (₹) <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={newOrder.unitPriceRupees}
                            onChange={(e) => setNewOrder({ ...newOrder, unitPriceRupees: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT & LOGISTICS */}
                {orderStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Fulfillment Gateway & Dispatch Status
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set payment collection state and warehouse fulfillment priority.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Payment Status <span className="text-rose-500">*</span></label>
                        <select
                          value={newOrder.paymentStatus}
                          onChange={(e) => setNewOrder({ ...newOrder, paymentStatus: e.target.value as any })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="PAYMENT_SUCCESSFUL">Payment Successful (Prepaid Online)</option>
                          <option value="PENDING_COLLECTION">Pending Collection (COD / Escrow Pending)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 text-sm">Delivery Status <span className="text-rose-500">*</span></label>
                        <select
                          value={newOrder.fulfillmentStatus}
                          onChange={(e) => setNewOrder({ ...newOrder, fulfillmentStatus: e.target.value as any })}
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="CONFIRMED">CONFIRMED (Allocated at Warehouse)</option>
                          <option value="DISPATCHED">DISPATCHED (In Transit on Flatbed)</option>
                          <option value="DELIVERED">DELIVERED (Offloaded at Site)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & DISPATCH */}
                {orderStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 4 of 4</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Commercial Invoice Breakdown & Order Dispatch
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review materials consignment totals and confirm order creation.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                        <p className="text-sm font-bold text-navy-950 mt-0.5">{newOrder.customerName} (+91 {newOrder.customerPhone})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Consignment Item</span>
                        <p className="text-sm font-bold text-blue-900 mt-0.5">{newOrder.productName} ({newOrder.brand})</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Quantity & Rate</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{newOrder.quantity} {newOrder.unit} @ ₹{newOrder.unitPriceRupees}/{newOrder.unit}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery Site</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{newOrder.houseNo}, {newOrder.street}, {newOrder.city} ({newOrder.pinCode})</p>
                      </div>
                    </div>

                    {/* Financial Totals */}
                    <div className="p-5 bg-navy-950 text-white rounded-2xl space-y-2 text-xs font-mono shadow-lg">
                      <div className="flex justify-between text-slate-300">
                        <span>Materials Subtotal:</span>
                        <span>{formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 100))}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>GST (18% Construction Goods):</span>
                        <span>{formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 18))}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Hydraulic Flatbed Offloading:</span>
                        <span>{formatINR(150000)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-700 text-amber-400">
                        <span>Total Payable Value:</span>
                        <span className="text-base font-bold">
                          {formatINR(Math.round((newOrder.unitPriceRupees || 0) * (newOrder.quantity || 1) * 118 + 150000))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {orderStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setOrderStep(orderStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddOrderModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {orderStep} of 4
                  </div>

                  {orderStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (orderStep === 1) {
                          if (!newOrder.customerName.trim()) {
                            error('Please enter the customer name');
                            return;
                          }
                          const clean = newOrder.customerPhone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        } else if (orderStep === 2) {
                          if (!newOrder.productName.trim()) {
                            error('Please enter the product name');
                            return;
                          }
                        }
                        setOrderStep(orderStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {orderStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Record & Dispatch Order</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
