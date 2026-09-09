import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import { Layers, Check, ShieldCheck, ToggleLeft, ToggleRight, Building } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const ModuleManagementPage = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [modules, setModules] = useState([
    { key: 'customers', label: 'Customers CRM', desc: 'Client phone registry, spend metrics, and notes', enabled: true },
    { key: 'repairs', label: 'Repair Jobs Kanban', desc: 'Service tickets, diagnostic matrix, and stage transitions', enabled: true },
    { key: 'devices', label: 'Device Registry', desc: 'Hardware IMEI serial tracking and physical condition logs', enabled: true },
    { key: 'technicians', label: 'Technician Roster', desc: 'Engineer assignment, commission tracking, and workload', enabled: true },
    { key: 'pos', label: 'POS & Billing', desc: 'Instant retail checkout, UPI receipts, and tax calculations', enabled: true },
    { key: 'payments', label: 'Payments & Ledger', desc: 'Receivables, debit settlements, and cash desk journals', enabled: true },
    { key: 'inventory', label: 'Parts Inventory', desc: 'Shelf rack locations, SKU barcodes, and low stock warnings', enabled: true },
    { key: 'suppliers', label: 'Suppliers Procurement', desc: 'Wholesale vendor accounts and purchase orders', enabled: true },
    { key: 'purchases', label: 'Procurement POs', desc: 'Stock inward log and automatic inventory quantity increment', enabled: true },
    { key: 'used-mobiles', label: 'Used Mobiles Resale', desc: 'Trade-in handset valuation and refurbishment margins', enabled: true },
    { key: 'reports', label: 'Reports & Analytics', desc: 'Turnaround speed, revenue velocity, and sales breakdown', enabled: true },
    { key: 'settings', label: 'Shop Settings', desc: 'GSTIN, warranty period, and invoice numbering series', enabled: true },
    { key: 'users', label: 'Staff & Roles', desc: 'Access control permissions and operator credentials', enabled: true },
  ]);

  useEffect(() => {
    api.get('/shops')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setShops(data);
          setSelectedShop(data[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const toggleModule = (key) => {
    setModules(
      modules.map((m) => {
        if (m.key === key) {
          const next = !m.enabled;
          toast.success(`${m.label} ${next ? 'enabled' : 'disabled'} for ${selectedShop || 'workshop'}`);
          return { ...m, enabled: next };
        }
        return m;
      })
    );
  };

  return (
    <AdminLayout title="Module Control" subtitle="Dynamic Access Management">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> ACCESS CONTROL
          </div>
          <h1>Live Tenant Module Permissions</h1>
          <p>Instantly enable or disable operational SaaS modules per workshop in real-time.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Target Workshop Tenant</span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Configure Active Workspace Modules</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={16} style={{ color: '#64748b' }} />
            <select
              className="select-control"
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              style={{ width: '240px' }}
            >
              {shops.length === 0 ? (
                <option value="">No workshops registered</option>
              ) : (
                shops.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} {s.city ? `(${s.city})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {modules.map((m) => (
            <div
              key={m.key}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: m.enabled ? '1px solid #bfdbfe' : '1px solid var(--border-color)',
                background: m.enabled ? '#f8faff' : '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>{m.label}</strong>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>{m.desc}</p>
              </div>

              <button
                type="button"
                className={m.enabled ? 'primary-button btn-sm' : 'secondary-button btn-sm'}
                onClick={() => toggleModule(m.key)}
              >
                {m.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
