import { afterEach, describe, expect, it, vi } from 'vitest';
import { categoriesApi } from '../src/lib/api/categories';
import { skillsApi } from '../src/lib/api/skills';
import { ApiError } from '../src/lib/api/client';
import {
  buildWorkerSearchUrl,
  getActiveCategories,
  getActiveSkills,
  getCatalogErrorMessage,
  hasValidWorkerCatalogSelection
} from '../src/lib/api/catalog';
import type { CategoryResponse, Page, SkillResponse } from '../src/lib/types/api';

const category: CategoryResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Electrical',
  description: 'Electrical repair and installation',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const categoryWithNullDescription: CategoryResponse = {
  ...category,
  id: '550e8400-e29b-41d4-a716-446655440010',
  name: 'Plumbing',
  description: null
};

const inactiveCategory: CategoryResponse = { ...category, id: '550e8400-e29b-41d4-a716-446655440001', active: false };

const skill: SkillResponse = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Wiring',
  description: 'Electrical wiring',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const skillWithNullDescription: SkillResponse = {
  ...skill,
  id: '550e8400-e29b-41d4-a716-446655440020',
  name: 'Pipe Fitting',
  description: null
};

const inactiveSkill: SkillResponse = { ...skill, id: '550e8400-e29b-41d4-a716-446655440003', active: false };

function page<T>(content: T[]): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0
  };
}

