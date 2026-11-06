import React from 'react';

interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ height = '1.25rem', width = '100%', style, className = 'pulse-skeleton' }) => {
  return (
    <div
      className={className}
      style={{
        height,
        width,
        background: '#ECECEC',
        border: '1px solid var(--rule)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const WorkerCardSkeleton: React.FC = () => {
  return (
    <div className="swiss-card" style={{ height: '360px', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <Skeleton width="110px" height="24px" />
          <Skeleton width="80px" height="24px" />
        </div>
        <Skeleton width="75%" height="28px" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="45%" height="18px" style={{ marginBottom: '1.25rem' }} />
        <Skeleton width="90%" height="16px" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="100%" height="45px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton width="60px" height="22px" />
          <Skeleton width="75px" height="22px" />
          <Skeleton width="55px" height="22px" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
        <Skeleton height="36px" />
        <Skeleton height="36px" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '1rem' }}>
          <Skeleton height="18px" width={i === 0 ? '70%' : '50%'} />
        </td>
      ))}
    </tr>
  );
};
