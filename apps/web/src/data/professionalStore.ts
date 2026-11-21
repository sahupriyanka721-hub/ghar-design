/**
 * professionalStore.ts
 * Dedicated data store and helpers for Contractor & Engineering Professional Workspace.
 */

export interface ProfessionalServiceItem {
  name: string;
  category: string;
  desc: string;
}

export interface ProfessionalAccount {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  firmName: string;
  category: string;
  experienceYears: number;
  qualifications: string;
  registrationNumber?: string;
  gstin?: string;
  panNumber?: string;
  city: string;
  state: string;
  serviceCities?: string[];
  services?: string[];
  bio?: string;
  portfolioProjects?: {
    id: string;
    title: string;
    location: string;
    builtUpArea: string;
    imageUrl: string;
    year: string;
  }[];
  isVerified: boolean;
  verificationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'PROFILE_INCOMPLETE' | 'SUSPENDED';
  registeredAt?: string;
}

export interface ProfessionalPayoutRequest {
  id: string;
  payoutCode: string;
  professionalPhone: string;
  professionalName: string;
  projectId: string;
  projectName: string;
  customerName: string;
  milestoneTitle: string;
  amountPaise: number;
  bankAccount: string;
  ifscCode: string;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  requestedAt: string;
  disbursedAt?: string;
  notes?: string;
}

export interface ProfessionalCustomerMessage {
  id: string;
  professionalPhone: string;
  customerPhone: string;
  sender: 'PROFESSIONAL' | 'CUSTOMER';
  message: string;
  timestamp: string;
  projectId?: string;
}

