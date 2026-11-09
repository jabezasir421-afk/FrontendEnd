<script lang="ts">
  import { onMount } from 'svelte';
  import { notificationsApi } from '$lib/api/notifications';
  import { toastStore } from '$lib/stores/toast.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import type {
    NotificationResponse,
    NotificationPreferenceResponse
  } from '$lib/types/api';
  import {
    Bell,
    CheckCheck,
    Check,
    Mail,
    Smartphone,
    Sliders,
    ArrowRight
  } from 'lucide-svelte';

  interface Props {
    title?: string;
  }

  let { title = 'Notifications' }: Props = $props();

  let notifications = $state<NotificationResponse[]>([]);
  let totalElements = $state(0);
  let totalPages = $state(0);
  let currentPage = $state(0);
  let pageSize = 15;
  let loading = $state(true);

  // Preferences
  let prefs = $state<NotificationPreferenceResponse | null>(null);
  let savingPrefs = $state(false);

  async function loadData() {
    loading = true;
    try {
      const [notifs, preferences] = await Promise.all([
        notificationsApi.getAll(currentPage, pageSize),
        notificationsApi.getPreferences().catch(() => null)
      ]);
      notifications = notifs?.content || [];
      totalElements = notifs?.totalElements || 0;
      totalPages = notifs?.totalPages || 1;
      prefs = preferences;
    } catch {
      toastStore.error('Could not load notifications.');
    } finally {
      loading = false;
    }
  }

  onMount(loadData);

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markAsRead(id);
      const found = notifications.find((n) => n.id === id);
      if (found) found.read = true;
    } catch {
      // Ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllAsRead();
      notifications = notifications.map((n) => ({ ...n, read: true }));
      toastStore.success('All notifications marked as read');
    } catch {
      toastStore.error('Failed to mark all as read');
    }
  }

  async function handleUpdatePreferences() {
    if (!prefs) return;
    savingPrefs = true;
    try {
      prefs = await notificationsApi.updatePreferences({
        emailEnabled: prefs.emailEnabled,
        inAppEnabled: prefs.inAppEnabled,
        smsEnabled: prefs.smsEnabled
      });
      toastStore.success('Notification preferences updated');
    } catch {
      toastStore.error('Failed to update preferences');
    } finally {
      savingPrefs = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        Stay updated on booking status updates, schedule changes, and messages
      </p>
    </div>

    {#if notifications.some((n) => !n.read)}
      <Button variant="outline" size="sm" onclick={handleMarkAllRead}>
        <CheckCheck class="w-4 h-4 mr-1.5" />
        Mark All as Read
      </Button>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Notifications List -->
    <div class="lg:col-span-2 space-y-4">
      {#if loading}
        <div class="space-y-3">
          {#each Array(4) as _}
            <Skeleton class="h-20 rounded-2xl" />
          {/each}
        </div>
      {:else if notifications.length === 0}
        <EmptyState
          title="No notifications"
          description="You are completely up to date. You will receive updates when booking statuses change."
        />
      {:else}
        <div class="space-y-3">
          {#each notifications as notif (notif.id)}
            <div
              class="p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 {notif.read
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800 shadow-xs'}"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 {notif.read ? 'bg-transparent' : 'bg-primary-600'}"></div>
                <div>
                  <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {notif.title}
                  </h3>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <span class="text-[10px] text-slate-400 block mt-1.5">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {#if !notif.read}
                <button
                  type="button"
                  onclick={() => handleMarkRead(notif.id)}
                  class="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Mark as read"
                >
                  <Check class="w-4 h-4" />
                </button>
              {/if}
            </div>
          {/each}
        </div>

        <Pagination
          page={currentPage}
          {totalPages}
          {totalElements}
          size={pageSize}
          onPageChange={(p) => {
            currentPage = p;
            loadData();
          }}
        />
      {/if}
    </div>

    <!-- Notification Preferences Card -->
    <div>
      {#if prefs}
        <Card title="Alert Channels" subtitle="Choose how you want to be notified" class="p-5 space-y-4">
          <div class="space-y-3">
            <label class="flex items-center justify-between text-xs cursor-pointer">
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail class="w-4 h-4 text-slate-400" />
                <span>Email Notifications</span>
              </div>
              <input
                type="checkbox"
                bind:checked={prefs.emailEnabled}
                class="rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label class="flex items-center justify-between text-xs cursor-pointer">
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Bell class="w-4 h-4 text-slate-400" />
                <span>In-App Alerts</span>
              </div>
              <input
                type="checkbox"
                bind:checked={prefs.inAppEnabled}
                class="rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label class="flex items-center justify-between text-xs cursor-pointer">
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Smartphone class="w-4 h-4 text-slate-400" />
                <span>SMS Updates</span>
              </div>
              <input
                type="checkbox"
                bind:checked={prefs.smsEnabled}
                class="rounded text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onclick={handleUpdatePreferences}
            loading={savingPrefs}
            class="w-full mt-2"
          >
            Save Preferences
          </Button>
        </Card>
      {/if}
    </div>
  </div>
</div>
