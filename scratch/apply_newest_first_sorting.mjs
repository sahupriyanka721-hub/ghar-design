import fs from 'fs';
import path from 'path';

const projectRoot = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';

// ----------------------------------------------------
// 1. UPDATE architectStore.ts
// ----------------------------------------------------
const archPath = path.join(projectRoot, 'apps/web/src/data/architectStore.ts');
let archContent = fs.readFileSync(archPath, 'utf8');

// In getArchitectAccounts: ensure sorting descending
archContent = archContent.replace(
  'const filtered = Array.from(map.values());\n    return filtered;',
  `const filtered = Array.from(map.values());
    filtered.sort((a, b) => {
      const timeA = new Date(a.registeredAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.registeredAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
    return filtered;`
);

// In saveArchitectAccount: unshift instead of push
archContent = archContent.replace(
  'current.push(updated);',
  'current.unshift(updated);'
);

// Also when updating existing architect, move to index 0 (top)
archContent = archContent.replace(
  `  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...acc,
      updatedAt: now,
    };
    current[existingIdx] = updated;
  }`,
  `  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...acc,
      updatedAt: now,
    };
    current.splice(existingIdx, 1);
    current.unshift(updated);
  }`
);

fs.writeFileSync(archPath, archContent, 'utf8');
console.log('architectStore.ts updated: Newest architects first!');

// ----------------------------------------------------
// 2. UPDATE AdminArchitects.tsx
// ----------------------------------------------------
const adminArchPath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminArchitects.tsx');
let adminArchContent = fs.readFileSync(adminArchPath, 'utf8');

adminArchContent = adminArchContent.replace(
  `    return matchesTab && matchesSearch;
  });`,
  `    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    const timeA = new Date(a.registeredAt || a.updatedAt || 0).getTime();
    const timeB = new Date(b.registeredAt || b.updatedAt || 0).getTime();
    return timeB - timeA;
  });`
);

fs.writeFileSync(adminArchPath, adminArchContent, 'utf8');
console.log('AdminArchitects.tsx updated: Newest architects always at top!');

// ----------------------------------------------------
// 3. UPDATE customerStore.ts
// ----------------------------------------------------
const custPath = path.join(projectRoot, 'apps/web/src/data/customerStore.ts');
let custContent = fs.readFileSync(custPath, 'utf8');

// In getRegisteredCustomers: sort by registeredAt descending
custContent = custContent.replace(
  `        return parsed.filter(
          (c) =>
            c.id !== 'usr-cust-1' &&
            c.id !== 'usr-cust-2' &&
            c.id !== 'usr-cust-3' &&
            c.id !== 'usr-cust-demo' &&
            !c.name?.toLowerCase().includes('vikram') &&
            !c.name?.toLowerCase().includes('priya sundaram') &&
            !c.name?.toLowerCase().includes('rajesh bakshi') &&
            !c.phone?.includes('9876543220')
        );`,
  `        const valid = parsed.filter(
          (c) =>
            c.id !== 'usr-cust-1' &&
            c.id !== 'usr-cust-2' &&
            c.id !== 'usr-cust-3' &&
            c.id !== 'usr-cust-demo' &&
            !c.name?.toLowerCase().includes('vikram') &&
            !c.name?.toLowerCase().includes('priya sundaram') &&
            !c.name?.toLowerCase().includes('rajesh bakshi') &&
            !c.phone?.includes('9876543220')
        );
        valid.sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());
        return valid;`
);

// In registerNewCustomer: when updating existing customer, move to top
custContent = custContent.replace(
  `  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...newCust,
      requestsCount: Math.max(updatedList[existingIndex].requestsCount || 0, newCust.requestsCount),
      bookingsCount: Math.max(updatedList[existingIndex].bookingsCount || 0, newCust.bookingsCount),
      materialOrdersCount: Math.max(updatedList[existingIndex].materialOrdersCount || 0, newCust.materialOrdersCount),
    };
  } else {
    updatedList = [newCust, ...current];
  }`,
  `  if (existingIndex >= 0) {
    const updatedCust = {
      ...current[existingIndex],
      ...newCust,
      requestsCount: Math.max(current[existingIndex].requestsCount || 0, newCust.requestsCount),
      bookingsCount: Math.max(current[existingIndex].bookingsCount || 0, newCust.bookingsCount),
      materialOrdersCount: Math.max(current[existingIndex].materialOrdersCount || 0, newCust.materialOrdersCount),
    };
    const remaining = current.filter((_, idx) => idx !== existingIndex);
    updatedList = [updatedCust, ...remaining];
  } else {
    updatedList = [newCust, ...current];
  }`
);

