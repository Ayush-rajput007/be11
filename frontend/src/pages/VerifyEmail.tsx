import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

export const VerifyEmail: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verified, setVerified] = useState(false);

  // Load params from url query (e.g. click from email link)
  useEffect(() => {
    const urlEmail = searchParams.get('email') || '';
    const urlCode = searchParams.get('code') || '';
    
    if (urlEmail) {
      setEmail(urlEmail);
    }
    if (urlCode) {
      setCode(urlCode);
    }

    // Auto verify if both are provided
    if (urlEmail && urlCode) {
      triggerVerification(urlEmail, urlCode);
    }
  }, [searchParams]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const triggerVerification = async (targetEmail: string, targetCode: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-email', {
        email: targetEmail,
        code: targetCode,
      });

      // Authenticate session in Zustand store directly
      login(res.data.data.user, res.data.data.token);
      setVerified(true);
      setSuccessMsg('Email verified successfully! Welcome to BE11.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setErrorMsg('Please enter both your email address and verification code.');
      return;
    }
    triggerVerification(email, code);
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to request a new code.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await api.post('/auth/resend-verification', { email });
      setSuccessMsg(res.data.message || 'Verification code resent.');
      setCooldown(60); // 60s cooldown limit
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#040408] text-white flex items-center justify-center relative font-poppins overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-md w-full mx-auto px-6 z-10">
          <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-8 shadow-2xl backdrop-blur-xl relative text-center">
            
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Email Verified!</h3>
            <p className="text-xs text-gray-400 mt-2 mb-6">Your BE11 account is now verified. You can explore venues, coaches, and tournaments.</p>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-[#f97316] hover:bg-orange-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
            >
              Continue to BE11
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#040408] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Background glow filters */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto px-6 z-10">
        <div className="bg-[#09090F]/70 border border-white/10 rounded-[28px] p-8 shadow-2xl backdrop-blur-xl relative text-left">
          
          <div className="text-center mb-6">
            <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Verify Email</h3>
            <p className="text-xs text-gray-400 mt-1">Enter your verification PIN code to activate your account.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            
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
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verification PIN</label>
              <input
                required
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-center font-bold tracking-widest text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#f97316] hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
            
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || cooldown > 0}
                className="text-indigo-400 hover:underline font-bold disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              </button>

              <Link to="/login" className="text-gray-400 hover:text-white hover:underline">
                Back to Sign In
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
export default VerifyEmail;
