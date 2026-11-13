<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { writable, derived } from 'svelte/store';
  import {
    adminApi,
    adminQueryKeys,
    adminCacheHelpers
  } from '$lib/api/admin';
  import { filesApi } from '$lib/api/files';
  import { workersApi } from '$lib/api/workers';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { ApiError } from '$lib/api/client';
  import type {
    AdminIdentityDocumentResponse,
    PublicWorkerResponse,
    IdentityDocumentType
  } from '$lib/types/api';

  // Shared UI components
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  // Icons
  import {
    ShieldCheck,
    FileText,
    CheckCircle,
    XCircle,
    Eye,
    Search,
    RefreshCw,
    User,
    AlertCircle,
    Download,
    ExternalLink,
    Lock,
    Clock
  } from 'lucide-svelte';

  const queryClient = useQueryClient();

  // Pagination state for pending documents queue
  const page = writable(0);
  const size = 10;

  // TanStack Query for Pending Documents Queue
  const pendingQuery = createQuery(
    derived(page, ($page) => ({
      queryKey: adminQueryKeys.pendingDocuments($page, size),
      queryFn: () => adminApi.getPendingDocuments($page, size),
      enabled: browser
    }))
  );

  // Selected Worker Inspection State
  let inspectingWorkerId = $state<string | null>(null);
  let inspectingWorkerProfile = $state<PublicWorkerResponse | null>(null);
  let inspectingWorkerDocuments = $state<AdminIdentityDocumentResponse[]>([]);
  let isLoadingWorkerData = $state(false);
  let workerInspectionError = $state<string | null>(null);

  // Manual Worker Lookup by UUID
  let lookupWorkerIdInput = $state('');

  // Secure Document Preview Modal State
  let previewModalOpen = $state(false);
  let previewDocument = $state<AdminIdentityDocumentResponse | null>(null);
  let previewBlobUrl = $state<string | null>(null);
  let previewMimeType = $state<string | null>(null);
  let isDownloadingPreview = $state(false);
  let previewError = $state<string | null>(null);

  // Approval Modal State
  let approveModalOpen = $state(false);
  let documentToApprove = $state<AdminIdentityDocumentResponse | null>(null);
  let isApproving = $state(false);

  // Rejection Modal State
  let rejectModalOpen = $state(false);
  let documentToReject = $state<AdminIdentityDocumentResponse | null>(null);
  let rejectionReason = $state('');
  let rejectionError = $state<string | null>(null);
  let isRejecting = $state(false);

  // Worker Verification Modal State
  let verifyWorkerModalOpen = $state(false);
  let isVerifyingWorker = $state(false);
  let isUnverifyingWorker = $state(false);

  // Helper to format document type labels
  function formatDocType(type: IdentityDocumentType): string {
    switch (type) {
      case 'AADHAAR':
        return 'Aadhaar Card';
      case 'PAN':
        return 'PAN Card';
      case 'DRIVING_LICENSE':
        return 'Driving License';
      case 'OTHER':
        return 'Other Official ID';
      default:
        return type;
    }
  }

  // Helper to format dates
  function formatDate(isoString: string | null): string {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // Load worker details and documents for inspection
  async function inspectWorker(workerId: string) {
    if (!workerId) return;
    inspectingWorkerId = workerId;
    isLoadingWorkerData = true;
    workerInspectionError = null;

    try {
      const [profile, docs] = await Promise.all([
        workersApi.getById(workerId).catch(() => null),
        adminApi.getWorkerDocuments(workerId)
      ]);

      inspectingWorkerProfile = profile;
      inspectingWorkerDocuments = docs || [];
    } catch (err) {
      workerInspectionError =
        err instanceof ApiError ? err.message : 'Could not fetch worker documents.';
      toastStore.error(workerInspectionError);
    } finally {
      isLoadingWorkerData = false;
    }
  }

  function handleLookupWorker(e: SubmitEvent) {
    e.preventDefault();
    const id = lookupWorkerIdInput.trim();
    if (!id) {
      toastStore.warning('Please enter a valid Worker UUID');
      return;
    }
    inspectWorker(id);
  }

  // Secure Document Preview with Authenticated Blob Stream
  async function openPreview(doc: AdminIdentityDocumentResponse) {
    previewDocument = doc;
    previewModalOpen = true;
    isDownloadingPreview = true;
    previewError = null;

    // Clean previous preview URL if any
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      previewBlobUrl = null;
    }

    try {
      const blob = await filesApi.downloadBlob(doc.fileId);
      previewBlobUrl = URL.createObjectURL(blob);
      previewMimeType = blob.type || 'application/octet-stream';
    } catch (err) {
      previewError =
        err instanceof ApiError
          ? err.message
          : 'Failed to securely download document. Ensure you have administrator permissions.';
      toastStore.error(previewError);
    } finally {
      isDownloadingPreview = false;
    }
  }

  function closePreview() {
    previewModalOpen = false;
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      previewBlobUrl = null;
    }
    previewDocument = null;
    previewError = null;
  }

  // Lifecycle cleanup to prevent Blob URL memory leaks on component unmount
  onDestroy(() => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      previewBlobUrl = null;
    }
  });

  // MIME type helpers for safe document preview
  function isPdfDocument(mime: string | null): boolean {
    if (!mime) return false;
    const lower = mime.toLowerCase();
    return lower === 'application/pdf' || lower.includes('pdf');
  }

  function isSupportedImageDocument(mime: string | null): boolean {
    if (!mime) return false;
    const lower = mime.toLowerCase();
    return (
      lower === 'image/jpeg' ||
      lower === 'image/png' ||
      lower === 'image/webp' ||
      lower.startsWith('image/')
    );
  }

  // Approval Flow
  function openApproveModal(doc: AdminIdentityDocumentResponse) {
    documentToApprove = doc;
    approveModalOpen = true;
  }

  async function handleApprove() {
    if (!documentToApprove || isApproving) return;

    isApproving = true;
    try {
      await adminApi.approveDocument(documentToApprove.id);
      toastStore.success('Identity document approved successfully.');
      approveModalOpen = false;

      // Invalidate query caches
      await adminCacheHelpers.invalidateDocuments(queryClient, documentToApprove.workerId || undefined);

      // Refresh inspected worker data if open
      if (inspectingWorkerId && inspectingWorkerId === documentToApprove.workerId) {
        await inspectWorker(inspectingWorkerId);
      }
      documentToApprove = null;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to approve document.';
      toastStore.error(msg);
    } finally {
      isApproving = false;
    }
  }

  // Rejection Flow
  function openRejectModal(doc: AdminIdentityDocumentResponse) {
    documentToReject = doc;
    rejectionReason = '';
    rejectionError = null;
    rejectModalOpen = true;
  }

  async function handleReject() {
    if (!documentToReject || isRejecting) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      rejectionError = 'A non-empty rejection reason is required.';
      return;
    }
    if (trimmedReason.length > 500) {
      rejectionError = 'Rejection reason must not exceed 500 characters.';
      return;
    }

    isRejecting = true;
    rejectionError = null;
    try {
      await adminApi.rejectDocument(documentToReject.id, trimmedReason);
      toastStore.success('Identity document rejected.');
      rejectModalOpen = false;

      // Invalidate query caches
      await adminCacheHelpers.invalidateDocuments(queryClient, documentToReject.workerId || undefined);

      // Refresh inspected worker data if open
      if (inspectingWorkerId && inspectingWorkerId === documentToReject.workerId) {
        await inspectWorker(inspectingWorkerId);
      }
      documentToReject = null;
      rejectionReason = '';
    } catch (err) {
      rejectionError = err instanceof ApiError ? err.message : 'Failed to reject document.';
      toastStore.error(rejectionError);
    } finally {
      isRejecting = false;
    }
  }

  // Worker Verification Flow
  function openVerifyWorkerModal() {
    verifyWorkerModalOpen = true;
  }

  async function handleVerifyWorker() {
    if (!inspectingWorkerId || isVerifyingWorker) return;

    isVerifyingWorker = true;
    try {
      const updated = await adminApi.verifyWorker(inspectingWorkerId);
      toastStore.success(`Worker ${updated.firstName} ${updated.lastName} verified successfully!`);
      verifyWorkerModalOpen = false;

      // Invalidate worker and discovery caches
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, inspectingWorkerId);

      // Refresh inspected worker profile
      await inspectWorker(inspectingWorkerId);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Worker verification failed.';
      toastStore.error(msg);
    } finally {
      isVerifyingWorker = false;
    }
  }

  async function handleUnverifyWorker() {
    if (!inspectingWorkerId || isUnverifyingWorker) return;

    isUnverifyingWorker = true;
    try {
      const updated = await adminApi.unverifyWorker(inspectingWorkerId);
      toastStore.info(`Worker ${updated.firstName} ${updated.lastName} unverified.`);

      // Invalidate worker and discovery caches
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, inspectingWorkerId);

      // Refresh inspected worker profile
      await inspectWorker(inspectingWorkerId);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to unverify worker.';
      toastStore.error(msg);
    } finally {
      isUnverifyingWorker = false;
    }
  }

  // Computed Verification Eligibility Criteria
  let verificationEligibility = $derived.by(() => {
    if (!inspectingWorkerProfile) {
      return { eligible: false, reasons: ['Worker profile not loaded'] };
    }

    const reasons: string[] = [];

    if (!inspectingWorkerProfile.active) {
      reasons.push('Worker account is inactive');
    }

    if (inspectingWorkerDocuments.length === 0) {
      reasons.push('Worker must have at least one active identity document');
    }

    const hasPending = inspectingWorkerDocuments.some((d) => d.verificationStatus === 'PENDING');
    if (hasPending) {
      reasons.push('Cannot verify worker with pending identity documents');
    }

    const hasRejected = inspectingWorkerDocuments.some((d) => d.verificationStatus === 'REJECTED');
    if (hasRejected) {
      reasons.push('Cannot verify worker with rejected identity documents');
    }

    const allVerified =
      inspectingWorkerDocuments.length > 0 &&
      inspectingWorkerDocuments.every((d) => d.verificationStatus === 'VERIFIED');

    if (!allVerified && reasons.length === 0) {
      reasons.push('All required identity documents must be approved before worker verification');
    }

    return {
      eligible: reasons.length === 0 && allVerified,
      reasons
    };
  });
