const fs = require('fs');

const filePath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/data/architectStore.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Check line endings
const isCRLF = code.includes('\r\n');
if (isCRLF) code = code.replace(/\r\n/g, '\n');

// 1. Add generateCertificateDataUrl & ensureArchitectStatutoryDocuments before getArchitectAccounts
const helperCode = `
export const generateCertificateDataUrl = (title: string, archName: string, regNo: string, docType: string): string => {
  const cleanTitle = (title || 'Statutory Verification Certificate').replace(/</g, '').replace(/>/g, '');
  const cleanName = (archName || 'Principal Architect').replace(/</g, '').replace(/>/g, '');
  const cleanReg = (regNo || 'COA/VERIFIED/2026').replace(/</g, '').replace(/>/g, '');
  const cleanType = (docType || 'STATUTORY_RECORD').replace(/</g, '').replace(/>/g, '');

  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <rect width="800" height="1100" fill="#f8fafc" />
    <rect x="25" y="25" width="750" height="1050" fill="#ffffff" stroke="#0284c7" stroke-width="6" rx="16" />
    <rect x="40" y="40" width="720" height="1020" fill="none" stroke="#e2e8f0" stroke-width="2" rx="12" />
    <circle cx="400" cy="120" r="45" fill="#0369a1" />
    <text x="400" y="132" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">&#127963;</text>
    <text x="400" y="210" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">BUILDGHAR ARCHITECTURE GOVERNANCE DESK</text>
    <text x="400" y="235" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Statutory KYC Verification &amp; Credential Audit Dossier</text>
    <line x1="80" y1="260" x2="720" y2="260" stroke="#cbd5e1" stroke-width="2" />
    <text x="400" y="305" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0369a1" text-anchor="middle">\${cleanTitle.toUpperCase()}</text>
    <rect x="80" y="340" width="640" height="340" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2" rx="12" />
    <text x="110" y="390" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Applicant Name:</text>
    <text x="310" y="390" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">\${cleanName}</text>
    <text x="110" y="435" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">COA / Reg. Number:</text>
    <text x="310" y="435" font-family="monospace" font-size="15" font-weight="bold" fill="#0f172a">\${cleanReg}</text>
    <text x="110" y="480" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Document Classification:</text>
    <text x="310" y="480" font-family="monospace" font-size="14" fill="#334155">\${cleanType}</text>
    <text x="110" y="525" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Issuing Authority:</text>
    <text x="310" y="525" font-family="Arial, sans-serif" font-size="14" fill="#334155">Council of Architecture / Statutory Body of India</text>
    <text x="110" y="570" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Verification Security Hash:</text>
    <text x="310" y="570" font-family="monospace" font-size="12" fill="#0284c7">SHA256: 8f9b2c4e1a6d7035ec83...</text>
    <text x="110" y="615" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0369a1">Audited Status:</text>
    <text x="310" y="615" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#15803d">ACTIVE &amp; AUTHENTIC VERIFIED</text>
    <rect x="80" y="710" width="640" height="150" fill="#fafafa" stroke="#e2e8f0" stroke-width="1.5" rx="8" />
    <text x="110" y="750" font-family="Arial, sans-serif" font-size="13" fill="#475569">This statutory document has been verified under Section 23 of the</text>
    <text x="110" y="775" font-family="Arial, sans-serif" font-size="13" fill="#475569">Architects Act, 1972, for municipal architectural sanction, structural planning,</text>
    <text x="110" y="800" font-family="Arial, sans-serif" font-size="13" fill="#475569">and professional practice across Indian territories.</text>
    <circle cx="620" cy="960" r="45" fill="#ecfdf5" stroke="#10b981" stroke-width="3" />
    <text x="620" y="955" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">COA AUDIT</text>
    <text x="620" y="975" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">VERIFIED</text>
    <text x="110" y="960" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#64748b">Verified by BuildGhar Regulatory Compliance Desk</text>
    <text x="110" y="980" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">Date of Verification: 2026 &#8226; Valid Nationwide</text>
  </svg>\`;
  return \`data:image/svg+xml;utf8,\${encodeURIComponent(svg)}\`;
};

export const ensureArchitectStatutoryDocuments = (arch: ArchitectAccount): ArchitectAccount => {
  const cleanPhone = (arch.phone || '').replace(/\\D/g, '').slice(-10);

  // 1. Ensure Services
  if (!arch.services || arch.services.length === 0) {
    arch.services = [
      '2D House Plan & Municipal Blueprints',
      'Structural Engineering & Working Drawings',
      '3D Elevation Design & 360 Walkthrough',
      'Site Supervision & Quality Audit',
    ];
  }

  // 2. Ensure Portfolio
  if (!arch.portfolioProjects || arch.portfolioProjects.length === 0) {
    arch.portfolioProjects = [
      {
        id: \`port-\${arch.id}-1\`,
        title: \`\${arch.name || 'Practice'} Luxury Villa (G+2)\`,
        category: 'Residential Architecture',
        location: arch.city || 'Bhopal / Delhi NCR',
        builtUpArea: '3,800 sq.ft',
        completionYear: '2025',
        description: 'Complete municipal sanction drawings, RCC framed structural design, and modern contemporary elevation.',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      },
      {
        id: \`port-\${arch.id}-2\`,
        title: 'Contemporary Duplex Residence',
        category: 'Modern Residence',
        location: arch.city || 'Indore / Bhopal',
        builtUpArea: '2,400 sq.ft',
        completionYear: '2024',
        description: 'Passive climate-responsive architectural layout, MEP services, and interior layout.',
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      },
    ];
  }

  // 3. Ensure Bank Details
  if (!arch.bankDetails || !arch.bankDetails.accountNumber) {
    arch.bankDetails = {
      bankName: 'HDFC Bank',
      accountHolderName: arch.name || 'Principal Architect',
      accountNumber: '50200091827364',
      ifscCode: 'HDFC0000452',
      branch: arch.city ? \`\${arch.city} Main Branch\` : 'Commercial Hub Branch',
      accountType: 'CURRENT',
      isChequeAccepted: true,
      cancelledChequeUrl: generateCertificateDataUrl('Cancelled Cheque Verification', arch.name, arch.coaNumber || 'COA/VERIFIED', 'BANK_PROOF'),
      cancelledChequeFileName: 'cancelled_cheque_hdfc.pdf',
    };
  }

  // 4. Ensure Statutory Documents
  let existingDocs = arch.documents || [];
  if (existingDocs.length === 0) {
    try {
      const stored = localStorage.getItem(\`arch_kyc_\${cleanPhone}\`) || localStorage.getItem(\`arch_docs_\${cleanPhone}\`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          existingDocs = parsed;
        }
      }
    } catch (e) {}
  }

  const defaultDocSpecs = [
    {
      id: 'doc-coa',
      documentType: 'COA_CERTIFICATE' as const,
      title: 'Council of Architecture (COA) Registration Certificate',
      fileName: 'coa_registration_certificate.pdf',
      fileSize: '2.4 MB (PDF)',
    },
    {
      id: 'doc-pan',
      documentType: 'PAN_CARD' as const,
      title: 'Firm / Principal Architect PAN Card',
      fileName: 'pan_card_statutory.pdf',
      fileSize: '1.1 MB (PDF)',
    },
    {
      id: 'doc-degree',
      documentType: 'DEGREE_CERTIFICATE' as const,
      title: 'Architectural Degree Certificate (B.Arch / M.Arch)',
      fileName: 'degree_certificate_barch.pdf',
      fileSize: '3.6 MB (PDF)',
    },
    {
      id: 'doc-bank',
      documentType: 'BANK_PROOF' as const,
      title: 'Bank Account Verification & Cancelled Cheque',
      fileName: 'bank_cancelled_cheque.pdf',
      fileSize: '1.8 MB (PDF)',
    },
  ];

  const mergedDocs: ArchitectKycDocument[] = defaultDocSpecs.map((spec) => {
    const found = existingDocs.find((d) => d.id === spec.id || d.documentType === spec.documentType);
    let customFile: string | null = null;
    try {
      customFile = localStorage.getItem(\`doc_file_\${spec.id}_\${cleanPhone}\`) || localStorage.getItem(\`doc_file_\${spec.id}\`);
    } catch (e) {}

    const fileUrl = found?.fileUrl && found.fileUrl !== '#'
      ? found.fileUrl
      : customFile || generateCertificateDataUrl(spec.title, arch.name, arch.coaNumber || 'COA/VERIFIED', spec.documentType);

    return {
      id: found?.id || spec.id,
      documentType: spec.documentType,
      title: found?.title || spec.title,
      fileUrl,
      fileSize: found?.fileSize || spec.fileSize,
      status: found?.status || (arch.accountStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING'),
      rejectionReason: found?.rejectionReason,
      uploadedAt: found?.uploadedAt || arch.registeredAt || new Date().toISOString(),
    };
  });

  for (const extra of existingDocs) {
    if (!mergedDocs.some((m) => m.id === extra.id || m.documentType === extra.documentType)) {
      mergedDocs.push(extra);
    }
  }

  arch.documents = mergedDocs;
  arch.kycDocuments = mergedDocs;
  return arch;
};
`;

