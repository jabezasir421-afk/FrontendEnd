<script lang="ts">
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { authStore } from '$lib/stores/auth.svelte';
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

  let { children } = $props();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1
      }
    }
  });

  onMount(() => {
    authStore.init();
  });
</script>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
    {@render children?.()}
    <ToastContainer />
  </div>
</QueryClientProvider>
