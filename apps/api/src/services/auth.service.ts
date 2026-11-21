import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { mockStore } from './store.js';
import { executeDb } from './db.js';
import { User, UserRole } from '@ghar-design/shared';
import { logger } from '../utils/logger.js';

export class AuthService {
  // Request OTP
  static async requestOtp(phone: string, name?: string, role: UserRole = 'CUSTOMER') {
    // Generate secure 6-digit numeric OTP
    let otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In development mode, use standard dev code if configured
    if (!config.isProduction && config.otp.devCode) {
      otp = config.otp.devCode;
    }

    const expiresAt = Date.now() + config.otp.expiryMinutes * 60 * 1000;
    mockStore.otpTokens.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    logger.info(`📱 OTP requested for phone ${phone}. [DEV OTP: ${otp}] Valid for ${config.otp.expiryMinutes} minutes.`);

    return {
      phone,
      expiresInSeconds: config.otp.expiryMinutes * 60,
      isDevelopmentMode: !config.isProduction,
      devOtpHint: !config.isProduction ? otp : undefined,
    };
  }

  // Verify OTP
  static async verifyOtp(phone: string, otp: string) {
    const tokenRecord = mockStore.otpTokens.get(phone);

    if (!tokenRecord) {
      throw { statusCode: 400, message: 'No OTP requested for this phone number. Please request a new OTP.' };
    }

    if (Date.now() > tokenRecord.expiresAt) {
      mockStore.otpTokens.delete(phone);
      throw { statusCode: 400, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (tokenRecord.attempts >= 3) {
      mockStore.otpTokens.delete(phone);
      throw { statusCode: 429, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    if (tokenRecord.otp !== otp) {
      tokenRecord.attempts += 1;
      throw { statusCode: 400, message: `Invalid OTP. ${3 - tokenRecord.attempts} attempts remaining.` };
    }

    // OTP verified successfully
    mockStore.otpTokens.delete(phone);

    // Find or create user via Prisma DB with safe fallback
    const { user, isNewUser } = await executeDb<any>(
      async (prisma) => {
        let dbUser = await prisma.user.findUnique({ where: { phone } });
        let isNew = false;
        if (!dbUser) {
          isNew = true;
          dbUser = await prisma.user.create({
            data: {
              phone,
              name: `User ${phone.slice(-4)}`,
              role: 'CUSTOMER',
              isActive: true,
            },
          });
          // Also create customer profile
          await prisma.customerProfile.create({
            data: { userId: dbUser.id },
          }).catch(() => {});
        }
        const mappedUser: any = {
          id: dbUser.id,
          phone: dbUser.phone,
          name: dbUser.name,
          email: dbUser.email || '',
          role: dbUser.role as UserRole,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        };
        // Keep mock store in sync
        const existingIdx = mockStore.users.findIndex((u) => u.phone === phone);
        if (existingIdx >= 0) {
          mockStore.users[existingIdx] = mappedUser;
        } else {
          mockStore.users.push(mappedUser);
        }
        return { user: mappedUser, isNewUser: isNew };
      },
      () => {
        let u = mockStore.users.find((u) => u.phone === phone);
        let isNew = false;
        if (!u) {
          isNew = true;
          u = {
            id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            phone,
            email: '',
            name: `User ${phone.slice(-4)}`,
            role: 'CUSTOMER',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          mockStore.users.push(u);
        }
        return { user: u, isNewUser: isNew };
      }
    );

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      user,
      token,
      isNewUser,
    };
  }

  // Quick switch demo user for testing without manual OTP typing
  static async demoLoginAs(role: UserRole) {
    let user = mockStore.users.find((u) => u.role === role);
    if (!user) {
      user = mockStore.users[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return { user, token };
  }
}
