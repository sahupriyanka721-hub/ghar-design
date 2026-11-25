# MASTER DEVELOPMENT PROMPT – BUILDGHAR CUSTOMER PANEL

## 1. Project Introduction
I am developing a complete construction, architecture, interior designing, renovation, and building material management platform named BuildGhar.
Now I want you to develop a complete, professional, modern, responsive, and fully functional Customer Panel for BuildGhar.
This is not just a quotation-request website. It is a complete customer management and project execution system where customers can:
- Request quotations for new house construction, renovation, architecture, and interior designing.
- Receive and compare quotations from multiple architects, contractors, and interior designers.
- Approve a quotation and book the selected professional.
- Start construction or renovation work.
- Track project progress and completion percentage.
- View daily site reports, photographs, videos, and work updates.
- Approve project milestones.
- Make payments according to the approved contract and milestone schedule.
- Purchase construction and interior materials through an integrated e-commerce store.
- Track material orders and deliveries.
- Manage architectural drawings, interior designs, documents, invoices, and communication.
Develop this as a real working application, not merely a static UI design.

## 2. Technology Stack
Frontend:
- React.js with TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod validation
- Lucide React icons

Backend:
- Node.js
- Express.js
- TypeScript
- REST APIs
Database:
- PostgreSQL
- Prisma ORM

Other Integrations:
- Mobile OTP authentication through a configurable SMS provider
- Razorpay payment gateway or configurable payment gateway
- Secure file and document storage
- Email/SMS/WhatsApp notification integration where configured
Use environment variables for all secrets and API credentials.

## 3. Customer Panel Design Requirements
Create a premium and professional dashboard design.
Design Style:
- Modern construction and real estate SaaS dashboard.
- Clean and professional user interface.
- White/light background.
- Dark navy or charcoal sidebar.
- Professional blue and green accent colors.
- Proper spacing and typography.
- Rounded cards and subtle shadows.
- Consistent icons.
- Responsive tables and forms.
- Desktop, tablet, and mobile compatibility.

Main Layout:
- Left sidebar navigation.
- Top navigation bar.
- Main content area.
- Notification icon.
- Customer profile dropdown.
- Breadcrumb navigation.
- Responsive mobile sidebar.
- The sidebar must support expandable and collapsible submenu items.
- Use proper icons for every sidebar item.
- Do not overcrowd the interface. Organize all sections with clear headings and submenus.

## 4. COMPLETE CUSTOMER PANEL SIDEBAR
1. Dashboard
- Overview
- My Active Projects
- Pending Quotations
- Upcoming Site Visits
- Pending Approvals
- Pending Payments
- Recent Activities
- Notifications
- Quick Actions

2. Quotation Management
2.1 Get New Quotation
- Architecture Services
- House Map / Floor Plan
- Structural Design
- New House Construction
- Home Renovation
- Interior Designing
- 2D / 3D Design
- Civil Engineering
- Site Supervision
- Project Management
- BOQ & Cost Estimation
2.2 My Quotations
- All Quotations
- Pending Quotations
- Received Quotations
- Under Review
- Approved Quotations
- Rejected Quotations
- Expired Quotations
2.3 Compare Quotations
- Compare Professionals
- Compare Prices
- Compare Scope of Work
- Compare Project Duration
- Compare Materials
- Compare Payment Terms
2.4 Quotation History
- Previous Requests
- Request Details
- Download Quotation

3. My Projects
3.1 All Projects
- Active Projects
- Upcoming Projects
- Completed Projects
- Cancelled Projects
3.2 Project Kickoff
- Start Work Request
- Contractor Assignment
- Work Start Confirmation
- Site Readiness
- Project Agreement
- Advance Payment Status
3.3 Project Overview
- Project Information
- Customer Requirements
- Assigned Contractor
- Assigned Architect
- Assigned Interior Designer
- Project Budget
- Project Start Date
- Expected Completion Date
- Project Status
3.4 Work Plan & Timeline
- Project Work Plan
- Construction Stages
- Task Schedule
- Project Timeline
- Expected Completion Dates
- Delayed Tasks
3.5 Work Progress Tracking
- Overall Completion Percentage
- Stage-wise Progress
- Task-wise Progress
- Contractor Progress Updates
- Customer Verified Progress
- Progress History
- Progress Graph
- Before & After Photos
3.6 Daily Site Reports
- Daily Work Reports
- Site Photographs
- Site Videos
- Labour Reports
- Material Consumption Reports
- Contractor Remarks
- Customer Feedback
3.7 Task Management
- Upcoming Tasks
- In Progress Tasks
- Completed Tasks
- Delayed Tasks
- Task Details
3.8 Milestone Management
- Upcoming Milestones
- Submitted Milestones
- Pending Approval
- Approved Milestones
- Rejected / Correction Requested
- Completed Milestones
3.9 Design & Work Approvals
- Pending Approvals
- Approved Designs
- Design Revision Requests
- Work Approval Requests
- Material Approval Requests
3.10 Issues & Complaints
- Raise New Issue
- Report Work Quality Issue
- Report Delay
- Track Complaint
- Dispute Management
- Resolution History
3.11 Project Documents
- Project Agreement
- Approved Quotations
- Architectural Drawings
- Structural Drawings
- Interior Designs
- BOQ Documents
- Site Reports
- Invoices
- Other Documents
3.12 Final Inspection & Handover
- Final Inspection Request
- Inspection Reports
- Pending Work / Snag List
- Defect Correction
- Final Approval
- Handover Documents
- Project Completion Certificate
- Warranty Information

