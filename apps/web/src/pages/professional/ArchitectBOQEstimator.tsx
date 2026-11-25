import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.js';
import { formatINR } from '../../lib/utils.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getArchitectBOQs,
  saveArchitectBOQ,
  updateArchitectBOQStatus,
  ArchitectBOQ,
  BOQItem,
  BOQCategory,
  BOQStatus,
} from '../../data/architectPanelStore.js';

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
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';

  const [boqs, setBoqs] = useState<ArchitectBOQ[]>(() => getArchitectBOQs());
  const [projects] = useState(() => getExecutionProjects());
  const [selectedBOQ, setSelectedBOQ] = useState<ArchitectBOQ | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

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
      projectTitle: selectedProj?.title || 'Residential Architectural Project',
      customerName: selectedProj?.customerName || 'Homeowner',
      customerPhone: selectedProj?.customerPhone || '',
      propertyLocation: selectedProj?.location || 'Local Site',
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
    setIsCreatingNew(false);
    setSelectedBOQ(null);
    alert(
      submitToAdmin
        ? 'BOQ quotation successfully submitted to Admin for verification and release!'
        : 'BOQ draft saved successfully.'
    );
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider font-mono">
                Section 6 & 11 BOQ & Cost Estimator
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                Itemized Construction Quantity Estimation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Professional BOQ & Cost Estimation Engine
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl mt-1 leading-relaxed">
              Generate itemized Bill of Quantities across Civil, Structural, Masonry, Plumbing, and Finishing. Submit certified bids for Admin approval and customer quotation comparison.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedBOQ(null);
              }}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Create New BOQ Estimate</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOQ LIST OR CREATION VIEW */}
      {!isCreatingNew && !selectedBOQ ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80">
            <div>
              <h2 className="text-sm font-black text-navy-950">Active BOQ Documents ({boqs.length})</h2>
              <p className="text-xs text-slate-500">Estimates submitted and under review</p>
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New BOQ</span>
            </button>
          </div>

          {boqs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {boqs.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-400">{b.id}</span>
                      <Badge
                        variant={
                          b.status === 'ACCEPTED_BY_CUSTOMER'
                            ? 'success'
                            : b.status === 'APPROVED_BY_ADMIN'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {b.status}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-navy-950">{b.projectTitle}</h3>
                    <div className="text-xs text-slate-500">Client: {b.customerName}</div>
                    <div className="text-xs text-slate-500">Items: {b.items.length} line items</div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Grand Total:</span>
                      <span className="text-base font-black text-emerald-600">
                        {formatINR(b.grandTotal * 100)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBOQ(b);
                        setItems(b.items);
                        setBoqTitle(b.projectTitle);
                        setNotes(b.notes);
                        setIsCreatingNew(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition text-center"
                    >
                      Edit / Inspect
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                      title="Export PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-navy-950">No BOQ Estimates Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create an itemized Bill of Quantities with civil, structural, electrical, and finishing components.
              </p>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Start BOQ Builder</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* INTERACTIVE BOQ BUILDER */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setSelectedBOQ(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-navy-950 mb-1 flex items-center gap-1"
              >
                ← Back to BOQ List
              </button>
              <h2 className="text-lg font-black text-navy-950">
                {selectedBOQ ? `Edit BOQ: ${selectedBOQ.id}` : 'Create Itemized BOQ & Cost Estimate'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-slate-600" />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={() => handleSaveBOQ(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveBOQ(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit to Admin</span>
              </button>
            </div>
          </div>

          {/* PROJECT & HEADER DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Project</label>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.code} ({p.customerName})
                  </option>
                ))}
                {projects.length === 0 && <option value="DEFAULT">General Project BOQ</option>}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">BOQ Title</label>
              <input
                type="text"
                value={boqTitle}
                onChange={(e) => setBoqTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Scope Category</label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700">
                Itemized Construction BOQ
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Itemized Cost Breakdown ({items.length} Items)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddItem('CIVIL')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Civil</span>
                </button>
                <button
                  onClick={() => handleAddItem('STRUCTURAL')}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Structural</span>
                </button>
                <button
                  onClick={() => handleAddItem('FLOORING')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Finishing</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Item Name & Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 w-28">Unit</th>
                    <th className="py-2.5 px-3 w-20">Quantity</th>
                    <th className="py-2.5 px-3 w-24">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-16">Tax %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 space-y-1">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleUpdateItem(item.id, { itemName: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="w-full px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, { category: e.target.value as any })}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
                        >
                          {BOQ_CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
                        >
                          {STANDARD_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-semibold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-semibold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={item.taxPercent}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { taxPercent: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatINR(item.totalWithTax * 100)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS & SUMMARY CARD */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="w-full sm:w-1/2 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Contractor / Architect Terms & Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="w-full sm:w-80 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Base Items):</span>
                <span className="font-bold text-slate-900">{formatINR(subtotal * 100)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (Taxes):</span>
                <span className="font-bold text-slate-900">{formatINR(totalTax * 100)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-black text-navy-950">Grand Total:</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {formatINR(grandTotal * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
