import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatCurrency } from '@be11/shared';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout.js';
import { AdminDashboardView } from '../components/admin/AdminDashboardView.js';
import { AdminPaymentsView } from '../components/admin/AdminPaymentsView.js';
import { AdminMatchesView } from '../components/admin/AdminMatchesView.js';
import { AdminReportsView } from '../components/admin/AdminReportsView.js';
import { AdminVenuesView } from '../components/admin/AdminVenuesView.js';
import { AdminAuditView } from '../components/admin/AdminAuditView.js';
import { AdminBookings } from './AdminBookings.js';
import { SEO } from '../components/common/SEO.js';

interface VendorRequest {
  id: string;
  userId: string;
  groundName: string | null;
  ownerName: string;
  location: string | null;
  pricing: number | null;
  amenities: any;
  availability: any;
  businessType: string;
  gstNumber: string | null;
  panNumber: string | null;
  city: string;
  pincode: string | null;
  businessDetails: any;
  bankingDetails: any;
  status: string;
  createdAt: string;
}

interface AdminProps {
  initialTab?: AdminTab;
}

export const Admin: React.FC<AdminProps> = ({ initialTab = 'dashboard' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state derived from query params or prop
  const tabFromQuery = (searchParams.get('tab') as AdminTab) || initialTab;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromQuery);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString('en-IN'));
  const [refreshKey, setRefreshKey] = useState(0);

  // Vendor requests state
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // AI Knowledge state
  const [aiData, setAiData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSyncing, setAiSyncing] = useState(false);
  const [aiSearch, setAiSearch] = useState('');
  const [aiCategory, setAiCategory] = useState('All');
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
  };

  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    if (activeTab === 'vendors') fetchVendorRequests();
    if (activeTab === 'ai-knowledge') fetchAiKnowledge();
  };

  const fetchVendorRequests = async () => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const res = await api.get('/vendors/requests');
      setRequests(res.data.data.requests || []);
    } catch (err: any) {
      console.error(err);
      setRequestsError(err.response?.data?.message || 'Failed to fetch vendor requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchAiKnowledge = async () => {
    setAiLoading(true);
    try {
      const res = await api.get('/admin/ai/knowledge');
      setAiData(res.data.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSyncAiKnowledge = async () => {
    setAiSyncing(true);
    setAiMessage('');
    try {
      const res = await api.post('/admin/ai/knowledge/sync');
      setAiMessage(`Knowledge successfully re-indexed! ${res.data.data?.totalExtracted || 0} items extracted across ${res.data.data?.categories?.length || 0} categories.`);
      fetchAiKnowledge();
    } catch (err: any) {
      setAiMessage(err.response?.data?.message || 'Failed to sync knowledge.');
    } finally {
      setAiSyncing(false);
    }
  };

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

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchVendorRequests();
    } else if (activeTab === 'ai-knowledge') {
      fetchAiKnowledge();
    }
  }, [activeTab, refreshKey]);

  const parseJsonData = (val: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return {}; }
    }
    return val || {};
  };

  return (
    <>
      <SEO title="Admin Console | BE11" noindex={true} />
      <AdminLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        lastUpdated={lastUpdated}
        onRefresh={handleManualRefresh}
      >
      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <AdminDashboardView key={refreshKey} onNavigateTab={handleTabChange} />
      )}

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <AdminBookings />
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <AdminPaymentsView key={refreshKey} />
      )}

      {/* Tab: Live Matches */}
      {activeTab === 'matches' && (
        <AdminMatchesView key={refreshKey} />
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <AdminReportsView key={refreshKey} />
      )}

      {/* Tab: Venues */}
      {activeTab === 'venues' && (
        <AdminVenuesView key={refreshKey} onNavigateTab={handleTabChange} />
      )}

      {/* Tab: System Audit */}
      {activeTab === 'audit' && (
        <AdminAuditView key={refreshKey} />
      )}

      {/* Tab: Vendor Onboarding Requests */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-poppins text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">storefront</span>
                Merchant &amp; Vendor Applications
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and approve sports equipment vendors and ground owner onboarding applications.
              </p>
            </div>
            <button
              onClick={fetchVendorRequests}
              className="px-4 py-2 bg-gray-100 text-primary hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${requestsLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh Requests
            </button>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-xs font-semibold">
              {successMessage}
            </div>
          )}

          {requestsError && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl text-xs font-semibold">
              {requestsError}
            </div>
          )}

          {requestsLoading ? (
            <div className="text-center py-16 text-gray-400 text-xs">Loading vendor requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center p-8">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">storefront</span>
              <h3 className="font-bold text-primary text-base">No Vendor Requests</h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm">
                There are no pending partner merchant applications currently awaiting administrative review.
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
                  <div key={r.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <h3 className="font-poppins font-bold text-lg text-primary">
                          {r.groundName || 'Local Sports Outlet'}
                        </h3>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Submitted by <span className="font-bold text-primary">{r.ownerName}</span> on {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                      <div className="space-y-1">
                        <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Company Credentials</h4>
                        <p><span className="text-gray-400 font-medium">Business Type:</span> {r.businessType}</p>
                        <p><span className="text-gray-400 font-medium">GSTIN:</span> {r.gstNumber || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">PAN:</span> {r.panNumber || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">City:</span> {r.city} ({r.pincode})</p>
                        <p><span className="text-gray-400 font-medium">Location:</span> {r.location || 'N/A'}</p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Business Operations</h4>
                        {r.businessType === 'VENUE_OWNER' ? (
                          <>
                            <p><span className="text-gray-400 font-medium">Sport:</span> {details.sport || 'Cricket'}</p>
                            <p><span className="text-gray-400 font-medium">Turf Type:</span> {details.groundType || 'Outdoor'}</p>
                            <p><span className="text-gray-400 font-medium">Capacity:</span> {details.capacity || 100} spectators</p>
                            <p><span className="text-gray-400 font-medium">Pricing Rate:</span> {formatCurrency(r.pricing || 1500)}/hr</p>
                            <p><span className="text-gray-400 font-medium">Hours:</span> {details.openTime || '06:00'} - {details.closeTime || '22:00'}</p>
                          </>
                        ) : (
                          <>
                            <p><span className="text-gray-400 font-medium">Product Category:</span> {details.productCategory || 'N/A'}</p>
                            <p><span className="text-gray-400 font-medium">Brands Covered:</span> {details.brandsCovered || 'N/A'}</p>
                            <p><span className="text-gray-400 font-medium">Inventory Count:</span> {details.inventorySize || 0} items</p>
                            <p><span className="text-gray-400 font-medium">MOQ:</span> {details.moq || 1} units</p>
                            <p><span className="text-gray-400 font-medium">Warehouse:</span> {details.warehouseAddress || 'N/A'}</p>
                          </>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Settlement Account</h4>
                        <p><span className="text-gray-400 font-medium">Bank:</span> {banking.bankName || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">Holder Name:</span> {banking.accountHolder || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">Account No:</span> {banking.accountNumber || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">IFSC Code:</span> {banking.ifscCode || 'N/A'}</p>
                        <p><span className="text-gray-400 font-medium">UPI VPA:</span> {banking.upiId || 'N/A'}</p>
                      </div>
                    </div>

                    {r.status === 'PENDING' && (
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                          onClick={() => handleApproveReject(r.id, 'REJECTED')}
                          className="px-5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                        >
                          Reject Application
                        </button>
                        <button
                          onClick={() => handleApproveReject(r.id, 'APPROVED')}
                          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
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

      {/* Tab: AI Knowledge Base */}
      {activeTab === 'ai-knowledge' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-poppins text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF8C1A]">psychology</span>
                Autonomous AI Knowledge Base
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Synchronized directly from the BE11 codebase, database schema, real venue data, live matches, and official policies.
              </p>
              {aiData?.summary && (
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
                  <span>Indexed Items: <strong className="text-primary">{aiData.summary.totalItems}</strong></span>
                  <span>•</span>
                  <span>Categories: <strong className="text-primary">{aiData.summary.categories.length}</strong></span>
                  <span>•</span>
                  <span>Last Synced: <strong className="text-primary">{new Date(aiData.summary.lastSyncTimestamp).toLocaleString()}</strong></span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={aiSyncing}
                onClick={handleSyncAiKnowledge}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8C1A] to-[#FF9933] text-white text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${aiSyncing ? 'animate-spin' : ''}`}>sync</span>
                {aiSyncing ? 'Synchronizing Knowledge...' : 'Re-Sync Knowledge Now'}
              </button>
            </div>
          </div>

          {aiMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {aiMessage}
            </div>
          )}

          {aiData?.analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[11px] text-gray-500 font-semibold uppercase">Total Queries Handled</span>
                <div className="text-2xl font-bold text-primary mt-1">{aiData.analytics.totalQueries}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[11px] text-gray-500 font-semibold uppercase">Human Escalation Rate</span>
                <div className="text-2xl font-bold text-[#FF8C1A] mt-1">{aiData.analytics.escalationRate}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[11px] text-gray-500 font-semibold uppercase">Average Response Time</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{aiData.analytics.averageLatencyMs} ms</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[11px] text-gray-500 font-semibold uppercase">Support Escalations</span>
                <div className="text-2xl font-bold text-primary mt-1">{aiData.analytics.escalatedQueries}</div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                placeholder="Search indexed knowledge items..."
                className="w-full sm:w-80 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#f8fafc] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF8C1A]"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setAiCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    aiCategory === 'All' ? 'bg-[#001a49] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {aiData?.summary?.categories?.map((cat: string) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAiCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      aiCategory === cat ? 'bg-[#001a49] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {aiLoading ? (
              <div className="text-center py-12 text-gray-400 text-xs">Loading indexed knowledge...</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                {aiData?.items
                  ?.filter((item: any) => {
                    const matchCat = aiCategory === 'All' || item.category === aiCategory;
                    const matchSearch =
                      !aiSearch ||
                      item.title.toLowerCase().includes(aiSearch.toLowerCase()) ||
                      item.content.toLowerCase().includes(aiSearch.toLowerCase());
                    return matchCat && matchSearch;
                  })
                  ?.map((item: any) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-gray-200 bg-[#f8fafc]/60 hover:bg-white transition-all space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#FF8C1A]/10 text-[#FF8C1A]">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">v{item.version}</span>
                      </div>
                      <h4 className="text-xs font-bold text-primary">{item.title}</h4>
                      <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed">{item.content}</p>
                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Source: {item.source}</span>
                        <span className="text-emerald-600 font-medium">Active</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
    </>
  );
};

export default Admin;
