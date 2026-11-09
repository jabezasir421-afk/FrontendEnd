import { api } from './client';
import type {
  WorkerAvailabilityConfigResponse,
  AvailabilitySummaryResponse,
  WorkingHoursEntry,
  ScheduleOverrideResponse,
  UpdateOnlineStatusRequest,
  UpdateBookableRequest,
  UpdateWorkingHoursRequest,
  VacationModeRequest,
  ScheduleOverrideRequest
} from '$lib/types/api';

export const availabilityApi = {
  getMyAvailability: () =>
    api.get<WorkerAvailabilityConfigResponse>('/workers/me/availability'),

  updateOnlineStatus: (data: UpdateOnlineStatusRequest) =>
    api.put<AvailabilitySummaryResponse>('/workers/me/availability/status', data),

  updateBookable: (data: UpdateBookableRequest) =>
    api.put<AvailabilitySummaryResponse>('/workers/me/availability/bookable', data),

  updateWorkingHours: (data: UpdateWorkingHoursRequest) =>
    api.put<WorkingHoursEntry[]>('/workers/me/availability/working-hours', data),

  getWorkingHours: () =>
    api.get<WorkingHoursEntry[]>('/workers/me/availability/working-hours'),

  updateVacationMode: (data: VacationModeRequest) =>
    api.put<AvailabilitySummaryResponse>('/workers/me/availability/vacation', data),

  addScheduleOverride: (data: ScheduleOverrideRequest) =>
    api.post<ScheduleOverrideResponse>('/workers/me/availability/overrides', data),

  removeScheduleOverride: (id: string) =>
    api.delete<void>(`/workers/me/availability/overrides/${id}`),

  heartbeat: () =>
    api.post<AvailabilitySummaryResponse>('/workers/me/availability/heartbeat')
};
