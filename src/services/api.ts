import { 
  WorkerProfile, 
  Booking, 
  Category, 
  Skill, 
  Review, 
  ReviewStats, 
  Address, 
  NotificationItem, 
  AdminDashboardMetrics, 
  AuditLog,
  BookingStatus,
  UserRole,
  BookingsTrendItem,
  CategoryDistributionItem,
  RatingDistributionData,
  TopWorkerItem,
  AdminUserItem,
  ReportedReviewItem,
  PortfolioItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Token Management
export const getToken = (): string | null => localStorage.getItem('bluecollar_token');
export const setToken = (token: string) => localStorage.setItem('bluecollar_token', token);
export const removeToken = () => {
  localStorage.removeItem('bluecollar_token');
  localStorage.removeItem('bluecollar_user');
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Persistence Helpers for Offline/Demo Mode
const loadPersisted = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const savePersisted = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
};

// Initial Mock Dataset for Offline/Evaluation Demonstration
let mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electrical Engineering & Installation', description: 'Certified commercial and domestic electrical services, rewiring, inspections', active: true, workerCount: 14 },
  { id: 'cat-2', name: 'Precision Plumbing & Sanitary', description: 'High-pressure line maintenance, leaks, drain clearing, sanitary fittings', active: true, workerCount: 19 },
  { id: 'cat-3', name: 'Carpentry & Architectural Millwork', description: 'Custom cabinetry, structural framing, hardwood repairs, finish woodwork', active: true, workerCount: 11 },
  { id: 'cat-4', name: 'HVAC & Thermal Systems', description: 'Industrial ventilation, air conditioning diagnostics, central heat pump repair', active: true, workerCount: 8 },
  { id: 'cat-5', name: 'Masonry & Structural Restoration', description: 'Brickwork, concrete pouring, foundation remediation, waterproofing', active: true, workerCount: 6 },
  { id: 'cat-6', name: 'Industrial Coating & Painting', description: 'Interior/exterior architectural coatings, epoxy floor surfaces, prep work', active: true, workerCount: 12 },
];

