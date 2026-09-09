import { UserRole, BookingStatus, PaymentStatus } from '../constants/index.js';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  walletBalance: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type BookingType = 'SINGLE_TEAM_OF_11' | 'TEAM_OF_11' | 'WHOLE_GROUND' | 'ENTIRE_VENUE';

export type MatchPeriod = 'MORNING' | 'AFTERNOON' | 'DAY_NIGHT' | 'NIGHT';

export interface MatchPeriodPricing {
  wholeGround: number;
  entireVenue: number;
  teamOf11: number;
  individual?: number;
}

export interface MatchPeriodDTO {
  id: MatchPeriod;
  name: string;
  timeRange: string;
  price: number;
  pricing: MatchPeriodPricing;
  teamCoverage: string;
  isAvailable: boolean;
}

export interface MatchPackageDTO {
  id: string;
  name: string;
  price: number;
  description: string;
  facilities: string[];
}

export interface GroundDTO {
  id: string;
  name: string;
  slug?: string;
  description: string;
  location: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  pricePerHour: number;
  pricingLabel?: string;
  pricingRules?: any;
  sport: string;
  amenities: string[];
  images: string[];
  videos?: string[];
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  mapsUrl?: string;
  plusCode?: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface BookingDTO {
  id: string;
  groundId: string;
  customerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  matchPeriod?: string | null;
  bookingType?: BookingType;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  confirmedAt?: string | null;
  confirmedById?: string | null;
  confirmedBy?: UserDTO | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancelledBy?: UserDTO | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  ground?: GroundDTO;
  customer?: UserDTO;
}

export interface AdminBookingStatsDTO {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  totalRevenue: number;
}

export interface SlotDTO {
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "07:00"
  isAvailable: boolean;
  price: number;
  slotType?: string;
  slotLabel?: string;
}

export interface ReviewDTO {
  id: string;
  groundId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WalletTransactionDTO {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}

export interface AdminAnalyticsDTO {
  totalUsers: number;
  totalGrounds: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  popularGrounds: { name: string; bookingsCount: number; revenue: number }[];
}