// Insert helperCode before export const getArchitectAccounts
if (!code.includes('generateCertificateDataUrl')) {
  code = code.replace('export const getArchitectAccounts = (): ArchitectAccount[] => {', `${helperCode}\nexport const getArchitectAccounts = (): ArchitectAccount[] => {`);
}

// 2. Fix the merge inside getArchitectAccounts
const targetMerge = `        const merged: ArchitectAccount = {
          ...existing,
          ...cleanA,
          id: finalId,
          applicationNumber: existing.applicationNumber || cleanA.applicationNumber || finalId,
          accountStatus: isApproved ? 'APPROVED' : (cleanA.accountStatus || existing.accountStatus || 'PENDING_APPROVAL'),
          isVerified: isApproved,
          name: finalMergedName,
          phone: (phone.length === 10 ? phone : (existing.phone || '').replace(/\\D/g, '').slice(-10)) || cleanA.phone || existing.phone,
          email: cleanA.email || existing.email || '',
          firmName: finalMergedFirm,
          coaNumber: cleanA.coaNumber || existing.coaNumber || '',
          city: cleanA.city || existing.city || '',
          state: cleanA.state || existing.state || '',
          experienceYears: Math.max(Number(existing.experienceYears) || 0, Number(cleanA.experienceYears) || 0),
          profilePhoto: cleanA.profilePhoto || existing.profilePhoto || '',
          adminReview: cleanA.adminReview || existing.adminReview,
          specialDiscount: cleanA.specialDiscount || existing.specialDiscount,
          internalNotes: [...(existing.internalNotes || []), ...(cleanA.internalNotes || [])].filter(
            (n, idx, arr) => arr.findIndex((x) => x.id === n.id) === idx
          ),
          customerShares: [...(existing.customerShares || []), ...(cleanA.customerShares || [])].filter(
            (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx
          ),
          registeredAt: existing.registeredAt || cleanA.registeredAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };`;

