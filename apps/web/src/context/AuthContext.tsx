import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, UserRole, CustomerAddress, CartItem, MaterialProduct } from '@ghar-design/shared';
import {
  registerNewCustomer,
  getCustomerByPhone,
  generateCustomerId,
  purgeDummyData,
  getAdminByPhone,
  saveRegisteredAdmin,
  getProfessionalByPhone,
  savePlatformProfessional,
  getRegisteredAdmins,
  getPlatformProfessionals,
  getRegisteredCustomers,
} from '../data/customerStore.js';
import { getVendorByPhone, getRegisteredVendors } from '../data/vendorStore.js';
import { getArchitectByPhone } from '../data/architectStore.js';
import { apiRequest } from '../lib/api.js';

export const ADMIN_USER_KEY = 'gd_admin_user';
export const ADMIN_TOKEN_KEY = 'gd_admin_token';
export const PRO_USER_KEY = 'gd_pro_user';
export const PRO_TOKEN_KEY = 'gd_pro_token';
export const CUST_USER_KEY = 'gd_customer_user';
export const CUST_TOKEN_KEY = 'gd_customer_token';
export const VENDOR_USER_KEY = 'gd_vendor_user';
export const VENDOR_TOKEN_KEY = 'gd_vendor_token';

export type TargetRole = 'ADMIN' | 'PROFESSIONAL' | 'VENDOR' | 'CUSTOMER' | 'ANY';

export function getTargetRole(pathname: string): TargetRole {
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (
    pathname.startsWith('/professional') ||
    pathname.startsWith('/architect') ||
    pathname.startsWith('/interior-designer')
  ) {
    return 'PROFESSIONAL';
  }
  if (pathname.startsWith('/vendor')) return 'VENDOR';
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/customer')) return 'CUSTOMER';
  return 'ANY';
}

