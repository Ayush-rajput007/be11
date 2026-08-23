import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.user, res.data.data.token);
      if (rememberMe) {
        localStorage.setItem('be11_remembered_email', email);
      } else {
        localStorage.removeItem('be11_remembered_email');
      }
      
      // Role based routing redirects
      const role = res.data.data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (role === 'COACH') {
        navigate('/coach-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Preset quick login helpers for seed users
  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: presetEmail, password: presetPass });
      login(res.data.data.user, res.data.data.token);
      
      const role = res.data.data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (role === 'COACH') {
        navigate('/coach-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { 
        email: 'google-user@be11.com',
        firstName: 'Google',
        lastName: 'Player'
      });
      login(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Google login simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('be11_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#040408] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Background glow filters */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Illustration / Brand Banner */}
        <div className="lg:col-span-6 hidden lg:flex flex-col text-left space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Premium Sports Hub</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-[#FF9933]">
            Train Like <br />a Champion
          </h2>
          
          <p className="text-sm text-gray-400 font-light leading-relaxed max-w-md">
            Discover verified cricket pitches, join certified coaching academies, customize your sublimated jerseys, and connect with players in your city.
          </p>

          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 max-w-md backdrop-blur-md">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">⚡ Seed Demo Accounts</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Super Admin', email: 'superadmin@be11.com', pass: 'SuperAdmin@123' },
                { label: 'Admin', email: 'admin@be11.com', pass: 'Admin@123' },
                { label: 'Player', email: 'player@be11.com', pass: 'Player@123' },
                { label: 'Coach', email: 'coach@be11.com', pass: 'Coach@123' },
                { label: 'Owner', email: 'groundowner@be11.com', pass: 'Ground@123' },
                { label: 'Vendor', email: 'vendor@be11.com', pass: 'Vendor@123' },
              ].map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className="bg-black/40 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg text-[9px] font-bold text-gray-300 transition-all cursor-pointer"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Login Card Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-8 shadow-2xl backdrop-blur-xl relative">
            <div className="text-center mb-6">
              <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Welcome Back</h3>
              <p className="text-xs text-gray-400 mt-1">Access your bookings ledger and customization workspace.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4 text-left">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-[9px] text-indigo-400 hover:underline">Forgot password?</Link>
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-black/40 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="remember" className="text-[10px] text-gray-400 uppercase font-black tracking-wider cursor-pointer">Remember Me</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-white/10 w-full"></div>
              <span className="absolute bg-[#09090F] px-3.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={handleGoogleMockLogin}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all text-gray-300"
              >
                <span>Google</span>
              </button>
              <button
                onClick={() => alert('Apple Single Sign-on simulation initialized.')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all text-gray-300"
              >
                <span>Apple</span>
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
              New to be11?{' '}
              <Link to="/signup" className="text-indigo-400 hover:underline font-bold">Create an account</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
