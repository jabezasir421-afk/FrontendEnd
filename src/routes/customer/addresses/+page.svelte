<script lang="ts">
  import { onMount } from 'svelte';
  import { addressesApi } from '$lib/api/addresses';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { addressSchema } from '$lib/schemas/address';
  import { ApiError } from '$lib/api/client';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { AddressResponse, AddressType } from '$lib/types/api';
  import { MapPin, Plus, Check, Trash2, Edit2, Star } from 'lucide-svelte';

  let addresses = $state<AddressResponse[]>([]);
  let loading = $state(true);

  // Modal State
  let modalOpen = $state(false);
  let editingAddress = $state<AddressResponse | null>(null);

  // Form Fields
  let label = $state('');
  let addressLine1 = $state('');
  let addressLine2 = $state('');
  let city = $state('');
  let stateName = $state('');
  let pincode = $state('');
  let addressType = $state<AddressType>('HOME');
  let isDefault = $state(false);

  let saving = $state(false);
  let formErrors = $state<Record<string, string>>({});

  async function loadAddresses() {
    loading = true;
    try {
      addresses = await addressesApi.getAll();
    } catch {
      toastStore.error('Could not load saved addresses.', 'Error');
    } finally {
      loading = false;
    }
  }

  onMount(loadAddresses);

  function openCreateModal() {
    editingAddress = null;
    label = '';
    addressLine1 = '';
    addressLine2 = '';
    city = '';
    stateName = '';
    pincode = '';
    addressType = 'HOME';
    isDefault = addresses.length === 0;
    formErrors = {};
    modalOpen = true;
  }

  function openEditModal(addr: AddressResponse) {
    editingAddress = addr;
    label = addr.label || '';
    addressLine1 = addr.addressLine1;
    addressLine2 = addr.addressLine2 || '';
    city = addr.city;
    stateName = addr.state;
    pincode = addr.pincode;
    addressType = addr.addressType;
    isDefault = addr.isDefault;
    formErrors = {};
    modalOpen = true;
  }

  async function handleSaveAddress(e: SubmitEvent) {
    e.preventDefault();
    formErrors = {};

    const payload = {
      label: label.trim() || null,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      addressType,
      isDefault
    };

    const validation = addressSchema.safeParse(payload);
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          formErrors[err.path[0] as string] = err.message;
        }
      });
      return;
    }

    saving = true;
    try {
      if (editingAddress) {
        await addressesApi.update(editingAddress.id, {
          label: payload.label,
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          addressType: payload.addressType
        });
        toastStore.success('Address updated successfully');
      } else {
        await addressesApi.create(payload);
        toastStore.success('New address added to your address book');
      }
      modalOpen = false;
      await loadAddresses();
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message, 'Save Failed');
      } else {
        toastStore.error('Could not save address. Please verify your details.', 'Error');
      }
    } finally {
      saving = false;
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await addressesApi.setDefault(id);
      toastStore.success('Default address updated');
      await loadAddresses();
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await addressesApi.delete(id);
      toastStore.success('Address removed');
      await loadAddresses();
    } catch (err) {
      if (err instanceof ApiError) {
        toastStore.error(err.message);
      }
    }
  }
</script>

<svelte:head>
  <title>Saved Addresses — BlueCollar</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
  <!-- Top Bar -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Address Book
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        Manage your service locations for quick and accurate home service bookings
      </p>
    </div>

    <Button variant="primary" onclick={openCreateModal}>
      <Plus class="w-4 h-4 mr-2" />
      Add New Address
    </Button>
  </div>

  <!-- Address Grid -->
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each Array(4) as _}
        <Skeleton class="h-44 rounded-2xl" />
      {/each}
    </div>
  {:else if addresses.length === 0}
    <EmptyState
      title="No addresses saved yet"
      description="Add your home, office, or rental location to book appointments effortlessly."
    >
      {#snippet action()}
        <Button variant="primary" size="sm" onclick={openCreateModal}>
          <Plus class="w-4 h-4 mr-2" />
          Add First Address
        </Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each addresses as addr (addr.id)}
        <Card class="flex flex-col justify-between p-5 space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900 dark:text-white">
                  {addr.label || addr.addressType}
                </span>
                <Badge variant="secondary" size="sm">
                  {addr.addressType}
                </Badge>
              </div>

              {#if addr.isDefault}
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <Star class="w-3 h-3 fill-emerald-500" /> Default
                </span>
              {/if}
            </div>

            <p class="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {addr.addressLine1}
            </p>
            {#if addr.addressLine2}
              <p class="text-xs text-slate-500">
                {addr.addressLine2}
              </p>
            {/if}
            <p class="text-xs text-slate-500">
              {addr.city}, {addr.state} - <span class="font-semibold text-slate-700 dark:text-slate-300">{addr.pincode}</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {#if !addr.isDefault}
              <button
                type="button"
                onclick={() => handleSetDefault(addr.id)}
                class="text-xs text-primary-600 hover:underline font-medium"
              >
                Set as Default
              </button>
            {:else}
              <div></div>
            {/if}

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => openEditModal(addr)}
                class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Edit address"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                onclick={() => handleDelete(addr.id)}
                class="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                aria-label="Delete address"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Add / Edit Modal -->
{#if modalOpen}
  <Modal
    open={true}
    onclose={() => (modalOpen = false)}
    title={editingAddress ? 'Edit Address' : 'Add New Address'}
    size="md"
  >
    <form onsubmit={handleSaveAddress} class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Address Label"
          placeholder="e.g. My Apartment, Mom's House"
          bind:value={label}
          error={formErrors.label}
        />
        <Select
          label="Address Type"
          bind:value={addressType}
          options={[
            { value: 'HOME', label: 'Home' },
            { value: 'WORK', label: 'Work' },
            { value: 'OTHER', label: 'Other' }
          ]}
          required
        />
      </div>

      <Input
        label="Street Address / Line 1"
        placeholder="House/Flat No., Building, Street"
        bind:value={addressLine1}
        error={formErrors.addressLine1}
        required
      />

      <Input
        label="Apartment, Suite, Landmark (Line 2)"
        placeholder="Near Metro Station, 2nd Floor (optional)"
        bind:value={addressLine2}
        error={formErrors.addressLine2}
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="City"
          placeholder="e.g. Bengaluru"
          bind:value={city}
          error={formErrors.city}
          required
        />
        <Input
          label="State"
          placeholder="e.g. Karnataka"
          bind:value={stateName}
          error={formErrors.state}
          required
        />
        <Input
          label="PIN Code"
          placeholder="e.g. 560001"
          bind:value={pincode}
          error={formErrors.pincode}
          required
        />
      </div>

      {#if !editingAddress}
        <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
          <input
            type="checkbox"
            bind:checked={isDefault}
            class="rounded text-primary-600 focus:ring-primary-500"
          />
          <span>Set as default service address</span>
        </label>
      {/if}

      <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" type="button" onclick={() => (modalOpen = false)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={saving}>
          {editingAddress ? 'Save Changes' : 'Add Address'}
        </Button>
      </div>
    </form>
  </Modal>
{/if}
