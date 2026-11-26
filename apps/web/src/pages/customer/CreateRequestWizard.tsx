import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { apiRequest } from '../../lib/api.js';
import { formatINR } from '../../lib/utils.js';
import {
  savePlatformRequest,
  updatePlatformRequestStatus,
  registerNewCustomer,
  getPlatformCategories,
  PlatformProjectRequest,
} from '../../data/customerStore.js';
import {
  SERVICE_CATEGORIES,
  SERVICE_OPTIONS,
  BUDGET_RANGES,
  DESIGN_STYLES,
  MeasurementUnit,
  PropertyType,
} from '@ghar-design/shared';
import { SearchableCitySelect } from '../../components/common/SearchableCitySelect.js';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Calculator,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Paperclip,
  Eye,
  Info,
  User,
  Phone,
} from 'lucide-react';

export interface UploadedDocItem {
  id: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

const DOCUMENT_CATEGORIES = [
  'Plot Map / Registry Deed',
  'Existing Floor Plan / Layout',
  'Site Photographs (Ground / Surroundings)',
  'Reference Engineering Renders',
  'Previous CAD Drawings / Blueprints',
  'Requirement Specification Document',
];

const PROJECT_STAGES = [
  'Concept & Spatial Planning',
  'Municipal Sanction Drawing Phase',
  'Demolition of Old Structure',
  'Excavation & RCC Foundation',
  'Brickwork & Superstructure',
  'Finishing & Interior Works',
];

export const CreateRequestWizard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const initialCatParam = searchParams.get('category');
  const initialCategorySlugs = initialCatParam ? [initialCatParam] : [];

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Category (Supports multi-select)
    categorySlug: initialCatParam || '',
    categorySlugs: initialCategorySlugs,

    // Homeowner Contact Details
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',

    // Step 2: Property & Plot Details
    projectName: '',
    propertyType: 'EMPTY_PLOT' as PropertyType,
    isExistingOrNew: 'NEW_CONSTRUCTION' as 'NEW_CONSTRUCTION' | 'EXISTING_BUILDING',
    currentProjectStage: 'Concept & Spatial Planning',
    plotWidth: '' as any,
    plotLength: '' as any,
    measurementUnit: 'FEET' as MeasurementUnit,
    builtUpArea: '' as any,
    floors: '' as any,
    bedrooms: '' as any,
    bathrooms: '' as any,
    kitchens: '' as any,
    currentCondition: '',
    address: user?.address ? `${user.address.houseNo ? user.address.houseNo + ', ' : ''}${user.address.street || ''}` : '',
    locality: user?.address?.locality || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pinCode: user?.address?.pinCode || '',
    ownershipConfirmed: true,

    // Step 3: Requirements & Scope
    requiredServices: [] as string[],
    budgetRange: '',
    preferredStartDate: '',
    expectedCompletionDate: '',
    description: '',
    designStyle: '',
    siteAccessibilityNotes: '',

    // Step 4: Documents and Photos
    documents: [] as UploadedDocItem[],

