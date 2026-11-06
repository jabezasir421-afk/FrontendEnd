import React from 'react';
import { Category } from '../types';

interface SearchFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  verifiedOnly: boolean;
  onToggleVerified: (v: boolean) => void;
  availableOnly: boolean;
  onToggleAvailable: (a: boolean) => void;
  maxHourlyRate: number;
  onChangeMaxHourlyRate: (val: number) => void;
  minRating: number;
  onChangeMinRating: (val: number) => void;
  onResetFilters: () => void;
  totalResults: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedCity,
  onSelectCity,
  verifiedOnly,
  onToggleVerified,
  availableOnly,
  onToggleAvailable,
  maxHourlyRate,
  onChangeMaxHourlyRate,
  minRating,
  onChangeMinRating,
  onResetFilters,
  totalResults,
}) => {
  const cities = ['All Cantons', 'Zurich', 'Basel', 'Bern', 'Geneva', 'Lucerne'];

  return (
    <div 
      style={{ 
        borderTop: '1px solid var(--black)', 
        borderBottom: '1px solid var(--black)',
        background: 'var(--white)',
        padding: '1.5rem 2rem',
        maxWidth: '72rem',
        margin: '0 auto',
      }}
      role="search"
      aria-label="Worker Directory Filtering Toolbar"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span className="eyebrow" style={{ margin: 0 }}>
            INDEX FILTER 2.0
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong className="mono-num" style={{ color: 'var(--black)' }}>{totalResults}</strong> certified tradespeople
          </span>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.8rem',
            textDecoration: 'underline',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          RESET TO DEFAULT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem', alignItems: 'end' }}>
        {/* Category Selector */}
        <div style={{ gridColumn: 'span 4' }}>
          <label htmlFor="category-select" className="form-label">
            Service Discipline
          </label>
          <select
            id="category-select"
            className="select"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
          >
            <option value="">All Categories (6 Active)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Canton / City Selector */}
        <div style={{ gridColumn: 'span 3' }}>
          <label htmlFor="city-select" className="form-label">
            Canton / Region
          </label>
          <select
            id="city-select"
            className="select"
            value={selectedCity}
            onChange={(e) => onSelectCity(e.target.value)}
          >
            {cities.map((city) => (
              <option key={city} value={city === 'All Cantons' ? '' : city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Max Hourly Rate */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label htmlFor="price-range" className="form-label" style={{ margin: 0 }}>
              Max Rate
            </label>
            <span className="mono-num" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {maxHourlyRate} CHF/h
            </span>
          </div>
          <input
            id="price-range"
            type="range"
            min="60"
            max="150"
            step="5"
            value={maxHourlyRate}
            onChange={(e) => onChangeMaxHourlyRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }}
          />
        </div>

        {/* Min Rating Filter */}
        <div style={{ gridColumn: 'span 1' }}>
          <label htmlFor="rating-select" className="form-label">
            Rating
          </label>
          <select
            id="rating-select"
            className="select"
            value={minRating}
            onChange={(e) => onChangeMinRating(Number(e.target.value))}
          >
            <option value="0">Any</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </div>

        {/* Toggles */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => onToggleVerified(e.target.checked)}
              style={{ accentColor: 'var(--red)', width: '16px', height: '16px' }}
            />
            VERIFIED ONLY
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => onToggleAvailable(e.target.checked)}
              style={{ accentColor: 'var(--red)', width: '16px', height: '16px' }}
            />
            AVAILABLE NOW
          </label>
        </div>
      </div>
    </div>
  );
};
