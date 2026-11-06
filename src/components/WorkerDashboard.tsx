import React, { useEffect, useState } from 'react';
import { Booking, BookingStatus } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Skeleton } from './SkeletonLoader';

export const WorkerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<boolean>(true);
  const [bookableStatus, setBookableStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [completionPercent, setCompletionPercent] = useState<number>(95);

  // Portfolio modal
  const [showPortfolioModal, setShowPortfolioModal] = useState<boolean>(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectCategory, setProjectCategory] = useState<string>('Electrical Engineering & Installation');
  const [projectDesc, setProjectDesc] = useState<string>('');
  const [portfolioList, setPortfolioList] = useState<{ title: string; category: string; description: string }[]>([
    {
      title: 'Commercial Laboratory Main Power Distribution',
      category: 'Electrical Engineering & Installation',
      description: 'Complete replacement of 400A busbar system and DIN rail distribution with integrated surge arrestors.',
    }
  ]);

  // Working Hours schedule state
  const [shifts, setShifts] = useState<{ [day: string]: { enabled: boolean; start: string; end: string } }>({
    'Monday': { enabled: true, start: '08:00', end: '17:00' },
    'Tuesday': { enabled: true, start: '08:00', end: '17:00' },
    'Wednesday': { enabled: true, start: '08:00', end: '17:00' },
    'Thursday': { enabled: true, start: '08:00', end: '17:00' },
    'Friday': { enabled: true, start: '08:00', end: '17:00' },
    'Saturday': { enabled: false, start: '09:00', end: '13:00' },
  });

  // Complete job modal
  const [completingBooking, setCompletingBooking] = useState<Booking | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(340);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getMyWorkerBookings();
      setBookings(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'start' | 'complete', reason?: string) => {
    try {
      await api.updateBookingStatus(id, action, reason);
      const actionLabels = {
        accept: 'Dispatch Accepted & Confirmed',
        reject: 'Dispatch Commission Declined',
        start: 'Site Execution In Progress',
        complete: 'Job Marked Delivered',
      };
      showToast({
        type: action === 'reject' ? 'info' : 'success',
        title: actionLabels[action] || 'Order Updated',
        message: `Order #${id.toUpperCase()} successfully transitioned to ${action.toUpperCase()}.`
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Status Update Rejected',
        message: err.message || 'Operation failed'
      });
    }
  };

  const handleFinalizeCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBooking) return;
    try {
      await api.updateBookingStatus(completingBooking.id, 'complete');
      showToast({
        type: 'success',
        title: 'Work Completed & Invoiced',
        message: `Final delivery confirmed for ${completingBooking.customerName}. Payment escrow cleared.`
      });
      setCompletingBooking(null);
      await loadData();
    } catch {
      showToast({
        type: 'error',
        title: 'Completion Failed',
        message: 'Could not record final delivery sign-off.'
      });
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ borderColor: '#D97706', color: '#D97706' }}>PENDING CONFIRMATION</span>;
      case 'ACCEPTED':
        return <span className="badge" style={{ borderColor: '#2563EB', color: '#2563EB' }}>DISPATCH CONFIRMED</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge--dark">EXECUTION IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="badge" style={{ borderColor: '#16A34A', color: '#16A34A' }}>COMPLETED & INVOICED</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge badge--red">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="grid">
      {/* Main column: Incoming Orders */}
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              TRADESMAN WORKBENCH // DISPATCH DISPATCHER
            </span>
            <h2 style={{ marginTop: '0.25rem' }}>
              Service Assignments & Schedule
            </h2>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Skeleton height="160px" />
            <Skeleton height="160px" />
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ border: '1px solid var(--rule)', padding: '3rem', textAlign: 'center', background: 'var(--gray)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No active dispatches currently assigned.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your profile is visible in the directory and receiving public commissions.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {bookings.map((b) => (
              <div key={b.id} className="swiss-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      JOB SPECIFICATION #{b.id.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', marginTop: '0.15rem' }}>
                      Client: {b.customerName}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Contact: {b.customerPhone || '+41 79 123 4567'}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Job Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--gray)', padding: '0.85rem', margin: '0.75rem 0', border: '1px solid var(--rule)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Scheduled Time</span>
                    <div className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                      {new Date(b.scheduledStartTime).toLocaleDateString()} {new Date(b.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Job Site</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '0.2rem' }}>
                      {b.addressLine}, {b.city}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Estimated Remuneration</span>
                    <div className="mono-num" style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      {b.estimatedPrice.toFixed(2)} CHF
                    </div>
                  </div>
                </div>

                {b.notes && (
                  <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--black)' }}>Customer Directive:</strong> {b.notes}
                  </p>
                )}

                {/* State Machine Transition Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--rule)', paddingTop: '0.75rem', justifyContent: 'flex-end' }}>
                  {b.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="button button--sm button--outline"
                        onClick={() => handleAction(b.id, 'reject', 'Schedule conflict or capacity exceeded')}
                      >
                        REJECT ORDER
                      </button>
                      <button
                        type="button"
                        className="button button--sm"
                        onClick={() => handleAction(b.id, 'accept')}
                      >
                        ACCEPT & CONFIRM
                      </button>
                    </>
                  )}

                  {b.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      className="button button--sm"
                      onClick={() => handleAction(b.id, 'start')}
                    >
                      BEGIN SITE WORK (START)
                    </button>
                  )}

                  {b.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      className="button button--sm"
                      onClick={() => {
                        setCompletingBooking(b);
                        setFinalPrice(b.estimatedPrice);
                      }}
                    >
                      FINAL DELIVERY & INVOICE
                    </button>
                  )}

                  {b.status === 'COMPLETED' && (
                    <span style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 600 }}>
                      ✓ INVOICE SETTLED ({b.finalPrice || b.estimatedPrice} CHF)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aside: Availability & Profile Health */}
      <div className="aside">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Availability Control Card */}
          <div className="swiss-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Dispatch Status Controls
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Real-time telemetry governs your visibility in client search results.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--rule)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Network Online Status</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Heartbeat active on server</div>
                </div>
                <button
                  type="button"
                  className={`button button--sm ${onlineStatus ? '' : 'button--outline'}`}
                  onClick={() => setOnlineStatus(!onlineStatus)}
                >
                  {onlineStatus ? 'ONLINE' : 'STANDBY'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Open For Bookings</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepting incoming commissions</div>
                </div>
                <button
                  type="button"
                  className={`button button--sm ${bookableStatus ? '' : 'button--outline'}`}
                  onClick={() => setBookableStatus(!bookableStatus)}
                >
                  {bookableStatus ? 'BOOKABLE' : 'MUTED'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Completion Meter */}
          <div className="swiss-card swiss-card--gray">
            <span className="eyebrow" style={{ margin: 0 }}>PROFILE INTEGRITY AUDIT</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Completion</h3>
              <span className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                95%
              </span>
            </div>

            <div style={{ height: '8px', background: 'var(--white)', border: '1px solid var(--black)', marginBottom: '1rem' }}>
              <div style={{ width: `${completionPercent}%`, height: '100%', background: 'var(--black)', transition: 'width 300ms ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Trade License Certificate</span>
                <strong>VERIFIED</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Public Liability Insurance</span>
                <strong>VERIFIED</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ Verified Identity Document</span>
                <strong>VERIFIED</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: completionPercent === 100 ? '#16A34A' : 'var(--red)' }}>
                <span>{completionPercent === 100 ? '✓' : '!'} Portfolio Project Artifacts</span>
                <strong>{completionPercent === 100 ? '100% COMPLETE' : '+5% REMAINING'}</strong>
              </div>
            </div>

            {completionPercent < 100 && (
              <button
                type="button"
                className="button button--sm button--outline"
                style={{ marginTop: '1rem' }}
                onClick={() => setShowPortfolioModal(true)}
              >
                + REGISTER PROJECT ARTIFACT
              </button>
            )}
          </div>

          {/* Operating Hours Shifts Matrix */}
          <div className="swiss-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Weekly Operating Schedule
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Toggle active dispatch shifts for each workday.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(shifts).map(([day, shift]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid var(--rule)', paddingBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>{day}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono-num" style={{ color: shift.enabled ? 'var(--black)' : 'var(--text-muted)' }}>
                      {shift.enabled ? `${shift.start} – ${shift.end}` : 'OFFLINE'}
                    </span>
                    <button
                      type="button"
                      style={{
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: '1px solid var(--black)',
                        background: shift.enabled ? 'var(--black)' : 'var(--white)',
                        color: shift.enabled ? 'var(--white)' : 'var(--black)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setShifts(prev => ({
                        ...prev,
                        [day]: { ...prev[day], enabled: !prev[day].enabled }
                      }))}
                    >
                      {shift.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completingBooking && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="completion-modal-title">
          <div className="modal-dialog">
            <form onSubmit={handleFinalizeCompletion}>
              <div className="modal-header">
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>SERVICE CONCLUSION AUDIT</span>
                  <h3 id="completion-modal-title" style={{ marginTop: '0.2rem' }}>
                    Finalize Order #{completingBooking.id.toUpperCase()}
                  </h3>
                </div>
                <button
                  type="button"
                  className="button button--sm button--outline"
                  onClick={() => setCompletingBooking(null)}
                >
                  CANCEL
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Confirming final delivery releases customer payment escrow and records completion in platform audit ledger.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="final-invoice" className="form-label">Final Invoiced Total (CHF)</label>
                  <input
                    id="final-invoice"
                    type="number"
                    className="input"
                    step="0.05"
                    required
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => setCompletingBooking(null)}
                >
                  DISMISS
                </button>
                <button
                  type="submit"
                  className="button"
                >
                  SIGN OFF & COMPLETE JOB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio Item Upload Modal */}
      {showPortfolioModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="portfolio-modal-title">
          <div className="modal-dialog">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!projectTitle.trim() || !projectDesc.trim()) return;
              setPortfolioList(prev => [...prev, { title: projectTitle, category: projectCategory, description: projectDesc }]);
              setCompletionPercent(100);
              setShowPortfolioModal(false);
              setProjectTitle('');
              setProjectDesc('');
              showToast({
                type: 'success',
                title: 'Artifact Registered',
                message: 'Workmanship artifact added. Profile accreditation score elevated to 100%.'
              });
            }}>
              <div className="modal-header">
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>PORTFOLIO ACCREDITATION // FORM 501</span>
                  <h3 id="portfolio-modal-title" style={{ marginTop: '0.2rem' }}>
                    Register Workmanship Artifact
                  </h3>
                </div>
                <button
                  type="button"
                  className="button button--sm button--outline"
                  onClick={() => setShowPortfolioModal(false)}
                >
                  DISMISS
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="project-title" className="form-label">Project Title & Identification</label>
                  <input
                    id="project-title"
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Three-Phase Industrial Feeder Retrofit"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="project-cat" className="form-label">Discipline</label>
                  <select
                    id="project-cat"
                    className="select"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                  >
                    <option value="Electrical Engineering & Installation">Electrical Engineering</option>
                    <option value="Precision Plumbing & Sanitary">Precision Plumbing</option>
                    <option value="Carpentry & Architectural Millwork">Carpentry & Millwork</option>
                    <option value="HVAC & Thermal Systems">HVAC & Thermal Systems</option>
                    <option value="Masonry & Structural Restoration">Masonry & Structural</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="project-desc" className="form-label">Technical Scope Description</label>
                  <textarea
                    id="project-desc"
                    className="textarea"
                    rows={4}
                    required
                    placeholder="Describe engineering specifications, tolerances, DIN standards adhered to, and materials used..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => setShowPortfolioModal(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="button"
                >
                  SAVE & BUMP SCORE TO 100%
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
