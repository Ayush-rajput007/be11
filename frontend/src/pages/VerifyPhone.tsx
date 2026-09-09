import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatPhoneDisplay, canonicalPhone } from '@be11/shared';

export const VerifyPhone: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialPhone = (location.state as any)?.phone || searchParams.get('phone') || '';
  const initialEmail = (location.state as any)?.email || searchParams.get('email') || '';

  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);

  // 6 digits OTP array state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // 60s initial cooldown
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verified, setVerified] = useState(false);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Sync state if coming from params/state
  useEffect(() => {
    const p = (location.state as any)?.phone || searchParams.get('phone') || '';
    const em = (location.state as any)?.email || searchParams.get('email') || '';
    if (p) setPhone(p);
    if (em) setEmail(em);
  }, [searchParams, location.state]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg('');
    const digit = val.replace(/[^\d]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6);
    if (pasteData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasteData[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!phone && !email) {
      setErrorMsg('Missing phone number or email context. Please return to signup.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/verify-phone-otp', {
        phone: phone ? canonicalPhone(phone) : undefined,
        email: email ? email.trim() : undefined,
        code: fullCode,
      });

      setVerified(true);
      setSuccessMsg('Phone number verified successfully.');

      // Proceed to Step 3: Email Verification
      setTimeout(() => {
        navigate('/verify-email', {
          state: {
            email: res.data.data?.email || email,
            phone: res.data.data?.phone || phone,
          },
        });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await api.post('/auth/send-phone-otp', {
        phone: phone ? canonicalPhone(phone) : undefined,
        email: email ? email.trim() : undefined,
      });

      setSuccessMsg(res.data.message || 'Verification code resent to your phone.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#000c1e] text-white flex items-center justify-center relative font-poppins overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#0a2e6e]/20 blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#f97316]/10 blur-[140px] pointer-events-none"></div>

        <div className="max-w-md w-full mx-auto px-6 z-10">
          <div className="bg-[#001533]/90 border border-slate-700/70 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl text-emerald-400">check_circle</span>
            </div>

            <h3 className="font-poppins font-black text-xl text-white uppercase tracking-wider">Phone Verified!</h3>
            <p className="text-xs text-slate-300 mt-2 mb-6">
              Your phone number has been verified successfully. Continuing to email verification...
            </p>

            <button
              type="button"
              onClick={() => navigate('/verify-email', { state: { email, phone } })}
              className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-lg active:scale-98 duration-150 flex items-center justify-center gap-2"
            >
              <span>Continue to Email Verification</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#000c1e] text-white flex items-center justify-center relative font-poppins overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#0a2e6e]/20 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-[#f97316]/10 blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto px-6 z-10">
        <div className="bg-[#001533]/90 border border-slate-700/70 rounded-[28px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative text-left">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img src="/be11_logo.png" alt="BE11 Logo" className="h-10 w-auto object-contain" />
            </div>
            <h2 className="font-poppins font-black text-2xl text-white tracking-tight">Verify Phone Number</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              We sent a 6-digit verification code to
            </p>
            <p className="text-sm font-bold text-[#f97316] mt-1 tracking-wide">
              {formatPhoneDisplay(phone) || '+91 ••••• •••••'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs font-semibold mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs font-semibold mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-emerald-400 shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="space-y-6">
            {/* 6 Digit Input Group */}
            <div className="space-y-2 text-center">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-[#000d20] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/40 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center cursor-pointer transition-all shadow-lg active:scale-98 duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verifying phone...</span>
                </>
              ) : (
                'Verify Phone'
              )}
            </button>

            <div className="text-center space-y-2 pt-2 border-t border-slate-700/60">
              <p className="text-xs text-slate-400">
                Didn't receive the code?{' '}
                {cooldown > 0 ? (
                  <span className="text-slate-500 font-medium">Resend code in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-[#f97316] hover:text-[#ea580c] hover:underline font-bold cursor-pointer transition-all inline-block ml-1"
                  >
                    {resending ? 'Sending...' : 'RESEND OTP'}
                  </button>
                )}
              </p>

              <div>
                <Link
                  to="/signup"
                  className="text-[11px] text-slate-400 hover:text-white hover:underline transition-colors inline-block"
                >
                  Change phone number
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhone;
