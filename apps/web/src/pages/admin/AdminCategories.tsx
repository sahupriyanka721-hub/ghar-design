import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext.js';
import {
  Building2,
  Plus,
  Check,
  Edit2,
  Layers,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Compass,
  ShieldCheck,
  Paintbrush,
  Hammer,
  FileText,
  Eye,
  Briefcase,
  Wrench,
  Calculator,
  Search,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Power,
  RotateCcw,
} from 'lucide-react';
import {
  getPlatformCategories,
  savePlatformCategory,
  updatePlatformCategory,
  deletePlatformCategory,
  togglePlatformCategoryStatus,
  PlatformCategoryItem,
  syncChannel,
} from '../../data/customerStore.js';

// Available icons mapping for service categories
const ICON_OPTIONS = [
  { name: 'Building2', label: 'Building / Construction', component: Building2 },
  { name: 'Compass', label: 'Compass / Planning', component: Compass },
  { name: 'ShieldCheck', label: 'Shield / Engineering', component: ShieldCheck },
  { name: 'Paintbrush', label: 'Paintbrush / Interior', component: Paintbrush },
  { name: 'Hammer', label: 'Hammer / Renovation', component: Hammer },
  { name: 'Sparkles', label: 'Sparkles / 3D Render', component: Sparkles },
  { name: 'FileText', label: 'Blueprint / 2D', component: FileText },
  { name: 'Eye', label: 'Eye / Supervision', component: Eye },
  { name: 'Briefcase', label: 'Briefcase / Commercial', component: Briefcase },
  { name: 'Wrench', label: 'Wrench / MEP', component: Wrench },
  { name: 'Calculator', label: 'Calculator / BOQ', component: Calculator },
  { name: 'Layers', label: 'Layers / General', component: Layers },
];

