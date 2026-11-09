<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  interface Props {
    page: number; // 0-indexed
    totalPages: number;
    totalElements?: number;
    size?: number;
    onPageChange: (newPage: number) => void;
  }

  let { page, totalPages, totalElements, size, onPageChange }: Props = $props();

  let currentPage = $derived(page + 1); // 1-indexed for display

  let pages = $derived.by(() => {
    const list: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      list.push(1);
      if (currentPage > 3) list.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) list.push(i);
      if (currentPage < totalPages - 2) list.push('...');
      list.push(totalPages);
    }
    return list;
  });
</script>

{#if totalPages > 1}
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
    {#if totalElements !== undefined && size !== undefined}
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        Showing <span class="font-medium text-slate-700 dark:text-slate-200">{page * size + 1}</span>
        to
        <span class="font-medium text-slate-700 dark:text-slate-200"
          >{Math.min((page + 1) * size, totalElements)}</span
        >
        of
        <span class="font-medium text-slate-700 dark:text-slate-200">{totalElements}</span> results
      </p>
    {:else}
      <div></div>
    {/if}

    <nav class="flex items-center space-x-1" aria-label="Pagination">
      <button
        type="button"
        onclick={() => onPageChange(page - 1)}
        disabled={page === 0}
        class="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      {#each pages as p, index (index)}
        {#if typeof p === 'number'}
          <button
            type="button"
            onclick={() => onPageChange(p - 1)}
            class="min-w-8 h-8 px-2 text-xs font-medium rounded-lg transition-colors {p === currentPage
              ? 'bg-primary-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        {:else}
          <span class="px-2 text-xs text-slate-400">...</span>
        {/if}
      {/each}

      <button
        type="button"
        onclick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        class="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </nav>
  </div>
{/if}
