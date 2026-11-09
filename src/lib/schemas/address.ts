import { z } from 'zod';
import { PINCODE_REGEX } from './booking';

export const addressSchema = z.object({
  label: z.string().trim().max(50, 'Label cannot exceed 50 characters').optional().nullable(),
  addressLine1: z.string().trim().min(5, 'Address line 1 must be at least 5 characters').max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  pincode: z.string().trim().regex(PINCODE_REGEX, 'PIN code must be a 6-digit number'),
  addressType: z.enum(['HOME', 'WORK', 'OTHER'], {
    errorMap: () => ({ message: 'Please select an address type (HOME, WORK, or OTHER)' })
  }),
  isDefault: z.boolean().optional()
});

export type AddressFormData = z.infer<typeof addressSchema>;