</script>

<svelte:head>
  <title>Identity Document Verification — Admin Portal</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
    <div>
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Identity Document Verification
        </h1>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
        Review worker KYC identity submissions, preview encrypted credentials securely, approve or reject documents, and verify compliant worker profiles for customer directory discovery.
      </p>
    </div>

    <!-- Direct Worker UUID Lookup Form -->
    <form onsubmit={handleLookupWorker} class="flex items-center gap-2">
      <Input
        placeholder="Inspect Worker UUID..."
        bind:value={lookupWorkerIdInput}
        class="w-64 text-xs font-mono"
        aria-label="Worker UUID lookup"
      />
      <Button type="submit" variant="outline" size="sm">
        <Search class="w-4 h-4 mr-1.5" />
        Inspect
      </Button>
    </form>
  </div>

  <!-- SECTION 1: Pending Identity Documents Queue -->
  <section class="space-y-4" aria-labelledby="queue-heading">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5 text-amber-500" />
        <h2 id="queue-heading" class="text-lg font-bold text-slate-900 dark:text-white">
          Pending Documents Queue
        </h2>
        {#if $pendingQuery.data}
          <span class="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            {$pendingQuery.data.totalElements} pending
          </span>
        {/if}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onclick={() => $pendingQuery.refetch()}
        disabled={$pendingQuery.isFetching}
      >
        <RefreshCw class="w-4 h-4 mr-1.5 {$pendingQuery.isFetching ? 'animate-spin' : ''}" />
        Refresh
      </Button>
    </div>

    <!-- Queue Table / States -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {#if $pendingQuery.isLoading}
        <div class="p-12 text-center space-y-3">
          <RefreshCw class="w-8 h-8 text-primary-500 animate-spin mx-auto" />
          <p class="text-sm text-slate-500">Loading pending verification documents...</p>
        </div>
      {:else if $pendingQuery.isError}
        <div class="p-8 text-center space-y-4">
          <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Failed to load pending queue</h3>
            <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {$pendingQuery.error instanceof Error ? $pendingQuery.error.message : 'An error occurred while fetching the pending queue.'}
            </p>
          </div>
          <Button variant="primary" size="sm" onclick={() => $pendingQuery.refetch()}>
            <RefreshCw class="w-4 h-4 mr-1.5" />
            Retry
          </Button>
        </div>
      {:else if !$pendingQuery.data || $pendingQuery.data.content.length === 0}
        <div class="py-12">
          <EmptyState
            title="No Pending Documents"
            description="All submitted worker identity documents have been reviewed and processed."
          >
            {#snippet action()}
              <Button variant="outline" size="sm" onclick={() => $pendingQuery.refetch()}>
                <RefreshCw class="w-4 h-4 mr-1.5" />
                Check for New Submissions
              </Button>
            {/snippet}
          </EmptyState>
        </div>
      {:else}
        <!-- Documents Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" class="py-3.5 px-4">Worker</th>
                <th scope="col" class="py-3.5 px-4">Document Type</th>
                <th scope="col" class="py-3.5 px-4">Document Number</th>
                <th scope="col" class="py-3.5 px-4">Submitted Date</th>
                <th scope="col" class="py-3.5 px-4">Status</th>
                <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              {#each $pendingQuery.data.content as doc (doc.id)}
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <!-- Worker Info -->
                  <td class="py-3.5 px-4">
                    <div class="font-semibold text-slate-900 dark:text-white">
                      {doc.workerName || 'Worker'}
                    </div>
                    {#if doc.workerId}
                      <button
                        type="button"
                        onclick={() => inspectWorker(doc.workerId!)}
                        class="text-[11px] font-mono text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        {doc.workerId.slice(0, 8)}...{doc.workerId.slice(-4)}
                        <ExternalLink class="w-3 h-3" />
                      </button>
                    {/if}
                  </td>

                  <!-- Document Type -->
                  <td class="py-3.5 px-4">
                    <span class="font-medium text-slate-800 dark:text-slate-200">
                      {formatDocType(doc.documentType)}
                    </span>
                  </td>

                  <!-- Masked Document Number -->
                  <td class="py-3.5 px-4">
                    <span class="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {doc.maskedDocumentNumber || '••••••••'}
                    </span>
                  </td>

                  <!-- Submission Date -->
                  <td class="py-3.5 px-4 text-xs text-slate-500">
                    {formatDate(doc.createdAt)}
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-4">
                    <Badge variant="PENDING">
                      Pending Review
                    </Badge>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => openPreview(doc)}
                      title="Secure Preview"
                    >
                      <Eye class="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Preview
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onclick={() => openApproveModal(doc)}
                      class="bg-emerald-600 hover:bg-emerald-700 text-white"
                      title="Approve Document"
                    >
                      <CheckCircle class="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onclick={() => openRejectModal(doc)}
                      title="Reject Document"
                    >
                      <XCircle class="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Server-side Pagination -->
        <div class="border-t border-slate-100 dark:border-slate-800">
          <Pagination
            page={$page}
            totalPages={$pendingQuery.data.totalPages}
            totalElements={$pendingQuery.data.totalElements}
            size={size}
            onPageChange={(newPage) => page.set(newPage)}
          />
        </div>
      {/if}
    </div>
  </section>

  <!-- SECTION 2: Worker Document Inspection & Verification Section -->
  {#if inspectingWorkerId}
    <section class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in" aria-labelledby="worker-heading">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <User class="w-5 h-5 text-primary-600" />
          <h2 id="worker-heading" class="text-lg font-bold text-slate-900 dark:text-white">
            Worker Document Portfolio & Verification
          </h2>
        </div>
        <Button variant="ghost" size="sm" onclick={() => (inspectingWorkerId = null)}>
          Close Inspection
        </Button>
      </div>

      {#if isLoadingWorkerData}
        <div class="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <RefreshCw class="w-6 h-6 text-primary-500 animate-spin mx-auto" />
          <p class="text-sm text-slate-500">Loading worker profile and document credentials...</p>
        </div>
      {:else}
        <!-- Worker Profile Summary & Verification Eligibility Card -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Worker Profile Card -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">
              Worker Profile Details
            </h3>

            {#if inspectingWorkerProfile}
              <div class="space-y-3">
                <div>
                  <h4 class="text-xl font-bold text-slate-900 dark:text-white">
                    {inspectingWorkerProfile.firstName} {inspectingWorkerProfile.lastName}
                  </h4>
                  <p class="text-xs font-mono text-slate-400 break-all mt-0.5">
                    ID: {inspectingWorkerProfile.id}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span class="text-slate-400 block">Category</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">{inspectingWorkerProfile.categoryName || 'General'}</span>
                  </div>
                  <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span class="text-slate-400 block">Hourly Rate</span>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">
                      {inspectingWorkerProfile.hourlyRate ? `₹${inspectingWorkerProfile.hourlyRate}/hr` : '—'}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <span class="text-xs text-slate-500">Status:</span>
                  {#if inspectingWorkerProfile.active}
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Deactivated
                    </span>
                  {/if}

                  {#if inspectingWorkerProfile.verified}
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Verified
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Unverified
                    </span>
                  {/if}
                </div>
              </div>
            {:else}
              <p class="text-xs text-slate-500 font-mono">
                Worker ID: {inspectingWorkerId}
              </p>
            {/if}
          </div>

          <!-- Verification Gate Assessment & Actions Card -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Verification Gate Evaluation
                </h3>
                {#if inspectingWorkerProfile?.verified}
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle class="w-4 h-4 text-emerald-600" />
                    Verified in Marketplace
                  </span>
                {:else if verificationEligibility.eligible}
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle class="w-4 h-4 text-emerald-600" />
                    Ready for Verification
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Clock class="w-4 h-4 text-amber-600" />
                    Verification Blocked
                  </span>
                {/if}
              </div>

              <!-- Backend Eligibility Rule Checklist -->
              <div class="mt-4 space-y-2 text-xs">
                {#if verificationEligibility.eligible && !inspectingWorkerProfile?.verified}
                  <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                    <p class="font-semibold">All verification conditions satisfied:</p>
                    <ul class="list-disc list-inside mt-1 space-y-0.5 text-emerald-700 dark:text-emerald-400">
                      <li>Worker is active</li>
                      <li>At least one valid identity document submitted</li>
                      <li>Zero pending documents</li>
                      <li>All submitted documents are approved (VERIFIED)</li>
                    </ul>
                  </div>
                {:else if !inspectingWorkerProfile?.verified}
                  <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <p class="font-semibold text-slate-900 dark:text-white">Requirements to verify this worker:</p>
                    <ul class="mt-1.5 space-y-1">
                      {#each verificationEligibility.reasons as reason}
                        <li class="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Verification Action Buttons -->
            <div class="flex items-center gap-3 pt-2">
              {#if inspectingWorkerProfile?.verified}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={handleUnverifyWorker}
                  loading={isUnverifyingWorker}
                  class="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
                >
                  Revoke Verification (Unverify)
                </Button>
              {:else}
                <Button
                  variant="primary"
                  size="md"
                  disabled={!verificationEligibility.eligible}
                  onclick={openVerifyWorkerModal}
                  loading={isVerifyingWorker}
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <ShieldCheck class="w-4 h-4 mr-2" />
                  Verify Worker Profile
                </Button>
              {/if}
            </div>
          </div>
        </div>

        <!-- Worker Documents List Table -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">
              Submitted Identity Documents ({inspectingWorkerDocuments.length})
            </h4>
          </div>

          {#if inspectingWorkerDocuments.length === 0}
            <div class="p-8 text-center text-xs text-slate-400">
              No identity documents on record for this worker profile.
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" class="py-3 px-4">Document Type</th>
                    <th scope="col" class="py-3 px-4">Masked Number</th>
                    <th scope="col" class="py-3 px-4">Submitted Date</th>
                    <th scope="col" class="py-3 px-4">Status</th>
                    <th scope="col" class="py-3 px-4">Rejection Reason</th>
                    <th scope="col" class="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {#each inspectingWorkerDocuments as doc (doc.id)}
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {formatDocType(doc.documentType)}
                      </td>
                      <td class="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {doc.maskedDocumentNumber || '••••••••'}
                      </td>
                      <td class="py-3 px-4 text-xs text-slate-500">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td class="py-3 px-4">
                        {#if doc.verificationStatus === 'VERIFIED'}
                          <Badge variant="success">Verified</Badge>
                        {:else if doc.verificationStatus === 'REJECTED'}
                          <Badge variant="danger">Rejected</Badge>
                        {:else}
                          <Badge variant="PENDING">Pending</Badge>
                        {/if}
                      </td>
                      <td class="py-3 px-4 text-xs text-rose-600 dark:text-rose-400">
                        {doc.rejectionReason || '—'}
                      </td>
                      <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onclick={() => openPreview(doc)}
                        >
                          <Eye class="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Preview
                        </Button>
                        {#if doc.verificationStatus === 'PENDING'}
                          <Button
                            variant="primary"
                            size="sm"
                            onclick={() => openApproveModal(doc)}
                            class="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle class="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onclick={() => openRejectModal(doc)}
                          >
                            <XCircle class="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    </section>
  {/if}
</div>

<!-- ======================================================== -->
<!-- MODAL 1: Secure Document Preview Modal                   -->
<!-- ======================================================== -->
<Modal
  open={previewModalOpen}
  onclose={closePreview}
  title="Secure Document Preview"
  description="Encrypted credential loaded via authenticated administrator stream. Document data is never exposed publicly."
  size="xl"
>
  {#if previewDocument}
    <div class="space-y-4">
      <!-- Metadata Strip -->
      <div class="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl text-xs">
        <div>
          <span class="text-slate-400">Type:</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200 ml-1">
            {formatDocType(previewDocument.documentType)}
          </span>
        </div>
        <div>
          <span class="text-slate-400">Masked Number:</span>
          <span class="font-mono font-semibold text-slate-800 dark:text-slate-200 ml-1">
            {previewDocument.maskedDocumentNumber || '••••••••'}
          </span>
        </div>
        <div>
          <span class="text-slate-400">Status:</span>
          <span class="ml-1 font-semibold">
            {previewDocument.verificationStatus}
          </span>
        </div>
      </div>

      <!-- Preview Viewer -->
      <div class="min-h-[400px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden border border-slate-200 dark:border-slate-800">
        {#if isDownloadingPreview}
          <div class="text-center space-y-2 py-16">
            <RefreshCw class="w-8 h-8 text-primary-500 animate-spin mx-auto" />
            <p class="text-xs text-slate-500">Decrypting & downloading credential stream...</p>
          </div>
        {:else if previewError}
          <div class="text-center space-y-2 p-8 text-rose-500">
            <AlertCircle class="w-8 h-8 mx-auto" />
            <p class="text-sm font-semibold">{previewError}</p>
          </div>
        {:else if previewBlobUrl}
          {#if isPdfDocument(previewMimeType)}
            <iframe
              src={previewBlobUrl}
              title="Identity Document PDF Preview"
              class="w-full h-[520px] rounded-lg border-0 bg-white"
            ></iframe>
          {:else if isSupportedImageDocument(previewMimeType)}
            <img
              src={previewBlobUrl}
              alt="Identity Document Preview"
              class="max-h-[520px] max-w-full mx-auto object-contain rounded-lg shadow-sm"
            />
          {:else}
            <!-- Unsupported MIME Type Fallback Banner -->
            <div class="text-center space-y-3 p-8">
              <div class="p-3 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-12 h-12 mx-auto flex items-center justify-center">
                <FileText class="w-6 h-6" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Inline preview not supported for this file type
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  This document ({previewMimeType || 'unknown format'}) cannot be previewed in the browser. Please use the Download button below to review it locally.
                </p>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  {#snippet footer()}
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-1.5 text-xs text-slate-400">
        <Lock class="w-3.5 h-3.5 text-emerald-500" />
        <span>Admin TLS Stream Active</span>
      </div>

      <div class="flex items-center gap-2">
        {#if previewBlobUrl}
          <a
            href={previewBlobUrl}
            download="{previewDocument?.documentType || 'document'}.{isPdfDocument(previewMimeType) ? 'pdf' : (previewMimeType?.split('/')[1] || 'bin')}"
            class="inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download class="w-3.5 h-3.5 mr-1" />
            Download
          </a>
        {/if}
        <Button variant="outline" size="sm" onclick={closePreview}>
          Close
        </Button>
      </div>
    </div>
  {/snippet}
</Modal>

<!-- ======================================================== -->
<!-- MODAL 2: Approve Document Confirmation Modal             -->
<!-- ======================================================== -->
<Modal
  open={approveModalOpen}
  onclose={() => (approveModalOpen = false)}
  title="Approve Identity Document"
  size="md"
>
  {#if documentToApprove}
    <div class="space-y-3 text-sm">
      <p class="text-slate-600 dark:text-slate-300">
        Are you sure you want to approve this identity credential?
      </p>

      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-400">Worker:</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">{documentToApprove.workerName || 'Worker'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Document Type:</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">{formatDocType(documentToApprove.documentType)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Number:</span>
          <span class="font-mono text-slate-800 dark:text-slate-200">{documentToApprove.maskedDocumentNumber || '••••••••'}</span>
        </div>
      </div>

      <p class="text-xs text-slate-500">
        Approving this credential updates its status to <strong class="text-emerald-600">VERIFIED</strong> and recalculates the worker's profile completion percentage.
      </p>
    </div>
  {/if}

  {#snippet footer()}
    <div class="flex justify-end gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        disabled={isApproving}
        onclick={() => (approveModalOpen = false)}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        loading={isApproving}
        onclick={handleApprove}
        class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
      >
        <CheckCircle class="w-4 h-4 mr-1.5" />
        Confirm Approval
      </Button>
    </div>
  {/snippet}
</Modal>

<!-- ======================================================== -->
<!-- MODAL 3: Reject Document Reason Modal                    -->
<!-- ======================================================== -->
<Modal
  open={rejectModalOpen}
  onclose={() => (rejectModalOpen = false)}
  title="Reject Identity Document"
  size="md"
>
  {#if documentToReject}
    <div class="space-y-4">
      <p class="text-xs text-slate-600 dark:text-slate-300">
        Please specify a clear, non-empty reason for rejecting this {formatDocType(documentToReject.documentType)}. The worker will see this reason in their portfolio dashboard.
      </p>

      <div class="space-y-1">
        <Textarea
          label="Rejection Reason (Max 500 characters)"
          placeholder="e.g. Document image is blurred or illegible, name does not match worker profile, or credential is expired."
          bind:value={rejectionReason}
          error={rejectionError || undefined}
          required
          rows={4}
        />
        <div class="flex justify-between text-[11px] text-slate-400">
          <span>{rejectionError || ''}</span>
          <span class={rejectionReason.length > 500 ? 'text-rose-500 font-bold' : ''}>
            {rejectionReason.length} / 500
          </span>
        </div>
      </div>
    </div>
  {/if}

  {#snippet footer()}
    <div class="flex justify-end gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        disabled={isRejecting}
        onclick={() => (rejectModalOpen = false)}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={isRejecting}
        disabled={!rejectionReason.trim() || rejectionReason.length > 500}
        onclick={handleReject}
      >
        <XCircle class="w-4 h-4 mr-1.5" />
        Reject Document
      </Button>
    </div>
  {/snippet}
</Modal>

<!-- ======================================================== -->
<!-- MODAL 4: Worker Verification Confirmation Modal          -->
<!-- ======================================================== -->
<Modal
  open={verifyWorkerModalOpen}
  onclose={() => (verifyWorkerModalOpen = false)}
  title="Confirm Worker Marketplace Verification"
  size="md"
>
  <div class="space-y-3 text-sm">
    <p class="text-slate-600 dark:text-slate-300">
      Are you sure you want to verify <strong>{inspectingWorkerProfile?.firstName} {inspectingWorkerProfile?.lastName}</strong>?
    </p>

    <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
      <p class="font-bold flex items-center gap-1.5">
        <ShieldCheck class="w-4 h-4 text-emerald-600" />
        Marketplace Verification Impact:
      </p>
      <p class="mt-1">
        This worker will immediately satisfy customer search filters (<code class="font-mono">verified=true</code>) and appear in public search and category listings.
      </p>
    </div>
  </div>

  {#snippet footer()}
    <div class="flex justify-end gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        disabled={isVerifyingWorker}
        onclick={() => (verifyWorkerModalOpen = false)}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        loading={isVerifyingWorker}
        onclick={handleVerifyWorker}
        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
      >
        <ShieldCheck class="w-4 h-4 mr-1.5" />
        Verify Worker Now
      </Button>
    </div>
  {/snippet}
</Modal>
