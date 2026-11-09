<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { workersApi } from '$lib/api/workers';
  import { addressesApi } from '$lib/api/addresses';
  import { bookingsApi } from '$lib/api/bookings';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { createBookingSchema } from '$lib/schemas/booking';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import type {
    PublicWorkerResponse,
    AvailableSlotResponse,
    AddressResponse
  } from '$lib/types/api';
  import {
    Calendar,
    Clock,
    MapPin,
    FileText,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    Plus,
    AlertCircle
  } from 'lucide-svelte';

  const workerId = page.params.workerId || '';

  // Wizard state
  let currentStep = $state(1); // 1: Date & Time, 2: Description & Address, 3: Review & Confirm
  let worker = $state<PublicWorkerResponse | null>(null);
  let savedAddresses = $state<AddressResponse[]>([]);
  let loadingWorker = $state(true);

  // Booking Form State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  let selectedDate = $state(defaultDateStr);
  let availableSlots = $state<AvailableSlotResponse[]>([]);
  let loadingSlots = $state(false);
  let selectedSlot = $state<string>('');

  let description = $state('');

  // Address selection
  let selectedAddressId = $state<string>('NEW');
  let addressLine1 = $state('');
  let addressCity = $state('');
  let addressState = $state('');
  let addressPincode = $state('');
  let saveNewAddress = $state(false);

  let submitting = $state(false);
  let formErrors = $state<Record<string, string>>({});

  async function loadSlots(date: string) {
    if (!workerId || !date) return;
    loadingSlots = true;
    selectedSlot = '';
    try {
      const slots = await workersApi.getPublicSlots(workerId, date);
      availableSlots = slots || [];
      // Pick first available slot by default if any
      const firstAvailable = availableSlots.find((s) => s.available);
      if (firstAvailable) {
        selectedSlot = firstAvailable.timeSlot;
      }
    } catch {
      availableSlots = [];
      toastStore.error('Could not fetch open slots for this date.', 'Slots Error');
    } finally {
      loadingSlots = false;
    }
  }

  onMount(async () => {
    try {
      const [w, addresses] = await Promise.all([
        workersApi.getById(workerId),
        addressesApi.getAll().catch(() => [])
      ]);
      worker = w;
      savedAddresses = addresses || [];

      // Pre-select default address if exists
      const defaultAddr = savedAddresses.find((a) => a.isDefault);
      if (defaultAddr) {
        selectedAddressId = defaultAddr.id;
        addressLine1 = defaultAddr.addressLine1;
        addressCity = defaultAddr.city;
        addressState = defaultAddr.state;
        addressPincode = defaultAddr.pincode;
      } else if (savedAddresses.length > 0) {
        selectedAddressId = savedAddresses[0].id;
        addressLine1 = savedAddresses[0].addressLine1;
        addressCity = savedAddresses[0].city;
        addressState = savedAddresses[0].state;
        addressPincode = savedAddresses[0].pincode;
      }

      await loadSlots(selectedDate);
    } catch {
      toastStore.error('Could not load worker details.', 'Error');
    } finally {
      loadingWorker = false;
    }
  });

  function handleAddressSelect(addrId: string) {
    selectedAddressId = addrId;
    if (addrId === 'NEW') {
      addressLine1 = '';
      addressCity = '';
      addressState = '';
      addressPincode = '';
    } else {
      const found = savedAddresses.find((a) => a.id === addrId);
      if (found) {
        addressLine1 = found.addressLine1;
        addressCity = found.city;
        addressState = found.state;
        addressPincode = found.pincode;
      }
    }
  }

  function handleNextStep() {
    formErrors = {};

    if (currentStep === 1) {
      if (!selectedDate) {
        formErrors.scheduledDate = 'Please select a date for your appointment';
        return;
      }
      if (!selectedSlot) {
        formErrors.timeSlot = 'Please select an open time slot';
        return;
      }
      currentStep = 2;
    } else if (currentStep === 2) {
      if (!description.trim() || description.trim().length < 10) {
        formErrors.description = 'Please describe the required work in at least 10 characters';
        return;
      }
      if (!addressLine1.trim() || addressLine1.length < 5) {
        formErrors.addressLine1 = 'Please enter a valid street address (at least 5 characters)';
        return;
      }
      if (!addressCity.trim()) {
        formErrors.addressCity = 'City is required';
        return;
      }
      if (!addressState.trim()) {
        formErrors.addressState = 'State is required';
        return;
      }
      if (!/^\d{6}$/.test(addressPincode.trim())) {
        formErrors.addressPincode = 'PIN code must be a 6-digit number';
        return;
      }
      currentStep = 3;
    }
  }

  async function handleConfirmBooking() {
    if (!worker || !workerId) return;
    formErrors = {};

    const payload = {
      workerId,
      categoryId: worker.categoryId,
      scheduledDate: selectedDate,
      timeSlot: selectedSlot,
      description: description.trim(),
      addressLine1: addressLine1.trim(),
      addressCity: addressCity.trim(),
      addressState: addressState.trim(),
      addressPincode: addressPincode.trim()
    };

    const validation = createBookingSchema.safeParse(payload);
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          formErrors[err.path[0] as string] = err.message;
        }
      });
      toastStore.warning('Please fix the errors in your booking.', 'Validation Error');
      return;
    }

    submitting = true;
    try {
      // If customer requested to save new address
      if (selectedAddressId === 'NEW' && saveNewAddress) {
        await addressesApi.create({
          addressLine1: addressLine1.trim(),
          city: addressCity.trim(),
          state: addressState.trim(),
          pincode: addressPincode.trim(),
          addressType: 'HOME',
          isDefault: savedAddresses.length === 0
        }).catch(() => null);
      }

      const booking = await bookingsApi.create(payload);
      toastStore.success('Booking requested successfully! Worker will be notified.', 'Booking Placed');
      goto('/customer/bookings');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => {
            formErrors[fe.field] = fe.message;
          });
        }
        toastStore.error(err.message, 'Booking Failed');
      } else {
        toastStore.error('Could not complete booking request. Please try again.', 'Error');
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Book Professional — BlueCollar</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Stepper Breadcrumb -->
  <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
    <div class="flex items-center gap-2">
      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold {currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}">
        1
      </span>
      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">Date & Time</span>
    </div>
    <div class="flex-1 h-0.5 mx-4 bg-slate-200 dark:bg-slate-800">
      <div class="h-full bg-primary-600 transition-all {currentStep >= 2 ? 'w-full' : 'w-0'}"></div>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold {currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}">
        2
      </span>
      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">Details & Address</span>
    </div>
    <div class="flex-1 h-0.5 mx-4 bg-slate-200 dark:bg-slate-800">
      <div class="h-full bg-primary-600 transition-all {currentStep >= 3 ? 'w-full' : 'w-0'}"></div>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold {currentStep === 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'}">
        3
      </span>
      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">Confirm</span>
    </div>
  </div>

  {#if loadingWorker}
    <Skeleton class="h-64 rounded-3xl" />
  {:else if !worker}
    <div class="text-center py-12">
      <p class="text-sm text-slate-500">Worker could not be found.</p>
    </div>
  {:else}
    <!-- Worker Summary Bar -->
    <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-bold text-base flex items-center justify-center border border-primary-200 dark:border-primary-800">
          {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            {worker.firstName} {worker.lastName}
          </h2>
          <p class="text-xs text-slate-500">
            {worker.categoryName} • ₹{worker.hourlyRate}/hr
          </p>
        </div>
      </div>
      <a href={`/workers/${worker.id}`} class="text-xs font-medium text-primary-600 hover:underline">
        View profile
      </a>
    </div>

    <!-- Step 1: Date & Time Slot Selection -->
    {#if currentStep === 1}
      <Card title="Select Date & Time Slot" class="p-6 space-y-6">
        <!-- Date Picker -->
        <div class="space-y-2">
          <label for="booking-date" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Choose Appointment Date
          </label>
          <input
            id="booking-date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            bind:value={selectedDate}
            onchange={() => loadSlots(selectedDate)}
            class="px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
          {#if formErrors.scheduledDate}
            <p class="text-xs text-rose-600 font-medium">{formErrors.scheduledDate}</p>
          {/if}
        </div>

        <!-- Time Slots Grid -->
        <div class="space-y-3">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Available Time Slots for {selectedDate}
          </span>

          {#if loadingSlots}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {#each Array(4) as _}
                <Skeleton class="h-12 rounded-xl" />
              {/each}
            </div>
          {:else if availableSlots.length === 0}
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
              <p class="text-xs text-slate-500">No scheduled time slots found for this date. Please pick another day.</p>
            </div>
          {:else}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {#each availableSlots as slot (slot.timeSlot)}
                <button
                  type="button"
                  disabled={!slot.available}
                  onclick={() => (selectedSlot = slot.timeSlot)}
                  class="p-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 {selectedSlot === slot.timeSlot
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-500 ring-2 ring-primary-500 shadow-xs'
                    : slot.available
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-50'}"
                >
                  <Clock class="w-3.5 h-3.5" />
                  <span>{slot.timeSlot}</span>
                  <span class="text-[10px] font-normal {slot.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">
                    {slot.available ? 'Available' : 'Booked'}
                  </span>
                </button>
              {/each}
            </div>
          {/if}

          {#if formErrors.timeSlot}
            <p class="text-xs text-rose-600 font-medium">{formErrors.timeSlot}</p>
          {/if}
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="primary" onclick={handleNextStep} disabled={!selectedSlot}>
            Next: Work & Address Details
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Step 2: Description & Address -->
    {#if currentStep === 2}
      <Card title="Describe the Work & Select Service Address" class="p-6 space-y-6">
        <!-- Description -->
        <Textarea
          label="Job Description"
          placeholder="Please describe what repairs, installation, or assistance you need in detail..."
          rows={4}
          bind:value={description}
          error={formErrors.description}
          helper="Min 10 characters, max 1000 characters"
          required
        />

        <!-- Address Selection -->
        <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Service Location
          </span>

          {#if savedAddresses.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {#each savedAddresses as addr (addr.id)}
                <button
                  type="button"
                  onclick={() => handleAddressSelect(addr.id)}
                  class="p-3.5 rounded-xl border text-left transition-all {selectedAddressId === addr.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60 ring-2 ring-primary-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400'}"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">
                      {addr.label || addr.addressType}
                    </span>
                    {#if addr.isDefault}
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Default
                      </span>
                    {/if}
                  </div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 truncate">{addr.addressLine1}</p>
                  <p class="text-[11px] text-slate-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                </button>
              {/each}

              <!-- Option for new address -->
              <button
                type="button"
                onclick={() => handleAddressSelect('NEW')}
                class="p-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-all {selectedAddressId === 'NEW'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60 text-primary-700 ring-2 ring-primary-500'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'}"
              >
                <Plus class="w-4 h-4" />
                Use New Address
              </button>
            </div>
          {/if}

          <!-- New Address Inputs (active if NEW is selected or no saved addresses) -->
          {#if selectedAddressId === 'NEW' || savedAddresses.length === 0}
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <Input
                label="Street Address / House / Flat No."
                placeholder="e.g. 102 Greenwoods Villa, 4th Cross"
                bind:value={addressLine1}
                error={formErrors.addressLine1}
                required
              />

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  placeholder="e.g. Bengaluru"
                  bind:value={addressCity}
                  error={formErrors.addressCity}
                  required
                />
                <Input
                  label="State"
                  placeholder="e.g. Karnataka"
                  bind:value={addressState}
                  error={formErrors.addressState}
                  required
                />
                <Input
                  label="PIN Code"
                  placeholder="e.g. 560001"
                  bind:value={addressPincode}
                  error={formErrors.addressPincode}
                  required
                />
              </div>

              <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  bind:checked={saveNewAddress}
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Save this address to my profile for future bookings</span>
              </label>
            </div>
          {/if}
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onclick={() => (currentStep = 1)}>
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button variant="primary" onclick={handleNextStep}>
            Next: Review & Confirm
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Step 3: Review & Confirm -->
    {#if currentStep === 3}
      <Card title="Review & Confirm Booking Request" class="p-6 space-y-6">
        <div class="space-y-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
          <!-- Worker & Service -->
          <div class="flex items-center justify-between pb-3">
            <span class="text-slate-500">Service Professional</span>
            <span class="font-bold text-slate-900 dark:text-white">
              {worker.firstName} {worker.lastName} ({worker.categoryName})
            </span>
          </div>

          <!-- Schedule -->
          <div class="flex items-center justify-between py-3">
            <span class="text-slate-500">Appointment Schedule</span>
            <div class="text-right">
              <span class="font-bold text-slate-900 dark:text-white block">{selectedDate}</span>
              <span class="text-xs text-slate-500">{selectedSlot}</span>
            </div>
          </div>

          <!-- Address -->
          <div class="flex items-start justify-between py-3">
            <span class="text-slate-500">Service Address</span>
            <div class="text-right max-w-xs">
              <span class="font-semibold text-slate-900 dark:text-white block">{addressLine1}</span>
              <span class="text-xs text-slate-500">{addressCity}, {addressState} - {addressPincode}</span>
            </div>
          </div>

          <!-- Description -->
          <div class="py-3 space-y-1">
            <span class="text-slate-500 block">Description of Work:</span>
            <p class="text-xs text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>

          <!-- Pricing Estimate -->
          <div class="flex items-center justify-between pt-4 bg-primary-50/50 dark:bg-primary-950/20 p-4 rounded-xl">
            <div>
              <span class="font-bold text-slate-900 dark:text-white block text-sm">Estimated Quoted Amount</span>
              <span class="text-xs text-slate-500">Based on worker base hourly rate of ₹{worker.hourlyRate}/hr</span>
            </div>
            <div class="text-2xl font-black text-primary-600 dark:text-primary-400">
              ₹{worker.hourlyRate}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onclick={() => (currentStep = 2)} disabled={submitting}>
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back to Edit
          </Button>

          <Button variant="primary" onclick={handleConfirmBooking} loading={submitting} size="lg">
            Confirm & Place Booking Request
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    {/if}
  {/if}
</div>
