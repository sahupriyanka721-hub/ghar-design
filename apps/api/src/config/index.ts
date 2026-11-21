import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',

  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-ghar-design-key-32-chars',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-ghar-design-secure-signing-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  otp: {
    provider: process.env.OTP_PROVIDER || 'mock',
    apiKey: process.env.OTP_PROVIDER_API_KEY || '',
    senderId: process.env.OTP_PROVIDER_SENDER_ID || 'GHRDSG',
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    devCode: process.env.OTP_DEV_CODE || '123456',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || '',
    bucket: process.env.OBJECT_STORAGE_BUCKET || 'ghardesign-documents',
  },

  platform: {
    name: 'GharDesign',
    defaultCurrency: 'INR',
    defaultRequestFeePaise: parseInt(process.env.PLATFORM_DEFAULT_REQUEST_FEE_PAISE || '49900', 10), // ₹499
    gstPercent: parseInt(process.env.PLATFORM_GST_PERCENT || '18', 10),
  },
};
