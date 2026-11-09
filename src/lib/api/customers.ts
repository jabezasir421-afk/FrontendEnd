import { api } from './client';
import type {
  CustomerResponse,
  UpdateCustomerRequest,
  UpdateProfilePhotoRequest
} from '$lib/types/api';

export const customersApi = {
  getMyProfile: () =>
    api.get<CustomerResponse>('/customers/me'),

  updateMyProfile: (data: UpdateCustomerRequest) =>
    api.put<CustomerResponse>('/customers/me', data),

  updateProfilePhoto: (data: UpdateProfilePhotoRequest) =>
    api.put<CustomerResponse>('/customers/me/profile-photo', data)
};
