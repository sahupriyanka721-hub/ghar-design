import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getVendorCategoryRequests,
  submitVendorCategoryRequest,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import { VendorCategoryRequest } from '@ghar-design/shared';
import {
  Layers,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Tag,
  ShieldCheck,
  Building,
  HelpCircle,
} from 'lucide-react';

const SYSTEM_CATEGORIES = [
  { name: 'Cement & Ready Mix Concrete (RMC)', subcategories: ['OPC 53 Grade', 'PPC Fly-Ash Cement', 'White Cement', 'RMC Ready Mix Concrete M20/M25'] },
  { name: 'TMT Steel Rebar & Structural Steel', subcategories: ['Fe 550D TMT Bars', 'Structural MS Angles & Channels', 'Binding Wire', 'Binding Strips'] },
  { name: 'Red Bricks, AAC Blocks & Fly Ash', subcategories: ['Red Kiln Clay Bricks', 'Autoclaved Aerated Concrete (AAC) Blocks', 'Solid Concrete Blocks'] },
  { name: 'Coarse River Sand & Plaster M-Sand', subcategories: ['Coarse Yamuna/River Sand', 'Manufactured M-Sand', 'P-Sand for Plastering', '10mm/20mm Aggregates'] },
  { name: 'Plumbing, Sanitaryware & Conduit Pipes', subcategories: ['CPVC Hot & Cold Pipes', 'UPVC Drainage Pipes', 'SWR Fittings', 'Overhead Water Tanks'] },
  { name: 'Electrical Cables, Wires & Switchgear', subcategories: ['Flame Retardant (FR) Copper Wires', 'MCB Distribution Boards', 'Modular Switches & Sockets'] },
  { name: 'Tiles, Granite, Italian & Natural Marble', subcategories: ['Glazed Vitrified Tiles (GVT/PGVT)', 'Double Charge Vitrified', 'Black Granite Slabs', 'Ceramic Wall Tiles'] },
  { name: 'Waterproofing Compounds & Construction Chemicals', subcategories: ['Slab Waterproofing Admixtures', 'Epoxy Tile Grout', 'Crack Repair Putty', 'Curing Compounds'] },
  { name: 'Timber, Marine Plywood & Premium Hardware', subcategories: ['Calibrated BWP Marine Ply', 'Door Frames & Flush Doors', 'Stainless Steel Mortise Handles'] },
];

export const VendorCategories: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [requests, setRequests] = useState<VendorCategoryRequest[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'CATEGORY' as 'CATEGORY' | 'SUBCATEGORY',
    parentCategoryName: SYSTEM_CATEGORIES[0].name,
    requestedName: '',
    description: '',
  });

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadRequests = () => {
    const vId = vendorRecord?.id || user?.id || '';
    setRequests(getVendorCategoryRequests(vId));
  };

  useEffect(() => {
    loadRequests();
  }, [user, vendorRecord]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestedName.trim()) {
      error('Please enter the category or subcategory name');
      return;
    }

    submitVendorCategoryRequest({
      vendorId: vendorRecord?.id || user?.id || 'vnd-1',
      vendorName: vendorRecord?.businessName || user?.name || 'Authorized Depot',
      type: formData.type,
      parentCategoryName: formData.type === 'SUBCATEGORY' ? formData.parentCategoryName : undefined,
      requestedName: formData.requestedName,
      description: formData.description,
    });

    success('Category request submitted! Admin will evaluate and approve within 24 hours.');
    setIsModalOpen(false);
    setFormData({
      type: 'CATEGORY',
      parentCategoryName: SYSTEM_CATEGORIES[0].name,
      requestedName: '',
      description: '',
    });
    loadRequests();
  };

  const filteredCategories = useMemo(() => {
    return SYSTEM_CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subcategories.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketplace Taxonomy</span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
            Category & Subcategory Management
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Request New Category</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Marketplace Taxonomy Rule:</strong> Global categories and subcategories are curated and vetted by BuildGhar Admin to maintain catalog uniformity. If your specialty product is not covered, submit a request below for admin review.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search categories and subcategories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-blue-200/80 rounded-xl focus:border-navy-900"
        />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-7 h-7 rounded-lg bg-navy-950 text-gold-400 flex items-center justify-center font-bold text-xs">
                {i + 1}
              </div>
              <h3 className="font-bold text-navy-950 text-xs line-clamp-1">{cat.name}</h3>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Subcategories:</span>
              <div className="flex flex-wrap gap-1.5">
                {(cat.subcategories || []).map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Submitted Requests */}
      <div className="bg-white rounded-3xl border border-blue-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-navy-950 font-display">My Category Requests to Admin</h2>
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue-200/80 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Requested Name</th>
                  <th className="py-2.5">Parent Category</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-bold text-slate-800">{r.type}</td>
                    <td className="py-3 font-bold text-navy-950">{r.requestedName}</td>
                    <td className="py-3 text-slate-500">{r.parentCategoryName || 'Top-Level'}</td>
                    <td className="py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No custom category requests submitted yet.</p>
        )}
      </div>

      {/* Modal: Request New Category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-200/80 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-navy-950 font-display">Request New Category / Subcategory</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Request Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'CATEGORY' })}
                    className={`py-2 rounded-xl font-bold border transition ${
                      formData.type === 'CATEGORY' ? 'bg-navy-950 text-gold-400 border-navy-950' : 'bg-sky-50/30 text-slate-600 border-blue-200/80'
                    }`}
                  >
                    Main Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'SUBCATEGORY' })}
                    className={`py-2 rounded-xl font-bold border transition ${
                      formData.type === 'SUBCATEGORY' ? 'bg-navy-950 text-gold-400 border-navy-950' : 'bg-sky-50/30 text-slate-600 border-blue-200/80'
                    }`}
                  >
                    Subcategory
                  </button>
                </div>
              </div>

              {formData.type === 'SUBCATEGORY' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Parent Category</label>
                  <select
                    value={formData.parentCategoryName}
                    onChange={(e) => setFormData({ ...formData, parentCategoryName: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                  >
                    {SYSTEM_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Requested Name *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={formData.requestedName}
                  onChange={(e) => setFormData({ ...formData, requestedName: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this category is needed for your product inventory."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-blue-200/80 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-950 text-gold-400 rounded-xl font-bold shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
