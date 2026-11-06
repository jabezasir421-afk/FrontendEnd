import React, { useState } from 'react';
import { WorkerProfile, Address } from '../types';
import { api } from '../services/api';

interface BookingModalProps {
  worker: WorkerProfile;
  savedAddresses: Address[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ worker, savedAddresses, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-09');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [estimatedHours, setEstimatedHours] = useState<number>(3);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(savedAddresses[0]?.id || 'custom');
  
  // Custom address fields
  const [addressLine, setAddressLine] = useState<string>(savedAddresses[0]?.addressLine1 || '');
  const [city, setCity] = useState<string>(savedAddresses[0]?.city || worker.primaryCity);
  const [state, setState] = useState<string>(savedAddresses[0]?.state || 'ZH');
  const [postalCode, setPostalCode] = useState<string>(savedAddresses[0]?.postalCode || '8001');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setAddressLine(addr.addressLine1);
      setCity(addr.city);
      setState(addr.state);
      setPostalCode(addr.postalCode);
    }
  };

  const estimatedTotal = worker.hourlyRate * estimatedHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please specify all required location fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const startIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    const endDate = new Date(new Date(`${selectedDate}T${selectedTime}:00`).getTime() + estimatedHours * 60 * 60 * 1000);
    const endIso = endDate.toISOString();

    try {
      await api.createBooking({
        workerId: worker.id,
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        addressLine,
        city,
        state,
        postalCode,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch {
      setErrorMsg('Failed to process service order. Check connection or parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-order-title">
      <div className="modal-dialog">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>
                DISPATCH SPECIFICATION // FORM 104
              </span>
              <h2 id="booking-order-title" style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>
                Commission {worker.fullName}
              </h2>
            </div>
            <button
              type="button"
              className="button button--sm button--outline"
              onClick={onClose}
              aria-label="Close Booking Dialog"
            >
              CANCEL
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            {/* Service & Rate Breakdown */}
            <div style={{ background: 'var(--gray)', padding: '1rem', border: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assigned Trade</span>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{worker.categoryName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unit Rate</span>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{worker.hourlyRate.toFixed(2)} CHF/h</div>
              </div>
            </div>

            {/* Schedule Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="booking-date" className="form-label">Service Date</label>
                <input
                  id="booking-date"
                  type="date"
                  className="input"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="booking-time" className="form-label">Start Time (CET)</label>
                <input
                  id="booking-time"
                  type="time"
                  className="input"
                  required
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="booking-duration" className="form-label">Est. Duration</label>
                <select
                  id="booking-duration"
                  className="select"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours (Standard)</option>
                  <option value={4}>4 Hours (Half Day)</option>
                  <option value={8}>8 Hours (Full Day)</option>
                </select>
              </div>
            </div>

            {/* Address Selection */}
            {savedAddresses.length > 0 && (
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="saved-addr-select" className="form-label">Select Registered Site</label>
                <select
                  id="saved-addr-select"
                  className="select"
                  value={selectedAddressId}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                >
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.addressLine1}, {a.city} {a.postalCode} {a.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                  <option value="custom">-- Specify Alternative Location --</option>
                </select>
              </div>
            )}

            {/* Location fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 12' }}>
                <label htmlFor="booking-address" className="form-label">Site Street & Number</label>
                <input
                  id="booking-address"
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. Gotthardstrasse 24, Etage 2"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: 'span 6' }}>
                <label htmlFor="booking-city" className="form-label">City / Canton</label>
                <input
                  id="booking-city"
                  type="text"
                  className="input"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label htmlFor="booking-state" className="form-label">State / Canton</label>
                <input
                  id="booking-state"
                  type="text"
                  className="input"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label htmlFor="booking-postcode" className="form-label">Postal Code</label>
                <input
                  id="booking-postcode"
                  type="text"
                  className="input"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            {/* Notes / Instructions */}
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="booking-notes" className="form-label">Technical Job Brief / Instructions</label>
              <textarea
                id="booking-notes"
                className="textarea"
                rows={3}
                placeholder="Specify nature of work, building access details, power supply availability, special materials..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Mathematical Price Calculation */}
            <div style={{ borderTop: '2px solid var(--black)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="eyebrow" style={{ margin: 0 }}>ESTIMATED TOTAL DISPATCH</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {worker.hourlyRate.toFixed(2)} CHF × {estimatedHours} hours
                </span>
              </div>
              <div className="mono-num" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {estimatedTotal.toFixed(2)} <span style={{ fontSize: '1rem' }}>CHF</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="button button--outline"
              onClick={onClose}
              disabled={submitting}
            >
              DISCARD
            </button>
            <button
              type="submit"
              className="button"
              disabled={submitting}
            >
              {submitting ? 'TRANSMITTING ORDER...' : 'DISPATCH SERVICE ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
