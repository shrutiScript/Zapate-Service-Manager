import React, { useState, useEffect } from 'react';
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
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { AppLoading } from '../../../components/common/AppLoading.jsx';
import { consumeBlockedNotice } from '../../../utils/sessionManager.js';

export const LoginPage = () => {
  const [, setLocation] = useLocation();
  const { login, user, isAuthenticated, isLoading, authLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(null);

  useEffect(() => {
    document.title = 'Zapate Service Manager | Workshop Sign In';
    // Check if redirected here due to an admin block
    const notice = consumeBlockedNotice();
    if (notice) {
      setBlockedNotice(notice);
      toast.error(notice, { duration: 6000 });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const activeStatus = String(user?.status || 'ACTIVE').trim().toUpperCase();
    if (isAuthenticated && user && activeStatus === 'ACTIVE') {
      const dest = user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard';
      setLocation(dest);
    }
  }, [isAuthenticated, user, authLoading, setLocation]);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const id = p.get('identifier') || p.get('email') || p.get('mobile');
      if (id) {
        setIdentifier(id);
        setAutoFilledNotice(true);
      }
    } catch (_) {}
  }, []);

  if (authLoading) return <AppLoading message="Verifying workshop session..." />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPw = password;

    if (!cleanId && !cleanPw) {
      toast.error('User ID and Password are required.');
      return;
    }
    if (!cleanId) {
      toast.error('User ID is required.');
      return;
    }
    if (!cleanPw) {
      toast.error('Password is required.');
      return;
    }

    try {
      const u = await login(cleanId, cleanPw);
      toast.success(`Welcome back, ${u?.name || 'User'}!`);
      if (u?.role === 'SUPER_ADMIN') {
        setLocation('/admin/dashboard');
      } else if (u?.role === 'SHOP_OWNER' && !u?.onboardingCompleted) {
        setLocation('/shop-setup');
      } else {
        setLocation('/dashboard');
      }
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('blocked') || err?.isBlocked || err?.status === 403) {
        const fullMsg = 'Your workshop account has been blocked by the administrator. Please contact support.';
        setBlockedNotice(fullMsg);
        toast.error(fullMsg, { duration: 6000 });
      } else {
        toast.error('Invalid User ID or Password.');
      }
    }
  };

  return (
    <div className="ap-root">
      {/* ── LEFT SHOWCASE CANVAS ─────────────────────────────────────── */}
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
            <Link href="/" className="ap-back-link">
              <ArrowLeft size={13} /> Back to Home
            </Link>
          </div>

          {/* Hero Core Content */}
          <div className="ap-hero-body">
            <div className="ap-pill">
              <span className="ap-live-pulse" /> WORKSHOP OS 3.0 • INSTANT ONBOARDING
            </div>
            <h1 className="ap-hero-title">
              Power Your<br />
              <span className="ap-hero-grad">Mobile Repair Shop</span>
            </h1>
            <p className="ap-hero-sub">
              Empower your repair team with intelligent ticketing, device diagnostics,
              spare parts tracking, and customer repair history.
            </p>

            {/* 3 Reference Feature Cards */}
            <div className="ap-showcase-cards">
              {/* Card 1: Screen & Battery Repairs */}
              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <Smartphone size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Screen & Battery Repairs</strong>
                  <p>Manage screen replacements, battery repairs, and device health with ease.</p>
                </div>
              </div>

              {/* Card 2: Smart Parts Inventory */}
              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <Package size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Smart Parts Inventory</strong>
                  <p>Track spare parts in real-time and get low-stock alerts automatically.</p>
                </div>
              </div>

              {/* Card 3: Customer Repair History */}
              <div className="ap-feature-card">
                <div className="ap-feat-icon-box">
                  <UserCheck size={20} />
                </div>
                <div className="ap-feat-content">
                  <strong>Customer Repair History</strong>
                  <p>Access complete repair history, device details, and warranty information.</p>
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
        <div className="ap-card">
          {/* Segmented Tab Switcher */}
          <div className="ap-tabs-wrapper">
            <button type="button" className="ap-tab-btn active">
              <LogIn size={15} /> Sign In
            </button>
            <Link href="/register" className="ap-tab-btn">
              <UserPlus size={15} /> Create Workshop
            </Link>
          </div>

          {/* Card Header */}
          <div className="ap-card-head">
            <div className="ap-card-icon">
              <KeyRound size={22} />
            </div>
            <h2>Welcome to Zapate Service Manager</h2>
            <p>Sign in to your workshop station</p>
          </div>

          {blockedNotice && (
            <div
              className="ap-notice"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span>{blockedNotice}</span>
            </div>
          )}

          {autoFilledNotice && !blockedNotice && (
            <div className="ap-notice">
              <CheckCircle2 size={16} />
              Account verified. Please enter your password to continue.
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} noValidate className="ap-form">
            {/* Identifier Input */}
            <div className="ap-field">
              <label htmlFor="li-id">User ID / Username / Email</label>
              <div className="ap-input-wrap">
                <span className="ap-input-ico">
                  <Mail size={16} />
                </span>
                <input
                  id="li-id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter User ID, email or mobile"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="ap-field">
              <div className="ap-field-top">
                <label htmlFor="li-pw">Password</label>
                <button
                  type="button"
                  className="ap-forgot"
                  onClick={() => toast.info('Please contact your Super Admin or workshop manager to reset credentials.')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="ap-input-wrap">
                <span className="ap-input-ico">
                  <Lock size={16} />
                </span>
                <input
                  id="li-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="ap-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="ap-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember this device for 30 days</span>
            </label>

            {/* Radiant CTA Button */}
            <button type="submit" className="ap-submit-btn" disabled={isLoading}>
              <span>{isLoading ? 'Authenticating Station...' : 'Sign In to Workshop'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Switch Prompt */}
          <p className="ap-switch">
            Don't have an account?
            <Link href="/register" className="ap-switch-link">
              Create Workshop Account
            </Link>
          </p>

          {/* Compliance & Security */}
          <div className="ap-card-security">
            <ShieldCheck size={14} />
            <span>256-Bit SSL Encryption • Multi-Tenant Data Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
