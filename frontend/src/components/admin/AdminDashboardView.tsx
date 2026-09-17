import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@be11/shared';
import { AdminTab } from './AdminLayout.js';
import { api } from '../../lib/api.js';

interface AdminDashboardViewProps {
  data?: any;
  loading?: boolean;
  onTabChange?: (tab: AdminTab) => void;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  data: propData,
  loading: propLoading,
  onTabChange,
  onNavigateTab,
}) => {
  const [internalData, setInternalData] = useState<any>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  const navigateTab = (tab: AdminTab) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    if (!propData) {
      const fetchDashboardData = async () => {
        setInternalLoading(true);
        try {
          const res = await api.get('/admin/dashboard');
          setInternalData(res.data.data);
        } catch (err: any) {
          console.error('Failed to fetch admin dashboard:', err);
        } finally {
          setInternalLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [propData]);

  const data = propData || internalData;
  const loading = propLoading !== undefined ? propLoading : internalLoading;
  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-[#FF8C1A] animate-spin">sync</span>
        <p className="text-xs text-slate-500 font-medium">Loading real-time database metrics...</p>
      </div>
    );
  }

  const b = data?.bookings || {};
  const p = data?.payments || {};
  const r = data?.revenue || {};
  const u = data?.users || {};
  const m = data?.matches || {};
  const v = data?.venues || {};

  return (
    <div className="space-y-8">
      {/* ─── Hero Overview Card ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#001a49] to-[#002b7a] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#FF8C1A]/20 border border-[#FF8C1A]/40 text-[#FF8C1A] text-[11px] font-bold uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-xs text-slate-300">Live Production Database</span>
          </div>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">
            Welcome to BE11 Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor real-time reservations, payment settlements, live match lobbies, and ground availability across all NCR facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => navigateTab('matches')}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF8C1A] to-[#FF9933] text-white text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add Live Match
          </button>
          <button
            type="button"
            onClick={() => navigateTab('bookings')}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            All Bookings
          </button>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-[#FF8C1A]/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ─── Top KPI Metric Cards Grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Total Bookings</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">book_online</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-slate-900">{b.total || 0}</div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span className="text-emerald-600 font-semibold">{b.confirmed || 0} confirmed</span>
            <span className="text-amber-600 font-semibold">{b.pending || 0} pending</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Confirmed Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">currency_rupee</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-emerald-600">
            {formatCurrency(r.total || 0)}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Today: {formatCurrency(r.today || 0)}</span>
            <span className="font-semibold text-slate-700">Month: {formatCurrency(r.thisMonth || 0)}</span>
          </div>
        </div>

        {/* Pending Action Required */}
        <div
          onClick={() => navigateTab('bookings')}
          className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-2 cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-bold uppercase">Pending Bookings</span>
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">pending_actions</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-amber-600">{b.pending || 0}</div>
          <div className="text-[10px] text-amber-700 font-semibold">
            {b.pending > 0 ? 'Requires admin confirmation' : 'All reservations up to date'}
          </div>
        </div>

        {/* Live Matches */}
        <div
          onClick={() => navigateTab('matches')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-[#FF8C1A] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Live Matches</span>
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF8C1A] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">sports_cricket</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-slate-900">{m.active || 0}</div>
          <div className="text-[10px] text-slate-500">
            <span>Total scheduled: {m.total || 0}</span>
          </div>
        </div>

        {/* Total Payments */}
        <div
          onClick={() => navigateTab('payments')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Settled Payments</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-slate-900">{p.successful || 0}</div>
          <div className="text-[10px] text-slate-500">
            <span>{p.refunded || 0} refunded / cancelled</span>
          </div>
        </div>

        {/* Registered Users */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Registered Users</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">group</span>
            </span>
          </div>
          <div className="text-2xl font-poppins font-black text-slate-900">{u.total || 0}</div>
          <div className="text-[10px] text-slate-500">
            <span>Across {v.total || 3} official grounds</span>
          </div>
        </div>
      </div>

      {/* ─── 2-Column Main Section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF8C1A]">calendar_today</span>
                Recent Venue Reservations
              </h3>
              <p className="text-xs text-slate-500">Directly from the BE11 booking ledger</p>
            </div>
            <button
              onClick={() => navigateTab('bookings')}
              className="text-xs font-bold text-[#FF8C1A] hover:underline flex items-center gap-1"
            >
              View All ({b.total || 0}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Booking ID</th>
                  <th className="pb-3 px-4">Customer</th>
                  <th className="pb-3 px-4">Venue</th>
                  <th className="pb-3 px-4">Date & Time</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!data?.recentBookings || data.recentBookings.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No recent bookings found in database.
                    </td>
                  </tr>
                ) : (
                  data.recentBookings.map((bk: any) => (
                    <tr key={bk.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-slate-700">
                        #{bk.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{bk.customerName}</div>
                        <div className="text-[10px] text-slate-400">{bk.customerPhone || bk.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {bk.groundName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{bk.date}</div>
                        <div className="text-[10px] text-slate-400">{bk.matchPeriod || bk.startTime}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(bk.totalPrice)}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            bk.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bk.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Matches & System Activity */}
        <div className="space-y-6">
          {/* Upcoming Matches Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">sports_cricket</span>
                Upcoming Live Matches
              </h3>
              <button
                onClick={() => navigateTab('matches')}
                className="text-xs font-bold text-[#FF8C1A] hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {(!data?.upcomingMatches || data.upcomingMatches.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">No upcoming matches scheduled.</p>
              ) : (
                data.upcomingMatches.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{m.groundName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{m.date} • {m.startTime}</span>
                      <span className="font-bold text-slate-800">₹{m.entryFee} / player</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Host: {m.hostName}</span>
                      <span>{m.playersJoined}/{m.totalPlayers} spots filled</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Activity Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">history</span>
                System Activity Log
              </h3>
              <button
                onClick={() => navigateTab('audit')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Full Audit →
              </button>
            </div>

            <div className="space-y-2.5">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">No system activity logged.</p>
              ) : (
                data.recentActivity.slice(0, 4).map((act: any) => (
                  <div key={act.id} className="text-xs flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
                    <span className="w-2 h-2 rounded-full bg-[#FF8C1A] mt-1.5 shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{act.action}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{act.details}</p>
                      <span className="text-[9px] text-slate-400">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
