<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { workersApi } from '$lib/api/workers';
  import { reviewsApi } from '$lib/api/reviews';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import type {
    PublicWorkerResponse,
    PublicPortfolioResponse,
    AvailabilitySummaryResponse,
    ReviewStatsResponse,
    ReviewResponse,
    PortfolioImageResponse
  } from '$lib/types/api';
  import {
    ShieldCheck,
    Star,
    MapPin,
    Calendar,
    Clock,
    Award,
    Image,
    ArrowRight,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    User
  } from 'lucide-svelte';

  const workerId = page.params.id || '';

  let worker = $state<PublicWorkerResponse | null>(null);
  let availability = $state<AvailabilitySummaryResponse | null>(null);
  let portfolio = $state<PublicPortfolioResponse | null>(null);
  let reviewStats = $state<ReviewStatsResponse | null>(null);
  let reviews = $state<ReviewResponse[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Gallery modal state
  let selectedImage = $state<PortfolioImageResponse | null>(null);

  onMount(async () => {
    try {
      const [w, a, p, rs, r] = await Promise.all([
        workersApi.getById(workerId),
        workersApi.getPublicAvailability(workerId).catch(() => null),
        workersApi.getPublicPortfolio(workerId).catch(() => null),
        reviewsApi.getWorkerStats(workerId).catch(() => null),
        reviewsApi.getWorkerReviews(workerId, 0, 10).catch(() => ({ content: [] }))
      ]);

      worker = w;
      availability = a;
      portfolio = p;
      reviewStats = rs;
      reviews = r?.content || [];
    } catch {
      error = 'Could not load worker profile. The worker may not exist or is inactive.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>{worker ? `${worker.firstName} ${worker.lastName} — BlueCollar` : 'Worker Profile'}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  {#if loading}
    <div class="space-y-6">
      <Skeleton class="h-48 rounded-3xl" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <Skeleton class="h-40 rounded-2xl" />
          <Skeleton class="h-64 rounded-2xl" />
        </div>
        <Skeleton class="h-80 rounded-2xl" />
      </div>
    </div>
  {:else if error || !worker}
    <div class="max-w-md mx-auto text-center py-16 space-y-4">
      <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Profile Unavailable</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      <a href="/workers">
        <Button variant="primary" size="sm">Browse Other Workers</Button>
      </a>
    </div>
  {:else}
    <!-- Worker Hero Banner -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="flex items-start gap-5">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-3xl font-bold border-2 border-primary-100 dark:border-primary-900 shrink-0 overflow-hidden shadow-xs">
          {#if portfolio?.profilePhotoUrl}
            <img src={portfolio.profilePhotoUrl} alt="{worker.firstName} {worker.lastName}" class="w-full h-full object-cover" />
          {:else}
            {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
          {/if}
        </div>

        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {worker.firstName} {worker.lastName}
            </h1>
            {#if worker.verified}
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck class="w-3.5 h-3.5" />
                KYC Verified
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span class="font-semibold text-slate-700 dark:text-slate-200">
              {worker.categoryName}
            </span>
            <span>•</span>
            {#if worker.experienceYears}
              <span>{worker.experienceYears} years experience</span>
              <span>•</span>
            {/if}
            <div class="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
              <Star class="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{worker.averageRating ? worker.averageRating.toFixed(1) : 'New'}</span>
              <span class="font-normal text-slate-400">({worker.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Rate & Action -->
      <div class="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
        <div>
          <span class="text-xs text-slate-400 block md:text-right">Standard Rate</span>
          <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{worker.hourlyRate}
            <span class="text-xs font-normal text-slate-500">/hr</span>
          </span>
        </div>
        <a href={`/customer/book/${worker.id}`} class="w-full sm:w-auto">
          <Button variant="primary" size="lg" class="w-full">
            Book Appointment
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left 2 Cols: Bio, Skills, Portfolio, Reviews -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Bio / Overview -->
        <Card title="About Professional">
          <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {worker.bio || 'This professional has not added a detailed biography yet. They are verified and open for booking requests.'}
          </p>
        </Card>

        <!-- Skills & Specializations -->
        {#if worker.skills && worker.skills.length > 0}
          <Card title="Skills & Specializations">
            <div class="flex flex-wrap gap-2">
              {#each worker.skills as skill (skill.id)}
                <span class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {skill.name}
                </span>
              {/each}
            </div>
          </Card>
        {/if}

        <!-- Portfolio Gallery -->
        {#if portfolio?.images && portfolio.images.length > 0}
          <Card title="Previous Work Gallery">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each portfolio.images as img (img.id)}
                <button
                  type="button"
                  onclick={() => (selectedImage = img)}
                  class="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <img src={img.imageUrl} alt={img.title || 'Work sample'} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  {#if img.title}
                    <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[11px] font-medium truncate">
                      {img.title}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          </Card>
        {/if}

        <!-- Verified Certificates -->
        {#if portfolio?.certificates && portfolio.certificates.length > 0}
          <Card title="Trade Certifications & Licenses">
            <div class="space-y-3">
              {#each portfolio.certificates as cert (cert.id)}
                <div class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Award class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cert.certificateName}
                      </h4>
                      {#if cert.verified}
                        <span title="Verified by Administrator">
                          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </span>
                      {/if}
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Issued by {cert.issuingOrganization}
                      {#if cert.issueDate}
                        • {cert.issueDate}
                      {/if}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        {/if}

        <!-- Ratings & Reviews -->
        <Card title="Customer Reviews & Ratings">
          <!-- Summary Box -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-6">
            <div class="text-center sm:border-r border-slate-200 dark:border-slate-700 sm:pr-4 flex flex-col justify-center">
              <div class="text-4xl font-extrabold text-slate-900 dark:text-white">
                {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'}
              </div>
              <div class="flex justify-center gap-0.5 my-1">
                {#each [1, 2, 3, 4, 5] as star}
                  <Star class="w-4 h-4 {star <= Math.round(reviewStats?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}" />
                {/each}
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {reviewStats?.totalReviews || 0} customer reviews
              </p>
            </div>

            <!-- Distribution Bars -->
            <div class="sm:col-span-2 space-y-1.5 flex flex-col justify-center">
              {#each [5, 4, 3, 2, 1] as stars}
                {@const count = reviewStats?.ratingDistribution?.[stars] || 0}
                {@const total = reviewStats?.totalReviews || 1}
                {@const percent = Math.round((count / total) * 100)}
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-6 text-slate-500">{stars}★</span>
                  <div class="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div class="h-full bg-amber-400 rounded-full" style="width: {percent}%"></div>
                  </div>
                  <span class="w-8 text-right text-slate-400 text-[11px]">{count}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Reviews List -->
          {#if reviews.length === 0}
            <p class="text-xs text-slate-500 text-center py-6">
              No customer reviews yet. Be the first to book and rate this worker!
            </p>
          {:else}
            <div class="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {#each reviews as review (review.id)}
                <div class="pt-4 first:pt-0 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {review.customerName ? review.customerName.charAt(0) : 'C'}
                      </div>
                      <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {review.customerName || 'Verified Customer'}
                      </span>
                    </div>
                    <span class="text-[11px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div class="flex items-center gap-0.5">
                    {#each [1, 2, 3, 4, 5] as star}
                      <Star class="w-3.5 h-3.5 {star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}" />
                    {/each}
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              {/each}
            </div>
          {/if}
        </Card>
      </div>

      <!-- Right Col: Booking & Availability Sidebar -->
      <div class="space-y-6">
        <Card class="p-6 space-y-6 sticky top-24">
          <div>
            <h3 class="font-bold text-base text-slate-900 dark:text-white mb-1">
              Book this Professional
            </h3>
            <p class="text-xs text-slate-500">
              Select date, open 2-hour slot, and describe your requirement
            </p>
          </div>

          <!-- Availability Status Checklist -->
          <div class="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Online Status</span>
              {#if availability?.online}
                <span class="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </span>
              {:else}
                <span class="text-slate-400">Offline</span>
              {/if}
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-500">Taking New Bookings</span>
              {#if availability?.bookable}
                <span class="text-emerald-600 font-semibold">Available</span>
              {:else}
                <span class="text-rose-600 font-semibold">Currently Busy</span>
              {/if}
            </div>

            {#if availability?.vacationMode}
              <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px]">
                Worker is currently on vacation mode. Bookings may be delayed.
              </div>
            {/if}
          </div>

          <!-- Booking Call to Action -->
          <a href={`/customer/book/${worker.id}`} class="block">
            <Button variant="primary" size="lg" class="w-full">
              Proceed to Booking
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
          </a>

          <div class="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
              <span>Transparent hourly quote</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
              <span>Free cancellation before worker acceptance</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
              <span>Direct communication on confirmation</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>

<!-- Image Preview Modal -->
{#if selectedImage}
  <Modal open={true} onclose={() => (selectedImage = null)} size="lg" title={selectedImage.title || 'Work Image'}>
    <div class="space-y-4">
      <div class="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <img src={selectedImage.imageUrl} alt={selectedImage.title || 'Work sample'} class="max-h-full max-w-full object-contain" />
      </div>
      {#if selectedImage.description}
        <p class="text-xs text-slate-600 dark:text-slate-300">{selectedImage.description}</p>
      {/if}
    </div>
  </Modal>
{/if}