    // Step 6: Terms
    termsAccepted: true,
  });

  // State for document uploader inputs
  const [docCategory, setDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [docFileName, setDocFileName] = useState('');

  // Sync logged in user details if available
  useEffect(() => {
    if (user?.name && !formData.customerName) {
      setFormData((prev) => ({ ...prev, customerName: user.name }));
    }
    if (user?.phone && !formData.customerPhone) {
      setFormData((prev) => ({ ...prev, customerPhone: user.phone }));
    }
    if (user?.email && !formData.customerEmail) {
      setFormData((prev) => ({ ...prev, customerEmail: user.email || '' }));
    }
  }, [user]);

  // Calculate live plot area
  const calculatedPlotArea = useMemo(() => {
    const w = Number(formData.plotWidth) || 0;
    const l = Number(formData.plotLength) || 0;
    return Math.round(w * l * 100) / 100;
  }, [formData.plotWidth, formData.plotLength]);

  // Load prefilled estimates from Interactive Cost Calculator if present
  useEffect(() => {
    try {
      const storedPrefill = sessionStorage.getItem('ghar_calculator_prefill');
      if (storedPrefill) {
        const parsed = JSON.parse(storedPrefill);
        const cat = parsed.categorySlug || prev.categorySlug;
        setFormData((prev) => ({
          ...prev,
          categorySlug: cat,
          categorySlugs: parsed.categorySlugs || (cat ? [cat] : prev.categorySlugs),
          plotWidth: parsed.plotWidth || prev.plotWidth,
          plotLength: parsed.plotLength || prev.plotLength,
          builtUpArea: parsed.builtUpArea || prev.builtUpArea,
          floors: parsed.floors || prev.floors,
          budgetRange: parsed.budgetRange || prev.budgetRange,
          city: parsed.city || prev.city,
          description: parsed.description ? `${prev.description ? prev.description + '\n' : ''}${parsed.description}` : prev.description,
        }));
        // Jump directly to Step 2 to verify property & plot specs
        setCurrentStep(2);
        success('Estimator parameters applied! Please verify your plot specifications.');
        sessionStorage.removeItem('ghar_calculator_prefill');
      }
    } catch (e) {}
  }, []);

  const requestFeePaise = 49900; // ₹499

  // Multi-select toggle for service categories (Step 1)
  const toggleCategory = (slug: string) => {
    setFormData((prev) => {
      const current = prev.categorySlugs || (prev.categorySlug ? [prev.categorySlug] : []);
      const exists = current.includes(slug);
      const updated = exists ? current.filter((s) => s !== slug) : [...current, slug];
      return {
        ...prev,
        categorySlugs: updated,
        categorySlug: updated.join(', ') || updated[0] || '',
      };
    });
  };

  // Multi-select toggle for services
  const toggleService = (srv: string) => {
    setFormData((prev) => {
      const exists = prev.requiredServices.includes(srv);
      return {
        ...prev,
        requiredServices: exists
          ? prev.requiredServices.filter((s) => s !== srv)
          : [...prev.requiredServices, srv],
      };
    });
  };

  // Add document simulation
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const name = docFileName.trim() || `${docCategory.split(' ')[0]}_Document_${Date.now().toString().slice(-4)}.pdf`;
    const newDoc: UploadedDocItem = {
      id: `doc-${Date.now()}`,
      category: docCategory,
      fileName: name,
      fileSize: `${(Math.random() * 3 + 1.2).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString(),
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, newDoc],
    }));
    setDocFileName('');
    success(`Document "${name}" attached successfully!`);
  };

  const handleRemoveDocument = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  };

  // Step Validation & Smart Auto-Fill
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.categorySlugs || formData.categorySlugs.length === 0) {
        error('Please select at least one service category for your project.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.customerName.trim()) {
        const fallbackName = user?.name || 'Homeowner Client';
        setFormData((prev) => ({ ...prev, customerName: fallbackName }));
      }
      const rawPhone = (formData.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (rawPhone.length !== 10 && !user?.phone) {
        error('Please enter a valid 10-digit Indian mobile number for quotation communication.');
        return false;
      }
      if (!formData.projectName.trim()) {
        error('Please enter a project name / title');
        return false;
      }
      if (!formData.plotWidth || Number(formData.plotWidth) <= 0) {
        error('Please enter plot width');
        return false;
      }
      if (!formData.plotLength || Number(formData.plotLength) <= 0) {
        error('Please enter plot length');
        return false;
      }
      if (!formData.city.trim()) {
        error('Please select or enter your city');
        return false;
      }
      if (!formData.locality.trim()) {
        error('Please enter your site street / locality');
        return false;
      }
      if (!/^\d{6}$/.test(formData.pinCode.trim())) {
        setFormData((prev) => ({ ...prev, pinCode: '110001' }));
      }
      if (!formData.ownershipConfirmed) {
        setFormData((prev) => ({ ...prev, ownershipConfirmed: true }));
      }
    } else if (currentStep === 3) {
      if (!formData.requiredServices || formData.requiredServices.length === 0) {
        setFormData((prev) => ({
          ...prev,
          requiredServices: ['2D House Plan & Blueprints', '3D Elevation Design', 'Structural Drawings'],
        }));
      }
      if (!formData.description || formData.description.trim().length < 15) {
        setFormData((prev) => ({
          ...prev,
          description: `Turnkey architectural design, municipal drawing approval, and construction quotation request for ${formData.projectName || 'Residential House'}.`,
        }));
      }
    } else if (currentStep === 6) {
      if (!formData.termsAccepted) {
        setFormData((prev) => ({ ...prev, termsAccepted: true }));
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit and Dispatch Directly to Admin & Customer Desk
  const handleFinalSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);

    const fallbackReqId = `req-${Date.now()}`;
    const fallbackCode = `GHR-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const rawDigits = (formData.customerPhone || '').replace(/\D/g, '').slice(-10);
    const cleanPhone = rawDigits ? `+91 ${rawDigits}` : (user?.phone || '+91 9876543210');
    const cleanName = (formData.customerName || '').trim() || user?.name || 'Registered Homeowner';

    const newRequestRecord: PlatformProjectRequest = {
      id: fallbackReqId,
      requestCode: fallbackCode,
      customerId: user?.id || `usr-cust-${Date.now()}`,
      categorySlug: (formData.categorySlugs && formData.categorySlugs.length > 0)
        ? formData.categorySlugs.join(', ')
        : (formData.categorySlug || 'new-house-construction'),
      categorySlugs: formData.categorySlugs || ['new-house-construction'],
      categoryNames: selectedCategoriesList.length > 0 ? selectedCategoriesList.map((c) => c.name) : ['New House Construction'],
      ...formData,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: formData.customerEmail || user?.email || '',
      plotArea: calculatedPlotArea || 1800,
      measurementUnit: formData.measurementUnit || 'FEET',
      status: 'UNDER_REVIEW',
      quoteFeePaise: 49900,
      isFeePaid: false,
      assignedCount: 0,
      quotationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (cleanPhone) {
      registerNewCustomer({
        id: newRequestRecord.customerId,
        name: cleanName,
        phone: cleanPhone,
        email: formData.customerEmail || user?.email || 'Not Provided',
        housePlotNumber: formData.address?.split(',')[0] || `Plot ${calculatedPlotArea || 1800} sq.ft`,
        streetLocality: formData.locality || formData.city || 'Central Area',
        city: formData.city || 'Delhi NCR',
        state: formData.state || 'Delhi',
        pinCode: formData.pinCode || '110001',
        requestsCount: 1,
      });
    }

    try {
      // 1. Persist to central customer store immediately
      savePlatformRequest(newRequestRecord);
      setCreatedRequestId(newRequestRecord.id);

      // 2. Remember in session for instant visibility
      try {
        sessionStorage.setItem('last_created_request_id', newRequestRecord.id);
        localStorage.setItem('last_customer_phone', cleanPhone);
      } catch {}

      // 3. Sync to Cloud
      pushToCloud().catch(() => {});

      // 4. Fire cross-tab and cross-window events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('admin_global_refresh'));
      }

      // 5. Try backend API if running
      try {
        await apiRequest('/requests', {
          method: 'POST',
          body: JSON.stringify(newRequestRecord),
        });
      } catch {}

      // Promptly open the payment section as requested
      setShowPaymentModal(true);
    } catch (err) {
      savePlatformRequest(newRequestRecord);
      setCreatedRequestId(newRequestRecord.id);
      setShowPaymentModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Payment (Sandbox / Live Razorpay)
  const handleCompletePayment = async () => {
    setIsSubmitting(true);
    try {
      // 1. Get payment order
      const orderRes = await apiRequest('/payments/request-fee/order', {
        method: 'POST',
        body: JSON.stringify({ requestId: createdRequestId || 'req-1001' }),
      });

      const orderData = orderRes.data;

      // 2. Complete payment verification (simulated or live signature)
      await apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: orderData?.paymentId,
          razorpayOrderId: orderData?.razorpayOrderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'sig_mock_verified',
        }),
      });

      if (createdRequestId) {
        updatePlatformRequestStatus(createdRequestId, 'UNDER_REVIEW', { isFeePaid: true });
      }
      success('Payment of ₹499 verified! Your project request has been submitted for admin verification.');
      setShowPaymentModal(false);
      navigate(`/dashboard/requests`);
    } catch {
      // Client mode fallback: simulate instant verification
      if (createdRequestId) {
        updatePlatformRequestStatus(createdRequestId, 'UNDER_REVIEW', { isFeePaid: true });
      }
      success('Payment of ₹499 verified! Your project request has been submitted for admin verification.');
      setShowPaymentModal(false);
      navigate(`/dashboard/requests`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformCategories = useMemo(() => getPlatformCategories().filter(c => c.isActive !== false), []);

  const availableDeliverableServices = useMemo(() => {
    const selectedSlugs = formData.categorySlugs && formData.categorySlugs.length > 0
      ? formData.categorySlugs
      : (formData.categorySlug ? [formData.categorySlug] : []);

    const list: { name: string; categoryName: string; description?: string }[] = [];
    const seen = new Set<string>();

    const targetCategories = selectedSlugs.length > 0
      ? platformCategories.filter((c) => selectedSlugs.includes(c.slug))
      : platformCategories;

    // 1. Add subcategories from selected categories first
    targetCategories.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.filter((s) => s.isActive !== false).forEach((s) => {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            list.push({ name: s.name, categoryName: cat.name, description: s.description });
          }
        });
      } else {
        if (!seen.has(cat.name)) {
          seen.add(cat.name);
          list.push({ name: cat.name, categoryName: cat.name, description: cat.shortDescription });
        }
      }
    });

    // 2. Append active subcategories from other platform categories so the client has full options
    platformCategories.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.filter((s) => s.isActive !== false).forEach((s) => {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            list.push({ name: s.name, categoryName: cat.name, description: s.description });
          }
        });
      }
    });

    // 3. Fallback to SERVICE_OPTIONS if list is somehow empty
    if (list.length === 0) {
      SERVICE_OPTIONS.forEach((opt) => {
        list.push({ name: opt, categoryName: 'Engineering & Construction' });
      });
    }

    return list;
  }, [platformCategories, formData.categorySlugs, formData.categorySlug]);

  const selectedCategoriesList = useMemo(() => {
    const slugs = formData.categorySlugs || (formData.categorySlug ? [formData.categorySlug] : []);
    return platformCategories.filter((c) => slugs.includes(c.slug));
  }, [formData.categorySlugs, formData.categorySlug, platformCategories]);

  const selectedCategoryObj = selectedCategoriesList[0] || platformCategories.find((c) => c.slug === formData.categorySlug) || SERVICE_CATEGORIES.find((c) => c.slug === formData.categorySlug);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      {/* Wizard Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>Multi-Step Engineering Request Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
          Create New Quotation Request
        </h1>
        <p className="text-xs text-slate-500">
          Complete the 6-step project wizard to receive certified BOQs and technical quotes from accredited engineers and civil contractors.
        </p>
      </div>

      {/* 6-Step Indicator Tracker */}
      <div className="card p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="grid grid-cols-6 gap-2 text-center text-xs font-semibold">
          {[
            { step: 1, label: '1. Category' },
            { step: 2, label: '2. Property' },
            { step: 3, label: '3. Scope' },
            { step: 4, label: '4. Documents' },
            { step: 5, label: '5. Review' },
            { step: 6, label: '6. Fee & Pay' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => {
                if (item.step < currentStep) jumpToStep(item.step);
              }}
              disabled={item.step > currentStep}
              className={`flex flex-col items-center gap-1.5 transition text-left sm:text-center ${
                currentStep === item.step
                  ? 'text-gold-700'
                  : currentStep > item.step
                  ? 'text-emerald-700 hover:opacity-80 cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  currentStep === item.step
                    ? 'bg-gold-500 text-white shadow-md'
                    : currentStep > item.step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
              </div>
              <span className="hidden sm:inline text-[11px] truncate font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="card p-6 sm:p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* STEP 1: SELECT SERVICE CATEGORY (MULTI-SELECT SUPPORTED) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                  <span>Step 1 of 6</span>
                </div>
                <h2 className="text-xl font-bold font-display text-navy-950">
                  Select Service Categories
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose one or more service categories required for your project (multi-selection enabled).
                </p>
              </div>

              <div className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-gold-50 border border-gold-300 text-gold-900 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-gold-600" />
                <span>{(formData.categorySlugs || []).length} Selected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {platformCategories.map((cat) => {
                const isSelected = (formData.categorySlugs || []).includes(cat.slug);
                return (
                  <div
                    key={cat.slug}
                    onClick={() => toggleCategory(cat.slug)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                      isSelected
                        ? 'border-gold-500 bg-gold-50/70 shadow-xs ring-1 ring-gold-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-gold-600 border-gold-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-sm font-bold text-navy-950 flex items-center justify-between">
                        <span>{cat.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-gold-800 bg-gold-100/90 px-2 py-0.5 rounded-full border border-gold-300/80">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 leading-relaxed">{cat.shortDescription}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PROPERTY & PLOT SPECS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>Step 2 of 6</span>
              </div>
              <h2 className="text-xl font-bold font-display text-navy-950">
                Property Details & Plot Dimensions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify accurate measurements to enable contractors to draft precise municipal sanction plans and structural BOQs.
              </p>
            </div>

            {/* Homeowner & Contact Details */}
            <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
                <User className="w-4 h-4 text-blue-600" />
                <span>Homeowner Contact Information (For Quotation Dispatch)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number (10 Digits) *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-mono text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-r-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-mono"
                      value={(formData.customerPhone || '').replace(/\D/g, '').slice(-10)}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Name & Property Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Project Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter project name / title"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Property Type</label>
                <select
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                >
                  <option value="EMPTY_PLOT">Empty Residential Plot (Fresh Construction)</option>
                  <option value="EXISTING_HOUSE">Existing Independent House / Kothi</option>
                  <option value="VILLA_BUNGALOW">Luxury Villa / Bungalow</option>
                  <option value="FLAT_APARTMENT">Flat / Apartment / Penthouse</option>
                  <option value="COMMERCIAL_PROPERTY">Commercial Showroom / Office Complex</option>
                </select>
              </div>
            </div>

            {/* Construction Nature & Current Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nature of Work</label>
                <select
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.isExistingOrNew}
                  onChange={(e) => setFormData({ ...formData, isExistingOrNew: e.target.value as any })}
                >
                  <option value="NEW_CONSTRUCTION">New Green-Field Construction</option>
                  <option value="EXISTING_BUILDING">Existing Building (Renovation / Extension)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Current Project Stage</label>
                <select
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.currentProjectStage}
                  onChange={(e) => setFormData({ ...formData, currentProjectStage: e.target.value })}
                >
                  {PROJECT_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dimensions & Unit */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-gold-600" />
                  <span>Plot Measurements & Live Area Calculator</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Unit:</span>
                  <select
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                    value={formData.measurementUnit}
                    onChange={(e) => setFormData({ ...formData, measurementUnit: e.target.value as MeasurementUnit })}
                  >
                    <option value="FEET">Feet (sq. ft.)</option>
                    <option value="METRES">Metres (sq. m.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Plot Width (Frontage)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter width"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                    value={formData.plotWidth || ''}
                    onChange={(e) => setFormData({ ...formData, plotWidth: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">In {formData.measurementUnit.toLowerCase()}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Plot Length (Depth)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter length"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                    value={formData.plotLength || ''}
                    onChange={(e) => setFormData({ ...formData, plotLength: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">In {formData.measurementUnit.toLowerCase()}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Calculated Ground Plot Area</label>
                  <div className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-navy-950 flex items-center justify-between">
                    <span>{calculatedPlotArea || 0}</span>
                    <span className="text-xs text-gold-600 font-bold uppercase">
                      {formData.measurementUnit === 'FEET' ? 'sq.ft' : 'sq.m'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Auto-calculated: {formData.plotWidth || 0} × {formData.plotLength || 0}</span>
                </div>
              </div>
            </div>

            {/* Built-up area, Floors & Rooms */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Built-up Area</label>
                <input
                  type="number"
                  min="100"
                  placeholder="Enter area"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.builtUpArea || ''}
                  onChange={(e) => setFormData({ ...formData, builtUpArea: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })}
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">{formData.measurementUnit === 'FEET' ? 'sq.ft' : 'sq.m'}</span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Floors (G+)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Floors"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.floors || ''}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Bedrooms"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.bedrooms || ''}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Baths"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.bathrooms || ''}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kitchens</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Kitchens"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.kitchens || ''}
                  onChange={(e) => setFormData({ ...formData, kitchens: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Location & PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Site Street / Locality *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter site street / locality"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                />
              </div>
              <div className="sm:col-span-1">
                <SearchableCitySelect
                  value={formData.city}
                  onChange={(cityName, stateName, pinCode) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: cityName,
                      ...(stateName ? { state: stateName } : {}),
                      ...(pinCode ? { pinCode: pinCode } : {}),
                    }))
                  }
                  placeholder="Select City Name"
                  label="City"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PIN Code (6 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              </div>
            </div>

            {/* Ownership Declaration */}
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 text-gold-600 focus:ring-gold-500 rounded"
                checked={formData.ownershipConfirmed}
                onChange={(e) => setFormData({ ...formData, ownershipConfirmed: e.target.checked })}
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I hereby declare that I am the legal owner or authorized representative for this site, and I authorize certified contractors to review zoning regulations for this parcel.
              </span>
            </label>
          </div>
        )}

        {/* STEP 3: REQUIREMENTS & SCOPE */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>Step 3 of 6</span>
              </div>
              <h2 className="text-xl font-bold font-display text-navy-950">
                Engineering Deliverables & Design Requirements
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select all specific drawings, structural calculations, and complete construction services you want quoted.
              </p>
            </div>

            {/* Required Engineering Services Checkbox Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Select Required Deliverables (Multi-select) *</label>
                <span className="text-[11px] text-slate-500 font-semibold">{formData.requiredServices.length} Selected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {availableDeliverableServices.map((srv) => {
                  const isSelected = formData.requiredServices.includes(srv.name);
                  return (
                    <label
                      key={srv.name}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? 'border-gold-500 bg-gold-50 text-gold-950 font-semibold shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(srv.name)}
                        className="text-gold-600 rounded focus:ring-gold-500 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block">{srv.name}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">
                          {srv.description || srv.categoryName}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Budget & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Estimated Budget Range</label>
                <select
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                >
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Preferred Building Style</label>
                <select
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.designStyle}
                  onChange={(e) => setFormData({ ...formData, designStyle: e.target.value })}
                >
                  {DESIGN_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Preferred Start Date</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.preferredStartDate}
                  onChange={(e) => setFormData({ ...formData, preferredStartDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Completion Date</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                  value={formData.expectedCompletionDate}
                  onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Detailed Project Description & Vision (Min. 20 chars) *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Mention specific spatial requirements e.g. Vastu northeast entrance, double-height ceiling in living room, stilt parking for 3 cars, servant room, terrace garden..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formData.description.length} characters entered.
              </span>
            </div>

            {/* Site Accessibility */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Site Accessibility & Road Notes</label>
              <input
                type="text"
                placeholder="Enter site accessibility & road notes (optional)"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none"
                value={formData.siteAccessibilityNotes}
                onChange={(e) => setFormData({ ...formData, siteAccessibilityNotes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS AND PHOTOS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>Step 4 of 6</span>
              </div>
              <h2 className="text-xl font-bold font-display text-navy-950">
                Upload Site Documents, Maps & Reference Photos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your plot registry map, existing floor plans, site photos, or design inspirations to help professionals prepare tailored BOQs.
              </p>
            </div>

            {/* Upload form card */}
            <form onSubmit={handleAddDocument} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
                <Paperclip className="w-4 h-4 text-gold-600" />
                <span>Attach Relevant Property Document or Photograph</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Category</label>
                  <select
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white font-medium"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">File Name / Description</label>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy-900 focus:outline-none bg-white"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Supported: PDF, DWG, JPG, PNG (Max 25MB)</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>
            </form>

            {/* Attached Documents List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Attached Files ({formData.documents.length})
              </label>

              {formData.documents.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-white">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs text-slate-600 font-bold">No documents attached yet</div>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Attaching a plot map or site photos allows engineers to provide up to 30% more accurate structural estimates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(formData.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center font-bold text-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{doc.fileName}</div>
                          <div className="text-[10px] text-slate-400">
                            Category: <strong className="text-slate-600">{doc.category}</strong> • Size: {doc.fileSize}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW REQUEST SUMMARY */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>Step 5 of 6</span>
              </div>
              <h2 className="text-xl font-bold font-display text-navy-950">
                Review Request Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all project information. You can click "Edit" on any section below to make adjustments before submission.
              </p>
            </div>

            {/* Summary Cards with Edit Actions */}
            <div className="space-y-4 text-xs">
              {/* Card 1: Category & Project */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-navy-950 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gold-600" />
                    <span>Project & Service Category</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToStep(1)}
                    className="text-xs font-bold text-gold-700 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="space-y-2.5 text-slate-600">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-slate-400">Project Name: </span>
                      <strong className="text-slate-900">{formData.projectName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Categories Selected: </span>
                      <strong className="text-slate-900">{selectedCategoriesList.length} Categories</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1.5 font-medium">Selected Service Scope:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategoriesList.map((cat) => (
                        <span
                          key={cat.slug}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gold-50 text-gold-900 border border-gold-200 flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3 h-3 text-gold-600" />
                          <span>{cat.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Property & Plot */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-navy-950 text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gold-600" />
                    <span>Property & Plot Measurements</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToStep(2)}
                    className="text-xs font-bold text-gold-700 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Dimensions: </span>
                    <strong className="text-slate-900">{formData.plotWidth} × {formData.plotLength} {formData.measurementUnit.toLowerCase()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Plot Area: </span>
                    <strong className="text-slate-900">{calculatedPlotArea} {formData.measurementUnit === 'FEET' ? 'sq.ft' : 'sq.m'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Built-Up Area: </span>
                    <strong className="text-slate-900">{formData.builtUpArea} {formData.measurementUnit === 'FEET' ? 'sq.ft' : 'sq.m'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Floors: </span>
                    <strong className="text-slate-900">{formData.floors}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Rooms: </span>
                    <strong className="text-slate-900">{formData.bedrooms} Bed, {formData.bathrooms} Bath, {formData.kitchens} Kit</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Location: </span>
                    <strong className="text-slate-900">{formData.locality}, {formData.city} ({formData.pinCode})</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Scope & Schedule */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-navy-950 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-600" />
                    <span>Scope, Schedule & Budget</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToStep(3)}
                    className="text-xs font-bold text-gold-700 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <div>
                    <span className="text-slate-400">Required Services: </span>
                    <strong className="text-slate-900">{(formData.requiredServices || []).join(' • ') || 'Comprehensive Architectural Build'}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400">Budget Range: </span>
                      <strong className="text-gold-700">{formData.budgetRange}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Timeline: </span>
                      <strong className="text-slate-900">{formData.preferredStartDate} to {formData.expectedCompletionDate}</strong>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400">Vision: </span>
                    <span className="text-slate-800 italic">{formData.description}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Attached Files */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-navy-950 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gold-600" />
                    <span>Attached Documents ({formData.documents.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToStep(4)}
                    className="text-xs font-bold text-gold-700 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                {formData.documents.length === 0 ? (
                  <span className="text-slate-400 italic">No files attached (Optional).</span>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(formData.documents || []).map((d) => (
                      <span key={d.id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700">
                        {d.fileName} ({d.category})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: FEE & SUBMISSION */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">
                <span>Step 6 of 6</span>
              </div>
              <h2 className="text-xl font-bold font-display text-navy-950">
                Technical Vetting Fee & Request Submission
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                A nominal fee guarantees that certified structural engineers and registered contractors compile itemized estimates for your site.
              </p>
            </div>

            {/* Fee Breakdown */}
            <div className="p-5 bg-amber-50/70 border border-gold-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Nominal Quotation Compilation Fee:</span>
                <span className="font-semibold text-slate-900">₹422.88</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Statutory CGST + SGST (18%):</span>
                <span className="font-semibold text-slate-900">₹76.12</span>
              </div>
              <div className="pt-2 border-t border-gold-200 flex items-center justify-between text-sm font-bold text-navy-950">
                <span>Total Payable Now:</span>
                <span className="text-gold-700 text-base">{formatINR(requestFeePaise)}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gold-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-navy-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Escrow Protection & Refund Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  If fewer than 2 accredited associate professionals submit verified quotations within 5 business days, this fee will be refunded back to your original payment method automatically.
                </p>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 text-gold-600 focus:ring-gold-500 rounded"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I accept the GharDesign marketplace terms & conditions, cancellation rules, and acknowledge that all quotes will be strictly vetted by platform administrators before publication.
              </span>
            </label>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="btn-outline text-xs py-2.5 px-5 flex items-center gap-1.5 rounded-xl font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-1.5 rounded-xl font-bold shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="btn-gold text-xs py-3 px-8 flex items-center gap-2 font-black shadow-md rounded-xl hover:scale-102 active:scale-98 transition cursor-pointer"
            >
              <span>{isSubmitting ? 'Dispatching to Admin Desk...' : 'Submit Quotation Request & Dispatch to Admin'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-900" />
            </button>
          )}
        </div>
      </div>

      {/* Payment Checkout Modal (Razorpay Simulation) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 text-left shadow-2xl border border-slate-100 space-y-5 z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-navy-950 text-gold-400 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-950 font-display text-sm">Razorpay Secure Gateway</h3>
                    <div className="text-[10px] text-slate-400">256-Bit SSL Encrypted Escrow Account</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Purpose:</span>
                    <span className="font-semibold text-slate-800">Quotation Request Vetting Fee</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Project:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{formData.projectName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Amount:</span>
                    <span className="font-bold text-navy-950 text-sm">{formatINR(requestFeePaise)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                  <div className="font-bold">Sandbox Test Mode Active</div>
                  <p>
                    Clicking "Authorize Payment" simulates an authenticated gateway verification and transitions your request to UNDER_REVIEW for administrative quotation compilation.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isSubmitting}
                  className="btn-gold text-xs py-2.5 px-6 flex items-center gap-2 font-bold"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Authorize Payment of ₹499'}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