export const AdminCategories: React.FC = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<PlatformCategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCatStep, setAddCatStep] = useState<1 | 2>(1);
  const [editingCategory, setEditingCategory] = useState<PlatformCategoryItem | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>('');

  // Add Category Form State
  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    icon: 'Building2',
    isActive: true,
  });

  // Edit Category Form State
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    icon: 'Building2',
    isActive: true,
  });

  const loadCategories = () => {
    const list = getPlatformCategories();
    setCategories(list);
  };

  useEffect(() => {
    loadCategories();
    window.addEventListener('storage', loadCategories);
    const onSync = (event: MessageEvent) => {
      if (event.data?.type === 'CATEGORIES_UPDATED') {
        loadCategories();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadCategories);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  const handleToggle = (slug: string) => {
    const updated = togglePlatformCategoryStatus(slug);
    setCategories(updated);
    success('Category status updated.');
  };

  // Add Modal Name Change
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewCat((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') ? slug : prev.slug,
    }));
  };

  // Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      error('Category name is required');
      return;
    }
    const cleanSlug = newCat.slug.trim() || newCat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const updated = savePlatformCategory({
      name: newCat.name.trim(),
      slug: cleanSlug,
      shortDescription: newCat.shortDescription.trim() || 'Professional construction and engineering services.',
      icon: newCat.icon,
      isActive: newCat.isActive,
    });
    setCategories(updated);
    setAddCatStep(1);
    setShowAddModal(false);
    setNewCat({ name: '', slug: '', shortDescription: '', icon: 'Building2', isActive: true });
    success(`Service Category "${newCat.name}" successfully created!`);
  };

  // Open Edit Modal
  const openEditModal = (cat: PlatformCategoryItem) => {
    setEditingCategory(cat);
    setOriginalSlug(cat.slug);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      shortDescription: cat.shortDescription,
      icon: cat.icon || 'Building2',
      isActive: cat.isActive,
    });
  };

  // Save Category Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      error('Category name cannot be empty');
      return;
    }
    const cleanSlug = editForm.slug.trim() || editForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const updatedData: PlatformCategoryItem = {
      name: editForm.name.trim(),
      slug: cleanSlug,
      shortDescription: editForm.shortDescription.trim(),
      icon: editForm.icon,
      isActive: editForm.isActive,
    };

    const updatedList = updatePlatformCategory(originalSlug, updatedData);
    setCategories(updatedList);
    setEditingCategory(null);
    success(`Category "${updatedData.name}" updated successfully!`);
  };

  // Delete Category
  const handleDeleteCategory = (cat: PlatformCategoryItem) => {
    if (confirm(`Are you sure you want to delete category "${cat.name}" (/services/${cat.slug})?`)) {
      const updated = deletePlatformCategory(cat.slug);
      setCategories(updated);
      success(`Category "${cat.name}" has been deleted.`);
    }
  };

  // Filter Categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // Icon Resolver
  const renderCategoryIcon = (iconName?: string) => {
    const found = ICON_OPTIONS.find((opt) => opt.name === iconName);
    const Comp = found ? found.component : Building2;
    return <Comp className="w-5 h-5 text-blue-700" />;
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const disabledCount = categories.length - activeCount;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-display text-navy-950">
              Service Categories Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              {categories.length} Disciplines
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure, edit, activate, or add engineering & engineering service offerings across the marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Metrics & Search Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Categories</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{categories.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Services</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{activeCount} Published</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disabled / Hidden</div>
            <div className="text-xl font-black text-slate-700 mt-0.5">{disabledCount} Archived</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <Power className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search service categories by name, slug (e.g. /house-map-planning), or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCategories.map((cat) => (
          <div
            key={cat.slug}
            className={`card p-5 flex flex-col justify-between space-y-4 bg-white border transition-all ${
              cat.isActive
                ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                : 'border-slate-200 bg-slate-50/50 opacity-80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-950 text-sm font-display leading-tight">{cat.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400">/services/{cat.slug}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cat.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                {cat.shortDescription}
              </p>
            </div>

            {/* Action Bar with Edit Option */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Dedicated Edit Button */}
                <button
                  onClick={() => openEditModal(cat)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 hover:border-blue-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                  title="Edit category details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Edit Category</span>
                </button>

                {/* View on Public Site Link */}
                <a
                  href={`/services/${cat.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Preview public service page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Status Button */}
                <button
                  onClick={() => handleToggle(cat.slug)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                    cat.isActive
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  }`}
                >
                  {cat.isActive ? 'Deactivate' : 'Activate'}
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No service categories found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search keyword or add a new category.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {editingCategory && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Edit Service Category
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Category Taxonomy • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs font-semibold"
                  placeholder=""
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  URL Slug Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder=""
                />
                <p className="text-[10px] text-slate-400">
                  Defines the marketplace URL path: <code className="text-blue-700 font-mono">/services/{editForm.slug}</code>
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Category Icon
                </label>
                <select
                  value={editForm.icon}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.label} ({opt.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs leading-relaxed"
                  placeholder="Summary of scope, deliverables, and service offerings..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Marketplace Publication Status</label>
                <select
                  value={editForm.isActive ? 'ACTIVE' : 'DISABLED'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'ACTIVE' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                >
                  <option value="ACTIVE">Active (Published & Visible to Customers)</option>
                  <option value="DISABLED">Disabled (Hidden from public navigation)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CATEGORY MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="admin-fullscreen-modal fixed inset-0 z-50 overflow-y-auto bg-[#f0f7ff] flex flex-col font-sans animate-in fade-in duration-150">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 via-sky-400 to-transparent pointer-events-none shrink-0" />
          <div className="sticky top-0 z-40 bg-navy-950 text-white px-4 sm:px-8 py-3.5 border-b border-navy-900 flex items-center justify-between shadow-xl shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 transition group cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back / Cancel</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base font-display shrink-0">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black font-display text-white truncate">
                    Add New Service Category
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Category Taxonomy • Admin Platform Operations
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* STEPPER PROGRESS BAR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-sm">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {[
                  { step: 1, title: '1. Identity & Identifier', desc: 'Category Name, URL Slug & Visual Icon' },
                  { step: 2, title: '2. Scope & Publishing', desc: 'Scope Description & Marketplace Status' },
                ].map((s) => {
                  const isActive = addCatStep === s.step;
                  const isCompleted = addCatStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setAddCatStep(s.step as 1 | 2)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-center ${
                        isActive
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                          : isCompleted
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                        </span>
                        <span className="font-bold text-xs text-navy-950 truncate">{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-7 hidden sm:inline truncate">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xl">
              <form onSubmit={handleCreateCategory} className="space-y-6 text-xs text-slate-700">
                {/* STEP 1: IDENTITY */}
                {addCatStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 1: Category Identity & Nomenclature</h3>
                      <p className="text-xs text-slate-500">Provide official category title and unique system URL slug identifier.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">
                          Category Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={newCat.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">
                          URL Slug Identifier <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="solar-rooftop-green-energy"
                          value={newCat.slug}
                          onChange={(e) => setNewCat({ ...newCat, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">
                          Category Icon
                        </label>
                        <select
                          value={newCat.icon}
                          onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.label} ({opt.name})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCat.name.trim() || !newCat.slug.trim()) {
                            alert('Please enter Category Name and URL Slug.');
                            return;
                          }
                          setAddCatStep(2);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <span>Proceed to Scope & Publishing</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SCOPE & PUBLISHING */}
                {addCatStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-navy-950">Step 2: Scope Description & Status</h3>
                      <p className="text-xs text-slate-500">Define customer-facing description and immediate marketplace visibility.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">
                          Short Description
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Summary of engineering scope, deliverables, and service offerings..."
                          value={newCat.shortDescription}
                          onChange={(e) => setNewCat({ ...newCat, shortDescription: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Marketplace Status</label>
                        <select
                          value={newCat.isActive ? 'ACTIVE' : 'DISABLED'}
                          onChange={(e) => setNewCat({ ...newCat, isActive: e.target.value === 'ACTIVE' })}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        >
                          <option value="ACTIVE">Active (Visible to Homeowners & Estimators)</option>
                          <option value="DISABLED">Disabled (Hidden in Marketplace)</option>
                        </select>
                      </div>

                      {/* Summary Preview */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">Category Overview</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-slate-500">Name:</span> <span className="font-bold text-navy-950">{newCat.name || 'Not set'}</span></div>
                          <div><span className="text-slate-500">Slug:</span> <span className="font-mono font-bold text-blue-700">/{newCat.slug || 'slug'}</span></div>
                          <div><span className="text-slate-500">Icon:</span> <span className="font-bold text-slate-800">{newCat.icon}</span></div>
                          <div><span className="text-slate-500">Status:</span> <span className={`font-bold ${newCat.isActive ? 'text-emerald-700' : 'text-slate-600'}`}>{newCat.isActive ? 'ACTIVE' : 'DISABLED'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setAddCatStep(1)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Step 1</span>
                      </button>
                      <button
                        type="submit"
                        className="btn-gold px-8 py-2.5 text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Create Service Category</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
