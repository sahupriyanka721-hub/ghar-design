import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import {
  FileText,
  FileCheck2,
  CalendarCheck,
  CreditCard,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  Hammer,
  ShoppingBag,
  HelpCircle,
  Bell,
  Receipt,
  Building,
  MapPin,
  Calculator,
} from 'lucide-react';
import { getPlatformRequests, getPlatformBookings, PlatformProjectRequest, PlatformBooking } from '../../data/customerStore.js';
import { getVendorOrders } from '../../data/vendorStore.js';

export const CustomerOverview: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PlatformProjectRequest[]>([]);
  const [bookings, setBookings] = useState<PlatformBooking[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealData = () => {
    const rawPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

    // 1. Real Requests
    const allReqs = getPlatformRequests().filter((r) => {
      if (r.customerId === 'usr-cust-1' || r.customerName?.toLowerCase().includes('vikram') || r.customerPhone?.includes('9876543220')) return false;
      if (user?.id && r.customerId === user.id) return true;
      if (rawPhone && r.customerPhone) {
        return r.customerPhone.replace(/\D/g, '').slice(-10) === rawPhone;
      }
      return !user?.id && !rawPhone;
    });

    // 2. Real Bookings
    const allBks = getPlatformBookings().filter((b) => {
      if (b.customerId === 'usr-cust-1' || b.customerName?.toLowerCase().includes('vikram') || b.customerPhone?.includes('9876543220')) return false;
      if (user?.id && b.customerId === user.id) return true;
      if (rawPhone && b.customerPhone) {
        return b.customerPhone.replace(/\D/g, '').slice(-10) === rawPhone;
      }
      return !user?.id && !rawPhone;
    });

    // 3. Real Material Orders
    const allOrds = getVendorOrders(user?.phone || user?.id || '');

    setRequests(allReqs);
    setBookings(allBks);
    setOrders(allOrds);
    setLoading(false);
  };

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 30000);
    window.addEventListener('storage', loadRealData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadRealData);
    };
  }, [user?.phone, user?.id]);

  const activeProject = requests.length > 0 ? requests[0] : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200/80 font-mono text-[11px] font-bold text-blue-950">GharDesign Homeowner Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-navy-950">
              Welcome back, {user?.name || 'Homeowner'}!
            </h1>
            <p className="text-slate-600 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
              Track your residential construction, approve engineering drawings, inspect material deliveries, and manage escrow settlements.
            </p>
          </div>

          {/* Contextual Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 shrink-0">
            <Link
              to="/dashboard/calculator"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition font-display border border-blue-500"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>Cost Estimator</span>
            </Link>
            <Link
              to="/dashboard/create-request"
              className="px-4 py-2 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition font-display"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Get New Quotation</span>
            </Link>
            <Link
              to="/dashboard/book-services"
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold text-xs rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition font-display"
            >
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Book Service</span>
            </Link>
            <Link
              to="/dashboard/materials"
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-950 font-bold text-xs rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition font-display"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Buy Materials</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------- REAL SUMMARY METRICS (8 CARDS) ---------------- */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-display">
          Project & Financial Portfolio KPIs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {/* 1. Total Requests */}
          <Link
            to="/dashboard/requests"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-navy-900 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-slate-400">Total</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-display">{requests.length}</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Project Requests</div>
          </Link>

          {/* 2. Quotations Available */}
          <Link
            to="/dashboard/quotations"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-gold-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <FileCheck2 className="w-4 h-4 text-gold-600" />
              <span className="w-2 h-2 rounded-full bg-gold-500" />
            </div>
            <div className="text-xl font-black text-gold-700 font-display">
              {requests.filter((r) => r.status === 'QUOTATIONS_AVAILABLE').length}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Awaiting Decision</div>
          </Link>

          {/* 3. Confirmed Bookings */}
          <Link
            to="/dashboard/bookings"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-600 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">Active</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-display">{bookings.length}</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Confirmed Bookings</div>
          </Link>

          {/* 4. Active Projects */}
          <Link
            to="/dashboard/track-service"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-navy-900 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Hammer className="w-4 h-4 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-600">Live</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-display">
              {requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Active Projects</div>
          </Link>

          {/* 5. Pending Approvals */}
          <Link
            to="/dashboard/design-approvals"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Eye className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-display">0</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Design Approvals</div>
          </Link>

          {/* 6. Pending Payments */}
          <Link
            to="/dashboard/invoices"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <CreditCard className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-display">0</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Pending Invoices</div>
          </Link>

          {/* 7. Open Material Orders */}
          <Link
            to="/dashboard/material-purchases"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-cyan-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Truck className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-display">{orders.length}</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Material Orders</div>
          </Link>

          {/* 8. Unread Notifications */}
          <Link
            to="/dashboard/notifications"
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-gold-500 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <Bell className="w-4 h-4 text-gold-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-display">0</div>
            <div className="text-[11px] text-slate-500 truncate mt-1">Unread Alerts</div>
          </Link>
        </div>
      </div>

      {/* ---------------- MAIN SECTIONS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Project Progress */}
          {activeProject ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
                    Project Code: {activeProject.requestCode}
                  </span>
                  <h3 className="font-bold text-lg text-navy-950 font-display mt-1">
                    {activeProject.propertyType || 'Residential Project'}{activeProject.city ? ` (${activeProject.city}${activeProject.state ? `, ${activeProject.state}` : ''})` : ''}
                  </h3>
                </div>
                <Link
                  to={`/dashboard/requests/${activeProject.id}`}
                  className="text-xs font-bold text-navy-950 hover:underline flex items-center gap-1 font-display"
                >
                  <span>Track Full Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-wrap gap-4 justify-between">
                <div>
                  <span className="text-slate-500">Status: </span>
                  <strong className="text-navy-950 uppercase">{activeProject.status}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Plot Area: </span>
                  <strong className="text-slate-900">{activeProject.plotArea || 'Specified'} {activeProject.measurementUnit || 'sq ft'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Budget Range: </span>
                  <strong className="text-gold-700">{activeProject.budgetRange || 'Under Assessment'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Hammer className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base font-display text-slate-800">
                  No Active Construction Projects
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Submit your engineering blueprint or construction inquiry to start tracking all 10 site stages live.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/dashboard/create-request"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-950 text-gold-400 font-bold font-display text-xs rounded-xl shadow-md transition hover:bg-navy-900"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start First Project Request</span>
                </Link>
              </div>
            </div>
          )}

          {/* Pending Design Approvals */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Pending Customer Design Approvals</h3>
              </div>
              <Link to="/dashboard/design-approvals" className="text-xs text-navy-950 font-bold hover:underline">
                View All
              </Link>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
              <Eye className="w-7 h-7 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">No Pending Design Approvals</div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Engineering 2D blueprints, structural calculations, and photorealistic 3D elevations awaiting your approval will display here.
              </p>
            </div>
          </div>

          {/* Recent Material Purchases */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Material Procurement Dispatch</h3>
              </div>
              <Link to="/dashboard/material-purchases" className="text-xs text-navy-950 font-bold hover:underline">
                View All Orders ({orders.length})
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 text-xs">
                <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Material Purchases Yet</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Order cement, TMT steel rebars, bricks, sand, and electrical fixtures directly from verified local supply depots.
                </p>
                <div className="pt-1">
                  <Link
                    to="/dashboard/materials"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <span>Browse Materials Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-navy-950">{ord.orderCode}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Status: <strong className="text-slate-800">{ord.fulfillmentStatus}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-navy-950">{formatINR(ord.totalAmountPaise)}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(ord.orderDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide on desktop) */}
        <div className="space-y-6">
          {/* Upcoming Site Visits */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Upcoming Site Visits</h3>
              </div>
              <Link to="/dashboard/bookings" className="text-[11px] font-bold text-navy-950 hover:underline">
                Manage
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 text-xs">
                <CalendarCheck className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Site Visits Scheduled</div>
                <p className="text-[11px] text-slate-400">
                  Book an on-site soil testing, engineering survey, or plinth inspection with a verified engineer.
                </p>
                <div className="pt-1">
                  <Link
                    to="/dashboard/book-services"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <span>Book Inspection</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((bk) => (
                  <div key={bk.id} className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">{bk.serviceTitle}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-emerald-700 shadow-2xs">
                        {bk.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{bk.visitDate ? formatDate(bk.visitDate) : 'Date Confirmed'} ({bk.visitTimeSlot || 'Morning'})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invoices & Due Dates */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Invoices & Escrow</h3>
              </div>
              <Link to="/dashboard/invoices" className="text-[11px] font-bold text-navy-950 hover:underline">
                View All
              </Link>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-700">All Payments Cleared</div>
              <p className="text-[11px] text-slate-400">
                You have zero overdue milestone invoices or pending escrow balances.
              </p>
            </div>
          </div>

          {/* Support Ticket Status */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm font-display text-slate-900">Support Desk</h3>
              </div>
              <Link to="/dashboard/help" className="text-[11px] font-bold text-navy-950 hover:underline">
                New Ticket
              </Link>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1 text-xs">
              <HelpCircle className="w-7 h-7 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">No Open Tickets</div>
              <p className="text-[11px] text-slate-400">
                Need assistance with site supervision, permits, or billing? Our dedicated support desk is standing by.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
