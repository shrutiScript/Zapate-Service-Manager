import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Activity,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  Store,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Smartphone,
  Globe,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import api from '../../../services/api.js';

export const LoginActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    totalLogins: 0,
    filteredCount: 0,
    superAdminLogins: 0,
    shopOwnerLogins: 0,
    todayLogins: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Check URL query parameters for ?shopId=...
  const searchParams = new URLSearchParams(window.location.search);
  const shopIdParam = searchParams.get('shopId');

  const fetchLogs = useCallback(
    async (targetPage = 1, currentSearch = search, currentRole = roleFilter, currentDateRange = dateRange) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', targetPage);
        params.set('limit', 20);
        if (shopIdParam) params.set('shopId', shopIdParam);
        if (currentSearch) params.set('search', currentSearch);
        if (currentRole && currentRole !== 'ALL') params.set('role', currentRole);
        if (currentDateRange && currentDateRange !== 'ALL') params.set('dateRange', currentDateRange);

        const res = await api.get(`/admin/login-activity?${params.toString()}`);

        const activitiesList = res?.activities || res?.logs || (Array.isArray(res) ? res : []);
        setLogs(activitiesList);

        if (res?.metrics) {
          setMetrics(res.metrics);
        }
        if (res?.pagination) {
          setPagination(res.pagination);
        } else {
          setPagination({
            page: targetPage,
            limit: 20,
            total: activitiesList.length,
            totalPages: Math.ceil(activitiesList.length / 20) || 1,
          });
        }
      } catch (e) {
        console.error('Failed to fetch login activity:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [shopIdParam, search, roleFilter, dateRange]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(page, search, roleFilter, dateRange);
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, roleFilter, dateRange, fetchLogs]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setDateRange('ALL');
    setPage(1);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarStyle = (role) => {
    if (role === 'SUPER_ADMIN') {
      return {
        background: '#fffbeb',
        color: '#b45309',
        border: '1.5px solid #fcd34d',
      };
    }
    return {
      background: '#eff6ff',
      color: '#1d4ed8',
      border: '1.5px solid #bfdbfe',
    };
  };

  const getClientIcon = (userAgent) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone size={13} style={{ color: '#64748b' }} title="Mobile Device" />;
    }
    if (ua.includes('node') || ua.includes('postman') || ua.includes('curl')) {
      return <Globe size={13} style={{ color: '#64748b' }} title="Automated Script / API" />;
    }
    return <Laptop size={13} style={{ color: '#64748b' }} title="Desktop Browser" />;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const hasActiveFilters = search || roleFilter !== 'ALL' || dateRange !== 'ALL';

  return (
    <AdminLayout title="Login Activity Audits" subtitle="Authentication History">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> REAL-TIME AUTHENTICATION AUDITS
          </div>
          <h1>System Login Activity</h1>
          <p>Complete historical log of all Super Admin and Shop Owner authentication sessions.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchLogs(page, search, roleFilter, dateRange)}
          disabled={isLoading}
          type="button"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh Audit Trail
        </button>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Activity size={22} />,
            label: 'Total Login Events',
            value: metrics.totalLogins,
            color: 'blue',
            accent: true,
            delta: 'Audit Log',
            deltaColor: '#2563eb',
            sub: 'historical authentication sessions',
          },
          {
            icon: <Clock size={22} />,
            label: "Today's Sessions",
            value: metrics.todayLogins,
            color: 'emerald',
            accent: true,
            delta: 'Active Today',
            deltaColor: '#059669',
            sub: 'sessions initiated today',
          },
          {
            icon: <Store size={22} />,
            label: 'Workshop Owner Logins',
            value: metrics.shopOwnerLogins,
            color: 'amber',
            accent: true,
            delta: 'Workshops',
            deltaColor: '#d97706',
            sub: 'tenant owner authentications',
          },
          {
            icon: <ShieldCheck size={22} />,
            label: 'Super Admin Logins',
            value: metrics.superAdminLogins,
            color: 'rose',
            accent: true,
            delta: 'Platform Root',
            deltaColor: '#e11d48',
            sub: 'central administrator sessions',
          },
        ]}
      />

      {/* Shop ID Filter Notice Banner if applicable */}
      {shopIdParam && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#1e40af',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={16} />
            <span>
              Filtered strictly for Workshop ID: <strong>{shopIdParam}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            onClick={() => {
              window.history.replaceState({}, '', '/admin/login-activity');
              window.location.reload();
            }}
          >
            Show All Workshops
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input with properly placed icon */}
            <div className="input-wrapper" style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
              <span
                className="input-icon"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                <Search size={15} />
              </span>
              <input
                type="text"
                className="input-control input-with-icon"
                style={{ paddingLeft: '38px' }}
                placeholder="Search by User Name, Shop Name, Email, IP Address..."
                value={search}
                onChange={handleSearchChange}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <select
                className="select-control"
                value={roleFilter}
                onChange={handleRoleChange}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SHOP_OWNER">Shop Owner</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <select
              className="select-control"
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '150px' }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
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
              paddingTop: '4px',
            }}
          >
            <span>
              Showing {logs.length} of {pagination.total || 0} events
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

      {/* Login Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Shop Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Login Date</th>
                <th>Login Time</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '52px', color: '#94a3b8' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading login activity logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '52px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Activity size={32} style={{ color: '#cbd5e1' }} />
                      <strong style={{ color: '#475569' }}>No login records match your filters.</strong>
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
                logs.map((log) => {
                  const dateObj = new Date(log.loginAt || log.createdAt);
                  const isSuperAdmin = log.role === 'SUPER_ADMIN';
                  const initials = getInitials(log.userName);
                  const avatarStyle = getAvatarStyle(log.role);

                  return (
                    <tr key={log._id}>
                      {/* Owner Name with Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              flexShrink: 0,
                              ...avatarStyle,
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.2 }}>
                              {log.userName || (isSuperAdmin ? 'Super Admin' : 'Unknown User')}
                            </strong>
                            {isSuperAdmin && (
                              <span style={{ fontSize: '10px', color: '#b45309', fontWeight: '600' }}>
                                Platform Master
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Shop Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isSuperAdmin ? (
                            <Shield size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          ) : (
                            <Store size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              color: isSuperAdmin ? '#b45309' : '#334155',
                              fontWeight: isSuperAdmin ? '600' : '500',
                              fontSize: '13px',
                            }}
                          >
                            {log.shopName || (isSuperAdmin ? 'Master Platform Control' : '—')}
                          </span>
                        </div>
                      </td>

                      {/* Email Address */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, Consolas, monospace',
                            fontSize: '12px',
                            color: '#475569',
                          }}
                        >
                          {log.email || log.userEmail || '—'}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span
                          className={`status-badge ${isSuperAdmin ? 'badge-amber' : 'badge-blue'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                        >
                          {isSuperAdmin ? <ShieldCheck size={12} /> : <Store size={12} />}
                          {isSuperAdmin ? 'Super Admin' : 'Shop Owner'}
                        </span>
                      </td>

                      {/* Login Date */}
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12.5px',
                            color: '#334155',
                          }}
                        >
                          <Calendar size={13} style={{ color: '#64748b' }} />
                          <span>
                            {dateObj.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Login Time */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12.5px',
                              fontWeight: '600',
                              color: '#2563eb',
                            }}
                          >
                            <Clock size={13} />
                            <span>
                              {dateObj.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#94a3b8', paddingLeft: '17px' }}>
                            {formatRelativeTime(log.loginAt || log.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* IP Address & Client Device */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, Consolas, monospace',
                              fontSize: '11.5px',
                              color: '#334155',
                              background: '#f1f5f9',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {log.ipAddress || '127.0.0.1'}
                          </span>
                          {getClientIcon(log.userAgent)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total > 0 && (
          <div
            style={{
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing{' '}
              <strong>
                {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{' '}
              of <strong>{pagination.total}</strong> records (Page {pagination.page} of {pagination.totalPages || 1})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= (pagination.totalPages || 1) || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

