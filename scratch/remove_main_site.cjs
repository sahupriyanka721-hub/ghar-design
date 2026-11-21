const fs = require('fs');
const path = require('path');

const root = process.cwd();

// 1. ArchitectHeader.tsx
const archHeaderPath = path.join(root, 'apps/web/src/components/navigation/ArchitectHeader.tsx');
let arch = fs.readFileSync(archHeaderPath, 'utf8');

// Remove Homeowner Main Site from dropdown
arch = arch.replace(
  /<Link\s+to="\/"\s+onClick=\{\(\) => setPartnerSwitcherOpen\(false\)\}\s+className="flex items-center gap-3 p-2\.5 rounded-xl hover:bg-slate-50 transition group"[\s\S]*?<\/Link>/,
  ''
);

// Remove Quick link to main site on tablet
arch = arch.replace(
  /\{\/\* Quick link to main site on tablet \*\/\}\s*<Link\s+to="\/"\s+className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 transition"[\s\S]*?<\/Link>/,
  ''
);

// Remove Main Site from mobile drawer switch portals
arch = arch.replace(
  /<div className="grid grid-cols-3 gap-2">\s*<Link\s+to="\/"\s+className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-\[11px\] font-bold text-slate-700"\s*>\s*Main Site\s*<\/Link>/,
  '<div className="grid grid-cols-2 gap-2">'
);

// Remove unused Home icon import if no longer used
if (!arch.includes('<Home')) {
  arch = arch.replace(/,\s*Home\b/, '').replace(/\bHome\s*,/, '');
}

fs.writeFileSync(archHeaderPath, arch, 'utf8');
console.log('Updated ArchitectHeader.tsx');

// 2. InteriorDesignerHeader.tsx
const intHeaderPath = path.join(root, 'apps/web/src/components/navigation/InteriorDesignerHeader.tsx');
let intH = fs.readFileSync(intHeaderPath, 'utf8');

// Remove Homeowner Main Site from dropdown
intH = intH.replace(
  /<Link\s+to="\/"\s+onClick=\{\(\) => setPartnerSwitcherOpen\(false\)\}\s+className="flex items-center gap-3 p-2\.5 rounded-xl hover:bg-slate-50 transition group"[\s\S]*?<\/Link>/,
  ''
);

// Remove Quick link to main site
intH = intH.replace(
  /\{\/\* Quick link to main site \*\/\}\s*<Link\s+to="\/"\s+className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 transition"[\s\S]*?<\/Link>/,
  ''
);

// Remove Main Site from mobile drawer
intH = intH.replace(
  /<div className="grid grid-cols-3 gap-2">\s*<Link\s+to="\/"\s+className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-\[11px\] font-bold text-slate-700"\s*>\s*Main Site\s*<\/Link>/,
  '<div className="grid grid-cols-2 gap-2">'
);

if (!intH.includes('<Home')) {
  intH = intH.replace(/,\s*Home\b/, '').replace(/\bHome\s*,/, '');
}

fs.writeFileSync(intHeaderPath, intH, 'utf8');
console.log('Updated InteriorDesignerHeader.tsx');

// 3. VendorHeader.tsx
const venHeaderPath = path.join(root, 'apps/web/src/components/navigation/VendorHeader.tsx');
let ven = fs.readFileSync(venHeaderPath, 'utf8');

// Remove Homeowner Main Site from dropdown
ven = ven.replace(
  /<Link\s+to="\/"\s+onClick=\{\(\) => setPartnerSwitcherOpen\(false\)\}\s+className="flex items-center gap-3 p-2\.5 rounded-xl hover:bg-slate-50 transition group"[\s\S]*?<\/Link>/,
  ''
);

// Remove Quick link to main site
ven = ven.replace(
  /\{\/\* Quick link to main site \*\/\}\s*<Link\s+to="\/"\s+className="hidden xl:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 transition"[\s\S]*?<\/Link>/,
  ''
);

// Remove Main Site from mobile drawer
ven = ven.replace(
  /<div className="grid grid-cols-3 gap-2">\s*<Link\s+to="\/"\s+className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-\[11px\] font-bold text-slate-700"\s*>\s*Main Site\s*<\/Link>/,
  '<div className="grid grid-cols-2 gap-2">'
);

if (!ven.includes('<Home')) {
  ven = ven.replace(/,\s*Home\b/, '').replace(/\bHome\s*,/, '');
}

fs.writeFileSync(venHeaderPath, ven, 'utf8');
console.log('Updated VendorHeader.tsx');
