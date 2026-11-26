/**
 * GharDesign - Universal Real-Time Cloud Synchronization Engine
 * Bridges client-side local storage with the cloud database/serverless API.
 * Ensures cross-device synchronization between mobile homeowners, architects, and desktop administrators.
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

/**
 * Filter out corrupt or empty records before cloud dispatch, allowing all real entries.
 */
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
 * Universal multi-relay cloud fetcher.
 * 1. Checks Supabase REST API (if env variables provided)
 * 2. Checks custom API URL (if explicitly set in VITE_API_URL)
 * 3. Uses High-Availability Cloud KV Relay for GharDesign (enables multi-laptop live sync on Cloudflare Pages)
 */
async function syncFetch(method: 'GET' | 'POST', payload?: any): Promise<any> {
  // 1. Supabase REST API check
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    try {
      const sbUrl = `${(import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '')}/rest/v1/cloud_sync`;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      if (method === 'GET') {
        const res = await fetch(`${sbUrl}?id=eq.global_state&select=payload`, {
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]?.payload) return rows[0].payload;
        }
      } else {
        await fetch(sbUrl, {
          method: 'POST',
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ id: 'global_state', payload, updated_at: new Date().toISOString() }),
        });
        return { ok: true };
      }
    } catch (e) {
      console.debug('Supabase cloud sync error:', e);
    }
  }

  // 2. Custom API URL (explicitly set in VITE_API_URL or Render Live Backend)
  const candidateApi = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
    ? (import.meta.env.VITE_API_URL as string) 
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://ghar-design-api-8wbl.onrender.com' : '');

  if (candidateApi) {
    try {
      const url = `${candidateApi.replace(/\/$/, '')}/api/sync`;
      const res = await fetch(method === 'GET' ? `${url}?t=${Date.now()}` : url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return await res.json();
        }
      }
    } catch (e) {}
  }

  // 3. High-availability public Cloud KV relay for GharDesign Live Network
  // Allows any computer visiting https://ghar-design-app.pages.dev to share live data seamlessly
  const RELAY_URL = 'https://kvdb.io/5bWkP9mZ1xQ4vN7rT2yJ8d/ghardesign_cloud_sync_v2';
  try {
    if (method === 'GET') {
      const res = await fetch(`${RELAY_URL}?t=${Date.now()}`);
      if (res.ok) {
        const raw = await res.text();
        if (raw && !raw.trim().startsWith('<') && !raw.trim().startsWith('<!DOCTYPE')) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } else {
      const res = await fetch(RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true };
    }
  } catch (e) {
    console.debug('Cloud KV relay sync attempt:', e);
  }

  return null;
}

/**
 * Gather current state across all business collections into a unified sync payload.
 */
