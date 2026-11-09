import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup localStorage and window mocks for Node environment
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
  key: () => null,
  length: 0
};

const dispatchEventMock = vi.fn();
globalThis.window = {
  localStorage: localStorageMock,
  dispatchEvent: dispatchEventMock
} as unknown as Window & typeof globalThis;
globalThis.localStorage = localStorageMock as unknown as Storage;

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  ApiError,
  apiClient,
  refreshAccessToken
} from '../src/lib/api/client';
import { authApi } from '../src/lib/api/auth';
import type { RegisterCustomerRequest, RegisterWorkerRequest } from '../src/lib/types/api';

describe('API Client & Authentication Contracts', () => {
  beforeEach(() => {
    localStorage.clear();
    dispatchEventMock.mockClear();
    vi.restoreAllMocks();
  });

  describe('Token Management & Storage', () => {
    it('stores and retrieves access and refresh tokens', () => {
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();

      setTokens('sample_access_token', 'sample_refresh_token');

      expect(getAccessToken()).toBe('sample_access_token');
      expect(getRefreshToken()).toBe('sample_refresh_token');

      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('ApiError correctly extracts message, status, and field errors', () => {
      const error = new ApiError({
        status: 400,
        message: 'Validation failed',
        fieldErrors: [{ field: 'phoneNumber', message: 'Invalid phone number' }]
      });

      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.fieldErrors).toHaveLength(1);
      expect(error.fieldErrors[0].field).toBe('phoneNumber');
    });

    it('injects Authorization Bearer header when token exists', async () => {
      setTokens('my-token', 'my-refresh');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Success', data: { id: 123 } })
      });
      globalThis.fetch = fetchMock;

      const result = await apiClient<{ id: number }>('/workers');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, requestInit] = fetchMock.mock.calls[0];
      const headers = requestInit?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer my-token');
      expect(headers.get('X-Correlation-ID')).toBeTruthy();
      expect(result).toEqual({ id: 123 });
    });

    it('skips Authorization header when skipAuth is true', async () => {
      setTokens('my-token', 'my-refresh');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Success', data: [] })
      });
      globalThis.fetch = fetchMock;

      await apiClient<unknown[]>('/categories', { skipAuth: true });

      const [, requestInit] = fetchMock.mock.calls[0];
      const headers = requestInit?.headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('Verified Backend Authentication Contracts', () => {
    it('executes login with identifier and password payload', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Login successful',
          data: {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiresIn: 900000,
            role: 'CUSTOMER',
            profileId: 'cust-123'
          }
        })
      });
      globalThis.fetch = fetchMock;

      const response = await authApi.login({
        identifier: 'user@example.com',
        password: 'Password@123'
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        identifier: 'user@example.com',
        password: 'Password@123'
      });
      // skipAuth: true means no Bearer header
      const headers = init.headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
      expect(response.accessToken).toBe('test-access-token');
      expect(response.role).toBe('CUSTOMER');
    });

    it('executes customer registration with exact Java DTO fields', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Customer registered successfully',
          data: {
            accessToken: 'cust-token',
            refreshToken: 'cust-refresh',
            expiresIn: 900000,
            role: 'CUSTOMER',
            profileId: 'profile-cust-1'
          }
        })
      });
      globalThis.fetch = fetchMock;

      const payload: RegisterCustomerRequest = {
        email: 'customer@example.com',
        phoneNumber: '9876543210',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const res = await authApi.registerCustomer(payload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/register/customer');
      expect(JSON.parse(init.body as string)).toEqual(payload);
      expect(res.role).toBe('CUSTOMER');
    });

    it('executes worker registration without unsupported primaryCity/primaryState fields', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Worker registered successfully',
          data: {
            accessToken: 'worker-token',
            refreshToken: 'worker-refresh',
            expiresIn: 900000,
            role: 'WORKER',
            profileId: 'worker-123'
          }
        })
      });
      globalThis.fetch = fetchMock;

      const payload: RegisterWorkerRequest = {
        email: 'worker@example.com',
        phoneNumber: '9876543210',
        password: 'Password@123',
        firstName: 'Ramesh',
        lastName: 'Kumar',
        gender: 'MALE',
        dateOfBirth: '1990-05-15',
        experienceYears: 5,
        bio: 'Skilled electrician with 5 years experience',
        hourlyRate: 400,
        categoryId: 'e305e55e-26f5-4dc2-82dc-831d1d8bb000',
        skillIds: ['048bc78c-396a-4d22-b5e2-45e0fb13a001']
      };

      const res = await authApi.registerWorker(payload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/register/worker');
      const body = JSON.parse(init.body as string);
      expect(body).toEqual(payload);
      expect(body).not.toHaveProperty('primaryCity');
      expect(body).not.toHaveProperty('primaryState');
      expect(res.role).toBe('WORKER');
    });

    it('retrieves current user from /auth/me with Bearer token', async () => {
      setTokens('valid-access-token', 'valid-refresh-token');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Current user fetched successfully',
          data: {
            userAccountId: 'user-acc-1',
            email: 'user@example.com',
            phoneNumber: '9876543210',
            role: 'CUSTOMER',
            customerId: 'cust-id-1',
            workerId: null
          }
        })
      });
      globalThis.fetch = fetchMock;

      const user = await authApi.getCurrentUser();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/me');
      const headers = init.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer valid-access-token');
      expect(user.email).toBe('user@example.com');
      expect(user.customerId).toBe('cust-id-1');
    });

    it('executes logout sending refreshToken in request body and Bearer header', async () => {
      setTokens('access-to-invalidate', 'refresh-to-invalidate');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Logout successful',
          data: null
        })
      });
      globalThis.fetch = fetchMock;

      await authApi.logout('refresh-to-invalidate');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/logout');
      const headers = init.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer access-to-invalidate');
      expect(JSON.parse(init.body as string)).toEqual({
        refreshToken: 'refresh-to-invalidate'
      });
    });
  });

  describe('Token Refresh & Concurrency Handling', () => {
    it('retries original request with new token on 401', async () => {
      setTokens('expired-access-token', 'active-refresh-token');

      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // 1st request -> returns 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 401,
          error: 'UNAUTHORIZED',
          message: 'JWT expired'
        })
      });

      // 2nd request: refresh -> returns new tokens
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Token refreshed',
          data: {
            accessToken: 'fresh-access-token',
            refreshToken: 'fresh-refresh-token'
          }
        })
      });

      // 3rd request: retried original request -> succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Success',
          data: { profile: 'data' }
        })
      });

      const result = await apiClient<{ profile: string }>('/customer/me');

      expect(result).toEqual({ profile: 'data' });
      expect(getAccessToken()).toBe('fresh-access-token');
      expect(getRefreshToken()).toBe('fresh-refresh-token');
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Verify the retried call used the new token
      const [, retryInit] = fetchMock.mock.calls[2];
      const retryHeaders = retryInit.headers as Headers;
      expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-access-token');
    });

    it('queues concurrent 401 requests, performs single refresh, and resolves all queued requests', async () => {
      setTokens('expired-token', 'active-refresh');

      let refreshCount = 0;
      const fetchMock = vi.fn().mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        const headers = new Headers(init?.headers);
        const auth = headers.get('Authorization');

        if (urlStr.includes('/auth/refresh')) {
          refreshCount++;
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              success: true,
              message: 'Refreshed',
              data: {
                accessToken: 'brand-new-access',
                refreshToken: 'brand-new-refresh'
              }
            })
          };
        }

        if (urlStr.includes('/resource-1')) {
          if (auth === 'Bearer brand-new-access') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => ({ success: true, message: 'OK', data: { endpoint: 1 } })
            };
          }
          return {
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ status: 401, message: 'Expired token' })
          };
        }

        if (urlStr.includes('/resource-2')) {
          if (auth === 'Bearer brand-new-access') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => ({ success: true, message: 'OK', data: { endpoint: 2 } })
            };
          }
          return {
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ status: 401, message: 'Expired token' })
          };
        }

        throw new Error(`Unexpected url: ${urlStr}`);
      });
      globalThis.fetch = fetchMock;

      // Launch both simultaneously
      const [res1, res2] = await Promise.all([
        apiClient<{ endpoint: number }>('/resource-1'),
        apiClient<{ endpoint: number }>('/resource-2')
      ]);

      expect(res1).toEqual({ endpoint: 1 });
      expect(res2).toEqual({ endpoint: 2 });
      expect(getAccessToken()).toBe('brand-new-access');
      expect(refreshCount).toBe(1);
    });

    it('rejects all queued subscribers and clears tokens when refresh fails', async () => {
      setTokens('expired-token', 'invalid-refresh');

      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // Two requests fail with 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Expired' })
      });
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Expired' })
      });

      // Refresh endpoint fails with 401 (invalid refresh token)
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Invalid refresh token' })
      });

      const promises = [
        apiClient('/endpoint-a'),
        apiClient('/endpoint-b')
      ];

      await expect(Promise.all(promises)).rejects.toThrow();

      // Ensure tokens were wiped
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(dispatchEventMock).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    it('never recursively triggers refresh if /auth/refresh returns 401', async () => {
      setTokens('token', 'bad-refresh');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Revoked refresh token' })
      });
      globalThis.fetch = fetchMock;

      await expect(
        apiClient('/auth/refresh', { method: 'POST', skipAuth: true })
      ).rejects.toThrow();

      // Only one fetch call was made — no recursive refresh loops
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries at most once and does not infinitely loop if retried request returns 401', async () => {
      setTokens('expired-token', 'valid-refresh');

      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // 1. Initial request -> 401
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Expired' })
      });

      // 2. Refresh call -> succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          message: 'Refreshed',
          data: { accessToken: 'new-token', refreshToken: 'new-refresh' }
        })
      });

      // 3. Retried request -> returns 401 again (e.g. account banned or permission revoked)
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 401, message: 'Account deactivated' })
      });

      await expect(apiClient('/resource')).rejects.toThrow();

      // Total calls must be exactly 3 (initial, refresh, retry). No 4th call!
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
