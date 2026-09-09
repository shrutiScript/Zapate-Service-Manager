import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Store,
  Users,
  Activity,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Building,
  LogIn,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import api from '../../../services/api.js';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalShops: 0,
    totalShopOwners: 0,
    totalLoginCount: 0,
    todayLoginCount: 0,
    todayActions: 0,
    blockedWorkshops: 0,
    newWorkshops: 0,
    securityActions: 0,
  });

  const [recentShops, setRecentShops] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((data) => {
        if (data) {
          if (data.stats) setStats((prev) => ({ ...prev, ...data.stats }));
          if (data.recentShops) setRecentShops(data.recentShops);
          if (data.recentLogins) setRecentLogins(data.recentLogins);
          if (data.recentActions) setRecentActions(data.recentActions);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="status-badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            <CheckCircle2 size={11} /> SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="status-badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            <XCircle size={11} /> FAILED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="status-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
            <AlertTriangle size={11} /> BLOCKED
          </span>
        );
      default:
        return <span className="status-badge badge-blue" style={{ fontSize: '10px' }}>{status}</span>;
    }
  };

  const getActionBadgeColor = (act) => {
    if (act?.includes('BLOCK')) return 'badge-red';
    if (act?.includes('UNBLOCK') || act?.includes('CREATE')) return 'badge-green';
    if (act?.includes('UPDATE') || act?.includes('RESET')) return 'badge-amber';
    if (act?.includes('DELETE')) return 'badge-red';
    return 'badge-blue';
  };

  return (
    <AdminLayout title="Super Admin Command Center" subtitle="Platform Overview & Operations">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SYSTEM OVERVIEW & MONITORING
          </div>
          <h1>Super Admin Dashboard</h1>
          <p>Real-time platform metrics, registered workshop health, and live administrative audit trail.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/admin/activity">
            <button className="btn btn-secondary" type="button">
              <ClipboardList size={16} /> Audit Trail
            </button>
          </Link>
          <Link href="/admin/shops">
            <button className="btn btn-primary" type="button">
              <Store size={16} /> View All Workshops
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - Platform Operations */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Store size={22} />,
            label: 'Total Registered Shops',
            value: stats.totalShops,
            color: 'blue',
            accent: true,
            delta: 'Active',
            deltaColor: '#2563eb',
            sub: 'workshops on platform',
          },
          {
            icon: <Users size={22} />,
            label: 'Total Shop Owners',
            value: stats.totalShopOwners,
            color: 'amber',
            accent: true,
            delta: 'Registered',
            deltaColor: '#d97706',
            sub: 'business accounts',
          },
          {
            icon: <Activity size={22} />,
            label: 'Total Login Count',
            value: stats.totalLoginCount,
            color: 'emerald',
            accent: true,
            delta: 'All-Time',
            deltaColor: '#059669',
            sub: 'authenticated sessions',
          },
          {
            icon: <LogIn size={22} />,
            label: "Today's Login Count",
            value: stats.todayLoginCount,
            color: 'rose',
            accent: true,
            delta: 'Active',
            deltaColor: '#e11d48',
            sub: 'sessions today',
          },
        ]}
      />

      {/* KPI Cards Grid - Activity & Governance Summary */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Activity size={22} />,
            label: "Today's Admin Actions",
            value: stats.todayActions || 0,
            color: 'blue',
            accent: true,
            delta: 'Real-Time',
            deltaColor: '#2563eb',
            sub: 'super admin operations',
          },
          {
            icon: <ShieldBan size={22} />,
            label: 'Workshops Blocked',
            value: stats.blockedWorkshops || 0,
            color: 'rose',
            accent: true,
            delta: 'Restricted',
            deltaColor: '#e11d48',
            sub: 'sessions revoked',
          },
          {
            icon: <Store size={22} />,
            label: 'New Workshops (30d)',
            value: stats.newWorkshops || 0,
            color: 'amber',
            accent: true,
            delta: 'Recent 30d',
            deltaColor: '#d97706',
            sub: 'onboarded workshops',
          },
          {
            icon: <ShieldCheck size={22} />,
            label: 'Security & Auth Actions',
            value: stats.securityActions || 0,
            color: 'emerald',
            accent: true,
            delta: 'Audited',
            deltaColor: '#059669',
            sub: 'security interventions',
          },
        ]}
      />

      {/* Recent Admin Actions Widget */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Recent Admin Actions
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Live audit stream of administrative actions and platform state changes
            </p>
          </div>
          <Link href="/admin/activity">
            <button className="btn btn-secondary btn-sm" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>View Full Activity Log</span>
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Action & Category</th>
                <th>Actor</th>
                <th>Target Entity</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {recentActions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {isLoading ? 'Loading administrative actions...' : 'No administrative actions recorded yet.'}
                  </td>
                </tr>
              ) : (
                recentActions.map((action) => (
                  <tr key={action._id}>
                    <td>
                      <span className={`status-badge ${getActionBadgeColor(action.action)}`} style={{ fontSize: '10px', fontWeight: '700' }}>
                        {action.action?.replace(/_/g, ' ')}
                      </span>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                        {action.category}
                      </small>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '12px' }}>{action.actor?.name || 'Super Admin'}</strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>{action.actor?.email}</small>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '12px' }}>{action.targetName || '—'}</strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>{action.targetType}</small>
                    </td>
                    <td>{getStatusBadge(action.status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#334155' }}>
                        <Clock size={12} style={{ color: '#64748b' }} />
                        <span>{new Date(action.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href="/admin/activity">
                        <button className="btn btn-secondary btn-sm" type="button" style={{ padding: '3px 8px', fontSize: '11px' }}>
                          Inspect
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Split: Recent Shops & Recent Logins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Registered Shops */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Recent Registered Shops</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Latest workshops onboarded to the system</p>
            </div>
            <Link href="/admin/shops">
              <button className="btn btn-secondary btn-sm" type="button">All Shops</button>
            </Link>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Shop & Code</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Logins</th>
                </tr>
              </thead>
              <tbody>
                {recentShops.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No shops registered yet
                    </td>
                  </tr>
                ) : (
                  recentShops.map((shop) => (
                    <tr key={shop._id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{shop.name}</strong>
                        <small style={{ display: 'block', color: '#2563eb', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>
                          {shop.code}
                        </small>
                      </td>
                      <td>
                        <span>{shop.ownerName}</span>
                        <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>{shop.ownerEmail}</small>
                      </td>
                      <td>
                        <span>{shop.city || 'Bengaluru'}, {shop.state || 'Karnataka'}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue">{shop.loginCount || 0} logins</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Login Activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Recent Login Activity</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Live audit trail of user logins</p>
            </div>
            <Link href="/admin/login-activity">
              <button className="btn btn-secondary btn-sm" type="button">View Full Log</button>
            </Link>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>User & Role</th>
                  <th>Shop</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No login activity recorded yet
                    </td>
                  </tr>
                ) : (
                  recentLogins.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{log.userName}</strong>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                          <span className={`status-badge ${log.role === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {log.role}
                          </span>
                          <small style={{ color: '#64748b', fontSize: '11px' }}>{log.email}</small>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#334155' }}>{log.shopName || '—'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                          <Clock size={12} />
                          <span>{new Date(log.loginAt || log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
