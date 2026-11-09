import { api } from './client';
import type { SkillResponse, Page } from '$lib/types/api';

export const skillsApi = {
  getAll: (page = 0, size = 100, sort = 'name', direction = 'asc') =>
    api.get<Page<SkillResponse>>('/skills', {
      params: { page, size, sort: `${sort},${direction}` },
      skipAuth: true
    }),

  getById: (id: string) =>
    api.get<SkillResponse>(`/skills/${id}`, { skipAuth: true })
};
