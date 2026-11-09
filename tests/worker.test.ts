import { describe, it, expect } from 'vitest';
import {
  workingHoursEntrySchema,
  updateWorkingHoursSchema,
  vacationModeSchema,
  scheduleOverrideSchema
} from '../src/lib/schemas/availability';

describe('Worker Availability & Schedule Operations', () => {
  describe('Working Hours Schema', () => {
    it('validates a valid working day entry with HH:MM times', () => {
      const validEntry = {
        dayOfWeek: 'MONDAY' as const,
        startTime: '09:00',
        endTime: '18:00',
        isWorkingDay: true
      };

      const result = workingHoursEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('rejects invalid time formats', () => {
      const invalidEntry = {
        dayOfWeek: 'MONDAY' as const,
        startTime: '9:00am', // invalid format
        endTime: '18:00',
        isWorkingDay: true
      };

      const result = workingHoursEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('validates 7-day working hours array payload', () => {
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
      const hoursPayload = {
        workingHours: days.map((day) => ({
          dayOfWeek: day,
          startTime: '08:30',
          endTime: '17:30',
          isWorkingDay: day !== 'SUNDAY'
        }))
      };

      const result = updateWorkingHoursSchema.safeParse(hoursPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Vacation Mode Schema', () => {
    it('validates enabled vacation mode with start and end dates', () => {
      const payload = {
        enabled: true,
        startDate: '2026-12-24',
        endDate: '2026-12-31'
      };

      const result = vacationModeSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('validates disabled vacation mode with null dates', () => {
      const payload = {
        enabled: false,
        startDate: null,
        endDate: null
      };

      const result = vacationModeSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('Schedule Override Schema', () => {
    it('validates a day-off override without times', () => {
      const dayOff = {
        overrideDate: '2026-12-25',
        startTime: null,
        endTime: null,
        isAvailable: false,
        reason: 'Christmas Holiday'
      };

      const result = scheduleOverrideSchema.safeParse(dayOff);
      expect(result.success).toBe(true);
    });

    it('validates a custom shift override with start and end times', () => {
      const customShift = {
        overrideDate: '2026-12-26',
        startTime: '10:00',
        endTime: '14:00',
        isAvailable: true,
        reason: 'Short morning shift'
      };

      const result = scheduleOverrideSchema.safeParse(customShift);
      expect(result.success).toBe(true);
    });
  });
});
