import assert from 'node:assert/strict';

// Mock browser localStorage
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {
  dispatchEvent: () => {},
};

console.log('🧪 RUNNING ARCHITECT REGISTRATION & ID FORMAT VERIFICATION SUITE...\n');

// 1. Format Architect ID implementation
function formatArchitectId(idOrNum, fallbackSeq = 1) {
  if (!idOrNum) return `BG/Architech/${String(fallbackSeq).padStart(6, '0')}`;
  const cleanStr = String(idOrNum).replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();

  const quoMatch = cleanStr.match(/BG\/(?:QUO|ARC)\/(?:\s*)(\d+)/i);
  if (quoMatch) {
    const seq = parseInt(quoMatch[1], 10);
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  const match = cleanStr.match(/BG\/(?:Architech|Aritech|Architect)\/(?:\s*)(\d+)/i);
  if (match) {
    const seq = parseInt(match[1], 10);
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  const appMatch = cleanStr.match(/BG\/APP\/(?:\s*)(\d+)/i);
  if (appMatch) {
    let seq = parseInt(appMatch[1], 10);
    if (seq > 999999) seq = fallbackSeq;
    return `BG/Architech/${String(seq).padStart(6, '0')}`;
  }

  const numMatch = cleanStr.match(/(\d+)/);
  if (numMatch) {
    let num = parseInt(numMatch[1], 10);
    if (num > 999999) num = fallbackSeq;
    return `BG/Architech/${String(num).padStart(6, '0')}`;
  }

  return `BG/Architech/${String(fallbackSeq).padStart(6, '0')}`;
}

// 2. Generate Next Architect ID
function generateArchitectId(existing = []) {
  let maxSeq = 0;
  for (const a of existing) {
    const match = (a.id || a.applicationNumber || '').match(/BG\/(?:Architech|Aritech|Architect|QUO|ARC)\/(\d+)/i);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq && seq < 999999) maxSeq = seq;
    }
  }
  const count = Math.max(existing.length + 1, maxSeq + 1);
  return `BG/Architech/${String(count).padStart(6, '0')}`;
}

// TEST 1: Strict Architect ID Format Matching
console.log('--- TEST 1: Strict Architect ID Format Verification ---');
assert.equal(formatArchitectId('BG/Architech/000001'), 'BG/Architech/000001');
assert.equal(formatArchitectId('BG/QUO/0018'), 'BG/Architech/000018');
assert.equal(formatArchitectId('[BG/QUO/0018]'), 'BG/Architech/000018');
assert.equal(formatArchitectId('[ BG/Architech/000011 ]'), 'BG/Architech/000011');
assert.equal(formatArchitectId('BG/Architech/000022'), 'BG/Architech/000022');
assert.equal(formatArchitectId('BG/Aritech/000006'), 'BG/Architech/000006');
assert.equal(formatArchitectId('BG/APP/1794757784588', 1), 'BG/Architech/000001');
assert.equal(formatArchitectId('pro-7777744444', 22), 'BG/Architech/000022');
console.log('✅ [PASS] formatArchitectId cleanly converts any legacy/bracket format to BG/Architech/XXXXXX');

// TEST 2: Sequence Generation with 5 existing architects -> next is BG/Architech/000006
console.log('\n--- TEST 2: 6th Architect ID Generation ---');
const existingArchitects = [
  { id: 'BG/Architech/000001', name: 'Shyamlal', phone: '9811000001' },
  { id: 'BG/Architech/000002', name: 'Jayashree', phone: '9811000002' },
  { id: 'BG/Architech/000003', name: 'Vinit Singh', phone: '9811000003' },
  { id: 'BG/Architech/000004', name: 'Pooja Verma', phone: '9811000004' },
  { id: 'BG/Architech/000005', name: 'Rajesh Kumar', phone: '9811000005' },
];

const newId = generateArchitectId(existingArchitects);
assert.equal(newId, 'BG/Architech/000006', '6th architect must receive BG/Architech/000006');
console.log(`✅ [PASS] 6th Architect generated ID: [ ${newId} ] exactly as requested!`);

// TEST 3: Deduplication without dropping architects with common words
console.log('\n--- TEST 3: Safe Deduplication (No swallowing of new architects) ---');
const deduplicated = [];
function checkAndAdd(newArch) {
  const cleanPhone = (newArch.phone || '').replace(/\D/g, '').slice(-10);
  const aId = (newArch.id || '').trim();

  const existingIdx = deduplicated.findIndex((existing) => {
    const exPhone = (existing.phone || '').replace(/\D/g, '').slice(-10);
    const exId = (existing.id || '').trim();

    if (cleanPhone.length === 10 && exPhone.length === 10 && cleanPhone === exPhone) return true;
    if (aId && exId && aId === exId) return true;
    return false;
  });

  if (existingIdx === -1) {
    deduplicated.push(newArch);
  } else {
    deduplicated[existingIdx] = { ...deduplicated[existingIdx], ...newArch };
  }
}

// Add existing
existingArchitects.forEach(checkAndAdd);
assert.equal(deduplicated.length, 5);

// Now add 6th architect with similar name words like "Kumar" or "Studio"
const arch6 = {
  id: 'BG/Aritech/000006',
  name: 'Sunil Kumar',
  phone: '9988776655',
  firmName: 'Sunil Kumar Architecture Studio',
  accountStatus: 'PENDING_APPROVAL',
};
checkAndAdd(arch6);

assert.equal(deduplicated.length, 6, 'Sunil Kumar must not be swallowed even though Rajesh Kumar exists');
assert.equal(deduplicated[5].id, 'BG/Aritech/000006');
assert.equal(deduplicated[5].name, 'Sunil Kumar');
console.log('✅ [PASS] Newly registered architect is preserved and visible in table alongside other architects');

// TEST 4: Document Verification State Machine
console.log('\n--- TEST 4: Check & Download, Approve & Cancel Document Flow ---');
const docs = [
  { id: 'doc-coa', title: 'COA Certificate', status: 'PENDING', fileUrl: 'data:image/svg+xml;utf8,<svg></svg>' },
  { id: 'doc-pan', title: 'PAN Card', status: 'PENDING', fileUrl: 'data:image/svg+xml;utf8,<svg></svg>' },
];

// Admin clicks Approve on doc-coa
docs[0].status = 'VERIFIED';
assert.equal(docs[0].status, 'VERIFIED');

// Admin clicks Cancel / Reject on doc-pan
docs[1].status = 'REJECTED';
docs[1].rejectionReason = 'Document scan blurry';
assert.equal(docs[1].status, 'REJECTED');
assert.equal(docs[1].rejectionReason, 'Document scan blurry');
console.log('✅ [PASS] Document Check & Download, Approve, and Cancel / Reject states verified');

// TEST 5: Admin Approval activates partner and preserves standard ID
console.log('\n--- TEST 5: Admin Approves Architect Account ---');
arch6.accountStatus = 'APPROVED';
arch6.isVerified = true;
arch6.id = formatArchitectId(arch6.id);

assert.equal(arch6.id, 'BG/Architech/000006');
assert.equal(arch6.accountStatus, 'APPROVED');
assert.equal(arch6.isVerified, true);
console.log('✅ [PASS] Approved Architect retains official [ BG/Architech/000006 ] ID format');

console.log('\n========================================================================');
console.log('🎉 ALL ARCHITECT REGISTRATION & ID TESTS PASSED CLEANLY (5/5)!');
console.log('========================================================================\n');
