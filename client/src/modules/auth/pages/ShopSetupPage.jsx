import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { toast } from 'sonner';
import {
  Wrench,
  Store,
  MapPin,
  Phone,
  Mail,
  Building,
  Hash,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  FileText,
  LogOut,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../services/api.js';
import { INDIAN_STATES, INDIAN_STATES_CITIES } from '../../../constants/indianStatesCities.js';
import { safeSetItem } from '../../../utils/storage.js';
import { compressImage } from '../../../utils/imageCompressor.js';

export const ShopSetupPage = () => {
  const [, setLocation] = useLocation();
  const { user, logout, refreshUser, updateCurrentShop } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Shop Profile
  const [logo, setLogo] = useState(user?.shop?.logo || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [shopContactNumber, setShopContactNumber] = useState(user?.mobile || '');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');

  // Step 2: Shop Location (Dependent State & City)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState('Karnataka');
  const [city, setCity] = useState('Bengaluru');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityText, setCustomCityText] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');

  // Step 3: Business Settings
  const [businessType, setBusinessType] = useState('Mobile Repair & Multi-Brand Service Lab');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [gstNumber, setGstNumber] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for choosing our repair services! 30-day warranty on replaced hardware components.');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available cities for currently selected state
  const availableCities = state && INDIAN_STATES_CITIES[state] ? INDIAN_STATES_CITIES[state] : [];

  useEffect(() => {
    if (user?.shopName && !shopName) setShopName(user.shopName);
    if (user?.mobile && !shopContactNumber) setShopContactNumber(user.mobile);
    if (user?.email && !businessEmail) setBusinessEmail(user.email);
    if (user?.state && !state) setState(user.state);
    if (user?.city && !city) setCity(user.city);
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 0.85);
        setLogo(compressed);
        toast.success('Custom workshop logo uploaded and optimized successfully!');
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogo(reader.result);
          toast.success('Custom workshop logo uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleStateChange = (newState) => {
    setState(newState);
    setIsCustomCity(false);
    setCustomCityText('');
    const cities = INDIAN_STATES_CITIES[newState] || [];
    if (cities.length > 0) {
      if (cities.includes(city)) {
        // Keep current city if available in new state
      } else {
        setCity(cities[0]);
      }
    } else {
      setCity('');
    }
  };

  const handleCitySelectChange = (val) => {
    if (val === '__CUSTOM__') {
      setIsCustomCity(true);
      setCustomCityText('');
      setCity('');
    } else {
      setIsCustomCity(false);
      setCity(val);
    }
  };

  const handleCustomCityChange = (val) => {
    setCustomCityText(val);
    setCity(val);
  };

  const validateStep1 = () => {
    if (!shopName.trim()) {
      toast.error('Shop Name is required.');
      return false;
    }
    if (!shopContactNumber.trim()) {
      toast.error('Shop Contact Number is required.');
      return false;
    }
    if (!businessEmail.trim() || !/^\S+@\S+\.\S+$/.test(businessEmail.trim())) {
      toast.error('A valid Business Email is required.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!addressLine1.trim()) {
      toast.error('Shop Address Line 1 is required.');
      return false;
    }
    if (!state.trim()) {
      toast.error('State is required.');
      return false;
    }
    if (!city.trim()) {
      toast.error('City is required.');
      return false;
    }
    if (!pincode.trim() || pincode.trim().length < 4) {
      toast.error('A valid Pincode is required.');
      return false;
    }
    if (!country.trim()) {
      toast.error('Country is required.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!businessType.trim()) {
      toast.error('Business Type is required.');
      return false;
    }
    if (!invoicePrefix.trim()) {
      toast.error('Invoice Prefix is required.');
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleStepJump = (stepNumber) => {
    if (stepNumber === currentStep) return;
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
      return;
    }
    if (stepNumber === 2 && validateStep1()) {
      setCurrentStep(2);
    } else if (stepNumber === 3 && validateStep1() && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSignOut = async () => {
    try {
      if (logout) await logout();
      setLocation('/login');
    } catch (_) {
      setLocation('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setIsSubmitting(true);
    const finalLogo = logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName.trim())}&background=2563eb&color=fff&size=150`;
    try {
      await api.post('/shops/setup', {
        logo: finalLogo,
        name: shopName.trim(),
        shopContactNumber: shopContactNumber.trim(),
        businessEmail: businessEmail.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim(),
        businessType: businessType.trim(),
        invoicePrefix: invoicePrefix.trim(),
        gstNumber: gstNumber.trim(),
        invoiceFooter: invoiceFooter.trim(),
      });

      // Synchronize latest verified session with backend
      if (updateCurrentShop) {
        updateCurrentShop({
          name: shopName.trim(),
          shopName: shopName.trim(),
          phone: shopContactNumber.trim(),
          email: businessEmail.trim(),
          address: [addressLine1, addressLine2, landmark, city, state, pincode].filter(Boolean).join(', '),
          logo,
          businessType,
          gstNumber,
          invoicePrefix,
          invoiceFooter,
          onboardingCompleted: true,
        });
      }
      if (refreshUser) {
        await refreshUser();
      } else if (user) {
        const updated = { ...user, shopName: shopName.trim(), onboardingCompleted: true };
        safeSetItem('rf_auth_user', updated);
      }

      toast.success('Workshop setup complete! Welcome to your dashboard.', { duration: 4000 });
      setLocation('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Setup submission failed. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addressPreview = [addressLine1, addressLine2, landmark, city, state, pincode, country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="ws-setup-wrapper">
      {/* Radiant ambient backgrounds */}
      <div className="ap-orb ap-orb-1" />
      <div className="ap-orb ap-orb-2" />
      <div className="ap-orb ap-orb-3" />
      <div className="ap-grid" />

      {/* Top Floating Utility Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          zIndex: 10,
        }}
      >
        <Link href="/" className="ap-brand">
          <div className="ap-brand-icon">
            <Wrench size={20} />
          </div>
          <span className="ap-brand-name">
            <em>Repair</em>Flow
          </span>
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Signed in as <strong style={{ color: '#ffffff' }}>{user.name || user.email}</strong>
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Glassmorphic Setup Card */}
      <div className="ws-setup-card">
        {/* Header Lockup */}
        <div className="ws-setup-header">
          <div className="ws-setup-pill">
            <span className="ap-live-pulse" /> WORKSHOP OS 3.0 • STEP {currentStep} OF 3
          </div>

          <div className="ws-setup-icon">
            <Wrench size={26} />
          </div>

          <h1 className="ws-setup-title">Complete Workshop Setup</h1>
          <p className="ws-setup-subtitle">
            Configure your workshop branding, service center location, and invoicing preferences before launching your dashboard.
          </p>

          {/* Stepper Wizard Bar */}
          <div className="ws-stepper-bar">
            {[
              { step: 1, title: '1. Shop Profile', icon: Store },
              { step: 2, title: '2. Location', icon: MapPin },
              { step: 3, title: '3. Business & Invoicing', icon: FileText },
            ].map((s) => {
              const IconComponent = s.icon;
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => handleStepJump(s.step)}
                  className={`ws-step-btn ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={15} style={{ color: '#34d399' }} />
                  ) : (
                    <IconComponent size={15} />
                  )}
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Form Area */}
        <form onSubmit={currentStep === 3 ? handleSubmit : handleNext}>
          {/* STEP 1: SHOP PROFILE */}
          {currentStep === 1 && (
            <div className="ap-form">
              <div className="ws-step-banner">
                <Store size={18} />
                <span>Step 1: Workshop Branding & Contact Profile</span>
              </div>

              {/* Logo Selection / Upload */}
              <div className="ap-field">
                <label>Workshop Brand Logo (Optional)</label>
                <div className="ws-logo-container">
                  <div className="ws-logo-preview">
                    {logo ? (
                      <img src={logo} alt="Workshop Logo Preview" />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#60a5fa',
                        }}
                      >
                        <Store size={30} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="ws-upload-label">
                        <Upload size={14} /> {logo ? 'Change Custom Logo' : 'Upload Custom Logo'}
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo('')}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: '#94a3b8',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      PNG, JPG or SVG up to 5MB. Recommended square format (400x400px).
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Name */}
              <div className="ap-field">
                <label>Workshop / Shop Name *</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico"><Store size={16} /></span>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Gayatri Mobile & Electronics Care Lab"
                    required
                  />
                </div>
              </div>

              {/* Contact Info Two-Column */}
              <div className="ap-two-col">
                <div className="ap-field">
                  <label>Workshop Contact Number *</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico"><Phone size={16} /></span>
                    <input
                      type="tel"
                      value={shopContactNumber}
                      onChange={(e) => setShopContactNumber(e.target.value)}
                      placeholder="+91 98450 11223"
                      required
                    />
                  </div>
                </div>

                <div className="ap-field">
                  <label>Official Business Email *</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico"><Mail size={16} /></span>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="support@workshop.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Interactive preview badge */}
              {shopName && (
                <div className="ws-preview-tag" style={{ marginTop: '10px' }}>
                  <span>Branding Preview:</span>
                  <strong>{shopName}</strong>
                  {shopContactNumber && <span>• {shopContactNumber}</span>}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SHOP LOCATION WITH DEPENDENT STATE & CITY */}
          {currentStep === 2 && (
            <div className="ap-form">
              <div className="ws-step-banner">
                <MapPin size={18} />
                <span>Step 2: Workshop Physical Address & Service Center</span>
              </div>

              <div className="ap-field">
                <label>Workshop Address Line 1 *</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico"><MapPin size={16} /></span>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Shop #4, Ground Floor, Central Electronics Complex"
                    required
                  />
                </div>
              </div>

              <div className="ap-two-col">
                <div className="ap-field">
                  <label>Address Line 2 (Optional)</label>
                  <div className="ap-input-wrap">
                    <input
                      type="text"
                      style={{ paddingLeft: '14px' }}
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Near City Metro Station"
                    />
                  </div>
                </div>

                <div className="ap-field">
                  <label>Landmark (Optional)</label>
                  <div className="ap-input-wrap">
                    <input
                      type="text"
                      style={{ paddingLeft: '14px' }}
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Opposite Grand Mall"
                    />
                  </div>
                </div>
              </div>

              <div className="ws-input-grid-4">
                {/* State Dropdown Selection */}
                <div className="ap-field">
                  <label>State *</label>
                  <div className="ap-input-wrap">
                    <select
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="ap-select-arrow">
                      <ChevronDown size={15} />
                    </span>
                  </div>
                </div>

                {/* City Dropdown Selection (Only cities of selected state) */}
                <div className="ap-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>City *</label>
                    {isCustomCity && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCity(false);
                          setCity(availableCities[0] || '');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Select from list
                      </button>
                    )}
                  </div>
                  <div className="ap-input-wrap">
                    {isCustomCity ? (
                      <input
                        type="text"
                        style={{ paddingLeft: '14px' }}
                        value={customCityText}
                        onChange={(e) => handleCustomCityChange(e.target.value)}
                        placeholder={`Enter town in ${state || 'state'}`}
                        required
                        autoFocus
                      />
                    ) : (
                      <>
                        <select
                          value={availableCities.includes(city) ? city : (availableCities[0] || '')}
                          onChange={(e) => handleCitySelectChange(e.target.value)}
                          required
                        >
                          {availableCities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="__CUSTOM__">+ Other / Type Custom City</option>
                        </select>
                        <span className="ap-select-arrow">
                          <ChevronDown size={15} />
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pincode Input */}
                <div className="ap-field">
                  <label>Pincode / ZIP *</label>
                  <div className="ap-input-wrap">
                    <input
                      type="text"
                      style={{ paddingLeft: '14px' }}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="560038"
                      required
                    />
                  </div>
                </div>

                {/* Country Input */}
                <div className="ap-field">
                  <label>Country *</label>
                  <div className="ap-input-wrap">
                    <input
                      type="text"
                      style={{ paddingLeft: '14px' }}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Formatted address preview badge */}
              {addressPreview && (
                <div className="ws-preview-tag" style={{ marginTop: '12px' }}>
                  <span>📍 Customer Invoice Address:</span>
                  <strong>{addressPreview}</strong>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: BUSINESS SETTINGS */}
          {currentStep === 3 && (
            <div className="ap-form">
              <div className="ws-step-banner">
                <FileText size={18} />
                <span>Step 3: Business Type & Invoicing Configuration</span>
              </div>

              <div className="ap-two-col">
                <div className="ap-field">
                  <label>Business Specialty / Category *</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico"><Building size={16} /></span>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Mobile Repair & Multi-Brand Service Lab"
                      required
                    />
                  </div>
                </div>

                <div className="ap-field">
                  <label>Invoice Prefix *</label>
                  <div className="ap-input-wrap">
                    <span className="ap-input-ico"><Hash size={16} /></span>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="INV-"
                      required
                    />
                  </div>
                  <div className="ws-preview-tag">
                    <span>Invoice Preview:</span>
                    <strong>{invoicePrefix.trim() || 'INV-'}1001</strong>
                  </div>
                </div>
              </div>

              <div className="ap-field">
                <label>GST / Tax Registration Number (Optional)</label>
                <div className="ap-input-wrap">
                  <span className="ap-input-ico"><Building size={16} /></span>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="ap-field">
                <label>Invoice Footer Terms & Warranty Notice (Optional)</label>
                <textarea
                  className="ws-textarea"
                  rows={2}
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                  placeholder="Terms printed at the bottom of customer bills..."
                />
              </div>

              {/* Ready-to-go trust badges */}
              <div className="ws-feature-badges">
                <div className="ws-feat-item">
                  <CheckCircle2 size={14} /> Instant PDF Invoices
                </div>
                <div className="ws-feat-item">
                  <CheckCircle2 size={14} /> Automated 30-Day Hardware Warranty
                </div>
                <div className="ws-feat-item">
                  <CheckCircle2 size={14} /> SMS & WhatsApp Status Ready
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="ws-nav-actions">
            {currentStep > 1 ? (
              <button
                type="button"
                className="ws-back-btn"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className="ap-submit-btn"
                style={{ width: 'auto', minWidth: '180px', padding: '0 24px' }}
                onClick={handleNext}
              >
                Continue to Step {currentStep + 1} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="ap-submit-btn"
                style={{ width: 'auto', minWidth: '240px', padding: '0 28px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Workshop...' : 'Complete Setup & Launch Dashboard'}
                <Sparkles size={16} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Security compliance footer */}
      <div className="ap-card-security" style={{ marginTop: '24px', zIndex: 10 }}>
        <Shield size={14} />
        <span>Enterprise 256-Bit SSL Encryption • Multi-Tenant Workshop Isolation</span>
      </div>
    </div>
  );
};
