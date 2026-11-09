<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { availabilityApi } from '$lib/api/availability';
  import { portfolioApi } from '$lib/api/portfolio';
  import { bookingsApi } from '$lib/api/bookings';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import type {
    WorkerAvailabilityConfigResponse,
    ProfileCompletionResponse,
    BookingResponse
  } from '$lib/types/api';
  import {
    Briefcase,
    Calendar,
    Clock,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Power,
    MapPin,
    Eye,
    TrendingUp
  } from 'lucide-svelte';

  let availability = $state<WorkerAvailabilityConfigResponse | null>(null);
  let completion = $state<ProfileCompletionResponse | null>(null);
  let pendingBookings = $state<BookingResponse[]>([]);
  let totalBookingsCount = $state(0);
  let loading = $state(true);

  // Status toggle states
  let togglingOnline = $state(false);
  let togglingBookable = $state(false);

  async function loadDashboard() {
    loading = true;
    try {
      const [avail, comp, pending, allBookings] = await Promise.all([
        availabilityApi.getMyAvailability().catch(() => null),
        portfolioApi.getProfileCompletion().catch(() => null),
        bookingsApi.getWorkerBookings('PENDING', 0, 5).catch(() => ({ content: [], totalElements: 0 })),
        bookingsApi.getWorkerBookings(undefined, 0, 1).catch(() => ({ content: [], totalElements: 0 }))
      ]);

      availability = avail;
      completion = comp;
      pendingBookings = pending?.content || [];
      totalBookingsCount = allBookings?.totalElements || 0;
    } catch {
      toastStore.error('Could not load worker dashboard data.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadDashboard);

  async function toggleOnlineStatus() {
    if (!availability) return;
    togglingOnline = true;
    const newStatus = !availability.online;
    try {
      const res = await availabilityApi.updateOnlineStatus({ online: newStatus });
      availability.online = res.online;
      availability.activeNow = res.activeNow;
      toastStore.success(`You are now ${res.online ? 'Online' : 'Offline'}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Status Update Failed');
      }
    } finally {
      togglingOnline = false;
    }
  }

  async function toggleBookableStatus() {
    if (!availability) return;
    togglingBookable = true;
    const newStatus = !availability.bookable;
    try {
      const res = await availabilityApi.updateBookable({ bookable: newStatus });
      availability.bookable = res.bookable;
      toastStore.success(`Booking status set to: ${res.bookable ? 'Taking Bookings' : 'Paused'}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Update Failed');
      }
    } finally {
      togglingBookable = false;
    }
  }
</script>

<svelte:head>
  <title>Worker Dashboard — BlueCollar</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Top Control Banner -->
  <div class="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1.5">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs">
          Professional Worker Control
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome back, {authStore.user?.email || 'Professional'}!
        </h1>
        <p class="text-sm text-amber-100 max-w-xl">
          Manage your live operational status, respond to job requests, and keep your trade credentials verified.
        </p>
      </div>

      <!-- Quick Toggles -->
      <div class="flex flex-wrap items-center gap-3 bg-black/20 p-3 rounded-2xl backdrop-blur-xs border border-white/10">
        <!-- Online/Offline Button -->
        <Button
          variant={availability?.online ? 'secondary' : 'outline'}
          size="sm"
          onclick={toggleOnlineStatus}
          loading={togglingOnline}
          class="border-white/30 text-white"
        >
          <Power class="w-4 h-4 mr-1.5 {availability?.online ? 'text-emerald-400' : 'text-slate-300'}" />
          {availability?.online ? 'Status: Online' : 'Status: Offline'}
        </Button>

        <!-- Bookable Toggle Button -->
        <Button
          variant={availability?.bookable ? 'secondary' : 'outline'}
          size="sm"
          onclick={toggleBookableStatus}
          loading={togglingBookable}
          class="border-white/30 text-white"
        >
          <Briefcase class="w-4 h-4 mr-1.5 {availability?.bookable ? 'text-emerald-400' : 'text-slate-300'}" />
          {availability?.bookable ? 'Taking Jobs' : 'Bookings Paused'}
        </Button>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each Array(3) as _}
        <Skeleton class="h-36 rounded-2xl" />
      {/each}
    </div>
  {:else}
    <!-- Metrics Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card class="p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Briefcase class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-500 font-medium block">Total Job Requests</span>
          <span class="text-2xl font-black text-slate-900 dark:text-white">{totalBookingsCount}</span>
        </div>
      </Card>

      <Card class="p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertCircle class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-500 font-medium block">Pending Requests</span>
          <span class="text-2xl font-black text-slate-900 dark:text-white">{pendingBookings.length}</span>
        </div>
      </Card>

      <Card class="p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-slate-500 font-medium">Profile Completion</span>
            <span class="font-bold text-slate-900 dark:text-white">{completion?.percentage || 0}%</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full" style="width: {completion?.percentage || 0}%"></div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Main Grid: Pending Bookings & Navigation Modules -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left 2 Cols: Incoming Requests -->
      <div class="lg:col-span-2 space-y-6">
        <Card title="Incoming Booking Requests" subtitle="Pending requests requiring your acceptance or rejection">
          {#if pendingBookings.length === 0}
            <div class="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 class="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              You are all caught up! No pending booking requests at this moment.
            </div>
          {:else}
            <div class="space-y-4">
              {#each pendingBookings as booking (booking.id)}
                <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-slate-900 dark:text-white">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                        <Badge variant="PENDING" size="sm">Pending Action</Badge>
                      </div>
                      <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin class="w-3.5 h-3.5 text-slate-400" />
                        {booking.addressCity}, {booking.addressState} - {booking.addressPincode}
                      </p>
                    </div>

                    <div class="text-right">
                      <span class="text-xs text-slate-500 block">Quoted</span>
                      <span class="font-black text-sm text-slate-900 dark:text-white">
                        ₹{booking.quotedAmount}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5 text-slate-400" />
                      {booking.scheduledDate}
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock class="w-3.5 h-3.5 text-slate-400" />
                      {booking.timeSlot}
                    </span>
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {booking.description}
                  </p>

                  <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a href="/worker/bookings">
                      <Button variant="primary" size="sm">
                        Review Job
                        <ArrowRight class="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card>
      </div>

      <!-- Right Col: Profile Completion & Quick Links -->
      <div class="space-y-6">
        <!-- Profile Completion Steps -->
        {#if completion && completion.pendingSteps && completion.pendingSteps.length > 0}
          <Card title="Steps to Complete Profile" subtitle="Boost trust and get 3x more bookings">
            <div class="space-y-2.5">
              {#each completion.pendingSteps as step}
                <div class="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div class="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5"></div>
                  <span>{step}</span>
                </div>
              {/each}
              <div class="pt-3">
                <a href="/worker/portfolio">
                  <Button variant="outline" size="sm" class="w-full">
                    Update Portfolio & KYC
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        {/if}

        <!-- Quick Access -->
        <Card title="Operational Shortcuts">
          <div class="space-y-2">
            <a
              href="/worker/availability"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <div class="flex items-center gap-2.5">
                <Calendar class="w-4 h-4 text-primary-600" />
                <span>Working Hours & Vacation</span>
              </div>
              <ArrowRight class="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="/worker/portfolio"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <div class="flex items-center gap-2.5">
                <ShieldCheck class="w-4 h-4 text-amber-600" />
                <span>Trade Certificates & KYC</span>
              </div>
              <ArrowRight class="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="/worker/bookings"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <div class="flex items-center gap-2.5">
                <Briefcase class="w-4 h-4 text-emerald-600" />
                <span>Job Bookings & History</span>
              </div>
              <ArrowRight class="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>
