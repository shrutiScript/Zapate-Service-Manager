import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, Save, KeyRound, ShieldCheck, Mail, Phone, Building2, ExternalLink, MapPin } from 'lucide-react';
import { Link, Redirect } from 'wouter';
import api from '../../../services/api.js';
import { safeSetItem } from '../../../utils/storage.js';
import { formatDateDMY, formatTime12h, calculateRemainingDays } from '../../../utils/formatters.js';

export const ProfilePage = () => {
  const { user, currentShop, refreshUser } = useAuth();

  if (user?.role === 'SUPER_ADMIN') {
    return <Redirect to="/admin/settings?tab=security" />;
  }

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

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !mobile.trim()) {
      toast.error('Please enter Full Name, Email, and Mobile Number.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await api.put('/users/profile', { name, email, mobile });
      toast.success('Profile details updated successfully!');
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.post('/users/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully! Keep your credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <MainLayout title="Personal Profile" subtitle="Account Settings">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> OPERATOR CREDENTIALS
          </div>
          <h1>My Profile & Security</h1>
          <p>Manage your owner account identity, contact details, and security passwords.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Profile Information Panel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Personal Details</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Account owner profile information</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="prof-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={16} /></span>
                <input
                  id="prof-name"
                  type="text"
                  className="input-control input-with-icon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Workshop Owner"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  id="prof-email"
                  type="email"
                  className="input-control input-with-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@workshop.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-mobile">Mobile Number</label>
              <div className="input-wrapper">
                <span className="input-icon"><Phone size={16} /></span>
                <input
                  id="prof-mobile"
                  type="tel"
                  className="input-control input-with-icon"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9845011223"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned System Role</label>
              <input
                type="text"
                className="input-control"
                value={user?.role || 'SHOP_OWNER'}
                disabled
                style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isUpdatingProfile}
              style={{ marginTop: '12px' }}
            >
              <Save size={16} />
              {isUpdatingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Panel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Security & Password</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Change authentication credentials</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword}>
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="curr-pass">Current Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="curr-pass"
                  type={showCurrent ? 'text' : 'password'}
                  className="input-control input-with-icon input-with-action"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label="Toggle current password"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  className="input-control input-with-icon input-with-action"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  aria-label="Toggle new password"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="conf-pass">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="conf-pass"
                  type={showConfirm ? 'text' : 'password'}
                  className="input-control input-with-icon input-with-action"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary btn-full"
              disabled={isChangingPass}
              style={{ marginTop: '12px' }}
            >
              <KeyRound size={16} />
              {isChangingPass ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Associated Workshop Profile Information */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Associated Workshop Profile</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Active tenant identity and business operational data</p>
            </div>
          </div>
          <Link href="/settings" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            Manage in Shop Settings <ExternalLink size={13} />
          </Link>
        </div>

        {(() => {
          const subShop = currentShop || user?.shop || {};
          const startDate = subShop.subscriptionStartDate || subShop.subscriptionHistory?.[0]?.startDate || subShop.createdAt;
          const expiresAt = subShop.subscriptionExpiresAt;
          const isExpired = (subShop.calculatedStatus || subShop.subscriptionStatus) === 'EXPIRED' ||
            (expiresAt && new Date(expiresAt).getTime() <= Date.now());
          const isExpiringSoon = !isExpired && (subShop.calculatedStatus === 'EXPIRING_SOON' || subShop.subscriptionStatus === 'EXPIRING_SOON');
          const daysRemaining = typeof subShop.daysRemaining === 'number'
            ? subShop.daysRemaining
            : calculateRemainingDays(expiresAt);

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Shop Name</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  {user?.shopName || currentShop?.name || 'Shop Setup Required'}
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Active Plan</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
                  {subShop.subscription || 'Starter Tier'}
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Plan Start Date</span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatDateDMY(startDate)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Time: {formatTime12h(startDate)}
                </div>
              </div>

              <div style={{ padding: '14px', background: isExpired ? '#fef2f2' : '#f8fafc', borderRadius: 'var(--radius-md)', border: `1px solid ${isExpired ? '#fca5a5' : 'var(--border-color)'}` }}>
                <span style={{ fontSize: '11px', color: isExpired ? '#b91c1c' : '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Plan Expiry Date</span>
                <div style={{ fontSize: '14px', fontWeight: '800', color: isExpired ? '#dc2626' : '#0f172a', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatDateDMY(expiresAt)}
                </div>
                <div style={{ fontSize: '11px', color: isExpired ? '#dc2626' : '#64748b', marginTop: '2px', fontWeight: isExpired ? '700' : '500' }}>
                  Expiry Time: {formatTime12h(expiresAt)}
                </div>
              </div>

              <div style={{ padding: '14px', background: isExpired ? '#fef2f2' : '#f8fafc', borderRadius: 'var(--radius-md)', border: `1px solid ${isExpired ? '#fca5a5' : 'var(--border-color)'}` }}>
                <span style={{ fontSize: '11px', color: isExpired ? '#b91c1c' : '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Subscription Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span
                    className={`status-badge ${
                      isExpired ? 'badge-red' : isExpiringSoon ? 'badge-amber' : 'badge-green'
                    }`}
                  >
                    {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                  </span>
                  <strong style={{ fontSize: '12px', color: isExpired ? '#dc2626' : daysRemaining <= 7 ? '#d97706' : '#059669' }}>
                    {isExpired ? '0 days' : `${daysRemaining} days left`}
                  </strong>
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Business Email</span>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                  {currentShop?.email || currentShop?.businessEmail || user?.email || '—'}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
};
