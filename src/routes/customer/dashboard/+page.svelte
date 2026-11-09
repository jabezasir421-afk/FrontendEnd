<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Search, Calendar, MapPin, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Customer Dashboard — BlueCollar</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Welcome Banner -->
  <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
    <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs mb-3">
      Customer Space
    </span>
    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
      Welcome back, {authStore.user?.email || 'Valued Customer'}!
    </h1>
    <p class="mt-2 text-sm text-primary-100 max-w-xl">
      Find trusted trade professionals, schedule appointments, and manage all your service bookings in one place.
    </p>

    <div class="mt-6 flex flex-wrap gap-3">
      <a href="/workers">
        <Button variant="secondary" size="md">
          <Search class="w-4 h-4 mr-2" />
          Find Professionals
        </Button>
      </a>
      <a href="/customer/bookings">
        <Button variant="outline" size="md" class="border-white/30 text-white hover:bg-white/10">
          <Calendar class="w-4 h-4 mr-2" />
          View My Bookings
        </Button>
      </a>
    </div>
  </div>

  <!-- Quick Access Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <Card hover class="p-2">
      <div class="p-4">
        <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-3">
          <Search class="w-5 h-5" />
        </div>
        <h3 class="font-bold text-slate-900 dark:text-white mb-1">Browse Services</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Discover verified plumbers, electricians, carpenters, and painters.
        </p>
        <a href="/workers" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center">
          Explore Workers <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </Card>

    <Card hover class="p-2">
      <div class="p-4">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-3">
          <Calendar class="w-5 h-5" />
        </div>
        <h3 class="font-bold text-slate-900 dark:text-white mb-1">My Bookings</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Track upcoming appointments, job status, and completed services.
        </p>
        <a href="/customer/bookings" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center">
          View Bookings <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </Card>

    <Card hover class="p-2">
      <div class="p-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-3">
          <MapPin class="w-5 h-5" />
        </div>
        <h3 class="font-bold text-slate-900 dark:text-white mb-1">Address Book</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Manage your service locations, home addresses, and default booking pin.
        </p>
        <a href="/customer/addresses" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center">
          Manage Addresses <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    </Card>
  </div>
</div>
