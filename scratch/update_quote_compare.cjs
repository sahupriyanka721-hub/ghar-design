const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps/web/src/pages/customer/QuotationComparison.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { pushToCloud } from '../../data/cloudSync.js';",
  "import { pushToCloud, cleanRecords } from '../../data/cloudSync.js';"
);
content = content.replace(
  "import { savePlatformBooking, PlatformBooking, getPlatformRequestById } from '../../data/customerStore.js';",
  "import { savePlatformBooking, PlatformBooking, getPlatformRequestById, purgeDummyData } from '../../data/customerStore.js';"
);

content = content.replace(
  `    const loadQuotes = () => {
      let local: any[] = [];
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            local = parsed.filter((q: any) => q.requestId === id || q.requestCode === id);
            // If ID is generic or 'active', match any published quote
            if (local.length === 0 && (!id || id === 'active' || id === 'all')) {
              local = parsed.filter((q) => q.status === 'PUBLISHED' || q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'APPROVED');
            }
          }
        }
      } catch (e) {}`,
  `    const loadQuotes = () => {
      purgeDummyData();
      let local: any[] = [];
      try {
        const stored = localStorage.getItem('platform_quotations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const clean = cleanRecords(parsed);
            local = clean.filter((q: any) => q.requestId === id || q.requestCode === id);
            if (local.length === 0 && (!id || id === 'active' || id === 'all')) {
              const rawPhone = user?.phone?.replace(/\\D/g, '').slice(-10);
              local = clean.filter((q) => {
                const isPublished = q.status === 'PUBLISHED' || q.status === 'PUBLISHED_TO_CUSTOMER' || q.status === 'APPROVED';
                if (!isPublished) return false;
                if (user?.id && q.customerId === user.id) return true;
                if (rawPhone && q.customerPhone?.includes(rawPhone)) return true;
                if (!rawPhone && !user?.id) return true;
                return false;
              });
            }
          }
        }
      } catch (e) {}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated QuotationComparison.tsx');
