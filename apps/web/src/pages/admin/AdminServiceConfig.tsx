import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.js';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Building2,
  Compass,
  FileText,
  Sparkles,
  Calculator,
  AlertTriangle,
  Tag,
  Percent,
  IndianRupee,
  Clock,
  HardHat,
  ArrowRight,
  Eye,
  Briefcase,
  Palette,
  Store,
  CheckCircle2,
  Wrench,
  Hammer,
  HelpCircle,
  FolderGit2,
  Award,
} from 'lucide-react';

import {
  PlatformCategoryItem,
  PlatformSubCategoryItem,
  getPlatformCategories,
  savePlatformCategory,
  updatePlatformCategory,
  deletePlatformCategory,
  togglePlatformCategoryStatus,
  addPlatformSubCategory,
  updatePlatformSubCategory,
  deletePlatformSubCategory,
  togglePlatformSubCategoryStatus,
} from '../../data/customerStore.js';

import {
  ServiceTypeItem,
  ProjectTypeItem,
  PricingConfigItem,
  QuotationFeeConfig,
  PlatformCommissionConfig,
  MilestoneTemplateItem,
  ProjectStatusItem,
  getPlatformServiceTypes,
  savePlatformServiceTypes,
  getPlatformProjectTypes,
  savePlatformProjectTypes,
  getPlatformPricingConfigs,
  savePlatformPricingConfigs,
  getPlatformQuotationFeeConfig,
  savePlatformQuotationFeeConfig,
  getPlatformCommissionConfig,
  savePlatformCommissionConfig,
  getPlatformMilestoneTemplates,
  savePlatformMilestoneTemplates,
  getPlatformProjectStatusSettings,
  savePlatformProjectStatusSettings,
  restoreAllServiceConfigDefaults,
} from '../../data/serviceConfigStore.js';

// Available icons mapping for service categories
const ICON_OPTIONS = [
  { name: 'Building2', label: 'Building / Construction', component: Building2 },
  { name: 'Compass', label: 'Compass / Planning', component: Compass },
  { name: 'ShieldCheck', label: 'Shield / Engineering', component: ShieldCheck },
  { name: 'Paintbrush', label: 'Paintbrush / Interior', component: Palette },
  { name: 'Hammer', label: 'Hammer / Renovation', component: Hammer },
  { name: 'Sparkles', label: 'Sparkles / 3D Render', component: Sparkles },
  { name: 'FileText', label: 'Blueprint / 2D', component: FileText },
  { name: 'Eye', label: 'Eye / Supervision', component: Eye },
  { name: 'Briefcase', label: 'Briefcase / Commercial', component: Briefcase },
  { name: 'Wrench', label: 'Wrench / MEP', component: Wrench },
  { name: 'Calculator', label: 'Calculator / BOQ', component: Calculator },
  { name: 'Layers', label: 'Layers / General', component: Layers },
];

export type ServiceConfigView =
  | 'SERVICE_CATEGORIES'
  | 'SUBCATEGORIES'
  | 'SERVICE_TYPES'
  | 'PROJECT_TYPES'
  | 'PRICING_CONFIGURATION'
  | 'QUOTATION_FEE'
  | 'COMMISSION_SETTINGS'
  | 'MILESTONE_TEMPLATES'
  | 'PROJECT_STATUS_SETTINGS';

interface ViewTabMeta {
  key: ServiceConfigView;
  label: string;
  icon: any;
  shortDesc: string;
}

const VIEW_TABS: ViewTabMeta[] = [
  { key: 'SERVICE_CATEGORIES', label: 'Service Categories', icon: Layers, shortDesc: 'Master list of architecture, structural & turnkey categories' },
  { key: 'SUBCATEGORIES', label: 'Subcategories', icon: Tag, shortDesc: 'Granular design scopes, 2D drawings & specialized services' },
  { key: 'SERVICE_TYPES', label: 'Service Types', icon: Briefcase, shortDesc: 'Digital Remote, Site Survey, Hybrid and Turnkey delivery models' },
  { key: 'PROJECT_TYPES', label: 'Project Types', icon: Building2, shortDesc: 'Residential Villa, Builder Floor, Commercial, Office & Industrial' },
  { key: 'PRICING_CONFIGURATION', label: 'Pricing Configuration', icon: Calculator, shortDesc: 'Base rates per sq.ft, package prices & minimum orders' },
  { key: 'QUOTATION_FEE', label: 'Quotation Request Fee', icon: IndianRupee, shortDesc: 'Token deposit, booking refund policy & user exemption rules' },
  { key: 'COMMISSION_SETTINGS', label: 'Platform Commission Settings', icon: Percent, shortDesc: 'Architect, interior designer, contractor & vendor margin cuts' },
  { key: 'MILESTONE_TEMPLATES', label: 'Milestone Templates', icon: HardHat, shortDesc: 'Standard stage percentage splits, SLAs & inspection rules' },
  { key: 'PROJECT_STATUS_SETTINGS', label: 'Project Status Settings', icon: FolderGit2, shortDesc: 'Lifecycle state machine, color badges & SLA breach escalations' },
];

