import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  getInteriorDesignerAccounts,
  getInteriorDesignerByPhone,
  saveInteriorDesignerAccount,
  updateInteriorDesignerStatus,
  deleteInteriorDesignerAccount,
  clearAllInteriorDesigners,
  getInteriorQuotations,
  saveInteriorQuotation,
  submitInteriorQuotationToAdmin,
  createInteriorQuotationRevision,
  adminReviewInteriorQuotation,
  adminForwardInteriorQuotationToCustomer,
  customerAcceptInteriorQuotation,
  getInteriorAssignments,
  acceptInteriorAssignment,
  declineInteriorAssignment,
  requestAssignmentClarification,
  getInteriorBookings,
  saveInteriorBooking,
  getInteriorProjects,
  getInteriorProjectById,
  saveInteriorProject,
  getInteriorDesignAssets,
  saveInteriorDesignAsset,
  submitDesignAssetToAdmin,
  adminReviewDesignAsset,
  customerReviewDesignAsset,
  createDesignAssetRevision,
  adminApproveAndForwardInteriorDesign,
  adminRequestInteriorDesignRevision,
  adminRejectInteriorDesign,
  adminForwardCustomerRevisionToInteriorDesigner,
  getInteriorBOQItems,
  saveInteriorBOQItem,
  getBOQProjectSummary,
  submitBOQToAdmin,
  adminReviewBOQ,
  adminForwardBOQToCustomer,
  customerReviewBOQ,
  getInteriorSiteVisits,
  saveInteriorSiteVisit,
  requestSiteVisitRescheduleThroughAdmin,
  submitSiteVisitReportToAdmin,
  getSiteVisitReports,
  getInteriorCoordinationRequests,
  createCoordinationRequestViaAdmin,
  adminMediateCoordinationRequest,
  getInteriorSnagItems,
  saveInteriorSnagItem,
  resolveInteriorSnagItem,
  getInteriorProjectMilestones,
  saveInteriorMilestone,
  submitMilestoneToAdmin,
  adminReviewMilestone,
  customerReviewMilestone,
  adminFinalVerifyMilestone,
  calculateProjectMilestoneProgress,
  adminAuthorizeMilestonePaymentRequest,
  customerPayMilestoneInvoice,
  backendVerifyPayment,
  adminApprovePayout,
  adminRejectPayout,
  adminHoldPayout,
  createPayoutRequest,
  getInteriorPayouts,
  getInteriorLedger,
  recordLedgerEntry,
  createLedgerReversalEntry,
  processPaymentWebhook,
  getInteriorReviews,
  saveInteriorReview,
  adminForwardReviewToDesigner,
  getInteriorDesignerAnalytics,
  generateAnalyticsCSV,
  getInteriorNotifications,
  markInteriorNotificationRead,
  markAllInteriorNotificationsRead,
  dispatchInteriorNotification,
  ALL_INTERIOR_SPECIALIZATIONS,
} from '../data/interiorDesignerStore.js';
import {
  getCommunicationThreads,
  getCommunicationThreadById,
  saveCommunicationThread,
  sendRoutedMessage,
  adminForwardMessage,
  getVisibleMessagesForRole,
  addAdminInternalNote,
  getComplaintDisputes,
  saveComplaintDispute,
  assignDisputeOfficer,
  toggleDisputePayoutHold,
  canCloseDispute,
  closeDisputeWithAudit,
  resolveDispute,
} from '../data/communicationDisputeStore.js';

// Mock localStorage for node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
};

