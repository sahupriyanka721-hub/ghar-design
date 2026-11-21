import { mockStore } from './store.js';
import { logger } from '../utils/logger.js';
import { RequestService } from './request.service.js';

export class AssignmentService {
  // Admin assigns one or more professionals to a request
  static assignProfessionals(
    requestId: string,
    professionalIds: string[],
    responseDeadline: string,
    internalNotes?: string,
    adminId = 'usr-admin-1'
  ) {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    const createdAssignments = [];

    for (const proId of professionalIds) {
      const existing = mockStore.assignments.find(
        (a) => a.requestId === requestId && a.professionalId === proId
      );

      if (!existing) {
        const assignment = {
          id: `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          requestId,
          professionalId: proId,
          status: 'PENDING',
          responseDeadline,
          internalNotes,
          assignedAt: new Date().toISOString(),
        };
        mockStore.assignments.push(assignment);
        createdAssignments.push(assignment);

        // In-app notification to the professional
        mockStore.notifications.push({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: proId,
          title: 'New Project Assignment',
          message: `You have been assigned to prepare a quotation for request ${request.requestCode}. Deadline: ${responseDeadline}.`,
          type: 'INFO',
          isRead: false,
          link: `/professional/assigned`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    request.assignedCount = (request.assignedCount || 0) + createdAssignments.length;

    // Transition request status if appropriate
    if (request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW' || request.status === 'AWAITING_ASSIGNMENT') {
      request.status = 'ASSIGNED';
      request.updatedAt = new Date().toISOString();
    }

    logger.info(`Assigned ${createdAssignments.length} professionals to request ${request.requestCode}`);
    return createdAssignments;
  }

  // Professional views their assigned requests
  static getProfessionalAssignments(professionalId: string) {
    const assignments = mockStore.assignments.filter((a) => a.professionalId === professionalId);
    return assignments.map((a) => {
      const req = mockStore.requests.find((r) => r.id === a.requestId);
      const existingQuote = mockStore.quotations.find(
        (q) => q.requestId === a.requestId && q.professionalId === professionalId
      );
      return {
        ...a,
        request: req,
        hasSubmittedQuotation: Boolean(existingQuote),
        quotation: existingQuote,
      };
    });
  }

  // Professional accepts or declines assignment
  static respondToAssignment(
    assignmentId: string,
    professionalId: string,
    status: 'ACCEPTED' | 'DECLINED',
    declineReason?: string
  ) {
    const assignment = mockStore.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw { statusCode: 404, message: 'Assignment record not found.' };
    }

    if (assignment.professionalId !== professionalId) {
      throw { statusCode: 403, message: 'Unauthorized response to assignment.' };
    }

    assignment.status = status;
    if (status === 'DECLINED') {
      assignment.declineReason = declineReason;
    }

    const req = mockStore.requests.find((r) => r.id === assignment.requestId);
    if (req && status === 'ACCEPTED' && req.status === 'ASSIGNED') {
      req.status = 'QUOTATIONS_IN_PROGRESS';
    }

    return assignment;
  }
}
