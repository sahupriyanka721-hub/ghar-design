import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { apiRequest } from '../../lib/api.js';
import {
  MATERIAL_CATEGORIES_EXPANDED,
  INITIAL_MATERIALS_CATALOG,
  MaterialProductItem,
  MaterialProductVariant,
} from '../../data/materialsCatalog.js';
import { ProductDetailsModal } from '../../components/materials/ProductDetailsModal.js';
import { MaterialCheckoutModal, CheckoutItem } from '../../components/materials/MaterialCheckoutModal.js';
import { CustomerPurchaseAuthModal } from '../../components/materials/CustomerPurchaseAuthModal.js';
import { CustomerMaterialQuotesModal } from '../../components/materials/CustomerMaterialQuotesModal.js';
import {
  getApprovedVendorProductsForStore,
  saveVendorMaterialRequest,
  getVendorMaterialRequestsForCustomer,
  MaterialRequestItem,
} from '../../data/vendorStore.js';
import { registerNewCustomer } from '../../data/customerStore.js';
import {
  Package,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  Building,
  CheckCircle2,
  X,
  CreditCard,
  MapPin,
  Eye,
  Layers,
  Sparkles,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  Star,
  RefreshCw,
  HardHat,
  Flame,
  Award,
  ChevronDown,
  FileText,
} from 'lucide-react';

