import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  User,
  Store,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  LogIn,
  UserPlus,
  Wrench,
  Smartphone,
  Package,
  UserCheck,
  Star,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { AppLoading } from '../../../components/common/AppLoading.jsx';

export const RegisterPage = () => {
  const [, setLocation] = useLocation();
  const { register, isLoading, authLoading, isAuthenticated, user } = useAuth();
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(null);
  const [countdown, setCountdown] = useState(4);
  const timerRef = useRef(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    document.title = 'Zapate Service Manager | Register Workshop';
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    if (plan) {
      setSelectedPlan(plan);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user) {
      setLocation(user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, authLoading, setLocation]);

  useEffect(() => {
    if (!duplicateModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setCountdown(4);
    timerRef.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setLocation(`/login?identifier=${encodeURIComponent(duplicateModal.identifier || email)}`);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [duplicateModal, email, setLocation]);

  if (authLoading) return <AppLoading message="Verifying workspace session..." />;

  const goLogin = () => {
    clearInterval(timerRef.current);
    setLocation(`/login?identifier=${encodeURIComponent(duplicateModal?.identifier || email || mobile)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (!shopName.trim()) {
      toast.error('Workshop Name is required');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 8) {
      toast.error('Enter a valid mobile contact number');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await register({
        name: name.trim(),
        shopName: shopName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
        plan: selectedPlan || undefined,
      });
      toast.success('Workshop account created! Redirecting to sign in...', { duration: 4000 });
      setLocation(`/login?identifier=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      if (err.isDuplicate) {
        const val = err.existingValue || (err.duplicateField === 'mobile' ? mobile.trim() : email.trim().toLowerCase());
        setDuplicateModal({
          message: err.duplicateField === 'mobile' ? 'This mobile number is already registered.' : 'An account with this email already exists.',
          identifier: val,
        });
      } else {
        toast.error(err.message || 'Registration failed. Please verify your details.');
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
              Launch Your<br />
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
        <div className="ap-card wide" style={{ position: 'relative' }}>
          {/* Segmented Tab Switcher */}
          <div className="ap-tabs-wrapper">
            <Link href="/login" className="ap-tab-btn">
              <LogIn size={15} /> Sign In
            </Link>
            <button type="button" className="ap-tab-btn active">
              <UserPlus size={15} /> Create Workshop
            </button>
          </div>

          {/* Card Header */}
          <div className="ap-card-head">
            <div className="ap-card-icon">
              <UserPlus size={22} />
            </div>
            <h2>Create Workshop Account</h2>
            <p>Register your repair shop and get started in under 2 minutes</p>
          </div>

          {/* Selected Plan Banner if arriving from pricing table */}
          {selectedPlan && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#1e40af',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                <span>Selected Plan: <strong>{selectedPlan}</strong> (14-Day Free Trial included)</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Change
              </button>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="ap-form">
            <div className="ap-two-col">
              <div className="ap-field">
                <label htmlFor="rg-name">Full Name</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <User size={16} />
                  </span>
                  <input
                    id="rg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    required
                    disabled={isLoading || !!duplicateModal}
                  />
                </div>
              </div>
              <div className="ap-field">
                <label htmlFor="rg-shop">Workshop Name</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <Store size={16} />
                  </span>
                  <input
                    id="rg-shop"
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Apex Tech Lab"
                    required
                    disabled={isLoading || !!duplicateModal}
                  />
                </div>
              </div>
            </div>

            <div className="ap-two-col">
              <div className="ap-field">
                <label htmlFor="rg-email">Email Address</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <Mail size={16} />
                  </span>
                  <input
                    id="rg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@workshop.com"
                    required
                    disabled={isLoading || !!duplicateModal}
                  />
                </div>
              </div>
              <div className="ap-field">
                <label htmlFor="rg-mobile">Mobile Number</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <Phone size={16} />
                  </span>
                  <input
                    id="rg-mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98450 11223"
                    required
                    disabled={isLoading || !!duplicateModal}
                  />
                </div>
              </div>
            </div>

            <div className="ap-two-col">
              <div className="ap-field">
                <label htmlFor="rg-pw">Password</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <Lock size={16} />
                  </span>
                  <input
                    id="rg-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isLoading || !!duplicateModal}
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
              <div className="ap-field">
                <label htmlFor="rg-cpw">Confirm Password</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico">
                    <Lock size={16} />
                  </span>
                  <input
                    id="rg-cpw"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={isLoading || !!duplicateModal}
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
              </div>
            </div>

            {/* Radiant Submit CTA Button */}
            <button
              type="submit"
              className="ap-submit-btn"
              style={{ marginTop: '8px' }}
              disabled={isLoading || !!duplicateModal}
            >
              <span>{isLoading ? 'Launching Station...' : 'Launch Workshop Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Switch Prompt */}
          <p className="ap-switch">
            Already have an active account?
            <Link href="/login" className="ap-switch-link">
              Sign In Here
            </Link>
          </p>

          {/* Security Compliance */}
          <div className="ap-card-security">
            <ShieldCheck size={14} />
            <span>256-Bit SSL Encryption • Multi-Tenant Data Isolation</span>
          </div>

          {/* Duplicate Account Alert Modal */}
          {duplicateModal && (
            <div className="ap-dup-overlay">
              <div className="ap-dup-icon">
                <AlertCircle size={28} />
              </div>
              <h3>Account Already Registered</h3>
              <p>{duplicateModal.message}</p>
              <div className="ap-dup-timer">
                Redirecting to Sign In in <strong>{countdown}s...</strong>
              </div>
              <div className="ap-dup-actions">
                <button className="ap-submit-btn" onClick={goLogin} type="button">
                  <LogIn size={15} /> Sign In Now
                </button>
                <button
                  className="ap-dup-cancel"
                  type="button"
                  onClick={() => {
                    clearInterval(timerRef.current);
                    setDuplicateModal(null);
                  }}
                >
                  Stay on Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
