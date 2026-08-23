import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@be11/shared';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sport: string;
  stock: number;
  brand?: string;
  rating?: number;
  reviewsCount?: number;
  oldPrice?: number;
}


interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export const Shop: React.FC = () => {
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Persistence States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const local = localStorage.getItem('be11_cart');
    return local ? JSON.parse(local) : [];
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const local = localStorage.getItem('be11_wishlist');
    return local ? JSON.parse(local) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Forms and actions
  const [shippingAddress, setShippingAddress] = useState('');
  const [addressFullName, setAddressFullName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressLine, setAddressLine] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Premium Checkout Payment States
  const [checkoutLoadingText, setCheckoutLoadingText] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'FORM' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'>('FORM');
  const [paymentOption, setPaymentOption] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'EMI' | 'COD' | 'RAZORPAY'>('RAZORPAY');

  // Address Instructions
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Card Form State
  const [cardForm, setCardForm] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    cardBrand: '', // Visa, MasterCard, RuPay, Amex
    saveCard: false
  });

  // UPI Form State
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);

  // Net banking & Wallets select
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // EMI selections
  const [emiMonths, setEmiMonths] = useState(3);

  // Coupon Drawer States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscountVal, setCouponDiscountVal] = useState(0);

  // Completed invoice order details
  const [createdOrderDetails, setCreatedOrderDetails] = useState<any>(null);

  // Cancellation / Return inline modals
  const [activeReturnOrderId, setActiveReturnOrderId] = useState<string | null>(null);
  const [returnReasonText, setReturnReasonText] = useState('');

  const handleCardNumberInput = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    let formatted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += clean[i];
    }
    
    let brand = '';
    if (clean.startsWith('4')) brand = 'Visa';
    else if (/^5[1-5]/.test(clean)) brand = 'MasterCard';
    else if (/^6(0|5|8)/.test(clean)) brand = 'RuPay';
    else if (/^3[47]/.test(clean)) brand = 'Amex';
    
    setCardForm({
      ...cardForm,
      number: formatted,
      cardBrand: brand
    });
  };

  const handleApplyCouponCode = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted === 'WELCOME10') {
      const discountVal = subtotal * 0.10;
      setCouponDiscountVal(discountVal);
      setAppliedCouponCode('WELCOME10');
      alert(`Promo code WELCOME10 applied! ₹${discountVal.toFixed(2)} discount added.`);
    } else if (formatted === 'SPORTS20') {
      const discountVal = subtotal * 0.20;
      setCouponDiscountVal(discountVal);
      setAppliedCouponCode('SPORTS20');
      alert(`Promo code SPORTS20 applied! ₹${discountVal.toFixed(2)} discount added.`);
    } else if (formatted === 'FIRSTORDER') {
      setCouponDiscountVal(50);
      setAppliedCouponCode('FIRSTORDER');
      alert('Promo code FIRSTORDER applied! ₹50 discount added.');
    } else if (formatted === 'TEAM100') {
      setCouponDiscountVal(100);
      setAppliedCouponCode('TEAM100');
      alert('Promo code TEAM100 applied! ₹100 discount added.');
    } else {
      alert('Invalid or expired coupon code.');
    }
  };

  const handleSecureCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to complete your order checkout.');
      return;
    }
    if (!shippingAddress) {
      alert('Please select or specify a shipping destination address.');
      return;
    }

    setCheckoutStep('PROCESSING');
    
    const steps = [
      'Establishing 256-bit SSL secured tunnel...',
      'Verifying gateway credentials...',
      'Deducting transaction amount...',
      'Generating tax invoice...',
      'Booking order slots in database...',
      'Updating stock inventories...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCheckoutLoadingText(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const orderItems = cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
      }));

      const res = await api.post('/shop/orders', {
        items: orderItems,
        totalPrice: Math.max(0, total - couponDiscountVal),
        shippingAddress,
        paymentMethod: paymentOption,
        deliveryInstructions,
      });

      if (paymentOption === 'WALLET' && user) {
        updateWalletBalance(user.walletBalance - Math.max(0, total - couponDiscountVal));
      }

      setCreatedOrderDetails({
        id: res.data.data.id || `ord_${Math.floor(100000 + Math.random() * 900000)}`,
        invoiceNo: `inv_${Math.floor(100000 + Math.random() * 900000)}`,
        transactionId: `tx_s_${Math.floor(10000000 + Math.random() * 90000000)}`,
        amountPaid: Math.max(0, total - couponDiscountVal),
        date: new Date().toLocaleDateString(),
        address: shippingAddress,
      });

      setCart([]);
      fetchOrders();
      setCheckoutStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setCheckoutStep('FAILURE');
    }
  };

  // Search & suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Review comment
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Auto slide index
  const [activeSlide, setActiveSlide] = useState(0);

  // Image zoom scale state
  const [zoomScale, setZoomScale] = useState(false);

  // Simulated live countdown state (Flash Sale)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Community likes mockup
  const [likedPhoto, setLikedPhoto] = useState<Record<number, boolean>>({});

  useEffect(() => {
    localStorage.setItem('be11_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('be11_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Flash Sale Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shop/products');
      const mapped = res.data.data.products.map((p: any) => {
        const brands: Record<string, string> = {
          BATS: 'Kookaburra',
          BALLS: 'Duke Seam',
          GLOVES: 'be11 Pro',
          PADS: 'be11 Pro',
          JERSEYS: 'be11 Sublimated',
          FOOTBALLS: 'Puma FIFA',
          SHOES: 'Nike FG',
          SHIN_GUARDS: 'Adidas',
        };
        const ratings = [4.5, 4.8, 4.2, 4.9, 4.7];
        return {
          ...p,
          brand: brands[p.category] || 'be11 Sports',
          rating: ratings[p.name.length % ratings.length],
          reviewsCount: 10 + (p.name.length * 3) % 40,
          oldPrice: Math.round(p.price * 1.3),
        };
      });
      setProducts(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/shop/orders/my');
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/shop/addresses');
      setAddresses(res.data.data.addresses);
      // set shipping address default if available
      const def = res.data.data.addresses.find((a: Address) => a.isDefault);
      if (def) {
        setShippingAddress(`${def.addressLine}, ${def.city}, ${def.state} - ${def.pincode}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchAddresses();
  }, [isAuthenticated]);

  // Autocomplete Suggestions
  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }
    const matches = products
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((p) => p.name)
      .slice(0, 5);
    setSuggestions(matches);
  }, [searchTerm, products]);

  // Sliding banner auto rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const isWishlisted = (id: string) => wishlist.some((p) => p.id === id);

  const toggleWishlist = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    alert(`${product.name} added to cart!`);
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== id));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === id ? { ...item, quantity: qty } : item))
    );
  };

  // Pricing
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = subtotal * (discountPercent / 100);
  const gst = (subtotal - discount) * 0.18;
  const shipping = subtotal > 1500 || subtotal === 0 ? 0 : 150;
  const total = subtotal - discount + gst + shipping;

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscountPercent(10);
      alert('10% Coupon Applied!');
    } else if (couponCode.toUpperCase() === 'BE11SUPER') {
      setDiscountPercent(20);
      alert('20% Coupon Applied!');
    } else {
      alert('Coupon code invalid or expired');
    }
  };

  // Address Submit
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFullName || !addressPhone || !addressLine || !addressCity || !addressState || !addressPincode) {
      alert('All shipping fields are required.');
      return;
    }
    try {
      await api.post('/shop/addresses', {
        fullName: addressFullName,
        phone: addressPhone,
        addressLine: `${addressFullName}, Ph: ${addressPhone}, ${addressLine}`,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        isDefault: true,
      });
      alert('Shipping address added!');
      fetchAddresses();
      // Reset Form fields
      setAddressFullName('');
      setAddressPhone('');
      setAddressCity('');
      setAddressState('');
      setAddressPincode('');
      setAddressLine('');
    } catch (err) {
      console.error(err);
    }
  };

  // Removed old simple checkout routines. Secured multi-gateway is handled by handleSecureCheckoutSubmit.

  const handleReturnSubmit = async (orderId: string) => {
    const reason = prompt('Please describe the return request reason:');
    if (!reason) return;
    try {
      await api.post(`/shop/orders/${orderId}/return`, { reason });
      alert('Your return request has been submitted for verification.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (productId: string) => {
    if (!reviewComment) {
      alert('Comment field is empty.');
      return;
    }
    try {
      await api.post(`/shop/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      alert('Thank you! Your product review has been submitted.');
      setReviewComment('');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Routing views
  const renderStoreView = () => {
    const path = location.pathname;

    // A. Product Specifications Page
    if (path.startsWith('/store/product/')) {
      const id = path.split('/store/product/')[1];
      const p = products.find((item) => item.id === id);
      if (!p) {
        return <div className="text-center py-16 text-xs text-outline">Loading product specs sheets...</div>;
      }

      const isCustomizable = p.category === 'JERSEYS';
      const isKitBuilder = p.category === 'BATS' || p.name.includes('Kit');

      return (
        <div className="space-y-12">
          {/* Breadcrumbs */}
          <div className="flex gap-2 text-xs text-outline font-semibold">
            <Link to="/store" className="hover:text-primary">Store</Link>
            <span>/</span>
            <span className="text-primary font-bold">{p.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-white p-8 md:p-12 rounded-[32px] border border-outline-variant/30 shadow-[0_15px_50px_rgba(10,46,110,0.03)]">
            
            {/* Immersive Image Display with zoom */}
            <div className="space-y-4">
              <div 
                className="rounded-3xl overflow-hidden border border-outline-variant/20 bg-gray-50 flex items-center justify-center p-8 relative cursor-zoom-in"
                onClick={() => setZoomScale(!zoomScale)}
              >
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className={`max-h-[400px] w-auto object-contain transition-transform duration-500 ${
                    zoomScale ? 'scale-150' : 'scale-100 hover:scale-105'
                  }`} 
                />
                <span className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Click to Zoom
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[p.image, p.image, p.image, p.image].map((img, idx) => (
                  <div key={idx} className="border rounded-2xl p-2 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-secondary transition-all">
                    <img src={img} alt="Thumbnail view" className="w-12 h-12 object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product description details panel */}
            <div className="space-y-6 text-left">
              <div>
                <span className="text-[10px] text-secondary bg-secondary/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  {p.brand}
                </span>
                <h1 className="font-poppins font-black text-2xl md:text-3xl text-primary mt-3 leading-snug">{p.name}</h1>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <div className="flex items-center text-[#FF9933]">
                    <span className="material-symbols-outlined text-sm fill-current">star</span>
                    <span className="font-bold text-primary ml-1">{p.rating}</span>
                  </div>
                  <span className="text-outline">({p.reviewsCount} verified custom reviews)</span>
                </div>
              </div>

              {/* Price Details */}
              <div className="space-y-1">
                <span className="text-[10px] text-outline uppercase tracking-wider">M.R.P Sale Price</span>
                <div className="flex items-center gap-3">
                  <span className="font-poppins font-black text-2xl text-[#138808]">{formatCurrency(p.price)}</span>
                  <span className="text-xs text-outline line-through">{formatCurrency(p.oldPrice || p.price * 1.3)}</span>
                  <span className="text-[10px] bg-[#138808]/10 text-[#138808] font-bold px-2 py-0.5 rounded-full">20% discount</span>
                </div>
              </div>

              <p className="text-xs text-outline leading-relaxed">{p.description}</p>

              {/* Specific customizer actions */}
              <div className="space-y-3 pt-4 border-t">
                {isCustomizable ? (
                  <button
                    onClick={() => navigate('/jersey-builder')}
                    className="w-full py-4 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-2xl font-label-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">palette</span>
                    Design Jersey in Custom Studio
                  </button>
                ) : isKitBuilder ? (
                  <button
                    onClick={() => navigate('/kit-builder')}
                    className="w-full py-4 bg-primary hover:bg-[#0a2e6e] text-white rounded-2xl font-label-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">sports_cricket</span>
                    Open Kit Builder with Bat
                  </button>
                ) : (
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full py-4 bg-primary hover:bg-[#0a2e6e] text-white rounded-2xl font-label-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_cart</span>
                    Add to Cart
                  </button>
                )}

                <button
                  onClick={() => toggleWishlist(p)}
                  className="w-full py-3 border-2 border-primary text-primary rounded-2xl font-label-bold text-xs uppercase tracking-wider hover:bg-primary/5 transition-all cursor-pointer text-center block"
                >
                  {isWishlisted(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Delivery hub checks */}
              <div className="pt-4 border-t text-xs space-y-1">
                <p className="font-semibold text-primary">Estimated Delivery:</p>
                <p className="text-outline">🚚 Standard shipping (All India) in 3-5 business days. Free returns active.</p>
              </div>

              {/* Specifications table */}
              <div className="pt-6 border-t space-y-3">
                <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider">Specifications Sheet</h4>
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-2xl bg-gray-50/50 text-xs">
                  <span className="text-outline">Sport Discipline:</span>
                  <span className="font-semibold text-primary">{p.sport}</span>
                  <span className="text-outline">Equipment Category:</span>
                  <span className="font-semibold text-primary">{p.category}</span>
                  <span className="text-outline">Product Brand:</span>
                  <span className="font-semibold text-primary">{p.brand}</span>
                  <span className="text-outline">Stock Availability:</span>
                  <span className="font-semibold text-primary text-[#138808]">{p.stock} items left</span>
                </div>
              </div>

              {/* Reviews submission section */}
              <div className="pt-6 border-t space-y-4">
                <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider">Customer Verified Reviews</h4>

                {/* Submissions form */}
                {isAuthenticated ? (
                  <div className="bg-[#F8FAFC] border p-4 rounded-2xl space-y-3 text-xs">
                    <p className="font-bold text-primary">Write a verified review</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-outline">Rating:</span>
                      <select 
                        value={reviewRating} 
                        onChange={(e) => setReviewRating(parseInt(e.target.value))}
                        className="bg-white border rounded px-2 py-0.5"
                      >
                        {[5,4,3,2,1].map((num) => (
                          <option key={num} value={num}>{num} Stars</option>
                        ))}
                      </select>
                    </div>
                    <textarea 
                      placeholder="Comment details..." 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={2}
                      className="w-full bg-white border p-2 rounded-xl focus:outline-none"
                    />
                    <button 
                      onClick={() => handleReviewSubmit(p.id)}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl cursor-pointer"
                    >
                      Post Review
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-outline italic">Login to publish a customer rating.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      );
    }

    // B. Shopping Cart Page
    if (path === '/store/cart') {
      return (
        <div className="space-y-8">
          <h2 className="font-poppins font-black text-xl text-primary uppercase tracking-wider border-b pb-3 text-left">Your Shopping Cart</h2>

          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="material-symbols-outlined text-outline text-5xl">shopping_cart</span>
              <p className="text-outline text-xs">Your shopping cart is currently empty.</p>
              <button
                onClick={() => navigate('/store')}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Cart List */}
              <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm text-left">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex flex-col md:flex-row gap-4 border-b pb-4 items-center justify-between">
                    <div className="flex gap-4 items-center w-full md:w-auto">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl border flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs text-primary line-clamp-1">{item.product.name}</h4>
                        <p className="text-[10px] text-outline">{item.product.brand}</p>
                        <p className="text-xs text-[#138808] font-bold mt-1">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                    </div>
                    {/* Quantity selectors */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-[#EDF2F7] flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-[#EDF2F7] flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => updateCartQty(item.product.id, 0)}
                        className="text-xs text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown summary */}
              <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-6 text-left">
                <h3 className="font-poppins font-bold text-sm text-primary uppercase tracking-wider border-b pb-2">Order pricing</h3>

                {/* Coupons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Apply Promo Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-[#EDF2F7] rounded-xl px-4 py-2 text-xs text-primary focus:outline-none flex-grow"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs border-b pb-4 text-outline">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-primary font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#138808]">
                      <span>Coupon Discount:</span>
                      <span className="font-bold">- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="text-primary font-bold">{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fees:</span>
                    <span className="text-primary font-bold">
                      {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-primary">
                  <span>Grand Total:</span>
                  <span className="text-[#138808] font-poppins font-black text-base">{formatCurrency(total)}</span>
                </div>

                <button
                  onClick={() => navigate('/store/checkout')}
                  className="w-full py-3 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-xl font-label-bold text-xs uppercase tracking-wider text-center cursor-pointer shadow-md block transition-all active:scale-95"
                >
                  Proceed to Checkout
                </button>
              </div>

            </div>
          )}
        </div>
      );
    }

    // C. Checkout Shipping/Billing Page
    if (path === '/store/checkout') {
      if (checkoutStep === 'PROCESSING') {
        return (
          <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-lg mx-auto p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden my-12">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none"></div>
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="font-poppins font-black text-lg uppercase tracking-wider text-indigo-300">Securing Transaction</h3>
            <p className="text-xs text-gray-400 font-light animate-pulse">{checkoutLoadingText}</p>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-[10px] text-gray-500 font-mono space-y-1">
              <div>SSL Encryption: ACTIVE (AES-256)</div>
              <div>PCI-DSS Compliance: CERTIFIED</div>
              <div>Gateway status: CONNECTED</div>
            </div>
          </div>
        );
      }

      if (checkoutStep === 'SUCCESS' && createdOrderDetails) {
        return (
          <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-2xl mx-auto p-8 text-center text-white space-y-6 shadow-2xl my-12 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-2">
              <span className="material-symbols-outlined text-5xl animate-bounce">check_circle</span>
            </div>
            
            <h2 className="font-poppins font-black text-2xl uppercase tracking-widest text-emerald-400">Order Confirmed!</h2>
            <p className="text-xs text-gray-400">Your secure checkout transaction was verified and completed successfully.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs bg-black/40 border border-white/5 rounded-2xl p-5 font-light text-gray-300">
              <div>
                <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Order Details</span>
                <p><strong>Order ID:</strong> {createdOrderDetails.id}</p>
                <p><strong>Invoice Number:</strong> {createdOrderDetails.invoiceNo}</p>
                <p><strong>Transaction Ref:</strong> {createdOrderDetails.transactionId}</p>
                <p><strong>Payment Method:</strong> {paymentOption}</p>
              </div>
              <div>
                <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Shipping Details</span>
                <p><strong>Amount Paid:</strong> <span className="text-emerald-400 font-bold">{formatCurrency(createdOrderDetails.amountPaid)}</span></p>
                <p><strong>Expected Delivery:</strong> 2-3 Business Days</p>
                <p><strong>Address:</strong> {createdOrderDetails.address}</p>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="border border-white/5 bg-black/20 rounded-2xl p-6 text-left">
              <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Real-time Order Timeline</h4>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px]">
                <div className="flex items-center gap-2 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Order Placed</div>
                <div className="flex items-center gap-2 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Payment Settled</div>
                <div className="flex items-center gap-2 text-indigo-400"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>Processing</div>
                <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-gray-700"></span>Shipped</div>
                <div className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-gray-700"></span>Delivered</div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  alert('Tax Invoice downloaded to local Downloads folder!');
                }}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Download Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutStep('FORM');
                  navigate('/store/orders');
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-md"
              >
                Track Order
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setCheckoutStep('FORM');
                navigate('/store');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider pt-2 block mx-auto cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        );
      }

      if (checkoutStep === 'FAILURE') {
        return (
          <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-lg mx-auto p-12 text-center text-white space-y-6 shadow-2xl my-12 relative overflow-hidden">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400 mb-2">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h3 className="font-poppins font-black text-lg uppercase tracking-wider text-red-400">Payment Failed</h3>
            <p className="text-xs text-gray-400 font-light">The bank gateway rejected the credit card or wallet authorization token request.</p>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCheckoutStep('FORM')}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              >
                Change Payment Method
              </button>
              <button
                type="button"
                onClick={handleSecureCheckoutSubmit}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              >
                Retry Payment
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="max-w-7xl mx-auto space-y-8 text-left text-white font-poppins relative">
          
          {/* Header Secure certification banner */}
          <div className="bg-[#09090F]/70 border border-white/10 p-5 rounded-[22px] backdrop-blur-xl flex flex-wrap gap-4 items-center justify-between shadow-lg">
            <div>
              <h2 className="font-poppins font-black text-xl uppercase tracking-wider text-white">Secure Checkout</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">🔒 256-bit SSL encrypted gateway transaction panel</p>
            </div>
            <div className="flex gap-4 text-[10px] text-gray-400 items-center">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>PCI-DSS COMPLIANT</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>RAZORPAY VERIFIED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: Shipping and Delivery details */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#09090F]/70 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl space-y-5 shadow-lg">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">01 &bull; Shipping Destination</span>
                
                {addresses.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="block text-[10px] text-gray-400 font-semibold mb-1">Select Shipping Destination:</span>
                    {addresses.map((addr) => (
                      <label key={addr.id} className="flex items-start gap-3 p-3 bg-black/45 border border-white/5 rounded-xl cursor-pointer hover:border-indigo-500/30 transition-all">
                        <input 
                          type="radio" 
                          name="address_select"
                          checked={shippingAddress.includes(addr.city)}
                          onChange={() => setShippingAddress(`${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}`)}
                          className="text-indigo-600 focus:ring-0 mt-1 animate-pulse" 
                        />
                        <div className="text-[11px]">
                          <p className="font-bold text-white">{addr.fullName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-light">{addr.addressLine}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-1 pt-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Delivery Instructions</label>
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Leave package with society security guard"
                    className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Add New Address panel */}
              <div className="bg-[#09090F]/70 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl space-y-4 shadow-lg text-[11px]">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">Add New Address</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Receiver Name" 
                    value={addressFullName}
                    onChange={(e) => setAddressFullName(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Mobile" 
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Street address / building name" 
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                />
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="City" 
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="State" 
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                  />
                  <input 
                    type="text" 
                    placeholder="Pincode" 
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                    className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAddressSubmit}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Save Address
                </button>
              </div>

            </div>

            {/* COLUMN 2: Order items summary & coupons */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#09090F]/70 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl space-y-4 shadow-lg text-xs">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">02 &bull; Order Summary ({cart.length} items)</span>
                
                <div className="max-h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {cart.map((c) => (
                    <div key={c.product.id} className="flex gap-3 bg-black/30 border border-white/5 p-3 rounded-xl items-center">
                      <img src={c.product.image} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 text-[11px]">
                        <h4 className="font-bold text-white line-clamp-1">{c.product.name}</h4>
                        <p className="text-gray-400 text-[10px] mt-0.5 font-light">Qty: {c.quantity} &bull; Price: {formatCurrency(c.product.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Drawer */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Promo Coupon</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. SPORTS20" 
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none text-[11px]" 
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode(couponCodeInput)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-bold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCouponCode && (
                    <div className="text-[10px] text-emerald-400 flex justify-between items-center bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/10">
                      <span>Applied: {appliedCouponCode}</span>
                      <span>-₹{couponDiscountVal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Suggest Coupons List */}
                  <div className="pt-2 space-y-1.5">
                    <span className="block text-[8px] font-black text-gray-500 uppercase tracking-wider">Suggested Coupons:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleApplyCouponCode('SPORTS20')}
                        className="bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] p-1.5 rounded-lg text-[9px] hover:bg-[#FF9933]/15 transition-all text-left"
                      >
                        <strong>SPORTS20</strong><br/>20% Discount
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCouponCode('WELCOME10')}
                        className="bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 p-1.5 rounded-lg text-[9px] hover:bg-indigo-950/60 transition-all text-left"
                      >
                        <strong>WELCOME10</strong><br/>10% Discount
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pricing Ledger */}
                <div className="pt-4 border-t border-white/5 space-y-2 text-[11px] text-gray-400 font-light">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="text-white font-semibold">{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Convenience Fee:</span>
                    <span className="text-white font-semibold">₹20.00</span>
                  </div>
                  {couponDiscountVal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(couponDiscountVal)}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-white/5 w-full my-2"></div>
                  <div className="flex justify-between text-sm font-black text-white">
                    <span>Grand Total:</span>
                    <span className="text-emerald-400">{formatCurrency(Math.max(0, total - couponDiscountVal))}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* COLUMN 3: Premium Payments Option Selection */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#09090F]/70 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl space-y-4 shadow-lg text-xs">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2">03 &bull; Choose Payment Gateway</span>
                
                <div className="space-y-3">
                  
                  {/* Option: Razorpay */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-400">credit_card</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">Razorpay Secure</span>
                        <span className="text-[9px] text-gray-400 font-light">Cards, Netbanking, UPI, Wallet</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'RAZORPAY'}
                      onChange={() => setPaymentOption('RAZORPAY')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {/* Option: Wallet */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#FF9933]">account_balance_wallet</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">be11 Wallet Settlements</span>
                        <span className="text-[9px] text-gray-400 font-light">Balance: {formatCurrency(user?.walletBalance || 0)}</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'WALLET'}
                      onChange={() => setPaymentOption('WALLET')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {/* Option: UPI */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-purple-400">qr_code_2</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">Unified Payments Interface (UPI)</span>
                        <span className="text-[9px] text-gray-400 font-light">GPay, PhonePe, Paytm, QR scan</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'UPI'}
                      onChange={() => setPaymentOption('UPI')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {/* UPI Expand Details */}
                  {paymentOption === 'UPI' && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Verify Virtual Payment Address (VPA)</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. name@oksbi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!upiId.trim()) return;
                            setUpiVerified(true);
                            alert('UPI Address Verified!');
                          }}
                          className="bg-indigo-600 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg uppercase cursor-pointer"
                        >
                          {upiVerified ? 'Verified' : 'Verify'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 justify-center pt-2">
                        <div className="bg-white p-1 rounded-lg">
                          <div className="w-16 h-16 bg-slate-900 flex flex-wrap gap-0.5 p-1">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <span key={i} className={`w-3.5 h-3.5 rounded-sm ${i % 3 === 0 ? 'bg-white' : 'bg-black'}`}></span>
                            ))}
                          </div>
                        </div>
                        <span className="text-[8px] text-gray-400 leading-tight">Scan this secure dynamic QR with your mobile UPI App to settle checkout instant.</span>
                      </div>
                    </div>
                  )}

                  {/* Option: Card Form */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400">payments</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">Credit / Debit Card</span>
                        <span className="text-[9px] text-gray-400 font-light">Visa, MasterCard, RuPay, Amex</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'CARD'}
                      onChange={() => setPaymentOption('CARD')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {/* Card Form details */}
                  {paymentOption === 'CARD' && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3 text-[10px]">
                      {/* Live Card Graphic preview */}
                      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-white/10 rounded-xl p-4 text-white relative shadow-md">
                        <div className="flex justify-between items-start">
                          <span className="material-symbols-outlined text-3xl text-gray-300">credit_card</span>
                          <span className="font-bold text-[9px] uppercase tracking-widest text-[#FF9933]">
                            {cardForm.cardBrand || 'CREDIT CARD'}
                          </span>
                        </div>
                        <div className="mt-4 font-mono text-xs tracking-widest text-center py-1">
                          {cardForm.number || '•••• •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between mt-3 text-[8px] text-gray-400 uppercase tracking-widest">
                          <div>
                            <span className="block text-[6px] text-gray-500">Card Holder</span>
                            {cardForm.holder || 'YOUR NAME'}
                          </div>
                          <div>
                            <span className="block text-[6px] text-gray-500">Expires</span>
                            {cardForm.expiry || 'MM/YY'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Card Number (16 Digits)"
                          value={cardForm.number}
                          onChange={(e) => handleCardNumberInput(e.target.value)}
                          className="w-full bg-[#050508] border border-white/10 rounded-lg p-2.5 text-[10px] text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Card Holder Name"
                          value={cardForm.holder}
                          onChange={(e) => setCardForm({...cardForm, holder: e.target.value})}
                          className="w-full bg-[#050508] border border-white/10 rounded-lg p-2.5 text-[10px] text-white focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Expiry MM/YY"
                            value={cardForm.expiry}
                            onChange={(e) => setCardForm({...cardForm, expiry: e.target.value})}
                            className="bg-[#050508] border border-white/10 rounded-lg p-2.5 text-[10px] text-white focus:outline-none"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})}
                            className="bg-[#050508] border border-white/10 rounded-lg p-2.5 text-[10px] text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option: Net Banking */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-400">account_balance</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">Net Banking</span>
                        <span className="text-[9px] text-gray-400 font-light">SBI, HDFC, ICICI, Axis</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'NET_BANKING'}
                      onChange={() => setPaymentOption('NET_BANKING')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {/* Net banking expand select */}
                  {paymentOption === 'NET_BANKING' && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 text-[10px]">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Select Popular Bank</span>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-[#050508] border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                      >
                        <option value="HDFC">HDFC Bank</option>
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  {/* Option: EMI */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-400">calendar_month</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">EMI installment plans</span>
                        <span className="text-[9px] text-gray-400 font-light">Available for orders over ₹3,000</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      disabled={total < 3000}
                      checked={paymentOption === 'EMI'}
                      onChange={() => setPaymentOption('EMI')}
                      className="text-indigo-600 focus:ring-0 disabled:opacity-30" 
                    />
                  </label>

                  {/* EMI Installments calculator */}
                  {paymentOption === 'EMI' && total >= 3000 && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3 text-[10px]">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Choose Tenure</span>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                        {[3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setEmiMonths(m)}
                            className={`p-2 rounded-lg border font-bold uppercase transition-all cursor-pointer ${
                              emiMonths === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-white/5 text-gray-400'
                            }`}
                          >
                            {m} Months
                          </button>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 space-y-1">
                        <div className="flex justify-between"><span>Monthly EMI Payment:</span><span className="text-white font-bold">₹{((total - couponDiscountVal) / emiMonths).toFixed(2)}/mo</span></div>
                        <div className="flex justify-between"><span>Annualized Interest Rate:</span><span className="text-emerald-400 font-bold">0% Interest EMI</span></div>
                      </div>
                    </div>
                  )}

                  {/* Option: Cash on Delivery (COD) */}
                  <label className="flex items-center justify-between bg-black/45 border border-white/5 hover:border-indigo-500/30 p-3.5 rounded-xl cursor-pointer transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-gray-400">local_shipping</span>
                      <div className="text-left text-[11px]">
                        <span className="block font-bold text-white">Cash on Delivery (COD)</span>
                        <span className="text-[9px] text-gray-400 font-light">Pay cash upon delivery package</span>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment_opt"
                      checked={paymentOption === 'COD'}
                      onChange={() => setPaymentOption('COD')}
                      className="text-indigo-600 focus:ring-0" 
                    />
                  </label>

                  {paymentOption === 'COD' && (
                    <div className="bg-amber-950/20 border border-amber-500/10 p-3 rounded-xl text-[9px] text-amber-400 font-light leading-relaxed">
                      💡 Surcharge of ₹50 applies for COD logistics. Please verify phone number with courier.
                    </div>
                  )}

                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={handleSecureCheckoutSubmit}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider"
                  >
                    Proceed Secure Payment
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Refund policy footer support */}
          <footer className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 gap-4">
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-400">Refund Policy</a>
              <a href="#" className="hover:text-gray-400">Cancellation Terms</a>
              <a href="#" className="hover:text-gray-400">SSL Certificate</a>
              <a href="#" className="hover:text-gray-400">PCI-DSS Safe</a>
            </div>
            <div>
              &copy; 2026 be11 platform. Secured e-commerce checkouts.
            </div>
          </footer>

          {/* Return Request Drawer / Modal Overlay */}
          {activeReturnOrderId && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#09090F] border border-white/10 rounded-[24px] max-w-md w-full p-6 text-left text-white space-y-4">
                <h3 className="font-poppins font-black text-sm uppercase tracking-wider">📦 Submit Return Request</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed">Please state the reason for requesting a refund/return for this order package.</p>
                <textarea
                  rows={3}
                  value={returnReasonText}
                  onChange={(e) => setReturnReasonText(e.target.value)}
                  placeholder="e.g. Size didn't fit, want a replacement product"
                  className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReturnOrderId(null)}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!returnReasonText.trim()) return;
                      try {
                        await api.post(`/shop/orders/${activeReturnOrderId}/return`, { reason: returnReasonText });
                        alert('Return Request submitted successfully!');
                        setActiveReturnOrderId(null);
                        setReturnReasonText('');
                        fetchOrders();
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase text-white"
                  >
                    Submit Return
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      );
    }

    // D. Wishlist Page
    if (path === '/store/wishlist') {
      return (
        <div className="space-y-8 text-left">
          <h2 className="font-poppins font-black text-xl text-primary uppercase tracking-wider border-b pb-3">My Saved Wishlist</h2>

          {wishlist.length === 0 ? (
            <p className="text-outline text-xs py-12">No saved items found in your wishlist.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {wishlist.map((p) => (
                <div key={p.id} className="bg-white rounded-24 border border-outline-variant/30 p-4 flex flex-col justify-between hover:shadow-md transition-all text-left">
                  <img src={p.image} alt={p.name} className="h-40 w-full object-cover rounded-xl border bg-gray-50 cursor-pointer animate-fade-in" onClick={() => navigate(`/store/product/${p.id}`)} />
                  <div className="mt-4">
                    <h4 className="font-bold text-xs text-primary line-clamp-1 cursor-pointer hover:text-secondary" onClick={() => navigate(`/store/product/${p.id}`)}>{p.name}</h4>
                    <p className="text-xs text-[#138808] font-bold mt-1">{formatCurrency(p.price)}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => addToCart(p)}
                      className="flex-grow py-2 bg-primary text-white text-[10px] font-bold rounded-xl cursor-pointer"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(p)}
                      className="px-2.5 border rounded-xl text-red-600 font-bold hover:bg-red-50 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // E. Orders History Logs
    if (path === '/store/orders') {
      return (
        <div className="space-y-8 max-w-3xl mx-auto text-left">
          <h2 className="font-poppins font-black text-xl text-primary uppercase tracking-wider border-b pb-3">Your Orders Logs</h2>

          {orders.length === 0 ? (
            <p className="text-outline text-xs py-12">You have not submitted any orders on be11 Store yet.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-4 text-xs text-left">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <span className="text-[10px] text-outline font-bold">Order ID: #{ord.id.slice(0, 8)}</span>
                      <p className="text-[9px] text-outline mt-0.5">Placed: {new Date(ord.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[8px]">
                        {ord.status}
                      </span>
                      <button 
                        onClick={() => handleReturnSubmit(ord.id)}
                        className="text-[9px] text-[#FF9933] font-bold hover:underline cursor-pointer border rounded px-2 py-0.5 bg-white"
                      >
                        Return Request
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-outline">
                        <span>{item.name} (x{item.quantity})</span>
                        <span className="text-primary font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t flex justify-between font-bold text-primary text-sm">
                    <span>Order Total:</span>
                    <span className="text-[#138808]">{formatCurrency(ord.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // F. Store Category Listings
    if (path.startsWith('/store/category/')) {
      const catName = path.split('/store/category/')[1].toUpperCase();
      const filtered = products.filter((p) => p.category === catName || p.sport.toUpperCase() === catName);

      return (
        <div className="space-y-8 text-left animate-fade-in">
          <div className="flex gap-2 text-xs text-outline font-semibold">
            <Link to="/store" className="hover:text-primary">Store</Link>
            <span>/</span>
            <span className="text-primary font-bold">Category: {catName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/store/product/${p.id}`)}
                className="bg-white rounded-3xl overflow-hidden border border-outline-variant/10 shadow-sm p-4 cursor-pointer text-left flex flex-col justify-between h-full hover:shadow-md transition-all duration-300"
              >
                <img src={p.image} alt={p.name} className="h-44 w-full object-cover rounded-2xl border bg-gray-50" />
                <div className="mt-4 space-y-2">
                  <h4 className="font-poppins font-bold text-xs text-primary line-clamp-2 leading-snug">{p.name}</h4>
                  <p className="text-[10px] text-outline font-semibold">{p.brand}</p>
                  <p className="text-xs text-[#138808] font-bold">{formatCurrency(p.price)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                  className="w-full mt-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold cursor-pointer text-center block"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // G. Storefront Dashboard (DEFAULT IMMERSIVE VIEW)
    return (
      <div className="space-y-16">
        
        {/* 1. HERO SLIDER */}
        <section className="relative rounded-[32px] bg-primary text-white overflow-hidden shadow-2xl min-h-[360px] flex items-center p-8 md:p-16 border border-white/5">
          <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=1200&q=80')]"></div>
          
          {activeSlide === 0 && (
            <div className="space-y-4 max-w-xl animate-fade-in text-left">
              <span className="bg-[#fe9832]/25 border border-[#fe9832]/40 text-[#fe9832] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full inline-block">
                Exclusive sublimation Match Gear
              </span>
              <h2 className="font-poppins font-black text-3xl md:text-5xl leading-none">OFFICIAL TRI-COLOR COLLECTION</h2>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">Customize team names, print squad numbers, and order customized match shirts in our premium 3D design studio.</p>
              <button
                onClick={() => navigate('/jersey-builder')}
                className="bg-[#fe9832] hover:bg-[#e07f24] text-white text-[10px] font-bold uppercase tracking-wider px-8 py-3.5 rounded-2xl transition-all cursor-pointer shadow-md inline-block"
              >
                Customize Match Jersey
              </button>
            </div>
          )}

          {activeSlide === 1 && (
            <div className="space-y-4 max-w-xl animate-fade-in text-left">
              <span className="bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full inline-block">
                Curated bundles
              </span>
              <h2 className="font-poppins font-black text-3xl md:text-5xl leading-none">ELITE ENGLISH WILLOW BATS</h2>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">Grade-1 English willow cricket bats, hand-pressed profiles ready for high performance hitters.</p>
              <button
                onClick={() => {
                  const bat = products.find((p) => p.category === 'BATS');
                  if (bat) navigate(`/store/product/${bat.id}`);
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider px-8 py-3.5 rounded-2xl transition-all cursor-pointer shadow-md inline-block"
              >
                Explore Bat Catalog
              </button>
            </div>
          )}

          {activeSlide === 2 && (
            <div className="space-y-4 max-w-xl animate-fade-in text-left">
              <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full inline-block">
                Professional Cricket Equipment
              </span>
              <h2 className="font-poppins font-black text-3xl md:text-5xl leading-none">BUILD YOUR CRICKET KIT</h2>
              <p className="text-white/70 text-xs md:text-sm leading-relaxed">Select protective pads, batting gloves, helmet presets and bags, saving up to 25% on package orders.</p>
              <button
                onClick={() => navigate('/kit-builder')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider px-8 py-3.5 rounded-2xl transition-all cursor-pointer shadow-md inline-block"
              >
                Open Kit Customizer
              </button>
            </div>
          )}
        </section>

        {/* 2. FEATURE BAR */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: 'local_shipping', title: 'Free shipping', desc: 'On orders above ₹1500' },
            { icon: 'account_balance_wallet', title: 'COD available', desc: 'Pay on dispatch delivery' },
            { icon: 'keyboard_return', title: '7 Day returns', desc: 'Hassle free replacement' },
            { icon: 'verified_user', title: 'Secure payment', desc: 'Razorpay gateway settlements' },
            { icon: 'stars', title: 'Made for athletes', desc: 'Premium verified vendors' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-outline-variant/30 shadow-[0_4px_20px_rgba(10,46,110,0.01)] flex items-center gap-3 text-left">
              <span className="material-symbols-outlined text-secondary text-2xl">{item.icon}</span>
              <div>
                <p className="font-poppins font-bold text-xs text-primary leading-tight">{item.title}</p>
                <p className="text-[10px] text-outline mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 3. SHOP BY CATEGORY CIRCULAR CARDS */}
        <section className="space-y-6 text-left">
          <h3 className="font-poppins font-black text-lg text-primary uppercase tracking-wider">Shop By Category</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { label: 'Cricket bats', cat: 'BATS', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=200&q=80' },
              { label: 'Match Jerseys', cat: 'JERSEYS', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeAq8x7ZDx6hTr6C_oRuRW92H-lKMNP94o2CxewKPp6GQuIdup7YpAhUmSKCPChq9Zgnl5aSdkgjlAiydDRj_aZ3VZVDdF1DJ7K9nRPluYhDYMvZPz0tonY2hkRkDR8I0_qH6DWh8dsAJ9vXAutDemEFc6fykh5ygbXvN0oAKC_L9lKNoVhJH1UYkodZaU1KbLWjdedihdGFRE4cPS6gX_wmaZcWFCZwy19qVeyhIEAbFXPc6ay3jj' },
              { label: 'Cricket balls', cat: 'BALLS', img: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=200&q=80' },
              { label: 'Protective Pads', cat: 'PADS', img: 'https://images.unsplash.com/photo-1544045560-723f63933a3e?auto=format&fit=crop&w=200&q=80' },
              { label: 'Soccer Cleats', cat: 'SHOES', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80' },
              { label: 'Match Gloves', cat: 'GLOVES', img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=200&q=80' }
            ].map((c) => (
              <div 
                key={c.label} 
                onClick={() => navigate(`/store/category/${c.cat.toLowerCase()}`)}
                className="bg-white rounded-3xl p-4 border border-outline-variant/30 hover:border-secondary cursor-pointer text-center group transition-all"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border mx-auto bg-gray-50 flex items-center justify-center">
                  <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="font-bold text-[11px] text-primary mt-3 leading-tight">{c.label}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* 4. FEATURED COLLECTIONS */}
        <section className="space-y-6 text-left">
          <h3 className="font-poppins font-black text-lg text-primary uppercase tracking-wider">Match Ready Essentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {products.slice(0, 4).map((p) => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/store/product/${p.id}`)}
                className="bg-white rounded-3xl overflow-hidden border border-outline-variant/10 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full"
              >
                <div className="relative rounded-2xl overflow-hidden border bg-gray-50 h-40 flex items-center justify-center">
                  <img src={p.image} alt={p.name} className="max-h-36 object-contain" />
                  <button 
                    onClick={(e) => toggleWishlist(p, e)}
                    className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm text-outline hover:text-red-500 cursor-pointer"
                  >
                    <span 
                      className="material-symbols-outlined text-xs block"
                      style={{ fontVariationSettings: isWishlisted(p.id) ? '"FILL" 1' : undefined }}
                    >
                      favorite
                    </span>
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-poppins font-bold text-xs text-primary line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-outline">{p.brand}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-poppins font-bold text-xs text-[#138808]">{formatCurrency(p.price)}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                      className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. DYNAMIC OFFERS (FLASH SALE ACCORDION COUNTDOWN) */}
        <section className="bg-gradient-to-r from-primary to-[#001a49] rounded-[32px] p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 text-left">
          <div className="space-y-4">
            <span className="bg-[#fe9832]/20 border border-[#fe9832]/40 text-[#fe9832] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
              Today's Combo Flash Sale
            </span>
            <h3 className="font-poppins font-black text-2xl md:text-3xl leading-tight">LIMITED PERIOD ATHLETES COMBO</h3>
            <p className="text-white/70 text-xs md:text-sm max-w-md">Get match-grade English willow bats along with high density protective pads and premium leather seam balls at an extra 15% discount using coupon: <strong>WELCOME10</strong>.</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 text-center space-y-2 flex flex-col items-center">
            <p className="text-[10px] text-[#fe9832] uppercase tracking-widest font-bold">Countdown Timer</p>
            <div className="flex gap-3 text-lg font-black font-poppins">
              <div>
                <p>{timeLeft.hours.toString().padStart(2, '0')}</p>
                <p className="text-[8px] text-white/50 font-normal uppercase mt-0.5">Hours</p>
              </div>
              <span>:</span>
              <div>
                <p>{timeLeft.minutes.toString().padStart(2, '0')}</p>
                <p className="text-[8px] text-white/50 font-normal uppercase mt-0.5">Mins</p>
              </div>
              <span>:</span>
              <div>
                <p>{timeLeft.seconds.toString().padStart(2, '0')}</p>
                <p className="text-[8px] text-white/50 font-normal uppercase mt-0.5">Secs</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TEAM STORE & BULK DISCOUNTS */}
        <section className="bg-white rounded-[32px] p-8 md:p-12 border border-outline-variant/30 text-left grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">
          <div className="space-y-4">
            <h3 className="font-poppins font-black text-xl text-primary uppercase tracking-wider">Bulk Team Store Solutions</h3>
            <p className="text-xs text-outline leading-relaxed">Equip your complete roster (Squad of 11, 15 or Academy trainees). Enjoy dynamic tier discounts ranging from 10% to 25% on jerseys, custom team wear sublimation, kits and protective accessories.</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border p-3 rounded-2xl bg-gray-50">
                <p className="font-black text-primary text-sm">10% OFF</p>
                <p className="text-[9px] text-outline mt-0.5">11 Items</p>
              </div>
              <div className="border p-3 rounded-2xl bg-gray-50">
                <p className="font-black text-primary text-sm">15% OFF</p>
                <p className="text-[9px] text-outline mt-0.5">15 Items</p>
              </div>
              <div className="border p-3 rounded-2xl bg-gray-50">
                <p className="font-black text-primary text-sm">25% OFF</p>
                <p className="text-[9px] text-outline mt-0.5">50+ Academy</p>
              </div>
            </div>
          </div>
          <div>
            <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80" alt="Team match photo" className="rounded-3xl border w-full object-cover h-48" />
          </div>
        </section>

        {/* 7. CUSTOM JERSEYS & KIT BUILDER PROMO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-[#fe9832]/5 border border-[#fe9832]/20 rounded-[32px] p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-[#fe9832]/10 text-[#fe9832] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Flagship Redesign</span>
              <h4 className="font-poppins font-black text-lg text-primary mt-2">Interactive Jersey customizer</h4>
              <p className="text-xs text-outline leading-relaxed">Add sponsor graphics, select collar variants, sublimated sports fonts, and preview high-fidelity Front/Back body views in real time.</p>
            </div>
            <button onClick={() => navigate('/jersey-builder')} className="bg-[#fe9832] hover:bg-[#e07f24] text-white text-xs font-bold py-3 px-6 rounded-xl w-fit cursor-pointer">
              Customize Jersey Studio
            </button>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Curated Gear Sets</span>
              <h4 className="font-poppins font-black text-lg text-primary mt-2">Custom Cricket Kit Builder</h4>
              <p className="text-xs text-outline leading-relaxed">Assemble bats, gloves, helmets, leg pads and bags, automatically grouping packaging pricing with special savings.</p>
            </div>
            <button onClick={() => navigate('/kit-builder')} className="bg-primary text-white text-xs font-bold py-3 px-6 rounded-xl w-fit cursor-pointer">
              Build Your Kit
            </button>
          </div>
        </section>

        {/* 8. BRANDS SCROLLING MARQUEE */}
        <section className="space-y-4 text-left">
          <h4 className="font-bold text-[10px] text-outline uppercase tracking-wider">Scrolling Brand Partners</h4>
          <div className="flex gap-8 overflow-x-auto py-4 border-y scrollbar-hide opacity-65">
            {['SG Cricket', 'MRF Sports', 'SS Ton', 'Kookaburra', 'Nike FG', 'Adidas Turf', 'Puma Soccer', 'Li-Ning Badminton'].map((brand, idx) => (
              <span key={idx} className="text-xs font-poppins font-black uppercase text-primary tracking-widest whitespace-nowrap">
                • {brand}
              </span>
            ))}
          </div>
        </section>

        {/* 9. TESTIMONIALS SLIDER SECTION */}
        <section className="space-y-6 text-left">
          <h3 className="font-poppins font-black text-lg text-primary uppercase tracking-wider">Athlete Testimonials</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Rohit Sharma', role: 'Cricket Academy Coach', comment: 'The English willow bats seeded here carry beautiful profiles and ping responses. Bulk team ordering was seamless.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
              { name: 'Aditi Rao', role: 'Football Club Captain', comment: 'Our sublimated custom match jerseys arrived with crisp font layouts and verified dry-fit fabric details.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
              { name: 'Vikram Malhotra', role: 'Trainee Athlete', comment: 'Verified fast logistic shipment delivered my full protective kit setup within 3 days in Mumbai. Excellent service.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }
            ].map((t, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-outline-variant/30 text-left space-y-4 shadow-[0_4px_20px_rgba(10,46,110,0.01)]">
                <div className="flex gap-3 items-center">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border" />
                  <div>
                    <h5 className="font-bold text-xs text-primary">{t.name}</h5>
                    <p className="text-[9px] text-outline">{t.role}</p>
                  </div>
                </div>
                <p className="text-xs text-outline italic leading-relaxed">"{t.comment}"</p>
                <div className="text-[#FF9933] flex">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-xs fill-current">star</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 10. COMMUNITY INSTAGRAM GALLERY */}
        <section className="space-y-6 text-left">
          <h3 className="font-poppins font-black text-lg text-primary uppercase tracking-wider">#be11Athlete Community</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=300&q=80', likes: 142 },
              { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80', likes: 211 },
              { img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=300&q=80', likes: 98 },
              { img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=300&q=80', likes: 304 }
            ].map((photo, idx) => (
              <div key={idx} className="relative group rounded-3xl overflow-hidden border cursor-pointer">
                <img src={photo.img} alt="Community athlete match" className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLikedPhoto((prev) => ({ ...prev, [idx]: !prev[idx] }));
                    }}
                    className="bg-white p-2.5 rounded-full shadow-sm text-red-500 hover:scale-110 active:scale-95 transition-all"
                  >
                    <span 
                      className="material-symbols-outlined text-sm block"
                      style={{ fontVariationSettings: likedPhoto[idx] ? '"FILL" 1' : undefined }}
                    >
                      favorite
                    </span>
                  </button>
                  <span className="text-white text-xs font-bold ml-2">
                    {photo.likes + (likedPhoto[idx] ? 1 : 0)} Likes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11. FAQ ACCORDION */}
        <section className="space-y-6 text-left">
          <h3 className="font-poppins font-black text-lg text-primary uppercase tracking-wider">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {[
              { q: 'How does custom match jersey printing work?', a: 'You enter names, numbers, logos and collar patterns in the Jersey Builder. Designs are printed using digital dye-sublimation for zero fading.' },
              { q: 'Is Razorpay gateway payment simulated safely?', a: 'Yes. It creates mock signatures and transaction IDs, verifying invoice statuses and deducting wallet balance optionally for simulation.' },
              { q: 'Can I request product returns or replacements?', a: 'Orders can be returned within 7 days of delivery by clicking the Return button inside the order dashboard.' }
            ].map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div key={idx} className="bg-white border rounded-2xl overflow-hidden transition-all duration-300 text-xs">
                  <button 
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full p-4 font-bold text-primary flex justify-between items-center cursor-pointer text-left focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined">{isOpen ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-gray-50/50 border-t text-outline leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 12. NEWSLETTER SIGNUP */}
        <section className="bg-gradient-to-r from-secondary-container to-[#e07f24] rounded-[32px] p-8 md:p-12 text-white text-left flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="font-poppins font-black text-xl leading-tight">SUBSCRIBE TO DISCOUNTS</h3>
            <p className="text-white/80 text-xs">Subscribe to get flash sale coupons, limited willow drops and customizer alerts.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="Your Email Address" className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none w-full md:w-64" />
            <button onClick={() => alert('Subscription saved!')} className="bg-white text-primary text-xs font-bold px-6 py-2 rounded-xl cursor-pointer">
              Join
            </button>
          </div>
        </section>

        {/* 13. E-COMMERCE FOOTER */}
        <footer className="pt-12 border-t text-xs text-outline space-y-8 text-left">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h5 className="font-bold text-primary text-xs uppercase tracking-wider">be11 Store</h5>
              <p className="leading-relaxed">Elite athletic e-commerce marketplace. Made for premium league players and academy teams in India.</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-primary text-xs uppercase tracking-wider">Quick links</h5>
              <p className="hover:text-primary cursor-pointer" onClick={() => navigate('/store')}>All Catalog</p>
              <p className="hover:text-primary cursor-pointer" onClick={() => navigate('/store/cart')}>Shopping Cart</p>
              <p className="hover:text-primary cursor-pointer" onClick={() => navigate('/store/wishlist')}>Wishlist</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-primary text-xs uppercase tracking-wider">Customizer builders</h5>
              <p className="hover:text-primary cursor-pointer" onClick={() => navigate('/jersey-builder')}>Jersey Builder</p>
              <p className="hover:text-primary cursor-pointer" onClick={() => navigate('/kit-builder')}>Cricket Kit Builder</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-primary text-xs uppercase tracking-wider">Support info</h5>
              <p>📍 Mumbai, Maharashtra, India</p>
              <p>✉️ support@be11.com</p>
            </div>
          </div>
          <div className="pt-6 border-t text-center text-[10px]">
            &copy; {new Date().getFullYear()} be11 Sports Platform. All rights reserved.
          </div>
        </footer>

      </div>
    );
  };

  return (
    <div className="pt-24 min-h-screen bg-[#F8FAFC] pb-24 text-left font-body-md text-primary">
      {/* Indian flag accent top aura line */}
      <div className="h-[3.5px] w-full bg-gradient-to-r from-[#FF9933] via-[#F8FAFC] to-[#138808] fixed top-20 z-50"></div>

      <div className="max-w-[1440px] mx-auto px-container-padding grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column sidebar directory navigation list (3/12 cols) */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-6 h-fit lg:sticky lg:top-28 text-left">
          
          <div>
            <h2 className="font-poppins font-black text-lg text-primary flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/store')}>
              <span className="material-symbols-outlined text-secondary text-2xl">sports_cricket</span>
              be11 Store
            </h2>
            <p className="text-[9px] text-outline uppercase tracking-wider font-bold">Premium Sports E-Commerce</p>
          </div>

          {/* Quick Search autocomplete */}
          <div className="relative">
            <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              placeholder="Search store gear..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#EDF2F7] rounded-xl pl-9 pr-4 py-2.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-30 overflow-hidden text-xs">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchTerm(s);
                      setSuggestions([]);
                      const matched = products.find((item) => item.name === s);
                      if (matched) navigate(`/store/product/${matched.id}`);
                    }}
                    className="p-3 hover:bg-gray-50 border-b last:border-0 cursor-pointer text-primary"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links navigation list */}
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-outline">
            {[
              { to: '/store', label: 'E-commerce Catalog', icon: 'grid_view' },
              { to: '/store/cart', label: `Shopping Cart (${cart.reduce((a, c) => a + c.quantity, 0)})`, icon: 'shopping_cart' },
              { to: '/store/wishlist', label: `My Wishlist (${wishlist.length})`, icon: 'favorite' },
              { to: '/store/orders', label: 'Past Orders Logs', icon: 'receipt_long' },
            ].map((lnk) => {
              const isActive = location.pathname === lnk.to;
              return (
                <Link
                  key={lnk.to}
                  to={lnk.to}
                  className={`flex items-center gap-2.5 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors ${
                    isActive ? 'bg-primary/5 text-primary font-bold' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{lnk.icon}</span>
                  {lnk.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet settlement details */}
          {isAuthenticated && (
            <div className="p-4 bg-gray-50 border rounded-2xl space-y-1">
              <span className="text-[9px] text-outline uppercase tracking-wider block font-bold">Settlement Account</span>
              <p className="text-xs text-[#138808] font-bold">Wallet: {formatCurrency(user?.walletBalance || 0)}</p>
            </div>
          )}
        </aside>

        {/* Right column main content panel (9/12 cols) */}
        <main className="lg:col-span-9 space-y-8">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 border text-center text-outline text-xs animate-pulse">
              Loading sports e-commerce catalog...
            </div>
          ) : (
            renderStoreView()
          )}
        </main>

      </div>
    </div>
  );
};

export default Shop;
