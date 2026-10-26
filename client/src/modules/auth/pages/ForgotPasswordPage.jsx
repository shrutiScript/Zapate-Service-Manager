import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Wrench,
  Smartphone,
  Package,
  UserCheck,
  Star,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { authService } from '../services/auth.service.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export const ForgotPasswordPage = () => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Current Step: 1 (Identifier), 2 (OTP Verification), 3 (New Password), 4 (Success)
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [maskedContact, setMaskedContact] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  // 6-digit OTP array
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // New Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Loading & Timer
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const timerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  // Set page title and parse initial query params
  useEffect(() => {
    document.title = 'Zapate Service Manager | Reset Workshop Password';
    try {
      const p = new URLSearchParams(window.location.search);
      const id = p.get('identifier') || p.get('email') || p.get('mobile');
      if (id) {
        setIdentifier(id);
      }
      const tok = p.get('token');
      if (tok) {
        setResetToken(tok);
        setStep(3);
      }
    } catch (_) {}
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation(user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, setLocation]);

  // Handle countdown for resend OTP
  useEffect(() => {
    if (step === 2 && resendCountdown > 0) {
      timerRef.current = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [step, resendCountdown]);

  // Handle auto-redirect countdown on Step 4
  useEffect(() => {
    if (step === 4) {
      setRedirectCountdown(4);
      redirectTimerRef.current = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(redirectTimerRef.current);
            setLocation(`/login?identifier=${encodeURIComponent(identifier)}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(redirectTimerRef.current);
    }
  }, [step, identifier, setLocation]);

  // Focus first OTP field when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // STEP 1: Request Password Reset Code
  const handleRequestCode = async (e) => {
    e?.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      toast.error('Please enter your Email, User ID, or registered Mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(cleanId);
      const payload = res?.data || res;
      setMaskedContact(payload?.maskedContact || payload?.maskedEmail || cleanId);
      if (payload?.debugOtp) {
        setDebugOtp(payload.debugOtp);
      }
      setResendCountdown(60);
      setStep(2);
      toast.success('Verification code dispatched to your registered account.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not find account. Please verify credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(identifier.trim());
      const payload = res?.data || res;
      if (payload?.debugOtp) {
        setDebugOtp(payload.debugOtp);
      }
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      toast.success('A fresh 6-digit verification code has been dispatched.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to resend code. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    const targetIdx = Math.min(pasteData.length, 5);
    otpRefs.current[targetIdx]?.focus();
  };

  const handleAutoFillDebug = () => {
    if (!debugOtp) return;
    const digits = debugOtp.split('').slice(0, 6);
    setOtp(digits);
    otpRefs.current[5]?.focus();
    toast.info('Test verification code auto-filled.');
  };

  // STEP 2: Verify Code
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyResetOtp(identifier.trim(), enteredCode);
      const payload = res?.data || res;
      if (payload?.resetToken) {
        setResetToken(payload.resetToken);
      }
      setStep(3);
      toast.success('Identity verified! Create your new workshop password.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired code. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, text: 'Empty', color: '#64748b', percent: 0 };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Weak', color: '#ef4444', percent: 25 };
      case 2:
        return { score: 2, text: 'Fair', color: '#f59e0b', percent: 50 };
      case 3:
        return { score: 3, text: 'Good', color: '#38bdf8', percent: 75 };
      case 4:
        return { score: 4, text: 'Strong', color: '#10b981', percent: 100 };
      default:
        return { score: 0, text: 'Too short', color: '#ef4444', percent: 15 };
    }
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        identifier: identifier.trim(),
        otp: otp.join(''),
        resetToken,
        newPassword,
      });
      setStep(4);
      toast.success('Workshop password updated successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not reset password. Please restart the process.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ap-root">
      {/* ── LEFT SHOWCASE CANVAS (MATCHING LOGIN & REGISTER PARITY) ─── */}
      <div className="ap-hero">
        <div className="ap-orb ap-orb-1" />
        <div className="ap-orb ap-orb-2" />
        <div className="ap-orb ap-orb-3" />
        <div className="ap-grid" />

        <div className="ap-hero-inner">
          {/* Top Branding Navigation */}
          <div className="ap-top-bar">
            <Link href="/" className="ap-brand">
              <div className="ap-brand-icon">
                <Wrench size={20} />
              </div>
              <span className="ap-brand-name">
                <em>Zapate</em> Service Manager
              </span>
            </Link>
            <Link href="/login" className="ap-back-link">
              <ArrowLeft size={13} /> Back to Sign In
            </Link>
          </div>

          {/* Hero Core Content */}
          <div className="ap-hero-body">
            <div className="ap-pill">
              <span className="ap-live-pulse" /> SECURITY GATEWAY • VERIFIED ENCRYPTION
            </div>
            <h1 className="ap-hero-title">
              Restore Access to<br />
              <span className="ap-hero-grad">Workshop Station</span>
            </h1>
            <p className="ap-hero-sub">
              Enterprise cryptographic identity verification protects your repair shop records, customer invoices, technician workflows, and diagnostic data.
            </p>

            {/* 3 Reference Feature Cards */}
            <div className="ap-showcase-cards">
              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Multi-Channel Security Code</strong>
                  <p>Instant 6-digit cryptographic verification code sent to your verified email or mobile.</p>
                </div>
              </div>

              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <KeyRound size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Session Invalidation</strong>
                  <p>Automatically revokes compromised active sessions across all devices upon password reset.</p>
                </div>
              </div>

              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <UserCheck size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Zero Data Loss</strong>
                  <p>Your repair board, inventory stock, customer history, and billing records remain 100% safe.</p>
                </div>
              </div>
            </div>

            {/* Trust & Social Proof Strip */}
            <div className="ap-trust-strip">
              <div className="ap-stars-lockup">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <div className="ap-trust-meta">
                <strong>4.9/5 Rating</strong> • 1,450+ mobile repair shops worldwide
              </div>
            </div>
          </div>

          {/* Hero Bottom Footer */}
          <div className="ap-hero-foot">
            <span>© {new Date().getFullYear()} Zapate Service Manager. All rights reserved.</span>
            <span>256-Bit SSL • SOC2 Certified</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTHENTICATION STUDIO PANE ─────────────────────────── */}
      <div className="ap-form-pane">
        <div className="ap-card wide">
          {/* Top Back Navigation & Security Badge */}
          <div className="fp-top-nav">
            <Link href="/login" className="fp-back-btn">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
            <div className="fp-security-badge">
              <ShieldCheck size={12} /> Secure Gateway
            </div>
          </div>

          {/* Dedicated Ribbon Stepper */}
          {step < 4 && (
            <div className="fp-stepper-wrap">
              <div className={`fp-step-pill ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                <span className="fp-step-badge">{step > 1 ? '✓' : '1'}</span>
                <span>Identify</span>
              </div>
              <div className={`fp-step-divider ${step > 1 ? 'done' : ''}`} />
              <div className={`fp-step-pill ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
                <span className="fp-step-badge">{step > 2 ? '✓' : '2'}</span>
                <span>Verify Code</span>
              </div>
              <div className={`fp-step-divider ${step > 2 ? 'done' : ''}`} />
              <div className={`fp-step-pill ${step === 3 ? 'active' : ''}`}>
                <span className="fp-step-badge">3</span>
                <span>New Password</span>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 1: REQUEST CODE ──────────────── */}
          {step === 1 && (
            <div>
              <div className="ap-card-head">
                <div className="ap-card-icon">
                  <KeyRound size={22} />
                </div>
                <h2>Forgot Password?</h2>
                <p>Enter your workshop account credentials to receive a 6-digit verification code</p>
              </div>

              <form onSubmit={handleRequestCode} className="ap-form">
                <div className="ap-field">
                  <label htmlFor="fp-id">Registered Email, User ID, or Mobile</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico">
                      <Mail size={16} />
                    </span>
                    <input
                      id="fp-id"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. workshop@repairflow.com or OWN-1234"
                      autoComplete="username"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="ap-notice" style={{ marginTop: '4px', marginBottom: '22px' }}>
                  <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>
                    We will send a one-time 6-digit cryptographic security code to your registered email or mobile.
                  </span>
                </div>

                <button type="submit" className="ap-submit-btn" disabled={isLoading || !identifier.trim()}>
                  <span>{isLoading ? 'Verifying Account...' : 'Send Verification Code'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <p className="ap-switch">
                Remember your password?
                <Link href="/login" className="ap-switch-link">
                  Sign In to Workshop
                </Link>
              </p>
            </div>
          )}

          {/* ──────────────── STEP 2: VERIFY OTP ──────────────── */}
          {step === 2 && (
            <div>
              <div className="ap-card-head">
                <div className="ap-card-icon">
                  <ShieldCheck size={22} />
                </div>
                <h2>Verify Your Identity</h2>
                <p>Enter the 6-digit verification code dispatched to your account</p>
              </div>

              {/* Target Confirmation Pill */}
              <div className="fp-target-pill">
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Sent to: </span>
                  <strong>{maskedContact || identifier}</strong>
                </div>
                <button
                  type="button"
                  className="fp-change-btn"
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                  }}
                >
                  Change
                </button>
              </div>

              {/* Developer / Test helper badge */}
              {debugOtp && (
                <div className="fp-dev-chip">
                  <div className="fp-dev-chip-text">
                    <Sparkles size={14} style={{ color: '#f59e0b' }} />
                    <span>Test OTP:</span>
                    <span className="fp-dev-chip-code">{debugOtp}</span>
                  </div>
                  <button type="button" className="fp-dev-autofill-btn" onClick={handleAutoFillDebug}>
                    Auto-Fill Code
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="ap-form">
                {/* 6 Digit Input Group */}
                <div className="fp-otp-wrap" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`fp-otp-input ${digit ? 'filled' : ''}`}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* Resend Code Strip */}
                <div style={{ textAlign: 'center', marginBottom: '22px', fontSize: '12.5px', color: '#94a3b8' }}>
                  {resendCountdown > 0 ? (
                    <span>
                      Resend code in <strong style={{ color: '#60a5fa' }}>{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={13} /> Resend Verification Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="ap-submit-btn"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  <span>{isLoading ? 'Verifying Code...' : 'Verify Code & Proceed'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="ap-card-security">
                <ShieldCheck size={14} />
                <span>Verification code is valid for 15 minutes</span>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: NEW PASSWORD ──────────────── */}
          {step === 3 && (
            <div>
              <div className="ap-card-head">
                <div className="ap-card-icon">
                  <Lock size={22} />
                </div>
                <h2>Create New Password</h2>
                <p>Choose a strong, secure password for your workshop account</p>
              </div>

              <form onSubmit={handleResetPassword} className="ap-form">
                {/* New Password Field */}
                <div className="ap-field">
                  <label htmlFor="fp-new-pw">New Password</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico">
                      <Lock size={16} />
                    </span>
                    <input
                      id="fp-new-pw"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="ap-eye"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="fp-strength-box">
                    <div className="fp-strength-bar">
                      <div
                        className="fp-strength-fill"
                        style={{
                          width: `${strength.percent}%`,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <div className="fp-strength-meta">
                      <span style={{ color: '#94a3b8' }}>Password Strength:</span>
                      <strong style={{ color: strength.color }}>{strength.text}</strong>
                    </div>

                    <div className="fp-criteria-list">
                      <div className={`fp-criteria-item ${newPassword.length >= 6 ? 'met' : ''}`}>
                        <CheckCircle2 size={12} /> At least 6 characters
                      </div>
                      <div className={`fp-criteria-item ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'met' : ''}`}>
                        <CheckCircle2 size={12} /> Mixed uppercase & lowercase
                      </div>
                      <div className={`fp-criteria-item ${/\d/.test(newPassword) ? 'met' : ''}`}>
                        <CheckCircle2 size={12} /> Contains numbers
                      </div>
                      <div className={`fp-criteria-item ${/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}`}>
                        <CheckCircle2 size={12} /> Contains special symbols
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field */}
                <div className="ap-field">
                  <label htmlFor="fp-confirm-pw">Confirm New Password</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico">
                      <Lock size={16} />
                    </span>
                    <input
                      id="fp-confirm-pw"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="ap-eye"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Realtime Match Hint */}
                  {passwordsMatch && (
                    <span style={{ fontSize: '11.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <CheckCircle2 size={12} /> Passwords match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span style={{ fontSize: '11.5px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <AlertCircle size={12} /> Passwords do not match
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="ap-submit-btn"
                  style={{ marginTop: '8px' }}
                  disabled={isLoading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                >
                  <span>{isLoading ? 'Updating Credentials...' : 'Reset Password & Secure Account'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {/* ──────────────── STEP 4: SUCCESS CONFIRMATION ──────────────── */}
          {step === 4 && (
            <div className="fp-success-box">
              <div className="fp-success-icon">
                <CheckCircle2 size={40} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                Password Reset Successfully!
              </h2>

              <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px', maxWidth: '380px' }}>
                Your workshop account credentials have been updated securely. All previous active sessions have been invalidated for security.
              </p>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  width: '100%',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Account:</span>
                  <strong style={{ color: '#f8fafc' }}>{identifier}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: '#94a3b8' }}>Status:</span>
                  <strong style={{ color: '#10b981' }}>Secured & Updated</strong>
                </div>
              </div>

              <Link
                href={`/login?identifier=${encodeURIComponent(identifier)}`}
                className="ap-submit-btn"
                style={{ textDecoration: 'none' }}
              >
                <span>Sign In to Workshop Station</span>
                <ArrowRight size={16} />
              </Link>

              <p style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                Auto-redirecting to Sign In in {redirectCountdown}s...
              </p>
            </div>
          )}

          {/* Security Compliance Footer */}
          {step < 4 && (
            <div className="ap-card-security">
              <ShieldCheck size={14} />
              <span>End-to-End Encrypted Session • Zapate Service Manager Protection</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
