import { api } from './client';
import type {
  PublicWorkerResponse,
  PublicPortfolioResponse,
  AvailabilitySummaryResponse,
  AvailableSlotResponse,
  Page
} from '$lib/types/api';

export const workersApi = {
  getAll: (page = 0, size = 20, sort = 'createdAt', direction = 'desc') =>
    api.get<Page<PublicWorkerResponse>>('/workers', {
      params: { page, size, sort: `${sort},${direction}` },
      skipAuth: true
    }),

  getById: (id: string) =>
    api.get<PublicWorkerResponse>(`/workers/${id}`, { skipAuth: true }),

  getPublicAvailability: (id: string) =>
    api.get<AvailabilitySummaryResponse>(`/workers/${id}/availability`, { skipAuth: true }),

  getPublicSlots: (id: string, date: string) =>
    api.get<AvailableSlotResponse[]>(`/workers/${id}/availability/slots`, {
      params: { date },
      skipAuth: true
    }),

  getPublicPortfolio: (id: string) =>
    api.get<PublicPortfolioResponse>(`/workers/${id}/portfolio`, { skipAuth: true })
};
