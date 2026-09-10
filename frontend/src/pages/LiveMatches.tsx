import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useLocationStore } from '../store/locationStore.js';
import { io } from 'socket.io-client';
import { API_URL } from '../config/env.js';

interface Ground {
  id: string;
  name: string;
  location: string;
  city: string;
  pricePerHour: number;
  sport: string;
  rating: number;
  amenities: string[];
  images: string[];
}

interface Match {
  id: string;
  groundId: string;
  ground: Ground;
  sport: string;
  date: string;
  startTime: string;
  entryFee: number;
  playersJoined: number;
  totalPlayers: number;
  skillLevel: string;
  hostId: string;
  hostName: string;
  verifiedHost: boolean;
  status: string;
  teamA: any; // array or string
  teamB: any; // array or string
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const LiveMatches: React.FC = () => {
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();
  const { selectedCity } = useLocationStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.permissionDenied) {
      alert("You don't have permission to access this page.");
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Player Join Flow Premium Modal State
  const [playerBookingMatch, setPlayerBookingMatch] = useState<Match | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 1: Option Select, 2: Form Input, 3: Invoice Summary, 4: Payment choice, 5: Success screen

  // Coupon state for the new flow
  const [playerCouponCode, setPlayerCouponCode] = useState('');
  const [playerCouponDiscount, setPlayerCouponDiscount] = useState(0);

  const handlePlayerApplyCoupon = () => {
    if (playerCouponCode.trim().toUpperCase() === 'BE11PLAY') {
      setPlayerCouponDiscount(35);
      alert('Coupon code BE11PLAY applied! ₹35 discount active.');
    } else {
      alert('Invalid Coupon Code');
    }
  };

  const handlePlayerBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerBookingMatch) return;

    // Individual player pricing calculation
    const basePrice = playerBookingMatch.entryFee;
    const gst = basePrice * 0.18;
    const platformFee = 20.0;
    const grandTotal = Math.max(0, basePrice + gst + platformFee - playerCouponDiscount);

    if (paymentMethod === 'WALLET' && user && user.walletBalance < grandTotal) {
      alert('Insufficient wallet balance. Please top up from your dashboard account.');
      return;
    }

    setCheckoutLoading(true);
    try {
      // API call to custom endpoint
      const res = await api.post(`/matches/${playerBookingMatch.id}/booking`, {
        bookingType: 'SINGLE',
        playerCount: 1,
        couponCode: playerCouponCode,
      });

      // Update wallet balance locally
      if (user) {
        updateWalletBalance(user.walletBalance - grandTotal);
      }

      setInvoiceResult({
        transactionId: res.data.data.booking.transactionId || `tx_m_${Math.floor(10000000 + Math.random() * 90000000)}`,
        invoiceId: res.data.data.booking.invoice || `inv_m_${Math.floor(100000 + Math.random() * 900000)}`,
        amountPaid: grandTotal,
        date: new Date().toLocaleDateString(),
        bookingId: res.data.data.booking.id,
        qrCode: res.data.data.booking.qrCode || `qr_m_${Math.floor(100000 + Math.random() * 900000)}`,
      });

      setBookingStep(5); // Transition to success step!
      fetchMatches();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete playroom booking.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search & Sort states
  const [searchParams, setSearchParams] = useSearchParams();
  const sportParam = searchParams.get('sport');
  const initialSport = () => {
    if (sportParam) {
      const formatted = sportParam.charAt(0).toUpperCase() + sportParam.slice(1).toLowerCase();
      if (['Cricket', 'Football', 'Badminton', 'Basketball', 'Volleyball', 'Tennis'].includes(formatted)) {
        return formatted;
      }
    }
    return 'All';
  };

  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All'); // 'All', 'Free', '100', '300'
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All'); // 'All', 'Beginner', 'Intermediate', 'Professional'
  const [sortBy, setSortBy] = useState('Newest'); // 'Newest', 'Lowest Price', 'Highest Rating'

  // Selected Match details view
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Synchronize URL changes (e.g. back button, direct navigation)
  useEffect(() => {
    if (sportParam) {
      const formatted = sportParam.charAt(0).toUpperCase() + sportParam.slice(1).toLowerCase();
      if (['Cricket', 'Football', 'Badminton', 'Basketball', 'Volleyball', 'Tennis'].includes(formatted)) {
        if (selectedSport !== formatted) {
          setSelectedSport(formatted);
        }
      }
    } else {
      if (selectedSport !== 'All') {
        setSelectedSport('All');
      }
    }
  }, [sportParam]);

  // Synchronize state changes to URL
  useEffect(() => {
    if (selectedSport === 'All') {
      if (searchParams.has('sport')) {
        const copy = new URLSearchParams(searchParams.toString());
        copy.delete('sport');
        setSearchParams(copy);
      }
    } else {
      if (searchParams.get('sport') !== selectedSport.toLowerCase()) {
        const copy = new URLSearchParams(searchParams.toString());
        copy.set('sport', selectedSport.toLowerCase());
        setSearchParams(copy);
      }
    }
  }, [selectedSport]);

  // Billing Checkout Modal State
  const [checkoutMatch, setCheckoutMatch] = useState<Match | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET'>('WALLET');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<any | null>(null);

  // Match Chat Room State
  const [chatRoomMatchId, setChatRoomMatchId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Host Match Wizard State
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [hostGrounds, setHostGrounds] = useState<Ground[]>([]);
  
  // Host Form states
  const [hostGroundId, setHostGroundId] = useState('');
  const [hostSport, setHostSport] = useState('Cricket');
  const [hostDate, setHostDate] = useState('2026-08-16');
  const [hostTime, setHostTime] = useState('07:00 AM');
  const [hostDuration, setHostDuration] = useState('2 Hours');
  const [hostSkill, setHostSkill] = useState('Intermediate');
  const [hostPlayers, setHostPlayers] = useState('22');
  const [hostFee, setHostFee] = useState('299');
  const [hostDesc, setHostDesc] = useState('Friendly open game. Slots include refreshments and dynamic umpire tracking.');
  const [hostLoading, setHostLoading] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/matches', {
        params: {
          sport: selectedSport === 'All' ? undefined : selectedSport,
          city: selectedCity,
          search: searchQuery || undefined,
        },
      });
      let fetched: Match[] = res.data.data.matches || [];

