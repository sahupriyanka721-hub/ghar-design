# BUILDGHAR – COMPLETE ADMIN PANEL DEVELOPMENT SPECIFICATION
## Centralized Admin Control System for Customer Panel and Architect Panel

---

## 1. MOST IMPORTANT BUSINESS RULE – CENTRALIZED ADMIN ROUTING
Every business action between Customer and Architect must be routed through the BuildGhar Admin system.
The Customer and Architect must not have an uncontrolled direct workflow with each other.
Admin acts as the central coordinator, reviewer, approval authority, communication controller, and payment manager.

### Required communication and action flow:
- `Customer → Admin → Architect`
- `Architect → Admin → Customer`

### Examples:
1. Customer submits a new quotation request → Admin receives it → Admin assigns it to an approved Architect.
2. Architect submits a quotation → Admin reviews it → Admin approves and forwards it to the Customer.
3. Customer accepts a quotation → Admin receives the acceptance → Admin verifies required conditions and initiates project creation.
4. Architect uploads a design → Admin receives it → Admin reviews it → Admin forwards it to the Customer.
5. Customer requests a design revision → Admin receives it → Admin forwards it to the Architect.
6. Architect submits revised design → Admin reviews it → Admin forwards it to the Customer.
7. Architect submits a milestone completion request → Admin receives it → Admin reviews evidence and initiates required approval process.
8. Customer submits milestone payment → Payment is received by BuildGhar platform's configured merchant/payment account → Admin verifies payment → Admin processes Architect's payout according to approved contract and milestone.

### Implementation Rules:
- Implement centralized server-side & reactive store workflows, not merely frontend redirects.
- Customer actions must create records in the Admin workflow/inbox.
- Admin must be able to review, approve, reject, forward, return, or request clarification.
- Architect actions must return to the Admin workflow for review.
- Customer and Architect must see only the information and actions authorized for their roles.
- Maintain a complete history of every action.
- No unauthorized direct approval, payment release, quotation modification, or project status change is allowed.
- Admin may configure safe automatic forwarding for selected routine actions, but system must still record Admin workflow event and preserve permissions and audit history.
- Do not allow direct customer-to-architect financial transactions or unmoderated business approvals.

---

## 2. TECHNOLOGY STACK
- Frontend: React.js, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Lucide React icons.
- Backend: Node.js, Express.js, TypeScript, PostgreSQL / Prisma ORM / Cloud Sync Relay.
- Core Features: Mobile OTP Authentication, Role-based Access Control (RBAC), Secure document and image uploads, Configurable payment gateway integration (Razorpay), Admin-managed bank transfer/payout workflow, PDF generation for quotations, invoices, receipts, and agreements.

---

## 3. ADMIN LOGIN AND SECURITY
- Admin Login Options: Email & Password, Mobile OTP, Forgot Password, Two-Factor Authentication.
- Admin Roles:
  1. Super Admin
  2. Operations Admin
  3. Quotation Manager
  4. Project Manager
  5. Finance Manager
  6. Document Verification Admin
  7. Customer Support Admin
  8. Read-Only Admin
- Permission-based access control.
- Sensitive Admin actions logged in Audit Trail.

---