export const AdminServiceConfig: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active View from URL
  const rawView = searchParams.get('view') as ServiceConfigView | null;
  const activeView: ServiceConfigView = rawView && VIEW_TABS.some((t) => t.key === rawView)
    ? rawView
    : 'SERVICE_CATEGORIES';

  const setView = (newView: ServiceConfigView) => {
    setSearchParams({ view: newView });
  };

  // --------------------------------------------------------------------------
  // STORE STATES
  // --------------------------------------------------------------------------
  const [categories, setCategories] = useState<PlatformCategoryItem[]>(() => getPlatformCategories());
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>(() => getPlatformServiceTypes());
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>(() => getPlatformProjectTypes());
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfigItem[]>(() => getPlatformPricingConfigs());
  const [quotationFee, setQuotationFee] = useState<QuotationFeeConfig>(() => getPlatformQuotationFeeConfig());
  const [commissionConfig, setCommissionConfig] = useState<PlatformCommissionConfig>(() => getPlatformCommissionConfig());
  const [milestoneTemplates, setMilestoneTemplates] = useState<MilestoneTemplateItem[]>(() => getPlatformMilestoneTemplates());
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatusItem[]>(() => getPlatformProjectStatusSettings());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorySlug, setFilterCategorySlug] = useState('ALL');

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategorySlug, setEditingCategorySlug] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', shortDescription: '', icon: 'Building2', isActive: true });

  const [subcatModalOpen, setSubcatModalOpen] = useState(false);
  const [subcatParentSlug, setSubcatParentSlug] = useState('');
  const [subcatForm, setSubcatForm] = useState({ id: '', name: '', slug: '', description: '', isActive: true });

  const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
  const [serviceTypeForm, setServiceTypeForm] = useState<Partial<ServiceTypeItem>>({
    name: '',
    code: '',
    categorySlug: 'planning-design',
    deliveryMode: 'DIGITAL',
    turnaroundSlaDays: 5,
    minOrderPaise: 1000000,
    includedDeliverables: [],
    description: '',
    isActive: true,
  });

  const [projectTypeModalOpen, setProjectTypeModalOpen] = useState(false);
  const [projectTypeForm, setProjectTypeForm] = useState<Partial<ProjectTypeItem>>({
    name: '',
    code: '',
    group: 'RESIDENTIAL',
    typicalAreaRange: '',
    bylawsCompliance: '',
    complexityScore: 3,
    recommendedServiceCode: 'REMOTE_CAD_BIM',
    isActive: true,
  });

  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingForm, setPricingForm] = useState<Partial<PricingConfigItem>>({
    serviceCategory: '',
    projectTypeCode: 'ALL_TYPES',
    pricingModel: 'PER_SQFT',
    baseRateRupees: 15,
    rateUnitLabel: '₹/sq.ft',
    minAreaSqFt: 1000,
    minOrderAmountRupees: 15000,
    taxInclusive: false,
    gstRatePercent: 18,
    discountEligible: true,
    isActive: true,
  });

  // Quick Calculator Preview State
  const [calcArea, setCalcArea] = useState<number>(1800);
  const [calcRateItem, setCalcRateItem] = useState<string>(pricingConfigs[0]?.id || '');

  // Commission Calculator Preview State
  const [commCalcAmount, setCommCalcAmount] = useState<number>(350000);

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      setCategories(getPlatformCategories());
      setServiceTypes(getPlatformServiceTypes());
      setProjectTypes(getPlatformProjectTypes());
      setPricingConfigs(getPlatformPricingConfigs());
      setQuotationFee(getPlatformQuotationFeeConfig());
      setCommissionConfig(getPlatformCommissionConfig());
      setMilestoneTemplates(getPlatformMilestoneTemplates());
      setProjectStatuses(getPlatformProjectStatusSettings());
    };
    window.addEventListener('CATEGORIES_UPDATED', handleUpdate);
    window.addEventListener('SERVICE_CONFIG_UPDATED', handleUpdate);
    window.addEventListener('SETTINGS_UPDATED', handleUpdate);
    return () => {
      window.removeEventListener('CATEGORIES_UPDATED', handleUpdate);
      window.removeEventListener('SERVICE_CONFIG_UPDATED', handleUpdate);
      window.removeEventListener('SETTINGS_UPDATED', handleUpdate);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 1. CATEGORY HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategorySlug(null);
    setCatForm({ name: '', slug: '', shortDescription: '', icon: 'Building2', isActive: true });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: PlatformCategoryItem) => {
    setEditingCategorySlug(cat.slug);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      shortDescription: cat.shortDescription,
      icon: cat.icon || 'Building2',
      isActive: cat.isActive,
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim() || !catForm.slug.trim()) {
      error('Category name and slug are required');
      return;
    }
    const cleanSlug = catForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (editingCategorySlug) {
      const updated = updatePlatformCategory(editingCategorySlug, {
        name: catForm.name.trim(),
        slug: cleanSlug,
        shortDescription: catForm.shortDescription.trim(),
        icon: catForm.icon,
        isActive: catForm.isActive,
      });
      setCategories(updated);
      success('Service category updated successfully');
    } else {
      const existing = categories.find((c) => c.slug === cleanSlug);
      if (existing) {
        error(`Category with slug "${cleanSlug}" already exists`);
        return;
      }
      const updated = savePlatformCategory({
        name: catForm.name.trim(),
        slug: cleanSlug,
        shortDescription: catForm.shortDescription.trim(),
        icon: catForm.icon,
        isActive: catForm.isActive,
        subcategories: [],
      });
      setCategories(updated);
      success('New service category added');
    }
    setCategoryModalOpen(false);
  };

  const handleDeleteCategory = (slug: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? All nested subcategories will be removed.`)) {
      const updated = deletePlatformCategory(slug);
      setCategories(updated);
      success('Category removed');
    }
  };

  const handleToggleCategory = (slug: string) => {
    const updated = togglePlatformCategoryStatus(slug);
    setCategories(updated);
  };

  // --------------------------------------------------------------------------
  // 2. SUBCATEGORY HANDLERS
  // --------------------------------------------------------------------------
  const allSubcategories = useMemo(() => {
    const list: Array<PlatformSubCategoryItem & { parentCategoryName: string; parentCategorySlug: string }> = [];
    categories.forEach((cat) => {
      (cat.subcategories || []).forEach((sub) => {
        list.push({
          ...sub,
          parentCategoryName: cat.name,
          parentCategorySlug: cat.slug,
        });
      });
    });
    return list;
  }, [categories]);

  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter((sub) => {
      const matchesCat = filterCategorySlug === 'ALL' || sub.parentCategorySlug === filterCategorySlug;
      const matchesSearch =
        searchQuery.trim() === '' ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.parentCategoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allSubcategories, filterCategorySlug, searchQuery]);

  const handleOpenAddSubcategory = (parentSlug?: string) => {
    const pSlug = parentSlug || categories[0]?.slug || '';
    setSubcatParentSlug(pSlug);
    setSubcatForm({ id: '', name: '', slug: '', description: '', isActive: true });
    setSubcatModalOpen(true);
  };

  const handleOpenEditSubcategory = (sub: PlatformSubCategoryItem, parentSlug: string) => {
    setSubcatParentSlug(parentSlug);
    setSubcatForm({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description || '',
      isActive: sub.isActive,
    });
    setSubcatModalOpen(true);
  };

  const handleSaveSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatParentSlug || !subcatForm.name.trim()) {
      error('Please specify subcategory name and select parent category');
      return;
    }
    const cleanSlug = (subcatForm.slug || subcatForm.name).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (subcatForm.id) {
      const updated = updatePlatformSubCategory(subcatParentSlug, {
        id: subcatForm.id,
        name: subcatForm.name.trim(),
        slug: cleanSlug,
        description: subcatForm.description.trim(),
        isActive: subcatForm.isActive,
      });
      setCategories(updated);
      success('Subcategory updated');
    } else {
      const updated = addPlatformSubCategory(subcatParentSlug, {
        name: subcatForm.name.trim(),
        slug: cleanSlug,
        description: subcatForm.description.trim(),
        isActive: subcatForm.isActive,
      });
      setCategories(updated);
      success('Subcategory added');
    }
    setSubcatModalOpen(false);
  };

  const handleDeleteSubcategory = (catSlug: string, subId: string, name: string) => {
    if (window.confirm(`Delete subcategory "${name}"?`)) {
      const updated = deletePlatformSubCategory(catSlug, subId);
      setCategories(updated);
      success('Subcategory removed');
    }
  };

  const handleToggleSubcategory = (catSlug: string, subId: string) => {
    const updated = togglePlatformSubCategoryStatus(catSlug, subId);
    setCategories(updated);
  };

  // --------------------------------------------------------------------------
  // 3. SERVICE TYPES HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddServiceType = () => {
    setServiceTypeForm({
      id: `st-${Date.now()}`,
      name: '',
      code: '',
      categorySlug: categories[0]?.slug || 'planning-design',
      deliveryMode: 'DIGITAL',
      turnaroundSlaDays: 7,
      minOrderPaise: 1500000,
      includedDeliverables: ['Architect Consultation', 'CAD Drawings', 'PDF Dossier'],
      description: '',
      isActive: true,
    });
    setServiceTypeModalOpen(true);
  };

  const handleOpenEditServiceType = (item: ServiceTypeItem) => {
    setServiceTypeForm({ ...item });
    setServiceTypeModalOpen(true);
  };

  const handleSaveServiceType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTypeForm.name?.trim() || !serviceTypeForm.code?.trim()) {
      error('Name and code are required');
      return;
    }
    const cleanCode = serviceTypeForm.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existingIndex = serviceTypes.findIndex((st) => st.id === serviceTypeForm.id);
    let updated: ServiceTypeItem[];
    if (existingIndex >= 0) {
      updated = [...serviceTypes];
      updated[existingIndex] = {
        ...(serviceTypeForm as ServiceTypeItem),
        code: cleanCode,
      };
      success('Service Type updated');
    } else {
      updated = [
        ...serviceTypes,
        {
          id: serviceTypeForm.id || `st-${Date.now()}`,
          name: serviceTypeForm.name.trim(),
          code: cleanCode,
          categorySlug: serviceTypeForm.categorySlug || 'planning-design',
          deliveryMode: serviceTypeForm.deliveryMode || 'DIGITAL',
          turnaroundSlaDays: Number(serviceTypeForm.turnaroundSlaDays) || 7,
          minOrderPaise: Number(serviceTypeForm.minOrderPaise) || 1000000,
          includedDeliverables: serviceTypeForm.includedDeliverables || [],
          description: serviceTypeForm.description || '',
          isActive: serviceTypeForm.isActive ?? true,
        },
      ];
      success('New Service Type created');
    }
    savePlatformServiceTypes(updated);
    setServiceTypes(updated);
    setServiceTypeModalOpen(false);
  };

  const handleToggleServiceType = (id: string) => {
    const updated = serviceTypes.map((st) => (st.id === id ? { ...st, isActive: !st.isActive } : st));
    savePlatformServiceTypes(updated);
    setServiceTypes(updated);
  };

  const handleDeleteServiceType = (id: string, name: string) => {
    if (window.confirm(`Delete service type "${name}"?`)) {
      const updated = serviceTypes.filter((st) => st.id !== id);
      savePlatformServiceTypes(updated);
      setServiceTypes(updated);
      success('Service type deleted');
    }
  };

  // --------------------------------------------------------------------------
  // 4. PROJECT TYPES HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddProjectType = () => {
    setProjectTypeForm({
      id: `pt-${Date.now()}`,
      name: '',
      code: '',
      group: 'RESIDENTIAL',
      typicalAreaRange: '1,000 – 4,000 sq.ft',
      bylawsCompliance: 'Municipal Bylaws & NBC 2016',
      complexityScore: 3,
      recommendedServiceCode: 'REMOTE_CAD_BIM',
      isActive: true,
    });
    setProjectTypeModalOpen(true);
  };

  const handleOpenEditProjectType = (item: ProjectTypeItem) => {
    setProjectTypeForm({ ...item });
    setProjectTypeModalOpen(true);
  };

  const handleSaveProjectType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTypeForm.name?.trim() || !projectTypeForm.code?.trim()) {
      error('Name and code are required');
      return;
    }
    const cleanCode = projectTypeForm.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existingIndex = projectTypes.findIndex((pt) => pt.id === projectTypeForm.id);
    let updated: ProjectTypeItem[];
    if (existingIndex >= 0) {
      updated = [...projectTypes];
      updated[existingIndex] = {
        ...(projectTypeForm as ProjectTypeItem),
        code: cleanCode,
      };
      success('Project type updated');
    } else {
      updated = [
        ...projectTypes,
        {
          id: projectTypeForm.id || `pt-${Date.now()}`,
          name: projectTypeForm.name.trim(),
          code: cleanCode,
          group: projectTypeForm.group || 'RESIDENTIAL',
          typicalAreaRange: projectTypeForm.typicalAreaRange || '1,500 – 5,000 sq.ft',
          bylawsCompliance: projectTypeForm.bylawsCompliance || 'NBC 2016 Norms',
          complexityScore: Number(projectTypeForm.complexityScore) || 3,
          recommendedServiceCode: projectTypeForm.recommendedServiceCode || 'REMOTE_CAD_BIM',
          isActive: projectTypeForm.isActive ?? true,
        },
      ];
      success('Project type created');
    }
    savePlatformProjectTypes(updated);
    setProjectTypes(updated);
    setProjectTypeModalOpen(false);
  };

  const handleToggleProjectType = (id: string) => {
    const updated = projectTypes.map((pt) => (pt.id === id ? { ...pt, isActive: !pt.isActive } : pt));
    savePlatformProjectTypes(updated);
    setProjectTypes(updated);
  };

  const handleDeleteProjectType = (id: string, name: string) => {
    if (window.confirm(`Delete project type "${name}"?`)) {
      const updated = projectTypes.filter((pt) => pt.id !== id);
      savePlatformProjectTypes(updated);
      setProjectTypes(updated);
      success('Project type deleted');
    }
  };

  // --------------------------------------------------------------------------
  // 5. PRICING CONFIGURATION HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddPricing = () => {
    setPricingForm({
      id: `pr-${Date.now()}`,
      serviceCategory: categories[0]?.name || 'Architectural Planning',
      projectTypeCode: 'ALL_TYPES',
      pricingModel: 'PER_SQFT',
      baseRateRupees: 15,
      rateUnitLabel: '₹/sq.ft built-up area',
      minAreaSqFt: 1000,
      minOrderAmountRupees: 15000,
      taxInclusive: false,
      gstRatePercent: 18,
      discountEligible: true,
      isActive: true,
    });
    setPricingModalOpen(true);
  };

  const handleOpenEditPricing = (item: PricingConfigItem) => {
    setPricingForm({ ...item });
    setPricingModalOpen(true);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingForm.serviceCategory?.trim()) {
      error('Service category is required');
      return;
    }
    const existingIndex = pricingConfigs.findIndex((pr) => pr.id === pricingForm.id);
    let updated: PricingConfigItem[];
    if (existingIndex >= 0) {
      updated = [...pricingConfigs];
      updated[existingIndex] = pricingForm as PricingConfigItem;
      success('Pricing rule updated');
    } else {
      updated = [
        ...pricingConfigs,
        {
          id: pricingForm.id || `pr-${Date.now()}`,
          serviceCategory: pricingForm.serviceCategory.trim(),
          projectTypeCode: pricingForm.projectTypeCode || 'ALL_TYPES',
          pricingModel: pricingForm.pricingModel || 'PER_SQFT',
          baseRateRupees: Number(pricingForm.baseRateRupees) || 12,
          rateUnitLabel: pricingForm.rateUnitLabel || '₹/sq.ft',
          minAreaSqFt: Number(pricingForm.minAreaSqFt) || 0,
          minOrderAmountRupees: Number(pricingForm.minOrderAmountRupees) || 10000,
          taxInclusive: pricingForm.taxInclusive ?? false,
          gstRatePercent: Number(pricingForm.gstRatePercent) || 18,
          discountEligible: pricingForm.discountEligible ?? true,
          isActive: pricingForm.isActive ?? true,
        },
      ];
      success('New pricing rule added');
    }
    savePlatformPricingConfigs(updated);
    setPricingConfigs(updated);
    setPricingModalOpen(false);
  };

  const handleTogglePricing = (id: string) => {
    const updated = pricingConfigs.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    savePlatformPricingConfigs(updated);
    setPricingConfigs(updated);
  };

  const handleDeletePricing = (id: string) => {
    if (window.confirm('Delete this pricing rule?')) {
      const updated = pricingConfigs.filter((p) => p.id !== id);
      savePlatformPricingConfigs(updated);
      setPricingConfigs(updated);
      success('Pricing rule removed');
    }
  };

  // Calculator estimate
  const currentCalcItem = useMemo(() => {
    return pricingConfigs.find((p) => p.id === calcRateItem) || pricingConfigs[0];
  }, [pricingConfigs, calcRateItem]);

  const estimatedCalcCost = useMemo(() => {
    if (!currentCalcItem) return { subtotal: 0, gst: 0, total: 0 };
    let subtotal = 0;
    if (currentCalcItem.pricingModel === 'PER_SQFT') {
      const effectiveArea = Math.max(calcArea, currentCalcItem.minAreaSqFt);
      subtotal = effectiveArea * currentCalcItem.baseRateRupees;
      if (subtotal < currentCalcItem.minOrderAmountRupees) {
        subtotal = currentCalcItem.minOrderAmountRupees;
      }
    } else {
      subtotal = currentCalcItem.baseRateRupees;
    }
    const gst = currentCalcItem.taxInclusive ? 0 : Math.round((subtotal * currentCalcItem.gstRatePercent) / 100);
    return { subtotal, gst, total: subtotal + gst };
  }, [currentCalcItem, calcArea]);

  // --------------------------------------------------------------------------
  // 6. QUOTATION FEE HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveQuotationFee = (e: React.FormEvent) => {
    e.preventDefault();
    savePlatformQuotationFeeConfig(quotationFee);
    success('Quotation request fee configuration saved!');
  };

  // --------------------------------------------------------------------------
  // 7. COMMISSION CONFIG HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveCommissionConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePlatformCommissionConfig(commissionConfig);
    success('Platform commission schedules and tax settings updated!');
  };

  // Commission payout calculator calculation
  const commBreakdown = useMemo(() => {
    const amount = commCalcAmount;
    const archComm = Math.round((amount * commissionConfig.architectCommissionPercent) / 100);
    const pgSurcharge = Math.round((amount * commissionConfig.paymentGatewaySurchargePercent) / 100);
    const tds = Math.round((amount * commissionConfig.tdsDeductionPercent) / 100);
    const netPayout = amount - archComm - tds;
    return { archComm, pgSurcharge, tds, netPayout };
  }, [commCalcAmount, commissionConfig]);

  // --------------------------------------------------------------------------
  // 8. MILESTONE TEMPLATES HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleTemplate = (id: string) => {
    const updated = milestoneTemplates.map((mt) => (mt.id === id ? { ...mt, isActive: !mt.isActive } : mt));
    savePlatformMilestoneTemplates(updated);
    setMilestoneTemplates(updated);
  };

  // --------------------------------------------------------------------------
  // 9. PROJECT STATUS SETTINGS HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleStatusApproval = (code: string) => {
    const updated = projectStatuses.map((st) =>
      st.code === code ? { ...st, requiresAdminApproval: !st.requiresAdminApproval } : st
    );
    savePlatformProjectStatusSettings(updated);
    setProjectStatuses(updated);
    success(`Updated admin approval requirement for status "${code}"`);
  };

  const handleUpdateStatusSla = (code: string, newDays: number) => {
    const updated = projectStatuses.map((st) => (st.code === code ? { ...st, slaMaxDays: newDays } : st));
    savePlatformProjectStatusSettings(updated);
    setProjectStatuses(updated);
  };

  // --------------------------------------------------------------------------
  // RESTORE ALL DEFAULTS
  // --------------------------------------------------------------------------
  const handleRestoreAll = () => {
    if (window.confirm('Restore all Service & Configuration settings to factory defaults?')) {
      restoreAllServiceConfigDefaults();
      setServiceTypes(getPlatformServiceTypes());
      setProjectTypes(getPlatformProjectTypes());
      setPricingConfigs(getPlatformPricingConfigs());
      setQuotationFee(getPlatformQuotationFeeConfig());
      setCommissionConfig(getPlatformCommissionConfig());
      setMilestoneTemplates(getPlatformMilestoneTemplates());
      setProjectStatuses(getPlatformProjectStatusSettings());
      success('All configurations restored to default settings');
    }
  };

  // Quick Metrics for Header Banner
  const activeMeta = VIEW_TABS.find((t) => t.key === activeView) || VIEW_TABS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & VIEW SWITCHER DROPDOWN                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-950">18. Service & Configuration Management</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Core Config Desk
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure service categories, subcategories, delivery types, project bylaws, pricing matrix, quotation fees, commission splits, and milestone templates
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Selector Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={activeView}
                onChange={(e) => setView(e.target.value as ServiceConfigView)}
                className="w-full sm:w-72 pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {VIEW_TABS.map((tab, idx) => (
                  <option key={tab.key} value={tab.key}>
                    {idx + 1}. {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contextual Add Buttons */}
            {activeView === 'SERVICE_CATEGORIES' && (
              <button
                onClick={handleOpenAddCategory}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            )}

            {activeView === 'SUBCATEGORIES' && (
              <button
                onClick={() => handleOpenAddSubcategory()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subcategory</span>
              </button>
            )}

            {activeView === 'SERVICE_TYPES' && (
              <button
                onClick={handleOpenAddServiceType}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service Type</span>
              </button>
            )}

            {activeView === 'PROJECT_TYPES' && (
              <button
                onClick={handleOpenAddProjectType}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project Type</span>
              </button>
            )}

            {activeView === 'PRICING_CONFIGURATION' && (
              <button
                onClick={handleOpenAddPricing}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rate Rule</span>
              </button>
            )}

            {/* Restore Factory Defaults */}
            <button
              onClick={handleRestoreAll}
              title="Reset all settings to factory default"
              className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HORIZONTAL PILL NAV BAR (ALL 9 VIEWS)                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          {VIEW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeView === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-950'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CONTEXTUAL FEATURE HEADER BANNER                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-navy-950 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-navy-950 uppercase tracking-wider">
                Active View
              </span>
              <h2 className="text-base font-bold text-white">{activeMeta.label}</h2>
            </div>
            <p className="text-xs text-blue-200 max-w-2xl">{activeMeta.shortDesc}</p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-amber-300">{categories.length}</div>
              <div className="text-[10px] text-blue-200 uppercase">Categories</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-emerald-300">{allSubcategories.length}</div>
              <div className="text-[10px] text-blue-200 uppercase">Subcategories</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-sky-300">{serviceTypes.length}</div>
              <div className="text-[10px] text-blue-200 uppercase">Service Modes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-purple-300">{projectTypes.length}</div>
              <div className="text-[10px] text-blue-200 uppercase">Project Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: SERVICE CATEGORIES                                           */}
      {/* ==================================================================== */}
      {activeView === 'SERVICE_CATEGORIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Master Service Categories ({categories.length})</h3>
                <p className="text-xs text-slate-500">
                  High-level architectural, civil, interior and renovation divisions presented to customers
                </p>
              </div>
              <button
                onClick={handleOpenAddCategory}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const iconObj = ICON_OPTIONS.find((i) => i.name === cat.icon) || ICON_OPTIONS[0];
                const CatIcon = iconObj.component;
                const subCount = cat.subcategories?.length || 0;

                return (
                  <div
                    key={cat.slug}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      cat.isActive
                        ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <CatIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-navy-950">{cat.name}</h4>
                            <span className="font-mono text-[10px] text-slate-400">/{cat.slug}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{cat.shortDescription}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {subCount} {subCount === 1 ? 'Subcategory' : 'Subcategories'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleCategory(cat.slug)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            cat.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {cat.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.slug, cat.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: SUBCATEGORIES                                                */}
      {/* ==================================================================== */}
      {activeView === 'SUBCATEGORIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Subcategories ({allSubcategories.length})</h3>
                <p className="text-xs text-slate-500">
                  Granular architectural drawing deliverables, interior scopes and engineering packages
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterCategorySlug}
                  onChange={(e) => setFilterCategorySlug(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search subcategory..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => handleOpenAddSubcategory(filterCategorySlug !== 'ALL' ? filterCategorySlug : undefined)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subcategory</span>
                </button>
              </div>
            </div>

            {/* Subcategories Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Subcategory Name & Scope</th>
                    <th className="py-2.5 px-4">Parent Category</th>
                    <th className="py-2.5 px-4">Slug Code</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubcategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No subcategories found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSubcategories.map((sub) => (
                      <tr key={sub.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-navy-950">{sub.name}</div>
                          <div className="text-[11px] text-slate-500 max-w-md">{sub.description || 'Standard architectural deliverable'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {sub.parentCategoryName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{sub.slug}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {sub.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleSubcategory(sub.parentCategorySlug, sub.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                sub.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              }`}
                            >
                              {sub.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleOpenEditSubcategory(sub, sub.parentCategorySlug)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(sub.parentCategorySlug, sub.id, sub.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: SERVICE TYPES                                                */}
      {/* ==================================================================== */}
      {activeView === 'SERVICE_TYPES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Service Delivery Modes & Types ({serviceTypes.length})</h3>
                <p className="text-xs text-slate-500">
                  Defines remote digital consultations, on-site surveys, hybrid supervision, and turnkey civil execution
                </p>
              </div>
              <button
                onClick={handleOpenAddServiceType}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((st) => (
                <div
                  key={st.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    st.isActive ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-slate-50 opacity-65 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-navy-950">{st.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              st.deliveryMode === 'DIGITAL'
                                ? 'bg-sky-100 text-sky-800'
                                : st.deliveryMode === 'PHYSICAL_VISIT'
                                ? 'bg-purple-100 text-purple-800'
                                : st.deliveryMode === 'HYBRID'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {st.deliveryMode.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">Code: {st.code}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{st.description}</p>

                    {/* Deliverables tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {st.includedDeliverables.map((del, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                          ✓ {del}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>
                        SLA: <strong className="text-navy-950">{st.turnaroundSlaDays} Days</strong>
                      </span>
                      <span>
                        Min Order: <strong className="text-navy-950">₹{(st.minOrderPaise / 100).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleServiceType(st.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          st.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {st.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleOpenEditServiceType(st)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteServiceType(st.id, st.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: PROJECT TYPES                                                */}
      {/* ==================================================================== */}
      {activeView === 'PROJECT_TYPES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Real Estate & Project Types ({projectTypes.length})</h3>
                <p className="text-xs text-slate-500">
                  Residential, commercial, industrial and renovation typologies with applicable building bylaws and complexity scores
                </p>
              </div>
              <button
                onClick={handleOpenAddProjectType}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectTypes.map((pt) => (
                <div
                  key={pt.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    pt.isActive ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-slate-50 opacity-60 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            pt.group === 'RESIDENTIAL'
                              ? 'bg-blue-100 text-blue-800'
                              : pt.group === 'COMMERCIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : pt.group === 'INDUSTRIAL'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pt.group}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">/{pt.code}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pt.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pt.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-navy-950">{pt.name}</h4>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div>
                        Typical Area: <strong className="text-slate-800">{pt.typicalAreaRange}</strong>
                      </div>
                      <div>
                        Compliance: <span className="text-slate-700">{pt.bylawsCompliance}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Complexity:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`w-2 h-2 rounded-full ${
                                star <= pt.complexityScore ? 'bg-amber-400' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">({pt.complexityScore}/5)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleProjectType(pt.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        pt.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {pt.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditProjectType(pt)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectType(pt.id, pt.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: PRICING CONFIGURATION MATRIX                                 */}
      {/* ==================================================================== */}
      {activeView === 'PRICING_CONFIGURATION' && (
        <div className="space-y-5">
          {/* Quick Rate Estimator Calculator Tool */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Live Pricing & Rate Card Simulator
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Service Rate Item</label>
                <select
                  value={calcRateItem}
                  onChange={(e) => setCalcRateItem(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pricingConfigs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.serviceCategory} ({p.rateUnitLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Built-up / Carpet Area (sq.ft)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={calcArea}
                  onChange={(e) => setCalcArea(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Client Cost</div>
                  <div className="text-base font-extrabold text-blue-700">
                    ₹{estimatedCalcCost.total.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>Base: ₹{estimatedCalcCost.subtotal.toLocaleString('en-IN')}</div>
                  <div>GST 18%: +₹{estimatedCalcCost.gst.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Platform Pricing Matrix ({pricingConfigs.length})</h3>
                <p className="text-xs text-slate-500">Base pricing schedules, unit measures, and minimum billing thresholds</p>
              </div>
              <button
                onClick={handleOpenAddPricing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rate Rule</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Service Category & Scope</th>
                    <th className="py-2.5 px-4">Model</th>
                    <th className="py-2.5 px-4">Base Rate</th>
                    <th className="py-2.5 px-4">Minimum Order</th>
                    <th className="py-2.5 px-4">GST Terms</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pricingConfigs.map((pr) => (
                    <tr key={pr.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy-950">{pr.serviceCategory}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Target: {pr.projectTypeCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {pr.pricingModel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        ₹{pr.baseRateRupees.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">/ {pr.rateUnitLabel}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        ₹{pr.minOrderAmountRupees.toLocaleString('en-IN')}
                        {pr.minAreaSqFt > 0 && <span className="text-[10px] text-slate-400 block">Min {pr.minAreaSqFt} sq.ft</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pr.taxInclusive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pr.taxInclusive ? 'GST Included' : `+${pr.gstRatePercent}% GST`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pr.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pr.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTogglePricing(pr.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              pr.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {pr.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleOpenEditPricing(pr)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePricing(pr.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 6: QUOTATION REQUEST FEE                                        */}
      {/* ==================================================================== */}
      {activeView === 'QUOTATION_FEE' && (
        <form onSubmit={handleSaveQuotationFee} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Quotation Token Deposit & Booking Rules</h3>
              <p className="text-xs text-slate-500">
                Configure commitment token fee charged to customers to prevent spam quotation requests and ensure high-intent customer leads for architects
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fee switch */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">Require Quotation Token Deposit</h4>
                  <p className="text-[11px] text-slate-500">When enabled, customers pay a token fee to submit a quotation request</p>
                </div>
                <input
                  type="checkbox"
                  checked={quotationFee.feeEnabled}
                  onChange={(e) => setQuotationFee({ ...quotationFee, feeEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Fee amount */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-navy-950">Token Fee Amount (₹ INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={quotationFee.tokenFeeRupees}
                    onChange={(e) => setQuotationFee({ ...quotationFee, tokenFeeRupees: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Standard market benchmark is ₹499 or ₹999 refundable against final project invoice</p>
              </div>

              {/* 100% Refundable on booking */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">100% Escrow Credit on Project Booking</h4>
                  <p className="text-[11px] text-slate-500">Automatically deduct token fee from Milestone 1 invoice upon project kickoff</p>
                </div>
                <input
                  type="checkbox"
                  checked={quotationFee.refundOnProjectBooking}
                  onChange={(e) => setQuotationFee({ ...quotationFee, refundOnProjectBooking: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Auto refund if unassigned */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-navy-950">Auto-Refund Timer if Unassigned (Hours)</label>
                <input
                  type="number"
                  min={12}
                  max={168}
                  value={quotationFee.autoRefundIfUnassignedHours}
                  onChange={(e) => setQuotationFee({ ...quotationFee, autoRefundIfUnassignedHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400">If no architect is assigned within this window, refund initiates automatically</p>
              </div>

              {/* Free first time */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">Free 1st Quotation for New Users</h4>
                  <p className="text-[11px] text-slate-500">First-time registered home owners get 1 free quotation request without token fee</p>
                </div>
                <input
                  type="checkbox"
                  checked={quotationFee.freeFirstTimeQuotation}
                  onChange={(e) => setQuotationFee({ ...quotationFee, freeFirstTimeQuotation: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Exemption threshold */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-navy-950">Large Project Exemption Threshold (sq.ft)</label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={quotationFee.exemptionThresholdAreaSqFt}
                  onChange={(e) => setQuotationFee({ ...quotationFee, exemptionThresholdAreaSqFt: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400">High-value projects over this area qualify for VIP free architectural consultation</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Quotation Fee Configuration</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* VIEW 7: COMMISSION SETTINGS                                          */}
      {/* ==================================================================== */}
      {activeView === 'COMMISSION_SETTINGS' && (
        <form onSubmit={handleSaveCommissionConfig} className="space-y-5">
          {/* Commission Simulator */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Live Commission & Payout Calculator
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Simulated Project Milestone (₹)</label>
                <input
                  type="number"
                  min={10000}
                  step={25000}
                  value={commCalcAmount}
                  onChange={(e) => setCommCalcAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-200">
                <div className="text-[10px] text-slate-500 uppercase">Platform Cut ({commissionConfig.architectCommissionPercent}%)</div>
                <div className="text-sm font-bold text-blue-700">₹{commBreakdown.archComm.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-200">
                <div className="text-[10px] text-slate-500 uppercase">TDS 194-O ({commissionConfig.tdsDeductionPercent}%)</div>
                <div className="text-sm font-bold text-slate-700">₹{commBreakdown.tds.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-300 bg-emerald-50/40">
                <div className="text-[10px] text-emerald-800 uppercase font-semibold">Net Professional Payout</div>
                <div className="text-sm font-extrabold text-emerald-700">₹{commBreakdown.netPayout.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Platform Stakeholder Commission Rates</h3>
              <p className="text-xs text-slate-500">
                Percentage deducted on project milestone payouts for each partner ecosystem role
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Architect Commission */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy-950">Architect Base Commission (%)</label>
                  <span className="font-extrabold text-blue-600 text-xs">{commissionConfig.architectCommissionPercent}%</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={0.5}
                  value={commissionConfig.architectCommissionPercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, architectCommissionPercent: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Standard COA registered architect platform retention percentage</p>
              </div>

              {/* Interior Designer Commission */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy-950">Interior Designer Commission (%)</label>
                  <span className="font-extrabold text-purple-600 text-xs">{commissionConfig.interiorDesignerCommissionPercent}%</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={0.5}
                  value={commissionConfig.interiorDesignerCommissionPercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, interiorDesignerCommissionPercent: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Platform commission on interior modular design & styling contracts</p>
              </div>

              {/* Civil Contractor Commission */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy-950">Turnkey Civil Contractor Commission (%)</label>
                  <span className="font-extrabold text-amber-600 text-xs">{commissionConfig.contractorCommissionPercent}%</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.5}
                  value={commissionConfig.contractorCommissionPercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, contractorCommissionPercent: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Construction contractor payout commission rate</p>
              </div>

              {/* Vendor Depot Margin */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-navy-950">Material Depot Marketplace Margin (%)</label>
                  <span className="font-extrabold text-emerald-600 text-xs">{commissionConfig.vendorMarketplaceMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={commissionConfig.vendorMarketplaceMarginPercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, vendorMarketplaceMarginPercent: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Civil material store orders commission margin (cement, steel, tiles)</p>
              </div>

              {/* Payment Gateway Surcharge */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-navy-950">Payment Gateway Surcharge (%)</label>
                <input
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={commissionConfig.paymentGatewaySurchargePercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, paymentGatewaySurchargePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400">Razorpay / Cashfree escrow collection transaction fee</p>
              </div>

              {/* TDS Deduction */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-navy-950">Statutory TDS Rate u/s 194-O (%)</label>
                <input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={commissionConfig.tdsDeductionPercent}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, tdsDeductionPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400">Indian Income Tax deduction on e-commerce operators for architect payouts</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Commission Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* VIEW 8: MILESTONE TEMPLATES                                          */}
      {/* ==================================================================== */}
      {activeView === 'MILESTONE_TEMPLATES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Project Milestone Workflows & Templates ({milestoneTemplates.length})</h3>
                <p className="text-xs text-slate-500">
                  Pre-configured payment & deliverables stages ensuring escrow protection and mandatory physical inspections
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {milestoneTemplates.map((tpl) => {
                const totalPercent = tpl.stages.reduce((acc, s) => acc + s.percentage, 0);

                return (
                  <div key={tpl.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-navy-950">{tpl.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              totalPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Total Split: {totalPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Applies to: <strong>{tpl.targetProjectType}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTemplate(tpl.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            tpl.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tpl.isActive ? 'Active Template' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Milestone Stages Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {tpl.stages.map((st) => (
                        <div key={st.stepNumber} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {st.stepNumber}
                            </span>
                            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {st.percentage}% Payout
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-navy-950 line-clamp-1">{st.title}</h5>

                          <div className="text-[10px] text-slate-500">
                            SLA: <strong>{st.slaDays} Days</strong>
                          </div>

                          <div className="space-y-1 pt-1 border-t border-slate-200/60">
                            <div className="text-[9px] font-semibold text-slate-400 uppercase">Required Deliverables:</div>
                            {st.deliverablesRequired.map((d, i) => (
                              <div key={i} className="text-[10px] text-slate-600 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span className="truncate">{d}</span>
                              </div>
                            ))}
                          </div>

                          {st.physicalInspectionRequired && (
                            <div className="pt-1">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                On-Site Inspection Mandatory
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 9: PROJECT STATUS SETTINGS                                      */}
      {/* ==================================================================== */}
      {activeView === 'PROJECT_STATUS_SETTINGS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Project Lifecycle State Machine ({projectStatuses.length})</h3>
                <p className="text-xs text-slate-500">
                  Configure status transition rules, customer descriptions, SLA breach warnings, and required admin approvals
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {projectStatuses.map((st) => (
                <div key={st.code} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${st.badgeBg} ${st.badgeText}`}>
                        {st.code}
                      </span>
                      <h4 className="text-xs font-bold text-navy-950">{st.label}</h4>
                      {st.isTerminal && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600">
                          Terminal State
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{st.customerFacingDescription}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span>Allowed Next Transitions:</span>
                      {st.allowedNextStates.length === 0 ? (
                        <span className="font-semibold text-slate-400">None (End of lifecycle)</span>
                      ) : (
                        st.allowedNextStates.map((next) => (
                          <span key={next} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                            → {next}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* SLA input */}
                    {st.slaMaxDays > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Max SLA Alert</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={st.slaMaxDays}
                            onChange={(e) => handleUpdateStatusSla(st.code, Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-navy-950 text-center"
                          />
                          <span className="text-xs text-slate-500">days</span>
                        </div>
                      </div>
                    )}

                    {/* Admin Approval Switch */}
                    <button
                      onClick={() => handleToggleStatusApproval(st.code)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        st.requiresAdminApproval
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{st.requiresAdminApproval ? 'Admin Sign-off Required' : 'Auto Transition'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ADD/EDIT CATEGORY                                           */}
      {/* ==================================================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">
                {editingCategorySlug ? 'Edit Service Category' : 'Add New Service Category'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setCatForm({ ...catForm, name, slug: editingCategorySlug ? catForm.slug : slug });
                  }}
                  placeholder="e.g., House Map / Floor Plan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="e.g., house-map-planning"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={3}
                  value={catForm.shortDescription}
                  onChange={(e) => setCatForm({ ...catForm, shortDescription: e.target.value })}
                  placeholder="Brief description of architectural deliverables included..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Icon Style</label>
                <select
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  {ICON_OPTIONS.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catIsActive"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="catIsActive" className="font-semibold text-slate-700">
                  Category is Active and Visible to Customers
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD/EDIT SUBCATEGORY                                        */}
      {/* ==================================================================== */}
      {subcatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">
                {subcatForm.id ? 'Edit Subcategory' : 'Add New Subcategory'}
              </h3>
              <button onClick={() => setSubcatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category</label>
                <select
                  disabled={Boolean(subcatForm.id)}
                  value={subcatParentSlug}
                  onChange={(e) => setSubcatParentSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold disabled:opacity-50"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategory Name</label>
                <input
                  type="text"
                  required
                  value={subcatForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setSubcatForm({ ...subcatForm, name, slug: subcatForm.id ? subcatForm.slug : slug });
                  }}
                  placeholder="e.g., 2D Floor Plan & Municipal Blueprints"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={subcatForm.slug}
                  onChange={(e) => setSubcatForm({ ...subcatForm, slug: e.target.value })}
                  placeholder="e.g., 2d-floor-plan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverables & Scope Description</label>
                <textarea
                  rows={3}
                  value={subcatForm.description}
                  onChange={(e) => setSubcatForm({ ...subcatForm, description: e.target.value })}
                  placeholder="Specific drawings and specifications included..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="subIsActive"
                  checked={subcatForm.isActive}
                  onChange={(e) => setSubcatForm({ ...subcatForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="subIsActive" className="font-semibold text-slate-700">
                  Subcategory is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubcatModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: ADD/EDIT SERVICE TYPE                                       */}
      {/* ==================================================================== */}
      {serviceTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">
                {serviceTypeForm.name ? 'Edit Service Delivery Type' : 'Add New Service Delivery Type'}
              </h3>
              <button onClick={() => setServiceTypeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceType} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Type Name</label>
                  <input
                    type="text"
                    required
                    value={serviceTypeForm.name || ''}
                    onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, name: e.target.value })}
                    placeholder="e.g. 100% Remote CAD & BIM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Code</label>
                  <input
                    type="text"
                    required
                    value={serviceTypeForm.code || ''}
                    onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. REMOTE_CAD_BIM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Mode</label>
                  <select
                    value={serviceTypeForm.deliveryMode || 'DIGITAL'}
                    onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, deliveryMode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="DIGITAL">DIGITAL (100% Online)</option>
                    <option value="PHYSICAL_VISIT">PHYSICAL VISIT (On-site)</option>
                    <option value="HYBRID">HYBRID (Digital + Visits)</option>
                    <option value="TURNKEY">TURNKEY (Design + Build)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turnaround SLA (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={serviceTypeForm.turnaroundSlaDays || 5}
                    onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, turnaroundSlaDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Order Amount (₹ INR)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={((serviceTypeForm.minOrderPaise || 0) / 100)}
                  onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, minOrderPaise: Number(e.target.value) * 100 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceTypeForm.description || ''}
                  onChange={(e) => setServiceTypeForm({ ...serviceTypeForm, description: e.target.value })}
                  placeholder="Explain how this service is delivered to client..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceTypeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Service Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: ADD/EDIT PRICING RULE                                       */}
      {/* ==================================================================== */}
      {pricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950">
                {pricingForm.id ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
              </h3>
              <button onClick={() => setPricingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Category</label>
                <input
                  type="text"
                  required
                  value={pricingForm.serviceCategory || ''}
                  onChange={(e) => setPricingForm({ ...pricingForm, serviceCategory: e.target.value })}
                  placeholder="e.g. Architectural Planning & 2D Maps"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pricing Model</label>
                  <select
                    value={pricingForm.pricingModel || 'PER_SQFT'}
                    onChange={(e) => setPricingForm({ ...pricingForm, pricingModel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="PER_SQFT">Per Sq.Ft</option>
                    <option value="FIXED_PACKAGE">Fixed Package</option>
                    <option value="CUSTOM_QUOTE">Custom Quote</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pricingForm.baseRateRupees || 12}
                    onChange={(e) => setPricingForm({ ...pricingForm, baseRateRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Area (sq.ft)</label>
                  <input
                    type="number"
                    min={0}
                    value={pricingForm.minAreaSqFt || 0}
                    onChange={(e) => setPricingForm({ ...pricingForm, minAreaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={pricingForm.minOrderAmountRupees || 10000}
                    onChange={(e) => setPricingForm({ ...pricingForm, minOrderAmountRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxInc"
                  checked={pricingForm.taxInclusive}
                  onChange={(e) => setPricingForm({ ...pricingForm, taxInclusive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="taxInc" className="font-semibold text-slate-700">
                  Rate is Tax Inclusive (GST Included)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPricingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Rate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
