import { api } from './client';
import type { QueryClient } from '@tanstack/svelte-query';
import type {
  AdminIdentityDocumentResponse,
  RejectDocumentRequest,
  LinkWorkerUserRequest,
  WorkerResponse,
  Page
} from '$lib/types/api';

/**
 * Admin API module for worker verification, document moderation, and worker lifecycle.
 * All endpoints require a JWT token with ADMIN role.
 */
export const adminApi = {
  /**
   * List pending identity documents across all workers.
   * GET /api/v1/admin/workers/documents/pending?page={page}&size={size}
   */
  getPendingDocuments: (page = 0, size = 20) =>
    api.get<Page<AdminIdentityDocumentResponse>>('/admin/workers/documents/pending', {
      params: { page, size }
    }),

  /**
   * List all identity documents for a specific worker.
   * GET /api/v1/admin/workers/{workerId}/documents
   */
  getWorkerDocuments: (workerId: string) =>
    api.get<AdminIdentityDocumentResponse[]>(`/admin/workers/${encodeURIComponent(workerId)}/documents`),

  /**
   * Approve a pending identity document.
   * PUT /api/v1/admin/workers/documents/{documentId}/approve
   */
  approveDocument: (documentId: string) =>
    api.put<AdminIdentityDocumentResponse>(`/admin/workers/documents/${encodeURIComponent(documentId)}/approve`),

  /**
   * Reject a pending identity document with a mandatory reason.
   * PUT /api/v1/admin/workers/documents/{documentId}/reject
   */
  rejectDocument: (documentId: string, reason: string) => {
    const payload: RejectDocumentRequest = { reason };
    return api.put<AdminIdentityDocumentResponse>(
      `/admin/workers/documents/${encodeURIComponent(documentId)}/reject`,
      payload
    );
  },

  /**
   * Verify an active worker profile after all identity documents are verified.
   * PUT /api/v1/admin/workers/{workerId}/verify
   */
  verifyWorker: (workerId: string) =>
    api.put<WorkerResponse>(`/admin/workers/${encodeURIComponent(workerId)}/verify`),

  /**
   * Revoke verification status from a worker.
   * PUT /api/v1/admin/workers/{workerId}/unverify
   */
  unverifyWorker: (workerId: string) =>
    api.put<WorkerResponse>(`/admin/workers/${encodeURIComponent(workerId)}/unverify`),

  /**
   * Deactivate a worker account.
   * PUT /api/v1/admin/workers/{workerId}/deactivate
   */
  deactivateWorker: (workerId: string) =>
    api.put<WorkerResponse>(`/admin/workers/${encodeURIComponent(workerId)}/deactivate`),

  /**
   * Link an admin-provisioned worker profile to an existing user account.
   * PUT /api/v1/admin/workers/{workerId}/link-user
   */
  linkWorkerUser: (workerId: string, userAccountId: string) => {
    const payload: LinkWorkerUserRequest = { userAccountId };
    return api.put<WorkerResponse>(
      `/admin/workers/${encodeURIComponent(workerId)}/link-user`,
      payload
    );
  }
};

/**
 * TanStack Svelte Query Keys for Admin data caching
 */
export const adminQueryKeys = {
  all: ['admin'] as const,
  documents: () => [...adminQueryKeys.all, 'documents'] as const,
  pendingDocuments: (page = 0, size = 20) =>
    [...adminQueryKeys.documents(), 'pending', { page, size }] as const,
  workerDocuments: (workerId: string) =>
    [...adminQueryKeys.documents(), 'worker', workerId] as const,
  workers: () => [...adminQueryKeys.all, 'workers'] as const,
  workerDetail: (workerId: string) =>
    [...adminQueryKeys.workers(), workerId] as const
};

/**
 * Query cache invalidation helpers for TanStack Svelte Query
 */
export const adminCacheHelpers = {
  /**
   * Invalidate document queries after approval or rejection
   */
  invalidateDocuments: async (queryClient: QueryClient, workerId?: string) => {
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.documents() });
    if (workerId) {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.workerDocuments(workerId) });
    }
  },

  /**
   * Invalidate worker records and public search queries after verification, unverification, or deactivation
   */
  invalidateWorkerVerification: async (queryClient: QueryClient, workerId?: string) => {
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.workers() });
    if (workerId) {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.workerDetail(workerId) });
    }
    // Invalidate public worker discovery queries so search results reflect updated verification status
    await queryClient.invalidateQueries({ queryKey: ['workers'] });
    await queryClient.invalidateQueries({ queryKey: ['search'] });
  }
};

/**
 * Mutation options for TanStack Svelte Query createMutation
 */
export const adminMutationOptions = {
  approveDocument: (queryClient: QueryClient, workerId?: string) => ({
    mutationFn: (documentId: string) => adminApi.approveDocument(documentId),
    onSuccess: async () => {
      await adminCacheHelpers.invalidateDocuments(queryClient, workerId);
    }
  }),

  rejectDocument: (queryClient: QueryClient, workerId?: string) => ({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
      adminApi.rejectDocument(documentId, reason),
    onSuccess: async () => {
      await adminCacheHelpers.invalidateDocuments(queryClient, workerId);
    }
  }),

  verifyWorker: (queryClient: QueryClient) => ({
    mutationFn: (workerId: string) => adminApi.verifyWorker(workerId),
    onSuccess: async (_data: WorkerResponse, workerId: string) => {
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, workerId);
    }
  }),

  unverifyWorker: (queryClient: QueryClient) => ({
    mutationFn: (workerId: string) => adminApi.unverifyWorker(workerId),
    onSuccess: async (_data: WorkerResponse, workerId: string) => {
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, workerId);
    }
  }),

  deactivateWorker: (queryClient: QueryClient) => ({
    mutationFn: (workerId: string) => adminApi.deactivateWorker(workerId),
    onSuccess: async (_data: WorkerResponse, workerId: string) => {
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, workerId);
    }
  }),

  linkWorkerUser: (queryClient: QueryClient) => ({
    mutationFn: ({ workerId, userAccountId }: { workerId: string; userAccountId: string }) =>
      adminApi.linkWorkerUser(workerId, userAccountId),
    onSuccess: async (_data: WorkerResponse, { workerId }: { workerId: string }) => {
      await adminCacheHelpers.invalidateWorkerVerification(queryClient, workerId);
    }
  })
};
