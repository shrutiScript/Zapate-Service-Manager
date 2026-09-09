import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Plus,
  Truck,
  Phone,
  Mail,
  Search,
  ShoppingBag,
  ArrowRight,
  Inbox,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const SupplierProcurementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newSup, setNewSup] = useState({ name: '', contact: '', phone: '', email: '', gstin: '', address: '' });
  const [editSup, setEditSup] = useState({ id: '', name: '', contact: '', phone: '', email: '', gstin: '', address: '' });

  // Quick PO form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poPartName, setPoPartName] = useState('');
  const [poQty, setPoQty] = useState('5');
  const [poUnitCost, setPoUnitCost] = useState('1000');
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  const loadSuppliers = () => {
    setIsLoading(true);
    api.get('/suppliers')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((s, i) => ({
            id: s._id || s.id || `SUP-0${i + 1}`,
            name: s.name || 'Vendor',
            contact: s.contactPerson || s.contact || 'Representative',
            phone: s.mobile || s.phone || '',
            email: s.email || '',
            gstin: s.gstin || '',
            address: s.address || '',
            purchased: s.totalPurchases || s.totalPurchased || 0,
            due: s.pendingBalance || s.outstandingBalance || 0,
          }));
          setSuppliers(mapped);
          if (mapped.length > 0 && !selectedSupplierId) {
            setSelectedSupplierId(mapped[0].id);
          }
        } else {
          setSuppliers([]);
        }
      })
      .catch(() => {
        setSuppliers([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSup.name.trim() || !newSup.phone.trim()) {
      toast.error('Supplier Name and Phone are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/suppliers', {
        name: newSup.name.trim(),
        contactPerson: newSup.contact.trim(),
        mobile: newSup.phone.trim(),
        email: newSup.email.trim(),
        gstin: newSup.gstin.trim(),
        address: newSup.address.trim(),
      });
      toast.success(`Supplier "${newSup.name}" added!`);
      setIsAddModalOpen(false);
      setNewSup({ name: '', contact: '', phone: '', email: '', gstin: '', address: '' });
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to add supplier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (s) => {
    setEditSup({
      id: s.id,
      name: s.name || '',
      contact: s.contact || '',
      phone: s.phone || '',
      email: s.email || '',
      gstin: s.gstin || '',
      address: s.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!editSup.name.trim() || !editSup.phone.trim()) {
      toast.error('Supplier Name and Phone are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/suppliers/${editSup.id}`, {
        name: editSup.name.trim(),
        contactPerson: editSup.contact.trim(),
        mobile: editSup.phone.trim(),
        email: editSup.email.trim(),
        gstin: editSup.gstin.trim(),
        address: editSup.address.trim(),
      });
      toast.success(`Supplier "${editSup.name}" updated!`);
      setIsEditModalOpen(false);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to update supplier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/suppliers/${supplierToDelete.id}`);
      toast.success(`Supplier "${supplierToDelete.name}" deleted!`);
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickPo = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || !poPartName.trim()) {
      toast.error('Please select a supplier and provide part name');
      return;
    }

    const supObj = suppliers.find((s) => s.id === selectedSupplierId);
    const qty = Number(poQty) || 1;
    const unitCost = Number(poUnitCost) || 0;
    const totalAmount = qty * unitCost;

    setIsSubmittingPo(true);
    try {
      await api.post('/purchases', {
        supplier: selectedSupplierId,
        supplierName: supObj?.name || 'Wholesale Supplier',
        items: [{ name: poPartName.trim(), quantity: qty, purchasePrice: unitCost, totalAmount }],
        totalAmount,
        paidAmount: totalAmount,
        paymentStatus: 'Paid',
      });
      toast.success(`Purchase Order logged! +${qty} ${poPartName} added to inventory stock.`);
      setPoPartName('');
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to log purchase order');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.contact || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout title="Suppliers & Purchases" subtitle="Vendor Accounts">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> PROCUREMENT & VENDORS
          </div>
          <h1>Wholesale Parts Suppliers</h1>
          <p>Vendor contacts, procurement order logs, and wholesale payables.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Truck size={22} />,
            label: 'Total Vendors',
            value: suppliers.length,
            color: 'blue',
            accent: true,
            sub: 'Wholesale suppliers',
          },
          {
            icon: <Building size={22} />,
            label: 'Active Accounts',
            value: suppliers.filter((s) => (s.purchased || 0) > 0 || (s.due || 0) > 0).length || suppliers.length,
            color: 'emerald',
            accent: true,
            delta: 'Verified',
            deltaColor: '#059669',
            sub: 'Operational vendors',
          },
          {
            icon: <ShoppingBag size={22} />,
            label: 'Total Procured Value',
            value: formatCurrency(suppliers.reduce((s, sup) => s + (Number(sup.purchased) || 0), 0)),
            color: 'purple',
            accent: true,
            sub: 'Gross parts stock orders',
          },
          {
            icon: <AlertTriangle size={22} />,
            label: 'Payables Outstanding',
            value: formatCurrency(suppliers.reduce((s, sup) => s + (Number(sup.due) || 0), 0)),
            color: 'orange',
            accent: true,
            valueColor: suppliers.some((s) => (Number(s.due) || 0) > 0) ? '#ea580c' : undefined,
            sub: 'Pending wholesale dues',
          },
        ]}
      />

      {suppliers.length === 0 && !isLoading ? (
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
            <Truck size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No suppliers yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Add wholesale spare parts vendors and component distributors to manage purchase orders.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left: Supplier Registry */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="input-wrapper" style={{ width: '320px' }}>
                <span className="input-icon"><Search size={15} /></span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  placeholder="Search suppliers by name, contact, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                {filteredSuppliers.length} VENDORS
              </span>
            </div>

            <div className="table-container">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Supplier / Company</th>
                    <th>Representative</th>
                    <th>Contact Phone</th>
                    <th>Purchased</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        {isLoading ? 'Loading suppliers...' : 'No suppliers match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id}>
                        <td>
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
                                fontWeight: '700',
                                fontSize: '11px',
                              }}
                            >
                              <Building size={16} />
                            </div>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{s.name}</strong>
                              {s.email && <div style={{ fontSize: '11px', color: '#64748b' }}>{s.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155' }}>{s.contact}</span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{s.phone}</strong>
                        </td>
                        <td>
                          <strong style={{ color: '#059669' }}>{formatCurrency(s.purchased)}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="topbar-icon-btn"
                              title="Edit Supplier"
                              onClick={() => handleOpenEdit(s)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="topbar-icon-btn"
                              title="Delete Supplier"
                              style={{ color: '#ef4444' }}
                              onClick={() => setSupplierToDelete(s)}
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

          {/* Right: Quick Purchase Order Dispatcher */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <ShoppingBag size={18} style={{ color: '#2563eb' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Log Inward Purchase</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Auto-increments inventory stock</p>
              </div>
            </div>

            <form onSubmit={handleQuickPo} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Vendor / Supplier *</label>
                <select
                  className="select-control"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Component / Item Description *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. iPhone 14 Pro Max OLED Display"
                  value={poPartName}
                  onChange={(e) => setPoPartName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Inward Qty *</label>
                  <input
                    type="number"
                    className="input-control"
                    value={poQty}
                    onChange={(e) => setPoQty(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    className="input-control"
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700' }}>Total Inward Value:</span>
                <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>
                  {formatCurrency((Number(poQty) || 0) * (Number(poUnitCost) || 0))}
                </strong>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isSubmittingPo}
              >
                {isSubmittingPo ? 'Logging Inward...' : 'Log Purchase & Increment Stock'} <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add Parts Vendor</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSupplier}>
              <div className="form-group">
                <label className="form-label">Company / Vendor Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Apex Mobile Wholesale"
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Rajesh Kumar"
                  value={newSup.contact}
                  onChange={(e) => setNewSup({ ...newSup, contact: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="input-control"
                    placeholder="9876543210"
                    value={newSup.phone}
                    onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="29AAAAA0000A1Z5"
                    value={newSup.gstin}
                    onChange={(e) => setNewSup({ ...newSup, gstin: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="sales@apexwholesale.com"
                  value={newSup.email}
                  onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Register Vendor'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Vendor</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateSupplier}>
              <div className="form-group">
                <label className="form-label">Company / Vendor Name *</label>
                <input
                  type="text"
                  className="input-control"
                  value={editSup.name}
                  onChange={(e) => setEditSup({ ...editSup, name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="input-control"
                  value={editSup.contact}
                  onChange={(e) => setEditSup({ ...editSup, contact: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="input-control"
                    value={editSup.phone}
                    onChange={(e) => setEditSup({ ...editSup, phone: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editSup.gstin}
                    onChange={(e) => setEditSup({ ...editSup, gstin: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  value={editSup.email}
                  onChange={(e) => setEditSup({ ...editSup, email: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Vendor'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Modal */}
      {supplierToDelete && (
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
              Delete Supplier?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete vendor <strong>{supplierToDelete.name}</strong> from your supplier directory?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSupplierToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteSupplier}
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
