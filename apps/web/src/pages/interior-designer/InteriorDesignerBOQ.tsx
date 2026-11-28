import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  Info,
  Package,
  Calculator,
  PieChart,
  Sofa,
  Award,
  History,
  Check,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
import { formatINR } from '../../lib/utils.js';
import { useToast } from '../../context/ToastContext.js';

export type BOQViewMode =
  | 'CREATE_BOQ'
  | 'MATERIAL_LIST'
  | 'QUANTITY_ESTIMATION'
  | 'COST_ESTIMATION'
  | 'FURNITURE_ESTIMATION'
  | 'MATERIAL_SPECIFICATIONS'
  | 'SUBMISSION_HISTORY';

export const InteriorDesignerBOQ: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [wastagePercent, setWastagePercent] = useState(5);
  const [labourCost, setLabourCost] = useState(12000);
  const [installationCost, setInstallationCost] = useState(8000);
  const [remarks, setRemarks] = useState('');
  const [supplierName, setSupplierName] = useState('BuildGhar Verified Material Depot');

  // Load items & project summary
  const boqItems = useMemo(() => getInteriorBOQItems(selectedProjectId), [selectedProjectId, refreshKey]);
  const projectSummary = useMemo(() => getBOQProjectSummary(selectedProjectId), [selectedProjectId, refreshKey]);
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Unique rooms
  const rooms = useMemo(() => {
    const set = new Set<string>();
    boqItems.forEach((b) => b.roomName && set.add(b.roomName));
    return Array.from(set);
  }, [boqItems]);

  // Current view from URL query param
  const currentView: BOQViewMode = (searchParams.get('view') as BOQViewMode) || 'CREATE_BOQ';

  const handleSetView = (view: BOQViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    setSearchParams(params);
  };

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

  // Furniture items filter
  const furnitureItems = useMemo(() => {
    return boqItems.filter(
      (b) =>
        b.category === 'FURNITURE' ||
        b.category === 'WOODWORK' ||
        (b.roomName && b.roomName.toLowerCase().includes('bedroom')) ||
        b.itemName.toLowerCase().includes('table') ||
        b.itemName.toLowerCase().includes('bed') ||
        b.itemName.toLowerCase().includes('sofa') ||
        b.itemName.toLowerCase().includes('wardrobe')
    );
  }, [boqItems]);

  // Totals calculations
  const totalMaterialCost = filteredItems.reduce((sum, item) => sum + item.quantity * item.unitRate, 0);
  const totalLabourCost = filteredItems.reduce((sum, item) => sum + (item.labourCost || 0) + (item.installationCost || 0), 0);
  const totalTaxes = Math.round((totalMaterialCost + totalLabourCost) * 0.18);
  const grandTotal = totalMaterialCost + totalLabourCost + totalTaxes;

  // 7 Sub-Features Config
  const BOQ_VIEW_TABS: { id: BOQViewMode; label: string; count: number; icon: any }[] = [
    { id: 'CREATE_BOQ', label: '1. Create BOQ', count: boqItems.length, icon: Layers },
    { id: 'MATERIAL_LIST', label: '2. Material List', count: boqItems.length, icon: Package },
    { id: 'QUANTITY_ESTIMATION', label: '3. Quantity Estimation', count: boqItems.length, icon: Calculator },
    { id: 'COST_ESTIMATION', label: '4. Cost Estimation', count: filteredItems.length, icon: PieChart },
    { id: 'FURNITURE_ESTIMATION', label: '5. Furniture Estimation', count: furnitureItems.length, icon: Sofa },
    { id: 'MATERIAL_SPECIFICATIONS', label: '6. Material Specifications', count: boqItems.length, icon: Award },
    { id: 'SUBMISSION_HISTORY', label: '7. BOQ Submission History', count: 3, icon: History },
  ];

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
      wastagePercent,
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
    const headers = ['Room', 'Category', 'Item Name', 'Specification', 'Brand', 'Qty', 'Unit', 'Rate (INR)', 'Wastage %', 'Labour (INR)', 'Install (INR)', 'Total (INR)'];
    const rows = boqItems.map((b) => [
      `"${b.roomName}"`,
      `"${b.category}"`,
      `"${b.itemName}"`,
      `"${b.specification}"`,
      `"${b.brand || ''}"`,
      b.quantity,
      `"${b.unit}"`,
      b.unitRate,
      b.wastagePercent || 0,
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
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER & VIEW SELECTOR ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Module 6 • Commercial BOQ &amp; Cost Estimation Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            BOQ &amp; Cost Estimation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Itemized material lists, quantity takeoffs, wastage calculation, furniture estimation, and verified supplier pricing with BuildGhar Admin-governed contract clearance.
          </p>
        </div>

        {/* View Switcher Dropdown */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currentView}
              onChange={(e) => handleSetView(e.target.value as BOQViewMode)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-950 shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {BOQ_VIEW_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* ---------------- 7-PILL SUB-FEATURE ACTION STRIP ---------------- */}
      <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {BOQ_VIEW_TABS.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleSetView(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 10 GOVERNANCE RULE BANNER ---------------- */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Section 10 Cost Governance Rule:</strong> Preliminary estimates are non-binding. Every BOQ must be verified and approved by BuildGhar Admin before becoming an authorized contract or triggering customer escrow billing.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] font-bold text-slate-500">Status:</span>
          <span className="px-3 py-1 rounded-full font-black text-[10px] uppercase border bg-blue-100 text-blue-800 border-blue-300">
            {projectSummary.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* ---------------- PROJECT SELECTOR & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-slate-500 shrink-0 pl-2">Active Project:</span>
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
        </div>

        <div className="relative w-full sm:w-72">
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

      {/* ========================================================================= */}
      {/* VIEW 1: CREATE BOQ (MASTER LEDGER TABLE & ITEM ADDITION)                  */}
      {/* ========================================================================= */}
      {currentView === 'CREATE_BOQ' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Financial Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total BOQ Items</span>
              <div className="text-2xl font-black text-navy-950 font-display">{boqItems.length}</div>
              <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">{rooms.length} Active Zones</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Materials Subtotal</span>
              <div className="text-xl font-black text-navy-950 font-mono truncate">{formatINR(totalMaterialCost)}</div>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Procurement Base Value</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Labour &amp; Installation</span>
              <div className="text-xl font-black text-emerald-700 font-mono truncate">{formatINR(totalLabourCost)}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Skilled Fabrication</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Grand Total (Incl. 18% GST)</span>
              <div className="text-xl font-black text-blue-700 font-mono truncate">{formatINR(grandTotal)}</div>
              <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">Estimated Landed Cost</span>
            </div>
          </div>

          {/* BOQ Line Items Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-navy-950 text-base">Itemized Commercial Bill of Quantities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Project: {currentProject?.title} ({currentProject?.projectId})</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit BOQ to Admin</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Room &amp; Category</th>
                    <th className="py-3 px-3.5">Item &amp; Specification</th>
                    <th className="py-3 px-3.5">Brand &amp; Supplier</th>
                    <th className="py-3 px-3.5 text-right">Qty &amp; Unit</th>
                    <th className="py-3 px-3.5 text-right">Unit Rate</th>
                    <th className="py-3 px-3.5 text-right">Total Amount</th>
                    <th className="py-3 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-navy-950 block">{b.roomName}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{b.category}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-navy-950 block">{b.itemName}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{b.specification}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-800 block">{b.brand || 'BuildGhar Verified'}</span>
                        <span className="text-[10px] text-slate-400">{b.supplierName}</span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                        {b.quantity} <span className="text-[10px] text-slate-400 font-normal">{b.unit}</span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                        {formatINR(b.unitRate)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-navy-950">
                        {formatINR(b.totalAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => handleDeleteItem(b.id, b.itemName)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Remove item"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MATERIAL LIST                                                     */}
      {/* ========================================================================= */}
      {currentView === 'MATERIAL_LIST' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Comprehensive Procurement Material Ledger</h3>
                <p className="text-xs text-slate-600">
                  Bill of Materials (BOM) classified by core architectural trade categories with depot delivery verification.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              {boqItems.length} Materials Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boqItems.map((item) => (
              <div key={item.id} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Depot Verified
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-navy-950 text-sm">{item.itemName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.specification}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brand / Grade:</span>
                    <span className="font-bold text-navy-950">{item.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supplier Depot:</span>
                    <span className="font-medium text-slate-800">{item.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Procurement Qty:</span>
                    <span className="font-mono font-bold text-navy-950">{item.quantity} {item.unit}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Landed Rate:</span>
                  <span className="font-mono font-bold text-blue-700">{formatINR(item.unitRate)} / {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: QUANTITY ESTIMATION                                               */}
      {/* ========================================================================= */}
      {currentView === 'QUANTITY_ESTIMATION' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Measurement Takeoff &amp; Wastage Allowance Matrix</h3>
                <p className="text-xs text-slate-600">
                  Standard architectural calculation applying net takeoff measurements plus trade wastage margins (5% to 8%).
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              Formula: Gross = Net + (Net × Wastage%)
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Trade-by-Trade Quantity Calculations</h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Line Item</th>
                    <th className="py-3 px-3.5">Zone</th>
                    <th className="py-3 px-3.5 text-right">Net Takeoff Qty</th>
                    <th className="py-3 px-3.5 text-right">Wastage Buffer %</th>
                    <th className="py-3 px-3.5 text-right">Gross Billable Qty</th>
                    <th className="py-3 px-3.5 text-right">Unit Rate</th>
                    <th className="py-3 px-3.5 text-right">Total Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boqItems.map((item) => {
                    const wastage = item.wastagePercent || 5;
                    const gross = Math.ceil(item.quantity * (1 + wastage / 100));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-navy-950">{item.itemName}</td>
                        <td className="py-3 px-3.5 text-slate-600">{item.roomName}</td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-700">
                          +{wastage}%
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">
                          {gross} {item.unit}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                          {formatINR(item.unitRate)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-navy-950">
                          {formatINR(gross * item.unitRate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: COST ESTIMATION                                                   */}
      {/* ========================================================================= */}
      {currentView === 'COST_ESTIMATION' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Cost Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Materials Base Cost</span>
              <div className="text-xl font-black font-mono text-navy-950 mt-1">{formatINR(totalMaterialCost)}</div>
              <span className="text-xs text-slate-500 mt-1 block">
                {Math.round((totalMaterialCost / (grandTotal || 1)) * 100)}% of total cost
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Skilled Labour &amp; Joinery</span>
              <div className="text-xl font-black font-mono text-emerald-700 mt-1">{formatINR(totalLabourCost)}</div>
              <span className="text-xs text-slate-500 mt-1 block">
                {Math.round((totalLabourCost / (grandTotal || 1)) * 100)}% of total cost
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Statutory GST (18%)</span>
              <div className="text-xl font-black font-mono text-amber-700 mt-1">{formatINR(totalTaxes)}</div>
              <span className="text-xs text-slate-500 mt-1 block">Standard Indian tax assessment</span>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-navy-950 text-white shadow-md">
              <span className="text-[10px] font-bold text-blue-200 uppercase block tracking-wider">Final Approved Contract</span>
              <div className="text-xl font-black font-mono mt-1">{formatINR(grandTotal)}</div>
              <span className="text-xs text-blue-200/80 mt-1 block font-semibold">Total Turnkey Commercials</span>
            </div>
          </div>

          {/* Budget Health Comparison */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-navy-950 text-base">Client Budget Health &amp; Variance Analysis</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Client Target Budget</span>
                <span className="font-mono font-bold text-base text-navy-950 block mt-1">
                  {formatINR(currentProject?.projectBudget || 3500000)}
                </span>
                <span className="text-[11px] text-slate-500">Stated in accepted design brief</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Calculated Master BOQ</span>
                <span className="font-mono font-bold text-base text-blue-700 block mt-1">
                  {formatINR(grandTotal)}
                </span>
                <span className="text-[11px] text-slate-500">Materials + Labour + Taxes</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <span className="text-emerald-700 text-[10px] uppercase font-bold block">Budget Surplus / Variance</span>
                <span className="font-mono font-bold text-base text-emerald-700 block mt-1">
                  +{formatINR(Math.max(0, (currentProject?.projectBudget || 3500000) - grandTotal))}
                </span>
                <span className="text-[11px] text-emerald-800">Comfortably within approved cap</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: FURNITURE ESTIMATION                                              */}
      {/* ========================================================================= */}
      {currentView === 'FURNITURE_ESTIMATION' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sofa className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Bespoke Furniture &amp; Custom Carpentry Ledger</h3>
                <p className="text-xs text-slate-600">
                  Itemized estimation for custom built-in woodwork, dining consoles, wardrobes, and hydraulic beds.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-purple-900 border border-purple-200 font-mono font-bold text-xs">
              {furnitureItems.length} Furniture Units
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {furnitureItems.map((item) => (
              <div key={item.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {item.roomName}
                  </span>
                  <span className="font-mono font-black text-navy-950 text-sm">
                    {formatINR(item.totalAmount)}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-navy-950 text-base">{item.itemName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.specification}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Rate</span>
                    <span className="font-mono font-bold text-navy-950">{formatINR(item.unitRate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Labour</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(item.labourCost || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Installation</span>
                    <span className="font-mono font-bold text-blue-700">{formatINR(item.installationCost || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: MATERIAL SPECIFICATIONS                                           */}
      {/* ========================================================================= */}
      {currentView === 'MATERIAL_SPECIFICATIONS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Technical Specifications &amp; Quality Compliance</h3>
                <p className="text-xs text-slate-600">
                  Indian Standards (IS) compliance benchmarks, warranty terms, and certified hardware standards.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              ISO &amp; IS Standards Verified
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                trade: 'Structural Plywood & Carcasses',
                standard: 'IS:710 Boiling Water Proof (BWP) Marine Grade',
                warranty: '15 Years Manufacturer Warranty',
                brands: 'Greenply Marine / Century Gold 710',
                details: 'Gurjan face veneer, calibrated 18mm thickness, E1 low formaldehyde emission certification.',
              },
              {
                trade: 'Modular Kitchen & Wardrobe Hardware',
                standard: 'DIN EN 15338 Functional Durability Grade',
                warranty: 'Lifetime Warranty (200,000 opening cycles)',
                brands: 'Blum Austria (Tandembox / Aventos) • Hafele Slido',
                details: 'Full extension soft-close runners, adaptive Blumotion damping, 65kg load capacity.',
              },
              {
                trade: 'Gypsum Plasterboard & False Ceiling',
                standard: 'IS:2095 Fire-Resistant & Moisture-Resistant Board',
                warranty: '10 Years Sag-Free Warranty',
                brands: 'Saint-Gobain Gyproc 12.5mm Plasterboard',
                details: 'Galvanized iron (GI) perimeter channels, 80 micron zinc coating, concealed LED cove trough.',
              },
              {
                trade: 'Luxury Wall Paints & Polish',
                standard: 'Green Seal GS-11 Low VOC Emission Standard',
                warranty: '8 Years Durability Warranty',
                brands: 'Asian Paints Royale Aspira • Sirca Italian PU Polish',
                details: 'Teflon surface protector, anti-bacterial formulation, zero lead content, washable high-sheen.',
              },
            ].map((spec, i) => (
              <div key={i} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-navy-950 text-sm">{spec.trade}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                    {spec.standard}
                  </span>
                </div>
                <p className="text-slate-600">{spec.details}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Verified Brands: <strong className="text-navy-950">{spec.brands}</strong></span>
                  <span className="text-blue-700 font-semibold">{spec.warranty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: BOQ SUBMISSION HISTORY                                            */}
      {/* ========================================================================= */}
      {currentView === 'SUBMISSION_HISTORY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h3 className="font-bold text-navy-950 text-sm">Official BOQ Submission &amp; Audit Trail</h3>
                <p className="text-xs text-slate-600">
                  Immutable record of commercial BOQ revisions submitted to BuildGhar Admin for escrow release authorization.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 font-mono font-bold text-xs">
              3 Submissions Logged
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                version: 'v2.0 (Final Approved)',
                date: '2026-11-25',
                amount: grandTotal,
                status: 'APPROVED_BY_ADMIN',
                submittedBy: 'Ar. Pooja Mehra',
                adminNotes: 'All line item rates cross-checked against BuildGhar depot price index. Approved for customer escrow signature.',
              },
              {
                version: 'v1.1 (Revision)',
                date: '2026-11-18',
                amount: grandTotal - 45000,
                status: 'REVISION_REQUESTED',
                submittedBy: 'Ar. Pooja Mehra',
                adminNotes: 'Requested minor reduction in false ceiling wastage allowance from 12% to 8%. Corrected and resubmitted.',
              },
              {
                version: 'v1.0 (Initial Draft)',
                date: '2026-11-10',
                amount: grandTotal - 90000,
                status: 'SUPERSEDED',
                submittedBy: 'Ar. Pooja Mehra',
                adminNotes: 'Preliminary commercial estimate based on preliminary 2D layout.',
              },
            ].map((sub, i) => (
              <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {sub.version}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        sub.status === 'APPROVED_BY_ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'REVISION_REQUESTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-mono font-black text-navy-950 text-sm">{formatINR(sub.amount)}</span>
                </div>

                <p className="text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">{sub.adminNotes}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Submitted by: <strong>{sub.submittedBy}</strong> on {sub.date}</span>
                  <button
                    onClick={handleExportCSV}
                    className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD BOQ LINE ITEM                                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Add Line Item to BOQ</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Room / Zone</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-semibold"
                    >
                      <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                      <option value="WOODWORK">Woodwork &amp; Paneling</option>
                      <option value="FURNITURE">Loose Furniture</option>
                      <option value="FALSE_CEILING">False Ceiling</option>
                      <option value="FLOORING">Flooring &amp; Tiling</option>
                      <option value="ELECTRICAL">Electrical &amp; Lighting</option>
                      <option value="PAINTING">Painting &amp; Finishes</option>
                      <option value="CIVIL_WORK">Civil Work</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Island Counter Acrylic Finish with Blum Tandembox"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Technical Specification</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. BWP 710 Marine Ply, 1.5mm acrylic sheet, soft-close Blum runners"
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-semibold"
                    >
                      <option value="Running Feet">Running Feet</option>
                      <option value="Square Feet">Square Feet</option>
                      <option value="Nos">Nos</option>
                      <option value="Meters">Meters</option>
                      <option value="Lump Sum">Lump Sum</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Unit Rate (INR)</label>
                    <input
                      type="number"
                      min={0}
                      value={unitRate}
                      onChange={(e) => setUnitRate(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Labour Charges (INR)</label>
                    <input
                      type="number"
                      min={0}
                      value={labourCost}
                      onChange={(e) => setLabourCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Installation Charges (INR)</label>
                    <input
                      type="number"
                      min={0}
                      value={installationCost}
                      onChange={(e) => setInstallationCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save BOQ Line Item</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: SUBMIT BOQ TO ADMIN                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-navy-950 text-base">Submit BOQ for Admin Review</h3>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitBOQ} className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Project</span>
                  <span className="font-bold text-navy-950 block">{currentProject?.title} ({currentProject?.projectId})</span>
                  <span className="font-mono text-blue-700 font-bold block">
                    Calculated BOQ Grand Total: {formatINR(grandTotal)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-navy-950 block mb-1">Submission Notes for BuildGhar Admin</label>
                  <textarea
                    rows={3}
                    placeholder="Explain major trade allocations, brand choices, or specific depot quotation details..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-950"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Once submitted, the BOQ status changes to <strong>UNDER_ADMIN_REVIEW</strong>. Escrow payment milestones will be generated upon approval.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Submit</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