export const BuyMaterials: React.FC = () => {
  const { user, cart, addToCart, removeFromCart, updateCartQty, clearCart, cartCount, addresses } = useAuth();
  const location = useLocation();
  const isPublicView = location.pathname === '/materials' || location.pathname.startsWith('/materials');

  // Customer Purchase Auth Gate State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthItem, setPendingAuthItem] = useState<{
    product: MaterialProductItem;
    quantity: number;
    variant?: MaterialProductVariant;
  } | null>(null);
  const [pendingCartCheckout, setPendingCartCheckout] = useState(false);

  // Catalog State
  const [products, setProducts] = useState<MaterialProductItem[]>(INITIAL_MATERIALS_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'fastest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Delivery Location State
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Gurugram, DLF Phase 5');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');

  // Quantity selection per card: productId -> quantity
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedProductForModal, setSelectedProductForModal] = useState<MaterialProductItem | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [isBuyNowMode, setIsBuyNowMode] = useState(false);

  // Bulk Quote Modal
  const [bulkQuoteProduct, setBulkQuoteProduct] = useState<MaterialProductItem | null>(null);
  const [bulkQty, setBulkQty] = useState<number>(50);
  const [bulkLocation, setBulkLocation] = useState('Gurugram, Haryana');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // House Material Package BOQ Quote Modal (Point 8 in Master Workflow)
  const [isHouseQuoteModalOpen, setIsHouseQuoteModalOpen] = useState(false);
  const [houseAreaSqFt, setHouseAreaSqFt] = useState<number>(1200);
  const [cementBags, setCementBags] = useState<number>(250);
  const [sandCft, setSandCft] = useState<number>(500);
  const [gittiCft, setGittiCft] = useState<number>(400);
  const [tmtTonnes, setTmtTonnes] = useState<number>(2.0);
  const [bricksCount, setBricksCount] = useState<number>(12000);
  const [houseSiteCity, setHouseSiteCity] = useState<string>('Bhopal');
  const [houseSiteAddress, setHouseSiteAddress] = useState<string>('Kolar Road, Bhopal, MP');
  const [houseCustomerName, setHouseCustomerName] = useState<string>(user?.name || '');
  const [houseCustomerPhone, setHouseCustomerPhone] = useState<string>(user?.phone || '');
  const [houseCustomerPinCode, setHouseCustomerPinCode] = useState<string>('462001');
  const [houseQuoteSuccess, setHouseQuoteSuccess] = useState(false);

  useEffect(() => {
    if (user?.name && !houseCustomerName) setHouseCustomerName(user.name);
    if (user?.phone && !houseCustomerPhone) setHouseCustomerPhone(user.phone);
  }, [user]);

  // Customer Material Quotes & Bids Modal State
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);
  const [myBidsCount, setMyBidsCount] = useState<number>(0);

  useEffect(() => {
    const checkBids = () => {
      const bids = getVendorMaterialRequestsForCustomer(user?.phone || user?.id);
      setMyBidsCount(bids.length);
    };
    checkBids();
    const interval = setInterval(checkBids, 30000);
    window.addEventListener('storage', checkBids);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkBids);
    };
  }, [user?.phone, user?.id]);

  // Fetch from backend API if available, merging with rich initial catalog & approved vendor products
  useEffect(() => {
    setLoading(true);

    const loadVendorApproved = (): MaterialProductItem[] => {
      try {
        const vProds = getApprovedVendorProductsForStore();
        return vProds.map((vp) => ({
          id: vp.id,
          sku: vp.sku,
          name: vp.name,
          brand: vp.brand,
          category: vp.category || 'basic-construction',
          subcategory: 'Wholesale Depot Supply',
          specifications: vp.specifications,
          unit: vp.unit,
          originalPricePaise: vp.marketPricePaise,
          pricePaise: vp.pricePaise,
          inStock: vp.inStock,
          stockQuantity: vp.stockQuantity,
          minOrderQuantity: vp.minOrderQuantity,
          deliveryDays: vp.deliveryDays,
          imageUrl: vp.imageUrl,
          bulkQuoteEligible: true,
          manufacturer: vp.vendorName,
          hsnCode: 'HSN-6810',
          gstRatePercent: 18,
          returnEligible: true,
          codEligible: true,
          description: `${vp.specifications} - Supplied directly by verified vendor depot ${vp.vendorName}.`,
        }));
      } catch {
        return [];
      }
    };

    const vendorApproved = loadVendorApproved();

    apiRequest(`/customer/materials?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`)
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Merge API results with expanded rich data
          const apiMap = new Map((res.data || []).map((p: any) => [p.id, p]));
          const merged = INITIAL_MATERIALS_CATALOG.map((initItem) => {
            const apiMatch = apiMap.get(initItem.id);
            return apiMatch ? { ...initItem, ...apiMatch } : initItem;
          });
          setProducts([...vendorApproved, ...merged]);
        } else {
          setProducts([...vendorApproved, ...INITIAL_MATERIALS_CATALOG]);
        }
      })
      .catch(() => {
        // Fallback gracefully on static deployments
        setProducts([...vendorApproved, ...INITIAL_MATERIALS_CATALOG]);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  // Current category subcategories
  const currentCategoryObj = useMemo(() => {
    return MATERIAL_CATEGORIES_EXPANDED.find((c) => c.id === selectedCategory) || MATERIAL_CATEGORIES_EXPANDED[0];
  }, [selectedCategory]);

  // Available Brands List for Filter Dropdown
  const availableBrands = useMemo(() => {
    const brands = new Set(products.map((p) => p.brand).filter(Boolean));
    return ['all', ...Array.from(brands).sort()];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }
        // Subcategory filter
        if (selectedSubcategory !== 'All' && p.subcategory !== selectedSubcategory) {
          return false;
        }
        // Brand filter
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
          return false;
        }
        // Price range filter
        if (priceRange === 'under-1000' && p.pricePaise > 100000) return false;
        if (priceRange === '1000-10000' && (p.pricePaise < 100000 || p.pricePaise > 1000000)) return false;
        if (priceRange === '10000-50000' && (p.pricePaise < 1000000 || p.pricePaise > 5000000)) return false;
        if (priceRange === 'above-50000' && p.pricePaise < 5000000) return false;

        // In stock filter
        if (inStockOnly && !p.inStock) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchSpecs = p.specifications.toLowerCase().includes(q);
          const matchSubcat = p.subcategory.toLowerCase().includes(q);
          return matchName || matchBrand || matchSku || matchSpecs || matchSubcat;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.pricePaise - b.pricePaise;
        if (sortBy === 'price-desc') return b.pricePaise - a.pricePaise;
        if (sortBy === 'fastest') return a.deliveryDays - b.deliveryDays;
        return 0; // featured default
      });
  }, [products, selectedCategory, selectedSubcategory, selectedBrand, priceRange, inStockOnly, searchQuery, sortBy]);

  // Card quantity helpers
  const getCardQuantity = (product: MaterialProductItem) => {
    return cardQuantities[product.id] || 1;
  };

  const handleCardQtyChange = (product: MaterialProductItem, delta: number) => {
    const current = getCardQuantity(product);
    const max = product.maxOrderQuantity || 9999;
    const next = Math.max(1, Math.min(max, current + delta));
    setCardQuantities((prev) => ({ ...prev, [product.id]: next }));
  };

  // Add to cart from card
  const handleAddToCart = (product: MaterialProductItem, qtyOverride?: number, variant?: MaterialProductVariant) => {
    const qty = qtyOverride || getCardQuantity(product);
    addToCart(product as any, qty);

    // Trigger visual check animation
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // Direct "Buy Now" - Checks out ONLY this item without modifying or erasing cart
  const handleDirectBuyNow = (product: MaterialProductItem, qtyOverride?: number, variant?: MaterialProductVariant) => {
    const qty = qtyOverride || getCardQuantity(product);
    const unitPricePaise = product.pricePaise + (variant ? variant.priceModifierPaise : 0);

    const singleCheckoutItem: CheckoutItem = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      unit: product.unit,
      quantity: qty,
      unitPricePaise,
      imageUrl: product.imageUrl,
      variantName: variant?.name,
      gstRatePercent: product.gstRatePercent || 18,
    };

    setCheckoutItems([singleCheckoutItem]);
    setIsBuyNowMode(true);
    setIsCheckoutOpen(true);
  };

  // Helper: Execute Cart Checkout
  const executeCartCheckout = () => {
    const mappedItems: CheckoutItem[] = cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      brand: item.product.brand,
      unit: item.product.unit,
      quantity: item.quantity,
      unitPricePaise: item.product.pricePaise,
      imageUrl: item.product.imageUrl,
      gstRatePercent: 18,
    }));
    setCheckoutItems(mappedItems);
    setIsBuyNowMode(false);
    setCartDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  // Checkout from Cart Drawer with Customer Auth Check
  const handleProceedCartCheckout = () => {
    if (cart.length === 0) return;
    if (!user || user.role !== 'CUSTOMER') {
      setPendingCartCheckout(true);
      setCartDrawerOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    executeCartCheckout();
  };

  // Auth Success Callback: Resumes the intended purchase immediately!
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingAuthItem) {
      const item = pendingAuthItem;
      setPendingAuthItem(null);
      handleDirectBuyNow(item.product, item.quantity, item.variant);
    } else if (pendingCartCheckout) {
      setPendingCartCheckout(false);
      executeCartCheckout();
    }
  };

  // Cart calculations
  const cartSubtotalPaise = cart.reduce((sum, item) => sum + item.product.pricePaise * item.quantity, 0);
  const cartTaxPaise = Math.round(cartSubtotalPaise * 0.18);
  const cartDeliveryFeePaise = cart.length > 0 ? 150000 : 0; // ₹1,500 standard
  const cartGrandTotalPaise = cartSubtotalPaise + cartTaxPaise + cartDeliveryFeePaise;

  const handleBulkQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkQuoteProduct) return;
    
    // Save to vendor store so city vendors can immediately quote in their portal
    saveVendorMaterialRequest({
      customerName: user?.name || 'Registered Homeowner',
      customerPhone: user?.phone || '',
      customerEmail: user?.email || '',
      materialItem: `${bulkQuoteProduct.name} (${bulkQuoteProduct.brand})`,
      requiredQuantity: bulkQty,
      unit: bulkQuoteProduct.unit,
      deliverySiteAddress: bulkLocation,
      city: deliveryCity.split(',')[0].trim(),
      notes: bulkNotes,
    });

    try {
      await apiRequest('/customer/materials/bulk-quote', {
        method: 'POST',
        body: JSON.stringify({
          productId: bulkQuoteProduct.id,
          productName: bulkQuoteProduct.name,
          quantity: bulkQty,
          unit: bulkQuoteProduct.unit,
          deliveryLocation: bulkLocation,
          notes: bulkNotes,
        }),
      });
      setBulkSuccess(true);
    } catch {
      setBulkSuccess(true);
    }
  };

  const handleHouseAreaChange = (sqft: number) => {
    setHouseAreaSqFt(sqft);
    // Standard civil engineering thumb-rules for full house construction
    setCementBags(Math.round(sqft * 0.21)); // ~250 bags for 1200 sqft
    setSandCft(Math.round(sqft * 0.42)); // ~500 CFT
    setGittiCft(Math.round(sqft * 0.33)); // ~400 CFT
    setTmtTonnes(Number(((sqft * 1.67) / 1000).toFixed(1))); // ~2.0 Tonnes
    setBricksCount(Math.round(sqft * 10)); // ~12,000 bricks
  };

  const handleHouseMaterialQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = houseCustomerPhone.replace(/\D/g, '').slice(-10);
    const cleanPhone = rawDigits ? `+91 ${rawDigits}` : (user?.phone || '');
    const cleanName = houseCustomerName.trim() || user?.name || 'Registered Homeowner';

    const boqItems: MaterialRequestItem[] = [
      { id: 'item-cement', name: 'Cement (OPC/PPC Grade 53/43)', category: 'Cement', quantity: cementBags, unit: 'Bags (50kg)' },
      { id: 'item-sand', name: 'Sand (River Sand / Coarse M-Sand)', category: 'Sand', quantity: sandCft, unit: 'CFT' },
      { id: 'item-gitti', name: 'Gitti (10mm/20mm Coarse Aggregates)', category: 'Gitti', quantity: gittiCft, unit: 'CFT' },
      { id: 'item-steel', name: 'TMT Steel Rebar Fe550D', category: 'Steel', quantity: tmtTonnes, unit: 'Tonnes' },
      { id: 'item-bricks', name: 'Red Clay / AAC Bricks', category: 'Bricks', quantity: bricksCount, unit: 'Pcs' },
    ];

    saveVendorMaterialRequest({
      customerId: user?.id || `usr-cust-${Date.now()}`,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: user?.email || '',
      builtUpAreaSqFt: houseAreaSqFt,
      items: boqItems,
      materialItem: `Complete House Civil BOQ (${houseAreaSqFt} sq.ft Package)`,
      requiredQuantity: 1,
      unit: 'House BOQ Package',
      deliverySiteAddress: houseSiteAddress,
      city: houseSiteCity,
      pinCode: houseCustomerPinCode,
      notes: `Built-up area: ${houseAreaSqFt} sq.ft. Multi-vendor competitive quotes requested for factory-direct dispatch with unloading at site.`,
    });
    setHouseQuoteSuccess(true);
    setMyBidsCount((prev) => prev + 1);
  };

  return (
    <div className={isPublicView ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 font-sans" : "space-y-6 pb-16 font-sans"}>
      {/* Breadcrumbs Navigation */}
      {isPublicView ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-navy-950 transition">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">Civil & Contractorure Supplies</span>
            <span className="text-slate-300">/</span>
            <span className="text-navy-950 font-bold">Factory-Direct Building Materials</span>
          </div>

          <div className="flex items-center gap-2.5">
            {!user ? (
              <>
                <Link to="/login?role=customer" className="text-navy-950 hover:underline font-bold">
                  Customer Sign In
                </Link>
                <span className="text-slate-300">•</span>
                <Link to="/signup" className="text-gold-700 hover:underline font-bold">
                  Register Profile
                </Link>
              </>
            ) : (
              <Link to="/dashboard/materials" className="text-navy-950 hover:underline font-bold flex items-center gap-1.5">
                <span>Customer Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <Link to="/dashboard" className="hover:text-navy-950 transition">Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Material Management</span>
          <span className="text-slate-300">/</span>
          <span className="text-navy-950 font-bold">Buy Materials</span>
        </div>
      )}

      {/* Top Banner & Location Bar */}
      <div className="bg-gradient-to-br from-[#e8f3fe] via-[#f1f7fe] to-[#e4f0fc] rounded-3xl p-6 sm:p-8 border border-blue-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-200/80 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                GharDesign Direct Procurement
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                100% Factory Certified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-navy-950">
              Buy Construction & <span className="text-blue-700">Engineering Materials</span>
            </h1>

            <p className="text-slate-600 font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
              Wholesale factory prices on cement, structural steel rebar, AAC blocks, vitrified tiles, CPVC pipes & designer fixtures. Direct hydraulic transit delivery to your project site.
            </p>
          </div>

          {/* Delivery Location & Cart Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Location Selector */}
            <button
              onClick={() => setShowPincodeModal(true)}
              className="bg-navy-900/90 hover:bg-navy-800 border border-navy-700/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 transition text-left group"
            >
              <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site Delivery</div>
                <div className="text-xs font-bold text-white group-hover:text-gold-400 transition flex items-center gap-1">
                  <span>{deliveryCity} ({deliveryPincode})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </button>

            {/* House BOQ Material Quote Trigger */}
            <button
              onClick={() => {
                setHouseQuoteSuccess(false);
                setIsHouseQuoteModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-navy-950 font-bold rounded-2xl flex items-center gap-2 transition shadow-md shadow-amber-500/20 text-xs font-display"
            >
              <HardHat className="w-4 h-4 text-navy-950" />
              <span>Get House Material Quote</span>
            </button>

            {/* View Submitted Material Bids & Quotes */}
            <button
              onClick={() => setIsQuotesModalOpen(true)}
              className="px-4 py-2.5 bg-navy-900/90 hover:bg-navy-800 text-gold-400 hover:text-white border border-gold-500/40 font-bold rounded-2xl flex items-center gap-2 transition shadow-md text-xs font-display relative"
            >
              <FileText className="w-4 h-4 text-gold-400" />
              <span>My Material Bids</span>
              {myBidsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 font-black text-[10px] flex items-center justify-center">
                  {myBidsCount}
                </span>
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative px-5 py-3 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold rounded-2xl flex items-center gap-2.5 transition shadow-lg shadow-gold-500/20 font-display"
            >
              <ShoppingCart className="w-4 h-4 text-navy-950" />
              <span className="text-xs font-black">Procurement Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-navy-950 text-gold-400 text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-blue-200/80 text-xs sm:text-sm font-semibold text-black">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-navy-950 shrink-0" />
            <span className="text-black font-semibold">Hydraulic Crane Unloading</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-navy-950 shrink-0" />
            <span className="text-black font-semibold">BIS / IS Quality Assured</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-navy-950 shrink-0" />
            <span className="text-black font-semibold">GST Input Tax Credit (ITC)</span>
          </div>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-navy-950 shrink-0" />
            <span className="text-black font-semibold">Engineer Verified Batches</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Category Pills */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-5">
        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cement, Tata Tiscon steel, vitrified tiles, Havells wires, Astral pipes, SKU..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-navy-900 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-navy-900"
            >
              <option value="all">All Brands</option>
              {availableBrands.filter((b) => b !== 'all').map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-navy-900"
            >
              <option value="all">All Price Ranges</option>
              <option value="under-1000">Under ₹1,000</option>
              <option value="1000-10000">₹1,000 - ₹10,000</option>
              <option value="10000-50000">₹10,000 - ₹50,000</option>
              <option value="above-50000">Above ₹50,000</option>
            </select>

            {/* In-stock toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-navy-900 focus:ring-navy-900"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-navy-900"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="fastest">Fastest Delivery</option>
              </select>
            </div>

            {/* Reset Filter Button if active */}
            {(selectedBrand !== 'all' || priceRange !== 'all' || inStockOnly || searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('All');
                  setSelectedBrand('all');
                  setPriceRange('all');
                  setInStockOnly(false);
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 10 Major Categories Horizontal Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Product Categories (10 Master Departments)</span>
            <span>{filteredProducts.length} items available</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {MATERIAL_CATEGORIES_EXPANDED.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory('All');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border shrink-0 ${
                    isSelected
                      ? 'bg-navy-950 text-gold-400 border-navy-950 shadow-md shadow-navy-950/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.code !== 'ALL' && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-gold-500/20 text-gold-300' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cat.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Filter Pills */}
        {currentCategoryObj.subcategories.length > 0 && selectedCategory !== 'all' && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Subcategory:
            </span>
            <button
              onClick={() => setSelectedSubcategory('All')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                selectedSubcategory === 'All'
                  ? 'bg-gold-500 text-navy-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All {currentCategoryObj.name}
            </button>
            {(currentCategoryObj.subcategories || []).map((subcat) => (
              <button
                key={subcat}
                onClick={() => setSelectedSubcategory(subcat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedSubcategory === subcat
                    ? 'bg-gold-500 text-navy-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Listing Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-display font-bold text-slate-800">No matching materials found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, clearing your subcategory filter, or checking other departments.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('All');
              setSearchQuery('');
              setInStockOnly(false);
            }}
            className="px-4 py-2 bg-navy-950 text-gold-400 font-bold text-xs rounded-xl hover:bg-navy-900 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const cardQty = getCardQuantity(product);
            const discountPercent =
              product.originalPricePaise > product.pricePaise
                ? Math.round(((product.originalPricePaise - product.pricePaise) / product.originalPricePaise) * 100)
                : 0;

            const isJustAdded = addedAnimation[product.id];

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setSelectedProductForModal(product)}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Brand & Stock Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="px-2.5 py-1 bg-navy-950/90 backdrop-blur-xs text-gold-400 font-display font-black text-[10px] rounded-lg tracking-wider uppercase border border-gold-500/30">
                      {product.brand}
                    </span>
                    {discountPercent > 0 && (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-md tracking-tight shadow-xs">
                        SAVE {discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs ${
                        product.inStock
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-rose-500/90 text-white'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900/80 text-slate-200 text-[9px] font-semibold rounded-md backdrop-blur-xs flex items-center gap-1">
                      <Truck className="w-3 h-3 text-gold-400" />
                      {product.deliveryDays}d Site Drop
                    </span>
                  </div>

                  {/* Quick View Overlay on hover */}
                  <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1.5 bg-white/95 text-navy-950 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-gold-600" />
                      View Technical Specs
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>SKU: {product.sku}</span>
                      <span>HSN: {product.hsnCode}</span>
                    </div>

                    <h3
                      onClick={() => setSelectedProductForModal(product)}
                      className="text-sm font-display font-bold text-navy-950 hover:text-gold-600 cursor-pointer line-clamp-2 transition leading-snug"
                    >
                      {product.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {product.specifications}
                    </p>

                    {/* Minimum Order Info */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        MOQ: {product.minOrderQuantity || 1} {product.unit}
                      </span>
                      {product.materialGrade && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                          {product.materialGrade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-display font-black text-navy-950">
                            ₹{(product.pricePaise / 100).toLocaleString('en-IN')}
                          </span>
                          {product.originalPricePaise > product.pricePaise && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{(product.originalPricePaise / 100).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          per {product.unit} • Incl. 18% GST
                        </div>
                      </div>

                      {/* Quantity Selector on Card */}
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleCardQtyChange(product, -1)}
                          disabled={cardQty <= 1}
                          title={cardQty <= 1 ? 'Minimum order is 1 unit' : 'Decrease quantity'}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={product.maxOrderQuantity || 9999}
                          value={cardQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              setCardQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.min(product.maxOrderQuantity || 9999, val),
                              }));
                            } else if (e.target.value === '') {
                              setCardQuantities((prev) => ({ ...prev, [product.id]: 1 }));
                            }
                          }}
                          className="w-9 text-center text-xs font-bold text-slate-900 font-mono bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCardQtyChange(product, 1)}
                          title="Increase quantity"
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 active:scale-90 flex items-center justify-center transition shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Dual Action Buttons: Add to Cart & Buy Now */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 disabled:opacity-50'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          // First show complete project & technical specifications information
                          setSelectedProductForModal(product);
                        }}
                        disabled={!product.inStock}
                        className="py-2 px-2 bg-navy-950 hover:bg-gold-500 hover:text-navy-950 text-gold-400 text-xs font-bold rounded-xl flex items-center justify-center transition shadow-xs disabled:opacity-50 font-display"
                      >
                        <span>Buy Now</span>
                      </button>
                    </div>

                    {/* Bulk Inquiry Link */}
                    {product.bulkQuoteEligible && (
                      <button
                        onClick={() => {
                          setBulkQuoteProduct(product);
                          setBulkQty(product.minOrderQuantity * 5 || 100);
                          setBulkSuccess(false);
                        }}
                        className="w-full text-center text-[10px] font-bold text-gold-600 hover:text-gold-700 underline tracking-wide pt-1"
                      >
                        Need 10+ truckloads? Request Custom Bulk Quote →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Catalog Footer Info & Product Count */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Showing <strong className="text-navy-950 font-bold">{filteredProducts.length}</strong> of <strong className="text-navy-950 font-bold">{products.length}</strong> verified construction materials
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Direct Hydraulic Offloading: <strong className="text-emerald-700">Available at Site</strong></span>
            <span>•</span>
            <span>Need Custom Quantity? Call: <strong className="text-navy-950 font-bold">1800-419-GHAR</strong></span>
          </div>
        </div>
      </>
    )}

      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-navy-950 text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gold-400" />
                <h3 className="font-display font-black text-base text-white">
                  Procurement Cart ({cartCount} Items)
                </h3>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-semibold text-sm text-slate-700">Your materials cart is empty</p>
                  <p className="text-xs">Browse cement, steel, or tiles and add them to your site order.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-navy-950 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-500">
                        ₹{(item.product.pricePaise / 100).toLocaleString('en-IN')} / {item.product.unit}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 bg-white text-slate-700 rounded flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="w-5 h-5 bg-white text-slate-700 rounded flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-display font-black text-xs text-navy-950">
                            ₹{((item.product.pricePaise * item.quantity) / 100).toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer Summary */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3 text-xs">
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">₹{(cartSubtotalPaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% ITC Eligible):</span>
                    <span className="font-mono">₹{(cartTaxPaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Site Transit & Offloading:</span>
                    <span className="font-mono">₹{(cartDeliveryFeePaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center font-display font-black text-base text-navy-950 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-gold-600 font-mono">
                      ₹{(cartGrandTotalPaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedCartCheckout}
                  className="w-full py-3.5 bg-navy-950 hover:bg-gold-500 hover:text-navy-950 text-gold-400 font-display font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <span>Proceed to Site Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductForModal && (
        <ProductDetailsModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={(prod, qty, variant) => {
            handleAddToCart(prod, qty, variant);
            setSelectedProductForModal(null);
          }}
          onBuyNow={(prod, qty, variant) => {
            if (!user || user.role !== 'CUSTOMER') {
              setPendingAuthItem({ product: prod, quantity: qty, variant });
              setSelectedProductForModal(null);
              setIsAuthModalOpen(true);
              return;
            }
            setSelectedProductForModal(null);
            handleDirectBuyNow(prod, qty, variant);
          }}
        />
      )}

      {/* Customer Purchase Auth Modal (Register or Mobile Login Gate) */}
      <CustomerPurchaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAuthItem(null);
          setPendingCartCheckout(false);
        }}
        pendingItem={pendingAuthItem}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Multi-step Checkout Modal */}
      <MaterialCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        isBuyNow={isBuyNowMode}
        onOrderSuccess={(placedOrder) => {
          // Modal stays open on SUCCESS step so user sees order code and can print invoice or view status
        }}
      />

      {/* Delivery PIN Code Selector Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <div className="font-display font-black text-base text-navy-950">Select Site Delivery Location</div>
              <button onClick={() => setShowPincodeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your project site PIN code to verify transit truck clearance and direct hydraulic offloading availability.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Project Site PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder=""
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:border-navy-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPincodeModal(false)}
                className="py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pincodeInput.length === 6) {
                    setDeliveryPincode(pincodeInput);
                    if (pincodeInput.startsWith('122') || pincodeInput.startsWith('121')) {
                      setDeliveryCity('Gurugram / NCR');
                    } else if (pincodeInput.startsWith('110')) {
                      setDeliveryCity('Delhi NCR');
                    } else if (pincodeInput.startsWith('201')) {
                      setDeliveryCity('Noida / Greater Noida');
                    } else {
                      setDeliveryCity('NCR Project Hub');
                    }
                  }
                  setShowPincodeModal(false);
                }}
                className="py-2.5 bg-navy-950 text-gold-400 font-bold rounded-xl text-xs hover:bg-gold-500 hover:text-navy-950 transition"
              >
                Update PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Truckload Inquiry Modal */}
      {bulkQuoteProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">
                  Bulk Procurement Desk
                </span>
                <h3 className="font-display font-black text-lg text-navy-950 mt-0.5">
                  High-Volume Truckload Request
                </h3>
              </div>
              <button onClick={() => setBulkQuoteProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Bulk Inquiry Registered!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Our direct factory procurement specialist will contact you with wholesale multi-axle freight pricing within 2 business hours.
                </p>
                <button
                  onClick={() => setBulkQuoteProduct(null)}
                  className="mt-2 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBulkQuoteSubmit} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">{bulkQuoteProduct.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Brand: {bulkQuoteProduct.brand} • Unit: {bulkQuoteProduct.unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Requested Quantity ({bulkQuoteProduct.unit})</label>
                    <input
                      type="number"
                      min={bulkQuoteProduct.minOrderQuantity || 1}
                      value={bulkQty}
                      onChange={(e) => setBulkQty(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Site Delivery Area</label>
                    <input
                      type="text"
                      value={bulkLocation}
                      onChange={(e) => setBulkLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Additional Project Specifications / Notes</label>
                  <textarea
                    rows={3}
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBulkQuoteProduct(null)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-navy-950 text-gold-400 font-display font-black rounded-xl hover:bg-gold-500 hover:text-navy-950 transition"
                  >
                    Submit Bulk Quote Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* House Material Package BOQ Quote Modal (Point 8 in Master Workflow) */}
      {isHouseQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display text-navy-950">
                    Get House Material Quote
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Multi-vendor competitive procurement for full civil construction
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHouseQuoteModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {houseQuoteSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base text-emerald-900 font-display">
                  Material Request Sent to City Vendors!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
                  Aapki <strong>{houseAreaSqFt} sq.ft. house</strong> ki material requirement (Cement, Sand, Gitti, Steel, Bricks) <strong>{houseSiteCity}</strong> ke verified wholesale vendors ke portal par dispatch kar di gayi hai.
                </p>
                <div className="p-3 bg-white/80 rounded-xl text-left text-xs font-mono space-y-1 text-slate-700 border border-emerald-200">
                  <div>• Cement: {cementBags} Bags</div>
                  <div>• Sand: {sandCft} CFT</div>
                  <div>• Gitti: {gittiCft} CFT</div>
                  <div>• TMT Steel: {tmtTonnes} Tonnes</div>
                  <div>• Bricks: {bricksCount.toLocaleString()} Pcs</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsHouseQuoteModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      setIsHouseQuoteModalOpen(false);
                      setIsQuotesModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-navy-950 hover:bg-navy-900 text-gold-400 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Vendor Quotes</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleHouseMaterialQuoteSubmit} className="space-y-4 text-xs">
                {/* Area Input & Recalculate */}
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      <span>House Construction / Built-up Area (sq.ft)</span>
                    </label>
                    <span className="font-mono font-black text-amber-900 text-sm">
                      {houseAreaSqFt} sq.ft
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={50}
                    value={houseAreaSqFt}
                    onChange={(e) => handleHouseAreaChange(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-amber-700 font-bold">
                    <span>500 sq.ft</span>
                    <span>1,200 sq.ft</span>
                    <span>2,500 sq.ft</span>
                    <span>5,000 sq.ft</span>
                  </div>
                </div>

                {/* Auto Calculated Material Items */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Estimated Bill of Quantities (BOQ Items):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Cement Bags</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{cementBags} Bags (50kg)</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Sand (River / M-Sand)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{sandCft} CFT</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Gitti / Coarse Aggregates</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{gittiCft} CFT</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">TMT Steel Fe550D</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{tmtTonnes} Tonnes</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl col-span-2">
                      <span className="text-slate-400 block text-[10px]">Red Clay / AAC Bricks</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{bricksCount.toLocaleString()} Pcs</span>
                    </div>
                  </div>
                </div>

                {/* Customer Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={houseCustomerName}
                      onChange={(e) => setHouseCustomerName(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-950"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-navy-950 block mb-1">Mobile Number (10 Digits) *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-mono text-xs">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={houseCustomerPhone.replace(/\D/g, '').slice(-10)}
                        onChange={(e) => setHouseCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder=""
                        className="w-full px-3 py-2 border border-slate-300 rounded-r-xl font-mono bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-950"
                      />
                    </div>
                  </div>
                </div>

                {/* City Selection (Point 7 & 8) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select Project City</label>
                    <select
                      value={houseSiteCity}
                      onChange={(e) => setHouseSiteCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-950"
                    >
                      <option value="Bhopal">Bhopal (MP)</option>
                      <option value="Gurugram">Gurugram (NCR)</option>
                      <option value="Delhi">Delhi (NCR)</option>
                      <option value="Jaipur">Jaipur (Rajasthan)</option>
                      <option value="Indore">Indore (MP)</option>
                      <option value="Lucknow">Lucknow (UP)</option>
                      <option value="Mumbai">Mumbai (Maharashtra)</option>
                      <option value="Pune">Pune (Maharashtra)</option>
                      <option value="Bengaluru">Bengaluru (Karnataka)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Site Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={houseSiteAddress}
                      onChange={(e) => setHouseSiteAddress(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-950"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHouseQuoteModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-navy-950 to-navy-900 text-gold-400 font-display font-black rounded-xl hover:from-amber-600 hover:to-amber-700 hover:text-white transition shadow-md"
                  >
                    Send to City Vendors
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Customer Material Quotes & Bids Modal */}
      <CustomerMaterialQuotesModal
        isOpen={isQuotesModalOpen}
        onClose={() => setIsQuotesModalOpen(false)}
        customerPhone={user?.phone}
        customerId={user?.id}
        customerName={user?.name}
      />
    </div>
  );
};
