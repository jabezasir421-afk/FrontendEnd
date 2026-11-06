import React, { useEffect, useState } from 'react';
import { WorkerProfile, Review, ReviewStats } from '../types';
import { api } from '../services/api';

interface WorkerDetailModalProps {
  worker: WorkerProfile;
  onClose: () => void;
  onBookNow: (worker: WorkerProfile) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({ worker, onClose, onBookNow }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [revData, statsData] = await Promise.all([
          api.getWorkerReviews(worker.id),
          api.getWorkerStats(worker.id),
        ]);
        setReviews(revData);
        setStats(statsData);
      } catch {
        // fallback handled in api
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [worker.id]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
      <div className="modal-dialog" style={{ maxWidth: '48rem' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              OFFICIAL WORKER DOSSIER // #{worker.id.toUpperCase()}
            </span>
            <h2 id="dossier-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
              {worker.fullName}
            </h2>
          </div>
          <button
            type="button"
            className="button button--sm button--outline"
            onClick={onClose}
            aria-label="Close Dossier Modal"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Key Facts Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--gray)', padding: '1rem', border: '1px solid var(--rule)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discipline</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{worker.categoryName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Canton Station</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{worker.primaryCity}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hourly Rate</div>
              <div className="mono-num" style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                {worker.hourlyRate.toFixed(2)} CHF
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audit Status</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: worker.verified ? 'var(--black)' : 'var(--red)', marginTop: '0.2rem' }}>
                {worker.verified ? 'VERIFIED (ISO)' : 'PENDING'}
              </div>
            </div>
          </div>

          {/* Profile Bio */}
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Professional Summary</h4>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {worker.bio || 'Accredited tradesman practicing with precision tooling and adherence to municipal building codes.'}
            </p>
          </div>

          {/* Core Competencies */}
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Registered Skills & Qualifications</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {worker.skillNames.map((skill, idx) => (
                <span 
                  key={idx} 
                  style={{
                    padding: '0.35rem 0.75rem',
                    border: '1px solid var(--black)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Operating Schedule */}
          <div>
            <h4 style={{ marginBottom: '0.75rem' }}>Weekly Operating Schedule</h4>
            <table className="swiss-table" aria-label="Operating Hours">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Shift Window</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <tr key={day}>
                    <td style={{ fontWeight: 600 }}>{day}</td>
                    <td className="mono-num">08:00 – 17:00 CET</td>
                    <td>
                      <span className="badge" style={{ borderColor: '#16A34A', color: '#16A34A' }}>
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 600 }}>Saturday</td>
                  <td className="mono-num">09:00 – 13:00 CET</td>
                  <td>
                    <span className="badge badge--gray">ON CALL</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Sunday</td>
                  <td>—</td>
                  <td>
                    <span className="badge badge--gray">OFFLINE</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer Reviews Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', borderBottom: '1px solid var(--rule)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>
                Audited Client Reviews ({stats?.totalReviews || reviews.length})
              </h4>
              <span className="mono-num" style={{ fontWeight: 700 }}>
                ★ {worker.averageRating.toFixed(1)} / 5.0
              </span>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading verified audit records...</p>
            ) : reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No public reviews posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{ border: '1px solid var(--rule)', padding: '1rem', background: '#FCFCFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rev.customerName}</span>
                      <span className="mono-num" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ★ {rev.rating}.0 • {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="button button--outline"
            onClick={onClose}
          >
            DISMISS
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              onClose();
              onBookNow(worker);
            }}
          >
            INITIALIZE SERVICE ORDER
          </button>
        </div>
      </div>
    </div>
  );
};
