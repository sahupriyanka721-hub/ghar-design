import { mockStore } from './store.js';
import { Booking, BookingStatus } from '@ghar-design/shared';
import { logger } from '../utils/logger.js';
import { RequestService } from './request.service.js';

export class BookingService {
  static selectAndBookQuotation(
    customerId: string,
    requestId: string,
    quotationId: string
  ): Booking {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    // 1. Verify authenticated customer owns the request
    if (request.customerId !== customerId) {
      throw { statusCode: 403, message: 'Unauthorized: You can only select quotations for your own request.' };
    }

    // 2. Prevent duplicate active booking
    const existingBooking = mockStore.bookings.find(
      (b) => b.requestId === requestId && b.status !== 'CANCELLED'
    );
    if (existingBooking) {
      throw { statusCode: 400, message: 'This project request already has a confirmed booking.' };
    }

    // 3. Verify quotation
    const quotation = mockStore.quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      throw { statusCode: 404, message: 'Quotation not found.' };
    }

    if (quotation.requestId !== requestId) {
      throw { statusCode: 400, message: 'Quotation does not belong to this request.' };
    }

    if (quotation.status !== 'PUBLISHED') {
      throw { statusCode: 400, message: 'Only published, approved quotations can be selected.' };
    }

    // Check expiry
    if (new Date(quotation.validUntil).getTime() < Date.now()) {
      throw { statusCode: 400, message: 'This quotation has expired. Please ask for an updated quotation.' };
    }

    // 4. Calculate advance payment
    const advancePaidPaise = Math.round(
      (quotation.finalAmountPaise * quotation.advancePercentage) / 100
    );

    const bookingCode = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      requestId,
      quotationId,
      customerId,
      professionalId: quotation.professionalId,
      serviceTitle: (request as any)?.propertyType || 'Engineering Services',
      serviceType: (request as any)?.categorySlug || 'STRUCTURAL_DESIGN',
      status: 'CONFIRMED',
      totalAmountPaise: quotation.finalAmountPaise,
      advancePaidPaise,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 5. Atomically update statuses:
    // Mark chosen quotation as SELECTED
    quotation.status = 'SELECTED';
    quotation.updatedAt = new Date().toISOString();

    // Mark other quotations for this request as NOT_SELECTED
    mockStore.quotations
      .filter((q) => q.requestId === requestId && q.id !== quotationId)
      .forEach((otherQuote) => {
        if (otherQuote.status === 'PUBLISHED') {
          otherQuote.status = 'NOT_SELECTED';
          otherQuote.updatedAt = new Date().toISOString();
        }
      });

    // Update request status
    request.selectedQuotationId = quotationId;
    request.status = 'BOOKING_CONFIRMED';
    request.updatedAt = new Date().toISOString();

    mockStore.bookings.push(booking);

    // Notifications
    mockStore.notifications.push({
      id: `notif-${Date.now()}-1`,
      userId: customerId,
      title: 'Booking Confirmed!',
      message: `Your booking ${bookingCode} has been confirmed with ${quotation.professional?.firmName || 'the professional'}.`,
      type: 'SUCCESS',
      isRead: false,
      link: `/dashboard/bookings`,
      createdAt: new Date().toISOString(),
    });

    mockStore.notifications.push({
      id: `notif-${Date.now()}-2`,
      userId: quotation.professionalId,
      title: 'Congratulations! Quotation Selected',
      message: `Customer has accepted your quotation ${quotation.quotationCode} for request ${request.requestCode}. Booking Code: ${bookingCode}.`,
      type: 'SUCCESS',
      isRead: false,
      link: `/professional/bookings`,
      createdAt: new Date().toISOString(),
    });

    logger.info(`🎉 Booking ${bookingCode} confirmed for Request ${request.requestCode}`);
    return booking;
  }

  static getCustomerBookings(customerId: string) {
    return mockStore.bookings
      .filter((b) => b.customerId === customerId)
      .map((b) => {
        const req = mockStore.requests.find((r) => r.id === b.requestId);
        const quote = mockStore.quotations.find((q) => q.id === b.quotationId);
        return { ...b, request: req, quotation: quote };
      });
  }

  static getProfessionalBookings(professionalId: string) {
    return mockStore.bookings
      .filter((b) => b.professionalId === professionalId)
      .map((b) => {
        const req = mockStore.requests.find((r) => r.id === b.requestId);
        const quote = mockStore.quotations.find((q) => q.id === b.quotationId);
        return { ...b, request: req, quotation: quote };
      });
  }
}
