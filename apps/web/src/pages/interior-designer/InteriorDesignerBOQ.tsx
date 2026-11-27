import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  Tag,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  X,
  Sparkles,
  Send,
  RotateCcw,
  ShieldCheck,
  Clock,
  Trash2,
  Printer,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  getInteriorBOQItems,
  saveInteriorBOQItem,
  deleteInteriorBOQItem,
  getBOQProjectSummary,
  submitBOQToAdmin,
  InteriorBOQItem,
  BOQCategory,
  BOQCostStage,
  BOQReviewStatus,
  getInteriorProjects,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';

export const InteriorDesignerBOQ: React.FC = () => {
  const { success, error } = useToast();
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');

  // Form State
  const [roomName, setRoomName] = useState('Modular Kitchen');
  const [category, setCategory] = useState<BOQCategory>('MODULAR_KITCHEN');
  const [itemName, setItemName] = useState('');
  const [specification, setSpecification] = useState('');
  const [brand, setBrand] = useState('Greenlam / Blum');
  const [quantity, setQuantity] = useState(12);
  const [unit, setUnit] = useState('Running Feet');
  const [unitRate, setUnitRate] = useState(9400);
  const [labourCost, setLabourCost] = useState(12000);
  const [installationCost, setInstallationCost] = useState(8000);
  const [remarks, setRemarks] = useState('');
  const [supplierName, setSupplierName] = useState('BuildGhar Verified Material Depot');

  // Load items & project summary
  const boqItems = useMemo(() => getInteriorBOQItems(selectedProjectId), [selectedProjectId, refreshKey]);
  const projectSummary = useMemo(() => getBOQProjectSummary(selectedProjectId), [selectedProjectId, refreshKey]);

  // Unique rooms
  const rooms = useMemo(() => {
    const set = new Set<string>();
    boqItems.forEach((b) => b.roomName && set.add(b.roomName));
    return Array.from(set);
  }, [boqItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return boqItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedRoom !== 'ALL' && item.roomName !== selectedRoom) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(q) ||
          item.specification.toLowerCase().includes(q) ||
          item.roomName.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [boqItems, selectedCategory, selectedRoom, searchQuery]);

  // Totals calculations
  const totalMaterialCost = filteredItems.reduce((sum, item) => sum + item.quantity * item.unitRate, 0);
  const totalLabourCost = filteredItems.reduce((sum, item) => sum + (item.labourCost || 0) + (item.installationCost || 0), 0);
  const totalTaxes = Math.round((totalMaterialCost + totalLabourCost) * 0.18);
  const grandTotal = totalMaterialCost + totalLabourCost + totalTaxes;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      error('Please enter an item name');
      return;
    }

    saveInteriorBOQItem({
      projectId: selectedProjectId,
      roomName: roomName.trim(),
      category,
      itemName: itemName.trim(),
      specification: specification.trim() || 'Standard Commercial Specification',
      brand: brand.trim() || 'BuildGhar Verified',
      quantity,
      unit,
      unitRate,
      labourCost,
      installationCost,
      taxPercent: 18,
      remarks: remarks.trim(),
      supplierName: supplierName.trim() || 'BuildGhar Depot',
      costStage: 'PRELIMINARY_ESTIMATE',
      status: 'DRAFT',
    });

    success(`Line item "${itemName}" added to BOQ`);
    setIsAddModalOpen(false);
    setItemName('');
    setSpecification('');
    setRemarks('');
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from this BOQ?`)) {
      deleteInteriorBOQItem(id);
      success(`Removed "${name}" from BOQ`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSubmitBOQ = (e: React.FormEvent) => {
    e.preventDefault();
    submitBOQToAdmin(selectedProjectId, submitNotes.trim());
    success('BOQ submitted to BuildGhar Admin for technical & commercial audit!');
    setIsSubmitModalOpen(false);
    setSubmitNotes('');
    setRefreshKey((k) => k + 1);
  };

  const handleExportCSV = () => {
    if (boqItems.length === 0) {
      error('No items to export');
      return;
    }
    const headers = ['Room', 'Category', 'Item Name', 'Specification', 'Brand', 'Qty', 'Unit', 'Rate (INR)', 'Labour (INR)', 'Install (INR)', 'Total (INR)'];
    const rows = boqItems.map((b) => [
      `"${b.roomName}"`,
      `"${b.category}"`,
      `"${b.itemName}"`,
      `"${b.specification}"`,
      `"${b.brand || ''}"`,
      b.quantity,
      `"${b.unit}"`,
      b.unitRate,
      b.labourCost || 0,
      b.installationCost || 0,
      b.totalAmount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BuildGhar_BOQ_${selectedProjectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('BOQ exported to CSV successfully!');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER WITH SECTION 10 SUBMIT TO ADMIN WORKFLOW                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 10 Master BOQ &amp; Cost Estimation Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 font-display">
            Bill of Quantities (BOQ) &amp; Commercial Ledger
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Itemized material specifications, wastage allowances, installation rates, and verified depot pricing with strict Admin review routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            title="Export BOQ to Excel / CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Line Item</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit BOQ to Admin</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 10 GOVERNANCE RULE BANNER & STATUS BADGE                       */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Section 10 Cost Governance Rule:</strong> Preliminary estimates are non-binding. Every BOQ must be verified and approved by BuildGhar Admin before becoming an authorized contract or triggering customer escrow billing.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] font-bold text-slate-500">Current BOQ Status:</span>
          <span
            className={`px-3 py-1 rounded-full font-black text-[10px] uppercase border ${
              projectSummary.status === 'CUSTOMER_ACCEPTED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : projectSummary.status === 'APPROVED_BY_ADMIN'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : projectSummary.status === 'FORWARDED_TO_CUSTOMER'
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : projectSummary.status === 'SUBMITTED_TO_ADMIN'
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {projectSummary.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Admin / Client feedback note if revision required */}
      {projectSummary.adminFeedback && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs flex items-start gap-2.5 text-rose-950">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-900 font-bold">Admin Technical Review Feedback:</strong>
            <p className="text-rose-800 mt-0.5 leading-relaxed">{projectSummary.adminFeedback}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECTION 10 4-TIER COST STAGE FINANCIAL OVERVIEW CARDS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Stage 1 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">1. Preliminary Estimate</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1">
            ₹{projectSummary.preliminaryEstimateTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Initial Designer Ballpark</span>
        </div>

        {/* Stage 2 */}
        <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">2. Approved BOQ</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 font-display mt-1">
            ₹{projectSummary.approvedBOQTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-blue-700 font-bold">Admin Vetted Technical Total</span>
        </div>

        {/* Stage 3 */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">3. Binding Contract</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-display mt-1">
            ₹{projectSummary.bindingContractTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Homeowner Accepted Value</span>
        </div>

        {/* Stage 4 */}
        <div className="bg-purple-50/50 rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">4. Actual Purchase</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 font-display mt-1">
            ₹{projectSummary.actualPurchaseTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-purple-700 font-medium">Verified Depot Orders</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PROJECT SELECTOR, SEARCH & SECTION 10 CATEGORY PILLS                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold shrink-0">Shared Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-navy-950 focus:border-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectId} - {p.title} ({p.customerName})
                </option>
              ))}
            </select>

            {rooms.length > 0 && (
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
              >
                <option value="ALL">All Rooms ({rooms.length})</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, specs, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-navy-950 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Section 10 Categories Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs pb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            BOQ Scope:
          </span>
          {[
            { label: 'All Items', value: 'ALL' },
            { label: '🍳 Modular Kitchen (Rft)', value: 'MODULAR_KITCHEN' },
            { label: '🚪 Wardrobes (Sqft)', value: 'WARDROBE' },
            { label: '🛋️ Furniture Joinery', value: 'FURNITURE' },
            { label: '🏛️ Flooring & Marble', value: 'FLOORING' },
            { label: '☁️ False Ceiling & Cove', value: 'FALSE_CEILING' },
            { label: '💡 Lighting & Channels', value: 'LIGHTING' },
            { label: '🎨 Painting & Textures', value: 'PAINTING_FINISHES' },
            { label: '📦 Material Estimates', value: 'MATERIAL_ESTIMATE' },
            { label: '🔨 Labor & Installation', value: 'LABOR_ESTIMATE' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl font-medium text-[11px] shrink-0 transition cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOQ LINE ITEMS DATA TABLE                                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Line Items Schedule</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-xs">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Filter Total (Incl. 18% GST)</span>
            <span className="text-base sm:text-lg font-black text-blue-900 font-mono">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item &amp; Room</th>
                <th className="py-3 px-3">Category &amp; Brand</th>
                <th className="py-3 px-4">Material Specifications</th>
                <th className="py-3 px-3 text-center">Qty / Unit</th>
                <th className="py-3 px-3 text-right">Unit Rate</th>
                <th className="py-3 px-3 text-right">Labor &amp; Install</th>
                <th className="py-3 px-4 text-right">Total (Incl GST)</th>
                <th className="py-3 px-3 text-center">Cost Stage</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No BOQ line items match this filter.</p>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Click "Add Line Item" to enter room-wise modular or joinery specifications.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* 1. Item & Room */}
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block text-xs font-bold">{item.itemName}</strong>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block mt-0.5">
                        {item.roomName}
                      </span>
                    </td>

                    {/* 2. Category & Brand */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 text-[11px]">{item.category.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.brand || 'BuildGhar Verified'}</div>
                    </td>

                    {/* 3. Material Specifications */}
                    <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600 leading-relaxed">
                      {item.specification}
                      {item.remarks && (
                        <div className="text-[10px] text-amber-700 italic mt-0.5">Note: {item.remarks}</div>
                      )}
                    </td>

                    {/* 4. Qty & Unit */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-xs">
                      {item.quantity} <span className="text-slate-500 font-sans text-[11px]">{item.unit}</span>
                    </td>

                    {/* 5. Unit Rate */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{item.unitRate.toLocaleString('en-IN')}
                    </td>

                    {/* 6. Labor & Install */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600 text-xs">
                      ₹{((item.labourCost || 0) + (item.installationCost || 0)).toLocaleString('en-IN')}
                    </td>

                    {/* 7. Total Incl GST */}
                    <td className="py-3 px-4 text-right font-mono font-black text-blue-900 text-sm">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </td>

                    {/* 8. Cost Stage */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {item.costStage ? item.costStage.replace(/_/g, ' ') : 'PRELIMINARY'}
                      </span>
                    </td>

                    {/* 9. Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id, item.itemName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD BOQ LINE ITEM (SECTION 10 FIELDS)                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-base">Add Line Item to BOQ</h3>
                    <span className="text-[10px] text-slate-400">Section 10 Specification Standards</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
                {/* Room & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Room / Zone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Modular Kitchen, Master Bed..."
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category (Section 10) *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    >
                      <option value="MODULAR_KITCHEN">Modular Kitchen BOQ</option>
                      <option value="WARDROBE">Wardrobe BOQ</option>
                      <option value="FURNITURE">Furniture &amp; Loose Joinery</option>
                      <option value="FLOORING">Flooring &amp; Marble Laying</option>
                      <option value="FALSE_CEILING">False Ceiling &amp; Cove</option>
                      <option value="LIGHTING">Lighting &amp; Profiles</option>
                      <option value="PAINTING_FINISHES">Painting &amp; Wall Finishes</option>
                      <option value="MATERIAL_ESTIMATE">Core Material Estimate</option>
                      <option value="LABOR_ESTIMATE">Labor &amp; Installation</option>
                    </select>
                  </div>
                </div>

                {/* Item Name & Brand */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Item Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acrylic Island Counter"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Brand / Supplier Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Blum / Hafele / CenturyPly"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Material Specification */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Material Specification (Section 10 line 636) *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 18mm BWP 710 Marine Plywood with 1.5mm anti-fingerprint acrylic shutter finish"
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Quantity, Unit & Rate */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Unit *</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Running Feet">Running Feet (Rft)</option>
                      <option value="Square Feet">Square Feet (Sq.ft)</option>
                      <option value="Nos">Nos (Units)</option>
                      <option value="Sets">Sets</option>
                      <option value="Lump Sum">Lump Sum (LS)</option>
                      <option value="Meters">Meters</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Unit Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={unitRate}
                      onChange={(e) => setUnitRate(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Labor & Installation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Carpentry / Labor (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={labourCost}
                      onChange={(e) => setLabourCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Site Installation (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={installationCost}
                      onChange={(e) => setInstallationCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Remarks &amp; Workmanship Directives</label>
                  <input
                    type="text"
                    placeholder="e.g. Blum Aventos lift-up stay hardware included"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition cursor-pointer"
                  >
                    Save BOQ Line Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT BOQ TO ADMIN FOR REVIEW                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-base">Submit BOQ to Admin</h3>
                    <span className="text-[10px] text-slate-400">Section 10 Review Workflow</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <p className="text-slate-600 leading-relaxed">
                  Submitting this BOQ routes all {boqItems.length} line items (Totaling ₹{grandTotal.toLocaleString('en-IN')}) to the BuildGhar Admin Technical Desk for rate verification, margin checks, and customer handover clearance.
                </p>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes for Admin Desk (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Materials priced as per CenturyPly & Hafele latest catalog. Verified against approved 2D drawings."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBOQ}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Submission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
