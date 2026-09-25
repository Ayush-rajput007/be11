import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

interface AnalyticsSummary {
  totalVisitors: number;
  anonymousVisitors: number;
  registeredVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  totalRegisteredUsers: number;
  totalBookings: number;
}

interface Conversions {
  visitorToRegistrationRate: number;
  registrationToBookingRate: number;
  visitorToBookingRate: number;
  visitorsWhoRegisteredCount: number;
  usersWhoBookedCount: number;
  visitorsWhoBookedCount: number;
}

interface TrendItem {
  date: string;
  label: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  bookings: number;
}

interface TopPage {
  path: string;
  views: number;
  percentage: number;
}

interface DeviceItem {
  type: string;
  count: number;
  percentage: number;
}

interface ReferrerItem {
  source: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  conversions: Conversions;
  trends: TrendItem[];
  topPages: TopPage[];
  deviceBreakdown: DeviceItem[];
  referrersBreakdown: ReferrerItem[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface RecentPageView {
  id: string;
  visitorId: string;
  path: string;
  referrer: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

type Period = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export const AdminAnalyticsView: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recentViews, setRecentViews] = useState<RecentPageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrendMetric, setActiveTrendMetric] = useState<'visitors' | 'sessions' | 'pageViews' | 'bookings'>('pageViews');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/analytics/overview?period=${period}`;
      if (period === 'custom') {
        url = `/admin/analytics/overview?startDate=${customStart}&endDate=${customEnd}`;
      }

      const [resOverview, resViews] = await Promise.all([
        api.get(url),
        api.get('/admin/analytics/pageviews?limit=25'),
      ]);

      setData(resOverview.data.data);
      setRecentViews(resViews.data.data.pageViews || []);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (period === 'custom') {
      fetchAnalytics();
    } else {
      setPeriod('custom');
    }
  };

  // Helper for trend chart scaling
  const maxTrendVal = data?.trends
    ? Math.max(...data.trends.map((t) => t[activeTrendMetric]), 5)
    : 10;

  return (
    <div className="space-y-6">
      {/* ─── Top Control Bar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#001a49] text-white material-symbols-outlined text-lg">
              query_stats
            </span>
            <h2 className="text-xl font-bold font-poppins text-primary">
              Anonymous Visitor &amp; Traffic Analytics
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time, first-party tracking of anonymous visitors, sessions, page views, and user conversion funnels.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-semibold">
            {(['today', 'yesterday', '7d', '30d', '90d', 'custom'] as Period[]).map((p) => {
              const labelMap: Record<Period, string> = {
                today: 'Today',
                yesterday: 'Yesterday',
                '7d': '7 Days',
                '30d': '30 Days',
                '90d': '90 Days',
                custom: 'Custom',
              };
              const isSelected = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#001a49] text-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-gray-100 text-primary hover:bg-gray-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Custom Date Form (if active) */}
      {period === 'custom' && (
        <form
          onSubmit={handleCustomApply}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-4 text-xs"
        >
          <span className="font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#FF8C1A]">calendar_today</span>
            Custom Range:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-gray-500 font-medium">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-[#f8fafc]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-500 font-medium">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-[#f8fafc]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#001a49] text-white font-bold rounded-lg hover:bg-opacity-90 cursor-pointer"
          >
            Apply Range
          </button>
        </form>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="py-24 bg-white rounded-3xl border border-gray-200 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-[#FF8C1A] animate-spin mb-3">
            progress_activity
          </span>
          <p className="text-xs font-semibold text-gray-500">Aggregating visitor analytics from database...</p>
        </div>
      ) : data ? (
        <>
          {/* ─── 1. Core Overview KPI Cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Visitors */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Total Visitors
                </span>
                <span className="material-symbols-outlined text-base text-blue-500">group</span>
              </div>
              <div className="text-2xl font-black text-primary font-poppins">
                {data.summary.totalVisitors.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Active browser IDs</p>
            </div>

            {/* Anonymous Visitors */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Anonymous
                </span>
                <span className="material-symbols-outlined text-base text-purple-500">visibility_off</span>
              </div>
              <div className="text-2xl font-black text-purple-600 font-poppins">
                {data.summary.anonymousVisitors.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Unregistered visitors</p>
            </div>

            {/* Registered Users */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Users
                </span>
                <span className="material-symbols-outlined text-base text-emerald-500">how_to_reg</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-poppins">
                {data.summary.totalRegisteredUsers.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Total registered accounts</p>
            </div>

            {/* Total Sessions */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Sessions
                </span>
                <span className="material-symbols-outlined text-base text-[#FF8C1A]">schedule</span>
              </div>
              <div className="text-2xl font-black text-[#FF8C1A] font-poppins">
                {data.summary.totalSessions.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">30m timeout sessions</p>
            </div>

            {/* Total Page Views */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Page Views
                </span>
                <span className="material-symbols-outlined text-base text-indigo-500">pageview</span>
              </div>
              <div className="text-2xl font-black text-indigo-600 font-poppins">
                {data.summary.totalPageViews.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Route navigation events</p>
            </div>

            {/* Total Bookings */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Bookings
                </span>
                <span className="material-symbols-outlined text-base text-green-600">sports_cricket</span>
              </div>
              <div className="text-2xl font-black text-green-600 font-poppins">
                {data.summary.totalBookings.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ground reservations</p>
            </div>
          </div>

          {/* ─── 2. Conversion Funnel ───────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8C1A]">filter_alt</span>
                  Visitor &amp; Customer Conversion Funnel
                </h3>
                <p className="text-xs text-gray-500">
                  Track how effectively anonymous visitors register as members and complete bookings.
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                100% Real Database Calculations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Visitor -> Registration */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Visitor → Registration</span>
                  <span className="text-lg font-black text-[#001a49] font-poppins">
                    {data.conversions.visitorToRegistrationRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-[#001a49] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.conversions.visitorToRegistrationRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Converted Visitors:</span>
                  <strong className="text-primary">{data.conversions.visitorsWhoRegisteredCount} / {data.summary.totalVisitors}</strong>
                </div>
              </div>

              {/* Registration -> Booking */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Registration → Booking</span>
                  <span className="text-lg font-black text-emerald-600 font-poppins">
                    {data.conversions.registrationToBookingRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.conversions.registrationToBookingRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Users Who Booked:</span>
                  <strong className="text-primary">{data.conversions.usersWhoBookedCount} / {data.summary.totalRegisteredUsers}</strong>
                </div>
              </div>

              {/* Visitor -> Booking */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Visitor → Booking (Overall)</span>
                  <span className="text-lg font-black text-[#FF8C1A] font-poppins">
                    {data.conversions.visitorToBookingRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FF9933] to-[#FF8C1A] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data.conversions.visitorToBookingRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>Visitors Who Booked:</span>
                  <strong className="text-primary">{data.conversions.visitorsWhoBookedCount} / {data.summary.totalVisitors}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. Traffic Trends Chart ────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">show_chart</span>
                  Traffic &amp; Activity Trends
                </h3>
                <p className="text-xs text-gray-500">
                  Daily progression of visitors, sessions, page views, and bookings over time.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-bold">
                {[
                  { id: 'pageViews', label: 'Page Views' },
                  { id: 'visitors', label: 'New Visitors' },
                  { id: 'sessions', label: 'Sessions' },
                  { id: 'bookings', label: 'Bookings' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveTrendMetric(m.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTrendMetric === m.id
                        ? 'bg-[#001a49] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Bar / Trend Chart */}
            <div className="pt-4">
              {data.trends.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">No trend points available for this period.</div>
              ) : (
                <div className="h-48 flex items-end gap-1 sm:gap-2 px-2 border-b border-gray-200 pb-2">
                  {data.trends.map((t, idx) => {
                    const val = t[activeTrendMetric];
                    const heightPercent = maxTrendVal > 0 ? (val / maxTrendVal) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-10 shadow-md">
                          <strong>{t.label}:</strong> {val} {activeTrendMetric}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            activeTrendMetric === 'pageViews'
                              ? 'bg-indigo-500 group-hover:bg-indigo-600'
                              : activeTrendMetric === 'visitors'
                              ? 'bg-blue-500 group-hover:bg-blue-600'
                              : activeTrendMetric === 'sessions'
                              ? 'bg-[#FF8C1A] group-hover:bg-[#FF9933]'
                              : 'bg-green-600 group-hover:bg-green-700'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Date Axis */}
              <div className="flex justify-between text-[10px] text-gray-400 pt-2 font-mono px-2">
                <span>{data.trends[0]?.label || ''}</span>
                {data.trends.length > 2 && (
                  <span>{data.trends[Math.floor(data.trends.length / 2)]?.label || ''}</span>
                )}
                <span>{data.trends[data.trends.length - 1]?.label || ''}</span>
              </div>
            </div>
          </div>

          {/* ─── 4. Two-Column Details (Visitor Breakdown & Devices) ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visitor Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">pie_chart</span>
                Visitor Composition
              </h3>

              <div className="space-y-4 pt-2">
                {/* Anonymous vs Registered */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                      Anonymous Visitors
                    </span>
                    <span className="text-primary font-bold">
                      {data.summary.anonymousVisitors} (
                      {data.summary.totalVisitors > 0
                        ? ((data.summary.anonymousVisitors / data.summary.totalVisitors) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{
                        width: `${
                          data.summary.totalVisitors > 0
                            ? (data.summary.anonymousVisitors / data.summary.totalVisitors) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Registered Visitors */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      Registered Visitors
                    </span>
                    <span className="text-primary font-bold">
                      {data.summary.registeredVisitors} (
                      {data.summary.totalVisitors > 0
                        ? ((data.summary.registeredVisitors / data.summary.totalVisitors) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${
                          data.summary.totalVisitors > 0
                            ? (data.summary.registeredVisitors / data.summary.totalVisitors) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* New vs Returning */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      New Visitors (First Seen in Period)
                    </span>
                    <span className="text-primary font-bold">{data.summary.newVisitors}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                      Returning Visitors
                    </span>
                    <span className="text-primary font-bold">{data.summary.returningVisitors}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">devices</span>
                Device Categories
              </h3>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {data.deviceBreakdown.map((d) => {
                  const iconMap: Record<string, string> = {
                    Desktop: 'computer',
                    Mobile: 'smartphone',
                    Tablet: 'tablet',
                  };
                  return (
                    <div key={d.type} className="p-4 rounded-2xl bg-[#f8fafc] border border-gray-200/80 text-center">
                      <span className="material-symbols-outlined text-2xl text-gray-500 mb-1">
                        {iconMap[d.type] || 'devices'}
                      </span>
                      <h4 className="text-xs font-bold text-primary">{d.type}</h4>
                      <div className="text-lg font-black text-[#001a49] font-poppins mt-1">{d.percentage}%</div>
                      <p className="text-[10px] text-gray-400">{d.count} sessions</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── 5. Top Visited Pages & Referrers ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Visited Pages */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8C1A]">trending_up</span>
                  Top Visited Pages
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Views / Share</span>
              </div>

              {data.topPages.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No page views recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.topPages.map((page, idx) => (
                    <div key={page.path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-gray-800 truncate max-w-[240px] sm:max-w-xs" title={page.path}>
                          <span className="text-gray-400 mr-2 font-bold">{idx + 1}.</span>
                          {page.path}
                        </span>
                        <div className="flex items-center gap-2">
                          <strong className="text-primary">{page.views}</strong>
                          <span className="text-gray-400 text-[10px]">({page.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[#FF8C1A] h-full rounded-full"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referrer Sources */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">link</span>
                  Referral Channels
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Traffic Sources</span>
              </div>

              {data.referrersBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No referrer sources recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.referrersBreakdown.map((r) => (
                    <div key={r.source} className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-gray-200/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-gray-400">public</span>
                        <span className="font-bold text-primary">{r.source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{r.count} sessions</span>
                        <span className="font-mono font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 text-[11px]">
                          {r.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── 6. Recent Page Views Stream (Audit) ─────────────────────── */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base font-poppins text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">history</span>
                  Live Page View Stream
                </h3>
                <p className="text-xs text-gray-500">
                  Chronological log of recent page views without exposing sensitive personal tokens or secrets.
                </p>
              </div>
              <span className="text-xs text-gray-400 font-mono">Last 25 Events</span>
            </div>

            {recentViews.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No recent page views logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Path</th>
                      <th className="py-2.5 px-3">Visitor ID</th>
                      <th className="py-2.5 px-3">User Status</th>
                      <th className="py-2.5 px-3">Referrer</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentViews.map((pv) => (
                      <tr key={pv.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-primary">{pv.path}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                          {pv.visitorId.slice(0, 8)}...{pv.visitorId.slice(-4)}
                        </td>
                        <td className="py-2.5 px-3">
                          {pv.user ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {pv.user.firstName} {pv.user.lastName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-semibold">
                              Anonymous
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 truncate max-w-[150px]">
                          {pv.referrer || 'Direct'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-400 text-[11px] whitespace-nowrap">
                          {new Date(pv.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
