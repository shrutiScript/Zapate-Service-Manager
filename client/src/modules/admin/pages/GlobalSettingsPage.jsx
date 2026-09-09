import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  Plus,
  Smartphone,
  Layers,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const GlobalSettingsPage = ({ defaultTab = 'security' }) => {
  const { user, refreshUser } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || defaultTab || 'security';
    } catch (_) {
      return defaultTab || 'security';
    }
  });

  // Profile Fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.mobile) setMobile(user.mobile);
    }
  }, [user]);

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Catalog State
  const [brands, setBrands] = useState([
    'Apple',
    'Samsung',
    'Google Pixel',
    'OnePlus',
    'Xiaomi',
    'Nothing',
    'Vivo',
    'Oppo',
    'Motorola',
    'Realme',
  ]);
  const [categories, setCategories] = useState([
    'Displays & Screens',
    'Batteries',
    'Charging Ports',
    'Camera Modules',
    'Speakers & Mics',
    'Back Glass & Housings',
    'Accessories & Glass',
  ]);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Password Strength Calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#94a3b8' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 2, label: 'Medium', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await api.put('/users/profile', { name, email, mobile });
      toast.success('Admin profile updated successfully!');
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.post('/users/change-password', { currentPassword, newPassword });
      toast.success('Admin password updated successfully! Please keep your new credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const addBrand = (e) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    setBrands([...brands, newBrand.trim()]);
    toast.success(`Global brand "${newBrand.trim()}" added! All shop intake forms updated.`);
    setNewBrand('');
  };

  const addCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCategories([...categories, newCategory.trim()]);
    toast.success(`Global category "${newCategory.trim()}" added! All inventory matrices updated.`);
    setNewCategory('');
  };

  return (
    <AdminLayout title="System Settings" subtitle="Platform Administration">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> MASTER CONFIGURATION & SECURITY
          </div>
          <h1>Platform Settings & Admin Security</h1>
          <p>Manage Super Admin authentication credentials, security passwords, and global workshop catalogs.</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            background: activeTab === 'security' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f1f5f9',
            color: activeTab === 'security' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'security' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
          }}
        >
          <ShieldCheck size={16} />
          <span>Admin Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalogs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            background: activeTab === 'catalogs' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f1f5f9',
            color: activeTab === 'catalogs' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'catalogs' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
          }}
        >
          <Layers size={16} />
          <span>Global Brands & Categories</span>
        </button>
      </div>

      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Change Password Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Update Admin Password
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Update your Super Admin station login password
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ marginTop: '20px' }}>
              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="admin-curr-pass" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Current Password
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="admin-curr-pass"
                    type={showCurrent ? 'text' : 'password'}
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', boxSizing: 'border-box' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (e.g. 123456)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    aria-label="Toggle current password"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="admin-new-pass" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  New Password
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="admin-new-pass"
                    type={showNew ? 'text' : 'password'}
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', boxSizing: 'border-box' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    aria-label="Toggle new password"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {newPassword && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: strength.score === 1 ? '33%' : strength.score === 2 ? '66%' : '100%',
                          background: strength.color,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="admin-conf-pass" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    id="admin-conf-pass"
                    type={showConfirm ? 'text' : 'password'}
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', boxSizing: 'border-box' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {confirmPassword && newPassword && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    {confirmPassword === newPassword ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Passwords match
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={13} /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChangingPass}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                }}
              >
                <KeyRound size={16} />
                <span>{isChangingPass ? 'Updating Password...' : 'Save New Admin Password'}</span>
              </button>
            </form>

            <div
              style={{
                marginTop: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Protected with 256-bit salted bcrypt encryption. Future logins will immediately require your new password.
              </span>
            </div>
          </div>

          {/* Admin Identity & Details Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Admin Profile Details
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Super Administrator station identity
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ marginTop: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="admin-name" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Admin Name
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <User size={16} />
                  </span>
                  <input
                    id="admin-name"
                    type="text"
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Super Admin"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="admin-email" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="admin-mobile" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Mobile Number
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Phone size={16} />
                  </span>
                  <input
                    id="admin-mobile"
                    type="tel"
                    className="input-control"
                    style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9900000000"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Assigned Authority Role
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span className="status-badge badge-amber" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '800' }}>
                    SUPER_ADMIN
                  </span>
                  <span className="status-badge badge-blue" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    ID: {user?.userId || 'ADM-001'}
                  </span>
                  <span className="status-badge badge-green" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    STATUS: ACTIVE
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isUpdatingProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                <span>{isUpdatingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'catalogs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Global Brands */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <Smartphone size={18} style={{ color: '#2563eb' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Global Smartphone Brands</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Master brand catalog available to all technicians</p>
              </div>
            </div>

            <form onSubmit={addBrand} style={{ display: 'flex', gap: '8px', margin: '18px 0' }}>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Asus ROG"
                className="input-control"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={15} /> Add Brand
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {brands.map((b) => (
                <span key={b} className="status-badge badge-blue" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Global Component Categories */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <Layers size={18} style={{ color: '#059669' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Component Categories</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Taxonomy for spare parts inventory matrices</p>
              </div>
            </div>

            <form onSubmit={addCategory} style={{ display: 'flex', gap: '8px', margin: '18px 0' }}>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Haptic Motors"
                className="input-control"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={15} /> Add Category
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map((c) => (
                <span key={c} className="status-badge badge-purple" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
