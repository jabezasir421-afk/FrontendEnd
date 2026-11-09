<script lang="ts">
  interface Props {
    class?: string;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  }

  let { class: className = '', rounded = 'lg' }: Props = $props();

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };
</script>

<div
  class="animate-pulse bg-slate-200 dark:bg-slate-800 {roundedClasses[rounded]} {className}"
  aria-hidden="true"
></div>
