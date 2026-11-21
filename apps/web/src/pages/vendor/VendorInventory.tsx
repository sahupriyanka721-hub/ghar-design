import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  History,
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  Info,
  Building2,
  Edit2,
  X,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getVendorProducts,
  getInventoryMovements,
  recordInventoryMovement,
  bulkUpdateVendorStock,
  updateVendorProductStockAndPrice,
} from '../../data/vendorStore.js';
import { VendorProduct, InventoryMovementRecord } from '@ghar-design/shared';

export const VendorInventory: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const vendorId = user?.id || 'vnd-delhi-1';

  // Tabs: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS'
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal States
  const [adjustModalProduct, setAdjustModalProduct] = useState<VendorProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('New Warehouse Shipment Received');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Bulk Update Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<{ id: string; name: string; sku: string; currentStock: number; newStock: number }[]>([]);

  // Inline Quick Edit state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const products = useMemo(() => {
    return getVendorProducts(vendorId);
  }, [vendorId, refreshKey]);

  const movements = useMemo(() => {
    return getInventoryMovements(vendorId);
  }, [vendorId, refreshKey]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      if (!matchSearch || !matchCat) return false;

      if (activeTab === 'LOW_STOCK') {
        return p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 20);
      }
      if (activeTab === 'OUT_OF_STOCK') {
        return p.stockQuantity === 0;
      }
      return true;
    });
  }, [products, searchQuery, categoryFilter, activeTab]);

  // Metrics
  const metrics = useMemo(() => {
    const totalItems = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 20)).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
    const inventoryValuationPaise = products.reduce((acc, p) => acc + (p.pricePaise || 0) * (p.stockQuantity || 0), 0);

    return {
      totalItems,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inventoryValuationRupees: Math.round(inventoryValuationPaise / 100),
    };
  }, [products]);

  // Handle Manual Stock Adjustment
  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    if (adjustQty <= 0) {
      error('Adjustment quantity must be greater than zero');
      return;
    }

    const currentStock = adjustModalProduct.stockQuantity;
    let newStock = currentStock;

    if (adjustType === 'STOCK_IN') {
      newStock = currentStock + adjustQty;
    } else {
      if (adjustQty > currentStock) {
        error(`Cannot deduct ${adjustQty} units. Current stock is only ${currentStock}.`);
        return;
      }
      newStock = currentStock - adjustQty;
    }

    // 1. Update product stock
    updateVendorProductStockAndPrice(adjustModalProduct.id, newStock);

    // 2. Record inventory movement in audit ledger
    recordInventoryMovement({
      vendorId,
      productId: adjustModalProduct.id,
      productTitle: adjustModalProduct.title,
      sku: adjustModalProduct.sku,
      movementType: adjustType,
      quantity: adjustQty,
      previousStock: currentStock,
      newStock: newStock,
      reason: adjustReason,
      notes: adjustNotes || undefined,
      performedBy: user?.name || 'Store Manager',
    });

    success(`Stock ${adjustType === 'STOCK_IN' ? 'added' : 'deducted'} successfully! New Balance: ${newStock} units.`);
    setAdjustModalProduct(null);
    setAdjustQty(10);
    setAdjustNotes('');
    setRefreshKey((k) => k + 1);
  };

  // Open Bulk Update
  const handleOpenBulkModal = () => {
    setBulkRows(
      products.map((p) => ({
        id: p.id,
        name: p.title,
        sku: p.sku,
        currentStock: p.stockQuantity,
        newStock: p.stockQuantity,
      }))
    );
    setShowBulkModal(true);
  };

  // Save Bulk Update
  const handleSaveBulkUpdate = () => {
    const updates = bulkRows.map((r) => ({
      productId: r.id,
      newStock: r.newStock,
      reason: 'Bulk stock reconciliation',
    }));

    bulkUpdateVendorStock(vendorId, updates, user?.name || 'Depot Manager');
    success('Bulk stock values updated successfully across all SKUs!');
    setShowBulkModal(false);
    setRefreshKey((k) => k + 1);
  };

  // Save Inline Edit
  const handleSaveInlineStock = (p: VendorProduct) => {
    if (inlineStockVal < 0) {
      error('Stock quantity cannot be negative');
      return;
    }
    const diff = inlineStockVal - p.stockQuantity;
    if (diff === 0) {
      setInlineEditingId(null);
      return;
    }

    updateVendorProductStockAndPrice(p.id, inlineStockVal);
    recordInventoryMovement({
      vendorId,
      productId: p.id,
      productTitle: p.title,
      sku: p.sku,
      movementType: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
      quantity: Math.abs(diff),
      previousStock: p.stockQuantity,
      newStock: inlineStockVal,
      reason: 'Quick inline stock update',
      performedBy: user?.name || 'Depot Staff',
    });

    success(`Updated ${p.title} stock to ${inlineStockVal}`);
    setInlineEditingId(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-200/80/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
              Inventory & Stock Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger, manual stock in/out adjustments, audit trails and threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenBulkModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-sky-50/30 hover:bg-slate-100 border border-blue-200 transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Stock Update</span>
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-sky-50/30 hover:bg-slate-100 border border-blue-200/80 transition"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total SKUs</span>
          <div className="text-2xl font-black font-display text-navy-950">{metrics.totalItems}</div>
          <span className="text-[10px] text-slate-400">Tracked catalog products</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Units in Stock</span>
          <div className="text-2xl font-black font-display text-blue-700">{metrics.totalUnits.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Available warehouse units</span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-blue-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Low Stock Alerts</span>
          <div className="text-2xl font-black font-display text-amber-700">{metrics.lowStockCount}</div>
          <span className="text-[10px] text-amber-800 font-semibold">Below min reorder level</span>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Out of Stock</span>
          <div className="text-2xl font-black font-display text-rose-700">{metrics.outOfStockCount}</div>
          <span className="text-[10px] text-rose-800 font-semibold">Needs urgent restock</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Stock Valuation</span>
          <div className="text-2xl font-black font-display text-emerald-700">₹{metrics.inventoryValuationRupees.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Asset value at selling price</span>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>All Stock ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('LOW_STOCK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'LOW_STOCK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-blue-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts ({metrics.lowStockCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('OUT_OF_STOCK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>Out of Stock ({metrics.outOfStockCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('MOVEMENTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'MOVEMENTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Ledger ({movements.length})</span>
            </button>
          </div>

          {/* Search and Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or title..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {activeTab !== 'MOVEMENTS' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl text-slate-700 font-bold focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content: Products Table OR Movements Audit Ledger */}
        {activeTab !== 'MOVEMENTS' ? (
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                <tr>
                  <th className="py-3 px-3.5">Product & SKU</th>
                  <th className="py-3 px-3">Category / Brand</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  <th className="py-3 px-3 text-center">Min Threshold</th>
                  <th className="py-3 px-3 text-center">Stock Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No inventory products found.</p>
                      <p className="text-[11px] mt-0.5">Try changing your search query or active filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.stockQuantity > 0 && p.stockQuantity <= (p.minStockAlert || 20);
                    const isOut = p.stockQuantity === 0;
                    const isInline = inlineEditingId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-blue-50/70 transition">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.thumbnailUrl || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=120&q=80'}
                              alt={p.title}
                              className="w-10 h-10 rounded-lg object-cover border border-blue-200/80 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                              <span className="font-mono text-[10px] text-slate-400 font-semibold">{p.sku}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{p.category}</span>
                          <span className="text-slate-400 block text-[10px]">{p.brand || 'Unbranded'}</span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{((p.pricePaise || 0) / 100).toLocaleString('en-IN')}
                          <span className="text-slate-400 block text-[10px] font-normal font-sans">
                            per {p.unit || 'Unit'}
                          </span>
                        </td>

                        {/* Available Stock with inline quick edit */}
                        <td className="py-3 px-3 text-center">
                          {isInline ? (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={inlineStockVal}
                                onChange={(e) => setInlineStockVal(parseInt(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-xs border border-blue-400 rounded-lg text-center font-mono font-bold focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlineStock(p)}
                                className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                                title="Save"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setInlineEditingId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 group">
                              <span className="font-mono font-black text-sm text-slate-900">
                                {p.stockQuantity}
                              </span>
                              <span className="text-[10px] text-slate-400">{p.unit || 'Units'}</span>
                              <button
                                onClick={() => {
                                  setInlineEditingId(p.id);
                                  setInlineStockVal(p.stockQuantity);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                title="Quick edit stock"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {p.minStockAlert || 20} {p.unit || 'Units'}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-blue-200">
                              Low Stock Alert
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Optimal
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setAdjustModalProduct(p);
                                setAdjustType('STOCK_IN');
                                setAdjustQty(25);
                                setAdjustReason('Supplier Restock Shipment');
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              title="Add stock in"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Stock In</span>
                            </button>

                            <button
                              onClick={() => {
                                setAdjustModalProduct(p);
                                setAdjustType('STOCK_OUT');
                                setAdjustQty(5);
                                setAdjustReason('Physical Damage / Transit Loss');
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                              title="Deduct stock out"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Stock Out</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* AUDIT LEDGER TABLE (Section 9: Complete Stock History) */
          <div className="overflow-x-auto rounded-xl border border-blue-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/30 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-blue-200/80">
                <tr>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3">Product / SKU</th>
                  <th className="py-3 px-3 text-center">Movement Type</th>
                  <th className="py-3 px-3 text-right">Qty Adjusted</th>
                  <th className="py-3 px-3 text-right">Prev → Balance</th>
                  <th className="py-3 px-3">Audit Reason</th>
                  <th className="py-3 px-3.5">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">No stock movements recorded yet.</p>
                      <p className="text-[11px] mt-0.5">Every manual adjustment or order dispatch will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isStockIn = m.movementType === 'STOCK_IN';

                    return (
                      <tr key={m.id} className="hover:bg-blue-50/70 transition">
                        <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{m.productTitle}</div>
                          <span className="font-mono text-[10px] text-slate-400">{m.sku}</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isStockIn
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isStockIn ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            <span>{isStockIn ? 'STOCK IN' : 'STOCK OUT'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={isStockIn ? 'text-emerald-700' : 'text-rose-700'}>
                            {isStockIn ? '+' : '-'}{m.quantity}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {m.previousStock} → <strong className="text-slate-900">{m.newStock}</strong>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {m.reason}
                          {m.notes && <span className="block text-[10px] text-slate-400 font-normal">{m.notes}</span>}
                        </td>

                        <td className="py-3 px-3.5 font-mono text-slate-600 text-[11px]">
                          {m.performedBy || 'System Automated'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: MANUAL STOCK IN / STOCK OUT ADJUSTMENT */}
      <AnimatePresence>
        {adjustModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl text-white ${adjustType === 'STOCK_IN' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {adjustType === 'STOCK_IN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-navy-950">
                      {adjustType === 'STOCK_IN' ? 'Manual Stock In (Add Units)' : 'Manual Stock Out (Deduct Units)'}
                    </h3>
                    <p className="text-[11px] text-slate-500">{adjustModalProduct.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAdjustModalProduct(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePerformAdjustment} className="p-5 space-y-4">
                {/* Product Summary */}
                <div className="p-3 bg-sky-50/30 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CURRENT STOCK</span>
                    <strong className="text-base font-black font-mono text-slate-900">
                      {adjustModalProduct.stockQuantity} {adjustModalProduct.unit || 'Units'}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">NEW BALANCE ESTIMATE</span>
                    <strong
                      className={`text-base font-black font-mono ${
                        adjustType === 'STOCK_IN' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {adjustType === 'STOCK_IN'
                        ? adjustModalProduct.stockQuantity + (adjustQty || 0)
                        : Math.max(0, adjustModalProduct.stockQuantity - (adjustQty || 0))}{' '}
                      {adjustModalProduct.unit || 'Units'}
                    </strong>
                  </div>
                </div>

                {/* Adjustment Type Switcher */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('STOCK_IN')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        adjustType === 'STOCK_IN'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-white border-blue-200/80 text-slate-600 hover:bg-sky-50/30'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Stock In (+ Units)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('STOCK_OUT')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        adjustType === 'STOCK_OUT'
                          ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-white border-blue-200/80 text-slate-600 hover:bg-sky-50/30'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                      <span>Stock Out (- Units)</span>
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Units to {adjustType === 'STOCK_IN' ? 'Add' : 'Deduct'} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-sky-50/30 border border-blue-200/80 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Audit Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Audit Reason *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl font-bold focus:outline-none"
                  >
                    {adjustType === 'STOCK_IN' ? (
                      <>
                        <option value="New Warehouse Shipment Received">New Warehouse Shipment Received</option>
                        <option value="Customer Return Stock Restored">Customer Return Stock Restored</option>
                        <option value="Physical Count Surplus Reconciliation">Physical Count Surplus Reconciliation</option>
                        <option value="Inter-Depot Transfer In">Inter-Depot Transfer In</option>
                      </>
                    ) : (
                      <>
                        <option value="Physical Damage / Transit Loss">Physical Damage / Transit Loss</option>
                        <option value="Direct Offline Over-the-counter Sale">Direct Offline Over-the-counter Sale</option>
                        <option value="Expired / Defective Batch Discarded">Expired / Defective Batch Discarded</option>
                        <option value="Inventory Audit Shortage Reconciliation">Inventory Audit Shortage Reconciliation</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Internal Reference / Notes</label>
                  <input
                    type="text"
                    placeholder=""
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalProduct(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 ${
                      adjustType === 'STOCK_IN'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Adjustment</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BULK STOCK UPDATE */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-blue-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-sky-50/30 border-b border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-navy-950">Bulk Stock Reconciliation</h3>
                    <p className="text-[11px] text-slate-500">Edit stock quantities across all listed SKUs in one go</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-2">Product Name</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2 text-center">Current</th>
                      <th className="p-2 text-center">New Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="p-2 font-bold text-slate-900 line-clamp-1">{row.name}</td>
                        <td className="p-2 font-mono text-slate-400">{row.sku}</td>
                        <td className="p-2 text-center font-mono">{row.currentStock}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={row.newStock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, newStock: val } : r))
                              );
                            }}
                            className="w-20 px-2 py-1 text-xs border border-blue-400 rounded-lg text-center font-mono font-bold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-sky-50/30 border-t border-blue-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total items: <strong>{bulkRows.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBulkUpdate}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Apply All Updates</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
