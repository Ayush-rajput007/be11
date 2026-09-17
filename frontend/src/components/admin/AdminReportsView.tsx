import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatCurrency } from '@be11/shared';

export const AdminReportsView: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports');
      setReportData(res.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load financial & operational reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportBookingsCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/bookings/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `be11-bookings-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="py-24 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-[#FF8C1A] animate-spin">sync</span>
        <p className="text-xs text-slate-500 font-medium">Aggregating database reports and revenue metrics...</p>
      </div>
    );
  }

  const s = reportData?.summary || {};
  const dailyRev = reportData?.charts?.dailyRevenue || [];
  const monthlyRev = reportData?.charts?.monthlyRevenue || [];
  const venueList = reportData?.venuePerformance || [];

  const maxDaily = Math.max(1, ...dailyRev.map((d: any) => d.revenue));
  const maxMonthly = Math.max(1, ...monthlyRev.map((m: any) => m.revenue));

  return (
    <div className="space-y-6">
      {/* ─── Header & Export ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-poppins font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF8C1A] text-2xl">analytics</span>
            Revenue & Operational Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative financial analysis calculated strictly from database confirmed bookings and wallet settlements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportBookingsCsv}
          disabled={exporting}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {exporting ? 'Exporting...' : 'Export Bookings CSV'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* ─── High-Level KPI Row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Confirmed Revenue</span>
          <div className="text-2xl font-poppins font-black text-emerald-600">
            {formatCurrency(s.totalRevenue || 0)}
          </div>
          <p className="text-[10px] text-slate-400">Total settled platform volume</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Pending In-Queue</span>
          <div className="text-2xl font-poppins font-black text-amber-600">
            {formatCurrency(s.pendingRevenue || 0)}
          </div>
          <p className="text-[10px] text-amber-600 font-semibold">{s.pendingBookingsCount || 0} reservations pending</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Booking Conversion</span>
          <div className="text-2xl font-poppins font-black text-slate-900">
            {s.conversionRate || '0%'}
          </div>
          <p className="text-[10px] text-slate-400">{s.confirmedBookingsCount || 0} of {s.totalBookingsCount || 0} confirmed</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-purple-700 uppercase">Wallet Funds Loaded</span>
          <div className="text-2xl font-poppins font-black text-purple-600">
            {formatCurrency(s.totalWalletTopupRevenue || 0)}
          </div>
          <p className="text-[10px] text-purple-600 font-semibold">Razorpay wallet credits</p>
        </div>
      </div>

      {/* ─── Revenue Charts Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart (Past 14 Days) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Daily Revenue Trend (Past 14 Days)
              </h3>
              <p className="text-[11px] text-slate-400">Daily confirmed booking receipts</p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4 pb-2">
            {dailyRev.map((item: any, idx: number) => {
              const heightPercent = Math.max(8, Math.round((item.revenue / maxDaily) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {item.date}: {formatCurrency(item.revenue)} ({item.bookingsCount} bks)
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 group-hover:from-emerald-600 group-hover:to-emerald-500 transition-all"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-[9px] text-slate-400 rotate-45 origin-left truncate w-6">
                    {item.date.substring(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Chart (Past 6 Months) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-sm text-slate-900">
                Monthly Revenue Performance
              </h3>
              <p className="text-[11px] text-slate-400">Monthly confirmed transaction totals</p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-3 pt-4 pb-2">
            {monthlyRev.map((item: any, idx: number) => {
              const heightPercent = Math.max(8, Math.round((item.revenue / maxMonthly) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {item.month}: {formatCurrency(item.revenue)} ({item.bookingsCount} bks)
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#FF8C1A] to-[#FF9933] group-hover:from-[#e07b16] transition-all"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-[10px] font-semibold text-slate-600 truncate w-14 text-center">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Venue Performance Matrix Table ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="font-poppins font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF8C1A]">stadium</span>
            Venue Performance & Revenue Contribution Matrix
          </h3>
          <p className="text-xs text-slate-500">Breakdown per verified sports facility</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 pr-4">Venue Name</th>
                <th className="pb-3 px-4">City</th>
                <th className="pb-3 px-4">Owner Contact</th>
                <th className="pb-3 px-4">Total Bookings</th>
                <th className="pb-3 px-4">Confirmed</th>
                <th className="pb-3 px-4">Cancelled</th>
                <th className="pb-3 px-4">Conversion</th>
                <th className="pb-3 pl-4 text-right">Revenue (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {venueList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No venue performance records found.
                  </td>
                </tr>
              ) : (
                venueList.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-slate-900">
                      {v.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{v.city}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{v.ownerName || 'Verified Partner'}</div>
                      <div className="text-[10px] text-slate-400">{v.ownerPhone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{v.totalBookings}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">{v.confirmedBookings}</td>
                    <td className="py-3.5 px-4 text-rose-500">{v.cancelledBookings}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{v.conversionRate}</td>
                    <td className="py-3.5 pl-4 text-right font-poppins font-bold text-emerald-600 text-sm">
                      {formatCurrency(v.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
