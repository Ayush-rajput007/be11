import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';

export const Signup: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'OWNER' | 'COACH' | 'VENDOR' | 'ORGANIZER'>('PLAYER');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service.');
      return;
    }

    setLoading(true);

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Name';

    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
      });

      login(res.data.data.user, res.data.data.token);
      
      // Verification notice before dashboard redirect
      alert('Verification OTP code sent to your email. Redirecting to workspace...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#040408] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Background glow filters */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-xl w-full mx-auto px-6 z-10">
        <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-8 shadow-2xl backdrop-blur-xl relative text-left">
          
          <div className="text-center mb-6">
            <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Create Account</h3>
            <p className="text-xs text-gray-400 mt-1">Join the be11 premium sports network.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            
            {/* Role Selection Tabs */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Select Account Type</label>
              <div className="grid grid-cols-5 gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
                {[
                  { key: 'PLAYER', label: 'Player' },
                  { key: 'COACH', label: 'Coach' },
                  { key: 'OWNER', label: 'Owner' },
                  { key: 'VENDOR', label: 'Vendor' },
                  { key: 'ORGANIZER', label: 'Admin' }
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key as any)}
                    className={`py-2 px-1 text-[9px] font-black uppercase tracking-wide rounded-lg text-center cursor-pointer transition-all ${
                      role === r.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
              <input
                required
                type="text"
                placeholder="Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 py-1">
              <input
                required
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded bg-black/40 border-white/10 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="agree" className="text-[10px] text-gray-400 font-light leading-snug cursor-pointer">
                I agree to the <span className="text-indigo-400 hover:underline">Terms of Service</span> and <span className="text-indigo-400 hover:underline">Privacy Policy</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>

            <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:underline font-bold">Sign in</Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
