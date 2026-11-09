import { api } from './client';
import type {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest
} from '$lib/types/api';

export const addressesApi = {
  create: (data: CreateAddressRequest) =>
    api.post<AddressResponse>('/customers/me/addresses', data),

  getAll: () =>
    api.get<AddressResponse[]>('/customers/me/addresses'),

  getById: (id: string) =>
    api.get<AddressResponse>(`/customers/me/addresses/${id}`),

  update: (id: string, data: UpdateAddressRequest) =>
    api.put<AddressResponse>(`/customers/me/addresses/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/customers/me/addresses/${id}`),

  setDefault: (id: string) =>
    api.put<AddressResponse>(`/customers/me/addresses/${id}/default`)
};
