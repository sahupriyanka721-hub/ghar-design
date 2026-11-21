import { Router, Request, Response, NextFunction } from 'express';
import { mockStore } from '../services/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// -------------------------------------------------------------
// CUSTOMER DASHBOARD KPI COUNTS (Section 5.1 & 5.2)
// -------------------------------------------------------------
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalRequests = mockStore.requests.length;
    const quotationsAwaitingDecision = mockStore.quotations.filter((q) => q.status === 'PUBLISHED').length;
    const confirmedBookings = mockStore.bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length;
    const activeProjects = mockStore.requests.filter((r) => r.status === 'BOOKING_CONFIRMED').length;
    const pendingCustomerApprovals = mockStore.designApprovals.filter((d) => d.status === 'PENDING').length;
    const pendingPayments = mockStore.invoices.filter((i) => i.status === 'PENDING').length;
    const openMaterialOrders = mockStore.orders.filter((o) => o.fulfillmentStatus !== 'DELIVERED').length;
    const unreadNotifications = mockStore.notifications.filter((n) => !n.isRead).length;

    return sendSuccess(res, {
      kpiSummary: {
        totalRequests,
        quotationsAwaitingDecision,
        confirmedBookings,
        activeProjects,
        pendingCustomerApprovals,
        pendingPayments,
        openMaterialOrders,
        unreadNotifications,
      },
      recentRequests: mockStore.requests.slice(0, 3),
      recentQuotations: mockStore.quotations.slice(0, 3),
      recentBookings: mockStore.bookings.slice(0, 3),
      recentOrders: mockStore.orders.slice(0, 3),
      pendingInvoices: mockStore.invoices.filter((i) => i.status === 'PENDING'),
      activeStages: mockStore.stages.filter((s) => s.status === 'IN_PROGRESS'),
      pendingApprovals: mockStore.designApprovals.filter((d) => d.status === 'PENDING'),
      recentNotifications: mockStore.notifications.slice(0, 4),
      supportTickets: mockStore.supportTickets.slice(0, 2),
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// SAVED ADDRESSES BOOK (Section 2.1 & 11.1)
// -------------------------------------------------------------
router.get('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.addresses);
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newAddr = {
      id: `addr-${Date.now()}`,
      ...req.body,
    };
    mockStore.addresses.push(newAddr);
    return sendSuccess(res, newAddr, 'Address added successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const index = mockStore.addresses.findIndex((a) => a.id === req.params.id);
    if (index !== -1) {
      mockStore.addresses.splice(index, 1);
    }
    return sendSuccess(res, { deleted: true }, 'Address deleted');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// BOOKING MANAGEMENT (Section 7.1 & 7.2)
// -------------------------------------------------------------
router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.bookings);
  } catch (err) {
    next(err);
  }
});

