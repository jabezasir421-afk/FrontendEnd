<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { searchApi } from '$lib/api/search';
  import { categoriesApi } from '$lib/api/categories';
  import { skillsApi } from '$lib/api/skills';
  import {
    catalogQueryKeys,
    getActiveCategories,
    getActiveSkills,
    getCatalogErrorMessage
  } from '$lib/api/catalog';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { WorkerSearchResultResponse } from '$lib/types/api';
  import {
    Search,
    MapPin,
    Star,
    ShieldCheck,
    SlidersHorizontal,
    ArrowRight,
    RotateCcw,
    CheckCircle2
  } from 'lucide-svelte';

  // State variables for filters
  let city = $state('');
  let categoryId = $state('');
  let skillIds = $state<string[]>([]);
  let matchAnySkill = $state(false);
  let minRating = $state<number | undefined>(undefined);
  let minExperience = $state<number | undefined>(undefined);
  let maxExperience = $state<number | undefined>(undefined);
  let minPrice = $state<number | undefined>(undefined);
  let maxPrice = $state<number | undefined>(undefined);
  let availableOnly = $state(false);
  let verified = $state(true);
  let sortOption = $state<'rating' | 'price' | 'experience' | 'createdAt'>('rating');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let currentPage = $state(0);
  let pageSize = 12;

  // Data state
  let workers = $state<WorkerSearchResultResponse[]>([]);
  let totalElements = $state(0);
  let totalPages = $state(0);
  let loading = $state(true);
  const categoriesQuery = createQuery({
    queryKey: catalogQueryKeys.categories(),
    queryFn: () => categoriesApi.getAll(0, 100),
    enabled: browser
  });
  const skillsQuery = createQuery({
    queryKey: catalogQueryKeys.skills(),
    queryFn: () => skillsApi.getAll(0, 100),
    enabled: browser
  });
  let categories = $derived(getActiveCategories($categoriesQuery.data?.content));
  let skills = $derived(getActiveSkills($skillsQuery.data?.content));
  let showMobileFilters = $state(false);
  let searchError = $state<string | null>(null);

  // Sync state with URL params
  function readParamsFromUrl() {
    const params = page.url.searchParams;
    city = params.get('city') || '';
    categoryId = params.get('categoryId') || '';
    skillIds = params.getAll('skillIds');
    matchAnySkill = params.get('matchAnySkill') === 'true';
    const ratingParam = params.get('minRating');
    minRating = ratingParam ? Number(ratingParam) : undefined;
    const minExp = params.get('minExperience');
    minExperience = minExp ? Number(minExp) : undefined;
    const maxExp = params.get('maxExperience');
    maxExperience = maxExp ? Number(maxExp) : undefined;
    const minP = params.get('minPrice');
    minPrice = minP ? Number(minP) : undefined;
    const maxP = params.get('maxPrice');
    maxPrice = maxP ? Number(maxP) : undefined;
    availableOnly = params.get('available') === 'true';
    verified = params.get('verified') !== 'false';
    const requestedSort = params.get('sort');
    sortOption =
      requestedSort === 'price' ||
      requestedSort === 'experience' ||
      requestedSort === 'createdAt'
        ? requestedSort
        : 'rating';
    sortDirection = (params.get('direction') as 'asc' | 'desc') || 'desc';
    currentPage = Number(params.get('page') || 0);
  }

  async function fetchWorkers() {
    loading = true;
    try {
      searchError = null;
      const res = await searchApi.searchWorkers({
        city: city || undefined,
        categoryId: categoryId || undefined,
        skillIds: skillIds.length ? skillIds : undefined,
        matchAnySkill: skillIds.length ? matchAnySkill : undefined,
        minRating: minRating || undefined,
        minExperience,
        maxExperience,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        available: availableOnly ? true : undefined,
        verified,
        sort: sortOption,
        direction: sortDirection,
        page: currentPage,
        size: pageSize
      });

      workers = res?.results || [];
      totalElements = res?.totalElements || 0;
      totalPages = Math.ceil(totalElements / pageSize) || 1;
    } catch (err) {
      workers = [];
      totalElements = 0;
      totalPages = 1;
      searchError = err instanceof Error ? err.message : 'Could not load workers. Please try again.';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (categoryId) params.set('categoryId', categoryId);
    skillIds.forEach((id) => params.append('skillIds', id));
    if (skillIds.length && matchAnySkill) params.set('matchAnySkill', 'true');
    if (minRating) params.set('minRating', String(minRating));
    if (minExperience !== undefined) params.set('minExperience', String(minExperience));
    if (maxExperience !== undefined) params.set('maxExperience', String(maxExperience));
    if (minPrice !== undefined && minPrice > 0) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined && maxPrice > 0) params.set('maxPrice', String(maxPrice));
    if (availableOnly) params.set('available', 'true');
    if (!verified) params.set('verified', 'false');
    params.set('sort', sortOption);
    params.set('direction', sortDirection);
    params.set('page', '0');

    goto(`/workers?${params.toString()}`, { keepFocus: true, noScroll: true });
    currentPage = 0;
    fetchWorkers();
    showMobileFilters = false;
  }

  function handlePageChange(newPage: number) {
    currentPage = newPage;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(newPage));
    goto(`/workers?${params.toString()}`, { keepFocus: true });
    fetchWorkers();
  }

  function resetFilters() {
    city = '';
    categoryId = '';
    skillIds = [];
    matchAnySkill = false;
    minRating = undefined;
    minExperience = undefined;
    maxExperience = undefined;
    minPrice = undefined;
    maxPrice = undefined;
    availableOnly = false;
    verified = true;
    sortOption = 'rating';
    sortDirection = 'desc';
    currentPage = 0;
    goto('/workers');
    fetchWorkers();
  }

  onMount(async () => {
    readParamsFromUrl();
    await fetchWorkers();
  });
