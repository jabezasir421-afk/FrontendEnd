import { api } from './client';
import type {
  PortfolioSummaryResponse,
  ProfileCompletionResponse,
  PortfolioImageResponse,
  CertificateResponse,
  IdentityDocumentResponse,
  AddPortfolioImageRequest,
  UpdatePortfolioImageRequest,
  AddCertificateRequest,
  UpdateCertificateRequest,
  AddIdentityDocumentRequest,
  SetProfilePhotoRequest
} from '$lib/types/api';

export const portfolioApi = {
  getMyPortfolio: () =>
    api.get<PortfolioSummaryResponse>('/workers/me/portfolio'),

  getProfileCompletion: () =>
    api.get<ProfileCompletionResponse>('/workers/me/portfolio/completion'),

  addImage: (data: AddPortfolioImageRequest) =>
    api.post<PortfolioImageResponse>('/workers/me/portfolio/images', data),

  updateImage: (id: string, data: UpdatePortfolioImageRequest) =>
    api.put<PortfolioImageResponse>(`/workers/me/portfolio/images/${id}`, data),

  deleteImage: (id: string) =>
    api.delete<void>(`/workers/me/portfolio/images/${id}`),

  addCertificate: (data: AddCertificateRequest) =>
    api.post<CertificateResponse>('/workers/me/portfolio/certificates', data),

  updateCertificate: (id: string, data: UpdateCertificateRequest) =>
    api.put<CertificateResponse>(`/workers/me/portfolio/certificates/${id}`, data),

  deleteCertificate: (id: string) =>
    api.delete<void>(`/workers/me/portfolio/certificates/${id}`),

  addIdentityDocument: (data: AddIdentityDocumentRequest) =>
    api.post<IdentityDocumentResponse>('/workers/me/portfolio/identity-documents', data),

  getIdentityDocuments: () =>
    api.get<IdentityDocumentResponse[]>('/workers/me/portfolio/identity-documents'),

  deleteIdentityDocument: (id: string) =>
    api.delete<void>(`/workers/me/portfolio/identity-documents/${id}`),

  setProfilePhoto: (data: SetProfilePhotoRequest) =>
    api.put<PortfolioSummaryResponse>('/workers/me/profile-photo', data)
};
