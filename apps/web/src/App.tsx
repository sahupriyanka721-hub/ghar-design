import { VendorLandingPage } from './pages/public/VendorLandingPage.js';
import { BuildGharLoader } from './components/common/BuildGharLoader.js';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { PublicLayout } from './components/layouts/PublicLayout.js';
import { DashboardLayout } from './components/layouts/DashboardLayout.js';
import { ProfessionalLayout } from './components/layouts/ProfessionalLayout.js';
import { AdminLayout } from './components/layouts/AdminLayout.js';

// Public Pages (All 19 Pages)
import { Home } from './pages/public/Home.js';
import { About } from './pages/public/About.js';
import { Services } from './pages/public/Services.js';
import { ServiceDetail } from './pages/public/ServiceDetail.js';
import { HowItWorks } from './pages/public/HowItWorks.js';
import { Professionals } from './pages/public/Professionals.js';
import { Contact } from './pages/public/Contact.js';
import { Faq } from './pages/public/Faq.js';
import { CostCalculator } from './pages/public/CostCalculator.js';
import { Login } from './pages/public/Login.js';
import { CustomerSignup } from './pages/customer/CustomerSignup.js';
import { Terms, Privacy, RefundPolicy } from './pages/public/LegalPages.js';
import { NotFound } from './pages/public/NotFound.js';
import { Unauthorized } from './pages/public/Unauthorized.js';

// Customer Panel Pages (All Modules & Submodules from Master Prompt)
import { CustomerOverview } from './pages/customer/CustomerOverview.js';
import { CreateRequestWizard } from './pages/customer/CreateRequestWizard.js';
import { MyRequests } from './pages/customer/MyRequests.js';
import { RequestDetail } from './pages/customer/RequestDetail.js';
import { MyQuotations } from './pages/customer/MyQuotations.js';
import { QuotationComparison } from './pages/customer/QuotationComparison.js';
import { QuotationDetail } from './pages/customer/QuotationDetail.js';
import { BookingConfirmation } from './pages/customer/BookingConfirmation.js';
import { BookServices } from './pages/customer/BookServices.js';
import { MyBookings } from './pages/customer/MyBookings.js';
import { TrackService } from './pages/customer/TrackService.js';
import { BuyMaterials } from './pages/customer/BuyMaterials.js';
import { MyPurchases } from './pages/customer/MyPurchases.js';
import { PaymentHistory } from './pages/customer/PaymentHistory.js';
import { Invoices } from './pages/customer/Invoices.js';
import { FinalSettlements } from './pages/customer/FinalSettlements.js';
import { ReportsAnalytics } from './pages/customer/ReportsAnalytics.js';
import { ProfileSettings } from './pages/customer/ProfileSettings.js';
import { AccountSecurity } from './pages/customer/AccountSecurity.js';
import { HelpSupportTickets } from './pages/customer/HelpSupportTickets.js';
import { NotificationsPage } from './pages/customer/NotificationsPage.js';
import { ProjectDocuments } from './pages/customer/ProjectDocuments.js';
import { DesignApprovals } from './pages/customer/DesignApprovals.js';
import { CustomerReviews } from './pages/customer/CustomerReviews.js';
import { ProjectsList } from './pages/customer/projects/ProjectsList.js';
import { ProjectKickoff } from './pages/customer/projects/ProjectKickoff.js';
import { ProjectWorkspace } from './pages/customer/projects/ProjectWorkspace.js';
import { ProjectPaymentsMilestones } from './pages/customer/ProjectPaymentsMilestones.js';
import { AcceptedQuotations } from './pages/customer/AcceptedQuotations.js';
import { SavedAddresses } from './pages/customer/SavedAddresses.js';
import { NotificationPreferences } from './pages/customer/NotificationPreferences.js';

