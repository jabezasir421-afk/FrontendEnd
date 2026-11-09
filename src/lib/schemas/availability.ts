import { z } from 'zod';

export const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const workingHoursEntrySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(TIME_REGEX, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(TIME_REGEX, 'End time must be in HH:MM format'),
  isWorkingDay: z.boolean()
});

export const updateWorkingHoursSchema = z.object({
  workingHours: z.array(workingHoursEntrySchema)
});

export type UpdateWorkingHoursFormData = z.infer<typeof updateWorkingHoursSchema>;

export const vacationModeSchema = z.object({
  enabled: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable()
});

export type VacationModeFormData = z.infer<typeof vacationModeSchema>;

export const scheduleOverrideSchema = z.object({
  overrideDate: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(TIME_REGEX, 'Start time must be HH:MM').optional().nullable(),
  endTime: z.string().regex(TIME_REGEX, 'End time must be HH:MM').optional().nullable(),
  isAvailable: z.boolean(),
  reason: z.string().max(255).optional().nullable()
});

export type ScheduleOverrideFormData = z.infer<typeof scheduleOverrideSchema>;
