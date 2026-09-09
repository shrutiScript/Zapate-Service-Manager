import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle, Package, Search, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency, formatDateTime } from '../../../utils/formatters.js';
import api from '../../../services/api.js';

export const PurchaseHistoryPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [totalAmount, setTotalAmount] = useState('0');
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');

  const loadPurchases = () => {
    api.get('/purchases')
      .then((data) => {
        if (Array.isArray(data)) {
          setPurchases(data);
        } else {
          setPurchases([]);
        }
      })
      .catch(() => {
        setPurchases([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!supplierName.trim() || !partName.trim() || !purchasePrice) {
      toast.error('Supplier, Part description, and Purchase price are required');
      return;
    }

    const calculatedTotal = (Number(quantity) || 1) * (Number(purchasePrice) || 0);
    setIsSaving(true);
    try {
      await api.post('/purchases', {
        supplierName: supplierName.trim(),
        totalAmount: calculatedTotal,
        paidAmount: calculatedTotal,
        paymentStatus: 'Paid',
        items: [
          {
            name: partName.trim(),
            quantity: Number(quantity) || 1,
            purchasePrice: Number(purchasePrice) || 0,
            totalAmount: calculatedTotal,
          },
        ],
      });
      toast.success(`Purchase logged! +${quantity} qty automatically added to inventory stock.`);
      setShowModal(false);
      setSupplierName('');
      setPartName('');
      setQuantity('1');
      setPurchasePrice('');
      setTotalAmount('0');
      loadPurchases();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title="Procurement History" subtitle="Purchase Orders">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> INVENTORY PROCUREMENT
          </div>
          <h1>Purchase Orders & Inward Spares</h1>
          <p>Historical supplier POs, payment statuses, and stock inwards.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Log Inward Purchase
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <ShoppingBag size={22} />,
            label: 'Total Purchase Orders',
            value: purchases.length,
            color: 'blue',
            accent: true,
            sub: 'Inward PO orders',
          },
          {
            icon: <CheckCircle size={22} />,
            label: 'Procurement Spend',
            value: formatCurrency(purchases.reduce((s, p) => s + (Number(p.totalAmount || p.amount || 0)), 0)),
            color: 'emerald',
            accent: true,
            sub: 'Total spares spend',
          },
          {
            icon: <Package size={22} />,
            label: 'Total Stock Units',
            value: purchases.reduce((s, p) => s + (Number(p.quantity || 1)), 0),
            color: 'purple',
            accent: true,
            sub: 'Inward inventory parts',
          },
          {
            icon: <Search size={22} />,
            label: 'Suppliers Sourced',
            value: new Set(purchases.map((p) => p.supplierName || (typeof p.supplier === 'object' ? p.supplier?.name : p.supplier)).filter(Boolean)).size,
            color: 'amber',
            accent: true,
            sub: 'Unique vendor accounts',
          },
        ]}
      />

      {purchases.length === 0 && !isLoading ? (
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
            <ShoppingBag size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No purchases yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Log inward purchase orders from wholesale suppliers to increment inventory stock.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> Log Inward Purchase
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>Purchase Orders Ledger</strong>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{purchases.length} INVOICES</span>
          </div>

          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier / Vendor</th>
                  <th>Total Value</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Inward Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: '#2563eb' }}>
                        {p.invoiceNumber || `PO-00${idx + 1}`}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{p.supplierName}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatCurrency(p.totalAmount || 0)}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: '700' }}>{formatCurrency(p.paidAmount || 0)}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${p.paymentStatus === 'Paid' ? 'badge-green' : 'badge-amber'}`}>
                        {p.paymentStatus || 'Paid'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatDateTime(p.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
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
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Log Inward Purchase Order</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} disabled={isSaving}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Supplier Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Silicon Display Imports"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Part / Component Description *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. OLED Display Assembly"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Inward Qty *</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="5"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setTotalAmount(String((Number(e.target.value) || 0) * (Number(purchasePrice) || 0)));
                    }}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="3000"
                    value={purchasePrice}
                    onChange={(e) => {
                      setPurchasePrice(e.target.value);
                      setTotalAmount(String((Number(quantity) || 0) * (Number(e.target.value) || 0)));
                    }}
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 18px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Total Inward Amount</span>
                <strong style={{ fontSize: '16px', color: '#2563eb' }}>
                  {formatCurrency((Number(quantity) || 0) * (Number(purchasePrice) || 0))}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Logging...' : 'Log & Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
