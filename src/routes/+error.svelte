<script lang="ts">
  import { page } from '$app/state';
  import { AlertCircle, Home } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full text-center">
    <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-xs">
      <AlertCircle class="w-8 h-8" />
    </div>

    <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
      {page.status || 500}
    </h1>

    <h2 class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
      {page.error?.message || 'Something went wrong'}
    </h2>

    <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
      We couldn't process this request. Return to home or try again later.
    </p>

    <div class="flex justify-center gap-3">
      <a href="/">
        <Button variant="primary">
          <Home class="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </a>
    </div>
  </div>
</div>
