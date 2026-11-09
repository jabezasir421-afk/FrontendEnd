<script lang="ts">
  import { Hammer } from 'lucide-svelte';
</script>

<footer class="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
          <Hammer class="w-4 h-4" />
        </div>
        <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Blue<span class="text-primary-600">Collar</span>
        </span>
      </div>

      <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
        &copy; {new Date().getFullYear()} BlueCollar Marketplace. Reliable skilled services on-demand.
      </p>

      <div class="flex items-center space-x-6 text-xs text-slate-500 dark:text-slate-400">
        <a href="/workers" class="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Directory</a>
        <a href="/login" class="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Customer Portal</a>
        <a href="/register/worker" class="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Join as Worker</a>
      </div>
    </div>
  </div>
</footer>
