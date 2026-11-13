import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup localStorage and window mocks for Node environment
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
  key: () => null,
  length: 0
};

const dispatchEventMock = vi.fn();
globalThis.window = {
  localStorage: localStorageMock,
  dispatchEvent: dispatchEventMock
} as unknown as Window & typeof globalThis;
globalThis.localStorage = localStorageMock as unknown as Storage;

import { setTokens, clearTokens, ApiError } from '../src/lib/api/client';
import { adminApi, adminQueryKeys, adminCacheHelpers } from '../src/lib/api/admin';
import type {
  AdminIdentityDocumentResponse,
  WorkerResponse,
  Page
} from '../src/lib/types/api';
import type { QueryClient } from '@tanstack/svelte-query';

describe('Admin API Module & Contracts', () => {
  const adminToken = 'admin-jwt-token-with-admin-role';
  const workerId = 'eb8cf6e8-6246-4965-b415-90626a78e8a1';
  const documentId = 'doc-1111-2222-3333-444455556666';
  const userAccountId = 'usr-7688ffb9-5a94-480e-9032-e2e4eec9ee4d';

  const mockDocument: AdminIdentityDocumentResponse = {
    id: documentId,
    workerId,
    workerName: 'Suresh Kumar',
    fileId: 'file-uuid-1',
    documentType: 'AADHAAR',
    maskedDocumentNumber: 'XXXX-XXXX-9012',
    verificationStatus: 'PENDING',
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null,
    createdAt: '2026-11-13T10:00:00Z'
  };

  const mockWorker: WorkerResponse = {
    id: workerId,
    firstName: 'Suresh',
    lastName: 'Kumar',
    phoneNumber: '9100000001',
    email: 'suresh.ac@example.com',
    gender: 'MALE',
    dateOfBirth: '1985-06-15',
    experienceYears: 8,
    bio: 'AC Repair specialist',
    hourlyRate: 500,
    available: true,
    verified: true,
    active: true,
    categoryId: 'cat-ac-repair',
    categoryName: 'AC Repair',
    skills: [],
    averageRating: 4.8,
    reviewCount: 12,
    createdAt: '2026-11-11T17:47:26Z',
    updatedAt: '2026-11-13T12:00:00Z'
  };

  beforeEach(() => {
    localStorage.clear();
    dispatchEventMock.mockClear();
    vi.restoreAllMocks();
    setTokens(adminToken, 'admin-refresh-token');
  });

  describe('Pending Documents Endpoint', () => {
    it('getPendingDocuments sends GET to /admin/workers/documents/pending with default pagination', async () => {
      const pageResult: Page<AdminIdentityDocumentResponse> = {
        content: [mockDocument],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: false
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Success', data: pageResult })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.getPendingDocuments();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain('/api/v1/admin/workers/documents/pending');
      expect(url).toContain('page=0');
      expect(url).toContain('size=20');
      expect(requestInit?.method).toBe('GET');

      const headers = requestInit?.headers as Headers;
      expect(headers.get('Authorization')).toBe(`Bearer ${adminToken}`);
      expect(result).toEqual(pageResult);
    });

    it('getPendingDocuments forwards custom page and size parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Success', data: { content: [] } })
      });
      globalThis.fetch = fetchMock;

      await adminApi.getPendingDocuments(2, 50);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('page=2');
      expect(url).toContain('size=50');
    });
  });

  describe('Worker Documents Endpoint', () => {
    it('getWorkerDocuments sends GET to /admin/workers/{workerId}/documents with URL encoding', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Success', data: [mockDocument] })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.getWorkerDocuments(workerId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/${workerId}/documents`);
      expect(requestInit?.method).toBe('GET');
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('Document Moderation Endpoints', () => {
    it('approveDocument sends PUT to /admin/workers/documents/{documentId}/approve', async () => {
      const approvedDoc: AdminIdentityDocumentResponse = {
        ...mockDocument,
        verificationStatus: 'VERIFIED',
        verifiedBy: userAccountId,
        verifiedAt: '2026-11-13T12:00:00Z'
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Identity document approved successfully', data: approvedDoc })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.approveDocument(documentId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/documents/${documentId}/approve`);
      expect(requestInit?.method).toBe('PUT');
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('rejectDocument sends PUT with reason body to /admin/workers/documents/{documentId}/reject', async () => {
      const rejectedDoc: AdminIdentityDocumentResponse = {
        ...mockDocument,
        verificationStatus: 'REJECTED',
        rejectionReason: 'Document image is blurred'
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Identity document rejected successfully', data: rejectedDoc })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.rejectDocument(documentId, 'Document image is blurred');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/documents/${documentId}/reject`);
      expect(requestInit?.method).toBe('PUT');
      expect(JSON.parse(requestInit?.body as string)).toEqual({ reason: 'Document image is blurred' });
      expect(result.verificationStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Document image is blurred');
    });
  });

  describe('Worker Verification & Lifecycle Endpoints', () => {
    it('verifyWorker sends PUT to /admin/workers/{workerId}/verify', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Worker verified successfully', data: mockWorker })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.verifyWorker(workerId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/${workerId}/verify`);
      expect(requestInit?.method).toBe('PUT');
      expect(result.verified).toBe(true);
    });

    it('unverifyWorker sends PUT to /admin/workers/{workerId}/unverify', async () => {
      const unverifiedWorker: WorkerResponse = {
        ...mockWorker,
        verified: false
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Worker unverified successfully', data: unverifiedWorker })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.unverifyWorker(workerId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/${workerId}/unverify`);
      expect(requestInit?.method).toBe('PUT');
      expect(result.verified).toBe(false);
    });

    it('deactivateWorker sends PUT to /admin/workers/{workerId}/deactivate', async () => {
      const deactivatedWorker: WorkerResponse = {
        ...mockWorker,
        active: false,
        available: false
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Worker deactivated successfully', data: deactivatedWorker })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.deactivateWorker(workerId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/${workerId}/deactivate`);
      expect(requestInit?.method).toBe('PUT');
      expect(result.active).toBe(false);
      expect(result.available).toBe(false);
    });

    it('linkWorkerUser sends PUT with userAccountId to /admin/workers/{workerId}/link-user', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, message: 'Worker linked to user account successfully', data: mockWorker })
      });
      globalThis.fetch = fetchMock;

      const result = await adminApi.linkWorkerUser(workerId, userAccountId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toContain(`/api/v1/admin/workers/${workerId}/link-user`);
      expect(requestInit?.method).toBe('PUT');
      expect(JSON.parse(requestInit?.body as string)).toEqual({ userAccountId });
      expect(result).toEqual(mockWorker);
    });
  });

  describe('Error Handling & HTTP Statuses', () => {
    it('propagates 409 Conflict when verifyWorker fails due to missing identity documents', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'CONFLICT',
          message: 'Worker must have at least one verified identity document'
        })
      });
      globalThis.fetch = fetchMock;

      await expect(adminApi.verifyWorker(workerId)).rejects.toThrowError(
        'Worker must have at least one verified identity document'
      );
    });

    it('propagates 403 Forbidden when caller lacks ADMIN role', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access Denied: Admin role required'
        })
      });
      globalThis.fetch = fetchMock;

      await expect(adminApi.getPendingDocuments()).rejects.toThrowError(
        'Access Denied: Admin role required'
      );
    });

    it('propagates 404 Not Found when worker or document does not exist', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: 'NOT_FOUND',
          message: 'Worker not found: invalid-id'
        })
      });
      globalThis.fetch = fetchMock;

      await expect(adminApi.verifyWorker('invalid-id')).rejects.toThrowError(
        'Worker not found: invalid-id'
      );
    });
  });

  describe('TanStack Svelte Query Keys & Cache Invalidation', () => {
    it('generates predictable query keys for pending documents and workers', () => {
      expect(adminQueryKeys.all).toEqual(['admin']);
      expect(adminQueryKeys.pendingDocuments(1, 10)).toEqual(['admin', 'documents', 'pending', { page: 1, size: 10 }]);
      expect(adminQueryKeys.workerDocuments(workerId)).toEqual(['admin', 'documents', 'worker', workerId]);
      expect(adminQueryKeys.workers()).toEqual(['admin', 'workers']);
      expect(adminQueryKeys.workerDetail(workerId)).toEqual(['admin', 'workers', workerId]);
    });

    it('adminCacheHelpers.invalidateDocuments invalidates document queries on queryClient', async () => {
      const invalidateQueriesMock = vi.fn().mockResolvedValue(undefined);
      const mockQueryClient = {
        invalidateQueries: invalidateQueriesMock
      } as unknown as QueryClient;

      await adminCacheHelpers.invalidateDocuments(mockQueryClient, workerId);

      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: adminQueryKeys.documents() });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: adminQueryKeys.workerDocuments(workerId) });
    });

    it('adminCacheHelpers.invalidateWorkerVerification invalidates admin workers, public workers, and search', async () => {
      const invalidateQueriesMock = vi.fn().mockResolvedValue(undefined);
      const mockQueryClient = {
        invalidateQueries: invalidateQueriesMock
      } as unknown as QueryClient;

      await adminCacheHelpers.invalidateWorkerVerification(mockQueryClient, workerId);

      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: adminQueryKeys.workers() });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: adminQueryKeys.workerDetail(workerId) });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['workers'] });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['search'] });
    });
  });
});
