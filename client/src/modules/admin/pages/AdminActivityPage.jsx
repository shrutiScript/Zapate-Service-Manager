import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { ActivityDetailModal } from '../components/ActivityDetailModal.jsx';
import {
  Activity,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  Store,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../../services/api.js';

export const AdminActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    todayActions: 0,
    blockedWorkshops: 0,
    workshopActions: 0,
    securityActions: 0,
    totalLogs: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  });

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivityLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', page);
      query.set('limit', 15);
      if (search) query.set('search', search);
      if (category && category !== 'ALL') query.set('category', category);
      if (actionFilter && actionFilter !== 'ALL') query.set('action', actionFilter);
      if (statusFilter && statusFilter !== 'ALL') query.set('status', statusFilter);
      if (dateRange && dateRange !== 'ALL') query.set('dateRange', dateRange);

      const res = await api.get(`/admin/activity?${query.toString()}`);
      if (res && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else if (res && res.logs) {
        setLogs(res.logs || []);
        if (res.metrics) setMetrics(res.metrics);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, actionFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchActivityLogs(1);
  }, [fetchActivityLogs]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchActivityLogs(newPage);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="status-badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <CheckCircle2 size={12} /> Success
          </span>
        );
      case 'FAILED':
        return (
          <span className="status-badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <XCircle size={12} /> Failed
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="status-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <AlertTriangle size={12} /> Blocked
          </span>
        );
      default:
        return <span className="status-badge badge-blue" style={{ fontSize: '11px' }}>{status}</span>;
    }
  };

  const getActionBadgeColor = (act) => {
    if (act?.includes('BLOCK')) return 'badge-red';
    if (act?.includes('UNBLOCK') || act?.includes('CREATE')) return 'badge-green';
    if (act?.includes('UPDATE') || act?.includes('RESET')) return 'badge-amber';
    if (act?.includes('DELETE')) return 'badge-red';
    if (act?.includes('LOGIN')) return 'badge-blue';
    return 'badge-blue';
  };

  return (
    <AdminLayout title="Admin Activity Audits" subtitle="Platform Security & Governance">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SYSTEM AUDIT TRAIL & GOVERNANCE
          </div>
          <h1>Super Admin Activity Logs</h1>
          <p>
            Cryptographic and timestamped audit trail tracking every administrative intervention,
            workshop access restriction, and user management event.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchActivityLogs(pagination.page)}
          disabled={isLoading}
          type="button"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh Trail
        </button>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Activity size={22} />,
            label: "Today's Admin Actions",
            value: metrics.todayActions,
            color: 'blue',
            accent: true,
            delta: 'Today',
            deltaColor: '#2563eb',
            sub: 'actions executed today',
          },
          {
            icon: <ShieldBan size={22} />,
            label: 'Workshops Blocked',
            value: metrics.blockedWorkshops,
            color: 'rose',
            accent: true,
            delta: 'Restricted',
            deltaColor: '#e11d48',
            sub: 'shops currently blocked',
          },
          {
            icon: <Store size={22} />,
            label: 'Workshop Actions',
            value: metrics.workshopActions,
            color: 'amber',
            accent: true,
            delta: 'Operations',
            deltaColor: '#d97706',
            sub: 'lifecycle events',
          },
          {
            icon: <ShieldCheck size={22} />,
            label: 'Security & Auth Events',
            value: metrics.securityActions,
            color: 'emerald',
            accent: true,
            delta: 'Audited',
            deltaColor: '#059669',
            sub: 'logins & access controls',
          },
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="input-wrapper" style={{ flex: 1, minWidth: '280px' }}>
              <span className="input-icon"><Search size={15} /></span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search by action, category, target, actor email, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <select
                className="select-control"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setActionFilter('ALL');
                }}
                style={{ width: '190px' }}
              >
                <option value="ALL">All Categories</option>
                <option value="Workshop Management">Workshop Management</option>
                <option value="User Management">User Management</option>
                <option value="Subscription Management">Subscription Plans</option>
                <option value="Brand & Catalog">Brands & Catalog</option>
                <option value="Global Settings">Global Settings</option>
                <option value="Authentication">Authentication</option>
                <option value="Security">Security & Policy</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {/* Date Range Filter */}
            <select
              className="select-control"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
            <span>
              Showing {logs.length} of {pagination.total} audit entries
            </span>
            {(search || category !== 'ALL' || statusFilter !== 'ALL' || dateRange !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setCategory('ALL');
                  setActionFilter('ALL');
                  setStatusFilter('ALL');
                  setDateRange('ALL');
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Action & Category</th>
                <th>Actor (Admin)</th>
                <th>Target Entity</th>
                <th>Status</th>
                <th>Reason / Summary</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading audit trail entries...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No administrative activity logs match the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  return (
                    <tr key={log._id}>
                      {/* Date & Time */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>
                          <Calendar size={13} style={{ color: '#64748b' }} />
                          <span>{dateObj.toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          <Clock size={12} style={{ color: '#94a3b8' }} />
                          <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`status-badge ${getActionBadgeColor(log.action)}`} style={{ fontSize: '11px', fontWeight: '700' }}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                          {log.category}
                        </small>
                      </td>

                      {/* Actor */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: '#2563eb' }} />
                          <strong style={{ color: '#0f172a', fontSize: '12px' }}>
                            {log.actor?.name || 'Super Admin'}
                          </strong>
                        </div>
                        <span style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#64748b' }}>
                          {log.actor?.email || 'admin@platform'}
                        </span>
                      </td>

                      {/* Target */}
                      <td>
                        <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>
                          {log.targetName || '—'}
                        </div>
                        <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>
                          {log.targetType || 'System'}
                        </small>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(log.status)}</td>

                      {/* Reason / Summary */}
                      <td style={{ maxWidth: '240px' }}>
                        {log.reason ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              color: '#92400e',
                              fontSize: '11px',
                              fontWeight: '500',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={log.reason}
                          >
                            {log.reason}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              display: 'inline-block',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={log.description}
                          >
                            {log.description || '—'}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedActivity(log)}
                          title="View Full Audit Snapshot and Field Diffs"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}
          >
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.pages || isLoading}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </AdminLayout>
  );
};
