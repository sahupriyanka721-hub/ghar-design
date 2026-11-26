import {
  RegisteredVendor,
  VendorProduct,
  VendorMaterialQuotation,
  VendorCommissionPayout,
  MaterialOrder,
  VendorApplicationStatus,
  ConstructionMeasurementUnit,
  VendorDocumentItem,
  VendorBankDetails,
  VendorDeliverySettings,
  VendorBusinessOperations,
  VendorProductVariant,
  VendorCategoryRequest,
  VendorBrandItem,
  InventoryMovementRecord,
  BulkyTransitDetails,
  VendorSubOrder,
  VendorTaxInvoice,
  VendorSettlementRecord,
  VendorPromotionRule,
  VendorSupportTicket,
  VendorCustomerQuery,
  VendorProductReview,
  VendorNotification,
} from '@ghar-design/shared';
import { syncChannel, broadcastStoreUpdate, registerNewCustomer } from './customerStore.js';

// ==============================================================================
// 1. REGISTERED VENDORS STORE
// ==============================================================================
const VENDORS_STORAGE_KEY = 'platform_registered_vendors';

export const getRegisteredVendors = (): RegisteredVendor[] => {
  try {
    const data = localStorage.getItem(VENDORS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (v) =>
            v.id !== 'vnd-demo' &&
            !v.businessName?.toLowerCase().includes('demo') &&
            !v.ownerName?.toLowerCase().includes('vikram')
        );
      }
    }
  } catch (e) {
    console.error('Error reading registered vendors', e);
  }
  return [];
};

export const getVendorByPhone = (phone: string): RegisteredVendor | undefined => {
  const current = getRegisteredVendors();
  const rawTarget = (phone || '').replace(/\D/g, '').slice(-10);
  if (!rawTarget) return undefined;
  return current.find((v) => {
    const vPhone = (v.phone || '').replace(/\D/g, '').slice(-10);
    return vPhone === rawTarget;
  });
};

export const getVendorById = (id: string): RegisteredVendor | undefined => {
  const current = getRegisteredVendors();
  return current.find((v) => v.id === id);
};

export const saveRegisteredVendor = (vendorData: Partial<RegisteredVendor>): RegisteredVendor => {
  const current = getRegisteredVendors();
  const rawPhone = (vendorData.phone || '').replace(/\D/g, '').slice(-10);
  const existingIndex = current.findIndex((v) => {
    const vPhone = (v.phone || '').replace(/\D/g, '').slice(-10);
    return (rawPhone && vPhone === rawPhone) || v.id === vendorData.id;
  });

  const formattedPhone = vendorData.phone?.startsWith('+91')
    ? vendorData.phone
    : (rawPhone ? `+91 ${rawPhone}` : '');

  const newVendor: RegisteredVendor = {
    id: vendorData.id || `vnd-${Date.now()}`,
    businessName: vendorData.businessName || '',
    ownerName: vendorData.ownerName || '',
    phone: formattedPhone,
    email: vendorData.email || '',
    gstin: vendorData.gstin || '',
    panNumber: vendorData.panNumber || '',
    businessCategory: vendorData.businessCategory || '',
    warehouseAddress: vendorData.warehouseAddress || '',
    city: vendorData.city || '',
    state: vendorData.state || '',
    pinCode: vendorData.pinCode || '',
    bankDetails: vendorData.bankDetails || {
      accountHolder: vendorData.ownerName || '',
      accountNumber: '',
      ifsc: '',
      upiId: '',
    },
    // New vendors strictly start in PENDING_APPROVAL for Admin vetting
    status: vendorData.status || 'PENDING_APPROVAL',
    commissionRatePercent: vendorData.commissionRatePercent ?? 5,
    registeredAt: vendorData.registeredAt || new Date().toISOString(),
    approvedAt: vendorData.approvedAt,
  };

  let updatedList: RegisteredVendor[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...newVendor };
  } else {
    updatedList = [newVendor, ...current];
  }

  try {
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(updatedList));
    broadcastStoreUpdate('VENDORS_UPDATED', newVendor);
  } catch (e) {
    console.error('Error saving vendor to localStorage', e);
  }

  return newVendor;
};

export const updateVendorStatus = (
  id: string,
  newStatus: RegisteredVendor['status'],
  rejectionReason?: string
): RegisteredVendor[] => {
  const current = getRegisteredVendors();
  const updated = current.map((v) => {
    if (v.id === id) {
      return {
        ...v,
        status: newStatus,
        approvedAt: newStatus === 'APPROVED' ? new Date().toISOString() : v.approvedAt,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined,
      };
    }
    return v;
  });

  try {
    localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDORS_UPDATED', { id, status: newStatus });
  } catch (e) {
    console.error('Error updating vendor status', e);
  }

  return updated;
};

// ==============================================================================
// 2. VENDOR PRODUCTS STORE (CATALOG, PRICE, STOCK & ADMIN APPROVALS)
// ==============================================================================
const VENDOR_PRODUCTS_KEY = 'platform_vendor_products';

