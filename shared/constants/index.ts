export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  COACH: 'COACH',
  ORGANIZER: 'ORGANIZER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  VENDOR: 'VENDOR',
  STORE_MANAGER: 'STORE_MANAGER',
  SUPPORT: 'SUPPORT',
  PLAYER: 'PLAYER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const SPORTS = {
  CRICKET: 'Cricket',
  FOOTBALL: 'Football',
  BADMINTON: 'Badminton',
} as const;

export type SportType = typeof SPORTS[keyof typeof SPORTS];

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
