import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { AdminAnalyticsDTO, formatCurrency } from '@be11/shared';

interface VendorRequest {
  id: string;
  userId: string;
  groundName: string | null;
  ownerName: string;
  location: string | null;
  pricing: number | null;
  amenities: any; // json
  availability: any; // json
  businessType: string;
  gstNumber: string | null;
  panNumber: string | null;
  city: string;
  pincode: string | null;
  businessDetails: any; // json
  bankingDetails: any; // json
  status: string;
  createdAt: string;
}

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'vendors'>('analytics');

  // Analytics state
  const [data, setData] = useState<AdminAnalyticsDTO | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // Vendor requests state
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const res = await api.get('/admin/analytics');
      setData(res.data.data.analytics);
    } catch (err: any) {
      console.error(err);
      setAnalyticsError(err.response?.data?.message || 'Access denied or server error.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchVendorRequests = async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const res = await api.get('/vendors/requests');
      setRequests(res.data.data.requests);
    } catch (err: any) {
      console.error(err);
      setRequestsError(err.response?.data?.message || 'Failed to fetch vendor requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'vendors') {
      fetchVendorRequests();
    }
  }, [activeTab]);

  const handleApproveReject = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setRequestsError('');
    setSuccessMessage('');
    try {
      await api.patch(`/vendors/requests/${requestId}/approve`, { status });
      setSuccessMessage(`Vendor request successfully marked as ${status}!`);
      fetchVendorRequests();
    } catch (err: any) {
      console.error(err);
      setRequestsError(err.response?.data?.message || 'Failed to update vendor request.');
    }
  };

  const parseJsonData = (val: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return {}; }
    }
    return val || {};
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-surface-container-low text-left font-body-md">
      <div className="max-w-7xl mx-auto px-container-padding">
        {/* Banner */}
        <div className="mb-8">
          <h1 className="font-poppins font-black text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-3xl">admin_panel_settings</span>
            System Administrator Panel
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Global metrics, platforms revenue monitoring, and merchant onboarding requests.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#EDF2F7] p-1.5 rounded-2xl w-full md:w-fit mb-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            Analytics &amp; Revenue
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vendors' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-[#F8FAFC]'
            }`}
          >
            Vendor Onboarding Requests
          </button>
        </div>

        {/* Tab Panel 1: Analytics */}
        {activeTab === 'analytics' && (
          <>
            {analyticsLoading && <div className="text-center text-outline py-12">Loading admin metrics...</div>}
            {analyticsError && (
              <div className="bg-error-container text-on-error-container p-6 rounded-xl font-bold text-xs">
                {analyticsError}
              </div>
            )}

            {data && (
              <div className="space-y-8">
                {/* Aggregate Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Total System Users
                    </span>
                    <h3 className="font-display-hero text-3xl font-bold text-primary">{data.totalUsers}</h3>
                  </div>

                  <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Registered Grounds
                    </span>
                    <h3 className="font-display-hero text-3xl font-bold text-primary">{data.totalGrounds}</h3>
                  </div>

                  <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Total Bookings Formed
                    </span>
                    <h3 className="font-display-hero text-3xl font-bold text-primary">{data.totalBookings}</h3>
                  </div>

                  <div className="bg-white rounded-24 p-6 shadow-sm border border-outline-variant/30 text-left">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Gross Platform Revenue
                    </span>
                    <h3 className="font-display-hero text-3xl font-bold text-[#138808]">
                      {formatCurrency(data.totalRevenue)}
                    </h3>
                  </div>
                </div>

                {/* Popular venues table and Revenue list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Popular Grounds Table */}
                  <div className="bg-white rounded-24 p-8 shadow-sm border border-outline-variant/30 lg:col-span-2 text-left">
                    <h3 className="font-poppins font-bold text-xl text-primary mb-6">Popular Venues</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E7EB] text-left text-outline font-semibold">
                            <th className="pb-3 font-semibold">Venue Name</th>
                            <th className="pb-3 font-semibold">Booking Counts</th>
                            <th className="pb-3 font-semibold text-right">Revenue Generated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {data.popularGrounds.map((g) => (
                            <tr key={g.name}>
                              <td className="py-4 font-bold text-primary">{g.name}</td>
                              <td className="py-4 font-semibold text-on-surface-variant">
                                {g.bookingsCount} bookings
                              </td>
                              <td className="py-4 font-bold text-[#138808] text-right">
                                {formatCurrency(g.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Revenue Trends */}
                  <div className="bg-white rounded-24 p-8 shadow-sm border border-outline-variant/30 text-left">
                    <h3 className="font-poppins font-bold text-xl text-primary mb-6">Revenue Growth</h3>
                    <div className="space-y-4">
                      {data.monthlyRevenue.map((m) => (
                        <div key={m.month} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-on-surface-variant">{m.month}</span>
                          <div className="flex-1 mx-4 h-2 bg-[#EDF2F7] rounded-full overflow-hidden">
                            <div
                              className="bg-secondary-container h-full rounded-full"
                              style={{
                                width: `${
                                  data.totalRevenue > 0
                                    ? Math.min((m.revenue / data.totalRevenue) * 150, 100)
                                    : 0
                                  }%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-bold text-primary">{formatCurrency(m.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab Panel 2: Vendor requests */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            {successMessage && (
              <div className="bg-on-tertiary-container/10 text-on-tertiary-container p-4 rounded-xl text-xs font-semibold mb-4">
                {successMessage}
              </div>
            )}

            {requestsError && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-xs font-semibold mb-4">
                {requestsError}
              </div>
            )}

            {requestsLoading ? (
              <div className="text-center text-outline py-12">Loading vendor requests...</div>
            ) : requests.length === 0 ? (
              <div className="py-16 bg-white rounded-24 border border-dashed text-center flex flex-col items-center justify-center p-8">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
                <h3 className="font-bold text-[#001a49] text-base">No Vendor Requests</h3>
                <p className="text-outline text-xs mt-1 max-w-sm">
                  There are no pending partner merchant applications currently awaiting administrative reviews.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {requests.map((r) => {
                  const banking = parseJsonData(r.bankingDetails);
                  const details = parseJsonData(r.businessDetails);
                  const statusColors = 
                    r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    r.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700 animate-pulse';

                  return (
                    <div key={r.id} className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm text-left">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4">
                        <div>
                          <h3 className="font-poppins font-bold text-lg text-primary">
                            {r.groundName || 'Local Sports Outlet'}
                          </h3>
                          <p className="text-outline text-xs mt-0.5">
                            Submitted by <span className="font-bold text-primary">{r.ownerName}</span> on {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors}`}>
                          {r.status}
                        </span>
                      </div>

                      {/* Detail splits */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                        {/* Company Details */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Company Credentials</h4>
                          <p><span className="text-outline font-medium">Business Type:</span> {r.businessType}</p>
                          <p><span className="text-outline font-medium">GSTIN:</span> {r.gstNumber || 'N/A'}</p>
                          <p><span className="text-outline font-medium">PAN:</span> {r.panNumber || 'N/A'}</p>
                          <p><span className="text-outline font-medium">City:</span> {r.city} ({r.pincode})</p>
                          <p><span className="text-outline font-medium">Location:</span> {r.location || 'N/A'}</p>
                        </div>

                        {/* Category specific details */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Business Operations</h4>
                          {r.businessType === 'VENUE_OWNER' ? (
                            <>
                              <p><span className="text-outline font-medium">Sport:</span> {details.sport || 'Cricket'}</p>
                              <p><span className="text-outline font-medium">Turf Type:</span> {details.groundType || 'Outdoor'}</p>
                              <p><span className="text-outline font-medium">Capacity:</span> {details.capacity || 100} spectators</p>
                              <p><span className="text-outline font-medium">Pricing Rate:</span> {formatCurrency(r.pricing || 1500)}/hr</p>
                              <p><span className="text-outline font-medium">Hours:</span> {details.openTime || '06:00'} - {details.closeTime || '22:00'}</p>
                            </>
                          ) : (
                            <>
                              <p><span className="text-outline font-medium">Product Category:</span> {details.productCategory || 'N/A'}</p>
                              <p><span className="text-outline font-medium">Brands Covered:</span> {details.brandsCovered || 'N/A'}</p>
                              <p><span className="text-outline font-medium">Inventory Count:</span> {details.inventorySize || 0} items</p>
                              <p><span className="text-outline font-medium">MOQ:</span> {details.moq || 1} units</p>
                              <p><span className="text-outline font-medium">Warehouse:</span> {details.warehouseAddress || 'N/A'}</p>
                            </>
                          )}
                        </div>

                        {/* Banking Details */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Settlement Account</h4>
                          <p><span className="text-outline font-medium">Bank:</span> {banking.bankName || 'N/A'}</p>
                          <p><span className="text-outline font-medium">Holder Name:</span> {banking.accountHolder || 'N/A'}</p>
                          <p><span className="text-outline font-medium">Account No:</span> {banking.accountNumber || 'N/A'}</p>
                          <p><span className="text-outline font-medium">IFSC Code:</span> {banking.ifscCode || 'N/A'}</p>
                          <p><span className="text-outline font-medium">UPI VPA:</span> {banking.upiId || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Action buttons if Pending */}
                      {r.status === 'PENDING' && (
                        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                          <button
                            onClick={() => handleApproveReject(r.id, 'REJECTED')}
                            className="px-5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                          >
                            Reject Application
                          </button>
                          <button
                            onClick={() => handleApproveReject(r.id, 'APPROVED')}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                          >
                            Approve &amp; Activate
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
