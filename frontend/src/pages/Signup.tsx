import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

import { isValidIndianMobile, canonicalPhone } from '@be11/shared';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    if (!isValidIndianMobile(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Name';
    const normalizedPhone = canonicalPhone(phone);

    try {
      await api.post('/auth/register', {
        email: email.trim(),
        password,
        firstName,
        lastName,
        phone: normalizedPhone,
        role: 'PLAYER', // Default public safe role
      });

      // Direct to email verification
      navigate('/verify-email', {
        state: {
          email: email.trim(),
        },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#000c1e] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#0a2e6e]/20 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-[#f97316]/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-xl w-full mx-auto px-6 z-10">
        <div className="bg-[#001533]/90 border border-slate-700/70 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative text-left">
          
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <img
                src="/be11_logo.png"
                alt="BE11 Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <h2 className="font-poppins font-black text-2xl text-white tracking-tight">Create an Account</h2>
            <p className="text-xs text-slate-400 mt-1">Join BE11 to book premier grounds and tournaments.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs font-semibold mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Rohit Verma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>PHONE NUMBER <span className="text-[#f97316]">*</span></span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                />
                <p className="text-[10px] text-slate-400">Required for account and booking details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
                <input
                  required
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Confirm Password</label>
                <input
                  required
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className="font-bold text-white">{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-700'}`}></div>
                  <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-700'}`}></div>
                  <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-700'}`}></div>
                  <div className={`rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-700'}`}></div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 py-1">
              <input
                required
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded bg-[#000d20] border-slate-700 text-[#f97316] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="agree" className="text-[11px] text-slate-300 font-normal leading-snug cursor-pointer">
                I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Privacy Policy</Link>.
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
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-700/60">
              Already have an account?{' '}
              <Link to="/login" className="text-[#f97316] hover:text-[#ea580c] hover:underline font-bold ml-1">
                Sign in
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
export default Signup;
