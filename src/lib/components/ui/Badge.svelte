<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { BookingStatus } from '$lib/types/api';

  type BadgeVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | BookingStatus;

  interface Props {
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'secondary',
    size = 'md',
    class: className = '',
    children
  }: Props = $props();

  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    // Domain Booking Status styles
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    ACCEPTED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium border',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium border'
  };
</script>

<span class="inline-flex items-center gap-1 select-none {variantStyles[variant] || variantStyles.secondary} {sizeStyles[size]} {className}">
  {@render children?.()}
</span>
