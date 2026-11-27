export const SEED_CUSTOMERS: RegisteredCustomer[] = [];

import { pushToCloud } from './cloudSync.js';
import { safeSetStorage } from '../lib/safeStorage.js';

export interface CustomerVerificationDetails {
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  verificationType?: 'MOBILE_OTP' | 'ADMIN_KYC' | 'MANUAL_VERIFIED';
  documentType?: string;
  documentRefNumber?: string;
}

export interface RegisteredCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  housePlotNumber: string;
  streetLocality: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  country?: string;
  alternateContact?: string;
  registeredAt: string;
  status: 'ACTIVE' | 'VERIFIED' | 'SUSPENDED' | 'BLOCKED';
  otpStatus?: 'VERIFIED' | 'PENDING';
  suspensionReason?: string;
  blockedReason?: string;
  verificationDetails?: CustomerVerificationDetails;
  lastActiveAt?: string;
  internalNotes?: Array<{
    id: string;
    adminName: string;
    note: string;
    createdAt: string;
  }>;
  requestsCount: number;
  bookingsCount: number;
  materialOrdersCount: number;
  isNew?: boolean;
}

// Zero hardcoded dummy customers. Only REAL customers who register will be stored!
export const INITIAL_CUSTOMERS: RegisteredCustomer[] = [];

const STORAGE_KEY = 'platform_registered_customers';

// Real-time cross-tab synchronization channel
export const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('ghar_design_live_sync')
    : null;

export const broadcastStoreUpdate = (type: string, payload?: any) => {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
    // Asynchronously push updates to cloud backend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event("storage"));
      pushToCloud().catch(() => {});
    }
  } catch (e) {
    // Ignore error
  }
};

export const getRegisteredCustomers = (): RegisteredCustomer[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Filter out any legacy dummy records (Vikram Malhotra, Priya Sundaram, Rajesh Bakshi, etc.)
        const valid = parsed.filter(
          (c) =>
            c.id !== 'usr-cust-1' &&
            c.id !== 'usr-cust-2' &&
            c.id !== 'usr-cust-3' &&
            c.id !== 'usr-cust-demo' &&
            !c.name?.toLowerCase().includes('vikram') &&
            !c.name?.toLowerCase().includes('priya sundaram') &&
            !c.name?.toLowerCase().includes('rajesh bakshi') &&
            !c.phone?.includes('9876543220')
        );
        valid.sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());
        return valid;
      }
    }
  } catch (e) {
    console.error('Error reading registered customers from localStorage', e);
  }
  return [];
};

export const saveRegisteredCustomers = (customers: RegisteredCustomer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    broadcastStoreUpdate('CUSTOMERS_UPDATED', customers);
  } catch (e) {
    console.error('Error saving registered customers to localStorage', e);
  }
};

export const getCustomerByPhone = (phone: string): RegisteredCustomer | undefined => {
  const current = getRegisteredCustomers();
  const rawTarget = phone.replace(/\D/g, '').slice(-10);
  if (!rawTarget) return undefined;

  return current.find((c) => {
    const cPhone = c.phone.replace(/\D/g, '').slice(-10);
    return cPhone === rawTarget;
  });
};

export const generateCustomerId = (name?: string): string => {
  const lettersOnly = (name || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = (lettersOnly + 'CUS').slice(0, 3);
  let nextNum = 1;
  try {
    const current = getRegisteredCustomers();
    let maxSeq = 0;
    for (const c of current) {
      const match = (c.id || '').match(/BG\/[A-Z0-9]{2,4}\/(\d+)/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    nextNum = Math.max(current.length + 1, maxSeq + 1);
  } catch (e) {}
  return `BG/${prefix}/${String(nextNum).padStart(4, '0')}`;
};

export const generateQuotationCode = (): string => {
  let count = 1;
  try {
    const stored = localStorage.getItem('platform_quotations');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        let maxSeq = 0;
        for (const q of parsed) {
          const match = (q.quotationCode || q.id || '').match(/BG\/QUO\/REQ\/(\d+)/i);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
        count = Math.max(parsed.length + 1, maxSeq + 1);
      }
    }
  } catch (e) {}
  return `BG/QUO/REQ/${String(count).padStart(4, '0')}`;
};

export const updatePlatformQuotationStatus = (
  idOrCode: string,
  newStatus: string,
  extraUpdates?: Record<string, any>
): void => {
  try {
    const stored = localStorage.getItem('platform_quotations');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        let matched = false;
        const updated = parsed.map((q: any) => {
          if (q.id === idOrCode || q.quotationCode === idOrCode) {
            matched = true;
            return {
              ...q,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              ...(extraUpdates || {}),
            };
          }
          return q;
        });
        if (matched) {
          safeSetStorage('platform_quotations', updated);
          broadcastStoreUpdate('QUOTATIONS_UPDATED', { id: idOrCode, status: newStatus });
        }
      }
    }
  } catch (e) {
    console.error('Error updating platform quotation status', e);
  }
};

export const registerNewCustomer = (customerData: Partial<RegisteredCustomer>): RegisteredCustomer => {
  const current = getRegisteredCustomers();
  const rawPhone = (customerData.phone || '').replace(/\D/g, '').slice(-10);

  // Look for existing customer by phone number (last 10 digits)
  const existingIndex = current.findIndex((c) => {
    const cPhone = c.phone.replace(/\D/g, '').slice(-10);
    return rawPhone && cPhone === rawPhone;
  });

  const formattedPhone = customerData.phone?.startsWith('+91')
    ? customerData.phone
    : (rawPhone ? `+91 ${rawPhone}` : '');

  const custName = customerData.name || 'Registered Homeowner';
  const newCust: RegisteredCustomer = {
    id: customerData.id || generateCustomerId(custName),
    name: custName,
    phone: formattedPhone,
    email: customerData.email || 'Not Provided',
    housePlotNumber: customerData.housePlotNumber || '',
    streetLocality: customerData.streetLocality || '',
    landmark: customerData.landmark || '',
    city: customerData.city || '',
    state: customerData.state || '',
    pinCode: customerData.pinCode || '',
    country: customerData.country || 'India',
    alternateContact: customerData.alternateContact || '',
    registeredAt: customerData.registeredAt || new Date().toISOString(),
    status: customerData.status || 'ACTIVE',
    requestsCount: customerData.requestsCount ?? 0,
    bookingsCount: customerData.bookingsCount ?? 0,
    materialOrdersCount: customerData.materialOrdersCount ?? 0,
    isNew: true,
  };

  let updatedList: RegisteredCustomer[];
  if (existingIndex >= 0) {
    const updatedCust = {
      ...current[existingIndex],
      ...newCust,
      requestsCount: Math.max(current[existingIndex].requestsCount || 0, newCust.requestsCount),
      bookingsCount: Math.max(current[existingIndex].bookingsCount || 0, newCust.bookingsCount),
      materialOrdersCount: Math.max(current[existingIndex].materialOrdersCount || 0, newCust.materialOrdersCount),
    };
    const remaining = current.filter((_, idx) => idx !== existingIndex);
    updatedList = [updatedCust, ...remaining];
  } else {
    updatedList = [newCust, ...current];
  }

  saveRegisteredCustomers(updatedList);
  return newCust;
};

export const updateCustomerStatus = (
  id: string,
  newStatus: RegisteredCustomer['status']
): RegisteredCustomer[] => {
  const current = getRegisteredCustomers();
  const updated = current.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
  saveRegisteredCustomers(updated);
  return updated;
};

export const updateCustomerDetails = (
  id: string,
  updates: Partial<RegisteredCustomer>
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updatedCust: RegisteredCustomer = {
    ...current[idx],
    ...updates,
  };
  current[idx] = updatedCust;
  saveRegisteredCustomers(current);
  return updatedCust;
};

export const addCustomerInternalNote = (
  customerId: string,
  noteText: string,
  adminName: string
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  const note = {
    id: `note-${Date.now()}`,
    adminName,
    note: noteText,
    createdAt: new Date().toISOString(),
  };
  const notes = current[idx].internalNotes ? [note, ...current[idx].internalNotes!] : [note];
  current[idx] = { ...current[idx], internalNotes: notes };
  saveRegisteredCustomers(current);
  return current[idx];
};

