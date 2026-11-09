import { api } from './client';
import type {
  BookingResponse,
  BookingStatus,
  CreateBookingRequest,
  RejectBookingRequest,
  CancelBookingRequest,
  CompleteBookingRequest,
  RescheduleBookingRequest,
  Page
} from '$lib/types/api';

export const bookingsApi = {
  create: (data: CreateBookingRequest) =>
    api.post<BookingResponse>('/bookings', data),

  getCustomerBookings: (status?: BookingStatus, page = 0, size = 10, sort = 'createdAt', direction = 'desc') =>
    api.get<Page<BookingResponse>>('/bookings/customers/me', {
      params: {
        ...(status ? { status } : {}),
        page,
        size,
        sort: `${sort},${direction}`
      }
    }),

  getWorkerBookings: (status?: BookingStatus, page = 0, size = 10, sort = 'createdAt', direction = 'desc') =>
    api.get<Page<BookingResponse>>('/bookings/workers/me', {
      params: {
        ...(status ? { status } : {}),
        page,
        size,
        sort: `${sort},${direction}`
      }
    }),

  getById: (id: string) =>
    api.get<BookingResponse>(`/bookings/${id}`),

  accept: (id: string) =>
    api.put<BookingResponse>(`/bookings/${id}/accept`),

  start: (id: string) =>
    api.put<BookingResponse>(`/bookings/${id}/start`),

  reject: (id: string, data?: RejectBookingRequest) =>
    api.put<BookingResponse>(`/bookings/${id}/reject`, data || {}),

  cancel: (id: string, data: CancelBookingRequest) =>
    api.put<BookingResponse>(`/bookings/${id}/cancel`, data),

  complete: (id: string, data?: CompleteBookingRequest) =>
    api.put<BookingResponse>(`/bookings/${id}/complete`, data || {}),

  reschedule: (id: string, data: RescheduleBookingRequest) =>
    api.put<BookingResponse>(`/bookings/${id}/reschedule`, data)
};
