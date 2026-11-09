<script lang="ts">
  import type { Snippet } from 'svelte';
  import { X } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children?: Snippet;
    footer?: Snippet;
    onclose?: () => void;
  }

  let {
    open = $bindable(false),
    title,
    description,
    size = 'md',
    children,
    footer,
    onclose
  }: Props = $props();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  function close() {
    open = false;
    onclose?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      role="button"
      tabindex="-1"
      aria-label="Close dialog overlay"
      onclick={close}
      onkeydown={(e) => e.key === 'Enter' && close()}
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    ></div>

    <!-- Modal Dialog -->
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all w-full my-8 border border-slate-200 dark:border-slate-800 {sizeClasses[size]}"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            {#if title}
              <h3 id="modal-title" class="text-lg font-semibold text-slate-900 dark:text-white leading-6">
                {title}
              </h3>
            {/if}
            {#if description}
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            {/if}
          </div>
          <button
            type="button"
            onclick={close}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {@render children?.()}
        </div>

        <!-- Footer -->
        {#if footer}
          <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            {@render footer()}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
