import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';

// 1. Update AdminArchitects.tsx
const adminArchPath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminArchitects.tsx');
let adminArch = fs.readFileSync(adminArchPath, 'utf8');

adminArch = adminArch.replace(
  '<div className="text-[10px] font-mono text-slate-400 mt-0.5">Ph: +91 {arch.phone}</div>',
  `<div className="flex items-center gap-2 mt-0.5 flex-wrap">
    <span className="text-[10px] font-mono text-slate-400">Ph: +91 {arch.phone}</span>
    <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-bold">
      {arch.id}
    </span>
  </div>`
);

adminArch = adminArch.replace(
  '{selectedArchitect.firmName || (selectedArchitect as any).firm || \'Architectural Firm\'} • {selectedArchitect.city} • COA: {selectedArchitect.coaNumber || \'COA Verified\'}',
  'Architect ID: <span className="text-amber-400 font-bold">{selectedArchitect.id}</span> • {selectedArchitect.firmName || (selectedArchitect as any).firm || \'Architectural Firm\'} • {selectedArchitect.city} • COA: {selectedArchitect.coaNumber || \'COA Verified\'}'
);

fs.writeFileSync(adminArchPath, adminArch, 'utf8');
console.log('AdminArchitects.tsx UI updated with Architect ID badge and modal header!');

// 2. Update ArchitectApplicationStatus.tsx
const appStatusPath = path.join(projectRoot, 'apps/web/src/pages/architect/ArchitectApplicationStatus.tsx');
let appStatus = fs.readFileSync(appStatusPath, 'utf8');

appStatus = appStatus.replace(
  '<div className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase font-mono mb-1">',
  `<div className="flex items-center gap-2 mb-1 flex-wrap">
    <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase font-mono">
      Application Under Verification
    </span>
    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-mono font-bold border border-sky-300">
      ID: {architect?.id || 'BG/QUO/0001'}
    </span>
  </div>
  <div className="hidden">`
);

fs.writeFileSync(appStatusPath, appStatus, 'utf8');
console.log('ArchitectApplicationStatus.tsx UI updated with Partner ID badge!');

// 3. Update AdminCustomers.tsx
const adminCustPath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminCustomers.tsx');
let adminCust = fs.readFileSync(adminCustPath, 'utf8');

adminCust = adminCust.replace(
  '<span className="font-semibold text-slate-700">{c.phone}</span>',
  `<span className="font-semibold text-slate-700">{c.phone}</span>
  <span className="px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono text-[10px] font-bold">
    {c.id}
  </span>`
);

fs.writeFileSync(adminCustPath, adminCust, 'utf8');
console.log('AdminCustomers.tsx UI updated with Customer ID badge!');
