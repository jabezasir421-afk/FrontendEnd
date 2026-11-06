import React, { useEffect, useState } from 'react';
import { AdminDashboardMetrics, AuditLog, WorkerProfile } from '../types';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, w, a] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminWorkers(),
        api.getAuditLogs(),
      ]);
      setMetrics(m);
      setWorkers(w);
      setAuditLogs(a);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerify = async (workerId: string, currentStatus: boolean) => {
    try {
      await api.toggleWorkerVerification(workerId, !currentStatus);
      await loadData();
    } catch {
      alert('Verification update failed');
    }
  };

  return (
    <div className="grid">
      {/* Metrics Row (Span 12) */}
      <div className="span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              PLATFORM OVERSIGHT & SURVEILLANCE // ADMIN CONSOLE
            </span>
            <h2 style={{ marginTop: '0.25rem' }}>
              System Governance Metrics
            </h2>
          </div>
          <span className="badge badge--dark">
            ROOT CLEARANCE LEVEL
          </span>
        </div>

        {/* 4-Column Mathematical Metric Cards */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="swiss-card">
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>LIFETIME VOLUME</span>
              <div className="mono-num" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1 }}>
                {metrics.totalBookings}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Completed: {metrics.completedBookings} jobs
              </div>
            </div>

            <div className="swiss-card">
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>GROSS SETTLEMENT</span>
              <div className="mono-num" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1 }}>
                {metrics.totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem' }}>CHF</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Escrow clearance: 100%
              </div>
            </div>

            <div className="swiss-card">
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>ACTIVE SPECIALISTS</span>
              <div className="mono-num" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1 }}>
                {metrics.activeWorkers}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Verified: {metrics.verifiedWorkers} • Pending: {metrics.unverifiedWorkers}
              </div>
            </div>

            <div className="swiss-card">
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>QUALITY TOLERANCE</span>
              <div className="mono-num" style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1 }}>
                {metrics.disputeRatePercent}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Dispute escalation rate
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main column: Worker Verification Ledger */}
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Specialist Verification & Accreditation Ledger</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Registered: {workers.length}
          </span>
        </div>

        <table className="swiss-table" aria-label="Worker Verification Queue">
          <thead>
            <tr>
              <th>Trade Specialist</th>
              <th>Discipline</th>
              <th>Canton</th>
              <th>Performance</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id}>
                <td style={{ fontWeight: 600 }}>{w.fullName}</td>
                <td style={{ fontSize: '0.85rem' }}>{w.categoryName}</td>
                <td className="mono-num">{w.primaryCity}</td>
                <td className="mono-num">★ {w.averageRating.toFixed(1)} ({w.reviewCount})</td>
                <td>
                  {w.verified ? (
                    <span className="badge badge--dark" style={{ fontSize: '0.7rem' }}>VERIFIED</span>
                  ) : (
                    <span className="badge badge--red" style={{ fontSize: '0.7rem' }}>UNVERIFIED</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className={`button button--sm ${w.verified ? 'button--outline' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => handleToggleVerify(w.id, w.verified)}
                  >
                    {w.verified ? 'UNVERIFY' : 'AUDIT & VERIFY'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aside column: Immutable Audit Trail */}
      <div className="aside">
        <div className="swiss-card swiss-card--gray">
          <span className="eyebrow" style={{ margin: 0 }}>IMMUTABLE EVENT LOG</span>
          <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
            System Audit Trail
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--rule)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span className="mono-num" style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600 }}>
                    {log.action}
                  </span>
                  <span className="mono-num" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#1F2937', lineHeight: '1.4' }}>
                  {log.details}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Actor: {log.performedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
