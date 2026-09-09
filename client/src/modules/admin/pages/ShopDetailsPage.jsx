import React, { useState, useEffect, useCallback } from 'react';
import { Link, useRoute } from 'wouter';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import {
  Store,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Clock,
  Activity,
  FileText,
  ShieldCheck,
  ShieldBan,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { BlockWorkshopModal } from '../components/BlockWorkshopModal.jsx';

export const ShopDetailsPage = () => {
  const [, params] = useRoute('/admin/shops/:shopId');
  const shopId = params?.shopId;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlockShop, setSelectedBlockShop] = useState(null);

  const loadShopData = useCallback(() => {
    if (shopId) {
      api.get(`/admin/shops/${shopId}`)
        .then((res) => {
          if (res) setData(res);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [shopId]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);

  if (isLoading) {
    return (
      <AdminLayout title="Shop Dossier" subtitle="Workshop Details">
        <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
          Loading workshop details...
        </div>
      </AdminLayout>
    );
  }

  const shop = data?.shop;
  const owner = data?.owner;
  const recentLogins = data?.recentLogins || [];

  if (!shop) {
    return (
      <AdminLayout title="Shop Dossier" subtitle="Workshop Not Found">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <h3>Workshop Not Found</h3>
          <p style={{ color: '#64748b', marginTop: '6px', marginBottom: '20px' }}>
            The requested workshop ID does not exist or has been removed.
          </p>
          <Link href="/admin/shops">
            <button className="btn btn-primary" type="button">
              <ArrowLeft size={16} /> Return to All Workshops
            </button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const handleUnblock = async () => {
    if (!window.confirm(`Are you sure you want to unblock workshop "${shop.name}"? This will allow active logins and platform access.`)) {
      return;
    }
    try {
      await api.post(`/shops/${shop._id}/unblock`, { reason: 'Administrative unblock request' });
      toast.success(`Workshop "${shop.name}" has been unblocked.`);
      loadShopData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to unblock workshop');
    }
  };

  return (
    <AdminLayout title={`Workshop: ${shop.name}`} subtitle="Super Admin Tenant Audit">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> VERIFIED TENANT DOSSIER
          </div>
          <h1>{shop.name}</h1>
          <p>Complete business registry, physical location, owner information, and login history.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {shop.status === 'BLOCKED' ? (
            <button
              className="btn btn-secondary"
              style={{ color: '#059669', borderColor: '#a7f3d0' }}
              onClick={handleUnblock}
              type="button"
            >
              <ShieldCheck size={16} /> Unblock Workshop
            </button>
          ) : (
            <button
              className="btn"
              style={{ background: '#dc2626', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setSelectedBlockShop(shop)}
              type="button"
            >
              <ShieldBan size={16} /> Block Workshop
            </button>
          )}
          <Link href="/admin/shops">
            <button className="btn btn-secondary" type="button">
              <ArrowLeft size={16} /> Back to All Workshops
            </button>
          </Link>
        </div>
      </div>

      {/* Top Banner Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          marginBottom: '24px',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '18px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
              background: '#ffffff',
              flexShrink: 0,
            }}
          >
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Store size={32} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>{shop.name}</h2>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(37, 99, 235, 0.3)',
                  border: '1px solid #3b82f6',
                  color: '#93c5fd',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: '700',
                }}
              >
                {shop.code}
              </span>
              {shop.status === 'BLOCKED' ? (
                <span className="status-badge badge-red">BLOCKED</span>
              ) : (
                <span className="status-badge badge-green">ACTIVE</span>
              )}
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              {shop.businessType || 'Mobile Repair & Multi-Brand Service Lab'}
            </p>

            {shop.status === 'BLOCKED' && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fca5a5',
                  fontSize: '12px',
                }}
              >
                <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                <span>
                  <strong>Account Suspended:</strong> This workshop was blocked on{' '}
                  {shop.blockedAt ? new Date(shop.blockedAt).toLocaleDateString() : 'recent date'}.
                  {shop.blockedReason && <> Reason: <em>"{shop.blockedReason}"</em>.</>} All user sessions are currently invalidated.
                </span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '20px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Total Logins</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#60a5fa', fontFamily: 'JetBrains Mono' }}>
                {shop.loginCount || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Last Login</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginTop: '4px' }}>
                {shop.lastLogin ? new Date(shop.lastLogin).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Details & Login Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Business & Owner Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Owner Profile */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={17} style={{ color: '#2563eb' }} />
              Shop Owner Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Owner Name</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {shop.ownerName || owner?.name}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Owner Email</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {shop.ownerEmail || owner?.email}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Owner Mobile</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {shop.ownerMobile || owner?.mobile}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Registered Date</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {new Date(shop.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Physical Workshop */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={17} style={{ color: '#2563eb' }} />
              Physical Workshop Location
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Full Address</label>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginTop: '2px' }}>
                  {shop.addressLine1 || '—'}
                  {shop.addressLine2 && <span>, {shop.addressLine2}</span>}
                  {shop.landmark && <small style={{ display: 'block', color: '#64748b' }}>Landmark: {shop.landmark}</small>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>City</label>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{shop.city || 'Bengaluru'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>State</label>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{shop.state || 'Karnataka'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pincode</label>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{shop.pincode || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Country</label>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{shop.country || 'India'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Business & Billing Settings */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} style={{ color: '#2563eb' }} />
              Business & Invoice Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Shop Contact Number</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {shop.shopContactNumber || shop.mobile || '—'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Business Email</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {shop.businessEmail || shop.email || '—'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>GST Number</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
                  {shop.gstNumber || 'Not Registered'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Invoice Prefix</label>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
                  {shop.invoicePrefix || 'INV-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workshop Login Activity History */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={17} style={{ color: '#2563eb' }} />
                Login Activity Log
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Total: <strong>{shop.loginCount || 0} logins</strong>
              </p>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No recent logins recorded
                    </td>
                  </tr>
                ) : (
                  recentLogins.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                          <Clock size={13} style={{ color: '#64748b' }} />
                          <span>{new Date(log.loginAt || log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#64748b' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBlockShop && (
        <BlockWorkshopModal
          shop={selectedBlockShop}
          onClose={() => setSelectedBlockShop(null)}
          onSuccess={() => loadShopData()}
        />
      )}
    </AdminLayout>
  );
};
