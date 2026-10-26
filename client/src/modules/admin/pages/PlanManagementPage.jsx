import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import {
  Zap,
  Check,
  Shield,
  Users,
  Wrench,
  Edit3,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Archive,
  Power,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { PlanFormModal } from '../components/PlanFormModal.jsx';

export const PlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/admin/plans');
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedPlanForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setSelectedPlanForEdit(plan);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (plan, e) => {
    e.stopPropagation();
    const nextActive = !plan.active;
    try {
      await api.patch(`/admin/plans/${plan._id}`, { active: nextActive });
      toast.success(`Plan "${plan.name}" is now ${nextActive ? 'Active' : 'Deactivated'}`);
      setPlans((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, active: nextActive } : p))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update plan status');
    }
  };

  const handleArchive = async (plan, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to safely archive plan "${plan.name}"? Existing subscribed workshops will remain active, but new workshops will not be able to select this tier.`
      )
    ) {
      return;
    }
    try {
      await api.post(`/admin/plans/${plan._id}/archive`);
      toast.success(`Plan "${plan.name}" has been safely archived.`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to archive plan');
    }
  };

  const handleUnarchive = async (plan, e) => {
    e.stopPropagation();
    if (!window.confirm(`Restore plan "${plan.name}" from archive?`)) {
      return;
    }
    try {
      await api.post(`/admin/plans/${plan._id}/unarchive`);
      toast.success(`Plan "${plan.name}" restored from archive.`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to restore plan');
    }
  };

  const handleTogglePopular = async (plan, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/admin/plans/${plan._id}`, { isPopular: true });
      toast.success(`Plan "${plan.name}" set as Most Popular tier`);
      setPlans((prev) =>
        prev.map((p) => ({
          ...p,
          isPopular: p._id === plan._id,
        }))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to set featured plan');
    }
  };

  const formatLimit = (val) => {
    if (val === -1 || val === null || val === undefined || val === 'Unlimited') {
      return 'Unlimited';
    }
    return val;
  };

  const filteredPlans = plans.filter((p) => {
    if (filterTab === 'ACTIVE') return p.active && !p.isArchived;
    if (filterTab === 'ARCHIVED') return Boolean(p.isArchived);
    if (filterTab === 'INACTIVE') return !p.active && !p.isArchived;
    return true;
  });

  return (
    <AdminLayout title="Subscription Plans" subtitle="SaaS Pricing Matrix">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> SUBSCRIPTION MATRIX
          </div>
          <h1>SaaS Subscription Tiers</h1>
          <p>Configure user allocations, technician capacity limits, and pricing tiers across tenants.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchPlans}
            disabled={isLoading}
            title="Refresh plan list from database"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} /> Create Plan
          </button>
        </div>
      </div>

      {/* Plan Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Plans', count: plans.length },
          { key: 'ACTIVE', label: 'Active Tiers', count: plans.filter((p) => p.active && !p.isArchived).length },
          { key: 'ARCHIVED', label: 'Archived Tiers', count: plans.filter((p) => p.isArchived).length },
          { key: 'INACTIVE', label: 'Inactive Tiers', count: plans.filter((p) => !p.active && !p.isArchived).length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key)}
            className={`btn btn-sm ${filterTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: filterTab === tab.key ? '700' : '500',
              borderRadius: '6px',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card"
              style={{
                height: '420px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                opacity: 0.6,
              }}
            >
              <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Loading subscription plans...</span>
            </div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            maxWidth: '540px',
            margin: '40px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {plans.length === 0 ? 'No Subscription Plans Found' : `No ${filterTab.toLowerCase()} plans found`}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {plans.length === 0
              ? 'Your database currently has no active subscription plans configured. Create your first subscription tier to define pricing, staff limits, and technician seats for workshops.'
              : `There are currently no subscription plans matching the "${filterTab}" filter.`}
          </p>
          {plans.length === 0 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
              style={{ marginTop: '8px' }}
            >
              <Plus size={16} /> Create First Subscription Plan
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFilterTab('ALL')}
              style={{ marginTop: '8px' }}
            >
              View All Plans
            </button>
          )}
        </div>
      ) : (
        /* Dynamic Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredPlans.map((p) => {
            const isPopular = Boolean(p.isPopular);
            const isArchived = Boolean(p.isArchived);
            const activeTenantCount = p.activeTenantCount || 0;
            const staffLimit = formatLimit(p.limitUsers ?? p.maxUsers);
            const techLimit = formatLimit(p.limitTechs ?? p.maxTechnicians);
            const ticketLimit = formatLimit(p.repairTicketLimit);

            return (
              <div
                key={p._id || p.name}
                className="card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isPopular ? '2px solid #2563eb' : isArchived ? '1px dashed #cbd5e1' : '1px solid var(--border-color)',
                  boxShadow: isPopular ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : 'none',
                  opacity: isArchived ? 0.8 : p.active === false ? 0.75 : 1,
                  backgroundColor: isArchived ? '#f8fafc' : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Most Popular Badge */}
                {isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#2563eb',
                      color: '#fff',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Top Badges & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="status-badge badge-blue">
                      {activeTenantCount} Active {activeTenantCount === 1 ? 'Tenant' : 'Tenants'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isArchived ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '700',
                          }}
                        >
                          <Archive size={11} /> Archived
                        </span>
                      ) : !p.active ? (
                        <span className="status-badge badge-gray" style={{ fontSize: '10px' }}>
                          Inactive
                        </span>
                      ) : null}

                      {!isPopular && !isArchived && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePopular(p, e)}
                          title="Feature as Most Popular tier"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Sparkles size={11} style={{ color: '#2563eb' }} />
                          <span>Feature</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plan Name & Tagline */}
                  <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: '#0f172a' }}>
                    {p.name}
                  </h2>
                  {p.badge && (
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                      {p.badge}
                    </div>
                  )}

                  {/* Price Row */}
                  <div style={{ fontSize: '26px', fontWeight: '900', color: isArchived ? '#64748b' : '#2563eb', margin: '8px 0 2px' }}>
                    ₹{Number(p.price || 0).toLocaleString('en-IN')} / mo
                  </div>
                  {p.yearlyPrice > 0 && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      ₹{Number(p.yearlyPrice).toLocaleString('en-IN')}/mo billed annually
                    </div>
                  )}
                  {(!p.yearlyPrice || p.yearlyPrice <= 0) && (
                    <div style={{ height: '8px' }} />
                  )}

                  {/* Limits Matrix Divider */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
                      padding: '12px 0',
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Operator Staff Limit:</span>
                      <strong style={{ color: '#0f172a' }}>{staffLimit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Technician Seats:</span>
                      <strong style={{ color: '#0f172a' }}>{techLimit}</strong>
                    </div>
                    {ticketLimit !== 'Unlimited' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Monthly Repair Tickets:</span>
                        <strong style={{ color: '#0f172a' }}>{ticketLimit}</strong>
                      </div>
                    )}
                    {p.supportLevel && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Support Level:</span>
                        <strong style={{ color: '#0f172a' }}>{p.supportLevel}</strong>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(Array.isArray(p.features) ? p.features : []).map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#475569',
                        }}
                      >
                        <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions: Edit Limits + Archive/Unarchive */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className={isPopular ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleOpenEditModal(p)}
                  >
                    <Edit3 size={14} /> Edit Limits
                  </button>

                  {isArchived ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ color: '#059669', borderColor: '#a7f3d0' }}
                      onClick={(e) => handleUnarchive(p, e)}
                      title="Restore plan from archive"
                    >
                      <Archive size={14} /> Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ color: '#64748b' }}
                      onClick={(e) => handleArchive(p, e)}
                      title="Archive plan safely"
                    >
                      <Archive size={14} /> Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Form Modal (Create & Edit) */}
      <PlanFormModal
        isOpen={isModalOpen}
        plan={selectedPlanForEdit}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlanForEdit(null);
        }}
        onSuccess={() => {
          fetchPlans();
        }}
      />
    </AdminLayout>
  );
};

export default PlanManagementPage;