export const verifyCustomer = (
  customerId: string,
  params: {
    verifiedBy: string;
    notes?: string;
    verificationType?: 'MOBILE_OTP' | 'ADMIN_KYC' | 'MANUAL_VERIFIED';
    documentType?: string;
    documentRefNumber?: string;
  }
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  current[idx] = {
    ...current[idx],
    status: 'VERIFIED',
    otpStatus: 'VERIFIED',
    verificationDetails: {
      isVerified: true,
      verifiedAt: now,
      verifiedBy: params.verifiedBy,
      verificationNotes: params.notes,
      verificationType: params.verificationType || 'ADMIN_KYC',
      documentType: params.documentType,
      documentRefNumber: params.documentRefNumber,
    },
    lastActiveAt: now,
  };
  saveRegisteredCustomers(current);
  return current[idx];
};

export const blockCustomerAccount = (
  customerId: string,
  reason: string,
  adminName: string
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  current[idx] = {
    ...current[idx],
    status: 'BLOCKED',
    blockedReason: reason,
  };
  saveRegisteredCustomers(current);
  return current[idx];
};

export const suspendCustomerAccount = (
  customerId: string,
  reason: string,
  adminName: string
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  current[idx] = {
    ...current[idx],
    status: 'SUSPENDED',
    suspensionReason: reason,
  };
  saveRegisteredCustomers(current);
  return current[idx];
};

export const restoreCustomerAccount = (
  customerId: string,
  adminName: string
): RegisteredCustomer | null => {
  const current = getRegisteredCustomers();
  const idx = current.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  current[idx] = {
    ...current[idx],
    status: 'ACTIVE',
    suspensionReason: undefined,
    blockedReason: undefined,
  };
  saveRegisteredCustomers(current);
  return current[idx];
};

export interface CustomerActivityEvent {
  id: string;
  timestamp: string;
  title: string;
  category: 'REGISTRATION' | 'REQUEST' | 'BOOKING' | 'PROJECT' | 'PAYMENT' | 'ORDER' | 'COMPLAINT' | 'ADMIN_NOTE' | 'STATUS_CHANGE';
  description: string;
  badge?: string;
  status?: string;
  amountPaise?: number;
  referenceCode?: string;
}

export const getCustomerActivityTimeline = (customerId: string, phone: string): CustomerActivityEvent[] => {
  const events: CustomerActivityEvent[] = [];
  const rawTargetPhone = (phone || '').replace(/\D/g, '').slice(-10);

  // 1. Customer registration & notes
  const customers = getRegisteredCustomers();
  const customer = customers.find((c) => c.id === customerId || (rawTargetPhone && c.phone.replace(/\D/g, '').slice(-10) === rawTargetPhone));
  if (customer) {
    events.push({
      id: `act-reg-${customer.id}`,
      timestamp: customer.registeredAt || new Date().toISOString(),
      title: 'Homeowner Account Created',
      category: 'REGISTRATION',
      description: `Registered with mobile number ${customer.phone} from ${customer.city || 'Delhi NCR'}, ${customer.state || 'India'}.`,
      badge: customer.status === 'VERIFIED' ? 'Verified Account' : 'Active Account',
    });

    if (customer.verificationDetails?.isVerified) {
      events.push({
        id: `act-ver-${customer.id}`,
        timestamp: customer.verificationDetails.verifiedAt || customer.registeredAt,
        title: 'Customer Identity Verified',
        category: 'STATUS_CHANGE',
        description: `Identity verified by Admin (${customer.verificationDetails.verifiedBy || 'Platform Admin'}) via ${customer.verificationDetails.verificationType || 'ADMIN_KYC'}.${customer.verificationDetails.verificationNotes ? ` Note: ${customer.verificationDetails.verificationNotes}` : ''}`,
        badge: 'KYC Verified',
      });
    }

    if (customer.suspensionReason) {
      events.push({
        id: `act-susp-${customer.id}`,
        timestamp: customer.lastActiveAt || new Date().toISOString(),
        title: 'Account Suspended',
        category: 'STATUS_CHANGE',
        description: `Account was suspended. Reason: ${customer.suspensionReason}`,
        badge: 'Suspended',
      });
    }

    if (customer.blockedReason) {
      events.push({
        id: `act-block-${customer.id}`,
        timestamp: customer.lastActiveAt || new Date().toISOString(),
        title: 'Account Blocked',
        category: 'STATUS_CHANGE',
        description: `Account was blocked by security audit. Reason: ${customer.blockedReason}`,
        badge: 'Blocked',
      });
    }

    if (Array.isArray(customer.internalNotes)) {
      customer.internalNotes.forEach((n) => {
        events.push({
          id: `act-note-${n.id}`,
          timestamp: n.createdAt,
          title: `Internal Note by ${n.adminName}`,
          category: 'ADMIN_NOTE',
          description: n.note,
          badge: 'Confidential Staff Note',
        });
      });
    }
  }

  // 2. Project Requests
  try {
    const requests = getPlatformRequests();
    requests.forEach((req) => {
      const reqPhone = (req.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (req.customerId === customerId || (rawTargetPhone && reqPhone === rawTargetPhone)) {
        events.push({
          id: `act-req-${req.id}`,
          timestamp: req.createdAt,
          title: `Quotation RFQ Submitted: ${req.requestCode || req.id.slice(0, 8)}`,
          category: 'REQUEST',
          description: `${req.categorySlug || 'Architecture & Design'} request for ${req.city || 'Site'}, ${req.plotArea ? `${req.plotArea} sq ft` : 'custom plot'}. Budget: ${req.budgetRange || 'Standard'}.`,
          badge: req.status,
          referenceCode: req.requestCode || req.id,
        });

        if (req.isFeePaid) {
          events.push({
            id: `act-fee-${req.id}`,
            timestamp: req.createdAt,
            title: `Design Consultation Fee Paid`,
            category: 'PAYMENT',
            description: `Paid consultation fee of ₹${((req.quoteFeePaise || 99900) / 100).toLocaleString('en-IN')} for RFQ ${req.requestCode || req.id.slice(0, 8)}.`,
            badge: 'Payment Captured',
            amountPaise: req.quoteFeePaise || 99900,
          });
        }
      }
    });
  } catch {}

  // 3. Bookings
  try {
    const bookings = getPlatformBookings();
    bookings.forEach((b) => {
      const bPhone = (b.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (b.customerId === customerId || (rawTargetPhone && bPhone === rawTargetPhone)) {
        events.push({
          id: `act-bk-${b.id}`,
          timestamp: b.confirmedAt || new Date().toISOString(),
          title: `Site Consultation Booked: ${b.bookingCode || b.id.slice(0, 8)}`,
          category: 'BOOKING',
          description: `${b.serviceTitle || 'Site Visit'} booked with ${b.professionalName || 'Architect Partner'}.`,
          badge: b.status,
          referenceCode: b.bookingCode || b.id,
        });
      }
    });
  } catch {}

  // 4. Projects & Milestones
  try {
    const prjData = localStorage.getItem('execution_projects');
    if (prjData) {
      const projects = JSON.parse(prjData);
      if (Array.isArray(projects)) {
        projects.forEach((p: any) => {
          const pPhone = (p.customerPhone || '').replace(/\D/g, '').slice(-10);
          if (p.customerId === customerId || (rawTargetPhone && pPhone === rawTargetPhone)) {
            events.push({
              id: `act-prj-${p.id}`,
              timestamp: p.startDate || p.createdAt || new Date().toISOString(),
              title: `Turnkey Project Active: ${p.name || p.projectCode || p.id.slice(0, 8)}`,
              category: 'PROJECT',
              description: `Project initialized under Architect ${p.architectName || 'Lead'}. Overall progress: ${p.progress || 0}%.`,
              badge: p.status || 'IN_PROGRESS',
              referenceCode: p.projectCode || p.id,
            });

            if (Array.isArray(p.milestones)) {
              p.milestones.forEach((m: any) => {
                if (m.paidAt || m.status === 'PAID') {
                  events.push({
                    id: `act-mil-pay-${m.id || m.milestoneNumber}`,
                    timestamp: m.paidAt || m.completedAt || new Date().toISOString(),
                    title: `Milestone #${m.milestoneNumber} Escrow Paid: ${m.title}`,
                    category: 'PAYMENT',
                    description: `Customer deposited ₹${((m.amountPaise || 0) / 100).toLocaleString('en-IN')} into escrow ledger.`,
                    badge: 'Escrow Paid',
                    amountPaise: m.amountPaise,
                  });
                }
              });
            }
          }
        });
      }
    }
  } catch {}

  // 5. Material Orders
  try {
    const ordData = localStorage.getItem('material_orders');
    if (ordData) {
      const orders = JSON.parse(ordData);
      if (Array.isArray(orders)) {
        orders.forEach((o: any) => {
          const oPhone = (o.customerPhone || o.deliveryAddress?.phone || '').replace(/\D/g, '').slice(-10);
          if (o.customerId === customerId || (rawTargetPhone && oPhone === rawTargetPhone)) {
            events.push({
              id: `act-ord-${o.id}`,
              timestamp: o.createdAt || new Date().toISOString(),
              title: `Material Order Placed: ${o.orderCode || o.id.slice(0, 8)}`,
              category: 'ORDER',
              description: `Ordered materials totaling ₹${((o.totalAmountPaise || 0) / 100).toLocaleString('en-IN')} with delivery to ${o.deliveryAddress?.city || 'site'}.`,
              badge: o.status || 'CONFIRMED',
              referenceCode: o.orderCode || o.id,
              amountPaise: o.totalAmountPaise,
            });
          }
        });
      }
    }
  } catch {}

  // 6. Support Tickets & Disputes
  try {
    const tktData = localStorage.getItem('platform_support_tickets');
    if (tktData) {
      const tickets = JSON.parse(tktData);
      if (Array.isArray(tickets)) {
        tickets.forEach((t: any) => {
          const tPhone = (t.userPhone || '').replace(/\D/g, '').slice(-10);
          if (t.userId === customerId || (rawTargetPhone && tPhone === rawTargetPhone)) {
            events.push({
              id: `act-tkt-${t.id}`,
              timestamp: t.createdAt || new Date().toISOString(),
              title: `Support Ticket Raised: ${t.ticketCode || t.id.slice(0, 8)}`,
              category: 'COMPLAINT',
              description: `${t.subject} - Priority: ${t.priority}. Status: ${t.status}.`,
              badge: t.status,
              referenceCode: t.ticketCode || t.id,
            });
          }
        });
      }
    }

    const dispData = localStorage.getItem('platform_complaint_disputes');
    if (dispData) {
      const disputes = JSON.parse(dispData);
      if (Array.isArray(disputes)) {
        disputes.forEach((d: any) => {
          const dPhone = (d.userPhone || d.complainantPhone || '').replace(/\D/g, '').slice(-10);
          if (d.customerId === customerId || d.userId === customerId || (rawTargetPhone && dPhone === rawTargetPhone)) {
            events.push({
              id: `act-disp-${d.id}`,
              timestamp: d.createdAt || new Date().toISOString(),
              title: `Project Dispute Logged: ${d.disputeCode || d.id.slice(0, 8)}`,
              category: 'COMPLAINT',
              description: `${d.title || d.subject} (${d.category || 'Quality Issue'}). Status: ${d.status}.`,
              badge: d.priority || 'DISPUTE',
              referenceCode: d.disputeCode || d.id,
            });
          }
        });
      }
    }
  } catch {}

  // Sort descending by timestamp
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const incrementCustomerActivity = (
  phoneOrId: string,
  field: 'requestsCount' | 'bookingsCount' | 'materialOrdersCount'
): void => {
  const current = getRegisteredCustomers();
  const rawTarget = phoneOrId.replace(/\D/g, '').slice(-10);

  const updated = current.map((c) => {
    const cPhone = c.phone.replace(/\D/g, '').slice(-10);
    const match = c.id === phoneOrId || (rawTarget && cPhone === rawTarget);
    if (match) {
      return { ...c, [field]: (c[field] || 0) + 1 };
    }
    return c;
  });

  saveRegisteredCustomers(updated);
};

export interface PlatformBooking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceTitle: string;
  serviceType: string;
  firmName?: string;
  professionalName?: string;
  professionalPhone?: string;
  professionalEmail?: string;
  professionalRole?: string;
  professionalRating?: number;
  professionalExperience?: string;
  nextAppointment?: string;
  visitDate?: string;
  visitTimeSlot?: string;
  siteAddress?: string;
  totalAmountPaise: number;
  advancePaise?: number;
  advancePaidPaise?: number;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  confirmedAt: string;
  notes?: string;
  requestId?: string;
  quoteCode?: string;
}

const BOOKINGS_KEY = 'platform_bookings';

export const SEED_BOOKINGS: PlatformBooking[] = [];

export const getPlatformBookings = (): PlatformBooking[] => {
  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((b) => {
          if (!b) return false;
          const name = (b.customerName || '').toLowerCase();
          const phone = b.customerPhone || '';
          const code = b.bookingCode || b.id || '';
          // Only filter out legacy mock seed codes
          if (code === 'BK-2026-5501' || code === 'BK-2026-5502' || code === 'bk-5501' || code === 'bk-5502') return false;
          return true;
        });
      }
    }
  } catch (e) {
    console.error('Error reading platform bookings from localStorage', e);
  }
  return [];
};

