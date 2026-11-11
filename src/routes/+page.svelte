<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createQuery } from '@tanstack/svelte-query';
  import { categoriesApi } from '$lib/api/categories';
  import {
    buildWorkerSearchUrl,
    catalogQueryKeys,
    getActiveCategories,
    getCatalogErrorMessage
  } from '$lib/api/catalog';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import {
    Search,
    ShieldCheck,
    Clock,
    Star,
    Award,
    ArrowRight,
    Wrench,
    CheckCircle2,
    Users,
    Sparkles,
    CalendarCheck,
    Hammer
  } from 'lucide-svelte';

  const categoriesQuery = createQuery({
    queryKey: catalogQueryKeys.categories(),
    queryFn: () => categoriesApi.getAll(0, 100),
    enabled: browser
  });
  let categories = $derived(getActiveCategories($categoriesQuery.data?.content).slice(0, 12));
  let searchCity = $state('');
  let searchCategoryId = $state('');

  function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    goto(buildWorkerSearchUrl(searchCity, searchCategoryId));
  }

  const categoryIcons: Record<string, typeof Wrench> = {
    Plumbing: Wrench,
    Electrical: Sparkles,
    Carpentry: Hammer,
    Painting: Award
  };
</script>

<svelte:head>
  <title>BlueCollar — Certified Home Services & Skilled Trades</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-100 dark:border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950/80 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-6">
        <ShieldCheck class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        Verified & Background-Checked Skilled Professionals
      </div>

      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
        Book Expert Tradespeople <br class="hidden sm:inline" />
        <span class="text-primary-600">On-Demand & Verified</span>
      </h1>

      <p class="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Connect with licensed plumbers, certified electricians, carpenters, painters, and technicians. Transparent hourly pricing and real-time slot scheduling.
      </p>

      <!-- Search Bar Form -->
      <form
        onsubmit={handleSearch}
        class="mt-8 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
      >
        <div class="relative flex-1">
          <input
            type="text"
            placeholder="Enter city (e.g. Bengaluru, Mumbai)..."
            bind:value={searchCity}
            class="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="sm:w-52">
          <select
            bind:value={searchCategoryId}
            class="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="">All Trade Categories</option>
            {#each categories as cat (cat.id)}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <Button type="submit" variant="primary" size="md" class="px-6 py-3 font-semibold text-sm">
          <Search class="w-4 h-4 mr-2" />
          Find Workers
        </Button>
      </form>

      <!-- Trust Metrics -->
      <div class="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center border-t border-slate-200 dark:border-slate-800 pt-6">
        <div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">100%</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">KYC Verified</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">₹0</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Hidden Fees</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">4.8★</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Avg Quality Rating</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Category Showcase -->
<section class="py-16 sm:py-20 bg-slate-50/50 dark:bg-slate-950">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Popular Trade Categories
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select a category to view specialized workers and available booking slots
        </p>
      </div>
      <a href="/workers" class="text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center">
        View All Professionals <ArrowRight class="w-4 h-4 ml-1" />
      </a>
    </div>

    {#if $categoriesQuery.isPending}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each Array(8) as _}
          <Skeleton class="h-28 rounded-2xl" />
        {/each}
      </div>
    {:else if $categoriesQuery.isError}
      <div role="alert" class="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900">
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {getCatalogErrorMessage($categoriesQuery.error, 'categories')}
        </p>
        <Button type="button" variant="outline" onclick={() => $categoriesQuery.refetch()}>
          Try again
        </Button>
      </div>
    {:else if categories.length === 0}
      <div class="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p class="text-sm text-slate-500">No categories found at the moment.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {#each categories as cat (cat.id)}
          {@const Icon = categoryIcons[cat.name] || Wrench}
          <a
            href={buildWorkerSearchUrl('', cat.id)}
            class="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all"
          >
            <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Icon class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {cat.name}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {cat.description || 'Verified local service specialists'}
            </p>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- How It Works Section -->
<section id="how-it-works" class="py-16 sm:py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        How BlueCollar Works
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
        A seamless 4-step process from discovery to completed service
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div class="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 font-black text-lg flex items-center justify-center mx-auto mb-4">
          1
        </div>
        <h3 class="font-bold text-base text-slate-900 dark:text-white mb-2">Search & Compare</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Filter workers by trade category, city, customer reviews, hourly rates, and verified trade certifications.
        </p>
      </div>

      <div class="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 font-black text-lg flex items-center justify-center mx-auto mb-4">
          2
        </div>
        <h3 class="font-bold text-base text-slate-900 dark:text-white mb-2">Pick an Open Slot</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          View the worker's real-time schedule and choose an available date and time slot that fits your schedule.
        </p>
      </div>

      <div class="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-black text-lg flex items-center justify-center mx-auto mb-4">
          3
        </div>
        <h3 class="font-bold text-base text-slate-900 dark:text-white mb-2">Service Execution</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The professional accepts the job, arrives at your doorstep, and completes the work with guaranteed quality.
        </p>
      </div>

      <div class="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-black text-lg flex items-center justify-center mx-auto mb-4">
          4
        </div>
        <h3 class="font-bold text-base text-slate-900 dark:text-white mb-2">Pay & Review</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Settle the transparent rate and submit a verified review to help the local community maintain high service standards.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Dual CTA Section -->
<section class="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Customer Card -->
      <Card class="p-4 sm:p-6 bg-gradient-to-br from-white to-primary-50/40 dark:from-slate-900 dark:to-primary-950/20 border-primary-200 dark:border-primary-900">
        <div class="p-4">
          <div class="inline-flex p-3 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 mb-4">
            <Users class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Need home repairs or skilled trade work?
          </h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Browse hundreds of background-checked workers ready to help with plumbing, electrical, carpentry, and maintenance.
          </p>
          <a href="/workers">
            <Button variant="primary" size="md">
              Find a Professional
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </Card>

      <!-- Worker Card -->
      <Card class="p-4 sm:p-6 bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20 border-amber-200 dark:border-amber-900">
        <div class="p-4">
          <div class="inline-flex p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
            <Hammer class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Are you a skilled technician or tradesperson?
          </h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Grow your client base, set your own hourly rates, choose your working hours, and manage service requests with zero commission overhead.
          </p>
          <a href="/register/worker">
            <Button variant="outline" size="md" class="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50">
              Join as Professional
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </Card>
    </div>
  </div>
</section>
