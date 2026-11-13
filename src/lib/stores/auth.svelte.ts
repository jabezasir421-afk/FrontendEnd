import { authApi } from '$lib/api/auth';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  ApiError
} from '$lib/api/client';
import type {
  CurrentUserResponse,
  AuthResponse,
  LoginRequest,
  RegisterCustomerRequest,
  RegisterWorkerRequest,
  UserRole
} from '$lib/types/api';

class AuthState {
  user = $state<CurrentUserResponse | null>(null);
  token = $state<string | null>(null);
  role = $state<UserRole | null>(null);
  profileId = $state<string | null>(null);
  isLoading = $state<boolean>(true);
  isInitialized = $state<boolean>(false);

  private initPromise: Promise<void> | null = null;
  private refreshPromise: Promise<void> | null = null;
  private sessionGeneration = 0;

  isAuthenticated = $derived(this.token !== null && this.user !== null);
  isCustomer = $derived(this.role === 'CUSTOMER');
  isWorker = $derived(this.role === 'WORKER');
  isAdmin = $derived(this.role === 'ADMIN');
  customerId = $derived(this.user?.customerId ?? null);
  workerId = $derived(this.user?.workerId ?? null);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:expired', () => {
        this.clearSession();
      });
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized && (this.user !== null || !this.token)) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    if (typeof window === 'undefined') {
      this.isLoading = false;
      return;
    }

    const savedToken = getAccessToken();
    if (!savedToken) {
      this.isLoading = false;
      this.isInitialized = true;
      return;
    }

    const currentGen = this.sessionGeneration;
    const initToken = savedToken;

    let currentPromise: Promise<void> | null = null;
    currentPromise = (async () => {
      this.token = savedToken;
      const payload = this.parseJwtPayload(savedToken);
      if (payload?.role) {
        this.role = payload.role;
      }

      this.isLoading = true;
      try {
        const currentUser = await authApi.getCurrentUser();
        // Stale check: Never let an older request modify a newer session (e.g. login/logout in flight)
        if (this.sessionGeneration !== currentGen || this.token !== initToken) {
          return;
        }
        this.user = currentUser;
        this.role = currentUser.role;
        this.profileId = currentUser.customerId || currentUser.workerId;
        this.isInitialized = true;
      } catch (err: unknown) {
        // Stale check: Never let an older failure clear or modify a newer session
        if (this.sessionGeneration !== currentGen || this.token !== initToken) {
          return;
        }

        const status = this.extractHttpStatus(err);

        if (status === 401) {
          // HTTP 401: Invalid or expired session; refresh was already attempted or not supported
          this.clearSession();
          this.isInitialized = true;
        } else if (status === 403) {
          // HTTP 403: Forbidden - do not automatically clear valid tokens
          this.isInitialized = true;
        } else {
          // HTTP 429, 5xx, or network failure:
          // Retain tokens and permit subsequent retry (keep isInitialized false so init() can retry)
        }
      } finally {
        if (this.sessionGeneration === currentGen) {
          this.isLoading = false;
        }
        if (this.initPromise === currentPromise) {
          this.initPromise = null;
        }
      }
    })();

    this.initPromise = currentPromise;
    return this.initPromise;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const opGen = ++this.sessionGeneration;
    this.isLoading = true;
    try {
      const auth = await authApi.login(credentials);
      if (this.sessionGeneration !== opGen) {
        return auth;
      }
      this.setSession(auth);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (this.sessionGeneration === opGen) {
          this.user = currentUser;
        }
      } catch (err: unknown) {
        if (this.sessionGeneration === opGen) {
          const status = this.extractHttpStatus(err);
          if (status === 401) {
            this.clearSession();
            throw err;
          }
        }
      }
      return auth;
    } finally {
      if (this.sessionGeneration === opGen) {
        this.isLoading = false;
      }
    }
  }

  async registerCustomer(data: RegisterCustomerRequest): Promise<AuthResponse> {
    const opGen = ++this.sessionGeneration;
    this.isLoading = true;
    try {
      const auth = await authApi.registerCustomer(data);
      if (this.sessionGeneration !== opGen) {
        return auth;
      }
      this.setSession(auth);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (this.sessionGeneration === opGen) {
          this.user = currentUser;
        }
      } catch (err: unknown) {
        if (this.sessionGeneration === opGen) {
          const status = this.extractHttpStatus(err);
          if (status === 401) {
            this.clearSession();
            throw err;
          }
        }
      }
      return auth;
    } finally {
      if (this.sessionGeneration === opGen) {
        this.isLoading = false;
      }
    }
  }

  async registerWorker(data: RegisterWorkerRequest): Promise<AuthResponse> {
    const opGen = ++this.sessionGeneration;
    this.isLoading = true;
    try {
      const auth = await authApi.registerWorker(data);
      if (this.sessionGeneration !== opGen) {
        return auth;
      }
      this.setSession(auth);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (this.sessionGeneration === opGen) {
          this.user = currentUser;
        }
      } catch (err: unknown) {
        if (this.sessionGeneration === opGen) {
          const status = this.extractHttpStatus(err);
          if (status === 401) {
            this.clearSession();
            throw err;
          }
        }
      }
      return auth;
    } finally {
      if (this.sessionGeneration === opGen) {
        this.isLoading = false;
      }
    }
  }

  async logout(): Promise<void> {
    ++this.sessionGeneration;
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors, clear locally anyway
      }
    }
    this.clearSession();
  }

  async refreshUser(): Promise<void> {
    if (!this.token) return;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentGen = this.sessionGeneration;
    const capturedToken = this.token;

    let currentPromise: Promise<void> | null = null;
    currentPromise = (async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (this.sessionGeneration !== currentGen || this.token !== capturedToken) return;
        this.user = currentUser;
        this.role = currentUser.role;
        this.profileId = currentUser.customerId || currentUser.workerId;
      } catch (err: unknown) {
        if (this.sessionGeneration !== currentGen || this.token !== capturedToken) return;
        const status = this.extractHttpStatus(err);
        if (status === 401) {
          this.clearSession();
        }
        // For 403, 429, 5xx, or network failure, retain tokens and session
      } finally {
        if (this.refreshPromise === currentPromise) {
          this.refreshPromise = null;
        }
      }
    })();

    this.refreshPromise = currentPromise;
    return this.refreshPromise;
  }

  private setSession(auth: AuthResponse): void {
    setTokens(auth.accessToken, auth.refreshToken);
    this.token = auth.accessToken;
    this.role = auth.role;
    this.profileId = auth.profileId;
  }

  private clearSession(): void {
    clearTokens();
    this.user = null;
    this.token = null;
    this.role = null;
    this.profileId = null;
  }

  private extractHttpStatus(err: unknown): number | null {
    if (err instanceof ApiError) {
      return err.status;
    }
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const status = (err as { status: unknown }).status;
      if (typeof status === 'number') {
        return status;
      }
    }
    return null;
  }

  private parseJwtPayload(token: string): { sub?: string; email?: string; role?: UserRole } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const binaryStr = atob(padded);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
}

export const authStore = new AuthState();
