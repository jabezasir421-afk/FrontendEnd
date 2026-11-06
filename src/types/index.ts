export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';

export type BookingStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface Category {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  active: boolean;
  workerCount?: number;
}

export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface WorkerProfile {
  id: string;
  userAccountId?: string;
  fullName: string;
  primaryCity: string;
  state?: string;
  categoryName: string;
  categoryId?: string;
  hourlyRate: number;
  averageRating: number;
  reviewCount: number;
  available: boolean;
  verified: boolean;
  profilePhotoUrl?: string;
  skillNames: string[];
  profileCompletionPercent: number;
  bio?: string;
  yearsOfExperience?: number;
  completedJobsCount?: number;
  addressLine?: string;
  postalCode?: string;
  phoneNumber?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completedDate?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  fileUrl?: string;
}

export interface WorkingHours {
  dayOfWeek: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface WorkerAvailability {
  online: boolean;
  bookable: boolean;
  workingHours: WorkingHours[];
  vacations?: { startDate: string; endDate: string; note: string }[];
}

export interface Booking {
  id: string;
  workerId: string;
  workerName: string;
  workerCategory: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  status: BookingStatus;
  scheduledStartTime: string;
  scheduledEndTime: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
  estimatedPrice: number;
  finalPrice?: number;
  createdAt: string;
  completedAt?: string;
  cancellationReason?: string;
}

export interface Review {
  id: string;
  workerId: string;
  customerId: string;
  customerName: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  active: boolean;
  reported: boolean;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface Address {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  activeWorkers: number;
  verifiedWorkers: number;
  unverifiedWorkers: number;
  totalCustomers: number;
  pendingReviews: number;
  disputeRatePercent: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  targetEntity: string;
  targetId: string;
  details: string;
}

export interface BookingsTrendItem {
  date: string;
  count: number;
  created: number;
  completed: number;
  cancelled: number;
}

export interface CategoryDistributionItem {
  name: string;
  count: number;
  percentage: number;
  revenueCHF: number;
}

export interface RatingDistributionData {
  stars: number;
  count: number;
  percentage: number;
}

export interface TopWorkerItem {
  workerId: string;
  fullName: string;
  categoryName: string;
  completedBookings: number;
  rating: number;
  earningsCHF: number;
  rank: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  createdAt: string;
  totalBookings: number;
}

export interface ReportedReviewItem {
  id: string;
  workerId: string;
  workerName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  reportedReason: string;
  reportedAt: string;
  active: boolean;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePhotoUrl?: string;
}
