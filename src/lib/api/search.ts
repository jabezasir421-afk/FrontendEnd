import { api } from './client';
import type { WorkerSearchResponse, WorkerSearchParams } from '$lib/types/api';

export function serializeWorkerSearchParams(params: WorkerSearchParams = {}) {
  const queryParams: Record<string, string | number | boolean | string[] | undefined> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = value as string | number | boolean | string[];
    }
  }

  return queryParams;
}

export const searchApi = {
  searchWorkers: (params: WorkerSearchParams = {}) => {
    return api.get<WorkerSearchResponse>('/search/workers', {
      params: serializeWorkerSearchParams(params),
      skipAuth: true
    });
  }
};
