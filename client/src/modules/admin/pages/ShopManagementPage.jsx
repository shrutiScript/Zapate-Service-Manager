import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import {
  Store,
  Search,
  Eye,
  Activity,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { BlockWorkshopModal } from '../components/BlockWorkshopModal.jsx';

export const ShopManagementPage = () => {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlockShop, setSelectedBlockShop] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/shops');
      if (Array.isArray(data)) setShops(data);
    } catch (e) {}
    setIsLoading(false);
  };

  const filteredShops = shops.filter((shop) => {
    const s = search.toLowerCase();
    return (
      shop.name?.toLowerCase().includes(s) ||
      shop.code?.toLowerCase().includes(s) ||
      shop.ownerName?.toLowerCase().includes(s) ||
      shop.ownerEmail?.toLowerCase().includes(s) ||
      shop.city?.toLowerCase().includes(s)
    );
  });

  const handleUnblock = async (shop) => {
    if (!window.confirm(`Are you sure you want to unblock workshop "${shop.name}"? This will allow active logins and platform access.`)) {
      return;
    }
    try {
      await api.post(`/shops/${shop._id}/unblock`, { reason: 'Administrative unblock request' });
      toast.success(`Workshop "${shop.name}" has been unblocked.`);
      fetchShops();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to unblock workshop');
    }
  };

  return (
    <AdminLayout title="Registered Workshops" subtitle="Super Admin Tenant Registry">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> TENANT DIRECTORY & AUDIT
          </div>
          <h1>All Registered Workshops</h1>
          <p>Complete directory of registered workshops, verified owners, physical locations, and usage statistics.</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <span className="input-icon"><Search size={15} /></span>
            <input
              type="text"
              className="input-control input-with-icon"
              placeholder="Search by Shop Name, Shop ID (e.g. SH-8492), Owner Name, Email, or City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
            Showing {filteredShops.length} of {shops.length} Workshops
          </span>
        </div>
      </div>

      {/* Workshops Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Shop & ID</th>
                <th>Owner Details</th>
                <th>Shop Contact & Email</th>
                <th>Location</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Logins</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    {isLoading ? 'Loading registered workshops...' : 'No workshops match your search.'}
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop._id}>
                    {/* Shop & Logo & ID */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#eff6ff',
                            overflow: 'hidden',
                            border: '1px solid #bfdbfe',
                            flexShrink: 0,
                          }}
                        >
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                              <Store size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>{shop.name}</strong>
                          <div style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', fontSize: '11px', fontWeight: '700' }}>
                            {shop.code || shop._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td>
                      <strong style={{ color: '#0f172a' }}>{shop.ownerName}</strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>{shop.ownerEmail}</small>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>{shop.ownerMobile}</small>
                    </td>

                    {/* Shop Contact & Business Email */}
                    <td>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        {shop.shopContactNumber || shop.mobile || '—'}
                      </div>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>
                        {shop.businessEmail || shop.email || '—'}
                      </small>
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#334155' }}>
                        <MapPin size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                        <span>
                          {shop.city || 'Bengaluru'}, {shop.state || 'Karnataka'}
                        </span>
                      </div>
                      {shop.pincode && (
                        <small style={{ display: 'block', color: '#94a3b8', fontSize: '10px' }}>
                          PIN: {shop.pincode}
                        </small>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                        <Calendar size={12} />
                        <span>{new Date(shop.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {shop.status === 'BLOCKED' ? (
                        <span className="status-badge badge-red" title={shop.blockedReason || 'Shop Blocked'}>
                          BLOCKED
                        </span>
                      ) : (
                        <span className="status-badge badge-green">
                          ACTIVE
                        </span>
                      )}
                    </td>

                    {/* Total Login Count */}
                    <td>
                      <span className="status-badge badge-blue">
                        {shop.loginCount || 0} logins
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link href={`/admin/shops/${shop._id}`}>
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            title="View Complete Shop Dossier"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </Link>

                        <Link href={`/admin/login-activity?shopId=${shop._id}`}>
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            title="View Login Activity Audit"
                          >
                            <Activity size={13} /> Activity
                          </button>
                        </Link>

                        {shop.status === 'BLOCKED' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => handleUnblock(shop)}
                            title="Unblock Workshop and allow access"
                            style={{ color: '#059669', borderColor: '#a7f3d0' }}
                          >
                            <ShieldCheck size={13} /> Unblock
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => setSelectedBlockShop(shop)}
                            title="Block Workshop and terminate sessions"
                            style={{ color: '#dc2626', borderColor: '#fecaca' }}
                          >
                            <ShieldBan size={13} /> Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBlockShop && (
        <BlockWorkshopModal
          shop={selectedBlockShop}
          onClose={() => setSelectedBlockShop(null)}
          onSuccess={() => fetchShops()}
        />
      )}
    </AdminLayout>
  );
};
