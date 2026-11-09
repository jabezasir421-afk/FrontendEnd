import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid('Valid booking ID required'),
  rating: z.coerce
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  comment: z
    .string()
    .trim()
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters')
});

export type CreateReviewFormData = z.infer<typeof createReviewSchema>;

export const reportReviewSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(500, 'Reason cannot exceed 500 characters')
});

export type ReportReviewFormData = z.infer<typeof reportReviewSchema>;
