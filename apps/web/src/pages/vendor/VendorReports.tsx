import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Package,
  ShoppingBag,
  CreditCard,
  Boxes,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getVendorOrders,
  getVendorProducts,
  getVendorPayouts,
  getInventoryMovements,
} from '../../data/vendorStore.js';

export const VendorReports: React.FC = () => {
  const { user } = useAuth();
  const vendorId = user?.id || 'vnd-delhi-1';

  const [reportType, setReportType] = useState<'SALES' | 'PRODUCTS' | 'ORDERS' | 'FINANCIAL' | 'INVENTORY'>('SALES');
  const [timeRange, setTimeRange] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('MONTHLY');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const orders = useMemo(() => getVendorOrders(user?.phone || vendorId), [user?.phone, vendorId]);
  const products = useMemo(() => getVendorProducts(vendorId), [vendorId]);
  const payouts = useMemo(() => getVendorPayouts(vendorId), [vendorId]);
  const movements = useMemo(() => getInventoryMovements(vendorId), [vendorId]);

  // Financial aggregates
  const financialMetrics = useMemo(() => {
    const grossSalesPaise = orders.reduce((sum, o) => sum + (o.fulfillmentStatus !== 'CANCELLED' ? o.totalAmountPaise || 0 : 0), 0);
    const commissionPaise = Math.round(grossSalesPaise * 0.05);
    const taxPaise = Math.round(grossSalesPaise * 0.01);
    const netEarningsPaise = grossSalesPaise - commissionPaise - taxPaise;
    const settledPaise = payouts.filter((p) => p.status === 'SETTLED' || p.status === 'COMPLETED').reduce((sum, p) => sum + (p.netAmountPaise || 0), 0);
    const pendingSettlementPaise = Math.max(0, netEarningsPaise - settledPaise);

    return {
      grossSalesPaise,
      commissionPaise,
      taxPaise,
      netEarningsPaise,
      settledPaise,
      pendingSettlementPaise,
    };
  }, [orders, payouts]);

  // Product performance ranking
  const productPerformance = useMemo(() => {
    const map = new Map<string, { product: any; unitsSold: number; revenuePaise: number }>();

    products.forEach((p) => {
      map.set(p.id, { product: p, unitsSold: 0, revenuePaise: 0 });
    });

    orders.forEach((ord) => {
      if (ord.fulfillmentStatus === 'CANCELLED') return;
      (ord.items || []).forEach((it: any) => {
        const found = products.find((p) => p.title === it.name || p.sku === it.sku);
        if (found && map.has(found.id)) {
          const entry = map.get(found.id)!;
          entry.unitsSold += it.quantity || 1;
          entry.revenuePaise += it.totalPaise || (it.unitPricePaise || 0) * (it.quantity || 1);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenuePaise - a.revenuePaise);
  }, [products, orders]);

  // Universal CSV Export
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `BuildGhar_${reportType}_Report.csv`;

    if (reportType === 'SALES' || reportType === 'ORDERS') {
      headers = ['Order Code', 'Date', 'Customer Name', 'City', 'Order Amount (₹)', 'Fulfillment Status', 'Payment Method'];
      rows = orders.map((o) => [
        o.orderCode,
        formatDate(o.createdAt),
        o.customerName,
        o.deliveryAddress?.city || 'Delhi NCR',
        ((o.totalAmountPaise || 0) / 100).toFixed(2),
        o.fulfillmentStatus,
        o.paymentMethod,
      ]);
    } else if (reportType === 'PRODUCTS') {
      headers = ['Product Name', 'SKU', 'Category', 'Price (₹)', 'Available Stock', 'Units Sold', 'Total Revenue (₹)'];
      rows = productPerformance.map((item) => [
        item.product.title,
        item.product.sku,
        item.product.category,
        ((item.product.pricePaise || 0) / 100).toFixed(2),
        item.product.stockQuantity,
        item.unitsSold,
        (item.revenuePaise / 100).toFixed(2),
      ]);
    } else if (reportType === 'FINANCIAL') {
      headers = ['Settlement Ref', 'Date', 'Order Ref', 'Gross Amount (₹)', 'Commission (₹)', 'Net Transferred (₹)', 'Status'];
      rows = payouts.map((p) => [
        p.id,
        formatDate(p.createdAt),
        p.orderId || 'BATCH_PAYOUT',
        ((p.grossAmountPaise || 0) / 100).toFixed(2),
        ((p.commissionPaise || 0) / 100).toFixed(2),
        ((p.netAmountPaise || 0) / 100).toFixed(2),
        p.status,
      ]);
    } else if (reportType === 'INVENTORY') {
      headers = ['Timestamp', 'Product Name', 'SKU', 'Movement Type', 'Qty', 'Balance After', 'Reason', 'Performed By'];
      rows = movements.map((m) => [
        formatDate(m.createdAt),
        m.productTitle,
        m.sku,
        m.movementType,
        m.quantity,
        m.newStock,
        m.reason,
        m.performedBy,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Reports & Business Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sales trends, product conversions, inventory valuations, order fulfillment and financial audit logs.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-sky-50/30 hover:bg-slate-100 text-slate-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export {reportType} (CSV)</span>
        </button>
      </div>

      {/* Report Types & Time Range Filters */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Report Category Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: 'Sales Reports', value: 'SALES', icon: TrendingUp },
              { label: 'Product Performance', value: 'PRODUCTS', icon: Package },
              { label: 'Order Fulfillment', value: 'ORDERS', icon: ShoppingBag },
              { label: 'Financial Audit', value: 'FINANCIAL', icon: CreditCard },
              { label: 'Inventory Movements', value: 'INVENTORY', icon: Boxes },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setReportType(tab.value as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    reportType === tab.value
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e: any) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl font-bold text-slate-700 focus:outline-none"
            >
              <option value="DAILY">Today's Performance</option>
              <option value="WEEKLY">This Week</option>
              <option value="MONTHLY">This Month (30 Days)</option>
              <option value="YEARLY">Full Financial Year</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>

            {timeRange === 'CUSTOM' && (
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-sky-50/30 border border-blue-200/80 rounded-lg text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-sky-50/30 border border-blue-200/80 rounded-lg text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content based on Report Type */}
        {reportType === 'SALES' || reportType === 'FINANCIAL' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-sky-50/30 rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">GROSS PLATFORM REVENUE</span>
                <div className="text-xl font-black font-display text-navy-950 mt-1">
                  {formatINR(financialMetrics.grossSalesPaise)}
                </div>
              </div>
              <div className="p-4 bg-sky-50/30 rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">PLATFORM COMMISSION</span>
                <div className="text-xl font-black font-display text-amber-700 mt-1">
                  {formatINR(financialMetrics.commissionPaise)}
                </div>
              </div>
              <div className="p-4 bg-sky-50/30 rounded-xl border border-blue-200/80">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">NET VENDOR EARNINGS</span>
                <div className="text-xl font-black font-display text-emerald-700 mt-1">
                  {formatINR(financialMetrics.netEarningsPaise)}
                </div>
              </div>
              <div className="p-4 bg-navy-950 text-white rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PENDING SETTLEMENT</span>
                <div className="text-xl font-black font-display text-amber-400 mt-1">
                  {formatINR(financialMetrics.pendingSettlementPaise)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-blue-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b">
                  <tr>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Gross Total</th>
                    <th className="p-3 text-right">Net Depot Payout</th>
                    <th className="p-3 text-center">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-sky-50/30">
                      <td className="p-3 font-mono font-bold text-slate-900">{o.orderCode}</td>
                      <td className="p-3 font-medium">{o.customerName}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{formatDate(o.createdAt)}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatINR(o.totalAmountPaise)}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700">
                        {formatINR(Math.round(o.totalAmountPaise * 0.94))}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {o.fulfillmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : reportType === 'PRODUCTS' ? (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b">
                <tr>
                  <th className="p-3">Product Name & SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-center">Units Sold</th>
                  <th className="p-3 text-right">Gross Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productPerformance.map((item) => (
                  <tr key={item.product.id} className="hover:bg-sky-50/30">
                    <td className="p-3">
                      <strong className="text-slate-900 block">{item.product.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                    </td>
                    <td className="p-3 text-slate-700">{item.product.category}</td>
                    <td className="p-3 text-right font-mono">{formatINR(item.product.pricePaise)}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">
                      {item.product.stockQuantity} {item.product.unit}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-blue-700">
                      {item.unitsSold} {item.product.unit}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                      {formatINR(item.revenuePaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reportType === 'INVENTORY' ? (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3">Audit Reason</th>
                  <th className="p-3">Staff / Performer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-sky-50/30">
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{formatDate(m.createdAt)}</td>
                    <td className="p-3 font-bold text-slate-900">{m.productTitle}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.movementType === 'STOCK_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{m.quantity}</td>
                    <td className="p-3 text-right font-mono">{m.newStock}</td>
                    <td className="p-3 text-slate-700">{m.reason}</td>
                    <td className="p-3 text-slate-500">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b">
                <tr>
                  <th className="p-3">Order Code</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-sky-50/30">
                    <td className="p-3 font-mono font-bold text-slate-900">{o.orderCode}</td>
                    <td className="p-3">{o.customerName}</td>
                    <td className="p-3">{o.deliveryAddress?.city || 'Delhi NCR'}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatINR(o.totalAmountPaise)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {o.fulfillmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