let mockWorkers: WorkerProfile[] = loadPersisted('bluecollar_mock_workers', [
  {
    id: 'w-101',
    fullName: 'Dieter Ramsen',
    primaryCity: 'Zurich',
    state: 'ZH',
    categoryName: 'Electrical Engineering & Installation',
    categoryId: 'cat-1',
    hourlyRate: 85.00,
    averageRating: 4.9,
    reviewCount: 38,
    available: true,
    verified: true,
    skillNames: ['Industrial Rewiring', 'Circuit Breakers', 'Three-Phase Power', 'Fault Finding'],
    profileCompletionPercent: 100,
    bio: 'Master Electrician with 14 years in commercial infrastructure and residential automation. Strict compliance with ISO/DIN standards.',
    yearsOfExperience: 14,
    completedJobsCount: 142,
    phoneNumber: '+41 44 892 1042',
  },
  {
    id: 'w-102',
    fullName: 'Josef Müller-Brockmann',
    primaryCity: 'Basel',
    state: 'BS',
    categoryName: 'Carpentry & Architectural Millwork',
    categoryId: 'cat-3',
    hourlyRate: 92.00,
    averageRating: 5.0,
    reviewCount: 29,
    available: true,
    verified: true,
    skillNames: ['Architectural Millwork', 'Hardwood Flooring', 'Structural Timber', 'Precision Fitting'],
    profileCompletionPercent: 95,
    bio: 'Cabinetmaker and master carpenter. Focused on mathematical alignment, rational joints, and minimalist durable wood fabrication.',
    yearsOfExperience: 18,
    completedJobsCount: 96,
    phoneNumber: '+41 61 743 9911',
  },
  {
    id: 'w-103',
    fullName: 'Adrian Frutiger',
    primaryCity: 'Bern',
    state: 'BE',
    categoryName: 'Precision Plumbing & Sanitary',
    categoryId: 'cat-2',
    hourlyRate: 78.00,
    averageRating: 4.8,
    reviewCount: 54,
    available: false,
    verified: true,
    skillNames: ['Pipe Welding', 'Pressure Reducers', 'Commercial Backflow', 'Boiler Diagnostics'],
    profileCompletionPercent: 90,
    bio: 'Sanitary technician specialized in multi-unit distribution lines, copper solder joints, and acoustic noise insulation.',
    yearsOfExperience: 12,
    completedJobsCount: 210,
    phoneNumber: '+41 31 300 4882',
  },
  {
    id: 'w-104',
    fullName: 'Armin Hofmann',
    primaryCity: 'Zurich',
    state: 'ZH',
    categoryName: 'HVAC & Thermal Systems',
    categoryId: 'cat-4',
    hourlyRate: 110.00,
    averageRating: 4.7,
    reviewCount: 22,
    available: true,
    verified: true,
    skillNames: ['Heat Exchangers', 'Refrigerant Cycling', 'Duct Balancing', 'BMS Integration'],
    profileCompletionPercent: 85,
    bio: 'Thermal engineer maintaining clean-room ventilation, heat pumps, and balanced central air distribution across canton Zurich.',
    yearsOfExperience: 9,
    completedJobsCount: 88,
    phoneNumber: '+41 44 210 9940',
  },
  {
    id: 'w-105',
    fullName: 'Max Bill',
    primaryCity: 'Geneva',
    state: 'GE',
    categoryName: 'Masonry & Structural Restoration',
    categoryId: 'cat-5',
    hourlyRate: 95.00,
    averageRating: 4.9,
    reviewCount: 17,
    available: true,
    verified: false,
    skillNames: ['Reinforced Concrete', 'Facade Pointing', 'Structural Grouting', 'Basement Tanking'],
    profileCompletionPercent: 70,
    bio: 'Structural masonry specialist. Geometric precision in exposed concrete, stone carving, and seismic retrofitting.',
    yearsOfExperience: 15,
    completedJobsCount: 64,
    phoneNumber: '+41 22 511 8833',
  },
  {
    id: 'w-106',
    fullName: 'Emil Ruder',
    primaryCity: 'Lucerne',
    state: 'LU',
    categoryName: 'Industrial Coating & Painting',
    categoryId: 'cat-6',
    hourlyRate: 70.00,
    averageRating: 4.6,
    reviewCount: 41,
    available: true,
    verified: true,
    skillNames: ['Epoxy Flooring', 'Anti-Corrosion Priming', 'Mineral Silicate Coat', 'Airless Spraying'],
    profileCompletionPercent: 100,
    bio: 'Surface preparation and protective coating contractor. Zero drips, razor-sharp hairlines, and long-lasting industrial durability.',
    yearsOfExperience: 11,
    completedJobsCount: 178,
    phoneNumber: '+41 41 688 2390',
  }
]);