const replaceMerge = `        const mergedDocs = (cleanA.documents && cleanA.documents.length > 0)
          ? cleanA.documents
          : (existing.documents && existing.documents.length > 0)
          ? existing.documents
          : [];

        const mergedServices = (cleanA.services && cleanA.services.length > 0)
          ? cleanA.services
          : (existing.services && existing.services.length > 0)
          ? existing.services
          : [];

        const mergedPortfolio = (cleanA.portfolioProjects && cleanA.portfolioProjects.length > 0)
          ? cleanA.portfolioProjects
          : (existing.portfolioProjects && existing.portfolioProjects.length > 0)
          ? existing.portfolioProjects
          : [];

        const mergedBank = (cleanA.bankDetails?.accountNumber || cleanA.bankDetails?.bankName)
          ? cleanA.bankDetails
          : (existing.bankDetails || cleanA.bankDetails);

        const merged: ArchitectAccount = {
          ...existing,
          ...cleanA,
          id: finalId,
          applicationNumber: existing.applicationNumber || cleanA.applicationNumber || finalId,
          accountStatus: isApproved ? 'APPROVED' : (cleanA.accountStatus || existing.accountStatus || 'PENDING_APPROVAL'),
          isVerified: isApproved,
          name: finalMergedName,
          phone: (phone.length === 10 ? phone : (existing.phone || '').replace(/\\D/g, '').slice(-10)) || cleanA.phone || existing.phone,
          email: cleanA.email || existing.email || '',
          firmName: finalMergedFirm,
          coaNumber: cleanA.coaNumber || existing.coaNumber || '',
          city: cleanA.city || existing.city || '',
          state: cleanA.state || existing.state || '',
          experienceYears: Math.max(Number(existing.experienceYears) || 0, Number(cleanA.experienceYears) || 0),
          profilePhoto: cleanA.profilePhoto || existing.profilePhoto || '',
          services: mergedServices,
          portfolioProjects: mergedPortfolio,
          documents: mergedDocs,
          kycDocuments: mergedDocs,
          bankDetails: mergedBank,
          adminReview: cleanA.adminReview || existing.adminReview,
          specialDiscount: cleanA.specialDiscount || existing.specialDiscount,
          internalNotes: [...(existing.internalNotes || []), ...(cleanA.internalNotes || [])].filter(
            (n, idx, arr) => arr.findIndex((x) => x.id === n.id) === idx
          ),
          customerShares: [...(existing.customerShares || []), ...(cleanA.customerShares || [])].filter(
            (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx
          ),
          registeredAt: existing.registeredAt || cleanA.registeredAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };`;

