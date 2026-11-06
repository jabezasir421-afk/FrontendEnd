import React, { useEffect, useState } from 'react';
import { Booking, Address, BookingStatus } from '../types';
import { api } from '../services/api';
import { RescheduleModal } from './RescheduleModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from './SkeletonLoader';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Reschedule state
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  // New address state
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [newStreet, setNewStreet] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('Zurich');
  const [newState, setNewState] = useState<string>('ZH');
  const [newPostal, setNewPostal] = useState<string>('8002');
  const [isDefault, setIsDefault] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, aData] = await Promise.all([
        api.getMyCustomerBookings(),
        api.getMyAddresses(),
      ]);
      setBookings(bData);
      setAddresses(aData);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = async (id: string) => {
    try {
      await api.updateBookingStatus(id, 'cancel', 'Customer requested cancellation via portal');
      showToast({
        type: 'info',
        title: 'Dispatch Order Revoked',
        message: `Service order #${id.toUpperCase()} has been formally cancelled.`
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Could not revoke booking.'
      });
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim() || !newPostal.trim()) return;
    try {
      await api.addAddress({
        addressLine1: newStreet,
        city: newCity,
        state: newState,
        postalCode: newPostal,
        isDefault,
      });
      showToast({
        type: 'success',
        title: 'Job Site Registered',
        message: `${newStreet}, ${newCity} saved to location ledger.`
      });
      setShowAddressForm(false);
      setNewStreet('');
      await loadData();
    } catch {
      showToast({
        type: 'error',
        title: 'Registration Rejected',
        message: 'Could not record new site address.'
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      await api.createReview({
        bookingId: reviewBooking.id,
        workerId: reviewBooking.workerId,
        rating: reviewRating,
        comment: reviewComment,
      });
      showToast({
        type: 'success',
        title: 'Quality Audit Logged',
        message: `Assessment score of ★ ${reviewRating}.0 recorded in public register.`
      });
      setReviewBooking(null);
      setReviewComment('');
    } catch {
      showToast({
        type: 'error',
        title: 'Audit Submission Failed',
        message: 'Failed to record customer review.'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = selectedStatus === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === selectedStatus);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ borderColor: '#D97706', color: '#D97706' }}>PENDING CONFIRMATION</span>;
      case 'ACCEPTED':
        return <span className="badge" style={{ borderColor: '#2563EB', color: '#2563EB' }}>DISPATCH CONFIRMED</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge--dark">WORK IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="badge" style={{ borderColor: '#16A34A', color: '#16A34A' }}>COMPLETED</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge badge--red">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="grid">
      {/* Main Column: Bookings */}
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              CUSTOMER OPERATIONAL LOG
            </span>
            <h2 style={{ marginTop: '0.25rem' }}>
              Service Dispatches & Orders
            </h2>
          </div>

          {/* Filter Status Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>FILTER:</span>
            <select
              className="select"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter Bookings by Status"
            >
              <option value="ALL">All Statuses ({bookings.length})</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Skeleton height="160px" />
            <Skeleton height="160px" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ border: '1px solid var(--rule)', padding: '3rem', textAlign: 'center', background: 'var(--gray)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No orders found for current filter criteria.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Explore the trade directory to schedule certified specialists.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredBookings.map((b) => (
              <div key={b.id} className="swiss-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ORDER #{b.id.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', marginTop: '0.15rem' }}>
                      {b.workerName}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {b.workerCategory}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--gray)', padding: '0.85rem', margin: '0.75rem 0', border: '1px solid var(--rule)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Execution Window</span>
                    <div className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>
                      {new Date(b.scheduledStartTime).toLocaleDateString()} {new Date(b.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Location</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '0.2rem' }}>
                      {b.addressLine}, {b.city}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cost Commitment</span>
                    <div className="mono-num" style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      {b.estimatedPrice.toFixed(2)} CHF
                    </div>
                  </div>
                </div>

                {b.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--black)' }}>Scope Notes:</strong> {b.notes}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--rule)', paddingTop: '0.75rem', justifyContent: 'flex-end' }}>
                  {b.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="button button--sm button--outline"
                        onClick={() => setReschedulingBooking(b)}
                      >
                        RESCHEDULE
                      </button>
                      <button
                        type="button"
                        className="button button--sm button--danger"
                        onClick={() => handleCancelBooking(b.id)}
                      >
                        REVOKE DISPATCH
                      </button>
                    </>
                  )}

                  {b.status === 'COMPLETED' && (
                    <button
                      type="button"
                      className="button button--sm button--outline"
                      onClick={() => setReviewBooking(b)}
                    >
                      SUBMIT QUALITY AUDIT (REVIEW)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aside Column: Saved Addresses */}
      <div className="aside">
        <div className="swiss-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>
              Registered Sites
            </h3>
            <button
              type="button"
              className="button button--sm button--outline"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? 'CANCEL' : '+ REGISTER SITE'}
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Standard job addresses for expedited technician dispatch.
          </p>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} style={{ background: 'var(--gray)', padding: '1rem', border: '1px solid var(--black)', marginBottom: '1.5rem' }}>
              <span className="eyebrow" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>NEW SITE REGISTRATION</span>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Street & Number</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. Limmatquai 18"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>City</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Postal</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newPostal}
                    onChange={(e) => setNewPostal(e.target.value)}
                  />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                SET AS PRIMARY SITE
              </label>
              <button type="submit" className="button button--sm" style={{ width: '100%' }}>
                SAVE LOCATION
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {addresses.map((a) => (
              <div key={a.id} style={{ border: '1px solid var(--rule)', padding: '0.75rem', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.addressLine1}</span>
                  {a.isDefault && (
                    <span className="badge badge--dark" style={{ fontSize: '0.65rem' }}>PRIMARY</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {a.city}, {a.state} {a.postalCode}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className="modal-dialog">
            <form onSubmit={handleSubmitReview}>
              <div className="modal-header">
                <div>
                  <span className="eyebrow" style={{ margin: 0 }}>QUALITY AUDIT REPORT</span>
                  <h3 id="review-modal-title" style={{ marginTop: '0.2rem' }}>
                    Review {reviewBooking.workerName}
                  </h3>
                </div>
                <button
                  type="button"
                  className="button button--sm button--outline"
                  onClick={() => setReviewBooking(null)}
                >
                  DISMISS
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="review-score" className="form-label">Objective Performance Score (1-5)</label>
                  <select
                    id="review-score"
                    className="select"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                  >
                    <option value={5}>5.0 — Flawless Precision & DIN Standard Compliance</option>
                    <option value={4}>4.0 — Satisfactory Execution, Minor Tolerances</option>
                    <option value={3}>3.0 — Average Quality</option>
                    <option value={2}>2.0 — Sub-Standard Workmanship</option>
                    <option value={1}>1.0 — Non-Compliant / Rejected Delivery</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="review-audit" className="form-label">Audit Notes & Technical Comments</label>
                  <textarea
                    id="review-audit"
                    className="textarea"
                    rows={4}
                    required
                    placeholder="Document execution quality, cleanliness, adherence to schedule, and material durability..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => setReviewBooking(null)}
                  disabled={submittingReview}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'RECORDING AUDIT...' : 'SUBMIT AUDIT RECORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onSuccess={() => {
            setReschedulingBooking(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
