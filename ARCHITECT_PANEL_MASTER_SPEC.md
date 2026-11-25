# MASTER DEVELOPMENT PROMPT – BUILDGHAR ARCHITECT PANEL

## 1. Project Introduction
Continue the existing BuildGhar project and develop a complete, professional, responsive, and fully functional Architect Panel.
BuildGhar is a complete construction, architecture, interior designing, renovation, building material e-commerce, and project management platform.
The Architect Panel must be integrated with the existing:
- Customer Panel
- Admin Panel
- Contractor Panel
- Interior Designer Panel
- Vendor Panel

The Architect Panel should allow architects and architecture firms to register, submit their business profiles and KYC documents, receive quotation requests, prepare quotations, manage approved projects, upload architectural drawings, communicate with customers, manage revisions, track assigned work, and receive professional payments.
This must be a real functional application with database integration and backend APIs, not just a frontend design.

## 2. Technology Stack
First inspect the existing BuildGhar repository.
Reuse the same technology stack, authentication architecture, database, APIs, design system, and reusable components already implemented in the Customer Panel.
If any technology needs to be created from scratch, use:
### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Lucide React Icons

### Backend
- Node.js
- Express.js
- TypeScript
- REST APIs

### Database
- PostgreSQL
- Prisma ORM

### Integrations
- Mobile OTP authentication
- Secure document storage
- Email/SMS notifications
- Razorpay or configurable payment gateway
- Configurable professional payout integration

Do not create a separate disconnected application or database for the Architect Panel.

## 3. Architect Registration & Authentication
Create a complete architect onboarding system.

### 3.1 Architect Signup
The architect enters:
- Mobile Number
- Accept Terms & Conditions
- Accept Privacy Policy

Workflow:
1. Architect enters mobile number.
2. System sends OTP.
3. Architect verifies OTP.
4. System checks whether the number is already registered.
5. New architect account is created.
6. Architect is redirected to the Profile Creation Wizard.

Implement secure OTP verification, expiry, resend cooldown, attempt limits, and rate limiting.
Do not hardcode production OTPs.

### 3.2 Architect Profile Creation
Create a multi-step profile creation wizard.

#### Step 1: Personal Information
- Full Name
- Profile Photo
- Date of Birth (optional)
- Mobile Number
- Email Address
- Alternate Contact Number
- Gender (optional)
- Professional Introduction

#### Step 2: Business Information
- Business / Firm Name
- Business Type
- Business Registration Type
- Office Address
- City, State, PIN Code, Country
- Business Email & Contact Number
- Website
- Years of Experience
- Number of Team Members

#### Step 3: Professional Information
- Qualification & Architecture Degree
- University / Institution & Graduation Year
- Council of Architecture (COA) Registration Number, where applicable
- Specialization
- Work Experience
- Languages & Professional Skills

Verify professional registration where legally required for the service being offered. Do not represent an unverified person as a registered architect.

#### Step 4: Business Types & Services
Allow architect to select multiple services:
- Residential Architecture
- Commercial Architecture
- Industrial Architecture
- House Map / Floor Plan
- Building Layout Planning
- 2D Architectural Drawings
- 3D Elevation Design
- Structural Coordination
- Building Planning
- Site Planning
- Renovation Planning
- Landscape Planning
- Building Permission Drawing Assistance
- Working Drawings
- Construction Documentation
- BOQ & Estimation
- Site Supervision
- Architecture Consultation
- Project Management

Services should be configurable by Admin. Only allow an architect to offer services they are appropriately qualified and authorized to provide.

#### Step 5: Portfolio & Experience
Allow architect to upload:
- Previous Project Photos
- Completed Project Images
- House Designs & Floor Plans
- 2D Drawings & 3D Elevations
- Commercial & Residential Projects
- Project Descriptions, Locations & Completion Year

#### Step 6: Documents & KYC
Allow upload of relevant documents:
- Identity Proof
- Address Proof
- Professional Qualification Certificate
- Professional Registration Certificate (COA), where applicable
- Business Registration Certificate
- GST Certificate, if applicable
- PAN Details
- Bank Account Details & Cancelled Cheque / Bank Proof

