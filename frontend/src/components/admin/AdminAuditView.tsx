import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

interface AuditLogItem {
  id: string;
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ip?: string;
  timestamp: string;
}

export const AdminAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { limit: 100 };
      if (selectedAction !== 'ALL') params.action = selectedAction;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.data.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.response?.data?.message || 'Unable to retrieve audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes('CANCEL') || action.includes('REJECT') || action.includes('DELETE')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (action.includes('CONFIRM') || action.includes('APPROVE') || action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('PAYMENT') || action.includes('EXPORT')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">security</span>
            System &amp; Admin Audit Logs
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cryptographically-sound and structured audit trail of administrative modifications, cancellations, confirmations, and live match launches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-gray-100 text-primary hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh Log Feed
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, admin email, entity ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-[#f8fafc] text-gray-800 focus:outline-none focus:border-secondary"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-[#f8fafc] text-gray-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="BOOKING_CONFIRMED">Booking Confirmed</option>
            <option value="BOOKING_CANCELLED">Booking Cancelled</option>
            <option value="MATCH_CREATED">Match Created</option>
            <option value="MATCH_CANCELLED">Match Cancelled</option>
            <option value="AI_KNOWLEDGE_SYNCED">AI Knowledge Synced</option>
            <option value="SYSTEM_BOOT">System Events</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchLogs} className="underline hover:text-red-900 cursor-pointer">Retry</button>
        </div>
      )}

      {/* Log Feed Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-xs">
            <span className="material-symbols-outlined text-3xl animate-spin mb-2">progress_activity</span>
            <p>Fetching immutable system audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center p-8">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">verified_user</span>
            <h3 className="font-bold text-primary text-base">No Audit Records Found</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-sm">
              All new administrative actions will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Admin Actor</th>
                  <th className="py-3.5 px-4 font-semibold">Entity / ID</th>
                  <th className="py-3.5 px-4 font-semibold">Details</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-600 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-primary">{log.adminEmail || 'SYSTEM / ROOT'}</div>
                      {log.adminRole && (
                        <span className="text-[10px] text-gray-400">{log.adminRole}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-700">{log.entity}</div>
                      {log.entityId && (
                        <div className="font-mono text-[10px] text-gray-400 truncate max-w-[140px]">{log.entityId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-500">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-primary hover:bg-gray-100 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-poppins font-bold text-primary text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">history</span>
                Audit Event Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl">
                <div>
                  <span className="text-gray-400 font-medium block text-[10px] uppercase">Action</span>
                  <span className="font-bold text-primary">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[10px] uppercase">Entity</span>
                  <span className="font-bold text-primary">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[10px] uppercase">Admin Actor</span>
                  <span className="font-semibold text-gray-700">{selectedLog.adminEmail || 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[10px] uppercase">Timestamp</span>
                  <span className="font-semibold text-gray-700">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-medium block text-[10px] uppercase mb-1">Payload / Details Metadata</span>
                <pre className="p-3 bg-gray-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer"
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
