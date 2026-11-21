export const SERVICE_CATEGORIES = [
  {
    slug: 'architectural-design',
    name: 'Architectural Design',
    shortDescription: 'Comprehensive concept drawings, functional space layouts & master architectural planning.',
    icon: 'Building2',
  },
  {
    slug: 'house-map-planning',
    name: 'House Map / Floor Plan',
    shortDescription: '2D floor plans, Vastu compliance, municipal approval drawings, and structural layouts.',
    icon: 'Compass',
  },
  {
    slug: 'structural-engineering',
    name: 'Structural Design',
    shortDescription: 'RCC column design, beam details, load calculations, and soil test vetting.',
    icon: 'ShieldCheck',
  },
  {
    slug: 'civil-engineering-consultancy',
    name: 'Civil Engineering Consultancy',
    shortDescription: 'Professional engineering vetting, foundation audits, material testing & stability certification.',
    icon: 'ShieldCheck',
  },
  {
    slug: 'interior-designing',
    name: 'Interior Design',
    shortDescription: 'Modular kitchens, false ceiling, bespoke lighting, wardrobes and turnkey aesthetics.',
    icon: 'Paintbrush',
  },
  {
    slug: '2d-planning',
    name: '2D Planning',
    shortDescription: 'High-precision 2D floor plans, working blueprints, door-window schedules & circulation plans.',
    icon: 'FileText',
  },
  {
    slug: '3d-elevation',
    name: '3D Elevation',
    shortDescription: 'Modern, classical or contemporary exterior facade 3D renders with day/night lighting.',
    icon: 'Sparkles',
  },
  {
    slug: '3d-interior-rendering',
    name: '3D Interior Rendering',
    shortDescription: 'Photorealistic 360-degree interior visualisations for living, kitchen, bedrooms and baths.',
    icon: 'Eye',
  },
  {
    slug: 'new-house-construction',
    name: 'New House Construction',
    shortDescription: 'Turnkey residential civil construction from excavation to finishing with escrow milestones.',
    icon: 'Building2',
  },
  {
    slug: 'home-renovation',
    name: 'Home Renovation',
    shortDescription: 'Structural repairs, floor extensions, space redesign, water-proofing and modernization.',
    icon: 'Hammer',
  },
  {
    slug: 'complete-construction-package',
    name: 'Complete Construction Package',
    shortDescription: 'End-to-end integration: Architecture + Civil Engineering + Interior Design + Materials.',
    icon: 'CheckCircle2',
  },
  {
    slug: 'commercial-construction',
    name: 'Commercial Construction',
    shortDescription: 'Office spaces, retail shops, showrooms and commercial complex engineering.',
    icon: 'Briefcase',
  },
  {
    slug: 'mep-planning',
    name: 'Plumbing and Electrical Planning',
    shortDescription: 'Sanitary conduit engineering, conduit piping, load phase distribution and water supply layouts.',
    icon: 'Wrench',
  },
  {
    slug: 'site-supervision',
    name: 'Site Supervision & Project Audit',
    shortDescription: 'Daily stage inspections, quality batch testing, BOQ verification and work certification.',
    icon: 'Eye',
  },
  {
    slug: 'boq-estimation',
    name: 'Material Estimation / BOQ',
    shortDescription: 'Independent bill of quantities, steel, cement & masonry budget estimation with itemized pricing.',
    icon: 'Calculator',
  },
  {
    slug: 'other-custom-service',
    name: 'Other Custom Service',
    shortDescription: 'Bespoke architectural, engineering, landscape or specialty construction requirements.',
    icon: 'Layers',
  },
] as const;

export const SERVICE_OPTIONS = [
  '2D Floor Plan',
  '3D Elevation & Walkthrough',
  'Architectural Working Drawings',
  'Structural Load Calculations & RCC Drawings',
  'Electrical & Plumbing (MEP) Layouts',
  'Detailed Bill of Quantities (BOQ) & Estimate',
  'Complete Civil Construction',
  'Turnkey Interior Designing',
  'Modular Kitchen Design',
  'Furniture & False Ceiling Layout',
  'Renovation / Space Remodeling',
  'Site Soil Testing & Foundation Design',
  'Independent Site Supervision & Audit',
] as const;

export const BUDGET_RANGES = [
  '₹5 Lakhs - ₹15 Lakhs',
  '₹15 Lakhs - ₹30 Lakhs',
  '₹30 Lakhs - ₹50 Lakhs',
  '₹50 Lakhs - ₹1 Crore',
  '₹1 Crore - ₹2.5 Crores',
  'Above ₹2.5 Crores',
] as const;

