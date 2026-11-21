const fs = require('fs');
const path = require('path');

const root = process.cwd();

// Helper to replace text safely
function updateFile(relPath, replacer) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${relPath}`);
    return false;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = replacer(original);
  if (original !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`Updated: ${relPath}`);
    return true;
  } else {
    console.log(`No changes needed: ${relPath}`);
    return false;
  }
}

console.log('--- Applying Real Data Fixes ---');

// 1. architectStore.ts: SEED_ARCHITECTS = []
updateFile('apps/web/src/data/architectStore.ts', (c) => {
  return c
    .replace(/export const SEED_ARCHITECTS: ArchitectAccount\[\] = \[[\s\S]*?\];\s*export const getArchitectAccounts/, `export const SEED_ARCHITECTS: ArchitectAccount[] = [];\n\nexport const getArchitectAccounts`)
    .replace(/return SEED_ARCHITECTS;/, 'return [];');
});

// 2. professionalStore.ts: SEED_PROFESSIONALS = []
updateFile('apps/web/src/data/professionalStore.ts', (c) => {
  return c
    .replace(/const SEED_PROFESSIONALS: ProfessionalAccount\[\] = \[[\s\S]*?\];\s*const PRO_STORAGE_KEY/, `const SEED_PROFESSIONALS: ProfessionalAccount[] = [];\n\nconst PRO_STORAGE_KEY`)
    .replace(/return SEED_PROFESSIONALS;/, 'return [];');
});

// 3. adminStore.ts: INITIAL_CONTRACTORS = []
updateFile('apps/web/src/data/adminStore.ts', (c) => {
  return c
    .replace(/export const INITIAL_CONTRACTORS: PlatformContractor\[\] = \[[\s\S]*?\];\s*export const getPlatformContractors/, `export const INITIAL_CONTRACTORS: PlatformContractor[] = [];\n\nexport const getPlatformContractors`)
    .replace(/return INITIAL_CONTRACTORS;/, 'return [];');
});

// 4. MySubmittedQuotations.tsx
updateFile('apps/web/src/pages/professional/MySubmittedQuotations.tsx', (c) => {
  let updated = c.replace(/const SEED_QUOTATIONS = \[[\s\S]*?\];\s*export const MySubmittedQuotations/, `const SEED_QUOTATIONS: any[] = [];\n\nexport const MySubmittedQuotations`);
  updated = updated.replace(/if \(localQuotes\.length === 0\) \{\s*localQuotes = SEED_QUOTATIONS;[\s\S]*?\}\s*apiRequest\('\/professional\/quotations'\)/, `apiRequest('/professional/quotations')`);
  return updated;
});

// 5. QuotationBuilder.tsx: clear hardcoded mock scope, items, deliverables, exclusions
updateFile('apps/web/src/pages/professional/QuotationBuilder.tsx', (c) => {
  let updated = c.replace(
    /const \[scopeOfWork, setScopeOfWork\] = useState\([\s\S]*?'Complete professionalural design package[\s\S]*?'\);/,
    "const [scopeOfWork, setScopeOfWork] = useState('');"
  );
  updated = updated.replace(
    /const \[lineItems, setLineItems\] = useState<LineItem\[\]>\(\[[\s\S]*?unitPricePaise: 2500000, \/\/ ₹25,000\s*\},?\s*\]\);/,
    "const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit: 'sq.ft', unitPricePaise: 0 }]);"
  );
  updated = updated.replace(
    /const \[discountRupees, setDiscountRupees\] = useState\(10000\);/,
    "const [discountRupees, setDiscountRupees] = useState(0);"
  );
  updated = updated.replace(
    /const \[deliverables, setDeliverables\] = useState<string\[\]>\(\[[\s\S]*?'Material Procurement & Bill of Quantities \(BOQ\)',?\s*\]\);/,
    "const [deliverables, setDeliverables] = useState<string[]>([]);"
  );
  updated = updated.replace(
    /const \[exclusions, setExclusions\] = useState<string\[\]>\(\[[\s\S]*?'Structural steel testing lab charges',?\s*\]\);/,
    "const [exclusions, setExclusions] = useState<string[]>([]);"
  );
  return updated;
});

// 6. AssignedRequests.tsx: remove realReqs.slice(0, 3) fallback and filter strictly to assigned
updateFile('apps/web/src/pages/professional/AssignedRequests.tsx', (c) => {
  let updated = c.replace(
    /const matchesExplicit =\s*!r\.assignedProfessionalIds \|\|[\s\S]*?id\.includes\('civil'\)\s*\);/,
    `const matchesExplicit = Boolean(
        currentProId && r.assignedProfessionalIds && r.assignedProfessionalIds.includes(currentProId)
      ) || Boolean(
        user?.phone && r.assignedProfessionalIds && r.assignedProfessionalIds.some(id => id.includes(user.phone.replace(/\\D/g, '').slice(-10)))
      );`
  );
  updated = updated.replace(
    /const mapped = \(allocated\.length > 0 \? allocated : realReqs\.slice\(0, 3\)\)\.map/,
    "const mapped = allocated.map"
  );
  return updated;
});

// 7. ArchitectProfileWizard.tsx: clear hardcoded mock data
updateFile('apps/web/src/pages/architect/ArchitectProfileWizard.tsx', (c) => {
  let updated = c.replace(
    /const \[personal, setPersonal\] = useState\(\{[\s\S]*?bio: 'Licensed Architect with extensive experience[\s\S]*?'\s*\}\);/,
    `const [personal, setPersonal] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    profilePhoto: '',
    designation: '',
    experienceYears: 0,
    bio: '',
  });`
  );
  updated = updated.replace(
    /const \[business, setBusiness\] = useState\(\{[\s\S]*?pincode: '122002',\s*\}\);/,
    `const [business, setBusiness] = useState({
    firmName: '',
    businessType: 'Architecture Firm' as ArchitectBusinessType,
    firmRegistrationNumber: '',
    establishmentYear: new Date().getFullYear(),
    teamSize: 1,
    architectsCount: 1,
    website: '',
    gstin: '',
    panNumber: '',
    coaNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });`
  );
  updated = updated.replace(
    /const \[selectedServices, setSelectedServices\] = useState<string\[\]>\(\[[\s\S]*?'Vastu Shastra Orientation Consultancy',\s*\]\);/,
    "const [selectedServices, setSelectedServices] = useState<string[]>([]);"
  );
  updated = updated.replace(
    /const \[portfolioProjects, setPortfolioProjects\] = useState<ArchitectPortfolioProject\[\]>\(\[[\s\S]*?imageUrl: 'https:\/\/images\.unsplash\.com\/photo-1600585154340-be6161a56a0c\?w=800',\s*\},?\s*\]\);/,
    "const [portfolioProjects, setPortfolioProjects] = useState<ArchitectPortfolioProject[]>([]);"
  );
  updated = updated.replace(
    /const \[kycDocuments, setKycDocuments\] = useState<ArchitectKycDocument\[\]>\(\[[\s\S]*?status: 'VERIFIED',\s*\},?\s*\]\);/,
    "const [kycDocuments, setKycDocuments] = useState<ArchitectKycDocument[]>([]);"
  );
  return updated;
});

// 8. ArchitectRegister.tsx & ArchitectLogin.tsx: remove OTP auto-fill
updateFile('apps/web/src/pages/architect/ArchitectRegister.tsx', (c) => {
  return c.replace(/setOtp\(generatedOtp\);\s*\/\/[^\n]*/g, '// OTP not auto-filled; user enters real OTP');
});
updateFile('apps/web/src/pages/architect/ArchitectLogin.tsx', (c) => {
  return c.replace(/setOtp\(generatedOtp\);\s*\/\/[^\n]*/g, '// OTP not auto-filled; user enters real OTP');
});

// 9. ProfessionalProfile.tsx: remove fallback to list[0]
updateFile('apps/web/src/pages/professional/ProfessionalProfile.tsx', (c) => {
  return c.replace(
    /const list = getProfessionalAccounts\(\);\s*if \(list\.length > 0\) \{\s*setProfessional\(list\[0\]\);\s*\}/,
    `// Do not fallback to another user's profile
    setProfessional(null);`
  );
});

// 10. AdminRequestDetail.tsx: stop auto-generating fake quotes on pro assignment
updateFile('apps/web/src/pages/admin/AdminRequestDetail.tsx', (c) => {
  // Update handleAssignSubmit to just assign pros without generating fake quotes
  const oldAssignRegex = /const updated = updatePlatformRequestStatus\(request\.id, 'QUOTATIONS_AVAILABLE'[\s\S]*?success\(`Assigned \$\{selectedProIds\.length\} professionals and generated competitive quotations for customer!`\);/;
  const newAssignCode = `const updated = updatePlatformRequestStatus(request.id, 'ASSIGNED', {
        assignedCount: selectedProIds.length,
        assignedProfessionalIds: selectedProIds,
        responseDeadline,
        adminNotes: internalNotes,
      });

      broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', [updated]);
      pushToCloud().catch(() => {});

      if (updated) {
        setRequest(updated);
      }
      success(\`Assigned \${selectedProIds.length} certified professionals. They will be notified to review the scope and submit itemized BOQ quotations.\`);`;

  return c.replace(oldAssignRegex, newAssignCode);
});