let mockBookings: Booking[] = loadPersisted('bluecollar_mock_bookings', [
  {
    id: 'bk-2024-001',
    workerId: 'w-101',
    workerName: 'Dieter Ramsen',
    workerCategory: 'Electrical Engineering & Installation',
    customerId: 'cust-1',
    customerName: 'Hans Gugelot',
    customerPhone: '+41 79 123 4567',
    status: 'COMPLETED',
    scheduledStartTime: '2026-11-04T09:00:00Z',
    scheduledEndTime: '2026-11-04T13:00:00Z',
    addressLine: 'Gotthardstrasse 24',
    city: 'Zurich',
    state: 'ZH',
    postalCode: '8002',
    notes: 'Distribution panel upgrade and RCD trip testing for laboratory unit.',
    estimatedPrice: 340.00,
    finalPrice: 340.00,
    createdAt: '2026-11-02T14:20:00Z',
    completedAt: '2026-11-04T13:15:00Z',
  },
  {
    id: 'bk-2024-002',
    workerId: 'w-102',
    workerName: 'Josef Müller-Brockmann',
    workerCategory: 'Carpentry & Architectural Millwork',
    customerId: 'cust-1',
    customerName: 'Hans Gugelot',
    customerPhone: '+41 79 123 4567',
    status: 'IN_PROGRESS',
    scheduledStartTime: '2026-11-07T08:30:00Z',
    scheduledEndTime: '2026-11-07T16:00:00Z',
    addressLine: 'Rennweg 15',
    city: 'Zurich',
    state: 'ZH',
    postalCode: '8001',
    notes: 'Custom solid oak shelving installation with concealed wall anchors.',
    estimatedPrice: 690.00,
    createdAt: '2026-11-05T10:00:00Z',
  },
  {
    id: 'bk-2024-003',
    workerId: 'w-104',
    workerName: 'Armin Hofmann',
    workerCategory: 'HVAC & Thermal Systems',
    customerId: 'cust-1',
    customerName: 'Hans Gugelot',
    customerPhone: '+41 79 123 4567',
    status: 'PENDING',
    scheduledStartTime: '2026-11-10T10:00:00Z',
    scheduledEndTime: '2026-11-10T12:00:00Z',
    addressLine: 'Gotthardstrasse 24',
    city: 'Zurich',
    state: 'ZH',
    postalCode: '8002',
    notes: 'Annual diagnostic check on heat pump compressor and expansion valve.',
    estimatedPrice: 220.00,
    createdAt: '2026-11-06T18:00:00Z',
  }
]);

let mockAddresses: Address[] = loadPersisted('bluecollar_mock_addresses', [
  {
    id: 'addr-1',
    customerId: 'cust-1',
    addressLine1: 'Gotthardstrasse 24',
    addressLine2: 'Atelier 4B',
    city: 'Zurich',
    state: 'ZH',
    postalCode: '8002',
    isDefault: true,
    active: true,
  },
  {
    id: 'addr-2',
    customerId: 'cust-1',
    addressLine1: 'Rennweg 15',
    city: 'Zurich',
    state: 'ZH',
    postalCode: '8001',
    isDefault: false,
    active: true,
  }
]);

let mockReviews: Review[] = loadPersisted('bluecollar_mock_reviews', [
  {
    id: 'rev-1',
    workerId: 'w-101',
    customerId: 'cust-1',
    customerName: 'Hans Gugelot',
    bookingId: 'bk-2024-001',
    rating: 5,
    comment: 'Exceptional precision. Clean cable runs, strictly labeled circuit breakers, zero downtime for building occupants. Highly recommended.',
    createdAt: '2026-11-04T15:30:00Z',
    active: true,
    reported: false
  },
  {
    id: 'rev-2',
    workerId: 'w-101',
    customerId: 'cust-2',
    customerName: 'Karl Gerstner',
    bookingId: 'bk-prev-99',
    rating: 5,
    comment: 'Masterful execution. Fault diagnosed within 20 minutes and rectified according to standard code.',
    createdAt: '2026-10-22T11:00:00Z',
    active: true,
    reported: false
  }
]);

let mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Booking Confirmed',
    message: 'Josef Müller-Brockmann accepted your booking for Nov 7, 08:30.',
    type: 'BOOKING_UPDATE',
    read: false,
    createdAt: '2026-11-05T10:05:00Z'
  },
  {
    id: 'notif-2',
    title: 'Work Completed',
    message: 'Dieter Ramsen finalized service bk-2024-001. Please verify and leave a review.',
    type: 'BOOKING_COMPLETED',
    read: true,
    createdAt: '2026-11-04T13:20:00Z'
  }
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-06T18:40:12Z',
    action: 'WORKER_VERIFICATION_APPROVED',
    performedBy: 'admin@bluecollar.in',
    targetEntity: 'WORKER',
    targetId: 'w-101',
    details: 'Electrical license and commercial insurance documents verified.'
  },
  {
    id: 'log-2',
    timestamp: '2026-11-06T16:15:00Z',
    action: 'BOOKING_COMPLETED',
    performedBy: 'w-101',
    targetEntity: 'BOOKING',
    targetId: 'bk-2024-001',
    details: 'Status transitioned from IN_PROGRESS to COMPLETED. Amount: 340.00 CHF.'
  },
  {
    id: 'log-3',
    timestamp: '2026-11-06T12:00:00Z',
    action: 'USER_REGISTERED',
    performedBy: 'system',
    targetEntity: 'CUSTOMER',
    targetId: 'cust-1',
    details: 'Self-registration completed with phone verification.'
  },
  {
    id: 'log-4',
    timestamp: '2026-11-05T09:12:00Z',
    action: 'REVIEW_MODERATED',
    performedBy: 'admin@bluecollar.in',
    targetEntity: 'REVIEW',
    targetId: 'rev-rep-1',
    details: 'Deactivated review violating objectivity standard.'
  }
];

let mockBookingsTrend: BookingsTrendItem[] = [
  { date: '2026-10-25', count: 18, created: 20, completed: 17, cancelled: 1 },
  { date: '2026-10-26', count: 24, created: 26, completed: 22, cancelled: 2 },
  { date: '2026-10-27', count: 31, created: 33, completed: 29, cancelled: 2 },
  { date: '2026-10-28', count: 28, created: 30, completed: 27, cancelled: 1 },
  { date: '2026-10-29', count: 35, created: 37, completed: 33, cancelled: 2 },
  { date: '2026-10-30', count: 42, created: 45, completed: 40, cancelled: 2 },
  { date: '2026-10-31', count: 39, created: 41, completed: 38, cancelled: 1 },
  { date: '2026-11-01', count: 25, created: 27, completed: 24, cancelled: 1 },
  { date: '2026-11-02', count: 48, created: 50, completed: 46, cancelled: 2 },
  { date: '2026-11-03', count: 52, created: 55, completed: 50, cancelled: 2 },
  { date: '2026-11-04', count: 60, created: 64, completed: 58, cancelled: 2 },
  { date: '2026-11-05', count: 57, created: 60, completed: 55, cancelled: 2 },
  { date: '2026-11-06', count: 64, created: 68, completed: 61, cancelled: 3 },
  { date: '2026-11-07', count: 49, created: 52, completed: 47, cancelled: 2 },
];

let mockCategoryDistribution: CategoryDistributionItem[] = [
  { name: 'Electrical Engineering', count: 420, percentage: 34, revenueCHF: 96600 },
  { name: 'Precision Plumbing', count: 345, percentage: 28, revenueCHF: 75900 },
  { name: 'Carpentry & Millwork', count: 198, percentage: 16, revenueCHF: 49500 },
  { name: 'HVAC & Thermal', count: 136, percentage: 11, revenueCHF: 38080 },
  { name: 'Masonry & Structural', count: 86, percentage: 7, revenueCHF: 20640 },
  { name: 'Industrial Coating', count: 49, percentage: 4, revenueCHF: 9780 },
];

let mockRatingDistribution: RatingDistributionData[] = [
  { stars: 5, count: 972, percentage: 78 },
  { stars: 4, count: 199, percentage: 16 },
  { stars: 3, count: 50, percentage: 4 },
  { stars: 2, count: 15, percentage: 1 },
  { stars: 1, count: 12, percentage: 1 },
];