// Associate Professional & Contractor Workspace Pages
import { ProfessionalOverview } from './pages/professional/ProfessionalOverview.js';
import { AssignedRequests } from './pages/professional/AssignedRequests.js';
import { ProfessionalRequestDetail } from './pages/professional/ProfessionalRequestDetail.js';
import { QuotationBuilder } from './pages/professional/QuotationBuilder.js';
import { MySubmittedQuotations } from './pages/professional/MySubmittedQuotations.js';
import { CustomerSelectedQuotations } from './pages/professional/CustomerSelectedQuotations.js';
import { ProfessionalBookings } from './pages/professional/ProfessionalBookings.js';
import { ProfessionalProjects } from './pages/professional/ProfessionalProjects.js';
import { ProfessionalCustomers } from './pages/professional/ProfessionalCustomers.js';
import { ProfessionalBilling } from './pages/professional/ProfessionalBilling.js';
import { ProfessionalReports } from './pages/professional/ProfessionalReports.js';
import { ProfessionalSupport } from './pages/professional/ProfessionalSupport.js';
import { ProfessionalSettings } from './pages/professional/ProfessionalSettings.js';
import { ProfessionalProfile } from './pages/professional/ProfessionalProfile.js';
import { ArchitectDesignStudio } from './pages/professional/ArchitectDesignStudio.js';
import { ArchitectBOQEstimator } from './pages/professional/ArchitectBOQEstimator.js';
import { ArchitectSiteVisits } from './pages/professional/ArchitectSiteVisits.js';
import { ArchitectDeliverables } from './pages/professional/ArchitectDeliverables.js';
import { ArchitectReviews } from './pages/professional/ArchitectReviews.js';
import { ArchitectMessages } from './pages/professional/ArchitectMessages.js';
import { ArchitectNotifications } from './pages/professional/ArchitectNotifications.js';

// Admin Control Center Pages
import { AdminOverview } from './pages/admin/AdminOverview.js';
import { AdminCustomers } from './pages/admin/AdminCustomers.js';
import { AdminMaterialOrders } from './pages/admin/AdminMaterialOrders.js';
import { AdminCategories } from './pages/admin/AdminCategories.js';
import { AdminRequests } from './pages/admin/AdminRequests.js';
import { AdminRequestDetail } from './pages/admin/AdminRequestDetail.js';
import { AdminQuotationsReview } from './pages/admin/AdminQuotationsReview.js';
import { AdminProfessionals } from './pages/admin/AdminProfessionals.js';
import { AdminBookings } from './pages/admin/AdminBookings.js';
import { AdminPayments } from './pages/admin/AdminPayments.js';
import { AdminReports } from './pages/admin/AdminReports.js';
import { AdminPlatformSettings } from './pages/admin/AdminPlatformSettings.js';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.js';
import { AdminVendors } from './pages/admin/AdminVendors.js';
import { AdminCostCalculator } from './pages/admin/AdminCostCalculator.js';
import { AdminAgreements } from './pages/admin/AdminAgreements.js';
import { AdminArchitects } from './pages/admin/AdminArchitects.js';
import { AdminContractors } from './pages/admin/AdminContractors.js';
import { AdminProjects } from './pages/admin/AdminProjects.js';
import { AdminSiteTimeline } from './pages/admin/AdminSiteTimeline.js';
import { AdminSupportTickets } from './pages/admin/AdminSupportTickets.js';
import { AdminCommunications } from './pages/admin/AdminCommunications.js';
import { AdminCoupons } from './pages/admin/AdminCoupons.js';
import { AdminLocations } from './pages/admin/AdminLocations.js';
import { AdminStaff } from './pages/admin/AdminStaff.js';
import { AdminAssignments } from './pages/admin/AdminAssignments.js';
import { AdminDocuments } from './pages/admin/AdminDocuments.js';
import { AdminPayouts } from './pages/admin/AdminPayouts.js';
import { AdminInvoices } from './pages/admin/AdminInvoices.js';
import { AdminNotifications } from './pages/admin/AdminNotifications.js';
import { AdminCMSContent } from './pages/admin/AdminCMSContent.js';
import { AdminServiceConfig } from './pages/admin/AdminServiceConfig.js';

