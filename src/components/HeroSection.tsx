import React from 'react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onPostRequestClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onPostRequestClick }) => {
  return (
    <section className="grid" aria-labelledby="hero-title">
      <div className="main">
        <span className="eyebrow">
          SWISS MODERNISM 2.0 // DIRECT TRADE INFRASTRUCTURE
        </span>
        <h1 id="hero-title">
          Precision trade craft.
          <br />
          Rational execution.
        </h1>
        <p className="lead" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          Direct verification and transparent booking of certified electricians, master carpenters, HVAC thermal engineers, and masonry craftsmen. Governed by objective metrics, strict DIN/ISO verification, and deterministic scheduling.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button"
            onClick={onExploreClick}
          >
            EXPLORE DIRECTORY (12-COL)
          </button>
          <button
            type="button"
            className="button button--outline"
            onClick={onPostRequestClick}
          >
            DISPATCH SERVICE ORDER
          </button>
        </div>

        {/* Modular Metrics Row */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '1.5rem', 
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--rule)'
          }}
        >
          <div>
            <div className="mono-num" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--black)' }}>
              100%
            </div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              VERIFIED CREDENTIALS
            </div>
          </div>
          <div>
            <div className="mono-num" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--black)' }}>
              &lt; 15 MIN
            </div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              DISPATCH CONFIRMATION
            </div>
          </div>
          <div>
            <div className="mono-num" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--black)' }}>
              4.92 / 5.0
            </div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              AUDITED QUALITY RATING
            </div>
          </div>
        </div>
      </div>

      <div className="aside">
        <div className="swiss-card swiss-card--gray" style={{ padding: '2rem' }}>
          <span className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            REGULATORY DISCIPLINE
          </span>
          <h3 style={{ marginBottom: '1rem' }}>
            System Standard
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            All tradespeople registered on BlueCollar operate under strict state trade registries, third-party liability coverage, and verified digital identity documents.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Canton Coverage</span>
              <span className="mono-num" style={{ fontSize: '0.85rem' }}>ZH, BS, BE, GE, LU</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Trades</span>
              <span className="mono-num" style={{ fontSize: '0.85rem' }}>6 Categories</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Verification Protocol</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--red)', fontWeight: 600 }}>ISO 9001 / DIN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pricing Standard</span>
              <span className="mono-num" style={{ fontSize: '0.85rem' }}>Fixed CHF/hr</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
