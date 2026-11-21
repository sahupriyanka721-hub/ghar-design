const fs = require('fs');
const path = require('path');

const root = process.cwd();

// Update customerStore.ts
const custStorePath = path.join(root, 'apps/web/src/data/customerStore.ts');
let custStore = fs.readFileSync(custStorePath, 'utf8');

const isDummyFn = `    const dummyFirmKeywords = [
      'rathore heritage', 'apex civil engineering', 'buildcraft turnkey',
      'apex architecture', 'sharma designs', 'sharma engineering', 'singhania architectural',
      'studio kulkarni', 'yadav civil', 'apex turnkey build', 'luxe spaces',
    ];
    const dummyProKeywords = [
      'rajesh kumar sharma', 'amit verma', 'devendra rathore',
      'ananya singhania', 'neha kulkarni', 'rajesh sharma', 'rajesh verma',
      'surender yadav', 'maheshwar rao', 'gurpreet singh',
    ];
    const dummyCodes = new Set([
      'GHR-ORD-2026-9042', 'GHR-ORD-2026-8812',
      'GHR-REQ-2026-1001', 'GHR-REQ-2026-301', 'GHR-REQ-2026-302', 'GHR-REQ-2026-303', 'GHR-REQ-2026-304',
      'req-1001', 'req-301', 'req-302', 'req-303', 'req-304',
      'PAY-REQ-1001', 'PAY-REQ-1002',
      'BK-2026-8492', 'BK-2026-5501', 'BK-2026-5502',
      'bk-5501', 'bk-5502',
      'QT-2026-001', 'QT-2026-002', 'QT-2026-801', 'QT-2026-802', 'QT-2026-803',
      'qt-101', 'qt-102',
    ]);
    const dummyNames = ['vikram', 'priya singhania', 'priya sundaram', 'rajesh bakshi', 'arvind mehta', 'rohit khanna', 'ananya sharma', 'demo'];
    const dummyPhones = ['9876543220', '9811225588', '9922336699', '9810987654', '9812345678', '9822114455'];

    const isDummy = (item: any): boolean => {
      if (!item) return true;
      if (dummyIds.has(item.id) || dummyIds.has(item.customerId) || dummyIds.has(item.requestId)) return true;
      if (dummyCodes.has(item.requestCode) || dummyCodes.has(item.bookingCode) || dummyCodes.has(item.orderCode) || dummyCodes.has(item.quotationCode)) return true;
      
      const name = (item.name || item.customerName || '').toLowerCase();
      if (dummyNames.some((dn) => name.includes(dn))) return true;
      
      const phone = (item.phone || item.customerPhone || '');
      if (dummyPhones.some((dp) => phone.includes(dp))) return true;

      // Dummy professional or firm check
      const proName = (item.professionalName || item.professional?.name || '').toLowerCase();
      if (dummyProKeywords.some((dp) => proName.includes(dp))) return true;

      const firm = (item.firmName || item.professional?.firmName || '').toLowerCase();
      if (dummyFirmKeywords.some((df) => firm.includes(df))) return true;

      // Old mock quotation specifications check
      const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
      if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return true;

      return false;
    };`;

