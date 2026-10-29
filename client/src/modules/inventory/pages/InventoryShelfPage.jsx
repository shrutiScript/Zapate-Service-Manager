import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import { formatCurrency } from '../../../utils/formatters.js';
import {
  Plus,
  Package,
  AlertTriangle,
  Search,
  CheckCircle,
  Truck,
  ShoppingBag,
  History,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  Layers,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  X,
  Filter,
  BarChart3,
  TrendingUp,
  Box,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext.jsx';
import { toast } from 'sonner';
import api from '../../../services/api.js';

import { SPARE_CATEGORIES } from '../constants/categories.js';

export const InventoryShelfPage = () => {
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useApp();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'categories' | 'suppliers' | 'stock-purchase' | 'stock-history'
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);

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
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'IN_STOCK'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals for Stock Items
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);

  // Modals for Suppliers
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [newSup, setNewSup] = useState({ name: '', contact: '', phone: '', email: '', gstin: '', address: '' });

  // Stock Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    selectedPartId: '',
    quantity: '5',
    unitCost: '500',
  });

  const [newPart, setNewPart] = useState({
    name: '',
    sku: '',
    brand: '',
    model: '',
    category: 'Screens',
    rack: 'Rack A-1',
    qty: '10',
    purchasePrice: '1000',
    price: '1500',
    minQty: '3',
  });

  const [editPart, setEditPart] = useState({
    id: '',
    name: '',
    sku: '',
    brand: '',
    model: '',
    category: 'Screens',
    rack: '',
    qty: '0',
    purchasePrice: '0',
    price: '0',
    minQty: '3',
  });

  const loadInventory = () => {
    setIsLoading(true);
    api.get('/inventory')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((p, i) => ({
            id: p._id || p.id || String(i + 1),
            name: p.name || 'Component',
            sku: p.sku || `SKU-${1000 + i}`,
            brand: p.brand || 'Universal',
            model: p.compatibleModel || p.model || 'Universal',
            category: p.category || 'Spares',
            rack: p.locationRack || p.rackLocation || p.rack || 'Shelf A-01',
            qty: p.quantity ?? p.stockQuantity ?? 0,
            minQty: p.minimumQuantity ?? p.reorderLevel ?? 3,
            purchasePrice: p.purchasePrice || 0,
            price: p.sellingPrice || p.price || 0,
            status: p.status || (p.quantity <= (p.minimumQuantity || 3) ? 'Low Stock' : 'In Stock'),
          }));
          setParts(mapped);
        } else {
          setParts([]);
        }
      })
      .catch(() => setParts([]))
      .finally(() => setIsLoading(false));
  };

  const loadSuppliers = () => {
    api.get('/suppliers')
      .then((res) => {
        if (Array.isArray(res)) setSuppliers(res);
        else setSuppliers([]);
      })
      .catch(() => setSuppliers([]));
  };

  const loadPurchases = () => {
    api.get('/purchases')
      .then((res) => {
        if (Array.isArray(res)) setPurchases(res);
        else setPurchases([]);
      })
      .catch(() => setPurchases([]));
  };

  useEffect(() => {
    loadInventory();
    loadSuppliers();
    loadPurchases();
  }, []);

  // Filtered Parts
  const filteredParts = parts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.model || '').toLowerCase().includes(q) ||
      (p.compatibleModel || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.locationRack || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;
    if (activeFilter === 'LOW') return p.qty <= p.minQty;
    if (activeFilter === 'IN_STOCK') return p.qty > p.minQty;
    return true;
  });

  const lowStockCount = parts.filter((p) => p.qty <= p.minQty).length;
  const inStockCount = parts.filter((p) => p.qty > p.minQty).length;

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!newPart.name.trim() || !newPart.sku.trim()) {
      toast.error('Part Name and SKU are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/inventory', {
        name: newPart.name.trim(),
        sku: newPart.sku.trim(),
        brand: newPart.brand.trim() || 'Universal',
        compatibleModel: newPart.model.trim() || 'Universal',
        category: newPart.category,
        locationRack: newPart.rack.trim() || 'Shelf A-01',
        quantity: Number(newPart.qty) || 0,
        purchasePrice: Number(newPart.purchasePrice) || 0,
        sellingPrice: Number(newPart.price) || 0,
        minimumQuantity: Number(newPart.minQty) || 3,
      });

      toast.success(`Spare part "${newPart.name}" added to inventory!`);
      setIsAddModalOpen(false);
      setNewPart({
        name: '',
        sku: '',
        brand: '',
        model: '',
        category: 'Screens',
        rack: 'Rack A-1',
        qty: '10',
        purchasePrice: '1000',
        price: '1500',
        minQty: '3',
      });
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to add spare part');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (p) => {
    setEditPart({
      id: p.id,
      name: p.name || '',
      sku: p.sku || '',
      brand: p.brand || '',
      model: p.model || '',
      category: p.category || 'Screens',
      rack: p.rack || '',
      qty: String(p.qty),
      purchasePrice: String(p.purchasePrice || 0),
      price: String(p.price || 0),
      minQty: String(p.minQty || 3),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePart = async (e) => {
    e.preventDefault();
    if (!editPart.name.trim() || !editPart.sku.trim()) {
      toast.error('Part Name and SKU are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/inventory/${editPart.id}`, {
        name: editPart.name.trim(),
        sku: editPart.sku.trim(),
        brand: editPart.brand.trim() || 'Universal',
        compatibleModel: editPart.model.trim() || 'Universal',
        category: editPart.category,
        locationRack: editPart.rack.trim() || 'Shelf A-01',
        quantity: Number(editPart.qty) || 0,
        purchasePrice: Number(editPart.purchasePrice) || 0,
        sellingPrice: Number(editPart.price) || 0,
        minimumQuantity: Number(editPart.minQty) || 3,
      });

      toast.success(`Spare part "${editPart.name}" updated!`);
      setIsEditModalOpen(false);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to update spare part');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePart = async () => {
    if (!partToDelete) return;
    setIsSaving(true);
    try {
      await api.delete(`/inventory/${partToDelete.id}`);
      toast.success(`Spare part "${partToDelete.name}" deleted from inventory!`);
      setPartToDelete(null);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to delete spare part');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setIsSaving(true);
    try {
      await api.delete(`/suppliers/${supplierToDelete._id || supplierToDelete.id}`);
      toast.success(`Supplier "${supplierToDelete.name || supplierToDelete.supplierName}" deleted!`);
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdjust = async (id, delta) => {
    const target = parts.find((p) => p.id === id);
    if (!target) return;
    const newQty = Math.max(0, target.qty + delta);

    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: newQty, status: newQty <= p.minQty ? 'Low Stock' : 'In Stock' } : p))
    );

    try {
      await api.patch(`/inventory/${id}`, { quantity: newQty });
    } catch (err) {
      toast.error('Failed to adjust stock quantity');
      loadInventory();
    }
  };

  // Supplier Add Handler
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSup.name.trim()) {
      toast.error('Supplier Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/suppliers', {
        name: newSup.name.trim(),
        contactPerson: newSup.contact.trim(),
        phone: newSup.phone.trim(),
        email: newSup.email.trim(),
        gstNumber: newSup.gstin.trim(),
        address: newSup.address.trim(),
      });
      toast.success(`Supplier "${newSup.name}" added successfully!`);
      setIsAddSupplierModalOpen(false);
      setNewSup({ name: '', contact: '', phone: '', email: '', gstin: '', address: '' });
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to add supplier');
    } finally {
      setIsSaving(false);
    }
  };

  // Stock Purchase Handler (Procurement POS Flow)
  const handleConfirmStockPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplierId) {
      toast.error('Please select a supplier.');
      return;
    }
    if (!purchaseForm.selectedPartId) {
      toast.error('Please select a spare part.');
      return;
    }

    const qty = Number(purchaseForm.quantity) || 1;
    const cost = Number(purchaseForm.unitCost) || 0;
    const selectedPart = parts.find((p) => String(p.id) === String(purchaseForm.selectedPartId));
    const selectedSupplier = suppliers.find((s) => String(s._id || s.id) === String(purchaseForm.supplierId));

    setIsSaving(true);
    try {
      // 1. Create Purchase Order Record (Backend automatically increments stock & ledger)
      await api.post('/purchases', {
        supplier: purchaseForm.supplierId,
        supplierId: purchaseForm.supplierId,
        supplierName: selectedSupplier?.name || selectedSupplier?.supplierName || 'Vendor',
        items: [
          {
            partId: purchaseForm.selectedPartId,
            name: selectedPart?.name || 'Spare Part',
            quantity: qty,
            purchasePrice: cost,
            unitCost: cost,
            totalAmount: qty * cost,
            totalCost: qty * cost,
          },
        ],
        totalAmount: qty * cost,
        paidAmount: qty * cost,
        paymentStatus: 'Paid',
      });

      toast.success(`Stock Purchase Confirmed! Increased stock of "${selectedPart?.name}" by +${qty} units.`);
      setPurchaseForm({ supplierId: '', selectedPartId: '', quantity: '5', unitCost: '500' });
      loadInventory();
      loadPurchases();
      setActiveTab('stock');
    } catch (err) {
      toast.error(err.message || 'Failed to complete stock purchase');
    } finally {
      setIsSaving(false);
    }
  };

  // Stock health bar helper
  const getStockHealth = (qty, minQty) => {
    const maxDisplay = Math.max(minQty * 4, 20);
    const pct = Math.min((qty / maxDisplay) * 100, 100);
    if (qty <= minQty) return { pct, color: '#ef4444', bg: '#fef2f2' };
    if (qty <= minQty * 2) return { pct, color: '#f59e0b', bg: '#fffbeb' };
    return { pct, color: '#10b981', bg: '#ecfdf5' };
  };

  // Accurate Category SKU count calculation from database parts
  const getCategorySkuCount = (cat) => {
    return parts.filter((p) => {
      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();
      return (
        pCat === cat.name.toLowerCase() ||
        pCat === cat.shortName.toLowerCase() ||
        cat.matchTerms.some((term) => pCat.includes(term) || pName.includes(term))
      );
    }).length;
  };

  // Category card navigation / filtering
  const handleCategoryClick = (cat) => {
    handleSearchChange(cat.searchKeyword || cat.shortName || cat.name);
    setActiveTab('stock');
    toast.info(`Filtering inventory by "${cat.name}"`);
  };

  // Tab definitions
  const tabs = [
    { id: 'stock', label: 'Stock Inventory', icon: Package, count: parts.length },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'suppliers', label: 'Suppliers Directory', icon: Truck, count: suppliers.length },
    { id: 'stock-purchase', label: 'Stock Purchase (PO)', icon: ShoppingBag },
    { id: 'stock-history', label: 'Stock History', icon: History, count: purchases.length },
  ];

  return (
    <MainLayout title="Parts Inventory" subtitle="Stock, Suppliers & Procurement">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> INVENTORY CONTROL
          </div>
          <h1>Parts Inventory Management</h1>
          <p>Manage spare parts stock, supplier directory, automated stock purchases, and history.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('stock-purchase')}>
            <ShoppingBag size={16} /> Stock Purchase
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Part
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Package size={22} />,
            label: 'Total Parts SKU',
            value: parts.length,
            color: 'blue',
            accent: true,
            sub: 'Registered items',
          },
          {
            icon: <AlertTriangle size={22} />,
            label: 'Low Stock Alert',
            value: lowStockCount,
            color: lowStockCount > 0 ? 'amber' : 'green',
            accent: true,
            valueColor: lowStockCount > 0 ? '#d97706' : '#16a34a',
            delta: lowStockCount > 0 ? '⚠ Action' : '✓ Healthy',
            deltaColor: lowStockCount > 0 ? '#d97706' : '#16a34a',
            sub: lowStockCount > 0 ? 'Items need reorder' : 'All levels normal',
          },
          {
            icon: <Truck size={22} />,
            label: 'Active Suppliers',
            value: suppliers.length,
            color: 'emerald',
            accent: true,
            sub: 'Wholesale vendors',
          },
          {
            icon: <ShoppingBag size={22} />,
            label: 'Purchase Orders',
            value: purchases.length,
            color: 'purple',
            accent: true,
            sub: 'Total procurements',
          },
        ]}
      />

      {/* Navigation Tab Bar */}
      <div className="card" style={{ padding: '6px 8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="inv-tab-btn"
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count != null && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    marginLeft: '2px',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: STOCK INVENTORY                                        */}
      {/* ============================================================ */}
      {activeTab === 'stock' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Search & Filter Toolbar */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#fafbfd',
          }}>
            <div className="input-wrapper" style={{ flex: 1, maxWidth: '380px', minWidth: '200px' }}>
              <span className="input-icon">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search by part name, SKU, brand, model, rack..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ fontSize: '13px' }}
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
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={13} style={{ color: '#94a3b8', marginRight: '4px' }} />
              {[
                { id: 'ALL', label: 'All Items', count: parts.length },
                { id: 'LOW', label: 'Low Stock', count: lowStockCount },
                { id: 'IN_STOCK', label: 'In Stock', count: inStockCount },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: activeFilter === f.id ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    background: activeFilter === f.id ? '#eff6ff' : '#f1f5f9',
                    color: activeFilter === f.id ? '#2563eb' : '#64748b',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '0 5px',
                    borderRadius: '8px',
                    background: activeFilter === f.id ? '#dbeafe' : '#e2e8f0',
                    color: activeFilter === f.id ? '#1d4ed8' : '#94a3b8',
                  }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Spare Part & SKU</th>
                  <th style={{ minWidth: '140px' }}>Brand / Model</th>
                  <th>Location</th>
                  <th style={{ minWidth: '160px' }}>Stock Quantity</th>
                  <th style={{ minWidth: '140px' }}>Cost / Selling Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '100px', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Package size={28} style={{ color: '#cbd5e1' }} />
                        <span>Loading inventory spare parts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Search size={28} style={{ color: '#cbd5e1' }} />
                        <span>No spare parts match your search criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p) => {
                    const isLow = p.qty <= p.minQty;
                    const health = getStockHealth(p.qty, p.minQty);
                    return (
                      <tr key={p.id}>
                        {/* Part Name & SKU */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13px', lineHeight: 1.3 }}>{p.name}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: '#64748b',
                                background: '#f1f5f9',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                letterSpacing: '0.02em',
                              }}>
                                {p.sku}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Brand / Model */}
                        <td>
                          <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#1e293b' }}>{p.brand}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.model}</div>
                        </td>

                        {/* Rack Location */}
                        <td>
                          <span style={{
                            fontSize: '12px',
                            color: '#475569',
                            background: '#f1f5f9',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            display: 'inline-block',
                          }}>
                            {p.rack}
                          </span>
                        </td>

                        {/* Stock Quantity with Mini Progress Bar */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(p.id, -1)}
                                className="inv-qty-btn"
                                style={{
                                  border: '1px solid #e2e8f0',
                                  background: '#ffffff',
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  transition: 'all 0.15s ease',
                                }}
                                title="Decrease by 1"
                              >
                                <MinusCircle size={14} />
                              </button>
                              <strong style={{
                                fontSize: '15px',
                                fontWeight: '800',
                                color: isLow ? '#dc2626' : '#0f172a',
                                minWidth: '28px',
                                textAlign: 'center',
                                fontFamily: 'monospace',
                              }}>
                                {p.qty}
                              </strong>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(p.id, 1)}
                                className="inv-qty-btn"
                                style={{
                                  border: '1px solid #dbeafe',
                                  background: '#eff6ff',
                                  cursor: 'pointer',
                                  color: '#2563eb',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  transition: 'all 0.15s ease',
                                }}
                                title="Increase by 1"
                              >
                                <PlusCircle size={14} />
                              </button>
                            </div>
                            {/* Mini stock health bar */}
                            <div style={{
                              width: '80px',
                              height: '4px',
                              borderRadius: '4px',
                              background: health.bg,
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${health.pct}%`,
                                height: '100%',
                                borderRadius: '4px',
                                background: health.color,
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#059669',
                            fontFamily: 'monospace',
                          }}>
                            {formatCurrency(p.price)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Cost: {formatCurrency(p.purchasePrice)}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td>
                          <span className={`status-badge ${isLow ? 'badge-amber' : 'badge-green'}`} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}>
                            {isLow && (
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#d97706',
                                animation: 'lowStockPulse 1.5s ease-in-out infinite',
                                flexShrink: 0,
                              }} />
                            )}
                            {p.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="inv-action-btn"
                              style={{
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                cursor: 'pointer',
                                color: '#475569',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                transition: 'all 0.15s ease',
                              }}
                              title="Edit Part"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartToDelete(p)}
                              className="inv-action-btn inv-delete-btn"
                              style={{
                                border: '1px solid #fee2e2',
                                background: '#ffffff',
                                cursor: 'pointer',
                                color: '#ef4444',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                transition: 'all 0.15s ease',
                              }}
                              title="Delete Part"
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

          {/* Table Footer */}
          {!isLoading && filteredParts.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafbfd',
              fontSize: '12px',
              color: '#94a3b8',
            }}>
              <span>Showing <strong style={{ color: '#475569' }}>{filteredParts.length}</strong> of {parts.length} items</span>
              <span>{inStockCount} in stock • {lowStockCount} low stock</span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CATEGORIES                                             */}
      {/* ============================================================ */}
      {activeTab === 'categories' && (
        <div className="spare-categories-container">
          {/* Section Heading with Blue Vertical Accent Pill */}
          <div className="spare-categories-heading">
            <span className="spare-categories-accent-bar" />
            <h2 className="spare-categories-title">Spare Parts Categories</h2>
          </div>

          {/* 4-per-row Responsive Grid */}
          <div className="spare-categories-grid">
            {SPARE_CATEGORIES.map((cat) => {
              const skuCount = getCategorySkuCount(cat);
              return (
                <div
                  key={cat.id}
                  className="spare-category-card"
                  onClick={() => handleCategoryClick(cat)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategoryClick(cat);
                    }
                  }}
                  title={`Click to filter inventory by ${cat.name}`}
                >
                  {/* Rounded-Square Image Container with Soft Pastel Background */}
                  <div
                    className="spare-category-thumb"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="spare-category-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Category Details */}
                  <div className="spare-category-info">
                    <h4 className="spare-category-name">{cat.name}</h4>
                    <p className="spare-category-skus">{skuCount} SKUs registered</p>
                  </div>

                  {/* Right-Facing Chevron */}
                  <ChevronRight size={18} className="spare-category-chevron" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SUPPLIERS DIRECTORY                                     */}
      {/* ============================================================ */}
      {activeTab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Suppliers & Parts Vendors</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAddSupplierModalOpen(true)}>
              <Plus size={14} /> Add Supplier
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {suppliers.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 32px', color: '#94a3b8' }}>
                <Truck size={32} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <p style={{ margin: 0 }}>No suppliers registered yet. Click "Add Supplier" to add vendor contact details.</p>
              </div>
            ) : (
              suppliers.map((s) => (
                <div key={s._id || s.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{s.name || s.supplierName}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>Contact: {s.contactPerson || s.contact || 'Sales Desk'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="status-badge badge-blue">Active Vendor</span>
                      <button
                        type="button"
                        onClick={() => setSupplierToDelete(s)}
                        className="inv-action-btn inv-delete-btn"
                        style={{
                          border: '1px solid #fee2e2',
                          background: '#ffffff',
                          cursor: 'pointer',
                          color: '#ef4444',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.15s ease',
                        }}
                        title="Delete Supplier"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Phone size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                      <span>{s.phone || s.contactNumber || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mail size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                      <span>{s.email || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                      <span>{s.address || 'India'}</span>
                    </div>
                  </div>

                  {s.gstNumber && (
                    <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', marginTop: '8px', border: '1px solid #f1f5f9' }}>
                      GSTIN: {s.gstNumber}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: STOCK PURCHASE (PROCUREMENT POS WORKFLOW)              */}
      {/* ============================================================ */}
      {activeTab === 'stock-purchase' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Stock Purchase Order (PO)</h3>

            <form onSubmit={handleConfirmStockPurchase}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Parts Supplier / Vendor *</label>
                {suppliers.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#ea580c', padding: '12px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                    No suppliers registered. Please add a supplier in the "Suppliers Directory" tab first.
                  </div>
                ) : (
                  <select
                    className="input-control"
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name || s.supplierName} ({s.phone || 'No Phone'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Spare Part Item *</label>
                <select
                  className="input-control"
                  value={purchaseForm.selectedPartId}
                  onChange={(e) => {
                    const p = parts.find((item) => String(item.id) === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      selectedPartId: e.target.value,
                      unitCost: p ? String(p.purchasePrice || 500) : '500',
                    });
                  }}
                  required
                >
                  <option value="">-- Select Inventory Part --</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current Stock: {p.qty}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-control"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Purchase Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="input-control"
                    value={purchaseForm.unitCost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Total Purchase Cost:</span>
                  <strong style={{ color: '#059669', fontSize: '18px', fontFamily: 'monospace' }}>
                    {formatCurrency((Number(purchaseForm.quantity) || 0) * (Number(purchaseForm.unitCost) || 0))}
                  </strong>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSaving || suppliers.length === 0}>
                <CheckCircle2 size={16} /> Confirm Purchase & Auto-Increase Stock
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>Procurement & Auto-Inventory Workflow</h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6 }}>
              When you confirm a Stock Purchase order:
            </p>
            <ul style={{ fontSize: '12.5px', color: '#334155', margin: '12px 0 0 16px', lineHeight: 1.8 }}>
              <li>Inventory stock quantity for the selected spare part increases automatically.</li>
              <li>Unit purchase price updates in master inventory catalog.</li>
              <li>Purchase order record is associated with the selected supplier.</li>
              <li>Stock movement log entry is generated for audit history.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: STOCK HISTORY                                          */}
      {/* ============================================================ */}
      {activeTab === 'stock-history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>PO / Reference</th>
                  <th>Supplier / Activity</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <History size={28} style={{ color: '#cbd5e1' }} />
                        <span>No stock purchase orders recorded yet.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p._id || p.poNumber}>
                      <td style={{ fontSize: '12.5px', color: '#475569' }}>
                        {new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        <strong style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '12.5px' }}>{p.poNumber || p.id || 'PO-1001'}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>{p.supplierName || 'Vendor'}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.items?.length || 1} item line</div>
                      </td>
                      <td>
                        <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{formatCurrency(p.totalAmount || 0)}</strong>
                      </td>
                      <td>
                        <span className="status-badge badge-green">{p.paymentStatus || 'PAID'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD PART MODAL                                                 */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '28px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Add New Spare Part</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPart}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Part Name *</label>
                  <input type="text" className="input-control" placeholder="e.g. iPhone 13 OLED Display" value={newPart.name} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input type="text" className="input-control" placeholder="e.g. DISP-IP13" value={newPart.sku} onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="input-control" placeholder="Apple" value={newPart.brand} onChange={(e) => setNewPart({ ...newPart, brand: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Compatible Model</label>
                  <input type="text" className="input-control" placeholder="iPhone 13" value={newPart.model} onChange={(e) => setNewPart({ ...newPart, model: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="input-control"
                    value={newPart.category}
                    onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                    required
                  >
                    {SPARE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf / Rack Location</label>
                  <input type="text" className="input-control" placeholder="Rack A-1" value={newPart.rack} onChange={(e) => setNewPart({ ...newPart, rack: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div className="form-group">
                  <label className="form-label">Initial Qty</label>
                  <input type="number" min="0" className="input-control" value={newPart.qty} onChange={(e) => setNewPart({ ...newPart, qty: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹)</label>
                  <input type="number" min="0" className="input-control" value={newPart.purchasePrice} onChange={(e) => setNewPart({ ...newPart, purchasePrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price (₹)</label>
                  <input type="number" min="0" className="input-control" value={newPart.price} onChange={(e) => setNewPart({ ...newPart, price: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Spare Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT PART MODAL                                                */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '28px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Edit Spare Part</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdatePart}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Part Name *</label>
                  <input type="text" className="input-control" value={editPart.name} onChange={(e) => setEditPart({ ...editPart, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input type="text" className="input-control" value={editPart.sku} onChange={(e) => setEditPart({ ...editPart, sku: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="input-control" value={editPart.brand} onChange={(e) => setEditPart({ ...editPart, brand: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Compatible Model</label>
                  <input type="text" className="input-control" value={editPart.model} onChange={(e) => setEditPart({ ...editPart, model: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="input-control"
                    value={editPart.category}
                    onChange={(e) => setEditPart({ ...editPart, category: e.target.value })}
                    required
                  >
                    {SPARE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf / Rack Location</label>
                  <input type="text" className="input-control" value={editPart.rack} onChange={(e) => setEditPart({ ...editPart, rack: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" min="0" className="input-control" value={editPart.qty} onChange={(e) => setEditPart({ ...editPart, qty: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase (₹)</label>
                  <input type="number" min="0" className="input-control" value={editPart.purchasePrice} onChange={(e) => setEditPart({ ...editPart, purchasePrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling (₹)</label>
                  <input type="number" min="0" className="input-control" value={editPart.price} onChange={(e) => setEditPart({ ...editPart, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Qty</label>
                  <input type="number" min="0" className="input-control" value={editPart.minQty} onChange={(e) => setEditPart({ ...editPart, minQty: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD SUPPLIER MODAL                                             */}
      {/* ============================================================ */}
      {isAddSupplierModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '28px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Add New Supplier</h3>
              <button type="button" onClick={() => setIsAddSupplierModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Supplier / Vendor Name *</label>
                <input type="text" className="input-control" placeholder="e.g. Mobile Spares Wholesale Ltd" value={newSup.name} onChange={(e) => setNewSup({ ...newSup, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input type="text" className="input-control" placeholder="e.g. Rajesh Kumar" value={newSup.contact} onChange={(e) => setNewSup({ ...newSup, contact: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" className="input-control" placeholder="+91 9876543210" value={newSup.phone} onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Email Address</label>
                <input type="email" className="input-control" placeholder="sales@spares.in" value={newSup.email} onChange={(e) => setNewSup({ ...newSup, email: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddSupplierModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE PART CONFIRMATION MODAL                               */}
      {/* ============================================================ */}
      {partToDelete && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Delete Spare Part</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Are you sure you want to remove this item?</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px' }}>
              <strong style={{ color: '#0f172a' }}>{partToDelete.name}</strong>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                SKU: <span style={{ fontFamily: 'monospace' }}>{partToDelete.sku}</span> • Qty: {partToDelete.qty}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPartToDelete(null)} disabled={isSaving}>Cancel</button>
              <button type="button" onClick={handleDeletePart} disabled={isSaving} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                {isSaving ? 'Deleting...' : 'Delete Part'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE SUPPLIER CONFIRMATION MODAL                           */}
      {/* ============================================================ */}
      {supplierToDelete && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Delete Supplier</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Are you sure you want to remove this vendor?</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px' }}>
              <strong style={{ color: '#0f172a' }}>{supplierToDelete.name || supplierToDelete.supplierName}</strong>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                Phone: {supplierToDelete.phone || supplierToDelete.contactNumber || '—'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSupplierToDelete(null)} disabled={isSaving}>Cancel</button>
              <button type="button" onClick={handleDeleteSupplier} disabled={isSaving} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                {isSaving ? 'Deleting...' : 'Delete Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory-specific hover/animation styles */}
      <style>{`
        .inv-qty-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .inv-action-btn:hover {
          background: #eff6ff !important;
          border-color: #bfdbfe !important;
          color: #2563eb !important;
          transform: scale(1.05);
        }
        .inv-delete-btn:hover {
          background: #fef2f2 !important;
          border-color: #fca5a5 !important;
          color: #dc2626 !important;
          transform: scale(1.05);
        }
        .inv-tab-btn:hover {
          background: var(--primary) !important;
          color: #ffffff !important;
          opacity: 0.85;
        }
        @keyframes lowStockPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </MainLayout>
  );
};
