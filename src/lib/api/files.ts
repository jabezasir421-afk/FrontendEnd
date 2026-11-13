import { api } from './client';
import type { StoredFileResponse, FileCategory, EntityType } from '$lib/types/api';

export const filesApi = {
  upload: (
    file: File,
    fileCategory: FileCategory,
    entityType?: EntityType,
    entityId?: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileCategory', fileCategory);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    return api.upload<StoredFileResponse>('/files/upload', formData);
  },

  getById: (id: string) =>
    api.get<StoredFileResponse>(`/files/${id}`),

  downloadBlob: (id: string) =>
    api.getBlob(`/files/${encodeURIComponent(id)}/download`),

  getDownloadUrl: (id: string) => {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
    return `${baseUrl}/files/${id}/download`;
  }
};
