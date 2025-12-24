import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// OTP Input Component - Individual digit boxes (no auto-submit)
const OTPInput = ({ value, onChange, disabled }) => {
  const inputRefs = useRef([]);
  const digits = value.padEnd(6, '').split('');

  const handleChange = (index, e) => {
    if (disabled) return;
    const val = e.target.value.replace(/\D/g, '');

    // Handle multi-character input (paste into single field)
    if (val.length > 1) {
      const newValue = val.slice(0, 6);
      onChange(newValue);
      const nextIndex = Math.min(newValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = val;
    onChange(newDigits.join('').slice(0, 6));

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (disabled) return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          className="w-10 h-11 text-center text-lg font-bold rounded-lg border-2 transition-colors outline-none disabled:opacity-50"
          style={{
            color: 'var(--theme-textPrimary)',
            backgroundColor: digits[index] ? 'var(--theme-primaryLight)' : 'var(--theme-cardBackground)',
            borderColor: digits[index] ? 'var(--theme-primary)' : 'var(--theme-border)'
          }}
        />
      ))}
    </div>
  );
};

const LoginPage = () => {
  const [step, setStep] = useState('employee_id');
  const [employeeId, setEmployeeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { requestOTP, verifyOTP, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);


  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    if (!employeeId.trim()) return;

    setIsLoading(true);

    try {
      await requestOTP(employeeId.trim());
      setStep('otp');
      setCountdown(60);
      addToast('success', 'Login code sent to your email');
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        addToast('error', 'Too many requests. Please wait.');
      } else {
        addToast('error', err.message || 'Failed to send login code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otpCode.length !== 6 || isLoading) return;

    setIsLoading(true);
    try {
      const result = await verifyOTP(employeeId.trim(), otpCode);
      // Check if call was blocked by AuthContext lock
      if (result?.blocked) {
        return;
      }
      addToast('success', 'Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      addToast('error', err.message || 'Invalid code');
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await requestOTP(employeeId.trim());
      setCountdown(60);
      setOtpCode('');
      addToast('success', 'New code sent');
    } catch (err) {
      addToast('error', err.message || 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('employee_id');
    setOtpCode('');
    setCountdown(0);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--theme-background)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-lg font-bold text-white"
            style={{ background: 'var(--theme-primary)' }}
          >
            AU
          </div>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--theme-textPrimary)' }}
          >
            Asset Management
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--theme-textSecondary)' }}
          >
            Ajman University
          </p>
        </div>

        {/* Login Card */}
        <div className="premium-card p-5">
          {/* Step Indicator */}
          <div className="flex justify-center gap-1.5 mb-5">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: step === 'employee_id' ? '24px' : '8px',
                background: step === 'employee_id' ? 'var(--theme-primary)' : 'var(--theme-border)'
              }}
            />
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: step === 'otp' ? '24px' : '8px',
                background: step === 'otp' ? 'var(--theme-primary)' : 'var(--theme-border)'
              }}
            />
          </div>

          {step === 'employee_id' ? (
            <div>
              <div className="text-center mb-5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--theme-textPrimary)' }}
                >
                  Sign In
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--theme-textSecondary)' }}
                >
                  Enter your Employee ID
                </p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label
                    htmlFor="employee_id"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--theme-textPrimary)' }}
                  >
                    Employee ID
                  </label>
                  <input
                    id="employee_id"
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g., 5763"
                    required
                    autoFocus
                    autoComplete="username"
                    disabled={isLoading}
                    className="input-premium w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !employeeId.trim()}
                  className="btn-premium w-full h-10 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--theme-textPrimary)' }}
                >
                  Enter Code
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--theme-textSecondary)' }}
                >
                  6-digit code sent to your email
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="btn-premium w-full h-10 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                <div className="flex justify-between items-center text-sm pt-1">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                    style={{ color: 'var(--theme-textSecondary)' }}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading || countdown > 0}
                    className="font-medium transition-colors disabled:opacity-50"
                    style={{
                      color: countdown > 0 ? 'var(--theme-textLight)' : 'var(--theme-primary)'
                    }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: 'var(--theme-textLight)' }}
        >
          Need help? <a href="mailto:it@ajman.ac.ae" className="hover:underline" style={{ color: 'var(--theme-primary)' }}>Contact IT</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
