import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatINR } from '../../lib/utils.js';
import {
  getVendorProducts,
  saveVendorProduct,
  updateVendorProductStockAndPrice,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import { VendorProduct, ConstructionMeasurementUnit } from '@ghar-design/shared';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Check,
  X,
  Image,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Boxes,
  Copy,
  Trash2,
  Eye,
  Sliders,
} from 'lucide-react';

const MEASUREMENT_UNITS: { unit: ConstructionMeasurementUnit; label: string; example: string }[] = [
  { unit: 'BAG', label: 'Bag (Standard 50 KG)', example: 'Cement, Ready Mix Mortar' },
  { unit: 'METRIC_TON', label: 'Metric Ton (MT)', example: 'TMT Steel, Coarse Aggregate' },
  { unit: 'KG', label: 'Kilogram (KG)', example: 'Binding Wire, Fasteners, Admixtures' },
  { unit: 'CFT', label: 'Cubic Feet (CFT)', example: 'River Sand, Stone Dust, Soil' },
  { unit: 'PIECE', label: 'Piece (Single Unit)', example: 'Red Clay Bricks, Hollow Blocks, Valves' },
  { unit: 'BOX', label: 'Box / Carton', example: 'Vitrified Floor Tiles, Screws' },
  { unit: 'BUNDLE', label: 'Bundle', example: 'Plywood Sheets, TMT Rebar Bundles' },
  { unit: 'SQFT', label: 'Square Feet (SQFT)', example: 'Granite Slabs, Italian Marble, Glass' },
  { unit: 'LITRE', label: 'Litre', example: 'Paints, Primers, Waterproofing Liquid' },
  { unit: 'METER', label: 'Meter', example: 'CPVC Pipes, Electrical Copper Wires' },
  { unit: 'FEET', label: 'Feet / RFT', example: 'Steel Angles, Timber Beams' },
  { unit: 'SET', label: 'Complete Set', example: 'Sanitary Fixtures, Bathroom Mixers' },
  { unit: 'PACKET', label: 'Packet', example: 'Waterproof Tape, Wall Putty' },
];

const PRODUCT_CATEGORIES = [
  { slug: 'cement', name: 'Cement & Ready Mix Concrete (RMC)' },
  { slug: 'steel', name: 'TMT Steel Rebar & Structural Steel' },
  { slug: 'bricks', name: 'Red Clay Bricks & AAC Blocks' },
  { slug: 'sand', name: 'River Sand & Plaster M-Sand' },
  { slug: 'plumbing', name: 'Plumbing & Sanitaryware' },
  { slug: 'electrical', name: 'Electrical Cables & Switchgears' },
  { slug: 'tiles', name: 'Tiles, Granite & Natural Marble' },
  { slug: 'wood', name: 'Plywood, Timber & Premium Hardware' },
  { slug: 'chemicals', name: 'Waterproofing & Construction Chemicals' },
];

const PRESET_IMAGES: Record<string, string> = {
  cement: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
  steel: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500',
  bricks: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=500',
  sand: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500',
  plumbing: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500',
  electrical: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500',
  tiles: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500',
  wood: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500',
  chemicals: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500',
};

