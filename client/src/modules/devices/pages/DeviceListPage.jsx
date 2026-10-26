import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Plus,
  Smartphone,
  Check,
  Search,
  ShieldCheck,
  Cpu,
  Battery,
  Eye,
  Inbox,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext.jsx';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { DependentDeviceSelect } from '../../../components/common/DependentDeviceSelect.jsx';

export const DeviceListPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useApp();
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setGlobalSearchQuery(val);
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newDevice, setNewDevice] = useState({
    brand: '',
    model: '',
    imei: '',
    serialNumber: '',
    color: 'Black',
    customer: '',
    conditionNotes: '',
    checks: ['Screen operational', 'Battery charging', 'Camera clear', 'Body inspection'],
  });

  const [editDevice, setEditDevice] = useState({
    id: '',
    brand: '',
    model: '',
    imei: '',
    serialNumber: '',
    color: '',
    customer: '',
    conditionNotes: '',
    status: 'Registered',
  });

  const loadDevices = () => {
    setIsLoading(true);
    api.get('/devices')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((d, i) => ({
            id: d._id || d.id || `DEV-0${i + 1}`,
            brand: d.brand || 'Device',
            model: d.model || 'Model',
            imei: d.imei1 || d.imei || '—',
            serialNumber: d.serialNumber || '—',
            color: d.color || 'Standard',
            customer: d.customerName || (typeof d.customer === 'object' ? d.customer?.name : d.customer) || 'Walk-in Client',
            conditionNotes: d.conditionNotes || 'Standard wear and tear',
            status: d.status || 'Registered',
            checks: Array.isArray(d.checks) && d.checks.length > 0 ? d.checks : ['Screen tested', 'Battery operational', 'Camera clear', 'Body inspection'],
          }));
          setDevices(mapped);
          if (mapped.length > 0) {
            setActiveDevice((prev) => {
              if (prev) {
                const found = mapped.find((m) => m.id === prev.id);
                return found || mapped[0];
              }
              return mapped[0];
            });
          } else {
            setActiveDevice(null);
          }
        } else {
          setDevices([]);
          setActiveDevice(null);
        }
      })
      .catch(() => {
        setDevices([]);
        setActiveDevice(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.brand.trim() || !newDevice.model.trim() || !newDevice.imei.trim()) {
      toast.error('Brand, Model, and IMEI are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/devices', {
        brand: newDevice.brand.trim(),
        model: newDevice.model.trim(),
        imei1: newDevice.imei.trim(),
        serialNumber: newDevice.serialNumber.trim(),
        color: newDevice.color.trim(),
        customerName: newDevice.customer.trim() || 'Walk-in Client',
        conditionNotes: newDevice.conditionNotes.trim(),
        checks: newDevice.checks,
      });
      toast.success(`Device ${newDevice.brand} ${newDevice.model} registered!`);
      setIsAddModalOpen(false);
      setNewDevice({
        brand: '',
        model: '',
        imei: '',
        serialNumber: '',
        color: 'Black',
        customer: '',
        conditionNotes: '',
        checks: ['Screen operational', 'Battery charging', 'Camera clear', 'Body inspection'],
      });
      loadDevices();
    } catch (err) {
      toast.error(err.message || 'Failed to register device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (d, e) => {
    if (e) e.stopPropagation();
    setEditDevice({
      id: d.id,
      brand: d.brand || '',
      model: d.model || '',
      imei: d.imei !== '—' ? d.imei : '',
      serialNumber: d.serialNumber !== '—' ? d.serialNumber : '',
      color: d.color || '',
      customer: d.customer || '',
      conditionNotes: d.conditionNotes || '',
      status: d.status || 'Registered',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    if (!editDevice.brand.trim() || !editDevice.model.trim()) {
      toast.error('Brand and Model are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/devices/${editDevice.id}`, {
        brand: editDevice.brand.trim(),
        model: editDevice.model.trim(),
        imei1: editDevice.imei.trim(),
        serialNumber: editDevice.serialNumber.trim(),
        color: editDevice.color.trim(),
        customerName: editDevice.customer.trim(),
        conditionNotes: editDevice.conditionNotes.trim(),
        status: editDevice.status,
      });
      toast.success(`Device ${editDevice.brand} ${editDevice.model} updated!`);
      setIsEditModalOpen(false);
      loadDevices();
    } catch (err) {
      toast.error(err.message || 'Failed to update device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/devices/${deviceToDelete.id}`);
      toast.success(`Device ${deviceToDelete.brand} ${deviceToDelete.model} deleted!`);
      setDeviceToDelete(null);
      loadDevices();
    } catch (err) {
      toast.error(err.message || 'Failed to delete device');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.brand || '').toLowerCase().includes(q) ||
      (d.model || '').toLowerCase().includes(q) ||
      (d.imei || '').toLowerCase().includes(q) ||
      (d.serialNumber || '').toLowerCase().includes(q) ||
      (d.customer || '').toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout title="Devices" subtitle="Intake Checklist & IMEIs">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> HARDWARE INTAKE
          </div>
          <h1>Device Registry & IMEI Logs</h1>
          <p>Hardware condition inspection, serial IMEI tracking, and diagnostic checklists.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} /> Register Hardware
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Smartphone size={22} />,
            label: 'Registered Hardware',
            value: devices.length,
            color: 'blue',
            accent: true,
            sub: 'Client handsets',
          },
          {
            icon: <Cpu size={22} />,
            label: 'Device Brands',
            value: new Set(devices.map((d) => d.brand).filter(Boolean)).size,
            color: 'purple',
            accent: true,
            sub: 'OEM models tracked',
          },
          {
            icon: <ShieldCheck size={22} />,
            label: 'IMEI Verified',
            value: devices.filter((d) => d.imei).length,
            color: 'emerald',
            accent: true,
            delta: 'Verified',
            deltaColor: '#059669',
            sub: 'Serial barcodes logged',
          },
          {
            icon: <Battery size={22} />,
            label: 'Inspection Checklists',
            value: devices.filter((d) => d.conditionNotes || d.checklist).length,
            color: 'amber',
            accent: true,
            sub: 'Intake audit reports',
          },
        ]}
      />

      {devices.length === 0 && !isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Smartphone size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No devices registered yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Register customer device hardware to log physical conditions, serial numbers, and IMEI tracking.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Register Hardware
          </button>
        </div>
      ) : (
        <>
          <div className="device-profile-grid">
            {/* Device Hero Detail */}
            {activeDevice && (
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <Smartphone size={32} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="status-badge badge-blue">{activeDevice.brand}</span>
                      <span className="status-badge badge-green">{activeDevice.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(activeDevice)}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        onClick={() => setDeviceToDelete(activeDevice)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
                    {activeDevice.model}
                  </h2>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    IMEI: <strong style={{ color: '#2563eb', fontFamily: 'JetBrains Mono' }}>{activeDevice.imei}</strong> • Color: {activeDevice.color} • Owner: <strong style={{ color: '#1e293b' }}>{activeDevice.customer}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Matrix */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Inspection & Condition</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                {activeDevice?.conditionNotes || 'Device received in standard workshop condition.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(activeDevice?.checks || ['Screen tested', 'Battery operational', 'Camera clear', 'Body inspection']).map((check, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#334155',
                    }}
                  >
                    <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Device Table Directory */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="input-wrapper" style={{ width: '360px', position: 'relative' }}>
                <span className="input-icon"><Search size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  placeholder="Search by brand, model, IMEI, serial, customer..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchQuery && (
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
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                {filteredDevices.length} HARDWARE UNITS LOGGED
              </span>
            </div>

            <div className="table-container">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Device & Brand</th>
                    <th>IMEI / Serial</th>
                    <th>Color & Finish</th>
                    <th>Customer Account</th>
                    <th>Intake Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        {isLoading ? 'Loading devices...' : 'No devices match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((d) => {
                      const isSelected = activeDevice?.id === d.id;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => setActiveDevice(d)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#eff6ff' : undefined,
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Smartphone size={16} style={{ color: '#2563eb' }} />
                              <div>
                                <strong style={{ color: '#0f172a' }}>{d.model}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{d.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                              {d.imei}
                            </span>
                            {d.serialNumber && d.serialNumber !== '—' && (
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>SN: {d.serialNumber}</div>
                            )}
                          </td>
                          <td>
                            <span>{d.color}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{d.customer}</strong>
                          </td>
                          <td>
                            <span className="status-badge badge-blue">{d.status}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                title="Edit Device"
                                onClick={(e) => handleOpenEdit(d, e)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                title="Delete Device"
                                style={{ color: '#ef4444' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeviceToDelete(d);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
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
        </>
      )}

      {/* Register Device Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Register Hardware Unit</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleRegisterDevice}>
              <div style={{ marginBottom: '12px' }}>
                <DependentDeviceSelect
                  selectedBrand={newDevice.brand}
                  selectedModel={newDevice.model}
                  onBrandChange={(brand) => setNewDevice((prev) => ({ ...prev, brand }))}
                  onModelChange={(model) => setNewDevice((prev) => ({ ...prev, model }))}
                  required={true}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IMEI 1 *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="354892019284712"
                    value={newDevice.imei}
                    onChange={(e) => setNewDevice({ ...newDevice, imei: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="F2LX800P..."
                    value={newDevice.serialNumber}
                    onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Color / Finish</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Deep Purple"
                    value={newDevice.color}
                    onChange={(e) => setNewDevice({ ...newDevice, color: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Walk-in Client"
                    value={newDevice.customer}
                    onChange={(e) => setNewDevice({ ...newDevice, customer: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Condition Notes</label>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder="Minor scratches on back glass, screen cracked top-right"
                  value={newDevice.conditionNotes}
                  onChange={(e) => setNewDevice({ ...newDevice, conditionNotes: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Registering...' : 'Register Hardware'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Hardware Details</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateDevice}>
              <div style={{ marginBottom: '12px' }}>
                <DependentDeviceSelect
                  selectedBrand={editDevice.brand}
                  selectedModel={editDevice.model}
                  onBrandChange={(brand) => setEditDevice((prev) => ({ ...prev, brand }))}
                  onModelChange={(model) => setEditDevice((prev) => ({ ...prev, model }))}
                  required={true}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IMEI</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editDevice.imei}
                    onChange={(e) => setEditDevice({ ...editDevice, imei: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editDevice.serialNumber}
                    onChange={(e) => setEditDevice({ ...editDevice, serialNumber: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editDevice.color}
                    onChange={(e) => setEditDevice({ ...editDevice, color: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Owner</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editDevice.customer}
                    onChange={(e) => setEditDevice({ ...editDevice, customer: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="select-control"
                  value={editDevice.status}
                  onChange={(e) => setEditDevice({ ...editDevice, status: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="Registered">Registered</option>
                  <option value="In Diagnostics">In Diagnostics</option>
                  <option value="Repaired">Repaired</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Condition Notes</label>
                <textarea
                  className="input-control"
                  rows={2}
                  value={editDevice.conditionNotes}
                  onChange={(e) => setEditDevice({ ...editDevice, conditionNotes: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Hardware'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Device Modal */}
      {deviceToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Delete Hardware Entry?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deviceToDelete.brand} {deviceToDelete.model}</strong> (IMEI: {deviceToDelete.imei}) from the hardware registry?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeviceToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteDevice}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
