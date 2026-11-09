import { describe, it, expect } from 'vitest';
import { checkRouteAccess } from '../src/lib/utils/guard';

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
});