export const VendorProducts: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LOW_STOCK'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');

  // Inline Stock & Price Edit
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editStockVal, setEditStockVal] = useState<number>(0);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadProducts = () => {
    const vId = vendorRecord?.id || user?.id || '';
    const list = getVendorProducts(vId);
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, [user, vendorRecord]);

  // Form State for Add Product
  const [formData, setFormData] = useState({
    name: '',
    brand: 'UltraTech',
    category: PRODUCT_CATEGORIES[0].name,
    subcategory: 'OPC 53 Grade',
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    unit: 'BAG' as ConstructionMeasurementUnit,
    costPriceRupees: 340,
    priceRupees: 395,
    mrpRupees: 420,
    taxRatePercent: 28, // standard for cement
    stockQuantity: 500,
    minStockAlert: 50,
    minOrderQuantity: 10,
    deliveryDays: 1,
    imageUrl: PRESET_IMAGES['cement'],
    specifications: 'IS 269:2015 certified 53 Grade Ordinary Portland Cement for structural concrete beams, RCC columns and slabs.',
    hasVariants: false,
    variants: [
      { id: 'v1', sku: 'CEM-53-50', title: '50 KG Bag', variantType: 'PACKAGING' as const, variantValue: '50 KG HDPE Bag', pricePaise: 39500, mrpPaise: 42000, stockQuantity: 500 },
    ],
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Product name is required');
      return;
    }
    const vId = vendorRecord?.id || user?.id || 'vnd-1';
    const vName = vendorRecord?.businessName || user?.name || 'Authorized Depot';
    const vPhone = user?.phone || '8319955741';

    const newProd: VendorProduct = {
      id: `prod-${Date.now()}`,
      vendorId: vId,
      vendorName: vName,
      vendorPhone: vPhone,
      name: formData.name,
      sku: formData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      brand: formData.brand,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      costPricePaise: formData.costPriceRupees * 100,
      pricePaise: formData.priceRupees * 100,
      mrpPaise: formData.mrpRupees * 100,
      taxRatePercent: formData.taxRatePercent,
      stockQuantity: formData.stockQuantity,
      minStockAlert: formData.minStockAlert,
      inStock: formData.stockQuantity > 0,
      minOrderQuantity: formData.minOrderQuantity,
      deliveryDays: formData.deliveryDays,
      imageUrl: formData.imageUrl,
      specifications: formData.specifications,
      hasVariants: formData.hasVariants,
      variants: formData.hasVariants ? formData.variants : undefined,
      approvalStatus: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveVendorProduct(newProd);
    success(`"${newProd.name}" submitted successfully! Sent to Admin moderation queue.`);
    setIsAddModalOpen(false);
    loadProducts();
  };

  const handleSaveStockAndPrice = (prodId: string) => {
    updateVendorProductStockAndPrice(prodId, {
      stockQuantity: editStockVal,
      pricePaise: editPriceVal * 100,
      inStock: editStockVal > 0,
    });
    success('Inventory stock and unit price updated!');
    setEditingStockId(null);
    loadProducts();
  };

  // Bulk Upload Handler
  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) {
      error('Please paste CSV rows or upload a file');
      return;
    }

    const lines = bulkCsvText.trim().split('\n');
    let addedCount = 0;
    const vId = vendorRecord?.id || user?.id || 'vnd-1';
    const vName = vendorRecord?.businessName || user?.name || 'Authorized Depot';
    const vPhone = user?.phone || '8319955741';

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('name')) return; // skip header
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        const [name, brand, category, unit, priceStr, stockStr] = parts;
        const pNum = Number(priceStr) || 450;
        const sNum = Number(stockStr) || 100;

        const p: VendorProduct = {
          id: `prod-bulk-${Date.now()}-${idx}`,
          vendorId: vId,
          vendorName: vName,
          vendorPhone: vPhone,
          name: name || 'Bulk Construction Material',
          sku: `SKU-B-${Math.floor(100000 + Math.random() * 900000)}`,
          brand: brand || 'Standard Manufacturer',
          category: category || 'General Materials',
          unit: (unit as any) || 'BAG',
          pricePaise: pNum * 100,
          mrpPaise: (pNum + 50) * 100,
          stockQuantity: sNum,
          inStock: sNum > 0,
          minOrderQuantity: 1,
          deliveryDays: 2,
          imageUrl: PRESET_IMAGES['cement'],
          specifications: 'Factory standard quality assured building material.',
          approvalStatus: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveVendorProduct(p);
        addedCount++;
      }
    });

    success(`Successfully imported ${addedCount} products for admin approval!`);
    setIsBulkModalOpen(false);
    setBulkCsvText('');
    loadProducts();
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'ALL' || p.category === filterCategory;

      let matchStatus = true;
      if (statusTab === 'ACTIVE') matchStatus = p.approvalStatus === 'APPROVED' && p.inStock;
      else if (statusTab === 'PENDING') matchStatus = p.approvalStatus === 'PENDING_APPROVAL';
      else if (statusTab === 'REJECTED') matchStatus = p.approvalStatus === 'REJECTED';
      else if (statusTab === 'LOW_STOCK') matchStatus = p.stockQuantity <= (p.minStockAlert || 50);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, filterCategory, statusTab]);

  return (
    <div className="space-y-6">

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Catalog</span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
            Products, Pricing & Stock Management
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-sky-50/30 text-slate-700 border border-blue-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (Section 8C) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: 'All SKUs', count: products.length },
          { key: 'ACTIVE', label: 'Active on Store', count: products.filter((p) => p.approvalStatus === 'APPROVED' && p.inStock).length },
          { key: 'PENDING', label: 'Pending Admin Review', count: products.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length },
          { key: 'LOW_STOCK', label: 'Low Stock Alerts', count: products.filter((p) => p.stockQuantity <= (p.minStockAlert || 50)).length },
          { key: 'REJECTED', label: 'Rejected', count: products.filter((p) => p.approvalStatus === 'REJECTED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
              statusTab === tab.key
                ? 'bg-navy-950 text-gold-400 shadow-2xs'
                : 'bg-white text-slate-600 border border-blue-200/80 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === tab.key ? 'bg-gold-500 text-navy-950' : 'bg-slate-100 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:outline-none focus:border-navy-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-sky-50/30 border border-blue-200/80 rounded-xl focus:border-navy-900 font-medium"
          >
            <option value="ALL">All Categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table (Section 8C) */}
      <div className="bg-white rounded-3xl border border-blue-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-blue-50/70 border-b border-blue-200/80 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-3">Category & Brand</th>
                <th className="py-3 px-3">Unit Price (₹)</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isEditing = editingStockId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-sky-50/40 transition">
                    {/* Product Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl || PRESET_IMAGES['cement']}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-blue-200/80 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="font-bold text-navy-950 line-clamp-1">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</div>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.unit}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800 line-clamp-1">{p.category}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{p.brand}</div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPriceVal}
                          onChange={(e) => setEditPriceVal(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-xs border border-blue-500 rounded font-mono font-bold"
                        />
                      ) : (
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatINR(p.pricePaise / 100)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ {p.unit}</span>
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStockVal}
                          onChange={(e) => setEditStockVal(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-blue-500 rounded font-mono font-bold"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${
                            p.stockQuantity <= (p.minStockAlert || 50) ? 'text-amber-700' : 'text-slate-900'
                          }`}>
                            {p.stockQuantity} {p.unit}
                          </span>
                          {p.stockQuantity <= (p.minStockAlert || 50) && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                              Low
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        p.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : p.approvalStatus === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}>
                        {p.approvalStatus === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {p.approvalStatus === 'PENDING_APPROVAL' && <Clock className="w-3 h-3" />}
                        <span>{p.approvalStatus.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveStockAndPrice(p.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingStockId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStockId(p.id);
                            setEditStockVal(p.stockQuantity);
                            setEditPriceVal(p.pricePaise / 100);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Quick Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No matching products found in catalog.</p>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODAL: ADD NEW PRODUCT (SECTION 8A) ---------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-blue-200/80 max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Catalog Registry</span>
                <h2 className="text-lg font-bold font-display text-navy-950">Add Construction Material SKU</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl focus:border-navy-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                  />
                </div>

                {/* Construction Unit Selector (Crucial Section 8) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Measurement Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-bold text-navy-950"
                  >
                    {MEASUREMENT_UNITS.map((u) => (
                      <option key={u.unit} value={u.unit}>
                        {u.label} ({u.example})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹ per unit) *</label>
                  <input
                    type="number"
                    required
                    value={formData.priceRupees}
                    onChange={(e) => setFormData({ ...formData, priceRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.mrpRupees}
                    onChange={(e) => setFormData({ ...formData, mrpRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Applicable GST Rate (%)</label>
                  <select
                    value={formData.taxRatePercent}
                    onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl font-mono"
                  >
                    <option value={5}>5% (Basic construction goods)</option>
                    <option value={12}>12% (Pipes, fittings)</option>
                    <option value={18}>18% (Steel, hardware, cables, paint)</option>
                    <option value={28}>28% (Cement & luxury fixtures)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Technical Specifications / BIS Certification</label>
                  <textarea
                    rows={2}
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-blue-200/80 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-md hover:bg-navy-900 transition"
                >
                  Submit for Admin Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: BULK CSV IMPORT (SECTION 8D) ---------------- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-200/80 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Inventory Automation</span>
                <h2 className="text-base font-bold font-display text-navy-950">Bulk Product CSV Import</h2>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Format: <code>ProductName, Brand, Category, Unit, SellingPrice, StockQuantity</code>
            </p>

            <form onSubmit={handleBulkUpload} className="space-y-3 text-xs">
              <textarea
                rows={6}
                placeholder="UltraTech Super Cement, UltraTech, Cement & Ready Mix, BAG, 395, 500
Tata Tiscon 12mm TMT, Tata Tiscon, TMT Steel & Iron, KG, 78, 2500
Red Clay Bricks (Class A), Local Kiln, Red Bricks, PIECE, 9, 10000"
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-blue-200/80 rounded-xl focus:border-navy-900"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkCsvText(
                      `UltraTech Weather Pro 53G, UltraTech, Cement & Ready Mix, BAG, 390, 800\n` +
                      `Tata Tiscon 16mm Fe550D, Tata Tiscon, TMT Steel Rebar, METRIC_TON, 72000, 15\n` +
                      `AAC Blocks 600x200x100mm, Magicrete, Red Bricks & AAC, PIECE, 58, 2000`
                    );
                    info('Sample CSV template filled!');
                  }}
                  className="text-blue-700 font-bold underline"
                >
                  Insert Sample Data
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-3 py-1.5 border border-blue-200/80 rounded-lg text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-navy-950 text-gold-400 font-bold rounded-xl shadow-sm"
                  >
                    Import Products
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
