import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';

interface AuthSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const ProfileSettings: React.FC = () => {
  const { user, token, login } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [favSport, setFavSport] = useState('Cricket');

  // Device list
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await api.patch('/auth/profile', {
        firstName,
        lastName,
        phone,
      });

      if (token) {
        login(res.data.data.user, token);
      }
      setSuccessMsg('Profile configuration updated successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to terminate all other active login sessions?')) return;
    try {
      await api.post('/auth/logout-all');
      alert('Successfully terminated sessions from all other devices!');
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to terminate other sessions.');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#050508] text-white text-left font-poppins relative">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 z-10 relative space-y-8">
        <div>
          <h1 className="font-poppins font-black text-3xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400">Account Settings</h1>
          <p className="text-gray-400 text-xs mt-1">Configure your personal credentials, contact endpoints, and multi-device sessions.</p>
        </div>

        {successMsg && (
          <div className="bg-indigo-950/40 border border-indigo-500/25 text-indigo-300 p-4 rounded-2xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left panel edit profile */}
          <div className="md:col-span-7 bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">Personal Information</h3>
            
            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Favorite Sport</label>
                  <select
                    value={favSport}
                    onChange={(e) => setFavSport(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Badminton">Badminton</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Right panel session logs */}
          <div className="md:col-span-5 bg-[#09090F]/70 border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-poppins font-black text-sm text-indigo-400 uppercase tracking-wider">Session Security</h3>
              <button
                onClick={handleLogoutAll}
                className="text-[9px] text-[#FF9933] hover:underline font-bold uppercase tracking-wider cursor-pointer"
              >
                Logout Others
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed font-light">
              Review active JWT session tokens registered to your account. Wiping others rotates security keys.
            </p>

            <div className="space-y-3 pt-2">
              {sessionsLoading ? (
                <p className="text-xs text-indigo-400">Loading session logs...</p>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-gray-500">No other devices active.</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between text-[10px]">
                    <div>
                      <p className="font-bold text-white uppercase tracking-wider">Device Log</p>
                      <p className="text-[9px] text-gray-400 mt-0.5 max-w-[180px] truncate" title={s.userAgent || 'Unknown browser'}>
                        {s.userAgent || 'Chrome / Windows'}
                      </p>
                      <p className="text-[8px] text-gray-500 mt-0.5">IP: {s.ipAddress || '127.0.0.1'}</p>
                    </div>
                    <span className="text-[8px] text-gray-400 font-bold">{new Date(s.createdAt).toLocaleDateString()}</span>
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
