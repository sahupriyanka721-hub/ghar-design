const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps/web/src/pages/customer/MyQuotations.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { syncChannel, getPlatformRequests } from '../../data/customerStore.js';",
  "import { syncChannel, getPlatformRequests, purgeDummyData } from '../../data/customerStore.js';\nimport { cleanRecords } from '../../data/cloudSync.js';"
);

content = content.replace(
  `      let localQuotes: any[] = [];
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localQuotes = parsed.filter(
              (q: any) =>
                q.quotationCode !== 'QT-2026-001' &&
                q.quotationCode !== 'QT-2026-002' &&
                q.requestId !== 'req-1001'
            );
          }
        }
      } catch (e) {
        console.error(e);
      }`,
  `      purgeDummyData();
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
      }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated MyQuotations.tsx to use cleanRecords and purgeDummyData');
