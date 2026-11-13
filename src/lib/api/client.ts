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

/**
 * Token Storage Security Architecture & Trade-offs:
 * 
 * In this single-page application (SPA), authentication tokens (JWT access and refresh tokens)
 * are stored in memory with client persistence in `localStorage`.
 * 
 * Trade-offs:
 * - LocalStorage Persistence: Allows session continuity across browser reloads and navigation
 *   without requiring server-side session cookies.
 * - XSS Vulnerability: Because localStorage is accessible to JavaScript running in the application's
 *   origin, any Cross-Site Scripting (XSS) vulnerability could potentially read stored tokens.
 * - Alternative (HttpOnly SameSite Cookies): Offers superior defense against XSS token exfiltration,
 *   but requires the backend Spring Boot service to issue Set-Cookie headers on /auth/login and
 *   /auth/refresh, read tokens from cookies in its JwtAuthenticationFilter, and implement CSRF mitigation.
 * - Current backend contract: Spring Boot exposes stateless REST endpoints returning JWTs in the
 *   response body and requiring `Authorization: Bearer <accessToken>` in request headers. Client-side
 *   token storage is therefore necessary to interact with the verified backend API.
 */
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

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: RefreshSubscriber[] = [];

function onRefreshed(token: string) {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];
  subscribers.forEach((sub) => {
    try {
      sub.resolve(token);
    } catch {
      // Ignored
    }
  });
}

function onRefreshFailed(error: Error) {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];
  subscribers.forEach((sub) => {
    try {
      sub.reject(error);
    } catch {
      // Ignored
    }
  });
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  const baseUrl = import.meta.env.PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null;
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null | (string | number)[]>;
  skipAuth?: boolean;
  _retry?: boolean;
  responseType?: 'json' | 'blob' | 'text';
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
  let requestBody = options.body;
  if (requestBody && typeof requestBody === 'object' && !(requestBody instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(requestBody);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
    body: requestBody
  });

  // Handle 401 Unauthorized -> Refresh Token Flow
  const isAuthEndpoint = cleanEndpoint.startsWith('/auth/refresh') || cleanEndpoint.startsWith('/auth/login');
  const canAttemptRefresh =
    response.status === 401 &&
    !options.skipAuth &&
    !options._retry &&
    !isAuthEndpoint &&
    !!getRefreshToken();

  if (canAttemptRefresh) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          onRefreshed(newToken);
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url.toString(), {
            ...options,
            headers,
            body: requestBody,
            _retry: true
          } as RequestOptions);
          return handleResponse<T>(retryResponse, options.responseType);
        } else {
          const refreshErr = new ApiError({
            status: 401,
            error: 'UNAUTHORIZED',
            message: 'Session expired. Please log in again.'
          });
          onRefreshFailed(refreshErr);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
          throw refreshErr;
        }
      } catch (err) {
        const errorToThrow = err instanceof Error ? err : new Error(String(err));
        onRefreshFailed(errorToThrow);
        throw errorToThrow;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Refresh in flight: queue request until resolved or rejected
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push({
          resolve: async (newToken: string) => {
            try {
              headers.set('Authorization', `Bearer ${newToken}`);
              const retryResponse = await fetch(url.toString(), {
                ...options,
                headers,
                body: requestBody,
                _retry: true
              } as RequestOptions);
              resolve(await handleResponse<T>(retryResponse, options.responseType));
            } catch (err) {
              reject(err);
            }
          },
          reject: (err: Error) => {
            reject(err);
          }
        });
      });
    }
  }

  return handleResponse<T>(response, options.responseType);
}

async function handleResponse<T>(response: Response, responseType: 'json' | 'blob' | 'text' = 'json'): Promise<T> {
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

  if (responseType === 'blob') {
    return (await response.blob()) as unknown as T;
  }

  if (isJson) {
    const json: ApiResponse<T> = await response.json();
    if (json && typeof json === 'object' && 'success' in json && !json.success) {
      throw new ApiError({
        status: response.status,
        message: json.message || 'Operation failed'
      });
    }
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
    }),

  getBlob: (endpoint: string, options?: RequestOptions) =>
    apiClient<Blob>(endpoint, { ...options, method: 'GET', responseType: 'blob' })
};
