import { strict as assert } from 'assert';

const storageData = {};
globalThis.localStorage = {
  getItem: (key) => (key in storageData ? storageData[key] : null),
  setItem: (key, val) => { storageData[key] = String(val); },
  removeItem: (key) => { delete storageData[key]; },
  clear: () => {
    for (const k of Object.keys(storageData)) delete storageData[k];
  },
};
globalThis.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } },
};

// Import store
import { saveArchitectAccount, generateArchitectId, getArchitectByPhone } from '../apps/web/src/data/architectStore.js';
import { savePlatformProfessional } from '../apps/web/src/data/customerStore.js';

const personal = {
  name: 'Varsha Jain',
  phone: '', // What if phone is empty?
  email: 'varsha.jain@example.com',
  profilePhoto: '',
  designation: 'Principal Architect',
  experienceYears: 5,
  bio: '',
};

const business = {
  firmName: 'Varsha Jain firm',
  coaNumber: 'COA-10-12-2005',
  businessType: 'Civil Engineering Consultancy',
  services: ['2D House Plan & Municipal Blueprints'],
  address: '',
  city: 'Indore',
  state: 'Madhya Pradesh',
  pincode: '',
};

const bank = {
  bankName: 'State Bank of India (SBI)',
  accountNumber: '123456789',
  ifscCode: 'SBIN0007937',
  accountHolderName: 'Varsha Jain',
  accountType: 'CURRENT',
  branch: 'Indore',
  cancelledChequeUrl: 'blob:cheque',
  cancelledChequeFileName: 'cheque.jpg',
  isChequeAccepted: true,
};

const serviceCities = ['Indore', 'New Delhi'];

console.log('Testing handleFinalSubmit with empty phone...');
try {
  const user = null;
  const userStored = {};
  const cleanUserPhone = (personal.phone || user?.phone || userStored.phone || '')
    .replace(/\D/g, '')
    .slice(-10);

  console.log('cleanUserPhone:', cleanUserPhone);

  const saved = saveArchitectAccount({
    id: getArchitectByPhone(cleanUserPhone)?.id || generateArchitectId(),
    userId: user?.id || userStored.id || `usr-arch-${cleanUserPhone}`,
    phone: cleanUserPhone,
    name: personal.name,
    email: personal.email,
    profilePhoto: personal.profilePhoto,
    designation: personal.designation,
    experienceYears: Number(personal.experienceYears) || 0,
    bio: personal.bio,
    firmName: business.firmName,
    businessType: business.businessType,
    coaNumber: business.coaNumber,
    address: business.address,
    city: business.city,
    state: business.state,
    pincode: business.pincode,
    services: business.services,
    portfolioProjects: [],
    documents: [],
    bankDetails: {
      bankName: bank.bankName,
      accountHolderName: bank.accountHolderName || personal.name,
      accountNumber: bank.accountNumber,
      ifscCode: (bank.ifscCode || '').toUpperCase(),
      accountType: bank.accountType,
      branch: bank.branch,
      cancelledChequeUrl: bank.cancelledChequeUrl,
      cancelledChequeFileName: bank.cancelledChequeFileName,
      isChequeAccepted: bank.isChequeAccepted,
      isVerified: false,
    },
    serviceCities,
    accountStatus: 'PENDING_APPROVAL',
    isVerified: false,
  });

  console.log('Saved architect account:', saved.id, saved.name, saved.phone);

  savePlatformProfessional({
    id: `pro-${cleanUserPhone}`,
    userId: user?.id || userStored.id || `usr-arch-${cleanUserPhone}`,
    phone: `+91 ${cleanUserPhone}`,
    name: personal.name,
    firmName: business.firmName,
    category: 'ARCHITECT',
    email: personal.email,
    experienceYears: Number(personal.experienceYears),
    registrationNumber: business.coaNumber,
    isVerified: false,
    verificationStatus: 'PENDING',
  });

  console.log('Saved platform professional successfully!');
} catch (e) {
  console.error('Error during submission:', e);
}