router.post('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quotationId, serviceType, projectName, visitDate, visitTimeSlot, siteAddress, notes } = req.body;
    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingCode: `GHR-BK-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestId: 'req-1001',
      quotationId: quotationId || 'qt-101',
      customerId: 'usr-cust-1',
      professionalId: 'usr-pro-1',
      professionalName: 'Sharma Engineering Engineers',
      serviceTitle: serviceType,
      serviceType: serviceType,
      status: 'CONFIRMED' as const,
      totalAmountPaise: 499000, // ₹4,990 consultation/booking token
      advancePaidPaise: 499000,
      visitDate,
      visitTimeSlot,
      siteAddress,
      nextAppointment: `${visitDate} at ${visitTimeSlot}`,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockStore.bookings.unshift(newBooking);

    // Create payment entry
    mockStore.payments.unshift({
      id: `pay-${Date.now()}`,
      paymentCode: `PAY-BK-${Date.now()}`,
      userId: 'usr-cust-1',
      requestId: 'req-1001',
      bookingId: newBooking.id,
      purpose: 'BOOKING_ADVANCE',
      amountPaise: 499000,
      taxPaise: 76118,
      currency: 'INR',
      paymentMethod: 'Razorpay UPI',
      status: 'PAYMENT_SUCCESSFUL',
      createdAt: new Date().toISOString(),
    });

    return sendSuccess(res, newBooking, 'Booking confirmed successfully!', 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/bookings/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitDate, visitTimeSlot } = req.body;
    const booking = mockStore.bookings.find((b) => b.id === req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    booking.visitDate = visitDate;
    booking.visitTimeSlot = visitTimeSlot;
    booking.nextAppointment = `${visitDate} at ${visitTimeSlot}`;
    return sendSuccess(res, booking, 'Appointment rescheduled successfully');
  } catch (err) {
    next(err);
  }
});

router.patch('/bookings/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = mockStore.bookings.find((b) => b.id === req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    booking.status = 'CANCELLED';
    return sendSuccess(res, booking, 'Booking cancelled per refund policy');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// PROJECT / SERVICE TRACKING & 10 STAGES (Section 7.3)
// -------------------------------------------------------------
router.get('/track/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const completedStages = mockStore.stages.filter((s) => s.status === 'COMPLETED').length;
    const overallProgress = Math.round((completedStages / mockStore.stages.length) * 100);

    return sendSuccess(res, {
      projectId: 'req-1001',
      projectCode: 'GHR-REQ-2026-1001',
      projectName: '3-Floor Luxury Residential Villa',
      projectManager: 'Er. Rajeshwar Nath (GharDesign Senior PM)',
      managerPhone: '+91 98112 00192',
      managerEmail: 'pm.gurugram@ghardesign.in',
      overallProgress: overallProgress || 45,
      currentStageIndex: 4, // Foundation Work
      plannedStartDate: '2026-09-01',
      plannedCompletionDate: '2027-04-30',
      delayedMilestonesCount: 0,
      stages: mockStore.stages,
      sitePhotos: [
        {
          id: 'sp-1',
          url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800',
          caption: 'Excavation completed and PCC bed poured (Grade M15)',
          date: '2026-10-06',
          stageName: 'Stage 5: Foundation Work',
        },
        {
          id: 'sp-2',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
          caption: 'Fe550D rebar column footing cage binding inspection',
          date: '2026-10-10',
          stageName: 'Stage 5: Foundation Work',
        },
      ],
      issues: [
        {
          id: 'iss-1',
          title: 'High water table detected at east boundary corner',
          severity: 'MEDIUM' as const,
          status: 'RESOLVED' as const,
          resolution: 'Installed sub-surface dewatering pump; foundation depth raised 150mm per structural revised memo.',
          reportedAt: '2026-10-03',
        },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// MATERIAL CATALOG & PURCHASES (Section 8.1 & 8.2)
// -------------------------------------------------------------
router.get('/materials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    let list = mockStore.materials;

    if (category && category !== 'all') {
      list = list.filter((m) => m.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q));
    }

    return sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.post('/materials/bulk-quote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quoteReq = {
      id: `bq-${Date.now()}`,
      ...req.body,
      status: 'QUOTATION_PENDING',
      createdAt: new Date().toISOString(),
    };
    return sendSuccess(res, quoteReq, 'Bulk quote request submitted to wholesale suppliers!');
  } catch (err) {
    next(err);
  }
});

router.post('/materials/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;
    let subtotalPaise = 0;
    const orderItems = items.map((item: any) => {
      const prod = mockStore.materials.find((m) => m.id === item.productId);
      const unitPricePaise = prod ? prod.pricePaise : 50000;
      const totalPaise = unitPricePaise * item.quantity;
      subtotalPaise += totalPaise;
      return {
        productId: item.productId,
        name: prod?.name || item.name || 'Building Material',
        sku: prod?.sku || 'SKU-001',
        brand: prod?.brand || 'Verified Brand',
        unit: prod?.unit || 'Units',
        quantity: item.quantity,
        unitPricePaise,
        totalPaise,
        imageUrl: prod?.imageUrl || '',
      };
    });

    const taxPaise = Math.round(subtotalPaise * 0.18);
    const deliveryFeePaise = 150000; // ₹1,500
    const totalAmountPaise = subtotalPaise + taxPaise + deliveryFeePaise;

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderCode: `GHR-ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: 'usr-cust-1',
      items: orderItems,
      subtotalPaise,
      taxPaise,
      deliveryFeePaise,
      totalAmountPaise,
      deliveryAddress: deliveryAddress || mockStore.addresses[0],
      paymentStatus: 'PAYMENT_SUCCESSFUL' as const,
      fulfillmentStatus: 'CONFIRMED' as const,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      trackingNumber: `DELHIVERY-GHR-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingSteps: [
        { status: 'Order Placed & Verified', date: new Date().toLocaleString(), completed: true },
        { status: 'Quality Inspected at Hub', date: 'Pending', completed: false },
        { status: 'Dispatched via Direct Transit', date: 'Pending', completed: false },
        { status: 'Out for Site Delivery', date: 'Pending', completed: false },
        { status: 'Delivered & Offloaded at Site', date: 'Pending', completed: false },
      ],
    };

    mockStore.orders.unshift(newOrder);

    // Add payment entry
    mockStore.payments.unshift({
      id: `pay-${Date.now()}`,
      paymentCode: `PAY-ORD-${Date.now()}`,
      userId: 'usr-cust-1',
      orderId: newOrder.id,
      purpose: 'MATERIAL_PURCHASE',
      amountPaise: totalAmountPaise,
      taxPaise,
      currency: 'INR',
      paymentMethod: paymentMethod || 'Online Payment',
      status: 'PAYMENT_SUCCESSFUL',
      createdAt: new Date().toISOString(),
    });

    return sendSuccess(res, newOrder, 'Material order placed successfully!', 201);
  } catch (err) {
    next(err);
  }
});

router.get('/materials/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.orders);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// INVOICES & TAX BREAKDOWNS (Section 9.2)
// -------------------------------------------------------------
router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.invoices);
  } catch (err) {
    next(err);
  }
});

router.post('/invoices/:id/pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = mockStore.invoices.find((i) => i.id === req.params.id);
    if (!invoice) return sendError(res, 'Invoice not found', 404);

    invoice.paidAmountPaise = invoice.totalAmountPaise;
    invoice.outstandingPaise = 0;
    invoice.status = 'PAID';

    mockStore.payments.unshift({
      id: `pay-${Date.now()}`,
      paymentCode: `PAY-INV-${Date.now()}`,
      userId: 'usr-cust-1',
      purpose: 'MILESTONE_PAYMENT',
      amountPaise: invoice.totalAmountPaise,
      taxPaise: invoice.taxPaise,
      currency: 'INR',
      paymentMethod: 'Razorpay NetBanking',
      status: 'PAYMENT_SUCCESSFUL',
      createdAt: new Date().toISOString(),
    });

    return sendSuccess(res, invoice, 'Invoice paid successfully via Razorpay Escrow!');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// FINAL SETTLEMENTS (Section 9.3)
// -------------------------------------------------------------
router.get('/final-settlements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.finalSettlements);
  } catch (err) {
    next(err);
  }
});

router.post('/final-settlements/:id/dispute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const settlement = mockStore.finalSettlements.find((s) => s.id === req.params.id);
    if (!settlement) return sendError(res, 'Settlement not found', 404);

    settlement.status = 'DISPUTED';
    settlement.disputeNotes = reason;

    // Add support ticket
    mockStore.supportTickets.unshift({
      id: `tkt-${Date.now()}`,
      ticketCode: `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: 'usr-cust-1',
      category: 'BILLING',
      priority: 'HIGH',
      subject: `Billing Dispute on Settlement ${settlement.projectCode}`,
      description: reason,
      status: 'OPEN',
      relatedReference: settlement.projectCode,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: 'Vikram Malhotra',
          senderRole: 'CUSTOMER',
          message: reason,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return sendSuccess(res, settlement, 'Dispute raised. Accounts arbitration team has been alerted.');
  } catch (err) {
    next(err);
  }
});

