import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  Users,
  DollarSign,
  Wrench,
  ArrowRight,
  Inbox,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters.js';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { DependentDeviceSelect } from '../../../components/common/DependentDeviceSelect.jsx';
import { validatePrice } from '../../../utils/validators.js';

export const CustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [customerRepairs, setCustomerRepairs] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerWarranties, setCustomerWarranties] = useState([]);

  // Create Repair Job Modal for Customer
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [newRepairJob, setNewRepairJob] = useState({
    brand: '',
    deviceModel: '',
    imei: '',
    conditionNotes: 'Good / Normal Wear',
    issue: '',
    estimatedAmount: '',
    advancePayment: '0',
    priority: 'Normal',
  });

  const [quickEstimatedPrice, setQuickEstimatedPrice] = useState('');
  const [quickFinalPrice, setQuickFinalPrice] = useState('');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  const loadActiveCustomerData = () => {
    if (!activeCustomer?.name && !activeCustomer?.id && !activeCustomer?.mobile) return;

    api.get('/repairs')
      .then((res) => {
        if (Array.isArray(res)) {
          const filtered = res.filter((r) => {
            const custId = r.customer?.id || r.customerId;
            const custName = r.customerName || (typeof r.customer === 'object' ? r.customer?.name : r.customer);
            const custMobile = r.customerMobile || (typeof r.customer === 'object' ? r.customer?.mobile : r.customerMobile);
            return (
              (custId && String(custId) === String(activeCustomer.id)) ||
              (custMobile && String(custMobile) === String(activeCustomer.mobile)) ||
              (custName && String(custName).toLowerCase().includes(activeCustomer.name.toLowerCase()))
            );
          });
          setCustomerRepairs(filtered);
        } else {
          setCustomerRepairs([]);
        }
      })
      .catch(() => setCustomerRepairs([]));

    api.get('/pos/invoices')
      .then((res) => {
        if (Array.isArray(res)) {
          const filtered = res.filter((inv) => {
            const custMobile = inv.customerMobile;
            const custName = inv.customerName;
            return (
              (custMobile && String(custMobile) === String(activeCustomer.mobile)) ||
              (custName && String(custName).toLowerCase().includes(activeCustomer.name.toLowerCase()))
            );
          });
          setCustomerInvoices(filtered);
        } else {
          setCustomerInvoices([]);
        }
      })
      .catch(() => setCustomerInvoices([]));

    api.get('/payments/ledger')
      .then((res) => {
        if (Array.isArray(res)) {
          const filtered = res.filter((t) => {
            const custName = t.customerName || (typeof t.customer === 'object' ? t.customer?.name : t.customer);
            const custMobile = t.customerMobile || (typeof t.customer === 'object' ? t.customer?.mobile : t.customerMobile);
            return (
              (custMobile && String(custMobile) === String(activeCustomer.mobile)) ||
              (custName && String(custName).toLowerCase().includes(activeCustomer.name.toLowerCase()))
            );
          });
          setCustomerPayments(filtered);
        } else {
          setCustomerPayments([]);
        }
      })
      .catch(() => setCustomerPayments([]));

    api.get('/warranties')
      .then((res) => {
        if (Array.isArray(res)) {
          const filtered = res.filter((w) => {
            const custId = w.customerId;
            const custMobile = w.customerMobile;
            const custName = w.customerName;
            return (
              (custId && String(custId) === String(activeCustomer.id)) ||
              (custMobile && String(custMobile) === String(activeCustomer.mobile)) ||
              (custName && String(custName).toLowerCase().includes(activeCustomer.name.toLowerCase()))
            );
          });
          setCustomerWarranties(filtered);
        } else {
          setCustomerWarranties([]);
        }
      })
      .catch(() => setCustomerWarranties([]));
  };

  const handleOpenCreateJob = (c) => {
    const cust = c || activeCustomer;
    if (!cust) return;
    setNewRepairJob({
      brand: cust.deviceBrand || '',
      deviceModel: cust.deviceModel || '',
      imei: '',
      conditionNotes: 'Good / Normal Wear',
      issue: '',
      estimatedAmount: cust.estimatedServicePrice ? String(cust.estimatedServicePrice) : '',
      advancePayment: '0',
      priority: 'Normal',
    });
    setIsCreateJobModalOpen(true);
  };

  const handleCreateRepairJobForCustomer = async (e) => {
    e.preventDefault();
    if (!activeCustomer) return;
    if (!newRepairJob.deviceModel.trim() || !newRepairJob.issue.trim()) {
      toast.error('Device Model and Problem Description are required');
      return;
    }

    const estCheck = validatePrice(newRepairJob.estimatedAmount || 0, 'Estimated Cost');
    if (!estCheck.isValid) {
      toast.error(estCheck.error);
      return;
    }
    const advCheck = validatePrice(newRepairJob.advancePayment || 0, 'Advance Payment');
    if (!advCheck.isValid) {
      toast.error(advCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post('/repairs', {
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        customerMobile: activeCustomer.mobile,
        customerEmail: activeCustomer.email,
        brand: newRepairJob.brand.trim() || 'Universal',
        deviceModel: newRepairJob.deviceModel.trim(),
        imei: newRepairJob.imei.trim(),
        conditionNotes: newRepairJob.conditionNotes,
        issue: newRepairJob.issue.trim(),
        estimatedAmount: estCheck.value,
        advancePayment: advCheck.value,
        priority: newRepairJob.priority,
      });

      toast.success(`Repair Job ${res?.number || 'card'} created for ${activeCustomer.name}!`);
      setIsCreateJobModalOpen(false);
      loadCustomers();
      loadActiveCustomerData();
      setActiveTab('repairs');
    } catch (err) {
      toast.error(err.message || 'Failed to create repair job');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadActiveCustomerData();
  }, [activeCustomer?.id, activeCustomer?.mobile]);


  // Derived pricing fields from latest repair job or customer document
  const latestRepair = customerRepairs.length > 0 ? customerRepairs[0] : null;

  const currentEstVal = latestRepair
    ? (latestRepair.estimatedAmount !== undefined ? latestRepair.estimatedAmount : (latestRepair.estimatedCost || 0))
    : (activeCustomer?.estimatedServicePrice || 0);

  const currentFinalVal = latestRepair
    ? (latestRepair.finalAmount !== undefined ? latestRepair.finalAmount : (latestRepair.totalAmount || 0))
    : (activeCustomer?.finalServicePrice || 0);

  useEffect(() => {
    if (activeCustomer) {
      setQuickEstimatedPrice(currentEstVal > 0 ? String(currentEstVal) : '');
      setQuickFinalPrice(currentFinalVal > 0 ? String(currentFinalVal) : '');
    }
  }, [activeCustomer?.id, currentEstVal, currentFinalVal]);

  const handleQuickUpdatePrices = async (e) => {
    e.preventDefault();
    if (!activeCustomer?.id) return;

    const estCheck = validatePrice(quickEstimatedPrice || 0, 'Estimated Service Price');
    if (!estCheck.isValid) {
      toast.error(estCheck.error);
      return;
    }
    const finalCheck = validatePrice(quickFinalPrice || 0, 'Final Service Price');
    if (!finalCheck.isValid) {
      toast.error(finalCheck.error);
      return;
    }

    setIsUpdatingPrices(true);
    try {
      await api.patch(`/customers/${activeCustomer.id}`, {
        estimatedServicePrice: estCheck.value,
        finalServicePrice: finalCheck.value,
      });
      toast.success(`Service quote prices updated for ${activeCustomer.name}!`);
      loadCustomers();
      loadActiveCustomerData();
    } catch (err) {
      toast.error(err.message || 'Failed to update prices');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const [newCust, setNewCust] = useState({
    name: '',
    mobile: '',
    email: '',
    city: 'Bengaluru',
    address: '',
    notes: '',
    deviceBrand: '',
    deviceModel: '',
    estimatedServicePrice: '',
    finalServicePrice: '',
  });

  const [editCust, setEditCust] = useState({
    id: '',
    name: '',
    mobile: '',
    email: '',
    city: '',
    address: '',
    notes: '',
    deviceBrand: '',
    deviceModel: '',
    estimatedServicePrice: '',
    finalServicePrice: '',
  });

  const loadCustomers = () => {
    setIsLoading(true);
    api.get('/customers')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((c, i) => {
            const finalP = Number(c.finalServicePrice || 0);
            const estP = Number(c.estimatedServicePrice || 0);
            const spent = Number(c.totalSpent) > 0 ? Number(c.totalSpent) : (finalP > 0 ? finalP : estP);
            return {
              id: c._id || c.id || `CUST-0${i + 1}`,
              name: c.name || 'Client',
              mobile: c.mobile || '',
              email: c.email || '',
              city: c.city || 'Bengaluru',
              address: c.address || '',
              notes: c.notes || '',
              deviceBrand: c.deviceBrand || '',
              deviceModel: c.deviceModel || '',
              estimatedServicePrice: estP,
              finalServicePrice: finalP,
              avatarColor: i % 2 === 0 ? 'orange' : 'blue',
              totalSpent: spent,
              totalRepairs: c.totalRepairs || 0,
              pendingDue: c.pendingDue || 0,
              latestRepairDate: c.latestRepairDate || c.updatedAt || c.createdAt || null,
              latestJobNumber: c.latestJobNumber || null,
              customerStatus: c.customerStatus || (c.totalRepairs > 1 ? 'Repeat Customer' : c.totalRepairs === 1 ? 'Active Client' : 'New Customer'),
            };
          });
          setCustomers(mapped);
          if (mapped.length > 0) {
            setActiveCustomer((prev) => {
              if (prev) {
                const found = mapped.find((m) => m.id === prev.id);
                return found || mapped[0];
              }
              return mapped[0];
            });
          } else {
            setActiveCustomer(null);
          }
        } else {
          setCustomers([]);
          setActiveCustomer(null);
        }
      })
      .catch(() => {
        setCustomers([]);
        setActiveCustomer(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.mobile.trim()) {
      toast.error('Name and Mobile Number are required');
      return;
    }

    const estCheck = validatePrice(newCust.estimatedServicePrice || 0, 'Estimated Service Price');
    if (!estCheck.isValid) {
      toast.error(estCheck.error);
      return;
    }
    const finalCheck = validatePrice(newCust.finalServicePrice || 0, 'Final Service Price');
    if (!finalCheck.isValid) {
      toast.error(finalCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/customers', {
        name: newCust.name.trim(),
        mobile: newCust.mobile.trim(),
        email: newCust.email.trim(),
        city: newCust.city.trim(),
        address: newCust.address.trim(),
        notes: newCust.notes.trim(),
        deviceBrand: newCust.deviceBrand.trim(),
        deviceModel: newCust.deviceModel.trim(),
        estimatedServicePrice: estCheck.value,
        finalServicePrice: finalCheck.value,
      });
      toast.success(`Customer "${newCust.name}" added successfully!`);
      setIsAddModalOpen(false);
      setNewCust({
        name: '',
        mobile: '',
        email: '',
        city: 'Bengaluru',
        address: '',
        notes: '',
        deviceBrand: '',
        deviceModel: '',
        estimatedServicePrice: '',
        finalServicePrice: '',
      });
      loadCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (c, e) => {
    if (e) e.stopPropagation();
    setEditCust({
      id: c.id,
      name: c.name || '',
      mobile: c.mobile || '',
      email: c.email || '',
      city: c.city || 'Bengaluru',
      address: c.address || '',
      notes: c.notes || '',
      deviceBrand: c.deviceBrand || '',
      deviceModel: c.deviceModel || '',
      estimatedServicePrice: c.estimatedServicePrice || '',
      finalServicePrice: c.finalServicePrice || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editCust.name.trim() || !editCust.mobile.trim()) {
      toast.error('Name and Mobile Number are required');
      return;
    }

    const estCheck = validatePrice(editCust.estimatedServicePrice || 0, 'Estimated Service Price');
    if (!estCheck.isValid) {
      toast.error(estCheck.error);
      return;
    }
    const finalCheck = validatePrice(editCust.finalServicePrice || 0, 'Final Service Price');
    if (!finalCheck.isValid) {
      toast.error(finalCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/customers/${editCust.id}`, {
        name: editCust.name.trim(),
        mobile: editCust.mobile.trim(),
        email: editCust.email.trim(),
        city: editCust.city.trim(),
        address: editCust.address.trim(),
        notes: editCust.notes.trim(),
        deviceBrand: editCust.deviceBrand.trim(),
        deviceModel: editCust.deviceModel.trim(),
        estimatedServicePrice: estCheck.value,
        finalServicePrice: finalCheck.value,
      });
      toast.success(`Customer "${editCust.name}" updated successfully!`);
      setIsEditModalOpen(false);
      loadCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${customerToDelete.id}`);
      toast.success(`Customer "${customerToDelete.name}" removed!`);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.mobile || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout title="Customer Management" subtitle="CRM & Client Profiles">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> CLIENT DIRECTORY
          </div>
          <h1>Customer Relationships</h1>
          <p>Client profiles, service history logs, and receivables balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeCustomer && (
            <button
              className="btn btn-primary"
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
              onClick={() => handleOpenCreateJob(activeCustomer)}
            >
              <Plus size={16} /> Create New Repair Job
            </button>
          )}
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <Users size={22} />,
            label: 'Total Customers',
            value: customers.length,
            color: 'blue',
            accent: true,
            sub: 'Client profiles',
          },
          {
            icon: <Wrench size={22} />,
            label: 'Total Service Jobs',
            value: customers.reduce((s, c) => s + (Number(c.totalRepairs) || 0), 0),
            color: 'purple',
            accent: true,
            sub: 'Historical repair tickets',
          },
          {
            icon: <CheckCircle size={22} />,
            label: 'Repeat Clients',
            value: customers.filter((c) => (c.totalRepairs || 0) > 1 || c.customerStatus === 'Repeat Customer').length,
            color: 'emerald',
            accent: true,
            delta: 'Loyalty',
            deltaColor: '#059669',
            sub: 'Multi-ticket customers',
          },
          {
            icon: <DollarSign size={22} />,
            label: 'Pending Receivables',
            value: formatCurrency(customers.reduce((s, c) => s + (Number(c.pendingDue) || 0), 0)),
            color: 'orange',
            accent: true,
            valueColor: customers.some((c) => (Number(c.pendingDue) || 0) > 0) ? '#ea580c' : undefined,
            sub: 'Uncollected client dues',
          },
        ]}
      />

      {customers.length === 0 && !isLoading ? (
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
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No customers yet
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Add your first customer to start managing customer records and tracking repair tickets.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: activeCustomer ? '1.2fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Customer Directory Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="input-wrapper" style={{ width: '100%' }}>
                <span className="input-icon">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  className="input-control input-with-icon"
                  placeholder="Search customers by name, mobile, email, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Mobile / Email</th>
                    <th>Total Jobs</th>
                    <th>Latest Repair</th>
                    <th>Outstanding Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        {isLoading ? 'Loading customers...' : 'No customers match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = activeCustomer?.id === c.id;
                      const statusBadge = c.customerStatus === 'Repeat Customer' ? 'badge-purple' : c.customerStatus === 'Active Client' ? 'badge-blue' : 'badge-amber';
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setActiveCustomer(c)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#eff6ff' : undefined,
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#2563eb',
                                  color: '#fff',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {(c.name || 'C').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{c.name}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{c.city || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                              <Phone size={11} style={{ color: '#64748b', flexShrink: 0 }} />
                              {c.mobile || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              <Mail size={10} style={{ flexShrink: 0 }} />
                              {c.email || '—'}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                fontWeight: '700',
                                fontSize: '12px',
                                borderRadius: '999px',
                                padding: '2px 10px',
                              }}
                            >
                              <Wrench size={10} />
                              {c.totalRepairs || 0} {c.totalRepairs === 1 ? 'Job' : 'Jobs'}
                            </span>
                          </td>
                          <td>
                            {c.latestRepairDate ? (
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                                  {new Date(c.latestRepairDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                {c.latestJobNumber && (
                                  <div style={{ fontSize: '10.5px', color: '#2563eb', fontFamily: 'monospace', fontWeight: '700' }}>
                                    {c.latestJobNumber}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No jobs yet</span>
                            )}
                          </td>
                          <td>
                            {c.pendingDue > 0 ? (
                              <span className="status-badge badge-amber" style={{ fontSize: '11.5px', fontWeight: '700' }}>
                                ₹{c.pendingDue.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="status-badge badge-green" style={{ fontSize: '11.5px' }}>Settled</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${statusBadge}`} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {c.customerStatus || 'New Customer'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                title="Edit Customer"
                                onClick={(e) => handleOpenEdit(c, e)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                title="Delete Customer"
                                style={{ color: '#ef4444' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomerToDelete(c);
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

          {/* Right Column: Selected Customer Profile Detail */}
          {activeCustomer && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)' }}>
                <div className={`large-avatar ${activeCustomer.avatarColor}`}>
                  {(activeCustomer.name || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{activeCustomer.name}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)' }}
                        onClick={() => handleOpenCreateJob(activeCustomer)}
                      >
                        <Plus size={14} /> Create New Repair Job
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(activeCustomer)}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        onClick={() => setCustomerToDelete(activeCustomer)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {activeCustomer.mobile} {activeCustomer.city ? `• ${activeCustomer.city}` : ''}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs in Detail Card */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'overview' ? '#2563eb' : '#f1f5f9',
                    color: activeTab === 'overview' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('repairs')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'repairs' ? '#2563eb' : '#f1f5f9',
                    color: activeTab === 'repairs' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Repair History
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === 'repairs' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === 'repairs' ? '#ffffff' : '#475569',
                  }}>
                    {customerRepairs.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'payments' ? '#2563eb' : '#f1f5f9',
                    color: activeTab === 'payments' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Payment History
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === 'payments' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === 'payments' ? '#ffffff' : '#475569',
                  }}>
                    {customerPayments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('warranty')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'warranty' ? '#2563eb' : '#f1f5f9',
                    color: activeTab === 'warranty' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Warranty
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === 'warranty' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === 'warranty' ? '#ffffff' : '#475569',
                  }}>
                    {customerWarranties.length}
                  </span>
                </button>
              </div>

              {activeTab === 'overview' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0 12px 0' }}>
                    <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Lifetime Value</span>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
                        {formatCurrency(activeCustomer.totalSpent)}
                      </h3>
                    </div>

                    <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Outstanding Due</span>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: activeCustomer.pendingDue > 0 ? '#ea580c' : '#16a34a', marginTop: '4px' }}>
                        {formatCurrency(activeCustomer.pendingDue)}
                      </h3>
                    </div>
                  </div>

                  {/* Service Quote & Pricing Card (Connected to CRM & Repair Jobs) */}
                  <div style={{ padding: '16px', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} style={{ color: '#2563eb' }} />
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>Service Quote & Pricing</strong>
                      </div>
                      <span className={`status-badge ${latestRepair ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: '11px' }}>
                        {latestRepair ? `Synced from ${latestRepair.number || latestRepair.jobNo}` : 'CRM Saved Quote'}
                      </span>
                    </div>

                    {/* Display Cards for Estimated & Final Prices */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Service Price</span>
                        <div style={{ marginTop: '4px' }}>
                          {currentEstVal > 0 ? (
                            <strong style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>
                              {formatCurrency(currentEstVal)}
                            </strong>
                          ) : (
                            <span className="status-badge badge-amber" style={{ fontSize: '12px', fontStyle: 'normal' }}>
                              Not quoted yet
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Final Service Price</span>
                        <div style={{ marginTop: '4px' }}>
                          {currentFinalVal > 0 ? (
                            <strong style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                              {formatCurrency(currentFinalVal)}
                            </strong>
                          ) : (
                            <span className="status-badge badge-amber" style={{ fontSize: '12px', fontStyle: 'normal' }}>
                              Not finalized yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit Pricing Form */}
                    <form onSubmit={handleQuickUpdatePrices} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '8px' }}>
                        Update Quote Prices in CRM / Repair Record:
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '11px' }}>Estimated Service Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input-control"
                            placeholder="Not quoted yet"
                            value={quickEstimatedPrice}
                            onChange={(e) => setQuickEstimatedPrice(e.target.value)}
                            disabled={isUpdatingPrices}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '11px' }}>Final Service Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input-control"
                            placeholder="Not finalized yet"
                            value={quickFinalPrice}
                            onChange={(e) => setQuickFinalPrice(e.target.value)}
                            disabled={isUpdatingPrices}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={isUpdatingPrices}
                        >
                          {isUpdatingPrices ? 'Saving...' : 'Update & Sync Prices'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Service Quote History Section */}
                  <div style={{ padding: '16px', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <History size={15} style={{ color: '#2563eb' }} /> Service Quote History
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{customerRepairs.length} records</span>
                    </div>

                    {customerRepairs.length === 0 ? (
                      <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        No service quote history recorded yet for this client.
                      </div>
                    ) : (
                      <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        <table className="pro-table" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Ticket / Service</th>
                              <th>Estimated</th>
                              <th>Final</th>
                              <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerRepairs.map((r) => {
                              const rEst = r.estimatedAmount !== undefined ? r.estimatedAmount : r.estimatedCost;
                              const rFinal = r.finalAmount !== undefined ? r.finalAmount : r.totalAmount;
                              return (
                                <tr key={r._id || r.number || r.jobNo}>
                                  <td>{new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB')}</td>
                                  <td>
                                    <strong style={{ color: '#2563eb' }}>{r.number || r.jobNo}</strong>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                      {r.deviceModel || (typeof r.device === 'object' ? `${r.device?.brand || ''} ${r.device?.model || ''}`.trim() : r.device) || 'Device'} • {r.problemDescription || r.issue}
                                    </div>
                                  </td>
                                  <td>
                                    {rEst > 0 ? (
                                      <strong style={{ color: '#0f172a' }}>{formatCurrency(rEst)}</strong>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Not quoted yet</span>
                                    )}
                                  </td>
                                  <td>
                                    {rFinal > 0 ? (
                                      <strong style={{ color: '#059669' }}>{formatCurrency(rFinal)}</strong>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Not finalized yet</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className="status-badge badge-blue">{r.status || 'Received'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                    <strong style={{ color: '#1e40af', fontSize: '13px' }}>Client Summary</strong>
                    <p style={{ color: '#1e3a8a', fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>
                      Customer has logged {activeCustomer.totalRepairs || customerRepairs.length} repair jobs with this workshop.
                      {activeCustomer.pendingDue > 0 ? ' Pending receivables balance requires settlement.' : ' Account in good standing.'}
                    </p>
                    {activeCustomer.notes && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#3b82f6', fontStyle: 'italic' }}>
                        Note: {activeCustomer.notes}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'repairs' && (
                <div style={{ marginTop: '16px' }}>
                  {customerRepairs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      <Wrench size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>No repair jobs found for this customer yet.</p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '12px' }}
                        onClick={() => handleOpenCreateJob(activeCustomer)}
                      >
                        <Plus size={14} /> Create First Repair Job
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {customerRepairs.map((r) => {
                        const rStatus = r.status || 'Device Received';
                        const isDelivered = rStatus.toLowerCase().includes('delivered');
                        const isInRepair = rStatus.toLowerCase().includes('progress') || rStatus.toLowerCase().includes('repair');
                        const isReady = rStatus.toLowerCase().includes('ready') || rStatus.toLowerCase().includes('complete');
                        const badgeClass = isDelivered ? 'badge-green' : isReady ? 'badge-blue' : isInRepair ? 'badge-purple' : 'badge-amber';
                        const rPrice = r.finalAmount || r.totalAmount || r.estimatedAmount || r.estimatedCost || 0;
                        const rAdv = r.advancePayment || 0;
                        const rPending = r.pendingAmount || Math.max(0, rPrice - rAdv);

                        return (
                          <div key={r._id || r.number} style={{ padding: '14px 16px', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ color: '#2563eb', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                  {r.number || r.jobNo}
                                </strong>
                                <span className={`status-badge ${badgeClass}`} style={{ fontSize: '11px' }}>
                                  {rStatus}
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                                {formatCurrency(rPrice)}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', fontSize: '12px', color: '#334155' }}>
                              <div>
                                <span style={{ color: '#64748b' }}>Device: </span>
                                <strong>{r.deviceModel || (typeof r.device === 'object' ? `${r.device?.brand || ''} ${r.device?.model || ''}`.trim() : r.device) || 'Device'}</strong>
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748b' }}>
                                {new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB')}
                              </div>
                            </div>

                            <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ color: '#64748b' }}>Problem: </span>
                              <span>{r.problemDescription || r.issue || 'Diagnostic inspection'}</span>
                            </div>

                            {rAdv > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', paddingTop: '4px' }}>
                                <span>Paid Adv: {formatCurrency(rAdv)}</span>
                                {rPending > 0 && <span style={{ color: '#ea580c', fontWeight: '600' }}>Balance Due: {formatCurrency(rPending)}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div style={{ marginTop: '16px' }}>
                  {customerPayments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      <CreditCard size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>No payments recorded yet for this customer.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customerPayments.map((t) => (
                        <div key={t._id || t.transactionNumber} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '13px' }}>{t.transactionNumber || t.id}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {t.paymentMethod || t.type} • {t.notes || 'Settlement'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                            +{formatCurrency(t.amount || t.credit || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'warranty' && (
                <div style={{ marginTop: '16px' }}>
                  {customerWarranties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      <ShieldCheck size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>No warranty records found for this customer yet.</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        Warranties are automatically generated when repair jobs are fully paid and delivered.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {customerWarranties.map((w) => {
                        const isVoid = w.status === 'VOID';
                        const isExpired = w.status === 'EXPIRED';
                        const badgeClass = isVoid ? 'badge-rose' : isExpired ? 'badge-slate' : 'badge-green';
                        return (
                          <div key={w._id || w.id} style={{ padding: '14px 16px', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={16} style={{ color: isVoid ? '#ef4444' : isExpired ? '#64748b' : '#10b981' }} />
                                <strong style={{ color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>
                                  Ticket #{w.repairNumber}
                                </strong>
                              </div>
                              <span className={`status-badge ${badgeClass}`} style={{ fontSize: '11px' }}>
                                {w.status || 'ACTIVE'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#334155', marginBottom: '6px' }}>
                              <strong>{w.deviceBrand} {w.deviceModel}</strong> {w.imei ? `• IMEI: ${w.imei}` : ''}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                              <span>Valid: {w.startDate ? new Date(w.startDate).toLocaleDateString('en-GB') : '—'} → {new Date(w.expiryDate).toLocaleDateString('en-GB')}</span>
                              <span>Coverage: {w.serviceWarrantyDays || 30} Days</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
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
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add New Customer</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Vikram Sethi"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className="input-control"
                  placeholder="9845011223"
                  value={newCust.mobile}
                  onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="vikram@gmail.com"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Bengaluru"
                  value={newCust.city}
                  onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Indiranagar 100ft Rd"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              {/* Dependent Device Selection */}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                  Customer Device & Service Quote (Optional)
                </h4>
                <DependentDeviceSelect
                  selectedBrand={newCust.deviceBrand}
                  selectedModel={newCust.deviceModel}
                  onBrandChange={(brand) => setNewCust((prev) => ({ ...prev, deviceBrand: brand }))}
                  onModelChange={(model) => setNewCust((prev) => ({ ...prev, deviceModel: model }))}
                  required={false}
                  disabled={isSaving}
                  brandLabel="Company / Brand"
                  modelLabel="Device Model"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Estimated Service Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-control"
                      placeholder="e.g. 1500"
                      value={newCust.estimatedServicePrice}
                      onChange={(e) => setNewCust({ ...newCust, estimatedServicePrice: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Final Service Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-control"
                      placeholder="e.g. 1800"
                      value={newCust.finalServicePrice}
                      onChange={(e) => setNewCust({ ...newCust, finalServicePrice: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Client'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
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
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Customer Details</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="input-control"
                  value={editCust.name}
                  onChange={(e) => setEditCust({ ...editCust, name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className="input-control"
                  value={editCust.mobile}
                  onChange={(e) => setEditCust({ ...editCust, mobile: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  value={editCust.email}
                  onChange={(e) => setEditCust({ ...editCust, email: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="input-control"
                  value={editCust.city}
                  onChange={(e) => setEditCust({ ...editCust, city: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="input-control"
                  value={editCust.address}
                  onChange={(e) => setEditCust({ ...editCust, address: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              {/* Dependent Device Selection */}
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                  Customer Device & Service Quote
                </h4>
                <DependentDeviceSelect
                  selectedBrand={editCust.deviceBrand}
                  selectedModel={editCust.deviceModel}
                  onBrandChange={(brand) => setEditCust((prev) => ({ ...prev, deviceBrand: brand }))}
                  onModelChange={(model) => setEditCust((prev) => ({ ...prev, deviceModel: model }))}
                  required={false}
                  disabled={isSaving}
                  brandLabel="Company / Brand"
                  modelLabel="Device Model"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Estimated Service Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-control"
                      value={editCust.estimatedServicePrice}
                      onChange={(e) => setEditCust({ ...editCust, estimatedServicePrice: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Final Service Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-control"
                      value={editCust.finalServicePrice}
                      onChange={(e) => setEditCust({ ...editCust, finalServicePrice: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Client'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
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
              Delete Customer?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{customerToDelete.name}</strong> from your customer database?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* CREATE REPAIR JOB MODAL (Repeat Customer CRM Intake)           */}
      {/* ============================================================ */}
      {isCreateJobModalOpen && activeCustomer && (
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
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '26px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Create New Repair Job
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Registering a new service visit under this customer profile
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCreateJobModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRepairJobForCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Linked Customer Profile (Pre-filled & Locked) */}
              <div style={{ padding: '14px 16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#1e40af' }}>Linked Customer Profile</strong>
                  </div>
                  <span className="status-badge badge-blue" style={{ fontSize: '11px' }}>
                    ✓ Locked & Linked
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Customer Name</span>
                    <strong style={{ color: '#0f172a' }}>{activeCustomer.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Mobile Number</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{activeCustomer.mobile}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Repair History</span>
                    <strong style={{ color: '#2563eb' }}>{customerRepairs.length} Previous Jobs</strong>
                  </div>
                </div>
              </div>

              {/* Hardware Device Specifications */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Smartphone size={15} style={{ color: '#2563eb' }} />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Device & Hardware Details</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Device Brand *</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Vivo, Samsung, Apple"
                      value={newRepairJob.brand}
                      onChange={(e) => setNewRepairJob({ ...newRepairJob, brand: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Device Model *</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Vivo Y73, Samsung A54"
                      value={newRepairJob.deviceModel}
                      onChange={(e) => setNewRepairJob({ ...newRepairJob, deviceModel: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IMEI / Serial Number</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Optional IMEI or Serial #"
                      value={newRepairJob.imei}
                      onChange={(e) => setNewRepairJob({ ...newRepairJob, imei: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Device Condition</label>
                    <select
                      className="input-control"
                      value={newRepairJob.conditionNotes}
                      onChange={(e) => setNewRepairJob({ ...newRepairJob, conditionNotes: e.target.value })}
                      disabled={isSaving}
                    >
                      <option value="Good / Normal Wear">Good / Normal Wear</option>
                      <option value="Minor Scratches">Minor Scratches</option>
                      <option value="Screen Cracked / Broken">Screen Cracked / Broken</option>
                      <option value="Back Glass Broken">Back Glass Broken</option>
                      <option value="Liquid / Water Damage">Liquid / Water Damage</option>
                      <option value="Dead / No Power">Dead / No Power</option>
                      <option value="Heavily Damaged">Heavily Damaged</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Problem / Fault Description *</label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="e.g. Broken Display, Battery Draining, Touch not responding..."
                  value={newRepairJob.issue}
                  onChange={(e) => setNewRepairJob({ ...newRepairJob, issue: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Financials & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Estimated Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-control"
                    placeholder="1500"
                    value={newRepairJob.estimatedAmount}
                    onChange={(e) => setNewRepairJob({ ...newRepairJob, estimatedAmount: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Advance Payment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-control"
                    placeholder="0"
                    value={newRepairJob.advancePayment}
                    onChange={(e) => setNewRepairJob({ ...newRepairJob, advancePayment: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="input-control"
                    value={newRepairJob.priority}
                    onChange={(e) => setNewRepairJob({ ...newRepairJob, priority: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateJobModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> {isSaving ? 'Registering Job...' : 'Create Repair Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};


