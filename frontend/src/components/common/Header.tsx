import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useLocationStore } from '../../store/locationStore.js';
import { api } from '../../lib/api.js';
import { formatCurrency } from '@be11/shared';

export const Header: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { selectedCity, setCity } = useLocationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  const [addonsDropdownOpen, setAddonsDropdownOpen] = useState(false);
  const addonsDropdownRef = useRef<HTMLDivElement>(null);
  const addonsTriggerRef = useRef<HTMLButtonElement>(null);

  // Custom Location dropdown states
  const [locDropdownOpen, setLocDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const locDropdownRef = useRef<HTMLDivElement>(null);
  const locTriggerRef = useRef<HTMLButtonElement>(null);

  const cities = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Ranchi', 'Deoghar', 'Dhanbad', 'Indore'
  ];

  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        alert(`Detected location: Lat ${position.coords.latitude.toFixed(2)}, Lng ${position.coords.longitude.toFixed(2)}. Setting city to nearest hub: Delhi`);
        setCity('Delhi');
        setLocDropdownOpen(false);
      },
      (error) => {
        console.error(error);
        alert("Failed to detect location. Please select manually.");
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!locDropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredCities.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredCities.length) % filteredCities.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
        setCity(filteredCities[highlightedIndex]);
        setLocDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setLocDropdownOpen(false);
    }
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'OWNER'>('CUSTOMER');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        locDropdownRef.current &&
        !locDropdownRef.current.contains(event.target as Node) &&
        locTriggerRef.current &&
        !locTriggerRef.current.contains(event.target as Node)
      ) {
        setLocDropdownOpen(false);
      }
      if (
        addonsDropdownRef.current &&
        !addonsDropdownRef.current.contains(event.target as Node) &&
        addonsTriggerRef.current &&
        !addonsTriggerRef.current.contains(event.target as Node)
      ) {
        setAddonsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Header scroll class
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', {
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          role,
        });
        login(res.data.data.user, res.data.data.token);
        setAuthModalOpen(false);
      } else {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.data.user, res.data.data.token);
        setAuthModalOpen(false);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 h-20 ${
          scrolled
            ? 'shadow-lg bg-surface/90 dark:bg-surface-container-highest/95 backdrop-blur-xl py-1'
            : 'bg-surface/70 dark:bg-surface-container-highest/70 backdrop-blur-xl border-b border-outline-variant/30 dark:border-outline/20 shadow-sm'
        }`}
        id="main-header"
      >
        <nav className="flex justify-between items-center h-full px-container-padding max-w-7xl mx-auto">
          <div className="flex items-center gap-base transition-transform duration-300 hover:scale-105 pl-6 md:pl-8">
            <Link to="/">
              <img
                alt="be11 Official Logo"
                className="h-[42px] md:h-[48px] w-auto object-contain"
                src="/be11_logo.png"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            <Link
              className={`nav-link-premium ${
                location.pathname === '/venues'
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/venues"
            >
              Venues
            </Link>
            <Link
              className={`nav-link-premium ${
                location.pathname === '/live-matches'
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/live-matches"
            >
              Live Matches
            </Link>
            <Link
              className={`nav-link-premium ${
                location.pathname === '/coaches'
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/coaches"
            >
              Coaches
            </Link>
            <Link
              className={`nav-link-premium ${
                location.pathname.startsWith('/store')
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/store"
            >
              Store
            </Link>
            <Link
              className={`nav-link-premium ${
                location.pathname === '/jersey-builder'
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/jersey-builder"
            >
              Jersey Builder
            </Link>
            <Link
              className={`nav-link-premium ${
                location.pathname === '/kit-builder'
                  ? 'text-primary font-bold border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary transition-colors'
              }`}
              to="/kit-builder"
            >
              Kit Builder
            </Link>

            {/* Add Ons Dropdown Nav Item */}
            <div 
              className="relative"
              onMouseEnter={() => setAddonsDropdownOpen(true)}
              onMouseLeave={() => setAddonsDropdownOpen(false)}
            >
              <button
                ref={addonsTriggerRef}
                onClick={() => setAddonsDropdownOpen(!addonsDropdownOpen)}
                className={`nav-link-premium flex items-center gap-1 cursor-pointer select-none pb-1 ${
                  location.pathname === '/capture'
                    ? 'text-primary font-bold border-b-2 border-secondary'
                    : 'text-on-surface-variant hover:text-primary transition-colors'
                }`}
                aria-haspopup="true"
                aria-expanded={addonsDropdownOpen}
              >
                <span>Add Ons</span>
                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${addonsDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown mega menu */}
              <div
                ref={addonsDropdownRef}
                className={`absolute left-1/2 -translate-x-1/2 mt-3 w-80 bg-white border border-[#E8E8E8]/50 rounded-2xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-[70] transition-all duration-300 transform origin-top ${
                  addonsDropdownOpen 
                    ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                    : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                }`}
              >
                <div className="space-y-4">
                  {/* BE11 Capture */}
                  <Link
                    to="/capture"
                    onClick={() => setAddonsDropdownOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] group/item transition-all"
                  >
                    <div className="p-2.5 rounded-xl bg-[#fe9832]/10 text-[#fe9832] group-hover/item:bg-[#fe9832] group-hover/item:text-white transition-colors duration-300 flex-shrink-0">
                      <span className="material-symbols-outlined text-lg flex items-center justify-center">videocam</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#001a49] group-hover/item:text-primary">BE11 Capture</span>
                        <span className="text-[8px] bg-[#FF9933] text-white px-1 py-0.5 rounded font-black tracking-wider uppercase font-poppins">NEW</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-normal font-light">
                        Capture every boundary, wicket and unforgettable moment.
                      </p>
                      <span className="text-[10px] font-bold text-[#fe9832] mt-2 block group-hover/item:translate-x-1 transition-transform">
                        Explore Capture →
                      </span>
                    </div>
                  </Link>

                  {/* Future Placeholders */}
                  <div className="border-t border-[#E8E8E8]/30 pt-3 space-y-3">
                    {/* BE11 Score */}
                    <div className="flex items-start gap-3 p-3 rounded-xl opacity-60 cursor-not-allowed">
                      <div className="p-2.5 rounded-xl bg-gray-150 text-gray-400 flex-shrink-0">
                        <span className="material-symbols-outlined text-lg flex items-center justify-center">edit_calendar</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-500">BE11 Score</span>
                          <span className="text-[7px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-bold uppercase tracking-wider font-poppins">Soon</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 leading-normal font-light">
                          Live scoring and digital scorecards.
                        </p>
                      </div>
                    </div>

                    {/* BE11 Highlights */}
                    <div className="flex items-start gap-3 p-3 rounded-xl opacity-60 cursor-not-allowed">
                      <div className="p-2.5 rounded-xl bg-gray-150 text-gray-400 flex-shrink-0">
                        <span className="material-symbols-outlined text-lg flex items-center justify-center">auto_awesome</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-500">BE11 Highlights</span>
                          <span className="text-[7px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-bold uppercase tracking-wider font-poppins">Soon</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 leading-normal font-light">
                          Automated match highlights.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Functional City Dropdown */}
            {/* Premium Custom Location Selector */}
            <div className="relative" onKeyDown={handleKeyDown}>
              <button
                ref={locTriggerRef}
                onClick={() => setLocDropdownOpen(!locDropdownOpen)}
                className="hidden md:flex items-center justify-between gap-2 bg-white border border-[#E8E8E8] hover:bg-gray-50 h-12 w-[180px] px-4 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:scale-102 active:scale-98 transition-all cursor-pointer select-none text-left"
                aria-haspopup="true"
                aria-expanded={locDropdownOpen}
                aria-label="Location selector"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[#fe9832] text-sm flex-shrink-0">location_on</span>
                  <span className="text-xs font-bold text-[#001a49] truncate">{selectedCity || 'Select City'}</span>
                </div>
                <span className={`material-symbols-outlined text-outline text-sm transition-transform duration-350 ${locDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {locDropdownOpen && (
                <div
                  ref={locDropdownRef}
                  className="absolute right-0 mt-3 w-[360px] bg-white/95 backdrop-blur-md border border-[#E8E8E8]/50 rounded-2xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-[70] animate-fade-in flex flex-col gap-4 text-left"
                >
                  {/* Current Location option */}
                  <button
                    onClick={handleGeolocation}
                    className="w-full flex items-center gap-2 py-3 px-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all text-xs font-bold text-primary text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">my_location</span>
                    Use My Current Location
                  </button>

                  {/* Search City */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(-1);
                      }}
                      placeholder="Search your city..."
                      className="w-full bg-[#EDF2F7] rounded-xl pl-9 pr-4 py-2.5 text-xs border border-transparent focus:border-primary focus:ring-0 focus:outline-none transition-all font-body-md"
                      autoFocus
                    />
                  </div>

                  {/* Recent Locations chips */}
                  <div>
                    <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-2">Recent Locations</span>
                    <div className="flex flex-wrap gap-2">
                      {['Mumbai', 'Delhi', 'Ranchi'].map((rCity) => (
                        <button
                          key={rCity}
                          onClick={() => {
                            setCity(rCity);
                            setLocDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-105 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer border"
                        >
                          {rCity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Cities pills */}
                  <div>
                    <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-2">Popular Cities</span>
                    <div className="flex flex-wrap gap-2">
                      {['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune'].map((pCity) => (
                        <button
                          key={pCity}
                          onClick={() => {
                            setCity(pCity);
                            setLocDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-gray-105 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer border"
                        >
                          {pCity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City List rows */}
                  <div className="border-t pt-3 flex flex-col max-h-[160px] overflow-y-auto pr-1">
                    <span className="text-[9px] font-bold text-outline uppercase tracking-wider block mb-2 px-1">All Cities</span>
                    {filteredCities.map((cName, idx) => {
                      const isSelected = selectedCity === cName;
                      const isHighlighted = highlightedIndex === idx;
                      return (
                        <button
                          key={cName}
                          onClick={() => {
                            setCity(cName);
                            setLocDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between h-[40px] px-3.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white font-bold'
                              : isHighlighted
                              ? 'bg-primary/5 text-primary font-semibold'
                              : 'text-outline hover:bg-primary/5 hover:text-primary'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {cName}
                          </span>
                          {isSelected && <span className="material-symbols-outlined text-sm">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Gold Coin Toss Link */}
            <Link
              to="/toss"
              className={`relative overflow-hidden flex items-center justify-center gap-2 h-12 px-6 rounded-full transition-all duration-300 font-poppins font-semibold text-xs uppercase tracking-wider cursor-pointer ${
                location.pathname === '/toss'
                  ? 'bg-white border border-gray-200 text-[#102A56] shadow-md'
                  : 'text-white bg-gradient-to-r from-[#FF9933] to-[#FF6A00] shadow-[0_4px_14px_rgba(255,106,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,106,0,0.45)] hover:-translate-y-0.5 active:translate-y-0 hover:scale-102 animate-button-shine'
              }`}
              aria-label="Launch IPL pre-match coin toss"
            >
              <span className="material-symbols-outlined text-sm">monetization_on</span>
              <span>Toss</span>
            </Link>

            {user?.role === 'OWNER' && (
              <Link to="/become-vendor">
                <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-bold text-label-bold shadow-md btn-primary-premium">
                  List Your Venue
                </button>
              </Link>
            )}

            <div className="relative">
              <button
                ref={triggerRef}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-all duration-300 hover:scale-110 active:scale-90"
                id="account-trigger"
              >
                <span className="material-symbols-outlined text-primary">account_circle</span>
              </button>

              {/* Account Dropdown Panel */}
              <div
                ref={dropdownRef}
                className={`absolute right-0 mt-4 w-[340px] bg-white border border-[#E5E7EB] rounded-20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] transition-all duration-200 ${
                  dropdownOpen ? 'block opacity-100 translate-y-0 scale-100' : 'hidden opacity-0 -translate-y-2 scale-95'
                }`}
                id="account-dropdown"
              >
                <div className="mb-5">
                  {isAuthenticated ? (
                    <>
                      <h3 className="font-poppins font-bold text-lg text-primary">
                        Hi, {user?.firstName}
                      </h3>
                      <p className="font-poppins font-semibold text-sm text-secondary-container mt-1">
                        Wallet: {formatCurrency(user?.walletBalance || 0)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-poppins font-bold text-lg text-primary">Welcome to be11</h3>
                      <p className="font-poppins font-semibold text-sm text-secondary-container">
                        Play. Compete. Book.
                      </p>
                      <p className="font-body-md text-xs text-on-surface-variant mt-2 leading-relaxed">
                        Manage bookings, tournaments, shopping and your account from one place.
                      </p>
                    </>
                  )}
                  <div className="h-[1px] bg-[#E5E7EB] w-full mt-4"></div>
                </div>

                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full h-[52px] bg-[#0A2E6E] text-white rounded-[14px] flex items-center justify-between px-5 mb-6 group hover:bg-[#001a49] transition-all cursor-pointer"
                  >
                    <span className="font-label-bold">Login / Sign Up</span>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full h-[52px] bg-[#ba1a1a] text-white rounded-[14px] flex items-center justify-between px-5 mb-6 group hover:bg-[#93000a] transition-all cursor-pointer"
                  >
                    <span className="font-label-bold">Log Out</span>
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                )}

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 text-left">
                  <div>
                    <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-3">
                      Sports Business
                    </h4>
                    <div className="space-y-1">
                      <Link
                        to="/become-vendor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] group transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-surface-container group-hover:bg-secondary-fixed text-primary transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            ></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">List Your Venue</p>
                          <p className="text-[11px] text-on-surface-variant">
                            List your sports facility for booking
                          </p>
                        </div>
                      </Link>
                      <Link
                        to="/become-vendor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] group transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-surface-container group-hover:bg-secondary-fixed text-primary transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            ></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">Become a Vendor</p>
                          <p className="text-[11px] text-on-surface-variant">
                            Sell your sports equipment online
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-3">
                      Player Zone
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {isAuthenticated ? (
                        <>
                          <Link
                            className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                            to="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Dashboard
                          </Link>
                          {user?.role === 'COACH' && (
                            <Link
                              className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                              to="/coach-dashboard"
                              onClick={() => setDropdownOpen(false)}
                            >
                              Coach Workspace
                            </Link>
                          )}
                          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                            <Link
                              className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                              to="/admin"
                              onClick={() => setDropdownOpen(false)}
                            >
                              Admin Panel
                            </Link>
                          )}
                          <Link
                            className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                            to="/settings"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Settings
                          </Link>
                        </>
                      ) : (
                        <span className="p-2.5 rounded-xl text-xs text-on-surface-variant/40 font-medium cursor-not-allowed">
                          My Bookings
                        </span>
                      )}
                      <Link
                        className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                        to="/live-matches"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Live Matches
                      </Link>
                      <Link
                        className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                        to="/coaches"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Coaches
                      </Link>
                      <Link
                        className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                        to="/store"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Store
                      </Link>
                      <Link
                        className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                        to="/kit-builder"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Kit Builder
                      </Link>
                      <Link
                        className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                        to="/capture"
                        onClick={() => setDropdownOpen(false)}
                      >
                        BE11 Capture
                      </Link>
                      {isAuthenticated && (
                        <Link
                          className="p-2.5 rounded-xl hover:bg-[#F8FAFC] text-xs text-primary font-medium transition-colors"
                          to="/my-training"
                          onClick={() => setDropdownOpen(false)}
                        >
                          My Training
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Dynamic Authorization Modal (Login/Signup) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-24 p-8 max-w-md w-full relative shadow-2xl border border-outline-variant/30">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-all scale-125 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-poppins font-bold text-2xl text-primary mb-2">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">
              {isRegister
                ? 'Join be11 and start booking premium sports venues.'
                : 'Sign in to manage your sports bookings and ledger.'}
            </p>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-3.5 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              {isRegister && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                        First Name
                      </label>
                      <input
                        required
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                        placeholder="Rahul"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                        Last Name
                      </label>
                      <input
                        required
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                        placeholder="Sharma"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <button
                        type="button"
                        onClick={() => setRole('CUSTOMER')}
                        className={`py-2.5 rounded-xl font-label-bold border transition-all cursor-pointer ${
                          role === 'CUSTOMER'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-primary border-outline-variant hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Player
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('OWNER')}
                        className={`py-2.5 rounded-xl font-label-bold border transition-all cursor-pointer ${
                          role === 'OWNER'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-primary border-outline-variant hover:bg-[#F8FAFC]'
                        }`}
                      >
                        Venue Owner
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#EDF2F7] rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:ring-0 transition-all font-body-md"
                  placeholder="••••••••"
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 bg-[#0A2E6E] text-white font-label-bold rounded-[14px] btn-primary-premium shadow-lg mt-6 flex justify-center items-center cursor-pointer"
              >
                {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-on-surface-variant">
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-secondary font-semibold hover:underline cursor-pointer"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
