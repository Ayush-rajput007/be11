import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

export type AdminTab =
  | 'dashboard'
  | 'analytics'
  | 'bookings'
  | 'payments'
  | 'matches'
  | 'reports'
  | 'venues'
  | 'vendors'
  | 'ai-knowledge'
  | 'audit';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  lastUpdated?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  lastUpdated,
  onRefresh,
  refreshing = false,
  children,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'analytics', label: 'Visitor Analytics', icon: 'query_stats' },
    { id: 'bookings', label: 'Venue Bookings', icon: 'calendar_month' },
    { id: 'payments', label: 'Payments Ledger', icon: 'payments' },
    { id: 'matches', label: 'Live Matches', icon: 'sports_cricket' },
    { id: 'reports', label: 'Reports & Revenue', icon: 'analytics' },
    { id: 'venues', label: 'Grounds & Venues', icon: 'stadium' },
    { id: 'vendors', label: 'Vendor Requests', icon: 'storefront' },
    { id: 'ai-knowledge', label: 'AI Knowledge Base', icon: 'psychology' },
    { id: 'audit', label: 'System Audit', icon: 'shield_person' },
  ];

  const handleNavClick = (tabId: AdminTab) => {
    onTabChange(tabId);
    setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col md:flex-row pt-16 md:pt-0">
      {/* ─── Mobile Header ────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#001a49] text-white z-40 px-4 flex items-center justify-between border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF8C1A] text-2xl">admin_panel_settings</span>
          <span className="font-poppins font-bold text-base tracking-wide">BE11 ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            </button>
          )}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileSidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Sidebar Drawer (Desktop Fixed + Mobile Collapsible) ──── */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 w-72 bg-[#001a49] text-white flex flex-col z-30 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } border-r border-white/10 shadow-xl md:shadow-none h-screen`}
      >
        {/* Brand Banner */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C1A] to-[#FF9933] flex items-center justify-center text-white font-black text-xl shadow-md">
              B
            </div>
            <div>
              <div className="font-poppins font-black text-lg tracking-wider text-white flex items-center gap-1.5">
                BE11 <span className="text-[#FF8C1A] text-xs uppercase px-1.5 py-0.5 rounded bg-[#FF8C1A]/20 font-semibold">Admin</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Control Operations Center</p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Operations & Control
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF8C1A] to-[#FF9933] text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-white/10 bg-[#001438]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#FF8C1A]/20 border border-[#FF8C1A]/40 text-[#FF8C1A] font-bold text-xs flex items-center justify-center shrink-0">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
          <Link
            to="/"
            className="w-full block text-center py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            ← Back to Public Website
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/80 px-8 items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="font-poppins font-bold text-lg text-[#001a49] capitalize">
              {activeTab === 'ai-knowledge' ? 'AI Knowledge Base' : activeTab.replace('-', ' ')}
            </h2>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-slate-500 font-medium">
                Last updated:{' '}
                <strong className="text-slate-700">
                  {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
              </span>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>sync</span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </header>

        {/* Body Content */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
