import { authApi } from '$lib/api/auth';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens
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

  isAuthenticated = $derived(this.token !== null && this.user !== null);
  isCustomer = $derived(this.role === 'CUSTOMER');
  isWorker = $derived(this.role === 'WORKER');
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
    if (this.isInitialized) return;

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

    this.token = savedToken;
    try {
      const currentUser = await authApi.getCurrentUser();
      this.user = currentUser;
      this.role = currentUser.role;
      this.profileId = currentUser.customerId || currentUser.workerId;
    } catch {
      this.clearSession();
    } finally {
      this.isLoading = false;
      this.isInitialized = true;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    this.isLoading = true;
    try {
      const auth = await authApi.login(credentials);
      this.setSession(auth);
      const currentUser = await authApi.getCurrentUser();
      this.user = currentUser;
      return auth;
    } finally {
      this.isLoading = false;
    }
  }

  async registerCustomer(data: RegisterCustomerRequest): Promise<AuthResponse> {
    this.isLoading = true;
    try {
      const auth = await authApi.registerCustomer(data);
      this.setSession(auth);
      const currentUser = await authApi.getCurrentUser();
      this.user = currentUser;
      return auth;
    } finally {
      this.isLoading = false;
    }
  }

  async registerWorker(data: RegisterWorkerRequest): Promise<AuthResponse> {
    this.isLoading = true;
    try {
      const auth = await authApi.registerWorker(data);
      this.setSession(auth);
      const currentUser = await authApi.getCurrentUser();
      this.user = currentUser;
      return auth;
    } finally {
      this.isLoading = false;
    }
  }

  async logout(): Promise<void> {
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
    try {
      const currentUser = await authApi.getCurrentUser();
      this.user = currentUser;
      this.role = currentUser.role;
      this.profileId = currentUser.customerId || currentUser.workerId;
    } catch {
      this.clearSession();
    }
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
}

export const authStore = new AuthState();
