// ==============================================================================
// BUILDGHAR CMS & PLATFORM CONTENT STORE
// Specification: Module 17 (CMS & Platform Content Management)
// ==============================================================================

export interface HomepageContentData {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
  };
  stats: Array<{ label: string; value: string; helper: string }>;
  pillars: Array<{ title: string; description: string; icon: string }>;
  bannerNotice: {
    enabled: boolean;
    text: string;
    badge: string;
  };
  lastUpdated: string;
}

export interface AboutUsContentData {
  title: string;
  subtitle: string;
  story: string;
  mission: string;
  vision: string;
  standards: Array<{ code: string; title: string; description: string }>;
  leadership: Array<{ name: string; role: string; bio: string }>;
  lastUpdated: string;
}

export interface ContactUsContentData {
  corporateOffice: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    mapUrl: string;
  };
  regionalHubs: Array<{
    city: string;
    hubName: string;
    address: string;
    leadContact: string;
    phone: string;
  }>;
  hotlines: {
    tollFree: string;
    whatsapp: string;
    escalationEmail: string;
    workingHours: string;
  };
  lastUpdated: string;
}

export interface FAQItem {
  id: string;
  category: 'HOMEOWNER' | 'ARCHITECT' | 'ESCROW_PAYMENT' | 'IS456_STANDARDS' | 'DISPUTES';
  question: string;
  answer: string;
  order: number;
}

