<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
    value?: string;
    label?: string;
    error?: string;
    helper?: string;
    id?: string;
  }

  let {
    value = $bindable(''),
    label,
    error,
    helper,
    id = `textarea-${Math.random().toString(36).substring(2, 9)}`,
    required = false,
    rows = 3,
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<div class="w-full flex flex-col space-y-1.5">
  {#if label}
    <label for={id} class="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {#if required}
        <span class="text-rose-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <textarea
    {id}
    {rows}
    {required}
    bind:value
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
    class="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed resize-y {error
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-800 dark:focus:ring-rose-900/50'
      : 'border-slate-300 hover:border-slate-400 focus:border-primary-500 focus:ring-primary-100 dark:border-slate-700 dark:hover:border-slate-600 dark:focus:ring-primary-950'} {className}"
    {...restProps}
  ></textarea>

  {#if error}
    <p id="{id}-error" class="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{error}</p>
  {:else if helper}
    <p id="{id}-helper" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{helper}</p>
  {/if}
</div>
