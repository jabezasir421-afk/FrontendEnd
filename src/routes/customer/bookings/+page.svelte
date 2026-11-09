<script lang="ts">
  import { onMount } from 'svelte';
  import { bookingsApi } from '$lib/api/bookings';
  import { reviewsApi } from '$lib/api/reviews';
  import { workersApi } from '$lib/api/workers';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { cancelBookingSchema } from '$lib/schemas/booking';
  import { createReviewSchema } from '$lib/schemas/review';
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
  import type {
    BookingResponse,
    BookingStatus,
    AvailableSlotResponse
  } from '$lib/types/api';
  import {
    Calendar,
    Clock,
    MapPin,
    Star,
    XCircle,
    RotateCcw,
    CheckCircle2,
    CalendarCheck,
    MessageSquare,
    ArrowRight,
    AlertCircle
  } from 'lucide-svelte';

  const STATUS_TABS: { label: string; value?: BookingStatus }[] = [
    { label: 'All' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  let activeStatus = $state<BookingStatus | undefined>(undefined);
  let bookings = $state<BookingResponse[]>([]);
  let totalElements = $state(0);
  let totalPages = $state(0);
  let currentPage = $state(0);
  let pageSize = 10;
  let loading = $state(true);

  // Modal States
  let cancelModalOpen = $state(false);
  let rescheduleModalOpen = $state(false);
  let reviewModalOpen = $state(false);
  let selectedBooking = $state<BookingResponse | null>(null);

  // Cancel Form
  let cancelReason = $state('');
  let cancelling = $state(false);
  let cancelError = $state<string | null>(null);

  // Reschedule Form
  let newDate = $state('');
  let newSlot = $state('');
  let availableSlots = $state<AvailableSlotResponse[]>([]);
  let loadingSlots = $state(false);
  let rescheduling = $state(false);

  // Review Form
  let reviewRating = $state(5);
  let reviewComment = $state('');
  let submittingReview = $state(false);
  let reviewError = $state<string | null>(null);

  async function loadBookings() {
    loading = true;
    try {
      const res = await bookingsApi.getCustomerBookings(activeStatus, currentPage, pageSize);
      bookings = res?.content || [];
      totalElements = res?.totalElements || 0;
      totalPages = res?.totalPages || 1;
    } catch {
      toastStore.error('Could not load your bookings.', 'Error');
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

  // Cancel Modal Handlers
  function openCancelModal(booking: BookingResponse) {
    selectedBooking = booking;
    cancelReason = '';
    cancelError = null;
    cancelModalOpen = true;
  }

  async function handleConfirmCancel(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    cancelError = null;

    const validation = cancelBookingSchema.safeParse({ reason: cancelReason });
    if (!validation.success) {
      cancelError = validation.error.errors[0]?.message || 'Please provide a valid cancellation reason.';
      return;
    }

    cancelling = true;
    try {
      await bookingsApi.cancel(selectedBooking.id, { reason: cancelReason.trim() });
      toastStore.success('Booking cancelled successfully');
      cancelModalOpen = false;
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Cancellation Failed');
      } else {
        toastStore.error('Failed to cancel booking.');
      }
    } finally {
      cancelling = false;
    }
  }

  // Reschedule Modal Handlers
  async function openRescheduleModal(booking: BookingResponse) {
    selectedBooking = booking;
    newDate = booking.scheduledDate;
    newSlot = '';
    rescheduleModalOpen = true;
    await loadRescheduleSlots(newDate);
  }

  async function loadRescheduleSlots(dateStr: string) {
    if (!selectedBooking || !dateStr) return;
    loadingSlots = true;
    newSlot = '';
    try {
      const slots = await workersApi.getPublicSlots(selectedBooking.workerId, dateStr);
      availableSlots = slots || [];
      const firstAvailable = availableSlots.find((s) => s.available);
      if (firstAvailable) {
        newSlot = firstAvailable.timeSlot;
      }
    } catch {
      availableSlots = [];
      toastStore.error('Could not fetch open slots for this date.');
    } finally {
      loadingSlots = false;
    }
  }

  async function handleConfirmReschedule(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking || !newDate || !newSlot) {
      toastStore.warning('Please select a date and an open time slot.');
      return;
    }

    rescheduling = true;
    try {
      await bookingsApi.reschedule(selectedBooking.id, {
        newScheduledDate: newDate,
        newTimeSlot: newSlot
      });
      toastStore.success('Booking rescheduled successfully!');
      rescheduleModalOpen = false;
      await loadBookings();
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Reschedule Failed');
      } else {
        toastStore.error('Failed to reschedule booking.');
      }
    } finally {
      rescheduling = false;
    }
  }

  // Review Modal Handlers
  function openReviewModal(booking: BookingResponse) {
    selectedBooking = booking;
    reviewRating = 5;
    reviewComment = '';
    reviewError = null;
    reviewModalOpen = true;
  }

  async function handleSubmitReview(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    reviewError = null;

    const validation = createReviewSchema.safeParse({
      bookingId: selectedBooking.id,
      rating: reviewRating,
      comment: reviewComment.trim()
    });

    if (!validation.success) {
      reviewError = validation.error.errors[0]?.message || 'Please provide rating and comment.';
      return;
    }

    submittingReview = true;
    try {
      await reviewsApi.create({
        bookingId: selectedBooking.id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      toastStore.success('Thank you for rating your service experience!');
      reviewModalOpen = false;
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Review Submission Failed');
      } else {
        toastStore.error('Could not submit review.');
      }
    } finally {
      submittingReview = false;
    }
  }
</script>

<svelte:head>
  <title>My Bookings — BlueCollar</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  <!-- Page Header -->
  <div class="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        My Service Bookings
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        Track appointments, reschedule or cancel requests, and leave reviews for completed work
      </p>
    </div>

    <a href="/workers">
      <Button variant="primary">
        Book New Service
        <ArrowRight class="w-4 h-4 ml-2" />
      </Button>
    </a>
  </div>

  <!-- Status Tabs -->
  <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
    {#each STATUS_TABS as tab}
      <button
        type="button"
        onclick={() => handleTabChange(tab.value)}
        class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors {activeStatus === tab.value
          ? 'bg-primary-600 text-white shadow-xs'
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
        <Skeleton class="h-44 rounded-2xl" />
      {/each}
    </div>
  {:else if bookings.length === 0}
    <EmptyState
      title="No bookings found"
      description="You don't have any bookings matching this status filter."
    >
      {#snippet action()}
        <a href="/workers">
          <Button variant="primary" size="sm">
            Browse Services
          </Button>
        </a>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="space-y-4">
      {#each bookings as booking (booking.id)}
        <Card class="p-5 space-y-4">
          <!-- Card Header: Worker & Status -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm border border-primary-200 dark:border-primary-800">
                {booking.workerName.charAt(0)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white">
                    {booking.workerName}
                  </h3>
                  <Badge variant={booking.status} size="sm">
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p class="text-xs text-slate-500">
                  {booking.categoryName} • Ref: {booking.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <!-- Price -->
            <div class="text-right">
              <span class="text-xs text-slate-400 block">
                {booking.status === 'COMPLETED' && booking.finalAmount ? 'Final Amount' : 'Quoted Amount'}
              </span>
              <span class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                ₹{booking.status === 'COMPLETED' && booking.finalAmount ? booking.finalAmount : booking.quotedAmount}
              </span>
            </div>
          </div>

          <!-- Schedule & Address Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <span class="text-slate-400 font-medium">Appointment Schedule:</span>
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
              <span class="text-slate-400 font-medium">Service Location:</span>
              <p class="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {booking.addressLine1}, {booking.addressCity} - {booking.addressPincode}
              </p>
            </div>
          </div>

          <!-- Job Description -->
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
            <span class="font-semibold text-slate-700 dark:text-slate-200 block mb-0.5">Description:</span>
            {booking.description}
          </div>

          <!-- Cancellation note if cancelled -->
          {#if booking.cancellationReason}
            <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
              <span class="font-semibold">Cancellation Reason:</span> {booking.cancellationReason}
            </div>
          {/if}

          <!-- Contextual Customer Action Buttons -->
          <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <!-- Allow reschedule ONLY if PENDING -->
            {#if booking.status === 'PENDING'}
              <Button
                variant="outline"
                size="sm"
                onclick={() => openRescheduleModal(booking)}
              >
                <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
                Reschedule Slot
              </Button>
            {/if}

            <!-- Allow cancel if PENDING or ACCEPTED -->
            {#if booking.status === 'PENDING' || booking.status === 'ACCEPTED'}
              <Button
                variant="danger"
                size="sm"
                onclick={() => openCancelModal(booking)}
              >
                <XCircle class="w-3.5 h-3.5 mr-1.5" />
                Cancel Booking
              </Button>
            {/if}

            <!-- Allow review if COMPLETED -->
            {#if booking.status === 'COMPLETED'}
              <Button
                variant="primary"
                size="sm"
                onclick={() => openReviewModal(booking)}
              >
                <Star class="w-3.5 h-3.5 mr-1.5 fill-amber-300" />
                Rate & Review Worker
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

<!-- Cancel Booking Modal -->
{#if cancelModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (cancelModalOpen = false)} title="Cancel Service Booking" size="md">
    <form onsubmit={handleConfirmCancel} class="space-y-4">
      <p class="text-xs text-slate-500">
        You are about to cancel your appointment with <span class="font-bold text-slate-800 dark:text-slate-200">{selectedBooking.workerName}</span> scheduled for {selectedBooking.scheduledDate} ({selectedBooking.timeSlot}).
      </p>

      <Textarea
        label="Reason for Cancellation"
        placeholder="Please state why you need to cancel this booking (e.g. plans changed, issue resolved)..."
        rows={3}
        bind:value={cancelReason}
        error={cancelError ?? undefined}
        required
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (cancelModalOpen = false)}>
          Keep Booking
        </Button>
        <Button variant="danger" type="submit" loading={cancelling}>
          Confirm Cancellation
        </Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Reschedule Booking Modal -->
{#if rescheduleModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (rescheduleModalOpen = false)} title="Reschedule Appointment" size="md">
    <form onsubmit={handleConfirmReschedule} class="space-y-4">
      <div>
        <label for="resched-date" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
          New Appointment Date
        </label>
        <input
          id="resched-date"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          bind:value={newDate}
          onchange={() => loadRescheduleSlots(newDate)}
          required
          class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Select Open Time Slot
        </span>

        {#if loadingSlots}
          <div class="grid grid-cols-2 gap-2">
            {#each Array(4) as _}
              <Skeleton class="h-10 rounded-xl" />
            {/each}
          </div>
        {:else if availableSlots.length === 0}
          <p class="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            No open slots found for this date.
          </p>
        {:else}
          <div class="grid grid-cols-2 gap-2">
            {#each availableSlots as slot (slot.timeSlot)}
              <button
                type="button"
                disabled={!slot.available}
                onclick={() => (newSlot = slot.timeSlot)}
                class="p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between {newSlot === slot.timeSlot
                  ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-500'
                  : slot.available
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-not-allowed opacity-50'}"
              >
                <span>{slot.timeSlot}</span>
                <span class="text-[10px] font-normal">{slot.available ? 'Available' : 'Booked'}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (rescheduleModalOpen = false)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={rescheduling} disabled={!newSlot}>
          Confirm Reschedule
        </Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Review Modal -->
{#if reviewModalOpen && selectedBooking}
  <Modal open={true} onclose={() => (reviewModalOpen = false)} title="Rate & Review Professional" size="md">
    <form onsubmit={handleSubmitReview} class="space-y-4">
      <div class="text-center py-2">
        <span class="text-xs text-slate-500 block mb-2">Overall Service Rating</span>
        <div class="flex justify-center gap-2">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              type="button"
              onclick={() => (reviewRating = star)}
              class="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
              aria-label="Rate {star} stars"
            >
              <Star class="w-8 h-8 {star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}" />
            </button>
          {/each}
        </div>
      </div>

      <Textarea
        label="Your Review / Feedback"
        placeholder="How was the worker's punctuality, professionalism, and workmanship? (min 10 characters)"
        rows={4}
        bind:value={reviewComment}
        error={reviewError ?? undefined}
        required
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (reviewModalOpen = false)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={submittingReview}>
          Submit Verified Review
        </Button>
      </div>
    </form>
  </Modal>
{/if}
