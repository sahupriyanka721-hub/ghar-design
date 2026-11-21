# GharDesign - Indian Civil Construction, Architecture & Interior Design Marketplace

Welcome to **GharDesign**, a complete, database-driven, enterprise-grade web application tailored for the Indian residential construction, architecture, and interior design ecosystem.

GharDesign acts as a trusted, neutral intermediary connecting homeowners who want to construct a new house, renovate an existing home, draft architectural blueprints, or design turnkey interiors with **Council of Architecture (COA)** and **Institution of Engineers India (IEI)** certified associate professionals.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, React Hook Form, Lucide React, TanStack Query |
| **Backend** | Node.js, Express.js, TypeScript, REST API (`/api/v1`), Zod Request Validation, Centralized Error Handler |
| **Database** | PostgreSQL, Prisma ORM, Relational Foreign Keys, Unique Indexes, Seed Fixtures |
| **Authentication** | Mobile Number & OTP Verification, JWT Access Tokens, HttpOnly Cookies, Role-Based Access Control (RBAC) |
| **Payments** | Razorpay India Integration (Integer Paise, HMAC-SHA256 Signature Verification, Webhooks, Sandbox Mock Mode) |
| **Testing** | Vitest for Frontend Units, Supertest for Backend REST API Endpoints |

---

## 📂 Project Structure

```
ghar-design/
├── docker-compose.yml              # Local PostgreSQL 16 & pgAdmin services
├── package.json                    # Monorepo orchestrator with npm workspaces
├── .env.example                    # Comprehensive environment template
├── .gitignore
├── README.md
├── packages/
│   └── shared/                     # Shared validation schemas & TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/index.ts      # Roles, statuses, requests, quotations, payments
│           ├── schemas/index.ts    # Zod validation schemas
│           ├── constants/index.ts  # Service categories, budgets, default fee
│           └── index.ts
├── apps/
│   ├── api/                        # Express + Prisma Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Relational models, constraints, and indexes
│   │   │   └── seed.ts             # Development fixtures (Admin, 3 Pros, Customer, Sample Quotes)
│   │   ├── src/
│   │   │   ├── config/index.ts     # Safe environment parsing
│   │   │   ├── middleware/         # Auth, RBAC, Rate-limiting, Zod validate, Errors
│   │   │   ├── services/           # Business logic: Auth, Request, Quotation, Booking, Payment, Admin
│   │   │   ├── routes/             # Versioned REST API endpoints (/api/v1/...)
│   │   │   ├── app.ts              # Express factory with Helmet, CORS, and logging
│   │   │   ├── server.ts           # Server startup and health check
│   │   │   └── __tests__/          # Supertest API automated tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                        # React + Tailwind Frontend
│       ├── src/
│       │   ├── components/         # Header, Footer, Badge, Modal, Skeleton, DemoSwitcher
│       │   ├── context/            # AuthContext (OTP & Roles) & ToastContext
│       │   ├── lib/                # API client, INR currency formatter, Date helper
│       │   ├── pages/
│       │   │   ├── public/         # 19 Public pages (Home, About, 6 Service pages, FAQ, Login, Policies)
│       │   │   ├── customer/       # Customer Dashboard, 5-Step Request Wizard, Quotation Comparison, Bookings
│       │   │   ├── professional/   # Associate Workspace, Quotation Builder (BOQ), Submitted Quotes
│       │   │   └── admin/          # Control Center, Assignments, Quotation Review & Publishing, Settings
│       │   ├── App.tsx             # Route definitions
│       │   ├── main.tsx
│       │   └── index.css           # Design tokens, typography, custom scrollbars
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
```

---

## 🚀 Quick Start Guide (Beginner Friendly)

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- *(Optional)* **Docker Desktop** (if running PostgreSQL locally with Docker)

---

### 2. Installation
Open your terminal in `C:\Users\HP\.gemini\antigravity\scratch\ghar-design`:

```bash
# Install all monorepo dependencies across shared, api, and web
npm install
```

---

### 3. Environment Configuration
Copy `.env.example` to `.env` in the root and in `apps/api`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
```

---

### 4. Database Setup

#### Option A: Using Docker Compose (Recommended)
If you have Docker installed, start PostgreSQL and pgAdmin with a single command:
```bash
docker-compose up -d
```
Then run Prisma migrations and seed fixtures:
```bash
npm run db:migrate
npm run db:seed
```

#### Option B: Standalone / Instant Demo Mode
If PostgreSQL is not running on your machine, **GharDesign includes a built-in resilient in-memory fixture store**. The backend and frontend will run immediately without database errors, allowing full evaluation of all workflows!

---

### 5. Running the Application

You can start both frontend and backend concurrently with:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:api

# Terminal 2: Frontend Web (Port 5173)
npm run dev:web
```

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 👥 Demo Accounts & Role Switcher

