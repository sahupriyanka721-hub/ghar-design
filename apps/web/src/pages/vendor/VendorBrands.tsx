import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  getVendorBrands,
  submitVendorBrandRequest,
  getVendorByPhone,
} from '../../data/vendorStore.js';
import { VendorBrandItem } from '@ghar-design/shared';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  Building,
  Upload,
} from 'lucide-react';

export const VendorBrands: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [brands, setBrands] = useState<VendorBrandItem[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Cement & Concrete',
    logoUrl: '',
  });

  const vendorRecord = useMemo(() => {
    if (!user?.phone) return null;
    return getVendorByPhone(user.phone) || null;
  }, [user?.phone]);

  const loadBrands = () => {
    const vId = vendorRecord?.id || user?.id;
    setBrands(getVendorBrands(vId));
  };

  useEffect(() => {
    loadBrands();
  }, [user, vendorRecord]);

  const handleRequestBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Please enter the manufacturer or brand name');
      return;
    }

    submitVendorBrandRequest({
      name: formData.name,
      categories: [formData.category],
      logoUrl: formData.logoUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200',
      requestedByVendorId: vendorRecord?.id || user?.id || 'vnd-1',
    });

    success(`Brand request for "${formData.name}" submitted! Awaiting Admin verification.`);
    setIsModalOpen(false);
    setFormData({ name: '', category: 'Cement & Concrete', logoUrl: '' });
    loadBrands();
  };

  const filteredBrands = useMemo(() => {
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    );
  }, [brands, search]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Manufacturer Directory</span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-navy-950">
            Brand Management & Manufacturer Approvals
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Request New Brand</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search verified brands (e.g. UltraTech, Tata Tiscon, Kajaria)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-blue-200/80 rounded-xl focus:border-navy-900"
        />
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs hover:shadow-md transition text-center space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-sky-50/30 border border-blue-200/80 flex items-center justify-center mx-auto text-navy-950 font-black font-display text-base">
                {brand.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xs font-bold text-navy-950 line-clamp-1">{brand.name}</h3>
                <span className="text-[10px] text-slate-400 line-clamp-1">{(brand.categories || []).join(', ')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
              {brand.status === 'ACTIVE' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Marketplace Verified</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-900 border border-blue-300 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  <span>Pending Approval</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Request New Brand */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-200/80 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-navy-950 font-display">Request Brand Onboarding</h2>
            <form onSubmit={handleRequestBrand} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand / Manufacturer Name *</label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Applicable Category</label>
                <input
                  type="text"
                  placeholder=""
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200/80 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand Logo Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
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
                  Submit Brand Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
