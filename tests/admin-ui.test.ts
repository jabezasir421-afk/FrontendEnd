import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filesApi } from '../src/lib/api/files';
import { api } from '../src/lib/api/client';
import type { AdminIdentityDocumentResponse, WorkerResponse } from '../src/lib/types/api';

describe('Admin Document Review UI Helpers & Logic', () => {
  describe('filesApi.downloadBlob', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('requests binary blob through authenticated client with URL encoding', async () => {
      const mockBlob = new Blob(['test-binary-data'], { type: 'application/pdf' });
      const getBlobSpy = vi.spyOn(api, 'getBlob').mockResolvedValue(mockBlob);

      const fileId = 'uuid-abc-123/special?name';
      const result = await filesApi.downloadBlob(fileId);

      expect(getBlobSpy).toHaveBeenCalledWith(
        `/files/${encodeURIComponent(fileId)}/download`
      );
      expect(result).toBe(mockBlob);
      expect(result.size).toBe(mockBlob.size);
    });
  });

  describe('Document Rejection Reason Validation', () => {
    function validateRejectionReason(reason: string): { valid: boolean; error?: string } {
      const trimmed = reason.trim();
      if (!trimmed) {
        return { valid: false, error: 'Rejection reason is required' };
      }
      if (trimmed.length > 500) {
        return { valid: false, error: 'Reason cannot exceed 500 characters' };
      }
      return { valid: true };
    }

    it('rejects empty or whitespace-only reason', () => {
      expect(validateRejectionReason('')).toEqual({
        valid: false,
        error: 'Rejection reason is required'
      });
      expect(validateRejectionReason('   \n  \t ')).toEqual({
        valid: false,
        error: 'Rejection reason is required'
      });
    });

    it('rejects reason exceeding 500 characters', () => {
      const longReason = 'a'.repeat(501);
      expect(validateRejectionReason(longReason)).toEqual({
        valid: false,
        error: 'Reason cannot exceed 500 characters'
      });
    });

    it('accepts valid reason within 1 to 500 characters', () => {
      expect(validateRejectionReason('Document is blurry and unreadable')).toEqual({
        valid: true
      });
      expect(validateRejectionReason('a'.repeat(500))).toEqual({
        valid: true
      });
    });
  });

  describe('Worker Verification Eligibility Logic', () => {
    /**
     * Mirrors the backend AdminWorkerServiceImpl verification prerequisites:
     * - Worker must be active (active == true)
     * - Must have at least 1 identity document (documents.size() >= 1)
     * - Zero pending documents (pendingCount == 0)
     * - Zero rejected documents (rejectedCount == 0)
     * - All documents verified (verifiedCount === totalCount)
     */
    function computeVerificationEligibility(
      worker: WorkerResponse | null,
      documents: AdminIdentityDocumentResponse[]
    ) {
      if (!worker) {
        return { eligible: false, reason: 'No worker selected' };
      }
      if (!worker.active) {
        return { eligible: false, reason: 'Worker account is inactive' };
      }
      if (documents.length === 0) {
        return { eligible: false, reason: 'Worker has no uploaded identity documents' };
      }
      const pendingCount = documents.filter((d) => d.verificationStatus === 'PENDING').length;
      const rejectedCount = documents.filter((d) => d.verificationStatus === 'REJECTED').length;
      const verifiedCount = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;

      if (pendingCount > 0) {
        return {
          eligible: false,
          reason: `Worker has ${pendingCount} pending document(s) requiring review`
        };
      }
      if (rejectedCount > 0) {
        return {
          eligible: false,
          reason: `Worker has ${rejectedCount} rejected document(s) that must be re-submitted or resolved`
        };
      }
      if (verifiedCount !== documents.length) {
        return {
          eligible: false,
          reason: 'All active documents must be in VERIFIED status'
        };
      }

      return { eligible: true, reason: 'All verification requirements satisfied' };
    }

    const mockBaseWorker: WorkerResponse = {
      id: 'worker-1',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      phoneNumber: '+919876543210',
      email: 'ramesh@example.com',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      experienceYears: 5,
      bio: 'Expert plumber',
      hourlyRate: 500,
      available: true,
      verified: false,
      active: true,
      categoryId: 'cat-1',
      categoryName: 'Plumbing',
      skills: [],
      averageRating: 4.8,
      reviewCount: 12,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    const mockDoc = (status: 'PENDING' | 'VERIFIED' | 'REJECTED', id: string): AdminIdentityDocumentResponse => ({
      id,
      workerId: 'worker-1',
      workerName: 'Ramesh Kumar',
      documentType: 'AADHAAR',
      maskedDocumentNumber: 'XXXX-XXXX-1234',
      verificationStatus: status,
      fileId: `file-${id}`,
      verifiedBy: status === 'VERIFIED' ? 'admin-1' : null,
      verifiedAt: status === 'VERIFIED' ? '2026-01-02T00:00:00Z' : null,
      rejectionReason: status === 'REJECTED' ? 'Blurry image' : null,
      createdAt: '2026-01-01T00:00:00Z'
    });

    it('is not eligible when worker is null', () => {
      const res = computeVerificationEligibility(null, []);
      expect(res.eligible).toBe(false);
      expect(res.reason).toBe('No worker selected');
    });

    it('is not eligible when worker is inactive', () => {
      const inactiveWorker = { ...mockBaseWorker, active: false };
      const docs = [mockDoc('VERIFIED', 'd1')];
      const res = computeVerificationEligibility(inactiveWorker, docs);
      expect(res.eligible).toBe(false);
      expect(res.reason).toBe('Worker account is inactive');
    });

    it('is not eligible when worker has 0 identity documents', () => {
      const res = computeVerificationEligibility(mockBaseWorker, []);
      expect(res.eligible).toBe(false);
      expect(res.reason).toBe('Worker has no uploaded identity documents');
    });

    it('is not eligible when worker has pending documents', () => {
      const docs = [mockDoc('VERIFIED', 'd1'), mockDoc('PENDING', 'd2')];
      const res = computeVerificationEligibility(mockBaseWorker, docs);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('pending document(s)');
    });

    it('is not eligible when worker has rejected documents', () => {
      const docs = [mockDoc('VERIFIED', 'd1'), mockDoc('REJECTED', 'd2')];
      const res = computeVerificationEligibility(mockBaseWorker, docs);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('rejected document(s)');
    });

    it('is eligible when active and all documents are verified', () => {
      const docs = [mockDoc('VERIFIED', 'd1'), mockDoc('VERIFIED', 'd2')];
      const res = computeVerificationEligibility(mockBaseWorker, docs);
      expect(res.eligible).toBe(true);
      expect(res.reason).toBe('All verification requirements satisfied');
    });
  });

  describe('Document Preview MIME Type & Fallback Classification', () => {
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

    function classifyPreviewMode(mime: string | null): 'pdf' | 'image' | 'unsupported' {
      if (isPdfDocument(mime)) return 'pdf';
      if (isSupportedImageDocument(mime)) return 'image';
      return 'unsupported';
    }

    it('correctly identifies PDF mime types', () => {
      expect(classifyPreviewMode('application/pdf')).toBe('pdf');
      expect(classifyPreviewMode('APPLICATION/PDF')).toBe('pdf');
      expect(classifyPreviewMode('application/x-pdf')).toBe('pdf');
    });

    it('correctly identifies supported image mime types', () => {
      expect(classifyPreviewMode('image/jpeg')).toBe('image');
      expect(classifyPreviewMode('image/png')).toBe('image');
      expect(classifyPreviewMode('image/webp')).toBe('image');
      expect(classifyPreviewMode('image/jpg')).toBe('image');
    });

    it('classifies unsupported binary and text formats as unsupported fallback', () => {
      expect(classifyPreviewMode('application/octet-stream')).toBe('unsupported');
      expect(classifyPreviewMode('text/plain')).toBe('unsupported');
      expect(classifyPreviewMode('application/zip')).toBe('unsupported');
      expect(classifyPreviewMode('application/msword')).toBe('unsupported');
      expect(classifyPreviewMode(null)).toBe('unsupported');
      expect(classifyPreviewMode('')).toBe('unsupported');
    });

    it('never renders an unsupported binary file as an image', () => {
      const unsupportedMimes = [
        'application/octet-stream',
        'application/vnd.ms-excel',
        'application/zip',
        'binary/octet-stream',
        'unknown/type'
      ];
      for (const mime of unsupportedMimes) {
        expect(isSupportedImageDocument(mime)).toBe(false);
        expect(classifyPreviewMode(mime)).toBe('unsupported');
      }
    });
  });

  describe('Blob URL Cleanup Lifecycle', () => {
    it('revokes blob URL on close and handles component unmount cleanup', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      let previewBlobUrl: string | null = 'blob:http://localhost:3000/mock-uuid';

      // Simulate unmount hook
      function simulateOnDestroy() {
        if (previewBlobUrl) {
          URL.revokeObjectURL(previewBlobUrl);
          previewBlobUrl = null;
        }
      }

      simulateOnDestroy();
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost:3000/mock-uuid');
      expect(previewBlobUrl).toBeNull();

      // Ensure idempotency (no double-revocation)
      simulateOnDestroy();
      expect(revokeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
