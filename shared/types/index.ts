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
  createdAt: string;
  updatedAt: string;
}

export interface GroundDTO {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  pricePerHour: number;
  sport: string;
  amenities: string[];
  images: string[];
  ownerId: string;
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
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  ground?: GroundDTO;
  customer?: UserDTO;
}

export interface SlotDTO {
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "07:00"
  isAvailable: boolean;
  price: number;
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
