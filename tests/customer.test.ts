import { describe, it, expect } from 'vitest';
import { createBookingSchema } from '../src/lib/schemas/booking';
import { addressSchema } from '../src/lib/schemas/address';

describe('Customer Booking & Address Operations', () => {
  describe('Booking Creation Payload Validation', () => {
    it('validates a complete valid customer booking payload', () => {
      const validPayload = {
        workerId: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        scheduledDate: '2026-12-05',
        timeSlot: '14:00-16:00',
        description: 'Kitchen sink drain pipe is leaking under the cabinet',
        addressLine1: 'Flat 301, Sunshine Heights, 12th Main',
        addressCity: 'Bengaluru',
        addressState: 'Karnataka',
        addressPincode: '560034'
      };

      const result = createBookingSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects booking with short description less than 10 characters', () => {
      const invalidPayload = {
        workerId: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        scheduledDate: '2026-12-05',
        timeSlot: '14:00-16:00',
        description: 'leak', // only 4 chars
        addressLine1: 'Flat 301, Sunshine Heights',
        addressCity: 'Bengaluru',
        addressState: 'Karnataka',
        addressPincode: '560034'
      };

      const result = createBookingSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('description');
      }
    });

    it('rejects booking with malformed time slot', () => {
      const invalidPayload = {
        workerId: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174001',
        scheduledDate: '2026-12-05',
        timeSlot: '2pm to 4pm', // not HH:MM-HH:MM
        description: 'Kitchen sink pipe repair needed',
        addressLine1: 'Flat 301, Sunshine Heights',
        addressCity: 'Bengaluru',
        addressState: 'Karnataka',
        addressPincode: '560034'
      };

      const result = createBookingSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('timeSlot');
      }
    });
  });

  describe('Address Management Validation', () => {
    it('validates a standard Indian customer address', () => {
      const address = {
        label: 'Home Apartment',
        addressLine1: 'No 45, 1st Cross, Indiranagar',
        addressLine2: 'Near Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        addressType: 'HOME' as const,
        isDefault: true
      };

      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(true);
    });

    it('rejects an address with invalid pincode', () => {
      const address = {
        addressLine1: 'No 45, 1st Cross, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '56003', // 5 digits instead of 6
        addressType: 'WORK' as const
      };

      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(false);
    });
  });
});
