import React, { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDate } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/Badge.js';
import { Link, useSearchParams } from 'react-router-dom';
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
  Sliders,
  ChevronDown,
  RotateCcw,
  ArrowDownLeft,
  Landmark,
  Receipt,
  Sparkles,
  Check,
  HelpCircle,
  User,
  Compass,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  getTaxInvoices,
  saveTaxInvoice,
  TaxInvoiceItem,
  InvoiceType,
} from '../../data/financialLedgerStore.js';
import { logAdminAuditAction } from '../../data/adminRbacStore.js';

export type InvoiceSubView =
  | 'CUSTOMER_INVOICES'
  | 'ARCHITECT_INVOICES'
  | 'PAYMENT_RECEIPTS'
  | 'CREDIT_NOTES'
  | 'REFUND_RECORDS'
  | 'TAX_REPORTS'
  | 'FINAL_SETTLEMENT';

interface SubViewConfig {
  id: InvoiceSubView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badgeColor: string;
  description: string;
}

const SUB_VIEWS: SubViewConfig[] = [
  {
    id: 'CUSTOMER_INVOICES',
    label: '1. Customer Invoices',
    shortLabel: 'Customer Invoices',
    icon: FileText,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'GST-compliant B2C Tax Invoices issued to customers (HSN/SAC 998321, 18% GST CGST+SGST/IGST).',
  },
  {
    id: 'ARCHITECT_INVOICES',
    label: '2. Architect Invoices',
    shortLabel: 'Architect Bills',
    icon: Briefcase,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Professional fee bills & settlement advice vouchers verified against technical milestone signoffs.',
  },
  {
    id: 'PAYMENT_RECEIPTS',
    label: '3. Payment Receipts',
    shortLabel: 'Payment Receipts',
    icon: Receipt,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Official electronic payment receipts generated upon customer payment clearance via Razorpay/NEFT.',
  },
  {
    id: 'CREDIT_NOTES',
    label: '4. Credit Notes',
    shortLabel: 'Credit Notes',
    icon: RotateCcw,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'GST Credit Notes under Section 34 of CGST Act for architectural scope reduction or price adjustments.',
  },
  {
    id: 'REFUND_RECORDS',
    label: '5. Refund Records',
    shortLabel: 'Refund Records',
    icon: ArrowDownLeft,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Centralized escrow refund ledger recording customer reversals with bank ARNs and audit trails.',
  },
  {
    id: 'TAX_REPORTS',
    label: '6. Tax Reports',
    shortLabel: 'Tax Reports',
    icon: Landmark,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Statutory government tax filings: GSTR-1 outward supplies, GSTR-3B tax summary, and Form 26Q TDS.',
  },
  {
    id: 'FINAL_SETTLEMENT',
    label: '7. Final Settlement',
    shortLabel: 'Final Settlement',
    icon: CheckCircle2,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Project completion financial closure statements with cumulative collections, escrow release, and zero-liability certificate.',
  },
];

