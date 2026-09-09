import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { DeviceAccessInput } from '../../../components/common/DeviceAccessInput.jsx';
import { PatternLockGrid } from '../../../components/common/PatternLockGrid.jsx';
import { AiDiagnosticModal } from '../../../components/common/AiDiagnosticModal.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
import {
  Plus,
  Wrench,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Smartphone,
  User,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Inbox,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  FileText,
  Tag,

  Phone,
  Hash,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters.js';
import { toast } from 'sonner';
import api from '../../../services/api.js';
import { DependentDeviceSelect } from '../../../components/common/DependentDeviceSelect.jsx';
import { validatePrice } from '../../../utils/validators.js';
import { InvoiceReceiptView } from '../../pos/components/InvoiceReceiptView.jsx';

export const RepairBoardPage = () => {
  const [jobs, setJobs] = useState([]);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewJobModal, setViewJobModal] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Secure credential reveal state
  const [revealedCredential, setRevealedCredential] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showRevealed, setShowRevealed] = useState(false);
  const [isDeletingAccessInfo, setIsDeletingAccessInfo] = useState(false);

  // AI Hardware Diagnostic Modal state
  const [aiModalState, setAiModalState] = useState({
    isOpen: false,
    brand: '',
    model: '',
    symptoms: '',
    repairJobId: null,
    target: 'general', // 'general' | 'createForm' | 'viewJob'
  });

  // Repair Billing Modal state
  const [billingModalJob, setBillingModalJob] = useState(null);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [isBillingSaving, setIsBillingSaving] = useState(false);
  const [billingForm, setBillingForm] = useState({
    serviceCharge: '0',
    additionalCharges: '0',
    discountAmount: '0',
    taxPercent: '0',
    paidAmount: '0',
    paymentMode: 'Cash',
    newStatus: 'Delivered',
  });

  // Existing customer search & linking states
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [newJob, setNewJob] = useState({
    customer: '',
    mobile: '',
    email: '',
    brand: '',
    device: '',
    imei: '',
    color: '',
    issue: '',
    amount: '',
    advancePayment: '0',
    priority: 'Normal',
    lockType: 'No Lock',
    accessAvailable: 'Yes',
    credential: '',
  });

  const [editJob, setEditJob] = useState({
    id: '',
    jobNo: '',
    customer: '',
    mobile: '',
    device: '',
    issue: '',
    status: 'Received',
    amount: '0',
    priority: 'Normal',
    diagnosisNotes: '',
    lockType: 'No Lock',
    accessAvailable: 'Yes',
    credential: '',
    hasCredential: false,
  });

  const columns = [
    { title: 'Intake & Received', key: 'intake', color: '#3b82f6', bg: '#eff6ff', backendStatus: 'Received' },
    { title: 'Diagnosis & Approval', key: 'approval', color: '#f59e0b', bg: '#fffbeb', backendStatus: 'Diagnosis' },
    { title: 'Bench Repair & Parts', key: 'in_progress', color: '#8b5cf6', bg: '#faf5ff', backendStatus: 'In Progress' },
    { title: 'Quality Check & Ready', key: 'ready', color: '#10b981', bg: '#ecfdf5', backendStatus: 'Ready for Pickup' },
  ];

  const mapBackendToStage = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('ready') || s.includes('complete') || s.includes('delivered')) return 'ready';
    if (s.includes('progress') || s.includes('bench') || s.includes('repair')) return 'in_progress';
    if (s.includes('diagnos') || s.includes('approv') || s.includes('quote')) return 'approval';
    return 'intake';
  };

  const loadJobs = () => {
    setIsLoading(true);
    api.get('/repairs')
      .then((res) => {
        if (Array.isArray(res)) {
          const mapped = res.map((r, i) => {
            const stage = mapBackendToStage(r.status);
            return {
              id: r._id || r.id,
              jobNo: r.number || r.ticketId || r.jobNo || `RF-${2400 + i}`,
              customer: r.customerName || (typeof r.customer === 'object' ? r.customer?.name : r.customer) || 'Walk-in Client',
              mobile: r.customerMobile || (typeof r.customer === 'object' ? r.customer?.mobile : r.customerMobile) || '',
              device: r.deviceModel || (typeof r.device === 'object' ? `${r.device?.brand || ''} ${r.device?.model || ''}`.trim() : r.device) || 'Mobile Device',
              brand: typeof r.device === 'object' ? r.device?.brand : '',
              imei: typeof r.device === 'object' ? r.device?.imei : '',
              issue: r.problemDescription || r.issue || 'Hardware service',
              edge: stage === 'ready' ? 'green' : stage === 'in_progress' ? 'orange' : stage === 'approval' ? 'clay' : 'blue',
              stage,
              rawStatus: r.status || 'Received',
              amount: Number(r.estimatedAmount || r.estimatedCost || r.totalAmount || 0),
              advance: Number(r.advancePayment || 0),
              pending: Number(r.pendingAmount || 0),
              priority: r.priority || 'Normal',
              technician: r.technicianName || 'Assigned Tech',
              history: Array.isArray(r.history) ? r.history : [],
              parts: Array.isArray(r.parts) ? r.parts : [],
              deviceAccess: r.deviceAccess || { lockType: 'No Lock', accessAvailable: true, hasCredential: false },
              createdAt: r.createdAt,
            };
          });
          setJobs(mapped);
        } else {
          setJobs([]);
        }
      })
      .catch(() => {
        setJobs([]);
      })
      .finally(() => setIsLoading(false));
  };

  const loadExistingCustomers = () => {
    api.get('/customers')
      .then((res) => {
        if (Array.isArray(res)) setExistingCustomers(res);
      })
      .catch(() => setExistingCustomers([]));
  };

  useEffect(() => {
    loadJobs();
    loadExistingCustomers();

    // Check URL parameters for customer linking (e.g. from Customer Profile)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qCustId = searchParams.get('customerId');
      const qMobile = searchParams.get('mobile');
      const qName = searchParams.get('name');

      if (qCustId || qMobile) {
        api.get('/customers').then((custs) => {
          if (Array.isArray(custs)) {
            const matched = custs.find(
              (c) => (qCustId && (c._id === qCustId || c.id === qCustId)) || (qMobile && c.mobile === qMobile)
            );
            if (matched) {
              setSelectedCustomerId(matched._id || matched.id);
              setNewJob((prev) => ({
                ...prev,
                customer: matched.name || qName || '',
                mobile: matched.mobile || qMobile || '',
                email: matched.email || '',
                brand: matched.deviceBrand || prev.brand,
                device: matched.deviceModel || prev.device,
              }));
              setIsCreateModalOpen(true);
            }
          }
        });
      }
    } catch (e) {}

    const handleAiEvent = (e) => {
      const selections = e.detail;
      if (selections) {
        setNewJob((prev) => ({
          ...prev,
          brand: selections.brand || prev.brand,
          device: selections.model || prev.device,
          issue: selections.faultDescription || (selections.selectedFaultName ? `AI detected: ${selections.selectedFaultName}` : prev.issue),
          diagnosisNotes: selections.diagnosisNotes || prev.diagnosisNotes,
          amount: selections.estimatedAmount > 0 ? String(selections.estimatedAmount) : prev.amount,
        }));
        setIsCreateModalOpen(true);
        toast.success('AI diagnosis pre-filled into Repair Job form!');
      }
    };

    window.addEventListener('openCreateJobWithAi', handleAiEvent);

    const stored = sessionStorage.getItem('pendingAiDiagnosis');
    if (stored) {
      try {
        const selections = JSON.parse(stored);
        sessionStorage.removeItem('pendingAiDiagnosis');
        handleAiEvent({ detail: selections });
      } catch (err) {}
    }

    return () => window.removeEventListener('openCreateJobWithAi', handleAiEvent);
  }, []);

  const moveStage = async (jobId, direction) => {
    const stageOrder = ['intake', 'approval', 'in_progress', 'ready'];
    const currentJob = jobs.find((j) => j.id === jobId);
    if (!currentJob) return;

    const currIdx = stageOrder.indexOf(currentJob.stage);
    const nextIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;
    if (nextIdx < 0 || nextIdx >= stageOrder.length) return;

    const nextStageKey = stageOrder[nextIdx];
    const targetCol = columns.find((c) => c.key === nextStageKey);
    const newBackendStatus = targetCol?.backendStatus || 'In Progress';

    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            stage: nextStageKey,
            edge: nextStageKey === 'ready' ? 'green' : nextStageKey === 'in_progress' ? 'orange' : nextStageKey === 'approval' ? 'clay' : 'blue',
            rawStatus: newBackendStatus,
          };
        }
        return j;
      })
    );

    try {
      await api.patch(`/repairs/${jobId}/status`, { status: newBackendStatus });
      toast.success(`${currentJob.jobNo} moved to ${targetCol?.title}`);
      loadJobs();
    } catch (err) {
      loadJobs();
      toast.error(err.message || 'Failed to update job status');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.customer.trim() || !newJob.device.trim() || !newJob.issue.trim()) {
      toast.error('Customer Name, Device Model, and Issue Description are required');
      return;
    }

    const estCheck = validatePrice(newJob.amount || 0, 'Estimated Cost');
    if (!estCheck.isValid) {
      toast.error(estCheck.error);
      return;
    }
    const advCheck = validatePrice(newJob.advancePayment || 0, 'Advance Payment');
    if (!advCheck.isValid) {
      toast.error(advCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/repairs', {
        customerId: selectedCustomerId || undefined,
        customerName: newJob.customer.trim(),
        customerMobile: newJob.mobile.trim(),
        customerEmail: newJob.email.trim(),
        customerAddress: (newJob.customerAddress || '').trim(),
        brand: newJob.brand.trim(),
        deviceModel: newJob.device.trim(),
        imei: newJob.imei.trim(),
        color: newJob.color.trim(),
        issue: newJob.issue.trim(),
        estimatedAmount: estCheck.value,
        advancePayment: advCheck.value,
        priority: newJob.priority,
        lockType: newJob.lockType,
        accessAvailable: newJob.accessAvailable === 'Yes',
        credential: newJob.credential ? String(newJob.credential).trim() : undefined,
      });

      toast.success('Job Card registered successfully!');
      setIsCreateModalOpen(false);
      setSelectedCustomerId(null);
      setCustomerSearchQuery('');
      setNewJob({
        customer: '',
        mobile: '',
        email: '',
        customerAddress: '',
        brand: '',
        device: '',
        imei: '',
        color: '',
        issue: '',
        amount: '',
        advancePayment: '0',
        priority: 'Normal',
        lockType: 'No Lock',
        accessAvailable: 'Yes',
        credential: '',
      });
      loadJobs();
      loadExistingCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to register job card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (job, e) => {
    if (e) e.stopPropagation();
    setEditJob({
      id: job.id,
      jobNo: job.jobNo,
      customer: job.customer,
      mobile: job.mobile,
      device: job.device,
      issue: job.issue,
      status: job.rawStatus,
      amount: String(job.amount || 0),
      priority: job.priority,
      diagnosisNotes: '',
      lockType: job.deviceAccess?.lockType || 'No Lock',
      accessAvailable: job.deviceAccess?.accessAvailable ? 'Yes' : 'No',
      credential: '',
      hasCredential: Boolean(job.deviceAccess?.hasCredential),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    const amtCheck = validatePrice(editJob.amount || 0, 'Updated Amount');
    if (!amtCheck.isValid) {
      toast.error(amtCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/repairs/${editJob.id}/status`, {
        status: editJob.status,
        finalAmount: amtCheck.value,
        notes: editJob.diagnosisNotes || undefined,
        lockType: editJob.lockType,
        accessAvailable: editJob.accessAvailable === 'Yes',
        credential: editJob.credential ? String(editJob.credential).trim() : undefined,
      });
      toast.success(`Job Card ${editJob.jobNo} updated!`);
      setIsEditModalOpen(false);
      loadJobs();
    } catch (err) {
      toast.error(err.message || 'Failed to update job');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevealCredential = async (jobId) => {
    setIsRevealing(true);
    try {
      const res = await api.get(`/repairs/${jobId}/reveal-credential`);
      if (res && res.credential) {
        setRevealedCredential(res.credential);
        setShowRevealed(true);
        toast.success('Device access credential decrypted and revealed');
      } else {
        toast.info(res?.message || 'No credential stored for this repair job');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reveal access credential');
    } finally {
      setIsRevealing(false);
    }
  };

  const handleDeleteCredential = async (jobId) => {
    setIsDeletingAccessInfo(true);
    try {
      await api.delete(`/repairs/${jobId}/credential`);
      toast.success('Device access information deleted successfully');
      setRevealedCredential(null);
      setShowRevealed(false);
      if (viewJobModal) {
        setViewJobModal((prev) =>
          prev
            ? {
                ...prev,
                deviceAccess: { ...prev.deviceAccess, hasCredential: false },
              }
            : null
        );
      }
      if (isEditModalOpen) {
        setEditJob((prev) => ({ ...prev, hasCredential: false, credential: '' }));
      }
      loadJobs();
    } catch (err) {
      toast.error(err.message || 'Failed to delete access information');
    } finally {
      setIsDeletingAccessInfo(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/repairs/${jobToDelete.id}`);
      toast.success(`Job Card ${jobToDelete.jobNo} deleted!`);
      setJobToDelete(null);
      if (viewJobModal?.id === jobToDelete.id) setViewJobModal(null);
      loadJobs();
    } catch (err) {
      toast.error(err.message || 'Failed to delete repair job');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (j.jobNo || '').toLowerCase().includes(q) ||
      (j.customer || '').toLowerCase().includes(q) ||
      (j.device || '').toLowerCase().includes(q) ||
      (j.issue || '').toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'urgent' && j.priority === 'Urgent') ||
      (activeFilter === 'intake' && j.stage === 'intake') ||
      (activeFilter === 'in_progress' && j.stage === 'in_progress') ||
      (activeFilter === 'ready' && j.stage === 'ready');

    return matchesSearch && matchesFilter;
  });

  // Summary Metrics calculations
  const stats = {
    total: jobs.length,
    intake: jobs.filter((j) => j.stage === 'intake').length,
    inProgress: jobs.filter((j) => j.stage === 'in_progress').length,
    ready: jobs.filter((j) => j.stage === 'ready').length,
    urgent: jobs.filter((j) => j.priority === 'Urgent').length,
  };

  const handleOpenBilling = (job, e) => {
    if (e) e.stopPropagation();
    const est = Number(job.amount || 0);
    const partsSum = (job.parts || []).reduce((acc, p) => acc + (Number(p.totalPrice) || 0), 0);
    const defService = Math.max(0, est - partsSum);
    const adv = Number(job.advance || 0);
    const netDue = Math.max(0, est - adv);

    setBillingForm({
      serviceCharge: String(defService),
      additionalCharges: '0',
      discountAmount: '0',
      taxPercent: '0',
      paidAmount: String(netDue),
      paymentMode: 'Cash',
      newStatus: 'Delivered',
    });
    setBillingModalJob(job);
  };

  const calculateBillingTotals = () => {
    if (!billingModalJob) return { partsTotal: 0, subtotal: 0, taxAmount: 0, total: 0, previousAdvance: 0, netPayable: 0, dueAfterPaid: 0 };
    const partsTotal = (billingModalJob.parts || []).reduce((acc, p) => acc + (Number(p.totalPrice) || 0), 0);
    const service = Number(billingForm.serviceCharge) || 0;
    const additional = Number(billingForm.additionalCharges) || 0;
    const discount = Number(billingForm.discountAmount) || 0;
    const taxPct = Number(billingForm.taxPercent) || 0;

    const subtotal = Math.max(0, service + additional + partsTotal);
    const taxable = Math.max(0, subtotal - discount);
    const taxAmount = (taxable * taxPct) / 100;
    const total = taxable + taxAmount;

    const previousAdvance = Number(billingModalJob.advance) || 0;
    const netPayable = Math.max(0, total - previousAdvance);
    const paidNow = Number(billingForm.paidAmount) || 0;
    const dueAfterPaid = Math.max(0, netPayable - paidNow);

    return { partsTotal, subtotal, taxAmount, total, previousAdvance, netPayable, dueAfterPaid };
  };

  const handleGenerateRepairInvoice = async (e) => {
    e.preventDefault();
    if (!billingModalJob) return;

    const sCheck = validatePrice(billingForm.serviceCharge || 0, 'Service Charge');
    if (!sCheck.isValid) return toast.error(sCheck.error);

    const aCheck = validatePrice(billingForm.additionalCharges || 0, 'Additional Charges');
    if (!aCheck.isValid) return toast.error(aCheck.error);

    const dCheck = validatePrice(billingForm.discountAmount || 0, 'Discount Amount');
    if (!dCheck.isValid) return toast.error(dCheck.error);

    const pCheck = validatePrice(billingForm.paidAmount || 0, 'Paid Amount');
    if (!pCheck.isValid) return toast.error(pCheck.error);

    setIsBillingSaving(true);
    try {
      const payload = {
        serviceCharge: sCheck.value,
        additionalCharges: aCheck.value,
        discountAmount: dCheck.value,
        taxPercent: Number(billingForm.taxPercent || 0),
        paidAmount: pCheck.value,
        paymentMode: billingForm.paymentMode,
        newStatus: billingForm.newStatus,
      };

      const res = await api.post(`/repairs/${billingModalJob.id}/generate-invoice`, payload);
      if (res && res.invoice) {
        toast.success(`Repair Invoice ${res.invoice.number} generated successfully!`);
        setBillingModalJob(null);
        setReceiptInvoice(res.invoice);
        loadJobs();
      } else {
        toast.error('Invoice generation returned invalid response');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate repair invoice');
    } finally {
      setIsBillingSaving(false);
    }
  };

  return (
    <MainLayout title="Repair Workbench" subtitle="Pipeline & Device Worksheets">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> WORKBENCH OPERATIONAL HUB
          </div>
          <h1>Repair Job Cards & Diagnostics</h1>
          <p>Kanban pipeline stages, hardware intake logs, and secure device access control.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setAiModalState({ isOpen: true, brand: '', model: '', symptoms: '', repairJobId: null, target: 'general' })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} style={{ color: '#2563eb' }} /> Ask AI Repair Assistant
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
          >
            <Plus size={16} /> Intake New Repair Job
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <KpiCards
        columns={5}
        items={[
          {
            icon: <Wrench size={22} />,
            label: 'Live Queue',
            value: stats.total,
            color: 'blue',
            accent: true,
            delta: 'Active',
            deltaColor: '#2563eb',
            sub: 'Total work orders',
            onClick: () => setActiveFilter('all'),
          },
          {
            icon: <Clock size={22} />,
            label: 'Intake / Received',
            value: stats.intake,
            color: 'orange',
            accent: true,
            delta: stats.intake > 0 ? 'Pending' : undefined,
            deltaColor: '#ea580c',
            sub: 'Waiting for technician',
            onClick: () => setActiveFilter('intake'),
          },
          {
            icon: <Layers size={22} />,
            label: 'Bench Repair',
            value: stats.inProgress,
            color: 'purple',
            accent: true,
            delta: stats.inProgress > 0 ? 'In Service' : undefined,
            deltaColor: '#7c3aed',
            sub: 'Under active repair',
            onClick: () => setActiveFilter('in_progress'),
          },
          {
            icon: <CheckCircle2 size={22} />,
            label: 'Ready for Pickup',
            value: stats.ready,
            color: 'emerald',
            accent: true,
            delta: stats.ready > 0 ? 'Ready' : undefined,
            deltaColor: '#059669',
            sub: 'Ready for delivery',
            onClick: () => setActiveFilter('ready'),
          },
          {
            icon: <AlertCircle size={22} />,
            label: 'Urgent Priority',
            value: stats.urgent,
            color: 'red',
            accent: true,
            delta: stats.urgent > 0 ? 'Urgent ⚠' : 'None',
            deltaColor: stats.urgent > 0 ? '#dc2626' : '#64748b',
            valueColor: stats.urgent > 0 ? '#dc2626' : undefined,
            sub: stats.urgent > 0 ? 'Immediate action required' : 'No urgent alerts',
            onClick: () => setActiveFilter('urgent'),
          },
        ]}
      />

      {/* Toolbar, Filters & Layout Switcher */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="status-filters">
            <button
              type="button"
              className={activeFilter === 'all' ? 'selected' : ''}
              onClick={() => setActiveFilter('all')}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              type="button"
              className={activeFilter === 'intake' ? 'selected' : ''}
              onClick={() => setActiveFilter('intake')}
            >
              Intake ({stats.intake})
            </button>
            <button
              type="button"
              className={activeFilter === 'in_progress' ? 'selected' : ''}
              onClick={() => setActiveFilter('in_progress')}
            >
              Bench Repair ({stats.inProgress})
            </button>
            <button
              type="button"
              className={activeFilter === 'ready' ? 'selected' : ''}
              onClick={() => setActiveFilter('ready')}
            >
              Ready for Delivery ({stats.ready})
            </button>
            <button
              type="button"
              className={activeFilter === 'urgent' ? 'selected' : ''}
              onClick={() => setActiveFilter('urgent')}
            >
              Urgent ({stats.urgent})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="input-wrapper" style={{ width: '280px' }}>
              <span className="input-icon">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="input-control input-with-icon"
                placeholder="Search ticket #, customer, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>


          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {jobs.length === 0 && !isLoading ? (
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
            <Wrench size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            No repair job cards registered
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Intake customer devices to start tracking diagnostics, parts usage, and repair stages.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} /> Create First Job Card
          </button>
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Device & Model</th>
                  <th>Customer Account</th>
                  <th>Diagnostic Issue</th>
                  <th>Lock Type</th>
                  <th>Est. Amount</th>
                  <th>Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No tickets match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => {
                        setRevealedCredential(null);
                        setShowRevealed(false);
                        setViewJobModal(job);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <strong style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', fontSize: '13px' }}>
                          {job.jobNo}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Smartphone size={15} style={{ color: '#2563eb' }} />
                          <strong style={{ color: '#0f172a' }}>{job.device}</strong>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{job.customer}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{job.mobile || 'No contact'}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#334155' }}>{job.issue}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue" style={{ fontSize: '11px' }}>
                          {job.deviceAccess?.lockType || 'No Lock'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>{formatCurrency(job.amount)}</strong>
                      </td>
                      <td>
                        <span className="status-badge badge-green">{job.rawStatus}</span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="Generate Repair Invoice"
                            style={{ color: '#059669', background: '#ecfdf5' }}
                            onClick={(e) => handleOpenBilling(job, e)}
                          >
                            <DollarSign size={14} />
                          </button>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="View Job Sheet"
                            onClick={() => {
                              setRevealedCredential(null);
                              setShowRevealed(false);
                              setViewJobModal(job);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="Edit Ticket"
                            onClick={(e) => handleOpenEdit(job, e)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            title="Delete Ticket"
                            style={{ color: '#ef4444' }}
                            onClick={() => setJobToDelete(job)}
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

      {/* DUAL-COLUMN JOB SHEET DETAILS MODAL */}
      {viewJobModal && (
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
          <div className="card" style={{ maxWidth: '840px', width: '100%', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Sheet Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', fontFamily: 'JetBrains Mono, monospace' }}>
                    {viewJobModal.jobNo}
                  </h2>
                  <span className="status-badge badge-blue">{viewJobModal.rawStatus}</span>
                  <span
                    className={`status-badge ${
                      viewJobModal.priority === 'Urgent'
                        ? 'badge-rose'
                        : viewJobModal.priority === 'High'
                        ? 'badge-amber'
                        : 'badge-blue'
                    }`}
                  >
                    {viewJobModal.priority} Priority
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Intake Ticket Card • Created: {new Date(viewJobModal.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setViewJobModal(null);
                  setRevealedCredential(null);
                  setShowRevealed(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* Sheet Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* LEFT COLUMN: Customer, Hardware, Issue & Secure Device Access */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Customer Info Card */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <User size={15} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Customer Account Details</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{viewJobModal.customer}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Phone: <strong style={{ color: '#1e293b' }}>{viewJobModal.mobile || 'Walk-in Client'}</strong>
                  </div>
                </div>

                {/* Hardware & Device Card */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Smartphone size={15} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Hardware Specifications</strong>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{viewJobModal.device}</div>
                  {viewJobModal.imei && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      IMEI / Serial: <span style={{ fontFamily: 'JetBrains Mono', color: '#2563eb', fontWeight: '600' }}>{viewJobModal.imei}</span>
                    </div>
                  )}
                </div>

                {/* Diagnostic Issue Card */}
                <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '12px', color: '#1e40af' }}>
                      Diagnostic Issue Reported:
                    </strong>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px', background: '#ffffff', color: '#2563eb', border: '1px solid #93c5fd' }}
                      onClick={() =>
                        setAiModalState({
                          isOpen: true,
                          brand: viewJobModal.brand || '',
                          model: viewJobModal.device || '',
                          symptoms: viewJobModal.issue || '',
                          repairJobId: viewJobModal.id,
                          target: 'viewJob',
                        })
                      }
                    >
                      <Sparkles size={12} /> AI Hardware Fault Triage
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#1e3a8a', margin: 0, lineHeight: 1.4 }}>{viewJobModal.issue}</p>
                </div>

                {/* SECURE DEVICE ACCESS PANEL */}
                <div style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={16} style={{ color: '#2563eb' }} />
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>Device Access Information</strong>
                    </div>
                    {viewJobModal.deviceAccess?.hasCredential && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444', fontSize: '11px', padding: '2px 8px' }}
                        onClick={() => handleDeleteCredential(viewJobModal.id)}
                        disabled={isDeletingAccessInfo}
                      >
                        <Trash2 size={11} /> Delete Access Information
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Lock Type: </span>
                      <strong style={{ color: '#0f172a' }}>{viewJobModal.deviceAccess?.lockType || 'No Lock'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Access Available: </span>
                      <strong style={{ color: viewJobModal.deviceAccess?.accessAvailable !== false ? '#059669' : '#dc2626' }}>
                        {viewJobModal.deviceAccess?.accessAvailable !== false ? 'Yes' : 'No'}
                      </strong>
                    </div>
                  </div>

                  {/* Decrypted Credential Reveal Renderer */}
                  {viewJobModal.deviceAccess?.lockType !== 'No Lock' &&
                    viewJobModal.deviceAccess?.lockType !== 'Customer Will Unlock' &&
                    viewJobModal.deviceAccess?.lockType !== 'Biometric Only' && (
                      <div style={{ paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                        {showRevealed && revealedCredential ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Decrypted Access Credential:</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowRevealed(false)}
                              >
                                <EyeOff size={13} /> Hide
                              </button>
                            </div>
                            {viewJobModal.deviceAccess?.lockType === 'Pattern Lock' ? (
                              <PatternLockGrid value={revealedCredential} isReadOnly={true} />
                            ) : (
                              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', color: '#2563eb' }}>
                                  {revealedCredential}
                                </strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Credential encrypted securely in MongoDB.</span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                if (revealedCredential) {
                                  setShowRevealed(true);
                                } else {
                                  handleRevealCredential(viewJobModal.id);
                                }
                              }}
                              disabled={isRevealing}
                              style={{ gap: '4px' }}
                            >
                              <Eye size={13} /> {isRevealing ? 'Decrypting...' : 'Show Credential'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 10px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7', fontSize: '11px', color: '#92400e' }}>
                    <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '1px', color: '#d97706' }} />
                    <span>Device access information is sensitive and should only be used for authorized repair and testing.</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Financials, Parts Allocation & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Financial Summary Card */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <DollarSign size={16} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Financial Statement</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Estimated Amount:</span>
                      <strong style={{ color: '#0f172a' }}>{formatCurrency(viewJobModal.amount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Advance Payment:</span>
                      <strong style={{ color: '#059669' }}>- {formatCurrency(viewJobModal.advance)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>Pending Balance:</span>
                      <strong style={{ fontSize: '16px', color: viewJobModal.pending > 0 ? '#ea580c' : '#059669' }}>
                        {formatCurrency(viewJobModal.pending)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Spare Parts Log */}
                {viewJobModal.parts && viewJobModal.parts.length > 0 && (
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                      Allocated Spare Parts:
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {viewJobModal.parts.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', padding: '4px 8px', background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          <span>{p.name} (x{p.quantity})</span>
                          <strong style={{ color: '#0f172a' }}>{formatCurrency(p.totalPrice || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestone Timeline Card */}
                {viewJobModal.history && viewJobModal.history.length > 0 && (
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', flex: 1 }}>
                    <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                      Status History Timeline:
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {viewJobModal.history.map((h, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#64748b', padding: '8px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{h.status}</strong>
                          <span>{h.notes || 'Status changed'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sheet Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444' }}
                onClick={() => setJobToDelete(viewJobModal)}
              >
                <Trash2 size={13} /> Delete Job Card
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const j = viewJobModal;
                    setViewJobModal(null);
                    handleOpenBilling(j);
                  }}
                >
                  <DollarSign size={15} /> Complete & Bill Repair
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const j = viewJobModal;
                    setViewJobModal(null);
                    handleOpenEdit(j);
                  }}
                >
                  <Edit2 size={14} /> Edit Ticket
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setViewJobModal(null);
                    setRevealedCredential(null);
                    setShowRevealed(false);
                  }}
                >
                  Close Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUCTURED INTAKE / CREATE REPAIR JOB MODAL */}
      {isCreateModalOpen && (
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
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Intake Device & Job Card</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Register customer unit for workshop diagnostics</span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section 1: Customer Details */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>1. Customer Account & Contact</strong>
                  </div>
                  {selectedCustomerId && (
                    <span className="status-badge badge-green" style={{ fontSize: '11px' }}>
                      ✓ Existing Customer Selected
                    </span>
                  )}
                </div>

                {/* Search existing customer bar */}
                {!selectedCustomerId ? (
                  <div style={{ marginBottom: '12px' }}>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        className="input-control input-with-icon"
                        placeholder="Search existing customer by mobile number, email, or name..."
                        value={customerSearchQuery}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        style={{ fontSize: '12px' }}
                      />
                    </div>

                    {showCustomerDropdown && customerSearchQuery.trim().length > 0 && (
                      <div style={{ position: 'relative', zIndex: 20 }}>
                        <div
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                            maxHeight: '180px',
                            overflowY: 'auto',
                          }}
                        >
                          {existingCustomers
                            .filter(
                              (c) =>
                                (c.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                                (c.mobile || '').includes(customerSearchQuery) ||
                                (c.email || '').toLowerCase().includes(customerSearchQuery.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((c) => (
                              <div
                                key={c._id || c.id}
                                onClick={() => {
                                  setSelectedCustomerId(c._id || c.id);
                                  setNewJob((prev) => ({
                                    ...prev,
                                    customer: c.name || '',
                                    mobile: c.mobile || '',
                                    email: c.email || '',
                                    brand: c.deviceBrand || prev.brand,
                                    device: c.deviceModel || prev.device,
                                  }));
                                  setShowCustomerDropdown(false);
                                  setCustomerSearchQuery('');
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                              >
                                <div>
                                  <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                                  <span style={{ color: '#64748b', marginLeft: '6px' }}>({c.mobile})</span>
                                </div>
                                <span className="status-badge badge-blue" style={{ fontSize: '10px' }}>
                                  Select Existing
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>
                        <strong>Linked to existing customer:</strong> {newJob.customer} ({newJob.mobile})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setNewJob((prev) => ({ ...prev, customer: '', mobile: '', email: '' }));
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#047857',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Change / New Customer
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Customer Name *</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Rahul Sharma"
                      value={newJob.customer}
                      onChange={(e) => setNewJob({ ...newJob, customer: e.target.value })}
                      required
                      disabled={isSaving || !!selectedCustomerId}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Mobile Number * <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: '600' }}>(Primary ID)</span></label>
                    <input
                      type="tel"
                      className="input-control"
                      placeholder="9876543210"
                      value={newJob.mobile}
                      onChange={(e) => setNewJob({ ...newJob, mobile: e.target.value })}
                      required
                      disabled={isSaving || !!selectedCustomerId}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="input-control"
                      placeholder="client@example.com"
                      value={newJob.email}
                      onChange={(e) => setNewJob({ ...newJob, email: e.target.value })}
                      disabled={isSaving || !!selectedCustomerId}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Address <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '400' }}>(optional)</span></label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. 123 MG Road, Bengaluru"
                    value={newJob.customerAddress || ''}
                    onChange={(e) => setNewJob({ ...newJob, customerAddress: e.target.value })}
                    disabled={isSaving || !!selectedCustomerId}
                  />
                </div>
              </div>

              {/* Section 2: Hardware Details */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Smartphone size={15} style={{ color: '#2563eb' }} />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>2. Device & Hardware Specifications</strong>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <DependentDeviceSelect
                    selectedBrand={newJob.brand}
                    selectedModel={newJob.device}
                    onBrandChange={(brand) => setNewJob((prev) => ({ ...prev, brand }))}
                    onModelChange={(model) => setNewJob((prev) => ({ ...prev, device: model }))}
                    required={true}
                    disabled={isSaving}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IMEI / Serial Number</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="354892019284712"
                      value={newJob.imei}
                      onChange={(e) => setNewJob({ ...newJob, imei: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Color / Finish</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Space Black"
                      value={newJob.color}
                      onChange={(e) => setNewJob({ ...newJob, color: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Diagnostic Issue */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={15} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>3. Fault & Problem Description</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', color: '#2563eb', fontWeight: '700' }}
                    onClick={() =>
                      setAiModalState({
                        isOpen: true,
                        brand: newJob.brand || '',
                        model: newJob.device || '',
                        symptoms: newJob.issue || '',
                        repairJobId: null,
                        target: 'createForm',
                      })
                    }
                  >
                    <Sparkles size={12} /> Ask AI Repair Assistant
                  </button>
                </div>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder="Display cracked, touch unresponsive, battery drains rapidly, no sound"
                  value={newJob.issue}
                  onChange={(e) => setNewJob({ ...newJob, issue: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Section 4: Financials & Priority */}
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <DollarSign size={15} style={{ color: '#2563eb' }} />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>4. Financial Estimate & Priority</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Est. Cost (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="2500"
                      value={newJob.amount}
                      onChange={(e) => setNewJob({ ...newJob, amount: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Advance (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      placeholder="500"
                      value={newJob.advancePayment}
                      onChange={(e) => setNewJob({ ...newJob, advancePayment: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Priority</label>
                    <select
                      className="select-control"
                      value={newJob.priority}
                      onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                      disabled={isSaving}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Dynamic Device Access Input */}
              <DeviceAccessInput
                lockType={newJob.lockType}
                accessAvailable={newJob.accessAvailable}
                credential={newJob.credential}
                onChange={(updated) => setNewJob({ ...newJob, ...updated })}
                isDisabled={isSaving}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Creating Ticket...' : 'Create Ticket Card'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STRUCTURED EDIT REPAIR JOB MODAL */}
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
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Update Job Card {editJob.jobNo}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Current Pipeline Status</label>
                <select
                  className="select-control"
                  value={editJob.status}
                  onChange={(e) => setEditJob({ ...editJob, status: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="Received">Received</option>
                  <option value="Diagnosis">Diagnosis & Approval</option>
                  <option value="In Progress">In Progress (Bench Repair)</option>
                  <option value="Waiting for Parts">Waiting for Parts</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Delivered">Delivered & Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Updated Final / Est. Amount (₹)</label>
                <input
                  type="number"
                  className="input-control"
                  value={editJob.amount}
                  onChange={(e) => setEditJob({ ...editJob, amount: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bench Notes / Diagnostic Update</label>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder="e.g. Screen replaced, QC passed, device tested ok"
                  value={editJob.diagnosisNotes}
                  onChange={(e) => setEditJob({ ...editJob, diagnosisNotes: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              {/* Dynamic Device Access Component inside Edit Modal */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  {editJob.hasCredential && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#ef4444', fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => handleDeleteCredential(editJob.id)}
                      disabled={isDeletingAccessInfo}
                    >
                      <Trash2 size={11} /> Delete Access Information
                    </button>
                  )}
                </div>
                <DeviceAccessInput
                  lockType={editJob.lockType}
                  accessAvailable={editJob.accessAvailable}
                  credential={editJob.credential}
                  onChange={(updated) => setEditJob({ ...editJob, ...updated })}
                  isDisabled={isSaving}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Save Job Updates'} <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE REPAIR JOB MODAL */}
      {jobToDelete && (
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
              Delete Repair Ticket?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete ticket <strong>{jobToDelete.jobNo}</strong> ({jobToDelete.device}) from the repair queue?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setJobToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDeleteJob}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REPAIR BILLING & CHECKOUT MODAL */}
      {billingModalJob && (() => {
        const totals = calculateBillingTotals();
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110,
              padding: '16px',
            }}
          >
            <div className="card" style={{ maxWidth: '650px', width: '100%', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Repair Billing & Invoice</h3>
                    <span className="status-badge badge-blue">{billingModalJob.jobNo}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Generate official repair tax invoice directly from Job Card</span>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBillingModalJob(null)}>✕</button>
              </div>

              <form onSubmit={handleGenerateRepairInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Section 1: Pre-populated Ticket & Customer Info */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Customer</span>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{billingModalJob.customer}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{billingModalJob.mobile || 'No contact phone'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Device & Issue</span>
                    <div style={{ fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>{billingModalJob.device}</div>
                    <div style={{ fontSize: '12px', color: '#334155' }}>{billingModalJob.issue}</div>
                  </div>
                </div>

                {/* Section 2: Spare Parts Allocated */}
                {billingModalJob.parts && billingModalJob.parts.length > 0 ? (
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>Allocated Spare Parts</strong>
                      <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700' }}>Parts Subtotal: {formatCurrency(totals.partsTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {billingModalJob.parts.map((part, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <span>{part.name} (x{part.quantity})</span>
                          <strong style={{ color: '#0f172a' }}>{formatCurrency(part.totalPrice || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b' }}>
                    No inventory spare parts were linked to this repair job.
                  </div>
                )}

                {/* Section 3: Financial Line Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Service / Labor Fee (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      value={billingForm.serviceCharge}
                      onChange={(e) => setBillingForm({ ...billingForm, serviceCharge: e.target.value })}
                      disabled={isBillingSaving}
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Additional Charges (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      value={billingForm.additionalCharges}
                      onChange={(e) => setBillingForm({ ...billingForm, additionalCharges: e.target.value })}
                      disabled={isBillingSaving}
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Discount Amount (₹)</label>
                    <input
                      type="number"
                      className="input-control"
                      value={billingForm.discountAmount}
                      onChange={(e) => setBillingForm({ ...billingForm, discountAmount: e.target.value })}
                      disabled={isBillingSaving}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tax Rate (%)</label>
                    <select
                      className="select-control"
                      value={billingForm.taxPercent}
                      onChange={(e) => setBillingForm({ ...billingForm, taxPercent: e.target.value })}
                      disabled={isBillingSaving}
                    >
                      <option value="0">0% (Tax Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Method</label>
                    <select
                      className="select-control"
                      value={billingForm.paymentMode}
                      onChange={(e) => setBillingForm({ ...billingForm, paymentMode: e.target.value })}
                      disabled={isBillingSaving}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">New Repair Status</label>
                    <select
                      className="select-control"
                      value={billingForm.newStatus}
                      onChange={(e) => setBillingForm({ ...billingForm, newStatus: e.target.value })}
                      disabled={isBillingSaving}
                    >
                      <option value="Delivered">Delivered & Completed</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>

                {/* Section 4: Live Invoice Total Summary Calculation */}
                <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1e3a8a' }}>
                    <span>Gross Invoice Total (Parts + Labor + Tax):</span>
                    <strong>{formatCurrency(totals.total)}</strong>
                  </div>
                  {totals.previousAdvance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669' }}>
                      <span>Less Previous Advance Payment:</span>
                      <strong>- {formatCurrency(totals.previousAdvance)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #93c5fd' }}>
                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>Net Payable Balance:</span>
                    <strong style={{ fontSize: '18px', color: '#2563eb' }}>{formatCurrency(totals.netPayable)}</strong>
                  </div>
                </div>

                {/* Section 5: Paid Amount Now Input */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '700', color: '#0f172a' }}>Amount Paid Now (₹)</label>
                  <input
                    type="number"
                    className="input-control"
                    style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}
                    value={billingForm.paidAmount}
                    onChange={(e) => setBillingForm({ ...billingForm, paidAmount: e.target.value })}
                    disabled={isBillingSaving}
                    min="0"
                    step="any"
                  />
                  <div style={{ fontSize: '12px', color: totals.dueAfterPaid > 0 ? '#dc2626' : '#059669', marginTop: '4px', fontWeight: '600' }}>
                    {totals.dueAfterPaid > 0 ? `Remaining Due Amount: ${formatCurrency(totals.dueAfterPaid)}` : 'Fully Paid (₹0 Due Balance)'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setBillingModalJob(null)} disabled={isBillingSaving}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#059669' }}
                    disabled={isBillingSaving}
                  >
                    {isBillingSaving ? 'Generating Invoice...' : 'Generate & Print Repair Invoice'} <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
        >
          <div style={{ maxWidth: '620px', width: '100%', maxHeight: '95vh', overflowY: 'auto' }}>
            <InvoiceReceiptView invoice={receiptInvoice} onClose={() => setReceiptInvoice(null)} />
          </div>
        </div>
      )}

      {/* AI DIAGNOSTIC MODAL */}
      <AiDiagnosticModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState({ ...aiModalState, isOpen: false })}
        initialBrand={aiModalState.brand}
        initialModel={aiModalState.model}
        initialSymptoms={aiModalState.symptoms}
        repairJobId={aiModalState.repairJobId}
        onApplyToJob={(selections) => {
          setNewJob((prev) => ({
            ...prev,
            brand: selections.brand || prev.brand,
            device: selections.model || prev.device,
            issue: selections.faultDescription || (selections.selectedFaultName ? `AI detected: ${selections.selectedFaultName}` : prev.issue),
            diagnosisNotes: selections.diagnosisNotes || prev.diagnosisNotes,
            amount: selections.estimatedAmount > 0 ? String(selections.estimatedAmount) : prev.amount,
          }));
          setIsCreateModalOpen(true);
          toast.success('AI diagnosis pre-filled into Repair Job form!');
        }}
      />
    </MainLayout>
  );
};