export const savePlatformBooking = (booking: PlatformBooking): void => {
  try {
    const current = getPlatformBookings();
    const existingIndex = current.findIndex((b) => b.id === booking.id || b.bookingCode === booking.bookingCode);
    let updated: PlatformBooking[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...booking };
    } else {
      updated = [booking, ...current];
    }
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));

    // Ensure customer is registered/updated in customerStore
    registerNewCustomer({
      id: booking.customerId,
      name: booking.customerName,
      phone: booking.customerPhone,
      email: booking.customerEmail || 'Not Provided',
      housePlotNumber: booking.siteAddress?.split(',')[0] || '',
      streetLocality: booking.siteAddress || '',
      city: (booking as any).siteCity || (booking as any).city || '',
      state: (booking as any).siteState || (booking as any).state || '',
      pinCode: (booking as any).sitePinCode || (booking as any).pinCode || '',
      bookingsCount: 1,
    });

    incrementCustomerActivity(booking.customerPhone, 'bookingsCount');
    broadcastStoreUpdate('BOOKINGS_UPDATED', booking);
  } catch (e) {
    console.error('Error saving platform booking to localStorage', e);
  }
};

export const updatePlatformBookingStatus = (id: string, newStatus: PlatformBooking['status']): PlatformBooking[] => {
  const current = getPlatformBookings();
  const updated = current.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('BOOKINGS_UPDATED', { id, status: newStatus });
  } catch (e) {
    console.error('Error updating booking status', e);
  }
  return updated;
};

export interface PlatformProjectRequest {
  id: string;
  requestCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  categorySlug: string;
  propertyType?: string;
  plotWidth?: number;
  plotLength?: number;
  measurementUnit?: string;
  plotArea?: number;
  builtUpArea?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  currentCondition?: string;
  city?: string;
  state?: string;
  locality?: string;
  address?: string;
  ownershipConfirmed?: boolean;
  requiredServices?: string[];
  budgetRange?: string;
  preferredStartDate?: string;
  expectedCompletionDate?: string;
  description?: string;
  designStyle?: string;
  siteAccessibilityNotes?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'ASSIGNED' | 'QUOTATIONS_AVAILABLE' | 'BOOKING_CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  quoteFeePaise?: number;
  isFeePaid?: boolean;
  assignedCount?: number;
  quotationsCount?: number;
  adminNotes?: string;
  selectedProfessionalIds?: string[];
  assignedProfessionals?: any[];
  assignedProfessionalIds?: string[];
  responseDeadline?: string;
  termsAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

const REQUESTS_KEY = 'platform_project_requests';

export const SEED_REQUESTS: PlatformProjectRequest[] = [];

export const getPlatformRequests = (): PlatformProjectRequest[] => {
  try {
    const data = localStorage.getItem(REQUESTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => {
          if (!r) return false;
          const name = (r.customerName || '').toLowerCase();
          const phone = r.customerPhone || '';
          const code = r.requestCode || r.id || '';
          // Only filter out legacy hardcoded mock dummy test IDs
          if (code === 'req-301' || code === 'req-302' || code === 'req-303' || code === 'req-304' || code === 'req-1001') return false;
          if (code === 'GHR-REQ-2026-301' || code === 'GHR-REQ-2026-302' || code === 'GHR-REQ-2026-303' || code === 'GHR-REQ-2026-1001') return false;
          return true;
        });
      }
    }
  } catch (e) {
    console.error('Error reading platform requests from localStorage', e);
  }
  return [];
};

