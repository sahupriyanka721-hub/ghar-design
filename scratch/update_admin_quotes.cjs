const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps/web/src/pages/admin/AdminQuotationsReview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { pushToCloud } from '../../data/cloudSync.js';",
  "import { pushToCloud, cleanRecords } from '../../data/cloudSync.js';\nimport { purgeDummyData } from '../../data/customerStore.js';"
);

content = content.replace(
  `    // 2. Load generated quotations
    let localQuotes: any[] = [];
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localQuotes = parsed.filter(
            (q: any) =>
              q.quotationCode !== 'QT-2026-001' &&
              q.requestCode !== 'GHR-REQ-2026-1001'
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    setQuotations(localQuotes);`,
  `    // 2. Load real professional quotations
    purgeDummyData();
    let localQuotes: any[] = [];
    try {
      const stored = localStorage.getItem('platform_quotations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localQuotes = cleanRecords(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setQuotations(localQuotes);`
);

content = content.replace(
  `<span>Generated Quotations</span>`,
  `<span>Professional Quotations</span>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AdminQuotationsReview.tsx');
