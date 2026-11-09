import { api } from './client';
import type {
  ReviewResponse,
  ReviewStatsResponse,
  CreateReviewRequest,
  ReportReviewRequest,
  Page
} from '$lib/types/api';

export const reviewsApi = {
  create: (data: CreateReviewRequest) =>
    api.post<ReviewResponse>('/reviews', data),

  getWorkerReviews: (workerId: string, page = 0, size = 10, sort = 'createdAt', direction = 'desc') =>
    api.get<Page<ReviewResponse>>(`/reviews/worker/${workerId}`, {
      params: { page, size, sort: `${sort},${direction}` },
      skipAuth: true
    }),

  getById: (id: string) =>
    api.get<ReviewResponse>(`/reviews/${id}`, { skipAuth: true }),

  report: (id: string, data: ReportReviewRequest) =>
    api.post<void>(`/reviews/${id}/report`, data),

  getWorkerStats: (workerId: string) =>
    api.get<ReviewStatsResponse>(`/reviews/worker/${workerId}/stats`, { skipAuth: true })
};