## 4. ADMIN PANEL SIDEBAR (22 MODULES)
1. Dashboard / Overview
2. Customer Management (All Customers, Details, Verification, Activity, Requests, Complaints, Account Status)
3. Architect Management (All Architects, New Applications, Pending Verification, KYC, Business, Qualifications, Portfolio, Approved, Rejected, Suspended, Performance, Payment Details)
4. Quotation Request Management (New Requests, Pending Assignment, Assigned, Clarification, History, Cancelled)
5. Architect Assignment Management (Assign, Reassign, Multiple Assignment, History, Availability, Performance)
6. Quotation Management (Pending Architect Quotations, Under Review, Approved, Rejected, Revision Required, Sent to Customer, Customer Accepted, Customer Rejected, Expired, History)
7. Project Management (All Projects, New, Kickoff, Active, On-Hold, Delayed, Completed, Cancelled, Documents, Activity Timeline)
8. Design & Document Management (Submissions, Floor Plans, House Maps, 2D Drawings, 3D Designs, Elevations, Working Drawings, BOQ, Approval Requests, Revision Requests, Approved, Rejected, Version History)
9. Milestone & Work Progress Management (Project Milestones, Pending Submissions, Progress Verification, Customer Approval Pending, Admin Inspection, Approved, Rejected, Delayed, Payment Eligibility, Weighted Progress Calculation)
10. Payment Management (All Payments, Pending Verification, Successful, Failed, Refund Requests, Payment History, Reconciliation, Gateway Transactions)
11. Architect Payout Management (Pending Payouts, Eligible for Payout, Payout Approval, Process Bank Transfer/Payout, Successful Payouts, Failed, History, Earnings, Commission & Platform Fees, Reconciliation)
12. Invoice & Billing Management (Customer Invoices, Architect Invoices, Payment Receipts, Credit Notes, Refund Records, Tax Reports, Final Settlement)
13. Communication Management (Customer Messages, Architect Messages, Admin Review Inbox, Routed Messages, Clarification Requests, Internal Notes, History)
14. Complaint & Dispute Management (Customer Complaints, Architect Complaints, Payment Disputes, Project Disputes, Milestone Disputes, Resolution & Escalation)
15. Reports & Analytics (Customer, Architect, Quotation, Project, Milestone, Payment, Payout, Revenue, Commission, Performance, Date Filters, Export)
16. Notification Management (Customer, Architect, Admin Notifications, Email/SMS Templates, History)
17. CMS & Platform Content Management (Homepage, About Us, Contact, FAQ, Terms, Privacy, Refund Policy)
18. Service & Configuration Management (Service Categories, Subcategories, Pricing, Request Fee, Platform Commission, Milestone Templates)
19. Admin User & Role Management (Admin Users, Create Admin, Roles & Permissions, Activity Logs)
20. Platform Settings (General, Gateway, Payout, OTP, SMS/Email, Tax, Document, Security)
21. Audit Trail (Admin, Customer, Architect, Payment, Project Activity, Status Change History, Login History)
22. Logout

---

## 5. 10-PHASE IMPLEMENTATION PLAN
- **Phase 1**: Admin Authentication, RBAC Roles & Permissions, Professional Executive Dashboard (Section 3, 5, 19).
- **Phase 2**: Customer Directory & Architect Partner KYC Approval Workflow (Section 6, 7).
- **Phase 3**: Centralized Quotation Request Inbox, Architect Assignment & Quotation Review Workflow (Section 4, 5, 8).
- **Phase 4**: Centralized Project Creation, Shared Project ID (e.g. BG-2026-0001), Kickoff & Project Tracking (Section 9).
- **Phase 5**: Architectural Design & Technical Document Review Workflow (Floor Plans, 3D, CAD, Versioning, Forwarding) (Section 10).
- **Phase 6**: Milestone Lifecycle & Work Progress Management (Weighted Progress, Evidence Inspection, Customer Sign-off Routing) (Section 11).
- **Phase 7**: Customer Payment Collection, Platform Escrow, Architect Payout Workflow, Invoices & Financial Ledger (Section 10, 11, 12, 13, 16).
- **Phase 8**: Centralized Communication Router, In-Flight Clarifications, Complaints & Dispute Resolution (Section 13, 14, 15).
- **Phase 9**: Comprehensive Reports & Analytics, Notification Broadcasts, CMS & Platform Configuration, Audit Trail (Section 15, 16, 17, 18, 20, 21).
- **Phase 10**: End-to-End Multi-Panel Testing, Cross-Role Data Persistence & Zero-Error Production Build Verification (Section 24, 25).
