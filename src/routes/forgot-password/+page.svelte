<script lang="ts">
  import { authApi } from '$lib/api/auth';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { forgotPasswordSchema } from '$lib/schemas/auth';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-svelte';

  let email = $state('');
  let loading = $state(false);
  let submitted = $state(false);
  let formError = $state<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = null;

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      formError = validation.error.errors[0]?.message || 'Please enter a valid email address';
      return;
    }

    loading = true;
    try {
      await authApi.forgotPassword({ email });
      submitted = true;
      toastStore.success('Password reset instructions sent!', 'Request Processed');
    } catch {
      // Backend security practice: generic response even on error
      submitted = true;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Forgot Password — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-white shadow-md mb-4">
        <KeyRound class="w-6 h-6" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Reset your password
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Enter the email associated with your account
      </p>
    </div>

    <Card class="p-2 sm:p-4">
      {#if submitted}
        <div class="text-center py-6 space-y-4">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            Check your email
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            If an account is associated with <span class="font-semibold text-slate-800 dark:text-slate-200">{email}</span>, we have dispatched your password reset token.
          </p>
          <div class="pt-4 flex flex-col gap-2">
            <a href="/reset-password">
              <Button variant="primary" class="w-full">
                Enter Reset Token
                <ArrowRight class="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/login">
              <Button variant="ghost" class="w-full text-xs">
                Back to Sign In
              </Button>
            </a>
          </div>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            bind:value={email}
            error={formError ?? undefined}
            required
            autocomplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            class="w-full mt-2"
            {loading}
          >
            Send Reset Instructions
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <a
            href="/login"
            class="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Remember your password? Sign in
          </a>
        </div>
      {/if}
    </Card>
  </div>
</div>
