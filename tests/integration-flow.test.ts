import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup environment mocks
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

globalThis.window = {
  localStorage: localStorageMock,
  dispatchEvent: vi.fn()
} as unknown as Window & typeof globalThis;
globalThis.localStorage = localStorageMock as unknown as Storage;

import {
  setTokens,
  clearTokens,
  getAccessToken,
  apiClient
} from '../src/lib/api/client';
import { authApi } from '../src/lib/api/auth';
import { searchApi } from '../src/lib/api/search';
import { workersApi } from '../src/lib/api/workers';
import { bookingsApi } from '../src/lib/api/bookings';
import { reviewsApi } from '../src/lib/api/reviews';
import { checkRouteAccess } from '../src/lib/utils/guard';

describe('End-to-End Business Integration Flows', () => {
  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  describe('Customer Discovery -> Booking -> Review Pipeline', () => {
    it('simulates full customer journey end-to-end', async () => {
      // 1. Customer Authenticates
      const mockCustomerAuth = {
        accessToken: 'access_jwt_cust_123',
        refreshToken: 'refresh_jwt_cust_123',
        expiresIn: 3600,
        role: 'CUSTOMER' as const,
        profileId: 'cust-uuid-1'
      };

      const mockCustomerUser = {
        userAccountId: 'acc-uuid-1',
        email: 'customer@example.com',
        phoneNumber: '+919876543210',
        role: 'CUSTOMER' as const,
        customerId: 'cust-uuid-1',
        workerId: null
      };

      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // Mock Login
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Login successful', data: mockCustomerAuth })
      });

      const authRes = await authApi.login({
        email: 'customer@example.com',
        password: 'Password@123'
      });
      expect(authRes.accessToken).toBe('access_jwt_cust_123');
      setTokens(authRes.accessToken, authRes.refreshToken);

      // Verify route guard permits customer to access customer dashboard
      const routeCheck = checkRouteAccess('/customer/dashboard', {
        isAuthenticated: true,
        role: authRes.role
      });
      expect(routeCheck.allowed).toBe(true);

      // 2. Customer Searches for Plumbers in Bengaluru
      const mockSearchResults = {
        results: [
          {
            id: 'worker-uuid-456',
            fullName: 'Rajesh Sharma',
            primaryCity: 'Bengaluru',
            categoryName: 'Plumbing',
            hourlyRate: 400,
            averageRating: 4.9,
            reviewCount: 18,
            available: true,
            verified: true,
            profilePhotoUrl: null,
            skillNames: ['Pipe Fitting', 'Leak Repair'],
            profileCompletionPercent: 90
          }
        ],
        totalElements: 1,
        page: 0,
        size: 10,
        filters: {}
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Found', data: mockSearchResults })
      });

      const searchRes = await searchApi.searchWorkers({
        city: 'Bengaluru',
        categoryId: 'cat-plumbing-1',
        available: true
      });
      expect(searchRes.results).toHaveLength(1);
      expect(searchRes.results[0].fullName).toBe('Rajesh Sharma');

      // 3. Customer Inspects Worker Available Slots
      const mockSlots = [
        { startTime: '09:00', endTime: '11:00', timeSlot: '09:00-11:00', available: true },
        { startTime: '11:00', endTime: '13:00', timeSlot: '11:00-13:00', available: false },
        { startTime: '14:00', endTime: '16:00', timeSlot: '14:00-16:00', available: true }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Slots', data: mockSlots })
      });

      const slots = await workersApi.getPublicSlots('worker-uuid-456', '2026-12-05');
      expect(slots).toHaveLength(3);
      const chosenSlot = slots.find((s) => s.available);
      expect(chosenSlot).toBeDefined();
      expect(chosenSlot?.timeSlot).toBe('09:00-11:00');

      // 4. Customer Creates Booking
      const bookingPayload = {
        workerId: 'worker-uuid-456',
        categoryId: 'cat-plumbing-1',
        scheduledDate: '2026-12-05',
        timeSlot: chosenSlot!.timeSlot,
        description: 'Main kitchen sink faucet is dripping continuously',
        addressLine1: 'Flat 402, Lotus Greens, Indiranagar',
        addressCity: 'Bengaluru',
        addressState: 'Karnataka',
        addressPincode: '560038'
      };

      const mockBookingResponse = {
        id: 'booking-uuid-789',
        status: 'PENDING' as const,
        scheduledDate: '2026-12-05',
        timeSlot: '09:00-11:00',
        description: bookingPayload.description,
        quotedAmount: 400,
        finalAmount: null,
        cancellationReason: null,
        acceptedAt: null,
        completedAt: null,
        cancelledAt: null,
        categoryId: 'cat-plumbing-1',
        categoryName: 'Plumbing',
        workerId: 'worker-uuid-456',
        workerName: 'Rajesh Sharma',
        customer: {
          id: 'cust-uuid-1',
          firstName: 'Ananya',
          lastName: 'Patel',
          phoneNumber: '+919876543210',
          email: 'customer@example.com',
          profilePhotoUrl: null
        },
        addressLine1: bookingPayload.addressLine1,
        addressCity: bookingPayload.addressCity,
        addressState: bookingPayload.addressState,
        addressPincode: bookingPayload.addressPincode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Created', data: mockBookingResponse })
      });

      const createdBooking = await bookingsApi.create(bookingPayload);
      expect(createdBooking.id).toBe('booking-uuid-789');
      expect(createdBooking.status).toBe('PENDING');

      // 5. Worker Accepts Booking
      const mockAcceptedBooking = { ...mockBookingResponse, status: 'ACCEPTED' as const, acceptedAt: new Date().toISOString() };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Accepted', data: mockAcceptedBooking })
      });

      const acceptedBooking = await bookingsApi.accept(createdBooking.id);
      expect(acceptedBooking.status).toBe('ACCEPTED');

      // 6. Worker Starts Service
      const mockInProgressBooking = { ...mockAcceptedBooking, status: 'IN_PROGRESS' as const };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Started', data: mockInProgressBooking })
      });

      const startedBooking = await bookingsApi.start(createdBooking.id);
      expect(startedBooking.status).toBe('IN_PROGRESS');

      // 7. Worker Completes Service with Final Amount
      const mockCompletedBooking = {
        ...mockInProgressBooking,
        status: 'COMPLETED' as const,
        completedAt: new Date().toISOString(),
        finalAmount: 450
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Completed', data: mockCompletedBooking })
      });

      const completedBooking = await bookingsApi.complete(createdBooking.id, { finalAmount: 450 });
      expect(completedBooking.status).toBe('COMPLETED');
      expect(completedBooking.finalAmount).toBe(450);

      // 8. Customer Leaves Review
      const mockReviewResponse = {
        id: 'review-uuid-999',
        bookingId: completedBooking.id,
        workerId: 'worker-uuid-456',
        workerName: 'Rajesh Sharma',
        customerId: 'cust-uuid-1',
        customerName: 'Ananya Patel',
        rating: 5,
        comment: 'Excellent plumbing repair. Clean, punctual, and professional.',
        createdAt: new Date().toISOString()
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Review created', data: mockReviewResponse })
      });

      const reviewRes = await reviewsApi.create({
        bookingId: completedBooking.id,
        rating: 5,
        comment: 'Excellent plumbing repair. Clean, punctual, and professional.'
      });

      expect(reviewRes.rating).toBe(5);
      expect(reviewRes.workerName).toBe('Rajesh Sharma');
    });
  });

  describe('Security Boundaries & Role Isolation', () => {
    it('strictly forbids cross-role access', () => {
      // Customer attempting to view worker dashboard
      const customerAccess = checkRouteAccess('/worker/dashboard', {
        isAuthenticated: true,
        role: 'CUSTOMER'
      });
      expect(customerAccess).toEqual({
        allowed: false,
        redirect: '/customer/dashboard'
      });

      // Worker attempting to view customer booking creation
      const workerAccess = checkRouteAccess('/customer/book/some-worker-id', {
        isAuthenticated: true,
        role: 'WORKER'
      });
      expect(workerAccess).toEqual({
        allowed: false,
        redirect: '/worker/dashboard'
      });
    });
  });
});