4. Project Payments & Milestones
4.1 Payment Schedule
- Total Contract Amount
- Advance Payment
- Stage-wise Payment Schedule
- Milestone-wise Payment
- Final Payment
- Retention Amount
4.2 Pending Milestone Approvals
- Milestone Submitted by Contractor
- Evidence Review
- Approve Milestone
- Request Correction
- Raise Dispute
4.3 Payments Due
- Upcoming Payments
- Approved Payments
- Pending Payments
- Overdue Payments
4.4 Payment History
- Successful Payments
- Failed Payments
- Refunds
- Payment Receipts
- Transaction Details
4.5 Contractor Payout Status
- Approved Contractor Payouts
- Payout Processing
- Completed Payouts
- Failed Payouts
4.6 Final Settlement
- Final Project Bill
- Outstanding Amount
- Retention Release
- Final Payment Approval
- Settlement Statement

5. Booking Management
5.1 Book Services
- Architecture Services
- Interior Designing
- Construction Services
- Renovation Services
- Site Inspection
- Civil Engineering Consultation
- Site Supervision
5.2 Booking List
- All Bookings
- Upcoming Bookings
- Confirmed Bookings
- Completed Bookings
- Cancelled Bookings
5.3 Site Visits & Appointments
- Request Site Visit
- Schedule Appointment
- Reschedule Appointment
- Appointment History
5.4 Professional Details
- Assigned Professionals
- Professional Profiles
- Contact Details
- Service History

6. Material Management
6.1 Buy Materials
- All Products
- Cement, Sand, Bricks & Blocks, TMT Steel, Aggregates, Concrete
- Plumbing, Electrical, Tiles & Flooring, Paints & Waterproofing
- Plywood & Laminates, Doors & Windows, Hardware & Fittings
- Lighting, Bathroom Fittings, Kitchen Materials, Furniture, Interior Products
6.2 Shopping Cart
- Cart Items, Update Quantity, Remove Products, Apply Coupon, Price Summary
6.3 Checkout
- Select Delivery Address, Add New Address, Delivery Charges, Taxes, Order Summary, Payment Method
6.4 My Purchase
- All Orders, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Returned
6.5 Delivery Tracking
- Order Tracking, Dispatch Details, Transport Details, Expected Delivery, Delivery Confirmation
6.6 Return & Refund
- Request Cancellation, Return Request, Refund Status, Return History
6.7 Saved Products
- Wishlist, Recently Viewed Products

7. Design & Documents
7.1 Architectural Design (House Map, Floor Plans, 2D Drawings, 3D Elevation, Structural Drawings, Approved Drawings)
7.2 Interior Design (Interior Layout, 2D/3D Design, Room-wise Designs, Furniture Layout, Material Selection)
7.3 Design Approval (Pending Designs, Approve Design, Request Revision, Approved Designs, Revision History)
7.4 Documents (My Documents, Download/Upload Documents, Agreements, BOQ, Estimates)

8. Billing & Payments
- My Payments, Service Payments, Material Purchase Payments, Invoices, Tax Invoices, Payment Receipts, Refund Management, Outstanding Dues, Credit Notes, Download Statements

9. Communication & Support
- Messages (Admin, Contractor, Architect, Interior Designer, Vendor)
- Support (Raise Support Ticket, My Tickets, Ticket Status, Support History)
- Complaints & Disputes (Register Complaint, Project Dispute, Payment Dispute, Material Order Complaint, Resolution Status)
- Help Center (FAQs, Help Articles, Contact Support)

10. Reports & Analytics
- Project Progress Reports, Project Expense Reports, Payment Reports, Material Purchase Reports, Contractor Work Reports, Project Completion Reports, Download Reports, Monthly Summary

11. Notifications
- All Notifications, Preferences, In-app alerts

12. Settings
- Profile Settings (Personal Info, Photo)
- Address Management (Home, Office, Project Site, Saved Delivery)
- Account Security (Mobile OTP, Sessions, Recovery)
- Preferences (Language, Notifications, Privacy)
- Account Management (Download Data, Deactivation)

13. Logout

## 5 to 22. Detailed Workflows, Security, Testing & Implementation Phases
(See full prompt specification)
