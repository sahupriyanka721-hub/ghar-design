# 🏗️ GharDesign Backend REST API Engine

Production-grade, database-driven backend for India's premier Civil Construction, Architectural Planning & Building Materials Procurement Marketplace.

---

## 🌟 Architecture Overview

```
                      +---------------------------------------+
                      |      Web Client (React / Vite)        |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |  Express.js API Gateway (Port 5000)   |
                      |  Helmet + CORS + RateLimiter + Zod    |
                      +---------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             [ /api/v1 REST Endpoints ]            [ /api/docs Swagger UI ]
             - /auth (OTP & JWT)                   - Interactive API Console
             - /requests (Multi-Step RFQs)         - Raw OpenAPI 3.0 JSON
             - /quotations (BOQ Line Items)        - Try-it-out Playground
             - /payments (Razorpay Escrow)
             - /materials (Civil Supplies)
                        |
                        v
          +-------------------------------+
          |   Service Business Logic      |
          |   (Auth, Request, Payment)    |
          +-------------------------------+
                        |
                        v
         +---------------------------------+
         |     Prisma ORM Dual Engine      |
         +---------------------------------+
           /                             \
          v                               v
[ PostgreSQL Cloud / Local ]    [ In-Memory Fallback Store ]
(ACID-Compliant 24+ Models)      (Zero-crash development)
```

---

## 🚀 Quick Start Commands

### 1. Start Backend in Development Mode
```powershell
npm run dev --workspace=@ghar-design/api
```
* API Base URL: `http://localhost:5000/api/v1`
* **Interactive Swagger Documentation**: `http://localhost:5000/api/docs`

### 2. Run Automated API Tests (Vitest + Supertest)
```powershell
npm test --workspace=@ghar-design/api
```

### 3. PostgreSQL Database Migrations & Seeding
```powershell
# Generate Prisma Client types
npm run db:generate --workspace=@ghar-design/api

# Run database migrations against PostgreSQL
npm run db:migrate --workspace=@ghar-design/api

# Seed initial verified architects & platform settings
npm run db:seed --workspace=@ghar-design/api
```

---

## 📖 Interactive Swagger / OpenAPI Documentation

Visit: **`http://localhost:5000/api/docs`**

Features:
- Complete list of all 30+ endpoints with request/response schemas.
- Interactive **"Try it out"** button to execute live API calls.
- **Authorize** button with Bearer JWT Token support.
- Raw OpenAPI 3.0.3 Specification at `/api/docs/openapi.json`.

---

## 🗄️ Database Models (Prisma Schema - 24 Tables)

| Domain | Models / Tables |
|---|---|
| **Users & Profiles** | `User`, `CustomerProfile`, `CustomerAddress`, `ProfessionalProfile`, `ProfessionalVerificationDocument` |
| **Inquiries & RFQs** | `ServiceCategory`, `ProjectRequest`, `ProjectRequestService`, `ProjectAttachment`, `RequestAssignment` |
| **Architect Quotations**| `Quotation`, `QuotationRevision`, `QuotationLineItem`, `QuotationDocument` |
| **Bookings & Milestones**| `Booking`, `BookingMilestone`, `DesignApproval`, `ProjectMessage` |
| **Procurement & Store** | `MaterialCategory`, `MaterialProduct`, `MaterialProductVariant`, `MaterialOrder`, `MaterialOrderItem`, `Delivery` |
| **Billing & Audits** | `Payment`, `Invoice`, `InvoiceLineItem`, `FinalSettlement`, `SupportTicket`, `AuditLog`, `PlatformSetting` |

---

## 🔐 Environment Variables (.env)

```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
WEB_ORIGIN=http://localhost:5173

# Database Connection (Neon / Supabase / Local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/ghardesign?schema=public"

# Security Secrets
JWT_SECRET=dev-jwt-secret-ghar-design-secure-signing-key
SESSION_SECRET=dev-session-secret-ghar-design-key-32-chars

# Razorpay Payment Gateway (Optional Test Keys)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# SMS OTP Provider (Optional for Live Production SMS)
OTP_PROVIDER=mock
OTP_DEV_CODE=123456
```
