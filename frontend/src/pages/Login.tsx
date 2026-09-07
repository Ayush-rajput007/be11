import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import { env } from '../config/env.js';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // If redirected from signup or query params, prefill the email
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      setErrorMsg(`Google sign-in could not be completed (${oauthError}). Please try standard login.`);
    }
  }, [location]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('be11_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { user, token } = res.data.data;
      login(user, token);

      if (rememberMe) {
        localStorage.setItem('be11_remembered_email', email.trim());
      } else {
        localStorage.removeItem('be11_remembered_email');
      }

      // Route according to user role or intended destination
      const intendedDestination = location.state?.from?.pathname || location.state?.from;
      if (intendedDestination) {
        navigate(intendedDestination, {
          replace: true,
          state: location.state?.bookingState ? { bookingState: location.state.bookingState } : undefined,
        });
      } else {
        const role = user.role;
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          navigate('/admin', { replace: true });
        } else if (role === 'COACH') {
          navigate('/coach-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Unverified account redirect (HTTP 403)
      if (err.response?.status === 403 && err.response?.data?.emailVerified === false) {
        setErrorMsg('Please verify your email address to continue.');
        navigate('/verify-email', { state: { email: err.response.data.email || email } });
        return;
      }

      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Check if real Google Client ID is configured
  const isGoogleConfigured = Boolean(
    env.VITE_GOOGLE_CLIENT_ID &&
    !env.VITE_GOOGLE_CLIENT_ID.startsWith('dummy') &&
    env.VITE_GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')
  );

  // Initialize official Google SDK if valid credentials exist
  useEffect(() => {
    if (!isGoogleConfigured) return;

    const initGoogle = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            setErrorMsg('');
            setLoading(true);
            try {
              const res = await api.post('/auth/google', { idToken: response.credential });
              login(res.data.data.user, res.data.data.token);
              const destination = location.state?.from?.pathname || '/dashboard';
              navigate(destination, { replace: true });
            } catch (err: any) {
              console.error('Google login error:', err);
              setErrorMsg(err.response?.data?.message || 'Google authentication failed. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        });

        const btnElement = document.getElementById('google-signin-btn-container');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 340,
          });
        }
      }
    };

    if (typeof window !== 'undefined') {
      const windowObj = window as any;
      if (windowObj.google && windowObj.google.accounts) {
        initGoogle();
      } else {
        const interval = setInterval(() => {
          if (windowObj.google && windowObj.google.accounts) {
            clearInterval(interval);
            initGoogle();
          }
        }, 150);
        return () => clearInterval(interval);
      }
    }
  }, [isGoogleConfigured, login, navigate, location.state]);

  const handleGoogleClickWhenUnconfigured = () => {
    setErrorMsg(
      'Google Sign-In is not configured for this environment. Please configure VITE_GOOGLE_CLIENT_ID in your environment variables.'
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#000c1e] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Subtle brand ambiance glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#0a2e6e]/20 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#f97316]/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-6xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: BE11 Brand & Value Proposition */}
        <div className="lg:col-span-6 hidden lg:flex flex-col text-left space-y-6">
          <div className="inline-flex items-center gap-2.5 bg-blue-500/10 border border-blue-400/20 px-4 py-1.5 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse"></span>
            <span className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Premium Cricket Booking</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-white">
            Book Verified <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-[#f97316]">
              Cricket Arenas
            </span>
          </h1>
          
          <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-lg">
            Experience match period bookings at state-of-the-art facilities like Playnow Cricket Ground, connect with certified coaching academies, and organize tournaments across Indian cities.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-[#00183b]/60 border border-slate-700/50 rounded-2xl p-4">
              <span className="material-symbols-outlined text-2xl text-[#f97316] mb-1">sports_cricket</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Team Match Periods</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Morning, Afternoon, Day-Night & Night</p>
            </div>
            <div className="bg-[#00183b]/60 border border-slate-700/50 rounded-2xl p-4">
              <span className="material-symbols-outlined text-2xl text-blue-400 mb-1">verified_user</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Double Booking</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Atomic server-side slot protection</p>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Authentication Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#001533]/90 border border-slate-700/70 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
            
            <div className="text-center mb-7">
              <div className="flex justify-center mb-3">
                <img
                  src="/be11_logo.png"
                  alt="BE11 Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <h2 className="font-poppins font-black text-2xl text-white tracking-tight">Sign In to BE11</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your account.</p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/60 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs font-semibold mb-5 text-left flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" tabIndex={-1} className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] pr-16 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider focus:outline-none cursor-pointer select-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="rounded bg-[#000d20] border-slate-700 text-[#f97316] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] disabled:bg-slate-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-lg active:scale-98 duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-slate-700/80 w-full"></div>
              <span className="absolute bg-[#001533] px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                or continue with
              </span>
            </div>

            {/* Official Google Sign-In button container */}
            <div className="flex flex-col items-center justify-center mb-6 w-full">
              {isGoogleConfigured ? (
                <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]"></div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleClickWhenUnconfigured}
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-xl py-3 px-4 flex items-center justify-center gap-3 text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}
            </div>

            {/* Create Account link */}
            <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-700/60">
              New to BE11?{' '}
              <Link to="/signup" className="text-[#f97316] hover:text-[#ea580c] hover:underline font-bold ml-1">
                Create account
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
