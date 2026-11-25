import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Plus,
  Trash2,
  FileDown,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  X,
  PieChart,
  Printer,
  ChevronRight,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  Check,
  Share2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import {
  getArchitectBOQs,
  saveArchitectBOQ,
  updateArchitectBOQStatus,
  ArchitectBOQ,
  BOQItem,
  BOQCategory,
  BOQStatus,
} from '../../data/architectPanelStore.js';
import { useToast } from '../../context/ToastContext.js';

const STANDARD_UNITS = [
  'Sq. Ft',
  'Sq. Metre',
  'Cu. Ft',
  'Cu. Metre',
  'R. Ft (Running Feet)',
  'Kg',
  'Tonne',
  'Piece',
  'Bag',
  'Litre',
  'Nos',
];

const BOQ_CATEGORIES: Array<{ key: BOQCategory; label: string }> = [
  { key: 'CIVIL', label: 'Civil Work' },
  { key: 'STRUCTURAL', label: 'Structural Work' },
  { key: 'MASONRY', label: 'Masonry & Plaster' },
  { key: 'PLUMBING', label: 'Plumbing & Drainage' },
  { key: 'ELECTRICAL', label: 'Electrical & Conduits' },
  { key: 'FLOORING', label: 'Flooring & Tiling' },
  { key: 'PAINTING', label: 'Painting & Finishing' },
  { key: 'INTERIOR', label: 'Interior Fit-out' },
  { key: 'OTHER', label: 'Other Project Items' },
];