export const getVendorProducts = (vendorId?: string): VendorProduct[] => {
  try {
    const data = localStorage.getItem(VENDOR_PRODUCTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (vendorId) {
          return parsed.filter((p) => p.vendorId === vendorId);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading vendor products', e);
  }
  return [];
};

export const saveVendorProduct = (product: Partial<VendorProduct>): VendorProduct => {
  const current = getVendorProducts();
  const existingIndex = current.findIndex((p) => p.id === product.id);

  const newProd: VendorProduct = {
    id: product.id || `vprod-${Date.now()}`,
    vendorId: product.vendorId || 'vnd-default',
    vendorName: product.vendorName || 'Building Depot',
    vendorPhone: product.vendorPhone || '',
    name: product.name || 'Construction Material Item',
    sku: product.sku || `SKU-MAT-${Math.floor(1000 + Math.random() * 9000)}`,
    brand: product.brand || 'Verified Brand',
    category: product.category || 'cement',
    specifications: product.specifications || 'Standard IS compliant material',
    unit: product.unit || 'Bag',
    pricePaise: product.pricePaise || 40000,
    marketPricePaise: product.marketPricePaise || Math.round((product.pricePaise || 40000) * 1.1),
    stockQuantity: Number(product.stockQuantity) || 0,
    inStock: (Number(product.stockQuantity) || 0) > 0,
    minOrderQuantity: product.minOrderQuantity || 1,
    deliveryDays: Number(product.deliveryDays) || 2,
    imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    // New products registered by vendor strictly require Admin Approval!
    approvalStatus: product.approvalStatus || 'PENDING_APPROVAL',
    adminNotes: product.adminNotes || '',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let updated: VendorProduct[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...newProd };
  } else {
    updated = [newProd, ...current];
  }

  try {
    localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDOR_PRODUCTS_UPDATED', newProd);
  } catch (e) {
    console.error('Error saving vendor product', e);
  }

  return newProd;
};

export const updateVendorProductApproval = (
  id: string,
  approvalStatus: 'APPROVED' | 'REJECTED',
  adminNotes?: string
): VendorProduct[] => {
  const current = getVendorProducts();
  const updated = current.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        approvalStatus,
        adminNotes: adminNotes || (approvalStatus === 'APPROVED' ? 'Approved by Admin for Marketplace' : 'Rejected'),
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  try {
    localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDOR_PRODUCTS_UPDATED', { id, approvalStatus });
  } catch (e) {
    console.error('Error updating vendor product approval', e);
  }

  return updated;
};

export const updateVendorProductStockAndPrice = (
  id: string,
  stockQuantity: number,
  pricePaise?: number
): VendorProduct | undefined => {
  const current = getVendorProducts();
  let updatedItem: VendorProduct | undefined;

  const updated = current.map((p) => {
    if (p.id === id) {
      updatedItem = {
        ...p,
        stockQuantity,
        inStock: stockQuantity > 0,
        pricePaise: pricePaise !== undefined ? pricePaise : p.pricePaise,
        updatedAt: new Date().toISOString(),
      };
      return updatedItem;
    }
    return p;
  });

  try {
    localStorage.setItem(VENDOR_PRODUCTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDOR_PRODUCTS_UPDATED', updatedItem);
  } catch (e) {
    console.error('Error updating vendor product stock/price', e);
  }

  return updatedItem;
};

export const getApprovedVendorProductsForStore = (): VendorProduct[] => {
  const all = getVendorProducts();
  return all.filter((p) => p.approvalStatus === 'APPROVED');
};

// ==============================================================================
// 3. VENDOR CUSTOMER ORDERS & DELIVERY TRACKING
// ==============================================================================
export const getVendorOrders = (vendorPhoneOrId?: string): any[] => {
  try {
    const ordersJson = localStorage.getItem('material_orders');
    if (!ordersJson) return [];
    const orders = JSON.parse(ordersJson);
    if (!Array.isArray(orders)) return [];

    // Filter out dummy test orders
    const validOrders = orders.filter(
      (o: any) =>
        o.orderCode !== 'GHR-ORD-2026-9042' &&
        o.orderCode !== 'GHR-ORD-2026-8812' &&
        o.customerId !== 'usr-cust-1' &&
        !o.customerName?.toLowerCase().includes('vikram') &&
        !o.customerPhone?.includes('9876543220')
    );

    if (!vendorPhoneOrId) return validOrders;

    const rawTarget = vendorPhoneOrId.replace(/\D/g, '').slice(-10);

    return validOrders.filter((o: any) => {
      // If vendorId is tagged directly
      if (o.vendorId === vendorPhoneOrId) return true;
      // If vendorPhone matches
      if (rawTarget && o.vendorPhone && o.vendorPhone.replace(/\D/g, '').slice(-10) === rawTarget) {
        return true;
      }
      // If order is unassigned, it is available to the approved vendor depot
      return true;
    });
  } catch (e) {
    console.error('Error reading vendor orders', e);
    return [];
  }
};

export const updateVendorOrderStatus = (
  orderId: string,
  newFulfillmentStatus: string,
  trackingNumber?: string,
  note?: string
): any => {
  try {
    const ordersJson = localStorage.getItem('material_orders');
    if (!ordersJson) return null;
    const orders = JSON.parse(ordersJson);
    let updatedOrder: any = null;

    const updated = orders.map((o: any) => {
      if (o.id === orderId || o.orderCode === orderId) {
        const currentSteps = o.trackingSteps || [];
        const updatedSteps = [...currentSteps];

        if (newFulfillmentStatus === 'PROCESSING') {
          if (updatedSteps[1]) updatedSteps[1].completed = true;
        } else if (newFulfillmentStatus === 'DISPATCHED') {
          if (updatedSteps[1]) updatedSteps[1].completed = true;
          if (updatedSteps[2]) updatedSteps[2].completed = true;
          if (updatedSteps[3]) {
            updatedSteps[3].completed = true;
            updatedSteps[3].date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          }
        } else if (newFulfillmentStatus === 'DELIVERED') {
          updatedSteps.forEach((st: any) => (st.completed = true));
        }

        updatedOrder = {
          ...o,
          fulfillmentStatus: newFulfillmentStatus,
          trackingNumber: trackingNumber || o.trackingNumber,
          vendorDispatchNote: note || o.vendorDispatchNote,
          trackingSteps: updatedSteps,
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });

    localStorage.setItem('material_orders', JSON.stringify(updated));
    broadcastStoreUpdate('ORDERS_UPDATED', updatedOrder);
    return updatedOrder;
  } catch (e) {
    console.error('Error updating vendor order status', e);
    return null;
  }
};

// ==============================================================================
// 4. MATERIAL REQUESTS & VENDOR QUOTATIONS (Multi-Vendor Competitive Bidding)
// ==============================================================================
const MATERIAL_REQUESTS_KEY = 'platform_material_requests';
const VENDOR_QUOTATIONS_KEY = 'platform_vendor_quotations';

export interface MaterialRequestItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface VendorMaterialRequest {
  id: string;
  requestCode: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  materialItem: string;
  requiredQuantity: number;
  unit: string;
  deliverySiteAddress: string;
  city: string;
  state: string;
  pinCode?: string;
  builtUpAreaSqFt?: number;
  items?: MaterialRequestItem[];
  requiredByDate: string;
  notes?: string;
  status: 'OPEN' | 'QUOTED' | 'CONFIRMED' | 'ASSIGNED' | 'FULFILLED' | 'CANCELLED';
  selectedQuotationId?: string;
  selectedVendorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VendorQuoteItemPrice {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  brandOffered?: string;
  ratePerUnit: number;
  totalAmount: number;
}

export interface VendorMaterialQuotation {
  id: string;
  quotationCode: string;
  vendorId: string;
  vendorName: string;
  vendorBusinessName?: string;
  vendorPhone: string;
  vendorCity?: string;
  vendorRating?: number;
  requestId: string;
  requestCode?: string;
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  materialItem: string;
  quantity: number;
  unit: string;
  itemPrices?: VendorQuoteItemPrice[];
  materialSubtotal?: number;
  freightDeliveryCharge?: number;
  gstAmount?: number;
  grandTotal?: number;
  quotedUnitPricePaise: number;
  quotedTotalPaise: number;
  deliveryDays: number;
  vehicleTypeOffered?: string;
  deliveryTerms: string;
  status: 'SUBMITTED_TO_ADMIN' | 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'CONFIRMED';
  adminFeedback?: string;
  createdAt: string;
}

export const getVendorMaterialRequests = (): VendorMaterialRequest[] => {
  try {
    const data = localStorage.getItem(MATERIAL_REQUESTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r) =>
            !r.customerName?.toLowerCase().includes('vikram') &&
            !r.customerPhone?.includes('9876543220')
        );
      }
    }
  } catch (e) {}
  return [];
};

export const getVendorMaterialRequestsForCustomer = (phoneOrId?: string): VendorMaterialRequest[] => {
  const all = getVendorMaterialRequests();
  if (!phoneOrId) return all;
  const rawTarget = phoneOrId.replace(/\D/g, '').slice(-10);
  return all.filter((r) => {
    const rPhone = (r.customerPhone || '').replace(/\D/g, '').slice(-10);
    return (rawTarget && rPhone === rawTarget) || r.customerId === phoneOrId;
  });
};

export const getQuotationsForRequest = (requestId: string): VendorMaterialQuotation[] => {
  const all = getVendorQuotations();
  return all.filter((q) => q.requestId === requestId);
};

export const saveVendorMaterialRequest = (req: Partial<VendorMaterialRequest>): VendorMaterialRequest => {
  const current = getVendorMaterialRequests();
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);

  const newReq: VendorMaterialRequest = {
    id: req.id || `matreq-${Date.now()}`,
    requestCode: req.requestCode || `GHR-MATREQ-${year}-${random}`,
    customerId: req.customerId,
    customerName: req.customerName || 'Registered Homeowner',
    customerPhone: req.customerPhone || '',
    customerEmail: req.customerEmail || '',
    materialItem: req.materialItem || 'Complete House Civil Material Package',
    requiredQuantity: Number(req.requiredQuantity) || 1,
    unit: req.unit || 'Package',
    deliverySiteAddress: req.deliverySiteAddress || 'Site Address',
    city: req.city || 'Bhopal',
    state: req.state || 'Madhya Pradesh',
    pinCode: req.pinCode || '',
    builtUpAreaSqFt: req.builtUpAreaSqFt,
    items: req.items || [],
    requiredByDate: req.requiredByDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    notes: req.notes || '',
    status: req.status || 'OPEN',
    createdAt: req.createdAt || new Date().toISOString(),
  };

  const updated = [newReq, ...current.filter((r) => r.id !== newReq.id)];
  try {
    localStorage.setItem(MATERIAL_REQUESTS_KEY, JSON.stringify(updated));
    if (newReq.customerPhone) {
      registerNewCustomer({
        id: newReq.customerId,
        name: newReq.customerName,
        phone: newReq.customerPhone,
        email: newReq.customerEmail || 'Not Provided',
        housePlotNumber: newReq.deliverySiteAddress?.split(',')[0] || 'Site Address',
        streetLocality: newReq.deliverySiteAddress || 'Site Delivery Area',
        city: newReq.city || 'Bhopal',
        state: newReq.state || 'Madhya Pradesh',
        pinCode: newReq.pinCode || '462001',
        requestsCount: 1,
      });
    }
    broadcastStoreUpdate('MATERIAL_REQUESTS_UPDATED', newReq);
  } catch (e) {}
  return newReq;
};

export const getVendorQuotations = (vendorId?: string): VendorMaterialQuotation[] => {
  try {
    const data = localStorage.getItem(VENDOR_QUOTATIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (vendorId) {
          return parsed.filter((q) => q.vendorId === vendorId);
        }
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const saveVendorQuotation = (quote: Partial<VendorMaterialQuotation>): VendorMaterialQuotation => {
  const current = getVendorQuotations();
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);

  const grandTotal = quote.grandTotal || (quote.quotedTotalPaise ? quote.quotedTotalPaise / 100 : 0);

  const newQuote: VendorMaterialQuotation = {
    id: quote.id || `vquote-${Date.now()}`,
    quotationCode: quote.quotationCode || `VQT-${year}-${random}`,
    vendorId: quote.vendorId || 'vnd-default',
    vendorName: quote.vendorName || quote.vendorBusinessName || 'Building Depot',
    vendorBusinessName: quote.vendorBusinessName || quote.vendorName || 'Building Depot',
    vendorPhone: quote.vendorPhone || '',
    vendorCity: quote.vendorCity || '',
    vendorRating: quote.vendorRating || 4.8,
    requestId: quote.requestId || '',
    requestCode: quote.requestCode || '',
    customerName: quote.customerName || 'Registered Homeowner',
    customerPhone: quote.customerPhone || '',
    deliveryLocation: quote.deliveryLocation || 'Project Site',
    materialItem: quote.materialItem || 'Bulk Material Package',
    quantity: Number(quote.quantity) || 1,
    unit: quote.unit || 'Package',
    itemPrices: quote.itemPrices || [],
    materialSubtotal: quote.materialSubtotal || grandTotal,
    freightDeliveryCharge: quote.freightDeliveryCharge || 0,
    gstAmount: quote.gstAmount || 0,
    grandTotal: grandTotal,
    quotedUnitPricePaise: Number(quote.quotedUnitPricePaise) || Math.round(grandTotal * 100),
    quotedTotalPaise: Number(quote.quotedTotalPaise) || Math.round(grandTotal * 100),
    deliveryDays: Number(quote.deliveryDays) || 2,
    vehicleTypeOffered: quote.vehicleTypeOffered || 'Dedicated Commercial Truck',
    deliveryTerms: quote.deliveryTerms || 'Free offloading at site boundary. GST invoice included.',
    status: quote.status || 'APPROVED',
    adminFeedback: quote.adminFeedback || '',
    createdAt: quote.createdAt || new Date().toISOString(),
  };

  const updated = [newQuote, ...current.filter((q) => q.id !== newQuote.id)];
  try {
    localStorage.setItem(VENDOR_QUOTATIONS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDOR_QUOTATIONS_UPDATED', newQuote);
  } catch (e) {}
  return newQuote;
};

export const acceptVendorMaterialQuotation = (quotationId: string, requestId: string): void => {
  const allQuotes = getVendorQuotations();
  const selectedQuote = allQuotes.find((q) => q.id === quotationId);

  // 1. Mark selected quote as ACCEPTED, others for this request as REJECTED
  const updatedQuotes = allQuotes.map((q) => {
    if (q.id === quotationId) {
      return { ...q, status: 'ACCEPTED' as const };
    }
    if (q.requestId === requestId && q.id !== quotationId) {
      return { ...q, status: 'REJECTED' as const };
    }
    return q;
  });
  localStorage.setItem(VENDOR_QUOTATIONS_KEY, JSON.stringify(updatedQuotes));

  // 2. Mark request as CONFIRMED
  const allReqs = getVendorMaterialRequests();
  const updatedReqs = allReqs.map((r) => {
    if (r.id === requestId) {
      return {
        ...r,
        status: 'CONFIRMED' as const,
        selectedQuotationId: quotationId,
        selectedVendorName: selectedQuote?.vendorBusinessName || selectedQuote?.vendorName || 'Selected Vendor Depot',
        updatedAt: new Date().toISOString(),
      };
    }
    return r;
  });
  localStorage.setItem(MATERIAL_REQUESTS_KEY, JSON.stringify(updatedReqs));

  // 3. Create a real MaterialOrder record in localStorage so it appears in Customer Purchases, Admin Orders, and Vendor Orders
  try {
    const ordersRaw = localStorage.getItem('material_orders');
    const existingOrders = ordersRaw ? JSON.parse(ordersRaw) : [];
    const grandTotalPaise = selectedQuote?.grandTotal 
      ? Math.round(selectedQuote.grandTotal * 100)
      : (selectedQuote?.quotedTotalPaise || 2500000);

    const targetReq = allReqs.find((r) => r.id === requestId);
    const newOrder = {
      id: `ord-matbidding-${Date.now()}`,
      orderCode: `ORD-BOQ-${Date.now().toString().slice(-6)}`,
      customerId: targetReq?.customerId || 'cust-direct',
      customerName: selectedQuote?.customerName || targetReq?.customerName || 'Customer',
      customerPhone: selectedQuote?.customerPhone || targetReq?.customerPhone || '',
      customerEmail: targetReq?.customerEmail || '',
      items: (selectedQuote?.itemPrices && selectedQuote.itemPrices.length > 0)
        ? (selectedQuote.itemPrices || []).map((ip) => ({
            productId: ip.itemId || `prod-${ip.itemName}`,
            name: `${ip.itemName} (${ip.brandOffered || 'Standard Grade'})`,
            brand: ip.brandOffered || 'Wholesale Depot',
            quantity: ip.quantity,
            unit: ip.unit,
            unitPricePaise: Math.round(ip.ratePerUnit * 100),
            totalPaise: Math.round(ip.totalAmount * 100),
          }))
        : [{
            productId: 'prod-bulk-boq',
            name: targetReq?.materialItem || 'Bulk Civil Material Package',
            brand: selectedQuote?.vendorName || 'Wholesale Depot',
            quantity: 1,
            unit: 'Package',
            unitPricePaise: grandTotalPaise,
            totalPaise: grandTotalPaise,
          }],
      subtotalPaise: Math.round((selectedQuote?.materialSubtotal || (grandTotalPaise / 100)) * 100),
      deliveryFeePaise: Math.round((selectedQuote?.freightDeliveryCharge || 0) * 100),
      taxPaise: Math.round((selectedQuote?.gstAmount || 0) * 100),
      totalAmountPaise: grandTotalPaise,
      deliveryAddress: {
        houseNo: targetReq?.deliverySiteAddress || 'Site Location',
        street: targetReq?.city || 'Delivery City',
        city: targetReq?.city || 'Delivery City',
        state: targetReq?.state || 'State',
        pinCode: targetReq?.pinCode || '',
        phone: targetReq?.customerPhone || '',
        customerName: targetReq?.customerName || '',
      },
      vendorId: selectedQuote?.vendorId || 'vnd-default',
      vendorName: selectedQuote?.vendorBusinessName || selectedQuote?.vendorName || 'Building Depot',
      paymentMethod: 'ONLINE_ESCROW',
      paymentStatus: 'PAYMENT_SUCCESSFUL',
      fulfillmentStatus: 'CONFIRMED',
      associatedProject: targetReq?.requestCode || 'Bulk Material Procurement',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 86400000 * (selectedQuote?.deliveryDays || 2)).toISOString(),
      trackingSteps: [
        { status: 'Order Confirmed with Vendor', date: 'Just now', completed: true },
        { status: 'Loading at Wholesale Depot', date: 'Pending', completed: false },
        { status: 'Out for Site Delivery (Hydraulic Crane)', date: 'Pending', completed: false },
        { status: 'Delivered & Unloaded at Site', date: 'Pending', completed: false },
      ],
    };

    localStorage.setItem('material_orders', JSON.stringify([newOrder, ...existingOrders]));
    broadcastStoreUpdate('ORDERS_UPDATED', newOrder);
  } catch (err) {
    console.error('Error creating confirmed order from quotation', err);
  }

  broadcastStoreUpdate('MATERIAL_QUOTATION_ACCEPTED', { quotationId, requestId });
};

export const updateVendorQuotationStatus = (
  id: string,
  newStatus: VendorMaterialQuotation['status'],
  adminFeedback?: string
): VendorMaterialQuotation[] => {
  const current = getVendorQuotations();
  const updated = current.map((q) => {
    if (q.id === id) {
      return {
        ...q,
        status: newStatus,
        adminFeedback: adminFeedback || q.adminFeedback,
      };
    }
    return q;
  });

  try {
    localStorage.setItem(VENDOR_QUOTATIONS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('VENDOR_QUOTATIONS_UPDATED', { id, status: newStatus });
  } catch (e) {}
  return updated;
};

// ==============================================================================
// 5. VENDOR PAYMENTS & COMMISSION SETTLEMENTS
// ==============================================================================
const VENDOR_PAYOUTS_KEY = 'platform_vendor_payouts';

export const getVendorPayouts = (vendorId?: string): VendorCommissionPayout[] => {
  try {
    const data = localStorage.getItem(VENDOR_PAYOUTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (vendorId) {
          return parsed.filter((p) => p.vendorId === vendorId);
        }
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const createVendorPayoutSettlement = (
  vendorId: string,
  vendorName: string,
  orderIds: string[],
  grossSalesPaise: number,
  commissionRatePercent = 5
): VendorCommissionPayout => {
  const current = getVendorPayouts();
  const commissionAmountPaise = Math.round((grossSalesPaise * commissionRatePercent) / 100);
  const netPayoutPaise = grossSalesPaise - commissionAmountPaise;

  const newPayout: VendorCommissionPayout = {
    id: `pay-${Date.now()}`,
    payoutCode: `VPAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    vendorId,
    vendorName,
    orderIds,
    grossSalesPaise,
    commissionRatePercent,
    commissionAmountPaise,
    netPayoutPaise,
    status: 'PENDING_SETTLEMENT',
    createdAt: new Date().toISOString(),
  };

  const updated = [newPayout, ...current];
  try {
    localStorage.setItem(VENDOR_PAYOUTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('PAYOUTS_UPDATED', newPayout);
  } catch (e) {}
  return newPayout;
};

export const settleVendorPayout = (
  payoutId: string,
  transactionRef: string
): VendorCommissionPayout[] => {
  const current = getVendorPayouts();
  const updated = current.map((p) => {
    if (p.id === payoutId) {
      return {
        ...p,
        status: 'SETTLED' as const,
        settledAt: new Date().toISOString(),
        transactionRef,
      };
    }
    return p;
  });

  try {
    localStorage.setItem(VENDOR_PAYOUTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('PAYOUTS_UPDATED', { payoutId, status: 'SETTLED' });
  } catch (e) {}
  return updated;
};


// ==============================================================================
// 6. CATEGORIES & BRANDS STORE
// ==============================================================================
const CATEGORY_REQUESTS_KEY = 'platform_vendor_category_requests';
const BRANDS_KEY = 'platform_vendor_brands';

export const INITIAL_MARKETPLACE_BRANDS: VendorBrandItem[] = [
  { id: 'br-ultratech', name: 'UltraTech Cement', categories: ['Cement & Concrete'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-tatatiscon', name: 'Tata Tiscon', categories: ['TMT Steel & Iron'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-jindal', name: 'Jindal Panther', categories: ['TMT Steel & Iron'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-acc', name: 'ACC Cement', categories: ['Cement & Concrete'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-ambuja', name: 'Ambuja Cement', categories: ['Cement & Concrete'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-kajaria', name: 'Kajaria Ceramics', categories: ['Tiles & Flooring'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-somany', name: 'Somany Ceramics', categories: ['Tiles & Flooring'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-asianpaints', name: 'Asian Paints', categories: ['Paints & Finishes'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-berger', name: 'Berger Paints', categories: ['Paints & Finishes'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-havells', name: 'Havells', categories: ['Electrical & Wiring'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-polycab', name: 'Polycab', categories: ['Electrical & Wiring'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-astral', name: 'Astral Pipes', categories: ['Plumbing & Pipes'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-supreme', name: 'Supreme Industries', categories: ['Plumbing & Pipes'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-jaquar', name: 'Jaquar', categories: ['Bath Fittings & Sanitaryware'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-hindware', name: 'Hindware', categories: ['Bath Fittings & Sanitaryware'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-drfixit', name: 'Dr. Fixit (Pidilite)', categories: ['Waterproofing & Chemicals'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-fosroc', name: 'Fosroc Chemicals', categories: ['Waterproofing & Chemicals'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-century', name: 'Century Ply', categories: ['Timber & Plywood'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-greenply', name: 'Greenply', categories: ['Timber & Plywood'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
  { id: 'br-godrej', name: 'Godrej Locks & Hardware', categories: ['Hardware & Fasteners'], isVerified: true, status: 'ACTIVE', createdAt: '2026-01-01' },
];

export const getVendorBrands = (vendorId?: string): VendorBrandItem[] => {
  try {
    const raw = localStorage.getItem(BRANDS_KEY);
    const stored: VendorBrandItem[] = raw ? JSON.parse(raw) : INITIAL_MARKETPLACE_BRANDS;
    if (vendorId) {
      return stored.filter((b) => b.status === 'ACTIVE' || b.requestedByVendorId === vendorId);
    }
    return stored;
  } catch {
    return INITIAL_MARKETPLACE_BRANDS;
  }
};

export const submitVendorBrandRequest = (brandData: Partial<VendorBrandItem>): VendorBrandItem => {
  const current = getVendorBrands();
  const newBrand: VendorBrandItem = {
    id: `br-${Date.now()}`,
    name: brandData.name || 'New Brand',
    logoUrl: brandData.logoUrl,
    categories: brandData.categories || ['Building Materials'],
    isVerified: false,
    isCustomRequest: true,
    status: 'PENDING_APPROVAL',
    requestedByVendorId: brandData.requestedByVendorId,
    createdAt: new Date().toISOString(),
  };
  const updated = [newBrand, ...current];
  try {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('BRANDS_UPDATED', newBrand);
  } catch {}
  return newBrand;
};

export const updateVendorBrandStatus = (brandId: string, status: 'ACTIVE' | 'REJECTED'): VendorBrandItem[] => {
  const current = getVendorBrands();
  const updated = current.map((b) => (b.id === brandId ? { ...b, status, isVerified: status === 'ACTIVE' } : b));
  try {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('BRANDS_UPDATED', { brandId, status });
  } catch {}
  return updated;
};

export const getVendorCategoryRequests = (vendorId?: string): VendorCategoryRequest[] => {
  try {
    const raw = localStorage.getItem(CATEGORY_REQUESTS_KEY);
    const list: VendorCategoryRequest[] = raw ? JSON.parse(raw) : [];
    if (vendorId) {
      return list.filter((r) => r.vendorId === vendorId);
    }
    return list;
  } catch {
    return [];
  }
};

export const submitVendorCategoryRequest = (req: Partial<VendorCategoryRequest>): VendorCategoryRequest => {
  const current = getVendorCategoryRequests();
  const newReq: VendorCategoryRequest = {
    id: `catreq-${Date.now()}`,
    vendorId: req.vendorId || '',
    vendorName: req.vendorName || '',
    type: req.type || 'CATEGORY',
    parentCategoryName: req.parentCategoryName,
    requestedName: req.requestedName || '',
    description: req.description || '',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  const updated = [newReq, ...current];
  try {
    localStorage.setItem(CATEGORY_REQUESTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED', newReq);
  } catch {}
  return newReq;
};

export const updateVendorCategoryRequestStatus = (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  feedback?: string
): VendorCategoryRequest[] => {
  const current = getVendorCategoryRequests();
  const updated = current.map((r) => (r.id === id ? { ...r, status, adminFeedback: feedback } : r));
  try {
    localStorage.setItem(CATEGORY_REQUESTS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('CATEGORIES_UPDATED', { id, status });
  } catch {}
  return updated;
};

// ==============================================================================
// 7. INVENTORY MANAGEMENT & STOCK MOVEMENT LEDGER
// ==============================================================================
const INVENTORY_MOVEMENTS_KEY = 'platform_inventory_movements';

export const getInventoryMovements = (vendorId: string, productId?: string): InventoryMovementRecord[] => {
  try {
    const raw = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
    const list: InventoryMovementRecord[] = raw ? JSON.parse(raw) : [];
    return list.filter((m) => m.vendorId === vendorId && (!productId || m.productId === productId));
  } catch {
    return [];
  }
};

export const recordInventoryMovement = (record: Partial<InventoryMovementRecord>): InventoryMovementRecord => {
  const raw = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
  const current: InventoryMovementRecord[] = raw ? JSON.parse(raw) : [];

  const newRec: InventoryMovementRecord = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    vendorId: record.vendorId || '',
    productId: record.productId || '',
    productName: record.productName || '',
    sku: record.sku || '',
    movementType: record.movementType || 'ADJUSTMENT',
    reason: record.reason || 'MANUAL_OVERRIDE',
    quantityChange: record.quantityChange || 0,
    previousStock: record.previousStock || 0,
    resultingStock: record.resultingStock || 0,
    referenceOrderId: record.referenceOrderId,
    notes: record.notes,
    createdBy: record.createdBy || 'Vendor Depot Manager',
    createdAt: new Date().toISOString(),
  };

  const updated = [newRec, ...current];
  try {
    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(updated));
  } catch {}
  return newRec;
};

export const bulkUpdateVendorStock = (
  vendorId: string,
  updates: { productId: string; newStock: number; reason: InventoryMovementRecord['reason']; notes?: string }[]
): void => {
  const allProducts = getVendorProducts(vendorId);
  updates.forEach((u) => {
    const prod = allProducts.find((p) => p.id === u.productId);
    if (prod) {
      const prev = prod.stockQuantity;
      const change = u.newStock - prev;
      updateVendorProductStockAndPrice(u.productId, {
        stockQuantity: u.newStock,
        inStock: u.newStock > 0,
      });
      recordInventoryMovement({
        vendorId,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        movementType: change >= 0 ? 'STOCK_IN' : 'STOCK_OUT',
        reason: u.reason,
        quantityChange: change,
        previousStock: prev,
        resultingStock: u.newStock,
        notes: u.notes,
      });
    }
  });
};

// ==============================================================================
// 8. BILLING, GST TAX INVOICES & CREDIT/DEBIT NOTES
// ==============================================================================
const VENDOR_INVOICES_KEY = 'platform_vendor_invoices';

export const getVendorInvoices = (vendorId?: string): VendorTaxInvoice[] => {
  try {
    const raw = localStorage.getItem(VENDOR_INVOICES_KEY);
    const list: VendorTaxInvoice[] = raw ? JSON.parse(raw) : [];
    if (vendorId) {
      return list.filter((inv) => inv.vendorGstin.length > 0); // filtered by context
    }
    return list;
  } catch {
    return [];
  }
};

export const createVendorInvoice = (invoice: Partial<VendorTaxInvoice>): VendorTaxInvoice => {
  const current = getVendorInvoices();
  const year = new Date().getFullYear();
  const count = current.length + 1;
  const invNumber = invoice.invoiceNumber || `BG/INV/${year}/${String(count).padStart(5, '0')}`;

  const newInv: VendorTaxInvoice = {
    id: `inv-doc-${Date.now()}`,
    invoiceNumber: invNumber,
    invoiceType: invoice.invoiceType || 'TAX_INVOICE',
    vendorSubOrderId: invoice.vendorSubOrderId || '',
    masterOrderId: invoice.masterOrderId || '',
    invoiceDate: new Date().toISOString(),
    vendorGstin: invoice.vendorGstin || '07AABCB1234D1ZP',
    vendorLegalName: invoice.vendorLegalName || 'BuildGhar Depot Partner',
    vendorAddress: invoice.vendorAddress || 'Industrial Area, Phase 2, Depot #14',
    customerName: invoice.customerName || 'Verified Homeowner',
    customerGstin: invoice.customerGstin,
    customerAddress: invoice.customerAddress || 'Plot #42, Sector 18, City',
    items: invoice.items || [],
    subtotalPaise: invoice.subtotalPaise || 0,
    totalTaxPaise: invoice.totalTaxPaise || 0,
    shippingChargesPaise: invoice.shippingChargesPaise || 0,
    roundOffPaise: invoice.roundOffPaise || 0,
    grandTotalPaise: invoice.grandTotalPaise || 0,
    isCancelled: false,
  };

  const updated = [newInv, ...current];
  try {
    localStorage.setItem(VENDOR_INVOICES_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('INVOICES_UPDATED', newInv);
  } catch {}
  return newInv;
};

// ==============================================================================
// 9. OFFERS, DISCOUNTS & PROMOTIONAL CAMPAIGNS
// ==============================================================================
const PROMOTIONS_KEY = 'platform_vendor_promotions';

export const getVendorPromotions = (vendorId: string): VendorPromotionRule[] => {
  try {
    const raw = localStorage.getItem(PROMOTIONS_KEY);
    const list: VendorPromotionRule[] = raw ? JSON.parse(raw) : [];
    return list.filter((p) => p.vendorId === vendorId);
  } catch {
    return [];
  }
};

export const saveVendorPromotion = (promo: Partial<VendorPromotionRule>): VendorPromotionRule => {
  const current = getVendorPromotions(promo.vendorId || '');
  const rawAll = localStorage.getItem(PROMOTIONS_KEY);
  const allPromos: VendorPromotionRule[] = rawAll ? JSON.parse(rawAll) : [];

  const newPromo: VendorPromotionRule = {
    id: promo.id || `prm-${Date.now()}`,
    vendorId: promo.vendorId || '',
    title: promo.title || 'Special Construction Discount',
    code: (promo.code || 'BUILD5').toUpperCase(),
    discountType: promo.discountType || 'PERCENTAGE',
    discountValue: promo.discountValue || 5,
    minPurchasePaise: promo.minPurchasePaise || 2500000,
    applicableProductIds: promo.applicableProductIds || [],
    startDate: promo.startDate || new Date().toISOString(),
    endDate: promo.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    usageLimit: promo.usageLimit || 100,
    usedCount: promo.usedCount || 0,
    isActive: promo.isActive !== undefined ? promo.isActive : true,
    featuredPlacementRequested: promo.featuredPlacementRequested || false,
    featuredStatus: promo.featuredPlacementRequested ? 'PENDING' : undefined,
  };

  const idx = allPromos.findIndex((p) => p.id === newPromo.id);
  let updated: VendorPromotionRule[];
  if (idx >= 0) {
    updated = [...allPromos];
    updated[idx] = newPromo;
  } else {
    updated = [newPromo, ...allPromos];
  }

  try {
    localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('PROMOTIONS_UPDATED', newPromo);
  } catch {}
  return newPromo;
};

export const toggleVendorPromotion = (promoId: string, isActive: boolean): void => {
  const raw = localStorage.getItem(PROMOTIONS_KEY);
  if (!raw) return;
  const list: VendorPromotionRule[] = JSON.parse(raw);
  const updated = list.map((p) => (p.id === promoId ? { ...p, isActive } : p));
  try {
    localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(updated));
  } catch {}
};

// ==============================================================================
// 10. CUSTOMER QUERIES & PRODUCT REVIEWS
// ==============================================================================
const CUSTOMER_QUERIES_KEY = 'platform_vendor_customer_queries';
const PRODUCT_REVIEWS_KEY = 'platform_vendor_product_reviews';

export const getVendorCustomerQueries = (vendorId: string): VendorCustomerQuery[] => {
  try {
    const raw = localStorage.getItem(CUSTOMER_QUERIES_KEY);
    const list: VendorCustomerQuery[] = raw ? JSON.parse(raw) : [];
    return list.filter((q) => q.vendorId === vendorId);
  } catch {
    return [];
  }
};

export const replyToCustomerQuery = (queryId: string, replyText: string): void => {
  const raw = localStorage.getItem(CUSTOMER_QUERIES_KEY);
  if (!raw) return;
  const list: VendorCustomerQuery[] = JSON.parse(raw);
  const updated = list.map((q) => (q.id === queryId ? { ...q, replyText, status: 'REPLIED' as const, repliedAt: new Date().toISOString() } : q));
  try {
    localStorage.setItem(CUSTOMER_QUERIES_KEY, JSON.stringify(updated));
  } catch {}
};

export const getVendorProductReviews = (vendorId: string, productId?: string): VendorProductReview[] => {
  try {
    const raw = localStorage.getItem(PRODUCT_REVIEWS_KEY);
    const list: VendorProductReview[] = raw ? JSON.parse(raw) : [];
    return list.filter((r) => r.vendorId === vendorId && (!productId || r.productId === productId));
  } catch {
    return [];
  }
};

export const respondToProductReview = (reviewId: string, vendorResponse: string): void => {
  const raw = localStorage.getItem(PRODUCT_REVIEWS_KEY);
  if (!raw) return;
  const list: VendorProductReview[] = JSON.parse(raw);
  const updated = list.map((r) => (r.id === reviewId ? { ...r, vendorResponse } : r));
  try {
    localStorage.setItem(PRODUCT_REVIEWS_KEY, JSON.stringify(updated));
  } catch {}
};

// ==============================================================================
// 11. SUPPORT TICKETS & HELP CENTER
// ==============================================================================
const SUPPORT_TICKETS_KEY = 'platform_vendor_support_tickets';

export const getVendorSupportTickets = (vendorId?: string): VendorSupportTicket[] => {
  try {
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
    const list: VendorSupportTicket[] = raw ? JSON.parse(raw) : [];
    if (vendorId) {
      return list.filter((t) => t.vendorId === vendorId);
    }
    return list;
  } catch {
    return [];
  }
};

export const createVendorSupportTicket = (ticket: Partial<VendorSupportTicket>): VendorSupportTicket => {
  const current = getVendorSupportTickets();
  const year = new Date().getFullYear();
  const count = current.length + 1;
  const code = `TKT-${year}-${String(count).padStart(4, '0')}`;

  const newTkt: VendorSupportTicket = {
    id: `tkt-${Date.now()}`,
    ticketCode: code,
    vendorId: ticket.vendorId || '',
    vendorName: ticket.vendorName || 'BuildGhar Vendor',
    subject: ticket.subject || 'Support Request',
    category: ticket.category || 'GENERAL',
    priority: ticket.priority || 'MEDIUM',
    status: 'OPEN',
    messages: ticket.messages || [
      {
        id: `msg-${Date.now()}`,
        senderId: ticket.vendorId || 'vendor',
        senderRole: 'VENDOR',
        senderName: ticket.vendorName || 'Vendor',
        text: ticket.subject || 'Ticket created',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newTkt, ...current];
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('TICKETS_UPDATED', newTkt);
  } catch {}
  return newTkt;
};

export const replyToVendorTicket = (
  ticketId: string,
  senderRole: 'VENDOR' | 'ADMIN',
  senderName: string,
  text: string,
  attachmentUrl?: string
): VendorSupportTicket | undefined => {
  const current = getVendorSupportTickets();
  const tkt = current.find((t) => t.id === ticketId);
  if (!tkt) return undefined;

  const newMsg = {
    id: `msg-${Date.now()}`,
    senderId: senderRole === 'VENDOR' ? tkt.vendorId : 'admin',
    senderRole,
    senderName,
    text,
    attachmentUrl,
    createdAt: new Date().toISOString(),
  };

  const updatedStatus = senderRole === 'ADMIN' ? 'AWAITING_VENDOR' : 'IN_PROGRESS';
  const updatedTkt: VendorSupportTicket = {
    ...tkt,
    messages: [...tkt.messages, newMsg],
    status: updatedStatus,
    updatedAt: new Date().toISOString(),
  };

  const list = current.map((t) => (t.id === ticketId ? updatedTkt : t));
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(list));
    broadcastStoreUpdate('TICKETS_UPDATED', updatedTkt);
  } catch {}
  return updatedTkt;
};

export const closeVendorSupportTicket = (ticketId: string): void => {
  const current = getVendorSupportTickets();
  const list = current.map((t) => (t.id === ticketId ? { ...t, status: 'CLOSED' as const, updatedAt: new Date().toISOString() } : t));
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(list));
  } catch {}
};

// ==============================================================================
// 13. VENDOR NOTIFICATIONS STORE (Section 17)
// ==============================================================================
const VENDOR_NOTIFICATIONS_KEY = 'platform_vendor_notifications';

export const INITIAL_VENDOR_NOTIFICATIONS: VendorNotification[] = [];

export const getVendorNotifications = (vendorId?: string): VendorNotification[] => {
  try {
    const data = localStorage.getItem(VENDOR_NOTIFICATIONS_KEY);
    let list: VendorNotification[] = [];
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) list = parsed;
    }
    if (vendorId) {
      return list.filter((n) => !n.vendorId || n.vendorId === vendorId);
    }
    return list;
  } catch {
    return [];
  }
};

export const markVendorNotificationAsRead = (id: string): void => {
  const current = getVendorNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  try {
    localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('NOTIFICATIONS_UPDATED', id);
  } catch {}
};

export const markAllVendorNotificationsAsRead = (vendorId?: string): void => {
  const current = getVendorNotifications();
  const updated = current.map((n) => (!vendorId || !n.vendorId || n.vendorId === vendorId ? { ...n, isRead: true } : n));
  try {
    localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(updated));
    broadcastStoreUpdate('NOTIFICATIONS_UPDATED', vendorId || 'all');
  } catch {}
};

export const createVendorNotification = (notif: Partial<VendorNotification>): VendorNotification => {
  const current = getVendorNotifications();
  const newItem: VendorNotification = {
    id: notif.id || `vnotif-${Date.now()}`,
    vendorId: notif.vendorId || 'vnd-delhi-1',
    title: notif.title || 'Platform Notification',
    message: notif.message || '',
    category: notif.category || 'ADMIN',
    isRead: false,
    link: notif.link,
    createdAt: new Date().toISOString(),
  };
  const list = [newItem, ...current];
  try {
    localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(list));
    broadcastStoreUpdate('NOTIFICATIONS_UPDATED', newItem);
  } catch {}
  return newItem;
};
