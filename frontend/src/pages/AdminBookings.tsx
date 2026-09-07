import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { BookingDTO, AdminBookingStatsDTO, formatCurrency } from '@be11/shared';

export const AdminBookings: React.FC = () => {
  // Navigation tabs inside Venue Bookings Management
  const [viewTab, setViewTab] = useState<'all' | 'pending' | 'availability' | 'calendar'>('all');

  // Overview Metrics Stats
  const [stats, setStats] = useState<AdminBookingStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Bookings List State
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDatePreset, setSelectedDatePreset] = useState('ALL');
  const [selectedBookingType, setSelectedBookingType] = useState('ALL');
  const [selectedMatchPeriod, setSelectedMatchPeriod] = useState('ALL');
  const [customDate, setCustomDate] = useState('');

  // Modals State
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Venue Availability Inspector State
  const [availVenueId, setAvailVenueId] = useState('ab-cricket-ground');
  const [availDate, setAvailDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availData, setAvailData] = useState<any | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  // Calendar View State
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calSelectedDate, setCalSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch real database overview metrics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/bookings/stats');
      setStats(res.data.data.stats);
    } catch (err: any) {
      console.error('Failed to fetch booking stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch bookings list with active filters & pagination
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page,
        limit,
      };

      if (viewTab === 'pending') {
        params.status = 'PENDING';
      } else if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      if (selectedVenue !== 'ALL') params.venueId = selectedVenue;
      if (selectedBookingType !== 'ALL') params.bookingType = selectedBookingType;
      if (selectedMatchPeriod !== 'ALL') params.matchPeriod = selectedMatchPeriod;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      if (customDate) {
        params.date = customDate;
      } else if (selectedDatePreset !== 'ALL') {
        params.datePreset = selectedDatePreset;
      }

      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.data.bookings || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
      setTotalCount(res.data.data.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch admin bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings from server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Venue Availability
  const fetchAvailability = async () => {
    setAvailLoading(true);
    try {
      const res = await api.get(`/admin/venues/${availVenueId}/availability`, {
        params: { date: availDate },
      });
      setAvailData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (viewTab === 'all' || viewTab === 'pending' || viewTab === 'calendar') {
      fetchBookings();
    }
  }, [
    viewTab,
    page,
    selectedStatus,
    selectedVenue,
    selectedBookingType,
    selectedMatchPeriod,
    selectedDatePreset,
    customDate,
    debouncedSearch,
  ]);

  useEffect(() => {
    if (viewTab === 'availability') {
      fetchAvailability();
    }
  }, [viewTab, availVenueId, availDate]);

  // Handle Confirm Booking Action
  const handleConfirmSubmit = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/admin/bookings/${selectedBooking.id}/confirm`);
      setSuccessToast(`Booking ${selectedBooking.id.slice(0, 8)} successfully confirmed!`);
      setConfirmModalOpen(false);
      setDetailsModalOpen(false);
      fetchStats();
      fetchBookings();
    } catch (err: any) {
      console.error('Confirm error:', err);
      setError(err.response?.data?.message || 'Failed to confirm booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Booking Action
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionLoading(true);
    setError('');
    try {
      await api.patch(`/admin/bookings/${selectedBooking.id}/cancel`, {
        cancellationReason: cancellationReason.trim() || 'Cancelled by administrator',
      });
      setSuccessToast(`Booking ${selectedBooking.id.slice(0, 8)} successfully cancelled.`);
      setCancelModalOpen(false);
      setDetailsModalOpen(false);
      setCancellationReason('');
      fetchStats();
      fetchBookings();
    } catch (err: any) {
      console.error('Cancel error:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedVenue('ALL');
    setSelectedStatus('ALL');
    setSelectedDatePreset('ALL');
    setSelectedBookingType('ALL');
    setSelectedMatchPeriod('ALL');
    setCustomDate('');
    setPage(1);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = new Date(calYear, calMonth, 1).getDay();
  const startDayOffset = (firstDayOfWeekIndex + 6) % 7;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-surface-container-low text-left font-poppins">
      <div className="max-w-7xl mx-auto px-container-padding">

        {/* Success Toast */}
        {successToast && (
          <div className="fixed top-24 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span className="text-xs font-bold">{successToast}</span>
            <button onClick={() => setSuccessToast('')} className="ml-2 text-white/80 hover:text-white cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Header Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-outline font-bold uppercase tracking-wider mb-1">
              <Link to="/admin" className="hover:text-primary transition-colors">Admin Panel</Link>
              <span>/</span>
              <span className="text-secondary-container">Venue Bookings</span>
            </div>
            <h1 className="font-poppins font-black text-3xl text-primary flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#f97316] text-3xl">stadium</span>
              VENUE BOOKINGS
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage venue reservations, booking requests, real-time availability and cancellation audits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                fetchStats();
                fetchBookings();
              }}
              className="px-4 py-2.5 bg-white border border-outline-variant/30 hover:bg-slate-50 text-primary font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Refresh
            </button>
            <Link
              to="/admin"
              className="px-4 py-2.5 bg-[#0a2e6e] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 hover:bg-[#082252] cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              Analytics Dashboard
            </Link>
          </div>
        </div>

        {/* Top Summary Cards (Database Powered) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Total Bookings */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-outline-variant/30">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
              Total Bookings
            </span>
            <h3 className="font-poppins font-black text-2xl text-primary">
              {statsLoading ? '...' : stats?.totalBookings || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">All venues recorded</span>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-amber-200 bg-amber-50/20">
            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block mb-1">
              Pending Requests
            </span>
            <h3 className="font-poppins font-black text-2xl text-amber-600">
              {statsLoading ? '...' : stats?.pendingBookings || 0}
            </h3>
            <span className="text-[10px] text-amber-700/80 mt-1 block">Awaiting admin review</span>
          </div>

          {/* Confirmed */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-emerald-200 bg-emerald-50/20">
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block mb-1">
              Confirmed
            </span>
            <h3 className="font-poppins font-black text-2xl text-emerald-600">
              {statsLoading ? '...' : stats?.confirmedBookings || 0}
            </h3>
            <span className="text-[10px] text-emerald-700/80 mt-1 block">Active reservations</span>
          </div>

          {/* Cancelled */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-red-200 bg-red-50/20">
            <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block mb-1">
              Cancelled
            </span>
            <h3 className="font-poppins font-black text-2xl text-red-600">
              {statsLoading ? '...' : stats?.cancelledBookings || 0}
            </h3>
            <span className="text-[10px] text-red-700/80 mt-1 block">Preserved in history</span>
          </div>

          {/* Today's Bookings */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-outline-variant/30">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
              Today's Bookings
            </span>
            <h3 className="font-poppins font-black text-2xl text-[#0a2e6e]">
              {statsLoading ? '...' : stats?.todayBookings || 0}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Scheduled for today</span>
          </div>

          {/* Confirmed Revenue */}
          <div className="bg-white rounded-24 p-5 shadow-sm border border-outline-variant/30">
            <span className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
              Booked Value
            </span>
            <h3 className="font-poppins font-black text-xl text-[#ea580c] truncate">
              {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Confirmed match revenue</span>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex bg-[#EDF2F7] p-1.5 rounded-2xl w-full sm:w-fit mb-6 overflow-x-auto">
          <button
            onClick={() => setViewTab('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              viewTab === 'all' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">table_chart</span>
            All Bookings ({stats?.totalBookings || 0})
          </button>
          <button
            onClick={() => setViewTab('pending')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              viewTab === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">pending_actions</span>
            Booking Requests ({stats?.pendingBookings || 0})
          </button>
          <button
            onClick={() => setViewTab('availability')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              viewTab === 'availability' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">event_available</span>
            Venue Availability
          </button>
          <button
            onClick={() => setViewTab('calendar')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              viewTab === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Calendar View
          </button>
        </div>

        {/* VIEW TAB 1: ALL BOOKINGS & VIEW TAB 2: PENDING REQUESTS */}
        {(viewTab === 'all' || viewTab === 'pending') && (
          <div className="space-y-6">
            
            {/* Filter Controls Bar */}
            <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by ID, customer name, phone, email, or venue..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-primary focus:outline-none focus:border-[#0a2e6e]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Reset Filters button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  Reset Filters
                </button>
              </div>

              {/* Multi-criteria filter dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                {/* Venue filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Venue
                  </label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => {
                      setSelectedVenue(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value="ALL">All Venues</option>
                    <option value="rrr-cricket-club-kidawali-faridabad">RRR Cricket Club</option>
                    <option value="playnow-cricket-ground">Playnow Ground</option>
                    <option value="ab-cricket-ground">AB Cricket Ground</option>
                  </select>
                </div>

                {/* Status filter (only on 'all' tab) */}
                {viewTab === 'all' && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setPage(1);
                      }}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}

                {/* Date preset filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Date Range
                  </label>
                  <select
                    value={selectedDatePreset}
                    onChange={(e) => {
                      setSelectedDatePreset(e.target.value);
                      setCustomDate('');
                      setPage(1);
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>

                {/* Custom Date Input */}
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Custom Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setSelectedDatePreset('ALL');
                      setPage(1);
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-primary focus:outline-none"
                  />
                </div>

                {/* Booking Type Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Booking Type
                  </label>
                  <select
                    value={selectedBookingType}
                    onChange={(e) => {
                      setSelectedBookingType(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SINGLE_TEAM_OF_11">Single Team of 11</option>
                    <option value="WHOLE_GROUND">Whole Ground</option>
                  </select>
                </div>

                {/* Match Period Filter */}
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Match Period
                  </label>
                  <select
                    value={selectedMatchPeriod}
                    onChange={(e) => {
                      setSelectedMatchPeriod(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value="ALL">All Periods</option>
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="DAY_NIGHT">Day-Night</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bookings Table / Cards Container */}
            <div className="bg-white rounded-24 shadow-sm border border-outline-variant/30 overflow-hidden">
              
              {loading ? (
                <div className="py-20 text-center text-primary font-bold text-sm flex flex-col items-center gap-3">
                  <svg className="animate-spin h-7 w-7 text-[#0a2e6e]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Loading bookings from database...</span>
                </div>
              ) : bookings.length === 0 ? (
                /* Production Clean Empty State */
                <div className="py-16 text-center px-4 space-y-3">
                  <span className="material-symbols-outlined text-5xl text-secondary-container">event_busy</span>
                  <h3 className="font-poppins font-bold text-xl text-primary">
                    {viewTab === 'pending' ? 'NO PENDING REQUESTS' : 'NO BOOKINGS FOUND'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {viewTab === 'pending'
                      ? "You're all caught up! There are currently no venue booking requests awaiting admin action."
                      : "There are currently no venue reservations matching your selected filters."}
                  </p>
                  {(selectedStatus !== 'ALL' || selectedVenue !== 'ALL' || search) && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                /* Desktop Table & Mobile Cards */
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-slate-200 text-[10px] font-black uppercase text-outline tracking-wider">
                          <th className="py-3.5 px-4">Booking ID</th>
                          <th className="py-3.5 px-4">Customer</th>
                          <th className="py-3.5 px-4">Venue</th>
                          <th className="py-3.5 px-4">Date & Match</th>
                          <th className="py-3.5 px-4">Booking Type</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.map((b) => {
                          const customerDisplayName = b.customerName || `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim() || 'Guest Customer';
                          const customerPhone = b.customerPhone || b.customer?.phone || '—';

                          return (
                            <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* Booking ID */}
                              <td className="py-3 px-4 font-mono font-bold text-primary">
                                <span title={b.id}>BK-{b.id.slice(0, 8)}</span>
                              </td>

                              {/* Customer */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-primary">{customerDisplayName}</div>
                                <div className="text-[11px] text-slate-500">{customerPhone}</div>
                              </td>

                              {/* Venue */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-primary">{b.ground?.name || 'Venue'}</div>
                                <div className="text-[10px] text-slate-400">{b.ground?.location}</div>
                              </td>

                              {/* Date & Period */}
                              <td className="py-3 px-4">
                                <div className="font-semibold text-primary">{b.date}</div>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0a2e6e]">
                                  {b.matchPeriod || `${b.startTime} - ${b.endTime}`}
                                </span>
                              </td>

                              {/* Booking Type */}
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  b.bookingType === 'SINGLE_TEAM_OF_11' || b.bookingType === 'TEAM_OF_11'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {b.bookingType === 'SINGLE_TEAM_OF_11' || b.bookingType === 'TEAM_OF_11' ? 'Team of 11' : 'Whole Ground'}
                                </span>
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-4 font-bold text-[#ea580c]">
                                {formatCurrency(b.totalPrice)}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  b.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : b.status === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {b.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedBooking(b);
                                      setDetailsModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-primary font-bold text-[11px] cursor-pointer transition-all"
                                  >
                                    View
                                  </button>

                                  {b.status === 'PENDING' && (
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setConfirmModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer transition-all shadow-xs"
                                    >
                                      Confirm
                                    </button>
                                  )}

                                  {b.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setCancelModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 font-bold text-[11px] cursor-pointer transition-all"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} bookings
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-primary">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* VIEW TAB 3: VENUE AVAILABILITY INSPECTOR */}
        {viewTab === 'availability' && (
          <div className="space-y-6">
            <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 space-y-4">
              <h3 className="font-poppins font-bold text-lg text-primary">Venue Availability Inspector</h3>
              <p className="text-xs text-on-surface-variant">
                Check real-time match period availability and existing bookings for any date.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Select Venue
                  </label>
                  <select
                    value={availVenueId}
                    onChange={(e) => setAvailVenueId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value="ab-cricket-ground">AB Cricket Ground</option>
                    <option value="playnow-cricket-ground">Playnow Cricket Ground</option>
                    <option value="rrr-cricket-club-kidawali-faridabad">RRR Cricket Club Kidawali</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={availDate}
                    onChange={(e) => setAvailDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {availLoading ? (
              <div className="py-12 text-center text-primary font-bold text-sm">Inspecting venue periods...</div>
            ) : availData ? (
              <div className="space-y-4">
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-primary text-sm block">{availData.ground?.name}</strong>
                    <span className="text-slate-500">Owner: {availData.ground?.ownerName} ({availData.ground?.ownerPhone})</span>
                  </div>
                  <span className="font-bold text-[#0a2e6e] bg-blue-50 px-3 py-1 rounded-full">
                    {availData.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availData.availability?.map((p: any) => (
                    <div
                      key={p.periodId}
                      className={`p-5 rounded-24 border-2 transition-all flex flex-col justify-between ${
                        p.isAvailable
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-red-50/40 border-red-300'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-black text-sm text-primary">{p.periodName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.isAvailable ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{p.timeRange}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs">
                        {p.isAvailable ? (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Open for Booking
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-primary truncate">
                              Booked by: {p.booking?.customerName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Type: {p.booking?.bookingType} • ID: BK-{p.booking?.id?.slice(0, 6)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW TAB 4: CALENDAR VIEW */}
        {viewTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30">
              
              {/* Calendar Header Navigator */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-poppins font-black text-xl text-primary">
                    {monthNames[calMonth]} {calYear}
                  </h3>
                  <p className="text-xs text-slate-500">Click any date to inspect scheduled match reservations</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black uppercase text-outline">
                {dayNames.map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] bg-slate-50/50 rounded-xl"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = calSelectedDate === dateStr;
                  const dayBookings = bookings.filter((b) => b.date === dateStr);

                  return (
                    <div
                      key={dayNum}
                      onClick={() => setCalSelectedDate(dateStr)}
                      className={`min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0a2e6e] bg-blue-50/40 ring-2 ring-[#0a2e6e]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-bold text-xs text-primary">{dayNum}</span>

                      <div className="space-y-1 mt-1">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            ● {b.matchPeriod || 'Match'} ({b.ground?.name?.slice(0, 6)})
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <span className="text-[8px] font-bold text-slate-500">
                            +{dayBookings.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Summary Details */}
            {calSelectedDate && (
              <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 space-y-4">
                <h4 className="font-bold text-base text-primary">
                  Bookings for {calSelectedDate}
                </h4>

                {bookings.filter((b) => b.date === calSelectedDate).length === 0 ? (
                  <p className="text-xs text-slate-500">No reservations scheduled on this date.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bookings
                      .filter((b) => b.date === calSelectedDate)
                      .map((b) => (
                        <div key={b.id} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-primary block">{b.ground?.name}</strong>
                            <span className="text-slate-500">{b.matchPeriod} • {b.customerName || b.customer?.firstName}</span>
                          </div>
                          <span className="font-bold text-[#ea580c]">{formatCurrency(b.totalPrice)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: COMPLETE BOOKING DETAILS */}
        {detailsModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-24 max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-6 animate-fade-in my-8">
              
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-outline tracking-wider block mb-0.5">
                    BOOKING INFORMATION
                  </span>
                  <h3 className="font-poppins font-black text-xl text-primary font-mono">
                    BK-{selectedBooking.id}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedBooking.status === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedBooking.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Customer details */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-outline tracking-wider block">Customer Details</span>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <strong className="text-primary">{selectedBooking.customerName || `${selectedBooking.customer?.firstName} ${selectedBooking.customer?.lastName}`}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile:</span>
                    <strong className="text-primary">{selectedBooking.customerPhone || selectedBooking.customer?.phone || '—'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <strong className="text-primary">{selectedBooking.customerEmail || selectedBooking.customer?.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-[11px] text-slate-600">{selectedBooking.customerId}</span>
                  </div>
                </div>
              </div>

              {/* Venue details */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-outline tracking-wider block">Venue Details</span>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ground:</span>
                    <strong className="text-primary">{selectedBooking.ground?.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-700">{selectedBooking.ground?.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner:</span>
                    <strong className="text-primary">{selectedBooking.ground?.ownerName} ({selectedBooking.ground?.ownerPhone})</strong>
                  </div>
                </div>
              </div>

              {/* Match Details */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-outline tracking-wider block">Match Details</span>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-primary">{selectedBooking.date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Match Period:</span>
                    <strong className="text-[#0a2e6e]">{selectedBooking.matchPeriod || `${selectedBooking.startTime} - ${selectedBooking.endTime}`}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Type:</span>
                    <strong className="text-emerald-700">{selectedBooking.bookingType}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500 font-bold">Total Price:</span>
                    <strong className="text-[#ea580c] font-black text-sm">{formatCurrency(selectedBooking.totalPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-outline tracking-wider block">Audit Trail</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
                  <div>Created At: {new Date(selectedBooking.createdAt).toLocaleString()}</div>
                  {selectedBooking.confirmedAt && (
                    <div className="text-emerald-700 font-semibold">
                      Confirmed At: {new Date(selectedBooking.confirmedAt).toLocaleString()} by Admin ({selectedBooking.confirmedBy?.firstName || selectedBooking.confirmedById})
                    </div>
                  )}
                  {selectedBooking.cancelledAt && (
                    <div className="text-red-700 font-semibold">
                      Cancelled At: {new Date(selectedBooking.cancelledAt).toLocaleString()} by Admin ({selectedBooking.cancelledBy?.firstName || selectedBooking.cancelledById})
                      {selectedBooking.cancellationReason && (
                        <div className="text-slate-700 mt-0.5">Reason: "{selectedBooking.cancellationReason}"</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>

                <div className="flex gap-2">
                  {selectedBooking.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        setConfirmModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase cursor-pointer shadow-sm"
                    >
                      Confirm Booking
                    </button>
                  )}

                  {selectedBooking.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        setCancelModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-red-300 hover:bg-red-50 text-red-700 font-bold text-xs uppercase cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: CONFIRM BOOKING DIALOG */}
        {confirmModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-24 max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 text-emerald-700">
                <span className="material-symbols-outlined text-3xl">verified</span>
                <h3 className="font-poppins font-black text-xl text-primary">CONFIRM BOOKING?</h3>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div><span className="text-slate-500">Venue:</span> <strong>{selectedBooking.ground?.name}</strong></div>
                <div><span className="text-slate-500">Date:</span> <strong>{selectedBooking.date}</strong></div>
                <div><span className="text-slate-500">Period:</span> <strong>{selectedBooking.matchPeriod}</strong></div>
                <div><span className="text-slate-500">Customer:</span> <strong>{selectedBooking.customerName || selectedBooking.customer?.firstName}</strong></div>
                <div><span className="text-slate-500">Amount:</span> <strong className="text-[#ea580c]">{formatCurrency(selectedBooking.totalPrice)}</strong></div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to confirm this booking? The slot will be reserved and the customer will receive an official confirmation.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-2"
                >
                  {actionLoading ? 'Confirming...' : 'CONFIRM BOOKING'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CANCEL BOOKING DIALOG */}
        {cancelModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleCancelSubmit} className="bg-white rounded-24 max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined text-3xl">cancel</span>
                <h3 className="font-poppins font-black text-xl text-primary">CANCEL BOOKING?</h3>
              </div>

              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>Venue: <strong>{selectedBooking.ground?.name}</strong></div>
                <div>Date: <strong>{selectedBooking.date}</strong> ({selectedBooking.matchPeriod})</div>
                <div>Customer: <strong>{selectedBooking.customerName || selectedBooking.customer?.firstName}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Customer requested refund / Unplayable pitch condition..."
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500 font-body-md"
                ></textarea>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                The booking record will remain in history as CANCELLED with reason and admin timestamp.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-50 cursor-pointer"
                >
                  KEEP BOOKING
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Cancelling...' : 'CANCEL BOOKING'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
export default AdminBookings;