export const getPlatformRequestById = (idOrCode: string): PlatformProjectRequest | undefined => {
  if (!idOrCode) return undefined;
  const clean = idOrCode.trim().toLowerCase();
  const current = getPlatformRequests();
  const found = current.find((r) => {
    if (!r) return false;
    const rId = (r.id || '').trim().toLowerCase();
    const rCode = (r.requestCode || '').trim().toLowerCase();
    return (
      rId === clean ||
      rCode === clean ||
      rId.replace(/\//g, '-') === clean ||
      rCode.replace(/\//g, '-') === clean ||
      (clean.length >= 4 && (rId.endsWith(clean) || rCode.endsWith(clean)))
    );
  });
  if (found) return found;

  // Fallback: check raw localStorage without filter
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      if (Array.isArray(all)) {
        return all.find((r: any) => {
          if (!r) return false;
          const rId = (r.id || '').trim().toLowerCase();
          const rCode = (r.requestCode || '').trim().toLowerCase();
          return (
            rId === clean ||
            rCode === clean ||
            rId.replace(/\//g, '-') === clean ||
            rCode.replace(/\//g, '-') === clean ||
            (clean.length >= 4 && (rId.endsWith(clean) || rCode.endsWith(clean)))
          );
        });
      }
    }
  } catch {}
  return undefined;
};

export const savePlatformRequest = (req: PlatformProjectRequest): void => {
  try {
    const current = getPlatformRequests();
    const existingIndex = current.findIndex((r) => r.id === req.id || r.requestCode === req.requestCode);
    let updated: PlatformProjectRequest[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...req, updatedAt: new Date().toISOString() };
    } else {
      updated = [req, ...current];
    }
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));

    // Ensure customer is registered/updated in customerStore
    if (req.customerPhone) {
      registerNewCustomer({
        id: req.customerId,
        name: req.customerName,
        phone: req.customerPhone,
        email: req.customerEmail || 'Not Provided',
        housePlotNumber: req.address?.split(',')[0] || `Plot ${req.plotArea || ''} ${req.measurementUnit || 'ft'}`.trim(),
        streetLocality: req.locality || req.city || '',
        city: req.city || '',
        state: req.state || '',
        pinCode: req.pinCode || '',
        requestsCount: 1,
      });
      incrementCustomerActivity(req.customerPhone, 'requestsCount');
    }

    broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', req);
  } catch (e) {
    console.error('Error saving platform request to localStorage', e);
  }
};

export const updatePlatformRequestStatus = (
  idOrCode: string,
  newStatus: PlatformProjectRequest['status'],
  extra?: Partial<PlatformProjectRequest>
): PlatformProjectRequest | null => {
  if (!idOrCode) return null;
  const clean = idOrCode.trim().toLowerCase();

  // 1. Read current requests from memory or raw localStorage
  let current = getPlatformRequests();
  if (current.length === 0) {
    try {
      const raw = localStorage.getItem(REQUESTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) current = parsed;
      }
    } catch {}
  }

  let matchedIndex = -1;
  for (let i = 0; i < current.length; i++) {
    const r = current[i];
    if (!r) continue;
    const rId = (r.id || '').trim().toLowerCase();
    const rCode = (r.requestCode || '').trim().toLowerCase();
    if (
      r.id === idOrCode ||
      r.requestCode === idOrCode ||
      rId === clean ||
      rCode === clean ||
      rId.replace(/[\/_-]/g, '') === clean.replace(/[\/_-]/g, '') ||
      rCode.replace(/[\/_-]/g, '') === clean.replace(/[\/_-]/g, '') ||
      (clean.length >= 6 && (rId.includes(clean) || rCode.includes(clean) || clean.includes(rId) || clean.includes(rCode)))
    ) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex === -1) {
    console.warn(`[updatePlatformRequestStatus] Could not find request matching "${idOrCode}"`);
    return null;
  }

  const existing = current[matchedIndex];
  const updatedReq: PlatformProjectRequest = {
    ...existing,
    status: newStatus,
    ...extra,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [...current];
  updatedList[matchedIndex] = updatedReq;

  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedList));
    broadcastStoreUpdate('PROJECT_REQUESTS_UPDATED', updatedReq);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error('Error updating platform request status', e);
  }

  return updatedReq;
};

