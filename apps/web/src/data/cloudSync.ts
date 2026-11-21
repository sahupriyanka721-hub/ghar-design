/**
 * GharDesign - Universal Real-Time Cloud Synchronization Engine
 * Bridges client-side local storage with the cloud database/serverless API.
 * Ensures cross-device synchronization between mobile homeowners and desktop administrators.
 * Zero dummy data policy strictly enforced.
 */

import { safeSetStorage } from '../lib/safeStorage.js';

const syncBroadcast = (type: string, payload?: any) => {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel('ghar_design_live_sync');
      ch.postMessage({ type, payload, timestamp: Date.now() });
      ch.close();
    }
  } catch (e) {}
};

const getSyncApiUrl = (): string | null => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api/sync`;
  }
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
    return `${window.location.origin}/api/sync`;
  }
  return null;
};

let isSyncing = false;
let lastSyncTimestamp = 0;

export interface CloudSyncPayload {
  customers?: any[];
  projectRequests?: any[];
  materialRequests?: any[];
  vendorQuotations?: any[];
  partnerQuotations?: any[];
  interiorQuotations?: any[];
  materialOrders?: any[];
  bookings?: any[];
  vendors?: any[];
  vendorProducts?: any[];
  professionals?: any[];
  estimates?: any[];
  executionProjects?: any[];
  categories?: any[];
  coupons?: any[];
  settings?: any[];
  locations?: any[];
  architects?: any[];
  interiorDesigners?: any[];
}

/**
 * Filter out corrupt or empty records before cloud dispatch, allowing all real entries.
 */
/**
 * Bulletproof localStorage reader that never throws SyntaxError
 */
function safeReadStorage<T = any>(key: string, fallback: T = [] as any): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null' || raw === '[object Object]') return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function cleanRecords(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set([
    'usr-cust-1', 'usr-cust-2', 'usr-cust-3', 'usr-cust-demo',
    'usr-cust-101', 'usr-cust-102', 'usr-cust-103', 'usr-cust-104', 'usr-cust-105', 'usr-cust-106',
    'cust-301', 'cust-302', 'cust-303', 'cust-304',
    'req-301', 'req-302', 'req-303', 'req-304', 'req-1001',
    'bk-5501', 'bk-5502',
  ]);
  const dummyFirmKeywords = [
    'rathore heritage construction demo', 'apex civil engineering demo', 'buildcraft turnkey demo',
  ];
  const dummyProKeywords = [
    'demo professional', 'test architect', 'sample engineer',
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
  const dummyExactNames = new Set(['demo user', 'dummy architect', 'test contractor', 'sample client']);
  const dummyPhones = ['0000000000', '1111111111', '1234567890'];

  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (dummyIds.has(item.id) || dummyIds.has(item.customerId) || dummyIds.has(item.requestId)) return false;
    if (dummyCodes.has(item.requestCode) || dummyCodes.has(item.bookingCode) || dummyCodes.has(item.orderCode) || dummyCodes.has(item.quotationCode)) return false;
    
    const name = (item.name || item.customerName || '').toLowerCase().trim();
    if (dummyExactNames.has(name)) return false;
    
    const phone = (item.phone || item.customerPhone || '').replace(/\D/g, '').slice(-10);
    if (dummyPhones.includes(phone)) return false;

    const proName = (item.professionalName || item.professional?.name || '').toLowerCase().trim();
    if (dummyProKeywords.some((dp) => proName === dp)) return false;

    const firm = (item.firmName || item.professional?.firmName || '').toLowerCase().trim();
    if (dummyFirmKeywords.some((df) => firm === df)) return false;

    const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
    if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return false;

    return true;
  });
}

/**
 * Push current local changes to the cloud database.
 */
export async function pushToCloud(): Promise<void> {
  const syncUrl = getSyncApiUrl();
  if (!syncUrl) return;

  try {
    const customers = cleanRecords(safeReadStorage('platform_registered_customers', []));
    const projectRequests = cleanRecords(safeReadStorage('platform_project_requests', []));
    const materialRequests = cleanRecords(safeReadStorage('platform_material_requests', []));
    const vendorQuotations = cleanRecords(safeReadStorage('platform_vendor_quotations', []));
    const partnerQuotations = cleanRecords(safeReadStorage('platform_quotations', []));
    const interiorQuotations = cleanRecords(safeReadStorage('gd_interior_quotations_v1', []));
    const materialOrders = cleanRecords(safeReadStorage('material_orders', []));
    const bookings = cleanRecords(safeReadStorage('platform_bookings', []));
    const vendors = cleanRecords(safeReadStorage('platform_registered_vendors', []));
    const vendorProducts = cleanRecords(safeReadStorage('platform_vendor_products', []));
    const professionals = cleanRecords(safeReadStorage('platform_professionals', []));
    const estimates = cleanRecords(safeReadStorage('gd_admin_customer_estimates', []));
    const executionProjects = cleanRecords(safeReadStorage('gd_customer_execution_projects_v2', []));
    const architectsV2 = safeReadStorage('gd_architect_accounts_v2', []);
    const architectsLegacy = safeReadStorage('gd_architect_accounts', []);
    const architectsCombined = [
      ...(Array.isArray(architectsV2) ? architectsV2 : []),
      ...(Array.isArray(architectsLegacy) ? architectsLegacy : []),
    ];
    const archMap = new Map();
    for (const a of architectsCombined) {
      if (a?.id) archMap.set(a.id, a);
    }
    const architects = cleanRecords(Array.from(archMap.values()));
    const interiorDesigners = cleanRecords(safeReadStorage('gd_interior_designer_accounts_v1', []));

    const categories = safeReadStorage('platform_service_categories', []);
    const coupons = safeReadStorage('platform_coupons', []);
    const settings = safeReadStorage('platform_global_settings', []);
    const locations = safeReadStorage('platform_service_locations', []);

    const payload: CloudSyncPayload = {
      customers,
      projectRequests,
      materialRequests,
      vendorQuotations,
      partnerQuotations,
      interiorQuotations,
      materialOrders,
      bookings,
      vendors,
      vendorProducts,
      professionals,
      estimates,
      executionProjects,
      architects,
      interiorDesigners,
      categories,
      coupons,
      settings: Array.isArray(settings) ? settings : [settings],
      locations,
    };

    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      lastSyncTimestamp = Date.now();
    }
  } catch (err) {
    // Graceful offline fallback: if internet or API is unreachable, local copy remains safe
    console.debug('Cloud sync push queued offline:', err);
  }
}

/**
 * Pull latest records from cloud database and merge into local state.
 */
export async function pullFromCloud(): Promise<boolean> {
  const syncUrl = getSyncApiUrl();
  if (!syncUrl) return false;

  if (isSyncing) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  isSyncing = true;

  try {
    const res = await fetch(`${syncUrl}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return false;

    const data: CloudSyncPayload = await res.json();
    let hasUpdates = false;

    // Helper to merge lists by unique ID
    const mergeList = (storageKey: string, cloudList?: any[], eventType?: string) => {
      if (!cloudList || !Array.isArray(cloudList)) return;
      const cleanCloud = cleanRecords(cloudList);
      const local = cleanRecords(safeReadStorage(storageKey, []));

      const idMap = new Map<string, any>();
      // Put local first
      for (const item of local) {
        if (item?.id) idMap.set(item.id, item);
      }
      // Cloud overrides/appends
      for (const item of cleanCloud) {
        if (item?.id) {
          const existing = idMap.get(item.id);
          const cloudTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const localTime = existing ? new Date(existing.updatedAt || existing.createdAt || 0).getTime() : 0;
          if (!existing || cloudTime >= localTime) {
            idMap.set(item.id, { ...existing, ...item });
            hasUpdates = true;
          }
        }
      }

      const merged = Array.from(idMap.values());
      if (storageKey.includes('architect')) {
        for (let i = 0; i < merged.length; i++) {
          const item = merged[i];
          if (!item || typeof item !== 'object') continue;
          const raw = String(item.id || item.applicationNumber || '').replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
          let seq = i + 1;
          const quoMatch = raw.match(/BG\/(?:QUO|ARC)\/(?:\s*)(\d+)/i);
          if (quoMatch) {
            seq = parseInt(quoMatch[1], 10);
          } else {
            const match = raw.match(/BG\/(?:Architech|Aritech|Architect)\/(?:\s*)(\d+)/i);
            if (match) {
              seq = parseInt(match[1], 10);
            } else {
              const numMatch = raw.match(/(\d+)/);
              if (numMatch) {
                const n = parseInt(numMatch[1], 10);
                if (n < 999999) seq = n;
              }
            }
          }
          item.id = `BG/Architech/${String(seq).padStart(6, '0')}`;
          item.applicationNumber = item.id;
        }
      }
      if (merged.length !== local.length || hasUpdates) {
        safeSetStorage(storageKey, merged);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
          if (storageKey.includes('architect')) {
            window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: merged }));
          }
          if (storageKey.includes('interior_designer')) {
            window.dispatchEvent(new CustomEvent('interior_designer_store_updated', { detail: merged }));
          }
        }
        if (eventType) {
          syncBroadcast(eventType, merged);
        }
      }
    };

    mergeList('platform_registered_customers', data.customers, 'CUSTOMERS_UPDATED');
    mergeList('platform_project_requests', data.projectRequests, 'PROJECT_REQUESTS_UPDATED');
    mergeList('platform_material_requests', data.materialRequests, 'MATERIAL_REQUESTS_UPDATED');
    mergeList('platform_vendor_quotations', data.vendorQuotations, 'VENDOR_QUOTATIONS_UPDATED');
    mergeList('platform_quotations', data.partnerQuotations, 'QUOTATIONS_UPDATED');
    mergeList('gd_interior_quotations_v1', data.interiorQuotations, 'INTERIOR_QUOTATIONS_UPDATED');
    mergeList('material_orders', data.materialOrders, 'ORDERS_UPDATED');
    mergeList('platform_bookings', data.bookings, 'BOOKINGS_UPDATED');
    mergeList('platform_registered_vendors', data.vendors, 'VENDORS_UPDATED');
    mergeList('platform_vendor_products', data.vendorProducts, 'VENDOR_PRODUCTS_UPDATED');
    mergeList('platform_professionals', data.professionals, 'PROFESSIONALS_UPDATED');
    mergeList('gd_architect_accounts_v2', data.architects, 'ARCHITECTS_UPDATED');
    mergeList('gd_architect_accounts', data.architects, 'ARCHITECTS_UPDATED');
    mergeList('gd_interior_designer_accounts_v1', data.interiorDesigners, 'INTERIOR_DESIGNERS_UPDATED');
    mergeList('gd_admin_customer_estimates', data.estimates, 'ESTIMATES_UPDATED');
    mergeList('gd_customer_execution_projects_v2', data.executionProjects, 'PROJECTS_UPDATED');
    mergeList('platform_service_categories', data.categories, 'CATEGORIES_UPDATED');
    mergeList('platform_coupons', data.coupons, 'COUPONS_UPDATED');
    mergeList('platform_service_locations', data.locations, 'LOCATIONS_UPDATED');

    lastSyncTimestamp = Date.now();
    return hasUpdates;
  } catch (err) {
    console.debug('Cloud sync pull standby (offline or serverless cold start):', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Initialize automatic background synchronization loop.
 */
let syncInitialized = false;
export function initAutoCloudSync(intervalMs = 30000): void {
  if (syncInitialized || typeof window === 'undefined') return;
  syncInitialized = true;

  // Immediate pull on start
  pullFromCloud();

  // Periodic pull for real-time cross-device updates
  setInterval(() => {
    pullFromCloud();
  }, intervalMs);

  // Sync on tab focus or returning to app
  window.addEventListener('focus', () => {
    pullFromCloud();
  });
  window.addEventListener('online', () => {
    pullFromCloud();
    pushToCloud();
  });
}

/**
 * Sends a wipe request to serverless cloud cache
 */
export async function clearCloudData(): Promise<boolean> {
  const url = getSyncApiUrl();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearAll: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
