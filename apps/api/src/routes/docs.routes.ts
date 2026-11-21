import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';

const router = Router();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GharDesign Marketplace REST API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API engine for India\'s premier Civil Construction, Engineering Planning & Building Materials Procurement Marketplace.\n\n### Authentication:\nAll protected routes expect a `Bearer <token>` HTTP Authorization header, or an authorized `token` HttpOnly session cookie.',
    contact: {
      name: 'GharDesign Engineering Team',
      email: 'engineering@ghardesign.in',
      url: 'https://ghar-design.vercel.app',
    },
    license: {
      name: 'Proprietary - All Rights Reserved',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.apiPrefix}`,
      description: 'Local Development Server',
    },
    {
      url: `https://ghar-design.vercel.app${config.apiPrefix}`,
      description: 'Production Edge Gateway',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'Mobile OTP authentication, JWT sessions & role switching' },
    { name: 'Project Requests (RFQs)', description: 'Multi-step construction & project inquiries' },
    { name: 'Professional Quotations', description: 'Itemized BOQ quotes, 2D/3D design charges & comparisons' },
    { name: 'Service Bookings', description: '10-stage construction tracking & milestone escrow' },
    { name: 'Payments & Escrow', description: 'Razorpay order creation, signature verification & webhooks' },
    { name: 'Materials Procurement', description: 'Civil supplies catalog, cart, COD & bulk truckloads' },
    { name: 'Cost & Material Calculator', description: 'Real-time IS 456 & CPWD construction cost engine, material BOQ bills & milestone escrow schedules' },
    { name: 'Administrator Desk', description: 'Inquiry assignment, quote vetting, vendor verification & stats' },
    { name: 'System & Health', description: 'Health check, uptime & database connectivity' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'System Health & Database Status',
        description: 'Returns real-time server uptime, current timestamp, and platform health.',
        responses: {
          200: {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                example: {
                  status: 'healthy',
                  platform: 'GharDesign API',
                  timestamp: '2026-10-22T08:00:00.000Z',
                  uptime: 1420.5,
                },
              },
            },
          },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        tags: ['Authentication'],
        summary: 'Request Mobile OTP',
        description: 'Dispatches a secure 6-digit verification code to the customer\'s Indian mobile number.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: {
                  phone: { type: 'string', example: '+91 9876543210' },
                  name: { type: 'string', example: 'Ramesh Sharma' },
                  role: { type: 'string', enum: ['CUSTOMER', 'PROFESSIONAL', 'VENDOR', 'ADMIN'], default: 'CUSTOMER' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP dispatched successfully' },
          400: { description: 'Invalid mobile number format' },
          429: { description: 'Rate limit exceeded (Too many OTP requests)' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP & Establish Session',
        description: 'Validates 6-digit OTP, creates customer profile if new, and sets authenticated JWT cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                  phone: { type: 'string', example: '+91 9876543210' },
                  otp: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful. Returns user profile & JWT token.' },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Authenticated User Profile',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Active user profile details' },
          401: { description: 'Unauthorized: missing or invalid authentication token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Terminate Session & Logout',
        responses: {
          200: { description: 'Logged out successfully. Cookie cleared.' },
        },
      },
    },
    '/requests': {
      post: {
        tags: ['Project Requests (RFQs)'],
        summary: 'Submit Multi-Step Project Request',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['categorySlug', 'propertyType', 'plotWidth', 'plotLength', 'measurementUnit', 'city'],
                properties: {
                  categorySlug: { type: 'string', example: 'new-house-construction' },
                  propertyType: { type: 'string', example: 'EMPTY_PLOT' },
                  plotWidth: { type: 'number', example: 30 },
                  plotLength: { type: 'number', example: 50 },
                  measurementUnit: { type: 'string', enum: ['FEET', 'METRES'], default: 'FEET' },
                  builtUpArea: { type: 'number', example: 2500 },
                  floors: { type: 'number', example: 2 },
                  bedrooms: { type: 'number', example: 4 },
                  budgetRange: { type: 'string', example: '₹30 Lakhs - ₹50 Lakhs' },
                  city: { type: 'string', example: 'Bhopal' },
                  state: { type: 'string', example: 'Madhya Pradesh' },
                  description: { type: 'string', example: 'Need modern G+1 Vastu-compliant duplex floor plan with 3D elevation.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Request created. Awaiting nominal quotation fee.' },
          400: { description: 'Validation error in request payload' },
        },
      },
      get: {
        tags: ['Project Requests (RFQs)'],
        summary: 'List Customer Requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of project requests owned by customer' },
        },
      },
    },
    '/requests/{id}': {
      get: {
        tags: ['Project Requests (RFQs)'],
        summary: 'Get Project Request by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Request details, assigned contractors count, and active status' },
          404: { description: 'Project request not found' },
        },
      },
    },
    '/requests/{id}/quotations': {
      get: {
        tags: ['Professional Quotations'],
        summary: 'Compare Received Quotations',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of approved quotations from competing contractors' },
        },
      },
    },
    '/quotations': {
      post: {
        tags: ['Professional Quotations'],
        summary: 'Submit Itemized Professional Quotation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId', 'scopeOfWork', 'finalAmountPaise', 'lineItems'],
                properties: {
                  requestId: { type: 'string', example: 'req-1001' },
                  scopeOfWork: { type: 'string', example: 'Complete 2D + 3D + Structural Sanction Package' },
                  finalAmountPaise: { type: 'number', example: 3540000 },
                  estimatedDurationDays: { type: 'number', example: 30 },
                  revisionsCount: { type: 'number', example: 3 },
                  lineItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        description: { type: 'string', example: '2D Working Layout' },
                        quantity: { type: 'number', example: 1 },
                        unit: { type: 'string', example: 'set' },
                        unitPricePaise: { type: 'number', example: 1000000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Quotation submitted to Admin for verification' },
        },
      },
    },
    '/payments/request-fee/order': {
      post: {
        tags: ['Payments & Escrow'],
        summary: 'Create Razorpay Order for Quotation Fee',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId'],
                properties: {
                  requestId: { type: 'string', example: 'req-1001' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Razorpay order created with order_id and amount' },
        },
      },
    },
    '/payments/verify': {
      post: {
        tags: ['Payments & Escrow'],
        summary: 'Verify Razorpay Payment Signature',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paymentId', 'razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'],
                properties: {
                  paymentId: { type: 'string', example: 'pay-123' },
                  razorpayOrderId: { type: 'string', example: 'order_NxABC123' },
                  razorpayPaymentId: { type: 'string', example: 'pay_NxXYZ789' },
                  razorpaySignature: { type: 'string', example: '9a8b7c6d...' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment verified and request status updated to SUBMITTED' },
        },
      },
    },
    '/admin/requests': {
      get: {
        tags: ['Administrator Desk'],
        summary: 'List All Platform Requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All customer requests with filtering support' },
        },
      },
    },
    '/admin/requests/{id}/assignments': {
      post: {
        tags: ['Administrator Desk'],
        summary: 'Assign Request to Multiple Contractors',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['professionalIds'],
                properties: {
                  professionalIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['usr-pro-1', 'usr-pro-2', 'usr-pro-3'],
                  },
                  responseDeadline: { type: 'string', example: '2026-11-15' },
                  internalNotes: { type: 'string', example: 'Verified structural load. Ready for BOQ bid.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Assigned to selected contractors successfully' },
        },
      },
    },
    '/calculator/config': {
      get: {
        tags: ['Cost & Material Calculator'],
        summary: 'Get Live Rate Cards, Packages & City Multipliers',
        description: 'Returns real-time regional rate cards, quality packages (Standard, Premium, Luxury), city inflation indexes, and IS 456 engineering material coefficients.',
        responses: {
          200: {
            description: 'Calculator configuration retrieved successfully',
          },
        },
      },
    },
    '/calculator/estimate': {
      post: {
        tags: ['Cost & Material Calculator'],
        summary: 'Dynamically Calculate Construction Cost & Material BOQ',
        description: 'Computes authentic project built-up area, CPWD stage breakdown, IS 456 material bills (cement, steel, sand, aggregate, bricks, tiles), and 7-stage milestone escrow schedule.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  projectMode: { type: 'string', enum: ['CONSTRUCTION', 'RENOVATION', 'INTERIOR'], default: 'CONSTRUCTION' },
                  plotLength: { type: 'number', example: 50 },
                  plotWidth: { type: 'number', example: 30 },
                  floors: { type: 'number', example: 2 },
                  groundCoveragePercent: { type: 'number', example: 80 },
                  packageId: { type: 'string', enum: ['standard', 'premium', 'luxury'], default: 'premium' },
                  cityName: { type: 'string', example: 'Delhi NCR (Gurugram / Noida)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Comprehensive construction calculation returned',
          },
        },
      },
    },
    '/calculator/save': {
      post: {
        tags: ['Cost & Material Calculator'],
        summary: 'Persist Estimate for Project RFQ Conversion',
        description: 'Caches the computed calculation and generates a reference ID ready for 1-click conversion to a multi-quote Request for Quotation.',
        responses: {
          201: { description: 'Estimate saved successfully' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token generated during OTP verification',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'Browser session cookie automatically set upon OTP verification',
      },
    },
  },
};

