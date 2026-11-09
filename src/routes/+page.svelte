<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Hammer, Users, ArrowRight } from 'lucide-svelte';
</script>

<div class="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
  <div class="text-center mb-16">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-4">
      <Hammer class="w-3.5 h-3.5" />
      BlueCollar Service Marketplace
    </div>
    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      Connecting Quality Workers with Customers
    </h1>
    <p class="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
      Transparent, reliable, and verified home services and skilled trade professionals.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
    <Card class="p-2" hover>
      <div class="p-6 text-left">
        <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Users class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Customer Experience</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Discover certified trade professionals, compare ratings and portfolios, book verified slots, and track service requests.
        </p>
        <a href="/login" class="inline-block">
          <Button variant="primary">
            Explore Services
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>
    </Card>

    <Card class="p-2" hover>
      <div class="p-6 text-left">
        <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Hammer class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Worker Experience</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Manage your service schedule, set working hours and vacation mode, upload trade certificates, and accept booking requests.
        </p>
        <a href="/register/worker" class="inline-block">
          <Button variant="outline">
            Join as Professional
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>
    </Card>
  </div>
</div>