// Purge any lingering dummy seed data from previous test sessions
export const purgeDummyData = (): void => {
  try {
    const dummyIds = new Set([
      'usr-cust-1', 'usr-cust-2', 'usr-cust-3', 'usr-cust-demo',
      'usr-cust-101', 'usr-cust-102', 'usr-cust-103', 'usr-cust-104', 'usr-cust-105', 'usr-cust-106',
      'cust-301', 'cust-302', 'cust-303', 'cust-304',
      'req-301', 'req-302', 'req-303', 'req-304', 'req-1001',
      'bk-5501', 'bk-5502',
    ]);
    const dummyFirmKeywords = [
      'rathore heritage demo', 'apex civil engineering demo', 'buildcraft turnkey demo',
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
    const dummyNames = ['dummy user', 'sample client', 'demo customer'];
    const dummyPhones = ['0000000000', '1111111111'];

    const isDummy = (item: any): boolean => {
      if (!item) return true;
      if (dummyIds.has(item.id) || dummyIds.has(item.customerId) || dummyIds.has(item.requestId)) return true;
      if (dummyCodes.has(item.requestCode) || dummyCodes.has(item.bookingCode) || dummyCodes.has(item.orderCode) || dummyCodes.has(item.quotationCode)) return true;
      
      const name = (item.name || item.customerName || '').toLowerCase().trim();
      if (dummyNames.some((dn) => name === dn)) return true;
      
      const phone = (item.phone || item.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (dummyPhones.includes(phone)) return true;

      // Dummy professional or firm check
      const proName = (item.professionalName || item.professional?.name || '').toLowerCase().trim();
      if (dummyProKeywords.some((dp) => proName === dp)) return true;

      const firm = (item.firmName || item.professional?.firmName || '').toLowerCase().trim();
      if (dummyFirmKeywords.some((df) => firm === df)) return true;

      const coa = (item.coaNumber || '').toLowerCase();
      if (coa === 'ca/2020/00000') return true;

      // Old mock quotation specifications check
      const specs = (item.specifications || item.adminFeedback || '').toLowerCase();
      if (specs.includes('fe550d tmt, ultratech 53 opc') || specs.includes('scope verified by buildghar chief engineer')) return true;

      return false;
    };

    // 1. Customers
    const custsRaw = localStorage.getItem(STORAGE_KEY);
    if (custsRaw) {
      const custs = JSON.parse(custsRaw).filter((c: any) => !isDummy(c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custs));
    }

    // 2. Project Requests
    const reqsJson = localStorage.getItem(REQUESTS_KEY);
    if (reqsJson) {
      const reqs = JSON.parse(reqsJson).filter((r: any) => !isDummy(r));
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
    }

    // 3. Bookings
    const bookingsJson = localStorage.getItem(BOOKINGS_KEY);
    if (bookingsJson) {
      const bks = JSON.parse(bookingsJson).filter((b: any) => !isDummy(b));
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bks));
    }

    // 4. Quotations
    const quotesJson = localStorage.getItem('platform_quotations');
    let remainingQuotes: any[] = [];
    if (quotesJson) {
      remainingQuotes = JSON.parse(quotesJson).filter((q: any) => !isDummy(q));
      safeSetStorage('platform_quotations', remainingQuotes);
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
    }

    // 5. Execution Projects
    const projsJson = localStorage.getItem('gd_projects_v1');
    if (projsJson) {
      const projs = JSON.parse(projsJson).filter((p: any) => !isDummy(p) && p.id !== 'PRJ-2026-901' && p.id !== 'PRJ-2026-902');
      localStorage.setItem('gd_projects_v1', JSON.stringify(projs));
    }

    // 6. Material Orders
    const ordersJson = localStorage.getItem('material_orders');
    if (ordersJson) {
      const orders = JSON.parse(ordersJson).filter((o: any) => !isDummy(o));
      localStorage.setItem('material_orders', JSON.stringify(orders));
    }

    // 7. Interior Quotations & Projects
    const intQuotesJson = localStorage.getItem('gd_interior_quotations_v1');
    if (intQuotesJson) {
      const intQ = JSON.parse(intQuotesJson).filter((q: any) => !isDummy(q));
      localStorage.setItem('gd_interior_quotations_v1', JSON.stringify(intQ));
    }
    const intBksJson = localStorage.getItem('gd_interior_bookings_v1');
    if (intBksJson) {
      const intB = JSON.parse(intBksJson).filter((b: any) => !isDummy(b));
      localStorage.setItem('gd_interior_bookings_v1', JSON.stringify(intB));
    }
    const intProjsJson = localStorage.getItem('gd_interior_projects_v1');
    if (intProjsJson) {
      const intP = JSON.parse(intProjsJson).filter((p: any) => !isDummy(p));
      localStorage.setItem('gd_interior_projects_v1', JSON.stringify(intP));
    }

    // 8. Platform Admin Stores (Purge legacy dummy tickets, broadcasts, staff, audit logs, designers, architects, coupons, contractors)
    const adminStaffJson = localStorage.getItem('platform_admin_staff_roles_ledger');
    if (adminStaffJson) {
      try {
        const staff = JSON.parse(adminStaffJson).filter((s: any) => s.id !== 'adm-2' && s.id !== 'adm-3' && s.id !== 'adm-4');
        localStorage.setItem('platform_admin_staff_roles_ledger', JSON.stringify(staff));
      } catch {}
    }

    const auditLogsJson = localStorage.getItem('platform_security_audit_logs');
    if (auditLogsJson) {
      try {
        const logs = JSON.parse(auditLogsJson).filter((l: any) => l.id !== 'log-1' && l.id !== 'log-2' && l.id !== 'log-3' && l.id !== 'log-4');
        localStorage.setItem('platform_security_audit_logs', JSON.stringify(logs));
      } catch {}
    }

    const ticketsJson = localStorage.getItem('platform_support_tickets_v1');
    if (ticketsJson) {
      try {
        const tkts = JSON.parse(ticketsJson).filter((t: any) => t.id !== 'tkt-1' && t.id !== 'tkt-2' && t.id !== 'tkt-3');
        localStorage.setItem('platform_support_tickets_v1', JSON.stringify(tkts));
      } catch {}
    }

    const broadcastJson = localStorage.getItem('platform_broadcast_notifications_ledger');
    if (broadcastJson) {
      try {
        const notifs = JSON.parse(broadcastJson).filter((b: any) => b.id !== 'bnotif-1' && b.id !== 'bnotif-2');
        localStorage.setItem('platform_broadcast_notifications_ledger', JSON.stringify(notifs));
      } catch {}
    }

    const couponsJson = localStorage.getItem('platform_coupons');
    if (couponsJson) {
      try {
        const cpns = JSON.parse(couponsJson).filter((c: any) => c.id !== 'cpn-1' && c.id !== 'cpn-2');
        localStorage.setItem('platform_coupons', JSON.stringify(cpns));
      } catch {}
    }

    const designersJson = localStorage.getItem('gd_interior_designer_accounts_v1');
    if (designersJson) {
      try {
        const ds = JSON.parse(designersJson).filter(
          (d: any) =>
            d.id !== 'id-101' &&
            d.id !== 'id-102' &&
            d.id !== 'id-103' &&
            d.id !== 'id-104' &&
            d.id !== 'id-105' &&
            !d.name?.toLowerCase().includes('pooja mehra') &&
            !d.name?.toLowerCase().includes('rohan varma') &&
            !d.name?.toLowerCase().includes('ananya roy') &&
            !d.name?.toLowerCase().includes('simran bajaj')
        );
        localStorage.setItem('gd_interior_designer_accounts_v1', JSON.stringify(ds));
      } catch {}
    }

    const archsJson = localStorage.getItem('gd_architect_accounts_v2');
    if (archsJson) {
      try {
        const as = JSON.parse(archsJson).filter((a: any) => !isDummy(a));
        localStorage.setItem('gd_architect_accounts_v2', JSON.stringify(as));
      } catch {}
    }

    const contractorsJson = localStorage.getItem('platform_contractors_ledger');
    if (contractorsJson) {
      try {
        const cs = JSON.parse(contractorsJson).filter((c: any) => !c.id?.startsWith('cont-10') && !c.phone?.includes('9811'));
        localStorage.setItem('platform_contractors_ledger', JSON.stringify(cs));
      } catch {}
    }

    // 9. User session check
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const u = JSON.parse(userJson);
      if (isDummy(u) || u.name?.toLowerCase() === 'homeowner') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    broadcastStoreUpdate('DATA_PURGED');
  } catch (e) {
    console.error('Error in purgeDummyData:', e);
  }
};

/**
 * Permanently clears all operational records across the platform,
 * leaving Admin session intact with pure real data state (0 records).
 */
export const clearAllPlatformData = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const keysToReset = [
    'platform_registered_customers',
    'registered_customers',
    'platform_bookings',
    'platform_customer_bookings',
    'platform_project_requests',
    'platform_quotations',
    'platform_contractors_ledger',
    'platform_central_support_tickets',
    'platform_broadcast_notifications_ledger',
    'platform_marketing_coupons_ledger',
    'platform_security_audit_logs',
    'gd_architect_accounts_v2',
    'gd_interior_designer_accounts_v1',
    'gd_professional_accounts',
    'gd_professional_payouts',
    'gd_professional_messages',
    'gd_professional_tickets',
    'gd_customer_execution_projects_v2',
    'gd_all_project_timelines_index',
    'platform_registered_vendors',
    'platform_vendor_products',
    'platform_material_requests',
    'platform_vendor_quotations',
    'platform_vendor_payouts',
    'platform_vendor_category_requests',
    'platform_inventory_movements',
    'platform_vendor_invoices',
    'platform_vendor_promotions',
    'platform_vendor_customer_queries',
    'platform_vendor_product_reviews',
    'platform_vendor_support_tickets',
    'platform_vendor_notifications',
    'material_orders',
    'customer_cart',
    'customer_addresses',
    'ghar_architect_designs',
    'ghar_architect_boqs',
    'ghar_architect_site_visits',
    'ghar_architect_deliverables',
    'ghar_architect_reviews',
    'ghar_architect_notifications',
    'ghar_architect_messages',
  ];

  for (const k of keysToReset) {
    try {
      localStorage.setItem(k, '[]');
    } catch (_) {}
  }

  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('admin_global_refresh'));
    window.dispatchEvent(new Event('architect_store_updated'));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'ALL_DATA_CLEARED', timestamp: Date.now() });
    }
  } catch (_) {}
};

// Auto-purge & reset all stale/dummy records across clients
const GLOBAL_PURGE_V6_KEY = 'gd_admin_data_purged_v6';
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    if (localStorage.getItem(GLOBAL_PURGE_V6_KEY) !== 'done') {
      clearAllPlatformData();
      localStorage.setItem(GLOBAL_PURGE_V6_KEY, 'done');
    } else {
      purgeDummyData();
    }
  } catch (e) {}
}

// ==============================================================================
// REGISTERED ADMIN USER STORE
// ==============================================================================
export interface RegisteredAdmin {
  id: string;
  name: string;
  phone: string;
  email: string;
  department?: string;
  registeredAt: string;
  role: 'ADMIN';
  isActive: boolean;
}

const ADMIN_STORAGE_KEY = 'platform_registered_admins';

export const DEFAULT_PRIMARY_ADMIN: RegisteredAdmin = {
  id: 'usr-admin-primary',
  name: 'Platform Super Administrator',
  phone: '+91 8319955741',
  email: 'admin@buildghar.com',
  department: 'Platform Operations Director',
  registeredAt: '2026-01-01T00:00:00.000Z',
  role: 'ADMIN',
  isActive: true,
};

