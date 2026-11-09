<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { authApi } from '$lib/api/auth';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { MailCheck, CheckCircle2, ArrowRight } from 'lucide-svelte';

  let token = $state('');
  let resendEmail = $state('');
  let verifying = $state(false);
  let resending = $state(false);
  let verified = $state(false);
  let resendSuccess = $state(false);

  onMount(() => {
    const urlToken = page.url.searchParams.get('token');
    if (urlToken) {
      token = urlToken;
      handleVerify();
    }
  });

  async function handleVerify(e?: SubmitEvent) {
    if (e) e.preventDefault();
    if (!token.trim()) {
      toastStore.warning('Please enter a verification token', 'Validation');
      return;
    }

    verifying = true;
    try {
      await authApi.verifyEmail({ token: token.trim() });
      verified = true;
      toastStore.success('Your email address has been verified!', 'Email Verified');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Verification Failed');
      } else {
        toastStore.error('Could not verify email. The token may be expired or invalid.', 'Error');
      }
    } finally {
      verifying = false;
    }
  }

  async function handleResend(e: SubmitEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) {
      toastStore.warning('Please enter your account email address', 'Validation');
      return;
    }

    resending = true;
    try {
      await authApi.resendVerificationEmail({ email: resendEmail.trim() });
      resendSuccess = true;
      toastStore.success('If an unverified account exists, a new verification link was sent.', 'Verification Sent');
    } catch {
      resendSuccess = true;
    } finally {
      resending = false;
    }
  }
</script>

<svelte:head>
  <title>Verify Email — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-md mb-4">
        <MailCheck class="w-6 h-6" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Email Verification
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Confirm your email to complete registration security
      </p>
    </div>

    <Card class="p-2 sm:p-4">
      {#if verified}
        <div class="text-center py-6 space-y-4">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            Email successfully verified!
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your BlueCollar account email has been confirmed. You can now sign in.
          </p>
          <div class="pt-4">
            <a href="/login">
              <Button variant="primary" class="w-full">
                Proceed to Sign In
                <ArrowRight class="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      {:else}
        <form onsubmit={handleVerify} class="space-y-4">
          <Input
            label="Verification Token"
            placeholder="Paste verification token"
            bind:value={token}
            required
          />

          <Button
            type="submit"
            variant="primary"
            class="w-full"
            loading={verifying}
          >
            Verify Email
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Need a new verification link?
          </h4>
          {#if resendSuccess}
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              A verification email has been dispatched. Please check your inbox.
            </p>
          {:else}
            <form onsubmit={handleResend} class="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                bind:value={resendEmail}
                required
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                class="w-full"
                loading={resending}
              >
                Resend Verification Email
              </Button>
            </form>
          {/if}
        </div>

        <div class="mt-6 text-center">
          <a
            href="/login"
            class="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            &larr; Back to Sign In
          </a>
        </div>
      {/if}
    </Card>
  </div>
</div>
