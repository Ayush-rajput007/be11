import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatCurrency } from '@be11/shared';

interface PaymentItem {
  id: string;
  sourceType: 'BOOKING' | 'WALLET_TOPUP';
  bookingId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  venueName?: string;
  venueSlug?: string | null;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const AdminPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // Selected detail modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page,
        limit,
      };

      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedType !== 'ALL') params.type = selectedType;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await api.get('/admin/payments', { params });
      setPayments(res.data.data.payments);
      setTotalPages(res.data.data.pagination.totalPages);
      setStats(res.data.data.stats);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch payments ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, selectedStatus, selectedType, debouncedSearch]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/payments/export/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `be11-payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header / Title ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-poppins font-black text-2xl text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF8C1A] text-2xl">receipt_long</span>
            Payments & Transactions Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated real-time ledger of Razorpay transactions, digital wallet top-ups, and booking dues.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {exporting ? 'Exporting CSV...' : 'Export Payments CSV'}
        </button>
      </div>

      {/* ─── Stats KPI Row ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Settled Volume</span>
            <div className="text-xl font-poppins font-black text-emerald-600">
              {formatCurrency(stats.totalPaidVolume || 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Paid Transactions</span>
            <div className="text-xl font-poppins font-black text-slate-900">{stats.paidTransactions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Pending / Created</span>
            <div className="text-xl font-poppins font-black text-amber-600">{stats.pendingTransactions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Failed Transactions</span>
            <div className="text-xl font-poppins font-black text-rose-600">{stats.failedTransactions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase">Refunded Transactions</span>
            <div className="text-xl font-poppins font-black text-purple-600">{stats.refundedTransactions || 0}</div>
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ─────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, payment ID, order ID..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF8C1A] focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-[#FF8C1A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID / Settled</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-[#FF8C1A]"
            >
              <option value="ALL">All Sources</option>
              <option value="BOOKING">Venue Bookings</option>
              <option value="WALLET_TOPUP">Wallet Top-Ups</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Payments Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3.5 pl-6 pr-4">Transaction ID</th>
                <th className="py-3.5 px-4">Source Type</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Destination / Venue</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Gateway / Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined animate-spin text-xl text-[#FF8C1A]">sync</span>
                    <p className="mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No payment transactions found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                payments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 pl-6 pr-4 font-mono font-bold text-slate-700">
                      {item.id.length > 18 ? `${item.id.substring(0, 16)}...` : item.id}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                          item.sourceType === 'BOOKING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.sourceType === 'BOOKING' ? 'Venue Booking' : 'Wallet Top-Up'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{item.customerName}</div>
                      <div className="text-[10px] text-slate-400">{item.customerEmail}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {item.venueName}
                    </td>
                    <td className="py-4 px-4 font-poppins font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-[11px]">
                      {item.provider}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'PENDING' || item.status === 'CREATED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.status === 'REFUNDED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayment(item);
                          setDetailsModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── Payment Details Modal ─────────────────────────────────── */}
      {detailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#FF8C1A]">receipt</span>
                <h3 className="font-poppins font-bold text-base text-slate-900">
                  Payment Transaction Details
                </h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Transaction ID</span>
                  <p className="font-mono font-bold text-slate-800 break-all">{selectedPayment.id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <p className="font-bold text-emerald-600">{selectedPayment.status}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Amount</span>
                  <p className="font-bold text-base text-slate-900 font-poppins">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Method</span>
                  <p className="font-medium text-slate-800">{selectedPayment.provider}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Customer Information</h4>
                <div className="p-3.5 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                  <p><strong>Name:</strong> {selectedPayment.customerName}</p>
                  <p><strong>Email:</strong> {selectedPayment.customerEmail}</p>
                  {selectedPayment.customerPhone && <p><strong>Phone:</strong> {selectedPayment.customerPhone}</p>}
                  <p className="text-[10px] text-slate-400 font-mono">User ID: {selectedPayment.customerId}</p>
                </div>
              </div>

              {selectedPayment.gatewayOrderId && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Gateway Identifiers</h4>
                  <div className="p-3.5 rounded-xl border border-slate-200 space-y-1 text-slate-700 font-mono text-[11px]">
                    <p><strong>Order ID:</strong> {selectedPayment.gatewayOrderId}</p>
                    {selectedPayment.gatewayPaymentId && (
                      <p><strong>Payment ID:</strong> {selectedPayment.gatewayPaymentId}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
                <span>Created: {new Date(selectedPayment.createdAt).toLocaleString()}</span>
                {selectedPayment.updatedAt && (
                  <span>Updated: {new Date(selectedPayment.updatedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
