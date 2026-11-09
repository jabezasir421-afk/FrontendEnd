<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { authApi } from '$lib/api/auth';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { resetPasswordSchema } from '$lib/schemas/auth';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { ShieldCheck, ArrowRight } from 'lucide-svelte';

  let token = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let formErrors = $state<Record<string, string>>({});

  onMount(() => {
    const urlToken = page.url.searchParams.get('token');
    if (urlToken) {
      token = urlToken;
    }
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    formErrors = {};

    const validation = resetPasswordSchema.safeParse({
      token,
      newPassword,
      confirmPassword
    });

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
      await authApi.resetPassword({ token, newPassword });
      toastStore.success('Your password has been reset successfully. Please sign in with your new password.', 'Password Reset');
      goto('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Reset Failed');
      } else {
        toastStore.error('Could not reset password. Your token may be invalid or expired.', 'Error');
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-md mb-4">
        <ShieldCheck class="w-6 h-6" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Create new password
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Enter your reset token and choose a strong new password
      </p>
    </div>

    <Card class="p-2 sm:p-4">
      <form onsubmit={handleSubmit} class="space-y-4">
        <Input
          label="Reset Token"
          placeholder="Paste token from email"
          bind:value={token}
          error={formErrors.token}
          required
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          helper="Min 8 chars, uppercase, lowercase, number & special char"
          bind:value={newPassword}
          error={formErrors.newPassword}
          required
          autocomplete="new-password"
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          bind:value={confirmPassword}
          error={formErrors.confirmPassword}
          required
          autocomplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          class="w-full mt-2"
          {loading}
        >
          Reset Password
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <a
          href="/login"
          class="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          &larr; Back to Sign In
        </a>
      </div>
    </Card>
  </div>
</div>
