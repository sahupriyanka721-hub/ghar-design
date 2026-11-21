// ==============================================================================
// BUILDGHAR MULTI-TENANT SUBDOMAIN & PORTAL ROUTING ENGINE
// Supports:
// 1. Production: admin.buildghar.in, vendor.buildghar.in, architect.buildghar.in, interior.buildghar.in
// 2. Localhost: admin.localhost, vendor.localhost, architect.localhost, interior.localhost
// 3. Fallback path routes: /admin, /vendor, /architect, /interior-designer on main domain
// ==============================================================================

export type SubdomainType = 'customer' | 'admin' | 'vendor' | 'architect' | 'interior' | 'main';

export interface PortalConfig {
  id: SubdomainType;
  name: string;
  subdomain: string;
  defaultPath: string;
  badgeColor: string;
  description: string;
  targetAudience: string;
}

export const PORTAL_CONFIGS: Record<SubdomainType, PortalConfig> = {
  customer: {
    id: 'customer',
    name: 'Homeowner Customer Hub',
    subdomain: 'customer',
    defaultPath: '/dashboard',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Track Home Construction, Milestone Escrow, Drawing Approvals & Cost Estimator',
    targetAudience: 'Homeowners & Construction Clients',
  },
  main: {
    id: 'main',
    name: 'BuildGhar Homes & Construction',
    subdomain: 'www',
    defaultPath: '/',
    badgeColor: 'bg-navy-950 text-white',
    description: 'Public Website, Cost Calculator, Materials Store & Homeowner Customer Portal',
    targetAudience: 'Homeowners & Public Clients',
  },
  admin: {
    id: 'admin',
    name: 'Super Admin Control Center',
    subdomain: 'admin',
    defaultPath: '/admin',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Centralized Platform Operations, Financial Settlements, Team Matching & KYC Approvals',
    targetAudience: 'Platform Directors & Staff',
  },
  vendor: {
    id: 'vendor',
    name: 'Material Depot & Vendor Portal',
    subdomain: 'vendor',
    defaultPath: '/vendor',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Depot Store Inventory, Construction Material Orders, Fleet Delivery & UTR Settlements',
    targetAudience: 'Building Material Vendors & Depots',
  },
  architect: {
    id: 'architect',
    name: 'Architect & Engineering Network',
    subdomain: 'architect',
    defaultPath: '/architect',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'COA Registered Architects, 2D Floor Plans, 3D Elevation & RCC Structural Drawings',
    targetAudience: 'Chartered Architects & Structural Engineers',
  },
  interior: {
    id: 'interior',
    name: 'Interior Designer & Decor Studio',
    subdomain: 'interior',
    defaultPath: '/interior-designer',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: '3D Photorealistic Interior Renders, Turnkey Home Decor & Furniture BOQs',
    targetAudience: 'Interior Designers & Spatial Decorators',
  },
};

/**
 * Detect the current active subdomain from window.location.hostname
 */
export function getSubdomain(): SubdomainType {
  if (typeof window === 'undefined') return 'main';

  const hostname = window.location.hostname.toLowerCase();

  // Clean root localhost or IP address (e.g. 127.0.0.1 or localhost:5173)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'main';
  }

  // Localhost or live subdomains
  // e.g. customer.localhost, customer.buildghar.in, app.buildghar.in
  if (
    hostname.startsWith('customer.') ||
    hostname.startsWith('customer-') ||
    hostname.startsWith('app.') ||
    hostname.startsWith('app-') ||
    hostname.startsWith('my.') ||
    hostname.startsWith('my-')
  ) {
    return 'customer';
  }

  if (hostname.startsWith('admin.') || hostname.startsWith('admin-')) {
    return 'admin';
  }

  if (hostname.startsWith('vendor.') || hostname.startsWith('vendor-') || hostname.startsWith('depot.')) {
    return 'vendor';
  }

  if (hostname.startsWith('architect.') || hostname.startsWith('architect-')) {
    return 'architect';
  }

  if (
    hostname.startsWith('interior.') ||
    hostname.startsWith('interior-') ||
    hostname.startsWith('designer.') ||
    hostname.startsWith('designer-')
  ) {
    return 'interior';
  }

  return 'main';
}

/**
 * Generate portal URL for cross-subdomain links
 */
export function getPortalUrl(target: SubdomainType, path: string = ''): string {
  if (typeof window === 'undefined') return path;

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  const config = PORTAL_CONFIGS[target];

  // If on localhost (e.g. localhost:5173):
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    if (target === 'main') {
      return `${protocol}//localhost${port}${path || '/'}`;
    }
    return `${protocol}//${config.subdomain}.localhost${port}${path || '/'}`;
  }

  // If on a live production domain (e.g. buildghar.in):
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // If already has 3 parts (e.g. admin.buildghar.in), strip current subdomain
    const rootDomain = parts.length > 2 ? parts.slice(1).join('.') : parts.join('.');
    if (target === 'main') {
      return `${protocol}//${rootDomain}${port}${path || '/'}`;
    }
    return `${protocol}//${config.subdomain}.${rootDomain}${port}${path || '/'}`;
  }

  // Fallback to path-based routing if domain parsing fails
  const prefix = config.defaultPath === '/' ? '' : config.defaultPath;
  return `${prefix}${path}`;
}
