import { z } from 'zod';

export const INDIAN_PHONE_REGEX = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerCustomerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name cannot exceed 100 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email cannot exceed 255 characters'),
  phoneNumber: z.string().trim().regex(INDIAN_PHONE_REGEX, 'Please enter a valid Indian mobile number (e.g. 9876543210 or +919876543210)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must include uppercase letter, digit, and special character (@#$%^&+=!)'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type RegisterCustomerFormData = z.infer<typeof registerCustomerSchema>;

export const registerWorkerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name cannot exceed 100 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email cannot exceed 255 characters'),
  phoneNumber: z.string().trim().regex(INDIAN_PHONE_REGEX, 'Please enter a valid Indian mobile number (e.g. 9876543210 or +919876543210)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must include uppercase letter, digit, and special character (@#$%^&+=!)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  categoryId: z.string().min(1, 'Please select your primary trade category'),
  skillIds: z.array(z.string()).min(1, 'Please select at least one skill'),
  hourlyRate: z.coerce.number().positive('Hourly rate must be positive'),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type RegisterWorkerFormData = z.infer<typeof registerWorkerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address')
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must include uppercase letter, digit, and special character (@#$%^&+=!)'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must include uppercase letter, digit, and special character (@#$%^&+=!)'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
