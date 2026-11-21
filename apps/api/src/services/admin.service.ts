import { mockStore } from './store.js';

export class AdminService {
  static getDashboardStats() {
    const totalCustomers = mockStore.users.filter((u) => u.role === 'CUSTOMER').length;
    const totalProfessionals = mockStore.users.filter((u) => u.role === 'PROFESSIONAL').length;
    const pendingVerifications = mockStore.professionalProfiles.filter(
      (p) => (p.verificationStatus as string) === 'PENDING'
    ).length;

    const totalRequests = mockStore.requests.length;
    const newRequests = mockStore.requests.filter((r) => r.status === 'SUBMITTED').length;
    const underReviewRequests = mockStore.requests.filter((r) => r.status === 'UNDER_REVIEW').length;
    const awaitingAssignmentRequests = mockStore.requests.filter(
      (r) => r.status === 'AWAITING_ASSIGNMENT'
    ).length;
    const assignedRequests = mockStore.requests.filter((r) => r.status === 'ASSIGNED').length;

    const totalQuotations = mockStore.quotations.length;
    const quotationsAwaitingReview = mockStore.quotations.filter(
      (q) => q.status === 'UNDER_ADMIN_REVIEW'
    ).length;
    const publishedQuotations = mockStore.quotations.filter((q) => q.status === 'PUBLISHED').length;

    const confirmedBookings = mockStore.bookings.filter((b) => b.status === 'CONFIRMED').length;

    const successfulPayments = mockStore.payments.filter((p) => p.status === 'PAYMENT_SUCCESSFUL');
    const totalRevenuePaise = successfulPayments.reduce((acc, curr) => acc + curr.amountPaise, 0);

    return {
      totalCustomers,
      totalProfessionals,
      pendingVerifications,
      totalRequests,
      newRequests,
      underReviewRequests,
      awaitingAssignmentRequests,
      assignedRequests,
      totalQuotations,
      quotationsAwaitingReview,
      publishedQuotations,
      confirmedBookings,
      totalPaymentsCount: successfulPayments.length,
      totalRevenuePaise,
      totalRevenueRupees: totalRevenuePaise / 100,
    };
  }

  static getAllRequests() {
    return mockStore.requests.map((r) => {
      const cust = mockStore.users.find((u) => u.id === r.customerId);
      const asgs = mockStore.assignments.filter((a) => a.requestId === r.id);
      const quotes = mockStore.quotations.filter((q) => q.requestId === r.id);
      return {
        ...r,
        customerName: cust?.name || 'Customer',
        customerPhone: cust?.phone || '',
        assignedCount: asgs.length,
        quotationsCount: quotes.length,
      };
    });
  }

  static getAllQuotations() {
    return mockStore.quotations.map((q) => {
      const req = mockStore.requests.find((r) => r.id === q.requestId);
      return {
        ...q,
        requestCode: req?.requestCode,
        city: req?.city,
        propertyType: req?.propertyType,
      };
    });
  }

  static getAllProfessionals() {
    return mockStore.professionalProfiles.map((prof) => {
      const user = mockStore.users.find((u) => u.id === prof.userId);
      return {
        ...prof,
        name: user?.name,
        phone: user?.phone,
        email: user?.email,
      };
    });
  }
}
