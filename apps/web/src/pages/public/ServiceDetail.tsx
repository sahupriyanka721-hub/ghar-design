import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldAlert, FileText, Calendar, Layers } from 'lucide-react';

const SERVICE_DETAILS: Record<string, any> = {
  'new-house-construction': {
    title: 'New House Construction',
    subtitle: 'Residential civil construction from soil excavation to final key handover.',
    overview: 'Our new house construction service connects you with verified civil engineering contractors who construct homes adhering strictly to IS codes, Fe550D steel rebar specifications, Grade 43/53 cement, and integrated anti-termite treatment.',
    deliverables: [
      'Site layout demarcation, foundation excavation, and anti-termite chemical barrier',
      'RCC column, plinth beam, and slab casting using standardized RMC or site-batched M20/M25 concrete',
      'Red clay brick or AAC block masonry with chicken wire mesh plaster reinforcement',
      'Concealed plumbing using CPVC/UPVC pipes with pressure testing',
      'Concealed FR electrical wiring with modular switches and DB panel',
      'Vitrified flooring, waterproofing of wet areas, and exterior weather-coat painting',
    ],
    timeline: '8 - 14 Months (depending on built-up area and number of floors)',
  },
  'home-renovation': {
    title: 'Home Renovation & Remodeling',
    subtitle: 'Structural retrofitting, space optimization, floor additions, and modern aesthetic upgrades.',
    overview: 'Transform an aging residential property into a contemporary luxury space. Our certified structural engineers assess load-bearing walls prior to any demolition, ensuring 100% structural stability.',
    deliverables: [
      'Structural health audit and non-destructive testing (NDT) if required',
      'Safe demolition of non-load bearing partitions with debris disposal',
      'Bathroom and kitchen plumbing overhaul with premium waterproofing',
      'Modern flooring overlay / tile replacement and wall skim-coating',
      'Facade modern elevation treatments and balcony extensions',
    ],
    timeline: '2 - 6 Months',
  },
  'house-map-planning': {
    title: 'House Map & Structural Planning',
    subtitle: 'Vastu-compliant 2D building layouts, 3D photorealistic elevations, and municipal approval drawings.',
    overview: 'Work with accredited engineering consultants and certified planners. We develop space-efficient floor plans that maximize natural daylight, cross-ventilation, and privacy while fulfilling local building bylaws.',
    deliverables: [
      'Comprehensive 2D working floor plans with precise dimension callouts',
      'Vastu Shastra directional alignment grid and zoning analysis',
      '4K photorealistic 3D exterior elevations (Day & Night perspectives)',
      'Detailed door/window schedules and working execution blueprints',
      'Municipal sanction drawings formatted for local development authorities',
    ],
    timeline: '2 - 4 Weeks',
  },
  'structural-engineering': {
    title: 'Structural Engineering & RCC Design',
    subtitle: 'Seismic Zone compliant RCC design, column-beam layouts, and soil vetting.',
    overview: 'Ensure your building stands resilient for decades. Our chartered structural engineers calculate exact dead loads, live loads, and seismic factors to provide optimized steel reinforcement schedules.',
    deliverables: [
      'Foundation layout and footing sizing based on Soil Safe Bearing Capacity (SBC)',
      'Column centerline drawings, size specifications, and longitudinal rebar schedules',
      'Plinth beam, lintel, and roof slab RCC reinforcement drawings',
      'Bar Bending Schedule (BBS) to prevent contractor steel pilferage',
      'Official Structural Stability Certificate stamped by Chartered Engineer (IEI)',
    ],
    timeline: '10 - 20 Days',
  },
  'interior-designing': {
    title: 'Interior Designing',
    subtitle: 'Bespoke modular kitchens, false ceiling, ambient lighting design, and handcrafted wardrobes.',
    overview: 'Elevate your daily living with personalized luxury interiors. Our interior designers curate materials, color palettes, acoustic false ceilings, and ergonomic cabinetry tailored to your lifestyle.',
    deliverables: [
      'Full 3D interior renders of living room, master suite, and modular kitchen',
      'Custom cabinetry working drawings with German hardware specifications (Hettich/Hafele)',
      'Gypsum false ceiling layouts with multi-tier cove lighting and electrical coordinates',
      'Material swatch board (laminates, acrylic, quartz, veneer) and finish schedules',
      'Bespoke carpentry, painting, and on-site fitout supervision',
    ],
    timeline: '4 - 10 Weeks',
  },
  'complete-construction-package': {
    title: 'Complete Construction Package',
    subtitle: 'The master integration: Engineering Planning + Civil Construction + Luxury Interior Design.',
    overview: 'Experience total peace of mind with our unified package. Structural engineering, civil execution, and interior design work in complete harmony under single-point accountability.',
    deliverables: [
      'Everything from House Map Planning (2D + 3D elevations)',
      'Everything from Structural Engineering (RCC drawings + Stability certificate)',
      'Civil Construction from foundation to completion',
      'Complete modular interior fitout and designer false ceilings',
      'Dedicated project manager with weekly progress reports and site CCTV coordination',
    ],
    timeline: '10 - 16 Months',
  },
};

interface ServiceDetailProps {
  serviceSlug?: string;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceSlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const effectiveSlug = serviceSlug || slug;
  const service = (effectiveSlug && SERVICE_DETAILS[effectiveSlug]) || SERVICE_DETAILS['new-house-construction'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <Link to="/services" className="text-xs font-semibold text-gold-600 hover:text-gold-700 flex items-center gap-1">
          ← Back to All Services
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-navy-950">{service.title}</h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">{service.subtitle}</p>
      </div>

      <div className="card p-8 space-y-6">
        <h2 className="text-lg font-bold font-display text-navy-950">Service Overview</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{service.overview}</p>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-navy-950 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold-600" /> Standard Included Deliverables:
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            {(service.deliverables || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-gold-600" />
          <span>Typical Project Duration: </span>
          <span className="font-semibold text-slate-800">{service.timeline}</span>
        </div>
      </div>

      <div className="bg-navy-900 rounded-xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display">Ready to get quotations for {service.title}?</h3>
          <p className="text-xs text-slate-300">Submit your property requirements and receive vetted quotes.</p>
        </div>
        <Link
          to={`/dashboard/create-request?category=${slug}`}
          className="btn-gold py-3 px-6 text-xs whitespace-nowrap flex items-center gap-2"
        >
          <span>Get Quotations Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
