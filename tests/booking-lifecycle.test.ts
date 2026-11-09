import { describe, it, expect } from 'vitest';
import {
  rescheduleBookingSchema,
  cancelBookingSchema,
  completeBookingSchema
} from '../src/lib/schemas/booking';
import {
  createReviewSchema,
  reportReviewSchema
} from '../src/lib/schemas/review';

describe('Booking Lifecycle & Review Schemas', () => {
  describe('Reschedule Schema', () => {
    it('validates a valid reschedule request', () => {
      const payload = {
        newScheduledDate: '2026-12-10',
        newTimeSlot: '11:00-13:00'
      };

      const result = rescheduleBookingSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid time slot format on reschedule', () => {
      const payload = {
        newScheduledDate: '2026-12-10',
        newTimeSlot: '11am to 1pm'
      };

      const result = rescheduleBookingSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Cancellation Schema', () => {
    it('requires a reason of at least 5 characters', () => {
      const valid = cancelBookingSchema.safeParse({
        reason: 'Customer is out of town on that day'
      });
      expect(valid.success).toBe(true);

      const invalid = cancelBookingSchema.safeParse({
        reason: 'no'
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Complete Booking Schema', () => {
    it('allows valid optional final amount', () => {
      const withAmount = completeBookingSchema.safeParse({
        finalAmount: 1500
      });
      expect(withAmount.success).toBe(true);

      const withoutAmount = completeBookingSchema.safeParse({});
      expect(withoutAmount.success).toBe(true);

      const negative = completeBookingSchema.safeParse({
        finalAmount: -50
      });
      expect(negative.success).toBe(false);
    });
  });

  describe('Review Creation Schema', () => {
    it('validates a complete review with 1-5 rating and comment', () => {
      const review = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Punctual, highly skilled electrician. Fixed wiring quickly.'
      };

      const result = createReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it('rejects ratings outside 1-5 range', () => {
      const tooHigh = createReviewSchema.safeParse({
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 6,
        comment: 'Great service overall'
      });
      expect(tooHigh.success).toBe(false);

      const zero = createReviewSchema.safeParse({
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 0,
        comment: 'Terrible service overall'
      });
      expect(zero.success).toBe(false);
    });

    it('validates report review schema', () => {
      const report = reportReviewSchema.safeParse({
        reason: 'Contains inappropriate spam content and external advertising links'
      });
      expect(report.success).toBe(true);

      const tooShort = reportReviewSchema.safeParse({
        reason: 'spam'
      });
      expect(tooShort.success).toBe(false);
    });
  });
});
