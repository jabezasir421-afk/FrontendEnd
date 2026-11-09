<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { registerCustomerSchema } from '$lib/schemas/auth';
  import { ApiError } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { UserPlus, ArrowRight } from 'lucide-svelte';

  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let phoneNumber = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  let loading = $state(false);
  let formErrors = $state<Record<string, string>>({});

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    formErrors = {};

    const payload = {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword
    };

    const validation = registerCustomerSchema.safeParse(payload);
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
      await authStore.registerCustomer({
        firstName,
        lastName,
        email,
        phoneNumber,
        password
      });

      toastStore.success('Account created successfully! Welcome to BlueCollar.', 'Registration Complete');
      goto('/customer/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => {
            formErrors[fe.field] = fe.message;
          });
        }
        toastStore.error(err.message, 'Registration Failed');
      } else {
        toastStore.error('Could not create account. Please check your information and try again.', 'Error');
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Customer Registration — BlueCollar</title>
</svelte:head>

<div class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-lg w-full space-y-8">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-md mb-4">
        <UserPlus class="w-6 h-6" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Create your Customer Account
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Book certified home services, repair specialists, and skilled professionals
      </p>
    </div>

    <Card class="p-2 sm:p-4">
      <form onsubmit={handleSubmit} class="space-y-4">
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

        <Input
          label="Email Address"
          type="email"
          placeholder="ramesh@example.com"
          bind:value={email}
          error={formErrors.email}
          required
          autocomplete="email"
        />

        <Input
          label="Mobile Phone Number"
          type="tel"
          placeholder="+919876543210 or 9876543210"
          helper="Valid 10-digit Indian mobile number"
          bind:value={phoneNumber}
          error={formErrors.phoneNumber}
          required
        />

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

        <Button
          type="submit"
          variant="primary"
          class="w-full mt-4"
          {loading}
        >
          Create Customer Account
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </form>

      <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <a href="/login" class="font-semibold text-primary-600 hover:underline dark:text-primary-400">
            Sign In &rarr;
          </a>
        </p>
        <p class="text-xs text-slate-500">
          Looking to offer your services?{' '}
          <a href="/register/worker" class="font-semibold text-amber-600 hover:underline dark:text-amber-400">
            Register as a Worker &rarr;
          </a>
        </p>
      </div>
    </Card>
  </div>
</div>
