import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Wrench,
  Store,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../services/api.js';
import { safeSetItem } from '../../../utils/storage.js';

export const OnboardingPage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [shopName, setShopName] = useState(user?.shopName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceFooter, setInvoiceFooter] = useState('30-day warranty on replaced hardware components. Physical/water damage voids warranty.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Zapate Service Manager | Workshop Onboarding';
  }, []);

  useEffect(() => {
    if (user?.shopName) setShopName(user.shopName);
    if (user?.mobile) setMobile(user.mobile);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopName.trim()) {
      toast.error('Shop Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/shops/onboarding', {
        name: shopName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstNumber: gstNumber.trim(),
        invoicePrefix: invoicePrefix.trim() || 'INV-',
        invoiceFooter: invoiceFooter.trim(),
      });

      // Update user in local storage to onboardingCompleted = true
      if (user) {
        const updated = { ...user, shopName: shopName.trim(), onboardingCompleted: true };
        safeSetItem('rf_auth_user', updated);
      }

      toast.success('Workshop setup complete! Welcome to your operational dashboard.', { duration: 4000 });
      setLocation('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save setup details. Launching dashboard...');
      setLocation('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: '40px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Header Lockup */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Wrench size={26} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: '#eff6ff',
              borderRadius: 'var(--radius-full)',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            <CheckCircle2 size={13} /> Account Approved & Active
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
            Welcome to Zapate Service Manager!
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Your workshop account is ready. Let's configure your store profile & invoice settings.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section: Business Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              1. Workshop Profile
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Shop / Business Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Store size={15} /></span>
                  <input
                    type="text"
                    className="input-control input-with-icon"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shop Contact Number</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Phone size={15} /></span>
                  <input
                    type="tel"
                    className="input-control input-with-icon"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 9845011223"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Workshop Address / Street</label>
              <div className="input-wrapper">
                <span className="input-icon"><MapPin size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop #4, Ground Floor, Electronics Market"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="input-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="input-control"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="input-control"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="560038"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <div className="input-wrapper">
                <span className="input-icon"><Building size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>

          {/* Section: Invoice Settings */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              2. Invoice & Billing Defaults
            </h3>

            <div className="form-group">
              <label className="form-label">Invoice Number Prefix</label>
              <div className="input-wrapper">
                <span className="input-icon"><Hash size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-"
                />
              </div>
              <small style={{ fontSize: '11px', color: '#94a3b8' }}>
                Preview: <strong>{invoicePrefix}1001</strong>
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Footer Terms & Warranty Note</label>
              <textarea
                className="textarea-control"
                rows={2}
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                placeholder="Warranty terms and thank you note printed at the bottom of bills..."
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Configuration...' : 'Complete Shop Setup & Launch Dashboard'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