export interface LegalPolicyContentData {
  title: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

export interface PlatformCMSStore {
  homepage: HomepageContentData;
  aboutUs: AboutUsContentData;
  contactUs: ContactUsContentData;
  faqs: FAQItem[];
  termsConditions: LegalPolicyContentData;
  privacyPolicy: LegalPolicyContentData;
  cancellationPolicy: LegalPolicyContentData;
  refundPolicy: LegalPolicyContentData;
}

const STORAGE_KEY_CMS = 'gd_platform_cms_content_v1';

const getDefaultSeedCMS = (): PlatformCMSStore => ({
  homepage: {
    hero: {
      badge: 'ISO 9001:2015 & COA ACCREDITED PLATFORM',
      headline: "Design & Build Your Dream Home with India's Verified Architects",
      subheadline:
        'Fixed-rate IS 456 compliant structural blueprints, 3-architect competitive quotation tenders, 100% platform escrow protection, and milestone-tracked construction execution.',
      primaryCtaText: 'Request Free Quotation',
      primaryCtaLink: '/create-request',
      secondaryCtaText: 'Explore 3D Floor Plans',
      secondaryCtaLink: '/designs',
    },
    stats: [
      { label: 'Projects Delivered', value: '1,250+', helper: 'Across Delhi NCR, Indore, Bengaluru & Kolkata' },
      { label: 'Verified Architects', value: '350+', helper: 'Council of Architecture (COA) Accredited' },
      { label: 'Escrow Transacted', value: '₹45+ Cr', helper: '100% Milestone-Protected Disbursals' },
      { label: 'Customer CSAT', value: '4.88 / 5', helper: 'Verified Post-Handover Client Ratings' },
    ],
    pillars: [
      {
        title: 'Multi-Architect Tender Bidding',
        description: 'Broadcast your residential plot dimensions and get 3 itemized architectural bids within 72 hours.',
        icon: 'TrendingUp',
      },
      {
        title: '100% Escrow Protection',
        description: 'Funds remain safe in platform escrow until you inspect and approve each structural deliverable.',
        icon: 'ShieldCheck',
      },
      {
        title: 'IS 456 Structural Integrity',
        description: 'All structural framing, slab reinforcement, and soil bearing capacity are certified by senior chartered engineers.',
        icon: 'HardHat',
      },
    ],
    bannerNotice: {
      enabled: true,
      text: 'Special Pre-Monsoon Offer: Free 3D Exterior Elevation Walkthrough on all G+1 and G+2 Home Construction Packages.',
      badge: 'LIMITED TIME',
    },
    lastUpdated: new Date().toISOString(),
  },
  aboutUs: {
    title: 'Transforming Indian Home Construction Through Engineering Integrity',
    subtitle: 'Founded by architects, civil engineers, and technology leaders to eliminate cost escalations and opacity.',
    story:
      'BuildGhar was created with a single mission: to empower Indian homeowners with the same level of architectural precision, structural safety, and contract transparency that high-end commercial projects enjoy. Historically, individual homebuilders suffered from unexcused delays, non-compliant setback deviations, and arbitrary cost escalations. BuildGhar establishes an institutional framework where Council of Architecture (COA) accredited architects compete on merit, blueprints adhere strictly to the National Building Code of India 2016, and financial milestone disbursements are gated through platform escrow.',
    mission:
      'To democratize bespoke architectural design and guaranteed IS 456 structural safety for every independent homebuilder across India.',
    vision:
      "To become India's foremost technology-driven residential design-build authority, delivering 10,000+ earthquake-resilient homes by 2028.",
    standards: [
      {
        code: 'IS 456:2000',
        title: 'Plain and Reinforced Concrete Code',
        description: 'Mandatory structural load calculations, slab thickness benchmarks, and concrete mix ratio compliance.',
      },
      {
        code: 'IS 1893:2016',
        title: 'Earthquake Resistant Design Standards',
        description: 'Zone-specific seismic analysis for Zone II, III, and IV territories across north and peninsular India.',
      },
      {
        code: 'NBC 2016',
        title: 'National Building Code of India',
        description: 'Universal room ventilation, fire egress, light shafts, and municipal setback adherence.',
      },
    ],
    leadership: [
      {
        name: 'Ar. Rajesh Verma',
        role: 'Chief Architectural Officer (COA Reg. CA/2004/33921)',
        bio: '20+ years of institutional and residential design experience across Central India and NCR.',
      },
      {
        name: 'Er. Vikramaditya Roy',
        role: 'Head of Civil Engineering & Geotechnical Standards',
        bio: 'Former consultant to national infrastructure projects; expert in raft foundation design and soil bearing capacity.',
      },
      {
        name: 'Priyanka Sharma',
        role: 'VP - Customer Experience & Platform Governance',
        bio: 'Specialist in escrow consumer protection frameworks, SLA mediation, and transparent construction milestone tracking.',
      },
    ],
    lastUpdated: new Date().toISOString(),
  },
  contactUs: {
    corporateOffice: {
      address: 'Tower B, 7th Floor, DLF Cyber City Phase 2, Sector 24',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      phone: '+91 (0124) 498-2000',
      email: 'contact@buildghar.com',
      mapUrl: 'https://maps.google.com/?q=Cyber+City+Gurugram',
    },
    regionalHubs: [
      {
        city: 'Indore',
        hubName: 'Central India Design Hub',
        address: 'B-402, Super Corridor Commercial Complex, Scheme 151, Indore, MP - 452005',
        leadContact: 'Er. Sanjay Rathore',
        phone: '+91 (0731) 298-1122',
      },
      {
        city: 'Bengaluru',
        hubName: 'Peninsular Innovation Hub',
        address: 'Level 4, Prestige Tech Cloud, International Airport Rd, Whitefield, Bengaluru - 560066',
        leadContact: 'Ar. Sneha Kulkarni',
        phone: '+91 (080) 678-4490',
      },
      {
        city: 'Kolkata',
        hubName: 'Eastern India Regional Desk',
        address: 'EcoSpace Business Park, Block 3B, New Town, Action Area II, Kolkata - 700160',
        leadContact: 'Er. A. K. Banerjee',
        phone: '+91 (033) 232-4411',
      },
    ],
    hotlines: {
      tollFree: '1800-202-GHAR (4427)',
      whatsapp: '+91 98765 43210',
      escalationEmail: 'grievance@buildghar.com',
      workingHours: 'Monday – Saturday: 09:30 AM – 07:30 PM IST (Closed Sundays & National Holidays)',
    },
    lastUpdated: new Date().toISOString(),
  },
  faqs: [
    {
      id: 'FAQ-001',
      category: 'HOMEOWNER',
      question: 'How does the BuildGhar 3-Architect Quotation mechanism work?',
      answer:
        'When you submit your plot dimensions and floor requirements, our algorithm nominates 3 Council of Architecture (COA) accredited firms specializing in your locality. Within 72 hours, all 3 firms submit itemized BOQ estimates and concept plans. You compare rates, credentials, and portfolio renderings side-by-side on your dashboard with zero obligation.',
      order: 1,
    },
    {
      id: 'FAQ-002',
      category: 'ESCROW_PAYMENT',
      question: 'How does BuildGhar platform escrow protect my construction funds?',
      answer:
        'Instead of paying 100% advance to contractors or architects, your funds remain securely deposited in an escrow trust account. The architect or civil contractor only receives their milestone payout (e.g. Milestone 1: Mobilization, Milestone 2: Structural Framing) AFTER you inspect the blueprints or site work and sign off.',
      order: 2,
    },
    {
      id: 'FAQ-003',
      category: 'ARCHITECT',
      question: 'What are the qualifications required for an architect to join BuildGhar?',
      answer:
        'All architects must hold an active Council of Architecture (COA) registration number, submit verified degree credentials from recognized universities, provide past sanction portfolio drawings, and pass a background verification audit before receiving tender assignments.',
      order: 3,
    },
    {
      id: 'FAQ-004',
      category: 'IS456_STANDARDS',
      question: 'What engineering standards are mandated for structural blueprints?',
      answer:
        'Every drawing released through BuildGhar complies with IS 456:2000 (Plain & Reinforced Concrete Code), IS 1893:2016 (Seismic Zone Criteria), and local municipal setback bylaws. Structural drawings include bar bending schedules (BBS), beam-column junction reinforcement details, and foundation raft sizing verified against soil bearing capacity.',
      order: 4,
    },
    {
      id: 'FAQ-005',
      category: 'DISPUTES',
      question: 'What happens if I am not satisfied with the architectural design?',
      answer:
        'Every package includes up to 2 major design revisions. If an architect fails to adhere to contracted municipal bylaws or contractual specifications, you can lodge a formal grievance under Section 15. The Grievance Desk freezes partner payouts, orders an independent technical redline review, or approves a full/partial escrow refund.',
      order: 5,
    },
    {
      id: 'FAQ-006',
      category: 'ESCROW_PAYMENT',
      question: 'What payment modes are supported for milestone deposits?',
      answer:
        'We support UPI (GPay, PhonePe, Paytm), Net Banking (all major Indian banks via Razorpay/Cashfree), NEFT/RTGS direct escrow virtual accounts, and Debit/Credit Cards. All receipts carry statutory GST tax invoices (18% SAC 9983).',
      order: 6,
    },
  ],
  termsConditions: {
    title: 'Master Platform Terms of Service & Architectural Agreement',
    version: '4.2',
    effectiveDate: '2026-01-01',
    lastUpdated: new Date().toISOString(),
    summary:
      'Governs homeowner registration, architect quotation tenders, escrow payment deposits, intellectual property, and arbitration under the Arbitration and Conciliation Act, 1996.',
    sections: [
      {
        heading: '1. Introduction and Platform Role',
        content:
          'BuildGhar Technologies Private Limited operates as an enterprise marketplace, structural compliance audit hub, and milestone escrow router. BuildGhar connects verified property owners ("Clients") with accredited architectural firms, interior designers, and civil contractors ("Service Partners"). BuildGhar acts as an authorized escrow agent and technical compliance reviewer.',
      },
      {
        heading: '2. Quotation Tendering & Non-Circumvention',
        content:
          'Service Partners nominated for quotation inquiries agree to submit binding, itemized BOQ estimates within the specified 72-hour SLA window. Clients and Partners explicitly agree not to circumvent the BuildGhar escrow framework to transact off-platform. Any off-platform contract solicitation nullifies platform structural warranties and results in immediate partner suspension.',
      },
      {
        heading: '3. Escrow Deposits and Milestone Vesting',
        content:
          'All client payments are held in platform escrow trust accounts. Milestone funds vest and become eligible for partner disbursement exclusively upon Client approval or upon technical clearance by BuildGhar Chief Architect. A 10% platform facilitation fee and statutory TDS (Section 194M/194C) are automatically deducted prior to net bank disbursement.',
      },
      {
        heading: '4. Intellectual Property & CAD Deliverables',
        content:
          'Upon full payment of the contracted milestone, the Client receives an exclusive, irrevocable license to construct the specified property utilizing the provided CAD, DWG, and BIM models. The Service Partner retains underlying moral rights but may not re-license identical bespoke floorplans within a 5-kilometer territory radius.',
      },
      {
        heading: '5. Dispute Resolution & Governing Law',
        content:
          'Any unresolved controversy or grievance arising under these Terms shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be New Delhi, India. The proceedings shall be conducted in English by a sole arbitrator appointed mutually by the parties.',
      },
    ],
  },
  privacyPolicy: {
    title: 'Privacy Policy & DPDP Act 2023 Compliance',
    version: '3.1',
    effectiveDate: '2026-01-01',
    lastUpdated: new Date().toISOString(),
    summary:
      'Outlines how BuildGhar collects, stores, tokenizes, and processes personal data, property survey logs, and payment details in strict accordance with the Digital Personal Data Protection Act, 2023.',
    sections: [
      {
        heading: '1. Collection of Personal & Property Information',
        content:
          'We collect mobile phone numbers for OTP authentication, identity KYC records (Aadhaar / Passport / Voter ID) for contract execution, plot registry numbers, geographic coordinates, and soil investigation test reports required for structural engineering sizing.',
      },
      {
        heading: '2. Security and Data Encryption Standards',
        content:
          'All customer and architectural telemetry is stored in secure Tier-IV data centers located within India. Data at rest is encrypted using 256-bit AES encryption; data in transit uses TLS 1.3 cryptographic protocols. Payment card numbers are tokenized by PCI-DSS Level 1 certified gateway partners; BuildGhar never stores raw CVV or card details.',
      },
      {
        heading: '3. Limited Third-Party Sharing for Municipal Sanction',
        content:
          'Architectural blueprints and property boundary coordinates are shared exclusively with nominated Council of Architecture partners and authorized municipal DTCP portal gateways solely for drawing drafting and building plan sanction approvals.',
      },
      {
        heading: '4. User Data Rights (DPDP Act 2023)',
        content:
          'You hold the right to access your personal data, request correction of erroneous property records, and nominate a representative in the event of incapacity. Data deletion requests are processed within 30 days, subject to statutory 7-year financial audit ledger retention laws.',
      },
    ],
  },
  cancellationPolicy: {
    title: 'Project Cancellation & Work Stoppage Policy',
    version: '2.4',
    effectiveDate: '2026-01-01',
    lastUpdated: new Date().toISOString(),
    summary:
      'Defines client and architect cancellation guidelines across tender, concept design, structural detailing, and site execution phases.',
    sections: [
      {
        heading: '1. Pre-Kickoff Tender Cancellation (Within 24 Hours)',
        content:
          'Clients may cancel tender requests within 24 hours of RFQ submission for a 100% refund of any preliminary consultation fees paid. Once 3 architectural firms have published customized drawings, the tender fee becomes non-refundable.',
      },
      {
        heading: '2. Cancellation During Milestone 1 (Concept & Sanctions)',
        content:
          'If a Client cancels during Milestone 1 prior to municipal submission, unspent escrow funds will be refunded after deduction of a fixed architectural mobilization fee of ₹15,000 to compensate the architect for initial zoning drafts.',
      },
      {
        heading: '3. Post-Municipal Approval Cancellation',
        content:
          'Once municipal sanction drawings or 3D elevation renders have been approved and released, that specific milestone is non-cancellable. Any subsequent future milestones deposited in escrow will be refunded in full within 5-7 banking days.',
      },
      {
        heading: '4. Force Majeure & Government Acquisition',
        content:
          'In events of statutory land acquisition, master plan road widening, or unforeseen geological faults, mutual cancellation is processed under Section 15 with zero penalty to either party.',
      },
    ],
  },
  refundPolicy: {
    title: 'Milestone Escrow Refund & Reimbursement Standards',
    version: '2.8',
    effectiveDate: '2026-01-01',
    lastUpdated: new Date().toISOString(),
    summary:
      'Outlines strict criteria for customer escrow refunds, technical review rejection reimbursements, and gateway refund timelines.',
    sections: [
      {
        heading: '1. 100% Escrow Protection Guarantee',
        content:
          'Every rupee deposited towards a construction milestone remains held in platform escrow trust. If a partner fails to deliver drawings meeting IS 456 standards or delays beyond contractual SLA by more than 14 days without client waiver, the Client is entitled to an immediate 100% escrow refund.',
      },
      {
        heading: '2. Structural Technical Review Inspection Failures',
        content:
          'If architectural or structural drawings fail the BuildGhar Chief Engineer review due to fundamental code violations (e.g. beam span deficits, insufficient reinforcement concrete cover) and the architect refuses to issue corrected sheets within 48 hours, a full milestone refund is approved.',
      },
      {
        heading: '3. Refund Disbursement Timelines & Channels',
        content:
          'All approved refunds are credited back to the original source instrument (UPI / NetBanking / Debit Card / RTGS) within 3 to 5 banking days. BuildGhar issues an official Credit Note and payment reversal receipt for accounting reconciliation.',
      },
      {
        heading: '4. Non-Refundable Statutory Fees',
        content:
          'Municipal scrutiny fees, stamp paper charges, and geotechnical core lab soil testing fees paid to external government agencies or NABL labs are non-refundable once testing has commenced.',
      },
    ],
  },
});

export const getPlatformCMS = (): PlatformCMSStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CMS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing CMS store:', e);
  }
  const seed = getDefaultSeedCMS();
  try {
    localStorage.setItem(STORAGE_KEY_CMS, JSON.stringify(seed));
  } catch {}
  return seed;
};

export const savePlatformCMS = (data: PlatformCMSStore): PlatformCMSStore => {
  try {
    localStorage.setItem(STORAGE_KEY_CMS, JSON.stringify(data));
    window.dispatchEvent(new Event('CMS_CONTENT_UPDATED'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving CMS store:', e);
  }
  return data;
};
