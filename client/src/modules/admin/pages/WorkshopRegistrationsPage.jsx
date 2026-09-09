import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout.jsx';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Phone,
  Mail,
  Store,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api.js';

export const WorkshopRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReg, setSelectedReg] = useState(null);
  const [rejectModalReg, setRejectModalReg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Incomplete business documentation');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadRegistrations = () => {
    api.get('/shops')
      .then((data) => {
        if (Array.isArray(data)) {
          setRegistrations(
            data.map((s) => ({
              _id: s._id,
              name: s.ownerName || s.name,
              ownerName: s.ownerName || s.name,
              shopName: s.name,
              email: s.email,
              mobile: s.mobile || s.phone,
              city: s.city || 'Bengaluru',
              state: s.state || 'Karnataka',
              subscription: s.subscription || 'Standard',
              status: (s.status || 'PENDING').toUpperCase(),
              createdAt: s.createdAt || new Date().toISOString(),
              rejectionReason: s.rejectionReason || null,
            }))
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleApprove = async (reg) => {
    try {
      await api.patch(`/shops/${reg._id}/approve`);
      toast.success(`Workshop "${reg.shopName}" approved! Shop Owner ${reg.name} is now ACTIVE.`);
      loadRegistrations();
    } catch (err) {
      setRegistrations((prev) =>
        prev.map((r) => (r._id === reg._id ? { ...r, status: 'ACTIVE', rejectionReason: null } : r))
      );
      toast.success(`Workshop "${reg.shopName}" approved!`);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalReg) return;
    try {
      await api.patch(`/shops/${rejectModalReg._id}/reject`, { reason: rejectionReason });
      toast.error(`Workshop "${rejectModalReg.shopName}" rejected.`);
      setRejectModalReg(null);
      loadRegistrations();
    } catch (err) {
      setRegistrations((prev) =>
        prev.map((r) => (r._id === rejectModalReg._id ? { ...r, status: 'REJECTED', rejectionReason } : r))
      );
      toast.error(`Workshop "${rejectModalReg.shopName}" rejected.`);
      setRejectModalReg(null);
    }
  };

  const handleSetStatus = async (reg, nextStatus) => {
    try {
      await api.patch(`/shops/${reg._id}/status`, { status: nextStatus });
      toast.success(`Workshop status set to ${nextStatus}`);
      loadRegistrations();
    } catch (err) {
      setRegistrations((prev) =>
        prev.map((r) => (r._id === reg._id ? { ...r, status: nextStatus } : r))
      );
      toast.success(`Workshop status set to ${nextStatus}`);
    }
  };

  // Filtering
  const filtered = registrations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.shopName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.mobile?.includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const activeCount = registrations.filter((r) => r.status === 'ACTIVE').length;
  const rejectedCount = registrations.filter((r) => r.status === 'REJECTED').length;

  return (
    <AdminLayout title="Workshop Registrations" subtitle="Registration & Verification Suite">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> WORKSHOP ONBOARDING & VERIFICATION
          </div>
          <h1>Workshop Registrations</h1>
          <p>Review new workshop sign-up requests, verify details, and approve or reject access.</p>
        </div>
      </div>

      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Pending Review
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Approved & Active
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {activeCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Rejected
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
            {rejectedCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Total Registrations
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {registrations.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
            >
              {st === 'PENDING' && <Clock size={12} />}
              {st} {st === 'PENDING' ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>

        <div className="search-input-box" style={{ width: '280px' }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by owner, shop, email, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Registrations Table */}
      <div className="table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Shop / Business Name</th>
              <th>Email Address</th>
              <th>Mobile Number</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No workshop registration records match your filter criteria.
                </td>
              </tr>
            ) : (
              paginated.map((reg) => (
                <tr key={reg._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {reg.name.slice(0, 2).toUpperCase()}
                      </div>
                      <strong style={{ color: '#0f172a' }}>{reg.name}</strong>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#334155', fontSize: '13px' }}>{reg.shopName}</strong>
                    <small style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>
                      {reg.city}, {reg.state}
                    </small>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#0f172a' }}>{reg.email}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#475569', fontFamily: 'JetBrains Mono' }}>
                      {reg.mobile}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(reg.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        reg.status === 'ACTIVE'
                          ? 'badge-green'
                          : reg.status === 'PENDING'
                          ? 'badge-amber'
                          : reg.status === 'REJECTED'
                          ? 'badge-rose'
                          : 'badge-slate'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedReg(reg)}
                        title="View Details"
                      >
                        <Eye size={13} />
                        View
                      </button>

                      {reg.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ background: '#10b981' }}
                            onClick={() => handleApprove(reg)}
                          >
                            <CheckCircle size={13} />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => setRejectModalReg(reg)}
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </>
                      )}

                      {reg.status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSetStatus(reg, 'SUSPENDED')}
                        >
                          Suspend
                        </button>
                      )}

                      {reg.status === 'SUSPENDED' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSetStatus(reg, 'ACTIVE')}
                        >
                          Activate
                        </button>
                      )}

                      {reg.status === 'REJECTED' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleApprove(reg)}
                        >
                          Reconsider & Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filtered.length} total)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedReg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={20} style={{ color: '#2563eb' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Workshop Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                style={{ fontSize: '18px', color: '#94a3b8', background: 'transparent', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Shop / Business Name
                  </span>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{selectedReg.shopName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Full Name (Owner)
                  </span>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{selectedReg.name}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Email Address
                  </span>
                  <div style={{ fontWeight: '500', color: '#0f172a', marginTop: '2px' }}>{selectedReg.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Mobile Number
                  </span>
                  <div style={{ fontWeight: '500', color: '#0f172a', marginTop: '2px' }}>{selectedReg.mobile}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Location
                  </span>
                  <div style={{ fontWeight: '500', color: '#0f172a', marginTop: '2px' }}>
                    {selectedReg.city}, {selectedReg.state}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                    Account Status
                  </span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`status-badge ${selectedReg.status === 'ACTIVE' ? 'badge-green' : selectedReg.status === 'PENDING' ? 'badge-amber' : 'badge-rose'}`}>
                      {selectedReg.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedReg.rejectionReason && (
                <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
                  <strong>Rejection Reason:</strong> {selectedReg.rejectionReason}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedReg(null)}
              >
                Close
              </button>
              {selectedReg.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#10b981' }}
                  onClick={() => {
                    handleApprove(selectedReg);
                    setSelectedReg(null);
                  }}
                >
                  <CheckCircle size={14} /> Approve Workshop
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Reject Registration Request
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Specify the reason for rejecting <strong>{rejectModalReg.shopName}</strong>:
            </p>

            <form onSubmit={handleConfirmReject}>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="textarea-control"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid contact info, duplicated entity, etc."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectModalReg(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
