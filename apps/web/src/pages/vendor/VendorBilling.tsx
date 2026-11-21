import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  X,
  CreditCard,
  Plus,
  AlertTriangle,
  Scale,
  Ban,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { getVendorInvoices, getVendorByPhone } from '../../data/vendorStore.js';
import { VendorTaxInvoice } from '@ghar-design/shared';

export const VendorBilling: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';

  const [activeTab, setActiveTab] = useState<'ALL' | 'TAX_INVOICES' | 'CREDIT_NOTES' | 'CANCELLED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<VendorTaxInvoice | null>(null);

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const invoices = useMemo(() => {
    return getVendorInvoices(vendorId);
  }, [vendorId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'TAX_INVOICES') return !inv.isCancelled;
      if (activeTab === 'CANCELLED') return !!inv.isCancelled;
      if (activeTab === 'CREDIT_NOTES') return inv.invoiceNumber.includes('CN');

      return true;
    });
  }, [invoices, search, activeTab]);

  // Billing Metrics
  const metrics = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalTaxablePaise = invoices.reduce((acc, i) => acc + (i.isCancelled ? 0 : i.subtotalPaise || 0), 0);
    const totalGstCollectedPaise = invoices.reduce((acc, i) => acc + (i.isCancelled ? 0 : i.totalTaxPaise || 0), 0);
    const grossBilledPaise = invoices.reduce((acc, i) => acc + (i.isCancelled ? 0 : i.grandTotalPaise || 0), 0);

    return {
      totalInvoices,
      totalTaxable: Math.round(totalTaxablePaise / 100),
      totalGst: Math.round(totalGstCollectedPaise / 100),
      grossBilled: Math.round(grossBilledPaise / 100),
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Billing & Tax Invoices (GST Compliant)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indian GST compliant tax invoices with HSN/SAC codes, CGST/SGST/IGST breakdowns and credit notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-sky-50/30 border border-blue-200/80 rounded-xl text-xs">
            <span className="text-slate-400 block text-[10px] font-bold">VENDOR GSTIN</span>
            <span className="font-mono font-bold text-slate-800">
              {vendorRecord?.gstin || '07AAAAA0000A1Z5'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Invoices</span>
          <div className="text-2xl font-black font-display text-navy-950">{metrics.totalInvoices}</div>
          <span className="text-[10px] text-slate-400">Order-wise generated bills</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Taxable Revenue</span>
          <div className="text-2xl font-black font-display text-slate-900">
            ₹{metrics.totalTaxable.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400">Net taxable base amount</span>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total GST Collected</span>
          <div className="text-2xl font-black font-display text-emerald-700">
            ₹{metrics.totalGst.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold">Eligible for GST Input Tax Credit</span>
        </div>

        <div className="p-4 bg-navy-950 text-white rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Billed Value</span>
          <div className="text-2xl font-black font-display text-amber-400">
            ₹{metrics.grossBilled.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-300">Including freight and taxes</span>
        </div>
      </div>

      {/* Filter Tabs & Invoices Table */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('TAX_INVOICES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'TAX_INVOICES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Valid Tax Invoices ({invoices.filter((i) => !i.isCancelled).length})
            </button>
            <button
              onClick={() => setActiveTab('CREDIT_NOTES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'CREDIT_NOTES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
              }`}
            >
              Credit Notes (0)
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Cancelled / Void ({invoices.filter((i) => !!i.isCancelled).length})
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, order, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="overflow-x-auto rounded-xl border border-blue-200/80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
              <tr>
                <th className="py-3 px-3.5">Invoice Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Billed Customer</th>
                <th className="py-3 px-3 text-right">Taxable Value</th>
                <th className="py-3 px-3 text-right">GST Total</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No invoices matching the criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/70 transition">
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-slate-900 text-xs block">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">GST B2C / B2B</span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-blue-700 text-[11px]">
                      {inv.orderCode}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      <span className="text-[10px] text-slate-400 block">{inv.customerCity}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {formatINR(inv.subtotalPaise)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatINR(inv.totalTaxPaise)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                      {formatINR(inv.grandTotalPaise)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {inv.isCancelled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Tax Invoice
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition flex items-center gap-1"
                          title="View / Print Tax Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE GST TAX INVOICE MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-blue-200 text-slate-900 font-sans text-xs max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="border-b border-blue-200 pb-3 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TAX INVOICE (RULE 46 OF CGST RULES, 2017)</span>
                  </div>
                  <h2 className="text-xl font-black text-navy-950 mt-0.5">BUILDGHAR DEPOT GST INVOICE</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                      Invoice: {selectedInvoice.invoiceNumber}
                    </span>
                    <span className="font-mono text-slate-500">Date: {formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vendor & Customer B2B Details */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-sky-50/30 border border-blue-200/80 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">SELLER / SUPPLIER DETAILS</span>
                  <strong className="text-slate-900 block">{vendorRecord?.businessName || 'BuildGhar Partner Yard'}</strong>
                  <p className="text-slate-600 text-[11px]">{vendorRecord?.address?.street || 'Plot 4, Industrial Area'}</p>
                  <p className="text-slate-600 text-[11px]">
                    {vendorRecord?.address?.city || 'Delhi'} - {vendorRecord?.address?.pinCode || '110020'}
                  </p>
                  <p className="text-slate-800 font-mono font-bold text-[11px] mt-1">
                    GSTIN: {vendorRecord?.gstin || '07AAAAA0000A1Z5'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">BILL TO / RECIPIENT</span>
                  <strong className="text-slate-900 block">{selectedInvoice.customerName}</strong>
                  <p className="text-slate-600 text-[11px]">
                    {selectedInvoice.customerAddress || 'Construction Site Address'}
                  </p>
                  <p className="text-slate-600 text-[11px]">{selectedInvoice.customerCity || 'Delhi NCR'}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-1">
                    Order Ref: <strong>{selectedInvoice.orderCode}</strong>
                  </p>
                </div>
              </div>

              {/* Line Items Table with HSN & GST */}
              <div className="border border-blue-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 font-mono text-center">HSN</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-center">GST %</th>
                      <th className="p-2 text-right">Tax (₹)</th>
                      <th className="p-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-900">{it.productTitle}</td>
                        <td className="p-2 font-mono text-center text-slate-500 text-[11px]">{it.hsnCode}</td>
                        <td className="p-2 text-right font-mono">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2 text-right font-mono">{formatINR(it.taxableAmountPaise)}</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-800">{it.gstRatePercent}%</td>
                        <td className="p-2 text-right font-mono text-emerald-700">{formatINR(it.taxAmountPaise)}</td>
                        <td className="p-2 text-right font-mono font-black">{formatINR(it.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GST Calculation Breakup */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 block">TAX SPLIT BREAKDOWN</span>
                  <div className="flex justify-between text-slate-700">
                    <span>Central GST (CGST @ 9% / 14%):</span>
                    <span className="font-mono font-bold">{formatINR(Math.round(selectedInvoice.totalTaxPaise / 2))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>State GST (SGST @ 9% / 14%):</span>
                    <span className="font-mono font-bold">{formatINR(Math.round(selectedInvoice.totalTaxPaise / 2))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-950 font-bold border-t border-emerald-200 pt-1">
                    <span>Total Tax Liability:</span>
                    <span className="font-mono">{formatINR(selectedInvoice.totalTaxPaise)}</span>
                  </div>
                </div>

                <div className="p-3 bg-navy-950 text-white rounded-xl space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal (Excl. Tax):</span>
                    <span className="font-mono">{formatINR(selectedInvoice.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Freight / Shipping:</span>
                    <span className="font-mono">{formatINR(selectedInvoice.shippingChargesPaise || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>GST Output Tax:</span>
                    <span className="font-mono">{formatINR(selectedInvoice.totalTaxPaise)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-amber-400 border-t border-navy-800 pt-1">
                    <span>Grand Total:</span>
                    <span className="font-mono">{formatINR(selectedInvoice.grandTotalPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50/30"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-navy-900 transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