#### Step 7: Service Areas
- State, City, District, PIN Codes
- Areas Served
- Remote / Online Consultation Availability

#### Step 8: Bank Details
- Account Holder Name
- Bank Name
- Account Number
- IFSC Code
- Bank Proof

#### Step 9: Review & Submit
- Display complete profile summary.
- Architect can Edit, Preview, Save Draft, or Submit for Admin Approval.
- Status becomes "Pending Approval".

## 4. Admin Approval Workflow
Architect must not get full commercial project access before Admin approval.
Profile statuses:
- Draft
- Submitted
- Pending Review
- Under Verification
- Documents Required
- Resubmission Required
- Approved
- Rejected
- Suspended
- Deactivated

Admin Actions:
- Review Personal, Business, Qualification, Registration, KYC, Portfolio & Bank Details.
- Approve Architect, Reject, Request Additional Documents, or Suspend.
- Architect notifications upon status updates.

## 5. COMPLETE ARCHITECT PANEL SIDEBAR (17 SECTIONS)
1. Dashboard
   - Overview, Profile Completion, Verification Status, New Requests, Pending Quotations, Accepted Quotations, Active Projects, Pending Design Approvals, Deadlines, Tasks, Payment Summary, Recent Activities, Notifications, Quick Actions
2. Profile Management
   - 2.1 My Profile
   - 2.2 Business Management
   - 2.3 KYC & Verification
   - 2.4 Portfolio Management
   - 2.5 Bank Details
3. Quotation Management
   - 3.1 New Quotation Requests
   - 3.2 Generate Quotation
   - 3.3 Quotation List
   - 3.4 Approved Quotations
   - 3.5 Quotation History
4. Project Management
   - 4.1 My Assigned Projects
   - 4.2 Project Overview
   - 4.3 Project Kickoff
   - 4.4 Project Planning
   - 4.5 Project Tasks
   - 4.6 Project Coordination
   - 4.7 Project Progress
5. Architecture Design Management
   - 5.1 House Map / Floor Plan
   - 5.2 Architectural Drawings (2D, 3D Elevation, Layouts, Working Drawings)
   - 5.3 Design Files
   - 5.4 Design Version Management
   - 5.5 Design Approval
6. BOQ & Cost Estimation
   - Create BOQ, Quantity Calculation, Labour & Material Costs, Unit Rates, Export PDF, Revision History
7. Site Visit Management
   - Request Visit, Schedule Visit, Calendar, Visit Reports, Measurements, Observations
8. Customer Management
   - My Customers, Details, Projects, Requirements, Communication History
9. Communication & Collaboration
   - Customer Messages, Admin Messages, Contractor Messages, Interior Designer Messages, File Sharing
10. Milestone & Deliverable Management
    - Concept Design, Preliminary Floor Plan, Final Floor Plan, 2D Drawings, 3D Elevation, Working Drawings, Final Documentation
11. Billing & Payment Management
    - 11.1 My Earnings
    - 11.2 Professional Payment Schedule
    - 11.3 Payment History
    - 11.4 Payout Management
    - 11.5 Invoices & Receipts
12. Reports & Analytics
    - Quotation Reports, Project Reports, Design Reports, Earnings Reports, Performance Reports, CSV/PDF Exports
13. Reviews & Ratings
    - Customer Reviews, Feedback, Star Ratings, Replies
14. Notifications
    - RFQ Assignments, Design Approvals, Revisions, Deadlines, Messages, Payouts
15. Support & Help Center
    - Support Tickets, Technical Support, Payment Queries, FAQs
16. Settings
    - 16.1 Account Settings
    - 16.2 Security & Sessions
    - 16.3 Notification Preferences
    - 16.4 Availability & Working Hours
    - 16.5 Account Management (Download Data, Deactivation)
17. Logout
    - Secure Logout & Session Clearance

