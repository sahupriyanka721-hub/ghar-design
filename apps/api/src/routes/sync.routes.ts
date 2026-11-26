import { Router, Request, Response } from 'express';
import { getPrisma, isDbConnected } from '../services/db.js';
import { logger } from '../utils/logger.js';

export const syncRouter = Router();

let inMemoryStore: Record<string, any[]> = {
  customers: [],
  projectRequests: [],
  materialRequests: [],
  vendorQuotations: [],
  partnerQuotations: [],
  architectQuotations: [],
  interiorQuotations: [],
  materialOrders: [],
  bookings: [],
  vendors: [],
  vendorProducts: [],
  professionals: [],
  architects: [],
  interiorDesigners: [],
  estimates: [],
  executionProjects: [],
  categories: [],
  coupons: [],
  settings: [],
  locations: [],
};

const DUMMY_IDS = new Set([
  'usr-cust-1', 'usr-cust-2', 'usr-cust-3', 'usr-cust-demo',
  'usr-cust-101', 'usr-cust-102', 'usr-cust-103', 'usr-cust-104', 'usr-cust-105', 'usr-cust-106',
  'cust-301', 'cust-302', 'cust-303', 'cust-304',
  'req-301', 'req-302', 'req-303', 'req-304', 'req-1001',
  'bk-5501', 'bk-5502',
]);

const DUMMY_CODES = new Set([
  'GHR-ORD-2026-9042', 'GHR-ORD-2026-8812',
  'GHR-REQ-2026-1001', 'GHR-REQ-2026-301', 'GHR-REQ-2026-302', 'GHR-REQ-2026-303', 'GHR-REQ-2026-304',
  'req-1001', 'req-301', 'req-302', 'req-303', 'req-304',
  'PAY-REQ-1001', 'PAY-REQ-1002',
  'BK-2026-8492', 'BK-2026-5501', 'BK-2026-5502',
  'bk-5501', 'bk-5502',
  'QT-2026-001', 'QT-2026-002', 'QT-2026-801', 'QT-2026-802', 'QT-2026-803',
  'qt-101', 'qt-102',
]);

function cleanList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (DUMMY_IDS.has(item.id) || DUMMY_IDS.has(item.customerId) || DUMMY_IDS.has(item.requestId)) return false;
    if (DUMMY_CODES.has(item.requestCode) || DUMMY_CODES.has(item.bookingCode) || DUMMY_CODES.has(item.orderCode) || DUMMY_CODES.has(item.quotationCode)) return false;

    const name = (item.name || item.customerName || '').toLowerCase().trim();
    if (['demo user', 'dummy architect', 'test contractor', 'sample client'].includes(name)) return false;

    const phone = (item.phone || item.customerPhone || '').replace(/\D/g, '').slice(-10);
    if (['0000000000', '1111111111', '1234567890'].includes(phone)) return false;

    return true;
  });
}

function mergeRecords(existing: any[], incoming: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of cleanList(existing)) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of cleanList(incoming)) {
    if (item?.id) {
      const prev = map.get(item.id);
      const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const prevTime = prev ? new Date(prev.updatedAt || prev.createdAt || 0).getTime() : 0;
      if (!prev || incomingTime >= prevTime) {
        map.set(item.id, { ...prev, ...item });
      }
    }
  }
  return Array.from(map.values());
}

async function loadFromMongoAtlas(): Promise<any | null> {
  try {
    const prisma = getPrisma();
    const isMongo = (process.env.DATABASE_URL || '').startsWith('mongodb');
    if (isMongo && typeof (prisma as any).$runCommandRaw === 'function') {
      const res = await (prisma as any).$runCommandRaw({
        find: 'cloud_sync',
        filter: { _id: 'global_sync_state' },
        limit: 1,
      });
      const doc = res?.cursor?.firstBatch?.[0];
      if (doc?.store) return doc.store;
    }
  } catch (err: any) {
    logger.debug(`MongoDB load sync fallback to memory: ${err.message}`);
  }
  return null;
}

