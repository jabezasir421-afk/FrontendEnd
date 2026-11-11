import { ApiError } from './client';
import type { CategoryResponse, Page, SkillResponse } from '$lib/types/api';

export interface CatalogQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

type CatalogItem = CategoryResponse | SkillResponse;

export class CatalogResponseError extends Error {
  constructor(resource: string) {
    super(`The ${resource} API returned an unexpected response.`);
    this.name = 'CatalogResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCatalogItem(value: unknown): value is CatalogItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.description === null || typeof value.description === 'string' || value.description === undefined) &&
    typeof value.active === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function parseCatalogPage<T extends CatalogItem>(
  value: unknown,
  resource: string
): Page<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !value.content.every(isCatalogItem) ||
    typeof value.totalElements !== 'number' ||
    typeof value.totalPages !== 'number' ||
    typeof value.size !== 'number' ||
    typeof value.number !== 'number' ||
    typeof value.first !== 'boolean' ||
    typeof value.last !== 'boolean' ||
    typeof value.empty !== 'boolean'
  ) {
    throw new CatalogResponseError(resource);
  }

  return value as unknown as Page<T>;
}

export function parseCatalogItem<T extends CatalogItem>(value: unknown, resource: string): T {
  if (!isCatalogItem(value)) {
    throw new CatalogResponseError(resource);
  }

  return value as T;
}

export function getCatalogErrorMessage(error: unknown, resource: string): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return `The request for ${resource} was invalid. Please try again.`;
      case 401:
      case 403:
        return `${resource} are public, but the server denied access. Please check the backend configuration.`;
      case 404:
        return `The ${resource} endpoint was not found. Please check the backend API.`;
      case 500:
        return `The server could not load ${resource}. Please try again shortly.`;
      default:
        return `Could not load ${resource} (HTTP ${error.status}). Please try again.`;
    }
  }

  if (error instanceof CatalogResponseError) {
    return error.message;
  }

  return `Could not connect to the server to load ${resource}. Check that the backend is running and try again.`;
}

export const catalogQueryKeys = {
  categories: (page = 0, size = 100, sort = 'name', direction = 'asc') =>
    ['categories', { page, size, sort, direction }] as const,
  skills: (page = 0, size = 100, sort = 'name', direction = 'asc') =>
    ['skills', { page, size, sort, direction }] as const
};

export function getActiveCategories(categories: readonly CategoryResponse[] = []): CategoryResponse[] {
  return categories.filter((category) => category.active);
}

export function getActiveSkills(skills: readonly SkillResponse[] = []): SkillResponse[] {
  return skills.filter((skill) => skill.active);
}

export function buildWorkerSearchUrl(city = '', categoryId = ''): string {
  const params = new URLSearchParams();
  if (city.trim()) params.set('city', city.trim());
  if (categoryId) params.set('categoryId', categoryId);
  const query = params.toString();
  return query ? `/workers?${query}` : '/workers';
}

export function hasValidWorkerCatalogSelection(
  categories: readonly CategoryResponse[],
  skills: readonly SkillResponse[],
  categoryId: string,
  skillIds: readonly string[]
): boolean {
  const validCategory = categories.some((category) => category.active && category.id === categoryId);
  const validSkillIds = new Set(skills.filter((skill) => skill.active).map((skill) => skill.id));
  const uniqueSkillIds = new Set(skillIds);

  return (
    validCategory &&
    skillIds.length > 0 &&
    uniqueSkillIds.size === skillIds.length &&
    skillIds.every((id) => validSkillIds.has(id))
  );
}
