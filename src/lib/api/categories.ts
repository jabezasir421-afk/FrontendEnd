import { api } from './client';
import type { CategoryResponse, Page } from '$lib/types/api';

export const categoriesApi = {
  getAll: (page = 0, size = 50, sort = 'name', direction = 'asc') =>
    api.get<Page<CategoryResponse>>('/categories', {
      params: { page, size, sort: `${sort},${direction}` },
      skipAuth: true
    }),

  getById: (id: string) =>
    api.get<CategoryResponse>(`/categories/${id}`, { skipAuth: true })
};