fs.writeFileSync(custPath, custContent, 'utf8');
console.log('customerStore.ts updated: Newest customers first!');

// ----------------------------------------------------
// 4. UPDATE AdminCustomers.tsx
// ----------------------------------------------------
const adminCustPath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminCustomers.tsx');
let adminCustContent = fs.readFileSync(adminCustPath, 'utf8');

adminCustContent = adminCustContent.replace(
  `    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });`,
  `    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());`
);

fs.writeFileSync(adminCustPath, adminCustContent, 'utf8');
console.log('AdminCustomers.tsx updated: Newest customers always at top!');

// ----------------------------------------------------
// 5. UPDATE interiorDesignerStore.ts
// ----------------------------------------------------
const interiorPath = path.join(projectRoot, 'apps/web/src/data/interiorDesignerStore.ts');
let interiorContent = fs.readFileSync(interiorPath, 'utf8');

// In getInteriorDesignerAccounts: sort descending
interiorContent = interiorContent.replace(
  `        return parsed.filter(
          (d: any) =>
            d.id !== 'id-101' &&
            d.id !== 'id-102' &&
            d.id !== 'id-103' &&
            d.id !== 'id-104' &&
            d.id !== 'id-105' &&
            !d.name?.toLowerCase().includes('pooja mehra') &&
            !d.name?.toLowerCase().includes('rohan varma') &&
            !d.name?.toLowerCase().includes('ananya roy') &&
            !d.name?.toLowerCase().includes('simran bajaj')
        );`,
  `        const valid = parsed.filter(
          (d: any) =>
            d.id !== 'id-101' &&
            d.id !== 'id-102' &&
            d.id !== 'id-103' &&
            d.id !== 'id-104' &&
            d.id !== 'id-105' &&
            !d.name?.toLowerCase().includes('pooja mehra') &&
            !d.name?.toLowerCase().includes('rohan varma') &&
            !d.name?.toLowerCase().includes('ananya roy') &&
            !d.name?.toLowerCase().includes('simran bajaj')
        );
        valid.sort((a, b) => new Date(b.registeredAt || b.updatedAt || 0).getTime() - new Date(a.registeredAt || a.updatedAt || 0).getTime());
        return valid;`
);

// In saveInteriorDesignerAccount: unshift instead of push
interiorContent = interiorContent.replace(
  'current.push(updated);',
  'current.unshift(updated);'
);

// If existing interior designer, move to top
interiorContent = interiorContent.replace(
  `  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...acc,
      updatedAt: now,
    };
    current[existingIdx] = updated;
  }`,
  `  if (existingIdx >= 0) {
    updated = {
      ...current[existingIdx],
      ...acc,
      updatedAt: now,
    };
    current.splice(existingIdx, 1);
    current.unshift(updated);
  }`
);

fs.writeFileSync(interiorPath, interiorContent, 'utf8');
console.log('interiorDesignerStore.ts updated: Newest interior designers first!');

// ----------------------------------------------------
// 6. UPDATE AdminInteriorDesigners.tsx
// ----------------------------------------------------
const adminInteriorPath = path.join(projectRoot, 'apps/web/src/pages/admin/AdminInteriorDesigners.tsx');
let adminInteriorContent = fs.readFileSync(adminInteriorPath, 'utf8');

adminInteriorContent = adminInteriorContent.replace(
  `    return matchesTab && matchesSearch;
  });`,
  `    return matchesTab && matchesSearch;
  }).sort((a, b) => new Date(b.registeredAt || b.updatedAt || 0).getTime() - new Date(a.registeredAt || a.updatedAt || 0).getTime());`
);

fs.writeFileSync(adminInteriorPath, adminInteriorContent, 'utf8');
console.log('AdminInteriorDesigners.tsx updated: Newest designers always at top!');

console.log('ALL TABLES UPDATED: Newest customer, architect, and interior designer will ALWAYS appear at the VERY TOP!');
