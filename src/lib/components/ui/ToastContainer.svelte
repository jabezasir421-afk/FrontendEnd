<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte';
  import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-svelte';

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-100',
    error: 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/70 dark:border-rose-800 dark:text-rose-100',
    warning: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-100',
    info: 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/70 dark:border-blue-800 dark:text-blue-100'
  };

  const iconColors = {
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400'
  };
</script>

<div class="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
  {#each toastStore.toasts as toast (toast.id)}
    {@const IconComponent = icons[toast.type]}
    <div
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2 {bgStyles[toast.type]}"
      role="alert"
    >
      <div class="shrink-0 mt-0.5">
        <IconComponent class="w-5 h-5 {iconColors[toast.type]}" />
      </div>
      <div class="flex-1 min-w-0">
        {#if toast.title}
          <h4 class="text-sm font-semibold mb-0.5">{toast.title}</h4>
        {/if}
        <p class="text-xs sm:text-sm leading-relaxed opacity-90 break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        onclick={() => toastStore.remove(toast.id)}
        class="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
        aria-label="Close notification"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