export const getRegisteredAdmins = (): RegisteredAdmin[] => {
  try {
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasPrimary = parsed.some((a) => a.phone?.replace(/\D/g, '').slice(-10) === '8319955741');
        return hasPrimary ? parsed : [DEFAULT_PRIMARY_ADMIN, ...parsed];
      }
    }
  } catch (e) {
    console.error('Error reading registered admins from localStorage', e);
  }
  return [DEFAULT_PRIMARY_ADMIN];
};

export const getAdminByPhone = (phone: string): RegisteredAdmin | undefined => {
  const current = getRegisteredAdmins();
  const rawTarget = phone.replace(/\D/g, '').slice(-10);
  if (!rawTarget) return undefined;
  const match = current.find((a) => {
    const aPhone = a.phone.replace(/\D/g, '').slice(-10);
    return aPhone === rawTarget;
  });
  if (match) return match;
  if (rawTarget === '8319955741' || rawTarget === (import.meta.env.VITE_ADMIN_PHONE || '8319955741').replace(/\D/g, '').slice(-10)) {
    return DEFAULT_PRIMARY_ADMIN;
  }
  return undefined;
};

export const saveRegisteredAdmin = (adminData: Partial<RegisteredAdmin>): RegisteredAdmin => {
  const current = getRegisteredAdmins();
  const rawPhone = (adminData.phone || '').replace(/\D/g, '').slice(-10);
  const existingIndex = current.findIndex((a) => {
    const aPhone = a.phone.replace(/\D/g, '').slice(-10);
    return rawPhone && aPhone === rawPhone;
  });

  const formattedPhone = adminData.phone?.startsWith('+91')
    ? adminData.phone
    : (rawPhone ? `+91 ${rawPhone}` : '');

  const newAdmin: RegisteredAdmin = {
    id: adminData.id || `usr-admin-${Date.now()}`,
    name: adminData.name || 'Platform Administrator',
    phone: formattedPhone,
    email: adminData.email || 'admin@ghardesign.in',
    department: adminData.department || 'Platform Operations Manager',
    registeredAt: adminData.registeredAt || new Date().toISOString(),
    role: 'ADMIN',
    isActive: true,
  };

  let updatedList: RegisteredAdmin[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...newAdmin };
  } else {
    updatedList = [newAdmin, ...current];
  }

  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updatedList));
    broadcastStoreUpdate('ADMINS_UPDATED', newAdmin);
  } catch (e) {
    console.error('Error saving admin to localStorage', e);
  }
  return newAdmin;
};

// ==============================================================================
// PLATFORM PROFESSIONALS STORE
// ==============================================================================
export interface PlatformProfessional {
  id: string;
  userId: string;
  name: string;
  firmName: string;
  category: 'CIVIL_ENGINEER' | 'STRUCTURAL_ENGINEER' | 'INTERIOR_DESIGNER' | 'CONSTRUCTION_CONTRACTOR' | 'SPECIALIST';
  phone?: string;
  email?: string;
  qualifications: string;
  experienceYears: number;
  serviceCities?: string[];
  isVerified: boolean;
  verificationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt?: string;
}

const PROFESSIONALS_STORAGE_KEY = 'platform_professionals';

export const getPlatformProfessionals = (): PlatformProfessional[] => {
  try {
    const data = localStorage.getItem(PROFESSIONALS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          (p) =>
            p.id !== 'prof-demo' &&
            !p.name?.toLowerCase().includes('demo') &&
            !p.name?.toLowerCase().includes('vikram')
        );
      }
    }
  } catch (e) {}
  return [];
};

export const savePlatformProfessional = (pro: Partial<PlatformProfessional>): PlatformProfessional => {
  const current = getPlatformProfessionals();
  const newPro: PlatformProfessional = {
    id: pro.id || `prof-${Date.now()}`,
    userId: pro.userId || `usr-pro-${Date.now()}`,
    name: pro.name || '',
    firmName: pro.firmName || '',
    category: pro.category || 'CIVIL_ENGINEER',
    phone: pro.phone || '',
    email: pro.email || '',
    qualifications: pro.qualifications || '',
    experienceYears: Number(pro.experienceYears) || 5,
    serviceCities: pro.serviceCities || [],
    isVerified: pro.isVerified ?? true,
    verificationStatus: pro.verificationStatus || 'PENDING',
    createdAt: pro.createdAt || new Date().toISOString(),
  };

  const existingIndex = current.findIndex((p) => p.id === newPro.id || p.userId === newPro.userId);
  let updatedList: PlatformProfessional[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...newPro };
  } else {
    updatedList = [newPro, ...current];
  }

  try {
    localStorage.setItem(PROFESSIONALS_STORAGE_KEY, JSON.stringify(updatedList));
    broadcastStoreUpdate('PROFESSIONALS_UPDATED', newPro);
  } catch (e) {
    console.error('Error saving professional', e);
  }
  return newPro;
};

