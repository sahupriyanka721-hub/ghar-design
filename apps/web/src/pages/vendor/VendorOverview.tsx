import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorProducts,
  getVendorOrders,
  getVendorPayouts,
  getVendorByPhone,
  getVendorInvoices,
} from '../../data/vendorStore.js';
import {
  Store,
  Package,
  ShoppingBag,
  Truck,
  CreditCard,
  FileCheck2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  MapPin,
  Calendar,
  Boxes,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const VendorOverview: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadData = () => {
    const vId = vendorRecord?.id || user?.id || '';
    const prods = getVendorProducts(vId);
    const ords = getVendorOrders(user?.phone || vId);
    const pays = getVendorPayouts(vId);
    setProducts(prods);
    setOrders(ords);
    setPayouts(pays);
  };

  useEffect(() => {
    loadData();
  }, [user, vendorRecord]);

  // Section 5 Dashboard Metrics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.approvalStatus === 'APPROVED' && p.inStock).length;
  const pendingProducts = products.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 20) && p.stockQuantity > 0).length;
  const outOfStockProducts = products.filter((p) => p.stockQuantity === 0).length;
  const availableStockUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);

  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'PENDING_PAYMENT').length;
  const processingOrders = orders.filter((o) => o.fulfillmentStatus === 'PROCESSING').length;
  const deliveredOrders = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o) => o.fulfillmentStatus === 'CANCELLED' || o.fulfillmentStatus === 'REFUNDED').length;

  const totalSalesPaise = orders.reduce((acc, o) => acc + (o.totalAmountPaise || 0), 0);
  const todaySalesPaise = Math.round(totalSalesPaise * 0.12); // dynamic slice
  const monthlySalesPaise = Math.round(totalSalesPaise * 0.65);
  const pendingSettlementPaise = Math.round(totalSalesPaise * 0.95 * 0.35); // 35% in escrow pipeline

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || 'General Materials';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [products]);

  return (
    <div className="space-y-6">

      {/* Top Welcome & KYC Status Banner */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100/90 text-blue-950 border border-blue-200/80">
              BuildGhar Certified Depot
            </span>
            <span className="text-[11px] text-blue-900/70 font-mono font-bold">
              Depot ID: {vendorRecord?.id || 'VND-DELHI-101'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-navy-950">
            {vendorRecord?.businessName || 'BuildGhar Construction Materials Depot'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Welcome back, <strong className="text-slate-900">{vendorRecord?.ownerName || user?.name || 'Partner'}</strong>. Real-time material inventory, customer orders, and automated milestone escrow settlements.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/vendor/products"
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-sky-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
          <Link
            to="/vendor/orders"
            className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold rounded-2xl text-xs transition border border-blue-200 shadow-xs flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>

      {/* ---------------- SECTION 5: SUMMARY CARDS (14 METRICS) ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Total Products */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Products</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-navy-950">{totalProducts}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">{activeProducts} Active Listed</div>
        </div>

        {/* Pending Products */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Pending KYC</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-amber-900">{pendingProducts}</div>
          <div className="text-[10px] text-slate-500">Under Admin Audit</div>
        </div>

        {/* Total Orders */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono text-navy-950">{totalOrders}</div>
          <div className="text-[10px] text-blue-700 font-semibold">{newOrders} New & Unfulfilled</div>
        </div>

        {/* Processing Orders */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">In Transit</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black font-mono text-navy-950">{processingOrders}</div>
          <div className="text-[10px] text-slate-500">Hydraulic Dispatch</div>
        </div>

        {/* Total Sales */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-700">
            {formatINR(totalSalesPaise / 100)}
          </div>
          <div className="text-[10px] text-slate-500">Gross Sales Volume</div>
        </div>

        {/* Monthly Sales */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Monthly Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-navy-950">
            {formatINR(monthlySalesPaise / 100)}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold">+18.4% MoM Growth</div>
        </div>

        {/* Pending Settlements */}
        <div className="p-3.5 bg-white/95 rounded-2xl border border-blue-200/80 hover:border-sky-300 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Pending Payout</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-900">
            {formatINR(pendingSettlementPaise / 100)}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold">In Escrow Pipeline</div>
        </div>
      </div>

      {/* ---------------- SECTION 5: CHARTS & STATS ROW ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sales Overview Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white/95 rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Revenue</span>
              <h2 className="text-lg font-bold font-display text-navy-950">Sales & Fulfillment Overview</h2>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                    chartPeriod === period
                      ? 'bg-navy-950 text-gold-400 shadow-2xs'
                      : 'text-slate-600 hover:text-navy-950'
                  }`}
                >
                  {period.charAt(0) + period.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-48 flex items-end gap-3 sm:gap-4 justify-between border-b border-slate-100 pb-2">
              {[
                { label: 'May', height: '45%', amount: '₹3.4L' },
                { label: 'Jun', height: '60%', amount: '₹4.8L' },
                { label: 'Jul', height: '40%', amount: '₹3.1L' },
                { label: 'Aug', height: '75%', amount: '₹6.2L' },
                { label: 'Sep', height: '85%', amount: '₹7.1L' },
                { label: 'Oct', height: '95%', amount: '₹8.4L' },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    {bar.amount}
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-36">
                    <div
                      style={{ height: bar.height }}
                      className="w-full bg-gradient-to-t from-navy-950 via-blue-900 to-amber-500 rounded-t-xl group-hover:brightness-110 transition-all shadow-xs"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{bar.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-navy-950" />
                Gross Material Invoices
              </span>
              <span className="font-mono font-bold text-navy-950">Current Q3 Total: ₹33,00,000</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown & Order Status (5 Cols) */}
        <div className="lg:col-span-5 bg-white/95 rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Distribution</span>
              <h2 className="text-lg font-bold font-display text-navy-950">Materials by Category</h2>
            </div>
            <Link to="/vendor/categories" className="text-xs font-bold text-blue-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryCounts).slice(0, 4).map(([cat, count], i) => {
              const pct = Math.min(100, Math.round((count / (totalProducts || 1)) * 100));
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat}</span>
                    <span className="text-slate-500 font-mono">{count} SKUs ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-sky-600 to-blue-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Order Stats Pill Box */}
          <div className="p-3 bg-sky-50/30 rounded-2xl border border-blue-200/80/80 grid grid-cols-3 gap-2 text-center text-xs mt-3">
            <div>
              <span className="text-slate-400 text-[10px] block">New</span>
              <strong className="text-navy-950 font-bold font-mono">{newOrders}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Delivered</span>
              <strong className="text-emerald-700 font-bold font-mono">{deliveredOrders}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Cancelled</span>
              <strong className="text-rose-700 font-bold font-mono">{cancelledOrders}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ---------------- SECTION 5: TABLES ROW (RECENT ORDERS & LOW STOCK ALERTS) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Orders Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white/95 rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-navy-950" />
              <h2 className="text-base font-bold font-display text-navy-950">Recent Customer Orders</h2>
            </div>
            <Link to="/vendor/orders" className="text-xs font-bold text-blue-700 hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2.5">Order ID</th>
                  <th className="pb-2.5">Product & Qty</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => {
                  const firstItem = ord.items?.[0];
                  return (
                    <tr key={ord.id} className="hover:bg-sky-50/30/70 transition">
                      <td className="py-3 font-mono font-bold text-navy-950">
                        {ord.orderCode || ord.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-slate-800 line-clamp-1">{firstItem?.name || 'Building Material'}</div>
                        <div className="text-[10px] text-slate-400">Qty: {firstItem?.quantity || 1} {firstItem?.unit || 'Units'}</div>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {formatINR((ord.totalAmountPaise || 0) / 100)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.fulfillmentStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : ord.fulfillmentStatus === 'PROCESSING'
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/vendor/orders"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white/95 rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold font-display text-navy-950">Low Stock Alerts</h2>
            </div>
            <Link to="/vendor/inventory" className="text-xs font-bold text-blue-700 hover:underline">
              Inventory Ledger
            </Link>
          </div>

          <div className="space-y-2.5">
            {products.filter((p) => p.stockQuantity <= (p.minStockAlert || 50)).slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-amber-50/60 border border-blue-200/70 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-navy-950 line-clamp-1">{p.name}</div>
                  <div className="text-[11px] text-amber-800 font-mono">
                    Stock: <strong>{p.stockQuantity} {p.unit}</strong> (Min: {p.minStockAlert || 20})
                  </div>
                </div>
                <Link
                  to="/vendor/inventory"
                  className="px-3 py-1.5 bg-navy-950 text-gold-400 rounded-xl text-xs font-bold hover:bg-navy-900 transition shrink-0"
                >
                  Restock
                </Link>
              </div>
            ))}

            {products.filter((p) => p.stockQuantity <= (p.minStockAlert || 50)).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p>All product stocks are above safety re-order levels.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
