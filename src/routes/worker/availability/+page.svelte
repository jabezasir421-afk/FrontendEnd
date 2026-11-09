<script lang="ts">
  import { onMount } from 'svelte';
  import { availabilityApi } from '$lib/api/availability';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import type {
    WorkerAvailabilityConfigResponse,
    WorkingHoursEntry,
    ScheduleOverrideResponse,
    DayOfWeek
  } from '$lib/types/api';
  import {
    Calendar,
    Clock,
    Sun,
    CalendarOff,
    Plus,
    Trash2,
    Heart,
    Power,
    CheckCircle2
  } from 'lucide-svelte';

  const DAYS_ORDER: DayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ];

  let config = $state<WorkerAvailabilityConfigResponse | null>(null);
  let workingHours = $state<WorkingHoursEntry[]>([]);
  let scheduleOverrides = $state<ScheduleOverrideResponse[]>([]);
  let loading = $state(true);

  // Vacation Mode state
  let vacationModeEnabled = $state(false);
  let vacationStartDate = $state('');
  let vacationEndDate = $state('');
  let savingVacation = $state(false);

  // Working Hours state
  let savingHours = $state(false);

  // Override Modal state
  let overrideModalOpen = $state(false);
  let overrideDate = $state('');
  let overrideIsAvailable = $state(false); // default: Day off
  let overrideStartTime = $state('09:00');
  let overrideEndTime = $state('17:00');
  let overrideReason = $state('');
  let savingOverride = $state(false);

  // Heartbeat state
  let sendingHeartbeat = $state(false);

  async function loadAvailability() {
    loading = true;
    try {
      const data = await availabilityApi.getMyAvailability();
      config = data;
      scheduleOverrides = data.scheduleOverrides || [];
      vacationModeEnabled = data.vacationMode;
      vacationStartDate = data.vacationStartDate || '';
      vacationEndDate = data.vacationEndDate || '';

      // Initialize all 7 days
      const existingMap = new Map(data.workingHours.map((h) => [h.dayOfWeek, h]));
      workingHours = DAYS_ORDER.map((day) => {
        const found = existingMap.get(day);
        if (found) {
          return { ...found };
        }
        return {
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isWorkingDay: day !== 'SUNDAY'
        };
      });
    } catch {
      toastStore.error('Could not load availability settings.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadAvailability);

  async function handleSaveWorkingHours() {
    savingHours = true;
    try {
      const updated = await availabilityApi.updateWorkingHours({ workingHours });
      workingHours = updated;
      toastStore.success('Weekly working hours updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Update Failed');
      } else {
        toastStore.error('Could not save working hours.', 'Error');
      }
    } finally {
      savingHours = false;
    }
  }

  async function handleSaveVacation() {
    savingVacation = true;
    try {
      const res = await availabilityApi.updateVacationMode({
        enabled: vacationModeEnabled,
        startDate: vacationModeEnabled && vacationStartDate ? vacationStartDate : null,
        endDate: vacationModeEnabled && vacationEndDate ? vacationEndDate : null
      });
      if (config) {
        config.vacationMode = res.vacationMode;
        config.vacationStartDate = res.vacationStartDate;
        config.vacationEndDate = res.vacationEndDate;
      }
      toastStore.success(`Vacation mode ${res.vacationMode ? 'enabled' : 'disabled'}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Vacation Update Failed');
      } else {
        toastStore.error('Failed to update vacation settings.', 'Error');
      }
    } finally {
      savingVacation = false;
    }
  }

  async function handleAddOverride(e: SubmitEvent) {
    e.preventDefault();
    if (!overrideDate) {
      toastStore.warning('Please select a date for the schedule override.');
      return;
    }

    savingOverride = true;
    try {
      const res = await availabilityApi.addScheduleOverride({
        overrideDate,
        isAvailable: overrideIsAvailable,
        startTime: overrideIsAvailable ? overrideStartTime : null,
        endTime: overrideIsAvailable ? overrideEndTime : null,
        reason: overrideReason.trim() || null
      });
      scheduleOverrides = [...scheduleOverrides, res];
      overrideModalOpen = false;
      overrideDate = '';
      overrideReason = '';
      toastStore.success('Schedule exception added successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Override Failed');
      } else {
        toastStore.error('Could not add schedule exception.', 'Error');
      }
    } finally {
      savingOverride = false;
    }
  }

  async function handleRemoveOverride(id: string) {
    try {
      await availabilityApi.removeScheduleOverride(id);
      scheduleOverrides = scheduleOverrides.filter((o) => o.id !== id);
      toastStore.success('Schedule exception removed');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      }
    }
  }

  async function handleSendHeartbeat() {
    sendingHeartbeat = true;
    try {
      const res = await availabilityApi.heartbeat();
      if (config) {
        config.activeNow = res.activeNow;
      }
      toastStore.success('Availability heartbeat recorded. Customers see you as actively online.');
    } catch {
      toastStore.error('Failed to record heartbeat signal.');
    } finally {
      sendingHeartbeat = false;
    }
  }
</script>

<svelte:head>
  <title>Schedule & Availability — BlueCollar</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Schedule & Availability
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        Configure your standard weekly working hours, vacation mode, and specific date exceptions
      </p>
    </div>

    <!-- Heartbeat Button -->
    <Button
      variant="outline"
      size="sm"
      onclick={handleSendHeartbeat}
      loading={sendingHeartbeat}
    >
      <Heart class="w-4 h-4 mr-1.5 text-rose-500" />
      Send Active Heartbeat
    </Button>
  </div>

  {#if loading}
    <div class="space-y-6">
      <Skeleton class="h-44 rounded-2xl" />
      <Skeleton class="h-96 rounded-2xl" />
    </div>
  {:else}
    <!-- Vacation Mode Card -->
    <Card title="Vacation Mode" subtitle="Temporarily disable new booking requests while you are away">
      <div class="space-y-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={vacationModeEnabled}
            class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm font-semibold text-slate-900 dark:text-white">
            Enable Vacation Mode
          </span>
        </label>

        {#if vacationModeEnabled}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div>
              <label for="vacation-start" class="text-xs font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                Vacation Start Date
              </label>
              <input
                id="vacation-start"
                type="date"
                bind:value={vacationStartDate}
                class="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label for="vacation-end" class="text-xs font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                Vacation End Date
              </label>
              <input
                id="vacation-end"
                type="date"
                bind:value={vacationEndDate}
                class="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        {/if}

        <div class="flex justify-end pt-2">
          <Button variant="primary" size="sm" onclick={handleSaveVacation} loading={savingVacation}>
            Save Vacation Settings
          </Button>
        </div>
      </div>
    </Card>

    <!-- Standard Weekly Working Hours -->
    <Card title="Weekly Working Hours" subtitle="Define standard start and end times for each day of the week">
      <div class="space-y-3">
        {#each workingHours as entry, i (entry.dayOfWeek)}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 gap-3">
            <!-- Day & Toggle -->
            <div class="sm:w-44 flex items-center gap-3">
              <input
                type="checkbox"
                bind:checked={workingHours[i].isWorkingDay}
                class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {entry.dayOfWeek}
              </span>
            </div>

            <!-- Times or Off -->
            {#if workingHours[i].isWorkingDay}
              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-400">From</span>
                <input
                  type="time"
                  bind:value={workingHours[i].startTime}
                  class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
                <span class="text-slate-400">to</span>
                <input
                  type="time"
                  bind:value={workingHours[i].endTime}
                  class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
            {:else}
              <div class="text-xs font-semibold text-slate-400 italic">
                Day Off (Not Available)
              </div>
            {/if}
          </div>
        {/each}

        <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="primary" onclick={handleSaveWorkingHours} loading={savingHours}>
            Save Working Hours
          </Button>
        </div>
      </div>
    </Card>

    <!-- Specific Date Schedule Overrides -->
    <Card
      title="Specific Date Exceptions (Overrides)"
      subtitle="Mark individual holidays, custom working shifts, or single-day leaves"
    >
      {#snippet header()}
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">Specific Date Exceptions</h3>
            <p class="text-xs text-slate-500">Custom shifts or day off overrides</p>
          </div>
          <Button variant="outline" size="sm" onclick={() => (overrideModalOpen = true)}>
            <Plus class="w-4 h-4 mr-1.5" />
            Add Exception
          </Button>
        </div>
      {/snippet}

      {#if scheduleOverrides.length === 0}
        <div class="py-8 text-center text-xs text-slate-500">
          No date exceptions set. Your schedule strictly follows your weekly working hours.
        </div>
      {:else}
        <div class="space-y-3">
          {#each scheduleOverrides as override (override.id)}
            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center {override.isAvailable ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950' : 'bg-rose-100 text-rose-600 dark:bg-rose-950'}">
                  {#if override.isAvailable}
                    <Clock class="w-4 h-4" />
                  {:else}
                    <CalendarOff class="w-4 h-4" />
                  {/if}
                </div>
                <div>
                  <span class="font-bold text-slate-900 dark:text-white block">
                    {override.overrideDate}
                  </span>
                  <span class="text-slate-500">
                    {override.isAvailable
                      ? `Available: ${override.startTime || '09:00'} - ${override.endTime || '18:00'}`
                      : 'Day Off'}
                    {#if override.reason}
                      • {override.reason}
                    {/if}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onclick={() => handleRemoveOverride(override.id)}
                class="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                aria-label="Remove exception"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Add Schedule Override Modal -->
{#if overrideModalOpen}
  <Modal
    open={true}
    onclose={() => (overrideModalOpen = false)}
    title="Add Schedule Exception"
    size="md"
  >
    <form onsubmit={handleAddOverride} class="space-y-4">
      <div>
        <label for="override-date" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          Exception Date
        </label>
        <input
          id="override-date"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          bind:value={overrideDate}
          required
          class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          bind:checked={overrideIsAvailable}
          class="rounded text-primary-600 focus:ring-primary-500"
        />
        <span>I will be working on this date (custom shift)</span>
      </label>

      {#if overrideIsAvailable}
        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <div>
            <label for="override-start" class="text-xs text-slate-500 block mb-1">Start Time</label>
            <input
              id="override-start"
              type="time"
              bind:value={overrideStartTime}
              class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label for="override-end" class="text-xs text-slate-500 block mb-1">End Time</label>
            <input
              id="override-end"
              type="time"
              bind:value={overrideEndTime}
              class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      {:else}
        <p class="text-xs text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
          This date will be completely blocked for all customer bookings.
        </p>
      {/if}

      <Input
        label="Reason (Optional)"
        placeholder="e.g. Festival, Doctor visit, Emergency plumbing on-call"
        bind:value={overrideReason}
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (overrideModalOpen = false)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={savingOverride}>
          Save Exception
        </Button>
      </div>
    </form>
  </Modal>
{/if}
