<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { categoriesApi } from '$lib/api/categories';
  import { skillsApi } from '$lib/api/skills';
  import { registerWorkerSchema } from '$lib/schemas/auth';
  import { ApiError } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import { Hammer, ArrowRight, Check } from 'lucide-svelte';
  import type { CategoryResponse, SkillResponse } from '$lib/types/api';

  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let phoneNumber = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let gender = $state<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  let categoryId = $state('');
  let selectedSkillIds = $state<string[]>([]);
  let hourlyRate = $state<number>(350);
  let experienceYears = $state<number>(3);
  let bio = $state('');
  let primaryCity = $state('');
  let primaryState = $state('');

  let categories = $state<CategoryResponse[]>([]);
  let skills = $state<SkillResponse[]>([]);
  let loadingData = $state(true);
  let submitting = $state(false);
  let formErrors = $state<Record<string, string>>({});

  onMount(async () => {
    try {
      const [catsPage, skillsPage] = await Promise.all([
        categoriesApi.getAll(0, 100),
        skillsApi.getAll(0, 100)
      ]);
      categories = catsPage?.content?.filter((c) => c.active) || [];
      skills = skillsPage?.content?.filter((s) => s.active) || [];
      if (categories.length > 0 && !categoryId) {
        categoryId = categories[0].id;
      }
    } catch {
      toastStore.error('Failed to load categories and skills. Please refresh the page.', 'Data Load Error');
    } finally {
      loadingData = false;
    }
  });

  function toggleSkill(id: string) {
    if (selectedSkillIds.includes(id)) {
      selectedSkillIds = selectedSkillIds.filter((s) => s !== id);
    } else {
      selectedSkillIds = [...selectedSkillIds, id];
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    formErrors = {};

    const payload = {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      gender,
      categoryId,
      skillIds: selectedSkillIds,
      hourlyRate: Number(hourlyRate),
      experienceYears: Number(experienceYears),
      bio: bio || null,
      primaryCity,
      primaryState
    };

    const validation = registerWorkerSchema.safeParse(payload);
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          formErrors[err.path[0] as string] = err.message;
        }
      });
      toastStore.warning('Please fix the errors in the form before submitting.', 'Validation Error');
      return;
    }

    submitting = true;
    try {
      await authStore.registerWorker({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        gender,
        categoryId,
        skillIds: selectedSkillIds,
        hourlyRate: Number(hourlyRate),
        experienceYears: Number(experienceYears),
        bio: bio || undefined,
        primaryCity,
        primaryState
      });

      toastStore.success('Worker account registered successfully! Complete your KYC next.', 'Welcome to BlueCollar');
      goto('/worker/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => {
            formErrors[fe.field] = fe.message;
          });
        }
        toastStore.error(err.message, 'Worker Registration Failed');
      } else {
        toastStore.error('Could not complete worker registration. Please try again.', 'Error');
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Worker Registration — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl mx-auto space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-white shadow-md mb-4">
        <Hammer class="w-6 h-6" />
      </div>
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Join as a Professional Trade Worker
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
        Offer your services directly to local customers. Manage your own schedule, rates, and bookings.
      </p>
    </div>

    <Card class="p-4 sm:p-6">
      <form onsubmit={handleSubmit} class="space-y-6">
        <!-- Personal Credentials Section -->
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Personal Credentials
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="e.g. Ramesh"
              bind:value={firstName}
              error={formErrors.firstName}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Kumar"
              bind:value={lastName}
              error={formErrors.lastName}
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="ramesh@worker.com"
              bind:value={email}
              error={formErrors.email}
              required
              autocomplete="email"
            />
            <Input
              label="Mobile Phone Number"
              type="tel"
              placeholder="+919876543210 or 9876543210"
              helper="Valid Indian mobile number"
              bind:value={phoneNumber}
              error={formErrors.phoneNumber}
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              helper="Min 8 chars, uppercase, lowercase, number & special char"
              bind:value={password}
              error={formErrors.password}
              required
              autocomplete="new-password"
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              bind:value={confirmPassword}
              error={formErrors.confirmPassword}
              required
              autocomplete="new-password"
            />
          </div>

          <div class="mt-4">
            <Select
              label="Gender"
              bind:value={gender}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' }
              ]}
            />
          </div>
        </div>

        <!-- Trade & Skills Section -->
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Trade & Service Details
          </h3>

          <div class="space-y-4">
            <Select
              label="Primary Service Category"
              bind:value={categoryId}
              error={formErrors.categoryId}
              required
              disabled={loadingData}
              placeholder="Select trade category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />

            <!-- Skills Selection Chips -->
            <div>
              <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Skills & Specializations <span class="text-rose-500">*</span>
              </span>
              {#if formErrors.skillIds}
                <p class="text-xs text-rose-600 mb-2 font-medium">{formErrors.skillIds}</p>
              {/if}

              <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                {#if loadingData}
                  <p class="text-xs text-slate-400 p-2">Loading skills...</p>
                {:else if skills.length === 0}
                  <p class="text-xs text-slate-400 p-2">No skills available.</p>
                {:else}
                  {#each skills as skill (skill.id)}
                    {@const isSelected = selectedSkillIds.includes(skill.id)}
                    <button
                      type="button"
                      onclick={() => toggleSkill(skill.id)}
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all {isSelected
                        ? 'bg-primary-600 text-white shadow-xs font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'}"
                    >
                      {#if isSelected}
                        <Check class="w-3.5 h-3.5" />
                      {/if}
                      {skill.name}
                    </button>
                  {/each}
                {/if}
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select all skills you are competent and equipped to perform
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Hourly Rate (₹)"
                type="number"
                min="100"
                max="10000"
                step="50"
                bind:value={hourlyRate}
                error={formErrors.hourlyRate}
                helper="Between ₹100 and ₹10,000"
                required
              />

              <Input
                label="Experience (Years)"
                type="number"
                min="0"
                max="50"
                bind:value={experienceYears}
                error={formErrors.experienceYears}
                required
              />
            </div>

            <Textarea
              label="Professional Bio / Experience Summary"
              placeholder="Tell customers about your background, tools, work ethic, and service guarantees..."
              rows={3}
              bind:value={bio}
              error={formErrors.bio}
            />
          </div>
        </div>

        <!-- Location Section -->
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Primary Operating Location
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Bengaluru"
              bind:value={primaryCity}
              error={formErrors.primaryCity}
              required
            />
            <Input
              label="State"
              placeholder="e.g. Karnataka"
              bind:value={primaryState}
              error={formErrors.primaryState}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          class="w-full py-3 text-base"
          loading={submitting}
        >
          Submit Worker Registration
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          Already registered?{' '}
          <a href="/login" class="font-semibold text-primary-600 hover:underline dark:text-primary-400">
            Sign In &rarr;
          </a>
        </p>
      </div>
    </Card>
  </div>
</div>
