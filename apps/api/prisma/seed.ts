import { PrismaClient, Role, ProfessionalCategory, PropertyType, MeasurementUnit, RequestStatus, QuotationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GharDesign database with development fixtures...');

  // 1. Platform Settings
  const settings = [
    { key: 'QUOTE_REQUEST_FEE_PAISE', value: '49900', description: 'Nominal quotation request fee in paise (₹499)' },
    { key: 'GST_PERCENT', value: '18', description: 'Applicable GST percentage' },
    { key: 'PLATFORM_NAME', value: 'GharDesign', description: 'Platform branding name' },
    { key: 'MAX_QUOTATIONS_PER_REQUEST', value: '4', description: 'Maximum approved quotations sent to customer' },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. Service Categories
  const categories = [
    {
      slug: 'new-house-construction',
      name: 'New House Construction',
      description: 'End-to-end residential civil construction from earthwork to handover.',
      iconName: 'Building2',
    },
    {
      slug: 'home-renovation',
      name: 'Home Renovation',
      description: 'Complete home makeover, structural retrofitting, extensions and remodeling.',
      iconName: 'Hammer',
    },
    {
      slug: 'house-map-planning',
      name: 'House Map & Structural Planning',
      description: 'Vastu-compliant 2D plans, 3D elevations, working blueprints and sanction approvals.',
      iconName: 'Compass',
    },
    {
      slug: 'structural-engineering',
      name: 'Structural Engineering',
      description: 'RCC column-beam design, foundation vetting, soil analysis, and seismic stability.',
      iconName: 'ShieldCheck',
    },
    {
      slug: 'interior-designing',
      name: 'Interior Designing',
      description: 'Custom modular kitchens, premium false ceilings, wardrobes, and luxury interiors.',
      iconName: 'Paintbrush',
    },
    {
      slug: 'complete-construction-package',
      name: 'Complete Construction Package',
      description: 'Integrated structural planning, civil execution, and turnkey interior design.',
      iconName: 'CheckCircle2',
    },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    createdCategories[cat.slug] = record.id;
  }

  // 3. Admin User
  const adminUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      name: 'Platform Administrator',
      email: 'admin@ghardesign.in',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 4. Verified Associate Professionals
  // Professional 1: Civil Engineer
  const pro1User = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      phone: '9876543211',
      name: 'Ar. Rajesh Sharma',
      email: 'rajesh.sharma@studiosharma.in',
      role: Role.PROFESSIONAL,
      isActive: true,
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: pro1User.id },
    update: {},
    create: {
      userId: pro1User.id,
      firmName: 'Sharma & Associates Engineers',
      category: ProfessionalCategory.CIVIL_ENGINEER,
      qualifications: 'B.Arch (IIT Roorkee), COA Registered (CA/2012/58941)',
      experienceYears: 12,
      serviceCities: ['New Delhi', 'Gurugram', 'Noida', 'Faridabad'],
      portfolioUrls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      isVerified: true,
      availabilityStatus: true,
      verificationStatus: 'APPROVED',
    },
  });

  // Professional 2: Structural / Civil Engineer
  const pro2User = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: {},
    create: {
      phone: '9876543212',
      name: 'Er. Amit Verma',
      email: 'amit@vermastructurals.com',
      role: Role.PROFESSIONAL,
      isActive: true,
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: pro2User.id },
    update: {},
    create: {
      userId: pro2User.id,
      firmName: 'Verma Structural Engineering Consultants',
      category: ProfessionalCategory.STRUCTURAL_ENGINEER,
      qualifications: 'M.Tech Structural Engineering, Chartered Engineer (IEI)',
      experienceYears: 15,
      serviceCities: ['New Delhi', 'Noida', 'Ghaziabad', 'Greater Noida'],
      portfolioUrls: ['https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=800'],
      isVerified: true,
      availabilityStatus: true,
      verificationStatus: 'APPROVED',
    },
  });

  // Professional 3: Interior Designer
  const pro3User = await prisma.user.upsert({
    where: { phone: '9876543213' },
    update: {},
    create: {
      phone: '9876543213',
      name: 'Sunita Menon',
      email: 'sunita@aura-interiors.in',
      role: Role.PROFESSIONAL,
      isActive: true,
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: pro3User.id },
    update: {},
    create: {
      userId: pro3User.id,
      firmName: 'Aura Living Interior Studio',
      category: ProfessionalCategory.INTERIOR_DESIGNER,
      qualifications: 'Post Graduate Diploma in Interior Design, Member IIID',
      experienceYears: 9,
      serviceCities: ['New Delhi', 'Gurugram', 'Bengaluru'],
      portfolioUrls: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'],
      isVerified: true,
      availabilityStatus: true,
      verificationStatus: 'APPROVED',
    },
  });

  // 5. Customer User
  const customerUser = await prisma.user.upsert({
    where: { phone: '9876543220' },
    update: {},
    create: {
      phone: '9876543220',
      name: 'Registered Homeowner',
      email: 'homeowner@ghar-design.in',
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      city: 'Gurugram',
      state: 'Haryana',
      address: 'Plot 42, Sector 57, Gurugram',
    },
  });

  // 6. Sample Completed Project Request with Ready Quotations for Comparison
  const sampleRequest = await prisma.projectRequest.upsert({
    where: { requestCode: 'GHR-REQ-2026-1001' },
    update: {},
    create: {
      requestCode: 'GHR-REQ-2026-1001',
      customerId: customerUser.id,
      categoryId: createdCategories['new-house-construction'],
      status: RequestStatus.QUOTATIONS_AVAILABLE,
      propertyType: PropertyType.EMPTY_PLOT,
      plotWidth: 30,
      plotLength: 60,
      measurementUnit: MeasurementUnit.FEET,
      plotArea: 1800, // 30 x 60 = 1800 sq ft
      builtUpArea: 3200,
      floors: 3,
      bedrooms: 4,
      bathrooms: 4,
      kitchens: 2,
      currentCondition: 'Vacant plot, boundary wall constructed, soil testing required',
      city: 'Gurugram',
      state: 'Haryana',
      locality: 'Sector 57',
      address: 'Plot 42, Block C, Sushant Lok Phase 3',
      ownershipConfirmed: true,
      budgetRange: '₹50 Lakhs - ₹1 Crore',
      preferredStartDate: new Date('2026-11-01'),
      expectedCompletionDate: new Date('2027-10-31'),
      description: 'Looking to construct a G+2 modern Vastu compliant residential villa for a joint family with stilt car parking, modular kitchen, and rooftop terrace garden.',
      designStyle: 'Modern & Minimalist',
      siteAccessibilityNotes: 'Wide 40 ft road, electric & water connections available at site boundary.',
      quoteFeePaise: 49900,
      isFeePaid: true,
    },
  });

  // Services required
  const reqServices = ['2D Floor Plan', '3D Elevation & Walkthrough', 'Structural Load Calculations & RCC Drawings', 'Complete Civil Construction'];
  for (const s of reqServices) {
    await prisma.projectRequestService.create({
      data: {
        requestId: sampleRequest.id,
        serviceName: s,
      },
    });
  }

  // Request assignment to Pro 1 and Pro 2
  await prisma.requestAssignment.upsert({
    where: {
      requestId_professionalId: {
        requestId: sampleRequest.id,
        professionalId: pro1User.id,
      },
    },
    update: {},
    create: {
      requestId: sampleRequest.id,
      professionalId: pro1User.id,
      status: 'ACCEPTED',
      responseDeadline: new Date('2026-10-25'),
      internalNotes: 'Top rated engineer in Gurugram area',
    },
  });

  await prisma.requestAssignment.upsert({
    where: {
      requestId_professionalId: {
        requestId: sampleRequest.id,
        professionalId: pro2User.id,
      },
    },
    update: {},
    create: {
      requestId: sampleRequest.id,
      professionalId: pro2User.id,
      status: 'ACCEPTED',
      responseDeadline: new Date('2026-10-25'),
      internalNotes: 'Expert civil engineering firm',
    },
  });

  // Quotation 1 from Ar. Rajesh Sharma
  const quote1 = await prisma.quotation.upsert({
    where: { quotationCode: 'QT-2026-001' },
    update: {},
    create: {
      quotationCode: 'QT-2026-001',
      requestId: sampleRequest.id,
      professionalId: pro1User.id,
      status: QuotationStatus.PUBLISHED,
      internalReviewStatus: 'APPROVED',
      scopeOfWork: 'Complete structural planning package, Vastu floor layout, 3D photorealistic elevations, MEP coordination, and site vetting.',
      subtotalPaise: 18500000, // ₹1,85,000
      discountPaise: 1000000,  // ₹10,000
      taxPaise: 3150000,       // ₹31,500 (18% GST)
      finalAmountPaise: 20650000, // ₹2,06,500
      revisionsCount: 3,
      drawingFormats: ['AutoCAD DWG', 'High-Res PDF', '3D Blender Model'],
      siteVisitChargesPaise: 300000, // ₹3,000 per extra visit
      estimatedDurationDays: 45,
      advancePercentage: 25,
      validUntil: new Date('2026-11-15'),
      cancellationTerms: 'Full refund if cancelled before initial concept delivery. 50% deduction after 2D plan signoff.',
      adminFeedback: 'Quotation verified and approved for customer review.',
      publishedAt: new Date(),
    },
  });

  // Line items for Quote 1
  await prisma.quotationLineItem.createMany({
    data: [
      {
        quotationId: quote1.id,
        description: 'Comprehensive 2D Floor Plan Layouts (All 3 Floors + Stilt)',
        quantity: 3200,
        unit: 'sq.ft',
        unitPricePaise: 2500, // ₹25/sqft
        totalPaise: 8000000,  // ₹80,000
      },
      {
        quotationId: quote1.id,
        description: '3D Exterior Elevation Renderings (Day & Night views + Video walkthrough)',
        quantity: 1,
        unit: 'lumpsum',
        unitPricePaise: 4500000, // ₹45,000
        totalPaise: 4500000,
      },
      {
        quotationId: quote1.id,
        description: 'Municipal Sanction Drawings & Document Compilation',
        quantity: 1,
        unit: 'set',
        unitPricePaise: 3500000, // ₹35,000
        totalPaise: 3500000,
      },
      {
        quotationId: quote1.id,
        description: 'Electrical, Plumbing & HVAC (MEP) Integrated Layouts',
        quantity: 1,
        unit: 'set',
        unitPricePaise: 2500000, // ₹25,000
        totalPaise: 2500000,
      },
    ],
  });

  // Deliverables for Quote 1
  await prisma.quotationDeliverable.createMany({
    data: [
      { quotationId: quote1.id, title: 'Complete 2D Floor Plan CAD Files', isIncluded: true },
      { quotationId: quote1.id, title: '4K Ultra HD 3D Elevation Renders (4 Angles)', isIncluded: true },
      { quotationId: quote1.id, title: 'Vastu Shastra Compliance Certificate & Grid Map', isIncluded: true },
      { quotationId: quote1.id, title: '6 On-Site Milestone Supervision Visits', isIncluded: true },
      { quotationId: quote1.id, title: 'Material Procurement & Bill of Quantities (BOQ)', isIncluded: true },
    ],
  });

  // Milestones for Quote 1
  await prisma.quotationMilestone.createMany({
    data: [
      { quotationId: quote1.id, title: 'Milestone 1: Booking & Concept Layouts', percentage: 25, amountPaise: 5162500, description: 'Initial floor concepts & Vastu zoning' },
      { quotationId: quote1.id, title: 'Milestone 2: Final 2D Blueprints Sign-off', percentage: 35, amountPaise: 7227500, description: 'Final working drawings & dimensions' },
      { quotationId: quote1.id, title: 'Milestone 3: 3D Elevation & MEP Drawings', percentage: 25, amountPaise: 5162500, description: 'Renders, electrical and plumbing plans' },
      { quotationId: quote1.id, title: 'Milestone 4: Final Handover & Sanction Files', percentage: 15, amountPaise: 3097500, description: 'Final deliverable sign-off' },
    ],
  });

  // Quotation 2 from Er. Amit Verma
  const quote2 = await prisma.quotation.upsert({
    where: { quotationCode: 'QT-2026-002' },
    update: {},
    create: {
      quotationCode: 'QT-2026-002',
      requestId: sampleRequest.id,
      professionalId: pro2User.id,
      status: QuotationStatus.PUBLISHED,
      internalReviewStatus: 'APPROVED',
      scopeOfWork: 'Comprehensive Structural RCC Design, Soil Bearing Capacity Analysis, Column-Beam Detailing, and Seismic Zone IV Structural Certification.',
      subtotalPaise: 16000000, // ₹1,60,000
      discountPaise: 500000,   // ₹5,000
      taxPaise: 2790000,       // ₹27,900 (18% GST)
      finalAmountPaise: 18290000, // ₹1,82,900
      revisionsCount: 2,
      drawingFormats: ['AutoCAD DWG', 'Structural STAAD Pro Analysis Report', 'PDF'],
      siteVisitChargesPaise: 250000, // ₹2,500 per visit
      estimatedDurationDays: 30,
      advancePercentage: 20,
      validUntil: new Date('2026-11-20'),
      cancellationTerms: '70% refund before soil test calculation. No refund once bar bending schedule is issued.',
      adminFeedback: 'Structural engineering scope verified and approved.',
      publishedAt: new Date(),
    },
  });

  // Line items for Quote 2
  await prisma.quotationLineItem.createMany({
    data: [
      {
        quotationId: quote2.id,
        description: 'Complete RCC Structural Analysis & Column Centerline Layout',
        quantity: 3200,
        unit: 'sq.ft',
        unitPricePaise: 2200, // ₹22/sqft
        totalPaise: 7040000,
      },
      {
        quotationId: quote2.id,
        description: 'Foundation Engineering & Soil Bearing Test Vetting',
        quantity: 1,
        unit: 'job',
        unitPricePaise: 3500000,
        totalPaise: 3500000,
      },
      {
        quotationId: quote2.id,
        description: 'Bar Bending Schedule (BBS) & Steel Reinforcement Details',
        quantity: 1,
        unit: 'set',
        unitPricePaise: 3000000,
        totalPaise: 3000000,
      },
      {
        quotationId: quote2.id,
        description: 'Structural Stability Certificate (Seismic Zone IV Compliant)',
        quantity: 1,
        unit: 'certificate',
        unitPricePaise: 2460000,
        totalPaise: 2460000,
      },
    ],
  });

  // Deliverables for Quote 2
  await prisma.quotationDeliverable.createMany({
    data: [
      { quotationId: quote2.id, title: 'Certified Structural Stability Certificate', isIncluded: true },
      { quotationId: quote2.id, title: 'Detailed Foundation, Column & Beam RCC Drawings', isIncluded: true },
      { quotationId: quote2.id, title: 'Steel Bar Bending Schedule (BBS) for Contractor', isIncluded: true },
      { quotationId: quote2.id, title: '4 Mandatory Foundation & Slab Casting Inspections', isIncluded: true },
    ],
  });

  // Milestones for Quote 2
  await prisma.quotationMilestone.createMany({
    data: [
      { quotationId: quote2.id, title: 'Milestone 1: Soil Test & Column Layout', percentage: 20, amountPaise: 3658000, description: 'Centerline and footing details' },
      { quotationId: quote2.id, title: 'Milestone 2: Plinth Beam & Column RCC Details', percentage: 40, amountPaise: 7316000, description: 'Steel detailing up to plinth' },
      { quotationId: quote2.id, title: 'Milestone 3: Slab RCC & Final Stability Certificate', percentage: 40, amountPaise: 7316000, description: 'Roof slab drawings and certificate' },
    ],
  });

  console.log('✅ GharDesign database seeded successfully!');
  console.log('👤 Admin: 9876543210');
  console.log('👷 Engineer Pro: 9876543211');
  console.log('👷 Structural Pro: 9876543212');
  console.log('👷 Interior Pro: 9876543213');
  console.log('🏠 Customer: 9876543220');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
