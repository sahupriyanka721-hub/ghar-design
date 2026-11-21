import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GharDesign API Automated Test Suite', () => {
  let app: any;
  let customerToken: string;
  let adminToken: string;
  let proToken: string;

  beforeAll(async () => {
    app = createApp();

    // Authenticate demo users for testing
    const custRes = await request(app).post('/api/v1/auth/demo-login').send({ role: 'CUSTOMER' });
    customerToken = custRes.body.data.token;

    const adminRes = await request(app).post('/api/v1/auth/demo-login').send({ role: 'ADMIN' });
    adminToken = adminRes.body.data.token;

    const proRes = await request(app).post('/api/v1/auth/demo-login').send({ role: 'PROFESSIONAL' });
    proToken = proRes.body.data.token;
  });

  it('Health Check returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  describe('Interactive Swagger / OpenAPI 3.0 Documentation', () => {
    it('serves OpenAPI 3.0.3 specification JSON at /api/docs/openapi.json', async () => {
      const res = await request(app).get('/api/docs/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toContain('GharDesign');
      expect(res.body.paths).toHaveProperty('/auth/otp/request');
      expect(res.body.paths).toHaveProperty('/requests');
    });

    it('renders Swagger UI HTML dashboard at /api/docs', async () => {
      const res = await request(app).get('/api/docs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
      expect(res.text).toContain('GharDesign API Documentation');
    });
  });

  describe('Authentication Flow', () => {
    it('sends OTP for valid Indian mobile number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '9876543299', name: 'Test User' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('9876543299');
    });

    it('rejects invalid mobile numbers', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '12345' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('rejects wrong OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '9876543299', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('verifies correct OTP and returns user & session token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '9876543299', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('Security & Role Protection', () => {
    it('blocks unauthenticated requests to admin stats', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
    });

    it('blocks regular customers from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows admin to fetch platform stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRequests).toBeDefined();
    });
  });

  describe('Customer Project Request Flow', () => {
    let createdRequestId: string;

    it('validates and creates project request with calculated plot area', async () => {
      const payload = {
        categorySlug: 'new-house-construction',
        propertyType: 'EMPTY_PLOT',
        plotWidth: 25,
        plotLength: 50,
        measurementUnit: 'FEET',
        floors: 2,
        bedrooms: 3,
        bathrooms: 3,
        kitchens: 1,
        currentCondition: 'Level ground with road frontage',
        city: 'Jaipur',
        state: 'Rajasthan',
        locality: 'Mansarovar',
        ownershipConfirmed: true,
        requiredServices: ['2D Floor Plan', '3D Elevation & Walkthrough'],
        budgetRange: '₹30 Lakhs - ₹50 Lakhs',
        description: 'Need modern 3BHK duplex house design with Vastu guidelines.',
        termsAccepted: true,
      };

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plotArea).toBe(1250); // 25 * 50
      expect(res.body.data.status).toBe('AWAITING_PAYMENT');
      createdRequestId = res.body.data.id;
    });

    it('initiates nominal quotation request fee order (₹499)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/request-fee/order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ requestId: createdRequestId });

      expect(res.status).toBe(200);
      expect(res.body.data.amountPaise).toBe(49900); // 49900 paise = ₹499
    });
  });

  describe('Quotation Review & Booking Atomicity', () => {
    it('customer can fetch published quotations for comparison', async () => {
      const res = await request(app)
        .get('/api/v1/requests/req-1001/quotations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('customer selects quotation and atomically confirms booking', async () => {
      const res = await request(app)
        .post('/api/v1/quotations/qt-101/select')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ requestId: 'req-1001' });

      expect(res.status).toBe(200);
      expect(res.body.data.bookingCode).toBeDefined();
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('prevents duplicate booking on already confirmed project', async () => {
      const res = await request(app)
        .post('/api/v1/quotations/qt-102/select')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ requestId: 'req-1001' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already has a confirmed booking');
    });
  });
});