// Architect Partner Portal Pages (Master Development Prompt)
import { ArchitectLandingPage } from './pages/public/ArchitectLandingPage.js';
import { ArchitectRegister } from './pages/architect/ArchitectRegister.js';
import { ArchitectLogin } from './pages/architect/ArchitectLogin.js';
import { ArchitectProfileWizard } from './pages/architect/ArchitectProfileWizard.js';
import { ArchitectApplicationStatus } from './pages/architect/ArchitectApplicationStatus.js';

// Interior Designer Partner Portal Pages (Master Development Prompt)
import { InteriorDesignerLandingPage } from './pages/public/InteriorDesignerLandingPage.js';
import { InteriorDesignerRegister } from './pages/interior-designer/InteriorDesignerRegister.js';
import { InteriorDesignerLogin } from './pages/interior-designer/InteriorDesignerLogin.js';
import { InteriorDesignerProfileWizard } from './pages/interior-designer/InteriorDesignerProfileWizard.js';
import { InteriorDesignerApplicationStatus } from './pages/interior-designer/InteriorDesignerApplicationStatus.js';
import { InteriorDesignerLayout } from './components/layouts/InteriorDesignerLayout.js';
import { InteriorDesignerOverview } from './pages/interior-designer/InteriorDesignerOverview.js';
import { InteriorDesignerQuotations } from './pages/interior-designer/InteriorDesignerQuotations.js';
import { InteriorDesignerBookings } from './pages/interior-designer/InteriorDesignerBookings.js';
import { InteriorDesignerProjects } from './pages/interior-designer/InteriorDesignerProjects.js';
import { InteriorDesignerDesignStudio } from './pages/interior-designer/InteriorDesignerDesignStudio.js';
import { InteriorDesignerBOQ } from './pages/interior-designer/InteriorDesignerBOQ.js';
import { InteriorDesignerSiteManagement } from './pages/interior-designer/InteriorDesignerSiteManagement.js';
import { InteriorDesignerExecution } from './pages/interior-designer/InteriorDesignerExecution.js';
import { InteriorDesignerMilestones } from './pages/interior-designer/InteriorDesignerMilestones.js';
import { InteriorDesignerClients } from './pages/interior-designer/InteriorDesignerClients.js';
import { InteriorDesignerTeam } from './pages/interior-designer/InteriorDesignerTeam.js';
import { InteriorDesignerBilling } from './pages/interior-designer/InteriorDesignerBilling.js';
import { InteriorDesignerReports } from './pages/interior-designer/InteriorDesignerReports.js';
import { InteriorDesignerReviews } from './pages/interior-designer/InteriorDesignerReviews.js';
import { InteriorDesignerSupport } from './pages/interior-designer/InteriorDesignerSupport.js';
import { InteriorDesignerMessages } from './pages/interior-designer/InteriorDesignerMessages.js';
import { InteriorDesignerNotifications } from './pages/interior-designer/InteriorDesignerNotifications.js';
import { InteriorDesignerSettings } from './pages/interior-designer/InteriorDesignerSettings.js';
import { AdminInteriorDesigners } from './pages/admin/AdminInteriorDesigners.js';

// Vendor Depot Workspace Pages
import { VendorLayout } from './components/layouts/VendorLayout.js';
import { VendorRegister } from './pages/vendor/VendorRegister.js';
import { VendorOverview } from './pages/vendor/VendorOverview.js';
import { VendorProfile } from './pages/vendor/VendorProfile.js';
import { VendorProducts } from './pages/vendor/VendorProducts.js';
import { VendorCategories } from './pages/vendor/VendorCategories.js';
import { VendorBrands } from './pages/vendor/VendorBrands.js';
import { VendorInventory } from './pages/vendor/VendorInventory.js';
import { VendorOrders } from './pages/vendor/VendorOrders.js';
import { VendorDelivery } from './pages/vendor/VendorDelivery.js';
import { VendorBilling } from './pages/vendor/VendorBilling.js';
import { VendorPayments } from './pages/vendor/VendorPayments.js';
import { VendorPromotions } from './pages/vendor/VendorPromotions.js';
import { VendorCustomers } from './pages/vendor/VendorCustomers.js';
import { VendorReports } from './pages/vendor/VendorReports.js';
import { VendorNotifications } from './pages/vendor/VendorNotifications.js';
import { VendorSupport } from './pages/vendor/VendorSupport.js';
import { VendorSettings } from './pages/vendor/VendorSettings.js';
import { VendorRequests } from './pages/vendor/VendorRequests.js';
import { VendorQuotations } from './pages/vendor/VendorQuotations.js';
import { getSubdomain } from './lib/subdomain.js';

