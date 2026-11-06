import React from 'react';
import { ReportedReviewItem } from '../types';

interface AdminReviewModerationProps {
  reportedReviews: ReportedReviewItem[];
  onModerate: (reviewId: string, action: 'activate' | 'deactivate') => void;
}

export const AdminReviewModeration: React.FC<AdminReviewModerationProps> = ({ reportedReviews, onModerate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--black)', paddingBottom: '1rem' }}>
        <div>
          <span className="eyebrow" style={{ margin: 0 }}>
            DISPUTE RESOLUTION & INTEGRITY // QUEUE 05
          </span>
          <h2 style={{ marginTop: '0.25rem' }}>
            Reported Review Moderation
          </h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Flagged Entries: <strong className="mono-num" style={{ color: 'var(--red)' }}>{reportedReviews.length}</strong>
        </span>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Under ISO 9001 governance, all disputed client ratings are subjected to peer audit. Deactivating hides non-compliant entries from public calculations while maintaining immutable audit trails.
      </p>

      {reportedReviews.length === 0 ? (
        <div style={{ border: '1px solid var(--rule)', padding: '3rem', textAlign: 'center', background: 'var(--gray)' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No pending reported reviews.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All ratings and reviews are currently in compliance with platform guidelines.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reportedReviews.map((rev) => (
            <div key={rev.id} className="swiss-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      REVIEW #{rev.id.toUpperCase()}
                    </span>
                    <span className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      ★ {rev.rating}.0
                    </span>
                    {rev.active ? (
                      <span className="badge badge--dark" style={{ fontSize: '0.65rem' }}>PUBLICLY VISIBLE</span>
                    ) : (
                      <span className="badge badge--red" style={{ fontSize: '0.65rem' }}>HIDDEN (DEACTIVATED)</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginTop: '0.35rem' }}>
                    Worker: {rev.workerName} • Client: {rev.customerName}
                  </h3>
                </div>

                <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Reported: {new Date(rev.reportedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Review Text */}
              <div style={{ background: '#FAFAFA', border: '1px solid var(--rule)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Client Submitted Review:
                </span>
                <p style={{ fontSize: '0.9rem', color: '#1F2937', fontStyle: 'italic' }}>
                  "{rev.comment}"
                </p>
              </div>

              {/* Flagged Reason Box */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.85rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Reported Reason for Violation:
                </span>
                <p style={{ fontSize: '0.85rem', color: '#991B1B' }}>
                  {rev.reportedReason}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--rule)', paddingTop: '0.75rem' }}>
                {rev.active ? (
                  <button
                    type="button"
                    className="button button--sm button--danger"
                    onClick={() => onModerate(rev.id, 'deactivate')}
                  >
                    DEACTIVATE & HIDE REVIEW
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--sm button--outline"
                    onClick={() => onModerate(rev.id, 'activate')}
                  >
                    RESTORE TO PUBLIC
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
