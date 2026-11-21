import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X, Building2, Sparkles } from 'lucide-react';

export interface CityData {
  name: string;
  state: string;
  pinCode: string;
  popular?: boolean;
}

export const POPULAR_INDIAN_CITIES: CityData[] = [
  // Delhi NCR
  { name: 'Gurugram', state: 'Haryana', pinCode: '122001', popular: true },
  { name: 'Delhi NCR', state: 'Delhi NCR', pinCode: '110001', popular: true },
  { name: 'Noida', state: 'Uttar Pradesh', pinCode: '201301', popular: true },
  { name: 'Faridabad', state: 'Haryana', pinCode: '121001', popular: true },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', pinCode: '201001', popular: true },
  { name: 'Greater Noida', state: 'Uttar Pradesh', pinCode: '201310' },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', pinCode: '400001', popular: true },
  { name: 'Pune', state: 'Maharashtra', pinCode: '411001', popular: true },
  { name: 'Nagpur', state: 'Maharashtra', pinCode: '440001' },
  { name: 'Nashik', state: 'Maharashtra', pinCode: '422001' },
  { name: 'Thane', state: 'Maharashtra', pinCode: '400601' },
  { name: 'Navi Mumbai', state: 'Maharashtra', pinCode: '400703' },
  { name: 'Aurangabad (Chhatrapati Sambhajinagar)', state: 'Maharashtra', pinCode: '431001' },
  { name: 'Kolhapur', state: 'Maharashtra', pinCode: '416001' },
  { name: 'Solapur', state: 'Maharashtra', pinCode: '413001' },

  // Karnataka
  { name: 'Bengaluru', state: 'Karnataka', pinCode: '560001', popular: true },
  { name: 'Mysuru', state: 'Karnataka', pinCode: '570001' },
  { name: 'Hubli-Dharwad', state: 'Karnataka', pinCode: '580020' },
  { name: 'Mangaluru', state: 'Karnataka', pinCode: '575001' },
  { name: 'Belagavi', state: 'Karnataka', pinCode: '590001' },

  // Telangana & Andhra Pradesh
  { name: 'Hyderabad', state: 'Telangana', pinCode: '500001', popular: true },
  { name: 'Warangal', state: 'Telangana', pinCode: '506002' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', pinCode: '530001', popular: true },
  { name: 'Vijayawada', state: 'Andhra Pradesh', pinCode: '520001' },
  { name: 'Guntur', state: 'Andhra Pradesh', pinCode: '522001' },
  { name: 'Tirupati', state: 'Andhra Pradesh', pinCode: '517501' },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', pinCode: '302001', popular: true },
  { name: 'Jodhpur', state: 'Rajasthan', pinCode: '342001' },
  { name: 'Udaipur', state: 'Rajasthan', pinCode: '313001' },
  { name: 'Kota', state: 'Rajasthan', pinCode: '324001' },
  { name: 'Ajmer', state: 'Rajasthan', pinCode: '305001' },
  { name: 'Bikaner', state: 'Rajasthan', pinCode: '334001' },
  { name: 'Alwar', state: 'Rajasthan', pinCode: '301001' },
  { name: 'Bhilwara', state: 'Rajasthan', pinCode: '311001' },
  { name: 'Sikar', state: 'Rajasthan', pinCode: '332001' },

  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', pinCode: '226001', popular: true },
  { name: 'Kanpur', state: 'Uttar Pradesh', pinCode: '208001', popular: true },
  { name: 'Varanasi', state: 'Uttar Pradesh', pinCode: '221001', popular: true },
  { name: 'Agra', state: 'Uttar Pradesh', pinCode: '282001' },
  { name: 'Prayagraj (Allahabad)', state: 'Uttar Pradesh', pinCode: '211001' },
  { name: 'Meerut', state: 'Uttar Pradesh', pinCode: '250001' },
  { name: 'Bareilly', state: 'Uttar Pradesh', pinCode: '243001' },
  { name: 'Aligarh', state: 'Uttar Pradesh', pinCode: '202001' },
  { name: 'Moradabad', state: 'Uttar Pradesh', pinCode: '244001' },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', pinCode: '273001' },
  { name: 'Ayodhya', state: 'Uttar Pradesh', pinCode: '224123' },
  { name: 'Mathura', state: 'Uttar Pradesh', pinCode: '281001' },
  { name: 'Saharanpur', state: 'Uttar Pradesh', pinCode: '247001' },
  { name: 'Jhansi', state: 'Uttar Pradesh', pinCode: '284001' },

  // Madhya Pradesh
  { name: 'Bhopal', state: 'Madhya Pradesh', pinCode: '462001', popular: true },
  { name: 'Indore', state: 'Madhya Pradesh', pinCode: '452001', popular: true },
  { name: 'Jabalpur', state: 'Madhya Pradesh', pinCode: '482001' },
  { name: 'Gwalior', state: 'Madhya Pradesh', pinCode: '474001' },
  { name: 'Ujjain', state: 'Madhya Pradesh', pinCode: '456001' },
  { name: 'Sagar', state: 'Madhya Pradesh', pinCode: '470001' },
  { name: 'Satna', state: 'Madhya Pradesh', pinCode: '485001' },
  { name: 'Rewa', state: 'Madhya Pradesh', pinCode: '486001' },

  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', pinCode: '380001', popular: true },
  { name: 'Surat', state: 'Gujarat', pinCode: '395001', popular: true },
  { name: 'Vadodara', state: 'Gujarat', pinCode: '390001' },
  { name: 'Rajkot', state: 'Gujarat', pinCode: '360001' },
  { name: 'Gandhinagar', state: 'Gujarat', pinCode: '382010' },
  { name: 'Bhavnagar', state: 'Gujarat', pinCode: '364001' },
  { name: 'Jamnagar', state: 'Gujarat', pinCode: '361001' },

  // Punjab, Haryana & Chandigarh
  { name: 'Chandigarh', state: 'Chandigarh', pinCode: '160017', popular: true },
  { name: 'Mohali', state: 'Punjab', pinCode: '160055' },
  { name: 'Panchkula', state: 'Haryana', pinCode: '134109' },
  { name: 'Ludhiana', state: 'Punjab', pinCode: '141001' },
  { name: 'Amritsar', state: 'Punjab', pinCode: '143001' },
  { name: 'Jalandhar', state: 'Punjab', pinCode: '144001' },
  { name: 'Patiala', state: 'Punjab', pinCode: '147001' },
  { name: 'Panipat', state: 'Haryana', pinCode: '132103' },
  { name: 'Ambala', state: 'Haryana', pinCode: '134003' },
  { name: 'Karnal', state: 'Haryana', pinCode: '132001' },
  { name: 'Rohtak', state: 'Haryana', pinCode: '124001' },
  { name: 'Hisar', state: 'Haryana', pinCode: '125001' },
  { name: 'Sonipat', state: 'Haryana', pinCode: '131001' },
  { name: 'Rewari', state: 'Haryana', pinCode: '123401' },

  // Bihar
  { name: 'Patna', state: 'Bihar', pinCode: '800001', popular: true },
  { name: 'Gaya', state: 'Bihar', pinCode: '823001' },
  { name: 'Muzaffarpur', state: 'Bihar', pinCode: '842001' },
  { name: 'Bhagalpur', state: 'Bihar', pinCode: '812001' },
  { name: 'Darbhanga', state: 'Bihar', pinCode: '846004' },
  { name: 'Purnia', state: 'Bihar', pinCode: '854301' },

  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', pinCode: '700001', popular: true },
  { name: 'Howrah', state: 'West Bengal', pinCode: '711101' },
  { name: 'Durgapur', state: 'West Bengal', pinCode: '713201' },
  { name: 'Asansol', state: 'West Bengal', pinCode: '713301' },
  { name: 'Siliguri', state: 'West Bengal', pinCode: '734001' },

  // Tamil Nadu
  { name: 'Chennai', state: 'Tamil Nadu', pinCode: '600001', popular: true },
  { name: 'Coimbatore', state: 'Tamil Nadu', pinCode: '641001' },
  { name: 'Madurai', state: 'Tamil Nadu', pinCode: '625001' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', pinCode: '620001' },
  { name: 'Salem', state: 'Tamil Nadu', pinCode: '636001' },

  // Kerala
  { name: 'Kochi', state: 'Kerala', pinCode: '682001', popular: true },
  { name: 'Thiruvananthapuram', state: 'Kerala', pinCode: '695001' },
  { name: 'Kozhikode', state: 'Kerala', pinCode: '673001' },
  { name: 'Thrissur', state: 'Kerala', pinCode: '680001' },

  // Uttarakhand & Himachal Pradesh
  { name: 'Dehradun', state: 'Uttarakhand', pinCode: '248001', popular: true },
  { name: 'Haridwar', state: 'Uttarakhand', pinCode: '249401' },
  { name: 'Rishikesh', state: 'Uttarakhand', pinCode: '249201' },
  { name: 'Roorkee', state: 'Uttarakhand', pinCode: '247667' },
  { name: 'Haldwani', state: 'Uttarakhand', pinCode: '263139' },
  { name: 'Shimla', state: 'Himachal Pradesh', pinCode: '171001' },
  { name: 'Dharamshala', state: 'Himachal Pradesh', pinCode: '176215' },
  { name: 'Solan', state: 'Himachal Pradesh', pinCode: '173212' },

  // Jharkhand & Chhattisgarh & Odisha
  { name: 'Ranchi', state: 'Jharkhand', pinCode: '834001', popular: true },
  { name: 'Jamshedpur', state: 'Jharkhand', pinCode: '831001' },
  { name: 'Dhanbad', state: 'Jharkhand', pinCode: '826001' },
  { name: 'Raipur', state: 'Chhattisgarh', pinCode: '492001', popular: true },
  { name: 'Bhilai', state: 'Chhattisgarh', pinCode: '490006' },
  { name: 'Bilaspur', state: 'Chhattisgarh', pinCode: '495001' },
  { name: 'Bhubaneswar', state: 'Odisha', pinCode: '751001', popular: true },
  { name: 'Cuttack', state: 'Odisha', pinCode: '753001' },
  { name: 'Rourkela', state: 'Odisha', pinCode: '769001' },

  // Assam & Northeast
  { name: 'Guwahati', state: 'Assam', pinCode: '781001', popular: true },
  { name: 'Silchar', state: 'Assam', pinCode: '788001' },
  { name: 'Dibrugarh', state: 'Assam', pinCode: '786001' },

  // Goa & Others
  { name: 'Panaji', state: 'Goa', pinCode: '403001' },
  { name: 'Margao', state: 'Goa', pinCode: '403601' },
  { name: 'Jammu', state: 'Jammu & Kashmir', pinCode: '180001' },
  { name: 'Srinagar', state: 'Jammu & Kashmir', pinCode: '190001' },
];

interface SearchableCitySelectProps {
  value: string;
  onChange: (city: string, state?: string, pinCode?: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export const SearchableCitySelect: React.FC<SearchableCitySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select City Name',
  error,
  label = 'City',
  required = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filtered cities list (matches city name, state, or PIN code)
  const filteredCities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return POPULAR_INDIAN_CITIES;
    }
    return POPULAR_INDIAN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query) ||
        c.pinCode.includes(query)
    );
  }, [searchQuery]);

  // Top popular quick chips (8 major cities)
  const popularChips = useMemo(() => {
    return POPULAR_INDIAN_CITIES.filter((c) => c.popular).slice(0, 8);
  }, []);

  // Check if search query matches an existing city exactly
  const hasExactMatch = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return POPULAR_INDIAN_CITIES.some((c) => c.name.toLowerCase() === query);
  }, [searchQuery]);

  const handleSelect = (city: CityData) => {
    onChange(city.name, city.state, city.pinCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomCityAdd = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const formatted = trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    onChange(formatted);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '', '');
    setSearchQuery('');
  };

  return (
    <div className={`space-y-1 relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="font-bold text-slate-700 flex items-center justify-between text-xs"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {value && (
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Selected
            </span>
          )}
        </label>
      )}

      {/* Main Dropdown Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-white border rounded-xl text-left flex items-center justify-between transition text-xs shadow-2xs font-display ${
          isOpen
            ? 'border-navy-900 ring-2 ring-navy-900/10'
            : error
            ? 'border-rose-400 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin className={`w-4 h-4 shrink-0 ${value ? 'text-amber-600' : 'text-slate-400'}`} />
          {value ? (
            <div className="truncate">
              <span className="font-bold text-slate-900">{value}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              title="Clear City"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-navy-900' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu with Live Search */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 font-sans text-xs">
          {/* Search Box Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city name or PIN (e.g. Jaipur, 302001)..."
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Popular Cities Quick Chips (Shown when not searching) */}
            {!searchQuery && (
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Popular Metro Regions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularChips.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        value === c.name
                          ? 'bg-navy-950 text-gold-400 shadow-2xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[9px] opacity-60 font-mono">({c.pinCode})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cities List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => {
                const isSelected = value?.toLowerCase() === city.name.toLowerCase();
                return (
                  <button
                    key={`${city.name}-${city.state}-${city.pinCode}`}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-gold-50 text-navy-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-gold-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="font-bold text-xs">{city.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                          {city.state}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                        {city.pinCode}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-slate-500 text-xs">
                  No predefined city found matching <strong className="text-slate-900">"{searchQuery}"</strong>
                </p>
                <button
                  type="button"
                  onClick={handleCustomCityAdd}
                  className="px-4 py-2 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use "{searchQuery.trim()}" as my city</span>
                </button>
              </div>
            )}

            {/* Custom City prompt if query entered but doesn't exact match */}
            {searchQuery.trim() && !hasExactMatch && filteredCities.length > 0 && (
              <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                <button
                  type="button"
                  onClick={handleCustomCityAdd}
                  className="w-full px-3 py-1.5 text-left text-xs font-bold text-navy-900 hover:text-navy-950 flex items-center gap-1.5"
                >
                  <span className="text-gold-600 font-black">+</span>
                  <span>Select custom: <strong className="underline">"{searchQuery.trim()}"</strong></span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}
    </div>
  );
};