For seamless testing and demonstration, GharDesign includes an **Interactive Persona Switcher** (floating widget at the bottom-left of the screen):

| Role | Name / Firm | Mobile | Capability |
| :--- | :--- | :--- | :--- |
| **Customer** | Vikram Malhotra | `9876543220` | Post project requests, pay ₹499 fee, compare published quotes, book services. |
| **Associate Architect** | Ar. Rajesh Sharma (*Sharma & Associates*) | `9876543211` | Accept assignments, build itemized Bill of Quantities (BOQs), submit quotes. |
| **Associate Structural Eng.** | Er. Amit Verma (*Verma Structurals*) | `9876543212` | Review structural RCC requirements, submit bar-bending & stability schedules. |
| **Administrator** | Platform Administrator | `9876543210` | Platform stats, assign requests to professionals, review & publish quotes. |

> 💡 **OTP Verification in Dev Mode**: Any requested OTP code can be verified using the test passcode: **`123456`**.

---

## 🔄 Complete Phase 1 Business Workflow

1. **Customer Submits Project Request**:
   - Navigate to `/dashboard/create-request`.
   - **Step 1**: Choose service category (*New House Construction*).
   - **Step 2**: Enter plot dimensions (e.g., 30 × 60 ft). Plot area auto-calculates to **1,800 sq.ft**.
   - **Step 3**: Select required engineering deliverables (2D layout, 3D elevation, RCC drawings, Civil construction).
   - **Step 4**: Enter budget range (₹50 Lakhs - ₹1 Crore), timeline, and vision.
   - **Step 5**: Review summary and click **Proceed to Pay ₹499**. The Razorpay modal confirms the quotation request fee and transitions the project to `SUBMITTED`.

2. **Administrator Reviews & Assigns Professionals**:
   - Switch role to **Admin** via the bottom-left switcher.
   - Go to `/admin/requests` → Click **Inspect & Assign**.
   - Select 2 or more vetted professionals (e.g. *Ar. Rajesh Sharma* and *Er. Amit Verma*), set a response deadline, and click **Dispatch Assignments**.

3. **Professionals Compile Itemized Quotations**:
   - Switch role to **Associate Architect**.
   - Go to `/professional/assigned` → Click **Build Quotation**.
   - Add itemized line items (2D plans, 3D renders, site visits) with quantity and unit rates.
   - The builder automatically computes **Subtotal**, **18% GST**, **Advance %**, and milestone schedules.
   - Click **Submit Quotation for Admin Review**.

4. **Administrator Reviews & Publishes**:
   - Switch role to **Admin** → Go to `/admin/quotations`.
   - The admin checks the proposal for hidden charges or omissions.
   - Click **Publish to Customer**.

5. **Customer Compares & Books**:
   - Switch role to **Customer** → Go to `/dashboard/requests/req-1001/quotations`.
   - The **Side-by-Side Comparison Matrix** displays the quotations with itemized BOQ tables, included deliverables, explicit exclusions, revisions count, and milestone schedules.
   - Click **Select Quotation & Confirm Booking**.
   - The system atomically confirms the booking, marks the chosen quote as `SELECTED`, closes competing quotes, and records the booking reference.

---

## 🧪 Automated Testing

Run the automated test suites with:

```bash
# Run backend API integration tests (Supertest + Vitest)
npm run test --workspace=@ghar-design/api

# Run frontend unit tests (Vitest)
npm run test --workspace=@ghar-design/web
```

---

## 🔒 Security & Quality Standards

- **Server-Side Authorization**: Enforced on all routes; customer endpoints strictly check resource ownership (`request.customerId === req.user.id`).
- **No Cheapest Recommendation**: Guarantees neutral presentation to prevent substandard construction bids.
- **Integer Paise Storage**: All financial records store currency in integer paise (e.g., ₹499 = 49900 paise) preventing floating-point rounding errors.
- **Concurrency & Idempotency Protection**: Duplicate booking attempts on the same project are rejected atomically.
- **Privacy First**: Customer contact numbers are kept confidential and not broadcast to suppliers.

---

## 📄 License & Attribution

Designed and engineered for **GharDesign Technologies India Pvt. Ltd.**
License: MIT
