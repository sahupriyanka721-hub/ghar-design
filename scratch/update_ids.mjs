import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';

// 1. Update architectStore.ts to export generateArchitectId and use it
const archStorePath = path.join(projectRoot, 'apps/web/src/data/architectStore.ts');
let archStore = fs.readFileSync(archStorePath, 'utf8');

if (!archStore.includes('generateArchitectId')) {
  const insertBefore = 'export const saveArchitectAccount =';
  const helperCode = `
export const generateArchitectId = (prefix: 'BG/QUO' | 'BG/ARC' = 'BG/QUO'): string => {
  let count = 1;
  try {
    const current = getArchitectAccounts();
    let maxSeq = 0;
    for (const a of current) {
      const match = (a.id || '').match(/BG\\/(?:QUO|ARC)\\/(\\d+)/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    count = Math.max(current.length + 1, maxSeq + 1);
  } catch (e) {}
  return \`\${prefix}/\${String(count).padStart(4, '0')}\`;
};

`;
  archStore = archStore.replace(insertBefore, helperCode + insertBefore);
}

// In saveArchitectAccount, ensure we use generateArchitectId if id is not present or starts with arch-
archStore = archStore.replace(
  'id: acc.id || `arch-${Date.now()}`,',
  'id: (acc.id && !acc.id.startsWith("arch-")) ? acc.id : generateArchitectId(),'
);

fs.writeFileSync(archStorePath, archStore, 'utf8');
console.log('architectStore.ts updated successfully');

// 2. Update AuthContext.tsx
const authPath = path.join(projectRoot, 'apps/web/src/context/AuthContext.tsx');
let authContent = fs.readFileSync(authPath, 'utf8');

if (!authContent.includes('generateCustomerId')) {
  authContent = authContent.replace(
    'getCustomerByPhone,',
    'getCustomerByPhone,\n  generateCustomerId,'
  );
}

authContent = authContent.replace(
  "id: `usr-cust-${Date.now()}`,",
  "id: generateCustomerId(name?.trim()),"
);

authContent = authContent.replace(
  "id: `usr-cust-${Date.now()}`,",
  "id: generateCustomerId(signupData.fullName),"
);

fs.writeFileSync(authPath, authContent, 'utf8');
console.log('AuthContext.tsx updated successfully');

// 3. Update AdminQuotationsReview.tsx
const adminQuotePath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminQuotationsReview.tsx');
let adminQuote = fs.readFileSync(adminQuotePath, 'utf8');

if (!adminQuote.includes('generateQuotationCode')) {
  adminQuote = adminQuote.replace(
    "import {",
    "import {\n  generateQuotationCode,"
  );
}

adminQuote = adminQuote.replace(
  "quotationCode: `QT-2026-${Date.now().toString().slice(-4)}`,",
  "quotationCode: generateQuotationCode(),"
);

fs.writeFileSync(adminQuotePath, adminQuote, 'utf8');
console.log('AdminQuotationsReview.tsx updated successfully');

// 4. Update QuotationBuilder.tsx
const quoteBuilderPath = path.join(projectRoot, 'apps/web/src/pages/professional/QuotationBuilder.tsx');
let quoteBuilder = fs.readFileSync(quoteBuilderPath, 'utf8');

if (!quoteBuilder.includes('generateQuotationCode')) {
  quoteBuilder = quoteBuilder.replace(
    "import { useAuth }",
    "import { generateQuotationCode } from '../../data/customerStore.js';\nimport { useAuth }"
  );
}

quoteBuilder = quoteBuilder.replace(
  "const quoteCode = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;",
  "const quoteCode = generateQuotationCode();"
);

fs.writeFileSync(quoteBuilderPath, quoteBuilder, 'utf8');
console.log('QuotationBuilder.tsx updated successfully');

// 5. Update ArchitectProfileWizard.tsx
const wizardPath = path.join(projectRoot, 'apps/web/src/pages/architect/ArchitectProfileWizard.tsx');
let wizard = fs.readFileSync(wizardPath, 'utf8');

if (!wizard.includes('generateArchitectId')) {
  wizard = wizard.replace(
    'saveArchitectAccount,',
    'saveArchitectAccount,\n  generateArchitectId,'
  );
}

wizard = wizard.replace(
  "id: `arch-${cleanUserPhone}`,",
  "id: getArchitectByPhone(cleanUserPhone)?.id || generateArchitectId(),"
);

fs.writeFileSync(wizardPath, wizard, 'utf8');
console.log('ArchitectProfileWizard.tsx updated successfully');

console.log('All ID generation logic updated!');