export const updatePlatformProfessionalStatus = (
  id: string,
  status: 'APPROVED' | 'REJECTED'
): PlatformProfessional[] => {
  const current = getPlatformProfessionals();
  const updated = current.map((p) =>
    p.id === id || p.userId === id
      ? { ...p, verificationStatus: status, isVerified: status === 'APPROVED' }
      : p
  );
  try {
    localStorage.setItem(PROFESSIONALS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('PROFESSIONALS_UPDATED');
  } catch (e) {}
  return updated;
};

export const getProfessionalByPhone = (phone: string): PlatformProfessional | undefined => {
  const current = getPlatformProfessionals();
  const rawTarget = phone.replace(/\D/g, '').slice(-10);
  if (!rawTarget) return undefined;
  return current.find((p) => {
    const pPhone = (p.phone || '').replace(/\D/g, '').slice(-10);
    return pPhone === rawTarget;
  });
};

// ==============================================================================
// PLATFORM SERVICE CATEGORIES STORE
// ==============================================================================
export interface PlatformSubCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface PlatformCategoryItem {
  slug: string;
  name: string;
  shortDescription: string;
  icon?: string;
  isActive: boolean;
  subcategories?: PlatformSubCategoryItem[];
}

const CATEGORIES_STORAGE_KEY = 'platform_service_categories';

export const DEFAULT_PLATFORM_CATEGORIES: PlatformCategoryItem[] = [
  {
    slug: 'planning-design',
    name: 'Planning & Design',
    shortDescription: 'Comprehensive concept drawings, functional space layouts & master site planning.',
    icon: 'Building2',
    isActive: true,
    subcategories: [
      { id: 'sub-plan-1', name: '2D Floor Plan & Municipal Blueprints', slug: '2d-floor-plan', description: 'Vastu compliant 2D floor plans and municipal submission blueprints.', isActive: true },
      { id: 'sub-plan-2', name: 'Architectural Working Drawings', slug: 'architectural-working-drawings', description: 'Detailed door-window schedules, masonry dimensions and cross sections.', isActive: true },
      { id: 'sub-plan-3', name: 'Master Site Planning & Circulation Layout', slug: 'master-site-planning', description: 'Comprehensive site zoning, set-backs, parking, and boundary planning.', isActive: true },
      { id: 'sub-plan-4', name: 'Vastu Compliant Concept Planning', slug: 'vastu-concept-planning', description: 'Energy alignment, orientation, and functional room placements.', isActive: true },
    ],
  },
  {
    slug: 'house-map-planning',
    name: 'House Map / Floor Plan',
    shortDescription: '2D floor plans, Vastu compliance, municipal approval drawings, and structural layouts.',
    icon: 'Compass',
    isActive: true,
    subcategories: [
      { id: 'sub-map-1', name: '2D Floor Plan', slug: '2d-floor-plan-basic', description: 'Itemized architectural room layouts and dimensioned floor plan.', isActive: true },
      { id: 'sub-map-2', name: 'Municipal Sanction Drawings', slug: 'municipal-sanction-drawings', description: 'Authority-compliant blueprints for building permit approvals.', isActive: true },
      { id: 'sub-map-3', name: 'Furniture Layout Plan', slug: 'furniture-layout-plan', description: 'Detailed space circulation and furniture positioning.', isActive: true },
    ],
  },
  {
    slug: 'structural-engineering',
    name: 'Structural Design',
    shortDescription: 'RCC column design, beam details, load calculations, and soil test vetting.',
    icon: 'ShieldCheck',
    isActive: true,
    subcategories: [
      { id: 'sub-struct-1', name: 'Structural Load Calculations & RCC Drawings', slug: 'structural-load-rcc', description: 'IS 456 compliant structural frame design with beam, slab, and column schedules.', isActive: true },
      { id: 'sub-struct-2', name: 'Foundation Design & Soil Test Vetting', slug: 'foundation-design', description: 'Isolated/raft footing sizing based on soil bearing capacity.', isActive: true },
      { id: 'sub-struct-3', name: 'Structural Stability & Safety Certificate', slug: 'structural-stability-cert', description: 'Licensed structural engineer verification and safety audit certificate.', isActive: true },
    ],
  },
  {
    slug: 'civil-engineering-consultancy',
    name: 'Civil Engineering Consultancy',
    shortDescription: 'Professional engineering vetting, foundation audits, material testing & stability certification.',
    icon: 'ShieldCheck',
    isActive: true,
    subcategories: [
      { id: 'sub-civil-1', name: 'Detailed Bill of Quantities (BOQ) & Estimate', slug: 'detailed-boq-estimate', description: 'Itemized material consumption: steel, cement, aggregates, and labor rates.', isActive: true },
      { id: 'sub-civil-2', name: 'Site Soil Testing & Bearing Capacity Audit', slug: 'site-soil-testing', description: 'Laboratory soil borehole test and safe bearing capacity report.', isActive: true },
      { id: 'sub-civil-3', name: 'Material Quality Batch Testing & Audit', slug: 'material-batch-testing', description: 'Cube compressive test, rebar tensile strength, and quality audit.', isActive: true },
    ],
  },
  {
    slug: 'interior-designing',
    name: 'Interior Design',
    shortDescription: 'Modular kitchens, false ceiling, bespoke lighting, wardrobes and modern aesthetics.',
    icon: 'Paintbrush',
    isActive: true,
    subcategories: [
      { id: 'sub-int-1', name: 'Turnkey Interior Designing', slug: 'turnkey-interior-designing', description: 'Complete interior design and execution with materials and finishes.', isActive: true },
      { id: 'sub-int-2', name: 'Modular Kitchen Design', slug: 'modular-kitchen-design', description: 'Ergonomic kitchen layout, hardware fittings, and modular cabinetry.', isActive: true },
      { id: 'sub-int-3', name: 'Furniture & False Ceiling Layout', slug: 'furniture-false-ceiling', description: 'POP/gypsum false ceiling profiles, coving, and lighting plans.', isActive: true },
      { id: 'sub-int-4', name: 'Wardrobes & Storage Joinery Design', slug: 'wardrobes-joinery', description: 'Custom fitted wardrobes, vanity units, and TV entertainment units.', isActive: true },
    ],
  },
  {
    slug: '2d-planning',
    name: '2D Planning',
    shortDescription: 'High-precision 2D floor plans, working blueprints, door-window schedules & circulation plans.',
    icon: 'FileText',
    isActive: true,
    subcategories: [
      { id: 'sub-2d-1', name: 'Comprehensive 2D Working Drawings', slug: 'comprehensive-2d-working', description: 'Full architectural working drawings for on-site mason execution.', isActive: true },
      { id: 'sub-2d-2', name: 'Door & Window Schedule', slug: 'door-window-schedule', description: 'Detailed openings schedule, lintel heights, and glazing specifications.', isActive: true },
    ],
  },
  {
    slug: '3d-elevation',
    name: '3D Elevation',
    shortDescription: 'Modern, classical or contemporary exterior facade 3D renders with day/night lighting.',
    icon: 'Sparkles',
    isActive: true,
    subcategories: [
      { id: 'sub-3d-1', name: '3D Elevation & Walkthrough', slug: '3d-elevation-walkthrough', description: 'Photorealistic exterior 3D elevation renders with texture details.', isActive: true },
      { id: 'sub-3d-2', name: 'Day & Night Facade Lighting Renders', slug: 'day-night-facade', description: 'Exterior lighting scheme with warm LED coving and landscape lighting.', isActive: true },
      { id: 'sub-3d-3', name: '360 Exterior Virtual Tour', slug: '360-exterior-tour', description: 'Interactive 360-degree exterior architectural rotation view.', isActive: true },
    ],
  },
  {
    slug: '3d-interior-rendering',
    name: '3D Interior Rendering',
    shortDescription: 'Photorealistic 360-degree interior visualisations for living, kitchen, bedrooms and baths.',
    icon: 'Eye',
    isActive: true,
    subcategories: [
      { id: 'sub-3dint-1', name: 'Living Room 3D Photorealistic Views', slug: 'living-room-3d', description: 'High-definition 3D rendering of living, dining, and foyer areas.', isActive: true },
      { id: 'sub-3dint-2', name: 'Modular Kitchen 3D Visualisation', slug: 'kitchen-3d-vis', description: 'Detailed finishes, countertop materials, and cabinet visualisations.', isActive: true },
      { id: 'sub-3dint-3', name: 'Master Bedroom 360 Virtual Tour', slug: 'bedroom-360-tour', description: 'Bespoke bedroom interior renders with wardrobe and lighting.', isActive: true },
    ],
  },
  {
    slug: 'new-house-construction',
    name: 'New House Construction',
    shortDescription: 'Residential civil construction from foundation to finishing with escrow milestones.',
    icon: 'Building2',
    isActive: true,
    subcategories: [
      { id: 'sub-cons-1', name: 'Complete Civil Construction', slug: 'complete-civil-construction', description: 'Grey structure construction: excavation, foundation, RCC frame, and brickwork.', isActive: true },
      { id: 'sub-cons-2', name: 'Full Turnkey Construction Package', slug: 'full-turnkey-package', description: 'End-to-end civil construction with flooring, painting, and sanitary fittings.', isActive: true },
    ],
  },
  {
    slug: 'home-renovation',
    name: 'Home Renovation',
    shortDescription: 'Structural repairs, floor extensions, space redesign, water-proofing and modernization.',
    icon: 'Hammer',
    isActive: true,
    subcategories: [
      { id: 'sub-reno-1', name: 'Renovation / Space Remodeling', slug: 'renovation-remodeling', description: 'Room layout modifications, floor extension, and aesthetic upgrade.', isActive: true },
      { id: 'sub-reno-2', name: 'Terrace & Wet Area Waterproofing', slug: 'waterproofing-services', description: 'Multi-layer chemical waterproofing and leakage rectification.', isActive: true },
    ],
  },
  {
    slug: 'complete-construction-package',
    name: 'Complete Construction Package',
    shortDescription: 'End-to-end integration: Civil Engineering + Interior Design + Materials.',
    icon: 'CheckCircle2',
    isActive: true,
    subcategories: [
      { id: 'sub-pkg-1', name: 'Integrated Architecture + Construction + Interiors', slug: 'integrated-turnkey', description: 'Unified single-contract turnkey residential build.', isActive: true },
    ],
  },
  {
    slug: 'commercial-construction',
    name: 'Commercial Construction',
    shortDescription: 'Office spaces, retail shops, showrooms and commercial complex engineering.',
    icon: 'Briefcase',
    isActive: true,
    subcategories: [
      { id: 'sub-comm-1', name: 'Commercial Office & Retail Interior Fitout', slug: 'commercial-fitout', description: 'Turnkey commercial fitouts, workstations, and lighting.', isActive: true },
      { id: 'sub-comm-2', name: 'Commercial Complex RCC Construction', slug: 'commercial-rcc-complex', description: 'Commercial grade structural civil construction.', isActive: true },
    ],
  },
  {
    slug: 'mep-planning',
    name: 'Plumbing and Electrical Planning',
    shortDescription: 'Sanitary conduit engineering, conduit piping, load phase distribution and water supply layouts.',
    icon: 'Wrench',
    isActive: true,
    subcategories: [
      { id: 'sub-mep-1', name: 'Electrical & Plumbing (MEP) Layouts', slug: 'electrical-plumbing-mep', description: 'Circuit phase distribution, switch points, plumbing pipelines, and drainage.', isActive: true },
      { id: 'sub-mep-2', name: 'Sanitary Drainage & Water Supply Piping', slug: 'sanitary-drainage-piping', description: 'Hydro-pneumatic pump layouts, overhead tank piping, and waste drainage.', isActive: true },
    ],
  },
  {
    slug: 'site-supervision',
    name: 'Site Supervision & Project Audit',
    shortDescription: 'Daily stage inspections, quality batch testing, BOQ verification and work certification.',
    icon: 'Eye',
    isActive: true,
    subcategories: [
      { id: 'sub-sup-1', name: 'Independent Site Supervision & Audit', slug: 'independent-site-supervision', description: 'Stage-by-stage civil verification before concrete pouring.', isActive: true },
      { id: 'sub-sup-2', name: 'BOQ Verification & Contractor Billing Audit', slug: 'contractor-billing-audit', description: 'Independent cross-measurement of executed quantities and vendor bills.', isActive: true },
    ],
  },
  {
    slug: 'boq-estimation',
    name: 'Material Estimation / BOQ',
    shortDescription: 'Independent bill of quantities, steel, cement & masonry budget estimation with itemized pricing.',
    icon: 'Calculator',
    isActive: true,
    subcategories: [
      { id: 'sub-boq-1', name: 'Detailed Bill of Quantities (BOQ) & Estimate', slug: 'boq-material-estimation', description: 'Steel bar bending schedule, cement bag count, brick/block quantities.', isActive: true },
    ],
  },
  {
    slug: 'other-custom-service',
    name: 'Other Custom Service',
    shortDescription: 'Bespoke structural, engineering, landscape or specialty construction requirements.',
    icon: 'Layers',
    isActive: true,
    subcategories: [
      { id: 'sub-custom-1', name: 'Landscape & Exterior Hardscaping', slug: 'landscape-hardscaping', description: 'Garden layout, boundary wall, driveway pavers, and exterior lighting.', isActive: true },
    ],
  },
];

export const getPlatformCategories = (): PlatformCategoryItem[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Guarantee subcategories are present for all categories
        let hasBackfilled = false;
        const normalized = parsed.map((cat: PlatformCategoryItem) => {
          const defaultCat = DEFAULT_PLATFORM_CATEGORIES.find((d) => d.slug === cat.slug);
          if ((!cat.subcategories || cat.subcategories.length === 0) && defaultCat && defaultCat.subcategories) {
            hasBackfilled = true;
            return { ...cat, subcategories: defaultCat.subcategories };
          }
          return {
            ...cat,
            subcategories: cat.subcategories || (defaultCat?.subcategories || []),
          };
        });

        if (hasBackfilled) {
          try {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(normalized));
          } catch (e) {}
        }
        return normalized;
      }
    }
  } catch (e) {}

  return DEFAULT_PLATFORM_CATEGORIES;
};

