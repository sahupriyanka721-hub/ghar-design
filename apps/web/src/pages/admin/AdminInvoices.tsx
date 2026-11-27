import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Search,
  Filter,
  ArrowUpRight,
  Printer,
  Building,
  Plus,
  CreditCard,
  Briefcase,
  FileCheck2,
  Download,
  Share2,
  Calendar,
} from 'lucide-react';
import {
  getTaxInvoices,
  saveTaxInvoice,
  TaxInvoiceItem,
  InvoiceType,
} from '../../data/financialLedgerStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export const AdminInvoices: React.FC = () => {
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState<TaxInvoiceItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | InvoiceType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoiceItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  // New Invoice Form
  const [newInv, setNewInv] = useState({
    invoiceType: 'CUSTOMER_TAX_INVOICE' as InvoiceType,
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    billedToName: 'Sharika Mishra',
    billedToPhone: '+91 98765 43210',
    billedToAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
    description: 'Milestone 3: Structural Detailing & MEP Blueprint Finalization',
    hsnSacCode: '998321',
    rateRupees: '150000',
  });

  const loadData = () => {
    try {
      const list = getTaxInvoices();
      setInvoices([...list]);
    } catch (err) {
      console.error('Error loading invoices:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('FINANCIAL_INVOICES_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('FINANCIAL_INVOICES_UPDATED', handleUpdate);
    };
  }, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      if (activeTab !== 'ALL' && i.invoiceType !== activeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = i.invoiceNumber.toLowerCase().includes(q);
        const matchCust = i.billedToName.toLowerCase().includes(q) || i.billedToPhone.toLowerCase().includes(q);
        const matchProj = i.projectId.toLowerCase().includes(q) || i.projectTitle.toLowerCase().includes(q);
        return matchNum || matchCust || matchProj;
      }
      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalGrandTotal = invoices.reduce((sum, i) => sum + i.grandTotalPaise, 0);
    const totalTax = invoices.reduce((sum, i) => sum + i.totalTaxPaise, 0);
    const customerInvoices = invoices.filter((i) => i.invoiceType === 'CUSTOMER_TAX_INVOICE');
    const receiptsCount = invoices.filter((i) => i.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT').length;

    return {
      totalGrandTotal,
      totalTax,
      customerInvoicesCount: customerInvoices.length,
      receiptsCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  const handleOpenPreview = (inv: TaxInvoiceItem) => {
    setSelectedInvoice(inv);
    setIsInvoiceModalOpen(true);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newInv.rateRupees);
    if (isNaN(rateNum) || rateNum <= 0) {
      error('Please enter a valid rate');
      return;
    }

    const subtotalPaise = Math.round(rateNum * 100);
    const cgstPaise = Math.round(subtotalPaise * 0.09); // 9%
    const sgstPaise = Math.round(subtotalPaise * 0.09); // 9%
    const totalTaxPaise = cgstPaise + sgstPaise;
    const grandTotalPaise = subtotalPaise + totalTaxPaise;

    const item: TaxInvoiceItem = {
      id: `INV-2026-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: `BG/2026-27/INV-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceType: newInv.invoiceType,
      invoiceDate: new Date().toISOString().split('T')[0],
      projectId: newInv.projectId,
      projectTitle: newInv.projectTitle,
      billedToName: newInv.billedToName,
      billedToPhone: newInv.billedToPhone,
      billedToAddress: newInv.billedToAddress,
      billedByName: 'BuildGhar Technologies Private Limited',
      billedByGstin: '07AAACB2489C1Z5',
      billedByPan: 'AAACB2489C',
      billedByAddress: 'Tower B, 4th Floor, Signature Towers, South City 1, Gurugram, HR - 122001',
      items: [
        {
          description: newInv.description,
          hsnSacCode: newInv.hsnSacCode,
          quantity: 1,
          ratePaise: subtotalPaise,
          amountPaise: subtotalPaise,
        },
      ],
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalTaxPaise,
      grandTotalPaise,
      paymentStatus: 'PAID',
    };

    saveTaxInvoice(item);

    logAdminAuditAction({
      action: 'TAX_INVOICE_GENERATED',
      targetType: 'INVOICE',
      targetId: item.invoiceNumber,
      description: `Issued Tax Invoice ${item.invoiceNumber} for ₹${(grandTotalPaise / 100).toLocaleString('en-IN')} to ${item.billedToName}`,
      metadata: { invoiceId: item.id, projectId: item.projectId },
    });

    success(`Tax invoice ${item.invoiceNumber} generated successfully!`);
    loadData();
    setIsNewInvoiceModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              Tax Invoices, Receipts & GST Billing
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 16 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Government GST & HSN/SAC 998321 Compliant: Tax Invoices, Payment Vouchers, and Partner Settlement Advice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/payments"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow Collections</span>
          </Link>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Gross Invoiced</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {formatINR(stats.totalGrandTotal)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            Across {stats.totalCount} issued financial documents
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total 18% GST Invoiced</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-950 font-display">
            {formatINR(stats.totalTax)}
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            CGST 9% + SGST 9% (SAC 998321)
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Customer Tax Invoices</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {stats.customerInvoicesCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Milestone billing & service invoices
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>GSTIN Entity</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-navy-950 font-mono mt-1">
            07AAACB2489C1Z5
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            BuildGhar Tech Pvt Ltd (State: 07)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Documents</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMER_TAX_INVOICE')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CUSTOMER_TAX_INVOICE'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Customer Tax Invoices</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-[10px] text-blue-700">
              {stats.customerInvoicesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMER_PAYMENT_RECEIPT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CUSTOMER_PAYMENT_RECEIPT'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payment Receipts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700">
              {stats.receiptsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECT_PAYOUT_VOUCHER')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ARCHITECT_PAYOUT_VOUCHER'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            <span>Payout Vouchers</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice Number (BG/2026-27/INV-XXXX), Customer Name, Project ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Billed To & Contact</th>
                <th className="py-3 px-4">Associated Project</th>
                <th className="py-3 px-4 text-right">Taxable Value</th>
                <th className="py-3 px-4 text-right">GST (18%)</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No financial invoices found</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(inv.invoiceDate)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.invoiceType === 'CUSTOMER_TAX_INVOICE'
                            ? 'blue'
                            : inv.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT'
                            ? 'emerald'
                            : 'purple'
                        }
                        className="text-[10px] font-bold"
                      >
                        {inv.invoiceType.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950">{inv.billedToName}</div>
                      <div className="text-[11px] text-slate-500">{inv.billedToPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-blue-700 font-semibold truncate max-w-xs flex items-center gap-1">
                        <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 rounded border border-blue-200">
                          {inv.projectId}
                        </span>
                        <span className="truncate">{inv.projectTitle}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatINR(inv.subtotalPaise)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-purple-700 font-medium">
                      {formatINR(inv.totalTaxPaise)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-navy-950 font-display text-sm">
                        {formatINR(inv.grandTotalPaise)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Paid</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(inv)}
                          title="View & Print Official GST Invoice"
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View / Print</span>
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

      {/* Official GST Tax Invoice Preview Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto animate-scale-in">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-xs font-bold uppercase tracking-wider">
                  Tax Invoice (Rule 46 CGST Rules, 2017)
                </Badge>
                <span className="text-xs font-mono text-slate-500">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Paper Layout */}
            <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-xs text-slate-800 font-sans shadow-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div>
                  <h1 className="text-xl font-bold font-display text-navy-950">
                    BUILDGHAR TECHNOLOGIES PRIVATE LIMITED
                  </h1>
                  <p className="text-[11px] text-slate-600 max-w-md mt-0.5">
                    Tower B, 4th Floor, Signature Towers, South City 1, Gurugram, Haryana - 122001
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-700 mt-2">
                    <div><span className="font-bold text-slate-900">GSTIN:</span> 07AAACB2489C1Z5</div>
                    <div><span className="font-bold text-slate-900">PAN:</span> AAACB2489C</div>
                    <div><span className="font-bold text-slate-900">State:</span> Haryana (Code: 07)</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-navy-950">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: <span className="font-semibold text-slate-800">{formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Place of Supply: <span className="font-semibold text-slate-800">Madhya Pradesh (23)</span>
                  </div>
                </div>
              </div>

              {/* Billed To / Shipped To */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer / Billed To
                  </span>
                  <div className="font-bold text-navy-950 text-sm mt-0.5">{selectedInvoice.billedToName}</div>
                  <div className="text-slate-600 mt-0.5">{selectedInvoice.billedToAddress}</div>
                  <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                    Phone: {selectedInvoice.billedToPhone}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Project Association
                  </span>
                  <div className="font-bold text-navy-950 mt-0.5">{selectedInvoice.projectTitle}</div>
                  <div className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">
                    Project ID: {selectedInvoice.projectId}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Status: <span className="font-bold text-emerald-700">PAID & CLEARED IN ESCROW</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Professional Service</th>
                      <th className="py-2.5 px-3 text-center font-mono">SAC Code</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Taxable Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-navy-950">{item.description}</div>
                          <div className="text-[10px] text-slate-500">
                            Milestone verification completed & technical sign-off recorded.
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700 font-bold">
                          {item.hsnSacCode}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-medium">
                          {formatINR(item.ratePaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatINR(item.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>Central GST (CGST @ 9%):</span>
                    <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.cgstPaise)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>State GST (SGST @ 9%):</span>
                    <span className="font-semibold text-slate-900">{formatINR(selectedInvoice.sgstPaise)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-slate-900 font-bold text-navy-950 text-sm">
                    <span>Total Invoice Amount (INR):</span>
                    <span className="font-display text-base text-blue-900">
                      {formatINR(selectedInvoice.grandTotalPaise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipt Acknowledgement */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Electronic Payment Confirmed via BuildGhar Platform Escrow Account</span>
                </div>
                <span className="font-mono font-bold text-[11px] text-emerald-800">
                  {selectedInvoice.linkedTransactionId || 'PAY-CLEARED'}
                </span>
              </div>

              {/* Footer & Authorized Signatory */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-700">Terms & Conditions:</div>
                  <p className="mt-0.5">1. Services rendered under Indian Architects Council & Bureau of Indian Standards (IS 456).</p>
                  <p>2. Customer funds are held in platform escrow until stage completion inspection is verified.</p>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <div className="font-bold text-slate-800">For BuildGhar Technologies Private Limited</div>
                  <div className="font-bold text-blue-900 font-display mt-2">Authorized Financial Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Tax Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Issue Official GST Tax Invoice</h3>
                  <p className="text-[11px] text-slate-500">SAC Code 998321 Architectural & Engineering Services</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Project ID</label>
                  <input
                    type="text"
                    required
                    value={newInv.projectId}
                    onChange={(e) => setNewInv({ ...newInv, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Document Type</label>
                  <select
                    value={newInv.invoiceType}
                    onChange={(e) => setNewInv({ ...newInv, invoiceType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="CUSTOMER_TAX_INVOICE">Customer Tax Invoice</option>
                    <option value="CUSTOMER_PAYMENT_RECEIPT">Customer Payment Receipt</option>
                    <option value="ARCHITECT_PAYOUT_VOUCHER">Architect Payout Voucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newInv.projectTitle}
                  onChange={(e) => setNewInv({ ...newInv, projectTitle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billed To Name</label>
                  <input
                    type="text"
                    required
                    value={newInv.billedToName}
                    onChange={(e) => setNewInv({ ...newInv, billedToName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billed To Phone</label>
                  <input
                    type="text"
                    required
                    value={newInv.billedToPhone}
                    onChange={(e) => setNewInv({ ...newInv, billedToPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Billed To Site Address</label>
                <input
                  type="text"
                  required
                  value={newInv.billedToAddress}
                  onChange={(e) => setNewInv({ ...newInv, billedToAddress: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Line Item Description</label>
                <input
                  type="text"
                  required
                  value={newInv.description}
                  onChange={(e) => setNewInv({ ...newInv, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Taxable Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInv.rateRupees}
                    onChange={(e) => setNewInv({ ...newInv, rateRupees: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy-950 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    required
                    value={newInv.hsnSacCode}
                    onChange={(e) => setNewInv({ ...newInv, hsnSacCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                18% GST (CGST 9% + SGST 9%) will automatically be computed and added to the taxable rate.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold px-4 py-2 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate & Save Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
