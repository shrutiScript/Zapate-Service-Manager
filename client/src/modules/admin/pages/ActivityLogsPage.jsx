import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import api from '../../../services/api.js';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/login-activity')
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(
            data.map((l, i) => ({
              id: l._id || String(i + 1),
              user: l.email || l.userName || 'Operator',
              role: l.role || 'USER',
              action: `Session Login${l.shopName ? ` (${l.shopName})` : ''}`,
              ip: l.ipAddress || '127.0.0.1',
              time: l.loginAt ? new Date(l.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout title="Activity Logs" subtitle="Security Audit Trail">
      <div className="page-intro">
        <div>
          <span className="eyebrow accent-label">
            <span /> AUDIT TELEMETRY
          </span>
          <h1>System Activity Logs</h1>
          <p>Real-time security audit trail, role actions, and permission changes across all tenants.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Role</th>
                <th>Event Description</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="clickable-row">
                  <td><strong>{l.user}</strong></td>
                  <td><span className="method-tag">{l.role}</span></td>
                  <td>{l.action}</td>
                  <td><span style={{ font: '500 9px IBM Plex Mono', color: '#888e8b' }}>{l.ip}</span></td>
                  <td style={{ color: '#929793', fontSize: '10px' }}>{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