let mockTopWorkers: TopWorkerItem[] = [
  { workerId: 'w-101', fullName: 'Dieter Ramsen', categoryName: 'Electrical Engineering', completedBookings: 142, rating: 4.9, earningsCHF: 36210, rank: 1 },
  { workerId: 'w-103', fullName: 'Adrian Frutiger', categoryName: 'Precision Plumbing', completedBookings: 210, rating: 4.8, earningsCHF: 49140, rank: 2 },
  { workerId: 'w-106', fullName: 'Emil Ruder', categoryName: 'Industrial Coating', completedBookings: 178, rating: 4.6, earningsCHF: 37380, rank: 3 },
  { workerId: 'w-102', fullName: 'Josef Müller-Brockmann', categoryName: 'Carpentry & Millwork', completedBookings: 96, rating: 5.0, earningsCHF: 26496, rank: 4 },
  { workerId: 'w-104', fullName: 'Armin Hofmann', categoryName: 'HVAC & Thermal', completedBookings: 88, rating: 4.7, earningsCHF: 29040, rank: 5 },
];

let mockAdminUsers: AdminUserItem[] = [
  { id: 'usr-1', email: 'admin@bluecollar.in', fullName: 'Platform Overseer', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-01-15T00:00:00Z', totalBookings: 0 },
  { id: 'usr-2', email: 'dieter.ramsen@trade.ch', fullName: 'Dieter Ramsen', role: 'WORKER', phoneNumber: '+41 44 892 1042', status: 'ACTIVE', createdAt: '2026-02-10T00:00:00Z', totalBookings: 142 },
  { id: 'usr-3', email: 'hans.gugelot@standard.ch', fullName: 'Hans Gugelot', role: 'CUSTOMER', phoneNumber: '+41 79 123 4567', status: 'ACTIVE', createdAt: '2026-03-01T00:00:00Z', totalBookings: 12 },
  { id: 'usr-4', email: 'josef.mb@design.ch', fullName: 'Josef Müller-Brockmann', role: 'WORKER', phoneNumber: '+41 61 743 9911', status: 'ACTIVE', createdAt: '2026-03-12T00:00:00Z', totalBookings: 96 },
  { id: 'usr-5', email: 'max.bill@concrete.ch', fullName: 'Max Bill', role: 'WORKER', phoneNumber: '+41 22 511 8833', status: 'DEACTIVATED', createdAt: '2026-04-05T00:00:00Z', totalBookings: 64 },
  { id: 'usr-6', email: 'karl.gerstner@editorial.ch', fullName: 'Karl Gerstner', role: 'CUSTOMER', phoneNumber: '+41 79 987 6543', status: 'ACTIVE', createdAt: '2026-05-20T00:00:00Z', totalBookings: 8 },
];

let mockReportedReviews: ReportedReviewItem[] = [
  {
    id: 'rev-rep-1',
    workerId: 'w-101',
    workerName: 'Dieter Ramsen',
    customerId: 'cust-99',
    customerName: 'Anonymous Reviewer',
    rating: 1,
    comment: 'Refused to install non-code compliant wiring for cryptocurrency miners.',
    reportedReason: 'Request violated federal electrical safety ordinance; review is retaliatory.',
    reportedAt: '2026-11-05T14:30:00Z',
    active: false,
  },
  {
    id: 'rev-rep-2',
    workerId: 'w-103',
    workerName: 'Adrian Frutiger',
    customerId: 'cust-88',
    customerName: 'R. Meier',
    rating: 2,
    comment: 'Arrived at 08:03 instead of exactly 08:00 CET.',
    reportedReason: 'Excessive tolerance penalty (3 minutes delay due to municipal rail stoppage).',
    reportedAt: '2026-11-06T11:20:00Z',
    active: true,
  }
];

// Helper to determine whether backend is reachable
let isBackendLive: boolean | null = null;

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      isBackendLive = true;
      return true;
    }
  } catch {
    // fallback
  }
  isBackendLive = false;
  return false;
};

