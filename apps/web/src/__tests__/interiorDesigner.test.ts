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
  saveInteriorProject,
  getInteriorBOQItems,
  ALL_INTERIOR_SPECIALIZATIONS,
} from '../data/interiorDesignerStore.js';

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
    expect(created.subtotal).toBe(800000); // 200000 + 600000
    expect(created.totalProfessionalFees).toBe(150000);
    // Taxable base = 800000 + 150000 - 20000 = 930000. 18% = 167400. Grand total = 1097400.
    expect(created.taxAmount).toBe(167400);
    expect(created.grandTotal).toBe(1097400);
    expect(created.paymentSchedule?.length).toBe(4);
    expect(created.status).toBe('DRAFT');
  });

  it('routes quotation through Admin review, revision requests, and version control (Section 7)', () => {
    // 1. Submit quotation to Admin
    const quotes = getInteriorQuotations();
    const draftQuote = quotes.find((q) => q.status === 'DRAFT') || quotes[0];
    const submitted = submitInteriorQuotationToAdmin(draftQuote.id, 'Ready for admin pricing review');
    expect(submitted.status).toBe('UNDER_ADMIN_REVIEW');

    // 2. Admin requests revision with feedback
    const revisionReq = adminReviewInteriorQuotation(
      submitted.id,
      'REQUEST_REVISION',
      'Please bifurcate 3D render charges and adjust kitchen cabinet rate',
      'Internal: home owner has budget constraint'
    );
    expect(revisionReq.status).toBe('REVISION_REQUESTED');
    expect(revisionReq.adminFeedback).toContain('Please bifurcate 3D render charges');

    // 3. Designer generates revision v2.0
    const revisionV2 = createInteriorQuotationRevision(revisionReq.id);
    expect(revisionV2.version).toBe('2.0');
    expect(revisionV2.versionHistory?.length).toBeGreaterThanOrEqual(1);
    expect(revisionV2.versionHistory?.[0].versionNumber).toBe('1.0');
    expect(revisionV2.status).toBe('DRAFT');

    // 4. Designer resubmits v2.0
    submitInteriorQuotationToAdmin(revisionV2.id);

    // 5. Admin approves and forwards to customer
    adminReviewInteriorQuotation(revisionV2.id, 'APPROVE');
    const forwarded = adminForwardInteriorQuotationToCustomer(revisionV2.id);
    expect(forwarded.status).toBe('SENT_TO_CUSTOMER');

    // 6. Customer accepts quotation
    const accepted = customerAcceptInteriorQuotation(revisionV2.id);
    expect(accepted.status).toBe('ACCEPTED');
  });

  it('manages bookings linked to accepted quotations', () => {
    const bookings = getInteriorBookings();
    expect(bookings.length).toBeGreaterThanOrEqual(2);

    const firstBooking = bookings[0];
    expect(firstBooking.bookingAmount).toBeGreaterThan(0);
    expect(firstBooking.advancePaymentStatus).toBe('PAID');
  });

  it('manages projects with weighted milestone progress calculation', () => {
    const projects = getInteriorProjects();
    expect(projects.length).toBeGreaterThanOrEqual(2);

    const proj = projects[0];
    expect(proj.milestones.length).toBe(5);
    expect(proj.overallProgressPercent).toBeGreaterThan(0);
    expect(proj.totalContractValue).toBeGreaterThan(0);
  });

  it('calculates BOQ items material and installation rates correctly', () => {
    const boqItems = getInteriorBOQItems('prj-int-1');
    expect(boqItems.length).toBeGreaterThanOrEqual(4);

    const plywood = boqItems[0];
    expect(plywood.quantity).toBe(24);
    expect(plywood.unitRate).toBe(4200);
    expect(plywood.totalAmount).toBeGreaterThan(100000);
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
});
