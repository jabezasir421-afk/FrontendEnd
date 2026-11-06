import React, { useEffect, useState } from 'react';
import { 
  AdminDashboardMetrics, 
  AuditLog, 
  WorkerProfile,
  BookingsTrendItem,
  CategoryDistributionItem,
  RatingDistributionData,
  TopWorkerItem,
  AdminUserItem,
  ReportedReviewItem
} from '../types';
import { api } from '../services/api';
import { AdminCharts } from './AdminCharts';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminReviewModeration } from './AdminReviewModeration';

type AdminTab = 'overview' | 'charts' | 'workers' | 'reviews' | 'users' | 'audit';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Analytics and views state
  const [trendData, setTrendData] = useState<BookingsTrendItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistributionItem[]>([]);
  const [ratingData, setRatingData] = useState<RatingDistributionData[]>([]);
  const [topWorkers, setTopWorkers] = useState<TopWorkerItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [reportedReviews, setReportedReviews] = useState<ReportedReviewItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, w, a, tr, cd, rd, tw, usrs, rRevs] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminWorkers(),
        api.getAuditLogs(),
        api.getDailyBookingStats(),
        api.getCategoryDistribution(),
        api.getRatingDistribution(),
        api.getTopWorkers(5),
        api.getAdminUsers(),
        api.getReportedReviews(),
      ]);
      setMetrics(m);
      setWorkers(w);
      setAuditLogs(a);
      setTrendData(tr);
      setCategoryData(cd);
      setRatingData(rd);
      setTopWorkers(tw);
      setAdminUsers(usrs);
      setReportedReviews(rRevs);
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

  const handleRefreshSnapshot = async () => {
    setRefreshing(true);
    try {
      await api.refreshAnalyticsSnapshot();
      await loadData();
      alert('Analytics cache and mathematical snapshots successfully refreshed.');
    } catch {
      alert('Snapshot refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, newStatus: 'ACTIVE' | 'DEACTIVATED') => {
    try {
      await api.toggleUserStatus(userId, newStatus);
      await loadData();
    } catch {
      alert('Failed to update user account status');
    }
  };

  const handleModerateReview = async (reviewId: string, action: 'activate' | 'deactivate') => {
    try {
      await api.moderateReview(reviewId, action);
      await loadData();
    } catch {
      alert('Failed to moderate review');
    }
  };

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'overview', label: '01 // OVERVIEW & KPIS' },
    { id: 'charts', label: '02 // ANALYTICS & CHARTS' },
    { id: 'workers', label: '03 // SPECIALIST VERIFICATION', count: workers.filter(w => !w.verified).length },
    { id: 'reviews', label: '04 // REVIEW MODERATION', count: reportedReviews.length },
    { id: 'users', label: '05 // USER DIRECTORY', count: adminUsers.length },
    { id: 'audit', label: '06 // AUDIT EVENT LOG' },
  ];

  return (
    <div className="grid">
      {/* Header Bar */}
      <div className="span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              PLATFORM OVERSIGHT & SURVEILLANCE // ADMIN CONSOLE 2.0
            </span>
            <h2 style={{ marginTop: '0.25rem' }}>
              System Governance Matrix
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="badge badge--dark">ROOT CLEARANCE LEVEL</span>
            <span className="badge" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>LIVE SURVEILLANCE</span>
          </div>
        </div>

        {/* Swiss Modernism Sub-Navigation Bar */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            borderTop: '1px solid var(--black)', 
            borderBottom: '1px solid var(--black)', 
            marginBottom: '2rem',
            background: 'var(--white)'
          }}
          role="tablist"
          aria-label="Admin Navigation Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                borderRight: '1px solid var(--black)',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--black)' : 'var(--white)',
                color: activeTab === tab.id ? 'var(--white)' : 'var(--black)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span 
                  style={{ 
                    background: activeTab === tab.id ? 'var(--red)' : 'var(--black)', 
                    color: 'var(--white)', 
                    fontSize: '0.7rem', 
                    padding: '0.1rem 0.35rem',
                    fontWeight: 700
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="span-12" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving governance telemetry and mathematical records...
        </div>
      ) : (
        <>
          {/* TAB 01: Overview & Metrics */}
          {activeTab === 'overview' && (
            <>
              {/* 4-Column Mathematical Metric Cards */}
              {metrics && (
                <div className="span-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
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

              {/* Quick Summary Split */}
              <div className="main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Pending Specialist Verifications</h3>
                  <button 
                    type="button" 
                    className="button button--sm button--outline"
                    onClick={() => setActiveTab('workers')}
                  >
                    VIEW ALL ({workers.length})
                  </button>
                </div>

                <table className="swiss-table" aria-label="Quick Verification Queue">
                  <thead>
                    <tr>
                      <th>Trade Specialist</th>
                      <th>Discipline</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Audit Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.slice(0, 4).map((w) => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 600 }}>{w.fullName}</td>
                        <td style={{ fontSize: '0.85rem' }}>{w.categoryName}</td>
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
                            {w.verified ? 'UNVERIFY' : 'VERIFY'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="aside">
                <div className="swiss-card swiss-card--gray">
                  <span className="eyebrow" style={{ margin: 0 }}>SYSTEM CAPACITY</span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
                    Infrastructure Health
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Database Engine</span>
                      <strong className="mono-num">PostgreSQL 16</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Framework Runtime</span>
                      <strong>Spring Boot 3.4.x</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Flyway Migrations</span>
                      <strong className="mono-num">V22 Applied</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Security Mode</span>
                      <strong>Stateless JWT</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Dispute Escalations</span>
                      <strong className="mono-num" style={{ color: 'var(--red)' }}>{reportedReviews.length} Flagged</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 02: Analytics & Charts */}
          {activeTab === 'charts' && (
            <div className="span-12">
              <AdminCharts
                trendData={trendData}
                categoryData={categoryData}
                ratingData={ratingData}
                topWorkers={topWorkers}
                onRefreshSnapshot={handleRefreshSnapshot}
                refreshing={refreshing}
              />
            </div>
          )}

          {/* TAB 03: Specialist Verification Queue */}
          {activeTab === 'workers' && (
            <div className="span-12">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--black)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>
                    TRADESMAN COMPLIANCE & STATE LICENSING // REGISTER 03
                  </span>
                  <h2 style={{ marginTop: '0.25rem' }}>
                    Specialist Verification & Accreditation Ledger
                  </h2>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total Registered: <strong className="mono-num" style={{ color: 'var(--black)' }}>{workers.length}</strong>
                </span>
              </div>

              <table className="swiss-table" aria-label="Worker Verification Queue">
                <thead>
                  <tr>
                    <th>Trade Specialist</th>
                    <th>Discipline</th>
                    <th>Canton Station</th>
                    <th>Hourly Rate</th>
                    <th>Audit Performance</th>
                    <th>Accreditation Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.fullName}</td>
                      <td style={{ fontSize: '0.85rem' }}>{w.categoryName}</td>
                      <td className="mono-num">{w.primaryCity}</td>
                      <td className="mono-num">{w.hourlyRate.toFixed(2)} CHF/h</td>
                      <td className="mono-num">★ {w.averageRating.toFixed(1)} ({w.reviewCount} reviews)</td>
                      <td>
                        {w.verified ? (
                          <span className="badge badge--dark" style={{ fontSize: '0.7rem' }}>VERIFIED (ISO)</span>
                        ) : (
                          <span className="badge badge--red" style={{ fontSize: '0.7rem' }}>UNVERIFIED</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`button button--sm ${w.verified ? 'button--outline' : ''}`}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                          onClick={() => handleToggleVerify(w.id, w.verified)}
                        >
                          {w.verified ? 'REVOKE ACCREDITATION' : 'AUDIT & ACCREDIT'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 04: Review Moderation */}
          {activeTab === 'reviews' && (
            <div className="span-12">
              <AdminReviewModeration
                reportedReviews={reportedReviews}
                onModerate={handleModerateReview}
              />
            </div>
          )}

          {/* TAB 05: User Directory */}
          {activeTab === 'users' && (
            <div className="span-12">
              <AdminUserManagement
                users={adminUsers}
                onToggleStatus={handleToggleUserStatus}
              />
            </div>
          )}

          {/* TAB 06: Immutable Event Log */}
          {activeTab === 'audit' && (
            <div className="span-12">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--black)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>
                    IMMUTABLE AUDIT TRAIL // RECORD LOG 06
                  </span>
                  <h2 style={{ marginTop: '0.25rem' }}>
                    System Security & Operation Event Ledger
                  </h2>
                </div>
                <span className="badge badge--dark">DIN 1451 SECURED</span>
              </div>

              <table className="swiss-table" aria-label="System Security Audit Trail">
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>Action Protocol</th>
                    <th>Target Resource</th>
                    <th>Target Identifier</th>
                    <th>Authorized Actor</th>
                    <th>Operational Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="mono-num" style={{ fontSize: '0.8rem' }}>
                        {new Date(log.timestamp).toISOString()}
                      </td>
                      <td className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700 }}>
                        {log.action}
                      </td>
                      <td>
                        <span className="badge badge--gray" style={{ fontSize: '0.65rem' }}>
                          {log.targetEntity}
                        </span>
                      </td>
                      <td className="mono-num" style={{ fontSize: '0.8rem' }}>
                        {log.targetId}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {log.performedBy}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#1F2937' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
