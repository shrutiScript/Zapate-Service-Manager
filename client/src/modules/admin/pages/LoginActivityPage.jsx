import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
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
} from 'lucide-react';
import api from '../../../services/api.js';

export const LoginActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Check URL query parameters for ?shopId=...
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const shopId = searchParams.get('shopId');
      const url = shopId ? `/admin/login-activity?shopId=${shopId}` : '/admin/login-activity';
      const data = await api.get(url);
      if (Array.isArray(data)) setLogs(data);
    } catch (e) {}
    setIsLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    const matchesSearch =
      log.userName?.toLowerCase().includes(s) ||
      log.shopName?.toLowerCase().includes(s) ||
      log.email?.toLowerCase().includes(s) ||
      log.role?.toLowerCase().includes(s);

    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
        <button className="btn btn-secondary" onClick={fetchLogs} type="button">
          <RefreshCw size={15} /> Refresh Audit Trail
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <span className="input-icon"><Search size={15} /></span>
            <input
              type="text"
              className="input-control input-with-icon"
              placeholder="Search by User Name, Shop Name, Email, Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={15} style={{ color: '#64748b' }} />
            <select
              className="select-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="SHOP_OWNER">Shop Owner</option>
            </select>
          </div>

          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
            {filteredLogs.length} events
          </span>
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    {isLoading ? 'Loading login activity logs...' : 'No login records match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.loginAt || log.createdAt);
                  return (
                    <tr key={log._id}>
                      {/* Owner Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} style={{ color: '#2563eb' }} />
                          <strong style={{ color: '#0f172a' }}>{log.userName}</strong>
                        </div>
                      </td>

                      {/* Shop Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Store size={14} style={{ color: '#64748b' }} />
                          <span style={{ color: '#334155', fontWeight: '500' }}>
                            {log.shopName || (log.role === 'SUPER_ADMIN' ? 'Platform Control' : '—')}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#475569' }}>
                          {log.email}
                        </span>
                      </td>

                      {/* Role */}
                      <td>
                        <span className={`status-badge ${log.role === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-blue'}`}>
                          {log.role}
                        </span>
                      </td>

                      {/* Login Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#334155' }}>
                          <Calendar size={13} style={{ color: '#64748b' }} />
                          <span>{dateObj.toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Login Time */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>
                          <Clock size={13} />
                          <span>{dateObj.toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#64748b' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
