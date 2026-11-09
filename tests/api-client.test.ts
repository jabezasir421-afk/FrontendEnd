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

// Mock window for tests
globalThis.window = {
  localStorage: localStorageMock,
  dispatchEvent: vi.fn()
} as unknown as Window & typeof globalThis;
globalThis.localStorage = localStorageMock as unknown as Storage;

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  ApiError,
  apiClient
} from '../src/lib/api/client';

describe('API Client & Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

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
