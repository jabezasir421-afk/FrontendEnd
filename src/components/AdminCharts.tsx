import React, { useState } from 'react';
import { 
  BookingsTrendItem, 
  CategoryDistributionItem, 
  RatingDistributionData, 
  TopWorkerItem 
} from '../types';

interface AdminChartsProps {
  trendData: BookingsTrendItem[];
  categoryData: CategoryDistributionItem[];
  ratingData: RatingDistributionData[];
  topWorkers: TopWorkerItem[];
  onRefreshSnapshot: () => void;
  refreshing: boolean;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({
  trendData,
  categoryData,
  ratingData,
  topWorkers,
  onRefreshSnapshot,
  refreshing,
}) => {
  const [hoveredTrend, setHoveredTrend] = useState<BookingsTrendItem | null>(null);

  // Calculate SVG dimensions for the trend chart
  const svgWidth = 700;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...trendData.map(d => Math.max(d.created, d.completed, d.count)), 70);

  const getX = (idx: number) => padding.left + (idx / (trendData.length - 1)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / maxVal) * graphHeight;

  // Build SVG path points for Completed Bookings
  const completedPoints = trendData.map((d, i) => `${getX(i)},${getY(d.completed)}`).join(' ');
  // Build SVG path points for Created Requests
  const createdPoints = trendData.map((d, i) => `${getX(i)},${getY(d.created)}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header with Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--black)', paddingBottom: '1rem' }}>
        <div>
          <span className="eyebrow" style={{ margin: 0 }}>
            SWISS MODERNISM 2.0 // QUANTITATIVE TELEMETRY
          </span>
          <h2 style={{ marginTop: '0.25rem' }}>
            Platform Analytics & Distribution Matrix
          </h2>
        </div>
        <button
          type="button"
          className="button button--sm"
          onClick={onRefreshSnapshot}
          disabled={refreshing}
        >
          {refreshing ? 'COMPUTING SNAPSHOT...' : '↻ REFRESH DATA SNAPSHOT'}
        </button>
      </div>

      {/* Row 1: 12-Column Grid with Trend Chart (Span 8) and Rating Distribution (Span 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {/* Trend Chart (Span 8) */}
        <div style={{ gridColumn: 'span 8' }} className="swiss-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '0.75rem', margin: 0 }}>FIGURE 1.1 // TIME-SERIES DISPATCH DYNAMICS</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
                Daily Booking Trajectory (14-Day Cycle)
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--black)', display: 'inline-block' }} />
                <span>CREATED DISPATCHES</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--red)', display: 'inline-block' }} />
                <span>COMPLETED & INVOICED</span>
              </div>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Daily dispatch trajectory showing 14-day booking creation and completion volume"
            >
              {/* Hairline Grid Lines (Y-Axis) */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padding.top + graphHeight * (1 - pct);
                const val = Math.round(maxVal * pct);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="var(--rule)"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontFamily="Helvetica Neue, Inter, sans-serif"
                      fill="var(--text-muted)"
                      className="mono-num"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Step / Line Path: Created Dispatches */}
              <polyline
                fill="none"
                stroke="var(--black)"
                strokeWidth="2"
                points={createdPoints}
              />

              {/* Step / Line Path: Completed Dispatches */}
              <polyline
                fill="none"
                stroke="var(--red)"
                strokeWidth="2"
                points={completedPoints}
              />

              {/* Data points & hover triggers */}
              {trendData.map((d, i) => {
                const cx = getX(i);
                const cyCompleted = getY(d.completed);
                const isHovered = hoveredTrend?.date === d.date;
                return (
                  <g 
                    key={d.date}
                    onMouseEnter={() => setHoveredTrend(d)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hairline vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={padding.top}
                        x2={cx}
                        y2={padding.top + graphHeight}
                        stroke="var(--red)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Black Square point for created */}
                    <rect
                      x={cx - 3}
                      y={getY(d.created) - 3}
                      width="6"
                      height="6"
                      fill="var(--black)"
                    />

                    {/* Red Square point for completed */}
                    <rect
                      x={cx - 3}
                      y={cyCompleted - 3}
                      width="6"
                      height="6"
                      fill="var(--red)"
                    />

                    {/* Date label at bottom */}
                    {i % 2 === 0 && (
                      <text
                        x={cx}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="Helvetica Neue, Inter, sans-serif"
                        fill="var(--text-muted)"
                        className="mono-num"
                      >
                        {d.date.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Telemetry Box */}
            <div style={{ height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--rule)', marginTop: '0.5rem', paddingTop: '0.25rem', fontSize: '0.8rem' }}>
              {hoveredTrend ? (
                <>
                  <span className="mono-num" style={{ fontWeight: 600 }}>
                    DATE: {hoveredTrend.date}
                  </span>
                  <span className="mono-num">
                    CREATED: <strong style={{ color: 'var(--black)' }}>{hoveredTrend.created}</strong>
                  </span>
                  <span className="mono-num">
                    COMPLETED: <strong style={{ color: 'var(--red)' }}>{hoveredTrend.completed}</strong>
                  </span>
                  <span className="mono-num">
                    CANCELLED: <strong>{hoveredTrend.cancelled}</strong>
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Hover over coordinate nodes for exact daily dispatch volume.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating Distribution Histogram (Span 4) */}
        <div style={{ gridColumn: 'span 4' }} className="swiss-card">
          <span className="eyebrow" style={{ fontSize: '0.75rem', margin: 0 }}>FIGURE 1.2 // QUALITY ASSURANCE</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            Rating Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {ratingData.map((item) => (
              <div key={item.stars}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>
                    ★ {item.stars}.0 Stars
                  </span>
                  <span className="mono-num" style={{ color: 'var(--text-muted)' }}>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                {/* Mathematical bar */}
                <div style={{ height: '10px', background: 'var(--gray)', border: '1px solid var(--black)', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${item.percentage}%`, 
                      background: item.stars >= 4 ? 'var(--black)' : 'var(--red)',
                      transition: 'width 200ms ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--rule)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL AUDITED RATINGS</span>
            <span className="mono-num" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {ratingData.reduce((acc, r) => acc + r.count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 12-Column Grid with Category Distribution (Span 6) and Top Workers (Span 6) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {/* Category Market Share Breakdown (Span 6) */}
        <div style={{ gridColumn: 'span 6' }} className="swiss-card">
          <span className="eyebrow" style={{ fontSize: '0.75rem', margin: 0 }}>FIGURE 2.1 // DISCIPLINE REVENUE DENSITY</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            Service Category Market Share
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryData.map((c) => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span className="mono-num" style={{ color: 'var(--text-muted)' }}>{c.count} jobs</span>
                    <span className="mono-num" style={{ fontWeight: 700 }}>{c.revenueCHF.toLocaleString()} CHF</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '8px', background: 'var(--gray)', border: '1px solid var(--rule)' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${c.percentage}%`, 
                        background: 'var(--black)' 
                      }} 
                    />
                  </div>
                  <span className="mono-num" style={{ fontSize: '0.75rem', width: '32px', textAlign: 'right', fontWeight: 600 }}>
                    {c.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Trade Specialists Leaderboard (Span 6) */}
        <div style={{ gridColumn: 'span 6' }} className="swiss-card">
          <span className="eyebrow" style={{ fontSize: '0.75rem', margin: 0 }}>FIGURE 2.2 // PERFORMANCE LEADERBOARD</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            Top Commissioned Specialists
          </h3>

          <table className="swiss-table" aria-label="Top Commissioned Specialists">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Rank</th>
                <th>Specialist</th>
                <th>Discipline</th>
                <th style={{ textAlign: 'right' }}>Jobs</th>
                <th style={{ textAlign: 'right' }}>Rating</th>
                <th style={{ textAlign: 'right' }}>Settled CHF</th>
              </tr>
            </thead>
            <tbody>
              {topWorkers.map((w) => (
                <tr key={w.workerId}>
                  <td className="mono-num" style={{ fontWeight: 700, color: w.rank === 1 ? 'var(--red)' : 'var(--black)' }}>
                    0{w.rank}
                  </td>
                  <td style={{ fontWeight: 600 }}>{w.fullName}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.categoryName}</td>
                  <td className="mono-num" style={{ textAlign: 'right' }}>{w.completedBookings}</td>
                  <td className="mono-num" style={{ textAlign: 'right' }}>★ {w.rating.toFixed(1)}</td>
                  <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                    {w.earningsCHF.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