      // Client-side sub filters
      if (selectedPriceFilter !== 'All') {
        if (selectedPriceFilter === 'Free') fetched = fetched.filter((m) => m.entryFee === 0);
        if (selectedPriceFilter === '100') fetched = fetched.filter((m) => m.entryFee <= 100);
        if (selectedPriceFilter === '300') fetched = fetched.filter((m) => m.entryFee <= 300);
      }
      if (selectedSkillFilter !== 'All') {
        fetched = fetched.filter((m) => m.skillLevel.toLowerCase() === selectedSkillFilter.toLowerCase());
      }

      // Client-side sorting
      if (sortBy === 'Lowest Price') {
        fetched.sort((a, b) => a.entryFee - b.entryFee);
      } else if (sortBy === 'Highest Rating') {
        fetched.sort((a, b) => (b.ground?.rating || 0) - (a.ground?.rating || 0));
      } else {
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      setMatches(fetched);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch open playrooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedSport, selectedCity, searchQuery, selectedPriceFilter, selectedSkillFilter, sortBy]);

  // Socket setup for matches
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('match-update', ({ matchId, action, data }) => {
      setMatches((prev) => {
        if (action === 'CREATED') {
          if (data.ground?.city === selectedCity) {
            return [data, ...prev];
          }
          return prev;
        }
        return prev.map((m) => (m.id === matchId ? data : m));
      });
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCity, selectedMatch]);

  const loadHostGrounds = async () => {
    try {
      const res = await api.get('/grounds', { params: { city: selectedCity } });
      setHostGrounds(res.data.data.grounds);
      if (res.data.data.grounds.length > 0) {
        setHostGroundId(res.data.data.grounds[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isHostOpen) {
      loadHostGrounds();
    }
  }, [isHostOpen, selectedCity]);

  // Apply checkout coupon
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'BE11PLAY') {
      setCouponDiscount(30); // ₹30 off
      setSuccessMsg('Coupon code BE11PLAY applied! Discount applied.');
    } else {
      alert('Invalid Coupon Code');
    }
  };

  // Process join checkout match
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutMatch) return;

    if (paymentMethod === 'WALLET' && user && user.walletBalance < (checkoutMatch.entryFee - couponDiscount)) {
      alert('Insufficient wallet credit. Please top up from your dashboard account.');
      return;
    }

    setCheckoutLoading(true);
    try {
      // Pick a random team ('A' or 'B') to join
      const teamA = getTeamRoster(checkoutMatch.teamA);
      const teamB = getTeamRoster(checkoutMatch.teamB);
      const teamChoice = teamA.length <= teamB.length ? 'A' : 'B';

      await api.post(`/matches/${checkoutMatch.id}/join`, { team: teamChoice });
      
      if (checkoutMatch.entryFee > 0 && user) {
        updateWalletBalance(user.walletBalance - (checkoutMatch.entryFee - couponDiscount));
      }

      setInvoiceResult({
        transactionId: `tx_m_${Math.floor(10000000 + Math.random() * 90000000)}`,
        invoiceId: `inv_m_${Math.floor(100000 + Math.random() * 900000)}`,
        amountPaid: checkoutMatch.entryFee - couponDiscount,
        date: new Date().toLocaleDateString(),
        team: teamChoice,
      });

      fetchMatches();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to checkout join match.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Host playroom publish
  const handleHostPublish = async () => {
    setHostLoading(true);
    try {
      await api.post('/matches', {
        groundId: hostGroundId,
        sport: hostSport,
        date: hostDate,
        startTime: hostTime,
        entryFee: parseFloat(hostFee || '0'),
        totalPlayers: parseInt(hostPlayers || '10'),
        skillLevel: hostSkill,
      });

      alert('Match Playroom successfully hosted and published live!');
      setIsHostOpen(false);
      setWizardStep(1);
      fetchMatches();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Host registration failed.');
    } finally {
      setHostLoading(false);
    }
  };

  // Leave match
  const handleLeaveMatch = async (matchId: string) => {
    if (!window.confirm('Are you sure you want to cancel your slot booking in this playroom?')) return;
    try {
      const res = await api.post(`/matches/${matchId}/leave`);
      alert('Successfully left the playroom. Entry fee refunded.');
      if (selectedMatch && selectedMatch.entryFee > 0 && user) {
        updateWalletBalance(user.walletBalance + selectedMatch.entryFee);
      }
      setSelectedMatch(res.data.data.match);
      fetchMatches();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Leave failed.');
    }
  };

  const getTeamRoster = (teamJson: any) => {
    if (typeof teamJson === 'string') {
      try {
        return JSON.parse(teamJson);
      } catch {
        return [];
      }
    }
    return teamJson || [];
  };

  // Chat room updates simulator
  useEffect(() => {
    if (chatRoomMatchId) {
      setChatMessages([
        { sender: 'Ayush Raj', msg: 'Welcome everyone! Pitch is booked. Wear white kits.', time: '09:12' },
        { sender: 'Rahul Sharma', msg: 'Awesome! Bringing additional batting pads.', time: '09:15' },
      ]);
    }
  }, [chatRoomMatchId]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typingMessage.trim() || !user) return;
    
    setChatMessages((prev) => [
      ...prev,
      { sender: `${user.firstName} ${user.lastName}`, msg: typingMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setTypingMessage('');

    // Typing effect simulator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#040408] text-white text-left font-poppins relative overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 z-10 relative space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex gap-2 text-[10px] text-gray-400 font-semibold mb-2 text-left uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-gray-600">&gt;</span>
          <Link to="/live-matches" className="hover:text-white transition-colors">Live Matches</Link>
          {selectedSport !== 'All' && (
            <>
              <span className="text-gray-600">&gt;</span>
              <span className="text-indigo-400 font-bold">{selectedSport}</span>
            </>
          )}
        </div>

        {/* Page title and host trigger */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/10 border border-[#FF9933]/20 px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] animate-pulse"></span>
              <span className="text-[10px] text-[#FF9933] font-black uppercase tracking-widest">Live Open Matches</span>
            </div>
            <h1 className="font-poppins font-black text-3xl sm:text-4xl uppercase tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              {selectedSport === 'All' ? 'Open Playrooms' : `${selectedSport} Playrooms`}
            </h1>
            <p className="text-gray-400 text-xs mt-1">Join {selectedSport === 'All' ? 'sports' : selectedSport} activities, split bookings expense, and team up in {selectedCity}.</p>
          </div>

          {isAuthenticated && ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'COACH'].includes(user?.role || '') && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsHostOpen(true);
                  setWizardStep(1);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl cursor-pointer transition-all shadow-md active:scale-95"
              >
                Host Match Lobbies
              </button>
            </div>
          )}
        </div>


        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 p-4 rounded-2xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Sports Categories */}
          <div className="lg:col-span-5 flex flex-wrap gap-1 bg-black/45 border border-white/10 p-1.5 rounded-2xl w-full">
            {['All', 'Cricket', 'Football', 'Badminton', 'Basketball', 'Volleyball', 'Tennis'].map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                  selectedSport === sport ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="lg:col-span-3 relative w-full">
            <input
              type="text"
              placeholder={selectedSport === 'All' ? 'Search venue, sport, host...' : `Search ${selectedSport} venues...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#09090F]/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="lg:col-span-4 grid grid-cols-3 gap-2 w-full text-xs">
            <select
              value={selectedPriceFilter}
              onChange={(e) => setSelectedPriceFilter(e.target.value)}
              className="bg-[#09090F]/70 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
            >
              <option value="All">All Prices</option>
              <option value="Free">Free entry</option>
              <option value="100">Below ₹100</option>
              <option value="300">Below ₹300</option>
            </select>

            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="bg-[#09090F]/70 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
            >
              <option value="All">All Skills</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Professional">Professional</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#09090F]/70 border border-white/10 rounded-xl px-3 py-2 text-gray-300 focus:outline-none"
            >
              <option value="Newest">Newest first</option>
              <option value="Lowest Price">Lowest price</option>
              <option value="Highest Rating">Highest rating</option>
            </select>
          </div>

        </div>

        {/* Lobbies grid layout */}
        {loading ? (
          <div className="py-24 text-center text-indigo-400 font-bold uppercase tracking-wider">Retrieving Active Matches...</div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center bg-[#09090F]/45 border border-dashed border-white/10 rounded-[28px] p-8 space-y-4 max-w-xl mx-auto">
            <span className="text-5xl inline-block">🏟️</span>
            <h3 className="font-bold text-xl uppercase tracking-wider text-white">
              NO LIVE MATCHES RIGHT NOW
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              There are currently no open matches available in your area. Check back later or create/book your own match.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/venues"
                className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">stadium</span>
                EXPLORE VENUES
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((m) => {
              const joined = m.playersJoined || 0;
              const max = m.totalPlayers || 22;
              const ratio = joined / max;
              const isFull = joined >= max;

              const teamA = getTeamRoster(m.teamA);
              const teamB = getTeamRoster(m.teamB);
              const userInA = teamA.some((p: any) => p.id === user?.id);
              const userInB = teamB.some((p: any) => p.id === user?.id);
              const hasJoined = userInA || userInB;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className="bg-[#09090F]/70 border border-white/10 rounded-[22px] p-5 shadow-2xl hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative group text-left"
                >
                  <div>
                    {/* Badge and sports */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          m.sport === 'Cricket' ? 'bg-[#FF9933]/15 text-[#FF9933] border border-[#FF9933]/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {m.sport}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-600/15 text-indigo-300 border border-indigo-500/20">
                          {m.startTime.includes('10:00') ? 'AFTERNOON' : 'OPEN'}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{m.skillLevel || 'OPEN'}</span>
                    </div>

                    <h3 className="font-poppins font-black text-base text-white truncate uppercase tracking-wide group-hover:text-indigo-400 transition-colors">
                      {m.ground?.name || 'Local Turf Hub'}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 truncate font-light flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {m.ground?.location}
                    </p>

                    {/* Date/Time slots */}
                    <div className="flex items-center gap-3 mt-4 bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold">
                      <span className="flex items-center gap-1 text-gray-300">
                        <span className="material-symbols-outlined text-[14px] text-indigo-400">calendar_today</span>
                        {formatDateDisplay(m.date)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-300">
                        <span className="material-symbols-outlined text-[14px] text-indigo-400">schedule</span>
                        {m.startTime}
                      </span>
                    </div>

                    {/* Spots progress ledger */}
                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="text-gray-300">{joined} / {max} Joined</span>
                        <span className="text-indigo-300">
                          {isFull ? 'Roster Full' : `${max - joined} Spots Available`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-red-500' : ratio > 0.85 ? 'bg-[#FF9933]' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${ratio * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Foot action pricing */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Individual Fee</span>
                      <span className="text-sm font-black text-white uppercase">{m.entryFee === 0 ? 'Free' : `₹${m.entryFee}`}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasJoined) {
                          setSelectedMatch(m);
                        } else if (isFull) {
                          alert('Lobby is currently full. Capacity reached.');
                        } else if (!isAuthenticated) {
                          alert('Please login to book this live match.');
                          navigate('/login');
                        } else {
                          setPlayerBookingMatch(m);
                          setBookingStep(1);
                          setInvoiceResult(null);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        hasJoined
                          ? 'bg-indigo-600 text-white'
                          : isFull
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                          : 'bg-[#FF9933] hover:bg-[#e07f24] text-white shadow-md'
                      }`}
                    >
                      {hasJoined ? 'Manage Room' : isFull ? 'Lobby Full' : 'BOOK INDIVIDUAL PLAYER'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Selected Match Details View Drawer/Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-4xl w-full p-6 relative shadow-2xl animate-scale-in text-left max-h-[90vh] overflow-y-auto">
              
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setChatRoomMatchId(null);
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all scale-110 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                <div className="md:col-span-7 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-600/20 text-indigo-300 border border-indigo-500/25">
                        {selectedMatch.sport} Activity
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/25">
                        Match Status: {selectedMatch.status || 'Open'}
                      </span>
                    </div>
                    <h2 className="font-poppins font-black text-2xl uppercase tracking-wide mt-2 text-white">
                      {selectedMatch.ground?.name || 'Local Turf'}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1 font-light">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {selectedMatch.ground?.location}
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Schedule</span>
                      <span className="font-bold text-white block mt-0.5">{formatDateDisplay(selectedMatch.date)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Timings</span>
                      <span className="font-bold text-white block mt-0.5">{selectedMatch.startTime}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Entry Fee</span>
                      <span className="font-bold text-emerald-400 block mt-0.5">
                        {selectedMatch.entryFee === 0 ? 'FREE' : `₹${selectedMatch.entryFee} / player`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-indigo-300 block font-bold">Player Availability</span>
                      <span className="font-bold text-white text-sm">
                        {selectedMatch.totalPlayers - selectedMatch.playersJoined} spots available ({selectedMatch.playersJoined} / {selectedMatch.totalPlayers} joined)
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Individual Joining Only</span>
                  </div>

                  {/* Team rosters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                      <h4 className="font-poppins font-black text-[11px] uppercase tracking-wider text-[#FF9933] pb-2 border-b border-white/5">
                        🛡️ Team A
                      </h4>
                      <ul className="space-y-2 mt-3 text-xs text-gray-300">
                        {getTeamRoster(selectedMatch.teamA).length === 0 ? (
                          <li className="text-gray-500 text-[11px] italic">No players joined yet</li>
                        ) : (
                          getTeamRoster(selectedMatch.teamA).map((p: any, i: number) => (
                            <li key={p.id || i} className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px]">account_circle</span>
                              {p.firstName} {p.lastName}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                      <h4 className="font-poppins font-black text-[11px] uppercase tracking-wider text-emerald-400 pb-2 border-b border-white/5">
                        🛡️ Team B
                      </h4>
                      <ul className="space-y-2 mt-3 text-xs text-gray-300">
                        {getTeamRoster(selectedMatch.teamB).length === 0 ? (
                          <li className="text-gray-500 text-[11px] italic">No players joined yet</li>
                        ) : (
                          getTeamRoster(selectedMatch.teamB).map((p: any, i: number) => (
                            <li key={p.id || i} className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px]">account_circle</span>
                              {p.firstName} {p.lastName}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Leave or Join trigger button inside details */}
                  {(() => {
                    const teamA = getTeamRoster(selectedMatch.teamA);
                    const teamB = getTeamRoster(selectedMatch.teamB);
                    const isJoined = teamA.some((p: any) => p.id === user?.id) || teamB.some((p: any) => p.id === user?.id);
                    const isFull = selectedMatch.playersJoined >= selectedMatch.totalPlayers;

                    if (isJoined) {
                      return (
                        <button
                          onClick={() => handleLeaveMatch(selectedMatch.id)}
                          className="w-full py-3 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer text-center block transition-all"
                        >
                          Cancel Slot Booking
                        </button>
                      );
                    }

                    if (isFull) {
                      return (
                        <button
                          disabled
                          className="w-full py-3 bg-white/5 text-gray-500 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-wider text-center block cursor-not-allowed"
                        >
                          Lobby Full (22/22)
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            alert('Please login to book this live match.');
                            navigate('/login');
                            return;
                          }
                          const m = selectedMatch;
                          setSelectedMatch(null);
                          setPlayerBookingMatch(m);
                          setBookingStep(1);
                          setInvoiceResult(null);
                        }}
                        className="w-full py-3.5 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer text-center block transition-all shadow-lg"
                      >
                        BOOK INDIVIDUAL PLAYER
                      </button>
                    );
                  })()}
                </div>

                {/* Right panel chat rooms (Only for joined users!) */}
                <div className="md:col-span-5 bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[380px]">
                  {(() => {
                    const teamA = getTeamRoster(selectedMatch.teamA);
                    const teamB = getTeamRoster(selectedMatch.teamB);
                    const isJoined = teamA.some((p: any) => p.id === user?.id) || teamB.some((p: any) => p.id === user?.id);

                    if (!isJoined) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 space-y-2">
                          <span className="material-symbols-outlined text-3xl">lock</span>
                          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-400">Chat Room Locked</h5>
                          <p className="text-[10px] leading-relaxed">Join this playroom as an individual player to coordinate kits, positions and weather updates.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Playroom Chat</h5>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          </div>
                          
                          {/* Messages logs */}
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
                            {chatMessages.map((msg, i) => (
                              <div key={i} className="p-2.5 bg-white/5 border border-white/5 rounded-xl space-y-1">
                                <div className="flex justify-between text-[8px] font-black text-indigo-400">
                                  <span>{msg.sender}</span>
                                  <span className="text-gray-500">{msg.time}</span>
                                </div>
                                <p className="text-[11px] text-gray-200 leading-normal">{msg.msg}</p>
                              </div>
                            ))}
                            {isTyping && (
                              <p className="text-[9px] text-gray-500 italic animate-pulse">Someone is typing...</p>
                            )}
                          </div>
                        </div>

                        {/* Input form */}
                        <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-white/5 pt-3 mt-4">
                          <input
                            required
                            type="text"
                            placeholder="Type a message..."
                            value={typingMessage}
                            onChange={(e) => setTypingMessage(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                          </button>
                        </form>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Premium Join Match Flow Modal - INDIVIDUAL PLAYER ONLY */}
        {playerBookingMatch && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#09090F]/95 border border-white/10 rounded-[28px] max-w-2xl w-full p-6 md:p-8 relative shadow-2xl text-left backdrop-blur-xl my-8">
              
              <button
                onClick={() => setPlayerBookingMatch(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all scale-110 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

              {/* STEP 1: Individual Player Booking Overview */}
              {bookingStep === 1 && (
                <div>
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-[#FF9933]/15 border border-[#FF9933]/25 px-3 py-1 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"></span>
                      <span className="text-[9px] text-[#FF9933] font-bold uppercase tracking-widest">LIVE MATCH PARTICIPATION</span>
                    </div>
                    <h3 className="font-poppins font-black text-2xl uppercase tracking-wider text-white">
                      🏏 BOOK AS INDIVIDUAL PLAYER
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Join individually and get automatically assigned to a playing team for this official match.
                    </p>
                  </div>

                  <div className="bg-gradient-to-b from-[#0e0e1a]/80 to-[#07070f]/90 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-white/5">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 block font-bold">Venue</span>
                        <span className="font-bold text-white block mt-1">{playerBookingMatch.ground?.name}</span>
                        <span className="text-gray-400 text-[10px] block mt-0.5">{playerBookingMatch.ground?.location}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 block font-bold">Date & Slot</span>
                        <span className="font-bold text-white block mt-1">{playerBookingMatch.date}</span>
                        <span className="text-indigo-400 text-[10px] block mt-0.5">{playerBookingMatch.startTime}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Price</span>
                        <span className="text-emerald-400 font-bold text-sm block mt-0.5">₹{playerBookingMatch.entryFee}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Available Spots</span>
                        <span className="text-white font-bold text-sm block mt-0.5">{playerBookingMatch.totalPlayers - playerBookingMatch.playersJoined} / {playerBookingMatch.totalPlayers}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 block font-bold">Assignment</span>
                        <span className="text-indigo-400 font-bold text-sm block mt-0.5">Automatic</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl text-[11px] text-gray-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        <span>Individual Player Only</span>
                      </div>
                      <p className="text-gray-400 text-[10px] leading-relaxed">
                        This match is exclusively configured for individual player participation. No team or full-ground booking is accepted for this live room.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setBookingStep(3);
                      }}
                      className="w-full py-3.5 bg-[#FF9933] hover:bg-[#e07f24] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg mt-2"
                    >
                      PROCEED TO PAYMENT (₹{playerBookingMatch.entryFee})
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Booking Invoice Summary */}
              {bookingStep === 3 && (
                <div className="max-w-md mx-auto">
                  <h4 className="font-black text-sm uppercase tracking-wide text-white border-b border-white/5 pb-2 text-left mb-4">📄 Individual Player Invoice Summary</h4>
                  
                  <div className="bg-black/35 border border-white/5 rounded-2xl p-5 space-y-3 text-xs text-gray-400 text-left font-light">
                    <div className="flex justify-between">
                      <span>Venue:</span>
                      <span className="text-white font-bold">{playerBookingMatch.ground?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sport:</span>
                      <span className="text-white font-bold">{playerBookingMatch.sport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span className="text-white font-bold">{formatDateDisplay(playerBookingMatch.date)} ({playerBookingMatch.startTime})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Participation Type:</span>
                      <span className="text-indigo-400 font-bold uppercase tracking-wider">Individual Player</span>
                    </div>
                    
                    <div className="h-[1px] bg-white/5 w-full my-2"></div>
                    
                    <div className="flex justify-between">
                      <span>Base Entry Fee:</span>
                      <span className="text-white font-semibold">₹{playerBookingMatch.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span className="text-white font-semibold">₹{(playerBookingMatch.entryFee * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Booking Fee:</span>
                      <span className="text-white font-semibold">₹20.00</span>
                    </div>

                    {playerCouponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Coupon Discount Applied:</span>
                        <span>-₹{playerCouponDiscount}</span>
                      </div>
                    )}

                    <div className="h-[1px] bg-white/5 w-full my-2"></div>

                    <div className="flex justify-between text-sm font-black text-white">
                      <span>Total Amount:</span>
                      <span className="text-emerald-400">
                        ₹{Math.max(0, playerBookingMatch.entryFee * 1.18 + 20.00 - playerCouponDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="space-y-1 mt-4 text-left">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Apply Promo Coupon</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. BE11PLAY"
                        value={playerCouponCode}
                        onChange={(e) => setPlayerCouponCode(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none uppercase"
                      />
                      <button
                        type="button"
                        onClick={handlePlayerApplyCoupon}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Payment selection */}
                  <div className="space-y-2 mt-4 text-left">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'WALLET', label: 'Credits' },
                        { key: 'UPI', label: 'UPI PIN' },
                        { key: 'CARD', label: 'Card' }
                      ].map((m) => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setPaymentMethod(m.key as any)}
                          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-center border transition-all cursor-pointer ${
                            paymentMethod === m.key ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase text-gray-400 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlayerBookingSubmit}
                      disabled={checkoutLoading}
                      className="flex-1 py-3 bg-[#FF9933] hover:bg-[#e07f24] disabled:opacity-40 rounded-xl text-xs font-black uppercase text-white shadow-md cursor-pointer"
                    >
                      {checkoutLoading ? 'Processing...' : 'Confirm & Pay'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Success Screen */}
              {bookingStep === 5 && invoiceResult && (
                <div className="text-center space-y-6 py-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-poppins font-black text-xl uppercase tracking-wider text-white">Spot Confirmed!</h3>
                    <p className="text-gray-400 text-xs">
                      You're in! Your individual spot for {playerBookingMatch.ground?.name} on {formatDateDisplay(playerBookingMatch.date)}, {playerBookingMatch.startTime} is confirmed.
                    </p>
                  </div>

                  <div className="bg-black/35 border border-white/5 rounded-2xl p-4 text-xs space-y-2 text-left text-gray-400">
                    <div className="flex justify-between">
                      <span>Receipt Invoice:</span>
                      <span className="text-white font-bold">{invoiceResult.invoiceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction ID:</span>
                      <span className="text-white font-bold">{invoiceResult.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="text-emerald-400 font-bold">₹{invoiceResult.amountPaid.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPlayerBookingMatch(null);
                        setBookingStep(1);
                        fetchMatches();
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Done / Return to Live Matches
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Join Checkout Invoice Modal */}
        {checkoutMatch && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-md w-full p-8 relative shadow-2xl text-left">
              
              <button
                onClick={() => setCheckoutMatch(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all scale-110 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

              {!invoiceResult ? (
                <>
                  <h3 className="font-poppins font-black text-xl uppercase tracking-wider text-white mb-1">Confirm Slot</h3>
                  <p className="text-gray-400 text-xs mb-6">Review your ticket invoice details.</p>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    {/* Invoice ledger */}
                    <div className="bg-black/35 border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-gray-400 font-light">
                      <div className="flex justify-between">
                        <span>Base Slot Fee:</span>
                        <span className="text-white font-semibold">₹{checkoutMatch.entryFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span className="text-white font-semibold">₹{(checkoutMatch.entryFee * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Booking Fee:</span>
                        <span className="text-white font-semibold">₹20.00</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Discount Applied:</span>
                          <span>-₹{couponDiscount}</span>
                        </div>
                      )}
                      <div className="h-[1px] bg-white/5 w-full my-2"></div>
                      <div className="flex justify-between text-sm font-black text-white">
                        <span>Total Pay:</span>
                        <span className="text-emerald-400">₹{(checkoutMatch.entryFee * 1.18 + 20.00 - couponDiscount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Coupons input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Apply coupon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. BE11PLAY"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Payment methods selectors */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'WALLET', label: 'Credits' },
                          { key: 'UPI', label: 'UPI PIN' },
                          { key: 'CARD', label: 'Card' }
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setPaymentMethod(m.key as any)}
                            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-center border transition-all cursor-pointer ${
                              paymentMethod === m.key ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all mt-6 text-center"
                    >
                      {checkoutLoading ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-poppins font-black text-xl uppercase tracking-wider text-white">Payment Confirmed!</h3>
                    <p className="text-gray-400 text-xs">Slot reserved in playrooms lobby.</p>
                  </div>

                  <div className="bg-black/35 border border-white/5 rounded-2xl p-4 text-xs space-y-2 text-left text-gray-400">
                    <div className="flex justify-between">
                      <span>Receipt Invoice:</span>
                      <span className="text-white font-bold">{invoiceResult.invoiceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction ID:</span>
                      <span className="text-white font-bold">{invoiceResult.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Assigned:</span>
                      <span className="text-white font-bold">Team {invoiceResult.team}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debit Amount:</span>
                      <span className="text-emerald-400 font-bold">₹{invoiceResult.amountPaid.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutMatch(null);
                      setInvoiceResult(null);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Host Match Wizard Multi-Step Form */}
        {isHostOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090F] border border-white/10 rounded-[28px] max-w-md w-full p-8 relative shadow-2xl text-left">
              
              <button
                onClick={() => setIsHostOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all scale-110 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>

              {/* Progress step markers */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Step {wizardStep} of 4</span>
                  <h4 className="font-poppins font-black text-lg uppercase tracking-wide text-white">
                    {wizardStep === 1 && 'Sport & Ground'}
                    {wizardStep === 2 && 'Schedule Timings'}
                    {wizardStep === 3 && 'Rules & Fees'}
                    {wizardStep === 4 && 'Lobby Summary'}
                  </h4>
                </div>
                <div className="flex gap-1.5 bg-black/40 border border-white/5 px-3 py-1.5 rounded-full text-xs font-bold">
                  {[1, 2, 3, 4].map((s) => (
                    <span
                      key={s}
                      className={`w-2.5 h-2.5 rounded-full block border ${
                        wizardStep === s ? 'bg-indigo-500 border-indigo-400 shadow-lg' : 'bg-white/5 border-white/10'
                      }`}
                    ></span>
                  ))}
                </div>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Sport Type</label>
                    <select
                      value={hostSport}
                      onChange={(e) => setHostSport(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Badminton">Badminton</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Ground Venue</label>
                    <select
                      value={hostGroundId}
                      onChange={(e) => setHostGroundId(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                    >
                      {hostGrounds.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} (₹{g.pricePerHour}/hr)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setWizardStep(2)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-center cursor-pointer transition-all mt-4"
                  >
                    Next Step
                  </button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date Selection</label>
                    <input
                      type="date"
                      value={hostDate}
                      onChange={(e) => setHostDate(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Start Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 07:00 AM"
                        value={hostTime}
                        onChange={(e) => setHostTime(e.target.value)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</label>
                      <select
                        value={hostDuration}
                        onChange={(e) => setHostDuration(e.target.value)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                      >
                        <option value="1 Hour">1 Hour</option>
                        <option value="2 Hours">2 Hours</option>
                        <option value="3 Hours">3 Hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Max Players</label>
                      <input
                        type="number"
                        value={hostPlayers}
                        onChange={(e) => setHostPlayers(e.target.value)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entry Fee (₹)</label>
                      <input
                        type="number"
                        value={hostFee}
                        onChange={(e) => setHostFee(e.target.value)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Skill Level</label>
                    <select
                      value={hostSkill}
                      onChange={(e) => setHostSkill(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea
                      rows={3}
                      value={hostDesc}
                      onChange={(e) => setHostDesc(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl p-3 text-xs text-white resize-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(4)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase"
                    >
                      Summary
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4 text-xs">
                  <div className="bg-black/35 border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Sport:</span>
                      <span className="text-white font-bold">{hostSport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ground:</span>
                      <span className="text-white font-bold">{hostGrounds.find((g) => g.id === hostGroundId)?.name || 'Turf'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span className="text-white font-bold">{hostDate} @ {hostTime} ({hostDuration})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skill Level:</span>
                      <span className="text-white font-bold">{hostSkill}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Player limit:</span>
                      <span className="text-white font-bold">{hostPlayers} spots</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry charge:</span>
                      <span className="text-emerald-400 font-bold">₹{hostFee}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleHostPublish}
                      disabled={hostLoading}
                      className="flex-1 py-3 bg-[#FF9933] hover:bg-[#e07f24] rounded-xl text-xs font-bold uppercase text-white shadow-md active:scale-95"
                    >
                      {hostLoading ? 'Publishing...' : 'Publish Match'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LiveMatches;
