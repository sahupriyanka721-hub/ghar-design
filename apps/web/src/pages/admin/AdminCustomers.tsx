import React, { useState, useEffect, useMemo } from 'react';
import { formatDate, formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getRegisteredCustomers,
  RegisteredCustomer,
  updateCustomerStatus,
  registerNewCustomer,
  getPlatformRequests,
  syncChannel,
} from '../../data/customerStore.js';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle2,
  ShieldCheck,
  Eye,
  X,
  Building,
  Calendar,
  Sparkles,
  Filter,
  Package,
  CalendarCheck,
  FileText,
  ShoppingBag,
  CreditCard,
  Truck,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'VERIFIED' | 'SUSPENDED'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCustomerStep, setAddCustomerStep] = useState<number>(1);
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    phone: '',
    email: '',
    housePlotNumber: '',
    streetLocality: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122002',
    status: 'VERIFIED' as 'ACTIVE' | 'VERIFIED',
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) {
      error('Customer full name is required');
      return;
    }
    const cleanPhone = newCustForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }
    const created = registerNewCustomer({
      name: newCustForm.name.trim(),
      phone: `+91 ${cleanPhone}`,
      email: newCustForm.email.trim() || 'Not Provided',
      housePlotNumber: newCustForm.housePlotNumber.trim() || 'Site Plot',
      streetLocality: newCustForm.streetLocality.trim() || 'Locality',
      city: newCustForm.city.trim() || 'Gurugram',
      state: newCustForm.state.trim() || 'Haryana',
      pinCode: newCustForm.pinCode.trim() || '122002',
      status: newCustForm.status,
    });
    refreshCustomers();
    setShowAddModal(false);
    setNewCustForm({
      name: '',
      phone: '',
      email: '',
      housePlotNumber: '',
      streetLocality: '',
      city: 'Gurugram',
      state: 'Haryana',
      pinCode: '122002',
      status: 'VERIFIED',
    });
    success(`Customer ${created.name} successfully added!`);
  };

  const [refreshing, setRefreshing] = useState(false);

  // Load dynamically from central customer store
  const refreshCustomers = (manual = false) => {
    const list = getRegisteredCustomers();
    setCustomers(list);
    if (manual) {
      success('Customer directory refreshed.');
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    refreshCustomers(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    refreshCustomers();

    // Auto-refresh silently every 1 minute (60,000 ms)
    const interval = setInterval(() => {
      refreshCustomers(false);
    }, 60000);

    const onSync = (e: MessageEvent) => {
      if (
        e.data?.type === 'CUSTOMERS_UPDATED' ||
        e.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        e.data?.type === 'DATA_PURGED'
      ) {
        refreshCustomers(false);
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    const handleStorageOrGlobal = () => refreshCustomers(false);
    window.addEventListener('storage', handleStorageOrGlobal);
    window.addEventListener('admin_global_refresh', handleStorageOrGlobal);

    return () => {
      clearInterval(interval);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
      window.removeEventListener('storage', handleStorageOrGlobal);
      window.removeEventListener('admin_global_refresh', handleStorageOrGlobal);
    };
  }, []);

  const handleStatusChange = (id: string, newStatus: RegisteredCustomer['status']) => {
    const updated = updateCustomerStatus(id, newStatus);
    setCustomers(updated);
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus });
    }
  };

  // Load material orders placed by selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    try {
      const stored = localStorage.getItem('material_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        const rawTargetPhone = (selectedCustomer.phone || "").replace(/\D/g, '').slice(-10);
        return parsed.filter((o: any) => {
          const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
          return (
            o.customerId === selectedCustomer.id ||
            (rawTargetPhone && oPhone && oPhone === rawTargetPhone) ||
            (o.customerName && selectedCustomer.name && String(o.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
          );
        });
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [selectedCustomer]);

  // Load project requests submitted by selected customer
  const customerRequests = useMemo(() => {
    if (!selectedCustomer) return [];
    try {
      const all = getPlatformRequests();
      const rawTargetPhone = (selectedCustomer.phone || '').replace(/\D/g, '').slice(-10);
      const isGenericName = !selectedCustomer.name || /^(registered homeowner|homeowner|customer|client|user)$/i.test(selectedCustomer.name.trim());

      return all.filter((r: any) => {
        if (!r) return false;
        if (r.customerId && r.customerId === selectedCustomer.id) return true;
        const rPhone = (r.customerPhone || '').replace(/\D/g, '').slice(-10);
        if (rawTargetPhone.length === 10 && rPhone.length === 10 && rPhone === rawTargetPhone) return true;
        if (!isGenericName && r.customerName && selectedCustomer.name && String(r.customerName).trim().toLowerCase() === String(selectedCustomer.name).trim().toLowerCase()) {
          if (rawTargetPhone.length === 10 && rPhone.length === 10 && rPhone !== rawTargetPhone) return false;
          return true;
        }
        return false;
      });
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [selectedCustomer]);

  // Load service bookings placed by selected customer
  const customerBookings = useMemo(() => {
    if (!selectedCustomer) return [];
    try {
      const stored = localStorage.getItem('platform_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        const rawTargetPhone = (selectedCustomer.phone || "").replace(/\D/g, '').slice(-10);
        return parsed.filter((b: any) => {
          const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
          return (
            b.customerId === selectedCustomer.id ||
            (rawTargetPhone && bPhone && bPhone === rawTargetPhone) ||
            (b.customerName && selectedCustomer.name && String(b.customerName).toLowerCase() === String(selectedCustomer.name).toLowerCase())
          );
        });
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [selectedCustomer]);

  // Global activity stores for live counts in table
  const allOrders = useMemo(() => {
    try {
      const stored = localStorage.getItem('material_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [customers]);

  const allBookings = useMemo(() => {
    try {
      const stored = localStorage.getItem('platform_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [customers]);

  const allRequests = useMemo(() => {
    try {
      return getPlatformRequests();
    } catch {
      return [];
    }
  }, [customers]);


  // Sync URL search params with selected customer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const custId = params.get('id');
    if (custId && customers.length > 0) {
      const found = customers.find(
        (c) => c.id === custId || c.phone.replace(/\D/g, '').includes(custId.replace(/\D/g, ''))
      );
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [customers]);

  const handleSelectCustomer = (c: RegisteredCustomer) => {
    setSelectedCustomer(c);
    try {
      window.history.pushState(null, '', `/admin/customers?id=${c.id}`);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSelected = () => {
    setSelectedCustomer(null);
    try {
      window.history.pushState(null, '', '/admin/customers');
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.state.toLowerCase().includes(term) ||
      c.pinCode.includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());

  // =========================================================================
  // 1. FULL-PAGE CUSTOMER PROFILE VIEW (Opens as a proper dedicated page)
  // =========================================================================
  if (selectedCustomer) {
    return (
      <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150 admin-fullscreen-modal">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
        <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={handleClearSelected}
              className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Customer Directory</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                {(selectedCustomer.name || 'CU').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    {selectedCustomer.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCustomer.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {selectedCustomer.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Customer ID: {selectedCustomer.id} • {selectedCustomer.city}, {selectedCustomer.state} • +91 {selectedCustomer.phone}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-navy-900/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedCustomer.status}
                onChange={(e) => handleStatusChange(selectedCustomer.id, e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE" className="bg-navy-900 text-white">ACTIVE</option>
                <option value="VERIFIED" className="bg-navy-900 text-white">VERIFIED</option>
                <option value="SUSPENDED" className="bg-navy-900 text-white">SUSPENDED</option>
              </select>
            </div>
            <button
              onClick={handleClearSelected}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Customer Header Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#1e3d6b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/20 text-gold-400 border-2 border-gold-500/40 flex items-center justify-center font-bold text-2xl font-display shadow-lg">
              {(selectedCustomer.name || "CU").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white">{selectedCustomer.name}</h1>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedCustomer.status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : selectedCustomer.status === 'ACTIVE'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {selectedCustomer.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono mt-1.5">
                <span>Customer ID: {selectedCustomer.id}</span>
                <span>•</span>
                <span>Onboarded: {formatDate(selectedCustomer.registeredAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <a
              href={`tel:${selectedCustomer.phone}`}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
            >
              <Phone className="w-4 h-4" />
              <span>Call {selectedCustomer.phone}</span>
            </a>
            {selectedCustomer.email && (
              <a
                href={`mailto:${selectedCustomer.email}`}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            )}
          </div>
        </div>

        {/* 4 KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total RFQ Requests</span>
            <div className="text-2xl font-black font-display text-blue-700 mt-1">{customerRequests.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Architectural & Structural Inquiries</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Confirmed Bookings</span>
            <div className="text-2xl font-black font-display text-blue-700 mt-1">{customerBookings.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Site Visits & Consultations</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Material Purchases</span>
            <div className="text-2xl font-black font-display text-emerald-700 mt-1">{customerOrders.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Depot Orders Placed</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Spent (GMV)</span>
            <div className="text-2xl font-black font-display text-navy-950 mt-1">
              {formatINR(customerOrders.reduce((sum: number, o: any) => sum + (o.totalAmountPaise || 0), 0))}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Paid via Escrow / Gateway</div>
          </div>
        </div>

        {/* Main 2-Column Wide Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols) - Contact & Address Profile */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Contact Information</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Primary Mobile</span>
                    <span className="font-bold text-navy-950 font-mono text-sm">{selectedCustomer.phone}</span>
                  </div>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Email Address</span>
                    <span className="font-bold text-navy-950 truncate block text-xs">
                      {selectedCustomer.email || 'None'}
                    </span>
                  </div>
                  {selectedCustomer.email && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  )}
                </div>

                {selectedCustomer.alternateContact && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Alternate Contact</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs">
                      {selectedCustomer.alternateContact}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Registered Property Address */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Registered Site & Residence Address</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Street & Plot</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedCustomer.housePlotNumber}, {selectedCustomer.streetLocality}
                  </div>
                </div>

                {selectedCustomer.landmark && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Landmark</span>
                    <div className="text-slate-600 font-medium">{selectedCustomer.landmark}</div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">City & State</span>
                    <div className="text-slate-800 font-bold">
                      {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pinCode}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                    {selectedCustomer.city}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols) - Material Purchases, Project Requests & Bookings */}
          <div className="lg:col-span-7 space-y-6">
            {/* 🛒 Purchased Materials & Orders */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Material Purchases & Orders</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                    {customerOrders.length}
                  </span>
                </h3>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-8 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                  <div className="text-slate-400 font-bold text-xs">No material orders placed yet</div>
                  <p className="text-[11px] text-slate-500">
                    When this customer purchases cement, steel, or sand, items will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {customerOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono font-black text-navy-950 text-sm">{ord.orderCode}</div>
                          <span className="text-[11px] text-slate-400">{formatDate(ord.orderDate)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-base text-navy-950 block">
                            {formatINR(ord.totalAmountPaise)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                            {ord.paymentStatus === 'PAYMENT_SUCCESSFUL' ? '✓ Paid via Escrow' : 'Cash on Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-slate-200 divide-y divide-slate-100">
                          {(ord.items || []).map((it: any, iIdx: number) => (
                            <div key={iIdx} className="py-1.5 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800">
                                {it.name}{' '}
                                <span className="text-slate-500 font-normal">
                                  ({it.quantity} {it.unit})
                                </span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatINR(
                                  it.totalPaise ||
                                    (it.unitPricePaise ? it.unitPricePaise * it.quantity : 0)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {ord.associatedProject && (
                        <div className="text-xs text-slate-500">
                          Linked Project: <span className="font-bold text-navy-950">{ord.associatedProject}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📋 Project Quotation Requests */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Submitted Project RFQ Requests</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                    {customerRequests.length}
                  </span>
                </h3>
              </div>

              {customerRequests.length === 0 ? (
                <div className="p-8 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                  <div className="text-slate-400 font-bold text-xs">No project requests submitted yet</div>
                  <p className="text-[11px] text-slate-500">
                    Custom villa and duplex RFQs will appear here once submitted.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-black text-navy-950 text-sm">
                          {req.requestCode || req.id}
                        </div>
                        <div className="text-slate-800 font-bold text-xs capitalize mt-0.5">
                          {req.categorySlug?.replace(/-/g, ' ') || 'Turnkey Construction & Design'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {req.plotArea} sq ft • {req.city || 'Gurugram'}, {req.state || 'Haryana'}
                        </div>
                        {req.budgetRange && (
                          <div className="text-[11px] font-semibold text-blue-800 mt-0.5">
                            Budget: {req.budgetRange}
                          </div>
                        )}
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                          ₹499 Fee Paid
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📅 Confirmed Bookings & Consultations */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-navy-950 text-sm font-display flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Confirmed Bookings & Consultations</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                    {customerBookings.length}
                  </span>
                </h3>
              </div>

              {customerBookings.length === 0 ? (
                <div className="p-8 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                  <div className="text-slate-400 font-bold text-xs">No service bookings placed yet</div>
                  <p className="text-[11px] text-slate-500">
                    Architect and engineer walkthrough bookings will be listed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerBookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-black text-navy-950 text-sm">{b.bookingCode}</div>
                        <div className="text-slate-800 font-bold text-xs mt-0.5">{b.serviceTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Visit: {b.visitDate ? formatDate(b.visitDate) : 'On Call'} •{' '}
                          {b.visitTimeSlot || 'Standard Slot'}
                        </div>
                        {b.siteAddress && (
                          <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                            {b.siteAddress}
                          </div>
                        )}
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-black text-navy-950 font-display text-sm block">
                          {formatINR(b.totalAmountPaise)}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 inline-block mt-1">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN CUSTOMER DIRECTORY TABLE
  // =========================================================================

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Live Homeowner Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-navy-950 mt-1">
            Registered Customers ({customers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time directory of all homeowners registered via customer onboarding, site inquiries, and mobile OTP.
          </p>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, phone, city, PIN..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
            title="Auto-refreshes every 1 minute. Click to refresh immediately."
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-display">
              <tr>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Complete Location</th>
                <th className="p-4">Project Requests</th>
                <th className="p-4">Active Bookings</th>
                <th className="p-4">Material Orders</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs">No registered customers match your search criteria.</p>
                  </td>
                </tr>
              ) : (
              filtered.map((c) => {
                const rawPhone = c.phone.replace(/\D/g, '').slice(-10);
                const orderCount = allOrders.filter((o: any) => {
                  const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
                  return (
                    o.customerId === c.id ||
                    (rawPhone && oPhone && oPhone === rawPhone) ||
                    (o.customerName && c.name && o.customerName.toLowerCase() === c.name.toLowerCase())
                  );
                }).length;

                const bookingCount = allBookings.filter((b: any) => {
                  const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
                  return (
                    b.customerId === c.id ||
                    (rawPhone && bPhone && bPhone === rawPhone) ||
                    (b.customerName && c.name && b.customerName.toLowerCase() === c.name.toLowerCase())
                  );
                }).length;

                const isGenericName = !c.name || /^(registered homeowner|homeowner|customer|client|user)$/i.test(c.name.trim());
                const reqCount = allRequests.filter((r: any) => {
                  if (!r) return false;
                  if (r.customerId && r.customerId === c.id) return true;
                  const rPhone = (r.customerPhone || '').replace(/\D/g, '').slice(-10);
                  if (rawPhone.length === 10 && rPhone.length === 10 && rPhone === rawPhone) return true;
                  if (!isGenericName && r.customerName && c.name && String(r.customerName).trim().toLowerCase() === String(c.name).trim().toLowerCase()) {
                    if (rawPhone.length === 10 && rPhone.length === 10 && rPhone !== rawPhone) return false;
                    return true;
                  }
                  return false;
                }).length;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    {/* Customer Info */}
                    <td className="p-4">
                      <div
                        onClick={() => handleSelectCustomer(c)}
                        className="cursor-pointer group"
                        title="Click to view customer details"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-950 group-hover:text-blue-600 transition-colors text-xs font-display">
                            {c.name}
                          </span>
                          {c.isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 group-hover:text-slate-700 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="font-semibold text-slate-700">{c.phone}</span>
  <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-bold">
    {c.id}
  </span>
                          {c.email && c.email !== 'Not Provided' && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-sans">{c.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-slate-700">
                      <div className="font-semibold text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{c.city}, {c.state}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]" title={`${c.housePlotNumber}, ${c.streetLocality}`}>
                        {c.housePlotNumber}, {c.streetLocality} ({c.pinCode})
                      </div>
                    </td>

                    {/* Project Requests */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>{reqCount}</span>
                      </span>
                    </td>

                    {/* Active Bookings */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <CalendarCheck className="w-3 h-3 text-blue-600" />
                        <span>{bookingCount}</span>
                      </span>
                    </td>

                    {/* Material Orders */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <Package className="w-3 h-3 text-emerald-600" />
                        <span>{orderCount}</span>
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="p-4 text-slate-500 font-sans text-xs">
                      {formatDate(c.registeredAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {c.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : c.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSelectCustomer(c)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-100 text-blue-900 hover:text-blue-950 font-bold text-xs flex items-center gap-1.5 ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Customer Creation Full-Screen View for Admin (Stepper Wizard) */}
      {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddCustomerStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Customer Directory</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Add New Registered Customer
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Step {addCustomerStep} of 3 • Homeowner Registration Wizard
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddCustomerStep(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Stepper Progress Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-blue-200/80 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                {[
                  { step: 1, title: 'Identity & Contact', icon: User },
                  { step: 2, title: 'Site Location', icon: MapPin },
                  { step: 3, title: 'Account Verification', icon: ShieldCheck },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.step < addCustomerStep) setAddCustomerStep(item.step);
                      }}
                      className="flex flex-col items-center gap-1 group text-center cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition ${
                          addCustomerStep === item.step
                            ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                            : addCustomerStep > item.step
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {addCustomerStep > item.step ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1 transition ${
                          addCustomerStep === item.step
                            ? 'text-blue-900'
                            : addCustomerStep > item.step
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
                          addCustomerStep > item.step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Card Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateCustomer}>
                {/* STEP 1: IDENTITY & CONTACT */}
                {addCustomerStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 1 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Customer Identity & Mobile Verification
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter primary homeowner identity for instant SMS alerts and quotation dispatches.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
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
                          value={newCustForm.name}
                          onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                          className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-blue-600" />
                            <span>Primary Mobile Number</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={newCustForm.phone}
                              onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                              className="w-full pl-14 pr-4 py-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">Used for customer OTP authentication & WhatsApp order status.</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span>Email Address (Optional)</span>
                          </label>
                          <input
                            type="email"
                            placeholder=""
                            value={newCustForm.email}
                            onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <span className="text-[10px] text-slate-400">Receives official BOQ estimations, PDF invoices, and escrow receipts.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: SITE ADDRESS & GEO-LOCATION */}
                {addCustomerStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 2 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Plot / Site Address & Jurisdiction
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Specify exact site location where civil engineering, architectural design, or materials will be dispatched.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>House / Plot / Survey No.</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newCustForm.housePlotNumber}
                            onChange={(e) => setNewCustForm({ ...newCustForm, housePlotNumber: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>Street / Locality / Sector</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newCustForm.streetLocality}
                            onChange={(e) => setNewCustForm({ ...newCustForm, streetLocality: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">City / District <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newCustForm.city}
                            onChange={(e) => setNewCustForm({ ...newCustForm, city: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">State <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newCustForm.state}
                            onChange={(e) => setNewCustForm({ ...newCustForm, state: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-800 text-sm">PIN Code <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder=""
                            value={newCustForm.pinCode}
                            onChange={(e) => setNewCustForm({ ...newCustForm, pinCode: e.target.value })}
                            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ACCOUNT VERIFICATION & FINAL REVIEW */}
                {addCustomerStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <span>Step 3 of 3</span>
                      </div>
                      <h3 className="text-xl font-bold text-navy-950 font-display">
                        Verification Status & Account Activation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review homeowner credentials and select account privileges before creating live platform identity.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Review Card */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Full Name</span>
                          <p className="text-sm font-bold text-navy-950 mt-0.5">{newCustForm.name || 'Not Entered'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</span>
                          <p className="text-sm font-mono font-bold text-navy-950 mt-0.5">+91 {newCustForm.phone || '0000000000'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Official Email</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{newCustForm.email || 'None (SMS Notifications only)'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Site Location</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">
                            {newCustForm.housePlotNumber}, {newCustForm.streetLocality}, {newCustForm.city}, {newCustForm.state} ({newCustForm.pinCode})
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-800 text-sm block">
                          Initial Verification Level <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            onClick={() => setNewCustForm({ ...newCustForm, status: 'VERIFIED' })}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                              newCustForm.status === 'VERIFIED'
                                ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="custStatus"
                              checked={newCustForm.status === 'VERIFIED'}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-bold text-navy-950 text-xs block">VERIFIED (Instant Full Access)</span>
                              <span className="text-[11px] text-slate-500">
                                Pre-authenticated homeowner. Allowed to book instant consultations and order cement/steel without OTP holds.
                              </span>
                            </div>
                          </label>

                          <label
                            onClick={() => setNewCustForm({ ...newCustForm, status: 'ACTIVE' })}
                            className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                              newCustForm.status === 'ACTIVE'
                                ? 'bg-blue-50 border-blue-400 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="custStatus"
                              checked={newCustForm.status === 'ACTIVE'}
                              onChange={() => {}}
                              className="mt-1"
                            />
                            <div>
                              <span className="font-bold text-navy-950 text-xs block">ACTIVE (Standard Customer)</span>
                              <span className="text-[11px] text-slate-500">
                                Requires standard OTP on first inquiry submission. Can browse rates and calculate construction estimates.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Navigation Footer */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
                  {addCustomerStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setAddCustomerStep(addCustomerStep - 1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous Step</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <div className="text-xs text-slate-400 font-mono hidden sm:block">
                    Step {addCustomerStep} of 3
                  </div>

                  {addCustomerStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (addCustomerStep === 1) {
                          if (!newCustForm.name.trim()) {
                            error('Please enter the customer full name');
                            return;
                          }
                          const clean = newCustForm.phone.replace(/\D/g, '').slice(-10);
                          if (clean.length !== 10) {
                            error('Please enter a valid 10-digit mobile number');
                            return;
                          }
                        }
                        setAddCustomerStep(addCustomerStep + 1);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <span>Proceed to Step {addCustomerStep + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete & Create Customer</span>
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