function collectSyncPayload(): CloudSyncPayload {
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

  return {
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
}

/**
 * Push current local changes to the cloud database.
 */
export async function pushToCloud(): Promise<void> {
  try {
    const payload = collectSyncPayload();
    await syncFetch('POST', payload);
    lastSyncTimestamp = Date.now();
  } catch (err) {
    console.debug('Cloud sync push queued offline:', err);
  }
}

/**
 * Pull latest records from cloud database and merge into local state.
 */
export async function pullFromCloud(): Promise<boolean> {
  if (isSyncing) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  isSyncing = true;

  try {
    // 1. Check if URL contains query param ?sync_data= or ?import_code=
    importFromUrlParam();

    // 2. Fetch latest data from cloud database / relay
    const data: CloudSyncPayload = await syncFetch('GET');
    if (!data || typeof data !== 'object') return false;

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
    console.debug('Cloud sync pull standby:', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Generates a direct shareable admin link containing the current registered architects data.
 * When Sir opens this URL, his browser automatically imports and permanently loads all records.
 */
export function generateShareableSyncUrl(): string {
  const architects = cleanRecords(safeReadStorage('gd_architect_accounts_v2', []));
  const customers = cleanRecords(safeReadStorage('platform_registered_customers', []));
  const payload = { architects, customers, ts: Date.now() };
  try {
    const jsonStr = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(jsonStr));
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ghar-design-app.pages.dev';
    return `${origin}/admin/architects?sync_data=${b64}`;
  } catch (e) {
    return typeof window !== 'undefined' ? window.location.href : 'https://ghar-design-app.pages.dev/admin/architects';
  }
}

/**
 * Checks for ?sync_data= query parameter and imports data seamlessly.
 */
export function importFromUrlParam(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get('sync_data');
    if (!syncData) return false;

    const jsonStr = decodeURIComponent(atob(syncData));
    const data = JSON.parse(jsonStr);
    if (data && typeof data === 'object') {
      if (Array.isArray(data.architects) && data.architects.length > 0) {
        const local = safeReadStorage('gd_architect_accounts_v2', []);
        const idMap = new Map();
        for (const a of local) if (a?.id) idMap.set(a.id, a);
        for (const a of data.architects) if (a?.id) idMap.set(a.id, { ...idMap.get(a.id), ...a });
        const merged = Array.from(idMap.values());
        safeSetStorage('gd_architect_accounts_v2', merged);
        safeSetStorage('gd_architect_accounts', merged);
        window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: merged }));
        window.dispatchEvent(new Event('storage'));
      }
      if (Array.isArray(data.customers) && data.customers.length > 0) {
        const local = safeReadStorage('platform_registered_customers', []);
        const idMap = new Map();
        for (const c of local) if (c?.id) idMap.set(c.id, c);
        for (const c of data.customers) if (c?.id) idMap.set(c.id, { ...idMap.get(c.id), ...c });
        const merged = Array.from(idMap.values());
        safeSetStorage('platform_registered_customers', merged);
        window.dispatchEvent(new Event('storage'));
      }
      // Clean query parameter from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
  } catch (e) {
    console.debug('Failed to import sync_data from URL:', e);
  }
  return false;
}

/**
 * Exports current architects & customers as a compact JSON string code for sharing.
 */
export function exportSyncJson(): string {
  const architects = cleanRecords(safeReadStorage('gd_architect_accounts_v2', []));
  const customers = cleanRecords(safeReadStorage('platform_registered_customers', []));
  return JSON.stringify({ architects, customers, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Imports a JSON string code into local state and immediately pushes to cloud.
 */
export function importSyncJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;

    if (Array.isArray(data.architects) && data.architects.length > 0) {
      const local = safeReadStorage('gd_architect_accounts_v2', []);
      const idMap = new Map();
      for (const a of local) if (a?.id) idMap.set(a.id, a);
      for (const a of data.architects) if (a?.id) idMap.set(a.id, { ...idMap.get(a.id), ...a });
      const merged = Array.from(idMap.values());
      safeSetStorage('gd_architect_accounts_v2', merged);
      safeSetStorage('gd_architect_accounts', merged);
      window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: merged }));
    }
    if (Array.isArray(data.customers) && data.customers.length > 0) {
      const local = safeReadStorage('platform_registered_customers', []);
      const idMap = new Map();
      for (const c of local) if (c?.id) idMap.set(c.id, c);
      for (const c of data.customers) if (c?.id) idMap.set(c.id, { ...idMap.get(c.id), ...c });
      const merged = Array.from(idMap.values());
      safeSetStorage('platform_registered_customers', merged);
    }
    window.dispatchEvent(new Event('storage'));
    pushToCloud().catch(() => {});
    return true;
  } catch (e) {
    console.debug('Failed to import sync JSON:', e);
    return false;
  }
}

/**
 * Initialize automatic background synchronization loop.
 */
let syncInitialized = false;
export function initAutoCloudSync(intervalMs = 15000): void {
  if (syncInitialized || typeof window === 'undefined') return;
  syncInitialized = true;

  // Immediate pull on boot
  pullFromCloud();

  // Periodic pull for real-time cross-device updates (15s interval)
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
 * Sends a wipe request to cloud cache
 */
export async function clearCloudData(): Promise<boolean> {
  try {
    await syncFetch('POST', { clearAll: true });
    return true;
  } catch {
    return false;
  }
}
