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
  CreditCard,
} from 'lucide-react';
import api from '../../../services/api.js';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalShops: 0,
    totalWorkshops: 0,
    totalShopOwners: 0,
    totalLoginCount: 0,
    todayLoginCount: 0,
    todayActions: 0,
    blockedWorkshops: 0,
    newWorkshops: 0,
    securityActions: 0,
    activeSubscriptions: 0,
    expiringSoonSubscriptions: 0,
    expiredSubscriptions: 0,
    suspendedSubscriptions: 0,
    verifiedSubscriptionRevenue: 0,
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
          <span className="status-badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
            <CheckCircle2 size={12} /> SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="status-badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
            <XCircle size={12} /> FAILED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="status-badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>
            <AlertTriangle size={12} /> BLOCKED
          </span>
        );
      default:
        return <span className="status-badge badge-blue" style={{ fontSize: '10.5px', padding: '3px 8px', borderRadius: '6px' }}>{status}</span>;
    }
  };

  const getActionBadgeColor = (act) => {
    const a = String(act || '').toUpperCase();
    if (a.includes('FAIL') || a.includes('BLOCK') || a.includes('DELETE') || a.includes('REVOKE') || a.includes('EXPIRE')) {
      return 'badge-red';
    }
    if (a.includes('SUCCESS') || a.includes('UNBLOCK') || a.includes('CREATE') || a.includes('EXTEND') || a.includes('RENEW') || a.includes('ACTIVATE')) {
      return 'badge-green';
    }
    if (a.includes('UPDATE') || a.includes('RESET') || a.includes('CHANGE') || a.includes('EDIT') || a.includes('WARN')) {
      return 'badge-amber';
    }
    if (a.includes('LOGIN') || a.includes('SESSION') || a.includes('AUTH')) {
      return 'badge-blue';
    }
    return 'badge-purple';
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
            <button className="btn btn-secondary" type="button" style={{ borderRadius: '8px' }}>
              <ClipboardList size={16} /> Audit Trail
            </button>
          </Link>
          <Link href="/admin/shops">
            <button className="btn btn-primary" type="button" style={{ borderRadius: '8px' }}>
              <Store size={16} /> View All Workshops
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Section: Subscription & Licensing Summary */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bfdbfe',
            }}
          >
            <CreditCard size={15} />
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Subscription & Revenue Health
          </h3>
        </div>
        <KpiCards
          columns={6}
          items={[
            {
              icon: <Store size={18} />,
              label: 'Total Workshops',
              value: stats.totalWorkshops ?? stats.totalShops ?? 0,
              color: 'blue',
              accent: true,
              delta: 'Platform',
              deltaColor: '#2563eb',
              sub: 'registered tenants',
            },
            {
              icon: <CheckCircle2 size={18} />,
              label: 'Active Subscriptions',
              value: stats.activeSubscriptions ?? 0,
              color: 'emerald',
              accent: true,
              delta: 'Active',
              deltaColor: '#059669',
              sub: 'workshops licensed',
            },
            {
              icon: <Clock size={18} />,
              label: 'Expiring Soon (≤7d)',
              value: stats.expiringSoonSubscriptions ?? 0,
              color: 'amber',
              accent: true,
              delta: 'Action Req.',
              deltaColor: '#d97706',
              sub: 'renewals imminent',
            },
            {
              icon: <AlertTriangle size={18} />,
              label: 'Expired Subscriptions',
              value: stats.expiredSubscriptions ?? 0,
              color: 'red',
              accent: true,
              delta: 'Locked',
              deltaColor: '#dc2626',
              sub: 'access denied',
            },
            {
              icon: <ShieldBan size={18} />,
              label: 'Suspended / Blocked',
              value: stats.suspendedSubscriptions ?? stats.blockedWorkshops ?? 0,
              color: 'rose',
              accent: true,
              delta: 'Restricted',
              deltaColor: '#e11d48',
              sub: 'sessions revoked',
            },
            {
              icon: <CreditCard size={18} />,
              label: 'Verified Sub Revenue',
              value: `₹${(stats.verifiedSubscriptionRevenue ?? 0).toLocaleString('en-IN')}`,
              color: 'blue',
              accent: true,
              delta: 'Paid',
              deltaColor: '#059669',
              sub: 'verified payments',
            },
          ]}
        />
      </div>

      {/* KPI Cards Grid - Platform Operations */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: '#f0fdfa',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #99f6e4',
            }}
          >
            <Activity size={15} />
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Operational Sessions & Governance
          </h3>
        </div>
        <KpiCards
          columns={4}
          items={[
            {
              icon: <Users size={18} />,
              label: 'Total Shop Owners',
              value: stats.totalShopOwners,
              color: 'amber',
              accent: true,
              delta: 'Registered',
              deltaColor: '#d97706',
              sub: 'business accounts',
            },
            {
              icon: <Activity size={18} />,
              label: 'Total Login Count',
              value: stats.totalLoginCount,
              color: 'emerald',
              accent: true,
              delta: 'All-Time',
              deltaColor: '#059669',
              sub: 'authenticated sessions',
            },
            {
              icon: <LogIn size={18} />,
              label: "Today's Login Count",
              value: stats.todayLoginCount,
              color: 'rose',
              accent: true,
              delta: 'Active',
              deltaColor: '#e11d48',
              sub: 'sessions today',
            },
            {
              icon: <ShieldCheck size={18} />,
              label: 'Security & Auth Actions',
              value: stats.securityActions || 0,
              color: 'teal',
              accent: true,
              delta: 'Audited',
              deltaColor: '#0d9488',
              sub: 'security interventions',
            },
          ]}
        />
      </div>

      {/* Recent Admin Actions Widget */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px 14px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fde68a',
                }}
              >
                <ClipboardList size={16} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Recent Admin Actions
              </h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
              Live audit stream of administrative actions and platform state changes
            </p>
          </div>
          <Link href="/admin/activity">
            <button className="btn btn-secondary btn-sm" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
              <span>View Full Activity Log</span>
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0, overflowX: 'auto' }}>
          <table className="pro-table" style={{ width: '100%', minWidth: '780px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action & Category</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actor</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Entity</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {recentActions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    {isLoading ? 'Loading administrative actions...' : 'No administrative actions recorded yet.'}
                  </td>
                </tr>
              ) : (
                recentActions.slice(0, 6).map((action) => (
                  <tr key={action._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <span className={`status-badge ${getActionBadgeColor(action.action)}`} style={{ fontSize: '10.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                        {action.action?.replace(/_/g, ' ')}
                      </span>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '3px', fontWeight: '500' }}>
                        {action.category || 'System'}
                      </small>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: '700' }}>{action.actor?.name || 'Super Admin'}</strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{action.actor?.email || 'admin@platform'}</small>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: '700' }}>{action.targetName || '—'}</strong>
                      <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{action.targetType || 'Platform'}</small>
                    </td>
                    <td style={{ padding: '12px 18px' }}>{getStatusBadge(action.status)}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#475569' }}>
                        <Clock size={13} style={{ color: '#94a3b8' }} />
                        <span>{new Date(action.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <Link href="/admin/activity">
                        <button className="btn btn-secondary btn-sm" type="button" style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '6px' }}>
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <span>Showing latest {Math.min(recentActions.length, 6)} administrative operations</span>
          <Link href="/admin/activity" style={{ fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>View complete audit trail</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 2-Column Split: Recent Shops & Recent Logins */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        {/* Recent Registered Shops */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <Store size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Recent Registered Shops</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Latest workshops onboarded to the system</p>
                </div>
              </div>
              <Link href="/admin/shops">
                <button className="btn btn-secondary btn-sm" type="button" style={{ borderRadius: '6px' }}>All Shops</button>
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
              <table className="pro-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Shop & Code</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Owner</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Logins</th>
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
                    recentShops.slice(0, 5).map((shop) => (
                      <tr key={shop._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{shop.name}</strong>
                          <small style={{ display: 'block', color: '#2563eb', fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: '600' }}>
                            {shop.code}
                          </small>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>{shop.ownerName}</span>
                          <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>{shop.ownerEmail}</small>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{shop.city || 'Bengaluru'}, {shop.state || 'Karnataka'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="status-badge badge-blue" style={{ fontSize: '11px', fontWeight: '700' }}>{shop.loginCount || 0} logins</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Showing top {Math.min(recentShops.length, 5)} active tenants</span>
            <Link href="/admin/shops" style={{ fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Manage all workshops</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Recent Login Activity */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <Activity size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Recent Login Activity</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Live audit trail of user logins</p>
                </div>
              </div>
              <Link href="/admin/login-activity">
                <button className="btn btn-secondary btn-sm" type="button" style={{ borderRadius: '6px' }}>View Full Log</button>
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
              <table className="pro-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>User & Role</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Shop</th>
                    <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Timestamp</th>
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
                    recentLogins.slice(0, 5).map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{log.userName}</strong>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                            <span className={`status-badge ${log.role === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                              {log.role}
                            </span>
                            <small style={{ color: '#64748b', fontSize: '11px' }}>{log.email}</small>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', color: '#334155' }}>{log.shopName || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
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
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Live authentication session monitoring</span>
            <Link href="/admin/login-activity" style={{ fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>View login audits</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
