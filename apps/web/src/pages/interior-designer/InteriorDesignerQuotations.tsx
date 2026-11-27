import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  DollarSign,
  Download,
  AlertCircle,
  FileText,
  X,
  Layers,
  Check,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  MessageSquare,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatINR } from '../../lib/utils.js';
import {
  getInteriorQuotations,
  saveInteriorQuotation,
  submitInteriorQuotationToAdmin,
  createInteriorQuotationRevision,
  getInteriorAssignments,
  getInteriorAssignmentById,
  acceptInteriorAssignment,
  declineInteriorAssignment,
  requestAssignmentClarification,
  InteriorDesignerAssignment,
  InteriorQuotation,
  InteriorQuotationItem,
  InteriorQuotationDeliverableFees,
  QuotationPaymentMilestone,
  MASTER_INTERIOR_SERVICES,
  DEFAULT_PAYMENT_SCHEDULE,
} from '../../data/interiorDesignerStore.js';
import { useToast } from '../../context/ToastContext.js';
import { syncChannel } from '../../data/customerStore.js';

export const InteriorDesignerQuotations: React.FC = () => {
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [quotations, setQuotations] = useState<InteriorQuotation[]>(() => getInteriorQuotations());
  const [assignments, setAssignments] = useState<InteriorDesignerAssignment[]>(() => getInteriorAssignments());

  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'BUILDER' | 'UNDER_ADMIN_REVIEW' | 'CUSTOMER_APPROVED' | 'REVISIONS'>('ASSIGNED');
  const [selectedQuote, setSelectedQuote] = useState<InteriorQuotation | null>(null);

  // Assignment action modals
  const [declineModal, setDeclineModal] = useState<{ open: boolean; assignment: InteriorDesignerAssignment | null; reason: string }>({
    open: false,
    assignment: null,
    reason: '',
  });
  const [clarifyModal, setClarifyModal] = useState<{ open: boolean; assignment: InteriorDesignerAssignment | null; note: string }>({
    open: false,
    assignment: null,
    note: '',
  });
  const [viewAssignmentModal, setViewAssignmentModal] = useState<InteriorDesignerAssignment | null>(null);

  const loadData = () => {
    setQuotations(getInteriorQuotations());
    setAssignments(getInteriorAssignments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('interior_quotations_updated', loadData);
    window.addEventListener('interior_assignments_updated', loadData);

    const onSync = (event: MessageEvent) => {
      if (
        event.data?.type === 'INTERIOR_QUOTATIONS_UPDATED' ||
        event.data?.type === 'QUOTATIONS_UPDATED' ||
        event.data?.type === 'PROJECT_REQUESTS_UPDATED' ||
        event.data?.type === 'INTERIOR_ASSIGNMENTS_UPDATED'
      ) {
        loadData();
      }
    };
    if (syncChannel) {
      syncChannel.addEventListener('message', onSync);
    }
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('interior_quotations_updated', loadData);
      window.removeEventListener('interior_assignments_updated', loadData);
      if (syncChannel) {
        syncChannel.removeEventListener('message', onSync);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // BUILDER FORM STATE (Section 7 Step 3)
  // -------------------------------------------------------------
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0');
  const [linkedAssignmentId, setLinkedAssignmentId] = useState<string>('');

  const [builderData, setBuilderData] = useState({
    customerName: 'Kavita Chawla',
    customerPhone: '9811223344',
    projectAddress: 'Penthouse 12B, Central Park Resorts, Sector 48, Gurugram',
    propertyType: '4BHK Penthouse',
    carpetAreaSqFt: 3200,
    roomCount: '4 Bedrooms + Living/Dining + Modular Kitchen',
    preferredStyle: 'Contemporary Luxury with Fluted Charcoal Panels',
    scopeSummary: 'Complete turnkey interior finishing with Italian marble and modular German hardware.',
    targetBudget: 3800000,
    estimatedTimelineWeeks: 10,
    revisionRoundsIncluded: 3,
    validityDays: 30,
    discount: 50000,
    terms: '100% Escrow Milestone Payouts: 25% Advance, 35% Carpentry Shell, 25% Finishes, 15% Final Handover.',
  });

  const [deliverableFees, setDeliverableFees] = useState<InteriorQuotationDeliverableFees>({
    fee2DDesign: 35000,
    fee3DDesign: 50000,
    feeConsultation: 25000,
    feeSiteVisit: 10000,
    feeDesignDevelopment: 20000,
    feeExecutionSupervision: 40000,
    feeOtherProfessional: 10000,
  });

  const [lineItems, setLineItems] = useState<InteriorQuotationItem[]>([
    {
      id: 'item-1',
      roomName: 'Foyer & Living Room',
      serviceCategory: 'False Ceiling Design',
      description: 'Multi-tier Gyproc ceiling with magnetic architectural track lights and COB spots',
      quantity: 750,
      unit: 'sq.ft',
      rate: 220,
      taxPercent: 18,
      amount: 165000,
    },
    {
      id: 'item-2',
      roomName: 'Modular Kitchen',
      serviceCategory: 'Modular Kitchen Design',
      description: 'Acrylic shutters, German Blum tandem box drawers, quartz countertop, and soft-close hinges',
      quantity: 1,
      unit: 'Set',
      rate: 750000,
      taxPercent: 18,
      amount: 750000,
    },
    {
      id: 'item-3',
      roomName: 'Master Bedroom',
      serviceCategory: 'Wardrobe Design',
      description: 'Floor-to-ceiling lacquered glass sliding wardrobe with sensor profile LED lighting',
      quantity: 1,
      unit: 'Set',
      rate: 340000,
      taxPercent: 18,
      amount: 340000,
    },
  ]);

  const [newItem, setNewItem] = useState({
    roomName: 'Living Room',
    serviceCategory: 'Residential Interior Design',
    description: 'Custom Statuario Italian marble TV console with charcoal louver paneling',
    quantity: 1,
    unit: 'Job',
    rate: 280000,
    taxPercent: 18,
  });

  // Check URL query parameters for createFor or revise
  useEffect(() => {
    const createForId = searchParams.get('createFor');
    const reviseQuoteId = searchParams.get('revise');

    if (createForId) {
      const asgn = getInteriorAssignmentById(createForId);
      if (asgn) {
        setLinkedAssignmentId(asgn.id);
        setEditingQuotationId(null);
        setCurrentVersion('1.0');
        setBuilderData((prev) => ({
          ...prev,
          customerName: asgn.customerName,
          customerPhone: asgn.customerPhone || '9811223344',
          projectAddress: `${asgn.projectLocation}, ${asgn.city}`,
          propertyType: asgn.propertyType,
          carpetAreaSqFt: asgn.carpetAreaSqFt,
          roomCount: asgn.roomCount,
          targetBudget: asgn.targetBudget,
          preferredStyle: asgn.requiredServices.join(', '),
          scopeSummary: asgn.additionalInstructions || 'Standard turnkey interior scope.',
        }));
        setActiveTab('BUILDER');
      }
    } else if (reviseQuoteId) {
      const quote = quotations.find((q) => q.id === reviseQuoteId);
      if (quote) {
        setEditingQuotationId(quote.id);
        setLinkedAssignmentId(quote.assignmentId || '');
        const nextMajor = Math.floor(parseFloat(quote.version || '1.0') || 1) + 1;
        setCurrentVersion(`${nextMajor}.0`);
        setBuilderData({
          customerName: quote.customerName,
          customerPhone: quote.customerPhone,
          projectAddress: quote.projectAddress,
          propertyType: quote.propertyType,
          carpetAreaSqFt: quote.carpetAreaSqFt,
          roomCount: quote.roomCount,
          preferredStyle: quote.preferredStyle,
          scopeSummary: quote.scopeSummary || '',
          targetBudget: quote.targetBudget,
          estimatedTimelineWeeks: quote.estimatedTimelineWeeks,
          revisionRoundsIncluded: quote.revisionRoundsIncluded,
          validityDays: quote.validityDays || 30,
          discount: quote.discount,
          terms: quote.terms,
        });
        if (quote.lineItems && quote.lineItems.length > 0) {
          setLineItems(quote.lineItems);
        }
        if (quote.deliverableFees) {
          setDeliverableFees(quote.deliverableFees);
        }
        setActiveTab('BUILDER');
        info(`Loaded revision draft v${nextMajor}.0 for ${quote.quotationNumber}. Please edit and submit.`);
      }
    }
  }, [searchParams, quotations]);

  // Financial Calculations
  const materialsSubtotal = useMemo(() => {
    return lineItems.reduce((acc, curr) => acc + curr.amount, 0);
  }, [lineItems]);

  const totalProfessionalFees = useMemo(() => {
    return Object.values(deliverableFees).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [deliverableFees]);

  const combinedSubtotal = materialsSubtotal + totalProfessionalFees;
  const taxableBase = Math.max(0, combinedSubtotal - builderData.discount);
  const taxAmount = Math.round(taxableBase * 0.18); // 18% GST
  const grandTotal = taxableBase + taxAmount;

  // Milestone schedule distribution
  const paymentSchedule: QuotationPaymentMilestone[] = useMemo(() => {
    return [
      {
        id: 'ms-1',
        stageName: 'Stage 1: Advance Booking & 2D Layout Approval (25%)',
        percentage: 25,
        amount: Math.round(grandTotal * 0.25),
        deliverableDescription: '2D CAD layout, spatial zoning, moodboards, and material swatches sign-off.',
      },
      {
        id: 'ms-2',
        stageName: 'Stage 2: Woodwork Carcass & Frame Approval (35%)',
        percentage: 35,
        amount: Math.round(grandTotal * 0.35),
        deliverableDescription: 'Modular carcass manufacturing, electrical conduit roughing-in, and false ceiling framework.',
      },
      {
        id: 'ms-3',
        stageName: 'Stage 3: Veneer/Laminate Pressing & Lighting (25%)',
        percentage: 25,
        amount: Math.round(grandTotal * 0.25),
        deliverableDescription: 'Lacquered shutters, quartz countertops, false ceiling plastering, and magnetic track lights.',
      },
      {
        id: 'ms-4',
        stageName: 'Stage 4: Snag Clearance & Final Handover (15%)',
        percentage: 15,
        amount: Math.round(grandTotal * 0.15),
        deliverableDescription: 'Deep cleaning, soft furnishings alignment, snag rectification, and handover certificate.',
      },
    ];
  }, [grandTotal]);

  const handleAddLineItem = () => {
    if (!newItem.description.trim() || newItem.rate <= 0) {
      error('Please provide a valid work description and rate.');
      return;
    }
    const itemAmount = Math.round(newItem.quantity * newItem.rate);
    const item: InteriorQuotationItem = {
      id: `item-${Date.now()}`,
      roomName: newItem.roomName,
      serviceCategory: newItem.serviceCategory,
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      rate: Number(newItem.rate),
      taxPercent: Number(newItem.taxPercent),
      amount: itemAmount,
    };
    setLineItems([...lineItems, item]);
    success('Line item added to room-wise BOQ.');
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleSubmitQuotation = (status: 'DRAFT' | 'UNDER_ADMIN_REVIEW') => {
    if (lineItems.length === 0) {
      error('Please add at least one room-wise line item to the quotation.');
      return;
    }

    // Save quotation
    const saved = saveInteriorQuotation({
      id: editingQuotationId || undefined,
      version: currentVersion,
      assignmentId: linkedAssignmentId || undefined,
      customerName: builderData.customerName,
      customerPhone: builderData.customerPhone,
      projectAddress: builderData.projectAddress,
      propertyType: builderData.propertyType,
      carpetAreaSqFt: Number(builderData.carpetAreaSqFt),
      roomCount: builderData.roomCount,
      preferredStyle: builderData.preferredStyle,
      scopeSummary: builderData.scopeSummary,
      targetBudget: Number(builderData.targetBudget),
      lineItems,
      deliverableFees,
      subtotal: materialsSubtotal,
      totalProfessionalFees,
      discount: builderData.discount,
      taxAmount,
      grandTotal,
      estimatedTimelineWeeks: Number(builderData.estimatedTimelineWeeks),
      revisionRoundsIncluded: Number(builderData.revisionRoundsIncluded),
      validityDays: Number(builderData.validityDays),
      paymentSchedule,
      terms: builderData.terms,
      status: status === 'UNDER_ADMIN_REVIEW' ? 'UNDER_ADMIN_REVIEW' : 'DRAFT',
    });

    if (status === 'UNDER_ADMIN_REVIEW') {
      submitInteriorQuotationToAdmin(saved.id);
      success(`Quotation ${saved.quotationNumber} (v${saved.version}) submitted to BuildGhar Admin for review!`);
      setActiveTab('UNDER_ADMIN_REVIEW');
    } else {
      success(`Quotation ${saved.quotationNumber} saved as draft!`);
      setActiveTab('UNDER_ADMIN_REVIEW');
    }

    loadData();
    // Clear search parameters
    setSearchParams({});
    setEditingQuotationId(null);
  };

  const handleStartRevision = (q: InteriorQuotation) => {
    try {
      const revised = createInteriorQuotationRevision(q.id);
      success(`Revision ${revised.version} created for ${revised.quotationNumber}. You can now modify and resubmit.`);
      setSearchParams({ revise: revised.id });
    } catch (e: any) {
      error(e.message || 'Failed to start revision');
    }
  };

  // Assignment Responses
  const handleAcceptAssignment = (asgn: InteriorDesignerAssignment) => {
    try {
      acceptInteriorAssignment(asgn.id);
      success(`Assignment ${asgn.assignmentCode} accepted!`);
      loadData();
    } catch (e: any) {
      error(e.message);
    }
  };

  const handleDeclineAssignment = () => {
    if (!declineModal.assignment) return;
    if (!declineModal.reason.trim()) {
      error('Please select or specify a reason.');
      return;
    }
    try {
      declineInteriorAssignment(declineModal.assignment.id, declineModal.reason);
      success(`Assignment ${declineModal.assignment.assignmentCode} declined.`);
      setDeclineModal({ open: false, assignment: null, reason: '' });
      loadData();
    } catch (e: any) {
      error(e.message);
    }
  };

  const handleClarification = () => {
    if (!clarifyModal.assignment) return;
    if (!clarifyModal.note.trim()) {
      error('Please enter clarification questions.');
      return;
    }
    try {
      requestAssignmentClarification(clarifyModal.assignment.id, clarifyModal.note);
      success(`Clarification note sent to Admin for ${clarifyModal.assignment.assignmentCode}.`);
      setClarifyModal({ open: false, assignment: null, note: '' });
      loadData();
    } catch (e: any) {
      error(e.message);
    }
  };

  // Filtered views
  const submittedQuotes = quotations.filter((q) => q.status === 'UNDER_ADMIN_REVIEW' || q.status === 'SUBMITTED' || q.status === 'APPROVED_BY_ADMIN' || q.status === 'DRAFT');
  const acceptedQuotes = quotations.filter((q) => q.status === 'ACCEPTED');
  const revisionQuotes = quotations.filter((q) => q.status === 'REVISION_REQUESTED');

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-950 text-xs font-black uppercase font-mono mb-1.5 border border-blue-200">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 7 • Complete Quotation Management Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Interior Quotation Desk & BOQ Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Inbound Admin assignments, room-wise scope builder (living, modular kitchen, wardrobes, false ceiling), professional deliverable fees, and versioned audit history.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingQuotationId(null);
            setCurrentVersion('1.0');
            setActiveTab('BUILDER');
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation Builder</span>
        </button>
      </div>

      {/* ---------------- TABS (Matching Section 7) ---------------- */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {[
          { tab: 'ASSIGNED', label: '1. Assigned Requests', count: assignments.length },
          { tab: 'BUILDER', label: '2. Quotation Builder (BOQ)', count: lineItems.length },
          { tab: 'UNDER_ADMIN_REVIEW', label: '3. Under Admin Review', count: submittedQuotes.length },
          { tab: 'CUSTOMER_APPROVED', label: '4. Customer Accepted', count: acceptedQuotes.length },
          { tab: 'REVISIONS', label: '5. Revisions & Versions', count: revisionQuotes.length },
        ].map((t) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(t.tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === t.tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === t.tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSIGNED REQUESTS (Section 7 Steps 1 & 2)                          */}
      {/* ========================================================================= */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-950">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>
                <strong>Admin Assignment Rule:</strong> Homeowner requests are pre-screened and assigned by BuildGhar Admin. Review brief details and click <strong>Accept</strong> or <strong>Decline</strong> before generating quotation.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-900 bg-white px-3 py-1 rounded-full border border-blue-200 shrink-0">
              Strict Centralized Routing
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {assignments.map((asgn) => (
              <div
                key={asgn.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-blue-800 text-xs">{asgn.assignmentCode}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                      {asgn.requestCode || asgn.requestId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        asgn.status === 'NEW'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : asgn.status === 'ACCEPTED_BY_DESIGNER'
                          ? 'bg-emerald-100 text-emerald-800'
                          : asgn.status === 'QUOTATION_SUBMITTED'
                          ? 'bg-purple-100 text-purple-800'
                          : asgn.status === 'CLARIFICATION_REQUESTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {asgn.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-navy-950 text-base">{asgn.propertyType}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{asgn.projectLocation}, {asgn.city}</span>
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{asgn.carpetAreaSqFt} sq.ft</span>
                      <span>•</span>
                      <span className="text-slate-600">{asgn.roomCount}</span>
                    </div>
                  </div>

                  {/* Required Services Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {asgn.requiredServices.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>

                  {/* Additional notes / clarification banner */}
                  {asgn.clarificationNote && (
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                      <strong>Your Clarification Note:</strong> {asgn.clarificationNote}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Homeowner Budget</span>
                    <span className="text-base font-black text-navy-950 font-mono">
                      {formatINR(asgn.targetBudget)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      Deadline: {asgn.deadlineDate}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setViewAssignmentModal(asgn)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {asgn.status === 'NEW' && (
                      <>
                        <button
                          onClick={() => handleAcceptAssignment(asgn)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => setDeclineModal({ open: true, assignment: asgn, reason: '' })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1.5 border border-rose-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => setClarifyModal({ open: true, assignment: asgn, note: '' })}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition flex items-center gap-1.5 border border-amber-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Clarify</span>
                        </button>
                      </>
                    )}

                    {asgn.status === 'ACCEPTED_BY_DESIGNER' && (
                      <button
                        onClick={() => {
                          setSearchParams({ createFor: asgn.id });
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Build Quotation</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETAILED ROOM-WISE QUOTATION BUILDER (Section 7 Step 3)             */}
      {/* ========================================================================= */}
      {activeTab === 'BUILDER' && (
        <div className="space-y-6">
          {/* Builder Top Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black">
                  BOQ
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-navy-950">Detailed Quotation & BOQ Builder</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono font-bold text-xs">
                      Version v{currentVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Room-wise itemized specifications, professional deliverable breakdown, and 18% GST calculation
                  </p>
                </div>
              </div>

              {/* Assignment Link Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Link Assignment:</span>
                <select
                  value={linkedAssignmentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setLinkedAssignmentId(id);
                    const found = assignments.find((a) => a.id === id);
                    if (found) {
                      setBuilderData((prev) => ({
                        ...prev,
                        customerName: found.customerName,
                        projectAddress: `${found.projectLocation}, ${found.city}`,
                        propertyType: found.propertyType,
                        carpetAreaSqFt: found.carpetAreaSqFt,
                        roomCount: found.roomCount,
                        targetBudget: found.targetBudget,
                        preferredStyle: found.requiredServices.join(', '),
                      }));
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950 bg-slate-50"
                >
                  <option value="">Custom Quotation (No link)</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assignmentCode} - {a.propertyType} ({a.customerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Homeowner & Property Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={builderData.customerName}
                  onChange={(e) => setBuilderData({ ...builderData, customerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-bold focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={builderData.customerPhone}
                  onChange={(e) => setBuilderData({ ...builderData, customerPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Property Type</label>
                <input
                  type="text"
                  value={builderData.propertyType}
                  onChange={(e) => setBuilderData({ ...builderData, propertyType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Carpet Area (sq.ft)</label>
                <input
                  type="number"
                  value={builderData.carpetAreaSqFt}
                  onChange={(e) => setBuilderData({ ...builderData, carpetAreaSqFt: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Project Site Address</label>
                <input
                  type="text"
                  value={builderData.projectAddress}
                  onChange={(e) => setBuilderData({ ...builderData, projectAddress: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Room Count Breakdown</label>
                <input
                  type="text"
                  value={builderData.roomCount}
                  onChange={(e) => setBuilderData({ ...builderData, roomCount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-medium focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Budget (INR)</label>
                <input
                  type="number"
                  value={builderData.targetBudget}
                  onChange={(e) => setBuilderData({ ...builderData, targetBudget: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 1. ROOM-WISE SCOPE TABLE */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-navy-950 text-sm">Room-Wise Itemized Scope Table</h3>
                <p className="text-xs text-slate-500">
                  Itemize modular carpentry, false ceiling, marble honing, and wall paneling by room
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {lineItems.length} Items Configured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Room / Space</th>
                    <th className="py-2.5 px-3">Service Category</th>
                    <th className="py-2.5 px-3">Work Description & Specification</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Rate (INR)</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-navy-950">{item.roomName}</td>
                      <td className="py-2.5 px-3 text-blue-800 font-semibold">{item.serviceCategory}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">{item.description}</td>
                      <td className="py-2.5 px-3 font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.unit}</td>
                      <td className="py-2.5 px-3 font-mono">{formatINR(item.rate)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-navy-950">
                        {formatINR(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add New Line Item Row */}
                  <tr className="bg-blue-50/40">
                    <td className="py-2.5 px-3">
                      <select
                        value={newItem.roomName}
                        onChange={(e) => setNewItem({ ...newItem, roomName: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold text-navy-950"
                      >
                        <option value="Living Room">Living Room</option>
                        <option value="Modular Kitchen">Modular Kitchen</option>
                        <option value="Master Bedroom">Master Bedroom</option>
                        <option value="Kids Bedroom">Kids Bedroom</option>
                        <option value="Guest Bedroom">Guest Bedroom</option>
                        <option value="Dining Area">Dining Area</option>
                        <option value="Foyer & Entrance">Foyer & Entrance</option>
                        <option value="Pooja Room">Pooja Room</option>
                        <option value="Balcony & Deck">Balcony & Deck</option>
                        <option value="Master Bathroom">Master Bathroom</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={newItem.serviceCategory}
                        onChange={(e) => setNewItem({ ...newItem, serviceCategory: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium text-navy-950"
                      >
                        {MASTER_INTERIOR_SERVICES.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Statuario marble honing with PU sealer"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs text-navy-950"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-16">
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono text-navy-950"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-20">
                      <select
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs text-navy-950"
                      >
                        <option value="sq.ft">sq.ft</option>
                        <option value="rft">rft</option>
                        <option value="Set">Set</option>
                        <option value="Job">Job</option>
                        <option value="Nos">Nos</option>
                        <option value="L.S.">L.S.</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 w-28">
                      <input
                        type="number"
                        placeholder="Rate"
                        value={newItem.rate}
                        onChange={(e) => setNewItem({ ...newItem, rate: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono text-navy-950"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-navy-950 text-right">
                      {formatINR(newItem.quantity * newItem.rate)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={handleAddLineItem}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500">Materials & Room Scope Subtotal:</span>
              <span className="font-mono font-black text-navy-950 text-sm">{formatINR(materialsSubtotal)}</span>
            </div>
          </div>

          {/* 2. DESIGN DELIVERABLES & PROFESSIONAL CHARGES (Section 7 Step 3) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-navy-950 text-sm">Professional Design Deliverable Fees</h3>
                <p className="text-xs text-slate-500">
                  Section 7 mandatory professional fees breakdown (2D drawings, 3D renders, site visits, supervision)
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Subtotal: {formatINR(totalProfessionalFees)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">2D Design Charges</label>
                <input
                  type="number"
                  value={deliverableFees.fee2DDesign}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, fee2DDesign: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Working CAD & electrical layout</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">3D Design Charges</label>
                <input
                  type="number"
                  value={deliverableFees.fee3DDesign}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, fee3DDesign: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">4K Photorealistic perspectives</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Consultation Charges</label>
                <input
                  type="number"
                  value={deliverableFees.feeConsultation}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, feeConsultation: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Concept, moodboards & themes</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Site Visit Charges</label>
                <input
                  type="number"
                  value={deliverableFees.feeSiteVisit}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, feeSiteVisit: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dimension verification & audit</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Design Development Charges</label>
                <input
                  type="number"
                  value={deliverableFees.feeDesignDevelopment}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, feeDesignDevelopment: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Material schedule & specs</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Execution Supervision Charges</label>
                <input
                  type="number"
                  value={deliverableFees.feeExecutionSupervision}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, feeExecutionSupervision: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">PMC quality sign-offs</span>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Other Professional Charges</label>
                <input
                  type="number"
                  value={deliverableFees.feeOtherProfessional}
                  onChange={(e) => setDeliverableFees({ ...deliverableFees, feeOtherProfessional: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-navy-950 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Documentation, snag reports & handover</span>
              </div>
            </div>
          </div>

          {/* 3. MILESTONE PAYMENT SCHEDULE & TERMS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-navy-950 text-sm">Escrow Milestone Payment Schedule</h3>
                  <p className="text-xs text-slate-500">Auto-calculated 25% / 35% / 25% / 15% progressive releases</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3">
                {paymentSchedule.map((ms) => (
                  <div
                    key={ms.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-navy-950 block">{ms.stageName}</span>
                      <span className="text-[11px] text-slate-500">{ms.deliverableDescription}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-navy-950 text-sm block">
                        {formatINR(ms.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {ms.percentage}% Release
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Terms & Commercial Conditions</label>
                <textarea
                  value={builderData.terms}
                  onChange={(e) => setBuilderData({ ...builderData, terms: e.target.value })}
                  className="w-full h-20 p-3 rounded-xl border border-slate-200 text-xs text-navy-950 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Financial Summary & Action Submissions */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-navy-950 text-sm">Quotation Financial Summary</h3>
                  <span className="text-xs font-mono font-bold text-blue-700">18% GST Compliance</span>
                </div>

                <div className="space-y-2.5 py-3 text-xs border-b border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Materials & Execution Scope:</span>
                    <span className="font-mono font-bold text-navy-950">{formatINR(materialsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Professional Deliverable Fees:</span>
                    <span className="font-mono font-bold text-navy-950">{formatINR(totalProfessionalFees)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Combined Subtotal:</span>
                    <span className="font-mono font-bold text-navy-950">{formatINR(combinedSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Partner Discount:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">-</span>
                      <input
                        type="number"
                        value={builderData.discount}
                        onChange={(e) => setBuilderData({ ...builderData, discount: Number(e.target.value) })}
                        className="w-24 p-1 rounded border border-slate-200 text-right font-mono font-bold text-navy-950 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% on Taxable Value):</span>
                    <span className="font-mono font-bold text-blue-700">{formatINR(taxAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                    <span className="font-black text-navy-950">Grand Total Quotation Amount:</span>
                    <span className="font-mono font-black text-blue-700 text-lg">{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Timeline (Weeks)</label>
                    <input
                      type="number"
                      value={builderData.estimatedTimelineWeeks}
                      onChange={(e) => setBuilderData({ ...builderData, estimatedTimelineWeeks: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Validity (Days)</label>
                    <input
                      type="number"
                      value={builderData.validityDays}
                      onChange={(e) => setBuilderData({ ...builderData, validityDays: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save Draft & Submit to Admin */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmitQuotation('UNDER_ADMIN_REVIEW')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit to BuildGhar Admin for Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitQuotation('DRAFT')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Save as Draft Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: UNDER ADMIN REVIEW (Section 7 Step 4)                               */}
      {/* ========================================================================= */}
      {activeTab === 'UNDER_ADMIN_REVIEW' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs text-purple-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <span>
                <strong>Admin Clearance Stage:</strong> All interior design quotations must be reviewed and approved by BuildGhar Admin before being released to the customer.
              </span>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
              Governance Guard Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {submittedQuotes.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-blue-800 text-xs">{q.quotationNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                      v{q.version || '1.0'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        q.status === 'APPROVED_BY_ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'UNDER_ADMIN_REVIEW' || q.status === 'SUBMITTED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {q.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-navy-950 text-base">{q.propertyType}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{q.projectAddress}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    Client: <span className="font-bold text-navy-950">{q.customerName}</span> • {q.roomCount} • Timeline: {q.estimatedTimelineWeeks} Weeks
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 space-y-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Quotation Value</span>
                    <span className="text-lg font-black text-navy-950 font-mono">{formatINR(q.grandTotal)}</span>
                    <span className="text-[10px] text-slate-500 block">Incl. 18% GST ({formatINR(q.taxAmount)})</span>
                  </div>

                  <div className="flex items-center sm:justify-end gap-2">
                    <button
                      onClick={() => setSelectedQuote(q)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Breakdown</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMER ACCEPTED QUOTATIONS (Section 7 Step 5)                     */}
      {/* ========================================================================= */}
      {activeTab === 'CUSTOMER_APPROVED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Legally Binding Contracts:</strong> Customer accepted quotations are permanently preserved and locked for compliance. These define milestone deliverables and escrow payouts.
              </span>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
              Locked & Immutable
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {acceptedQuotes.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-blue-800 text-xs">{q.quotationNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                      v{q.version || '1.0'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      CUSTOMER ACCEPTED
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 text-[10px] font-mono font-bold">
                      Contract Active
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-navy-950 text-base">{q.propertyType}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{q.projectAddress}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    Homeowner: <span className="font-bold text-navy-950">{q.customerName}</span> ({q.customerPhone}) • {q.roomCount}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 space-y-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Accepted Contract Value</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{formatINR(q.grandTotal)}</span>
                    <span className="text-[10px] text-slate-500 block">4 Escrow Milestones Scheduled</span>
                  </div>

                  <div className="flex items-center sm:justify-end gap-2">
                    <button
                      onClick={() => setSelectedQuote(q)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Contract</span>
                    </button>
                    <Link
                      to="/interior-designer/projects"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Track Site Project</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REVISIONS & VERSION HISTORY (Section 7 Version Control)            */}
      {/* ========================================================================= */}
      {activeTab === 'REVISIONS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Quotation Version Control:</strong> Every modification creates a new major version (v1.0 ➔ v2.0). Review Admin feedback, apply scope corrections, and resubmit.
              </span>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
              Audit Versioning
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {quotations
              .filter((q) => q.status === 'REVISION_REQUESTED' || (q.versionHistory && q.versionHistory.length > 0))
              .map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-800 text-xs">{q.quotationNumber}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold font-mono">
                          Current v{q.version || '1.0'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            q.status === 'REVISION_REQUESTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {q.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Client: <span className="font-bold text-navy-950">{q.customerName}</span> • {q.propertyType}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuote(q)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        Inspect Versions
                      </button>
                      {q.status === 'REVISION_REQUESTED' && (
                        <button
                          onClick={() => handleStartRevision(q)}
                          className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revise to v{Math.floor(parseFloat(q.version || '1.0') || 1) + 1}.0</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Admin Feedback Box */}
                  {q.adminFeedback && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-950 block">Admin Feedback Remarks:</span>
                        <p className="text-amber-900 mt-0.5 leading-relaxed">{q.adminFeedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Version History List */}
                  {q.versionHistory && q.versionHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Archived Version Snapshots
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.versionHistory.map((vh, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-navy-950">v{vh.versionNumber}</span>
                              <span className="text-[10px] text-slate-500 block">{vh.createdAt}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-800">{formatINR(vh.grandTotal)}</span>
                              <span className="text-[10px] text-slate-400 block">{vh.lineItemsCount} items</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT QUOTATION DETAILS & PDF PREVIEW BREAKDOWN                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 text-sm">{selectedQuote.quotationNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono font-bold text-[10px]">
                      Version {selectedQuote.version || '1.0'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedQuote.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedQuote.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-navy-950 mt-0.5">Interior Quotation Specifications & BOQ</h3>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client & Property Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Name</span>
                  <span className="font-bold text-navy-950">{selectedQuote.customerName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Property Type</span>
                  <span className="font-bold text-navy-950">{selectedQuote.propertyType}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Carpet Area / Rooms</span>
                  <span className="font-bold text-navy-950">{selectedQuote.carpetAreaSqFt} sq.ft</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Timeline Weeks</span>
                  <span className="font-bold text-navy-950">{selectedQuote.estimatedTimelineWeeks} Weeks</span>
                </div>
              </div>

              {/* Room-Wise Line Items */}
              <div className="space-y-2">
                <h4 className="font-black text-navy-950 text-xs uppercase tracking-wider">Room-Wise Itemized BOQ</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2 px-3">Room</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Work Description</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Rate</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedQuote.lineItems.map((li) => (
                        <tr key={li.id}>
                          <td className="py-2 px-3 font-bold text-navy-950">{li.roomName}</td>
                          <td className="py-2 px-3 text-blue-800">{li.serviceCategory}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs">{li.description}</td>
                          <td className="py-2 px-3 font-mono">{li.quantity} {li.unit}</td>
                          <td className="py-2 px-3 font-mono">{formatINR(li.rate)}</td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-navy-950">
                            {formatINR(li.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deliverable Fees Breakdown */}
              {selectedQuote.deliverableFees && (
                <div className="space-y-2">
                  <h4 className="font-black text-navy-950 text-xs uppercase tracking-wider">
                    Design Deliverable Fees Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">2D Design Charges</span>
                      <span className="font-mono font-bold text-navy-950">
                        {formatINR(selectedQuote.deliverableFees.fee2DDesign)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">3D Renders Charges</span>
                      <span className="font-mono font-bold text-navy-950">
                        {formatINR(selectedQuote.deliverableFees.fee3DDesign)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Consultation Charges</span>
                      <span className="font-mono font-bold text-navy-950">
                        {formatINR(selectedQuote.deliverableFees.feeConsultation)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Site Visit Charges</span>
                      <span className="font-mono font-bold text-navy-950">
                        {formatINR(selectedQuote.deliverableFees.feeSiteVisit)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Materials & Execution Subtotal:</span>
                  <span className="font-mono font-bold">{formatINR(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Professional Deliverable Fees:</span>
                  <span className="font-mono font-bold">{formatINR(selectedQuote.totalProfessionalFees || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Partner Discount:</span>
                  <span className="font-mono font-bold text-rose-600">-{formatINR(selectedQuote.discount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>18% GST Compliance:</span>
                  <span className="font-mono font-bold text-blue-700">{formatINR(selectedQuote.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200 text-sm">
                  <span className="font-black text-navy-950">Grand Total Amount:</span>
                  <span className="font-mono font-black text-blue-700 text-lg">
                    {formatINR(selectedQuote.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Milestone Schedule */}
              {selectedQuote.paymentSchedule && selectedQuote.paymentSchedule.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-navy-950 text-xs uppercase tracking-wider">
                    Milestone Payout Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedQuote.paymentSchedule.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-navy-950 block">{ms.stageName}</span>
                          <span className="text-[10px] text-slate-500">{ms.deliverableDescription}</span>
                        </div>
                        <span className="font-mono font-bold text-navy-950 shrink-0 ml-2">{formatINR(ms.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 1: VIEW ASSIGNMENT DETAILS ---------------- */}
      <AnimatePresence>
        {viewAssignmentModal && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-black text-blue-700">
                    {viewAssignmentModal.assignmentCode} • {viewAssignmentModal.requestId}
                  </span>
                  <h3 className="text-lg font-black text-navy-950">Assignment Brief & Scope</h3>
                </div>
                <button
                  onClick={() => setViewAssignmentModal(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer Reference</span>
                  <span className="font-bold text-navy-950 text-sm">{viewAssignmentModal.customerName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Target Budget</span>
                  <span className="font-bold text-navy-950 text-sm font-mono">
                    {formatINR(viewAssignmentModal.targetBudget)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Property Type</span>
                  <span className="font-bold text-navy-950">{viewAssignmentModal.propertyType}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Carpet Area / Rooms</span>
                  <span className="font-bold text-navy-950">
                    {viewAssignmentModal.carpetAreaSqFt} sq.ft ({viewAssignmentModal.roomCount})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-slate-500 font-bold block">Project Location:</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                  {viewAssignmentModal.projectLocation}, {viewAssignmentModal.city}
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-slate-500 font-bold block">Required Interior Services:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewAssignmentModal.requiredServices.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              {viewAssignmentModal.additionalInstructions && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-500 font-bold block">Customer Additional Instructions:</span>
                  <p className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 leading-relaxed">
                    {viewAssignmentModal.additionalInstructions}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewAssignmentModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Close
                </button>
                {viewAssignmentModal.status === 'NEW' && (
                  <button
                    onClick={() => {
                      handleAcceptAssignment(viewAssignmentModal);
                      setViewAssignmentModal(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Accept Assignment
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: DECLINE ASSIGNMENT WITH REASON ---------------- */}
      <AnimatePresence>
        {declineModal.open && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-sm">Decline Assignment</h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      {declineModal.assignment?.assignmentCode}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDeclineModal({ open: false, assignment: null, reason: '' })}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Please select or type a reason for declining. Admin will be notified immediately.
              </p>

              <div className="space-y-2 text-xs">
                {[
                  'Outside our current active serviceable radius',
                  'Design capacity fully booked for this month',
                  'Budget expectation differs from luxury specification',
                  'Requested delivery timeline too tight',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDeclineModal({ ...declineModal, reason: r })}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition ${
                      declineModal.reason === r
                        ? 'border-rose-400 bg-rose-50 text-rose-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={declineModal.reason}
                onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                placeholder="Or type custom reason..."
                className="w-full h-20 p-3 rounded-xl border border-slate-200 text-xs text-navy-950 focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setDeclineModal({ open: false, assignment: null, reason: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineAssignment}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Confirm Decline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: REQUEST CLARIFICATION THROUGH ADMIN ---------------- */}
      <AnimatePresence>
        {clarifyModal.open && (
          <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy-950 text-sm">Request Clarification</h3>
                    <span className="font-mono text-[10px] text-slate-400">
                      {clarifyModal.assignment?.assignmentCode} • Via BuildGhar Admin
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setClarifyModal({ open: false, assignment: null, note: '' })}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Submit specific technical questions (e.g. MEP drawings, beam clearances). BuildGhar Admin will verify with the customer and notify you.
              </p>

              <textarea
                value={clarifyModal.note}
                onChange={(e) => setClarifyModal({ ...clarifyModal, note: e.target.value })}
                placeholder="Enter technical query or drawing requirement..."
                className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs text-navy-950 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setClarifyModal({ open: false, assignment: null, note: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClarification}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Admin</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
