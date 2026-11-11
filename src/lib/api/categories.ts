import { api } from './client';
import { parseCatalogItem, parseCatalogPage, type CatalogQueryParams } from './catalog';
import type { CategoryResponse, Page } from '$lib/types/api';

export const categoriesApi = {
  getAll: async (
    pageOrParams: number | CatalogQueryParams = 0,
    size = 50,
    sort = 'name',
    direction: 'asc' | 'desc' = 'asc'
  ): Promise<Page<CategoryResponse>> => {
    let page = 0;
    let actualSize = size;
    let actualSort = sort;
    let actualDirection = direction;

    if (typeof pageOrParams === 'object' && pageOrParams !== null) {
      page = pageOrParams.page ?? 0;
      actualSize = pageOrParams.size ?? 50;
      actualSort = pageOrParams.sort ?? 'name';
      actualDirection = pageOrParams.direction ?? 'asc';
    } else {
      page = pageOrParams;
    }

    const response = await api.get<unknown>('/categories', {
      params: { page, size: actualSize, sort: `${actualSort},${actualDirection}` },
      skipAuth: true
    });
    return parseCatalogPage<CategoryResponse>(response, 'categories');
  },

  getById: async (id: string): Promise<CategoryResponse> => {
    const response = await api.get<unknown>(`/categories/${id}`, { skipAuth: true });
    return parseCatalogItem<CategoryResponse>(response, 'categories');
  }
};