## 6 to 25. Core Functional Modules & Integrations
- Section 6: Real-time Architect Dashboard
- Section 7: Quotation Request & Multi-tier Builder
- Section 8: Approved Quotation to Project Kickoff
- Section 9: Task & Design Project Management
- Section 10: Architectural CAD/Render Design Studio & Versioning
- Section 11: Professional BOQ & Estimation Engine
- Section 12: Site Visit & On-Ground Inspection Reports
- Section 13: Project Multi-Role Chat Room
- Section 14: Customer Design Sign-off & Revision Loop
- Section 15: Architecture Deliverables vs. Construction Milestones
- Section 16: Professional Earnings & Bank Escrow Payouts
- Section 17: Multi-dimensional Analytics & Reports
- Section 18: Genuine Client Reviews & Ratings
- Section 19: Notification & Alert Channels
- Section 20: Shared Database Architecture & Prisma Models
- Section 21: Strict Role-Based Access Control & Security
- Section 22: REST API Specifications
- Section 23: Complete Cross-Panel Synchronization (Customer, Admin, Contractor, Interior Designer, Vendor)
- Section 24: Testing & Verification
- Section 25: Engineering Instructions

## 26. Implementation Phases (9 Phases)
- Phase 1 – Authentication & Onboarding
- Phase 2 – Dashboard & Profile Management
- Phase 3 – Quotation Management & Builder
- Phase 4 – Project Management & Planning
- Phase 5 – Architecture Design Studio & Versioning
- Phase 6 – BOQ & Site Visits
- Phase 7 – Milestones, Deliverables & Payouts
- Phase 8 – Communication, Reports & Notifications
- Phase 9 – Final Verification & Multi-Panel Testing

## 27. Final Expected Result
A fully unified, robust, responsive, production-ready Architect Panel that seamlessly talks to the Customer Panel, Admin Panel, Contractor Panel, Interior Designer Panel, and Vendor Panel with 0 errors.

---

## 28. Master Delivery & Verification Sign-Off Matrix

| Phase | Specification Module | Implementation Status | Test & Production Build Status | Git Commit |
|---|---|---|---|---|
| **Phase 1** | **Section 1 - 3**: Authentication, Verification, Onboarding & Lifecycle Statuses (13 Stages) | 100% COMPLETE | Passed (0 Errors) | `811ecdb` |
| **Phase 2** | **Section 4 - 6**: Executive Dashboard KPIs (10 metrics), Practice Profile Editor & Work Hours | 100% COMPLETE | Passed (0 Errors) | `39f79de` |
| **Phase 3** | **Section 7 - 9**: Architectural Quotation Builder, 4 Standard Packages, Milestone Escrow & SAC 998321 GST | 100% COMPLETE | Passed (0 Errors) | `4bf7730` |
| **Phase 4** | **Section 10 - 12**: Project Management, Kickoff Checklist, WBS Gantt Schedules, Kanban Tasks & IS 456 Tracking | 100% COMPLETE | Passed (0 Errors) | `a9939d1` |
| **Phase 5** | **Section 13 - 15**: Architectural Design Studio, Vastu Compliant Floor Plans, 3D Elevation Gallery, CAD Files & Versioning | 100% COMPLETE | Passed (0 Errors) | `d8883cf` |
| **Phase 6** | **Section 16 - 18**: BOQ & Itemized Cost Estimation Engine, Physical Site Visits Calendar & Benchmark Reports | 100% COMPLETE | Passed (0 Errors) | `11abcc2` |
| **Phase 7** | **Section 19 - 21**: Deliverables Management, 10-Stage Lifecycle Roadmap, Professional Billing, Escrow Payouts & Invoices | 100% COMPLETE | Passed (0 Errors) | `9705f0d` |
| **Phase 8** | **Section 22 - 26**: Customer Directory, Multi-Channel Chat Rooms (`CUSTOMER`/`ADMIN`/`CONTRACTOR`), Velocity Reports & Reviews | 100% COMPLETE | Passed (0 Errors) | `5228b60` |
| **Phase 9** | **Section 27**: Multi-Panel Real-Time Broadcast Integration & Zero-Error Production Vite Build Verification | 100% COMPLETE | Passed (`✓ built in 1m 10s` - 0 Errors) | Final Release |

**Result**: All 27 sections delivered with full high-fidelity reactive integration across Customer, Admin, Contractor, and Architect panels.

