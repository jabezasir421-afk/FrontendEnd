import { z } from 'zod';

export const TIME_SLOT_REGEX = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
export const PINCODE_REGEX = /^\d{6}$/;

export const createBookingSchema = z.object({
  workerId: z.string().uuid('Please select a valid worker'),
  categoryId: z.string().uuid('Please select a valid service category'),
  scheduledDate: z.string().min(1, 'Please select a date for the service'),
  timeSlot: z
    .string()
    .regex(TIME_SLOT_REGEX, 'Time slot must be in format HH:MM-HH:MM (e.g. 09:00-11:00)'),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe the required work in at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  addressLine1: z.string().trim().min(5, 'Address line 1 must be at least 5 characters').max(255),
  addressCity: z.string().trim().min(2, 'City is required').max(100),
  addressState: z.string().trim().min(2, 'State is required').max(100),
  addressPincode: z.string().trim().regex(PINCODE_REGEX, 'PIN code must be a 6-digit number')
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;

export const rescheduleBookingSchema = z.object({
  newScheduledDate: z.string().min(1, 'Please select a new date'),
  newTimeSlot: z
    .string()
    .regex(TIME_SLOT_REGEX, 'Time slot must be in format HH:MM-HH:MM (e.g. 09:00-11:00)')
});

export type RescheduleBookingFormData = z.infer<typeof rescheduleBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Cancellation reason must be at least 5 characters')
    .max(500, 'Cancellation reason cannot exceed 500 characters')
});

export type CancelBookingFormData = z.infer<typeof cancelBookingSchema>;

export const rejectBookingSchema = z.object({
  reason: z.string().trim().max(500, 'Rejection reason cannot exceed 500 characters').optional()
});

export type RejectBookingFormData = z.infer<typeof rejectBookingSchema>;

export const completeBookingSchema = z.object({
  finalAmount: z.coerce
    .number()
    .min(0, 'Amount cannot be negative')
    .max(500000, 'Amount cannot exceed ₹5,00,000')
    .optional()
});

export type CompleteBookingFormData = z.infer<typeof completeBookingSchema>;
