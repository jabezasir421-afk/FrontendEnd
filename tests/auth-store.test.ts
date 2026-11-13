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
  dispatchEvent: dispatchEventMock,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as unknown as Window & typeof globalThis;
globalThis.localStorage = localStorageMock as unknown as Storage;

import { authStore } from '../src/lib/stores/auth.svelte';
import { authApi } from '../src/lib/api/auth';
import { ApiError, setTokens, getAccessToken, getRefreshToken } from '../src/lib/api/client';
import type { CurrentUserResponse } from '../src/lib/types/api';

// Helper to create valid JWT token string with claims
function createMockJwt(claims: { sub: string; email: string; role: string; exp?: number }): string {
  const encodeBase64Url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = encodeBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeBase64Url(claims);
  return `${header}.${payload}.mock-signature`;
}

describe('AuthStore Session Invalidation & Resilience', () => {
  const mockCustomerUser: CurrentUserResponse = {
    userAccountId: 'acc-uuid-1',
    email: 'customer@example.com',
    phoneNumber: '9876543210',
    role: 'CUSTOMER',
    customerId: 'cust-uuid-1',
    workerId: null
  };

  const sampleToken = createMockJwt({
    sub: 'acc-uuid-1',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    exp: Math.floor(Date.now() / 1000) + 3600
  });

  beforeEach(() => {
    localStorage.clear();
    dispatchEventMock.mockClear();
    vi.restoreAllMocks();
    // Reset authStore state between tests
    (authStore as unknown as { clearSession: () => void }).clearSession();
    (authStore as unknown as { isInitialized: boolean }).isInitialized = false;
    (authStore as unknown as { isLoading: boolean }).isLoading = true;
  });

  it('HTTP 200: init() successfully populates user and role from getCurrentUser()', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockCustomerUser);

    await authStore.init();

    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.user).toEqual(mockCustomerUser);
    expect(authStore.role).toBe('CUSTOMER');
    expect(authStore.token).toBe(sampleToken);
    expect(getAccessToken()).toBe(sampleToken);
    expect(getRefreshToken()).toBe('valid-refresh-token');
  });

  it('HTTP 401: init() clears invalid session when token is rejected with 401 Unauthorized', async () => {
    setTokens(sampleToken, 'invalid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(
      new ApiError({ status: 401, error: 'UNAUTHORIZED', message: 'Token expired' })
    );

    await authStore.init();

    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.user).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('HTTP 403: init() does NOT clear tokens when receiving 403 Forbidden', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(
      new ApiError({ status: 403, error: 'FORBIDDEN', message: 'Access denied' })
    );

    await authStore.init();

    // Tokens must be retained
    expect(authStore.token).toBe(sampleToken);
    expect(getAccessToken()).toBe(sampleToken);
    expect(getRefreshToken()).toBe('valid-refresh-token');
  });

  it('HTTP 429: init() does NOT clear tokens when backend rate limit is encountered', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(
      new ApiError({ status: 429, error: 'TOO_MANY_REQUESTS', message: 'Too many requests' })
    );

    await authStore.init();

    // Tokens must be retained despite rate limiting
    expect(authStore.token).toBe(sampleToken);
    expect(getAccessToken()).toBe(sampleToken);
    expect(getRefreshToken()).toBe('valid-refresh-token');
  });

  it('HTTP 5xx: init() does NOT clear tokens when backend returns 500 or 503 server error', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(
      new ApiError({ status: 503, error: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' })
    );

    await authStore.init();

    // Tokens must be retained during server outage
    expect(authStore.token).toBe(sampleToken);
    expect(getAccessToken()).toBe(sampleToken);
    expect(getRefreshToken()).toBe('valid-refresh-token');
  });

  it('Network failure: init() does NOT clear tokens and permits subsequent retry', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    const getCurrentUserSpy = vi.spyOn(authApi, 'getCurrentUser');

    // First attempt fails with network drop
    getCurrentUserSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await authStore.init();

    // Tokens must be retained
    expect(authStore.token).toBe(sampleToken);
    expect(getAccessToken()).toBe(sampleToken);
    expect(getRefreshToken()).toBe('valid-refresh-token');

    // Network recovers: retry succeeds
    getCurrentUserSpy.mockResolvedValueOnce(mockCustomerUser);

    await authStore.init();

    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.user).toEqual(mockCustomerUser);
    expect(authStore.role).toBe('CUSTOMER');
  });

  it('refreshUser(): retains tokens on 429, 5xx, or network failure, only clearing on 401', async () => {
    setTokens(sampleToken, 'valid-refresh-token');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValueOnce(mockCustomerUser);

    await authStore.init();
    expect(authStore.isAuthenticated).toBe(true);

    // Simulated 429 during background user refresh
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(
      new ApiError({ status: 429, error: 'TOO_MANY_REQUESTS', message: 'Too many requests' })
    );
    await authStore.refreshUser();
    expect(getAccessToken()).toBe(sampleToken);
    expect(authStore.token).toBe(sampleToken);

    // Simulated 500 during refresh
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(
      new ApiError({ status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Server error' })
    );
    await authStore.refreshUser();
    expect(getAccessToken()).toBe(sampleToken);
    expect(authStore.token).toBe(sampleToken);

    // Simulated 401: session is now genuinely expired
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(
      new ApiError({ status: 401, error: 'UNAUTHORIZED', message: 'Session revoked' })
    );
    await authStore.refreshUser();
    expect(getAccessToken()).toBeNull();
    expect(authStore.token).toBeNull();
  });

  describe('Concurrency & Stale Session Protection', () => {
    it('Concurrent init(): two concurrent init() calls produce exactly one getCurrentUser() request and both resolve to same outcome', async () => {
      setTokens(sampleToken, 'valid-refresh-token');
      let resolveCurrentUser!: (user: CurrentUserResponse) => void;
      const pendingPromise = new Promise<CurrentUserResponse>((res) => {
        resolveCurrentUser = res;
      });
      const spy = vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => pendingPromise);

      // Call init twice concurrently
      const p1 = authStore.init();
      const p2 = authStore.init();

      // Verify exactly one in-flight request was initiated
      expect(spy).toHaveBeenCalledTimes(1);

      // Resolve the single request
      resolveCurrentUser(mockCustomerUser);
      await Promise.all([p1, p2]);

      // Both callers saw the same outcome
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.user).toEqual(mockCustomerUser);
      expect(authStore.role).toBe('CUSTOMER');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Transient failure: clears initPromise upon settling and allows subsequent retry', async () => {
      setTokens(sampleToken, 'valid-refresh-token');
      const spy = vi.spyOn(authApi, 'getCurrentUser');

      // First attempt fails with 429
      spy.mockRejectedValueOnce(
        new ApiError({ status: 429, error: 'TOO_MANY_REQUESTS', message: 'Rate limit' })
      );

      await authStore.init();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(authStore.token).toBe(sampleToken);
      expect(getAccessToken()).toBe(sampleToken);

      // initPromise is now cleared. Subsequent attempt must execute a fresh request
      spy.mockResolvedValueOnce(mockCustomerUser);
      await authStore.init();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.user).toEqual(mockCustomerUser);
    });

    it('Stale session protection: a slow T1 response cannot overwrite a newer T2 login', async () => {
      const tokenT1 = sampleToken;
      const userT1: CurrentUserResponse = {
        ...mockCustomerUser,
        userAccountId: 'user-T1',
        email: 'userT1@example.com'
      };

      const tokenT2 = createMockJwt({
        sub: 'user-T2',
        email: 'userT2@example.com',
        role: 'WORKER',
        exp: Math.floor(Date.now() / 1000) + 7200
      });
      const userT2: CurrentUserResponse = {
        userAccountId: 'user-T2',
        email: 'userT2@example.com',
        phoneNumber: '9100000000',
        role: 'WORKER',
        customerId: null,
        workerId: 'worker-uuid-2'
      };

      setTokens(tokenT1, 'refresh-T1');

      let resolveT1!: (u: CurrentUserResponse) => void;
      const t1Promise = new Promise<CurrentUserResponse>((res) => {
        resolveT1 = res;
      });

      const spy = vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => t1Promise);

      // 1. init() starts using token T1
      const initT1 = authStore.init();
      expect(spy).toHaveBeenCalledTimes(1);

      // 2. A new login establishes token T2
      vi.spyOn(authApi, 'login').mockResolvedValueOnce({
        accessToken: tokenT2,
        refreshToken: 'refresh-T2',
        expiresIn: 900000,
        role: 'WORKER',
        profileId: 'worker-uuid-2'
      });
      spy.mockResolvedValueOnce(userT2);

      await authStore.login({ identifier: 'userT2@example.com', password: 'Password@123' });

      expect(authStore.token).toBe(tokenT2);
      expect(authStore.role).toBe('WORKER');
      expect(authStore.user).toEqual(userT2);

      // 3. The old T1 request completes
      resolveT1(userT1);
      await initT1;

      // 4. Stale T1 response must NOT overwrite newer T2 session data
      expect(authStore.token).toBe(tokenT2);
      expect(authStore.role).toBe('WORKER');
      expect(authStore.user).toEqual(userT2);
      expect(getAccessToken()).toBe(tokenT2);
      expect(getRefreshToken()).toBe('refresh-T2');
    });

    it('Stale failure protection: a slow T1 401 failure cannot clear a newer T2 session', async () => {
      const tokenT1 = sampleToken;
      const tokenT2 = createMockJwt({
        sub: 'user-T2',
        email: 'userT2@example.com',
        role: 'CUSTOMER',
        exp: Math.floor(Date.now() / 1000) + 7200
      });
      const userT2: CurrentUserResponse = {
        userAccountId: 'user-T2',
        email: 'userT2@example.com',
        phoneNumber: '9000000002',
        role: 'CUSTOMER',
        customerId: 'cust-uuid-2',
        workerId: null
      };

      setTokens(tokenT1, 'refresh-T1');

      let rejectT1!: (err: Error) => void;
      const t1Promise = new Promise<CurrentUserResponse>((_, rej) => {
        rejectT1 = rej;
      });

      const spy = vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => t1Promise);

      // 1. init() starts using token T1
      const initT1 = authStore.init();

      // 2. New login establishes token T2
      vi.spyOn(authApi, 'login').mockResolvedValueOnce({
        accessToken: tokenT2,
        refreshToken: 'refresh-T2',
        expiresIn: 900000,
        role: 'CUSTOMER',
        profileId: 'cust-uuid-2'
      });
      spy.mockResolvedValueOnce(userT2);

      await authStore.login({ identifier: 'userT2@example.com', password: 'Password@123' });
      expect(authStore.token).toBe(tokenT2);
      expect(authStore.user).toEqual(userT2);

      // 3. The old T1 request fails with 401 Unauthorized
      rejectT1(new ApiError({ status: 401, error: 'UNAUTHORIZED', message: 'T1 token expired' }));
      await initT1;

      // 4. Stale T1 failure must NOT clear the active T2 session
      expect(authStore.token).toBe(tokenT2);
      expect(authStore.user).toEqual(userT2);
      expect(authStore.isAuthenticated).toBe(true);
      expect(getAccessToken()).toBe(tokenT2);
      expect(getRefreshToken()).toBe('refresh-T2');
    });

    it('T1 initialization finishing after T2 login does NOT modify T2 loading state', async () => {
      const tokenT1 = sampleToken;
      const tokenT2 = createMockJwt({
        sub: 'user-T2',
        email: 'userT2@example.com',
        role: 'CUSTOMER',
        exp: Math.floor(Date.now() / 1000) + 7200
      });
      const userT2: CurrentUserResponse = {
        userAccountId: 'user-T2',
        email: 'userT2@example.com',
        phoneNumber: '9000000002',
        role: 'CUSTOMER',
        customerId: 'cust-uuid-2',
        workerId: null
      };

      setTokens(tokenT1, 'refresh-T1');

      let resolveT1!: (u: CurrentUserResponse) => void;
      const t1Promise = new Promise<CurrentUserResponse>((res) => {
        resolveT1 = res;
      });

      let resolveT2Profile!: (u: CurrentUserResponse) => void;
      const t2ProfilePromise = new Promise<CurrentUserResponse>((res) => {
        resolveT2Profile = res;
      });

      const spy = vi.spyOn(authApi, 'getCurrentUser')
        .mockImplementationOnce(() => t1Promise)
        .mockImplementationOnce(() => t2ProfilePromise);

      // 1. T1 initialization starts
      const initT1 = authStore.init();
      expect(authStore.isLoading).toBe(true);

      // 2. T2 login starts while T1 is pending
      vi.spyOn(authApi, 'login').mockResolvedValueOnce({
        accessToken: tokenT2,
        refreshToken: 'refresh-T2',
        expiresIn: 900000,
        role: 'CUSTOMER',
        profileId: 'cust-uuid-2'
      });
      const loginT2 = authStore.login({ identifier: 'userT2@example.com', password: 'Password@123' });

      // Allow microtasks to process so login reaches its in-flight getCurrentUser
      await new Promise((r) => setTimeout(r, 0));
      expect(authStore.isLoading).toBe(true);

      // 3. Obsolete T1 initialization completes
      resolveT1(mockCustomerUser);
      await initT1;

      // 4. Verify T1 finally block did NOT prematurely set isLoading to false for active T2 login
      expect(authStore.isLoading).toBe(true);
      expect(authStore.token).toBe(tokenT2);

      // 5. T2 profile finally completes
      resolveT2Profile(userT2);
      await loginT2;

      expect(authStore.isLoading).toBe(false);
      expect(authStore.user).toEqual(userT2);
      expect(authStore.token).toBe(tokenT2);
    });

    it('Concurrent refreshUser() calls: produce exactly one network request and share outcome', async () => {
      setTokens(sampleToken, 'valid-refresh-token');
      (authStore as unknown as { token: string }).token = sampleToken;
      (authStore as unknown as { user: CurrentUserResponse }).user = mockCustomerUser;

      let resolveRefresh!: (u: CurrentUserResponse) => void;
      const refreshPromise = new Promise<CurrentUserResponse>((res) => {
        resolveRefresh = res;
      });
      const spy = vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => refreshPromise);

      const r1 = authStore.refreshUser();
      const r2 = authStore.refreshUser();

      // Only one network request in flight
      expect(spy).toHaveBeenCalledTimes(1);

      const updatedUser: CurrentUserResponse = {
        ...mockCustomerUser,
        phoneNumber: '9999999999'
      };
      resolveRefresh(updatedUser);
      await Promise.all([r1, r2]);

      expect(authStore.user?.phoneNumber).toBe('9999999999');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Delayed refresh response arriving after logout does NOT resurrect session', async () => {
      setTokens(sampleToken, 'valid-refresh-token');
      (authStore as unknown as { token: string }).token = sampleToken;
      (authStore as unknown as { user: CurrentUserResponse }).user = mockCustomerUser;

      let resolveRefresh!: (u: CurrentUserResponse) => void;
      const refreshPromise = new Promise<CurrentUserResponse>((res) => {
        resolveRefresh = res;
      });
      vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => refreshPromise);

      // 1. refreshUser starts and is pending
      const refreshTask = authStore.refreshUser();

      // 2. User logs out
      vi.spyOn(authApi, 'logout').mockResolvedValueOnce();
      await authStore.logout();

      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);

      // 3. Delayed refresh response arrives
      resolveRefresh(mockCustomerUser);
      await refreshTask;

      // 4. Session must NOT be resurrected
      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(getAccessToken()).toBeNull();
    });

    it('Delayed login profile response arriving after newer login does NOT overwrite newer session', async () => {
      const tokenA = sampleToken;
      const userA: CurrentUserResponse = {
        ...mockCustomerUser,
        userAccountId: 'user-A',
        email: 'userA@example.com'
      };

      const tokenB = createMockJwt({
        sub: 'user-B',
        email: 'userB@example.com',
        role: 'WORKER',
        exp: Math.floor(Date.now() / 1000) + 7200
      });
      const userB: CurrentUserResponse = {
        userAccountId: 'user-B',
        email: 'userB@example.com',
        phoneNumber: '9200000000',
        role: 'WORKER',
        customerId: null,
        workerId: 'worker-B'
      };

      let resolveUserA!: (u: CurrentUserResponse) => void;
      const userAPromise = new Promise<CurrentUserResponse>((res) => {
        resolveUserA = res;
      });

      // Login A starts, login returns tokenA, but its profile is delayed
      vi.spyOn(authApi, 'login')
        .mockResolvedValueOnce({
          accessToken: tokenA,
          refreshToken: 'refresh-A',
          expiresIn: 900000,
          role: 'CUSTOMER',
          profileId: 'cust-A'
        })
        .mockResolvedValueOnce({
          accessToken: tokenB,
          refreshToken: 'refresh-B',
          expiresIn: 900000,
          role: 'WORKER',
          profileId: 'worker-B'
        });

      const getCurrentUserSpy = vi.spyOn(authApi, 'getCurrentUser')
        .mockImplementationOnce(() => userAPromise)
        .mockResolvedValueOnce(userB);

      // 1. User A login starts
      const loginA = authStore.login({ identifier: 'userA@example.com', password: 'Password@123' });
      await new Promise((r) => setTimeout(r, 0));

      // 2. User B login starts and completes fully
      const loginB = authStore.login({ identifier: 'userB@example.com', password: 'Password@123' });
      await loginB;

      expect(authStore.token).toBe(tokenB);
      expect(authStore.user).toEqual(userB);
      expect(authStore.role).toBe('WORKER');

      // 3. User A delayed profile completes
      resolveUserA(userA);
      await loginA;

      // 4. User B session must NOT be overwritten by User A
      expect(authStore.token).toBe(tokenB);
      expect(authStore.user).toEqual(userB);
      expect(authStore.role).toBe('WORKER');
      expect(getAccessToken()).toBe(tokenB);
    });

    it('Delayed registration profile response arriving after logout does NOT resurrect session', async () => {
      const regToken = sampleToken;
      const regUser: CurrentUserResponse = {
        ...mockCustomerUser,
        email: 'registered@example.com'
      };

      let resolveRegProfile!: (u: CurrentUserResponse) => void;
      const regProfilePromise = new Promise<CurrentUserResponse>((res) => {
        resolveRegProfile = res;
      });

      vi.spyOn(authApi, 'registerCustomer').mockResolvedValueOnce({
        accessToken: regToken,
        refreshToken: 'refresh-reg',
        expiresIn: 900000,
        role: 'CUSTOMER',
        profileId: 'cust-reg'
      });

      vi.spyOn(authApi, 'getCurrentUser').mockImplementationOnce(() => regProfilePromise);

      // 1. Registration starts
      const regTask = authStore.registerCustomer({
        firstName: 'New',
        lastName: 'User',
        email: 'registered@example.com',
        phoneNumber: '9876543210',
        password: 'Password@123'
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(authStore.token).toBe(regToken);

      // 2. User logs out before profile is returned
      vi.spyOn(authApi, 'logout').mockResolvedValueOnce();
      await authStore.logout();

      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();

      // 3. Delayed registration profile arrives
      resolveRegProfile(regUser);
      await regTask;

      // 4. Session must remain logged out, not resurrected
      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(getAccessToken()).toBeNull();
    });

    it('Promise ownership: an older initialization cannot clear a newer in-flight initPromise reference', async () => {
      setTokens(sampleToken, 'valid-refresh-token');

      let resolveP1!: (u: CurrentUserResponse) => void;
      const deferredP1 = new Promise<CurrentUserResponse>((res) => {
        resolveP1 = res;
      });

      vi.spyOn(authApi, 'getCurrentUser').mockImplementationOnce(() => deferredP1);

      // 1. P1 starts
      const p1 = authStore.init();
      expect((authStore as unknown as { initPromise: Promise<void> | null }).initPromise).not.toBeNull();

      // 2. Newer operation replaces initPromise with a newer promise
      const newerInitPromise = new Promise<void>(() => {});
      (authStore as unknown as { initPromise: Promise<void> | null }).initPromise = newerInitPromise;

      // 3. Older P1 completes
      resolveP1(mockCustomerUser);
      await p1;

      // 4. Newer promise reference must NOT be cleared to null by older P1 finally block
      expect((authStore as unknown as { initPromise: Promise<void> | null }).initPromise).toBe(newerInitPromise);
    });

    it('Promise ownership: an older refreshUser cannot clear a newer in-flight refreshPromise reference', async () => {
      setTokens(sampleToken, 'valid-refresh-token');
      (authStore as unknown as { token: string }).token = sampleToken;
      (authStore as unknown as { user: CurrentUserResponse }).user = mockCustomerUser;

      let resolveR1!: (u: CurrentUserResponse) => void;
      const deferredR1 = new Promise<CurrentUserResponse>((res) => {
        resolveR1 = res;
      });

      vi.spyOn(authApi, 'getCurrentUser').mockImplementationOnce(() => deferredR1);

      // 1. R1 starts
      const r1 = authStore.refreshUser();
      expect((authStore as unknown as { refreshPromise: Promise<void> | null }).refreshPromise).not.toBeNull();

      // 2. Newer operation replaces refreshPromise
      const newerRefreshPromise = new Promise<void>(() => {});
      (authStore as unknown as { refreshPromise: Promise<void> | null }).refreshPromise = newerRefreshPromise;

      // 3. Older R1 completes
      resolveR1(mockCustomerUser);
      await r1;

      // 4. Newer refresh promise reference must NOT be cleared to null by older R1 finally block
      expect((authStore as unknown as { refreshPromise: Promise<void> | null }).refreshPromise).toBe(newerRefreshPromise);
    });
  });
});
