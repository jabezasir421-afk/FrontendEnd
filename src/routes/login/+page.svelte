<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { loginSchema } from '$lib/schemas/auth';
  import { ApiError } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Hammer, Lock, Mail, ArrowRight } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let formErrors = $state<Record<string, string>>({});

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    formErrors = {};

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          formErrors[err.path[0] as string] = err.message;
        }
      });
      return;
    }

    loading = true;
    try {
      const auth = await authStore.login({ email, password });
      toastStore.success('Signed in successfully!', 'Welcome back');

      const redirect = page.url.searchParams.get('redirect');
      if (redirect) {
        goto(redirect);
      } else if (auth.role === 'CUSTOMER') {
        goto('/customer/dashboard');
      } else if (auth.role === 'WORKER') {
        goto('/worker/dashboard');
      } else {
        goto('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => {
            formErrors[fe.field] = fe.message;
          });
        }
        toastStore.error(err.message, 'Sign In Failed');
      } else {
        toastStore.error('An unexpected error occurred. Please check your credentials.', 'Error');
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-md mb-4">
        <Hammer class="w-6 h-6" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Sign in to your account
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Access customer bookings or worker service management
      </p>
    </div>

    <Card class="p-2 sm:p-4">
      <form onsubmit={handleSubmit} class="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          bind:value={email}
          error={formErrors.email}
          required
          autocomplete="email"
        />

        <div class="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            bind:value={password}
            error={formErrors.password}
            required
            autocomplete="current-password"
          />
          <div class="flex justify-end pt-1">
            <a
              href="/forgot-password"
              class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          class="w-full mt-2"
          {loading}
        >
          Sign In
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          New to BlueCollar?
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="/register/customer"
            class="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
          >
            Create Customer Account &rarr;
          </a>
          <span class="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <a
            href="/register/worker"
            class="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
          >
            Join as Professional Worker &rarr;
          </a>
        </div>
      </div>
    </Card>
  </div>
</div>
