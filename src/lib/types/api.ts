/**
 * BlueCollar API Contracts & Domain TypeScript Definitions
 * Directly aligned with Spring Boot backend controllers and DTOs
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: FieldErrorResponse[];
}

export interface FieldErrorResponse {
  field: string;
  message: string;
}

export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export type FileCategory =
  | 'PROFILE_PHOTO'
  | 'PORTFOLIO_IMAGE'
  | 'CERTIFICATE'
  | 'IDENTITY_DOC'
  | 'ATTACHMENT';

export type EntityType =
  | 'CUSTOMER'
  | 'WORKER'
  | 'PORTFOLIO'
  | 'CERTIFICATE'
  | 'IDENTITY_DOC'
  | 'BOOKING'
  | 'REVIEW';

export type IdentityDocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'VOTER_ID'
  | 'PASSPORT'
  | 'DRIVING_LICENSE';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// Auth Responses & DTOs
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: UserRole;
  profileId: string;
}

export interface CurrentUserResponse {
  userAccountId: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  customerId: string | null;
  workerId: string | null;
}

// Categories & Skills
export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillResponse {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer DTOs
export interface CustomerResponse {
  id: string;
  userAccountId: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummaryResponse {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  profilePhotoUrl: string | null;
}

// Worker Discovery & Search
export interface PublicWorkerResponse {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  experienceYears: number | null;
  bio: string | null;
  hourlyRate: number | null;
  available: boolean;
  verified: boolean;
  active: boolean;
  categoryId: string;
  categoryName: string;
  skills: SkillResponse[];
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSearchResultResponse {
  id: string;
  fullName: string;
  primaryCity: string | null;
  categoryName: string;
  hourlyRate: number | null;
  averageRating: number | null;
  reviewCount: number;
  available: boolean;
  verified: boolean;
  profilePhotoUrl: string | null;
  skillNames: string[];
  profileCompletionPercent: number;
}

export interface WorkerSearchResponse {
  results: WorkerSearchResultResponse[];
  totalElements: number;
  page: number;
  size: number;
  filters: Record<string, unknown>;
}

// Booking DTOs
export interface BookingResponse {
  id: string;
  status: BookingStatus;
  scheduledDate: string;
  timeSlot: string;
  description: string;
  quotedAmount: number;
  finalAmount: number | null;
  cancellationReason: string | null;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  categoryId: string;
  categoryName: string;
  workerId: string;
  workerName: string;
  customer: CustomerSummaryResponse;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  createdAt: string;
  updatedAt: string;
}

// Address DTOs
export interface AddressResponse {
  id: string;
  customerId: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  addressType: AddressType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review DTOs
export interface ReviewResponse {
  id: string;
  bookingId: string;
  workerId: string;
  customer: CustomerSummaryResponse;
  rating: number;
  active: boolean;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatsResponse {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

// Availability DTOs
export interface AvailableSlotResponse {
  startTime: string;
  endTime: string;
  timeSlot: string;
  available: boolean;
}

export interface AvailabilitySummaryResponse {
  workerId: string;
  online: boolean;
  bookable: boolean;
  vacationMode: boolean;
  vacationStartDate: string | null;
  vacationEndDate: string | null;
  activeNow: boolean;
}

export interface WorkingHoursEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface ScheduleOverrideResponse {
  id: string;
  overrideDate: string;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
  reason: string | null;
}

export interface WorkerAvailabilityConfigResponse {
  workerId: string;
  online: boolean;
  bookable: boolean;
  vacationMode: boolean;
  vacationStartDate: string | null;
  vacationEndDate: string | null;
  activeNow: boolean;
  workingHours: WorkingHoursEntry[];
  scheduleOverrides: ScheduleOverrideResponse[];
}

// Portfolio & KYC DTOs
export interface PortfolioImageResponse {
  id: string;
  fileId: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface CertificateResponse {
  id: string;
  fileId: string;
  certificateUrl: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string | null;
  expiryDate: string | null;
  verified: boolean;
  createdAt: string;
}

export interface IdentityDocumentResponse {
  id: string;
  fileId: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface ProfileCompletionResponse {
  percentage: number;
  completedSteps: string[];
  pendingSteps: string[];
}

export interface PortfolioSummaryResponse {
  workerId: string;
  profilePhotoUrl: string | null;
  profileCompletionPercentage: number;
  images: PortfolioImageResponse[];
  certificates: CertificateResponse[];
  identityDocuments?: IdentityDocumentResponse[];
}

export interface PublicPortfolioResponse {
  workerId: string;
  profilePhotoUrl: string | null;
  images: PortfolioImageResponse[];
  certificates: CertificateResponse[];
}

// File Storage
export interface StoredFileResponse {
  id: string;
  filename: string;
  fileCategory: FileCategory;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  createdAt: string;
}

// Notifications
export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface NotificationPreferenceResponse {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
}

// Spring Data Page
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


// ==========================================
// Request DTOs
// ==========================================

export interface RegisterCustomerRequest {
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterWorkerRequest {
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  hourlyRate: number;
  categoryId: string;
  skillIds: string[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface UpdateCustomerRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

export interface UpdateProfilePhotoRequest {
  fileId: string;
}

export interface CreateBookingRequest {
  workerId: string;
  categoryId: string;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM-HH:MM e.g. 09:00-11:00
  description: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
}

export interface RejectBookingRequest {
  reason?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface CompleteBookingRequest {
  finalAmount?: number | null;
}

export interface RescheduleBookingRequest {
  newScheduledDate: string; // YYYY-MM-DD
  newTimeSlot: string; // HH:MM-HH:MM
}

export interface CreateAddressRequest {
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  addressType: AddressType;
}

export interface UpdateAddressRequest {
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment: string;
}

export interface ReportReviewRequest {
  reason: string;
}

export interface UpdateOnlineStatusRequest {
  online: boolean;
}

export interface UpdateBookableRequest {
  bookable: boolean;
}

export interface UpdateWorkingHoursRequest {
  workingHours: WorkingHoursEntry[];
}

export interface VacationModeRequest {
  enabled: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ScheduleOverrideRequest {
  overrideDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isAvailable: boolean;
  reason?: string | null;
}

export interface AddPortfolioImageRequest {
  fileId: string;
  title?: string | null;
  description?: string | null;
  displayOrder?: number;
}

export interface UpdatePortfolioImageRequest {
  title?: string | null;
  description?: string | null;
  displayOrder?: number;
}

export interface AddCertificateRequest {
  fileId: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate?: string | null;
  expiryDate?: string | null;
}

export interface UpdateCertificateRequest {
  certificateName: string;
  issuingOrganization: string;
  issueDate?: string | null;
  expiryDate?: string | null;
}

export interface AddIdentityDocumentRequest {
  fileId: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
}

export interface SetProfilePhotoRequest {
  fileId: string;
}

export interface UpdateNotificationPreferenceRequest {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
}

export interface WorkerSearchParams {
  city?: string;
  state?: string;
  categoryId?: string;
  skillIds?: string[];
  matchAnySkill?: boolean;
  minRating?: number;
  available?: boolean;
  availableOn?: string;
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
  verified?: boolean;
  sort?: 'rating' | 'price' | 'experience' | 'createdAt';
  direction?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