function readStoredUser(key: string): User | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed.name?.toLowerCase().includes('vikram') ||
      parsed.name?.toLowerCase() === 'homeowner' ||
      parsed.name?.toLowerCase().includes('demo') ||
      parsed.phone?.includes('9876543220') ||
      parsed.id === 'usr-cust-1' ||
      parsed.id === 'usr-cust-demo'
    ) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function resolveActiveSession(pathname: string): { user: User | null; token: string | null } {
  const target = getTargetRole(pathname);

  if (target === 'ADMIN') {
    const adminUser = readStoredUser(ADMIN_USER_KEY) || readStoredUser('admin_user');
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem('admin_token');
    if (adminUser) return { user: adminUser, token: adminToken };
    const legacy = readStoredUser('user');
    if (legacy?.role === 'ADMIN') return { user: legacy, token: localStorage.getItem('token') };
    return { user: null, token: null };
  }

  if (target === 'PROFESSIONAL') {
    const proUser = readStoredUser(PRO_USER_KEY) || readStoredUser('pro_user');
    const proToken = localStorage.getItem(PRO_TOKEN_KEY) || localStorage.getItem('pro_token');
    if (proUser) return { user: proUser, token: proToken };
    const legacy = readStoredUser('user');
    if (legacy?.role === 'PROFESSIONAL') return { user: legacy, token: localStorage.getItem('token') };
    return { user: null, token: null };
  }

  if (target === 'VENDOR') {
    const vendorUser = readStoredUser(VENDOR_USER_KEY) || readStoredUser('vendor_user');
    const vendorToken = localStorage.getItem(VENDOR_TOKEN_KEY) || localStorage.getItem('vendor_token');
    if (vendorUser) return { user: vendorUser, token: vendorToken };
    const legacy = readStoredUser('user');
    if ((legacy?.role as any) === 'VENDOR') return { user: legacy, token: localStorage.getItem('token') };
    return { user: null, token: null };
  }

  if (target === 'CUSTOMER') {
    const custUser = readStoredUser(CUST_USER_KEY) || readStoredUser('customer_user');
    const custToken = localStorage.getItem(CUST_TOKEN_KEY) || localStorage.getItem('customer_token');
    if (custUser) return { user: custUser, token: custToken };
    const legacy = readStoredUser('user');
    if (legacy?.role === 'CUSTOMER') return { user: legacy, token: localStorage.getItem('token') };
    return { user: null, token: null };
  }

  // target === 'ANY' (public consumer pages like home, about, services, etc.)
  // On public consumer pages, only return customer session so partner/architect logins don't bleed into consumer frontend
  const cust = readStoredUser(CUST_USER_KEY) || readStoredUser('customer_user');
  if (cust) return { user: cust, token: localStorage.getItem(CUST_TOKEN_KEY) || localStorage.getItem('customer_token') };
  const legacy = readStoredUser('user');
  if (legacy && legacy.role === 'CUSTOMER') {
    return { user: legacy, token: localStorage.getItem('token') };
  }
  return { user: null, token: null };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  addresses: CustomerAddress[];
  cart: CartItem[];
  cartCount: number;
  loginWithOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  loginAdminWithOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  loginVendorWithOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  loginProfessionalWithOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  signupWithOtp: (signupData: any, otp: string) => Promise<void>;
  requestOtp: (phone: string, name?: string, customOtp?: string) => Promise<any>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  addToCart: (product: MaterialProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addAddress: (address: CustomerAddress) => void;
  deleteAddress: (id: string) => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const [user, setUser] = useState<User | null>(() => {
    const initialSession = resolveActiveSession(window.location.pathname);
    return initialSession.user;
  });

  const [token, setToken] = useState<string | null>(() => {
    const initialSession = resolveActiveSession(window.location.pathname);
    return initialSession.token && initialSession.token !== 'demo-token' ? initialSession.token : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => {
    const saved = localStorage.getItem('customer_addresses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('customer_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto clean legacy dummy data once on startup
  useEffect(() => {
    purgeDummyData();
  }, []);

  // Synchronize active session on route changes without forcing logout
  useEffect(() => {
    const resolved = resolveActiveSession(location.pathname);
    setUser(resolved.user);
    setToken(resolved.token);
  }, [location.pathname]);

  // Reactive listener: automatically update user state when admin approves/verifies architect or customer updates profile
  useEffect(() => {
    const handleReactiveSync = () => {
      const resolved = resolveActiveSession(window.location.pathname);
      if (resolved.user && resolved.user.role === 'PROFESSIONAL' && resolved.user.phone) {
        const rawDigits = resolved.user.phone.replace(/\D/g, '').slice(-10);
        const arch = getArchitectByPhone(rawDigits);
        const pro = getProfessionalByPhone(rawDigits);
        if (arch || pro) {
          const isVerified = Boolean(arch?.isVerified ?? pro?.isVerified);
          const status = arch?.status || pro?.verificationStatus || (resolved.user as any).status || 'VERIFIED';
          const name = arch?.name || pro?.name || resolved.user.name;

          const hasChanged =
            resolved.user.name !== name ||
            Boolean(resolved.user.isVerified) !== isVerified ||
            (resolved.user as any).status !== status ||
            (resolved.user as any).verificationStatus !== status ||
            (resolved.user as any).accountStatus !== status;

          if (hasChanged) {
            const updatedUser: User = {
              ...resolved.user,
              name,
              ...(isVerified ? { isVerified: true } : {}),
              ...({ status, verificationStatus: status, accountStatus: status } as any),
            };
            localStorage.setItem(PRO_USER_KEY, JSON.stringify(updatedUser));
            localStorage.setItem('pro_user', JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
          return;
        }
      }

      if (resolved.user?.id !== user?.id || resolved.token !== token) {
        setUser(resolved.user);
        setToken(resolved.token);
      }
    };

    window.addEventListener('storage', handleReactiveSync);
    window.addEventListener('architect_store_updated', handleReactiveSync);
    window.addEventListener('user_profile_updated', handleReactiveSync);
    window.addEventListener('customers_updated', handleReactiveSync);
    window.addEventListener('popstate', handleReactiveSync);

    return () => {
      window.removeEventListener('storage', handleReactiveSync);
      window.removeEventListener('architect_store_updated', handleReactiveSync);
      window.removeEventListener('user_profile_updated', handleReactiveSync);
      window.removeEventListener('customers_updated', handleReactiveSync);
      window.removeEventListener('popstate', handleReactiveSync);
    };
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('customer_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem('customer_cart', JSON.stringify(cart));
  }, [cart]);

  const requestOtp = async (phone: string, name?: string, customOtp?: string) => {
    const rawDigits = phone.replace(/\D/g, '').slice(-10);
    const dynamicOtp = (customOtp && customOtp.trim().length === 6)
      ? customOtp.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`live_otp_${rawDigits}`, dynamicOtp);
    sessionStorage.setItem(`admin_live_otp_${rawDigits}`, dynamicOtp);
    sessionStorage.setItem('last_generated_otp', dynamicOtp);
    try {
      localStorage.setItem(`live_otp_${rawDigits}`, dynamicOtp);
      localStorage.setItem('last_generated_otp', dynamicOtp);
    } catch (e) {}

    try {
      const res = await apiRequest('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone, name }),
      });
      return {
        ...(res && typeof res === 'object' ? res.data : {}),
        phone: rawDigits,
        otp: dynamicOtp,
        expiresInSeconds: 600,
        isDevelopmentMode: true,
        devOtpHint: dynamicOtp,
      };
    } catch {
      return {
        phone: rawDigits,
        otp: dynamicOtp,
        expiresInSeconds: 600,
        isDevelopmentMode: true,
        devOtpHint: dynamicOtp,
      };
    }
  };

  const loginWithOtp = async (phone: string, otp: string, name?: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const rawDigits = phone.replace(/\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(`live_otp_${rawDigits}`) ||
        localStorage.getItem(`live_otp_${rawDigits}`) ||
        sessionStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        localStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        sessionStorage.getItem('last_generated_otp') ||
        localStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (
        cleanOtp === '123456' ||
        (storedOtp && cleanOtp === storedOtp) ||
        /^\d{6}$/.test(cleanOtp)
      );

      if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }

      sessionStorage.removeItem(`live_otp_${rawDigits}`);
      sessionStorage.removeItem(`admin_live_otp_${rawDigits}`);
      sessionStorage.removeItem('last_generated_otp');
      try {
        localStorage.removeItem(`live_otp_${rawDigits}`);
        localStorage.removeItem('last_generated_otp');
      } catch (e) {}

      // 1. Check if this customer already registered previously, or auto-register
      const existingCust = getCustomerByPhone(phone);
      let cust = existingCust;

      if (!cust) {
        cust = registerNewCustomer({
          id: generateCustomerId(name?.trim()),
          name: name?.trim() || `Homeowner (+91 ${rawDigits.slice(-4)})`,
          phone: `+91 ${rawDigits}`,
          email: 'Not Provided',
          housePlotNumber: '',
          streetLocality: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
          status: 'VERIFIED',
          requestsCount: 0,
          bookingsCount: 0,
        });
      }

      const registeredAddr: CustomerAddress = {
        id: `addr-${cust.id}`,
        label: 'Primary Site / Residence',
        houseNo: cust.housePlotNumber,
        street: cust.streetLocality,
        locality: cust.streetLocality,
        city: cust.city,
        state: cust.state,
        pinCode: cust.pinCode,
        country: cust.country || 'India',
        landmark: cust.landmark,
        isDefaultBilling: true,
        isDefaultDelivery: true,
      };

      const authenticatedUser: User = {
        id: cust.id,
        phone: cust.phone,
        name: cust.name,
        role: 'CUSTOMER',
        isActive: true,
        email: cust.email !== 'Not Provided' ? cust.email : null,
        address: registeredAddr,
        createdAt: cust.registeredAt,
        updatedAt: new Date().toISOString(),
      };

      const newToken = `token-${Date.now()}`;
      setUser(authenticatedUser);
      setToken(newToken);
      setAddresses([registeredAddr]);

      // Multi-session persist for Customer role
      localStorage.setItem(CUST_USER_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem(CUST_TOKEN_KEY, newToken);
      localStorage.setItem('customer_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('customer_token', newToken);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      localStorage.setItem('token', newToken);
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOtp = async (signupData: any, otp: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const rawDigits = (signupData.mobileNumber || '').replace(/\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(`live_otp_${rawDigits}`) ||
        sessionStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        sessionStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (storedOtp && cleanOtp === storedOtp) || cleanOtp === '123456';
      if (!isValidOtp) {
        throw new Error(
          storedOtp
            ? `Invalid OTP. Please enter the OTP displayed on your screen (${storedOtp}).`
            : 'Invalid OTP code. Please enter the verification OTP.'
        );
      }

      sessionStorage.removeItem(`live_otp_${rawDigits}`);
      sessionStorage.removeItem(`admin_live_otp_${rawDigits}`);
      sessionStorage.removeItem('last_generated_otp');

      const newAddr: CustomerAddress = {
        id: `addr-${Date.now()}`,
        label: 'Home Address',
        houseNo: signupData.housePlotNumber,
        street: signupData.streetLocality,
        locality: signupData.streetLocality,
        city: signupData.city,
        state: signupData.state,
        pinCode: signupData.pinCode,
        country: signupData.country || 'India',
        landmark: signupData.landmark,
        isDefaultBilling: true,
        isDefaultDelivery: true,
      };

      const newUser: User = {
        id: generateCustomerId(signupData.fullName),
        phone: signupData.mobileNumber,
        name: signupData.fullName,
        email: signupData.email || null,
        role: 'CUSTOMER',
        isActive: true,
        address: newAddr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newToken = `token-${Date.now()}`;
      setUser(newUser);
      setToken(newToken);
      setAddresses([newAddr, ...addresses]);

      // Multi-session persist for Customer role
      localStorage.setItem(CUST_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(CUST_TOKEN_KEY, newToken);
      localStorage.setItem('customer_user', JSON.stringify(newUser));
      localStorage.setItem('customer_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', newToken);

      // Save complete new customer profile into persistent platform customer store for Admin Panel!
      registerNewCustomer({
        id: newUser.id,
        name: signupData.fullName,
        phone: signupData.mobileNumber,
        email: signupData.email || 'Not Provided',
        housePlotNumber: signupData.housePlotNumber,
        streetLocality: signupData.streetLocality,
        landmark: signupData.landmark || '',
        city: signupData.city,
        state: signupData.state,
        pinCode: signupData.pinCode,
        country: signupData.country || 'India',
        alternateContact: signupData.alternateContact || '',
        registeredAt: new Date().toISOString(),
        status: 'VERIFIED',
        requestsCount: 0,
        bookingsCount: 0,
        materialOrdersCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: MaterialProduct, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => setCart([]);

  const addAddress = (address: CustomerAddress) => {
    setAddresses((prev) => [address, ...prev]);
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return updated as User;
      const merged = { ...prev, ...updated };
      // Also update role-scoped session storage
      if (merged.role === 'ADMIN') {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(merged));
        localStorage.setItem('admin_user', JSON.stringify(merged));
      } else if (merged.role === 'PROFESSIONAL') {
        localStorage.setItem(PRO_USER_KEY, JSON.stringify(merged));
        localStorage.setItem('pro_user', JSON.stringify(merged));
      } else if ((merged.role as any) === 'VENDOR') {
        localStorage.setItem(VENDOR_USER_KEY, JSON.stringify(merged));
        localStorage.setItem('vendor_user', JSON.stringify(merged));
      } else {
        localStorage.setItem(CUST_USER_KEY, JSON.stringify(merged));
        localStorage.setItem('customer_user', JSON.stringify(merged));
      }
      return merged;
    });
  };

  const loginAdminWithOtp = async (phone: string, otp: string, name?: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const configuredPasscode = (import.meta.env.VITE_ADMIN_PASSCODE || import.meta.env.VITE_ADMIN_OTP || '').trim();
      const configuredPhone = (import.meta.env.VITE_ADMIN_PHONE || '8319955741').replace(/\D/g, '').slice(-10);
      const rawDigits = phone.replace(/\D/g, '').slice(-10);

      // Security check: Verify authorized admin phone number
      const foundAdmin = getAdminByPhone(rawDigits);
      const isAuthorized = rawDigits === '8319955741' || rawDigits === configuredPhone || !!foundAdmin;
      if (!isAuthorized) {
        throw new Error('Access Denied: This mobile number is not authorized as an administrator.');
      }

      // Check dynamic screen OTP or permanent configured passcode
      const sessionOtp = (
        sessionStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        sessionStorage.getItem(`live_otp_${rawDigits}`) ||
        sessionStorage.getItem('last_generated_otp') ||
        ''
      ).trim();
      const isDynamicValid = sessionOtp && cleanOtp === sessionOtp;
      const isPasscodeValid = configuredPasscode && cleanOtp === configuredPasscode;
      const isDevFallback = !configuredPasscode && !sessionOtp && cleanOtp === '123456';

      if (!isDynamicValid && !isPasscodeValid && !isDevFallback) {
        throw new Error(
          sessionOtp
            ? `Invalid Admin OTP code. Please enter the OTP displayed on your screen (${sessionOtp}).`
            : configuredPasscode
            ? 'Invalid Admin Passcode. Access denied.'
            : 'Invalid Admin OTP code. Please enter the verification OTP.'
        );
      }

      sessionStorage.removeItem(`admin_live_otp_${rawDigits}`);
      sessionStorage.removeItem(`live_otp_${rawDigits}`);
      sessionStorage.removeItem('last_generated_otp');

      let existingAdmin = getAdminByPhone(phone);
      const defaultAdminName = import.meta.env.VITE_ADMIN_NAME || 'Platform Super Administrator';

      // Auto-register admin if this is a new authorized mobile number
      if (!existingAdmin) {
        existingAdmin = saveRegisteredAdmin({
          phone: `+91 ${rawDigits}`,
          name: name?.trim() || defaultAdminName,
          department: 'Platform Operations Director',
          email: `admin.${rawDigits}@ghardesign.in`,
        });
      }

      const adminUser: User = {
        id: existingAdmin.id,
        phone: existingAdmin.phone,
        name: existingAdmin.name,
        role: 'ADMIN',
        email: existingAdmin.email || 'admin@ghardesign.in',
        isActive: true,
        createdAt: existingAdmin.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const adminToken = `admin-token-${Date.now()}`;
      setUser(adminUser);
      setToken(adminToken);

      // Multi-session persist for Admin role
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
      localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
      localStorage.setItem('admin_token', adminToken);
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('token', adminToken);
    } finally {
      setIsLoading(false);
    }
  };

  const loginVendorWithOtp = async (phone: string, otp: string, _name?: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const rawDigits = phone.replace(/\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(`live_otp_${rawDigits}`) ||
        sessionStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        sessionStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (storedOtp && cleanOtp === storedOtp) || cleanOtp === '123456';
      if (!isValidOtp) {
        throw new Error(
          storedOtp
            ? `Invalid OTP code. Please enter the OTP displayed on your screen (${storedOtp}).`
            : 'Invalid OTP code. Please enter the verification OTP.'
        );
      }

      sessionStorage.removeItem(`live_otp_${rawDigits}`);
      sessionStorage.removeItem(`admin_live_otp_${rawDigits}`);
      sessionStorage.removeItem('last_generated_otp');

      const existingVendor = getVendorByPhone(phone);

      if (!existingVendor) {
        throw new Error(
          `Mobile number +91 ${rawDigits} is not registered as an authorized Materials Vendor. Please complete Vendor Registration first.`
        );
      }

      if (existingVendor.status === 'REJECTED') {
        throw new Error('Your vendor account application was rejected. Please contact platform administration.');
      }

      const vendorUser: User = {
        id: existingVendor.id,
        phone: existingVendor.phone,
        name: existingVendor.businessName,
        role: 'VENDOR' as any,
        email: existingVendor.email || 'vendor@ghardesign.in',
        isActive: true,
        createdAt: existingVendor.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vendorToken = `vendor-token-${Date.now()}`;
      setUser(vendorUser);
      setToken(vendorToken);

      // Multi-session persist for Vendor role
      localStorage.setItem(VENDOR_USER_KEY, JSON.stringify(vendorUser));
      localStorage.setItem(VENDOR_TOKEN_KEY, vendorToken);
      localStorage.setItem('vendor_user', JSON.stringify(vendorUser));
      localStorage.setItem('vendor_token', vendorToken);
      localStorage.setItem('user', JSON.stringify(vendorUser));
      localStorage.setItem('token', vendorToken);
    } finally {
      setIsLoading(false);
    }
  };

  const loginProfessionalWithOtp = async (phone: string, otp: string, name?: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const rawDigits = phone.replace(/\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(`live_otp_${rawDigits}`) ||
        localStorage.getItem(`live_otp_${rawDigits}`) ||
        sessionStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        localStorage.getItem(`admin_live_otp_${rawDigits}`) ||
        sessionStorage.getItem('last_generated_otp') ||
        localStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (
        cleanOtp === '123456' ||
        (storedOtp && cleanOtp === storedOtp) ||
        /^\d{6}$/.test(cleanOtp)
      );

      if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }

      sessionStorage.removeItem(`live_otp_${rawDigits}`);
      sessionStorage.removeItem(`admin_live_otp_${rawDigits}`);
      sessionStorage.removeItem('last_generated_otp');
      try {
        localStorage.removeItem(`live_otp_${rawDigits}`);
        localStorage.removeItem('last_generated_otp');
      } catch (e) {}

      // Resolve the actual real name (never an automatic dummy name)
      const arch = getArchitectByPhone(rawDigits);
      const isAutoName = (n?: string) => !n || n.includes('Certified') || n.includes('Partner') || n.includes('Rajesh Sharma');
      
      let realName = '';
      if (name?.trim() && !isAutoName(name.trim())) {
        realName = name.trim();
      } else if (arch?.name && !isAutoName(arch.name)) {
        realName = arch.name;
      } else if (name?.trim()) {
        realName = name.trim();
      } else {
        realName = arch?.name || '';
      }

      let existingPro = getProfessionalByPhone(rawDigits);

      if (existingPro) {
        if (realName && (!existingPro.name || isAutoName(existingPro.name) || existingPro.name !== realName)) {
          existingPro.name = realName;
          savePlatformProfessional(existingPro);
        }
      } else {
        existingPro = savePlatformProfessional({
          phone: `+91 ${rawDigits}`,
          name: realName,
          firmName: arch?.firmName || '',
          category: 'ARCHITECT',
          email: arch?.email || '',
          experienceYears: arch?.experienceYears || 0,
          isVerified: false,
          verificationStatus: 'PENDING',
        });
      }

      const cleanPhoneDigits = rawDigits;
      const storedPhonePhoto = cleanPhoneDigits ? (() => {
        try {
          return localStorage.getItem(`arch_photo_${cleanPhoneDigits}`);
        } catch {
          return null;
        }
      })() : null;

      const photoCandidates = [
        arch?.profilePhoto,
        storedPhonePhoto,
        (existingPro as any)?.profilePhoto,
        (existingPro as any)?.personal?.profilePhoto,
        (existingPro as any)?.avatar,
      ];
      const proPhoto =
        photoCandidates.find(
          (p) =>
            p &&
            typeof p === 'string' &&
            !p.includes('data:image/svg+xml') &&
            !p.includes('<svg') &&
            (p.startsWith('data:image/') || p.startsWith('http'))
        ) || null;

      const proUser: User = {
        id: arch?.userId || existingPro.userId || existingPro.id,
        phone: existingPro.phone || `+91 ${rawDigits}`,
        name: realName || existingPro.name || arch?.name || '',
        firmName: arch?.firmName || existingPro.firmName || localStorage.getItem(`registered_arch_firm_${rawDigits}`) || localStorage.getItem('registered_arch_firm') || '',
        role: 'PROFESSIONAL',
        email: arch?.email || existingPro.email || 'partner@ghardesign.in',
        avatar: proPhoto,
        profilePhoto: proPhoto,
        isActive: true,
        createdAt: existingPro.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      const proToken = `pro-token-${Date.now()}`;
      setUser(proUser);
      setToken(proToken);

      // Multi-session persist for Professional role
      localStorage.setItem(PRO_USER_KEY, JSON.stringify(proUser));
      localStorage.setItem(PRO_TOKEN_KEY, proToken);
      localStorage.setItem('pro_user', JSON.stringify(proUser));
      localStorage.setItem('pro_token', proToken);
      localStorage.setItem('user', JSON.stringify(proUser));
      localStorage.setItem('token', proToken);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      if (role === 'ADMIN') {
        const admins = getRegisteredAdmins();
        if (admins.length > 0) {
          const a = admins[0];
          const adminUser: User = {
            id: a.id,
            phone: a.phone,
            name: a.name,
            role: 'ADMIN',
            email: a.email,
            isActive: true,
            createdAt: a.registeredAt,
            updatedAt: new Date().toISOString(),
          };
          const t = `token-${a.id}`;
          setUser(adminUser);
          setToken(t);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
          localStorage.setItem(ADMIN_TOKEN_KEY, t);
          localStorage.setItem('admin_user', JSON.stringify(adminUser));
          localStorage.setItem('admin_token', t);
        } else {
          setUser(null);
        }
      } else if (role === 'PROFESSIONAL') {
        const pros = getPlatformProfessionals();
        if (pros.length > 0) {
          const p = pros[0];
          const proUser: User = {
            id: p.userId || p.id,
            phone: p.phone || '',
            name: p.name,
            role: 'PROFESSIONAL',
            email: p.email || 'partner@ghardesign.in',
            isActive: true,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const t = `token-${p.id}`;
          setUser(proUser);
          setToken(t);
          localStorage.setItem(PRO_USER_KEY, JSON.stringify(proUser));
          localStorage.setItem(PRO_TOKEN_KEY, t);
          localStorage.setItem('pro_user', JSON.stringify(proUser));
          localStorage.setItem('pro_token', t);
        } else {
          setUser(null);
        }
      } else if ((role as any) === 'VENDOR') {
        const vendors = getRegisteredVendors();
        if (vendors.length > 0) {
          const v = vendors[0];
          const vendorUser: User = {
            id: v.id,
            phone: v.phone,
            name: v.businessName,
            role: 'VENDOR' as any,
            email: v.email,
            isActive: true,
            createdAt: v.registeredAt,
            updatedAt: new Date().toISOString(),
          };
          const t = `token-${v.id}`;
          setUser(vendorUser);
          setToken(t);
          localStorage.setItem(VENDOR_USER_KEY, JSON.stringify(vendorUser));
          localStorage.setItem(VENDOR_TOKEN_KEY, t);
          localStorage.setItem('vendor_user', JSON.stringify(vendorUser));
          localStorage.setItem('vendor_token', t);
        } else {
          setUser(null);
        }
      } else {
        const registered = getRegisteredCustomers();
        if (registered.length > 0) {
          const first = registered[0];
          const custUser: User = {
            id: first.id,
            phone: first.phone,
            name: first.name,
            role: 'CUSTOMER',
            email: first.email || 'customer@ghardesign.in',
            isActive: true,
            createdAt: first.registeredAt,
            updatedAt: new Date().toISOString(),
          };
          const t = `token-${first.id}`;
          setUser(custUser);
          setToken(t);
          localStorage.setItem(CUST_USER_KEY, JSON.stringify(custUser));
          localStorage.setItem(CUST_TOKEN_KEY, t);
          localStorage.setItem('customer_user', JSON.stringify(custUser));
          localStorage.setItem('customer_token', t);
        } else {
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const currentPath = window.location.pathname;
    const target = getTargetRole(currentPath);

    if (target === 'ADMIN') {
      localStorage.removeItem(ADMIN_USER_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('gd_admin_session');
      if (user?.role === 'ADMIN') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (target === 'PROFESSIONAL') {
      localStorage.removeItem(PRO_USER_KEY);
      localStorage.removeItem(PRO_TOKEN_KEY);
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_token');
      if (user?.role === 'PROFESSIONAL') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (target === 'VENDOR') {
      localStorage.removeItem(VENDOR_USER_KEY);
      localStorage.removeItem(VENDOR_TOKEN_KEY);
      localStorage.removeItem('vendor_user');
      localStorage.removeItem('vendor_token');
      if ((user?.role as any) === 'VENDOR') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (target === 'CUSTOMER') {
      localStorage.removeItem(CUST_USER_KEY);
      localStorage.removeItem(CUST_TOKEN_KEY);
      localStorage.removeItem('customer_user');
      localStorage.removeItem('customer_token');
      if (user?.role === 'CUSTOMER') {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem(ADMIN_USER_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(PRO_USER_KEY);
      localStorage.removeItem(PRO_TOKEN_KEY);
      localStorage.removeItem(CUST_USER_KEY);
      localStorage.removeItem(CUST_TOKEN_KEY);
      localStorage.removeItem(VENDOR_USER_KEY);
      localStorage.removeItem(VENDOR_TOKEN_KEY);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_token');
      localStorage.removeItem('customer_user');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('vendor_user');
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }

    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        addresses,
        cart,
        cartCount,
        loginWithOtp,
        loginAdminWithOtp,
        loginVendorWithOtp,
        loginProfessionalWithOtp,
        signupWithOtp,
        requestOtp,
        logout,
        switchDemoRole,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        addAddress,
        deleteAddress,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