describe('Interior Designer Panel & Store Tests', () => {
  beforeAll(() => {
    (globalThis as any).localStorage = localStorageMock;
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loads 4 realistic pre-seeded interior designer test fixtures', () => {
    const accounts = getInteriorDesignerAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(4);

    const pooja = getInteriorDesignerByPhone('9899112233');
    expect(pooja).toBeDefined();
    expect(pooja?.accountStatus).toBe('APPROVED');
    expect(pooja?.businessName).toBe('Pooja Mehra Luxury Living & Interiors');
    expect(pooja?.isVerified).toBe(true);

    const kunal = getInteriorDesignerByPhone('9811445566');
    expect(kunal?.accountStatus).toBe('PENDING_APPROVAL');

    const shreya = getInteriorDesignerByPhone('9822334488');
    expect(shreya?.accountStatus).toBe('DOCUMENTS_REQUIRED');

    const rohit = getInteriorDesignerByPhone('9833556677');
    expect(rohit?.accountStatus).toBe('SUSPENDED');
  });

  it('contains all 23 Master Interior Design Services (Section 3 Step D)', () => {
    expect(ALL_INTERIOR_SPECIALIZATIONS.length).toBe(23);
    const specNames = ALL_INTERIOR_SPECIALIZATIONS.map((s) => s.name);
    expect(specNames).toContain('Residential Interior Design');
    expect(specNames).toContain('Living Room Design');
    expect(specNames).toContain('Modular Kitchen Design');
    expect(specNames).toContain('False Ceiling Design');
    expect(specNames).toContain('3D Interior Design');
    expect(specNames).toContain('Site Supervision');
  });

  it('allows registering a new interior designer with initial PROFILE_INCOMPLETE status', () => {
    const created = saveInteriorDesignerAccount({
      name: 'Ritu Kapoor',
      phone: '9877001122',
      email: 'ritu@ritudesigns.in',
      accountStatus: 'PROFILE_INCOMPLETE',
    });

    expect(created.id).toBeDefined();
    expect(created.applicationId).toMatch(/^BG-ID-/);
    expect(created.accountStatus).toBe('PROFILE_INCOMPLETE');

    const retrieved = getInteriorDesignerByPhone('9877001122');
    expect(retrieved?.name).toBe('Ritu Kapoor');
  });

  it('admin review desk can approve or request documents with remarks', () => {
    const updated = updateInteriorDesignerStatus(
      'id-102',
      'APPROVED',
      'Credentials and portfolio verified.',
      'Chief Governance Lead'
    );
    expect(updated?.accountStatus).toBe('APPROVED');
    expect(updated?.isVerified).toBe(true);
    expect(updated?.adminReviewRemarks).toBe('Credentials and portfolio verified.');
  });

  // -------------------------------------------------------------
  // PHASE 3 SPECIFIC TESTS: ASSIGNMENTS & QUOTATIONS WORKFLOW
  // -------------------------------------------------------------
  it('loads and manages inbound Admin assignments (Section 7 Steps 1 & 2)', () => {
    const assignments = getInteriorAssignments();
    expect(assignments.length).toBeGreaterThanOrEqual(4);

    const newAsgn = assignments.find((a) => a.status === 'NEW');
    expect(newAsgn).toBeDefined();
    expect(newAsgn?.carpetAreaSqFt).toBeGreaterThan(0);
    expect(newAsgn?.requiredServices.length).toBeGreaterThan(0);

    // Test designer accepting assignment
    const accepted = acceptInteriorAssignment(newAsgn!.id);
    expect(accepted.status).toBe('ACCEPTED_BY_DESIGNER');
    expect(accepted.respondedAt).toBeDefined();
  });

  it('allows designer to decline assignment with a transparent reason', () => {
    const assignments = getInteriorAssignments();
    const target = assignments[0];
    const declined = declineInteriorAssignment(target.id, 'Workload fully committed for this quarter');
    expect(declined.status).toBe('DECLINED_BY_DESIGNER');
    expect(declined.declineReason).toBe('Workload fully committed for this quarter');
  });

  it('allows designer to request technical clarification through Admin', () => {
    const assignments = getInteriorAssignments();
    const target = assignments[1];
    const clarified = requestAssignmentClarification(target.id, 'Need ceiling height section drawing from builder');
    expect(clarified.status).toBe('CLARIFICATION_REQUESTED');
    expect(clarified.clarificationNote).toBe('Need ceiling height section drawing from builder');
  });

  it('generates itemized quotation with room-wise scope, deliverable fees, and 18% GST', () => {
    const created = saveInteriorQuotation({
      customerName: 'Tarun Varma',
      projectAddress: 'The Magnolias, Golf Links, Gurugram',
      propertyType: '4BHK Duplex',
      carpetAreaSqFt: 3500,
      roomCount: '4 BHK',
      lineItems: [
        {
          id: 'li-t1',
          roomName: 'Living Room',
          serviceCategory: 'Living Room Design',
          description: 'Italian Statuario Marble Cladding',
          quantity: 400,
          unit: 'sq.ft',
          rate: 500,
          taxPercent: 18,
          amount: 200000,
        },
        {
          id: 'li-t2',
          roomName: 'Modular Kitchen',
          serviceCategory: 'Modular Kitchen Design',
          description: 'Acrylic Finish with Blum Tandembox',
          quantity: 1,
          unit: 'Set',
          rate: 600000,
          taxPercent: 18,
          amount: 600000,
        },
      ],
      deliverableFees: {
        fee2DDesign: 30000,
        fee3DDesign: 45000,
        feeConsultation: 15000,
        feeSiteVisit: 5000,
        feeDesignDevelopment: 15000,
        feeExecutionSupervision: 35000,
        feeOtherProfessional: 5000,
      },
      discount: 20000,
      status: 'DRAFT',
    });

    expect(created.id).toBeDefined();
    expect(created.quotationNumber).toMatch(/^BG-Q-INT-/);
    expect(created.version).toBe('1.0');
    expect(created.subtotal).toBe(800000);
    expect(created.totalProfessionalFees).toBe(150000);
    expect(created.taxAmount).toBe(167400);
    expect(created.grandTotal).toBe(1097400);
    expect(created.paymentSchedule?.length).toBe(4);
    expect(created.status).toBe('DRAFT');
  });

  it('routes quotation through Admin review, revision requests, and version control (Section 7)', () => {
    const quotes = getInteriorQuotations();
    const draftQuote = quotes.find((q) => q.status === 'DRAFT') || quotes[0];
    const submitted = submitInteriorQuotationToAdmin(draftQuote.id, 'Ready for admin pricing review');
    expect(submitted.status).toBe('UNDER_ADMIN_REVIEW');

    const revisionReq = adminReviewInteriorQuotation(
      submitted.id,
      'REQUEST_REVISION',
      'Please bifurcate 3D render charges and adjust kitchen cabinet rate',
      'Internal: home owner has budget constraint'
    );
    expect(revisionReq.status).toBe('REVISION_REQUESTED');
    expect(revisionReq.adminFeedback).toContain('Please bifurcate 3D render charges');

    const revisionV2 = createInteriorQuotationRevision(revisionReq.id);
    expect(revisionV2.version).toBe('2.0');
    expect(revisionV2.versionHistory?.length).toBeGreaterThanOrEqual(1);
    expect(revisionV2.versionHistory?.[0].versionNumber).toBe('1.0');
    expect(revisionV2.status).toBe('DRAFT');

    submitInteriorQuotationToAdmin(revisionV2.id);

    adminReviewInteriorQuotation(revisionV2.id, 'APPROVE');
    const forwarded = adminForwardInteriorQuotationToCustomer(revisionV2.id);
    expect(forwarded.status).toBe('SENT_TO_CUSTOMER');

    const accepted = customerAcceptInteriorQuotation(revisionV2.id);
    expect(accepted.status).toBe('ACCEPTED');
  });

  // -------------------------------------------------------------
  // PHASE 4 SPECIFIC TESTS: SHARED PROJECT & DESIGN STUDIO
  // -------------------------------------------------------------
  it('manages shared projects with Section 8 statuses, design briefs, and milestone tracking', () => {
    const projects = getInteriorProjects();
    expect(projects.length).toBeGreaterThanOrEqual(3);

    const crestProj = projects.find((p) => p.projectId === 'BG-2026-0002');
    expect(crestProj).toBeDefined();
    expect(crestProj?.status).toBe('EXECUTION_IN_PROGRESS');
    expect(crestProj?.overallProgressPercent).toBe(45);
    expect(crestProj?.totalContractValue).toBeGreaterThan(0);
    expect(crestProj?.milestones.length).toBeGreaterThanOrEqual(4);

    // Section 9A Design Brief Verification
    expect(crestProj?.designBrief).toBeDefined();
    expect(crestProj?.designBrief?.designStyle).toContain('Contemporary Luxury');
    expect(crestProj?.designBrief?.materialPreferences).toContain('Statuario Marble');
    expect(crestProj?.designBrief?.roomBreakdown.length).toBeGreaterThanOrEqual(2);
    expect(crestProj?.designBrief?.adminApprovalStatus).toBe('APPROVED_BY_ADMIN');

    // Section 8 Official Documents
    expect(crestProj?.documents?.length).toBeGreaterThanOrEqual(2);
    expect(crestProj?.assignedArchitect).toBeDefined();
  });

  it('supports creating and updating shared projects with Section 8 workflow constraints', () => {
    const created = saveInteriorProject({
      projectId: 'BG-2026-0099',
      title: 'Magnolia Greens Master Suite',
      customerName: 'Rohit Khandelwal',
      customerPhone: '9811009988',
      location: 'Magnolia Greens, Sector 50, Gurugram',
      propertyType: 'Penthouse',
      carpetAreaSqFt: 2900,
      status: 'PENDING_KICKOFF',
      currentStage: 'INITIAL_CONSULTATION',
      overallProgressPercent: 5,
      totalContractValue: 1800000,
      paidAmount: 0,
      pendingEscrowAmount: 1800000,
      milestones: [
        { id: 'm-991', name: 'Concept & Measurement', weightPercent: 25, status: 'PENDING', dueDate: '2026-12-15', payoutAmount: 450000, escrowStatus: 'LOCKED_IN_ESCROW' },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.projectId).toBe('BG-2026-0099');
    expect(created.status).toBe('PENDING_KICKOFF');

    const fetched = getInteriorProjectById(created.id);
    expect(fetched?.title).toBe('Magnolia Greens Master Suite');
  });

  it('manages Design Studio workspace across Space Planning, 2D Working, 3D Renders, and Material Palettes (Section 9B-9E)', () => {
    const assets = getInteriorDesignAssets();
    expect(assets.length).toBeGreaterThanOrEqual(6);

    const categories = assets.map((a) => a.category);
    expect(categories).toContain('SPACE_PLANNING');
    expect(categories).toContain('LAYOUT_2D');
    expect(categories).toContain('VISUALIZATION_3D');
    expect(categories).toContain('MATERIAL_FINISHES');

    const renderAsset = assets.find((a) => a.category === 'VISUALIZATION_3D');
    expect(renderAsset?.documentId).toMatch(/^BG-DOC-INT-/);
    expect(renderAsset?.version).toBeDefined();
    expect(renderAsset?.dimensionsOrSpecs).toBeDefined();
  });

  it('routes design uploads through Admin review and manages version control (Section 9F)', () => {
    // 1. Upload new design asset
    const newAsset = saveInteriorDesignAsset({
      projectId: 'prj-int-1',
      projectName: 'DLF The Crest Penthouse Oasis',
      title: 'Kids Bedroom 3D Isometric View',
      category: 'VISUALIZATION_3D',
      roomName: 'Kids Bedroom',
      version: 'v1.0',
      fileUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0',
      dimensionsOrSpecs: '4K V-Ray Render',
    });
    expect(newAsset.adminReviewStatus).toBe('PENDING_ADMIN_REVIEW');

    // 2. Admin requests revision with feedback
    const withFeedback = adminReviewDesignAsset(
      newAsset.id,
      'REQUEST_REVISION',
      'Please change study table orientation away from window glare'
    );
    expect(withFeedback.adminReviewStatus).toBe('REVISION_REQUESTED');
    expect(withFeedback.adminFeedback).toContain('study table orientation');

    // 3. Designer creates revision v2.0
    const revised = createDesignAssetRevision(
      withFeedback.id,
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0-v2',
      '4K V-Ray Render • Corrected study orientation'
    );
    expect(revised.version).toBe('v2.0');
    expect(revised.versionHistory?.length).toBe(1);
    expect(revised.versionHistory?.[0].version).toBe('v1.0');
    expect(revised.adminReviewStatus).toBe('PENDING_ADMIN_REVIEW');

    // 4. Admin approves revised design
    const adminApproved = adminReviewDesignAsset(revised.id, 'APPROVE');
    expect(adminApproved.adminReviewStatus).toBe('APPROVED_BY_ADMIN');
    expect(adminApproved.clientApprovalStatus).toBe('PENDING_CUSTOMER_REVIEW');

    // 5. Customer approves design
    const customerApproved = customerReviewDesignAsset(revised.id, 'APPROVE');
    expect(customerApproved.clientApprovalStatus).toBe('APPROVED');
    expect(customerApproved.isLatestApproved).toBe(true);
  });

  it('implements Mandatory Section 23 Test 4: Design approval and customer revision workflow', () => {
    // Step 1: Interior Designer uploads 2D/3D design
    const initialAsset = saveInteriorDesignAsset({
      projectId: 'BG-2026-0002',
      projectName: 'DLF Crest Penthouse',
      title: 'Italian Modular Kitchen 3D Visualizer',
      category: 'VISUALIZATION_3D',
      roomName: 'Modular Kitchen',
      version: 'v1.0',
      fileUrl: 'https://images.unsplash.com/photo-kitchen-v1',
      dimensionsOrSpecs: '4K Photorealistic • Quartz Island Counter',
      uploadedBy: 'Ar. Pooja Mehra',
    });
    expect(initialAsset.adminReviewStatus).toBe('PENDING_ADMIN_REVIEW');
    expect(initialAsset.forwardedToCustomer).toBeFalsy();

    // Step 2: Admin reviews & approves design, forwarding to customer
    const forwardedAsset = adminApproveAndForwardInteriorDesign(
      initialAsset.id,
      'Aesthetic and MEP compliance approved. Forwarding to homeowner.'
    );
    expect(forwardedAsset.adminReviewStatus).toBe('APPROVED_BY_ADMIN');
    expect(forwardedAsset.forwardedToCustomer).toBe(true);
    expect(forwardedAsset.clientApprovalStatus).toBe('PENDING_CUSTOMER_REVIEW');

    // Step 3: Customer receives approved design & requests revision
    const customerRevision = customerReviewDesignAsset(
      forwardedAsset.id,
      'REQUEST_REVISION',
      'Please change island counter from quartz to black Statuario marble and add brass handles.'
    );
    expect(customerRevision.clientApprovalStatus).toBe('CHANGES_REQUESTED');
    expect(customerRevision.adminReviewStatus).toBe('CUSTOMER_REVISION_PENDING_ADMIN_FORWARD');
    expect(customerRevision.clientFeedback).toContain('black Statuario marble');

    // Step 4: Admin reviews customer revision & forwards directives to designer
    const forwardedToDesigner = adminForwardCustomerRevisionToInteriorDesigner(
      customerRevision.id,
      'Admin Directive: Revise kitchen counter finish to black Statuario marble with brass hardware schedule.'
    );
    expect(forwardedToDesigner.adminReviewStatus).toBe('REVISION_REQUESTED');
    expect(forwardedToDesigner.adminForwardInstructions).toContain('brass hardware schedule');
    expect(forwardedToDesigner.forwardedToCustomer).toBe(false);

    // Step 5: Interior Designer uploads revised version (v2.0)
    const revisedAsset = createDesignAssetRevision(
      forwardedToDesigner.id,
      'https://images.unsplash.com/photo-kitchen-v2',
      '4K Photorealistic • Black Statuario Marble Island • Brushed Brass Handles'
    );
    expect(revisedAsset.version).toBe('v2.0');
    expect(revisedAsset.versionHistory?.length).toBe(1);
    expect(revisedAsset.versionHistory?.[0].version).toBe('v1.0');
    expect(revisedAsset.adminReviewStatus).toBe('PENDING_ADMIN_REVIEW');
    expect(revisedAsset.forwardedToCustomer).toBe(false);

    // Step 6: Admin reviews revised version & approves
    const adminApprovedV2 = adminApproveAndForwardInteriorDesign(
      revisedAsset.id,
      'Black Statuario specs verified. Forwarding v2.0 to homeowner.'
    );
    expect(adminApprovedV2.adminReviewStatus).toBe('APPROVED_BY_ADMIN');
    expect(adminApprovedV2.forwardedToCustomer).toBe(true);

    // Step 7: Customer gives final sign-off
    const finalSignOff = customerReviewDesignAsset(
      adminApprovedV2.id,
      'APPROVE',
      'Looks magnificent! Approved.'
    );
    expect(finalSignOff.clientApprovalStatus).toBe('APPROVED');
    expect(finalSignOff.isLatestApproved).toBe(true);
    expect(finalSignOff.version).toBe('v2.0');
  });

  it('manages bookings linked to accepted quotations', () => {
    const bookings = getInteriorBookings();
    expect(bookings.length).toBeGreaterThanOrEqual(2);

    const firstBooking = bookings[0];
    expect(firstBooking.bookingAmount).toBeGreaterThan(0);
    expect(firstBooking.advancePaymentStatus).toBe('PAID');
  });

  it('calculates BOQ items material and installation rates correctly', () => {
    const boqItems = getInteriorBOQItems('prj-int-1');
    expect(boqItems.length).toBeGreaterThanOrEqual(4);

    const firstItem = boqItems[0];
    expect(firstItem.quantity).toBe(12);
    expect(firstItem.unitRate).toBe(9400);
    expect(firstItem.totalAmount).toBeGreaterThan(100000);
  });

  it('deletes an individual interior designer account', () => {
    const created = saveInteriorDesignerAccount({
      name: 'Designer To Delete',
      phone: '9811223344',
      email: 'delete@example.com',
    });
    expect(getInteriorDesignerByPhone('9811223344')).toBeDefined();

    const ok = deleteInteriorDesignerAccount(created.id);
    expect(ok).toBe(true);
    expect(getInteriorDesignerByPhone('9811223344')).toBeNull();
  });

  it('clears all interior designer accounts cleanly without crashing', () => {
    saveInteriorDesignerAccount({ name: 'One', phone: '9900112233' });
    saveInteriorDesignerAccount({ name: 'Two', phone: '9900112244' });
    clearAllInteriorDesigners();
    const stored = JSON.parse(localStorage.getItem('gd_interior_designer_accounts_v1') || '[]');
    expect(stored).toEqual([]);
  });

  it('ensures zero dummy defaults when registering a new designer with partial fields', () => {
    const designer = saveInteriorDesignerAccount({
      name: 'Real User',
      phone: '9876543210',
    });
    expect(designer.state).toBe('');
    expect(designer.city).toBe('');
    expect(designer.specializations).toEqual([]);
    expect(designer.yearsOfExperience).toBe(0);
    expect(designer.businessDescription).toBe('');
  });

  it('implements Mandatory Section 23 Test 5: BOQ preparation, Admin review, and Customer acceptance', () => {
    const projectId = 'BG-2026-TEST-BOQ';

    // Step 1: Interior Designer prepares itemized BOQ
    const item1 = saveInteriorBOQItem({
      projectId,
      roomName: 'Master Bedroom',
      category: 'WARDROBE',
      itemName: 'Floor-to-Ceiling Acrylic Wardrobe Carcass',
      specification: '18mm BWP Marine Plywood • Hafele Soft Close Hinges',
      quantity: 1,
      unit: 'Set',
      unitRate: 185000,
      labourCost: 25000,
      installationCost: 10000,
      costStage: 'PRELIMINARY_ESTIMATE',
      status: 'DRAFT',
    });
    expect(item1.id).toBeDefined();
    expect(item1.totalAmount).toBeGreaterThan(200000);

    const item2 = saveInteriorBOQItem({
      projectId,
      roomName: 'Living Room',
      category: 'FALSE_CEILING',
      itemName: 'Perimeter Cove Gyproc False Ceiling with Pelmet',
      specification: 'Gyproc 12.5mm moisture resistant board • GI Framing',
      quantity: 450,
      unit: 'sq.ft',
      unitRate: 140,
      labourCost: 15000,
      installationCost: 8000,
      costStage: 'PRELIMINARY_ESTIMATE',
      status: 'DRAFT',
    });
    expect(item2.totalAmount).toBeGreaterThan(80000);

    // Step 2: Interior Designer submits BOQ to Admin
    const submittedSummary = submitBOQToAdmin(projectId, 'BOQ prepared per approved 2D drawings v2.0.');
    expect(submittedSummary.status).toBe('SUBMITTED_TO_ADMIN');
    expect(submittedSummary.preliminaryEstimateTotal).toBe(item1.totalAmount + item2.totalAmount);

    // Step 3: Admin reviews BOQ and approves
    const adminApproved = adminReviewBOQ(
      projectId,
      'APPROVE',
      'Material rates and labor estimates cross-checked with BuildGhar standard index.'
    );
    expect(adminApproved.status).toBe('APPROVED_BY_ADMIN');
    expect(adminApproved.costStage).toBe('APPROVED_BOQ');

    // Step 4: Approved BOQ forwarded to Customer
    const forwardedToCustomer = adminForwardBOQToCustomer(
      projectId,
      'Approved BOQ forwarded to homeowner for formal budget and contractual sign-off.'
    );
    expect(forwardedToCustomer.status).toBe('FORWARDED_TO_CUSTOMER');

    // Step 5: Customer accepts BOQ
    const acceptedSummary = customerReviewBOQ(
      projectId,
      'ACCEPT',
      'All room-wise items and material specs look good. Approved for execution.'
    );
    expect(acceptedSummary.status).toBe('CUSTOMER_ACCEPTED');
    expect(acceptedSummary.costStage).toBe('BINDING_CONTRACT_AMOUNT');
    expect(acceptedSummary.clientFeedback).toContain('Approved for execution');
  });

  it('manages Section 11 Site Visits: rescheduling and audit report submission to Admin', () => {
    const projectId = 'BG-2026-TEST-SITE';

    // 1. Log Site Visit
    const visit = saveInteriorSiteVisit({
      projectId,
      projectName: 'DLF Crest Suite',
      scheduledDate: '2026-12-05',
      timeSlot: '11:00 AM - 01:00 PM',
      purpose: 'Modular kitchen carcass alignment and countertop measurement verification',
      siteLocation: 'Tower 4, Flat 1802',
      status: 'SCHEDULED',
    });
    expect(visit.id).toBeDefined();
    expect(visit.status).toBe('SCHEDULED');

    // 2. Request Reschedule via Admin
    const rescheduled = requestSiteVisitRescheduleThroughAdmin(
      visit.id,
      '2026-12-08',
      'Civil plaster work not fully cured. Delay needed for accurate laser survey.'
    );
    expect(rescheduled.status).toBe('RESCHEDULE_REQUESTED');
    expect(rescheduled.rescheduleReason).toContain('2026-12-08');

    // 3. Submit Site Visit Report to Admin
    const report = submitSiteVisitReportToAdmin({
      projectId,
      projectName: 'DLF Crest Suite',
      visitDate: '2026-12-08',
      siteLocation: 'Tower 4, Flat 1802',
      roomMeasurements: 'Living room 5.8m x 4.2m, ceiling height 3.1m clear',
      existingSiteCondition: 'Plaster cured, electrical conduits laid per MEP v1.0',
      designRecommendations: 'Offset island counter by 150mm for unhindered fridge swing',
      issuesFound: 'Drop beam level lower by 40mm in balcony entry',
      requiredMaterials: 'Dr. Fixit damp primer • 250 sq.ft Gyproc boards',
      submittedBy: 'Ar. Pooja Mehra',
    });
    expect(report.id).toMatch(/^BG-SVR-/);
    expect(report.status).toBe('SUBMITTED_TO_ADMIN');
    expect(report.designRecommendations).toContain('Offset island counter');

    const allReports = getSiteVisitReports(projectId);
    expect(allReports.some((r) => r.id === report.id)).toBe(true);
  });

  it('manages Section 12 Multi-Disciplinary Coordination and Snags via Admin mediation', () => {
    const projectId = 'BG-2026-TEST-COORD';

    // 1. Create coordination request via Admin
    const req = createCoordinationRequestViaAdmin({
      projectId,
      projectName: 'The Crest Penthouse',
      targetDiscipline: 'ARCHITECT',
      type: 'ARCHITECT_DRAWING_REQUEST',
      title: 'Sanctioned Column Grid & Beam Drop Levels',
      description: 'Require approved structural beam elevation drawing to align false ceiling pelmet drops.',
      requestedBy: 'Ar. Pooja Mehra',
    });
    expect(req.id).toMatch(/^BG-CRD-INT-/);
    expect(req.adminMediationStatus).toBe('PENDING_ADMIN_REVIEW');

    // 2. Admin forwards to Architect
    const forwarded = adminMediateCoordinationRequest(
      req.id,
      'FORWARD',
      'Forwarded to Ar. Rajesh Verma for structural CAD DWG'
    );
    expect(forwarded.adminMediationStatus).toBe('ADMIN_FORWARDED');

    // 3. Admin resolves request with comments
    const resolved = adminMediateCoordinationRequest(
      req.id,
      'RESOLVE',
      'Architect provided beam section rev-B. Pelmet clear height confirmed at 2.95m.'
    );
    expect(resolved.adminMediationStatus).toBe('RESOLVED_BY_ADMIN');
    expect(resolved.resolvedAt).toBeDefined();

    // 4. Report & Resolve Snag
    const snag = saveInteriorSnagItem({
      projectId,
      roomName: 'Kitchen',
      category: 'CARPENTRY',
      description: 'Soft-close tandem runner sticking on bottom drawer',
      severity: 'MEDIUM',
      assignedContractor: 'Lead Carpenter (Mohan Sharma)',
    });
    expect(snag.id).toBeDefined();
    expect(snag.status).toBe('OPEN');

    const resolvedSnag = resolveInteriorSnagItem(snag.id);
    expect(resolvedSnag.status).toBe('RESOLVED');
    expect(resolvedSnag.resolvedDate).toBeDefined();
  });

  it('calculates 3-tier milestone progress using configured weights per Section 13', () => {
    const projectId = 'prj-int-1';
    const progress = calculateProjectMilestoneProgress(projectId);

    // Section 13: Progress must be calculated using configured milestone/task weights, not a simple average.
    expect(progress.designerReportedProgress).toBeGreaterThan(0);
    expect(progress.adminVerifiedProgress).toBeGreaterThan(0);
    expect(progress.customerApprovedProgress).toBeGreaterThan(0);

    // Designer reported includes in-progress work; Admin verified includes verified deliverables; Customer approved is signed off
    expect(progress.designerReportedProgress).toBeGreaterThanOrEqual(progress.adminVerifiedProgress);
    expect(progress.adminVerifiedProgress).toBeGreaterThanOrEqual(progress.customerApprovedProgress);
    expect(progress.totalWeight).toBe(100);
  });

  it('implements Mandatory Section 23 Test 6: Milestone submission, Admin review, Customer approval, and Payout authorization', () => {
    const projectId = 'BG-2026-TEST-MS-PAY';

    // Step 1: Interior Designer creates and submits milestone deliverable
    const milestone = saveInteriorMilestone({
      projectId,
      projectName: 'The Camellias Luxury Suite',
      order: 1,
      name: 'Stage 1: Advance Booking & Space Planning Approval',
      description: 'Laser survey measurements, furniture concept layout, and partition elevations.',
      weightPercent: 20,
      targetAmount: 250000,
      dueDate: '2026-12-15',
      status: 'IN_PROGRESS',
      deliverables: [
        { id: 'del-t1', title: '2D Furniture Spatial Plan DWG', category: 'LAYOUT_2D', status: 'UPLOADED' },
        { id: 'del-t2', title: 'Site Laser Measurement Audit', category: 'SITE_REPORT', status: 'UPLOADED' },
      ],
    });
    expect(milestone.id).toMatch(/^BG-MS-INT-/);

    // Designer submits completion evidence to Admin
    const submitted = submitMilestoneToAdmin(milestone.id, {
      completionDescription: 'Spatial 2D plan finalized and laser measurements matched with site conditions.',
      completionDate: '2026-11-27',
      supportingFiles: ['https://buildghar.com/docs/spatial-plan-v1.pdf'],
      photos: ['https://images.unsplash.com/photo-site-t1'],
      requestedAmount: 250000,
    });
    expect(submitted.status).toBe('SUBMITTED_TO_ADMIN');
    expect(submitted.submissionDetails?.requestedAmount).toBe(250000);

    // Step 2: Admin verifies deliverables and approves for customer review
    const adminForwarded = adminReviewMilestone(
      submitted.id,
      'FORWARD_TO_CUSTOMER',
      'Engineering and spatial clearance verified per NBC norms. Forwarded to customer.'
    );
    expect(adminForwarded.status).toBe('FORWARDED_TO_CUSTOMER');
    expect(adminForwarded.adminReview?.status).toBe('FORWARDED_TO_CUSTOMER');

    // Step 3: Customer approves milestone deliverables
    const customerApproved = customerReviewMilestone(
      adminForwarded.id,
      'APPROVE',
      'Space planning and room dimensions approved. Proceed with 3D views.'
    );
    expect(customerApproved.status).toBe('CUSTOMER_APPROVED');
    expect(customerApproved.customerReview?.status).toBe('APPROVED');

    // Admin performs final verification to close the deliverable stage
    const verifiedCompleted = adminFinalVerifyMilestone(
      customerApproved.id,
      'Customer sign-off logged. Deliverables archived. Milestone eligible for payment.'
    );
    expect(verifiedCompleted.status).toBe('ADMIN_VERIFIED_COMPLETED');

    // Step 4: Admin authorizes milestone payment request
    const invoice = adminAuthorizeMilestonePaymentRequest(projectId, verifiedCompleted.id);
    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe('ISSUED');
    expect(invoice.amount).toBe(250000);
    expect(invoice.totalAmount).toBe(295000); // 250000 + 18% GST (45000)

    // Step 5: Customer pays through configured gateway
    const paidInvoice = customerPayMilestoneInvoice(invoice.id, 'RAZORPAY_ESCROW');
    expect(paidInvoice.status).toBe('PAID');

    // Step 6: Backend verifies payment (signature, idempotency, order id)
    const isVerified = backendVerifyPayment(paidInvoice.id, 'order_K8s9231', 'sig_9812471923');
    expect(isVerified).toBe(true);

    // Step 7: Create designer payout request & Admin approves payout
    const payoutReq = createPayoutRequest({
      requestId: `REQ-PAY-${projectId}`,
      designerId: 'id-101',
      amount: 225000, // ₹2,50,000 less 10% platform commission
      bankAccount: '••••••••8910',
      ifsc: 'HDFC0001234',
    });
    expect(payoutReq.status).toBe('PENDING_ADMIN_APPROVAL');

    const approvedPayout = adminApprovePayout(payoutReq.id, 'CMS2026112700981');
    expect(approvedPayout.status).toBe('PROCESSED');
    expect(approvedPayout.utrNumber).toBe('CMS2026112700981');

    // Step 8: Interior Designer sees confirmed payout
    const designerPayouts = getInteriorPayouts();
    const confirmed = designerPayouts.find((p) => p.id === approvedPayout.id);
    expect(confirmed).toBeDefined();
    expect(confirmed?.status).toBe('PROCESSED');
    expect(confirmed?.utrNumber).toBe('CMS2026112700981');
  });

  it('handles Admin correction request on milestone deliverable', () => {
    const m = saveInteriorMilestone({
      projectId: 'BG-TEST-CORRECTION',
      name: 'Stage 2: 3D Renders',
      status: 'IN_PROGRESS',
    });

    const sub = submitMilestoneToAdmin(m.id, {
      completionDescription: 'Draft 3D views',
    });
    expect(sub.status).toBe('SUBMITTED_TO_ADMIN');

    const corrected = adminReviewMilestone(
      sub.id,
      'REQUEST_CORRECTION',
      'Please re-render kitchen view with updated island dimensions'
    );
    expect(corrected.status).toBe('CORRECTION_REQUESTED');
    expect(corrected.adminReview?.feedback).toContain('updated island dimensions');
  });

  it('calculates Section 14 Step 6 Payout Deductions (10% Commission + 1% TDS)', () => {
    const grossAmount = 400000;
    const payout = createPayoutRequest({
      grossAmount,
      projectId: 'BG-PRJ-CALC',
      milestoneName: 'Stage 3: 3D Visualization',
    });

    // Example in Section 14 Step 6: 10% commission, 1% TDS, Net payable = 89%
    expect(payout.grossAmount).toBe(400000);
    expect(payout.platformCommission).toBe(40000); // 10% of 4,00,000
    expect(payout.tdsDeduction).toBe(4000); // 1% of 4,00,000
    expect(payout.netPayable).toBe(356000); // 400000 - 40000 - 4000
  });

  it('implements Mandatory Section 23 Test 9: Financial safety workflow', () => {
    const projectId = 'BG-FIN-SAFETY-TEST';
    const milestoneId = 'MS-TEST-9';

    // 1. Failed payment handling
    const failedAttempt = processPaymentWebhook({
      event: 'payment.failed',
      orderId: 'order_failed_101',
      paymentId: 'pay_failed_101',
      amount: 150000,
      signature: 'sig_valid_dummy',
      idempotencyKey: 'idemp_key_failed_1',
      projectId,
      milestoneId,
    });
    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.message).toContain('failed');

    // 2. Successful payment webhook
    const validAttempt = processPaymentWebhook({
      event: 'payment.captured',
      orderId: 'order_success_102',
      paymentId: 'pay_success_102',
      amount: 150000,
      signature: 'sig_valid_102',
      idempotencyKey: 'idemp_key_success_102',
      projectId,
      milestoneId,
    });
    expect(validAttempt.success).toBe(true);
    expect(validAttempt.duplicate).toBe(false);

    // 3. Duplicate webhook detection (Idempotency test)
    const duplicateAttempt = processPaymentWebhook({
      event: 'payment.captured',
      orderId: 'order_success_102',
      paymentId: 'pay_success_102',
      amount: 150000,
      signature: 'sig_valid_102',
      idempotencyKey: 'idemp_key_success_102', // SAME KEY
      projectId,
      milestoneId,
    });
    expect(duplicateAttempt.success).toBe(true);
    expect(duplicateAttempt.duplicate).toBe(true);
    expect(duplicateAttempt.message).toContain('Duplicate webhook detected');

    // 4. Duplicate payout attempt prevention
    const payout = createPayoutRequest({
      projectId,
      milestoneName: 'Safety Milestone',
      grossAmount: 150000,
    });
    expect(payout.status).toBe('PENDING_ADMIN_APPROVAL');

    const processedPayout = adminApprovePayout(payout.id, 'CMS202611SAFETY1');
    expect(processedPayout.status).toBe('PROCESSED');

    // Second approve attempt MUST throw error
    expect(() => {
      adminApprovePayout(payout.id, 'CMS202611SAFETY2');
    }).toThrow(/already processed/i);

    // 5. Immutable ledger reversal
    const ledger = getInteriorLedger(projectId);
    expect(ledger.length).toBeGreaterThan(0);
    const entryToReverse = ledger[0];

    const reversal = createLedgerReversalEntry(entryToReverse.id, 'Billing dispute correction');
    expect(reversal.type).toBe('REVERSAL');
    expect(reversal.description).toContain('Reversal of');
    const updatedOriginal = getInteriorLedger(projectId).find((l) => l.id === entryToReverse.id);
    expect(updatedOriginal?.status).toBe('REVERSED');
  });

  it('manages Admin Hold and Reject actions for Interior Payouts', () => {
    // 1. Hold action
    const payout1 = createPayoutRequest({
      projectId: 'BG-HOLD-TEST',
      grossAmount: 180000,
    });
    const held = adminHoldPayout(payout1.id, 'Snag inspection pending in dining room');
    expect(held.status).toBe('ON_HOLD');
    expect(held.holdReason).toContain('Snag inspection');

    // 2. Reject action
    const payout2 = createPayoutRequest({
      projectId: 'BG-REJECT-TEST',
      grossAmount: 120000,
    });
    const rejected = adminRejectPayout(payout2.id, 'Duplicate invoice submitted by designer');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toContain('Duplicate invoice');
  });

  // ==============================================================================
  // PHASE 9: SECTION 15, 16, 17, 18 & MANDATORY TEST 7
  // ==============================================================================

  it('implements Mandatory Section 23 Test 7: Communication workflow (Designer -> Admin -> Customer -> Admin -> Designer)', () => {
    // Setup communication thread
    const threadId = 'TH-TEST-ROUTED-101';
    saveCommunicationThread({
      id: threadId,
      threadCode: 'COMM-TEST-1001',
      projectId: 'BG-INT-2026-TEST',
      projectTitle: 'Modern Penthouse Test',
      customerId: 'usr-cust-test',
      customerName: 'Vikramaditya Roy',
      customerPhone: '+91 98112 00099',
      designerId: 'INT-DES-TEST',
      designerName: 'Aanya Sharma',
      designerFirm: 'Aura Studio',
      subject: 'Italian Marble Finish Query',
      category: 'MATERIAL_SELECTION',
      direction: 'DESIGNER_TO_CUSTOMER',
      status: 'PENDING_ADMIN_REVIEW',
      latestMessageAt: new Date().toISOString(),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Step 1: Interior Designer sends message
    const msg1 = sendRoutedMessage({
      threadId,
      senderRole: 'INTERIOR_DESIGNER',
      senderName: 'Aanya Sharma',
      recipientRole: 'CUSTOMER',
      recipientName: 'Vikramaditya Roy',
      content: 'Preliminary selection for master bedroom flooring is ready for review.',
    });

    expect(msg1.routingStatus).toBe('PENDING_ADMIN_ROUTING');

    // Admin receives in inbox
    const threadAfterMsg1 = getCommunicationThreadById(threadId)!;
    expect(threadAfterMsg1.status).toBe('PENDING_ADMIN_REVIEW');
    expect(threadAfterMsg1.messages.length).toBe(1);

    // CRITICAL SECURITY RULE: Customer CANNOT see unforwarded message
    const customerVisibleBeforeForward = getVisibleMessagesForRole(threadAfterMsg1, 'CUSTOMER');
    expect(customerVisibleBeforeForward.length).toBe(0);

    // Designer can see their own sent message
    const designerVisibleBeforeForward = getVisibleMessagesForRole(threadAfterMsg1, 'INTERIOR_DESIGNER');
    expect(designerVisibleBeforeForward.length).toBe(1);
    expect(designerVisibleBeforeForward[0].routingStatus).toBe('PENDING_ADMIN_ROUTING');

    // Step 2: Admin reviews & forwards message to Customer
    const forwardedToCustomer = adminForwardMessage({
      threadId,
      messageId: msg1.id,
      forwardedBy: 'BuildGhar Operations Desk',
      forwardingNotes: 'Quality verified against architectural MEP specs.',
    })!;

    expect(forwardedToCustomer.status).toBe('FORWARDED');

    // Customer NOW sees the forwarded message
    const customerVisibleAfterForward = getVisibleMessagesForRole(forwardedToCustomer, 'CUSTOMER');
    expect(customerVisibleAfterForward.length).toBe(1);
    expect(customerVisibleAfterForward[0].content).toContain('flooring is ready');
    expect(customerVisibleAfterForward[0].routingStatus).toBe('FORWARDED_TO_TARGET');

    // Step 3: Customer replies
    const customerReply = sendRoutedMessage({
      threadId,
      senderRole: 'CUSTOMER',
      senderName: 'Vikramaditya Roy',
      recipientRole: 'INTERIOR_DESIGNER',
      recipientName: 'Aanya Sharma',
      content: 'Flooring looks great, but please verify if slip resistance R10 is certified.',
    });

    expect(customerReply.routingStatus).toBe('PENDING_ADMIN_ROUTING');

    // Admin receives reply in inbox
    const threadAfterReply = getCommunicationThreadById(threadId)!;
    expect(threadAfterReply.status).toBe('PENDING_ADMIN_REVIEW');
    expect(threadAfterReply.messages.length).toBe(2);

    // CRITICAL RULE: Interior Designer CANNOT see customer reply before Admin forwards
    const designerVisibleBeforeReplyForward = getVisibleMessagesForRole(threadAfterReply, 'INTERIOR_DESIGNER');
    expect(designerVisibleBeforeReplyForward.length).toBe(1); // Only their first message visible

    // Step 4: Admin forwards customer reply to Interior Designer
    const forwardedToDesigner = adminForwardMessage({
      threadId,
      messageId: customerReply.id,
      forwardedBy: 'BuildGhar Operations Desk',
      forwardingNotes: 'Customer satisfaction acknowledged. Requesting R10 test cert.',
    })!;

    expect(forwardedToDesigner.status).toBe('FORWARDED');

    // Designer NOW sees customer reply
    const designerVisibleAfterReplyForward = getVisibleMessagesForRole(forwardedToDesigner, 'INTERIOR_DESIGNER');
    expect(designerVisibleAfterReplyForward.length).toBe(2);
    expect(designerVisibleAfterReplyForward[1].content).toContain('slip resistance R10');

    // Step 5: Internal Admin Notes must NEVER be visible to Customer or Designer (Section 15 Rule)
    addAdminInternalNote(threadId, 'Customer is VIP client from Gurugram. Expedite test cert response.');
    const updatedThreadWithNotes = getCommunicationThreadById(threadId)!;

    const designerClean = getVisibleMessagesForRole(updatedThreadWithNotes, 'INTERIOR_DESIGNER');
    designerClean.forEach((m) => {
      expect((m as any).internalAdminNotes).toBeUndefined();
    });

    const customerClean = getVisibleMessagesForRole(updatedThreadWithNotes, 'CUSTOMER');
    customerClean.forEach((m) => {
      expect((m as any).internalAdminNotes).toBeUndefined();
    });
  });

  it('manages Section 16 Customer Reviews, Complaints & Dispute Resolution', () => {
    // 1. Customer Review forwarded by Admin
    const review = saveInteriorReview({
      id: 'BG-REV-TEST-1',
      projectId: 'BG-PRJ-REV',
      projectName: 'Test Penthouse',
      customerId: 'CUST-101',
      customerName: 'Sharika Mishra',
      designerId: 'id-101',
      designerName: 'Ar. Pooja Mehra',
      rating: 5,
      categories: {
        designQuality: 5,
        responsiveness: 5,
        timeliness: 4.8,
        professionalism: 5,
      },
      reviewText: 'Flawless false ceiling cove lighting execution.',
      status: 'PENDING_ADMIN_REVIEW',
      createdAt: new Date().toISOString(),
    });

    const forwardedRev = adminForwardReviewToDesigner(review.id, 'Super Admin');
    expect(forwardedRev?.status).toBe('FORWARDED_TO_DESIGNER');
    expect(forwardedRev?.forwardedBy).toBe('Super Admin');

    // 2. Designer raises formal project dispute (Section 16 categories)
    const disputeId = 'DISP-INT-TEST-1';
    saveComplaintDispute({
      id: disputeId,
      disputeCode: 'DISP-INT-2026-999',
      projectId: 'BG-PRJ-REV',
      projectTitle: 'Test Penthouse',
      complainantRole: 'INTERIOR_DESIGNER',
      complainantName: 'Ar. Pooja Mehra',
      complainantPhone: '+91 98110 55990',
      respondentRole: 'CONTRACTOR',
      respondentName: 'Apex Electricals',
      disputeType: 'SITE_ACCESS_PROBLEMS',
      priority: 'HIGH',
      subject: 'Conduit framing delayed by 5 days',
      description: 'Site locked and MEP contractor unreachable.',
      evidenceFiles: [{ name: 'site_lock.jpg', type: 'IMAGE', url: '#' }],
      status: 'OPEN_RECEIVED',
      assignedAdmin: 'Unassigned',
      holdAssociatedPayout: false,
      associatedPayoutId: 'BG-PO-TEST-999',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditHistory: [],
    });

    // Admin assigns officer
    const assigned = assignDisputeOfficer(disputeId, 'Senior Grievance Officer');
    expect(assigned?.assignedAdmin).toBe('Senior Grievance Officer');
    expect(assigned?.status).toBe('INVESTIGATING');

    // Admin toggles payout hold
    const held = toggleDisputePayoutHold(disputeId, true, 'Senior Grievance Officer');
    expect(held?.holdAssociatedPayout).toBe(true);

    // Section 16 Core Rule: Designer CANNOT unilaterally close the dispute
    const perm = canCloseDispute(disputeId, 'INTERIOR_DESIGNER');
    expect(perm.allowed).toBe(false);
    expect(perm.reason).toContain('Do not allow one party to silently close');

    expect(() => {
      closeDisputeWithAudit(disputeId, {
        actorRole: 'INTERIOR_DESIGNER',
        actorName: 'Ar. Pooja Mehra',
        resolutionNotes: 'Attempting self-closure',
        decision: 'MUTUAL_SETTLEMENT',
      });
    }).toThrow(/silently close/i);

    // Admin CAN resolve and close dispute
    const resolved = closeDisputeWithAudit(disputeId, {
      actorRole: 'ADMIN',
      actorName: 'Senior Grievance Officer',
      resolutionNotes: 'Site access restored with security key card handover. Payout hold released.',
      decision: 'MUTUAL_SETTLEMENT',
    });
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolutionDecision).toBe('MUTUAL_SETTLEMENT');
    expect(resolved.holdAssociatedPayout).toBe(false);
  });

  it('computes Section 17 Real Database Analytics and generates valid CSV report', () => {
    const analytics = getInteriorDesignerAnalytics();

    expect(analytics.assignedRequests).toBeGreaterThan(0);
    expect(analytics.customerAcceptanceRate).toBeGreaterThanOrEqual(0);
    expect(analytics.customerAcceptanceRate).toBeLessThanOrEqual(100);
    expect(analytics.milestoneCompletion).toBeGreaterThanOrEqual(0);
    expect(analytics.milestoneCompletion).toBeLessThanOrEqual(100);
    expect(analytics.customerRatings.average).toBeGreaterThan(0);
    expect(analytics.monthlyEarnings.length).toBeGreaterThan(0);

    // Test filter by specific status
    const filteredAnalytics = getInteriorDesignerAnalytics(undefined, {
      quotationStatus: 'ACCEPTED',
    });
    expect(filteredAnalytics.approvedQuotations).toBeGreaterThanOrEqual(0);

    // Test CSV generation
    const csv = generateAnalyticsCSV(analytics);
    expect(csv).toContain('Metric Category,Metric Name,Value,Unit');
    expect(csv).toContain('Customer Acceptance Rate');
    expect(csv).toContain('Milestone Completion Rate');
    expect(csv).toContain('Average Customer Rating');
  });

  it('manages Section 18 Multi-Channel Notifications Dispatcher', () => {
    // 1. Dispatch new notification event
    const notif = dispatchInteriorNotification({
      designerId: 'id-101',
      designerPhone: '9811055990',
      eventType: 'CUSTOMER_ACCEPTED_QUOTATION',
      title: 'Quotation BG-Q-INT-99 Accepted',
      message: 'Homeowner accepted living room and dining package.',
      channels: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
      link: '/interior-designer/quotations',
    });

    expect(notif.read).toBe(false);
    expect(notif.channels).toContain('WHATSAPP');
    expect(notif.channels).toContain('SMS');

    // 2. Query notifications for designer
    const list = getInteriorNotifications('9811055990');
    expect(list.some((n) => n.id === notif.id)).toBe(true);

    // 3. Mark single notification read
    markInteriorNotificationRead(notif.id);
    const updatedList = getInteriorNotifications('9811055990');
    const updatedNotif = updatedList.find((n) => n.id === notif.id);
    expect(updatedNotif?.read).toBe(true);

    // 4. Mark all read
    markAllInteriorNotificationsRead('9811055990');
    const allReadList = getInteriorNotifications('9811055990');
    const hasUnread = allReadList.some((n) => !n.read);
    expect(hasUnread).toBe(false);
  });
});