custStore = custStore.replace(
  /const dummyCodes = new Set\(\[[\s\S]*?return false;\s*\};/,
  isDummyFn
);

fs.writeFileSync(custStorePath, custStore, 'utf8');
console.log('Updated customerStore.ts isDummy logic');

// Update cloudSync.ts
const cloudSyncPath = path.join(root, 'apps/web/src/data/cloudSync.ts');
let cloudSync = fs.readFileSync(cloudSyncPath, 'utf8');
cloudSync = cloudSync.replace(
  /const dummyCodes = new Set\(\[[\s\S]*?return list\.filter\(\(item\) => \{[\s\S]*?return true;\s*\}\);/,
  `const dummyFirmKeywords = [
    'rathore heritage', 'apex civil engineering', 'buildcraft turnkey',
    'apex architecture', 'sharma designs', 'sharma engineering', 'singhania architectural',
    'studio kulkarni', 'yadav civil', 'apex turnkey build', 'luxe spaces',
  ];
  const dummyProKeywords = [
    'rajesh kumar sharma', 'amit verma', 'devendra rathore',
    'ananya singhania', 'neha kulkarni', 'rajesh sharma', 'rajesh verma',
    'surender yadav', 'maheshwar rao', 'gurpreet singh',
  ];
  const dummyCodes = new Set([
    'GHR-ORD-2026-9042', 'GHR-ORD-2026-8812',
    'GHR-REQ-2026-1001', 'GHR-REQ-2026-301', 'GHR-REQ-2026-302', 'GHR-REQ-2026-303', 'GHR-REQ-2026-304',
    'req-1001', 'req-301', 'req-302', 'req-303', 'req-304',
    'PAY-REQ-1001', 'PAY-REQ-1002',
    'BK-2026-8492', 'BK-2026-5501', 'BK-2026-5502',
    'bk-5501', 'bk-5502',
    'QT-2026-001', 'QT-2026-002', 'QT-2026-801', 'QT-2026-802', 'QT-2026-803',
    'qt-101', 'qt-102',
  ]);
  const dummyNames = ['vikram', 'priya singhania', 'priya sundaram', 'rajesh bakshi', 'arvind mehta', 'rohit khanna', 'ananya sharma', 'demo'];
  const dummyPhones = ['9876543220', '9811225588', '9922336699', '9810987654', '9812345678', '9822114455'];

  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (dummyIds.has(item.id) || dummyIds.has(item.customerId) || dummyIds.has(item.requestId)) return false;
    if (dummyCodes.has(item.requestCode) || dummyCodes.has(item.bookingCode) || dummyCodes.has(item.orderCode) || dummyCodes.has(item.quotationCode)) return false;
    
    const name = (item.name || item.customerName || '').toLowerCase();
    if (dummyNames.some((dn) => name.includes(dn))) return false;
    
    const phone = (item.phone || item.customerPhone || '');
    if (dummyPhones.some((dp) => phone.includes(dp))) return false;

    const proName = (item.professionalName || item.professional?.name || '').toLowerCase();
    if (dummyProKeywords.some((dp) => proName.includes(dp))) return false;

    const firm = (item.firmName || item.professional?.firmName || '').toLowerCase();
    if (dummyFirmKeywords.some((df) => firm.includes(df))) return false;

    const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
    if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return false;

    return true;
  });`
);
fs.writeFileSync(cloudSyncPath, cloudSync, 'utf8');
console.log('Updated cloudSync.ts cleanRecords logic');

// Update api/sync.ts
const apiSyncPath = path.join(root, 'api/sync.ts');
let apiSync = fs.readFileSync(apiSyncPath, 'utf8');
apiSync = apiSync.replace(
  /function cleanList\(list: any\[\]\): any\[\] \{[\s\S]*?return true;\s*\}\);\s*\}/,
  `function cleanList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set([
    'usr-cust-1', 'usr-cust-2', 'usr-cust-3', 'usr-cust-demo',
    'usr-cust-101', 'usr-cust-102', 'usr-cust-103', 'usr-cust-104', 'usr-cust-105', 'usr-cust-106',
    'cust-301', 'cust-302', 'cust-303', 'cust-304',
    'req-301', 'req-302', 'req-303', 'req-304', 'req-1001',
    'bk-5501', 'bk-5502',
  ]);
  const dummyCodes = new Set([
    'GHR-ORD-2026-9042', 'GHR-ORD-2026-8812',
    'GHR-REQ-2026-1001', 'GHR-REQ-2026-301', 'GHR-REQ-2026-302', 'GHR-REQ-2026-303', 'GHR-REQ-2026-304',
    'req-1001', 'req-301', 'req-302', 'req-303', 'req-304',
    'PAY-REQ-1001', 'PAY-REQ-1002',
    'BK-2026-8492', 'BK-2026-5501', 'BK-2026-5502',
    'bk-5501', 'bk-5502',
    'QT-2026-001', 'QT-2026-002', 'QT-2026-801', 'QT-2026-802', 'QT-2026-803',
    'qt-101', 'qt-102',
  ]);
  const dummyNames = ['vikram', 'priya singhania', 'priya sundaram', 'rajesh bakshi', 'arvind mehta', 'rohit khanna', 'ananya sharma', 'demo'];
  const dummyPhones = ['9876543220', '9811225588', '9922336699', '9810987654', '9812345678', '9822114455'];
  const dummyFirmKeywords = [
    'rathore heritage', 'apex civil engineering', 'buildcraft turnkey',
    'apex architecture', 'sharma designs', 'sharma engineering', 'singhania architectural',
    'studio kulkarni', 'yadav civil', 'apex turnkey build', 'luxe spaces',
  ];
  const dummyProKeywords = [
    'rajesh kumar sharma', 'amit verma', 'devendra rathore',
    'ananya singhania', 'neha kulkarni', 'rajesh sharma', 'rajesh verma',
    'surender yadav', 'maheshwar rao', 'gurpreet singh',
  ];

  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (dummyIds.has(item.id) || dummyIds.has(item.customerId) || dummyIds.has(item.requestId)) return false;
    if (dummyCodes.has(item.requestCode) || dummyCodes.has(item.bookingCode) || dummyCodes.has(item.orderCode) || dummyCodes.has(item.quotationCode)) return false;
    
    const name = (item.name || item.customerName || '').toLowerCase();
    if (dummyNames.some((dn) => name.includes(dn))) return false;
    
    const phone = (item.phone || item.customerPhone || '');
    if (dummyPhones.some((dp) => phone.includes(dp))) return false;

    const proName = (item.professionalName || item.professional?.name || '').toLowerCase();
    if (dummyProKeywords.some((dp) => proName.includes(dp))) return false;

    const firm = (item.firmName || item.professional?.firmName || '').toLowerCase();
    if (dummyFirmKeywords.some((df) => firm.includes(df))) return false;

    const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
    if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return false;

    return true;
  });
}`
);
fs.writeFileSync(apiSyncPath, apiSync, 'utf8');
console.log('Updated api/sync.ts cleanList logic');
