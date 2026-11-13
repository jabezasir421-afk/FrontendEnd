import { describe, it, expect } from 'vitest';
import { checkRouteAccess, getSafeRedirect } from '../src/lib/utils/guard';
import type { UserRole } from '../src/lib/types/api';

describe('Route Access Guard', () => {
  describe('Unauthenticated User', () => {
    const unauth = { isAuthenticated: false, role: null };

    it('allows access to public pages', () => {
      expect(checkRouteAccess('/', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/workers', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/workers/uuid-123', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/login', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/register/customer', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/register/worker', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/forgot-password', unauth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/verify-email', unauth)).toEqual({ allowed: true });
    });

    it('redirects protected customer routes to login with redirect param', () => {
      expect(checkRouteAccess('/customer/dashboard', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fcustomer%2Fdashboard'
      });
      expect(checkRouteAccess('/customer/bookings', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fcustomer%2Fbookings'
      });
    });

    it('redirects protected worker routes to login with redirect param', () => {
      expect(checkRouteAccess('/worker/dashboard', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fworker%2Fdashboard'
      });
      expect(checkRouteAccess('/worker/availability', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fworker%2Favailability'
      });
    });

    it('redirects protected admin routes to login with redirect param', () => {
      expect(checkRouteAccess('/admin', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fadmin'
      });
      expect(checkRouteAccess('/admin/documents', unauth)).toEqual({
        allowed: false,
        redirect: '/login?redirect=%2Fadmin%2Fdocuments'
      });
    });
  });

  describe('Authenticated Customer', () => {
    const customerAuth = { isAuthenticated: true, role: 'CUSTOMER' as const };

    it('allows access to customer routes', () => {
      expect(checkRouteAccess('/customer/dashboard', customerAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/customer/bookings', customerAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/customer/addresses', customerAuth)).toEqual({ allowed: true });
    });

    it('prevents access to worker routes and redirects to customer dashboard', () => {
      expect(checkRouteAccess('/worker/dashboard', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
      expect(checkRouteAccess('/worker/availability', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
    });

    it('prevents access to admin routes and redirects to customer dashboard', () => {
      expect(checkRouteAccess('/admin', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
      expect(checkRouteAccess('/admin/documents', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
    });

    it('redirects login and register pages to customer dashboard', () => {
      expect(checkRouteAccess('/login', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
      expect(checkRouteAccess('/register/customer', customerAuth)).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });
    });
  });

  describe('Authenticated Worker', () => {
    const workerAuth = { isAuthenticated: true, role: 'WORKER' as const };

    it('allows access to worker routes', () => {
      expect(checkRouteAccess('/worker/dashboard', workerAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/worker/bookings', workerAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/worker/availability', workerAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/worker/portfolio', workerAuth)).toEqual({ allowed: true });
    });

    it('prevents access to customer routes and redirects to worker dashboard', () => {
      expect(checkRouteAccess('/customer/dashboard', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
      expect(checkRouteAccess('/customer/bookings', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
    });

    it('prevents access to admin routes and redirects to worker dashboard', () => {
      expect(checkRouteAccess('/admin', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
      expect(checkRouteAccess('/admin/documents', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
    });

    it('redirects login and register pages to worker dashboard', () => {
      expect(checkRouteAccess('/login', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
      expect(checkRouteAccess('/register/worker', workerAuth)).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
    });
  });

  describe('Authenticated Admin', () => {
    const adminAuth = { isAuthenticated: true, role: 'ADMIN' as const };

    it('allows access to admin routes', () => {
      expect(checkRouteAccess('/admin', adminAuth)).toEqual({ allowed: true });
      expect(checkRouteAccess('/admin/documents', adminAuth)).toEqual({ allowed: true });
    });

    it('prevents access to customer routes and redirects to admin documents', () => {
      expect(checkRouteAccess('/customer/dashboard', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
      expect(checkRouteAccess('/customer/bookings', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
    });

    it('prevents access to worker routes and redirects to admin documents', () => {
      expect(checkRouteAccess('/worker/dashboard', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
      expect(checkRouteAccess('/worker/availability', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
    });

    it('redirects login and register pages to admin documents', () => {
      expect(checkRouteAccess('/login', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
      expect(checkRouteAccess('/register/customer', adminAuth)).toEqual({
        allowed: false,
        redirect: '/admin/documents'
      });
    });
  });

  describe('Safe Redirect & Login Redirection', () => {
    const baseOrigin = 'http://localhost:3000';

    function determineLoginDestination(rawRedirect: string | null | undefined, role: UserRole | null): string {
      const safeRedirect = getSafeRedirect(rawRedirect, baseOrigin);
      if (safeRedirect) return safeRedirect;
      if (role === 'ADMIN') return '/admin/documents';
      if (role === 'CUSTOMER') return '/customer/dashboard';
      if (role === 'WORKER') return '/worker/dashboard';
      return '/';
    }

    it('accepts valid internal paths', () => {
      expect(getSafeRedirect('/admin/documents', baseOrigin)).toBe('/admin/documents');
      expect(getSafeRedirect('/customer/dashboard', baseOrigin)).toBe('/customer/dashboard');
      expect(getSafeRedirect('/worker/availability', baseOrigin)).toBe('/worker/availability');
    });

    it('preserves query strings and hash fragments on internal paths', () => {
      expect(getSafeRedirect('/admin/documents?page=1&size=10', baseOrigin)).toBe(
        '/admin/documents?page=1&size=10'
      );
      expect(getSafeRedirect('/search?city=Bengaluru&sort=rating#results', baseOrigin)).toBe(
        '/search?city=Bengaluru&sort=rating#results'
      );
    });

    it('rejects protocol-relative URLs', () => {
      expect(getSafeRedirect('//evil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('//evil.com/phish', baseOrigin)).toBeNull();
      expect(getSafeRedirect('///evil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('//localhost:8080/admin', baseOrigin)).toBeNull();
    });

    it('rejects absolute external URLs', () => {
      expect(getSafeRedirect('https://evil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('http://evil.com/login', baseOrigin)).toBeNull();
      expect(getSafeRedirect('https://attacker.org/admin/documents', baseOrigin)).toBeNull();
      expect(getSafeRedirect('javascript:alert(1)', baseOrigin)).toBeNull();
      expect(getSafeRedirect('data:text/html,evil', baseOrigin)).toBeNull();
    });

    it('rejects backslash-based redirects', () => {
      expect(getSafeRedirect('\\evil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/\\evil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/admin\\documents', baseOrigin)).toBeNull();
      expect(getSafeRedirect('\\/evil.com', baseOrigin)).toBeNull();
    });

    it('rejects control characters and header injection attempts', () => {
      expect(getSafeRedirect('/admin\r\nevil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/admin\nevil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/admin\tevil.com', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/admin\0evil', baseOrigin)).toBeNull();
      expect(getSafeRedirect('/admin\x1fevil', baseOrigin)).toBeNull();
    });

    it('rejects empty, whitespace, null, and non-leading-slash values', () => {
      expect(getSafeRedirect('', baseOrigin)).toBeNull();
      expect(getSafeRedirect('   ', baseOrigin)).toBeNull();
      expect(getSafeRedirect(null, baseOrigin)).toBeNull();
      expect(getSafeRedirect(undefined, baseOrigin)).toBeNull();
      expect(getSafeRedirect('admin/documents', baseOrigin)).toBeNull();
      expect(getSafeRedirect('../admin/documents', baseOrigin)).toBeNull();
    });

    it('routes users to safe redirect when valid', () => {
      expect(determineLoginDestination('/admin/documents?page=2', 'ADMIN')).toBe(
        '/admin/documents?page=2'
      );
      expect(determineLoginDestination('/customer/bookings', 'CUSTOMER')).toBe(
        '/customer/bookings'
      );
    });

    it('falls back to role default destination when redirect is unsafe or missing', () => {
      // Unsafe external redirect attempt should be ignored and fall back to role default
      expect(determineLoginDestination('https://evil.com', 'ADMIN')).toBe('/admin/documents');
      expect(determineLoginDestination('//evil.com', 'CUSTOMER')).toBe('/customer/dashboard');
      expect(determineLoginDestination('/\\evil.com', 'WORKER')).toBe('/worker/dashboard');

      // Missing redirect should fall back to role default
      expect(determineLoginDestination(null, 'ADMIN')).toBe('/admin/documents');
      expect(determineLoginDestination(null, 'CUSTOMER')).toBe('/customer/dashboard');
      expect(determineLoginDestination(null, 'WORKER')).toBe('/worker/dashboard');
      expect(determineLoginDestination(null, null)).toBe('/');
    });
  });
});
