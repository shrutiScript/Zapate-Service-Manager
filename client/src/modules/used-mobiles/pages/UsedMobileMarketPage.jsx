import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Plus,
  Smartphone,
  RefreshCw,
  CheckCircle,
  Search,
  DollarSign,
  ArrowRight,
  Inbox,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { DependentDeviceSelect } from '../../../components/common/DependentDeviceSelect.jsx';
import { validatePrice } from '../../../utils/validators.js';

export const UsedMobileMarketPage = () => {
  const [mobiles, setMobiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'In Stock' | 'Sold'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sellModalDevice, setSellModalDevice] = useState(null);
  const [mobileToDelete, setMobileToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newMobile, setNewMobile] = useState({
    brand: 'Apple',
    model: '',
    imei: '',
    grade: 'Grade A',
    cost: '',
    repair: '0',
    price: '',
    customerSource: '',
  });

  const [editMobile, setEditMobile] = useState({
    id: '',
    brand: 'Apple',
    model: '',
    imei: '',
    grade: 'Grade A',
    cost: '',
    repair: '0',
    price: '',
    status: 'In Stock',
    customerSource: '',
  });

  const [sellForm, setSellForm] = useState({
    buyerName: '',
    buyerPhone: '',
    sellingPrice: '',
  });

  const loadMobiles = () => {
    setIsLoading(true);
    api.get('/used-mobiles')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((m, i) => ({
            id: m._id || m.id || String(i + 1),
            brand: m.brand || 'Device',
            model: m.model || 'Model',
            imei: m.imei1 || m.imei || '—',
            grade: m.grade || m.condition || 'Grade A',
            cost: m.purchasePrice || 0,
            repair: m.repairCost || m.refurbishmentCost || 0,
            price: m.sellingPrice || 0,
            profit: (m.sellingPrice || 0) - ((m.purchasePrice || 0) + (m.repairCost || m.refurbishmentCost || 0)),
            status: m.status || 'In Stock',
            customerSource: m.customerSource || m.sellerName || '',
            buyerName: m.buyerName || '',
            buyerPhone: m.buyerPhone || '',
          }));
          setMobiles(mapped);
        } else {
          setMobiles([]);
        }
      })
      .catch(() => {
        setMobiles([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMobiles();
  }, []);

  const handleAddMobile = async (e) => {
    e.preventDefault();
    if (!newMobile.brand || !newMobile.model.trim() || !newMobile.imei.trim() || !newMobile.cost || !newMobile.price) {
      toast.error('Brand, Model, IMEI, Purchase Cost and Selling Price are required');
      return;
    }

    const costCheck = validatePrice(newMobile.cost, 'Purchase Cost');
    if (!costCheck.isValid) return toast.error(costCheck.error);
    const repairCheck = validatePrice(newMobile.repair || 0, 'Refurbish Cost');
    if (!repairCheck.isValid) return toast.error(repairCheck.error);
    const priceCheck = validatePrice(newMobile.price, 'Resale Price');
    if (!priceCheck.isValid) return toast.error(priceCheck.error);

    setIsSaving(true);
    try {
      await api.post('/used-mobiles', {
        brand: newMobile.brand,
        model: newMobile.model.trim(),
        imei: newMobile.imei.trim(),
        grade: newMobile.grade,
        purchasePrice: costCheck.value,
        repairCost: repairCheck.value,
        sellingPrice: priceCheck.value,
        sellerName: newMobile.customerSource.trim(),
        status: 'In Stock',
      });

      toast.success(`Pre-owned ${newMobile.brand} ${newMobile.model} logged into resale market!`);
      setIsAddModalOpen(false);
      setNewMobile({ brand: 'Apple', model: '', imei: '', grade: 'Grade A', cost: '', repair: '0', price: '', customerSource: '' });
      loadMobiles();
    } catch (err) {
      toast.error(err.message || 'Failed to register used mobile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (m) => {
    setEditMobile({
      id: m.id,
      brand: m.brand || 'Apple',
      model: m.model || '',
      imei: m.imei !== '—' ? m.imei : '',
      grade: m.grade || 'Grade A',
      cost: String(m.cost),
      repair: String(m.repair),
      price: String(m.price),
      status: m.status || 'In Stock',
      customerSource: m.customerSource || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMobile = async (e) => {
    e.preventDefault();
    if (!editMobile.brand || !editMobile.model.trim()) {
      toast.error('Brand and Model are required');
      return;
    }

    const costCheck = validatePrice(editMobile.cost, 'Purchase Cost');
    if (!costCheck.isValid) return toast.error(costCheck.error);
    const repairCheck = validatePrice(editMobile.repair || 0, 'Refurbish Cost');
    if (!repairCheck.isValid) return toast.error(repairCheck.error);
    const priceCheck = validatePrice(editMobile.price, 'Resale Price');
    if (!priceCheck.isValid) return toast.error(priceCheck.error);

    setIsSaving(true);
    try {
      await api.patch(`/used-mobiles/${editMobile.id}`, {
        brand: editMobile.brand,
        model: editMobile.model.trim(),
        imei: editMobile.imei.trim(),
        grade: editMobile.grade,
        purchasePrice: costCheck.value,
        repairCost: repairCheck.value,
        sellingPrice: priceCheck.value,
        status: editMobile.status,
      });

      toast.success(`Pre-owned device updated!`);
      setIsEditModalOpen(false);
      loadMobiles();
    } catch (err) {
      toast.error(err.message || 'Failed to update device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSell = (m) => {
    setSellModalDevice(m);
    setSellForm({
      buyerName: '',
      buyerPhone: '',
      sellingPrice: String(m.price),
    });
  };

  const handleConfirmSell = async (e) => {
    e.preventDefault();
    if (!sellModalDevice) return;

    const priceCheck = validatePrice(sellForm.sellingPrice, 'Selling Price');
    if (!priceCheck.isValid) return toast.error(priceCheck.error);

    setIsSaving(true);
    try {
      await api.post(`/used-mobiles/${sellModalDevice.id}/sell`, {
        buyerName: sellForm.buyerName.trim() || 'Walk-in Buyer',
        buyerPhone: sellForm.buyerPhone.trim(),
        sellingPrice: priceCheck.value,
      });

      toast.success(`Device marked as SOLD for ${formatCurrency(priceCheck.value)}!`);
      setSellModalDevice(null);
      loadMobiles();
    } catch (err) {
      toast.error(err.message || 'Failed to record sale');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMobile = async () => {
    if (!mobileToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/used-mobiles/${mobileToDelete.id}`);
      toast.success(`Device "${mobileToDelete.brand} ${mobileToDelete.model}" removed!`);
      setMobileToDelete(null);
      loadMobiles();
    } catch (err) {
      toast.error(err.message || 'Failed to delete used mobile');
    } finally {
      setIsDeleting(false);
    }
  };

  const inStockMobiles = mobiles.filter((m) => m.status === 'In Stock');
  const soldMobiles = mobiles.filter((m) => m.status === 'Sold');

  const filteredMobiles = mobiles.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (m.brand || '').toLowerCase().includes(q) ||
      (m.model || '').toLowerCase().includes(q) ||
      (m.imei || '').toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'In Stock' && m.status === 'In Stock') ||
      (activeFilter === 'Sold' && m.status === 'Sold');

    return matchesSearch && matchesFilter;
  });

  return (
    <MainLayout title="Used Mobiles" subtitle="Pre-Owned Inventory">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SECOND-HAND RESALE
          </div>
          <h1>Pre-Owned Mobile Marketplace</h1>
          <p>Trade-in device evaluations, refurbishment cost ledger, and resale profit margins.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} /> Intake Pre-Owned Mobile
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={3}
        items={[
          {
            icon: <Smartphone size={22} />,
            label: 'Available for Resale',
            value: inStockMobiles.length,
            color: 'blue',
            accent: true,
            sub: `Valuation: ${formatCurrency(inStockMobiles.reduce((s, m) => s + m.price, 0))}`,
          },
          {
            icon: <CheckCircle size={22} />,
            label: 'Mobiles Sold',
            value: soldMobiles.length,
            color: 'emerald',
            accent: true,
            sub: `Realized revenue: ${formatCurrency(soldMobiles.reduce((s, m) => s + m.price, 0))}`,
          },
          {
            icon: <TrendingUp size={22} />,
            label: 'Est. Margin Spread',
            value: formatCurrency(mobiles.reduce((s, m) => s + Math.max(0, m.profit), 0)),
            color: 'purple',
            accent: true,
            valueColor: '#059669',
            sub: 'Gross profit margin',
          },
        ]}
      />

      {mobiles.length === 0 && !isLoading ? (
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
            <RefreshCw size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No used mobiles added yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Intake trade-in pre-owned devices, record refurbishment costs, and track resale profit margins.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Intake Pre-Owned Mobile
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveFilter('ALL')}
              >
                All Handsets ({mobiles.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeFilter === 'In Stock' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveFilter('In Stock')}
              >
                In Stock ({inStockMobiles.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeFilter === 'Sold' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveFilter('Sold')}
              >
                Sold ({soldMobiles.length})
              </button>
            </div>

            <div className="input-wrapper" style={{ width: '320px' }}>
              <span className="input-icon"><Search size={15} /></span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search by brand, model, IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Handset & Model</th>
                  <th>IMEI / Serial</th>
                  <th>Grade</th>
                  <th>Cost + Refurb</th>
                  <th>Resale Price</th>
                  <th>Net Margin</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMobiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      {isLoading ? 'Loading used mobiles...' : 'No pre-owned handsets match your filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredMobiles.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{m.model}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{m.brand}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                          {m.imei}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue">{m.grade}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          {formatCurrency(m.cost)} {m.repair > 0 && <span style={{ color: '#ea580c', fontSize: '10px' }}>+ ₹{m.repair} repair</span>}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(m.price)}</strong>
                      </td>
                      <td>
                        <strong style={{ color: m.profit >= 0 ? '#059669' : '#ea580c' }}>
                          {formatCurrency(m.profit)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-badge ${m.status === 'Sold' ? 'badge-green' : 'badge-amber'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {m.status === 'In Stock' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                              onClick={() => handleOpenSell(m)}
                            >
                              Sell Handset
                            </button>
                          )}
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="Edit Device"
                            onClick={() => handleOpenEdit(m)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="Delete Device"
                            style={{ color: '#ef4444' }}
                            onClick={() => setMobileToDelete(m)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intake Pre-Owned Mobile Modal */}
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
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Intake Pre-Owned Mobile</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddMobile}>
              <div style={{ marginBottom: '12px' }}>
                <DependentDeviceSelect
                  selectedBrand={newMobile.brand}
                  selectedModel={newMobile.model}
                  onBrandChange={(brand) => setNewMobile((prev) => ({ ...prev, brand }))}
                  onModelChange={(model) => setNewMobile((prev) => ({ ...prev, model }))}
                  required={true}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IMEI *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="358941092847192"
                    value={newMobile.imei}
                    onChange={(e) => setNewMobile({ ...newMobile, imei: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition Grade</label>
                  <select
                    className="select-control"
                    value={newMobile.grade}
                    onChange={(e) => setNewMobile({ ...newMobile, grade: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="Grade A+">Grade A+ (Pristine)</option>
                    <option value="Grade A">Grade A (Minor wear)</option>
                    <option value="Grade B">Grade B (Normal wear)</option>
                    <option value="Grade C">Grade C (Heavy wear)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase (₹) *</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="18000"
                    value={newMobile.cost}
                    onChange={(e) => setNewMobile({ ...newMobile, cost: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Refurb Cost (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="1500"
                    value={newMobile.repair}
                    onChange={(e) => setNewMobile({ ...newMobile, repair: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Resale Price (₹) *</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="25000"
                    value={newMobile.price}
                    onChange={(e) => setNewMobile({ ...newMobile, price: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seller Customer / Source</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Rahul Sharma (Exchange)"
                  value={newMobile.customerSource}
                  onChange={(e) => setNewMobile({ ...newMobile, customerSource: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Logging...' : 'Intake Handset'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Used Mobile Modal */}
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
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Pre-Owned Mobile</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateMobile}>
              <div style={{ marginBottom: '12px' }}>
                <DependentDeviceSelect
                  selectedBrand={editMobile.brand}
                  selectedModel={editMobile.model}
                  onBrandChange={(brand) => setEditMobile((prev) => ({ ...prev, brand }))}
                  onModelChange={(model) => setEditMobile((prev) => ({ ...prev, model }))}
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
                    value={editMobile.imei}
                    onChange={(e) => setEditMobile({ ...editMobile, imei: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="select-control"
                    value={editMobile.status}
                    onChange={(e) => setEditMobile({ ...editMobile, status: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={editMobile.cost}
                    onChange={(e) => setEditMobile({ ...editMobile, cost: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Refurb Cost (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={editMobile.repair}
                    onChange={(e) => setEditMobile({ ...editMobile, repair: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Resale Price (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={editMobile.price}
                    onChange={(e) => setEditMobile({ ...editMobile, price: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Handset'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellModalDevice && (
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Sell {sellModalDevice.brand} {sellModalDevice.model}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSellModalDevice(null)}>✕</button>
            </div>

            <form onSubmit={handleConfirmSell}>
              <div className="form-group">
                <label className="form-label">Buyer Full Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Ramesh Patel"
                  value={sellForm.buyerName}
                  onChange={(e) => setSellForm({ ...sellForm, buyerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Buyer Phone</label>
                <input
                  type="tel"
                  className="input-control"
                  placeholder="9876543210"
                  value={sellForm.buyerPhone}
                  onChange={(e) => setSellForm({ ...sellForm, buyerPhone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Final Selling Price (₹) *</label>
                <input
                  type="number"
                  className="input-control"
                  value={sellForm.sellingPrice}
                  onChange={(e) => setSellForm({ ...sellForm, sellingPrice: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSellModalDevice(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Processing Sale...' : 'Confirm Sale & Mark Sold'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Used Mobile Modal */}
      {mobileToDelete && (
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
              Delete Pre-Owned Mobile?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{mobileToDelete.brand} {mobileToDelete.model}</strong> (IMEI: {mobileToDelete.imei}) from the resale inventory?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMobileToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteMobile}
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
