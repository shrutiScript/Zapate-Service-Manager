import React, { useState, useEffect, useCallback } from 'react';
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
  CreditCard,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { useApp } from '../../../context/AppContext.jsx';
import { formatDateDMY, formatTime12h, calculateRemainingDays } from '../../../utils/formatters.js';
import { BlockWorkshopModal } from '../components/BlockWorkshopModal.jsx';
import { ShopSubscriptionModal } from '../components/ShopSubscriptionModal.jsx';

export const ShopManagementPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useApp();
  const [shops, setShops] = useState([]);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState(globalSearchQuery || '');

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setGlobalSearchQuery(val);
  };
  const [planFilter, setPlanFilter] = useState('ALL');
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');
  const [expiryFilter, setExpiryFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBlockShop, setSelectedBlockShop] = useState(null);
  const [selectedSubShop, setSelectedSubShop] = useState(null);

  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter && planFilter !== 'ALL') params.set('plan', planFilter);
      if (subStatusFilter && subStatusFilter !== 'ALL') params.set('subscriptionStatus', subStatusFilter);
      if (expiryFilter && expiryFilter !== 'ALL') params.set('expiryPeriod', expiryFilter);
      if (paymentFilter && paymentFilter !== 'ALL') params.set('paymentStatus', paymentFilter);

      const [shopsData, plansData] = await Promise.all([
        api.get(`/shops?${params.toString()}`),
        api.get('/plans').catch(() => []),
      ]);

      if (Array.isArray(shopsData)) setShops(shopsData);
      else if (shopsData?.data) setShops(shopsData.data);

      const activePlans = Array.isArray(plansData) ? plansData : plansData?.plans || [];
      setPlans(activePlans);
    } catch (e) {
      console.error('Failed to fetch shops:', e);
    } finally {
      setIsLoading(false);
    }
  }, [search, planFilter, subStatusFilter, expiryFilter, paymentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchShops]);

  const handleUnblock = async (shop) => {
    if (
      !window.confirm(
        `Are you sure you want to unblock workshop "${shop.name}"? This will allow active logins and platform access.`
      )
    ) {
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

  const handleResetFilters = () => {
    setSearch('');
    setPlanFilter('ALL');
    setSubStatusFilter('ALL');
    setExpiryFilter('ALL');
    setPaymentFilter('ALL');
  };

  const hasActiveFilters = search || planFilter !== 'ALL' || subStatusFilter !== 'ALL' || expiryFilter !== 'ALL' || paymentFilter !== 'ALL';

  const getSubStatusBadge = (shop) => {
    const status = (shop.calculatedStatus || shop.subscriptionStatus || 'ACTIVE').toUpperCase();
    if (status === 'EXPIRED') {
      return (
        <span
          className="status-badge badge-red"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            padding: '3px 8px',
          }}
        >
          <AlertTriangle size={11} /> Expired
        </span>
      );
    }
    if (status === 'EXPIRING_SOON') {
      return (
        <span
          className="status-badge badge-amber"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
            padding: '3px 8px',
          }}
        >
          <Clock size={11} /> Expiring Soon
        </span>
      );
    }
    if (status === 'SUSPENDED') {
      return (
        <span className="status-badge badge-red" style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px' }}>
          Suspended
        </span>
      );
    }
    return (
      <span
        className="status-badge badge-green"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: '700',
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
          padding: '3px 8px',
        }}
      >
        <CheckCircle2 size={11} /> Active
      </span>
    );
  };

  const getPaymentStatusBadge = (shop) => {
    const status = (shop.subscriptionPaymentStatus || 'PAID').toUpperCase();
    if (status === 'PAID') {
      return (
        <span
          className="status-badge badge-green"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
            padding: '3px 8px',
          }}
        >
          <CheckCircle2 size={11} /> PAID
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span
          className="status-badge badge-amber"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
            padding: '3px 8px',
          }}
        >
          <Clock size={11} /> PENDING
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span
          className="status-badge badge-red"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            padding: '3px 8px',
          }}
        >
          <AlertTriangle size={11} /> FAILED
        </span>
      );
    }
    return (
      <span
        className="status-badge badge-red"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: '700',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          padding: '3px 8px',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <AdminLayout title="Registered Workshops" subtitle="Super Admin Tenant Registry">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> TENANT DIRECTORY & SUBSCRIPTION AUDIT
          </div>
          <h1>All Registered Workshops</h1>
          <p>Complete directory of registered workshops, verified owners, live subscription status, and usage statistics.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchShops} disabled={isLoading} type="button">
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh Workshops
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search input */}
            <div className="input-wrapper" style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <span
                className="input-icon"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#94a3b8',
                }}
              >
                <Search size={15} />
              </span>
              <input
                type="text"
                className="input-control input-with-icon"
                style={{ paddingLeft: '38px' }}
                placeholder="Search by Shop Name, ID (e.g. SH-8492), Owner, Email, City..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Plan Filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                className="select-control"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Plans</option>
                {plans.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Status Filter */}
            <select
              className="select-control"
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Sub Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Expiry Period Filter */}
            <select
              className="select-control"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Periods</option>
              <option value="7DAYS">Expiring in 7 Days</option>
              <option value="30DAYS">Expiring in 30 Days</option>
              <option value="EXPIRED">Already Expired</option>
            </select>

            {/* Payment Status Filter */}
            <select
              className="select-control"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Sub-bar with Counts and Reset */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#64748b',
              paddingTop: '2px',
            }}
          >
            <span>
              Showing <strong>{shops.length}</strong> workshops
              {hasActiveFilters && ' (filtered)'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
                style={{ fontSize: '11px', padding: '4px 10px', color: '#2563eb' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workshops Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Workshop & ID</th>
                <th>Owner Details</th>
                <th>Current Plan</th>
                <th>Plan Start Date</th>
                <th>Plan Expiry Date</th>
                <th>Expiry Time</th>
                <th>Days Remaining</th>
                <th>Subscription Status</th>
                <th>Payment Status</th>
                <th>Workshop</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '52px', color: '#94a3b8' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading workshops and subscription data...</span>
                    </div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '52px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Store size={32} style={{ color: '#cbd5e1' }} />
                      <strong style={{ color: '#475569' }}>No workshops match your criteria.</strong>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Try clearing search terms or resetting filters.
                      </span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleResetFilters}
                          style={{ marginTop: '8px' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                shops.map((shop) => {
                  const startDate = shop.subscriptionStartDate || shop.subscriptionHistory?.[0]?.startDate || shop.createdAt;
                  const expiryDate = shop.subscriptionExpiresAt;
                  const isExpired =
                    (shop.calculatedStatus || shop.subscriptionStatus) === 'EXPIRED' ||
                    (expiryDate && new Date(expiryDate).getTime() <= (shop.serverTime ? new Date(shop.serverTime).getTime() : Date.now()));
                  const daysRemaining =
                    typeof shop.daysRemaining === 'number'
                      ? shop.daysRemaining
                      : calculateRemainingDays(expiryDate, shop.serverTime || new Date());

                  return (
                    <tr
                      key={shop._id}
                      style={
                        isExpired
                          ? { background: 'rgba(254, 242, 242, 0.45)' }
                          : {}
                      }
                    >
                      {/* Shop Logo & ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              overflow: 'hidden',
                              border: isExpired ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                              flexShrink: 0,
                            }}
                          >
                            {shop.logo ? (
                              <img
                                src={shop.logo}
                                alt={shop.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#2563eb',
                                }}
                              >
                                <Store size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{shop.name}</strong>
                            <div style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', fontSize: '11px', fontWeight: '700' }}>
                              {shop.code || shop._id?.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Details */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>{shop.ownerName}</strong>
                          <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                            {shop.ownerEmail}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>
                            {shop.shopContactNumber || shop.ownerMobile || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Current Plan */}
                      <td>
                        <span
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block',
                          }}
                        >
                          {shop.subscription || 'Starter Tier'}
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', textTransform: 'capitalize' }}>
                          {shop.subscriptionBillingCycle || 'monthly'} billing • {shop.subscriptionPaymentStatus || 'PAID'}
                        </div>
                      </td>

                      {/* Plan Start Date: DD/MM/YYYY */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Calendar size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                          <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {formatDateDMY(startDate)}
                          </span>
                        </div>
                      </td>

                      {/* Plan Expiry Date: DD/MM/YYYY */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Calendar size={13} style={{ color: isExpired ? '#dc2626' : '#64748b', flexShrink: 0 }} />
                          <span
                            style={{
                              fontWeight: isExpired ? '800' : '600',
                              color: isExpired ? '#dc2626' : '#0f172a',
                              fontSize: '12.5px',
                              fontFamily: 'JetBrains Mono, monospace',
                              backgroundColor: isExpired ? '#fef2f2' : 'transparent',
                              padding: isExpired ? '2px 6px' : '0',
                              borderRadius: isExpired ? '4px' : '0',
                              border: isExpired ? '1px solid #fecaca' : 'none',
                            }}
                          >
                            {formatDateDMY(expiryDate)}
                          </span>
                        </div>
                      </td>

                      {/* Expiry Time: HH:MM AM/PM */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Clock size={13} style={{ color: isExpired ? '#dc2626' : '#64748b', flexShrink: 0 }} />
                          <span
                            style={{
                              fontWeight: isExpired ? '700' : '500',
                              color: isExpired ? '#dc2626' : '#334155',
                              fontSize: '12px',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                          >
                            {formatTime12h(expiryDate)}
                          </span>
                        </div>
                      </td>

                      {/* Days Remaining: Number of days left */}
                      <td>
                        <div style={{ whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              backgroundColor: isExpired
                                ? '#fef2f2'
                                : daysRemaining <= 7
                                ? '#fffbeb'
                                : '#ecfdf5',
                              color: isExpired
                                ? '#dc2626'
                                : daysRemaining <= 7
                                ? '#b45309'
                                : '#047857',
                              border: `1px solid ${
                                isExpired
                                  ? '#fecaca'
                                  : daysRemaining <= 7
                                  ? '#fde68a'
                                  : '#a7f3d0'
                              }`,
                            }}
                          >
                            {isExpired ? '0 days (Expired)' : `${daysRemaining} days left`}
                          </span>
                        </div>
                      </td>

                      {/* Subscription Status */}
                      <td>{getSubStatusBadge(shop)}</td>

                      {/* Payment Status */}
                      <td>{getPaymentStatusBadge(shop)}</td>

                      {/* Workshop Status */}
                      <td>
                        {shop.status === 'BLOCKED' ? (
                          <span className="status-badge badge-red" title={shop.blockedReason || 'Shop Blocked'}>
                            BLOCKED
                          </span>
                        ) : (
                          <span className="status-badge badge-green">ACTIVE</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Subscription Management Modal Button */}
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => setSelectedSubShop(shop)}
                            title="Manage Subscription & Validity"
                            style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                          >
                            <CreditCard size={13} /> Subscription
                          </button>

                          <Link href={`/admin/shops/${shop._id}`}>
                            <button className="btn btn-secondary btn-sm" type="button" title="View Complete Shop Dossier">
                              <Eye size={13} /> Details
                            </button>
                          </Link>

                          <Link href={`/admin/login-activity?shopId=${shop._id}`}>
                            <button className="btn btn-secondary btn-sm" type="button" title="View Login Activity Audit">
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Dossier & Action Modal */}
      {selectedSubShop && (
        <ShopSubscriptionModal
          shop={selectedSubShop}
          onClose={() => setSelectedSubShop(null)}
          onSuccess={() => fetchShops()}
        />
      )}

      {/* Block Workshop Modal */}
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