</script>

<svelte:head>
  <title>Find Skilled Workers — BlueCollar</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Find Skilled Professionals
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        Browse certified trade workers, view customer reviews, and book direct service appointments.
      </p>
    </div>

    <!-- Mobile Filter Toggle -->
    <div class="flex items-center gap-2 md:hidden">
      <Button
        variant="outline"
        size="sm"
        onclick={() => (showMobileFilters = !showMobileFilters)}
        class="w-full"
      >
        <SlidersHorizontal class="w-4 h-4 mr-2" />
        Filters {categoryId || city || minRating ? '(Active)' : ''}
      </Button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
    <!-- Desktop Filters Sidebar -->
    <aside class="space-y-6 {showMobileFilters ? '' : 'hidden'} lg:block">
      <Card class="p-5 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Filters
          </h2>
          <button
            type="button"
            onclick={resetFilters}
            class="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center"
          >
            <RotateCcw class="w-3 h-3 mr-1" />
            Reset
          </button>
        </div>

        <!-- Skills Filter -->
        <div class="space-y-2">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Skills</span>
          <div class="max-h-36 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
            {#each skills as skill (skill.id)}
              <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={skillIds.includes(skill.id)}
                  onchange={() =>
                    (skillIds = skillIds.includes(skill.id)
                      ? skillIds.filter((id) => id !== skill.id)
                      : [...skillIds, skill.id])}
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>{skill.name}</span>
              </label>
            {/each}
          </div>
          {#if skillIds.length > 1}
            <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <input type="checkbox" bind:checked={matchAnySkill} class="rounded text-primary-600" />
              Match any selected skill
            </label>
          {/if}
        </div>

        <!-- City Filter -->
        <div class="space-y-1.5">
          <label for="filter-city" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            City / Location
          </label>
          <div class="relative">
            <input
              id="filter-city"
              type="text"
              placeholder="e.g. Bengaluru"
              bind:value={city}
              onkeydown={(e) => e.key === 'Enter' && applyFilters()}
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <!-- Experience Range -->
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Experience (years)</span>
            <div class="grid grid-cols-2 gap-2">
              <input type="number" min="0" placeholder="Min" bind:value={minExperience}
                class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
              <input type="number" min="0" placeholder="Max" bind:value={maxExperience}
                class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
          </div>
        </div>

        <!-- Category Filter -->
        <div class="space-y-1.5">
          <label for="filter-cat" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Trade Category
          </label>
          <select
            id="filter-cat"
            bind:value={categoryId}
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {#each categories as cat (cat.id)}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
          {#if $categoriesQuery.isError}
            <p role="alert" class="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {getCatalogErrorMessage($categoriesQuery.error, 'categories')}
              <button type="button" class="font-semibold underline" onclick={() => $categoriesQuery.refetch()}>
                Retry
              </button>
            </p>
          {/if}
        </div>

        <!-- Minimum Rating Filter -->
        <div class="space-y-1.5">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Minimum Rating
          </span>
          <div class="space-y-1">
            {#each [4.5, 4.0, 3.5] as r}
              <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === r}
                  onchange={() => (minRating = r)}
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span class="flex items-center">
                  {r}★ & above
                </span>
              </label>
            {/each}
            <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={minRating === undefined}
                onchange={() => (minRating = undefined)}
                class="rounded text-primary-600 focus:ring-primary-500"
              />
              <span>Any Rating</span>
            </label>
          </div>
        </div>

        <!-- Price Range -->
        <div class="space-y-1.5">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Hourly Rate (₹/hr)
          </span>
          <div class="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              bind:value={minPrice}
              class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max"
              min="0"
              bind:value={maxPrice}
              class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <!-- Availability Toggle -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={availableOnly}
              class="rounded text-primary-600 focus:ring-primary-500"
            />
            <span>Available for Bookings</span>
          </label>
          <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer mt-3">
            <input type="checkbox" bind:checked={verified} class="rounded text-primary-600 focus:ring-primary-500" />
            Verified workers only
          </label>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onclick={applyFilters}
          class="w-full mt-4"
        >
          Apply Filters
        </Button>
      </Card>
    </aside>

    <!-- Main Results Column -->
    <main class="lg:col-span-3 space-y-6">
      <!-- Sorting & Active Filters Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div class="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          {#if loading}
            Searching workers...
          {:else}
            Found <span class="font-bold text-slate-900 dark:text-white">{totalElements}</span> professionals
          {/if}
        </div>

        {#if searchError}
          <div role="alert" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            <div class="flex items-center justify-between gap-4">
              <span>{searchError}</span>
              <Button variant="outline" size="sm" onclick={fetchWorkers}>Retry</Button>
            </div>
          </div>
        {/if}

        <!-- Sort Select -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
          <select
            bind:value={sortOption}
            onchange={applyFilters}
            class="text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="rating">Highest Rating</option>
            <option value="price">Hourly Rate</option>
            <option value="experience">Experience</option>
            <option value="createdAt">Newest Joined</option>
          </select>
          <select
            bind:value={sortDirection}
            onchange={applyFilters}
            class="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="desc">High → Low</option>
            <option value="asc">Low → High</option>
          </select>
        </div>
      </div>

      <!-- Workers Grid -->
      {#if loading}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _}
            <Skeleton class="h-64 rounded-2xl" />
          {/each}
        </div>
      {:else if workers.length === 0}
        <EmptyState
          title="No workers match your search criteria"
          description="Try broadening your search by clearing category or location filters."
        >
          {#snippet action()}
            <Button variant="outline" size="sm" onclick={resetFilters}>
              <RotateCcw class="w-4 h-4 mr-2" />
              Reset All Filters
            </Button>
          {/snippet}
        </EmptyState>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each workers as worker (worker.id)}
            <Card hover class="flex flex-col justify-between p-0 overflow-hidden">
              <div class="p-5 space-y-4">
                <!-- Header with Avatar and Basic Info -->
                <div class="flex items-start gap-3">
                  <div class="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-base text-primary-600 dark:text-primary-400 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                    {#if worker.profilePhotoUrl}
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.fullName}
                        class="w-full h-full object-cover"
                      />
                    {:else}
                      {worker.fullName.charAt(0)}
                    {/if}
                    {#if worker.available}
                      <span
                        class="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                        title="Available for booking"
                      ></span>
                    {/if}
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {worker.fullName}
                      </h3>
                      {#if worker.verified}
                        <span title="KYC Verified">
                          <ShieldCheck class="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                        </span>
                      {/if}
                    </div>

                    <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin class="w-3 h-3 text-slate-400" />
                      {worker.primaryCity || 'Local Service'}
                    </p>
                  </div>
                </div>

                <!-- Category & Rate -->
                <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Badge variant="primary" size="sm">
                    {worker.categoryName}
                  </Badge>
                  <div class="font-bold text-slate-900 dark:text-white">
                    ₹{worker.hourlyRate} <span class="font-normal text-[11px] text-slate-500">/hr</span>
                  </div>
                </div>

                <!-- Rating & Reviews -->
                <div class="flex items-center gap-1 text-xs">
                  <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span class="font-bold text-slate-800 dark:text-slate-200">
                    {worker.averageRating ? worker.averageRating.toFixed(1) : 'New'}
                  </span>
                  <span class="text-slate-400">
                    ({worker.reviewCount} {worker.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                <!-- Skills Chips -->
                {#if worker.skillNames && worker.skillNames.length > 0}
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    {#each worker.skillNames.slice(0, 3) as skill}
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {skill}
                      </span>
                    {/each}
                    {#if worker.skillNames.length > 3}
                      <span class="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
                        +{worker.skillNames.length - 3}
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Card Action Button -->
              <div class="p-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <a href={`/workers/${worker.id}`} class="block w-full">
                  <Button variant="primary" size="sm" class="w-full text-xs">
                    View Profile & Book
                    <ArrowRight class="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </a>
              </div>
            </Card>
          {/each}
        </div>

        <!-- Pagination Controls -->
        <Pagination
          page={currentPage}
          {totalPages}
          {totalElements}
          size={pageSize}
          onPageChange={handlePageChange}
        />
      {/if}
    </main>
  </div>
</div>
