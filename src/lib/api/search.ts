import { api } from './client';
import type { WorkerSearchResponse, WorkerSearchParams } from '$lib/types/api';

export const searchApi = {
  searchWorkers: (params: WorkerSearchParams = {}) => {
    const queryParams: Record<string, string | number | boolean | string[] | undefined> = {};

    if (params.city) queryParams.city = params.city;
    if (params.state) queryParams.state = params.state;
    if (params.categoryId) queryParams.categoryId = params.categoryId;
    if (params.skillIds && params.skillIds.length > 0) queryParams.skillIds = params.skillIds;
    if (params.matchAnySkill !== undefined) queryParams.matchAnySkill = params.matchAnySkill;
    if (params.minRating !== undefined) queryParams.minRating = params.minRating;
    if (params.available !== undefined) queryParams.available = params.available;
    if (params.availableOn) queryParams.availableOn = params.availableOn;
    if (params.minExperience !== undefined) queryParams.minExperience = params.minExperience;
    if (params.maxExperience !== undefined) queryParams.maxExperience = params.maxExperience;
    if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
    if (params.verified !== undefined) queryParams.verified = params.verified;
    if (params.sort) queryParams.sort = params.sort;
    if (params.direction) queryParams.direction = params.direction;
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.size !== undefined) queryParams.size = params.size;

    return api.get<WorkerSearchResponse>('/search/workers', {
      params: queryParams,
      skipAuth: true
    });
  }
};
