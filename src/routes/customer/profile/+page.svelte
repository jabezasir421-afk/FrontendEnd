<script lang="ts">
  import { onMount } from 'svelte';
  import { customersApi } from '$lib/api/customers';
  import { filesApi } from '$lib/api/files';
  import { authApi } from '$lib/api/auth';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { changePasswordSchema } from '$lib/schemas/auth';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import type { CustomerResponse } from '$lib/types/api';
  import { User, Camera, Lock, CheckCircle2, Shield } from 'lucide-svelte';

  let customer = $state<CustomerResponse | null>(null);
  let loading = $state(true);

  // Profile Form
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let phoneNumber = $state('');
  let savingProfile = $state(false);

  // Avatar Upload
  let fileInput = $state<HTMLInputElement>();
  let uploadingPhoto = $state(false);

  // Password Form
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let savingPassword = $state(false);
  let passwordErrors = $state<Record<string, string>>({});

  async function loadCustomer() {
    loading = true;
    try {
      customer = await customersApi.getMyProfile();
      firstName = customer.firstName;
      lastName = customer.lastName;
      email = customer.email;
      phoneNumber = customer.phoneNumber || '';
    } catch {
      toastStore.error('Could not load your profile details.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadCustomer);

  async function handleUpdateProfile(e: SubmitEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toastStore.warning('First name and last name are required.', 'Validation');
      return;
    }

    savingProfile = true;
    try {
      customer = await customersApi.updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null
      });
      toastStore.success('Profile details updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Update Failed');
      } else {
        toastStore.error('Failed to update profile.', 'Error');
      }
    } finally {
      savingProfile = false;
    }
  }

  async function handlePhotoSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    uploadingPhoto = true;
    try {
      // Step 1: Upload file as PROFILE_PHOTO
      const storedFile = await filesApi.upload(file, 'PROFILE_PHOTO', 'CUSTOMER');
      // Step 2: Set profile photo on customer
      customer = await customersApi.updateProfilePhoto({ fileId: storedFile.id });
      toastStore.success('Profile photo updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Upload Failed');
      } else {
        toastStore.error('Failed to upload profile photo.', 'Error');
      }
    } finally {
      uploadingPhoto = false;
    }
  }

  async function handleChangePassword(e: SubmitEvent) {
    e.preventDefault();
    passwordErrors = {};

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          passwordErrors[err.path[0] as string] = err.message;
        }
      });
      return;
    }

    savingPassword = true;
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toastStore.success('Password changed successfully');
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Password Change Failed');
      } else {
        toastStore.error('Failed to change password.', 'Error');
      }
    } finally {
      savingPassword = false;
    }
  }
</script>

<svelte:head>
  <title>Customer Profile — BlueCollar</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <div>
    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      Customer Profile & Account
    </h1>
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
      Manage your personal contact info, profile photo, and password security
    </p>
  </div>

  {#if loading}
    <div class="space-y-6">
      <Skeleton class="h-44 rounded-2xl" />
      <Skeleton class="h-64 rounded-2xl" />
    </div>
  {:else if customer}
    <!-- Profile Photo & Basic Card -->
    <Card class="p-6">
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="relative group">
          <div class="w-24 h-24 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-black text-2xl flex items-center justify-center border-2 border-primary-200 dark:border-primary-800 overflow-hidden shadow-xs">
            {#if customer.profilePhotoUrl}
              <img src={customer.profilePhotoUrl} alt="{customer.firstName} {customer.lastName}" class="w-full h-full object-cover" />
            {:else}
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            {/if}
          </div>

          <button
            type="button"
            onclick={() => fileInput?.click()}
            disabled={uploadingPhoto}
            class="absolute inset-0 rounded-2xl bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Upload profile photo"
          >
            <Camera class="w-6 h-6" />
          </button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            bind:this={fileInput}
            onchange={handlePhotoSelected}
            class="hidden"
          />
        </div>

        <div class="text-center sm:text-left space-y-1">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">
            {customer.firstName} {customer.lastName}
          </h2>
          <p class="text-xs sm:text-sm text-slate-500">{customer.email}</p>
          <p class="text-xs text-primary-600 font-medium">Customer Account</p>
        </div>
      </div>
    </Card>

    <!-- Personal Info Form -->
    <Card title="Personal Information" class="p-6">
      <form onsubmit={handleUpdateProfile} class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            bind:value={firstName}
            required
          />
          <Input
            label="Last Name"
            bind:value={lastName}
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            bind:value={email}
            disabled
            helper="Email cannot be changed"
          />
          <Input
            label="Phone Number"
            type="tel"
            bind:value={phoneNumber}
            helper="Indian mobile number"
          />
        </div>

        <div class="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={savingProfile}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>

    <!-- Change Password Card -->
    <Card title="Change Password" subtitle="Keep your account secure with a strong password" class="p-6">
      <form onsubmit={handleChangePassword} class="space-y-4 max-w-lg">
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          bind:value={currentPassword}
          error={passwordErrors.currentPassword}
          required
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          helper="Min 8 chars, uppercase, lowercase, number & special char"
          bind:value={newPassword}
          error={passwordErrors.newPassword}
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          bind:value={confirmPassword}
          error={passwordErrors.confirmPassword}
          required
        />

        <div class="pt-2">
          <Button type="submit" variant="outline" loading={savingPassword}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  {/if}
</div>