export interface ProfessionalSupportTicket {
  id: string;
  ticketCode: string;
  professionalPhone: string;
  professionalName: string;
  subject: string;
  category: 'PAYMENT' | 'KYC' | 'DISPUTE' | 'TECHNICAL' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'PROFESSIONAL' | 'ADMIN';
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

export const ALL_PROFESSIONAL_SERVICES: ProfessionalServiceItem[] = [
  { name: '2D House Planning & CAD Blueprints', category: 'Planning', desc: 'Precision dimensional layout drawings, circulation plans and setbacks.' },
  { name: '3D Elevation & Facade Rendering', category: 'Design', desc: 'Photorealistic daytime and dusk exterior visuals.' },
  { name: 'RCC Structural Load Calculation', category: 'Engineering', desc: 'Footing sizes, column rebar and beam schedules under IS 456.' },
  { name: 'Civil Construction & Execution', category: 'Construction', desc: 'Full-phase site execution from foundation to handover.' },
  { name: 'Plumbing & Drainage Engineering', category: 'MEP', desc: 'Internal sanitary lines, soil pipes and septic design.' },
  { name: 'Electrical Conduit & Phase Distribution', category: 'MEP', desc: 'Concealed wiring layouts, switch boards and MCB circuits.' },
  { name: 'Municipal Sanction Authority Liaisoning', category: 'Sanction', desc: 'Official authority submission drawings and paperwork.' },
  { name: 'Soil Safe Bearing Capacity (SBC) Audit', category: 'Geotech', desc: 'Standard penetration tests and foundation depth recommendations.' },
  { name: 'Luxury Modular Kitchen & Joinery', category: 'Interior', desc: 'Factory-made ergonomic cabinets and hardware specifications.' },
  { name: 'False Ceiling & Acoustic Design', category: 'Interior', desc: 'Gypsum board ceilings with cove channels and magnetic tracks.' },
  { name: 'Vastu Shastra Layout Alignment', category: 'Planning', desc: 'Directional zoning for master bedroom, kitchen and entrance.' },
  { name: 'Independent Material Estimation / BOQ', category: 'Costing', desc: 'Itemized quantities of cement, steel, sand and masonry.' },
  { name: 'Daily Site Quality Supervision', category: 'Audit', desc: 'Concrete slump tests, cube curing and contractor quality control.' },
  { name: 'Waterproofing & Chemical Treatment', category: 'Specialty', desc: 'Sunken slab coating, retaining walls and terrace screeds.' },
  { name: 'Tile & Italian Marble Laying', category: 'Finishing', desc: 'Diamond polish and precision laser leveling.' },
  { name: 'Exterior Weatherproof Paint & Textures', category: 'Finishing', desc: 'Elastomeric coatings and stone grit finishes.' },
  { name: 'MS & SS Railing Fabrication', category: 'Fabrication', desc: 'Glass balustrades and staircase security grills.' },
  { name: 'Concealed VRV / HVAC Piping', category: 'HVAC', desc: 'Refrigerant copper line distribution.' },
  { name: 'Fire Hydrant & Smoke Safety Plans', category: 'Safety', desc: 'Emergency exits and municipal NBC safety codes.' },
  { name: 'Landscape & Hardscape Engineering', category: 'Landscape', desc: 'Terrace garden drainage and boundary paving.' },
  { name: 'Structural Retrofitting & Repairs', category: 'Renovation', desc: 'Micro-concreting and epoxy beam injection.' },
];

const SEED_PROFESSIONALS: ProfessionalAccount[] = [];

const PRO_STORAGE_KEY = 'gd_professional_accounts';
const PRO_PAYOUTS_KEY = 'gd_professional_payouts';
const PRO_MESSAGES_KEY = 'gd_professional_messages';
const PRO_TICKETS_KEY = 'gd_professional_tickets';

export const getProfessionalAccounts = (): ProfessionalAccount[] => {
  try {
    const data = localStorage.getItem(PRO_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

export const getProfessionalByPhone = (phone: string): ProfessionalAccount | null => {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const list = getProfessionalAccounts();
  return list.find((p) => p.phone.replace(/\D/g, '').slice(-10) === clean) || null;
};

export const saveProfessionalAccount = (acc: Partial<ProfessionalAccount>): ProfessionalAccount => {
  const current = getProfessionalAccounts();
  const cleanPhone = (acc.phone || '').replace(/\D/g, '').slice(-10);
  const existingIdx = current.findIndex(
    (p) => p.id === acc.id || p.phone.replace(/\D/g, '').slice(-10) === cleanPhone
  );

  let updated: ProfessionalAccount;
  if (existingIdx >= 0) {
    updated = { ...current[existingIdx], ...acc };
    current[existingIdx] = updated;
  } else {
    updated = {
      id: acc.id || `pro-${Date.now()}`,
      userId: acc.userId || `usr-${Date.now()}`,
      name: acc.name || '',
      phone: acc.phone || '',
      email: acc.email || '',
      firmName: acc.firmName || '',
      category: acc.category || 'Contractor & Civil Consultant',
      experienceYears: acc.experienceYears || 5,
      qualifications: acc.qualifications || 'B.Tech Civil / IEI Fellow',
      city: acc.city || '',
      state: acc.state || '',
      serviceCities: acc.serviceCities || ['Gurugram', 'Delhi NCR'],
      services: acc.services || ALL_PROFESSIONAL_SERVICES.slice(0, 5).map(s => s.name),
      portfolioProjects: acc.portfolioProjects || [],
      isVerified: acc.isVerified ?? true,
      verificationStatus: acc.verificationStatus || 'APPROVED',
      accountStatus: acc.accountStatus || 'ACTIVE',
      registeredAt: acc.registeredAt || new Date().toISOString(),
    };
    current.push(updated);
  }

  localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(current));
  return updated;
};

export const getProfessionalPayoutRequests = (phone?: string): ProfessionalPayoutRequest[] => {
  try {
    const data = localStorage.getItem(PRO_PAYOUTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (!phone) return parsed;
        const clean = phone.replace(/\D/g, '').slice(-10);
        return parsed.filter((p) => p.professionalPhone.replace(/\D/g, '').slice(-10) === clean);
      }
    }
  } catch (e) {}

  return [];
};

export const createProfessionalPayoutRequest = (
  req: Partial<ProfessionalPayoutRequest>
): ProfessionalPayoutRequest => {
  const all = getProfessionalPayoutRequests();
  const newReq: ProfessionalPayoutRequest = {
    id: req.id || `payout-${Date.now()}`,
    payoutCode: `PAY-${Date.now().toString().slice(-4)}`,
    professionalPhone: req.professionalPhone || '',
    professionalName: req.professionalName || '',
    projectId: req.projectId || 'PRJ-GENERAL',
    projectName: req.projectName || 'Construction Project',
    customerName: req.customerName || 'Homeowner',
    milestoneTitle: req.milestoneTitle || 'Milestone Stage Completion',
    amountPaise: req.amountPaise || 1000000,
    bankAccount: req.bankAccount || 'HDFC Bank - A/C ****8842',
    ifscCode: req.ifscCode || 'HDFC0001234',
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
    notes: req.notes,
  };

  all.unshift(newReq);
  localStorage.setItem(PRO_PAYOUTS_KEY, JSON.stringify(all));
  return newReq;
};

export const getProfessionalCustomerMessages = (
  proPhone?: string,
  custPhone?: string
): ProfessionalCustomerMessage[] => {
  try {
    const data = localStorage.getItem(PRO_MESSAGES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  return [];
};

export const sendProfessionalCustomerMessage = (
  msg: Partial<ProfessionalCustomerMessage>
): ProfessionalCustomerMessage => {
  const all = getProfessionalCustomerMessages();
  const newMsg: ProfessionalCustomerMessage = {
    id: `msg-${Date.now()}`,
    professionalPhone: msg.professionalPhone || '',
    customerPhone: msg.customerPhone || '',
    sender: msg.sender || 'PROFESSIONAL',
    message: msg.message || '',
    timestamp: new Date().toISOString(),
    projectId: msg.projectId,
  };

  all.push(newMsg);
  localStorage.setItem(PRO_MESSAGES_KEY, JSON.stringify(all));
  return newMsg;
};

export const getProfessionalTickets = (proPhone?: string): ProfessionalSupportTicket[] => {
  try {
    const data = localStorage.getItem(PRO_TICKETS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  return [];
};

export const createProfessionalTicket = (
  ticket: Partial<ProfessionalSupportTicket>
): ProfessionalSupportTicket => {
  const all = getProfessionalTickets();
  const newTicket: ProfessionalSupportTicket = {
    id: `ticket-${Date.now()}`,
    ticketCode: `TCK-${Date.now().toString().slice(-4)}`,
    professionalPhone: ticket.professionalPhone || '',
    professionalName: ticket.professionalName || '',
    subject: ticket.subject || 'Support Request',
    category: ticket.category || 'TECHNICAL',
    priority: ticket.priority || 'MEDIUM',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: ticket.messages || [
      {
        id: `tmsg-${Date.now()}`,
        sender: 'PROFESSIONAL',
        senderName: ticket.professionalName || 'Professional',
        text: ticket.subject || 'New inquiry logged.',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  all.unshift(newTicket);
  localStorage.setItem(PRO_TICKETS_KEY, JSON.stringify(all));
  return newTicket;
};

export const addTicketReply = (
  ticketId: string,
  reply: { sender: 'PROFESSIONAL' | 'ADMIN'; senderName: string; text: string }
): ProfessionalSupportTicket | null => {
  const all = getProfessionalTickets();
  const target = all.find((t) => t.id === ticketId);
  if (!target) return null;

  target.messages.push({
    id: `tmsg-${Date.now()}`,
    sender: reply.sender,
    senderName: reply.senderName,
    text: reply.text,
    timestamp: new Date().toISOString(),
  });
  target.updatedAt = new Date().toISOString();

  localStorage.setItem(PRO_TICKETS_KEY, JSON.stringify(all));
  return target;
};
