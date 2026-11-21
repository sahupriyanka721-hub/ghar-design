import { mockStore } from './store.js';
import { Quotation, QuotationStatus } from '@ghar-design/shared';
import { logger } from '../utils/logger.js';

export class QuotationService {
  // Professional creates or updates a quotation
  static createOrUpdateQuotation(professionalId: string, inputData: any): Quotation {
    const request = mockStore.requests.find((r) => r.id === inputData.requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    // Verify assignment
    const assignment = mockStore.assignments.find(
      (a) => a.requestId === inputData.requestId && a.professionalId === professionalId
    );
    if (!assignment) {
      throw { statusCode: 403, message: 'You are not assigned to this project request.' };
    }

    // Calculate line items subtotal
    let subtotalPaise = 0;
    const lineItems = (inputData.lineItems || []).map((item: any) => {
      const itemTotal = Math.round(Number(item.quantity) * Number(item.unitPricePaise));
      subtotalPaise += itemTotal;
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPricePaise: Number(item.unitPricePaise),
        totalPaise: itemTotal,
      };
    });

    const discountPaise = Number(inputData.discountPaise || 0);
    const taxPaise = Number(inputData.taxPaise || 0);
    const finalAmountPaise = Math.max(0, subtotalPaise - discountPaise + taxPaise);

    const proProfile = mockStore.professionalProfiles.find((p) => p.userId === professionalId);

    let quote = mockStore.quotations.find(
      (q) => q.requestId === inputData.requestId && q.professionalId === professionalId
    );

    if (quote) {
      // Update existing quotation and reset review status to UNDER_ADMIN_REVIEW
      quote.scopeOfWork = inputData.scopeOfWork;
      quote.lineItems = lineItems;
      quote.subtotalPaise = subtotalPaise;
      quote.discountPaise = discountPaise;
      quote.taxPaise = taxPaise;
      quote.finalAmountPaise = finalAmountPaise;
      quote.includedDeliverables = inputData.includedDeliverables || [];
      quote.excludedWork = inputData.excludedWork || [];
      quote.revisionsCount = Number(inputData.revisionsCount || 2);
      quote.drawingFormats = inputData.drawingFormats || ['PDF', 'DWG'];
      quote.siteVisitChargesPaise = Number(inputData.siteVisitChargesPaise || 0);
      quote.estimatedDurationDays = Number(inputData.estimatedDurationDays || 30);
      quote.advancePercentage = Number(inputData.advancePercentage || 20);
      quote.milestones = inputData.milestones || [];
      quote.validUntil = inputData.validUntil;
      quote.cancellationTerms = inputData.cancellationTerms;
      quote.additionalTerms = inputData.additionalTerms || null;
      quote.status = 'UNDER_ADMIN_REVIEW';
      quote.updatedAt = new Date().toISOString();
    } else {
      const count = mockStore.quotations.length + 1;
      const quotationCode = `QT-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;

      quote = {
        id: `qt-${Date.now()}`,
        quotationCode,
        requestId: inputData.requestId,
        professionalId,
        professional: {
          id: professionalId,
          firmName: proProfile?.firmName || 'Professional Studio',
          category: (proProfile?.category as any) || 'CIVIL_ENGINEER',
          experienceYears: proProfile?.experienceYears || 5,
          qualifications: proProfile?.qualifications || 'Qualified Professional',
          isVerified: proProfile?.isVerified || false,
        },
        status: 'UNDER_ADMIN_REVIEW',
        scopeOfWork: inputData.scopeOfWork,
        lineItems,
        subtotalPaise,
        discountPaise,
        taxPaise,
        finalAmountPaise,
        includedDeliverables: inputData.includedDeliverables || [],
        excludedWork: inputData.excludedWork || [],
        revisionsCount: Number(inputData.revisionsCount || 2),
        drawingFormats: inputData.drawingFormats || ['PDF', 'DWG'],
        siteVisitChargesPaise: Number(inputData.siteVisitChargesPaise || 0),
        estimatedDurationDays: Number(inputData.estimatedDurationDays || 30),
        advancePercentage: Number(inputData.advancePercentage || 20),
        milestones: inputData.milestones || [],
        validUntil: inputData.validUntil,
        cancellationTerms: inputData.cancellationTerms,
        additionalTerms: inputData.additionalTerms || null,
        adminFeedback: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.quotations.push(quote);
    }

    logger.info(`Quotation ${quote.quotationCode} submitted by professional ${professionalId}. Status: UNDER_ADMIN_REVIEW`);
    return quote;
  }

  // Admin reviews quotation
  static reviewQuotation(
    adminId: string,
    quotationId: string,
    action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'PUBLISH',
    adminFeedback?: string
  ) {
    const quote = mockStore.quotations.find((q) => q.id === quotationId);
    if (!quote) {
      throw { statusCode: 404, message: 'Quotation not found.' };
    }

    if (action === 'APPROVE') {
      quote.status = 'APPROVED';
      quote.adminFeedback = adminFeedback || 'Approved by administrator';
    } else if (action === 'REQUEST_CHANGES') {
      quote.status = 'CHANGES_REQUESTED';
      quote.adminFeedback = adminFeedback || 'Revisions requested by administrator';
    } else if (action === 'REJECT') {
      quote.status = 'REJECTED';
      quote.adminFeedback = adminFeedback || 'Rejected by administrator';
    } else if (action === 'PUBLISH') {
      quote.status = 'PUBLISHED';
      quote.publishedAt = new Date().toISOString();
      quote.adminFeedback = adminFeedback || 'Published to customer';

      // Update project request published count and status
      const req = mockStore.requests.find((r) => r.id === quote.requestId);
      if (req) {
        req.status = 'QUOTATIONS_AVAILABLE';
        const pubCount = mockStore.quotations.filter(
          (q) => q.requestId === req.id && q.status === 'PUBLISHED'
        ).length;
        req.publishedQuotationsCount = pubCount;

        // Notify customer
        mockStore.notifications.push({
          id: `notif-${Date.now()}`,
          userId: req.customerId,
          title: 'New Quotation Published!',
          message: `A new approved quotation (${quote.quotationCode}) is ready to compare for your request ${req.requestCode}.`,
          type: 'SUCCESS',
          isRead: false,
          link: `/dashboard/requests/${req.id}/quotations`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    quote.updatedAt = new Date().toISOString();
    return quote;
  }

  // Customer fetches published quotations for comparison
  static getQuotationsForCustomer(userId: string, requestId: string) {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    if (request.customerId !== userId) {
      throw { statusCode: 403, message: 'Access denied: You do not own this project request.' };
    }

    // Customer only sees PUBLISHED quotations
    return mockStore.quotations.filter(
      (q) => q.requestId === requestId && (q.status === 'PUBLISHED' || q.status === 'SELECTED')
    );
  }

  // Get single quotation by ID
  static getQuotationById(quotationId: string) {
    const quote = mockStore.quotations.find((q) => q.id === quotationId);
    if (!quote) {
      throw { statusCode: 404, message: 'Quotation not found.' };
    }
    return quote;
  }
}