function mockApiResponse(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true, message: 'OK', data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('public catalog APIs', () => {
  it('fetches paginated categories with sorting, no auth, and unwraps the API response', async () => {
    const fetchMock = mockApiResponse(page([category]));

    await expect(categoriesApi.getAll(2, 7, 'createdAt', 'desc')).resolves.toEqual(page([category]));

    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));
    const headers = requestInit?.headers as Headers;
    expect(url.pathname).toBe('/api/v1/categories');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('7');
    expect(url.searchParams.get('sort')).toBe('createdAt,desc');
    expect(headers.get('Authorization')).toBeNull();
  });

  it('fetches paginated categories using options object parameter syntax', async () => {
    const fetchMock = mockApiResponse(page([category]));

    await expect(
      categoriesApi.getAll({ page: 1, size: 20, sort: 'name', direction: 'desc' })
    ).resolves.toEqual(page([category]));

    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('size')).toBe('20');
    expect(url.searchParams.get('sort')).toBe('name,desc');
  });

  it('fetches paginated skills with sorting, no auth, and unwraps the API response', async () => {
    const fetchMock = mockApiResponse(page([skill]));

    await expect(skillsApi.getAll(3, 9, 'name', 'desc')).resolves.toEqual(page([skill]));

    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));
    const headers = requestInit?.headers as Headers;
    expect(url.pathname).toBe('/api/v1/skills');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('size')).toBe('9');
    expect(url.searchParams.get('sort')).toBe('name,desc');
    expect(headers.get('Authorization')).toBeNull();
  });

  it('fetches paginated skills using options object parameter syntax', async () => {
    const fetchMock = mockApiResponse(page([skill]));

    await expect(
      skillsApi.getAll({ page: 0, size: 50, sort: 'createdAt', direction: 'asc' })
    ).resolves.toEqual(page([skill]));

    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('size')).toBe('50');
    expect(url.searchParams.get('sort')).toBe('createdAt,asc');
  });

  it('fetches individual category and skill details without authentication', async () => {
    const fetchMock = mockApiResponse(category);
    await expect(categoriesApi.getById(category.id)).resolves.toEqual(category);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`/categories/${category.id}`);
    expect((fetchMock.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBeNull();

    const skillsFetchMock = mockApiResponse(skill);
    await expect(skillsApi.getById(skill.id)).resolves.toEqual(skill);
    expect(String(skillsFetchMock.mock.calls[0][0])).toContain(`/skills/${skill.id}`);
    expect((skillsFetchMock.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBeNull();
  });

  it('accepts items with null description matching backend nullable columns', async () => {
    mockApiResponse(page([categoryWithNullDescription]));
    const catPage = await categoriesApi.getAll();
    expect(catPage.content[0].description).toBeNull();

    mockApiResponse(categoryWithNullDescription);
    const catItem = await categoriesApi.getById(categoryWithNullDescription.id);
    expect(catItem.description).toBeNull();

    mockApiResponse(page([skillWithNullDescription]));
    const skillPage = await skillsApi.getAll();
    expect(skillPage.content[0].description).toBeNull();

    mockApiResponse(skillWithNullDescription);
    const skillItem = await skillsApi.getById(skillWithNullDescription.id);
    expect(skillItem.description).toBeNull();
  });

  it('preserves empty pages and rejects malformed response structures', async () => {
    mockApiResponse(page<CategoryResponse>([]));
    await expect(categoriesApi.getAll()).resolves.toMatchObject({ content: [], empty: true });

    mockApiResponse({ content: null });
    await expect(skillsApi.getAll()).rejects.toThrow('The skills API returned an unexpected response.');

    mockApiResponse({ id: category.id, name: category.name });
    await expect(categoriesApi.getById(category.id)).rejects.toThrow(
      'The categories API returned an unexpected response.'
    );
  });
});

describe('catalog integration helpers', () => {
  it('filters inactive catalog entries', () => {
    expect(getActiveCategories([category, inactiveCategory, categoryWithNullDescription])).toEqual([
      category,
      categoryWithNullDescription
    ]);
    expect(getActiveSkills([skill, inactiveSkill, skillWithNullDescription])).toEqual([
      skill,
      skillWithNullDescription
    ]);
  });

  it('builds worker discovery URLs with the selected category UUID and city', () => {
    const url = new URL(buildWorkerSearchUrl(' Bengaluru ', category.id), 'http://localhost');
    expect(url.pathname).toBe('/workers');
    expect(url.searchParams.get('city')).toBe('Bengaluru');
    expect(url.searchParams.get('categoryId')).toBe(category.id);
    expect(buildWorkerSearchUrl()).toBe('/workers');
    expect(buildWorkerSearchUrl('', category.id)).toBe(`/workers?categoryId=${category.id}`);
  });

  it('only accepts active categories and skills for worker registration', () => {
    expect(hasValidWorkerCatalogSelection([category], [skill], category.id, [skill.id])).toBe(true);
    expect(hasValidWorkerCatalogSelection([inactiveCategory], [skill], inactiveCategory.id, [skill.id])).toBe(false);
    expect(hasValidWorkerCatalogSelection([category], [inactiveSkill], category.id, [inactiveSkill.id])).toBe(false);
    expect(hasValidWorkerCatalogSelection([category], [skill], category.id, [skill.id, skill.id])).toBe(false);
    expect(hasValidWorkerCatalogSelection([category], [skill], category.id, [])).toBe(false);
    expect(hasValidWorkerCatalogSelection([category], [skill], 'non-existent-category-id', [skill.id])).toBe(false);
    expect(hasValidWorkerCatalogSelection([category], [skill], category.id, ['non-existent-skill-id'])).toBe(false);
  });

  it('provides actionable messages for HTTP and unexpected-response failures', () => {
    expect(getCatalogErrorMessage(new ApiError({ status: 400 }), 'categories')).toContain('request for categories was invalid');
    expect(getCatalogErrorMessage(new ApiError({ status: 401 }), 'categories')).toContain('server denied access');
    expect(getCatalogErrorMessage(new ApiError({ status: 403 }), 'categories')).toContain('server denied access');
    expect(getCatalogErrorMessage(new ApiError({ status: 404 }), 'skills')).toContain('endpoint was not found');
    expect(getCatalogErrorMessage(new ApiError({ status: 500 }), 'categories')).toContain('server could not load');
    expect(getCatalogErrorMessage(new ApiError({ status: 503 }), 'categories')).toContain('HTTP 503');
    expect(getCatalogErrorMessage(new Error('offline'), 'skills')).toContain('Check that the backend is running');
  });
});
