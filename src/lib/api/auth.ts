import { api } from './client';
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterCustomerRequest,
  RegisterWorkerRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest
} from '$lib/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data, { skipAuth: true }),

  registerCustomer: (data: RegisterCustomerRequest) =>
    api.post<AuthResponse>('/auth/register/customer', data, { skipAuth: true }),

  registerWorker: (data: RegisterWorkerRequest) =>
    api.post<AuthResponse>('/auth/register/worker', data, { skipAuth: true }),

  refresh: (data: RefreshTokenRequest) =>
    api.post<AuthResponse>('/auth/refresh', data, { skipAuth: true }),

  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }),

  getCurrentUser: () =>
    api.get<CurrentUserResponse>('/auth/me'),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<void>('/auth/forgot-password', data, { skipAuth: true }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>('/auth/reset-password', data, { skipAuth: true }),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<void>('/auth/change-password', data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<void>('/auth/email/verify', data, { skipAuth: true }),

  resendVerificationEmail: (data: ResendVerificationEmailRequest) =>
    api.post<void>('/auth/email/resend', data, { skipAuth: true })
};
