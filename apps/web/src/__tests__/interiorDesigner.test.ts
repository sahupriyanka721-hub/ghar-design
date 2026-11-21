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

  it('contains all 19 Master Interior Design Specializations', () => {
    expect(ALL_INTERIOR_SPECIALIZATIONS.length).toBe(19);
    const specNames = ALL_INTERIOR_SPECIALIZATIONS.map((s) => s.name);
    expect(specNames).toContain('Residential Interior Design');
    expect(specNames).toContain('Modular Kitchen');
    expect(specNames).toContain('False Ceiling and Lighting');
    expect(specNames).toContain('3D Interior Visualization');
    expect(specNames).toContain('Complete Interior Projects');
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

  it('computes quotation and room-wise line items properly', () => {
    const quotes = getInteriorQuotations();
    expect(quotes.length).toBeGreaterThanOrEqual(2);

    const quote = quotes[0];
    expect(quote.lineItems.length).toBeGreaterThanOrEqual(1);
    expect(quote.grandTotal).toBeGreaterThan(0);
    expect(quote.status).toBe('ACCEPTED');
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
    // Should NOT have hardcoded dummy values
    expect(designer.state).toBe('');
    expect(designer.city).toBe('');
    expect(designer.specializations).toEqual([]);
    expect(designer.yearsOfExperience).toBe(0);
    expect(designer.businessDescription).toBe('');
  });
});