export const App: React.FC = () => {
  const activeSubdomain = getSubdomain();

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <React.Suspense fallback={<BuildGharLoader fullScreen message="Loading BuildGhar Homes & Construction..." />}>
        <Routes>
        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              activeSubdomain === 'customer' ? (
                <Navigate to="/dashboard" replace />
              ) : activeSubdomain === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : activeSubdomain === 'vendor' ? (
                <Navigate to="/vendor" replace />
              ) : activeSubdomain === 'architect' ? (
                <Navigate to="/architect" replace />
              ) : activeSubdomain === 'interior' ? (
                <Navigate to="/interior-designer" replace />
              ) : (
                <Home />
              )
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/new-house-construction" element={<ServiceDetail serviceSlug="new-house-construction" />} />
          <Route path="/home-renovation" element={<ServiceDetail serviceSlug="home-renovation" />} />
          <Route path="/house-map-planning" element={<ServiceDetail serviceSlug="house-map-planning" />} />
          <Route path="/structural-engineering" element={<ServiceDetail serviceSlug="structural-engineering" />} />
          <Route path="/interior-designing" element={<ServiceDetail serviceSlug="interior-designing" />} />
          <Route path="/complete-construction-package" element={<ServiceDetail serviceSlug="complete-construction-package" />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/professionals" element={<Professionals />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/cost-calculator" element={<CostCalculator />} />
          <Route path="/calculator" element={<CostCalculator />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<CustomerSignup />} />
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
          <Route path="/admin-login" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/register" element={<Navigate to="/admin" replace />} />
          <Route path="/admin-register" element={<Navigate to="/admin" replace />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor-register" element={<VendorRegister />} />

          {/* Public Architect Landing Pages */}
          <Route path="/architect" element={<ArchitectLandingPage />} />
          <Route path="/architects" element={<ArchitectLandingPage />} />

          {/* Public Interior Designer Landing Pages */}
          <Route path="/interior-designer" element={<InteriorDesignerLandingPage />} />
          <Route path="/interior-designers" element={<InteriorDesignerLandingPage />} />
          <Route path="/interior-design" element={<InteriorDesignerLandingPage />} />

          {/* Public Vendor & Materials Supplier Landing Pages */}
          <Route path="/vendor-partner" element={<VendorLandingPage />} />
          <Route path="/vendor/partner" element={<VendorLandingPage />} />
          <Route path="/vendors" element={<VendorLandingPage />} />

          <Route path="/materials" element={<BuyMaterials />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cancellation-refund" element={<RefundPolicy />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* Customer Panel Dashboard (Sections 3 to 12) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* 1. Dashboard Overview */}
          <Route index element={<CustomerOverview />} />
          <Route path="calculator" element={<CostCalculator />} />
          <Route path="cost-calculator" element={<CostCalculator />} />

          {/* 2. Quotation Management */}
          <Route path="create-request" element={<CreateRequestWizard />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="requests/:id/quotations" element={<QuotationComparison />} />
          <Route path="quotations" element={<MyQuotations />} />
          <Route path="quotations/compare" element={<QuotationComparison />} />
          <Route path="quotations/compare/:id" element={<QuotationComparison />} />
          <Route path="quotations/:quoteId" element={<QuotationDetail />} />
          <Route path="accepted-quotations" element={<AcceptedQuotations />} />

          {/* 3. My Projects Hub (Spec Master Prompt) */}
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/kickoff" element={<ProjectKickoff />} />
          <Route path="projects/:projectId/kickoff" element={<ProjectKickoff />} />
          <Route path="projects/:projectId" element={<ProjectWorkspace />} />
          <Route path="projects/active" element={<ProjectWorkspace />} />
          <Route path="project-payments" element={<ProjectPaymentsMilestones />} />

          {/* 4. Booking Management */}
          <Route path="book-services" element={<BookServices />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="booking-confirmed" element={<BookingConfirmation />} />
          <Route path="track-service" element={<TrackService />} />
          <Route path="timeline" element={<TrackService />} />
          <Route path="project-timeline" element={<TrackService />} />

          {/* 5. Material Management */}
          <Route path="materials" element={<BuyMaterials />} />
          <Route path="materials/buy" element={<BuyMaterials />} />
          <Route path="material-purchases" element={<MyPurchases />} />
          <Route path="purchases" element={<MyPurchases />} />

          {/* 6. Billing & Payment Management */}
          <Route path="billing" element={<Invoices />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="final-settlements" element={<FinalSettlements />} />

          {/* 7. Reports & Analytics */}
          <Route path="reports" element={<ReportsAnalytics />} />

          {/* 8. Settings */}
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="addresses" element={<SavedAddresses />} />
          <Route path="saved-addresses" element={<SavedAddresses />} />
          <Route path="security" element={<AccountSecurity />} />
          <Route path="notification-preferences" element={<NotificationPreferences />} />

          {/* 9. Communication & Support */}
          <Route path="messages" element={<HelpSupportTickets initialTab="messages" />} />
          <Route path="help" element={<HelpSupportTickets />} />

          {/* 10. Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/preferences" element={<NotificationPreferences />} />

          {/* Additional Customer Modules */}
          <Route path="documents" element={<ProjectDocuments />} />
          <Route path="design-approvals" element={<DesignApprovals />} />
          <Route path="reviews" element={<CustomerReviews />} />
        </Route>

        {/* Associate Professional & Contractor Workspace (10 Core Modules) */}
        <Route path="/professional" element={<ProfessionalLayout />}>
          <Route index element={<ProfessionalOverview />} />
          <Route path="assigned" element={<AssignedRequests />} />
          <Route path="assigned/:id" element={<ProfessionalRequestDetail />} />
          <Route path="quotation-builder" element={<QuotationBuilder />} />
          <Route path="quotations" element={<MySubmittedQuotations />} />
          <Route path="quotations/:quoteId" element={<MySubmittedQuotations />} />
          <Route path="quotations/approved" element={<CustomerSelectedQuotations />} />
          <Route path="bookings" element={<ProfessionalBookings />} />
          <Route path="projects" element={<ProfessionalProjects />} />
          <Route path="timeline" element={<TrackService />} />
          <Route path="customers" element={<ProfessionalCustomers />} />
          <Route path="designs" element={<ArchitectDesignStudio />} />
          <Route path="boq" element={<ArchitectBOQEstimator />} />
          <Route path="site-visits" element={<ArchitectSiteVisits />} />
          <Route path="deliverables" element={<ArchitectDeliverables />} />
          <Route path="reviews" element={<ArchitectReviews />} />
          <Route path="messages" element={<ArchitectMessages />} />
          <Route path="notifications" element={<ArchitectNotifications />} />
          <Route path="billing" element={<ProfessionalBilling />} />
          <Route path="reports" element={<ProfessionalReports />} />
          <Route path="support" element={<ProfessionalSupport />} />
          <Route path="settings" element={<ProfessionalSettings />} />
          <Route path="profile" element={<ProfessionalProfile />} />
        </Route>

        {/* Architect Partner Portal Routes (Master Development Prompt) */}
        <Route path="/architect/register" element={<ArchitectRegister />} />
        <Route path="/architect-register" element={<ArchitectRegister />} />
        <Route path="/architect/login" element={<ArchitectLogin />} />
        <Route path="/architect-login" element={<ArchitectLogin />} />
        <Route path="/architect/profile-wizard" element={<ArchitectProfileWizard />} />
        <Route path="/architect/application-status" element={<ArchitectApplicationStatus />} />

        {/* Architect Workspace Aliases -> Professional Modules (Full 10-Key Alignment) */}
        <Route path="/architect/dashboard" element={<Navigate to="/professional" replace />} />
        <Route path="/architect/profile" element={<Navigate to="/professional/profile" replace />} />
        <Route path="/architect/assigned" element={<Navigate to="/professional/assigned" replace />} />
        <Route path="/architect/quotation-builder" element={<Navigate to="/professional/quotation-builder" replace />} />
        <Route path="/architect/quotations" element={<Navigate to="/professional/quotations" replace />} />
        <Route path="/architect/quotations/*" element={<Navigate to="/professional/quotations" replace />} />
        <Route path="/architect/bookings" element={<Navigate to="/professional/bookings" replace />} />
        <Route path="/architect/projects" element={<Navigate to="/professional/projects" replace />} />
        <Route path="/architect/customers" element={<Navigate to="/professional/customers" replace />} />
        <Route path="/architect/designs" element={<Navigate to="/professional/designs" replace />} />
        <Route path="/architect/boq" element={<Navigate to="/professional/boq" replace />} />
        <Route path="/architect/site-visits" element={<Navigate to="/professional/site-visits" replace />} />
        <Route path="/architect/deliverables" element={<Navigate to="/professional/deliverables" replace />} />
        <Route path="/architect/reviews" element={<Navigate to="/professional/reviews" replace />} />
        <Route path="/architect/messages" element={<Navigate to="/professional/messages" replace />} />
        <Route path="/architect/notifications" element={<Navigate to="/professional/notifications" replace />} />
        <Route path="/architect/billing" element={<Navigate to="/professional/billing" replace />} />
        <Route path="/architect/reports" element={<Navigate to="/professional/reports" replace />} />
        <Route path="/architect/support" element={<Navigate to="/professional/support" replace />} />
        <Route path="/architect/settings" element={<Navigate to="/professional/settings" replace />} />

        {/* Interior Designer Partner Onboarding & Auth */}
        <Route path="/interior-designer/register" element={<InteriorDesignerRegister />} />
        <Route path="/interior-designer-register" element={<InteriorDesignerRegister />} />
        <Route path="/interior-designer/login" element={<InteriorDesignerLogin />} />
        <Route path="/interior-designer-login" element={<InteriorDesignerLogin />} />
        <Route path="/interior-designer/profile-wizard" element={<InteriorDesignerProfileWizard />} />
        <Route path="/interior-designer/application-status" element={<InteriorDesignerApplicationStatus />} />

        {/* Interior Designer Operational Workspace (14 Master Modules) */}
        <Route path="/interior-designer" element={<InteriorDesignerLayout />}>
          <Route path="dashboard" element={<InteriorDesignerOverview />} />
          <Route path="quotations" element={<InteriorDesignerQuotations />} />
          <Route path="quotations/:quoteId" element={<InteriorDesignerQuotations />} />
          <Route path="requests" element={<InteriorDesignerQuotations />} />
          <Route path="assignments" element={<InteriorDesignerQuotations />} />
          <Route path="bookings" element={<InteriorDesignerBookings />} />
          <Route path="projects" element={<InteriorDesignerProjects />} />
          <Route path="projects/:projectId" element={<InteriorDesignerProjects />} />
          <Route path="designs" element={<InteriorDesignerDesignStudio />} />
          <Route path="design-center" element={<InteriorDesignerDesignStudio />} />
          <Route path="design-studio" element={<InteriorDesignerDesignStudio />} />
          <Route path="boq" element={<InteriorDesignerBOQ />} />
          <Route path="estimation" element={<InteriorDesignerBOQ />} />
          <Route path="site-management" element={<InteriorDesignerSiteManagement />} />
          <Route path="site-visits" element={<InteriorDesignerSiteManagement />} />
          <Route path="execution" element={<InteriorDesignerExecution />} />
          <Route path="coordination" element={<InteriorDesignerExecution />} />
          <Route path="milestones" element={<InteriorDesignerMilestones />} />
          <Route path="deliverables" element={<InteriorDesignerMilestones />} />
          <Route path="clients" element={<InteriorDesignerClients />} />
          <Route path="messages" element={<InteriorDesignerMessages />} />
          <Route path="communication" element={<InteriorDesignerMessages />} />
          <Route path="notifications" element={<InteriorDesignerNotifications />} />
          <Route path="team" element={<InteriorDesignerTeam />} />
          <Route path="billing" element={<InteriorDesignerBilling />} />
          <Route path="reports" element={<InteriorDesignerReports />} />
          <Route path="support" element={<InteriorDesignerSupport />} />
          <Route path="reviews" element={<InteriorDesignerReviews />} />
          <Route path="disputes" element={<InteriorDesignerSupport />} />
          <Route path="settings" element={<InteriorDesignerSettings />} />
        </Route>

        {/* Vendor Depot Control Workspace */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<VendorOverview />} />
          <Route path="login" element={<VendorOverview />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="categories" element={<VendorCategories />} />
          <Route path="brands" element={<VendorBrands />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="delivery" element={<VendorDelivery />} />
          <Route path="billing" element={<VendorBilling />} />
          <Route path="payments" element={<VendorPayments />} />
          <Route path="promotions" element={<VendorPromotions />} />
          <Route path="customers" element={<VendorCustomers />} />
          <Route path="reports" element={<VendorReports />} />
          <Route path="notifications" element={<VendorNotifications />} />
          <Route path="support" element={<VendorSupport />} />
          <Route path="settings" element={<VendorSettings />} />
          <Route path="requests" element={<VendorRequests />} />
          <Route path="quotations" element={<VendorQuotations />} />
        </Route>

        {/* Administrator Control Center */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="contractors" element={<AdminContractors />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="materials" element={<AdminMaterialOrders />} />
          <Route path="calculator" element={<AdminCostCalculator />} />
          <Route path="cost-calculator" element={<AdminCostCalculator />} />
          <Route path="categories" element={<AdminServiceConfig />} />
          <Route path="services-config" element={<AdminServiceConfig />} />
          <Route path="service-config" element={<AdminServiceConfig />} />
          <Route path="services" element={<AdminServiceConfig />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminRequestDetail />} />
          <Route path="quotations" element={<AdminQuotationsReview />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="timeline" element={<AdminSiteTimeline />} />
          <Route path="milestones" element={<AdminSiteTimeline />} />
          <Route path="agreements" element={<AdminAgreements />} />
          <Route path="contracts" element={<AdminAgreements />} />
          <Route path="professionals" element={<AdminProfessionals />} />
          <Route path="architects" element={<AdminArchitects />} />
          <Route path="interior-designers" element={<AdminInteriorDesigners />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="support" element={<AdminSupportTickets />} />
          <Route path="tickets" element={<AdminSupportTickets />} />
          <Route path="communications" element={<AdminCommunications />} />
          <Route path="broadcasts" element={<AdminCommunications />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="promotions" element={<AdminCoupons />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="coverage" element={<AdminLocations />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="admin-users" element={<AdminStaff />} />
          <Route path="roles" element={<AdminStaff />} />
          <Route path="rbac" element={<AdminStaff />} />
          <Route path="settings" element={<AdminPlatformSettings />} />
          <Route path="platform-settings" element={<AdminPlatformSettings />} />
          <Route path="global-settings" element={<AdminPlatformSettings />} />
          <Route path="cms" element={<AdminCMSContent />} />
          <Route path="content" element={<AdminCMSContent />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="audit-trail" element={<AdminAuditLogs />} />
          <Route path="activity-logs" element={<AdminAuditLogs />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* Direct Shortcuts for Homeowner Quotation Request */}
        <Route path="/create-request" element={<Navigate to="/dashboard/create-request" replace />} />
        <Route path="/request-quotation" element={<Navigate to="/dashboard/create-request" replace />} />
        <Route path="/customer/create-request" element={<Navigate to="/dashboard/create-request" replace />} />
        <Route path="/quotation-request" element={<Navigate to="/dashboard/create-request" replace />} />
        <Route path="/requests" element={<Navigate to="/dashboard/requests" replace />} />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </ReactLenis>
  );
};
