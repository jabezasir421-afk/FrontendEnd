<script lang="ts">
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { authStore } from '$lib/stores/auth.svelte';
  import { checkRouteAccess } from '$lib/utils/guard';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
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

  // Client-side route protection
  $effect(() => {
    if (!authStore.isInitialized) return;

    const access = checkRouteAccess(page.url.pathname, {
      isAuthenticated: authStore.isAuthenticated,
      role: authStore.role
    });

    if (!access.allowed) {
      goto(access.redirect, { replaceState: true });
    }
  });
</script>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
    <Navbar />
    <main class="flex-1">
      {@render children?.()}
    </main>
    <Footer />
    <ToastContainer />
  </div>
</QueryClientProvider>
