<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { Loader2 } from 'lucide-svelte';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  const variantStyles = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm focus-visible:ring-primary-500',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline:
      'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800',
    link:
      'bg-transparent text-primary-600 hover:underline p-0 h-auto font-medium focus-visible:ring-0'
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-2.5 rounded-xl gap-2.5'
  };
</script>

<button
  {...restProps}
  disabled={disabled || loading}
  class="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none {variantStyles[variant]} {variant !== 'link' ? sizeStyles[size] : ''} {className}"
>
  {#if loading}
    <Loader2 class="w-4 h-4 animate-spin shrink-0" />
  {/if}
  {@render children?.()}
</button>