// 11. MyQuotations.tsx: strict customer filter (never append localQuotes.filter)
updateFile('apps/web/src/pages/customer/MyQuotations.tsx', (c) => {
  return c.replace(
    /const displayQuotes = customerQuotes\.length > 0\s*\?\s*\[\.\.\.customerQuotes, \.\.\.localQuotes\.filter\(\(l\) => !customerQuotes\.some\(\(c\) => c\.id === l\.id\)\)\]\s*:\s*localQuotes;/,
    `const displayQuotes = customerQuotes;`
  );
});

// 12. InteriorDesignerProfileWizard.tsx: clear mock defaults
updateFile('apps/web/src/pages/interior-designer/InteriorDesignerProfileWizard.tsx', (c) => {
  let updated = c.replace(
    /const \[personal, setPersonal\] = useState\(\{[\s\S]*?pincode: '122002',\s*\}\);/,
    `const [personal, setPersonal] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    alternatePhone: '',
    profilePhoto: '',
    dob: '',
    gender: 'Other',
    residentialAddress: '',
    state: '',
    city: '',
    district: '',
    pincode: '',
  });`
  );
  updated = updated.replace(
    /const \[business, setBusiness\] = useState\(\{[\s\S]*?serviceAreas: 'DLF Phase 1-5, Golf Course Extension, South City',\s*\}\);/,
    `const [business, setBusiness] = useState({
    businessName: '',
    businessType: 'Interior Design Center' as InteriorDesignerBusinessType,
    businessRegistrationDate: '',
    businessAddress: '',
    officeContact: '',
    businessEmail: '',
    website: '',
    yearsOfExperience: 0,
    teamSize: 1,
    completedProjectsCount: 0,
    businessDescription: '',
    serviceAreas: '',
  });`
  );
  return updated;
});

console.log('--- Real Data Fixes Applied ---');
