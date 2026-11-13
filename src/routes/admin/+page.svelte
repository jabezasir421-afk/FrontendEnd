<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/admin/documents', { replaceState: true });
  });
</script>

<div class="p-8 text-center text-slate-500">
  Redirecting to Admin Verification Queue...
</div>
