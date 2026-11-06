import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ booking, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [newDate, setNewDate] = useState<string>('2026-11-12');
  const [newTime, setNewTime] = useState<string>('10:00');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const startIso = new Date(`${newDate}T${newTime}:00`).toISOString();
      const endIso = new Date(new Date(`${newDate}T${newTime}:00`).getTime() + 3 * 60 * 60 * 1000).toISOString();
      await api.rescheduleBooking(booking.id, startIso, endIso);
      showToast({
        type: 'success',
        title: 'Dispatch Order Rescheduled',
        message: `Order #${booking.id.toUpperCase()} successfully rescheduled to ${newDate} at ${newTime} CET.`
      });
      onSuccess();
    } catch {
      showToast({
        type: 'error',
        title: 'Reschedule Rejected',
        message: 'Failed to reschedule dispatch order.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
      <div className="modal-dialog">
        <form onSubmit={handleReschedule}>
          <div className="modal-header">
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>SCHEDULE AMENDMENT // FORM 202</span>
              <h3 id="reschedule-title" style={{ marginTop: '0.2rem' }}>
                Reschedule Order #{booking.id.toUpperCase()}
              </h3>
            </div>
            <button
              type="button"
              className="button button--sm button--outline"
              onClick={onClose}
            >
              DISMISS
            </button>
          </div>

          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Assigned Specialist: <strong style={{ color: 'var(--black)' }}>{booking.workerName}</strong> ({booking.workerCategory})
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="new-date" className="form-label">New Service Date</label>
                <input
                  id="new-date"
                  type="date"
                  className="input"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="new-time" className="form-label">New Start Time (CET)</label>
                <input
                  id="new-time"
                  type="time"
                  className="input"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button button--outline"
              onClick={onClose}
              disabled={submitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="button"
              disabled={submitting}
            >
              {submitting ? 'TRANSMITTING CHANGE...' : 'CONFIRM NEW SCHEDULE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