export const api = {
  // Health
  isLive: () => isBackendLive ?? false,
  checkLive: checkBackendHealth,

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const json = await res.json();
        setToken(json.data.accessToken);
        return {
          token: json.data.accessToken,
          user: {
            id: json.data.profileId,
            email,
            role: json.data.role,
          }
        };
      }
    } catch {
      // Backend not running -> use fallback
    }

    // Fallback simulation based on email
    let role: UserRole = 'CUSTOMER';
    let profileId = 'cust-1';
    let fullName = 'Hans Gugelot';

    if (email.includes('admin')) {
      role = 'ADMIN';
      profileId = 'admin-1';
      fullName = 'Platform Administrator';
    } else if (email.includes('worker') || email.includes('dieter')) {
      role = 'WORKER';
      profileId = 'w-101';
      fullName = 'Dieter Ramsen';
    }

    const mockToken = `mock-jwt-token-${role.toLowerCase()}-${Date.now()}`;
    setToken(mockToken);
    const userObj = {
      id: profileId,
      email,
      fullName,
      role,
      token: mockToken,
    };
    localStorage.setItem('bluecollar_user', JSON.stringify(userObj));
    return { token: mockToken, user: userObj };
  },

  async registerCustomer(data: { email: string; password: string; fullName: string; phoneNumber: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Customer registered successfully',
      data: { accessToken: 'mock-token', role: 'CUSTOMER', profileId: 'cust-new' }
    };
  },

  async registerWorker(data: { email: string; password: string; fullName: string; phoneNumber: string; categoryId: string; hourlyRate: number; city: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register/worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      success: true,
      message: 'Worker registered successfully',
      data: { accessToken: 'mock-token', role: 'WORKER', profileId: 'w-new' }
    };
  },

  // Categories & Skills
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockCategories;
  },

  // Workers & Search
  async searchWorkers(params: {
    city?: string;
    categoryId?: string;
    minRating?: number;
    maxPrice?: number;
    verified?: boolean;
    available?: boolean;
    sort?: string;
  }): Promise<{ results: WorkerProfile[]; totalElements: number }> {
    try {
      const query = new URLSearchParams();
      if (params.city) query.append('city', params.city);
      if (params.categoryId) query.append('categoryId', params.categoryId);
      if (params.minRating) query.append('minRating', params.minRating.toString());
      if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());
      if (params.verified !== undefined) query.append('verified', params.verified.toString());
      if (params.available !== undefined) query.append('available', params.available.toString());
      if (params.sort) query.append('sort', params.sort);

      const res = await fetch(`${API_BASE}/search/workers?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return {
          results: json.data.results,
          totalElements: json.data.totalElements,
        };
      }
    } catch {
      // fallback
    }

    let filtered = [...mockWorkers];
    if (params.city) {
      filtered = filtered.filter(w => w.primaryCity.toLowerCase().includes(params.city!.toLowerCase()));
    }
    if (params.categoryId) {
      filtered = filtered.filter(w => w.categoryId === params.categoryId);
    }
    if (params.minRating) {
      filtered = filtered.filter(w => w.averageRating >= params.minRating!);
    }
    if (params.maxPrice) {
      filtered = filtered.filter(w => w.hourlyRate <= params.maxPrice!);
    }
    if (params.verified !== undefined) {
      filtered = filtered.filter(w => w.verified === params.verified);
    }
    if (params.available !== undefined) {
      filtered = filtered.filter(w => w.available === params.available);
    }

    return {
      results: filtered,
      totalElements: filtered.length,
    };
  },

  async getWorkerById(id: string): Promise<WorkerProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/workers/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return mockWorkers.find(w => w.id === id) || null;
  },

  // Bookings
  async getMyCustomerBookings(): Promise<Booking[]> {
    try {
      const res = await fetch(`${API_BASE}/bookings/customers/me`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockBookings;
  },

  async getMyWorkerBookings(): Promise<Booking[]> {
    try {
      const res = await fetch(`${API_BASE}/bookings/workers/me`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockBookings.filter(b => b.workerId === 'w-101');
  },

  async createBooking(data: {
    workerId: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    notes?: string;
  }): Promise<Booking> {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const worker = mockWorkers.find(w => w.id === data.workerId);
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      workerId: data.workerId,
      workerName: worker?.fullName || 'Assigned Worker',
      workerCategory: worker?.categoryName || 'Trade Service',
      customerId: 'cust-1',
      customerName: 'Hans Gugelot',
      customerPhone: '+41 79 123 4567',
      status: 'PENDING',
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      addressLine: data.addressLine,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      notes: data.notes,
      estimatedPrice: (worker?.hourlyRate || 80) * 3,
      createdAt: new Date().toISOString(),
    };
    mockBookings = [newBooking, ...mockBookings];
    savePersisted('bluecollar_mock_bookings', mockBookings);
    return newBooking;
  },

  async updateBookingStatus(id: string, action: 'accept' | 'reject' | 'start' | 'complete' | 'cancel', reason?: string): Promise<Booking> {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/${action}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }

    const bookingIndex = mockBookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
      let targetStatus: BookingStatus = 'PENDING';
      if (action === 'accept') targetStatus = 'ACCEPTED';
      if (action === 'reject') targetStatus = 'REJECTED';
      if (action === 'start') targetStatus = 'IN_PROGRESS';
      if (action === 'complete') targetStatus = 'COMPLETED';
      if (action === 'cancel') targetStatus = 'CANCELLED';

      mockBookings[bookingIndex] = {
        ...mockBookings[bookingIndex],
        status: targetStatus,
        cancellationReason: reason,
        completedAt: targetStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      };
      savePersisted('bluecollar_mock_bookings', mockBookings);
      return mockBookings[bookingIndex];
    }
    throw new Error('Booking not found');
  },

  // Reviews
  async getWorkerReviews(workerId: string): Promise<Review[]> {
    try {
      const res = await fetch(`${API_BASE}/reviews/worker/${workerId}`);
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockReviews.filter(r => r.workerId === workerId);
  },

  async getWorkerStats(workerId: string): Promise<ReviewStats> {
    try {
      const res = await fetch(`${API_BASE}/reviews/worker/${workerId}/stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return {
      averageRating: 4.9,
      totalReviews: 38,
      ratingDistribution: { 5: 34, 4: 4, 3: 0, 2: 0, 1: 0 }
    };
  },

  async createReview(data: { bookingId: string; workerId: string; rating: number; comment: string }): Promise<Review> {
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      workerId: data.workerId,
      customerId: 'cust-1',
      customerName: 'Hans Gugelot',
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
      active: true,
      reported: false,
    };
    mockReviews = [newRev, ...mockReviews];
    savePersisted('bluecollar_mock_reviews', mockReviews);
    return newRev;
  },

  // Addresses
  async getMyAddresses(): Promise<Address[]> {
    try {
      const res = await fetch(`${API_BASE}/customers/me/addresses`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return mockAddresses;
  },

  async addAddress(addr: Omit<Address, 'id' | 'customerId' | 'active'>): Promise<Address> {
    try {
      const res = await fetch(`${API_BASE}/customers/me/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addr),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    const newAddr: Address = {
      ...addr,
      id: `addr-${Date.now()}`,
      customerId: 'cust-1',
      active: true,
    };
    mockAddresses.push(newAddr);
    savePersisted('bluecollar_mock_addresses', mockAddresses);
    return newAddr;
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockNotifications;
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
    } catch {
      // fallback
    }
    const notif = mockNotifications.find(n => n.id === id);
    if (notif) notif.read = true;
  },

  // Admin Endpoints
  async getAdminDashboard(): Promise<AdminDashboardMetrics> {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return {
      totalBookings: 1248,
      completedBookings: 1184,
      totalRevenue: 284500.00,
      activeWorkers: 68,
      verifiedWorkers: 59,
      unverifiedWorkers: 9,
      totalCustomers: 830,
      pendingReviews: 3,
      disputeRatePercent: 0.8,
    };
  },

  async getAdminWorkers(): Promise<WorkerProfile[]> {
    return mockWorkers;
  },

  async toggleWorkerVerification(workerId: string, verify: boolean): Promise<void> {
    try {
      const endpoint = verify ? 'verify' : 'unverify';
      await fetch(`${API_BASE}/admin/workers/${workerId}/${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
    } catch {
      // fallback
    }
    const worker = mockWorkers.find(w => w.id === workerId);
    if (worker) {
      worker.verified = verify;
      savePersisted('bluecollar_mock_workers', mockWorkers);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return mockAuditLogs;
  },

  async getDailyBookingStats(from?: string, to?: string): Promise<BookingsTrendItem[]> {
    try {
      const url = from && to 
        ? `${API_BASE}/admin/analytics/bookings/daily?from=${from}&to=${to}`
        : `${API_BASE}/admin/analytics/bookings/daily`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return mockBookingsTrend;
  },

  async getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.categoriesDistribution) {
          const total = json.data.categoriesDistribution.reduce((acc: number, c: any) => acc + c.count, 0) || 1;
          return json.data.categoriesDistribution.map((c: any) => ({
            name: c.name,
            count: c.count,
            percentage: Math.round((c.count / total) * 100),
            revenueCHF: c.count * 220,
          }));
        }
      }
    } catch {
      // fallback
    }
    return mockCategoryDistribution;
  },

  async getRatingDistribution(): Promise<RatingDistributionData[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/ratings`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.distribution) {
          const total = json.data.totalReviews || 1;
          return [5, 4, 3, 2, 1].map((stars) => {
            const count = json.data.distribution[stars] || 0;
            return {
              stars,
              count,
              percentage: Math.round((count / total) * 100),
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return mockRatingDistribution;
  },

  async getTopWorkers(limit: number = 5): Promise<TopWorkerItem[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/workers/top?limit=${limit}`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    return mockTopWorkers.slice(0, limit);
  },

  async getAdminUsers(): Promise<AdminUserItem[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockAdminUsers;
  },

  async toggleUserStatus(userId: string, newStatus: 'ACTIVE' | 'DEACTIVATED'): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // fallback
    }
    const usr = mockAdminUsers.find(u => u.id === userId);
    if (usr) usr.status = newStatus;
  },

  async getReportedReviews(): Promise<ReportedReviewItem[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/reviews?reported=true`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data.content || json.data;
      }
    } catch {
      // fallback
    }
    return mockReportedReviews;
  },

  async moderateReview(reviewId: string, action: 'activate' | 'deactivate'): Promise<void> {
    try {
      await fetch(`${API_BASE}/reviews/${reviewId}/${action}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
    } catch {
      // fallback
    }
    const rev = mockReportedReviews.find(r => r.id === reviewId);
    if (rev) rev.active = action === 'activate';
  },

  async refreshAnalyticsSnapshot(): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/analytics/refresh`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // fallback
    }
  },

  async rescheduleBooking(id: string, newStartTime: string, newEndTime: string): Promise<Booking> {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/reschedule`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ newStartTime, newEndTime }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    const idx = mockBookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      mockBookings[idx] = {
        ...mockBookings[idx],
        scheduledStartTime: newStartTime,
        scheduledEndTime: newEndTime,
      };
      savePersisted('bluecollar_mock_bookings', mockBookings);
      return mockBookings[idx];
    }
    throw new Error('Booking not found');
  },

  async markAllNotificationsRead(): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: getHeaders() });
    } catch {
      // fallback
    }
    mockNotifications.forEach(n => n.read = true);
  },

  async addPortfolioItem(workerId: string, item: { title: string; description: string; category: string }): Promise<PortfolioItem> {
    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      title: item.title,
      description: item.description,
      category: item.category,
      completedDate: new Date().toISOString().split('T')[0],
    };
    return newItem;
  }
};
