import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  getPlatformRequests,
  getPlatformBookings,
  PlatformProjectRequest,
  PlatformBooking,
} from '../../data/customerStore.js';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  PlusCircle,
  Building,
  Hammer,
  Package,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [materialOrders, setMaterialOrders] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | '30DAYS' | 'QUARTER'>('ALL');
  const [loading, setLoading] = useState(true);

  // Load real user data (Zero Dummy Data)
  useEffect(() => {
    const rawUserPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    // 1. User Requests
    const allReqs = getPlatformRequests().filter((r) => {
      if (r.customerId === 'usr-cust-1' || r.customerName?.toLowerCase().includes('vikram') || r.customerPhone?.includes('9876543220')) return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawUserPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return !user?.id && !rawUserPhone;
    });

    // 2. User Bookings
    const allBks = getPlatformBookings().filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawUserPhone && b.customerPhone) {
        return b.customerPhone.replace(/\D/g, '').slice(-10) === rawUserPhone;
      }
      return !user?.id && !rawUserPhone;
    });

    // 3. User Material Orders
    let userOrders: any[] = [];
    try {
      const ordersJson = localStorage.getItem('material_orders');
      if (ordersJson) {
        const parsed = JSON.parse(ordersJson);
        if (Array.isArray(parsed)) {
          userOrders = parsed.filter((o: any) => {
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
      }
    } catch {}

    setRequests(allReqs);
    setBookings(allBks);
    setMaterialOrders(userOrders);

    if (allReqs.length > 0) {
      setSelectedProjectId('ALL');
    }
    setLoading(false);
  }, [user]);

  // Compute portfolio metrics
  const portfolioMetrics = useMemo(() => {
    // Filter bookings and orders by selected project if specific project chosen
    const activeReqs = selectedProjectId === 'ALL'
      ? requests
      : requests.filter((r) => r.id === selectedProjectId || r.requestCode === selectedProjectId);

    const activeBookings = selectedProjectId === 'ALL'
      ? bookings
      : bookings.filter((b) => b.requestId === selectedProjectId);

    // Sum estimated budgets
    let estimatedBudgetTotal = 0;
    activeReqs.forEach((r) => {
      const bStr = (r as any).budgetRange || '';
      if (bStr.includes('50 Lakhs - ₹1 Crore')) estimatedBudgetTotal += 7500000;
      else if (bStr.includes('15 Lakhs - ₹30 Lakhs')) estimatedBudgetTotal += 2250000;
      else if (bStr.includes('30 Lakhs - ₹50 Lakhs')) estimatedBudgetTotal += 4000000;
      else if (bStr.includes('1 Crore - ₹2.5 Crores')) estimatedBudgetTotal += 17500000;
      else if (bStr.includes('5 Lakhs - ₹15 Lakhs')) estimatedBudgetTotal += 1000000;
      else estimatedBudgetTotal += 5000000;
    });

    // Sum approved contract amounts
    const approvedContractTotalPaise = activeBookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0);

    // Sum material purchases
    const materialsTotalPaise = materialOrders.reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);

    // Sum amounts paid (booking advances + material orders paid)
    const advancesPaidPaise = activeBookings.reduce((sum, b) => sum + (b.advancePaise || 0), 0);
    const materialsPaidPaise = materialOrders
      .filter((o) => o.paymentStatus === 'PAYMENT_SUCCESSFUL')
      .reduce((sum, o) => sum + (o.totalAmountPaise || 0), 0);
    const totalPaidPaise = advancesPaidPaise + materialsPaidPaise;

    // Invoiced / Recorded cost
    const totalRecordedCostPaise = approvedContractTotalPaise + materialsTotalPaise;
    const outstandingDuePaise = Math.max(0, totalRecordedCostPaise - totalPaidPaise);

    return {
      estimatedBudget: estimatedBudgetTotal,
      approvedContractsPaise: approvedContractTotalPaise,
      materialsTotalPaise,
      totalRecordedCostPaise,
      totalPaidPaise,
      outstandingDuePaise,
      projectCount: activeReqs.length,
      bookingCount: activeBookings.length,
      orderCount: materialOrders.length,
    };
  }, [requests, bookings, materialOrders, selectedProjectId]);

  // Export Real Dynamic CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Record Type,Code / ID,Title / Description,Date,Amount (INR),Status\n';

    // 1. Project Requests
    requests.forEach((r) => {
      csvContent += `"Project Request","${r.requestCode}","${r.propertyType} (${r.city || ''})","${formatDate(r.createdAt)}","${(r as any).budgetRange || 'N/A'}","${r.status}"\n`;
    });

    // 2. Confirmed Bookings
    bookings.forEach((b) => {
      csvContent += `"Service Booking","${b.bookingCode}","${b.serviceTitle}","${formatDate(b.confirmedAt)}","₹${(b.totalAmountPaise / 100).toLocaleString('en-IN')}","${b.status}"\n`;
    });

    // 3. Material Orders
    materialOrders.forEach((o) => {
      csvContent += `"Material Order","${o.orderCode}","${o.items?.length || 1} Products","${formatDate(o.orderDate)}","₹${(o.totalAmountPaise / 100).toLocaleString('en-IN')}","${o.fulfillmentStatus}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GharDesign_Financial_Report_${user?.name?.replace(/\s+/g, '_') || 'Portfolio'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActivity = requests.length > 0 || bookings.length > 0 || materialOrders.length > 0;

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-bold uppercase tracking-wider text-[11px] mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Financial & Milestone Performance Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Project Budget vs. Actual Cost Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Dynamic reconciliation of estimated project capital, approved contract totals, material procurement, and verified disbursements.
          </p>
        </div>

        {/* Export Actions */}
        {hasActivity && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        )}
      </div>

      {!hasActivity ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base font-display">No Project Activity Recorded Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your budget variance, contract commitments, and material procurement expense ledger will generate automatically once you create your first quotation request or place an order.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard/create-request"
              className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5 font-bold rounded-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Get New Quotation</span>
            </Link>
            <Link
              to="/dashboard/materials"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Browse Materials
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Project Scope:</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
              >
                <option value="ALL">All Active Projects ({requests.length})</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestCode} - {r.propertyType} ({r.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Reporting Range:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                {(['ALL', '30DAYS', 'QUARTER'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      dateRange === r ? 'bg-navy-950 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'ALL' ? 'ALL' : r === '30DAYS' ? 'LAST 30 DAYS' : 'THIS QUARTER'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6 Real Financial Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Estimated Budget */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Budget</span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {portfolioMetrics.estimatedBudget > 0 ? `₹${(portfolioMetrics.estimatedBudget).toLocaleString('en-IN')}` : '₹0'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{portfolioMetrics.projectCount} Project Inquiry Scope</div>
            </div>

            {/* 2. Approved Contracts */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Approved Contracts</span>
              <div className="text-base font-extrabold text-blue-700 mt-1">
                {formatINR(portfolioMetrics.approvedContractsPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{portfolioMetrics.bookingCount} Confirmed Booking(s)</div>
            </div>

            {/* 3. Materials Procurement */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Materials Procurement</span>
              <div className="text-base font-extrabold text-purple-700 mt-1">
                {formatINR(portfolioMetrics.materialsTotalPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{portfolioMetrics.orderCount} Depot Order(s)</div>
            </div>

            {/* 4. Total Invoiced */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Recorded Cost</span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {formatINR(portfolioMetrics.totalRecordedCostPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Contracts + Materials</div>
            </div>

            {/* 5. Amount Paid */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Amount Paid</span>
              <div className="text-base font-extrabold text-emerald-700 mt-1">
                {formatINR(portfolioMetrics.totalPaidPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Advances & Verified Payments</div>
            </div>

            {/* 6. Outstanding Due */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Due</span>
              <div className="text-base font-extrabold text-rose-700 mt-1">
                {formatINR(portfolioMetrics.outstandingDuePaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Balance Milestones</div>
            </div>
          </div>

          {/* Activity Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-display">
              Real Portfolio Itemized Activity Log
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference Code</th>
                    <th className="p-3">Activity Type</th>
                    <th className="p-3">Title / Scope</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Committed Amount</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-gold-700">{r.requestCode}</td>
                      <td className="p-3 text-slate-600 font-medium">Project Request</td>
                      <td className="p-3 text-slate-900 font-semibold">{r.propertyType} ({r.city})</td>
                      <td className="p-3 text-slate-500">{formatDate(r.createdAt)}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{(r as any).budgetRange || 'Quote Ready'}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold text-[10px]">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-700">{b.bookingCode}</td>
                      <td className="p-3 text-slate-600 font-medium">Confirmed Contract</td>
                      <td className="p-3 text-slate-900 font-semibold">{b.serviceTitle}</td>
                      <td className="p-3 text-slate-500">{formatDate(b.confirmedAt)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatINR(b.totalAmountPaise)}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {materialOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-purple-700">{o.orderCode}</td>
                      <td className="p-3 text-slate-600 font-medium">Building Materials</td>
                      <td className="p-3 text-slate-900 font-semibold">
                        {o.items?.map((it: any) => it.name).join(', ') || 'Direct Supplies'}
                      </td>
                      <td className="p-3 text-slate-500">{formatDate(o.orderDate)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatINR(o.totalAmountPaise)}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full font-bold text-[10px]">
                          {o.fulfillmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