// 1. Raw OpenAPI JSON Endpoint
router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

// 2. Interactive Swagger UI HTML Interface
router.get('/', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GharDesign API Documentation | Swagger UI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d97706'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/></svg>">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .custom-header {
      background: #0a192f;
      color: #fff;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #d97706;
      box-shadow: 0 4px 12px rgba(10,25,47,0.15);
    }
    .brand-title {
      font-size: 1.35rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      text-decoration: none;
    }
    .brand-badge {
      background: rgba(217, 119, 6, 0.2);
      border: 1px solid #d97706;
      color: #fbbf24;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header-links a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      margin-left: 16px;
      transition: color 0.2s;
    }
    .header-links a:hover {
      color: #fbbf24;
    }
    .swagger-ui .topbar {
      display: none !important;
    }
    .swagger-ui .info {
      margin: 25px 0 15px 0 !important;
    }
    .swagger-ui .info .title {
      font-family: inherit;
      color: #0a192f;
    }
    .swagger-ui .scheme-container {
      background: #f1f5f9;
      box-shadow: none;
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <a href="/" class="brand-title">
      <span>🏗️ GharDesign</span>
      <span class="brand-badge">REST API 1.0</span>
    </a>
    <div class="header-links">
      <a href="/api/docs/openapi.json" target="_blank">📄 Raw OpenAPI JSON</a>
      <a href="http://localhost:5173" target="_blank">🌐 Public Web App</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: window.location.pathname.replace(/\\/$/, '') + '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list"
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
