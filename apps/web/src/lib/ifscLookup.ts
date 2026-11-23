// Indian Banking IFSC Lookup Utility
// Free, public lookup using standard Razorpay IFSC API with instant local cache fallback

export interface IfscLookupResult {
  bankName: string;
  branchName: string;
  city: string;
  state?: string;
  district?: string;
  fullBranchText: string;
  address?: string;
  isSuccess: boolean;
  source: 'api' | 'known_cache' | 'prefix' | 'none';
  errorMessage?: string;
}

export const KNOWN_IFSC_BANKS: Record<string, string> = {
  SBIN: 'State Bank of India (SBI)',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  AXIS: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  PUNB: 'Punjab National Bank (PNB)',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  INDB: 'IndusInd Bank',
  BKID: 'Bank of India',
  IDFB: 'IDFC FIRST Bank',
  YESB: 'Yes Bank',
  IDIB: 'Indian Bank',
  CBIN: 'Central Bank of India',
  IOBA: 'Indian Overseas Bank',
  UCBA: 'UCO Bank',
  MAHB: 'Bank of Maharashtra',
  PSIB: 'Punjab & Sind Bank',
  FDRL: 'Federal Bank',
  SIBL: 'South Indian Bank',
  IBKL: 'IDBI Bank',
  RATN: 'RBL Bank',
  BDBL: 'Bandhan Bank',
  CIUB: 'City Union Bank',
  KVBL: 'Karur Vysya Bank',
  TMBL: 'Tamilnad Mercantile Bank',
  JAKA: 'Jammu & Kashmir Bank',
  KARB: 'Karnataka Bank',
  AUBL: 'AU Small Finance Bank',
  ESFB: 'Equitas Small Finance Bank',
  UJVN: 'Ujjivan Small Finance Bank',
  SCBL: 'Standard Chartered Bank',
  CITI: 'Citibank',
  HSBC: 'HSBC Bank',
  DBSS: 'DBS Bank',
  PYTM: 'Paytm Payments Bank',
  AIRP: 'Airtel Payments Bank',
  IPOS: 'India Post Payments Bank',
  SRCB: 'Saraswat Cooperative Bank',
  COSB: 'Cosmos Cooperative Bank',
  SVCB: 'SVC Co-operative Bank',
};

// Known IFSC code mappings for instant offline/fast lookup
export const KNOWN_IFSC_BRANCHES: Record<string, { bank: string; branch: string; city: string; state?: string }> = {
  HDFC0000123: { bank: 'HDFC Bank', branch: 'Ashok Vihar', city: 'New Delhi', state: 'Delhi' },
  HDFC0000001: { bank: 'HDFC Bank', branch: 'Kanjurmarg', city: 'Mumbai', state: 'Maharashtra' },
  HDFC0000452: { bank: 'HDFC Bank', branch: 'C-Scheme', city: 'Jaipur', state: 'Rajasthan' },
  SBIN0001234: { bank: 'State Bank of India (SBI)', branch: 'Delhi Main Branch', city: 'New Delhi', state: 'Delhi' },
  SBIN0000427: { bank: 'State Bank of India (SBI)', branch: 'Bhopal Main Branch', city: 'Bhopal', state: 'Madhya Pradesh' },
  SBIN0000378: { bank: 'State Bank of India (SBI)', branch: 'Indore Main Branch', city: 'Indore', state: 'Madhya Pradesh' },
  SBIN0000691: { bank: 'State Bank of India (SBI)', branch: 'Lucknow Main Branch', city: 'Lucknow', state: 'Uttar Pradesh' },
  ICIC0000001: { bank: 'ICICI Bank', branch: 'Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra' },
  ICIC0000007: { bank: 'ICICI Bank', branch: 'Connaught Place', city: 'New Delhi', state: 'Delhi' },
  ICIC0000035: { bank: 'ICICI Bank', branch: 'Bhopal MP Nagar', city: 'Bhopal', state: 'Madhya Pradesh' },
  PUNB0123456: { bank: 'Punjab National Bank (PNB)', branch: 'Sector 17', city: 'Chandigarh', state: 'Chandigarh' },
  UTIB0000001: { bank: 'Axis Bank', branch: 'Ahmedabad Main', city: 'Ahmedabad', state: 'Gujarat' },
  UTIB0000060: { bank: 'Axis Bank', branch: 'Indore MG Road', city: 'Indore', state: 'Madhya Pradesh' },
  KKBK0000123: { bank: 'Kotak Mahindra Bank', branch: 'Nariman Point', city: 'Mumbai', state: 'Maharashtra' },
  BARB0BHOPAL: { bank: 'Bank of Baroda', branch: 'MP Nagar Zone 1', city: 'Bhopal', state: 'Madhya Pradesh' },
  BARB0INDORE: { bank: 'Bank of Baroda', branch: 'Indore City Branch', city: 'Indore', state: 'Madhya Pradesh' },
  CNRB0000123: { bank: 'Canara Bank', branch: 'Town Hall', city: 'Bengaluru', state: 'Karnataka' },
};

/**
 * Look up Bank Name and Branch & City using an 11-digit Indian IFSC code.
 */
export async function lookupIfscCode(rawCode: string): Promise<IfscLookupResult> {
  const clean = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
  if (clean.length !== 11) {
    return {
      bankName: '',
      branchName: '',
      city: '',
      fullBranchText: '',
      isSuccess: false,
      source: 'none',
      errorMessage: 'IFSC must be 11 characters.',
    };
  }

  // 1. Check instant offline lookup first
  const offline = KNOWN_IFSC_BRANCHES[clean];
  if (offline) {
    const full = [offline.branch, offline.city].filter(Boolean).join(', ');
    return {
      bankName: offline.bank,
      branchName: offline.branch,
      city: offline.city,
      state: offline.state,
      fullBranchText: full,
      isSuccess: true,
      source: 'known_cache',
    };
  }

  // 2. Fetch live data from Razorpay open API with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://ifsc.razorpay.com/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawBank = (data.BANK || '').trim();
      const prefix = clean.slice(0, 4);
      const prefixBank = KNOWN_IFSC_BANKS[prefix];
      const bankName = prefixBank || rawBank;
      const branchName = (data.BRANCH || '').trim();
      const city = (data.CITY || data.CENTRE || data.DISTRICT || '').trim();
      const state = (data.STATE || '').trim();
      const full = [branchName, city].filter(Boolean).join(', ');

      return {
        bankName,
        branchName,
        city,
        state,
        district: data.DISTRICT,
        address: data.ADDRESS,
        fullBranchText: full,
        isSuccess: true,
        source: 'api',
      };
    }
  } catch {
    // Network or timeout failure - fall through to prefix fallback
  }

  // 3. Fallback to 4-character prefix lookup (SBIN, HDFC, etc.)
  const prefix = clean.slice(0, 4);
  const prefixBank = KNOWN_IFSC_BANKS[prefix];
  if (prefixBank) {
    return {
      bankName: prefixBank,
      branchName: '',
      city: '',
      fullBranchText: '',
      isSuccess: false,
      source: 'prefix',
      errorMessage: `Bank identified as ${prefixBank}. Please enter branch name & city manually.`,
    };
  }

  return {
    bankName: '',
    branchName: '',
    city: '',
    fullBranchText: '',
    isSuccess: false,
    source: 'none',
    errorMessage: 'Could not auto-fetch branch. Please enter Branch Name & City manually.',
  };
}
