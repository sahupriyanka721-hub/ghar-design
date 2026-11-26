import { mockStore } from './store.js';
import { executeDb } from './db.js';
import { ProjectRequest, ProjectRequestStatus } from '@ghar-design/shared';
import { logger } from '../utils/logger.js';

// Valid status transitions map
const VALID_TRANSITIONS: Record<ProjectRequestStatus, ProjectRequestStatus[]> = {
  DRAFT: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['AWAITING_ASSIGNMENT', 'REJECTED', 'CANCELLED'],
  AWAITING_ASSIGNMENT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['QUOTATIONS_IN_PROGRESS', 'CANCELLED'],
  QUOTATIONS_IN_PROGRESS: ['UNDER_QUOTATION_REVIEW', 'QUOTATIONS_AVAILABLE', 'CANCELLED', 'EXPIRED'],
  UNDER_QUOTATION_REVIEW: ['QUOTATIONS_AVAILABLE', 'CANCELLED'],
  QUOTATIONS_AVAILABLE: ['QUOTE_SELECTED', 'CANCELLED', 'EXPIRED'],
  QUOTE_SELECTED: ['BOOKING_PENDING', 'CANCELLED'],
  BOOKING_PENDING: ['BOOKING_CONFIRMED', 'CANCELLED'],
  BOOKING_CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
};

