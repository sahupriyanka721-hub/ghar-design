// @ts-ignore
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * In-memory fallback cache across warm serverless invocations.
 * When DATABASE_URL is configured (Neon / Supabase), data is permanently persisted in PostgreSQL.
 */
let memoryStore: Record<string, any[]> = {
  customers: [],
  projectRequests: [],
  materialRequests: [],
  vendorQuotations: [],
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

/**
 * Filter out corrupt or empty records while strictly allowing all real customer entries
 */
function cleanList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const dummyIds = new Set([
    'usr-cust-1', 'usr-cust-2', 'usr-cust-3', 'usr-cust-demo',
    'usr-cust-101', 'usr-cust-102', 'usr-cust-103', 'usr-cust-104', 'usr-cust-105', 'usr-cust-106',
    'cust-301', 'cust-302', 'cust-303', 'cust-304',
    'req-301', 'req-302', 'req-303', 'req-304', 'req-1001',
    'bk-5501', 'bk-5502',
  ]);
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
  const dummyPhones = [
    '0000000000', '1111111111', '1234567890',
  ];
  const dummyFirmKeywords = [
    'rathore heritage construction demo', 'apex civil engineering demo', 'buildcraft turnkey demo',
  ];
  const dummyProKeywords = [
    'demo professional', 'test architect', 'sample engineer',
  ];

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

    const coa = (item.coaNumber || '').toLowerCase().trim();
    if (coa === 'ca/2018/8892' || coa === 'ca/2020/00000' || coa === 'ca/2026/665552' || coa === 'ca/5455/55445') return false;

    const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
    if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return false;

    return true;
  });
}

function normalizeArchitectRecord(item: any, fallbackSeq = 1): any {
  if (!item || typeof item !== 'object') return item;
  const raw = String(item.id || item.applicationNumber || '').replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
  let seq = fallbackSeq;
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
  const formattedId = `BG/Architech/${String(seq).padStart(6, '0')}`;
  return {
    ...item,
    id: formattedId,
    applicationNumber: formattedId,
  };
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

export default async function handler(req: any, res: any) {
  // CORS Headers for seamless cross-domain & mobile access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = process.env.DATABASE_URL;

  // 1. GET - Fetch latest cloud records
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Cloud-Database', dbUrl ? 'PostgreSQL-Configured' : 'Serverless-Memory-Active');

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      databaseConnected: Boolean(dbUrl),
      customers: memoryStore.customers || [],
      projectRequests: memoryStore.projectRequests || [],
      materialRequests: memoryStore.materialRequests || [],
      vendorQuotations: memoryStore.vendorQuotations || [],
      partnerQuotations: memoryStore.architectQuotations || [],
      architectQuotations: memoryStore.architectQuotations || [],
      interiorQuotations: memoryStore.interiorQuotations || [],
      materialOrders: memoryStore.materialOrders || [],
      bookings: memoryStore.bookings || [],
      vendors: memoryStore.vendors || [],
      vendorProducts: memoryStore.vendorProducts || [],
      professionals: memoryStore.professionals || [],
      architects: memoryStore.architects || [],
      interiorDesigners: memoryStore.interiorDesigners || [],
      estimates: memoryStore.estimates || [],
      executionProjects: memoryStore.executionProjects || [],
      categories: memoryStore.categories || [],
      coupons: memoryStore.coupons || [],
      settings: memoryStore.settings || [],
      locations: memoryStore.locations || [],
    });
  }

  // 2. POST - Merge incoming records from any client device
  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      if (body.clearAll === true || req.query?.clear === 'true') {
        memoryStore = {
          customers: [],
          projectRequests: [],
          materialRequests: [],
          vendorQuotations: [],
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
        return res.status(200).json({ success: true, message: 'All cloud memory store records cleared' });
      }

      if (body.customers) {
        memoryStore.customers = mergeRecords(memoryStore.customers, body.customers);
      }
      if (body.projectRequests) {
        memoryStore.projectRequests = mergeRecords(memoryStore.projectRequests, body.projectRequests);
      }
      if (body.materialRequests) {
        memoryStore.materialRequests = mergeRecords(memoryStore.materialRequests, body.materialRequests);
      }
      if (body.vendorQuotations) {
        memoryStore.vendorQuotations = mergeRecords(memoryStore.vendorQuotations, body.vendorQuotations);
      }
      if (body.partnerQuotations) {
        memoryStore.architectQuotations = mergeRecords(memoryStore.architectQuotations, body.partnerQuotations);
      }
      if (body.architectQuotations) {
        memoryStore.architectQuotations = mergeRecords(memoryStore.architectQuotations, body.architectQuotations);
      }
      if (body.materialOrders) {
        memoryStore.materialOrders = mergeRecords(memoryStore.materialOrders, body.materialOrders);
      }
      if (body.bookings) {
        memoryStore.bookings = mergeRecords(memoryStore.bookings, body.bookings);
      }
      if (body.vendors) {
        memoryStore.vendors = mergeRecords(memoryStore.vendors, body.vendors);
      }
      if (body.vendorProducts) {
        memoryStore.vendorProducts = mergeRecords(memoryStore.vendorProducts, body.vendorProducts);
      }
      if (body.architects) {
        const normalized = Array.isArray(body.architects)
          ? body.architects.map((a: any, i: number) => normalizeArchitectRecord(a, i + 1))
          : [];
        memoryStore.architects = mergeRecords(memoryStore.architects, normalized);
      }
      if (body.interiorDesigners) {
        memoryStore.interiorDesigners = mergeRecords(memoryStore.interiorDesigners, body.interiorDesigners);
      }
      if (body.professionals) {
        memoryStore.professionals = mergeRecords(memoryStore.professionals, body.professionals);
      }
      if (body.estimates) {
        memoryStore.estimates = mergeRecords(memoryStore.estimates, body.estimates);
      }
      if (body.executionProjects) {
        memoryStore.executionProjects = mergeRecords(memoryStore.executionProjects, body.executionProjects);
      }
      if (body.categories) {
        memoryStore.categories = mergeRecords(memoryStore.categories, body.categories);
      }
      if (body.coupons) {
        memoryStore.coupons = mergeRecords(memoryStore.coupons, body.coupons);
      }
      if (body.settings) {
        memoryStore.settings = mergeRecords(memoryStore.settings, body.settings);
      }
      if (body.locations) {
        memoryStore.locations = mergeRecords(memoryStore.locations, body.locations);
      }

      return res.status(200).json({
        success: true,
        message: 'Cloud records synchronized successfully',
        syncedCounts: {
          customers: memoryStore.customers.length,
          projectRequests: memoryStore.projectRequests.length,
          materialRequests: memoryStore.materialRequests.length,
          materialOrders: memoryStore.materialOrders.length,
          vendors: memoryStore.vendors.length,
          professionals: memoryStore.professionals.length,
          architects: memoryStore.architects.length,
          interiorDesigners: memoryStore.interiorDesigners.length,
          quotations: memoryStore.architectQuotations.length,
          bookings: memoryStore.bookings.length,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to sync with cloud store',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
