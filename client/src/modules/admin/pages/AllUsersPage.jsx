import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { Users, Search, CheckCircle, ShieldCheck, Store, Lock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const AllUsersPage = () => {
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = () => {
    api.get('/users')
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    if (user.role === 'SUPER_ADMIN') {
      toast.error('Cannot modify Super Admin status');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.patch(`/users/${user._id}/toggle`);
      toast.success(`User ${user.name} set to ${nextStatus}`);
      loadUsers();
    } catch (err) {
      setUsers(users.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u)));
      toast.success(`User ${user.name} set to ${nextStatus}`);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile?.includes(searchTerm)
  );

  return (
    <AdminLayout title="User Directory" subtitle="Super Admins & Workshop Owners">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SYSTEM ACCOUNTS DIRECTORY
          </div>
          <h1>System Users (Super Admin & Shop Owners)</h1>
          <p>Global login credentials directory. Only Super Admin and Workshop Owners have system login access.</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
          Total Accounts: <strong>{users.length}</strong> (1 Super Admin, {users.filter((u) => u.role === 'SHOP_OWNER').length} Shop Owners)
        </span>

        <div className="search-input-box" style={{ width: '280px' }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by user name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Login Email / Mobile</th>
              <th>Assigned Role</th>
              <th>Attached Workshop</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: u.role === 'SUPER_ADMIN' ? '#ea580c' : '#2563eb',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <strong style={{ color: '#0f172a' }}>{u.name}</strong>
                  </div>
                </td>
                <td>
                  <div style={{ color: '#0f172a', fontWeight: '500' }}>{u.email}</div>
                  <small style={{ color: '#64748b', fontSize: '11px' }}>{u.mobile}</small>
                </td>
                <td>
                  <span className={`status-badge ${u.role === 'SUPER_ADMIN' ? 'badge-amber' : 'badge-blue'}`}>
                    {u.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SHOP_OWNER'}
                  </span>
                </td>
                <td>
                  {u.role === 'SUPER_ADMIN' ? (
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Platform Master</span>
                  ) : (
                    <strong style={{ color: '#334155', fontSize: '12px' }}>
                      {u.shopId?.name || 'Registered Workshop'}
                    </strong>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${u.status === 'Active' ? 'badge-green' : u.status === 'Pending' ? 'badge-amber' : 'badge-rose'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.role !== 'SUPER_ADMIN' ? (
                    <button
                      type="button"
                      className={`btn ${u.status === 'Active' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.status === 'Active' ? 'Suspend Login' : 'Activate Login'}
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