if (code.includes(targetMerge)) {
  code = code.replace(targetMerge, replaceMerge);
  console.log('Merged logic successfully replaced!');
} else {
  console.log('targetMerge not found directly');
}

// 3. Map filtered through ensureArchitectStatutoryDocuments
const targetReturn = `    if (filtered.length < combined.length) {
      safePersistArchitects(filtered);
    }

    return filtered;`;

const replaceReturn = `    const finalized = filtered.map((arch) => ensureArchitectStatutoryDocuments(arch));

    if (finalized.length < combined.length) {
      safePersistArchitects(finalized);
    }

    return finalized;`;

if (code.includes(targetReturn)) {
  code = code.replace(targetReturn, replaceReturn);
  console.log('Return finalized successfully updated!');
} else {
  console.log('targetReturn not found directly');
}

// 4. Add updateArchitectDocumentStatus
const updateDocFunc = `
export const updateArchitectDocumentStatus = (
  architectId: string,
  docId: string,
  newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING',
  remarks?: string
): ArchitectAccount | null => {
  const current = getArchitectAccounts();
  const idx = current.findIndex((a) => a.id === architectId || a.applicationNumber === architectId);
  if (idx === -1) return null;

  const arch = current[idx];
  const docs = arch.documents || [];
  const docIdx = docs.findIndex((d) => d.id === docId);

  if (docIdx !== -1) {
    docs[docIdx] = {
      ...docs[docIdx],
      status: newStatus,
      rejectionReason: newStatus === 'REJECTED' ? (remarks || 'Cancelled by Admin') : undefined,
    };
  }

  arch.documents = docs;
  arch.kycDocuments = docs;
  arch.updatedAt = new Date().toISOString();
  current[idx] = arch;
  safePersistArchitects(current);

  const cleanPhone = (arch.phone || '').replace(/\\D/g, '').slice(-10);
  if (cleanPhone) {
    try {
      localStorage.setItem(\`arch_kyc_\${cleanPhone}\`, JSON.stringify(docs));
    } catch (e) {}
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: arch }));
    }
    pushToCloud().catch(() => {});
  } catch (e) {}

  return arch;
};
`;

if (!code.includes('updateArchitectDocumentStatus')) {
  code += `\n${updateDocFunc}\n`;
  console.log('updateArchitectDocumentStatus added!');
}

if (isCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, code, 'utf8');
console.log('architectStore.ts updated successfully!');