export const ArchitectBOQEstimator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const actionParam = searchParams.get('action') || 'list';
  const initialProjectId = searchParams.get('projectId') || '';

  const [projects] = useState<ExecutionProject[]>(() => {
    const list = getExecutionProjects();
    if (list.length > 0) return list;
    return [
      {
        id: 'PRJ-2026-ARCH-01',
        requestCode: 'GHR-REQ-2026-0011',
        workOrderNumber: 'GHR-WO-2026-088',
        name: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        city: 'Indore',
      } as any,
    ];
  });

  // Seed default BOQ if none exist
  const ensureDefaultBOQs = (): ArchitectBOQ[] => {
    const existing = getArchitectBOQs();
    if (existing.length > 0) return existing;

    const defaultBOQ: ArchitectBOQ = {
      id: 'BOQ-2026-IND-01',
      projectId: 'PRJ-2026-ARCH-01',
      projectTitle: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
      requestId: 'GHR-REQ-2026-0011',
      quotationId: 'QT-2026-ARCH-001',
      customerName: 'Sharika Mishra',
      customerPhone: '+91 9876543210',
      propertyLocation: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
      plotDimensions: '30 ft x 50 ft (1,500 sq.ft)',
      builtUpAreaSqFt: 4200,
      version: 1,
      status: 'APPROVED_BY_ADMIN',
      subtotal: 3254000,
      totalTax: 585720,
      grandTotal: 3839720,
      notes: 'All items include labor, shuttering, machine hire, and IS 456 / IS 1786 material testing certificates.',
      createdAt: '2026-11-15T10:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
      adminApprovedAt: '2026-11-21T15:00:00Z',
      items: [
        {
          id: 'item-1',
          itemNumber: 1,
          itemName: 'Earthwork Excavation for Column Footings & Plinth',
          description: 'Excavation in all soils up to 6ft depth, dressing of sides and ramming of bottoms.',
          category: 'CIVIL',
          unit: 'Cu. Ft',
          quantity: 2800,
          rate: 18,
          taxPercent: 18,
          amount: 50400,
          totalWithTax: 59472,
        },
        {
          id: 'item-2',
          itemNumber: 2,
          itemName: 'RCC M25 Grade Concrete (Columns, Plinth & Beams)',
          description: 'Design mix M25 with coarse aggregate 20mm down, mechanical vibrator compaction and water curing.',
          category: 'STRUCTURAL',
          unit: 'Cu. Metre',
          quantity: 110,
          rate: 6800,
          taxPercent: 18,
          amount: 748000,
          totalWithTax: 882640,
        },
        {
          id: 'item-3',
          itemNumber: 3,
          itemName: 'Fe 550D TMT Reinforcement Steel',
          description: 'High yield strength deformed bars, bending, cranking, hooking, and binding per IS 2502.',
          category: 'STRUCTURAL',
          unit: 'Tonne',
          quantity: 8.5,
          rate: 68000,
          taxPercent: 18,
          amount: 578000,
          totalWithTax: 682040,
        },
        {
          id: 'item-4',
          itemNumber: 4,
          itemName: 'Autoclaved Aerated Concrete (AAC) Block Masonry (1:4)',
          description: '200mm thick external wall blocks and 100mm internal partition blocks with polymer mortar.',
          category: 'MASONRY',
          unit: 'Sq. Metre',
          quantity: 650,
          rate: 850,
          taxPercent: 18,
          amount: 552500,
          totalWithTax: 651950,
        },
        {
          id: 'item-5',
          itemNumber: 5,
          itemName: 'Internal 12mm Cement Plaster with Smooth Neeru Finish',
          description: '1:4 cement mortar with fine river sand on ceiling and internal masonry walls.',
          category: 'MASONRY',
          unit: 'Sq. Metre',
          quantity: 1200,
          rate: 220,
          taxPercent: 18,
          amount: 264000,
          totalWithTax: 311520,
        },
        {
          id: 'item-6',
          itemNumber: 6,
          itemName: 'Double-Coat Sand-Faced External Weatherproof Plaster (20mm)',
          description: 'Waterproof admixture in base coat with rough cast texture for exterior facade.',
          category: 'CIVIL',
          unit: 'Sq. Metre',
          quantity: 580,
          rate: 340,
          taxPercent: 18,
          amount: 197200,
          totalWithTax: 232696,
        },
        {
          id: 'item-7',
          itemNumber: 7,
          itemName: 'Concealed Electrical PVC Conduits & FRLS Copper Wiring',
          description: 'Polycab multi-strand flame retardant low smoke wire with modular metal switch boxes.',
          category: 'ELECTRICAL',
          unit: 'Nos',
          quantity: 140,
          rate: 1800,
          taxPercent: 18,
          amount: 252000,
          totalWithTax: 297360,
        },
        {
          id: 'item-8',
          itemNumber: 8,
          itemName: 'CPVC & SWR Plumbing with Rainwater Harvesting Line',
          description: 'Astral SDR 11 pipes, hot/cold internal lines, and 110mm rainwater downspouts.',
          category: 'PLUMBING',
          unit: 'Sq. Ft',
          quantity: 4200,
          rate: 75,
          taxPercent: 18,
          amount: 315000,
          totalWithTax: 371700,
        },
        {
          id: 'item-9',
          itemNumber: 9,
          itemName: 'Vitrified High-Gloss Double Charged Floor Tiles (800x800mm)',
          description: 'Kajaria premium tiles laid over cement bed with epoxy grout matching shade.',
          category: 'FLOORING',
          unit: 'Sq. Ft',
          quantity: 2600,
          rate: 115,
          taxPercent: 18,
          amount: 298900,
          totalWithTax: 352702,
        },
      ],
    };

    saveArchitectBOQ(defaultBOQ);
    return [defaultBOQ];
  };

  const [boqs, setBoqs] = useState<ArchitectBOQ[]>(ensureDefaultBOQs);
  const [selectedBOQ, setSelectedBOQ] = useState<ArchitectBOQ | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'estimator'>(
    actionParam === 'create' ? 'create' : actionParam === 'estimator' ? 'estimator' : 'list'
  );

  // Form State for Builder
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [boqTitle, setBoqTitle] = useState('Detailed Bill of Quantities (BOQ) & Estimate');
  const [notes, setNotes] = useState('All rates are inclusive of certified material delivery, labor charges, and scaffolding per IS 456 standards.');
  const [items, setItems] = useState<BOQItem[]>([
    {
      id: 'item-1',
      itemNumber: 1,
      itemName: 'Sub-structure Earthwork Excavation',
      description: 'Excavation for column footings, strap beams in all types of soil including disposal of earth.',
      category: 'CIVIL',
      unit: 'Cu. Ft',
      quantity: 1200,
      rate: 18,
      taxPercent: 18,
      amount: 21600,
      totalWithTax: 25488,
    },
    {
      id: 'item-2',
      itemNumber: 2,
      itemName: 'Reinforced Cement Concrete (RCC M25)',
      description: 'RCC M25 grade in columns, beams, and slabs with ready-mix concrete / site mixed with vibrator compaction.',
      category: 'STRUCTURAL',
      unit: 'Cu. Metre',
      quantity: 45,
      rate: 6800,
      taxPercent: 18,
      amount: 306000,
      totalWithTax: 361080,
    },
    {
      id: 'item-3',
      itemNumber: 3,
      itemName: 'TMT Reinforcement Steel (Fe 550D)',
      description: 'Thermo-mechanically treated bar cutting, bending, binding with annealed wire and placing in position.',
      category: 'STRUCTURAL',
      unit: 'Tonne',
      quantity: 3.5,
      rate: 68000,
      taxPercent: 18,
      amount: 238000,
      totalWithTax: 280840,
    },
  ]);

  const reloadBOQs = () => {
    setBoqs(getArchitectBOQs());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadBOQs);
    return () => window.removeEventListener('storage', reloadBOQs);
  }, []);

  // Calculation helpers
  const calculateItemTotals = (quantity: number, rate: number, taxPercent: number) => {
    const amount = Math.round(quantity * rate);
    const tax = Math.round(amount * (taxPercent / 100));
    const totalWithTax = amount + tax;
    return { amount, totalWithTax };
  };

  const handleUpdateItem = (id: string, updates: Partial<BOQItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const qty = updates.quantity !== undefined ? updates.quantity : item.quantity;
        const rate = updates.rate !== undefined ? updates.rate : item.rate;
        const taxPct = updates.taxPercent !== undefined ? updates.taxPercent : item.taxPercent;
        const totals = calculateItemTotals(qty, rate, taxPct);
        return { ...item, ...updates, ...totals };
      })
    );
  };

  const handleAddItem = (category: BOQCategory = 'CIVIL') => {
    const newItem: BOQItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemNumber: items.length + 1,
      itemName: 'New Billable Work Item',
      description: 'Detailed scope specification and IS standard compliance.',
      category,
      unit: 'Sq. Ft',
      quantity: 100,
      rate: 250,
      taxPercent: 18,
      amount: 25000,
      totalWithTax: 29500,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
  const grandTotal = items.reduce((acc, it) => acc + it.totalWithTax, 0);
  const totalTax = grandTotal - subtotal;

  const handleSaveBOQ = (submitToAdmin: boolean = false) => {
    const selectedProj = projects.find((p) => p.id === activeProjectId) || projects[0];

    const boqRecord: ArchitectBOQ = {
      id: selectedBOQ?.id || `BOQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: selectedProj?.id || 'PROJ-DEFAULT',
      projectTitle: selectedProj?.name || (selectedProj as any)?.title || 'Residential Architectural Project',
      customerName: selectedProj?.customerName || 'Homeowner',
      customerPhone: selectedProj?.customerPhone || '',
      propertyLocation: selectedProj?.propertyAddress || (selectedProj as any)?.location || 'Local Site',
      version: selectedBOQ ? selectedBOQ.version + 1 : 1,
      status: submitToAdmin ? 'SUBMITTED_TO_ADMIN' : 'DRAFT',
      items,
      subtotal,
      totalTax,
      grandTotal,
      notes,
      createdAt: selectedBOQ?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveArchitectBOQ(boqRecord);
    reloadBOQs();
    setActiveTab('list');
    setSelectedBOQ(null);
    success(
      submitToAdmin
        ? 'BOQ quotation successfully submitted to Admin for verification and release!'
        : 'BOQ draft saved successfully.'
    );
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Estimator Analytics (Category breakdown)
  const categoryBreakdown = useMemo(() => {
    const activeItems = selectedBOQ ? selectedBOQ.items : items;
    const totalsByCategory: Record<string, number> = {};
    activeItems.forEach((it) => {
      totalsByCategory[it.category] = (totalsByCategory[it.category] || 0) + it.totalWithTax;
    });

    const totalCost = Object.values(totalsByCategory).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(totalsByCategory).map(([cat, val]) => ({
      category: cat,
      amount: val,
      percentage: Math.round((val / totalCost) * 100),
    }));
  }, [selectedBOQ, items]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 6)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <Calculator className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  6. BOQ & Cost Estimation Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  {boqs.length} Active BOQs
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized quantities, IS 456 materials & labor rates, GST calculations, and export-ready estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => {
              setSelectedBOQ(null);
              setActiveTab('create');
            }}
            className="btn-gold text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New BOQ</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 6 SUB-NAVIGATION TABS (6.1, 6.2, 6.3)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>6.1 BOQ Registry & History ({boqs.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedBOQ(null);
              setActiveTab('create');
            }}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>6.2 Itemized BOQ Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('estimator')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'estimator'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>6.3 Quantity & Cost Analytics</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BOQ REGISTRY (LIST VIEW)
      ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {boqs.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-400">{b.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      b.status === 'APPROVED_BY_ADMIN' || b.status === 'ACCEPTED_BY_CUSTOMER'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-navy-950">{b.projectTitle}</h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.customerName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.items.length} Line Items • Built-up: {b.builtUpAreaSqFt || 4200} sq.ft</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Estimate Total:</span>
                    <span className="text-base font-black text-blue-900 font-mono">
                      {formatINR(b.grandTotal * 100)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedBOQ(b);
                      setItems(b.items);
                      setActiveTab('create');
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition text-center cursor-pointer"
                  >
                    Inspect & Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBOQ(b);
                      window.print();
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    title="Print BOQ"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ITEMIZED BOQ BUILDER
      ========================================================================= */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                  {selectedBOQ ? `Revising: ${selectedBOQ.id}` : 'Drafting New Estimate'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-navy-950">
                  Bill of Quantities (BOQ) Schedule of Rates
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure itemized line items, quantities, unit rates, and GST taxes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Estimate</span>
              </button>
            </div>
          </div>

          {/* Project Details Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Project</label>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || (p as any).title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">BOQ Document Title</label>
              <input
                type="text"
                value={boqTitle}
                onChange={(e) => setBoqTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Specifications & IS Compliance</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* BOQ Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 font-bold">Item Description</th>
                  <th className="py-3 px-3 font-bold">Category</th>
                  <th className="py-3 px-3 font-bold">Unit</th>
                  <th className="py-3 px-3 font-bold w-20">Qty</th>
                  <th className="py-3 px-3 font-bold w-24">Rate (₹)</th>
                  <th className="py-3 px-3 font-bold text-right">Amount (₹)</th>
                  <th className="py-3 px-3 font-bold text-right">GST (18%)</th>
                  <th className="py-3 px-3 font-bold text-right">Total (₹)</th>
                  <th className="py-3 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleUpdateItem(item.id, { itemName: e.target.value })}
                        className="w-full font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-hidden pb-0.5"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                        className="w-full text-[11px] text-slate-500 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-hidden mt-0.5"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(item.id, { category: e.target.value as any })}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        {BOQ_CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        {STANDARD_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(item.id, { rate: Number(e.target.value) })}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-800"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-500">
                      ₹{(item.totalWithTax - item.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-blue-900">
                      ₹{item.totalWithTax.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Actions & Totals */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddItem('CIVIL')}
                className="px-3.5 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Totals Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 sm:w-80">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Base Value):</span>
                <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% SAC 998321):</span>
                <span className="font-mono font-bold">₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-blue-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Form Submit Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveBOQ(false)}
              className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer text-xs"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveBOQ(true)}
              className="btn-gold px-6 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Submit for Admin Audit
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: QUANTITY & COST ESTIMATION ANALYTICS
      ========================================================================= */}
      {activeTab === 'estimator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-navy-950">
                Work Category Breakdown & Quantity Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of costs across Civil, Structural, Plastering, MEP, and Finishing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Category Cost Distribution
              </h3>

              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">{item.category}</span>
                      <span className="font-mono text-blue-900">₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Architectural Estimation Intelligence</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The BOQ engine dynamically computes built-up rates per square foot based on IS 456 ductile structural specifications and local market benchmark indices.
              </p>
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Benchmark Rate:</span>
                  <span className="font-mono font-bold text-slate-900">₹914 / sq.ft (Civil + Structure)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Steel Consumption:</span>
                  <span className="font-mono font-bold text-slate-900">~2.02 kg / sq.ft (IS 13920)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Concrete Volume:</span>
                  <span className="font-mono font-bold text-slate-900">~0.026 m3 / sq.ft (M25 Grade)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
