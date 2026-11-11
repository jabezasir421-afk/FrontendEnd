import { describe, expect, it } from 'vitest';
import { serializeWorkerSearchParams } from '../src/lib/api/search';

describe('worker search query serialization', () => {
  it('preserves supported filters and repeated skill ids', () => {
    expect(
      serializeWorkerSearchParams({
        city: 'Bengaluru',
        categoryId: 'category-1',
        skillIds: ['skill-1', 'skill-2'],
        matchAnySkill: true,
        minRating: 4.5,
        minExperience: 3,
        maxExperience: 10,
        minPrice: 300,
        maxPrice: 900,
        verified: true,
        sort: 'rating',
        direction: 'desc',
        page: 0,
        size: 12
      })
    ).toEqual({
      city: 'Bengaluru',
      categoryId: 'category-1',
      skillIds: ['skill-1', 'skill-2'],
      matchAnySkill: true,
      minRating: 4.5,
      minExperience: 3,
      maxExperience: 10,
      minPrice: 300,
      maxPrice: 900,
      verified: true,
      sort: 'rating',
      direction: 'desc',
      page: 0,
      size: 12
    });
  });

  it('omits empty optional values without changing zero-based pagination', () => {
    expect(
      serializeWorkerSearchParams({
        city: '',
        page: 0,
        size: 50,
        verified: true
      })
    ).toEqual({ page: 0, size: 50, verified: true });
  });
});
