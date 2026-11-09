<script lang="ts">
  import { onMount } from 'svelte';
  import { bookingsApi } from '$lib/api/bookings';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { BookingResponse, BookingStatus } from '$lib/types/api';
  import {
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    Mail,
    Check,
    X,
    Play,
    CheckCheck,
    AlertCircle,
    XCircle
  } from 'lucide-svelte';

  const STATUS_TABS: { label: string; value?: BookingStatus }[] = [
    { label: 'All Jobs' },
    { label: 'Action Required', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled / Rejected', value: 'CANCELLED' }
  ];

  let activeStatus = $state<BookingStatus | undefined>(undefined);
  let bookings = $state<BookingResponse[]>([]);
  let totalElements = $state(0);
  let totalPages = $state(0);
  let currentPage = $state(0);
  let pageSize = 10;
  let loading = $state(true);

  // Modals state
  let rejectModalOpen = $state(false);
  let completeModalOpen = $state(false);
  let cancelModalOpen = $state(false);
  let selectedBooking = $state<BookingResponse | null>(null);

  // Modal forms
  let rejectReason = $state('');
  let finalAmount = $state<number | undefined>(undefined);
  let cancelReason = $state('');
  let actionLoading = $state(false);

  async function loadBookings() {
    loading = true;
    try {
      const res = await bookingsApi.getWorkerBookings(activeStatus, currentPage, pageSize);
      bookings = res?.content || [];
      totalElements = res?.totalElements || 0;
      totalPages = res?.totalPages || 1;
    } catch {
      toastStore.error('Could not load assigned jobs.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadBookings);

  function handleTabChange(status?: BookingStatus) {
    activeStatus = status;
    currentPage = 0;
    loadBookings();
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    loadBookings();
  }

  // Accept Action
  async function handleAccept(bookingId: string) {
    try {
      await bookingsApi.accept(bookingId);
      toastStore.success('Job request accepted! Contact customer to coordinate details.');
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message, 'Accept Failed');
    }
  }

  // Reject Modal & Action
  function openRejectModal(booking: BookingResponse) {
    selectedBooking = booking;
    rejectReason = '';
    rejectModalOpen = true;
  }

  async function handleConfirmReject(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    actionLoading = true;
    try {
      await bookingsApi.reject(selectedBooking.id, { reason: rejectReason.trim() || undefined });
      toastStore.success('Job booking rejected');
      rejectModalOpen = false;
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message, 'Reject Failed');
    } finally {
      actionLoading = false;
    }
  }

  // Start Job Action
  async function handleStart(bookingId: string) {
    try {
      await bookingsApi.start(bookingId);
      toastStore.success('Job marked as in progress.');
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message, 'Start Failed');
    }
  }

  // Complete Modal & Action
  function openCompleteModal(booking: BookingResponse) {
    selectedBooking = booking;
    finalAmount = booking.quotedAmount;
    completeModalOpen = true;
  }

  async function handleConfirmComplete(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    actionLoading = true;
    try {
      await bookingsApi.complete(selectedBooking.id, {
        finalAmount: finalAmount !== undefined && finalAmount > 0 ? Number(finalAmount) : null
      });
      toastStore.success('Job completed successfully! Customer can now leave a rating.');
      completeModalOpen = false;
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message, 'Complete Failed');
    } finally {
      actionLoading = false;
    }
  }

  // Cancel Modal & Action
  function openCancelModal(booking: BookingResponse) {
    selectedBooking = booking;
    cancelReason = '';
    cancelModalOpen = true;
  }

  async function handleConfirmCancel(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!cancelReason.trim()) {
      toastStore.warning('Please provide a reason for cancelling.');
      return;
    }
    actionLoading = true;
    try {
      await bookingsApi.cancel(selectedBooking.id, { reason: cancelReason.trim() });
      toastStore.success('Job cancelled');
      cancelModalOpen = false;
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) toastStore.error(err.message, 'Cancel Failed');
    } finally {
      actionLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Worker Job Management — BlueCollar</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  <!-- Header -->
  <div class="border-b border-slate-200 dark:border-slate-800 pb-6">
    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      Assigned Job Bookings
    </h1>
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
      Manage your service jobs from acceptance to final completion and payment
    </p>
  </div>

  <!-- Status Tabs -->
  <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
    {#each STATUS_TABS as tab}
      <button
        type="button"
        onclick={() => handleTabChange(tab.value)}
        class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors {activeStatus === tab.value
          ? 'bg-amber-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Bookings List -->
  {#if loading}
    <div class="space-y-4">
      {#each Array(3) as _}
        <Skeleton class="h-48 rounded-2xl" />
      {/each}
    </div>
  {:else if bookings.length === 0}
    <EmptyState
      title="No job bookings found"
      description="No customer requests matching this status."
    />
  {:else}
    <div class="space-y-4">
      {#each bookings as booking (booking.id)}
        <Card class="p-5 space-y-4">
          <!-- Card Top: Customer & Status -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 font-bold text-sm flex items-center justify-center border border-amber-200 dark:border-amber-800">
                {booking.customer.firstName.charAt(0)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </h3>
                  <Badge variant={booking.status} size="sm">
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p class="text-xs text-slate-500">
                  Ref: {booking.id.slice(0, 8)} • Service: {booking.categoryName}
                </p>
              </div>
            </div>

            <!-- Quoted / Final Rate -->
            <div class="text-right">
              <span class="text-xs text-slate-400 block">
                {booking.status === 'COMPLETED' && booking.finalAmount ? 'Final Settlement' : 'Quoted Amount'}
              </span>
              <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                ₹{booking.status === 'COMPLETED' && booking.finalAmount ? booking.finalAmount : booking.quotedAmount}
              </span>
            </div>
          </div>

          <!-- Schedule & Contact Details -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1">
              <span class="text-slate-400 font-medium">Appointment:</span>
              <div class="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200">
                <span class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  {booking.scheduledDate}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  {booking.timeSlot}
                </span>
              </div>
            </div>

            <div class="space-y-1">
              <span class="text-slate-400 font-medium">Customer Contact:</span>
              <div class="space-y-0.5 text-slate-700 dark:text-slate-300">
                <p class="flex items-center gap-1.5 font-medium">
                  <Phone class="w-3 h-3 text-slate-400" />
                  {booking.customer.phoneNumber || 'Not provided'}
                </p>
                <p class="flex items-center gap-1.5 text-slate-500">
                  <Mail class="w-3 h-3 text-slate-400" />
                  {booking.customer.email}
                </p>
              </div>
            </div>

            <div class="space-y-1">
              <span class="text-slate-400 font-medium">Location:</span>
              <p class="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {booking.addressLine1}
              </p>
              <p class="text-slate-500">
                {booking.addressCity}, {booking.addressState} - {booking.addressPincode}
              </p>
            </div>
          </div>

          <!-- Work Description -->
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
            <span class="font-semibold text-slate-700 dark:text-slate-200 block mb-0.5">Job Instructions:</span>
            {booking.description}
          </div>

          <!-- Rejection / Cancellation Notes -->
          {#if booking.cancellationReason}
            <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
              <span class="font-semibold">Cancellation / Rejection Reason:</span> {booking.cancellationReason}
            </div>
          {/if}

          <!-- Execution Action Buttons -->
          <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {#if booking.status === 'PENDING'}
              <Button
                variant="outline"
                size="sm"
                onclick={() => openRejectModal(booking)}
              >
                <X class="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onclick={() => handleAccept(booking.id)}
              >
                <Check class="w-3.5 h-3.5 mr-1" />
                Accept Job
              </Button>
            {:else if booking.status === 'ACCEPTED'}
              <Button
                variant="outline"
                size="sm"
                onclick={() => openCancelModal(booking)}
              >
                <XCircle class="w-3.5 h-3.5 mr-1 text-rose-500" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onclick={() => handleStart(booking.id)}
              >
                <Play class="w-3.5 h-3.5 mr-1" />
                Start Service
              </Button>
            {:else if booking.status === 'IN_PROGRESS'}
              <Button
                variant="primary"
                size="sm"
                onclick={() => openCompleteModal(booking)}
              >
                <CheckCheck class="w-3.5 h-3.5 mr-1" />
                Mark Completed
              </Button>
            {/if}
          </div>
        </Card>
      {/each}

      <Pagination
        page={currentPage}
        {totalPages}
        {totalElements}
        size={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  {/if}
</div>

<!-- Reject Modal -->
{#if rejectModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (rejectModalOpen = false)} title="Reject Job Request" size="md">
    <form onsubmit={handleConfirmReject} class="space-y-4">
      <p class="text-xs text-slate-500">
        You are rejecting the service request from {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}.
      </p>

      <Textarea
        label="Reason for Rejection (Optional)"
        placeholder="e.g. Schedule full, outside service area, tools unavailable..."
        rows={3}
        bind:value={rejectReason}
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (rejectModalOpen = false)}>
          Back
        </Button>
        <Button variant="danger" type="submit" loading={actionLoading}>
          Confirm Rejection
        </Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Complete Modal -->
{#if completeModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (completeModalOpen = false)} title="Complete Service Booking" size="md">
    <form onsubmit={handleConfirmComplete} class="space-y-4">
      <p class="text-xs text-slate-500">
        Mark the work for {selectedBooking.customer.firstName} {selectedBooking.customer.lastName} as completed.
      </p>

      <Input
        label="Final Settled Amount (₹)"
        type="number"
        min="0"
        max="500000"
        bind:value={finalAmount}
        helper="Leave blank or keep initial quote if no extra charges occurred"
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (completeModalOpen = false)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={actionLoading}>
          Confirm Completion
        </Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Cancel Modal -->
{#if cancelModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (cancelModalOpen = false)} title="Cancel Accepted Job" size="md">
    <form onsubmit={handleConfirmCancel} class="space-y-4">
      <Textarea
        label="Cancellation Reason"
        placeholder="State reason why you cannot perform this accepted service..."
        rows={3}
        bind:value={cancelReason}
        required
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (cancelModalOpen = false)}>
          Keep Job
        </Button>
        <Button variant="danger" type="submit" loading={actionLoading}>
          Cancel Job
        </Button>
      </div>
    </form>
  </Modal>
{/if}
