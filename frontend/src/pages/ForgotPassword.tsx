import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlCode = searchParams.get('code');
    if (urlEmail) {
      setEmail(urlEmail);
    }
    if (urlCode) {
      setCode(urlCode);
      setStep(2);
    }
  }, [searchParams]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setInfoMsg('If an account matches that email, a 6-digit verification code has been issued.');
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, code, password });
      alert('Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#001026] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full mx-auto px-6 z-10">
        <div className="bg-[#00183b]/90 border border-slate-700/60 rounded-[28px] p-8 shadow-2xl backdrop-blur-xl relative text-left">
          
          <div className="text-center mb-6">
            <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Reset Password</h3>
            <p className="text-xs text-slate-300 mt-1">Recover access to your BE11 account.</p>
          </div>

          {infoMsg && (
            <div className="bg-blue-950/60 border border-blue-500/30 text-blue-200 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {infoMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs font-semibold mb-4">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#f97316] hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
              >
                {loading ? 'Sending Code...' : 'Get Verification PIN'}
              </button>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                Remember your password?{' '}
                <Link to="/login" className="text-orange-400 hover:underline font-bold">Sign in</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">6-Digit Verification PIN</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 text-center font-bold tracking-widest text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">New Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Confirm Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#000d20] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#f97316] hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-md active:scale-95 duration-150"
              >
                {loading ? 'Resetting Password...' : 'Save & Login'}
              </button>

              <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-orange-400 hover:underline font-bold cursor-pointer"
                >
                  ← Request new PIN
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
