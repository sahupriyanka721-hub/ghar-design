import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format paise to Indian Rupee (INR) string
// e.g. 49900 paise -> "₹499", 18500000 paise -> "₹1,85,000"
export function formatINR(paise: number = 0): string {
  const safePaise = typeof paise === 'number' && !isNaN(paise) ? paise : 0;
  const rupees = Math.round(safePaise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

// Format direct rupee amounts e.g. 2800000 -> "₹28,00,000"
export function formatRupees(rupees: number = 0): string {
  const safeRupees = typeof rupees === 'number' && !isNaN(rupees) ? rupees : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(safeRupees));
}

// Format date to local Indian format e.g. "15 Oct 2026"
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

// Format plot area with units
export function formatArea(area: number, unit: 'FEET' | 'METRES'): string {
  const unitLabel = unit === 'FEET' ? 'sq.ft' : 'sq.m';
  return `${area.toLocaleString('en-IN')} ${unitLabel}`;
}

// Safe normalization of quotation to guarantee lineItems, deliverables, exclusions, milestones are never undefined
export function normalizeQuotation(q: any): any {
  if (!q) return null;

  const rawItems = (q.lineItems && Array.isArray(q.lineItems) && q.lineItems.length > 0)
    ? q.lineItems
    : (q.items && Array.isArray(q.items) && q.items.length > 0)
    ? q.items
    : [];

  const lineItems = rawItems.length > 0
    ? rawItems.map((it: any) => ({
        description: it.title || it.description || 'Civil & Architectural Specification Item',
        quantity: it.quantity || 1,
        unit: it.unit || 'Lumpsum',
        unitPricePaise: it.ratePaise || it.unitPricePaise || Math.round((q.finalAmountPaise || 1000000) * 0.7),
        totalPaise: it.ratePaise || it.totalPaise || Math.round((q.finalAmountPaise || 1000000) * 0.7),
      }))
    : [
        {
          description: q.scopeOfWork || 'Complete Architectural Planning & Structural Package',
          quantity: 1,
          unit: 'Lumpsum',
          unitPricePaise: q.finalAmountPaise || 1200000,
          totalPaise: q.finalAmountPaise || 1200000,
        },
      ];

  const rawDeliverables = (q.includedDeliverables && Array.isArray(q.includedDeliverables) && q.includedDeliverables.length > 0)
    ? q.includedDeliverables
    : (q.deliverables && Array.isArray(q.deliverables) && q.deliverables.length > 0)
    ? q.deliverables
    : [];

  const includedDeliverables = rawDeliverables.length > 0
    ? rawDeliverables
    : [
        '2D Working Blueprints & Municipal Approvals',
        '3D Facade & Architectural Elevation Renders',
        'Structural Engineering & IS 456 Calculation Sheets',
        'Material Procurement & Bill of Quantities (BOQ)',
        'Milestone Escrow Site Supervision Visits',
      ];

  const rawExclusions = (q.excludedWork && Array.isArray(q.excludedWork) && q.excludedWork.length > 0)
    ? q.excludedWork
    : (q.exclusions && Array.isArray(q.exclusions) && q.exclusions.length > 0)
    ? q.exclusions
    : [];

  const excludedWork = rawExclusions.length > 0
    ? rawExclusions
    : [
        'Municipal Liaison & Govt Mutation Fees',
        'Electricity / Water Meter Security Deposits',
        'Soil Investigation & Topographical Survey Charges',
      ];

  const rawMilestones = (q.milestones && Array.isArray(q.milestones) && q.milestones.length > 0)
    ? q.milestones
    : [];

  const milestones = rawMilestones.length > 0
    ? rawMilestones
    : [
        {
          title: 'Tranche 1: Advance Commitment & Demarcation',
          percentage: q.advancePercentage || 15,
          amountPaise: Math.round((q.finalAmountPaise || 1000000) * ((q.advancePercentage || 15) / 100)),
        },
        {
          title: 'Tranche 2: Foundation & Plinth Level Verification',
          percentage: 25,
          amountPaise: Math.round((q.finalAmountPaise || 1000000) * 0.25),
        },
        {
          title: 'Tranche 3: RCC Structure & Brick Masonry Completion',
          percentage: 35,
          amountPaise: Math.round((q.finalAmountPaise || 1000000) * 0.35),
        },
        {
          title: 'Tranche 4: Final Handover & Snag Clearance',
          percentage: 25,
          amountPaise: Math.round((q.finalAmountPaise || 1000000) * 0.25),
        },
      ];

  return {
    ...q,
    lineItems,
    includedDeliverables,
    excludedWork,
    milestones,
    drawingFormats: (q.drawingFormats && Array.isArray(q.drawingFormats) && q.drawingFormats.length > 0)
      ? q.drawingFormats
      : ['AutoCAD (.DWG)', 'Architectural PDF', '3D High-Res Elevation', 'Structural Schedules'],
    cancellationTerms: q.cancellationTerms || 'Standard BuildGhar Escrow Protection: Full milestone refund before site demarcation. 100% money-back guarantee on unapproved design revisions.',
    professional: q.professional || {
      name: q.professionalName || 'Lead Architect & Engineer',
      firmName: q.firmName || q.professionalName || 'BuildGhar Partner Firm',
      qualifications: q.qualifications || 'Council of Architecture (COA) Accredited Partner',
      rating: 4.9,
    },
    estimatedDurationDays: q.estimatedDurationDays || q.timelineDays || 30,
    revisionsCount: q.revisionsCount || 3,
    validUntil: q.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
    subtotalPaise: q.subtotalPaise || Math.round((q.finalAmountPaise || 1000000) / 1.18),
    taxPaise: q.taxPaise || Math.round((q.finalAmountPaise || 1000000) - (q.finalAmountPaise || 1000000) / 1.18),
    discountPaise: q.discountPaise || 0,
    advancePercentage: q.advancePercentage || 15,
  };
}

// Safely compress an avatar image into a lightweight Base64 Data URL (max 600x600, ~60-100KB)
export function compressAvatarImage(file: File, maxDim = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return reject(new Error('Failed to read image.'));
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(src);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
