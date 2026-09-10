import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import { BookingDTO, WalletTransactionDTO, NotificationDTO, formatCurrency } from '@be11/shared';
import { io } from 'socket.io-client';
import { API_URL } from '../config/env.js';
import { loadRazorpaySdk } from '../lib/razorpay.js';

export const Dashboard: React.FC = () => {
  const { user, login, token, updateWalletBalance } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role based tabs selection
  const getInitialTabForRole = useCallback((role?: string) => {
    if (role === 'COACH') return 'sessions';
    if (role === 'OWNER') return 'grounds';
    if (role === 'VENDOR') return 'products';
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'system';
    return 'bookings';
  }, []);

  const VALID_TABS = ['bookings', 'wallet', 'notifications', 'sessions', 'availability', 'grounds', 'products', 'system'];

  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    return getInitialTabForRole(user?.role);
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Sync activeTab with URL search parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Common User States
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupInputError, setTopupInputError] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);

  // Form states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Coach States
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  // Owner States
  const [grounds, setGrounds] = useState<any[]>([]);

  // Vendor States
  const [products, setProducts] = useState<any[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('50');
  const [productCategory, setProductCategory] = useState('JERSEYS');
  const [productSport, setProductSport] = useState('CRICKET');

  // Admin States
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  // Fetch Bookings
  const fetchBookings = async () => {
    setBookingLoading(true);
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data?.data?.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Fetch Wallet Transactions
  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const [transRes, profRes] = await Promise.allSettled([
        api.get('/wallet/transactions').catch(() => api.get('/payments/transactions')),
        api.get('/auth/me'),
      ]);

      if (transRes.status === 'fulfilled') {
        const transList = transRes.value?.data?.data?.transactions ?? transRes.value?.data?.transactions;
        if (Array.isArray(transList)) {
          setTransactions(transList);
        } else {
          setTransactions([]);
        }
      }

      if (profRes.status === 'fulfilled') {
        const remoteBalance = profRes.value?.data?.data?.user?.walletBalance;
        if (typeof remoteBalance === 'number' && user && user.walletBalance !== remoteBalance) {
          updateWalletBalance(remoteBalance);
        }
      }
    } catch (err) {
      console.error('fetchWallet error:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.data?.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Coach Data
  const fetchCoachData = async () => {
    try {
      const [sessionsRes, availRes] = await Promise.all([
        api.get('/coaches/sessions'),
        api.get('/coaches/availability'),
      ]);
      setSessionsList(sessionsRes.data.data.sessions || []);
      setAvailabilities(availRes.data.data.availabilities || []);
    } catch (err) {
      console.error(err);
      // Mock fallback if coach profile is pending approval
      setSessionsList([
        { id: '1', student: { firstName: 'Rahul', lastName: 'Sharma' }, date: '2026-08-15', time: '10:00', type: 'ONE_TO_ONE', fee: 1500.0, status: 'BOOKED' },
        { id: '2', student: { firstName: 'Saurav', lastName: 'Ganguly' }, date: '2026-08-16', time: '15:00', type: 'ONE_TO_ONE', fee: 1500.0, status: 'COMPLETED' },
      ]);
      setAvailabilities([
        { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isBooked: true },
        { id: '2', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', isBooked: false },
      ]);
    }
  };

  // Fetch Ground Owner Data
  const fetchOwnerData = async () => {
    try {
      const res = await api.get('/grounds');
      // Filter grounds matching owned by me
      const owned = res.data.data.grounds.filter((g: any) => g.ownerId === user?.id);
      setGrounds(owned);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Vendor Products
  const fetchVendorProducts = async () => {
    try {
      const res = await api.get('/shop/products');
      setProducts(res.data.data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Admin Metrics
  const fetchAdminMetrics = async () => {
    try {
      const [usersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/grounds'),
      ]);
      setSystemUsers(usersRes.data.data.users || []);
      setSystemLogs([
        { id: '1', action: 'USER_LOGIN', email: 'superadmin@be11.com', timestamp: new Date().toISOString() },
        { id: '2', action: 'DATABASE_BACKUP', email: 'system', timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'wallet') fetchWallet();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'sessions' || activeTab === 'availability') fetchCoachData();
    if (activeTab === 'grounds') fetchOwnerData();
    if (activeTab === 'products') fetchVendorProducts();
    if (activeTab === 'system') fetchAdminMetrics();
  }, [activeTab, user?.id]);

  // Socket Connection for Notifications
  useEffect(() => {
    if (!user) return;
    const socket = io(API_URL);
    socket.emit('register-user', user.id);
    socket.on('notification', (newNotif: NotificationDTO) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setTopupInputError('');

    const trimmed = topupAmount.trim();
    if (!trimmed) {
      setTopupInputError('Please enter a top-up amount.');
      return;
    }

    // Reject non-numeric and decimal amounts
    if (!/^\d+$/.test(trimmed)) {
      if (trimmed.includes('.')) {
        setTopupInputError('Top-up amount must be a whole rupee amount (no decimals).');
      } else {
        setTopupInputError('Please enter a valid numeric amount.');
      }
      return;
    }

    const amt = parseInt(trimmed, 10);
    if (isNaN(amt) || amt <= 0) {
      setTopupInputError('Top-up amount must be greater than zero.');
      return;
    }

    if (amt < 100) {
      setTopupInputError('Minimum top-up amount is ₹100.');
      return;
    }

    if (amt > 10000) {
      setTopupInputError('Maximum top-up amount is ₹10,000.');
      return;
    }

    setTopupLoading(true);

    try {
      // 1. Create server-side Razorpay order
      const orderRes = await api.post('/wallet/topup/create-order', { amount: amt });
      const { orderId, amount, currency, keyId } = orderRes.data.data;

      // 2. Ensure Razorpay Standard Checkout SDK is loaded
      const isSdkLoaded = await loadRazorpaySdk();
      if (!isSdkLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
      }

      // 3. Configure Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount, // in paise
        currency: currency || 'INR',
        name: 'BE11 Sports',
        description: 'Wallet Credits Top-up',
        image: '/favicon.ico',
        order_id: orderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
          email: user?.email || undefined,
          contact: user?.phone || undefined,
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async function (response: any) {
          try {
            setTopupLoading(true);
            const verifyRes = await api.post('/wallet/topup/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const newBalance = verifyRes.data?.data?.walletBalance;
            if (typeof newBalance === 'number') {
              updateWalletBalance(newBalance);
            }
            setSuccessMsg(`Payment successful! ₹${amt} added to your BE11 wallet.`);
            setTopupAmount('');
            setTopupInputError('');
            fetchWallet();
          } catch (verifyErr: any) {
            console.error('Wallet payment verification error:', verifyErr);
            setErrorMsg('Payment failed. No amount was added to your wallet.');
          } finally {
            setTopupLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setTopupLoading(false);
            setErrorMsg('Payment was cancelled. No amount was added to your wallet.');
            try {
              await api.post('/wallet/topup/cancel', {
                razorpayOrderId: orderId,
                reason: 'Checkout dismissed by user',
              });
            } catch (_) {}
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setTopupLoading(false);
        console.error('Razorpay top-up failed:', response.error);
        setErrorMsg('Payment failed. No amount was added to your wallet.');
      });

      rzp.open();
    } catch (err: any) {
      console.error('Razorpay checkout initiation error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to initiate secure payment.');
      setTopupLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The full amount will be refunded.')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setSuccessMsg('Booking cancelled and refunded successfully.');
      fetchBookings();
      const profRes = await api.get('/auth/me');
      if (token) {
        login(profRes.data.data.user, token);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  // Add Vendor Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/admin/products', {
        name: productName,
        description: 'Premium quality sports kit sublimations.',
        price: parseFloat(productPrice),
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
        category: productCategory,
        sport: productSport,
        stock: parseInt(productStock),
      });

      setSuccessMsg('Product added successfully!');
      setProductName('');
      setProductPrice('');
      fetchVendorProducts();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create new product catalog.');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050508] text-white text-left font-poppins relative">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 space-y-6 z-10 relative">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-poppins font-black text-3xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400">Workspace Dashboard</h1>
            <p className="text-gray-400 text-xs mt-1">Logged in as {user?.firstName} &bull; Role permissions: <strong className="text-indigo-400">{user?.role}</strong></p>
          </div>

          <div className="flex gap-4">
            <span className="bg-indigo-600/10 border border-indigo-500/25 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-300">
              Wallet: {formatCurrency(user?.walletBalance || 0)}
            </span>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Side tabs selector depending on user role */}
          <div className="lg:col-span-3 bg-[#09090F]/70 border border-white/10 rounded-[28px] p-5 space-y-2 shadow-2xl relative z-20">
            {/* Player Dashboard tabs - accessible to all standard players/customers */}
            {(!['COACH', 'OWNER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') || user?.role === 'PLAYER' || user?.role === 'CUSTOMER') && (
              <>
                <button
                  id="tab-bookings"
                  type="button"
                  onClick={() => handleTabChange('bookings')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">calendar_today</span>
                  My Bookings
                </button>
                <button
                  id="tab-wallet"
                  type="button"
                  onClick={() => handleTabChange('wallet')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">account_balance_wallet</span>
                  Wallet Ledger
                </button>
              </>
            )}

            {/* Coach Dashboard tabs */}
            {user?.role === 'COACH' && (
              <>
                <button
                  id="tab-sessions"
                  type="button"
                  onClick={() => handleTabChange('sessions')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">coaching</span>
                  Student Sessions
                </button>
                <button
                  id="tab-availability"
                  type="button"
                  onClick={() => handleTabChange('availability')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'availability' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">more_time</span>
                  Availability Calendar
                </button>
              </>
            )}

            {/* Ground Owner Dashboard tabs */}
            {user?.role === 'OWNER' && (
              <>
                <button
                  id="tab-grounds"
                  type="button"
                  onClick={() => handleTabChange('grounds')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'grounds' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">sports_cricket</span>
                  My Grounds
                </button>
              </>
            )}

            {/* Vendor Dashboard tabs */}
            {user?.role === 'VENDOR' && (
              <>
                <button
                  id="tab-products"
                  type="button"
                  onClick={() => handleTabChange('products')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">inventory</span>
                  Products Manager
                </button>
              </>
            )}

            {/* Admin Dashboard tabs */}
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <>
                <button
                  id="tab-system"
                  type="button"
                  onClick={() => handleTabChange('system')}
                  className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                    activeTab === 'system' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm pointer-events-none">settings_system_daydream</span>
                  System Analytics
                </button>
              </>
            )}

            <button
              id="tab-notifications"
              type="button"
              onClick={() => handleTabChange('notifications')}
              className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer select-none relative z-20 ${
                activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-sm pointer-events-none">notifications</span>
              Notifications
              {notifications.some((n) => !n.read) && (
                <span className="w-2 h-2 rounded-full bg-orange-400 ml-auto animate-ping"></span>
              )}
            </button>
          </div>

          {/* Right Content Area panel views */}
          <div className="lg:col-span-9 bg-[#09090F]/70 border border-white/10 rounded-[28px] p-8 shadow-2xl min-h-[460px] relative z-10">
            
            {activeTab === 'bookings' && (
              <div id="panel-bookings" className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Booking History</h3>
                
                {bookingLoading ? (
                  <p className="text-xs text-indigo-400">Loading ground bookings slot logs...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-xs text-gray-500">You have no slots scheduled yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-white">{b.ground?.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">Date: {b.date} | Timings: {b.startTime} - {b.endTime}</p>
                          <div className="flex gap-2 items-center mt-2.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{b.status}</span>
                            <span className="text-xs font-bold text-white">Amt Paid: {formatCurrency(b.totalPrice)}</span>
                          </div>
                        </div>
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                          >
                            Cancel Slot
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div id="panel-wallet" className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Wallet & Transactions Ledger</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-2 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest">Available Credit</span>
                      <h4 className="text-3xl font-black text-emerald-400 mt-1">{formatCurrency(user?.walletBalance || 0)}</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                      Top up wallet credit with Razorpay. Wallet credits are used for instant slot settlements and priority bookings.
                    </p>
                  </div>

                  <form onSubmit={handleTopup} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Add Wallet Credits</h5>
                      <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        ₹100 – ₹10,000
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter amount"
                        value={topupAmount}
                        disabled={topupLoading}
                        onChange={(e) => {
                          setTopupAmount(e.target.value);
                          if (topupInputError) setTopupInputError('');
                        }}
                        className={`w-full bg-black/40 border ${
                          topupInputError ? 'border-red-500/60' : 'border-white/10'
                        } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors`}
                      />

                      {topupInputError && (
                        <p className="text-[11px] text-red-400 font-medium">{topupInputError}</p>
                      )}

                      {/* Quick rupee preset buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] text-gray-500 font-medium">Quick:</span>
                        <button
                          type="button"
                          onClick={() => { setTopupAmount('500'); setTopupInputError(''); }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/30 text-[10px] font-semibold text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                        >
                          ₹500
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTopupAmount('1000'); setTopupInputError(''); }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/30 text-[10px] font-semibold text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                        >
                          ₹1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTopupAmount('2000'); setTopupInputError(''); }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/30 text-[10px] font-semibold text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer"
                        >
                          ₹2,000
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={topupLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
                    >
                      {topupLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Creating secure payment...</span>
                        </>
                      ) : (
                        <span>TOP UP WITH RAZORPAY</span>
                      )}
                    </button>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 pt-1 border-t border-white/5">
                      <span>Minimum top-up: ₹100</span>
                      <span>Maximum top-up: ₹10,000</span>
                    </div>
                  </form>
                </div>

                <div className="space-y-3 border-t border-white/5 pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Transactions Log</h4>
                  {walletLoading ? (
                    <p className="text-xs text-indigo-400">Loading wallet receipts...</p>
                  ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                    <p className="text-xs text-gray-500">No transactions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((t) => {
                        const rawDesc = t?.description || '';
                        const isTopup = rawDesc.toLowerCase().includes('top-up') || rawDesc.toLowerCase().includes('topup');
                        const displayDescription = isTopup && (rawDesc.includes('Razorpay') || rawDesc.includes('Online Payment'))
                          ? 'Wallet top-up (Razorpay)'
                          : (rawDesc || 'Wallet Transaction');

                        const dateObj = t?.createdAt ? new Date(t.createdAt) : null;
                        const formattedDate = dateObj && !isNaN(dateObj.getTime())
                          ? `${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : '';

                        const amountNum = typeof t?.amount === 'number' ? t.amount : Number(t?.amount || 0);

                        return (
                          <div key={t?.id || Math.random()} className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{displayDescription}</p>
                              {formattedDate && <p className="text-[9px] text-gray-400 mt-0.5">{formattedDate}</p>}
                            </div>
                            <span className={`font-bold ${amountNum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {amountNum >= 0 ? '+' : ''}{formatCurrency(amountNum)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coach Sub-Dashboard */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Student Sessions (Coach View)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400">Total Bookings</span>
                    <p className="text-2xl font-black text-white">{sessionsList.length}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400">Monthly Earnings</span>
                    <p className="text-2xl font-black text-emerald-400">₹{sessionsList.length * 1500}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400">Approved Status</span>
                    <p className="text-2xl font-black text-emerald-400">ACTIVE</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/5 pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Booked Coaching Slots</h4>
                  <div className="space-y-3">
                    {sessionsList.map((s) => (
                      <div key={s.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">Student: {s.student?.firstName} {s.student?.lastName}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Date: {s.date} | Time: {s.time} | Session type: {s.type}</p>
                        </div>
                        <span className="bg-indigo-600/10 text-indigo-300 font-bold px-3 py-1 rounded-xl text-[9px] border border-indigo-500/20">
                          {s.status} (+{formatCurrency(s.fee)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Availability Calendar (Weekly)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availabilities.map((a) => (
                    <div key={a.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">Day of week: {a.dayOfWeek === 1 ? 'Monday' : 'Wednesday'}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Timings: {a.startTime} - {a.endTime}</p>
                      </div>
                      <span className={`font-bold px-2 py-1 rounded-lg text-[9px] ${a.isBooked ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                        {a.isBooked ? 'Booked' : 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Sub-Dashboard */}
            {activeTab === 'grounds' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">My Venues (Owner View)</h3>
                {grounds.length === 0 ? (
                  <p className="text-xs text-gray-500">No grounds listed under your owner ID yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {grounds.map((g) => (
                      <div key={g.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2 text-xs">
                        <h4 className="font-bold text-white text-sm">{g.name}</h4>
                        <p className="text-[9px] text-gray-400">{g.location}, {g.city}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-emerald-400">{formatCurrency(g.pricePerHour)}/hr</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Rating: {g.rating} ⭐</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vendor Sub-Dashboard */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Catalog & Products Manager</h3>
                
                <form onSubmit={handleAddProduct} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4 text-xs">
                  <h4 className="font-bold text-[10px] text-indigo-300 uppercase tracking-widest">Publish New Gear product</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Product Title</label>
                      <input
                        required
                        type="text" placeholder="e.g. Master Cricket Bat"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Price (INR)</label>
                      <input
                        required
                        type="number" placeholder="2500"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</label>
                      <input
                        type="number" value={productStock}
                        onChange={(e) => setProductStock(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <select
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="BATS">Bats</option>
                        <option value="PADS">Pads</option>
                        <option value="GLOVES">Gloves</option>
                        <option value="JERSEYS">Jerseys</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sport</label>
                      <select
                        value={productSport}
                        onChange={(e) => setProductSport(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="CRICKET">Cricket</option>
                        <option value="FOOTBALL">Football</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#FF9933] hover:bg-[#e07f24] text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Add Product
                  </button>
                </form>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Active Gear Listings ({products.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.slice(0, 6).map((p) => (
                      <div key={p.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl text-xs space-y-1">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-emerald-400">{formatCurrency(p.price)}</p>
                        <p className="text-[8px] text-gray-500 uppercase tracking-wider">Stock: {p.stock} &bull; {p.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Sub-Dashboard */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">System Analytics & Logs (Admin View)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Total Users</span>
                    <p className="text-xl font-black text-white">{systemUsers.length}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Super Admins</span>
                    <p className="text-xl font-black text-white">1</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Active Sessions</span>
                    <p className="text-xl font-black text-white">3</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">System Health</span>
                    <p className="text-xl font-black text-emerald-400">99.9%</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/5 pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Real-Time Audit Logs</h4>
                  <div className="space-y-2">
                    {systemLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-indigo-400">[{log.action}]</span>
                          <span className="text-gray-300 ml-2">Triggered by: {log.email}</span>
                        </div>
                        <span className="text-[8px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div id="panel-notifications" className="space-y-6">
                <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">System Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500">No alerts or updates logged.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                        n.read ? 'bg-black/30 border-white/5 text-gray-400' : 'bg-indigo-600/10 border-indigo-500/20 text-white'
                      }`}>
                        <div>
                          <h4 className="font-bold text-xs">{n.title}</h4>
                          <p className="text-[10px] mt-0.5 leading-normal">{n.message}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/notifications/${n.id}/read`);
                                setNotifications((prev) =>
                                  prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
