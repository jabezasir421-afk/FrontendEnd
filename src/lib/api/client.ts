import type { ApiResponse, ErrorResponse } from '$lib/types/api';

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  public status: number;
  public error: string;
  public fieldErrors: { field: string; message: string }[];
  public path?: string;

  constructor(errorResponse: Partial<ErrorResponse>, fallbackMessage = 'An unexpected error occurred') {
    super(errorResponse.message || fallbackMessage);
    this.name = 'ApiError';
    this.status = errorResponse.status || 500;
    this.error = errorResponse.error || 'API_ERROR';
    this.fieldErrors = errorResponse.fieldErrors || [];
    this.path = errorResponse.path;
  }
}

// In-memory token management with localStorage sync
const TOKEN_KEY = 'bc_access_token';
const REFRESH_TOKEN_KEY = 'bc_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
    if (data.success && data.data?.accessToken) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }
    clearTokens();
    return null;
  } catch {
    clearTokens();
    return null;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null | (string | number)[]>;
  skipAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Build URL with query parameters
  const url = new URL(`${baseUrl}${cleanEndpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = getAccessToken();
  if (token && !options.skipAuth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject unique correlation id
  if (!headers.has('X-Correlation-ID')) {
    headers.set('X-Correlation-ID', `fe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  }

  // Handle body
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers
  });

  // Handle 401 Unauthorized -> Refresh Token Flow
  if (response.status === 401 && !options.skipAuth && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        const retryResponse = await fetch(url.toString(), {
          ...options,
          headers
        });
        return handleResponse<T>(retryResponse);
      } else {
        // Refresh failed, emit auth state change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    } else {
      // Queue until refresh finishes
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async (newToken: string) => {
          try {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(url.toString(), {
              ...options,
              headers
            });
            resolve(await handleResponse<T>(retryResponse));
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      try {
        const errorData: ErrorResponse = await response.json();
        throw new ApiError(errorData);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError({
          status: response.status,
          message: `HTTP Error ${response.status}: ${response.statusText}`
        });
      }
    } else {
      const text = await response.text();
      throw new ApiError({
        status: response.status,
        message: text || `HTTP Error ${response.status}: ${response.statusText}`
      });
    }
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  if (isJson) {
    const json: ApiResponse<T> = await response.json();
    return json.data;
  }

  return (await response.text()) as unknown as T;
}

// Convenience REST helpers
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body as BodyInit
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as BodyInit
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body as BodyInit
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData
    })
};
