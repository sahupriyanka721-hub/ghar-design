import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  DollarSign,
  Download,
  AlertCircle,
  FileText,
  X,
  Layers,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';
import {
  getInteriorQuotations,
  saveInteriorQuotation,
  InteriorQuotation,
  InteriorQuotationItem,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';
import { syncChannel } from '../../data/customerStore.js';

export const InteriorDesignerQuotations: React.FC = () => {
  const { success, error } = useToast();
  const [quotations, setQuotations] = useState<InteriorQuotation[]>(getInteriorQuotations());
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'BUILDER' | 'SUBMITTED' | 'ACCEPTED'>('ASSIGNED');
  const [selectedQuote, setSelectedQuote] = useState<InteriorQuotation | null>(null);

  const loadData = () => {
    setQuotations(getInteriorQuotations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'INTERIOR_QUOTATIONS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED' ||
        event.data?.type === 'PROJECT_REQUESTS_UPDATED'
      ) {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  // Quotation Builder Form State
  const [builderData, setBuilderData] = useState({
    customerName: 'Kavita Chawla',
    customerPhone: '9811223344',
    projectAddress: 'Penthouse 12B, Central Park Resorts, Sector 48, Gurugram',
    propertyType: '4BHK Penthouse',
    carpetAreaSqFt: 3200,
    roomCount: '4 Bedrooms + Living/Dining + Modular Kitchen',
    preferredStyle: 'Contemporary Luxury with Fluted Charcoal Panels',
    targetBudget: 3800000,
    estimatedTimelineWeeks: 10,
    revisionRoundsIncluded: 3,
    discount: 50000,
    terms: '100% Escrow Milestone Payouts: 25% Advance, 35% Carpentry Shell, 25% Finishes, 15% Final Handover.',
  });

  const [lineItems, setLineItems] = useState<InteriorQuotationItem[]>([
    {
      id: '1',
      roomName: 'Foyer & Living Room',
      serviceCategory: 'False Ceiling and Lighting',
      description: 'Multi-tier Gyproc ceiling with magnetic architectural track lights and COB spots',
      quantity: 750,
      unit: 'sq.ft',
      rate: 220,
      taxPercent: 18,
      amount: 165000,
    },
    {
      id: '2',
      roomName: 'Modular Kitchen',
      serviceCategory: 'Modular Kitchen',
      description: 'Acrylic shutters, German Blum tandem box drawers, quartz countertop, and soft-close hinges',
      quantity: 1,
      unit: 'Set',
      rate: 750000,
      taxPercent: 18,
      amount: 750000,
    },
    {
      id: '3',
      roomName: 'Master Bedroom',
      serviceCategory: 'Wardrobe and Storage Design',
      description: 'Floor-to-ceiling lacquered glass sliding wardrobe with sensor profile LED lighting',
      quantity: 1,
      unit: 'Set',
      rate: 340000,
      taxPercent: 18,
      amount: 340000,
    },
  ]);

  const [newItem, setNewItem] = useState({
    roomName: 'Living Room',
    serviceCategory: 'Custom Furniture Design',
    description: 'Custom Statuario Italian marble TV console with charcoal louver paneling',
    quantity: 1,
    unit: 'Job',
    rate: 280000,
    taxPercent: 18,
  });

  const handleAddLineItem = () => {
    if (!newItem.description || newItem.rate <= 0) {
      error('Please provide valid description and rate');
      return;
    }
    const itemAmount = newItem.quantity * newItem.rate;
    const item: InteriorQuotationItem = {
      id: `item-${Date.now()}`,
      roomName: newItem.roomName,
      serviceCategory: newItem.serviceCategory,
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      rate: Number(newItem.rate),
      taxPercent: Number(newItem.taxPercent),
      amount: itemAmount,
    };
    setLineItems([...lineItems, item]);
    success('Line item added to quotation');
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce((acc, curr) => acc + curr.amount, 0);
  const taxAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + taxAmount - builderData.discount;

  const handleSubmitQuotation = (status: 'DRAFT' | 'SUBMITTED') => {
    if (lineItems.length === 0) {
      error('Please add at least one line item to the quotation');
      return;
    }

    const saved = saveInteriorQuotation({
      customerName: builderData.customerName,
      customerPhone: builderData.customerPhone,
      projectAddress: builderData.projectAddress,
      propertyType: builderData.propertyType,
      carpetAreaSqFt: Number(builderData.carpetAreaSqFt),
      roomCount: builderData.roomCount,
      preferredStyle: builderData.preferredStyle,
      targetBudget: Number(builderData.targetBudget),
      lineItems,
      subtotal,
      discount: builderData.discount,
      taxAmount,
      grandTotal,
      estimatedTimelineWeeks: Number(builderData.estimatedTimelineWeeks),
      revisionRoundsIncluded: Number(builderData.revisionRoundsIncluded),
      terms: builderData.terms,
      status,
    });

    setQuotations(getInteriorQuotations());
    success(`Quotation ${saved.quotationNumber} ${status === 'DRAFT' ? 'saved as draft' : 'submitted to Admin & Customer'}!`);
    setActiveTab('SUBMITTED');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-navy-950 text-xs font-black uppercase font-mono mb-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Module B • Quotation & BOQ Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Quotation Management & Dynamic BOQ Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build room-wise detailed quotations for modular kitchens, wardrobes, false ceilings, and premium interior finishes.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('BUILDER')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation Builder</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ASSIGNED', label: 'Assigned Requests', count: quotations.length },
          { tab: 'BUILDER', label: 'Quotation Builder (BOQ)', count: lineItems.length },
          { tab: 'SUBMITTED', label: 'Submitted Quotes', count: quotations.filter((q) => q.status === 'SUBMITTED').length },
          { tab: 'ACCEPTED', label: 'Customer-Selected Quotes', count: quotations.filter((q) => q.status === 'ACCEPTED').length },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === t.tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === t.tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ---------------- TAB 1: ASSIGNED / SUBMITTED / ACCEPTED ---------------- */}
      {activeTab !== 'BUILDER' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {quotations
              .filter((q) =>
                activeTab === 'ASSIGNED'
                  ? true
                  : activeTab === 'SUBMITTED'
                  ? q.status === 'SUBMITTED'
                  : q.status === 'ACCEPTED'
              )
              .map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-blue-800 text-xs">{q.quotationNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          q.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-navy-950 text-sm">
                      {q.customerName} • {q.propertyType}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{q.projectAddress}</span>
                    </div>
                    <div className="text-[11px] text-navy-950 font-medium">
                      Style: <strong>{q.preferredStyle}</strong> • Scope: <strong>{q.lineItems.length} Room Line Items</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400 font-medium">Quoted Total</div>
                    <div className="text-xl font-black text-navy-950 font-mono">{formatINR(q.grandTotal)}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Timeline: {q.estimatedTimelineWeeks} Weeks</div>
                    <button
                      onClick={() => setSelectedQuote(q)}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full BOQ</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: QUOTATION BUILDER (BOQ) ---------------- */}
      {activeTab === 'BUILDER' && (
        <div className="space-y-6">
          {/* Project Details Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-navy-950 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Project & Client Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={builderData.customerName}
                  onChange={(e) => setBuilderData({ ...builderData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                <input
                  type="tel"
                  value={builderData.customerPhone}
                  onChange={(e) => setBuilderData({ ...builderData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Property Type</label>
                <input
                  type="text"
                  value={builderData.propertyType}
                  onChange={(e) => setBuilderData({ ...builderData, propertyType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Project Site Address</label>
                <input
                  type="text"
                  value={builderData.projectAddress}
                  onChange={(e) => setBuilderData({ ...builderData, projectAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Carpet Area (sq.ft)</label>
                <input
                  type="number"
                  value={builderData.carpetAreaSqFt}
                  onChange={(e) => setBuilderData({ ...builderData, carpetAreaSqFt: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-navy-950 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Room-Wise Service & BOQ Line Items</span>
              </h3>
              <span className="text-xs font-mono font-bold text-blue-800">{lineItems.length} Line Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <th className="py-2.5 px-3">Room / Space</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Specification Description</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Rate (₹)</th>
                    <th className="py-2.5 px-3">Total (₹)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-navy-950">{item.roomName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.serviceCategory}</td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs">{item.description}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3">{item.unit}</td>
                      <td className="py-2.5 px-3 font-mono">{formatINR(item.rate)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-800">{formatINR(item.amount)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Line Item Subform */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 pt-4">
              <div className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Add Room BOQ Specification Item
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Room</label>
                  <input
                    type="text"
                    value={newItem.roomName}
                    onChange={(e) => setNewItem({ ...newItem, roomName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={newItem.serviceCategory}
                    onChange={(e) => setNewItem({ ...newItem, serviceCategory: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-600 mb-1">Description / Brand Specs</label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Qty</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={newItem.rate}
                    onChange={(e) => setNewItem({ ...newItem, rate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item to BOQ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Financial Summary */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1 text-xs text-slate-600">
              <div>Subtotal: <strong className="font-mono text-navy-950">{formatINR(subtotal)}</strong></div>
              <div>Estimated GST (18%): <strong className="font-mono text-navy-950">{formatINR(taxAmount)}</strong></div>
              <div>Discount: <strong className="font-mono text-emerald-700">- {formatINR(builderData.discount)}</strong></div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Grand Quotation Total</div>
              <div className="text-2xl font-black text-navy-950 font-mono">{formatINR(grandTotal)}</div>
              <div className="flex items-center gap-2 mt-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleSubmitQuotation('DRAFT')}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitQuotation('SUBMITTED')}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Client & Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOQ Modal Viewer */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-black text-navy-950 text-base">{selectedQuote.quotationNumber}</h4>
                  <div className="text-slate-500">{selectedQuote.customerName} • {selectedQuote.projectAddress}</div>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-navy-950">Room Line Items:</div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(selectedQuote.lineItems || []).map((li) => (
                    <div key={li.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{li.roomName} - {li.serviceCategory}</div>
                        <div className="text-[11px] text-slate-500">{li.description}</div>
                      </div>
                      <div className="font-mono font-bold text-navy-950">{formatINR(li.amount)}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 text-right space-y-1">
                  <div>Subtotal: <strong className="font-mono">{formatINR(selectedQuote.subtotal)}</strong></div>
                  <div>Grand Total: <strong className="font-mono text-base text-blue-800">{formatINR(selectedQuote.grandTotal)}</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-navy-950">
                  <strong>Agreed Escrow Terms:</strong> {selectedQuote.terms}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