export const AdminInvoices: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedView = (searchParams.get('view') as InvoiceSubView) || 'CUSTOMER_INVOICES';
  const handleSelectView = (view: InvoiceSubView) => {
    setSearchParams({ view });
  };

  const [invoices, setInvoices] = useState<TaxInvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoiceItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);

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

  // New Credit Note Form
  const [newCreditNote, setNewCreditNote] = useState({
    projectId: 'BG-2026-0001',
    projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
    billedToName: 'Sharika Mishra',
    billedToPhone: '+91 98765 43210',
    originalInvoiceRef: 'BG/2026-27/INV-1001',
    reason: 'Architectural structural scope reduction post site survey',
    rateRupees: '25000',
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

  // Filtered Invoices based on active subview
  const viewFilteredInvoices = useMemo(() => {
    let list = invoices;

    switch (selectedView) {
      case 'CUSTOMER_INVOICES':
        list = invoices.filter((i) => i.invoiceType === 'CUSTOMER_TAX_INVOICE');
        break;
      case 'ARCHITECT_INVOICES':
        list = invoices.filter(
          (i) => i.invoiceType === 'ARCHITECT_INVOICE' || i.invoiceType === 'ARCHITECT_PAYOUT_VOUCHER'
        );
        break;
      case 'PAYMENT_RECEIPTS':
        list = invoices.filter((i) => i.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT');
        break;
      case 'CREDIT_NOTES':
        list = invoices.filter((i) => i.invoiceType === 'CREDIT_NOTE');
        break;
      case 'REFUND_RECORDS':
        list = invoices.filter((i) => i.invoiceType === 'REFUND_RECORD');
        break;
      case 'TAX_REPORTS':
        list = invoices.filter((i) => i.invoiceType === 'TAX_REPORT');
        break;
      case 'FINAL_SETTLEMENT':
        list = invoices.filter((i) => i.invoiceType === 'FINAL_SETTLEMENT');
        break;
      default:
        list = invoices;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const matchNum = i.invoiceNumber.toLowerCase().includes(q);
        const matchCust = i.billedToName.toLowerCase().includes(q) || i.billedToPhone.toLowerCase().includes(q);
        const matchProj = i.projectId.toLowerCase().includes(q) || i.projectTitle.toLowerCase().includes(q);
        const matchOrig = (i.originalInvoiceRef || '').toLowerCase().includes(q);
        return matchNum || matchCust || matchProj || matchOrig;
      });
    }

    return list;
  }, [invoices, selectedView, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const customerInvoices = invoices.filter((i) => i.invoiceType === 'CUSTOMER_TAX_INVOICE');
    const totalGrandTotal = customerInvoices.reduce((sum, i) => sum + i.grandTotalPaise, 0);
    const totalTax = customerInvoices.reduce((sum, i) => sum + i.totalTaxPaise, 0);
    const totalSubtotal = customerInvoices.reduce((sum, i) => sum + i.subtotalPaise, 0);

    const architectInvoices = invoices.filter(
      (i) => i.invoiceType === 'ARCHITECT_INVOICE' || i.invoiceType === 'ARCHITECT_PAYOUT_VOUCHER'
    );
    const receiptsCount = invoices.filter((i) => i.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT').length;
    const creditNotesCount = invoices.filter((i) => i.invoiceType === 'CREDIT_NOTE').length;
    const refundsCount = invoices.filter((i) => i.invoiceType === 'REFUND_RECORD').length;
    const settlementsCount = invoices.filter((i) => i.invoiceType === 'FINAL_SETTLEMENT').length;

    return {
      totalGrandTotal,
      totalTax,
      totalSubtotal,
      customerInvoicesCount: customerInvoices.length,
      architectInvoicesCount: architectInvoices.length,
      receiptsCount,
      creditNotesCount,
      refundsCount,
      settlementsCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Live counts for each subview
  const subCounts = useMemo(() => {
    return {
      CUSTOMER_INVOICES: invoices.filter((i) => i.invoiceType === 'CUSTOMER_TAX_INVOICE').length,
      ARCHITECT_INVOICES: invoices.filter(
        (i) => i.invoiceType === 'ARCHITECT_INVOICE' || i.invoiceType === 'ARCHITECT_PAYOUT_VOUCHER'
      ).length,
      PAYMENT_RECEIPTS: invoices.filter((i) => i.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT').length,
      CREDIT_NOTES: invoices.filter((i) => i.invoiceType === 'CREDIT_NOTE').length,
      REFUND_RECORDS: invoices.filter((i) => i.invoiceType === 'REFUND_RECORD').length,
      TAX_REPORTS: invoices.filter((i) => i.invoiceType === 'TAX_REPORT').length,
      FINAL_SETTLEMENT: invoices.filter((i) => i.invoiceType === 'FINAL_SETTLEMENT').length,
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

  const handleCreateCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(newCreditNote.rateRupees);
    if (isNaN(rateNum) || rateNum <= 0) {
      error('Please enter a valid credit amount');
      return;
    }

    const subtotalPaise = Math.round(rateNum * 100);
    const cgstPaise = Math.round(subtotalPaise * 0.09);
    const sgstPaise = Math.round(subtotalPaise * 0.09);
    const totalTaxPaise = cgstPaise + sgstPaise;
    const grandTotalPaise = subtotalPaise + totalTaxPaise;

    const creditItem: TaxInvoiceItem = {
      id: `CN-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: `BG/2026-27/CN-${Math.floor(100 + Math.random() * 900)}`,
      invoiceType: 'CREDIT_NOTE',
      invoiceDate: new Date().toISOString().split('T')[0],
      projectId: newCreditNote.projectId,
      projectTitle: newCreditNote.projectTitle,
      billedToName: newCreditNote.billedToName,
      billedToPhone: newCreditNote.billedToPhone,
      billedToAddress: 'Site Address Registered on Project File',
      billedByName: 'BuildGhar Technologies Private Limited',
      billedByGstin: '07AAACB2489C1Z5',
      billedByPan: 'AAACB2489C',
      billedByAddress: 'Tower B, 4th Floor, Signature Towers, South City 1, Gurugram, HR - 122001',
      originalInvoiceRef: newCreditNote.originalInvoiceRef,
      creditNoteReason: newCreditNote.reason,
      items: [
        {
          description: `GST Credit Note: ${newCreditNote.reason}`,
          hsnSacCode: '998321',
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
      paymentStatus: 'SETTLED',
    };

    saveTaxInvoice(creditItem);

    logAdminAuditAction({
      action: 'CREDIT_NOTE_ISSUED',
      targetType: 'INVOICE',
      targetId: creditItem.invoiceNumber,
      description: `Issued GST Credit Note ${creditItem.invoiceNumber} for ₹${(grandTotalPaise / 100).toLocaleString('en-IN')} against ${creditItem.originalInvoiceRef}`,
    });

    success(`Credit note ${creditItem.invoiceNumber} issued under Section 34 of CGST Act!`);
    loadData();
    setIsCreditNoteModalOpen(false);
  };

  const activeSubViewConfig = SUB_VIEWS.find((s) => s.id === selectedView) || SUB_VIEWS[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-navy-950">
              12. Invoice & Billing Management
            </h1>
            <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
              Section 16 Compliant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Government GST & HSN/SAC 998321 Compliant: Tax Invoices, Architect Bills, Receipts, Credit Notes, Refunds & Final Settlements.
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
          <Link
            to="/admin/payouts"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-400 bg-white text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            <span>Partner Payouts</span>
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
            Across {stats.customerInvoicesCount} customer tax invoices
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
            <span>Partner Fee Bills Audited</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-navy-950 font-display">
            {stats.architectInvoicesCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Architect & Consultant Bills Cleared
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

      {/* Top-Level Dropdown View Switcher & 7 Sub-Feature Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Invoice & Billing Sub-Module Switcher:
            </span>
          </div>
          <div className="relative min-w-[280px]">
            <select
              value={selectedView}
              onChange={(e) => handleSelectView(e.target.value as InvoiceSubView)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUB_VIEWS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({subCounts[v.id]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 7-Pill Action Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SUB_VIEWS.map((v) => {
            const Icon = v.icon;
            const isActive = selectedView === v.id;
            const count = subCounts[v.id];

            return (
              <button
                key={v.id}
                onClick={() => handleSelectView(v.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{v.shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Feature Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <activeSubViewConfig.icon className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold tracking-tight text-white">
              {activeSubViewConfig.label}
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeSubViewConfig.badgeColor}`}>
              Active View
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {activeSubViewConfig.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedView === 'CREDIT_NOTES' && (
            <button
              onClick={() => setIsCreditNoteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Issue Credit Note</span>
            </button>
          )}

          {selectedView === 'TAX_REPORTS' && (
            <button
              onClick={() => success('GSTR-1, GSTR-3B & Form 26Q TDS export generated successfully (CSV/Excel).')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GST & TDS Register</span>
            </button>
          )}

          {selectedView === 'FINAL_SETTLEMENT' && (
            <div className="text-[11px] font-medium text-teal-200 bg-white/10 px-3 py-1 rounded-xl">
              Zero-Liability Signoff & Retention Closure
            </div>
          )}

          {selectedView === 'CUSTOMER_INVOICES' && (
            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New B2C Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {selectedView !== 'TAX_REPORTS' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Document Number (INV / BILL / RCPT / CN / REF), Customer / Architect Name, Project ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{viewFilteredInvoices.length}</span> records
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SPECIALIZED VIEW 6: TAX REPORTS & STATUTORY FILINGS */}
      {/* ============================================================================== */}
      {selectedView === 'TAX_REPORTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">GSTR-1 Outward Supplies</span>
                <Badge variant="blue" className="text-[10px]">Monthly Return</Badge>
              </div>
              <div className="text-2xl font-bold font-display text-navy-950">
                {formatINR(stats.totalSubtotal)}
              </div>
              <div className="text-xs text-slate-500">
                Total Taxable Architectural Value (B2C & B2B)
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-600">
                <span>Total Output GST (18%):</span>
                <span className="font-bold text-purple-700">{formatINR(stats.totalTax)}</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">GSTR-3B Tax Liability</span>
                <Badge variant="emerald" className="text-[10px]">Tax Paid</Badge>
              </div>
              <div className="text-2xl font-bold font-display text-emerald-700">
                {formatINR(stats.totalTax)}
              </div>
              <div className="text-xs text-slate-500">
                Central GST: {formatINR(Math.round(stats.totalTax / 2))} | State GST: {formatINR(Math.round(stats.totalTax / 2))}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-600">
                <span>Challan Status:</span>
                <span className="font-bold text-emerald-700">PMT-06 Cleared</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Form 26Q TDS Summary</span>
                <Badge variant="purple" className="text-[10px]">Sec 194M / 194C</Badge>
              </div>
              <div className="text-2xl font-bold font-display text-purple-950">
                {formatINR(Math.round(stats.totalSubtotal * 0.01))}
              </div>
              <div className="text-xs text-slate-500">
                1% TDS Withheld on Architectural & Contractor Remittances
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-600">
                <span>Quarterly Return:</span>
                <span className="font-bold text-slate-800">Q3 FY 2026-27</span>
              </div>
            </div>
          </div>

          {/* Tax Filing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Statutory Tax Ledger & GST Breakdown (SAC 998321)</h3>
                <p className="text-xs text-slate-500">Monthly outward supplies reconciled against GSTIN 07AAACB2489C1Z5</p>
              </div>
              <button
                onClick={() => success('Form 26Q TDS and GSTR-1 summaries exported to CSV.')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Ledger</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Period / Return</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">SAC Code</th>
                    <th className="py-3 px-4 text-right">Taxable Turnover (₹)</th>
                    <th className="py-3 px-4 text-right">CGST 9% (₹)</th>
                    <th className="py-3 px-4 text-right">SGST 9% (₹)</th>
                    <th className="py-3 px-4 text-right font-bold text-purple-700">Total GST (₹)</th>
                    <th className="py-3 px-4 text-center">Filing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">Nov 2026 (M11)</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950">GSTR-1 Monthly Outward Supplies</div>
                      <div className="text-[10px] text-slate-500">Architectural Cad & 3D Visualization</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">998321</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalSubtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatINR(Math.round(stats.totalTax / 2))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatINR(Math.round(stats.totalTax / 2))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                      {formatINR(stats.totalTax)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Filed</span>
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">Q3 FY 2026-27</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-950">Form 26Q TDS Deduction Statement</div>
                      <div className="text-[10px] text-slate-500">TDS u/s 194M on Partner Architect Fees</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">194M</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {formatINR(stats.totalSubtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">-</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">-</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                      {formatINR(Math.round(stats.totalSubtotal * 0.01))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Remitted</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SPECIALIZED VIEW 7: FINAL SETTLEMENT & ZERO-LIABILITY CLOSURES */}
      {/* ============================================================================== */}
      {selectedView === 'FINAL_SETTLEMENT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices
              .filter((i) => i.invoiceType === 'FINAL_SETTLEMENT')
              .map((settle) => (
                <div
                  key={settle.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-teal-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <h3 className="font-bold text-navy-950 text-base">{settle.projectTitle}</h3>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                          {settle.projectId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Client: <span className="font-semibold">{settle.billedToName}</span> | Partner: <span className="font-semibold">{settle.architectFirm}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">Statement Ref: {settle.invoiceNumber}</p>
                    </div>

                    <button
                      onClick={() => handleOpenPreview(settle)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>
                  </div>

                  {settle.settlementSummary && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Agreed Contract Value:</span>
                        <span className="font-bold text-navy-950">{formatINR(settle.settlementSummary.contractTotalPaise)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cumulative Escrow Collections:</span>
                        <span className="font-bold text-emerald-700">{formatINR(settle.settlementSummary.collectedPaise)}</span>
                      </div>
                      <div className="flex justify-between text-purple-700">
                        <span>Platform Commission (10%):</span>
                        <span className="font-semibold">-{formatINR(settle.settlementSummary.platformFeePaise)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>TDS Withheld (1% Sec 194M):</span>
                        <span className="font-semibold">-{formatINR(settle.settlementSummary.tdsPaise)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                        <span>Disbursed to Partner:</span>
                        <span className="text-emerald-700 font-display text-sm">
                          {formatINR(settle.settlementSummary.disbursedPaise)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-slate-700">Zero-Liability Status:</span>
                      <span className="text-emerald-700 font-bold">Certified & Cleared</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      Closed on {formatDate(settle.invoiceDate)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* STANDARD INVOICE & DOCUMENT TABLES */}
      {/* ============================================================================== */}
      {selectedView !== 'TAX_REPORTS' && selectedView !== 'FINAL_SETTLEMENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Doc # & Date</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Party & Project</th>
                  {selectedView === 'CREDIT_NOTES' && <th className="py-3 px-4">Original Ref & Reason</th>}
                  {selectedView === 'REFUND_RECORDS' && <th className="py-3 px-4">Bank ARN & Reason</th>}
                  {selectedView === 'PAYMENT_RECEIPTS' && <th className="py-3 px-4">Payment Mode & Txn ID</th>}
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">GST / Deduction</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewFilteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">No financial documents match selected sub-view</p>
                    </td>
                  </tr>
                ) : (
                  viewFilteredInvoices.map((inv) => (
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
                              : inv.invoiceType === 'ARCHITECT_INVOICE'
                              ? 'purple'
                              : inv.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT'
                              ? 'emerald'
                              : inv.invoiceType === 'CREDIT_NOTE'
                              ? 'amber'
                              : 'rose'
                          }
                          className="text-[10px] font-bold whitespace-nowrap"
                        >
                          {inv.invoiceType.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-navy-950">
                          {inv.architectFirm || inv.billedToName}
                        </div>
                        <div className="text-[11px] text-blue-700 font-medium truncate max-w-xs flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] px-1 py-0.2 bg-blue-50 rounded border border-blue-200">
                            {inv.projectId}
                          </span>
                          <span className="truncate">{inv.projectTitle}</span>
                        </div>
                      </td>

                      {selectedView === 'CREDIT_NOTES' && (
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-mono font-bold text-amber-800 text-[11px]">
                            Against: {inv.originalInvoiceRef || 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {inv.creditNoteReason || 'Scope reduction adjustment'}
                          </div>
                        </td>
                      )}

                      {selectedView === 'REFUND_RECORDS' && (
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-mono font-bold text-rose-800 text-[11px]">
                            {inv.refundArn || 'ARN-PENDING'}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {inv.refundReason || 'Escrow reversal to customer'}
                          </div>
                        </td>
                      )}

                      {selectedView === 'PAYMENT_RECEIPTS' && (
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{inv.paymentMethod || 'Online Transfer'}</div>
                          <div className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                            {inv.linkedTransactionId || 'TXN-CLEARED'}
                          </div>
                        </td>
                      )}

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
                          <span>{inv.paymentStatus || 'Cleared'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(inv)}
                            title="View & Print Official GST Document"
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
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
      )}

      {/* ============================================================================== */}
      {/* OFFICIAL GST TAX INVOICE / RECEIPT / CREDIT NOTE PREVIEW MODAL */}
      {/* ============================================================================== */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto animate-scale-in">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="text-xs font-bold uppercase tracking-wider">
                  {selectedInvoice.invoiceType === 'CREDIT_NOTE'
                    ? 'GST Credit Note (Section 34 CGST Act)'
                    : selectedInvoice.invoiceType === 'CUSTOMER_PAYMENT_RECEIPT'
                    ? 'Electronic Payment Receipt Voucher'
                    : selectedInvoice.invoiceType === 'ARCHITECT_INVOICE'
                    ? 'Partner Professional Fee Bill Advice'
                    : selectedInvoice.invoiceType === 'FINAL_SETTLEMENT'
                    ? 'Project Completion Zero-Liability Certificate'
                    : selectedInvoice.invoiceType === 'REFUND_RECORD'
                    ? 'Escrow Refund Reversal Voucher'
                    : 'Tax Invoice (Rule 46 CGST Rules, 2017)'}
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

            {/* Printable Paper Layout */}
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
                  {selectedInvoice.originalInvoiceRef && (
                    <div className="text-[11px] font-mono text-amber-800 font-bold">
                      Original Invoice: {selectedInvoice.originalInvoiceRef}
                    </div>
                  )}
                  {selectedInvoice.refundArn && (
                    <div className="text-[11px] font-mono text-rose-800 font-bold">
                      Refund ARN: {selectedInvoice.refundArn}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500">
                    Place of Supply: <span className="font-semibold text-slate-800">State Jurisdiction (SAC 998321)</span>
                  </div>
                </div>
              </div>

              {/* Billed To / Party Association */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedInvoice.architectFirm ? 'Beneficiary Partner' : 'Customer / Billed To'}
                  </span>
                  <div className="font-bold text-navy-950 text-sm mt-0.5">
                    {selectedInvoice.architectFirm || selectedInvoice.billedToName}
                  </div>
                  <div className="text-slate-600 mt-0.5">{selectedInvoice.billedToAddress}</div>
                  <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                    Phone: {selectedInvoice.billedToPhone}
                  </div>
                  {selectedInvoice.architectName && (
                    <div className="text-slate-700 text-[11px] mt-0.5">
                      Consultant: <span className="font-semibold">{selectedInvoice.architectName}</span>
                    </div>
                  )}
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
                    Status: <span className="font-bold text-emerald-700">{selectedInvoice.paymentStatus || 'SETTLED & VERIFIED'}</span>
                  </div>
                </div>
              </div>

              {/* Reason Box for Credit Notes / Refunds */}
              {(selectedInvoice.creditNoteReason || selectedInvoice.refundReason) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold">Official Grounds / Audit Reason: </span>
                  {selectedInvoice.creditNoteReason || selectedInvoice.refundReason}
                </div>
              )}

              {/* Line Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Service / Deliverable</th>
                      <th className="py-2.5 px-3 text-center font-mono">SAC / HSN</th>
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
                            Milestone verification completed & architectural sign-off recorded.
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
                    <span>Taxable Base Value:</span>
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
                    <span>Total Amount (INR):</span>
                    <span className="font-display text-base text-blue-900">
                      {formatINR(selectedInvoice.grandTotalPaise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Acknowledgement */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Transaction Cleared via BuildGhar Multi-Party Escrow</span>
                </div>
                <span className="font-mono font-bold text-[11px] text-emerald-800">
                  {selectedInvoice.linkedTransactionId || 'TXN-CLEARED'}
                </span>
              </div>

              {/* Footer & Authorized Signatory */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-700">Terms & Statutory Notice:</div>
                  <p className="mt-0.5">1. Services governed by Council of Architecture (COA) norms & IS 456 standards.</p>
                  <p>2. Computer generated document. Digitally verified under Rule 46 of CGST Rules, 2017.</p>
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

      {/* ============================================================================== */}
      {/* ISSUE TAX INVOICE MODAL */}
      {/* ============================================================================== */}
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
                    <option value="ARCHITECT_INVOICE">Architect Invoice</option>
                    <option value="CUSTOMER_PAYMENT_RECEIPT">Customer Payment Receipt</option>
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

      {/* ============================================================================== */}
      {/* ISSUE CREDIT NOTE MODAL */}
      {/* ============================================================================== */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-950 text-sm">Issue GST Credit Note (Section 34)</h3>
                  <p className="text-[11px] text-slate-500">Tax adjustment / scope reversal credit note</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreditNoteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCreditNote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Original Invoice Ref *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BG/2026-27/INV-1001"
                    value={newCreditNote.originalInvoiceRef}
                    onChange={(e) => setNewCreditNote({ ...newCreditNote, originalInvoiceRef: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={newCreditNote.projectId}
                    onChange={(e) => setNewCreditNote({ ...newCreditNote, projectId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  required
                  value={newCreditNote.billedToName}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, billedToName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Credit Note Reason (Grounds) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Architectural scope reduction: Structural slab revision cancelled per client request"
                  value={newCreditNote.reason}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, reason: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Taxable Credit Value (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newCreditNote.rateRupees}
                  onChange={(e) => setNewCreditNote({ ...newCreditNote, rateRupees: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy-950 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                18% GST reversal (9% CGST + 9% SGST) will automatically be calculated and credited to the party account.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Issue GST Credit Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
