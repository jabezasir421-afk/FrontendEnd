<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    class?: string;
    headerClass?: string;
    bodyClass?: string;
    footerClass?: string;
    hover?: boolean;
    header?: Snippet;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    title,
    subtitle,
    class: className = '',
    headerClass = '',
    bodyClass = '',
    footerClass = '',
    hover = false,
    header,
    children,
    footer
  }: Props = $props();
</script>

<div
  class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 {hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''} {className}"
>
  {#if header}
    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 {headerClass}">
      {@render header()}
    </div>
  {:else if title}
    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 {headerClass}">
      <h3 class="text-base font-semibold text-slate-900 dark:text-white leading-tight">{title}</h3>
      {#if subtitle}
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      {/if}
    </div>
  {/if}

  <div class="p-6 {bodyClass}">
    {@render children?.()}
  </div>

  {#if footer}
    <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 {footerClass}">
      {@render footer()}
    </div>
  {/if}
</div>