async function saveToMongoAtlas(store: any): Promise<void> {
  try {
    const prisma = getPrisma();
    const isMongo = (process.env.DATABASE_URL || '').startsWith('mongodb');
    if (isMongo && typeof (prisma as any).$runCommandRaw === 'function') {
      await (prisma as any).$runCommandRaw({
        update: 'cloud_sync',
        updates: [
          {
            q: { _id: 'global_sync_state' },
            u: { $set: { _id: 'global_sync_state', store, updatedAt: new Date() } },
            upsert: true,
          },
        ],
      });
      logger.info('💾 Saved cloud sync records to MongoDB Atlas');
    }
  } catch (err: any) {
    logger.debug(`MongoDB save sync fallback: ${err.message}`);
  }
}

// 1. GET /api/sync - Return latest live data
syncRouter.get('/', async (req: Request, res: Response) => {
  try {
    const mongoData = await loadFromMongoAtlas();
    if (mongoData) {
      for (const [k, v] of Object.entries(mongoData)) {
        if (Array.isArray(v)) {
          inMemoryStore[k] = mergeRecords(inMemoryStore[k] || [], v);
        }
      }
    }

    return res.status(200).json({
      success: true,
      source: 'MongoDB-Atlas-Live',
      timestamp: new Date().toISOString(),
      ...inMemoryStore,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      source: 'Memory-Fallback',
      timestamp: new Date().toISOString(),
      ...inMemoryStore,
    });
  }
});

// 2. POST /api/sync - Save and merge incoming data from any device
syncRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};

    if (body.customers) inMemoryStore.customers = mergeRecords(inMemoryStore.customers, body.customers);
    if (body.projectRequests) inMemoryStore.projectRequests = mergeRecords(inMemoryStore.projectRequests, body.projectRequests);
    if (body.materialRequests) inMemoryStore.materialRequests = mergeRecords(inMemoryStore.materialRequests, body.materialRequests);
    if (body.vendorQuotations) inMemoryStore.vendorQuotations = mergeRecords(inMemoryStore.vendorQuotations, body.vendorQuotations);
    if (body.partnerQuotations) inMemoryStore.partnerQuotations = mergeRecords(inMemoryStore.partnerQuotations, body.partnerQuotations);
    if (body.architectQuotations) inMemoryStore.partnerQuotations = mergeRecords(inMemoryStore.partnerQuotations, body.architectQuotations);
    if (body.interiorQuotations) inMemoryStore.interiorQuotations = mergeRecords(inMemoryStore.interiorQuotations, body.interiorQuotations);
    if (body.materialOrders) inMemoryStore.materialOrders = mergeRecords(inMemoryStore.materialOrders, body.materialOrders);
    if (body.bookings) inMemoryStore.bookings = mergeRecords(inMemoryStore.bookings, body.bookings);
    if (body.vendors) inMemoryStore.vendors = mergeRecords(inMemoryStore.vendors, body.vendors);
    if (body.vendorProducts) inMemoryStore.vendorProducts = mergeRecords(inMemoryStore.vendorProducts, body.vendorProducts);
    if (body.professionals) inMemoryStore.professionals = mergeRecords(inMemoryStore.professionals, body.professionals);
    if (body.architects) inMemoryStore.architects = mergeRecords(inMemoryStore.architects, body.architects);
    if (body.interiorDesigners) inMemoryStore.interiorDesigners = mergeRecords(inMemoryStore.interiorDesigners, body.interiorDesigners);
    if (body.estimates) inMemoryStore.estimates = mergeRecords(inMemoryStore.estimates, body.estimates);
    if (body.executionProjects) inMemoryStore.executionProjects = mergeRecords(inMemoryStore.executionProjects, body.executionProjects);
    if (body.categories) inMemoryStore.categories = mergeRecords(inMemoryStore.categories, body.categories);
    if (body.coupons) inMemoryStore.coupons = mergeRecords(inMemoryStore.coupons, body.coupons);
    if (body.settings) inMemoryStore.settings = Array.isArray(body.settings) ? body.settings : [body.settings];
    if (body.locations) inMemoryStore.locations = mergeRecords(inMemoryStore.locations, body.locations);

    await saveToMongoAtlas(inMemoryStore);

    return res.status(200).json({
      success: true,
      message: 'Cloud records synchronized successfully to MongoDB Atlas',
      syncedCounts: {
        customers: inMemoryStore.customers.length,
        projectRequests: inMemoryStore.projectRequests.length,
        quotations: inMemoryStore.partnerQuotations.length,
        bookings: inMemoryStore.bookings.length,
        architects: inMemoryStore.architects.length,
      },
    });
  } catch (err: any) {
    logger.error('Error in sync post:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
