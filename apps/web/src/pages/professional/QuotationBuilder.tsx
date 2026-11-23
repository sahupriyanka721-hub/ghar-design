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
    'Standard cancellation and milestone sign-off policy applies.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scopeOfWork.length < 20) {
      error('Scope of work must be at least 20 characters.');
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
        includedDeliverables: deliverables,
        excludedWork: exclusions,
        revisionsCount,
        drawingFormats: ['AutoCAD DWG', 'High-Res PDF', '3D Blender Model'],
        siteVisitChargesPaise: 300000,
        estimatedDurationDays,
        advancePercentage,
        milestones: [
          {
            title: 'Milestone 1: Booking & Concept Layouts',
            percentage: advancePercentage,
            amountPaise: Math.round((finalAmountPaise * advancePercentage) / 100),
          },
          {
            title: 'Milestone 2: Final Working Drawings Sign-off',
            percentage: 100 - advancePercentage,
            amountPaise: finalAmountPaise - Math.round((finalAmountPaise * advancePercentage) / 100),
          },
        ],
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
        updatePlatformRequestStatus(matchedReq.id, 'QUOTATIONS_AVAILABLE', {
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

        {/* Milestone Schedule & Terms */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
            3. Project Terms, Revisions & Validity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Advance Required (%)</label>
              <input
                type="number"
                min="10"
                max="50"
                className="input-field"
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(parseInt(e.target.value) || 20)}
              />
            </div>
            <div>
              <label className="label-text">Included Revisions</label>
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

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold py-3 px-8 text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit Quotation for Admin Review'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
