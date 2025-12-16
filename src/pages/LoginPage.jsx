import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LoginPage = () => {
  const [step, setStep] = useState('employee_id'); // 'employee_id' or 'otp'
  const [employeeId, setEmployeeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { requestOTP, verifyOTP, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    setIsLoading(true);

    try {
      await requestOTP(employeeId.trim());
      setStep('otp');
      setCountdown(60); // 60 second cooldown before resend
      addToast('success', 'If an account exists, an OTP has been sent to your email');
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        addToast('error', 'Too many requests. Please wait before trying again.');
      } else {
        addToast('error', err.message || 'Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    setIsLoading(true);

    try {
      await verifyOTP(employeeId.trim(), otpCode);
      addToast('success', 'Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      addToast('error', err.message || 'Invalid OTP');
      // Clear OTP input on error
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
      addToast('success', 'A new OTP has been sent to your email');
    } catch (err) {
      addToast('error', err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('employee_id');
    setOtpCode('');
    setCountdown(0);
  };

  // Handle OTP input - only allow numbers
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--theme-background)' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
            Ajman University
          </h1>
          <h2 className="mt-2 text-xl" style={{ color: 'var(--theme-text-secondary)' }}>
            Asset Management System
          </h2>
          <p className="mt-4 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            {step === 'employee_id'
              ? 'Enter your Employee ID to receive a login code'
              : 'Enter the 6-digit code sent to your email'
            }
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          {step === 'employee_id' ? (
            // Step 1: Employee ID Form
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label
                  htmlFor="employee_id"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  Employee ID
                </label>
                <input
                  id="employee_id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your Employee ID"
                  required
                  autoFocus
                  autoComplete="username"
                  className="input-field w-full"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !employeeId.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Login Code
                  </>
                )}
              </button>
            </form>
          ) : (
            // Step 2: OTP Verification Form
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label
                  htmlFor="otp_code"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  Login Code
                </label>
                <input
                  id="otp_code"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoFocus
                  autoComplete="one-time-code"
                  className="input-field w-full text-center text-2xl tracking-[0.5em] font-mono"
                  disabled={isLoading}
                  style={{ letterSpacing: '0.5em' }}
                />
                <p className="mt-2 text-sm text-center" style={{ color: 'var(--theme-text-secondary)' }}>
                  Code sent to your registered email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Login
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                  disabled={isLoading}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading || countdown > 0}
                  className="flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: countdown > 0 ? 'var(--theme-text-secondary)' : 'var(--theme-primary)' }}
                >
                  <i className="fas fa-redo"></i>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
          Contact IT support if you have trouble logging in
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
