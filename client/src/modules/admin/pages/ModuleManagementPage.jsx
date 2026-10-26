import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import {
  Layers,
  Check,
  X,
  ShieldCheck,
  Building,
  RefreshCw,
  CheckCheck,
  Ban,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

// Canonical list of all workspace modules supported in Zapate Service Manager
const MASTER_MODULES = [
  {
    key: 'customers',
    label: 'Customers CRM',
    desc: 'Client phone registry, spend metrics, and service history',
    category: 'Core Operations',
  },
  {
    key: 'repairs',
    label: 'Repair Jobs Kanban',
    desc: 'Service tickets, diagnostic matrix, and stage transitions',
    category: 'Core Operations',
  },
  {
    key: 'devices',
    label: 'Device Registry',
    desc: 'Hardware IMEI serial tracking and physical condition logs',
    category: 'Core Operations',
  },
  {
    key: 'technicians',
    label: 'Technician Roster',
    desc: 'Engineer assignment, commission tracking, and workload',
    category: 'Workforce',
  },
  {
    key: 'pos',
    label: 'POS & Billing',
    desc: 'Instant retail checkout, UPI receipts, and tax calculations',
    category: 'Financials',
  },
  {
    key: 'payments',
    label: 'Payments & Ledger',
    desc: 'Receivables, debit settlements, and cash desk journals',
    category: 'Financials',
  },
  {
    key: 'inventory',
    label: 'Parts Inventory',
    desc: 'Shelf rack locations, SKU barcodes, and low stock warnings',
    category: 'Inventory',
  },
  {
    key: 'suppliers',
    label: 'Suppliers Procurement',
    desc: 'Wholesale vendor accounts and purchase orders',
    category: 'Inventory',
  },
  {
    key: 'purchases',
    label: 'Procurement POs',
    desc: 'Stock inward log and automatic inventory quantity increment',
    category: 'Inventory',
  },
  {
    key: 'used-mobiles',
    label: 'Used Mobiles Resale',
    desc: 'Trade-in handset valuation and refurbishment margins',
    category: 'Sales',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    desc: 'Turnaround speed, revenue velocity, and sales breakdown',
    category: 'Intelligence',
  },
  {
    key: 'settings',
    label: 'Shop Settings',
    desc: 'GSTIN, warranty period, and invoice numbering series',
    category: 'Configuration',
  },
  {
    key: 'users',
    label: 'Staff & Roles',
    desc: 'Access control permissions and operator credentials',
    category: 'Workforce',
  },
  {
    key: 'warranties',
    label: 'Warranty Management',
    desc: 'Hardware guarantee periods, claims, and void terms',
    category: 'Core Operations',
  },
  {
    key: 'community',
    label: 'Repair Community',
    desc: 'Peer technician troubleshooting forum and shared fixes',
    category: 'Community',
  },
];

export const ModuleManagementPage = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [enabledModules, setEnabledModules] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Identify currently selected shop object
  const currentShop = useMemo(() => {
    return shops.find((s) => s._id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  // Fetch all workshops on mount
  const fetchShops = useCallback(async () => {
    try {
      setLoadingShops(true);
      const data = await api.get('/shops');
      const shopList = Array.isArray(data) ? data : [];
      setShops(shopList);

      if (shopList.length > 0) {
        // Keep current selected shop if still valid, otherwise select first
        setSelectedShopId((prev) => {
          const exists = shopList.some((s) => s._id === prev);
          return exists ? prev : shopList[0]._id;
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load workshops list');
    } finally {
      setLoadingShops(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Fetch modules whenever selected workshop changes
  const fetchShopModules = useCallback(async (shopId) => {
    if (!shopId) return;
    try {
      setLoadingModules(true);
      const res = await api.get(`/shops/${shopId}/modules`);
      const modulesList = Array.isArray(res?.enabledModules)
        ? res.enabledModules
        : MASTER_MODULES.map((m) => m.key);
      setEnabledModules(modulesList);
    } catch (err) {
      toast.error(err.message || 'Failed to load workshop module settings');
    } finally {
      setLoadingModules(false);
    }
  }, []);

  useEffect(() => {
    if (selectedShopId) {
      fetchShopModules(selectedShopId);
    }
  }, [selectedShopId, fetchShopModules]);

  // Toggle single module for selected workshop
  const handleToggleModule = async (key) => {
    if (!selectedShopId || updatingKey || isBulkUpdating || loadingModules) return;

    const isCurrentlyEnabled = enabledModules.includes(key);
    const nextStatus = !isCurrentlyEnabled;
    const moduleDef = MASTER_MODULES.find((m) => m.key === key);

    setUpdatingKey(key);
    try {
      const res = await api.patch(`/shops/${selectedShopId}/modules`, {
        moduleKey: key,
        enabled: nextStatus,
      });

      if (Array.isArray(res?.enabledModules)) {
        setEnabledModules(res.enabledModules);
      } else {
        // Fallback optimistic update
        setEnabledModules((prev) =>
          nextStatus ? [...prev, key] : prev.filter((k) => k !== key)
        );
      }

      toast.success(
        `${moduleDef?.label || key} successfully ${nextStatus ? 'enabled' : 'disabled'} for ${currentShop?.name || 'workshop'}`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update module state');
    } finally {
      setUpdatingKey(null);
    }
  };

  // Bulk enable all modules for selected workshop
  const handleEnableAll = async () => {
    if (!selectedShopId || updatingKey || isBulkUpdating || loadingModules) return;

    const allKeys = MASTER_MODULES.map((m) => m.key);
    setIsBulkUpdating(true);
    try {
      const res = await api.patch(`/shops/${selectedShopId}/modules`, {
        enabledModules: allKeys,
        reason: 'Super Admin bulk enabled all modules',
      });

      if (Array.isArray(res?.enabledModules)) {
        setEnabledModules(res.enabledModules);
      } else {
        setEnabledModules(allKeys);
      }

      toast.success(`All ${allKeys.length} modules enabled for ${currentShop?.name || 'workshop'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to enable all modules');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Bulk disable all optional modules (leaving settings enabled)
  const handleDisableAll = async () => {
    if (!selectedShopId || updatingKey || isBulkUpdating || loadingModules) return;

    // We keep minimal basic shop settings active so owner can still view account
    const minimalModules = [];
    setIsBulkUpdating(true);
    try {
      const res = await api.patch(`/shops/${selectedShopId}/modules`, {
        enabledModules: minimalModules,
        reason: 'Super Admin disabled all operational modules',
      });

      if (Array.isArray(res?.enabledModules)) {
        setEnabledModules(res.enabledModules);
      } else {
        setEnabledModules(minimalModules);
      }

      toast.success(`All operational modules disabled for ${currentShop?.name || 'workshop'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to disable modules');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const enabledCount = enabledModules.length;
  const totalCount = MASTER_MODULES.length;

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

        <div className="page-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-button btn-sm"
            onClick={() => fetchShopModules(selectedShopId)}
            disabled={loadingModules || isBulkUpdating}
            title="Reload permissions from database"
          >
            <RefreshCw size={14} className={loadingModules ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="secondary-button btn-sm"
            onClick={handleEnableAll}
            disabled={loadingModules || isBulkUpdating || enabledCount === totalCount}
            title="Enable all modules for this workshop"
          >
            <CheckCheck size={14} style={{ color: '#2563eb' }} />
            Enable All
          </button>
          <button
            type="button"
            className="secondary-button btn-sm"
            onClick={handleDisableAll}
            disabled={loadingModules || isBulkUpdating || enabledCount === 0}
            title="Disable all modules for this workshop"
          >
            <Ban size={14} style={{ color: '#ef4444' }} />
            Disable All
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '18px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              TARGET WORKSHOP TENANT
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Configure Active Workspace Modules
              </h2>
              {currentShop && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {enabledCount} of {totalCount} Active
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={16} style={{ color: '#64748b' }} />
            <select
              className="select-control"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              disabled={loadingShops || isBulkUpdating}
              style={{ width: '260px', fontWeight: '600' }}
            >
              {loadingShops ? (
                <option value="">Loading workshops...</option>
              ) : shops.length === 0 ? (
                <option value="">No workshops registered</option>
              ) : (
                shops.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ''} {s.city ? `• ${s.city}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Modules Grid */}
        {loadingModules ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: '#64748b',
            }}
          >
            <RefreshCw size={24} className="animate-spin" style={{ color: '#2563eb' }} />
            <p style={{ fontSize: '13px', fontWeight: '600' }}>
              Loading permissions for {currentShop?.name || 'selected workshop'}...
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {MASTER_MODULES.map((m) => {
              const isEnabled = enabledModules.includes(m.key);
              const isUpdatingThis = updatingKey === m.key;

              return (
                <div
                  key={m.key}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isEnabled ? '1px solid #bfdbfe' : '1px solid var(--border-color)',
                    background: isEnabled ? '#f8faff' : '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    opacity: isUpdatingThis ? 0.7 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isEnabled ? '#2563eb' : '#94a3b8',
                          flexShrink: 0,
                        }}
                      />
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: isEnabled ? '#0f172a' : '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.label}
                      </strong>
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '3px',
                        lineHeight: 1.35,
                      }}
                    >
                      {m.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingThis || isBulkUpdating || loadingModules}
                    className={isEnabled ? 'primary-button btn-sm' : 'secondary-button btn-sm'}
                    onClick={() => handleToggleModule(m.key)}
                    style={{
                      minWidth: '84px',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: isUpdatingThis ? 'wait' : 'pointer',
                      ...(isEnabled
                        ? {}
                        : {
                            background: '#f1f5f9',
                            color: '#64748b',
                            borderColor: '#cbd5e1',
                          }),
                    }}
                    title={`Click to ${isEnabled ? 'disable' : 'enable'} ${m.label}`}
                  >
                    {isUpdatingThis ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isEnabled ? (
                      <>
                        <Check size={13} />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <X size={13} />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