export const DESIGN_STYLES = [
  'Modern & Minimalist',
  'Contemporary Indian',
  'Traditional / Vastu Oriented',
  'Neo-Classical / Luxury European',
  'Industrial & Rustic',
  'Eco-Friendly / Sustainable',
] as const;

export const DEFAULT_REQUEST_FEE_PAISE = 49900; // ₹499

// -------------------------------------------------------------
// 10 CONSTRUCTION STAGES (As specified in Section 7.3)
// -------------------------------------------------------------
export const CONSTRUCTION_STAGES = [
  { stageNumber: 1, name: 'Requirements & Site Survey', description: 'Soil investigation, contour measurement, and zoning setback verification.' },
  { stageNumber: 2, name: 'Planning & Drawings', description: 'Architectural 2D blueprints, working floor plans and structural frames.' },
  { stageNumber: 3, name: 'Design Approval', description: 'Customer signoff on 3D elevations and municipal submission set.' },
  { stageNumber: 4, name: 'Estimate & BOQ', description: 'Finalized bill of quantities, concrete grade, and rebar scheduling.' },
  { stageNumber: 5, name: 'Foundation Work', description: 'Excavation, PCC bed, column footings, and plinth beam casting.' },
  { stageNumber: 6, name: 'Structural Work', description: 'RCC columns, slab shuttering, beam reinforcement, and brick masonry.' },
  { stageNumber: 7, name: 'Electrical & Plumbing (MEP)', description: 'Wall chasing, conduit laying, sanitary drain lines, and pressure testing.' },
  { stageNumber: 8, name: 'Flooring & Finishing', description: 'Plastering, tile setting, door-window frames, putty, and primer.' },
  { stageNumber: 9, name: 'Final Inspection & Snagging', description: 'Quality checklist audit, leak test, fixture alignment, and touch-ups.' },
  { stageNumber: 10, name: 'Handover & Settlement', description: 'Key handover, warranty dossiers, completion certification, and settlement.' },
] as const;

// -------------------------------------------------------------
// 10 INTERIOR STAGES (As specified in Section 7.3)
// -------------------------------------------------------------
export const INTERIOR_STAGES = [
  { stageNumber: 1, name: 'Requirement Gathering', description: 'Lifestyle interview, aesthetic preferences, and budget boundary review.' },
  { stageNumber: 2, name: 'Concept & Mood Board', description: 'Color palette, material swatches, lighting style, and thematic direction.' },
  { stageNumber: 3, name: 'Space Planning', description: '2D furniture placement, ergonomic circulation, and spatial optimization.' },
  { stageNumber: 4, name: '3D Design & Walkthrough', description: 'High-res photorealistic 3D renders for living, kitchen, and bedrooms.' },
  { stageNumber: 5, name: 'Customer Approval', description: 'Client sign-off on design versions, hardware brands, and laminates.' },
  { stageNumber: 6, name: 'Material Selection', description: 'Physical showroom/sample inspection of veneers, quartz, tiles, and fittings.' },
  { stageNumber: 7, name: 'Procurement & Factory Fab', description: 'Factory CNC processing of modular carcasses, shutters, and hardware packing.' },
  { stageNumber: 8, name: 'Site Installation', description: 'False ceiling framing, electrical points, on-site assembly of modular units.' },
  { stageNumber: 9, name: 'Quality Inspection', description: 'Hinge alignment, drawer runners load test, edge-band checking, and polish.' },
  { stageNumber: 10, name: 'Styling & Handover', description: 'Deep cleaning, soft furnishings styling, handover kit, and warranty docs.' },
] as const;

// -------------------------------------------------------------
// MATERIAL CATEGORIES (As specified in Section 8.1)
// -------------------------------------------------------------
export const MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All Materials' },
  { id: 'cement', name: 'Cement & Concrete' },
  { id: 'steel', name: 'Steel & Reinforcement' },
  { id: 'bricks', name: 'Bricks & AAC Blocks' },
  { id: 'sand', name: 'Sand & Aggregates' },
  { id: 'tiles', name: 'Tiles & Flooring' },
  { id: 'paints', name: 'Paint & Coatings' },
  { id: 'electrical', name: 'Electrical & Lighting' },
  { id: 'plumbing', name: 'Plumbing & Sanitary' },
  { id: 'furniture', name: 'Furniture & Decor' },
  { id: 'doors-windows', name: 'Doors & Windows' },
  { id: 'hardware', name: 'Hardware & Fittings' },
] as const;
