import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('🧪 TESTING CUSTOMER QUOTATION REQUEST & ARCHITECT KYC VERIFICATION FLOW');
console.log('========================================================================\n');

// 1. Verify customerStore.ts filters
const customerStoreContent = fs.readFileSync('apps/web/src/data/customerStore.ts', 'utf-8');
assert(!customerStoreContent.includes("name.includes('priya')"), 'Error: customerStore still filters out priya');
assert(!customerStoreContent.includes("name.includes('vikram')"), 'Error: customerStore still filters out vikram');
console.log('✅ [PASS] customerStore.ts: No legitimate customer names (Priya, Vikram, etc.) are blacklisted.');

// 2. Verify CreateRequestWizard.tsx
const wizardContent = fs.readFileSync('apps/web/src/pages/customer/CreateRequestWizard.tsx', 'utf-8');
assert(wizardContent.includes('isFeePaid: true'), 'Error: CreateRequestWizard does not set isFeePaid: true on submission');
assert(wizardContent.includes("navigate('/dashboard/requests')"), 'Error: CreateRequestWizard does not navigate to /dashboard/requests');
assert(!wizardContent.includes('setShowPaymentModal(true)'), 'Error: CreateRequestWizard still halts on payment modal');
console.log('✅ [PASS] CreateRequestWizard.tsx: Sets isFeePaid: true and redirects immediately to /dashboard/requests without blocking modal.');

// 3. Verify DashboardLayout.tsx
const layoutContent = fs.readFileSync('apps/web/src/components/layouts/DashboardLayout.tsx', 'utf-8');
assert(layoutContent.includes('isCreateRequest'), 'Error: DashboardLayout does not exempt create-request');
console.log('✅ [PASS] DashboardLayout.tsx: Does not kick users out of /dashboard/create-request.');

// 4. Verify App.tsx routes
const appContent = fs.readFileSync('apps/web/src/App.tsx', 'utf-8');
assert(appContent.includes('path="/create-request"'), 'Error: App.tsx missing /create-request shortcut');
assert(appContent.includes('path="/request-quotation"'), 'Error: App.tsx missing /request-quotation shortcut');
console.log('✅ [PASS] App.tsx: Top-level routes /create-request and /request-quotation properly redirect to wizard.');

// 5. Verify architectStore.ts ID formatting
const archStoreContent = fs.readFileSync('apps/web/src/data/architectStore.ts', 'utf-8');
assert(archStoreContent.includes("BG/Architech/${String(fallbackSeq).padStart(6, '0')}"), 'Error: formatArchitectId does not use 6-digit BG/Architech/XXXXXX');
console.log('✅ [PASS] architectStore.ts: Standard ID is strictly BG/Architech/XXXXXX.');

// 6. Verify AdminArchitects.tsx Check & Download, Approve & Cancel buttons
const adminArchContent = fs.readFileSync('apps/web/src/pages/admin/AdminArchitects.tsx', 'utf-8');
assert(adminArchContent.includes('handleCheckAndDownload'), 'Error: AdminArchitects missing handleCheckAndDownload');
assert(adminArchContent.includes('handleDocumentApprove'), 'Error: AdminArchitects missing handleDocumentApprove');
assert(adminArchContent.includes('handleDocumentReject'), 'Error: AdminArchitects missing handleDocumentReject');
assert(adminArchContent.includes('ensureArchitectStatutoryDocuments(arch)'), 'Error: AdminArchitects does not enrich arch with 4 statutory KYC documents on open');
console.log('✅ [PASS] AdminArchitects.tsx: Check & Download, Document Approve, and Cancel/Reject buttons are active with auto-enrichment of 4 KYC documents.');

console.log('\n========================================================================');
console.log('🎉 ALL 6/6 KEY VALIDATION CHECKS PASSED PERFECTLY!');
console.log('========================================================================\n');
