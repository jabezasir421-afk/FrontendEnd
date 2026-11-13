<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { notificationsApi } from '$lib/api/notifications';
  import { onMount } from 'svelte';
  import {
    Hammer,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    Calendar,
    MapPin,
    Briefcase,
    Search,
    ChevronDown,
    FileCheck
  } from 'lucide-svelte';

  let mobileMenuOpen = $state(false);
  let userMenuOpen = $state(false);
  let unreadNotificationsCount = $state(0);

  async function fetchUnreadCount() {
    if (authStore.isAuthenticated) {
      try {
        unreadNotificationsCount = await notificationsApi.getUnreadCount();
      } catch {
        // Silently ignore if network fails
      }
    }
  }

  onMount(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  });

  async function handleLogout() {
    userMenuOpen = false;
    mobileMenuOpen = false;
    await authStore.logout();
    goto('/login');
  }

  function isActive(path: string): boolean {
    return page.url.pathname === path || (path !== '/' && page.url.pathname.startsWith(path));
  }
</script>

<header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2 group">
          <div class="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs group-hover:bg-primary-700 transition-colors">
            <Hammer class="w-5 h-5" />
          </div>
          <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Blue<span class="text-primary-600">Collar</span>
          </span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="hidden md:flex items-center ml-8 space-x-1" aria-label="Main Navigation">
          {#if !authStore.isAuthenticated}
            <a
              href="/workers"
              class="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors {isActive('/workers')
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              Explore Services
            </a>
          {:else if authStore.isCustomer}
            <a
              href="/workers"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/workers')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <Search class="w-4 h-4" />
              Find Workers
            </a>
            <a
              href="/customer/bookings"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/customer/bookings')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <Calendar class="w-4 h-4" />
              My Bookings
            </a>
            <a
              href="/customer/addresses"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/customer/addresses')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <MapPin class="w-4 h-4" />
              Addresses
            </a>
          {:else if authStore.isWorker}
            <a
              href="/worker/dashboard"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/worker/dashboard')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              Dashboard
            </a>
            <a
              href="/worker/bookings"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/worker/bookings')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <Briefcase class="w-4 h-4" />
              Jobs
            </a>
            <a
              href="/worker/availability"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/worker/availability')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <Calendar class="w-4 h-4" />
              Availability
            </a>
            <a
              href="/worker/portfolio"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/worker/portfolio')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              Portfolio & KYC
            </a>
          {:else if authStore.isAdmin}
            <a
              href="/admin/documents"
              class="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors {isActive('/admin/documents')
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}"
            >
              <FileCheck class="w-4 h-4" />
              Verification Queue
            </a>
          {/if}
        </nav>
      </div>

      <!-- Right Action Items -->
      <div class="hidden md:flex items-center space-x-3">
        {#if !authStore.isAuthenticated}
          <a
            href="/register/worker"
            class="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Become a Worker
          </a>
          <a
            href="/login"
            class="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/register/customer"
            class="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 shadow-xs transition-colors"
          >
            Get Started
          </a>
        {:else}
          <!-- Notifications Bell -->
          <a
            href={authStore.isCustomer ? '/customer/notifications' : '/worker/notifications'}
            class="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell class="w-5 h-5" />
            {#if unreadNotificationsCount > 0}
              <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            {/if}
          </a>

          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              type="button"
              onclick={() => (userMenuOpen = !userMenuOpen)}
              class="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-expanded={userMenuOpen}
            >
              <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs uppercase">
                {authStore.user?.email?.[0] || 'U'}
              </div>
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {authStore.user?.email || 'Account'}
              </span>
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>

            {#if userMenuOpen}
              <div
                class="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p class="text-xs text-slate-400">Signed in as</p>
                  <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {authStore.user?.email}
                  </p>
                  <span class="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                    {authStore.role}
                  </span>
                </div>

                {#if authStore.isCustomer}
                  <a
                    href="/customer/profile"
                    onclick={() => (userMenuOpen = false)}
                    class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User class="w-4 h-4 text-slate-400" />
                    My Profile
                  </a>
                {:else if authStore.isAdmin}
                  <a
                    href="/admin/documents"
                    onclick={() => (userMenuOpen = false)}
                    class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FileCheck class="w-4 h-4 text-slate-400" />
                    Verification Queue
                  </a>
                {/if}

                <button
                  type="button"
                  onclick={handleLogout}
                  class="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left transition-colors"
                >
                  <LogOut class="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Mobile Hamburger Button -->
      <div class="flex items-center md:hidden">
        <button
          type="button"
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
          class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {#if mobileMenuOpen}
            <X class="w-6 h-6" />
          {:else}
            <Menu class="w-6 h-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Drawer -->
  {#if mobileMenuOpen}
    <div class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2">
      {#if !authStore.isAuthenticated}
        <a
          href="/workers"
          onclick={() => (mobileMenuOpen = false)}
          class="block px-3 py-2 text-base font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Explore Services
        </a>
        <a
          href="/register/worker"
          onclick={() => (mobileMenuOpen = false)}
          class="block px-3 py-2 text-base font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Become a Worker
        </a>
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <a
            href="/login"
            onclick={() => (mobileMenuOpen = false)}
            class="text-center w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Sign In
          </a>
          <a
            href="/register/customer"
            onclick={() => (mobileMenuOpen = false)}
            class="text-center w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-xs"
          >
            Get Started
          </a>
        </div>
      {:else}
        {#if authStore.isCustomer}
          <a
            href="/workers"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <Search class="w-4 h-4 text-slate-400" />
            Find Workers
          </a>
          <a
            href="/customer/bookings"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <Calendar class="w-4 h-4 text-slate-400" />
            My Bookings
          </a>
          <a
            href="/customer/addresses"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <MapPin class="w-4 h-4 text-slate-400" />
            Addresses
          </a>
          <a
            href="/customer/profile"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <User class="w-4 h-4 text-slate-400" />
            My Profile
          </a>
        {:else if authStore.isWorker}
          <a
            href="/worker/dashboard"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            Dashboard
          </a>
          <a
            href="/worker/bookings"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <Briefcase class="w-4 h-4 text-slate-400" />
            Jobs
          </a>
          <a
            href="/worker/availability"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <Calendar class="w-4 h-4 text-slate-400" />
            Availability
          </a>
          <a
            href="/worker/portfolio"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            Portfolio & KYC
          </a>
        {:else if authStore.isAdmin}
          <a
            href="/admin/documents"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            <FileCheck class="w-4 h-4 text-slate-400" />
            Verification Queue
          </a>
        {/if}

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onclick={handleLogout}
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold text-sm"
          >
            <LogOut class="w-4 h-4" />
            Sign Out
          </button>
        </div>
      {/if}
    </div>
  {/if}
</header>