export class RequestService {
  static async createRequest(customerId: string, inputData: any): Promise<ProjectRequest> {
    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `GHR-REQ-${new Date().getFullYear()}-${codeNumber}`;

    // Area calculation based on unit
    const plotArea = Math.round(Number(inputData.plotWidth) * Number(inputData.plotLength) * 100) / 100;

    const newRequest: ProjectRequest = {
      id: `req-${Date.now()}`,
      requestCode,
      customerId,
      status: 'AWAITING_PAYMENT', // Requires nominal quotation fee before going to admin
      categorySlug: inputData.categorySlug,
      propertyType: inputData.propertyType,
      plotWidth: Number(inputData.plotWidth),
      plotLength: Number(inputData.plotLength),
      measurementUnit: inputData.measurementUnit,
      plotArea,
      builtUpArea: inputData.builtUpArea ? Number(inputData.builtUpArea) : null,
      floors: Number(inputData.floors || 1),
      bedrooms: Number(inputData.bedrooms || 0),
      bathrooms: Number(inputData.bathrooms || 0),
      kitchens: Number(inputData.kitchens || 0),
      currentCondition: inputData.currentCondition,
      city: inputData.city,
      state: inputData.state,
      locality: inputData.locality,
      address: inputData.address || null,
      ownershipConfirmed: Boolean(inputData.ownershipConfirmed),
      requiredServices: inputData.requiredServices || [],
      budgetRange: inputData.budgetRange,
      preferredStartDate: inputData.preferredStartDate || null,
      expectedCompletionDate: inputData.expectedCompletionDate || null,
      description: inputData.description,
      designStyle: inputData.designStyle || null,
      siteAccessibilityNotes: inputData.siteAccessibilityNotes || null,
      quoteFeePaise: 49900, // ₹499
      isFeePaid: false,
      publishedQuotationsCount: 0,
      assignedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await executeDb(
      async (prisma) => {
        await prisma.projectRequest.create({
          data: {
            id: newRequest.id,
            requestCode: newRequest.requestCode,
            customerId: newRequest.customerId,
            categoryId: newRequest.categorySlug || 'new-house-construction',
            propertyType: newRequest.propertyType as any,
            plotWidth: newRequest.plotWidth,
            plotLength: newRequest.plotLength,
            measurementUnit: newRequest.measurementUnit as any,
            plotArea: newRequest.plotArea,
            builtUpArea: newRequest.builtUpArea,
            floors: newRequest.floors,
            bedrooms: newRequest.bedrooms,
            bathrooms: newRequest.bathrooms,
            kitchens: newRequest.kitchens,
            currentCondition: newRequest.currentCondition,
            city: newRequest.city,
            state: newRequest.state,
            locality: newRequest.locality,
            address: newRequest.address,
            ownershipConfirmed: newRequest.ownershipConfirmed,
            budgetRange: newRequest.budgetRange,
            description: newRequest.description,
            designStyle: newRequest.designStyle,
            siteAccessibilityNotes: newRequest.siteAccessibilityNotes,
            quoteFeePaise: newRequest.quoteFeePaise,
            isFeePaid: newRequest.isFeePaid,
            status: newRequest.status as any,
          },
        }).catch((e: any) => logger.warn(`Prisma request insert skipped: ${e.message}`));
        mockStore.requests.unshift(newRequest);
        logger.info(`✨ Created new Project Request ${requestCode} for customer ${customerId}`);
        return newRequest;
      },
      () => {
        mockStore.requests.unshift(newRequest);
        logger.info(`✨ Created new Project Request ${requestCode} for customer ${customerId}`);
        return newRequest;
      }
    );
  }

  static async getCustomerRequests(customerId: string): Promise<ProjectRequest[]> {
    return await executeDb(
      async (prisma) => {
        const dbReqs = await prisma.projectRequest.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
        });
        if (dbReqs.length > 0) {
          return dbReqs.map((r: any) => ({
            ...r,
            measurementUnit: r.measurementUnit as any,
            propertyType: r.propertyType as any,
            status: r.status as any,
            preferredStartDate: r.preferredStartDate ? r.preferredStartDate.toISOString() : null,
            expectedCompletionDate: r.expectedCompletionDate ? r.expectedCompletionDate.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            requiredServices: [],
            publishedQuotationsCount: 0,
            assignedCount: 0,
          }));
        }
        return mockStore.requests.filter((r) => r.customerId === customerId);
      },
      () => mockStore.requests.filter((r) => r.customerId === customerId)
    );
  }

  static async getRequestById(requestId: string): Promise<any> {
    return await executeDb(
      async (prisma) => {
        const found = await prisma.projectRequest.findUnique({
          where: { id: requestId },
          include: {
            assignments: true,
            quotations: true,
          },
        });
        if (found) {
          return {
            ...found,
            measurementUnit: found.measurementUnit as any,
            propertyType: found.propertyType as any,
            status: found.status as any,
            preferredStartDate: found.preferredStartDate ? found.preferredStartDate.toISOString() : null,
            expectedCompletionDate: found.expectedCompletionDate ? found.expectedCompletionDate.toISOString() : null,
            createdAt: found.createdAt.toISOString(),
            updatedAt: found.updatedAt.toISOString(),
            requiredServices: [],
            quotationsCount: found.quotations?.length || 0,
          };
        }
        return RequestService.getFallbackRequestById(requestId);
      },
      () => RequestService.getFallbackRequestById(requestId)
    );
  }

  private static getFallbackRequestById(requestId: string) {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    const assignments = mockStore.assignments.filter((a) => a.requestId === requestId);
    const quotations = mockStore.quotations.filter((q) => q.requestId === requestId);

    return {
      ...request,
      assignments,
      quotationsCount: quotations.length,
    };
  }

  static transitionStatus(requestId: string, newStatus: ProjectRequestStatus, actorId: string, reason?: string) {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    const allowed = VALID_TRANSITIONS[request.status] || [];
    if (!allowed.includes(newStatus)) {
      throw {
        statusCode: 400,
        message: `Invalid state transition from ${request.status} to ${newStatus}. Allowed transitions: ${allowed.join(', ')}`,
      };
    }

    const previousStatus = request.status;
    request.status = newStatus;
    request.updatedAt = new Date().toISOString();

    logger.info(`State change for Request ${request.requestCode}: ${previousStatus} -> ${newStatus} by actor ${actorId}`);
    return request;
  }
}
