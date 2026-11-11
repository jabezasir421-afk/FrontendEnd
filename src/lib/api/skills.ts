import { api } from './client';
import { parseCatalogItem, parseCatalogPage, type CatalogQueryParams } from './catalog';
import type { SkillResponse, Page } from '$lib/types/api';

export const skillsApi = {
  getAll: async (
    pageOrParams: number | CatalogQueryParams = 0,
    size = 100,
    sort = 'name',
    direction: 'asc' | 'desc' = 'asc'
  ): Promise<Page<SkillResponse>> => {
    let page = 0;
    let actualSize = size;
    let actualSort = sort;
    let actualDirection = direction;

    if (typeof pageOrParams === 'object' && pageOrParams !== null) {
      page = pageOrParams.page ?? 0;
      actualSize = pageOrParams.size ?? 100;
      actualSort = pageOrParams.sort ?? 'name';
      actualDirection = pageOrParams.direction ?? 'asc';
    } else {
      page = pageOrParams;
    }

    const response = await api.get<unknown>('/skills', {
      params: { page, size: actualSize, sort: `${actualSort},${actualDirection}` },
      skipAuth: true
    });
    return parseCatalogPage<SkillResponse>(response, 'skills');
  },

  getById: async (id: string): Promise<SkillResponse> => {
    const response = await api.get<unknown>(`/skills/${id}`, { skipAuth: true });
    return parseCatalogItem<SkillResponse>(response, 'skills');
  }
};