router.post('/final-settlements/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlement = mockStore.finalSettlements.find((s) => s.id === req.params.id);
    if (!settlement) return sendError(res, 'Settlement not found', 404);

    settlement.status = 'PAID';
    settlement.closedAt = new Date().toISOString();

    return sendSuccess(res, settlement, 'Final settlement approved and settled!');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// DESIGN APPROVALS & REVISIONS (Section 7.3 & 12.4)
// -------------------------------------------------------------
router.get('/design-approvals/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.designApprovals);
  } catch (err) {
    next(err);
  }
});

router.post('/design-approvals/:id/action', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, comments } = req.body;
    const approval = mockStore.designApprovals.find((a) => a.id === req.params.id);
    if (!approval) return sendError(res, 'Design approval item not found', 404);

    if (action === 'APPROVE') {
      approval.status = 'APPROVED';
      approval.customerNotes = comments || 'Approved by customer.';
      approval.history.push({
        version: approval.documentVersion,
        action: 'APPROVED',
        comment: comments || 'Approved with no further revisions.',
        timestamp: new Date().toISOString(),
      });
    } else {
      approval.status = 'CHANGES_REQUESTED';
      approval.customerNotes = comments;
      approval.history.push({
        version: approval.documentVersion,
        action: 'CHANGES_REQUESTED',
        comment: comments,
        timestamp: new Date().toISOString(),
      });
    }

    return sendSuccess(res, approval, `Design ${action === 'APPROVE' ? 'Approved' : 'Change Request Submitted'}!`);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// PROJECT DOCUMENTS VAULT (Section 12.3)
