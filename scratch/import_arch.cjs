const fs = require('fs');
const file = 'apps/web/src/context/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');
const target = "import { getVendorByPhone, getRegisteredVendors } from '../data/vendorStore.js';";
const replacement = "import { getVendorByPhone, getRegisteredVendors } from '../data/vendorStore.js';\nimport { getArchitectByPhone } from '../data/architectStore.js';";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully imported getArchitectByPhone in AuthContext.tsx');
} else {
  console.error('Target not found in AuthContext.tsx');
}
