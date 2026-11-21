import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  getInteriorBOQItems,
  InteriorBOQItem,
  getInteriorProjects,
} from '../../data/interiorDesignerStore.js';

export const InteriorDesignerBOQ: React.FC = () => {
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const [boqItems, setBoqItems] = useState<InteriorBOQItem[]>(() =>
    getInteriorBOQItems(selectedProjectId)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Item Form
  const [roomName, setRoomName] = useState('Modular Kitchen');
  const [category, setCategory] = useState<InteriorBOQItem['category']>('Plywood & Hardware');
  const [itemName, setItemName] = useState('');
  const [specification, setSpecification] = useState('');
  const [brand, setBrand] = useState('Century Ply / Blum');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Sheets');
  const [unitRate, setUnitRate] = useState(3500);
  const [labourCost, setLabourCost] = useState(5000);
  const [supplierName, setSupplierName] = useState('BuildGhar Verified Material Depot');

  const filteredItems = boqItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    return true;
  });

  const totalMaterialCost = filteredItems.reduce(
    (sum, item) => sum + item.quantity * item.unitRate,
    0
  );
  const totalLabourCost = filteredItems.reduce((sum, item) => sum + item.labourCost, 0);
  const totalTaxes = Math.round((totalMaterialCost + totalLabourCost) * 0.18);
  const grandTotal = totalMaterialCost + totalLabourCost + totalTaxes;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = quantity * unitRate + labourCost;
    const taxes = Math.round(subtotal * 0.18);
    const newItem: InteriorBOQItem = {
      id: `boq-${Date.now()}`,
      projectId: selectedProjectId,
      roomName,
      category,
      itemName,
      specification,
      brand,
      quantity,
      unit,
      unitRate,
      wastagePercent: 5,
      labourCost,
      taxPercent: 18,
      totalAmount: subtotal + taxes,
      supplierName,
      status: 'APPROVED',
    };

    const updated = [newItem, ...boqItems];
    setBoqItems(updated);
    try {
      localStorage.setItem('gd_interior_boq_v1', JSON.stringify(updated));
    } catch (e) {}

    setIsAddModalOpen(false);
    setItemName('');
    setSpecification('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Room-wise Cost & Material Estimation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Bill of Quantities (BOQ)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Itemized material specifications, wastage allowance, labor rates, and verified depot pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add BOQ Item</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Material Subtotal</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalMaterialCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Core & Hardware</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Installation & Labour</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹{totalLabourCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Carpentry & Electrical</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">GST (18%)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{totalTaxes.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">Applicable Taxes</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Grand Total BOQ</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{grandTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Client Approved Estimate</div>
        </div>
      </div>

      {/* Project Selector & Category Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-bold shrink-0">Select Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setBoqItems(getInteriorBOQItems(e.target.value));
            }}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.projectId})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            'ALL',
            'Plywood & Hardware',
            'Modular Fittings',
            'Lighting & Electricals',
            'Laminates & Veneer',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* BOQ Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Room & Item</th>
                <th className="p-4">Category & Brand</th>
                <th className="p-4">Specification</th>
                <th className="p-4 text-center">Qty / Unit</th>
                <th className="p-4 text-right">Unit Rate</th>
                <th className="p-4 text-right">Labour</th>
                <th className="p-4 text-right">Total (Incl GST)</th>
                <th className="p-4 text-center">Supplier & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-black text-slate-900">{item.itemName}</div>
                    <div className="text-[11px] text-blue-700 font-semibold">{item.roomName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{item.category}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.brand}</div>
                  </td>
                  <td className="p-4 max-w-xs text-[11px] text-slate-600">
                    {item.specification}
                  </td>
                  <td className="p-4 text-center font-mono font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    ₹{item.unitRate.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-600">
                    ₹{item.labourCost.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono font-black text-blue-700 text-sm">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.status === 'DELIVERED_TO_SITE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'ORDERED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 max-w-[120px] truncate mx-auto">
                      {item.supplierName}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add BOQ Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span>Add Line Item to BOQ</span>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Room / Zone *</label>
                    <input
                      type="text"
                      required
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Plywood & Hardware">Plywood & Hardware</option>
                      <option value="Modular Fittings">Modular Fittings</option>
                      <option value="Lighting & Electricals">Lighting & Electricals</option>
                      <option value="Laminates & Veneer">Laminates & Veneer</option>
                      <option value="Civil & Tiles">Civil & Tiles</option>
                      <option value="Paint & Finishes">Paint & Finishes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specifications & Standards</label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Unit Rate (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={unitRate}
                      onChange={(e) => setUnitRate(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Labour Charge (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={labourCost}
                      onChange={(e) => setLabourCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Supplier Depot</label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Save BOQ Line Item
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
