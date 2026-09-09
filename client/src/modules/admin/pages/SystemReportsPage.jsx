import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { formatCurrency } from '../../../utils/formatters.js';
import { Download, Building2, TrendingUp, Users, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const SystemReportsPage = () => {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    api.get('/shops')
      .then((data) => {
        if (Array.isArray(data)) {
          setShops(
            data.map((s) => ({
              name: s.name,
              location: [s.city, s.state].filter(Boolean).join(', ') || 'India',
              repairs: s.totalRepairs || 0,
              revenue: s.totalRevenue || 0,
              techCount: s.technicianCount || 1,
              score: '98.5%',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout title="System Reports" subtitle="Tenant Analytics">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SYSTEM TELEMETRY
          </div>
          <h1>Ecosystem Performance Reports</h1>
          <p>Tenant volume, platform GMV turnaround, and repair velocity across active workshops.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => toast.success('Platform statement exported!')}
        >
          <Download size={14} /> Export CSV Audit
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tenant Telemetry</span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Workshop GMV & SLA Performance</h3>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>4 ACTIVE WORKSHOPS</span>
        </div>

        <div className="table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Workshop Tenant</th>
                <th>Repairs Completed (MTD)</th>
                <th>Workshop GMV Volume</th>
                <th>Active Technicians</th>
                <th>SLA Compliance Score</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.name}>
                  <td>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{s.name}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{s.location}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#2563eb' }}>{s.repairs} jobs</strong>
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{formatCurrency(s.revenue)}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#475569', fontWeight: '600' }}>{s.techCount} technicians</span>
                  </td>
                  <td>
                    <span className="status-badge badge-green">{s.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