export const savePlatformCategory = (cat: PlatformCategoryItem): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const existingIndex = current.findIndex((c) => c.slug === cat.slug);
  let updated: PlatformCategoryItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = {
      ...current[existingIndex],
      ...cat,
      subcategories: cat.subcategories || current[existingIndex].subcategories || [],
    };
  } else {
    updated = [...current, { ...cat, subcategories: cat.subcategories || [] }];
  }
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED', cat);
  } catch (e) {}
  return updated;
};

export const updatePlatformCategory = (
  originalSlug: string,
  updatedData: PlatformCategoryItem
): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const existingIndex = current.findIndex((c) => c.slug === originalSlug);
  let updated: PlatformCategoryItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = {
      ...current[existingIndex],
      ...updatedData,
      subcategories: updatedData.subcategories || current[existingIndex].subcategories || [],
    };
  } else {
    const altIndex = current.findIndex((c) => c.slug === updatedData.slug);
    if (altIndex >= 0) {
      updated = [...current];
      updated[altIndex] = {
        ...current[altIndex],
        ...updatedData,
        subcategories: updatedData.subcategories || current[altIndex].subcategories || [],
      };
    } else {
      updated = [...current, { ...updatedData, subcategories: updatedData.subcategories || [] }];
    }
  }
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED', updatedData);
  } catch (e) {}
  return updated;
};

export const deletePlatformCategory = (slug: string): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const updated = current.filter((c) => c.slug !== slug);
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED');
  } catch (e) {}
  return updated;
};

export const togglePlatformCategoryStatus = (slug: string): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const updated = current.map((c) => (c.slug === slug ? { ...c, isActive: !c.isActive } : c));
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED');
  } catch (e) {}
  return updated;
};

// ==============================================================================
// SUBCATEGORY MANAGEMENT HELPERS
// ==============================================================================
export const addPlatformSubCategory = (
  categorySlug: string,
  subcat: { name: string; description?: string; isActive?: boolean }
): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const catIdx = current.findIndex((c) => c.slug === categorySlug);
  if (catIdx === -1) return current;

  const targetCat = current[catIdx];
  const subSlug = subcat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newSub: PlatformSubCategoryItem = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: subcat.name.trim(),
    slug: subSlug || `sub-${Date.now()}`,
    description: subcat.description?.trim() || '',
    isActive: subcat.isActive ?? true,
  };

  const updatedSubcategories = [...(targetCat.subcategories || []), newSub];
  const updatedCategories = [...current];
  updatedCategories[catIdx] = {
    ...targetCat,
    subcategories: updatedSubcategories,
  };

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    broadcastStoreUpdate('CATEGORIES_UPDATED', updatedCategories[catIdx]);
  } catch (e) {}
  return updatedCategories;
};

export const updatePlatformSubCategory = (
  categorySlug: string,
  subcat: PlatformSubCategoryItem
): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const catIdx = current.findIndex((c) => c.slug === categorySlug);
  if (catIdx === -1) return current;

  const targetCat = current[catIdx];
  const updatedSubcategories = (targetCat.subcategories || []).map((s) =>
    s.id === subcat.id ? subcat : s
  );

  const updatedCategories = [...current];
  updatedCategories[catIdx] = {
    ...targetCat,
    subcategories: updatedSubcategories,
  };

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    broadcastStoreUpdate('CATEGORIES_UPDATED', updatedCategories[catIdx]);
  } catch (e) {}
  return updatedCategories;
};

export const deletePlatformSubCategory = (
  categorySlug: string,
  subcatId: string
): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const catIdx = current.findIndex((c) => c.slug === categorySlug);
  if (catIdx === -1) return current;

  const targetCat = current[catIdx];
  const updatedSubcategories = (targetCat.subcategories || []).filter((s) => s.id !== subcatId);

  const updatedCategories = [...current];
  updatedCategories[catIdx] = {
    ...targetCat,
    subcategories: updatedSubcategories,
  };

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    broadcastStoreUpdate('CATEGORIES_UPDATED', updatedCategories[catIdx]);
  } catch (e) {}
  return updatedCategories;
};

export const togglePlatformSubCategoryStatus = (
  categorySlug: string,
  subcatId: string
): PlatformCategoryItem[] => {
  const current = getPlatformCategories();
  const catIdx = current.findIndex((c) => c.slug === categorySlug);
  if (catIdx === -1) return current;

  const targetCat = current[catIdx];
  const updatedSubcategories = (targetCat.subcategories || []).map((s) =>
    s.id === subcatId ? { ...s, isActive: !s.isActive } : s
  );

  const updatedCategories = [...current];
  updatedCategories[catIdx] = {
    ...targetCat,
    subcategories: updatedSubcategories,
  };

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
    broadcastStoreUpdate('CATEGORIES_UPDATED', updatedCategories[catIdx]);
  } catch (e) {}
  return updatedCategories;
};

export const getAllActivePlatformServices = (): string[] => {
  const categories = getPlatformCategories().filter((c) => c.isActive !== false);
  const serviceSet = new Set<string>();

  categories.forEach((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories
        .filter((sub) => sub.isActive !== false)
        .forEach((sub) => serviceSet.add(sub.name));
    } else {
      serviceSet.add(cat.name);
    }
  });

  return Array.from(serviceSet);
};