// -------------------------------------------------------------
router.get('/documents/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.projectDocuments);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// PROJECT COMMUNICATION MESSAGES (Section 12.5)
// -------------------------------------------------------------
router.get('/messages/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.projectMessages);
  } catch (err) {
    next(err);
  }
});

router.post('/messages/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    const newMsg = {
      id: `pmsg-${Date.now()}`,
      projectId: 'req-1001',
      senderId: 'usr-cust-1',
      senderName: 'Vikram Malhotra',
      senderRole: 'CUSTOMER' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    mockStore.projectMessages.push(newMsg);
    return sendSuccess(res, newMsg, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// SUPPORT TICKETS (Section 12.1)
// -------------------------------------------------------------
router.get('/support-tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.supportTickets);
  } catch (err) {
    next(err);
  }
});

router.post('/support-tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, priority, subject, description, relatedReference } = req.body;
    const newTicket = {
      id: `tkt-${Date.now()}`,
      ticketCode: `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: 'usr-cust-1',
      category: category || 'GENERAL',
      priority: priority || 'MEDIUM',
      subject,
      description,
      status: 'OPEN' as const,
      relatedReference,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: 'Vikram Malhotra',
          senderRole: 'CUSTOMER',
          message: description,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.supportTickets.unshift(newTicket);
    return sendSuccess(res, newTicket, 'Support ticket created successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.post('/support-tickets/:id/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = mockStore.supportTickets.find((t) => t.id === req.params.id);
    if (!ticket) return sendError(res, 'Ticket not found', 404);

    const reply = {
      id: `msg-${Date.now()}`,
      senderName: 'Vikram Malhotra',
      senderRole: 'CUSTOMER',
      message: req.body.message,
      timestamp: new Date().toISOString(),
    };
    ticket.messages.push(reply);
    ticket.updatedAt = new Date().toISOString();
    return sendSuccess(res, ticket, 'Reply posted');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// REVIEWS & FEEDBACK (Section 12.6)
// -------------------------------------------------------------
router.post('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, overallRating, qualityRating, punctualityRating, comment } = req.body;
    const review = {
      id: `rev-${Date.now()}`,
      bookingId: bookingId || 'bk-1001',
      projectName: '3-Floor Luxury Residential Villa',
      professionalName: 'Sharma Engineering Engineers',
      overallRating,
      qualityRating,
      punctualityRating,
      comment,
      createdAt: new Date().toISOString(),
    };
    mockStore.reviews.push(review);
    return sendSuccess(res, review, 'Thank you! Your verified review has been published.', 201);
  } catch (err) {
    next(err);
  }
});

export default router;
