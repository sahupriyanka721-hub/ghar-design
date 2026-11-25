import { purgeDummyData } from '../data/customerStore.js';
import { safeSetStorage, freeLocalStorageSpace } from './safeStorage.js';
/**
 * GharDesign Data Sanitizer & Universal Self-Healing Engine
 * Automatically repairs corrupted, legacy, or missing fields across localStorage and API responses.
 * Prevents "Cannot read properties of undefined (reading 'map')" permanently.
 */

import { normalizeQuotation } from './utils.js';

export function sanitizeStorage(): void {
  // 0. Auto-purge any stale dummy test records
  try { purgeDummyData(); } catch(e) {}

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Sanitize Quotations
    const quotesRaw = localStorage.getItem('platform_quotations');
    if (quotesRaw) {
      try {
        const parsed = JSON.parse(quotesRaw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((q) => {
            const norm = normalizeQuotation(q);
            return {
              ...norm,
              items: Array.isArray(norm.items) ? norm.items : [],
              lineItems: Array.isArray(norm.lineItems) ? norm.lineItems : [],
              milestones: Array.isArray(norm.milestones) ? norm.milestones : [],
              includedDeliverables: Array.isArray(norm.includedDeliverables) ? norm.includedDeliverables : [],
              excludedWork: Array.isArray(norm.excludedWork) ? norm.excludedWork : [],
            };
          });
          safeSetStorage('platform_quotations', sanitized);
        }
      } catch (e) {
        console.warn('[Sanitizer] Repaired corrupted platform_quotations');
        localStorage.removeItem('platform_quotations');
      }
    }

    // 2. Sanitize Customer Requests
    const reqKeys = ['customer_project_requests', 'platform_project_requests'];
    reqKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((req) => ({
            ...req,
            requiredServices: Array.isArray(req.requiredServices) ? req.requiredServices : [],
            preferredServices: Array.isArray(req.preferredServices) ? req.preferredServices : [],
            documents: Array.isArray(req.documents) ? req.documents : [],
            milestones: Array.isArray(req.milestones) ? req.milestones : [],
            quotations: Array.isArray(req.quotations) ? req.quotations : [],
          }));
          safeSetStorage(key, sanitized);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });

    // 3. Sanitize Bookings
    const bookKeys = ['platform_bookings', 'customer_bookings'];
    bookKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((b) => ({
            ...b,
            milestones: Array.isArray(b.milestones) ? b.milestones : [],
            selectedServices: Array.isArray(b.selectedServices) ? b.selectedServices : [],
            documents: Array.isArray(b.documents) ? b.documents : [],
          }));
          safeSetStorage(key, sanitized);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });

    // 4. Sanitize Execution Projects
    const projKeys = ['gd_projects_v1', 'platform_execution_projects'];
    projKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((p) => ({
            ...p,
            stages: Array.isArray(p.stages) ? p.stages : [],
            paymentMilestones: Array.isArray(p.paymentMilestones) ? p.paymentMilestones : [],
            documents: Array.isArray(p.documents) ? p.documents : [],
            messages: Array.isArray(p.messages) ? p.messages : [],
            issues: Array.isArray(p.issues) ? p.issues : [],
            dailyLogs: Array.isArray(p.dailyLogs) ? p.dailyLogs : [],
            reports: Array.isArray(p.reports) ? p.reports : [],
          }));
          safeSetStorage(key, sanitized);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });

    // 5. Sanitize Material Orders
    const ordersRaw = localStorage.getItem('material_orders');
    if (ordersRaw) {
      try {
        const parsed = JSON.parse(ordersRaw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((o) => ({
            ...o,
            items: Array.isArray(o.items) ? o.items : [],
            trackingSteps: Array.isArray(o.trackingSteps) ? o.trackingSteps : [],
          }));
          safeSetStorage('material_orders', sanitized);
        }
      } catch {
        localStorage.removeItem('material_orders');
      }
    }
  } catch (err) {
    console.error('[Sanitizer] Error during storage sanitization:', err);
  }
}

/**
 * Universal self-heal function that can be called by Error Boundaries or user actions.
 * Repairs all corrupted schemas and broadcasts a refresh event.
 */
export function selfHealStorage(): void {
  try {
    sessionStorage.clear();
    sanitizeStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('[Sanitizer] Self-heal failed:', err);
  }
}
