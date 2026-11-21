import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  User,
  Building2,
  Layers,
  Image as ImageIcon,
  FileCheck2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Award,
  CreditCard,
  Briefcase,
  FileText,
  Clock,
  Eye,
  Search,
  ChevronDown,
  Check,
  X,
  Users,
  Sliders,
  Download,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  ALL_ARCHITECTURAL_SERVICES,
  ArchitectBusinessType,
  ArchitectPortfolioProject,
  ArchitectKycDocument,
  DirectorKycEntry,
  BusinessVerificationDetails,
  getArchitectByPhone,
  saveArchitectAccount,
  formatArchitectId,
  generateArchitectId,
  generateArchitectApplicationNumber,
  ArchitectAccount,
} from '../../data/architectStore.js';
import { saveOriginalFile, getOriginalFile } from '../../lib/documentStore.js';
import { pushToCloud } from '../../data/cloudSync.js';
import { savePlatformProfessional } from '../../data/customerStore.js';
import { compressAvatarImage } from '../../lib/utils.js';

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  allowCustom?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes((search || '').toLowerCase().trim())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setSearch(opt);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setIsOpen(true);
    if (allowCustom) {
      onChange(val);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-bold text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white text-slate-800 transition"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === (value || '').toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-sky-50 transition cursor-pointer ${
                    isSelected ? 'bg-sky-50/80 text-sky-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              );
            })
          ) : allowCustom && search.trim() ? (
            <button
              type="button"
              onClick={() => handleSelect(search.trim())}
              className="w-full text-left px-3.5 py-2.5 text-xs text-sky-700 font-bold hover:bg-sky-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Use &quot;{search.trim()}&quot;</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 text-xs text-slate-400">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export const ArchitectProfileWizard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 7;

  // Form State
  const [bank, setBank] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'CURRENT' as 'CURRENT' | 'SAVINGS',
    branch: '',
    cancelledChequeUrl: '',
    cancelledChequeFileName: '',
    cancelledChequeStorageKey: '',
    isChequeAccepted: false,
  });
  const chequeInputRef = React.useRef<HTMLInputElement | null>(null);
  const profilePhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const firmBrochureInputRef = React.useRef<HTMLInputElement | null>(null);
  const projectImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [firmBrochureFileName, setFirmBrochureFileName] = useState('');

  // Document Inspection & Preview Modal State
  const [previewModalDoc, setPreviewModalDoc] = useState<{
    title: string;
    fileUrl: string;
    fileName?: string;
    storageKey?: string;
    onReupload?: () => void;
  } | null>(null);

  const handleOpenPreview = async (
    title: string,
    fileUrl: string,
    fileName?: string,
    storageKey?: string,
    onReupload?: () => void
  ) => {
    let finalUrl = fileUrl;
    if ((!finalUrl || finalUrl === '#' || finalUrl.startsWith('indexeddb:')) && storageKey) {
      const fromVault = await getOriginalFile(storageKey);
      if (fromVault?.dataUrl) {
        finalUrl = fromVault.dataUrl;
      }
    }
    setPreviewModalDoc({
      title,
      fileUrl: finalUrl,
      fileName,
      storageKey,
      onReupload,
    });
  };

  const getInitialUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };
  const initialUser = getInitialUser();
  const initialPhone = (
    user?.phone ||
    initialUser?.phone ||
    localStorage.getItem('auth_phone') ||
    sessionStorage.getItem('auth_phone') ||
    ''
  ).replace(/\D/g, '').slice(-10);

  const initialFirm = (
    (initialPhone ? localStorage.getItem(`registered_arch_firm_${initialPhone}`) : '') ||
    (initialPhone ? localStorage.getItem(`arch_firm_${initialPhone}`) : '') ||
    localStorage.getItem('registered_arch_firm') ||
    user?.firmName ||
    initialUser?.firmName ||
    ''
  );

  const initialName = (
    (initialPhone ? localStorage.getItem(`registered_arch_name_${initialPhone}`) : '') ||
    (initialPhone ? localStorage.getItem(`arch_name_${initialPhone}`) : '') ||
    localStorage.getItem('registered_arch_name') ||
    user?.name ||
    initialUser?.name ||
    ''
  );

  const [personal, setPersonal] = useState({
    name: initialName,
    phone: user?.phone || initialUser?.phone || initialPhone,
    email: user?.email || initialUser?.email || '',
    profilePhoto: (initialPhone ? localStorage.getItem(`arch_photo_${initialPhone}`) : '') || user?.avatar || initialUser?.avatar || '',
    designation: '',
    experienceYears: '' as any,
    bio: '',
  });

  const [business, setBusiness] = useState({
    firmName: initialFirm,
    businessType: 'Individual' as ArchitectBusinessType,
    firmRegistrationNumber: '',
    establishmentYear: '' as any,
    teamSize: '' as any,
    architectsCount: '' as any,
    website: '',
    gstin: '',
    panNumber: '',
    coaNumber: '',
    address: '',
    district: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [portfolioProjects, setPortfolioProjects] = useState<ArchitectPortfolioProject[]>([]);

  const [newProject, setNewProject] = useState<Partial<ArchitectPortfolioProject>>({
    title: '',
    category: '',
    location: '',
    builtUpArea: '',
    completionYear: '',
    description: '',
    imageUrl: '',
  });
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // Hidden File Input Ref for Real PDF/Document Uploading
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const activeUploadTargetRef = React.useRef<{
    target: 'DIRECTOR_PAN' | 'DIRECTOR_AADHAAR' | 'BIZ_COA' | 'BIZ_PAN' | 'BIZ_GST' | 'BIZ_PROOF';
    directorId?: string;
  } | null>(null);
  const isInitialSyncDoneRef = React.useRef(false);
  const hasUserClearedCitiesRef = React.useRef(false);
  const [activeUploadDocId, setActiveUploadDocId] = useState<string | null>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    target: 'DIRECTOR_PAN' | 'DIRECTOR_AADHAAR' | 'BIZ_COA' | 'BIZ_PAN' | 'BIZ_GST' | 'BIZ_PROOF';
    directorId?: string;
  } | null>(null);

  // Step 5: 1. Director / Business Owner KYC State
  const [directors, setDirectors] = useState<DirectorKycEntry[]>([
    {
      id: 'dir-1',
      name: initialName,
      panNumber: '',
      aadharNumber: '',
    },
  ]);

  // Step 5: 2. Business Verification State
  const [businessVerification, setBusinessVerification] = useState<BusinessVerificationDetails>({
    coaNumber: '',
    panNumber: '',
    gstin: '',
    businessProofType: 'Certificate of Incorporation (COI)',
    businessProofNumber: '',
  });

  const [kycDocuments, setKycDocuments] = useState<ArchitectKycDocument[]>([]);

  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const INDIAN_STATES_AND_CITIES: Record<string, string[]> = {
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi', 'Central Delhi', 'Dwarka', 'Rohini', 'Connaught Place'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Sonipat', 'Rohtak', 'Hisar', 'Panchkula', 'Bahadurgarh', 'Yamunanagar'],
    'Uttar Pradesh': ['Noida', 'Greater Noida', 'Ghaziabad', 'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Mathura', 'Ayodhya'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Sri Ganganagar'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Kolhapur', 'Amravati'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Kalaburagi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot'],
    'Chandigarh': ['Chandigarh'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Rishikesh', 'Haldwani', 'Nainital'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif', 'Purnia'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Puri'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
    'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
  };

  const INDIAN_STATES_AND_DISTRICTS: Record<string, string[]> = {
    'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
    'Haryana': ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
    'Uttar Pradesh': ['Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Dewas', 'Satna', 'Sagar', 'Ratlam', 'Rewa', 'Vidisha', 'Sehore', 'Raisen', 'Chhindwara', 'Betul', 'Hoshangabad', 'Khargone', 'Khandwa', 'Dhar', 'Mandsaur', 'Neemuch'],
    'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
    'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad', 'Pune', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Satara', 'Sangli', 'Chandrapur'],
    'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Mohali (SAS Nagar)', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'Tarn Taran'],
    'Chandigarh': ['Chandigarh'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Pauri Garhwal', 'Tehri Garhwal', 'Almora', 'Chamoli', 'Rudraprayag', 'Pithoragarh', 'Bageshwar', 'Champawat', 'Uttarkashi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Kheda', 'Bharuch', 'Mehsana', 'Patan', 'Banaskantha', 'Sabarkantha', 'Valsad', 'Navsari', 'Panchmahal', 'Dahod'],
    'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Belagavi', 'Ballari', 'Dharwad', 'Dakshina Kannada', 'Tumakuru', 'Shivamogga', 'Kalaburagi', 'Udupi', 'Hassan', 'Davanagere', 'Mandya'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Samastipur'],
    'West Bengal': ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Purba Bardhaman', 'Paschim Bardhaman', 'Darjeeling', 'Jalpaiguri', 'Nadia', 'Murshidabad', 'Malda'],
    'Telangana': ['Hyderabad', 'Medchal-Malkajgiri', 'Rangareddy', 'Warangal', 'Sangareddy', 'Nizamabad', 'Karimnagar', 'Khammam', 'Nalgonda', 'Mahabubnagar'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Chengalpattu', 'Kanchipuram', 'Tiruvallur', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore'],
    'Kerala': ['Thiruvananthapuram', 'Ernakulam (Kochi)', 'Kozhikode', 'Thrissur', 'Malappuram', 'Kollam', 'Palakkad', 'Kannur', 'Kottayam', 'Alappuzha'],
    'Jharkhand': ['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh'],
    'Chhattisgarh': ['Raipur', 'Durg (Bhilai)', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur'],
    'Himachal Pradesh': ['Shimla', 'Kangra (Dharamshala)', 'Mandi', 'Solan', 'Kullu', 'Sirmaur', 'Hamirpur', 'Una', 'Bilaspur', 'Chamba'],
    'Goa': ['North Goa', 'South Goa'],
    'Andhra Pradesh': ['Visakhapatnam', 'Krishna (Vijayawada)', 'Guntur', 'NTR', 'Nellore', 'Tirupati', 'Kurnool', 'Anantapur', 'East Godavari', 'West Godavari'],
    'Odisha': ['Khordha (Bhubaneswar)', 'Cuttack', 'Sundargarh (Rourkela)', 'Sambalpur', 'Puri', 'Ganjam', 'Balasore'],
    'Assam': ['Kamrup Metropolitan (Guwahati)', 'Dibrugarh', 'Silchar (Cachar)', 'Jorhat', 'Nagaon', 'Sonitpur'],
    'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Udhampur', 'Budgam', 'Pulwama'],
  };

  const ALL_INDIAN_BANKS = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank (PNB)',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank',
    'Bank of India',
    'IDFC FIRST Bank',
    'Yes Bank',
    'Indian Bank',
    'Central Bank of India',
    'Indian Overseas Bank',
    'UCO Bank',
    'Bank of Maharashtra',
    'Punjab & Sind Bank',
    'Federal Bank',
    'South Indian Bank',
    'IDBI Bank',
    'RBL Bank',
    'Bandhan Bank',
    'City Union Bank',
    'Karur Vysya Bank',
    'Tamilnad Mercantile Bank',
    'Jammu & Kashmir Bank',
    'Karnataka Bank',
    'AU Small Finance Bank',
    'Equitas Small Finance Bank',
    'Ujjivan Small Finance Bank',
    'Standard Chartered Bank',
    'Citibank',
    'HSBC Bank',
    'DBS Bank',
    'Paytm Payments Bank',
    'Airtel Payments Bank',
    'India Post Payments Bank',
    'Saraswat Cooperative Bank',
    'Cosmos Cooperative Bank',
    'SVC Co-operative Bank',
  ];

  const allAvailableCities = useMemo(() => {
    return Array.from(new Set(Object.values(INDIAN_STATES_AND_CITIES).flat()));
  }, []);

  const availableDistricts = useMemo(() => {
    if (business.state && INDIAN_STATES_AND_DISTRICTS[business.state]) {
      return INDIAN_STATES_AND_DISTRICTS[business.state];
    }
    if (business.city) {
      for (const [st, cities] of Object.entries(INDIAN_STATES_AND_CITIES)) {
        if (cities.some((c) => c.toLowerCase() === business.city.toLowerCase()) && INDIAN_STATES_AND_DISTRICTS[st]) {
          return INDIAN_STATES_AND_DISTRICTS[st];
        }
      }
    }
    return Array.from(new Set(Object.values(INDIAN_STATES_AND_DISTRICTS).flat())).sort();
  }, [business.state, business.city]);

  const ALL_INDIA_CITIES = useMemo(() => {
    const list: { city: string; state: string }[] = [];
    Object.entries(INDIAN_STATES_AND_CITIES).forEach(([state, cities]) => {
      cities.forEach((c) => {
        list.push({ city: c, state });
      });
    });
    if (business.city?.trim() && !list.some((item) => item.city.toLowerCase() === business.city.trim().toLowerCase())) {
      list.unshift({ city: business.city.trim(), state: business.state || 'Headquarters' });
    }
    return list;
  }, [business.city, business.state]);

  const filteredCities = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_INDIA_CITIES.filter(
      (item) => item.city.toLowerCase().includes(q) || item.state.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [citySearchQuery, ALL_INDIA_CITIES]);

  // Load existing profile & draft safely without ever erasing user progress
  useEffect(() => {
    const cleanPhone = (
      user?.phone ||
      initialUser?.phone ||
      localStorage.getItem('auth_phone') ||
      sessionStorage.getItem('auth_phone') ||
      ''
    ).replace(/\D/g, '').slice(-10);

    const lookupPhone = cleanPhone || initialPhone;
    const existing = lookupPhone ? getArchitectByPhone(lookupPhone) : null;

    // Load any draft saved in this session / local storage
    const draftKey = `arch_wizard_draft_${lookupPhone || 'current'}`;
    let draft: any = null;
    try {
      const rawDraft = sessionStorage.getItem(draftKey) || localStorage.getItem(draftKey);
      if (rawDraft) draft = JSON.parse(rawDraft);
    } catch {}

    const photoStored = lookupPhone ? (() => {
      try {
        return localStorage.getItem(`arch_photo_${lookupPhone}`);
      } catch {
        return null;
      }
    })() : null;

    const firmFromStorage = lookupPhone ? (
      localStorage.getItem(`registered_arch_firm_${lookupPhone}`) ||
      localStorage.getItem(`arch_firm_${lookupPhone}`) ||
      localStorage.getItem('registered_arch_firm') ||
      ''
    ) : (localStorage.getItem('registered_arch_firm') || '');

    const nameFromStorage = lookupPhone ? (
      localStorage.getItem(`registered_arch_name_${lookupPhone}`) ||
      localStorage.getItem(`arch_name_${lookupPhone}`) ||
      localStorage.getItem('registered_arch_name') ||
      ''
    ) : (localStorage.getItem('registered_arch_name') || '');

    const resolvedFirm = (draft?.business?.firmName || existing?.firmName || firmFromStorage || (user as any)?.firmName || initialUser?.firmName || '').trim();
    const rawName = (draft?.personal?.name || existing?.name || nameFromStorage || user?.name || initialUser?.name || '').trim();
    const isNameFirmDuplicate = rawName && resolvedFirm && rawName.toLowerCase() === resolvedFirm.toLowerCase();

    // If we have already initialized once, only do non-destructive merges (never wipe form fields!)
    if (isInitialSyncDoneRef.current) {
      if (rawName && !isNameFirmDuplicate) {
        setPersonal((prev) => (prev.name ? prev : { ...prev, name: rawName }));
      }
      if (resolvedFirm) {
        setBusiness((prev) => (prev.firmName ? prev : { ...prev, firmName: resolvedFirm }));
      }
      return;
    }

    setPersonal((prev) => ({
      ...prev,
      name: isNameFirmDuplicate ? '' : (draft?.personal?.name || prev.name || rawName),
      phone: draft?.personal?.phone || existing?.phone || lookupPhone || user?.phone || initialUser?.phone || prev.phone,
      email: draft?.personal?.email || existing?.email || user?.email || initialUser?.email || prev.email,
      profilePhoto: draft?.personal?.profilePhoto || existing?.profilePhoto || photoStored || (user as any)?.avatar || (user as any)?.profilePhoto || prev.profilePhoto,
      designation: draft?.personal?.designation || existing?.designation || prev.designation,
      experienceYears: draft?.personal?.experienceYears || existing?.experienceYears || prev.experienceYears || ('' as any),
      bio: draft?.personal?.bio || existing?.bio || prev.bio,
    }));

    setBusiness((prev) => ({
      ...prev,
      firmName: draft?.business?.firmName || prev.firmName || resolvedFirm,
      businessType: draft?.business?.businessType || existing?.businessType || prev.businessType,
      firmRegistrationNumber: draft?.business?.firmRegistrationNumber || existing?.firmRegistrationNumber || prev.firmRegistrationNumber,
      establishmentYear: draft?.business?.establishmentYear || existing?.establishmentYear || prev.establishmentYear,
      teamSize: draft?.business?.teamSize || existing?.teamSize || prev.teamSize,
      architectsCount: draft?.business?.architectsCount || existing?.architectsCount || prev.architectsCount,
      website: draft?.business?.website || existing?.website || prev.website,
      gstin: draft?.business?.gstin || existing?.gstin || prev.gstin,
      panNumber: draft?.business?.panNumber || existing?.panNumber || prev.panNumber,
      coaNumber: draft?.business?.coaNumber || existing?.coaNumber || prev.coaNumber,
      address: draft?.business?.address || existing?.address || prev.address,
      district: draft?.business?.district || existing?.district || prev.district || '',
      city: draft?.business?.city || existing?.city || prev.city,
      state: draft?.business?.state || existing?.state || prev.state,
      pincode: draft?.business?.pincode || existing?.pincode || prev.pincode,
    }));

    // Restore Directors KYC without ever wiping user-entered data
    if (draft?.directors && draft.directors.length > 0) {
      setDirectors(draft.directors);
    } else if (existing?.directorsKyc && existing.directorsKyc.length > 0) {
      setDirectors(
        existing.directorsKyc.map((d: any) => ({
          ...d,
          panFileUrl: d.panFileUrl || d.panDocUrl,
          panDocUrl: d.panDocUrl || d.panFileUrl,
          aadharFileUrl: d.aadharFileUrl || d.aadharDocUrl,
          aadharDocUrl: d.aadharDocUrl || d.aadharFileUrl,
        }))
      );
    } else {
      setDirectors((prev) => {
        const hasUserData = prev.some((d) => d.panNumber || d.aadharNumber || d.panFileUrl || d.panDocUrl);
        if (hasUserData) return prev;
        return [
          {
            id: 'dir-1',
            name: rawName || initialName,
            panNumber: '',
            aadharNumber: '',
          },
        ];
      });
    }

    // Restore Business Verification
    if (draft?.businessVerification) {
      setBusinessVerification(draft.businessVerification);
    } else if (existing?.businessVerification) {
      setBusinessVerification({
        ...existing.businessVerification,
        coaFileUrl: existing.businessVerification.coaFileUrl || existing.businessVerification.coaDocUrl,
        coaDocUrl: existing.businessVerification.coaDocUrl || existing.businessVerification.coaFileUrl,
        panFileUrl: existing.businessVerification.panFileUrl || existing.businessVerification.panDocUrl,
        panDocUrl: existing.businessVerification.panDocUrl || existing.businessVerification.panFileUrl,
        gstFileUrl: existing.businessVerification.gstFileUrl || existing.businessVerification.gstDocUrl,
        gstDocUrl: existing.businessVerification.gstDocUrl || existing.businessVerification.gstFileUrl,
        businessProofFileUrl: existing.businessVerification.businessProofFileUrl || existing.businessVerification.businessProofDocUrl,
        businessProofDocUrl: existing.businessVerification.businessProofDocUrl || existing.businessVerification.businessProofFileUrl,
      });
    } else {
      setBusinessVerification((prev) => ({
        ...prev,
        coaNumber: existing?.coaNumber || prev.coaNumber,
        panNumber: existing?.panNumber || prev.panNumber,
        gstin: existing?.gstin || prev.gstin,
      }));
    }

    if (existing?.documents && existing.documents.length > 0) {
      setKycDocuments(existing.documents);
    }

    // Restore Services
    if (draft?.selectedServices && Array.isArray(draft.selectedServices) && draft.selectedServices.length > 0) {
      const cleanServices = draft.selectedServices
        .map((s: any) => (typeof s === 'string' ? s : s?.name))
        .filter(Boolean);
      setSelectedServices(cleanServices);
    } else if (existing?.services && Array.isArray(existing.services) && existing.services.length > 0) {
      const cleanExisting = existing.services
        .map((s: any) => (typeof s === 'string' ? s : s?.name))
        .filter(Boolean);
      const isDummyServiceSet =
        cleanExisting.length === 4 &&
        cleanExisting.includes('2D House Plan & Municipal Blueprints') &&
        cleanExisting.includes('Structural Engineering & Working Drawings') &&
        cleanExisting.includes('3D Elevation Design & 360 Walkthrough') &&
        cleanExisting.includes('Site Supervision & Quality Audit');
      if (!isDummyServiceSet) {
        setSelectedServices(cleanExisting);
      }
    }

    if (draft?.portfolioProjects && Array.isArray(draft.portfolioProjects) && draft.portfolioProjects.length > 0) {
      setPortfolioProjects(draft.portfolioProjects);
    } else if (existing?.portfolioProjects && Array.isArray(existing.portfolioProjects)) {
      const realProjects = existing.portfolioProjects.filter(
        (p) => !p.imageUrl?.includes('unsplash.com/photo-1600585154340') && !p.imageUrl?.includes('unsplash.com/photo-1600596542815')
      );
      setPortfolioProjects(realProjects);
    }

    // Restore Operating Cities (if empty, auto-include firm city)
    const firmCity = draft?.business?.city || existing?.city || '';
    if (draft?.serviceCities && Array.isArray(draft.serviceCities) && draft.serviceCities.length > 0) {
      setServiceCities(draft.serviceCities);
    } else if (existing?.serviceCities && Array.isArray(existing.serviceCities) && existing.serviceCities.length > 0) {
      setServiceCities(existing.serviceCities);
    } else if (firmCity) {
      setServiceCities([firmCity]);
    }

    // Restore Bank Details without overwriting
    if (draft?.bank && (draft.bank.accountNumber || draft.bank.bankName || draft.bank.cancelledChequeUrl)) {
      setBank(draft.bank);
    } else if (existing?.bankDetails && existing.bankDetails.accountNumber && existing.bankDetails.accountNumber !== '50200091827364') {
      setBank((prev) => ({
        ...prev,
        bankName: existing.bankDetails?.bankName || prev.bankName,
        accountHolderName: existing.bankDetails?.accountHolderName || rawName || initialName || prev.accountHolderName,
        accountNumber: existing.bankDetails?.accountNumber || prev.accountNumber,
        confirmAccountNumber: existing.bankDetails?.accountNumber || prev.confirmAccountNumber,
        ifscCode: existing.bankDetails?.ifscCode || prev.ifscCode,
        accountType: existing.bankDetails?.accountType || prev.accountType,
        branch: existing.bankDetails?.branch || prev.branch,
        cancelledChequeUrl: existing.bankDetails?.cancelledChequeUrl || prev.cancelledChequeUrl,
        cancelledChequeFileName: existing.bankDetails?.cancelledChequeFileName || prev.cancelledChequeFileName,
        isChequeAccepted: existing.bankDetails?.isChequeAccepted ?? prev.isChequeAccepted,
      }));
    } else {
      setBank((prev) => ({
        ...prev,
        accountHolderName: prev.accountHolderName || rawName || initialName,
      }));
    }

    isInitialSyncDoneRef.current = true;
  }, [user]);

  // Continuous auto-save draft to protect against page refreshes & accidental losses
  useEffect(() => {
    if (!isInitialSyncDoneRef.current) return;
    const cleanPhone = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const draftKey = `arch_wizard_draft_${cleanPhone || 'current'}`;
    try {
      const draftPayload = {
        personal,
        business,
        directors: directors.map((d) => ({
          ...d,
          panFileUrl: d.panFileUrl?.length && d.panFileUrl.length > 50000 ? (d.panStorageKey ? `indexeddb:${d.panStorageKey}` : '') : d.panFileUrl,
          panDocUrl: d.panDocUrl?.length && d.panDocUrl.length > 50000 ? (d.panStorageKey ? `indexeddb:${d.panStorageKey}` : '') : d.panDocUrl,
          aadharFileUrl: d.aadharFileUrl?.length && d.aadharFileUrl.length > 50000 ? (d.aadharStorageKey ? `indexeddb:${d.aadharStorageKey}` : '') : d.aadharFileUrl,
          aadharDocUrl: d.aadharDocUrl?.length && d.aadharDocUrl.length > 50000 ? (d.aadharStorageKey ? `indexeddb:${d.aadharStorageKey}` : '') : d.aadharDocUrl,
        })),
        businessVerification: {
          ...businessVerification,
          coaFileUrl: businessVerification.coaFileUrl?.length && businessVerification.coaFileUrl.length > 50000 ? (businessVerification.coaStorageKey ? `indexeddb:${businessVerification.coaStorageKey}` : '') : businessVerification.coaFileUrl,
          coaDocUrl: businessVerification.coaDocUrl?.length && businessVerification.coaDocUrl.length > 50000 ? (businessVerification.coaStorageKey ? `indexeddb:${businessVerification.coaStorageKey}` : '') : businessVerification.coaDocUrl,
          panFileUrl: businessVerification.panFileUrl?.length && businessVerification.panFileUrl.length > 50000 ? (businessVerification.panStorageKey ? `indexeddb:${businessVerification.panStorageKey}` : '') : businessVerification.panFileUrl,
          panDocUrl: businessVerification.panDocUrl?.length && businessVerification.panDocUrl.length > 50000 ? (businessVerification.panStorageKey ? `indexeddb:${businessVerification.panStorageKey}` : '') : businessVerification.panDocUrl,
          gstFileUrl: businessVerification.gstFileUrl?.length && businessVerification.gstFileUrl.length > 50000 ? (businessVerification.gstStorageKey ? `indexeddb:${businessVerification.gstStorageKey}` : '') : businessVerification.gstFileUrl,
          gstDocUrl: businessVerification.gstDocUrl?.length && businessVerification.gstDocUrl.length > 50000 ? (businessVerification.gstStorageKey ? `indexeddb:${businessVerification.gstStorageKey}` : '') : businessVerification.gstDocUrl,
          businessProofFileUrl: businessVerification.businessProofFileUrl?.length && businessVerification.businessProofFileUrl.length > 50000 ? (businessVerification.businessProofStorageKey ? `indexeddb:${businessVerification.businessProofStorageKey}` : '') : businessVerification.businessProofFileUrl,
          businessProofDocUrl: businessVerification.businessProofDocUrl?.length && businessVerification.businessProofDocUrl.length > 50000 ? (businessVerification.businessProofStorageKey ? `indexeddb:${businessVerification.businessProofStorageKey}` : '') : businessVerification.businessProofDocUrl,
        },
        bank: {
          ...bank,
          cancelledChequeUrl: bank.cancelledChequeUrl?.length && bank.cancelledChequeUrl.length > 50000 ? (bank.cancelledChequeStorageKey ? `indexeddb:${bank.cancelledChequeStorageKey}` : '') : bank.cancelledChequeUrl,
        },
        selectedServices,
        serviceCities,
        portfolioProjects,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch (e) {
      console.warn('Draft auto-save warning:', e);
    }
  }, [personal, business, directors, businessVerification, bank, selectedServices, serviceCities, portfolioProjects]);

  // Auto-sync firm's headquarters city into coverage areas if none selected
  useEffect(() => {
    if (business.city?.trim() && serviceCities.length === 0 && !hasUserClearedCitiesRef.current) {
      setServiceCities([business.city.trim()]);
    }
  }, [business.city]);

  const toggleService = (srvNameOrObj: any) => {
    const srvName = typeof srvNameOrObj === 'string' ? srvNameOrObj : srvNameOrObj?.name || String(srvNameOrObj);
    if (!srvName) return;
    if (selectedServices.includes(srvName)) {
      if (selectedServices.length === 1) {
        error('Please select at least one core service');
        return;
      }
      setSelectedServices(selectedServices.filter((s) => s !== srvName));
    } else {
      setSelectedServices([...selectedServices, srvName]);
    }
  };

  const toggleCity = (city: string) => {
    const trimmed = city.trim();
    if (!trimmed) return;
    if (serviceCities.includes(trimmed)) {
      setServiceCities(serviceCities.filter((c) => c !== trimmed));
    } else {
      setServiceCities([...serviceCities, trimmed]);
    }
  };

  const removeCity = (city: string) => {
    setServiceCities(serviceCities.filter((c) => c !== city));
  };

  const handleAddProject = () => {
    if (!newProject.title || !newProject.builtUpArea) {
      error('Please provide project title and built-up area');
      return;
    }
    const created: ArchitectPortfolioProject = {
      id: `port-${Date.now()}`,
      title: newProject.title || 'Residential Project',
      category: newProject.category || 'Residential Villa',
      location: newProject.location || 'Gurugram',
      builtUpArea: newProject.builtUpArea || '3,500 sq.ft',
      completionYear: newProject.completionYear || '2025',
      description: newProject.description || 'Architectural design & planning by firm.',
      imageUrl: newProject.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    };
    setPortfolioProjects([...portfolioProjects, created]);
    setShowAddProjectModal(false);
    setNewProject({
      title: '',
      category: '',
      location: '',
      builtUpArea: '',
      completionYear: '',
      description: '',
      imageUrl: '',
    });
    success('Portfolio project added!');
  };

  const handleRemoveProject = (id: string) => {
    setPortfolioProjects(portfolioProjects.filter((p) => p.id !== id));
  };

  const triggerDirectorPanUpload = (dirId: string) => {
    const targetObj = { target: 'DIRECTOR_PAN' as const, directorId: dirId };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerDirectorAadhaarUpload = (dirId: string) => {
    const targetObj = { target: 'DIRECTOR_AADHAAR' as const, directorId: dirId };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerBizCoaUpload = () => {
    const targetObj = { target: 'BIZ_COA' as const };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerBizPanUpload = () => {
    const targetObj = { target: 'BIZ_PAN' as const };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerBizGstUpload = () => {
    const targetObj = { target: 'BIZ_GST' as const };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerBizProofUpload = () => {
    const targetObj = { target: 'BIZ_PROOF' as const };
    setActiveUploadTarget(targetObj);
    activeUploadTargetRef.current = targetObj;
    setActiveUploadDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAddDirector = () => {
    const newDir: DirectorKycEntry = {
      id: `dir-${Date.now()}`,
      name: '',
      panNumber: '',
      aadharNumber: '',
    };
    setDirectors((prev) => [...prev, newDir]);
    success('New Director / Business Owner entry added.');
  };

  const handleRemoveDirector = (id: string) => {
    if (directors.length <= 1) {
      error('At least one Director / Business Owner is required.');
      return;
    }
    setDirectors((prev) => prev.filter((d) => d.id !== id));
    success('Director entry removed.');
  };

  const handleUpdateDirector = (id: string, updates: Partial<DirectorKycEntry>) => {
    setDirectors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const triggerFileUpload = (docId: string) => {
    setActiveUploadDocId(docId);
    setActiveUploadTarget(null);
    activeUploadTargetRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const cleanUserPhone = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const target = activeUploadTargetRef.current || activeUploadTarget;

    try {
      let finalDataUrl = '';
      if (file.type.startsWith('image/')) {
        try {
          finalDataUrl = await compressAvatarImage(file, 1200, 0.82);
        } catch {}
      }

      if (target) {
        const targetTag = target.directorId
          ? `${target.target}_${target.directorId}`
          : target.target;
        const docStorageKey = `arch_doc_${cleanUserPhone || 'guest'}_${targetTag}`;
        const savedDoc = await saveOriginalFile(docStorageKey, file);
        if (!finalDataUrl) finalDataUrl = savedDoc.dataUrl;

        if (target.target === 'DIRECTOR_PAN') {
          setDirectors((prev) =>
            prev.map((d, idx) =>
              (target.directorId ? d.id === target.directorId : idx === 0)
                ? {
                    ...d,
                    panFileName: file.name,
                    panFileSize: `${sizeFormatted} (${extension})`,
                    panFileUrl: finalDataUrl,
                    panDocUrl: finalDataUrl,
                    panStorageKey: docStorageKey,
                  }
                : d
            )
          );
          success(`Director PAN Card "${file.name}" attached successfully!`);
        } else if (target.target === 'DIRECTOR_AADHAAR') {
          setDirectors((prev) =>
            prev.map((d, idx) =>
              (target.directorId ? d.id === target.directorId : idx === 0)
                ? {
                    ...d,
                    aadharFileName: file.name,
                    aadharFileSize: `${sizeFormatted} (${extension})`,
                    aadharFileUrl: finalDataUrl,
                    aadharDocUrl: finalDataUrl,
                    aadharStorageKey: docStorageKey,
                  }
                : d
            )
          );
          success(`Director Aadhaar Card "${file.name}" attached successfully!`);
        } else if (target.target === 'BIZ_COA') {
          setBusinessVerification((prev) => ({
            ...prev,
            coaFileName: file.name,
            coaFileSize: `${sizeFormatted} (${extension})`,
            coaFileUrl: finalDataUrl,
            coaDocUrl: finalDataUrl,
            coaStorageKey: docStorageKey,
          }));
          success(`COA Certificate "${file.name}" attached successfully!`);
        } else if (target.target === 'BIZ_PAN') {
          setBusinessVerification((prev) => ({
            ...prev,
            panFileName: file.name,
            panFileSize: `${sizeFormatted} (${extension})`,
            panFileUrl: finalDataUrl,
            panDocUrl: finalDataUrl,
            panStorageKey: docStorageKey,
          }));
          success(`Firm PAN Card "${file.name}" attached successfully!`);
        } else if (target.target === 'BIZ_GST') {
          setBusinessVerification((prev) => ({
            ...prev,
            gstFileName: file.name,
            gstFileSize: `${sizeFormatted} (${extension})`,
            gstFileUrl: finalDataUrl,
            gstDocUrl: finalDataUrl,
            gstStorageKey: docStorageKey,
          }));
          success(`GST Registration Certificate "${file.name}" attached successfully!`);
        } else if (target.target === 'BIZ_PROOF') {
          setBusinessVerification((prev) => ({
            ...prev,
            businessProofFileName: file.name,
            businessProofFileSize: `${sizeFormatted} (${extension})`,
            businessProofFileUrl: finalDataUrl,
            businessProofDocUrl: finalDataUrl,
            businessProofStorageKey: docStorageKey,
          }));
          success(`Business Proof Document "${file.name}" attached successfully!`);
        }
      } else if (activeUploadDocId) {
        const targetDocId = activeUploadDocId;
        const docStorageKey = `arch_doc_${cleanUserPhone || 'guest'}_${targetDocId}`;
        const savedDoc = await saveOriginalFile(docStorageKey, file);
        if (!finalDataUrl) finalDataUrl = savedDoc.dataUrl;

        setKycDocuments((prev) =>
          prev.map((d) =>
            d.id === targetDocId
              ? {
                  ...d,
                  fileName: file.name,
                  fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                  fileSize: `${sizeFormatted} (${extension}) - ${file.name}`,
                  fileUrl: finalDataUrl,
                  storageKey: docStorageKey,
                  isOriginalUpload: true,
                  uploadedAt: new Date().toISOString(),
                  status: 'PENDING' as const,
                }
              : d
          )
        );
        success(`Original file "${file.name}" (${sizeFormatted}) uploaded successfully!`);
        setActiveUploadDocId(null);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      error('Failed to attach document. Please try again.');
    } finally {
      activeUploadTargetRef.current = null;
      setActiveUploadTarget(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const compileAllKycDocuments = (
    dirs: DirectorKycEntry[],
    biz: BusinessVerificationDetails
  ): ArchitectKycDocument[] => {
    const docs: ArchitectKycDocument[] = [];
    const now = new Date().toISOString();

    // 1. Directors KYC Documents
    dirs.forEach((d, idx) => {
      const panUrl = (d as any).panFileUrl || d.panDocUrl;
      if (panUrl || d.panFileName) {
        docs.push({
          id: `doc-dir-${d.id}-pan`,
          documentType: 'PAN_CARD',
          title: `${d.name || `Director #${idx + 1}`} - PAN Card (${d.panNumber || 'Attached'})`,
          fileName: d.panFileName,
          fileSize: d.panFileSize || 'PDF Document',
          fileUrl: panUrl || '',
          storageKey: d.panStorageKey,
          isOriginalUpload: true,
          status: 'PENDING',
          uploadedAt: now,
        });
      }
      const aadharUrl = (d as any).aadharFileUrl || d.aadharDocUrl;
      if (aadharUrl || d.aadharFileName) {
        docs.push({
          id: `doc-dir-${d.id}-aadhaar`,
          documentType: 'AADHAAR_CARD',
          title: `${d.name || `Director #${idx + 1}`} - Aadhaar Card (${d.aadharNumber || 'Attached'})`,
          fileName: d.aadharFileName,
          fileSize: d.aadharFileSize || 'PDF Document',
          fileUrl: aadharUrl || '',
          storageKey: d.aadharStorageKey,
          isOriginalUpload: true,
          status: 'PENDING',
          uploadedAt: now,
        });
      }
    });

    // 2. Business Verification Documents
    const coaUrl = (biz as any).coaFileUrl || biz.coaDocUrl;
    if (coaUrl || biz.coaFileName) {
      docs.push({
        id: 'doc-coa',
        documentType: 'COA_CERTIFICATE',
        title: `Council of Architecture (COA) Registration Certificate - ${biz.coaNumber || 'Attached'}`,
        fileName: biz.coaFileName,
        fileSize: biz.coaFileSize || 'PDF Document',
        fileUrl: coaUrl || '',
        storageKey: biz.coaStorageKey,
        isOriginalUpload: true,
        status: 'PENDING',
        uploadedAt: now,
      });
    }
    const panUrl = (biz as any).panFileUrl || biz.panDocUrl;
    if (panUrl || biz.panFileName) {
      docs.push({
        id: 'doc-pan',
        documentType: 'PAN_CARD',
        title: `Firm / Company PAN Card - ${biz.panNumber || 'Attached'}`,
        fileName: biz.panFileName,
        fileSize: biz.panFileSize || 'PDF Document',
        fileUrl: panUrl || '',
        storageKey: biz.panStorageKey,
        isOriginalUpload: true,
        status: 'PENDING',
        uploadedAt: now,
      });
    }
    const gstUrl = (biz as any).gstFileUrl || biz.gstDocUrl;
    if (gstUrl || biz.gstFileName) {
      docs.push({
        id: 'doc-gst',
        documentType: 'GSTIN_CERTIFICATE',
        title: `GST Registration Certificate - ${biz.gstin || 'Attached'}`,
        fileName: biz.gstFileName,
        fileSize: biz.gstFileSize || 'PDF Document',
        fileUrl: gstUrl || '',
        storageKey: biz.gstStorageKey,
        isOriginalUpload: true,
        status: 'PENDING',
        uploadedAt: now,
      });
    }
    const proofUrl = (biz as any).businessProofFileUrl || biz.businessProofDocUrl;
    if (proofUrl || biz.businessProofFileName) {
      docs.push({
        id: 'doc-biz-proof',
        documentType: 'FIRM_REGISTRATION',
        title: `Business Proof (${biz.businessProofType || 'Statutory Registration'}) - ${biz.businessProofNumber || 'Attached'}`,
        fileName: biz.businessProofFileName,
        fileSize: biz.businessProofFileSize || 'PDF Document',
        fileUrl: proofUrl || '',
        storageKey: biz.businessProofStorageKey,
        isOriginalUpload: true,
        status: 'PENDING',
        uploadedAt: now,
      });
    }

    return docs;
  };

  const triggerChequeUpload = () => {
    if (chequeInputRef.current) {
      chequeInputRef.current.value = '';
      chequeInputRef.current.click();
    }
  };

  const handleChequeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const cleanUserPhone = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const chequeKey = `arch_cheque_${cleanUserPhone || 'guest'}`;

    try {
      let finalDataUrl = '';
      if (file.type.startsWith('image/')) {
        try {
          finalDataUrl = await compressAvatarImage(file, 1200, 0.82);
        } catch {}
      }
      const savedDoc = await saveOriginalFile(chequeKey, file);
      if (!finalDataUrl) finalDataUrl = savedDoc.dataUrl;

      setBank((prev) => ({
        ...prev,
        cancelledChequeUrl: finalDataUrl,
        cancelledChequeFileName: `${file.name} (${sizeFormatted} • ${extension})`,
        cancelledChequeStorageKey: chequeKey,
        isChequeAccepted: true,
      }));
      success(`Cheque "${file.name}" attached successfully!`);
    } catch (err) {
      console.warn('Failed to save cheque into vault:', err);
      error('Failed to attach cheque file. Please try again.');
    } finally {
      if (chequeInputRef.current) {
        chequeInputRef.current.value = '';
      }
    }
  };

  const handleCancelCheque = () => {
    setBank((prev) => ({
      ...prev,
      cancelledChequeUrl: '',
      cancelledChequeFileName: '',
      isChequeAccepted: false,
    }));
    if (chequeInputRef.current) {
      chequeInputRef.current.value = '';
    }
    success('Cheque removed.');
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      error('Profile photo must be less than 10MB');
      return;
    }
    try {
      const dataUrl = await compressAvatarImage(file);
      setPersonal((prev) => ({ ...prev, profilePhoto: dataUrl }));
      const cleanUserPhone = (personal.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanUserPhone) {
        try {
          await saveOriginalFile(`arch_photo_${cleanUserPhone}`, file);
        } catch {}
        try {
          localStorage.setItem(`arch_photo_${cleanUserPhone}`, dataUrl);
          localStorage.setItem(`arch_photo_+91${cleanUserPhone}`, dataUrl);
          
          // Instantly sync to existing architect record
          const existingArch = getArchitectByPhone(cleanUserPhone);
          if (existingArch) {
            saveArchitectAccount({
              ...existingArch,
              profilePhoto: dataUrl,
            });
          }

          const userRaw = localStorage.getItem('user');
          if (userRaw) {
            const parsed = JSON.parse(userRaw);
            parsed.avatar = dataUrl;
            parsed.profilePhoto = dataUrl;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('architect_store_updated', { detail: { profilePhoto: dataUrl } }));
            window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { avatar: dataUrl } }));
          }
        } catch (e) {}
      }
      success(`Profile photo "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      error(err.message || 'Failed to process image');
    }
  };

  const handleFirmBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      error('Firm brochure must be less than 10MB');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setBusiness((prev) => ({
      ...prev,
      website: prev.website && !prev.website.startsWith('blob:') && !prev.website.startsWith('data:')
        ? prev.website
        : blobUrl,
    }));
    setFirmBrochureFileName(file.name);
    success(`Firm brochure "${file.name}" uploaded successfully!`);
  };

  const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      error('Project image must be less than 10MB');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setNewProject((prev) => ({ ...prev, imageUrl: blobUrl }));
    success(`Project photo "${file.name}" attached!`);
  };

  const handleRemoveDocument = (docId: string) => {
    setKycDocuments((prev) => prev.filter((d) => d.id !== docId));
    success('Document removed from verification list.');
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    if (!business.coaNumber) {
      error('Council of Architecture (COA) registration number is required');
      setCurrentStep(2);
      return;
    }
    if (selectedServices.length === 0) {
      error('Please select at least 1 architectural service');
      setCurrentStep(3);
      return;
    }
    if (serviceCities.length === 0) {
      error('Please select at least 1 operating city where you provide services');
      setCurrentStep(7);
      return;
    }

    setIsSubmitting(true);

    try {
      const userStored = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
          return {};
        }
      })();

      let cleanUserPhone = (personal.phone || user?.phone || userStored.phone || '')
        .replace(/\D/g, '')
        .slice(-10);

      // Fallback if phone was empty
      if (!cleanUserPhone || cleanUserPhone.length < 10) {
        cleanUserPhone = '9876543210';
      }

      const finalPhoto = personal.profilePhoto || (cleanUserPhone ? localStorage.getItem(`arch_photo_${cleanUserPhone}`) : '') || userStored.avatar || user?.avatar || '';

      // Sync active session user
      const sessionUser = {
        ...(user || {}),
        ...userStored,
        id: user?.id || userStored.id || `usr-arch-${cleanUserPhone}`,
        name: personal.name || userStored.name || '',
        phone: cleanUserPhone,
        email: personal.email || userStored.email || '',
        role: 'ARCHITECT',
        designation: personal.designation || '',
        firmName: business.firmName || '',
        avatar: finalPhoto,
        profilePhoto: finalPhoto,
      };
      try {
        localStorage.setItem('user', JSON.stringify(sessionUser));
        localStorage.setItem(`registered_arch_name_${cleanUserPhone}`, personal.name || '');
        if (finalPhoto) {
          localStorage.setItem(`arch_photo_${cleanUserPhone}`, finalPhoto);
        }
      } catch (e) {}

      const existingArch = getArchitectByPhone(cleanUserPhone);
      let assignedId = existingArch?.id?.startsWith('BG/Architech/')
        ? existingArch.id
        : formatArchitectId(existingArch?.id || existingArch?.applicationNumber);
      if (!assignedId || !assignedId.startsWith('BG/Architech/')) {
        assignedId = generateArchitectId('BG/Architech');
      }

      const compiledDocs = compileAllKycDocuments(directors, businessVerification);

      const saved = saveArchitectAccount({
        id: assignedId,
        applicationNumber: assignedId,
        userId: sessionUser.id,
        phone: cleanUserPhone,
        name: personal.name,
        email: personal.email,
        profilePhoto: finalPhoto,
        designation: personal.designation,
        experienceYears: Number(personal.experienceYears) || 0,
        bio: personal.bio,
        firmName: business.firmName,
        businessType: business.businessType,
        firmRegistrationNumber: business.firmRegistrationNumber,
        establishmentYear: Number(business.establishmentYear) || new Date().getFullYear(),
        teamSize: Number(business.teamSize) || 1,
        architectsCount: Number(business.architectsCount) || 1,
        website: business.website,
        gstin: business.gstin || businessVerification.gstin,
        panNumber: business.panNumber || businessVerification.panNumber,
        coaNumber: business.coaNumber || businessVerification.coaNumber,
        address: business.address,
        district: business.district || '',
        city: business.city,
        state: business.state,
        pincode: business.pincode,
        services: selectedServices,
        portfolioProjects,
        directorsKyc: directors,
        businessVerification,
        documents: compiledDocs.length > 0 ? compiledDocs : kycDocuments,
        bankDetails: {
          bankName: bank.bankName,
          accountHolderName: bank.accountHolderName || personal.name,
          accountNumber: bank.accountNumber,
          ifscCode: (bank.ifscCode || '').toUpperCase(),
          accountType: bank.accountType,
          branch: bank.branch,
          cancelledChequeUrl: bank.cancelledChequeUrl,
          cancelledChequeFileName: bank.cancelledChequeFileName,
          cancelledChequeStorageKey: (bank as any).cancelledChequeStorageKey,
          isChequeAccepted: bank.isChequeAccepted,
          isVerified: false,
        },
        serviceCities,
        accountStatus: 'PENDING_APPROVAL',
        isVerified: false,
      });

      try {
        localStorage.setItem(`arch_directors_${cleanUserPhone}`, JSON.stringify(directors));
        localStorage.setItem(`arch_biz_verif_${cleanUserPhone}`, JSON.stringify(businessVerification));
        localStorage.setItem(`arch_kyc_${cleanUserPhone}`, JSON.stringify(compiledDocs));
      } catch (e) {}

      try {
        savePlatformProfessional({
          id: assignedId,
          userId: sessionUser.id,
          phone: `+91 ${cleanUserPhone}`,
          name: personal.name,
          firmName: business.firmName,
          category: 'ARCHITECT' as any,
          email: personal.email,
          experienceYears: Number(personal.experienceYears) || 1,
          registrationNumber: business.coaNumber,
          isVerified: false,
          verificationStatus: 'PENDING',
        });
      } catch (e) {}

      try {
        await pushToCloud();
      } catch (e) {}

      success('Application submitted successfully! Your credentials are now under review by Admin Governance Desk.');
      navigate('/architect/application-status');
    } catch (err: any) {
      console.error('Error submitting architect profile:', err);
      error(err?.message || 'Failed to submit profile. Please verify all entries and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Firm Details', icon: Building2 },
    { num: 3, label: '21 Services', icon: Layers },
    { num: 4, label: 'Portfolio', icon: ImageIcon },
    { num: 5, label: 'KYC Docs', icon: FileCheck2 },
    { num: 6, label: 'Bank & Cheque', icon: CreditCard },
    { num: 7, label: 'Review & Submit', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-white to-[#edf6fd] text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" subtitle="Architect Partner Portal" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline-block">Logged in as Architect Partner</span>
            <Link
              to="/architect/application-status"
              className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-xs font-bold hover:bg-sky-100 transition"
            >
              Application Status
            </Link>
          </div>
        </div>
      </header>

      {/* Main Multi-Step Wizard Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Wizard Title & Step Indicators */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-black uppercase font-mono mb-2">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Architect & Engineering Registration Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-navy-950">
            Build Your Architectural Practice Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete the 7 sections below to submit your credentials to our Operations Governance Desk.
          </p>
        </div>

        {/* Step Indicator Navigation Pills */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stepsList.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-sky-600 text-white border-sky-700 shadow-md scale-[1.02]'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold">Step {s.num}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <s.icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-sky-200' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className="font-black text-xs truncate">{s.label}</div>
              </button>
            );
          })}
        </div>

        {/* Wizard Form Panels */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-sm">
          {/* Universal Hidden File Inputs (accessible across all steps including Step 7 Review) */}
          <input
            ref={profilePhotoInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleProfilePhotoUpload}
          />
          <input
            ref={firmBrochureInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFirmBrochureUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
          <input
            ref={chequeInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleChequeFileChange}
          />

          {/* ---------------- STEP 1: PERSONAL DETAILS ---------------- */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-600" />
                  <span>Step 1: Principal Architect / Lead Personal Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Details of the licensed practitioner spearheading this architecture practice.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Professional Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.name}
                    onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personal.designation}
                    onChange={(e) => setPersonal({ ...personal, designation: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number {user?.phone ? '(OTP Verified)' : ''} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    disabled={!!user?.phone}
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono font-semibold ${
                      user?.phone
                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    placeholder="Enter professional email address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Architectural Experience <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={personal.experienceYears || ''}
                    onChange={(e) => setPersonal({ ...personal, experienceYears: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[42px]">
                      {personal.profilePhoto ? (
                        <>
                          <img
                            src={personal.profilePhoto}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover border border-emerald-300 shrink-0"
                          />
                          <span className="text-emerald-800 font-bold truncate">Photo Attached</span>
                        </>
                      ) : (
                        <span className="text-slate-400">No photo selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{personal.profilePhoto ? 'Change' : 'Upload Photo'}</span>
                    </button>
                    {personal.profilePhoto && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenPreview(
                              'Profile Photo',
                              personal.profilePhoto,
                              'profile_photo.jpg',
                              undefined,
                              () => profilePhotoInputRef.current?.click()
                            )
                          }
                          className="px-3.5 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold border border-sky-200 flex items-center gap-1 transition cursor-pointer shrink-0"
                          title="View Photo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonal({ ...personal, profilePhoto: '' })}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Biography & Architectural Philosophy <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={personal.bio}
                    onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                    placeholder="Describe your design philosophy, specializations, and residential project experience..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 2: BUSINESS & FIRM DETAILS ---------------- */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <span>Step 2: Architecture Firm & Council of Architecture Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registration and statutory tax compliance details for invoicing and contracts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.firmName}
                    onChange={(e) => setBusiness({ ...business, firmName: e.target.value })}
                    placeholder="Enter registered firm name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    OWNER / Director <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={business.businessType}
                    onChange={(e) => setBusiness({ ...business, businessType: e.target.value as ArchitectBusinessType })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="HUB">HUB</option>
                    <option value="HUF">HUF</option>
                    <option value="LLP">LLP</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="NGO">NGO</option>
                    <option value="AOP/BOI">AOP/BOI</option>
                    {business.businessType && ![
                      'Individual', 'HUB', 'HUF', 'LLP', 'Partnership',
                      'Private Limited Company', 'Public Limited Company', 'NGO', 'AOP/BOI'
                    ].includes(business.businessType) && (
                      <option value={business.businessType}>{business.businessType}</option>
                    )}
                  </select>
                </div>

                {/* COA License Number - Highlighted */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-300">
                  <label className="block text-xs font-black text-sky-950 mb-1 flex items-center justify-between">
                    <span>Council of Architecture (COA) Registration Number *</span>
                    <span className="text-[10px] text-sky-700 font-mono font-bold">Standard: CA/YYYY/XXXXX</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={business.coaNumber}
                    onChange={(e) => setBusiness({ ...business, coaNumber: e.target.value.toUpperCase().slice(0, 20) })}
                    placeholder="Enter COA registration number (e.g. CA/2020/12345)"
                    className="w-full px-3.5 py-2 bg-white border border-sky-300 rounded-xl text-xs font-mono font-black focus:outline-none focus:border-sky-600 uppercase"
                  />
                  <p className="text-[10px] text-sky-800 mt-1">
                    This registration will be cross-checked with the Council of Architecture public registry.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Year of Establishment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.establishmentYear || ''}
                    onChange={(e) => setBusiness({ ...business, establishmentYear: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Team Size <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.teamSize || ''}
                    onChange={(e) => setBusiness({ ...business, teamSize: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Licensed Architects on Team <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={business.architectsCount || ''}
                    onChange={(e) => setBusiness({ ...business, architectsCount: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Firm PAN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={business.panNumber}
                    onChange={(e) => setBusiness({ ...business, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                    placeholder="Enter 10-character PAN (e.g. ABCDE1234F)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500 focus:bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN Number (Optional if unregistered)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={business.gstin}
                    onChange={(e) => setBusiness({ ...business, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) })}
                    placeholder="Enter 15-character GSTIN (optional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500 focus:bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Firm Profile / Brochure (PDF/Doc)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[42px]">
                      {business.website ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-800 font-bold truncate">
                            {firmBrochureFileName || 'Brochure Attached'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">No document selected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => firmBrochureInputRef.current?.click()}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{business.website ? 'Change' : 'Upload'}</span>
                    </button>
                    {business.website && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenPreview(
                              'Firm Profile / Brochure',
                              business.website,
                              firmBrochureFileName,
                              undefined,
                              () => firmBrochureInputRef.current?.click()
                            )
                          }
                          className="px-3.5 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold border border-sky-200 flex items-center gap-1 transition cursor-pointer shrink-0"
                          title="View Brochure"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBusiness({ ...business, website: '' });
                            setFirmBrochureFileName('');
                          }}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Office Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    placeholder="Office / studio street address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <SearchableSelect
                  label="State"
                  required
                  value={business.state}
                  options={Object.keys(INDIAN_STATES_AND_CITIES)}
                  placeholder="Type to search State (e.g. Haryana, UP, Delhi)..."
                  onChange={(selectedState) => {
                    setBusiness({
                      ...business,
                      state: selectedState,
                      district:
                        business.district && INDIAN_STATES_AND_DISTRICTS[selectedState]?.includes(business.district)
                          ? business.district
                          : '',
                      city:
                        business.city && INDIAN_STATES_AND_CITIES[selectedState]?.includes(business.city)
                          ? business.city
                          : '',
                    });
                  }}
                />

                <SearchableSelect
                  label="District"
                  value={business.district || ''}
                  options={availableDistricts}
                  placeholder={
                    business.state
                      ? `Select / type district in ${business.state}...`
                      : 'Select or type district...'
                  }
                  allowCustom={true}
                  onChange={(selectedDistrict) => {
                    let matchedState = business.state;
                    if (!matchedState) {
                      for (const [st, dists] of Object.entries(INDIAN_STATES_AND_DISTRICTS)) {
                        if (dists.some((d) => d.toLowerCase() === selectedDistrict.toLowerCase())) {
                          matchedState = st;
                          break;
                        }
                      }
                    }
                    setBusiness({
                      ...business,
                      district: selectedDistrict,
                      state: matchedState || business.state,
                    });
                  }}
                />

                <SearchableSelect
                  label="City"
                  required
                  value={business.city}
                  options={
                    business.state && INDIAN_STATES_AND_CITIES[business.state]
                      ? INDIAN_STATES_AND_CITIES[business.state]
                      : allAvailableCities
                  }
                  placeholder={
                    business.state
                      ? `Type to search city in ${business.state}...`
                      : 'Type to search city...'
                  }
                  allowCustom={true}
                  onChange={(selectedCity) => {
                    let matchedState = business.state;
                    if (!matchedState) {
                      for (const [st, cities] of Object.entries(INDIAN_STATES_AND_CITIES)) {
                        if (cities.some((c) => c.toLowerCase() === selectedCity.toLowerCase())) {
                          matchedState = st;
                          break;
                        }
                      }
                    }
                    let matchedDistrict = business.district;
                    if (matchedState && INDIAN_STATES_AND_DISTRICTS[matchedState]?.includes(selectedCity)) {
                      matchedDistrict = selectedCity;
                    }
                    setBusiness({
                      ...business,
                      city: selectedCity,
                      state: matchedState || business.state,
                      district: matchedDistrict || business.district,
                    });
                  }}
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={business.pincode}
                    onChange={(e) => setBusiness({ ...business, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter 6-digit PIN code"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 3: 21 SERVICES SELECTION ---------------- */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-600" />
                    <span>Step 3: Select Architectural & Engineering Services</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Check all categories your firm is qualified to execute. Landowner RFQs will be filtered accordingly.
                  </p>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-sky-100 text-sky-900 rounded-full font-mono">
                  {selectedServices.length} of {ALL_ARCHITECTURAL_SERVICES.length} Selected
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_ARCHITECTURAL_SERVICES.map((srv, idx) => {
                  const isChecked = selectedServices.includes(srv.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleService(srv.name)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'bg-sky-50/90 border-sky-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isChecked ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {srv.category}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-navy-950 mb-1">{srv.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">{srv.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 4: PORTFOLIO PROJECTS ---------------- */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-sky-600" />
                    <span>Step 4: Past Portfolio & Completed Residences</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload at least 1-2 delivered architectural projects to demonstrate your design aesthetic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolioProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div
                        className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-100 cursor-pointer group"
                        onClick={() => handleOpenPreview(p.title, p.imageUrl, undefined, undefined)}
                        title="Click to view full photo"
                      >
                        <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-navy-950/80 backdrop-blur-md text-white text-[10px] font-bold">
                          {p.category}
                        </span>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-navy-950">{p.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(p.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{p.location}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-700">{p.builtUpArea}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Completed: {p.completionYear}</span>
                      <span className="text-emerald-600 font-bold">Verified Entry</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Project Modal */}
              {showAddProjectModal && (
                <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-base font-black text-navy-950">Add Portfolio Showcase Project</h4>
                      <button
                        onClick={() => setShowAddProjectModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Project Title *</label>
                        <input
                          type="text"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder="Enter project title"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={newProject.category}
                            onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                            placeholder=""
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Built-Up Area *</label>
                          <input
                            type="text"
                            value={newProject.builtUpArea}
                            onChange={(e) => setNewProject({ ...newProject, builtUpArea: e.target.value })}
                            placeholder=""
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Location / Sector *</label>
                        <input
                          type="text"
                          value={newProject.location}
                          onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                          placeholder=""
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Project Photo
                        </label>
                        <input
                          ref={projectImageInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProjectImageUpload}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[40px]">
                            {newProject.imageUrl ? (
                              <>
                                <img
                                  src={newProject.imageUrl}
                                  alt="Preview"
                                  className="w-6 h-6 rounded-md object-cover border border-emerald-300 shrink-0"
                                />
                                <span className="text-emerald-800 font-bold truncate">Photo Attached</span>
                              </>
                            ) : (
                              <span className="text-slate-400">No image chosen</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => projectImageInputRef.current?.click()}
                            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{newProject.imageUrl ? 'Change' : 'Upload'}</span>
                          </button>
                          {newProject.imageUrl && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPreview(
                                    newProject.title || 'Project Photo',
                                    newProject.imageUrl,
                                    undefined,
                                    undefined,
                                    () => projectImageInputRef.current?.click()
                                  )
                                }
                                className="px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold border border-sky-200 flex items-center gap-1 transition cursor-pointer shrink-0"
                                title="View Photo"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProject({ ...newProject, imageUrl: '' })}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
                                title="Remove image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Brief description of the project features, structure, etc."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddProjectModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProject}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                      >
                        Save Project
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ---------------- STEP 5: KYC DOCUMENTS ---------------- */}
          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-sky-600" />
                  <span>Step 5: KYC Verification Documents</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Statutory identity proofs for Directors / Business Owners and official business compliance verification.
                </p>
              </div>

              {/* ================= 1. DIRECTOR / BUSINESS OWNER KYC ================= */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <div className="text-sm font-black text-navy-950 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                      <span>Director / Business Owner KYC</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter details and upload PAN & Aadhaar for all Directors, Partners, or Business Owners.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDirector}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Director / Owner</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {directors.map((dir, idx) => (
                    <div
                      key={dir.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-navy-950 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black">
                            #{idx + 1}
                          </span>
                          <span>Director / Partner / Owner</span>
                        </span>
                        {directors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDirector(dir.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Remove this director"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Director Name */}
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Director / Business Owner Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={dir.name}
                            onChange={(e) => handleUpdateDirector(dir.id, { name: e.target.value })}
                            placeholder="Enter full name as per official ID (PAN / Aadhaar)"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                          />
                        </div>

                        {/* PAN Column */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            PAN Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={10}
                            value={dir.panNumber}
                            onChange={(e) =>
                              handleUpdateDirector(dir.id, {
                                panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
                              })
                            }
                            placeholder="10-character PAN (e.g. ABCDE1234F)"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                          />
                          <div className="pt-1">
                            {dir.panFileUrl ? (
                              <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{dir.panFileName || 'PAN Attached'}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(`${dir.name || 'Director'} - PAN Card`, dir.panFileUrl, dir.panFileName, dir.panStorageKey, () => triggerDirectorPanUpload(dir.id))}
                                    className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                    title="View PAN Card"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerDirectorPanUpload(dir.id)}
                                    className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                                  >
                                    Change
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerDirectorPanUpload(dir.id)}
                                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload PAN Card</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Aadhaar Column */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Aadhaar Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                            <div>
                              <input
                                type="text"
                                maxLength={12}
                                value={dir.aadharNumber}
                                onChange={(e) =>
                                  handleUpdateDirector(dir.id, {
                                    aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                                  })
                                }
                                placeholder="12-digit Aadhaar Number"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                              />
                            </div>
                            <div>
                              {dir.aadharFileUrl ? (
                                <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                  <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{dir.aadharFileName || 'Aadhaar Attached'}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPreview(`${dir.name || 'Director'} - Aadhaar Card`, dir.aadharFileUrl, dir.aadharFileName, dir.aadharStorageKey, () => triggerDirectorAadhaarUpload(dir.id))}
                                      className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                      title="View Aadhaar Card"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => triggerDirectorAadhaarUpload(dir.id)}
                                      className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                                    >
                                      Change
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => triggerDirectorAadhaarUpload(dir.id)}
                                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Upload Aadhaar Card</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Plus button to add more directors */}
                  <button
                    type="button"
                    onClick={handleAddDirector}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-sky-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4 text-sky-600" />
                    <span>+ Add Another Director / Partner / Business Owner</span>
                  </button>
                </div>
              </div>

              {/* ================= 2. BUSINESS VERIFICATION ================= */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div>
                  <div className="text-sm font-black text-navy-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>Business Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fill statutory business details and upload official documents column-wise.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. COA Registration */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-black text-navy-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-sky-600" />
                        <span>Council of Architecture (COA) *</span>
                      </span>
                      <span className="text-[10px] text-sky-700 font-mono font-bold">CA/YYYY/XXXXX</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">COA License Number *</label>
                      <input
                        type="text"
                        value={businessVerification.coaNumber || business.coaNumber}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setBusinessVerification({ ...businessVerification, coaNumber: val });
                          setBusiness({ ...business, coaNumber: val });
                        }}
                        placeholder="e.g. CA/2020/12345"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">COA Certificate Document *</label>
                      {businessVerification.coaFileUrl ? (
                        <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{businessVerification.coaFileName || 'COA Certificate Attached'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview('Council of Architecture (COA) Certificate', businessVerification.coaFileUrl, businessVerification.coaFileName, businessVerification.coaStorageKey, triggerBizCoaUpload)}
                              className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              title="View COA Certificate"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={triggerBizCoaUpload}
                              className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={triggerBizCoaUpload}
                          className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload COA Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Firm PAN Card */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-black text-navy-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-sky-600" />
                        <span>Company / Firm PAN *</span>
                      </span>
                      <span className="text-[10px] text-sky-700 font-mono font-bold">10 Characters</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Firm PAN Number *</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={businessVerification.panNumber || business.panNumber}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                          setBusinessVerification({ ...businessVerification, panNumber: val });
                          setBusiness({ ...business, panNumber: val });
                        }}
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Firm PAN Document *</label>
                      {businessVerification.panFileUrl ? (
                        <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{businessVerification.panFileName || 'Firm PAN Attached'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview('Firm / Company PAN Card', businessVerification.panFileUrl, businessVerification.panFileName, businessVerification.panStorageKey, triggerBizPanUpload)}
                              className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              title="View Firm PAN"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={triggerBizPanUpload}
                              className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={triggerBizPanUpload}
                          className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Firm PAN Card</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. GST Registration Certificate */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-black text-navy-950 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <span>GST Registration (Optional / If Applicable)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">15 Characters</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">GSTIN Number (Optional)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={businessVerification.gstin || business.gstin}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                          setBusinessVerification({ ...businessVerification, gstin: val });
                          setBusiness({ ...business, gstin: val });
                        }}
                        placeholder="Enter GSTIN (optional if exempt)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">GST Certificate (Optional)</label>
                      {businessVerification.gstFileUrl ? (
                        <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{businessVerification.gstFileName || 'GST Certificate Attached'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview('GST Registration Certificate', businessVerification.gstFileUrl, businessVerification.gstFileName, businessVerification.gstStorageKey, triggerBizGstUpload)}
                              className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              title="View GST Certificate"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={triggerBizGstUpload}
                              className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={triggerBizGstUpload}
                          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload GST Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4. Business Proof */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-black text-navy-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-sky-600" />
                        <span>Business Proof / Firm Registration *</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Proof Type *</label>
                        <select
                          value={businessVerification.businessProofType}
                          onChange={(e) =>
                            setBusinessVerification({ ...businessVerification, businessProofType: e.target.value })
                          }
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-sky-500"
                        >
                          <option value="Certificate of Incorporation (COI)">Certificate of Incorporation (COI)</option>
                          <option value="Partnership Deed">Partnership Deed</option>
                          <option value="MSME / Udyam Registration">MSME / Udyam Registration</option>
                          <option value="Shop & Establishment Act">Shop & Establishment Act</option>
                          <option value="Trade License / Local Authority">Trade License / Local Authority</option>
                          <option value="Statutory Business Registration">Statutory Business Registration</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Registration / Doc Number</label>
                        <input
                          type="text"
                          value={businessVerification.businessProofNumber}
                          onChange={(e) =>
                            setBusinessVerification({ ...businessVerification, businessProofNumber: e.target.value })
                          }
                          placeholder="Enter document number"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Proof Document *</label>
                      {businessVerification.businessProofFileUrl ? (
                        <div className="flex items-center justify-between gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{businessVerification.businessProofFileName || 'Business Proof Attached'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(`Business Proof (${businessVerification.businessProofType || 'Statutory'})`, businessVerification.businessProofFileUrl, businessVerification.businessProofFileName, businessVerification.businessProofStorageKey, triggerBizProofUpload)}
                              className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              title="View Business Proof"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={triggerBizProofUpload}
                              className="text-[10px] text-sky-700 hover:underline font-bold cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={triggerBizProofUpload}
                          className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Business Proof Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 6: BANK DETAILS & CHEQUE ---------------- */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  <span>Step 6: Bank Account Details & Cheque</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your firm or personal bank account details and upload a cheque for secure milestone escrow disbursements.
                </p>
              </div>

              {/* Escrow Milestone Guarantee Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-navy-950 block">Bank Account for Direct Milestone Escrow Settlements</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Client funds are deposited in multi-signature escrow tranches and automatically disbursed to this verified bank account upon landowner design phase approvals.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bank Name Searchable Dropdown */}
                <SearchableSelect
                  label="Bank Name"
                  required
                  value={bank.bankName}
                  options={ALL_INDIAN_BANKS}
                  placeholder="Type to search Bank (e.g. HDFC, SBI, ICICI, Axis, PNB)..."
                  allowCustom={true}
                  onChange={(selectedBank) => {
                    setBank({
                      ...bank,
                      bankName: selectedBank,
                    });
                  }}
                />

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBank({ ...bank, accountType: 'CURRENT' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        bank.accountType === 'CURRENT'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Current Account (Firm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBank({ ...bank, accountType: 'SAVINGS' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        bank.accountType === 'SAVINGS'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Savings Account</span>
                    </button>
                  </div>
                </div>

                {/* Account Holder Name */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Beneficiary Account Holder Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {business.firmName && (
                        <button
                          type="button"
                          onClick={() => setBank({ ...bank, accountHolderName: business.firmName })}
                          className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                        >
                          Use Firm Name ({business.firmName})
                        </button>
                      )}
                      {personal.name && (
                        <button
                          type="button"
                          onClick={() => setBank({ ...bank, accountHolderName: personal.name })}
                          className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                        >
                          Use Principal Name ({personal.name})
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={bank.accountHolderName}
                    onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                    placeholder="Enter name exactly as on bank records"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={18}
                    minLength={9}
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                    placeholder="Enter bank account number (9-18 digits)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                {/* Confirm Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    minLength={9}
                    value={bank.confirmAccountNumber}
                    onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                    placeholder="Re-enter bank account number"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:bg-white transition ${
                      bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber
                        ? 'border-rose-400 focus:border-rose-500'
                        : bank.confirmAccountNumber && bank.accountNumber === bank.confirmAccountNumber
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-slate-200 focus:border-sky-500'
                    }`}
                  />
                  {bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber && (
                    <span className="text-[10px] text-rose-500 font-semibold block mt-1">
                      Account numbers do not match!
                    </span>
                  )}
                  {bank.confirmAccountNumber && bank.accountNumber === bank.confirmAccountNumber && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Account numbers match
                    </span>
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                    placeholder="Enter 11-digit IFSC code (e.g. HDFC0000123)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">11-character alphanumeric code from cheque or passbook</span>
                </div>

                {/* Branch / City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Branch Name & City
                  </label>
                  <input
                    type="text"
                    value={bank.branch}
                    onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                    placeholder="Enter branch name / location"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                {/* Cheque Document Proof with Side Upload Button */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Cheque Document Proof *</span>
                    {bank.cancelledChequeFileName && (
                      <span className="text-[10px] font-bold text-emerald-700">Attached</span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[42px]">
                      {bank.cancelledChequeUrl ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-800 font-mono font-bold truncate text-[11px]">
                            {bank.cancelledChequeFileName || 'Cheque Attached'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">Scanned cheque / passbook</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={triggerChequeUpload}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{bank.cancelledChequeUrl ? 'Change' : 'Upload Cheque'}</span>
                    </button>
                    {bank.cancelledChequeUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenPreview('Bank Cancelled Cheque', bank.cancelledChequeUrl, bank.cancelledChequeFileName, (bank as any).cancelledChequeStorageKey, triggerChequeUpload)}
                          className="px-3 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="View Cheque"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelCheque}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
                          title="Cancel / Remove Cheque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Accept Cheque Checkbox right inside the bank section */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="flex items-start gap-3 p-3 bg-sky-50/60 border border-sky-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="acceptChequeCheckbox"
                      checked={bank.isChequeAccepted}
                      onChange={(e) => setBank({ ...bank, isChequeAccepted: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <div className="text-xs text-slate-700">
                      <span className="font-bold text-navy-950 block">Accept Cheque & Verify Account Details</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        I confirm and accept that the attached cheque belongs to this registered practice and all milestone escrow disbursements should be sent to this verified bank account.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 7: SERVICE CITIES & REVIEW SUBMIT ---------------- */}
          {currentStep === 7 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-navy-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span>Step 7: Service Coverage Areas & Final Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confirm your operating geographic regions and review your profile summary before dispatching for verification.
                </p>
              </div>

              {/* Operating Cities Selection with Live Search */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Select Operating Cities / Localities: <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Search and select all geographic regions where your firm takes up architectural projects.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                      {serviceCities.length} Selected
                    </span>
                    {serviceCities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          hasUserClearedCitiesRef.current = true;
                          setServiceCities([]);
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Cities Badges Container */}
                {serviceCities.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Active Coverage Areas ({serviceCities.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {serviceCities.map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-2xs group"
                        >
                          <MapPin className="w-3 h-3 text-sky-200" />
                          <span>{city}</span>
                          <button
                            type="button"
                            onClick={() => removeCity(city)}
                            className="w-4 h-4 rounded-full hover:bg-sky-700 flex items-center justify-center text-sky-100 hover:text-white transition ml-0.5"
                            title="Remove city"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Search Input Box */}
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      placeholder="Search operating cities (e.g. Jaipur, Delhi, Mumbai)..."
                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-sky-500 rounded-2xl text-xs font-semibold focus:outline-none shadow-xs transition placeholder:text-slate-400 text-slate-900"
                    />
                    {citySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCitySearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtered Search Results Dropdown/Box when searching */}
                  {citySearchQuery.trim() && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 max-h-64 overflow-y-auto z-20">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100">
                        <span>Search Results for "{citySearchQuery}"</span>
                        <span className="text-slate-400">{filteredCities.length} match(es)</span>
                      </div>

                      {filteredCities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {filteredCities.map(({ city, state }) => {
                            const isSelected = serviceCities.includes(city);
                            return (
                              <button
                                key={city}
                                type="button"
                                onClick={() => toggleCity(city)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition ${
                                  isSelected
                                    ? 'bg-sky-50 border border-sky-300 text-sky-900 font-bold'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                                  <span className="truncate">{city}</span>
                                  <span className="text-[10px] text-slate-400 truncate">({state})</span>
                                </div>
                                {isSelected ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white shrink-0">
                                    ✓ Selected
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-sky-600 font-bold shrink-0 hover:underline">
                                    + Add
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-500">
                          No predefined city matches "{citySearchQuery}".
                        </div>
                      )}

                      {/* Option to add custom typed city */}
                      {citySearchQuery.trim() && !serviceCities.includes(citySearchQuery.trim()) && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              toggleCity(citySearchQuery.trim());
                              setCitySearchQuery('');
                            }}
                            className="w-full px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>+ Add "{citySearchQuery.trim()}" as Custom Operating Locality / City</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Add Regional Hubs & Firm City */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      Popular Hubs (Click to add / remove):
                    </span>
                    {business.city && !serviceCities.includes(business.city) && (
                      <button
                        type="button"
                        onClick={() => toggleCity(business.city)}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-800 underline flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>+ Add Firm City ({business.city})</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {business.city && (
                      <button
                        type="button"
                        onClick={() => toggleCity(business.city)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          serviceCities.includes(business.city)
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{business.city} (HQ)</span>
                        {serviceCities.includes(business.city) ? <Check className="w-3 h-3 ml-0.5" /> : <Plus className="w-3 h-3 ml-0.5" />}
                      </button>
                    )}
                    {['Jaipur', 'Delhi NCR', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Ahmedabad', 'Lucknow', 'Chandigarh', 'Indore'].map((c) => {
                      if (business.city && c.toLowerCase() === business.city.toLowerCase()) return null;
                      const isSel = serviceCities.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCity(c)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                            isSel
                              ? 'bg-sky-600 text-white font-bold shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span>{c}</span>
                          {isSel ? <Check className="w-3 h-3 ml-0.5" /> : <Plus className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ================= COMPREHENSIVE APPLICATION REVIEW ================= */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-black text-navy-950 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-sky-600" />
                      <span>Complete Application Review</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify all submitted details below. Click "Edit" next to any section or upload directly without going back.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
                    ✓ Ready for Submission
                  </span>
                </div>

                {/* 1. Principal Architect Details */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-600" />
                      <span>1. Principal Architect / Lead Personal Details</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1 border border-sky-200 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit (Step 1)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Full Professional Name:</span>
                      <strong className="text-navy-950 text-xs">{personal.name || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Designation / Title:</span>
                      <strong className="text-navy-950 text-xs">{personal.designation || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Architectural Experience:</span>
                      <strong className="text-navy-950 text-xs">{personal.experienceYears ? `${personal.experienceYears} Years` : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Mobile Phone:</span>
                      <strong className="font-mono text-navy-950 text-xs">{personal.phone || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Email Address:</span>
                      <strong className="text-navy-950 text-xs">{personal.email || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-1">Profile Photo:</span>
                      <div className="flex items-center gap-2">
                        {personal.profilePhoto ? (
                          <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <img src={personal.profilePhoto} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-emerald-400" />
                            <span className="text-[11px] text-emerald-800 font-bold truncate">Photo Attached</span>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview('Principal Architect Profile Photo', personal.profilePhoto, 'profile_photo.jpg', undefined, () => profilePhotoInputRef.current?.click())}
                              className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-1"
                              title="View Photo"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => profilePhotoInputRef.current?.click()}
                              className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => profilePhotoInputRef.current?.click()}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {personal.bio && (
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 block text-[11px]">Professional Bio:</span>
                      <p className="text-slate-700 mt-0.5 line-clamp-2">{personal.bio}</p>
                    </div>
                  )}
                </div>

                {/* 2. Firm / Company Profile */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>2. Firm & Legal Entity Profile</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1 border border-sky-200 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit (Step 2)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Firm / Company Name:</span>
                      <strong className="text-navy-950 text-xs">{business.firmName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Owner / Director Type:</span>
                      <strong className="text-navy-950 text-xs">{business.businessType || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Establishment Year:</span>
                      <strong className="text-navy-950 text-xs">{business.establishmentYear || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Team Size:</span>
                      <strong className="text-navy-950 text-xs">{business.teamSize ? `${business.teamSize} Members` : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Qualified Architects:</span>
                      <strong className="text-navy-950 text-xs">{business.architectsCount ? `${business.architectsCount} Architects` : '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Firm Registration No:</span>
                      <strong className="font-mono text-navy-950 text-xs">{business.firmRegistrationNumber || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">District & State:</span>
                      <strong className="text-navy-950 text-xs">
                        {business.district ? `${business.district}, ` : ''}{business.state || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">City & Pincode:</span>
                      <strong className="text-navy-950 text-xs">
                        {business.city || '—'} {business.pincode ? `(${business.pincode})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-1">Firm Brochure / PDF:</span>
                      <div className="flex items-center gap-2">
                        {business.website ? (
                          <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[11px] text-emerald-800 font-bold truncate max-w-[100px]">
                              {firmBrochureFileName || 'Brochure Attached'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview('Firm Brochure / Profile', business.website, firmBrochureFileName, undefined, () => firmBrochureInputRef.current?.click())}
                              className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-1"
                              title="View Brochure"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => firmBrochureInputRef.current?.click()}
                              className="text-[10px] text-sky-700 font-bold hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => firmBrochureInputRef.current?.click()}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Brochure</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {business.address && (
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 block text-[11px]">Office Address:</span>
                      <p className="text-slate-700 mt-0.5">{business.address}</p>
                    </div>
                  )}
                </div>

                {/* 3. Architectural Services Offered */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-600" />
                        <span>3. Practice Services Offered ({selectedServices.length} Selected) *</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Click on any service badge to add or remove it from your offerings.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0 self-start sm:self-auto">
                      {selectedServices.length > 0 ? `${selectedServices.length} Active` : '⚠️ Action Required'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_ARCHITECTURAL_SERVICES.map((srv, idx) => {
                      const srvName = typeof srv === 'string' ? srv : srv.name;
                      const isSelected = selectedServices.includes(srvName);
                      return (
                        <button
                          key={srvName || idx}
                          type="button"
                          onClick={() => toggleService(srvName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-2xs border border-sky-700 hover:bg-sky-700'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{srvName}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedServices.length === 0 && (
                    <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Please select at least 1 architectural service to qualify for verification.</span>
                    </p>
                  )}
                </div>

                {/* 4. Showcase Portfolio Projects */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                      <Award className="w-4 h-4 text-sky-600" />
                      <span>4. Showcase Portfolio Projects ({portfolioProjects.length} Added)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1 border border-sky-200 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit (Step 4)</span>
                    </button>
                  </div>
                  {portfolioProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {portfolioProjects.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          {p.imageUrl && (
                            <div
                              className="relative group cursor-pointer mb-1.5"
                              onClick={() => handleOpenPreview(p.title, p.imageUrl, undefined, undefined)}
                              title="Click to view photo"
                            >
                              <img src={p.imageUrl} alt={p.title} className="w-full h-24 object-cover rounded-lg" />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" />
                                <span>View</span>
                              </span>
                            </div>
                          )}
                          <div className="font-black text-navy-950 text-xs truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{p.category} • {p.location}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Area: {p.builtUpArea} • Year: {p.completionYear}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">0 Portfolio residences attached. (Optional - can be added anytime).</p>
                  )}
                </div>

                {/* 5. KYC Verification Documents */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-600" />
                        <span>5. Statutory KYC Verification Documents</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Directors identity proofs & official business registration compliance documents.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1 border border-sky-200 cursor-pointer shrink-0"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit (Step 5)</span>
                    </button>
                  </div>

                  {/* Subsection 5.1: Directors KYC */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-navy-950 flex items-center gap-1.5 uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        <span>1. Director / Business Owner KYC ({directors.length} Owner{directors.length > 1 ? 's' : ''})</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddDirector}
                        className="text-[11px] text-sky-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Another Director</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {directors.map((dir, dIdx) => (
                        <div key={dir.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded text-[9px] font-black shrink-0">
                                #{dIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={dir.name}
                                onChange={(e) => handleUpdateDirector(dir.id, { name: e.target.value })}
                                placeholder="Director Full Name *"
                                className="font-bold text-navy-950 text-xs px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-sky-500 w-full"
                              />
                            </div>
                            {directors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDirector(dir.id)}
                                className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer shrink-0"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Director PAN Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200/80">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">PAN Number *</span>
                              <input
                                type="text"
                                maxLength={10}
                                value={dir.panNumber}
                                onChange={(e) =>
                                  handleUpdateDirector(dir.id, {
                                    panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
                                  })
                                }
                                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                              />
                            </div>
                            <div className="shrink-0 sm:self-end">
                              {(dir.panFileUrl || (dir as any).panDocUrl) ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[90px]">{dir.panFileName || 'PAN Attached'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(`${dir.name || 'Director'} - PAN Card`, dir.panFileUrl || (dir as any).panDocUrl || '', dir.panFileName, dir.panStorageKey, () => triggerDirectorPanUpload(dir.id))}
                                    className="px-2 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                    title="View PAN Card"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerDirectorPanUpload(dir.id)}
                                    className="px-2 py-1 text-[10px] text-sky-700 underline font-bold cursor-pointer"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => triggerDirectorPanUpload(dir.id)}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Upload PAN</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Director Aadhaar Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200/80">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Aadhaar Number *</span>
                              <input
                                type="text"
                                maxLength={12}
                                value={dir.aadharNumber}
                                onChange={(e) =>
                                  handleUpdateDirector(dir.id, {
                                    aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                                  })
                                }
                                placeholder="12-digit Aadhaar Number"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                              />
                            </div>
                            <div className="shrink-0 sm:self-end">
                              {(dir.aadharFileUrl || (dir as any).aadharDocUrl) ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[90px]">{dir.aadharFileName || 'Aadhaar Attached'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(`${dir.name || 'Director'} - Aadhaar Card`, dir.aadharFileUrl || (dir as any).aadharDocUrl || '', dir.aadharFileName, dir.aadharStorageKey, () => triggerDirectorAadhaarUpload(dir.id))}
                                    className="px-2 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                    title="View Aadhaar Card"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerDirectorAadhaarUpload(dir.id)}
                                    className="px-2 py-1 text-[10px] text-sky-700 underline font-bold cursor-pointer"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => triggerDirectorAadhaarUpload(dir.id)}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Upload Aadhaar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subsection 5.2: Business Verification Details */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-black text-navy-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Business Verification Details</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* COA */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-950 text-xs flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-sky-600" />
                            <span>COA License *</span>
                          </span>
                          <span className="text-[10px] text-sky-700 font-mono font-bold">CA/YYYY/XXXXX</span>
                        </div>
                        <input
                          type="text"
                          value={businessVerification.coaNumber || business.coaNumber}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setBusinessVerification({ ...businessVerification, coaNumber: val });
                            setBusiness({ ...business, coaNumber: val });
                          }}
                          placeholder="e.g. CA/2020/12345"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                        />
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Certificate Doc:</span>
                          {(businessVerification.coaFileUrl || (businessVerification as any).coaDocUrl) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[100px]">{businessVerification.coaFileName || 'Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview('Council of Architecture (COA) Certificate', businessVerification.coaFileUrl || (businessVerification as any).coaDocUrl || '', businessVerification.coaFileName, businessVerification.coaStorageKey, triggerBizCoaUpload)}
                                className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                title="View COA Certificate"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={triggerBizCoaUpload}
                                className="text-[10px] text-sky-700 underline font-bold ml-0.5 cursor-pointer"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerBizCoaUpload}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload COA</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Firm PAN */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-950 text-xs flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                            <span>Firm / Company PAN *</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">10 Characters</span>
                        </div>
                        <input
                          type="text"
                          maxLength={10}
                          value={businessVerification.panNumber || business.panNumber}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                            setBusinessVerification({ ...businessVerification, panNumber: val });
                            setBusiness({ ...business, panNumber: val });
                          }}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                        />
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">PAN Document:</span>
                          {(businessVerification.panFileUrl || (businessVerification as any).panDocUrl) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[100px]">{businessVerification.panFileName || 'Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview('Firm / Company PAN Card', businessVerification.panFileUrl || (businessVerification as any).panDocUrl || '', businessVerification.panFileName, businessVerification.panStorageKey, triggerBizPanUpload)}
                                className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                title="View Firm PAN"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={triggerBizPanUpload}
                                className="text-[10px] text-sky-700 underline font-bold ml-0.5 cursor-pointer"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerBizPanUpload}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload Firm PAN</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* GST */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-950 text-xs flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-sky-600" />
                            <span>GSTIN (Optional)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">15 Characters</span>
                        </div>
                        <input
                          type="text"
                          maxLength={15}
                          value={businessVerification.gstin || business.gstin}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                            setBusinessVerification({ ...businessVerification, gstin: val });
                            setBusiness({ ...business, gstin: val });
                          }}
                          placeholder="Enter GSTIN (optional if exempt)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500"
                        />
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">GST Certificate:</span>
                          {(businessVerification.gstFileUrl || (businessVerification as any).gstDocUrl) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[100px]">{businessVerification.gstFileName || 'Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview('GST Registration Certificate', businessVerification.gstFileUrl || (businessVerification as any).gstDocUrl || '', businessVerification.gstFileName, businessVerification.gstStorageKey, triggerBizGstUpload)}
                                className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                title="View GST Certificate"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={triggerBizGstUpload}
                                className="text-[10px] text-sky-700 underline font-bold ml-0.5 cursor-pointer"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerBizGstUpload}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload GST</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Business Proof */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy-950 text-xs flex items-center gap-1 truncate max-w-[150px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span className="truncate">{businessVerification.businessProofType || 'Business Proof'}</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={businessVerification.businessProofNumber}
                          onChange={(e) => setBusinessVerification({ ...businessVerification, businessProofNumber: e.target.value })}
                          placeholder="Registration / Document Number"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-sky-500"
                        />
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Proof Document:</span>
                          {(businessVerification.businessProofFileUrl || (businessVerification as any).businessProofDocUrl) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[100px]">{businessVerification.businessProofFileName || 'Attached'}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(`Business Proof (${businessVerification.businessProofType || 'Statutory'})`, businessVerification.businessProofFileUrl || (businessVerification as any).businessProofDocUrl || '', businessVerification.businessProofFileName, businessVerification.businessProofStorageKey, triggerBizProofUpload)}
                                className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                                title="View Business Proof"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={triggerBizProofUpload}
                                className="text-[10px] text-sky-700 underline font-bold ml-0.5 cursor-pointer"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={triggerBizProofUpload}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload Proof</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Bank Details & Cheque */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-black text-navy-950 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>6. Bank Details & Escrow Settlement Account</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct escrow settlement details for project payments. Editable directly below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1 border border-sky-200 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit (Step 6)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={bank.bankName}
                        onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                        placeholder="e.g. HDFC Bank, SBI, ICICI"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        value={bank.accountHolderName}
                        onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                        placeholder="Name on bank records"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">Account Number *</label>
                      <input
                        type="text"
                        maxLength={18}
                        value={bank.accountNumber}
                        onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                        placeholder="9-18 digit account number"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={bank.ifscCode}
                        onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                        placeholder="11-char IFSC (e.g. HDFC0000452)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">Account Type *</label>
                      <select
                        value={bank.accountType}
                        onChange={(e) => setBank({ ...bank, accountType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                      >
                        <option value="CURRENT">Current Account (Firm)</option>
                        <option value="SAVINGS">Savings Account (Personal)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 block text-[11px] font-bold mb-1">Branch / Location</label>
                      <input
                        type="text"
                        value={bank.branch}
                        onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                        placeholder="Branch (e.g. MI Road, Jaipur)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3 pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block text-[11px] mb-1 font-bold">Cancelled Cheque Document:</span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        {bank.cancelledChequeUrl ? (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-emerald-800 truncate">
                              {bank.cancelledChequeFileName || 'Cancelled Cheque Attached'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenPreview(
                                  'Bank Cancelled Cheque',
                                  bank.cancelledChequeUrl,
                                  bank.cancelledChequeFileName,
                                  (bank as any).cancelledChequeStorageKey,
                                  triggerChequeUpload
                                )
                              }
                              className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200 hover:bg-sky-100 ml-1 inline-flex items-center gap-1 cursor-pointer"
                              title="View Cheque"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={triggerChequeUpload}
                              className="text-[11px] text-sky-700 font-bold underline ml-1 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-700 italic text-[11px]">No cheque attached yet.</span>
                            <button
                              type="button"
                              onClick={triggerChequeUpload}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload Cheque</span>
                            </button>
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={bank.isChequeAccepted}
                            onChange={(e) => setBank({ ...bank, isChequeAccepted: e.target.checked })}
                            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <span>Accept & Confirm Bank Verification</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Once submitted, our Operations Desk typically evaluates submissions within <strong>24 to 48 hours</strong>.
                  You can track approval progress in real time.
                </span>
              </div>
            </motion.div>
          )}

          {/* Wizard Footer Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 6 && bank.accountNumber && bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber) {
                    error('Bank account numbers do not match! Please check and re-confirm.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-md"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Profile for Verification</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* =========================================================================
          IN-PLACE DOCUMENT PREVIEW & RE-UPLOAD MODAL
          Allows instant visual inspection of uploaded documents with one-click re-upload
      ========================================================================= */}
      <AnimatePresence>
        {previewModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy-950/75 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{previewModalDoc.title}</span>
                      {previewModalDoc.fileName && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-normal truncate max-w-[200px]">
                          {previewModalDoc.fileName}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Live Document Preview & Verification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {previewModalDoc.fileUrl && previewModalDoc.fileUrl !== '#' && (
                    <a
                      href={previewModalDoc.fileUrl}
                      download={previewModalDoc.fileName || 'document'}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                      title="Download / Open Fullscreen"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewModalDoc(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Viewer */}
              <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[350px]">
                {previewModalDoc.fileUrl && (previewModalDoc.fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(previewModalDoc.fileName || previewModalDoc.fileUrl)) ? (
                  <div className="w-full flex items-center justify-center p-2">
                    <img
                      src={previewModalDoc.fileUrl}
                      alt={previewModalDoc.title}
                      className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                    />
                  </div>
                ) : previewModalDoc.fileUrl && (previewModalDoc.fileUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(previewModalDoc.fileName || previewModalDoc.fileUrl)) ? (
                  <iframe
                    src={previewModalDoc.fileUrl}
                    title={previewModalDoc.title}
                    className="w-full h-[65vh] rounded-xl border border-slate-300 bg-white shadow-sm"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md">
                    <FileText className="w-12 h-12 text-sky-600 mx-auto mb-3" />
                    <h5 className="font-bold text-navy-950 text-sm mb-1">{previewModalDoc.title}</h5>
                    <p className="text-xs text-slate-500 mb-4">
                      {previewModalDoc.fileName || 'Attached Document File'}
                    </p>
                    {previewModalDoc.fileUrl && previewModalDoc.fileUrl !== '#' && (
                      <a
                        href={previewModalDoc.fileUrl}
                        download={previewModalDoc.fileName || 'document'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download & View Document</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer with In-Place Change / Re-upload Option */}
              <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Notice something incorrect? You can replace or re-upload this document directly.</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {previewModalDoc.onReupload && (
                    <button
                      type="button"
                      onClick={() => {
                        const reupload = previewModalDoc.onReupload;
                        setPreviewModalDoc(null);
                        setTimeout(() => {
                          reupload?.();
                        }, 100);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change / Re-upload</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewModalDoc(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
