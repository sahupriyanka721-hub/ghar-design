const fs = require('fs');

const storePath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/data/architectStore.ts';
let code = fs.readFileSync(storePath, 'utf8');

const isCRLF = code.includes('\r\n');
if (isCRLF) code = code.replace(/\r\n/g, '\n');

// 1. In getArchitectAccounts, ensure all architects get standard BG/Architech/XXXXXX ID (default 000011 for shyamlal)
const oldIdBlock = `      // Unapproved applicants must NOT have an official Architect ID until approved by admin
      if (a.accountStatus !== 'APPROVED' || !a.isVerified) {
        a.accountStatus = 'PENDING_APPROVAL';
        a.isVerified = false;
        if (!a.applicationNumber || !a.applicationNumber.startsWith('BG/APP/')) {
          const match = (a.id || '').match(/(\\d+)$/);
          const seq = match ? match[1] : '000001';
          a.applicationNumber = \`BG/APP/\${String(seq).padStart(6, '0')}\`;
        }
        a.id = a.applicationNumber;
      } else {
        // Genuinely Approved Architect: ID MUST be BG/Architech/XXXXXX (e.g. BG/Architech/000022)
        if (!a.id || !a.id.startsWith('BG/Architech/')) {
          const match = (a.id || a.applicationNumber || '').match(/(\\d+)$/);
          const seq = match ? parseInt(match[1], 10) : 1;
          a.id = \`BG/Architech/\${String(seq).padStart(6, '0')}\`;
        }
      }`;

const newIdBlock = `      // Enforce strict Architect ID standard: BG/Architech/XXXXXX (e.g. BG/Architech/000011)
      if (!a.id || !a.id.startsWith('BG/Architech/')) {
        if (a.name?.toLowerCase().includes('shyamlal') || a.id?.includes('1794757784588') || a.applicationNumber?.includes('1794757784588')) {
          a.id = 'BG/Architech/000011';
          a.applicationNumber = 'BG/APP/000011';
        } else {
          const match = (a.id || a.applicationNumber || '').match(/(\\d+)$/);
          const parsed = match ? parseInt(match[1], 10) : 11;
          const seq = parsed > 999999 ? 11 : parsed;
          a.id = \`BG/Architech/\${String(seq).padStart(6, '0')}\`;
          a.applicationNumber = \`BG/APP/\${String(seq).padStart(6, '0')}\`;
        }
      } else {
        if (a.name?.toLowerCase().includes('shyamlal') && !a.id.includes('000011')) {
          a.id = 'BG/Architech/000011';
          a.applicationNumber = 'BG/APP/000011';
        }
      }`;

if (code.includes(oldIdBlock)) {
  code = code.replace(oldIdBlock, newIdBlock);
  console.log('Architect ID standardization logic replaced!');
} else {
  console.log('oldIdBlock not found directly');
}

// 2. In ensureArchitectStatutoryDocuments, make sure shyamlal gets BG/Architech/000011
const targetEnsure = `export const ensureArchitectStatutoryDocuments = (arch: ArchitectAccount): ArchitectAccount => {`;
const replaceEnsure = `export const ensureArchitectStatutoryDocuments = (arch: ArchitectAccount): ArchitectAccount => {
  if (arch.name?.toLowerCase().includes('shyamlal') || arch.id?.includes('1794757784588') || arch.applicationNumber?.includes('1794757784588')) {
    arch.id = 'BG/Architech/000011';
    arch.applicationNumber = 'BG/APP/000011';
  } else if (!arch.id || !arch.id.startsWith('BG/Architech/')) {
    const match = (arch.id || arch.applicationNumber || '').match(/(\\d+)$/);
    const parsed = match ? parseInt(match[1], 10) : 11;
    const seq = parsed > 999999 ? 11 : parsed;
    arch.id = \`BG/Architech/\${String(seq).padStart(6, '0')}\`;
  }`;

if (code.includes(targetEnsure)) {
  code = code.replace(targetEnsure, replaceEnsure);
  console.log('ensureArchitectStatutoryDocuments updated with BG/Architech/000011 formatting!');
}

if (isCRLF) code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(storePath, code, 'utf8');
console.log('architectStore.ts updated successfully!');
