import React from 'react';
import { WorkerProfile } from '../types';

interface WorkerCardProps {
  worker: WorkerProfile;
  onViewDossier: (worker: WorkerProfile) => void;
  onBookNow: (worker: WorkerProfile) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onViewDossier, onBookNow }) => {
  return (
    <article className="swiss-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {worker.verified ? (
              <span className="badge badge--dark" title="Verified Trade License">
                VERIFIED
              </span>
            ) : (
              <span className="badge badge--gray" title="Pending Documentation Audit">
                UNAUDITED
              </span>
            )}

            {worker.available ? (
              <span className="badge" style={{ borderColor: '#16A34A', color: '#16A34A' }}>
                AVAILABLE
              </span>
            ) : (
              <span className="badge badge--gray">
                BOOKED
              </span>
            )}
          </div>

          <div className="mono-num" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {worker.hourlyRate.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>CHF/h</span>
          </div>
        </div>

        {/* Worker Name & Category */}
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          {worker.fullName}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
          {worker.categoryName}
        </p>

        {/* Location & Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <span>Canton {worker.primaryCity}</span>
          <span>•</span>
          <span className="mono-num">
            ★ <strong style={{ color: 'var(--black)' }}>{worker.averageRating.toFixed(1)}</strong> ({worker.reviewCount})
          </span>
          <span>•</span>
          <span className="mono-num">{worker.yearsOfExperience}y exp</span>
        </div>

        {/* Bio excerpt */}
        {worker.bio && (
          <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            {worker.bio}
          </p>
        )}

        {/* Skills Tag Cloud */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
          {worker.skillNames.slice(0, 3).map((skill, idx) => (
            <span 
              key={idx} 
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: 'var(--gray)',
                border: '1px solid var(--rule)',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {skill}
            </span>
          ))}
          {worker.skillNames.length > 3 && (
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', color: 'var(--text-muted)' }}>
              +{worker.skillNames.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <button
          type="button"
          className="button button--sm button--outline"
          onClick={() => onViewDossier(worker)}
        >
          DOSSIER
        </button>
        <button
          type="button"
          className="button button--sm"
          onClick={() => onBookNow(worker)}
        >
          BOOK SERVICE
        </button>
      </div>
    </article>
  );
};
