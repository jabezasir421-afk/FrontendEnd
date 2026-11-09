<script lang="ts">
  import type { Snippet } from 'svelte';
  import { FolderSearch } from 'lucide-svelte';

  interface Props {
    title: string;
    description?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    action?: Snippet;
    children?: Snippet;
  }

  let { title, description, icon: IconComponent = FolderSearch, action, children }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-xs">
    <IconComponent class="w-6 h-6" />
  </div>

  <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
  {#if description}
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
      {description}
    </p>
  {/if}

  {#if action}
    {@render action()}
  {/if}
  {@render children?.()}
</div>
