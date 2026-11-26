import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import { formatINR } from '../../lib/utils.js';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  HelpCircle,
  User,
  MapPin,
  Eye,
  Sparkles,
  Printer,
  Download,
  X,
  FileText,
  Check,
  Clock,
} from 'lucide-react';
import {
  generateQuotationCode,
  getPlatformRequests,
  getPlatformRequestById,
  updatePlatformRequestStatus,
  broadcastStoreUpdate,
} from '../../data/customerStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { safeSetStorage, safeGetStorage } from '../../lib/safeStorage.js';
import { getArchitectByPhone, getArchitectById } from '../../data/architectStore.js';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
}

export interface QuotationMilestoneItem {
  id: string;
  title: string;
  percentage: number;
}

export const QuotationBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

  const requestId = searchParams.get('requestId') || '';

  const matchedReq = useMemo(() => {
    if (!requestId) return null;
    const req = getPlatformRequestById(requestId);
    if (req) return req;
    return (
      getPlatformRequests().find(
        (r) => r.id === requestId || r.requestCode === requestId
      ) || null
    );
  }, [requestId]);

  // Form State
  const [scopeOfWork, setScopeOfWork] = useState('');

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      description: '',
      quantity: 1,
      unit: 'sq.ft',
      unitPricePaise: 0,
    },
  ]);

  const [discountRupees, setDiscountRupees] = useState<number | ''>('');

  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');

  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newExclusion, setNewExclusion] = useState('');

  const [advancePercentage, setAdvancePercentage] = useState<number>(20);
  const [revisionsCount, setRevisionsCount] = useState<number>(2);
  const [estimatedDurationDays, setEstimatedDurationDays] = useState<number>(30);
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [cancellationTerms, setCancellationTerms] = useState(
    'Standard cancellation and milestone sign-off policy applies. 3 rounds of design revisions included.'
  );

  // 4-Milestone Breakdown Schedule (Master Spec Section 8.3)
  const [customMilestones, setCustomMilestones] = useState<QuotationMilestoneItem[]>([
    { id: 'm1', title: 'Milestone 1: Booking Advance & Concept Layouts', percentage: 20 },
    { id: 'm2', title: 'Milestone 2: Municipal Sanction Drawings & Detailed 2D Working Plans', percentage: 30 },
    { id: 'm3', title: 'Milestone 3: 3D Exterior Elevation Views & Structural RCC Details (IS 456)', percentage: 30 },
    { id: 'm4', title: 'Milestone 4: Final MEP Schemas, Itemized BOQ & Handover Package', percentage: 20 },
  ]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalMilestonePercentage = useMemo(() => {
    return customMilestones.reduce((acc, m) => acc + (Number(m.percentage) || 0), 0);
  }, [customMilestones]);

  const applyTemplate = (templateKey: 'FULL_PACKAGE' | 'ARCH_3D' | 'STRUCTURAL' | 'SUPERVISION') => {
    if (templateKey === 'FULL_PACKAGE') {
      setScopeOfWork(
        'Comprehensive architectural & engineering design package: Detailed 2D floor plans, municipal sanction drawings, high-definition 3D elevations, IS 456 compliant structural RCC frame schedules, electrical conduit and plumbing schemas, and itemized BOQ material estimation.'
      );
      setLineItems([
        { description: '2D Architectural Floor Plans & Municipal Blueprints', quantity: Number(matchedReq?.plotArea) || 2400, unit: 'sq.ft', unitPricePaise: 2500 },
        { description: '3D Photorealistic Exterior Elevations & 360 Walkthrough', quantity: 1, unit: 'set', unitPricePaise: 3500000 },
        { description: 'Structural Engineering RCC Frame & Foundation Details (IS 456 Vetted)', quantity: Number(matchedReq?.plotArea) || 2400, unit: 'sq.ft', unitPricePaise: 1500 },
        { description: 'MEP Schemas (Electrical Conduit, Plumbing & Drainage Working Drawings)', quantity: 1, unit: 'set', unitPricePaise: 2000000 },
        { description: 'Detailed Bill of Quantities (BOQ) with Material Specifications', quantity: 1, unit: 'job', unitPricePaise: 1500000 },
      ]);
      setDeliverables([
        '2D Architectural Floor Plans (All Floors & Terrace)',
        'Municipal Authority Approval Blueprints',
        'Photorealistic 3D Exterior Elevation Renders',
        'Structural RCC Frame & Column-Footing Layouts (IS 456 Vetted)',
        'Electrical Conduit & Circuit Schemas',
        'Plumbing, Drainage & Water Supply Layouts',
        'Itemized Bill of Quantities (BOQ) with Grade Specs',
        'Site Visit Inspections for Foundation & Plinth Quality Audit',
      ]);
      setExclusions([
        'Municipal authority scrutiny & sanction fees payable to government',
        'Geotechnical soil testing laboratory charges',
        'Physical 3D architectural miniature scale model',
        'Daily on-site contractor labor supervision',
      ]);
      setCustomMilestones([
        { id: 'm1', title: 'Milestone 1: Booking Advance & Concept Layouts', percentage: 20 },
        { id: 'm2', title: 'Milestone 2: Municipal Sanction Drawings & Detailed 2D Working Plans', percentage: 30 },
        { id: 'm3', title: 'Milestone 3: 3D Exterior Elevation Views & Structural RCC Details (IS 456)', percentage: 30 },
        { id: 'm4', title: 'Milestone 4: Final MEP Schemas, Itemized BOQ & Handover Package', percentage: 20 },
      ]);
      success('Applied Full Architectural & Engineering Package template!');
    } else if (templateKey === 'ARCH_3D') {
      setScopeOfWork(
        'Architectural design package: Conceptual and working 2D floor plans, furniture layouts, municipal blueprints, and photorealistic 3D exterior elevations.'
      );
      setLineItems([
        { description: '2D Architectural Floor Plans & Municipal Blueprints', quantity: Number(matchedReq?.plotArea) || 2000, unit: 'sq.ft', unitPricePaise: 2200 },
        { description: '3D Front & Corner Exterior Elevation Views', quantity: 1, unit: 'set', unitPricePaise: 2800000 },
      ]);
      setDeliverables([
        '2D Architectural Floor Plans',
        'Furniture Layout & Space Optimization Plan',
        '3D Exterior Elevation Renders (Day & Evening Views)',
        'Door & Window Schedule',
      ]);
      setExclusions([
        'Structural RCC analysis and reinforcement schedules',
        'MEP electrical and plumbing layouts',
        'Municipal sanction liaising fees',
      ]);
      setCustomMilestones([
        { id: 'm1', title: 'Milestone 1: Booking Advance & Concept Floor Plans', percentage: 30 },
        { id: 'm2', title: 'Milestone 2: Final 2D Working Drawings', percentage: 40 },
        { id: 'm3', title: 'Milestone 3: 3D Elevation Views & Final Package', percentage: 30 },
      ]);
      success('Applied Architectural & 3D Elevation template!');
    } else if (templateKey === 'STRUCTURAL') {
      setScopeOfWork(
        'IS 456 compliant structural engineering analysis, STAAD.Pro foundation design, column-beam schedules, and slab reinforcement working drawings.'
      );
      setLineItems([
        { description: 'Structural Engineering RCC Analysis & Detailed Drafting (IS 456)', quantity: Number(matchedReq?.plotArea) || 2500, unit: 'sq.ft', unitPricePaise: 1800 },
        { description: 'Foundation Soil Bearing Vetting & Retaining Wall Design', quantity: 1, unit: 'job', unitPricePaise: 1500000 },
      ]);
      setDeliverables([
        'Foundation & Column Centerline Working Drawing',
        'Plinth & Tie Beam Reinforcement Schedule',
        'Slab & Beam Reinforcement Detailing (IS 456)',
        'Bar Bending Schedule (BBS) for Steel Optimization',
        'Structural Stability Certificate by Licensed Engineer',
      ]);
      setExclusions([
        'Architectural aesthetics and interior layouts',
        'Soil test laboratory charges',
      ]);
      setCustomMilestones([
        { id: 'm1', title: 'Milestone 1: Advance & Foundation Centerline Details', percentage: 40 },
        { id: 'm2', title: 'Milestone 2: Column, Beam & Slab Reinforcement Schedules', percentage: 40 },
        { id: 'm3', title: 'Milestone 3: Structural Stability Certificate & Final BBS', percentage: 20 },
      ]);
      success('Applied Structural Engineering Package template!');
    } else if (templateKey === 'SUPERVISION') {
      setScopeOfWork(
        'Comprehensive architectural consultancy, working drawings, itemized BOQ, and scheduled on-site quality audit visits at key construction stages.'
      );
      setLineItems([
        { description: 'Complete Architectural, Structural & MEP Design Package', quantity: Number(matchedReq?.plotArea) || 2800, unit: 'sq.ft', unitPricePaise: 3500 },
        { description: 'Scheduled Site Quality Audits (Plinth, Casting, Brickwork & Finishing)', quantity: 6, unit: 'set', unitPricePaise: 300000 },
      ]);
      setDeliverables([
        'Full Architectural, Structural (IS 456) & MEP Drawing Sets',
        'Itemized BOQ with Material Specs and Quantity Takeoffs',
        '6 Scheduled On-Site Quality Inspections & Audit Reports',
        'Concrete Slump & Rebar Placement Verification Reports',
      ]);
      setExclusions([
        'Daily full-time site supervision',
        'Material procurement fees',
      ]);
      setCustomMilestones([
        { id: 'm1', title: 'Milestone 1: Advance & Architectural Concept', percentage: 20 },
        { id: 'm2', title: 'Milestone 2: Complete Working Drawings (Arch, Struct, MEP)', percentage: 40 },
        { id: 'm3', title: 'Milestone 3: Foundation & Plinth Site Audit', percentage: 20 },
        { id: 'm4', title: 'Milestone 4: Slab Castings & Final Quality Handover', percentage: 20 },
      ]);
      success('Applied Architecture & Site Supervision Package template!');
    }
  };

  // Financial Calculations
  const subtotalPaise = useMemo(() => {
    if (!Array.isArray(lineItems)) return 0;
    return lineItems.reduce((acc, item) => {
      if (!item) return acc;
      return acc + Math.round(Number(item.quantity || 0) * Number(item.unitPricePaise || 0));
    }, 0);
  }, [lineItems]);

  const discountPaise = (Number(discountRupees) || 0) * 100;
  const taxableAmountPaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round(taxableAmountPaise * 0.18); // 18% GST
  const finalAmountPaise = taxableAmountPaise + taxPaise;

  // Add Line Item
  const addLineItem = () => {
    setLineItems((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { description: '', quantity: 1, unit: 'sq.ft', unitPricePaise: 0 },
    ]);
  };

  // Remove Line Item
  const removeLineItem = (index: number) => {
    if (!Array.isArray(lineItems) || lineItems.length <= 1) {
      error('At least one line item is required.');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Update Line Item
  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : [];
      if (!copy[index]) return copy;
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add Deliverable
  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  // Add Exclusion
  const handleAddExclusion = () => {
    if (!newExclusion.trim()) return;
    setExclusions([...exclusions, newExclusion.trim()]);
    setNewExclusion('');
  };

  const handleSubmitQuotation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (scopeOfWork.length < 20) {
      error('Scope of work must be at least 20 characters.');
      return;
    }

    if (totalMilestonePercentage !== 100) {
      error(`Milestone payment percentages must equal exactly 100%! Current total is ${totalMilestonePercentage}%.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteCode = generateQuotationCode();
      const cleanUserPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
      const matchedArch = cleanUserPhone ? getArchitectByPhone(cleanUserPhone) : (user?.id ? getArchitectById(user.id) : null);
      const resolvedArchId = matchedArch?.id || (user as any)?.architectId || (user as any)?.coaNumber || user?.id || '';
      const resolvedFirmName = matchedArch?.firmName || (user as any)?.firmName || '';
      const resolvedArchName = matchedArch?.name || user?.name || '';
      const resolvedCoa = matchedArch?.coaNumber || (user as any)?.coaNumber || '';

      const payload = {
        requestId: matchedReq?.id || requestId,
        requestCode: matchedReq?.requestCode || requestId,
        customerId: matchedReq?.customerId || '',
        customerName: matchedReq?.customerName || '',
        customerPhone: matchedReq?.customerPhone || '',
        customerEmail: matchedReq?.customerEmail || '',
        city: matchedReq?.city || '',
        locality: matchedReq?.locality || '',
        propertyType: matchedReq?.propertyType || '',
        architectId: resolvedArchId,
        firmName: resolvedFirmName,
        architectName: resolvedArchName,
        professionalId: resolvedArchId || user?.id || '',
        professionalName: resolvedArchName,
        professional: {
          id: resolvedArchId || user?.id || '',
          architectId: resolvedArchId,
          name: resolvedArchName,
          firmName: resolvedFirmName,
          coaNumber: resolvedCoa,
          qualifications: (user as any)?.qualifications || '',
          phone: user?.phone || matchedArch?.phone || '',
        },
        scopeOfWork,
        lineItems,
        subtotalPaise,
        discountPaise,
        netTotalPaise: taxableAmountPaise,
        taxableAmountPaise,
        taxPaise,
        finalAmountPaise,
        totalAmountPaise: finalAmountPaise,
        totalAmount: finalAmountPaise / 100,
        includedDeliverables: deliverables,
        excludedWork: exclusions,
        revisionsCount,
        drawingFormats: ['AutoCAD DWG', 'High-Res PDF', '3D Blender Model'],
        siteVisitChargesPaise: 300000,
        estimatedDurationDays,
        advancePercentage: Number(customMilestones[0]?.percentage) || advancePercentage,
        milestones: customMilestones.map((m) => {
          const pct = Number(m.percentage) || 0;
          return {
            title: m.title,
            percentage: pct,
            amountPaise: Math.round((finalAmountPaise * pct) / 100),
          };
        }),
        validUntil,
        cancellationTerms,
      };

      try {
        await apiRequest('/professional/quotations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback or offline store sync
      }

      const newQ = {
        id: `quote-${Date.now()}`,
        quotationCode: quoteCode,
        ...payload,
        architectId: resolvedArchId,
        firmName: resolvedFirmName,
        status: 'SUBMITTED_BY_PRO',
        createdAt: new Date().toISOString(),
      };

      try {
        const prev = safeGetStorage<any[]>('platform_quotations', []);
        safeSetStorage('platform_quotations', [newQ, ...prev], 40);
      } catch (storageErr) {
        console.warn('[QuotationBuilder] LocalStorage write fallback:', storageErr);
      }

      if (matchedReq) {
        updatePlatformRequestStatus(matchedReq.id, matchedReq.status || 'ASSIGNED', {
          quotationsCount: (matchedReq.quotationsCount || 0) + 1,
        });
      }

      broadcastStoreUpdate('QUOTATIONS_UPDATED', [newQ]);
      pushToCloud().catch(() => {});

      success('Quotation submitted successfully for Administrator review!');
      navigate('/professional/quotations');
    } catch (err: any) {
      error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-navy-950">
          Standardized Quotation Builder
        </h1>
        <p className="text-xs text-slate-500">
          Prepare an itemized Bill of Quantities (BOQ). The administrator will review and verify before publishing to the homeowner.
        </p>
      </div>

      {/* Matched Project Brief Banner */}
      {matchedReq && (
        <div className="card p-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-blue-200/90 rounded-2xl shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold tracking-wider">
                {matchedReq.requestCode}
              </span>
              <span className="text-sm font-bold text-navy-950">
                Project for: {matchedReq.customerName}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Target Budget: <strong className="text-amber-700">{matchedReq.budgetRange}</strong>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Property & Plot:</span>
              <span className="font-semibold text-slate-800">
                {matchedReq.propertyType} • {matchedReq.plotArea} {matchedReq.measurementUnit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Site Location:</span>
              <span className="font-semibold text-slate-800">
                {matchedReq.locality}, {matchedReq.city}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Contact:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {matchedReq.customerPhone}
              </span>
            </div>
          </div>
          {matchedReq.description && (
            <div className="pt-1 text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
              <strong className="text-slate-700">Client Brief: </strong>
              {matchedReq.description}
            </div>
          )}
        </div>
      )}

      {/* Architectural Scope Presets (Master Spec Section 8.2) */}
      <div className="card p-5 bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-navy-950 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Standard Architectural Package Templates</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Click to auto-fill scope, deliverables, BOQ &amp; milestones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => applyTemplate('FULL_PACKAGE')}
            className="p-3 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="font-bold text-xs text-navy-950 group-hover:text-sky-700">Full Architectural Package</div>
            <div className="text-[10px] text-slate-500 mt-0.5">2D + 3D + Structural (IS 456) + MEP + BOQ</div>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('ARCH_3D')}
            className="p-3 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="font-bold text-xs text-navy-950 group-hover:text-sky-700">Architectural &amp; 3D Only</div>
            <div className="text-[10px] text-slate-500 mt-0.5">2D Floor Plans &amp; 3D Exterior Elevation</div>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('STRUCTURAL')}
            className="p-3 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="font-bold text-xs text-navy-950 group-hover:text-sky-700">Structural IS 456 Package</div>
            <div className="text-[10px] text-slate-500 mt-0.5">RCC Frame, Footings, Slabs &amp; BBS Schedule</div>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('SUPERVISION')}
            className="p-3 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl text-left transition group shadow-2xs cursor-pointer"
          >
            <div className="font-bold text-xs text-navy-950 group-hover:text-sky-700">Architecture &amp; Site Audit</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Working Drawings + 6 Key Stage Site Visits</div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitQuotation} className="space-y-6">
        {/* Scope of Work */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
            1. Comprehensive Scope of Work
          </h2>
          <div>
            <textarea
              rows={3}
              required
              className="input-field"
              placeholder="Detail your architectural or civil methodology (e.g. 2D Architectural floor plans, structural vetting per IS 456, electrical and plumbing schemas)..."
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Itemized Line Items */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              2. Itemized Bill of Quantities (Line Items)
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 text-gold-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {(lineItems || []).map((item, idx) => {
              if (!item) return null;
              const rowTotal = Math.round(Number(item.quantity || 0) * Number(item.unitPricePaise || 0));

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 sm:grid-cols-[1fr_85px_105px_115px_130px_36px] gap-2.5 items-end"
                >
                  <div className="col-span-12 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete Architectural Floor Plans & Elevations"
                      className="input-field py-1.5 text-xs w-full"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    />
                  </div>

                  <div className="col-span-3 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      className="input-field py-1.5 text-xs w-full text-center"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="col-span-3 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Unit
                    </label>
                    <select
                      className="input-field py-1.5 text-xs w-full"
                      value={item.unit}
                      onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                    >
                      <option value="sq.ft">sq.ft</option>
                      <option value="sq.m">sq.m</option>
                      <option value="lumpsum">lumpsum</option>
                      <option value="set">set</option>
                      <option value="certificate">certificate</option>
                      <option value="job">job</option>
                    </select>
                  </div>

                  <div className="col-span-3 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      className="input-field py-1.5 text-xs w-full text-right font-medium"
                      value={item.unitPricePaise ? item.unitPricePaise / 100 : ''}
                      onChange={(e) =>
                        updateLineItem(idx, 'unitPricePaise', Math.round((parseFloat(e.target.value) || 0) * 100))
                      }
                    />
                  </div>

                  {/* Total Box next to Rate */}
                  <div className="col-span-2 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Total (₹)
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      aria-label="Item total"
                      className="input-field py-1.5 text-xs w-full bg-slate-100/90 font-bold text-navy-950 text-right cursor-not-allowed border-slate-200 select-none shadow-2xs"
                      value={formatINR(rowTotal)}
                    />
                  </div>

                  <div className="col-span-1 sm:col-auto flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary Card */}
          <div className="p-4 bg-navy-950 text-white rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{formatINR(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Discount to Client (₹):</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-28 px-2 py-1 rounded bg-navy-900 border border-slate-700 text-right text-xs text-white"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Net Total:</span>
              <span className="font-semibold text-white">{formatINR(taxableAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST (18%):</span>
              <span className="font-semibold text-white">{formatINR(taxPaise)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-gold-400">
              <span>Final Quotation Total:</span>
              <span>{formatINR(finalAmountPaise)}</span>
            </div>
          </div>
        </div>

        {/* Deliverables & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Deliverables */}
          <div className="card p-6 space-y-3">
            <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Included Deliverables
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 3D Elevation Views, Structural CAD Drawings"
                className="input-field py-1.5 text-xs flex-1"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5 pt-2">
              {deliverables.map((del, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-emerald-50 text-[11px] text-emerald-900 border border-emerald-200">
                  <span>✓ {del}</span>
                  <button
                    type="button"
                    onClick={() => setDeliverables(deliverables.filter((_, idx) => idx !== i))}
                    className="text-emerald-700 hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div className="card p-6 space-y-3">
            <h2 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Explicit Exclusions
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Municipal Approval Authority Liaisoning Fees"
                className="input-field py-1.5 text-xs flex-1"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddExclusion}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5 pt-2">
              {exclusions.map((exc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-rose-50 text-[11px] text-rose-900 border border-rose-200">
                  <span>✕ {exc}</span>
                  <button
                    type="button"
                    onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                    className="text-rose-700 hover:text-rose-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Milestone Schedule Breakdown (Master Spec Section 8.3) */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>3. Milestone-Based Payment Schedule</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tranches are held in escrow and released by the homeowner upon verification of respective deliverables.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                totalMilestonePercentage === 100
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                Total: {totalMilestonePercentage}% {totalMilestonePercentage === 100 ? '✓' : '(Must be 100%)'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {customMilestones.map((m, mIdx) => {
              const mAmount = Math.round((finalAmountPaise * (Number(m.percentage) || 0)) / 100);
              return (
                <div key={m.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 sm:grid-cols-[1fr_90px_130px] gap-3 items-center">
                  <div className="col-span-12 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Milestone Stage Title
                    </label>
                    <input
                      type="text"
                      required
                      value={m.title}
                      onChange={(e) => {
                        const copy = [...customMilestones];
                        copy[mIdx].title = e.target.value;
                        setCustomMilestones(copy);
                      }}
                      className="input-field py-1.5 text-xs w-full font-medium"
                    />
                  </div>

                  <div className="col-span-6 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Share (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={m.percentage}
                      onChange={(e) => {
                        const copy = [...customMilestones];
                        copy[mIdx].percentage = parseInt(e.target.value) || 0;
                        setCustomMilestones(copy);
                      }}
                      className="input-field py-1.5 text-xs w-full text-center font-bold"
                    />
                  </div>

                  <div className="col-span-6 sm:col-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Milestone INR (₹)
                    </label>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-200/80 text-navy-950 font-bold text-xs text-right truncate">
                      {formatINR(mAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Terms, Revisions & Validity */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
            4. Project Terms, Revisions &amp; Validity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Advance Required (%)</label>
              <input
                type="number"
                min="10"
                max="50"
                className="input-field"
                value={customMilestones[0]?.percentage || advancePercentage}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 20;
                  setAdvancePercentage(val);
                  if (customMilestones[0]) {
                    const copy = [...customMilestones];
                    copy[0].percentage = val;
                    setCustomMilestones(copy);
                  }
                }}
              />
            </div>
            <div>
              <label className="label-text">Included Design Revisions</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={revisionsCount}
                onChange={(e) => setRevisionsCount(parseInt(e.target.value) || 2)}
              />
            </div>
            <div>
              <label className="label-text">Estimated Duration (Days)</label>
              <input
                type="number"
                min="5"
                className="input-field"
                value={estimatedDurationDays}
                onChange={(e) => setEstimatedDurationDays(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Quotation Valid Until</label>
              <input
                type="date"
                required
                className="input-field"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div>
              <label className="label-text">Cancellation Policy</label>
              <input
                type="text"
                required
                className="input-field"
                value={cancellationTerms}
                onChange={(e) => setCancellationTerms(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-sky-600" />
            <span>Preview Quotation Document</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || totalMilestonePercentage !== 100}
            className="btn-gold py-3 px-8 text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit Quotation for Admin Review'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* =========================================================================
          LIVE QUOTATION PREVIEW MODAL (Master Spec Section 8.5)
      ========================================================================= */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Quotation Document Preview</h4>
                  <span className="text-[11px] text-slate-400 font-mono">SAC: 998321 • Architectural &amp; Civil Engineering Services</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-800">
              {/* Header Invoice Brand */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="text-lg font-black font-display text-navy-950">BUILDGHAR ARCHITECTURE DESK</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Council of Architecture (COA) Verified Practice</div>
                  <div className="text-[11px] text-slate-600 font-mono mt-1">
                    Practitioner: <strong>{user?.name || 'Licensed Architect'}</strong> • Status: Verified
                  </div>
                </div>
                <div className="text-right sm:text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
                    PRO-FORMA QUOTATION
                  </span>
                  <div className="text-slate-500 text-[11px] mt-1 font-mono">Date: {new Date().toLocaleDateString('en-IN')}</div>
                  <div className="text-slate-500 text-[11px] font-mono">Valid Until: {validUntil}</div>
                </div>
              </div>

              {/* Client & Project Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Homeowner / Client</span>
                  <div className="font-bold text-navy-950 text-sm mt-0.5">{matchedReq?.customerName || 'Valued Homeowner'}</div>
                  <div className="text-slate-600 font-mono mt-0.5">{matchedReq?.customerPhone || ''}</div>
                  <div className="text-slate-600">{matchedReq?.locality ? `${matchedReq.locality}, ` : ''}{matchedReq?.city || 'Delhi NCR'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Specifications</span>
                  <div className="font-bold text-navy-950 mt-0.5">{matchedReq?.propertyType || 'Residential Villa'}</div>
                  <div className="text-slate-600">Plot Dimensions: {matchedReq?.plotArea || '2,400'} sq.ft</div>
                  <div className="text-slate-600">Revisions Included: {revisionsCount} rounds</div>
                </div>
              </div>

              {/* Scope of Work */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Scope of Architectural Services</span>
                <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {scopeOfWork || 'Comprehensive architectural floor layout, 3D exterior visualization, IS 456 compliant structural frame, and BOQ.'}
                </p>
              </div>

              {/* Itemized Line Items Table */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Itemized Bill of Quantities (BOQ)</span>
                <table className="w-full border border-slate-200 rounded-xl overflow-hidden text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Scope Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-center">Unit</th>
                      <th className="p-2.5 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, idx) => {
                      const total = Math.round(Number(item.quantity || 0) * Number(item.unitPricePaise || 0));
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{item.description || 'Architectural Service Item'}</td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-center font-mono">{item.unit}</td>
                          <td className="p-2.5 text-right font-mono">{formatINR(item.unitPricePaise || 0)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-navy-950">{formatINR(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pricing Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 max-w-sm ml-auto text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-white">{formatINR(subtotalPaise)}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>- {formatINR(discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Taxable Value:</span>
                  <span className="font-semibold text-white">{formatINR(taxableAmountPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST (18% SAC 998321):</span>
                  <span className="font-semibold text-white">{formatINR(taxPaise)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-amber-400">
                  <span>Final Payable Total:</span>
                  <span>{formatINR(finalAmountPaise)}</span>
                </div>
              </div>

              {/* 4-Milestone Payment Schedule Preview */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Milestone Escrow Disbursement Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {customMilestones.map((m) => {
                    const mAmount = Math.round((finalAmountPaise * (Number(m.percentage) || 0)) / 100);
                    return (
                      <div key={m.id} className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-navy-950 text-xs">{m.title}</div>
                          <div className="text-[10px] text-sky-800 font-mono">Stage Share: {m.percentage}%</div>
                        </div>
                        <div className="font-mono font-black text-sky-950 text-xs">{formatINR(mAmount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deliverables & Exclusions Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase block">Included Deliverables ({deliverables.length})</span>
                  {deliverables.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-emerald-950">
                      {deliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic">No specific deliverables listed.</span>
                  )}
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-900 uppercase block">Explicit Exclusions ({exclusions.length})</span>
                  {exclusions.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-rose-950">
                      {exclusions.map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic">Standard industry exclusions apply.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Back to Editing
              </button>
              <button
                type="button"
                disabled={isSubmitting || totalMilestonePercentage !== 100}
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleSubmitQuotation();
                }}
                className="btn-gold py-2.5 px-6 text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Quotation for Admin Review'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
