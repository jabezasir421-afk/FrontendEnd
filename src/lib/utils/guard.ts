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
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
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
    if (auth.role === 'ADMIN') {
      return { allowed: false, redirect: '/admin/documents' };
    }
  }

  // Admin only routes
  if (isAdminRoute) {
    if (!auth.isAuthenticated) {
      return {
        allowed: false,
        redirect: `/login?redirect=${encodeURIComponent(pathname)}`
      };
    }
    if (auth.role !== 'ADMIN') {
      const redirect = auth.role === 'CUSTOMER' ? '/customer/dashboard' : '/worker/dashboard';
      return { allowed: false, redirect };
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
      const redirect = auth.role === 'ADMIN' ? '/admin/documents' : '/worker/dashboard';
      return { allowed: false, redirect };
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
      const redirect = auth.role === 'ADMIN' ? '/admin/documents' : '/customer/dashboard';
      return { allowed: false, redirect };
    }
  }

  return { allowed: true };
}

/**
 * Validates and sanitizes a redirect target to prevent open redirect vulnerabilities.
 * Accepts only relative local paths beginning with exactly one '/' and belonging
 * to the current application origin.
 */
export function getSafeRedirect(
  target: string | null | undefined,
  baseOrigin?: string
): string | null {
  if (!target || typeof target !== 'string') {
    return null;
  }

  // Reject strings with control characters (ASCII 0x00-0x1F, 0x7F)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(target)) {
    return null;
  }

  // Reject backslashes to prevent backslash-based bypasses (e.g. \evil.com, /\evil.com)
  if (target.includes('\\')) {
    return null;
  }

  // Target MUST begin with exactly one '/'
  if (!target.startsWith('/') || target.startsWith('//')) {
    return null;
  }

  // Determine origin for validation
  const currentOrigin =
    baseOrigin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost');

  try {
    const parsed = new URL(target, currentOrigin);

    // Ensure parsed origin matches the expected origin
    if (parsed.origin !== currentOrigin) {
      return null;
    }

    // Ensure it's not a javascript:, data:, or other unexpected protocol
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Return the safe relative path including search query and hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
