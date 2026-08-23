import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';

export const BecomeVendor: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Step 1: Account
  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user ? user.phone || '' : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form Step 2: Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('VENUE_OWNER'); // VENUE_OWNER or PRODUCT_SELLER
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [description, setDescription] = useState('');

  // Form Step 3: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  // Form Step 4A: Venue Details
  const [sport, setSport] = useState('Cricket'); // Cricket, Football, Both
  const [groundType, setGroundType] = useState('Outdoor'); // Indoor, Outdoor, Artificial Turf, Natural Grass
  const [capacity, setCapacity] = useState('100');
  const [pricePerHour, setPricePerHour] = useState('1500');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [amenities, setAmenities] = useState<string[]>([]);

  // Form Step 4B: Product Seller Details
  const [productCategory, setProductCategory] = useState('JERSEYS');
  const [brandsCovered, setBrandsCovered] = useState('be11 Pro, Adidas, Nike');
  const [inventorySize, setInventorySize] = useState('500');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [moq, setMoq] = useState('1');

  // Form Step 5: Banking Details
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Form Step 6: Agreement Checks
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Accordion active questions list state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Contact sales form states
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName || !email || !phone) {
        alert('Please complete all account fields.');
        return;
      }
      if (password && password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
    }
    if (step === 2) {
      if (!businessName || !gstNumber) {
        alert('Please specify your Business Name and GSTIN code.');
        return;
      }
    }
    if (step === 3) {
      if (!address || !pincode) {
        alert('Please enter your full address and PIN code.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in from the top account dropdown first.');
      return;
    }
    if (!acceptTerms) {
      alert('Please accept the be11 Partner Merchant Agreement terms.');
      return;
    }

    setLoading(true);
    try {
      const businessDetails =
        businessType === 'VENUE_OWNER'
          ? { sport, groundType, capacity: parseInt(capacity), openTime, closeTime }
          : { productCategory, brandsCovered, inventorySize: parseInt(inventorySize), warehouseAddress, moq: parseInt(moq) };

      const bankingDetails = { bankName, accountHolder, accountNumber, ifscCode, upiId };

      await api.post('/vendors/register', {
        businessName,
        ownerName: fullName,
        location: address,
        city,
        pincode,
        businessType,
        gstNumber,
        panNumber,
        pricing: parseFloat(pricePerHour) || 0,
        amenities,
        businessDetails,
        bankingDetails
      });

      alert('Vendor application successfully submitted! Our administrative review team will verify your credentials and approve your merchant portal shortly.');
      setStep(7); // Completed Step
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit partner application.');
    } finally {
      setLoading(false);
    }
  };

  const triggerScrollToWizard = () => {
    const el = document.getElementById('wizard-onboarding');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-left font-body-md text-primary">
      {/* Tricolor aura bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-[#F8FAFC] to-[#138808] fixed top-20 z-50"></div>

      {/* Hero Section */}
      <header className="relative min-h-[80vh] flex items-center overflow-hidden bg-[#001a49] text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/45 mix-blend-multiply z-10"></div>
          <div
            className="w-full h-full bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=1600&q=80')"
            }}
          ></div>
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fe9832]/20 border border-[#fe9832]/40 text-[#fe9832] font-label-bold text-xs uppercase tracking-widest">
              BE11 MERCHANT PORTAL
            </span>
            <h1 className="font-display-hero text-headline-lg text-white leading-tight">
              Grow Your Sports <span className="text-[#fe9832] italic">Business</span>
            </h1>
            <p className="font-body-lg text-white/80 max-w-lg">
              Monetize turf bookings or list your soccer cleats and willow cricket bats across our premium national athletic ecosystem.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={triggerScrollToWizard}
                className="px-8 py-4 rounded-xl bg-[#fe9832] text-white font-headline-md shadow-xl hover:bg-[#e07f24] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3 cursor-pointer"
              >
                Register as Vendor <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button
                onClick={() => alert('Demo video launching soon.')}
                className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-headline-md transition-all flex items-center gap-3 cursor-pointer"
              >
                Watch Demo <span className="material-symbols-outlined">play_circle</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Why Sell On be11 */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-primary mb-4">Why Partner with be11?</h2>
          <p className="text-outline max-w-2xl mx-auto">Leverage India's most advanced athletic platform to scale your reach and bookings.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: 'groups', title: 'Reach Thousands', desc: 'Connect directly with active players and local clubs looking for slots.' },
            { icon: 'payments', title: 'Zero Upfront Cost', desc: 'Register and set up listings completely free. Pay commission only on sales.' },
            { icon: 'dashboard', title: 'Vendor Console', desc: 'Track bookings, invoice logs, payouts, and customer reviews in one console.' },
            { icon: 'verified_user', title: 'Automated Payouts', desc: 'Secure settlement rules dispatch earnings directly to your bank account.' }
          ].map((item, idx) => (
            <div key={idx} className="p-8 rounded-[24px] bg-white border border-outline-variant/10 shadow-[0_8px_30px_rgba(10,46,110,0.02)] hover-lift flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#001a49]/5 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
                </div>
                <h3 className="font-headline-md text-primary mb-3 text-sm md:text-base">{item.title}</h3>
                <p className="text-outline text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inline Registration Wizard */}
      <section id="wizard-onboarding" className="py-20 bg-white border-y">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-[#001a49]">Partner Merchant Registration</h2>
            <p className="text-outline text-sm mt-2">Complete the 6 steps below to register your venue turf or sports store.</p>

            {/* Steps indicator */}
            <div className="flex justify-between items-center max-w-2xl mx-auto mt-8 relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-[#fe9832] -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              ></div>
              {[1, 2, 3, 4, 5, 6].map((sNum) => (
                <div
                  key={sNum}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all ${
                    step >= sNum ? 'bg-[#fe9832] text-white shadow-md' : 'bg-white border text-outline'
                  }`}
                >
                  {sNum}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border rounded-3xl p-8 md:p-12 shadow-sm text-xs">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 1: Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Full Representative Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Business Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@sportsindia.com"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 bg-[#001a49] hover:bg-[#0a2e6e] text-white font-bold rounded-xl active:scale-98 transition-all text-center cursor-pointer block"
                >
                  Continue to Business Details
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 2: Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Registered Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Active Arena Sports Ltd"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Merchant Type</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    >
                      <option value="VENUE_OWNER">🏟 Turf/Ground Venue Owner</option>
                      <option value="PRODUCT_SELLER">🛍 Sports Equipment & Jersey Seller</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="27AAAAA1111A1Z1"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="ABCDE1234F"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Business Registration Number</label>
                    <input
                      type="text"
                      value={businessReg}
                      onChange={(e) => setBusinessReg(e.target.value)}
                      placeholder="e.g. U74999MH2021PTC123456"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Business Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe your services..."
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button
                    onClick={handleNextStep}
                    className="w-1/2 py-3 bg-[#001a49] text-white font-bold rounded-xl text-center cursor-pointer"
                  >
                    Next: Location Info
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 3: Location Details</h3>
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Full Business Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 15, Sports City Center Complex"
                    className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">City Hub</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    >
                      {['Mumbai', 'Delhi', 'Pune', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ranchi', 'Patna', 'Lucknow'].map((hub) => (
                        <option key={hub} value={hub}>{hub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Nearby Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Metro Station"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button
                    onClick={handleNextStep}
                    className="w-1/2 py-3 bg-[#001a49] text-white font-bold rounded-xl text-center cursor-pointer"
                  >
                    Next: Vendor Specifics
                  </button>
                </div>
              </div>
            )}

            {step === 4 && businessType === 'VENUE_OWNER' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 4A: Venue Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Supported Sports</label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Both">Both (Cricket & Football)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Turf Type</label>
                    <select
                      value={groundType}
                      onChange={(e) => setGroundType(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    >
                      <option value="Outdoor">Outdoor Artificial Turf</option>
                      <option value="Indoor">Indoor Arena</option>
                      <option value="Natural Grass">Natural Grass Field</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Slot Pricing (₹ per Hour)</label>
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Ground Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Opens</label>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="w-full bg-white rounded-xl px-3 py-3 border text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Closes</label>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="w-full bg-white rounded-xl px-3 py-3 border text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-3">Amenities Included</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Floodlights', 'Parking Hub', 'Changing Rooms', 'Washrooms', 'First Aid', 'Spectator Stand'].map((name) => (
                      <label key={name} className="flex items-center gap-2 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={amenities.includes(name)}
                          onChange={() => toggleAmenity(name)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button onClick={() => setStep(5)} className="w-1/2 py-3 bg-[#001a49] text-white font-bold rounded-xl text-center cursor-pointer">Continue</button>
                </div>
              </div>
            )}

            {step === 4 && businessType === 'PRODUCT_SELLER' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 4B: Store & Catalog details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Primary Product Category</label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    >
                      <option value="JERSEYS">Jerseys & Sports Kits</option>
                      <option value="BATS">Bats & Hardwood Willow</option>
                      <option value="BALLS">Cricket & Football Match Balls</option>
                      <option value="SHOES">Spikes & Cleats</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Warehouse Location</label>
                    <input
                      type="text"
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      placeholder="e.g. MIDC Industrial Area, Pune"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Brands Covered</label>
                    <input
                      type="text"
                      value={brandsCovered}
                      onChange={(e) => setBrandsCovered(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Inventory Size</label>
                    <input
                      type="number"
                      value={inventorySize}
                      onChange={(e) => setInventorySize(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Minimum Order Quantity (MOQ)</label>
                    <input
                      type="number"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button onClick={() => setStep(5)} className="w-1/2 py-3 bg-[#001a49] text-white font-bold rounded-xl text-center cursor-pointer">Continue</button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 5: Banking & Settlements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="HDFC Bank"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="e.g. Active Sports Ltd"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100293883"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="HDFC0000123"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">UPI ID for settlements</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="active@upi"
                      className="w-full bg-white rounded-xl px-4 py-3 border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(4)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button onClick={() => setStep(6)} className="w-1/2 py-3 bg-[#001a49] text-white font-bold rounded-xl text-center cursor-pointer">Next: Agreement</button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <h3 className="font-poppins font-bold text-sm text-[#001a49] border-b pb-2">Step 6: Agreement & Submission</h3>
                <div className="p-4 bg-yellow-50 text-[10px] text-yellow-800 leading-relaxed border rounded-xl">
                  <strong>Merchant Verification Agreement:</strong> By submitting, you confirm that all details, tax registers (GSTIN/PAN), and account holders match. be11 holds review rights to verify quality metrics before activation.
                </div>
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-5 w-5"
                  />
                  <span>I agree to the partner merchant guidelines and policies.</span>
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setStep(5)} className="w-1/2 py-3 border rounded-xl font-bold text-center cursor-pointer">Back</button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-1/2 py-3 bg-[#138808] text-white font-bold rounded-xl text-center cursor-pointer shadow-md"
                  >
                    {loading ? 'Submitting...' : 'Agree & Submit'}
                  </button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4 text-center py-12">
                <span className="material-symbols-outlined text-green-500 text-5xl">verified</span>
                <h4 className="font-poppins font-bold text-lg text-[#001a49]">Application Submitted successfully!</h4>
                <p className="text-outline max-w-md mx-auto leading-relaxed">
                  Our vendor inspection operations division will audit your credentials and turf details. Decisions are sent via email in 24-48 business hours.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-[#fe9832] text-white font-bold rounded-xl cursor-pointer"
                >
                  Register Another Business
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-primary mb-4">Simple, Transparent Pricing</h2>
          <p className="text-outline">Choose a plan that fits your business scale. No hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Starter', rate: '5%', desc: 'For individual sellers & small shops', features: ['Up to 50 Products', 'Standard Support', 'Basic Analytics'] },
            { name: 'Professional', rate: '3.5%', desc: 'For established sports retailers', features: ['Unlimited Products', 'Priority 24/7 Support', 'Advanced Growth Insights', 'Featured Store Tag'], popular: true },
            { name: 'Enterprise', rate: 'Custom', desc: 'For major brands & manufacturers', features: ['Multi-location support', 'Dedicated Account Manager', 'Custom API Integration'] }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-[24px] border border-outline-variant/30 flex flex-col justify-between hover-lift relative ${
                plan.popular ? 'bg-[#001a49] text-white scale-105 shadow-2xl' : 'bg-white text-primary'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-[#fe9832] text-white px-3 py-1 rounded-full text-[10px] font-bold">
                  MOST POPULAR
                </div>
              )}
              <div>
                <h4 className="font-headline-md mb-2 text-lg font-bold">{plan.name}</h4>
                <p className={`text-xs mb-6 ${plan.popular ? 'text-white/70' : 'text-outline'}`}>{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-3xl font-bold font-poppins">{plan.rate}</span>
                  {plan.rate !== 'Custom' && <span className="text-xs ml-1">Commission</span>}
                </div>
                <ul className="space-y-4 mb-10 text-xs">
                  {plan.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${plan.popular ? 'text-[#fe9832]' : 'text-green-500'}`}>check</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => alert(`Chosen ${plan.name} Plan! Your account will be setup under this tier upon admin approval.`)}
                className={`w-full py-3 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  plan.popular ? 'bg-[#fe9832] text-white hover:brightness-110' : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 max-w-3xl mx-auto px-6 border-t">
        <h2 className="font-headline-lg text-primary text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How do I become a vendor?', a: 'Fill our 6-step online registration wizard. Our onboarding compliance team will review credentials and activate your dashboard within 24-48 business hours.' },
            { q: 'How long is verification?', a: 'Usually takes 1 to 2 business days. Ground owners require a quick physical inspection checklist validation.' },
            { q: 'How are payouts processed?', a: 'Settlements are automatically dispatched to your registered Bank Account via UPI/IMPS every Tuesday and Friday.' },
            { q: 'What commission is charged?', a: 'Depending on your plan, we charge a low commission between 3.5% to 5.0% per booking or product sold.' }
          ].map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-xs md:text-sm text-primary hover:bg-gray-50/50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-185 text-[#fe9832]' : ''}`}>
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-outline leading-relaxed border-t bg-gray-50/30 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Section Form */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <h2 className="font-headline-lg text-primary">Need Help? Contact Partner Support</h2>
          <p className="text-outline text-xs">Have custom queries about enterprise api, commission structures, or settlement preferences?</p>
          <div className="space-y-4 text-left text-xs">
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Your Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. partner@business.com"
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-3 border text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">How can we help?</label>
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Details of your business size, city coverage..."
                className="w-full bg-[#EDF2F7] rounded-xl px-4 py-3 border text-xs"
              />
            </div>
            <button
              onClick={() => {
                if (!contactEmail || !contactMessage) {
                  alert('Please fill out all contact fields.');
                  return;
                }
                alert('Support ticket submitted successfully! Our merchant partner desk will reach out shortly.');
                setContactEmail('');
                setContactMessage('');
              }}
              className="w-full py-3.5 bg-[#fe9832] text-white font-bold rounded-xl text-center cursor-pointer shadow-md"
            >
              Submit Support Query
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default BecomeVendor;
