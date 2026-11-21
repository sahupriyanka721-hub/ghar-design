const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps/web/src/data/customerStore.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `    // 4. Quotations
    const quotesJson = localStorage.getItem('platform_quotations');
    if (quotesJson) {
      const quotes = JSON.parse(quotesJson).filter((q: any) => !isDummy(q));
      localStorage.setItem('platform_quotations', JSON.stringify(quotes));
    }`;

const replacement = `    // 4. Quotations
    const quotesJson = localStorage.getItem('platform_quotations');
    let remainingQuotes: any[] = [];
    if (quotesJson) {
      remainingQuotes = JSON.parse(quotesJson).filter((q: any) => !isDummy(q));
      localStorage.setItem('platform_quotations', JSON.stringify(remainingQuotes));
    }

    // Align request status: if marked QUOTATIONS_AVAILABLE but all quotes were dummy, revert to ASSIGNED
    if (reqsJson) {
      const activeQuoteReqIds = new Set(remainingQuotes.map((q: any) => q.requestId || q.requestCode));
      const reqs = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]').map((r: any) => {
        if (r.status === 'QUOTATIONS_AVAILABLE' && !activeQuoteReqIds.has(r.id) && !activeQuoteReqIds.has(r.requestCode)) {
          return {
            ...r,
            status: r.assignedProfessionalIds && r.assignedProfessionalIds.length > 0 ? 'ASSIGNED' : 'VERIFIED',
            quotationsCount: 0,
          };
        }
        return r;
      });
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added status alignment to purgeDummyData in customerStore.ts');
} else {
  console.error('Target not found in customerStore.ts');
}
