import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';
const storePath = path.join(projectRoot, 'apps/web/src/data/architectStore.ts');
let code = fs.readFileSync(storePath, 'utf8');

// 1. Add fields to ArchitectAccount interface
const interfaceTarget = `  // Status Lifecycle & Audit
  accountStatus: ArchitectAccountStatus;`;

const newInterfaceFields = `  // Governance Review, Notes, Special Discount & Customer Sharing
  adminReview?: {
    rating: number; // 1-5
    qualityScore?: number; // 0-100
    designAestheticsRating?: number; // 1-5
    structuralAccuracyRating?: number; // 1-5
    communicationRating?: number; // 1-5
    summary: string;
    reviewedBy: string;
    reviewedAt: string;
    tierBadge?: 'STANDARD' | 'VERIFIED_ELITE' | 'MASTER_ARCHITECT';
  };
  internalNotes?: Array<{
    id: string;
    text: string;
    author: string;
    createdAt: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  }>;
  specialDiscount?: {
    enabled: boolean;
    type: 'PERCENTAGE' | 'FLAT';
    amount: number;
    code: string;
    validUntil?: string;
    terms?: string;
  };
  customerShares?: Array<{
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    discountCode?: string;
    discountApplied?: string;
    note: string;
    sentAt: string;
    channel: 'WHATSAPP' | 'SMS' | 'PORTAL' | 'ALL';
  }>;

  // Status Lifecycle & Audit
  accountStatus: ArchitectAccountStatus;`;

if (!code.includes('adminReview?: {')) {
  code = code.replace(interfaceTarget, newInterfaceFields);
}

// 2. Add adminReview, internalNotes, specialDiscount, customerShares to new account creation
const updatedTarget = `      accountStatus: acc.accountStatus || 'PROFILE_INCOMPLETE',`;
const updatedFields = `      adminReview: acc.adminReview,
      internalNotes: acc.internalNotes || [],
      specialDiscount: acc.specialDiscount,
      customerShares: acc.customerShares || [],
      accountStatus: acc.accountStatus || 'PROFILE_INCOMPLETE',`;

if (!code.includes('internalNotes: acc.internalNotes || [],')) {
  code = code.replace(updatedTarget, updatedFields);
}

// 3. Add helper functions at the end of the file
const helperFunctions = `

export const addArchitectNote = (
  archId: string,
  text: string,
  author: string = 'Super Admin Desk',
  priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  const newNote = {
    id: \`note-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
    text: text.trim(),
    author,
    createdAt: new Date().toISOString(),
    priority,
  };

  const updatedNotes = [newNote, ...(current[idx].internalNotes || [])];
  return saveArchitectAccount({
    ...current[idx],
    internalNotes: updatedNotes,
  });
};

export const deleteArchitectNote = (
  archId: string,
  noteId: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  const updatedNotes = (current[idx].internalNotes || []).filter((n) => n.id !== noteId);
  return saveArchitectAccount({
    ...current[idx],
    internalNotes: updatedNotes,
  });
};

export const saveArchitectReview = (
  archId: string,
  review: NonNullable<ArchitectAccount['adminReview']>
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  return saveArchitectAccount({
    ...current[idx],
    adminReview: review,
  });
};

export const saveArchitectDiscount = (
  archId: string,
  discount: NonNullable<ArchitectAccount['specialDiscount']>
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === archId);
  if (idx === -1) return null;

  return saveArchitectAccount({
    ...current[idx],
    specialDiscount: discount,
  });
};

export const shareArchitectWithCustomer = (
  archId: string,
  share: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    note: string;
    discountCode?: string;
    discountApplied?: string;
    channel: 'WHATSAPP' | 'SMS' | 'PORTAL' | 'ALL';
  }
): { success: boolean; shareRecord: any; whatsappUrl: string } => {
  const current = getArchitectAccounts();
  const arch = current.find((a) => a.id === archId);
  if (!arch) {
    throw new Error('Architect not found');
  }

  const shareRecord = {
    id: \`share-\${Date.now()}\`,
    customerId: share.customerId,
    customerName: share.customerName,
    customerPhone: share.customerPhone,
    discountCode: share.discountCode,
    discountApplied: share.discountApplied,
    note: share.note,
    sentAt: new Date().toISOString(),
    channel: share.channel,
  };

  const updatedShares = [shareRecord, ...(arch.customerShares || [])];
  saveArchitectAccount({
    ...arch,
    customerShares: updatedShares,
  });

  try {
    const recKey = 'platform_customer_recommendations';
    const recs = JSON.parse(localStorage.getItem(recKey) || '[]');
    const newRec = {
      id: \`rec-\${Date.now()}\`,
      customerId: share.customerId,
      customerName: share.customerName,
      customerPhone: share.customerPhone,
      architectId: arch.id,
      architectName: arch.name,
      firmName: arch.firmName,
      phone: arch.phone,
      coaNumber: arch.coaNumber,
      city: arch.city,
      services: arch.services,
      discountCode: share.discountCode,
      discountApplied: share.discountApplied,
      note: share.note,
      sentAt: shareRecord.sentAt,
      isViewed: false,
    };
    localStorage.setItem(recKey, JSON.stringify([newRec, ...recs]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('customer_recommendation_received', { detail: newRec }));
    }
  } catch (e) {}

  const cleanPhone = (share.customerPhone || '').replace(/\\D/g, '').slice(-10);
  const waMsg = \`🏛️ *BuildGhar Professional Architect Recommendation*

Hello *\${share.customerName}*,
Our Central Architecture & Engineering Governance Desk recommends licensed Architect *\${arch.name}* (\${arch.firmName}, COA Lic: *\${arch.coaNumber || 'Verified'}*) for your architectural planning & design in *\${arch.city}*.

\${share.discountApplied ? \`🎁 *Special Platform Voucher:* Use code *\${share.discountCode}* for *\${share.discountApplied}* off on your project drawings!\\n\` : ''}
📝 *Governance Desk Note:*
"\${share.note}"

View Verified Profile & Drawings on BuildGhar:
👉 https://ghar-design.vercel.app/professionals\`;

  const whatsappUrl = \`https://wa.me/91\${cleanPhone}?text=\${encodeURIComponent(waMsg)}\`;

  return {
    success: true,
    shareRecord,
    whatsappUrl,
  };
};
`;

if (!code.includes('export const shareArchitectWithCustomer =')) {
  code += helperFunctions;
}

fs.writeFileSync(storePath, code, 'utf8');
console.log('architectStore.ts updated with Review, Notes, Special Discount, and Share with Customer functions!');
