import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerCustomerSchema,
  registerWorkerSchema
} from '../src/lib/schemas/auth';
import {
  createBookingSchema,
  cancelBookingSchema
} from '../src/lib/schemas/booking';
import { addressSchema } from '../src/lib/schemas/address';

describe('Zod Domain Validation Schemas', () => {
  describe('Auth Schemas', () => {
    it('validates a valid login payload with email or phone identifier', () => {
      const emailResult = loginSchema.safeParse({
        identifier: 'user@example.com',
        password: 'Password@123'
      });
      expect(emailResult.success).toBe(true);

      const phoneResult = loginSchema.safeParse({
        identifier: '9876543210',
        password: 'Password@123'
      });
      expect(phoneResult.success).toBe(true);
    });

    it('rejects empty identifier or empty password in login', () => {
      const emptyIdentifier = loginSchema.safeParse({
        identifier: '',
        password: 'Password@123'
      });
      expect(emptyIdentifier.success).toBe(false);

      const emptyPassword = loginSchema.safeParse({
        identifier: 'user@example.com',
        password: ''
      });
      expect(emptyPassword.success).toBe(false);
    });

    it('validates Indian phone numbers in customer registration', () => {
      const validPayload = {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@example.com',
        phoneNumber: '+919876543210',
        password: 'SecurePassword@1',
        confirmPassword: 'SecurePassword@1'
      };

      const result = registerCustomerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);

      const invalidPhone = registerCustomerSchema.safeParse({
        ...validPayload,
        phoneNumber: '12345'
      });
      expect(invalidPhone.success).toBe(false);
    });

    it('rejects mismatched passwords in customer registration', () => {
      const result = registerCustomerSchema.safeParse({
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@example.com',
        phoneNumber: '9876543210',
        password: 'SecurePassword@1',
        confirmPassword: 'DifferentPassword@2'
      });

      expect(result.success).toBe(false);
    });

    it('validates worker registration requirements without primaryCity/primaryState', () => {
      const validWorker = {
        firstName: 'Amit',
        lastName: 'Sharma',
        email: 'amit@example.com',
        phoneNumber: '9876543211',
        password: 'WorkerSecure@1',
        confirmPassword: 'WorkerSecure@1',
        categoryId: 'cat-uuid-1',
        skillIds: ['skill-uuid-1', 'skill-uuid-2'],
        hourlyRate: 350,
        experienceYears: 5
      };

      const result = registerWorkerSchema.safeParse(validWorker);
      expect(result.success).toBe(true);

      // Fails if hourlyRate <= 0
      const invalidRate = registerWorkerSchema.safeParse({
        ...validWorker,
        hourlyRate: -10
      });
      expect(invalidRate.success).toBe(false);
    });
  });

  describe('Booking Schemas', () => {
    it('validates create booking with timeSlot format HH:MM-HH:MM', () => {
      const validBooking = {
        workerId: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        scheduledDate: '2026-12-01',
        timeSlot: '09:00-11:00',
        description: 'Need electrical rewiring in kitchen area',
        addressLine1: 'Flat 402, Green Meadows',
        addressCity: 'Bengaluru',
        addressState: 'Karnataka',
        addressPincode: '560001'
      };

      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);

      const invalidTimeSlot = createBookingSchema.safeParse({
        ...validBooking,
        timeSlot: '9am to 11am'
      });
      expect(invalidTimeSlot.success).toBe(false);

      const invalidPincode = createBookingSchema.safeParse({
        ...validBooking,
        addressPincode: '56000' // only 5 digits
      });
      expect(invalidPincode.success).toBe(false);
    });

    it('validates cancellation reason length', () => {
      const valid = cancelBookingSchema.safeParse({
        reason: 'Client requested reschedule to next week'
      });
      expect(valid.success).toBe(true);

      const tooShort = cancelBookingSchema.safeParse({
        reason: 'no'
      });
      expect(tooShort.success).toBe(false);
    });
  });

  describe('Address Schemas', () => {
    it('validates address structure and pincode', () => {
      const validAddress = {
        label: 'Home',
        addressLine1: '123 MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        addressType: 'HOME',
        isDefault: true
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);

      const invalidType = addressSchema.safeParse({
        ...validAddress,
        addressType: 'WAREHOUSE' // not allowed
      });
      expect(invalidType.success).toBe(false);
    });
  });
});
