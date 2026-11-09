import type { UserRole } from '$lib/types/api';

export type RouteAccessResult =
  | { allowed: true }
  | { allowed: false; redirect: string };

export interface AuthStateSnapshot {
  isAuthenticated: boolean;
  role: UserRole | null;
}

export function checkRouteAccess(
  pathname: string,
  auth: AuthStateSnapshot
): RouteAccessResult {
  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
  const isWorkerRoute = pathname === '/worker' || pathname.startsWith('/worker/');
  const isAuthRoute =
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  // If already authenticated and accessing login/register, send them to their dashboard
  if (isAuthRoute && auth.isAuthenticated) {
    if (auth.role === 'CUSTOMER') {
      return { allowed: false, redirect: '/customer/dashboard' };
    }
    if (auth.role === 'WORKER') {
      return { allowed: false, redirect: '/worker/dashboard' };
    }
  }

  // Customer only routes
  if (isCustomerRoute) {
    if (!auth.isAuthenticated) {
      return {
        allowed: false,
        redirect: `/login?redirect=${encodeURIComponent(pathname)}`
      };
    }
    if (auth.role !== 'CUSTOMER') {
      return { allowed: false, redirect: '/worker/dashboard' };
    }
  }

  // Worker only routes
  if (isWorkerRoute) {
    if (!auth.isAuthenticated) {
      return {
        allowed: false,
        redirect: `/login?redirect=${encodeURIComponent(pathname)}`
      };
    }
    if (auth.role !== 'WORKER') {
      return { allowed: false, redirect: '/customer/dashboard' };
    }
  }

  return { allowed: true };
}
