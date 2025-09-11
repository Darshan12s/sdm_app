// API Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
// Use environment variable with fallback to hardcoded key for physical devices
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAejqe2t4TAptcLnkpoFTTNMhm0SFHFJgQ';
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

// App Configuration
export const APP_CONFIG = {
  NAME: 'SDM Cab Hailing',
  VERSION: '1.0.0',
  BUNDLE_ID: 'com.sdm.cabhailing',
  PLAY_STORE_URL: '',
  APP_STORE_URL: '',
};

// Service Types
export const SERVICE_TYPES = {
  CITY: 'city',
  AIRPORT: 'airport',
  OUTSTATION: 'outstation',
  HOURLY: 'hourly',
} as const;

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.CITY]: 'City Ride',
  [SERVICE_TYPES.AIRPORT]: 'Airport Transfer',
  [SERVICE_TYPES.OUTSTATION]: 'Outstation',
  [SERVICE_TYPES.HOURLY]: 'Hourly Rental',
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  PREMIUM: 'premium',
  HATCHBACK: 'hatchback',
} as const;

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.SEDAN]: 'Sedan',
  [VEHICLE_TYPES.SUV]: 'SUV',
  [VEHICLE_TYPES.PREMIUM]: 'Premium',
  [VEHICLE_TYPES.HATCHBACK]: 'Hatchback',
} as const;

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.ACCEPTED]: 'Accepted',
  [BOOKING_STATUS.IN_PROGRESS]: 'In Progress',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Fare Calculation Constants
export const FARE_CONFIG = {
  BASE_FARE: {
    [SERVICE_TYPES.CITY]: 50,
    [SERVICE_TYPES.AIRPORT]: 100,
    [SERVICE_TYPES.OUTSTATION]: 200,
    [SERVICE_TYPES.HOURLY]: 150,
  },
  PER_KM_RATE: {
    [SERVICE_TYPES.CITY]: 12,
    [SERVICE_TYPES.AIRPORT]: 15,
    [SERVICE_TYPES.OUTSTATION]: 18,
    [SERVICE_TYPES.HOURLY]: 20,
  },
  PER_MINUTE_RATE: {
    [SERVICE_TYPES.CITY]: 2,
    [SERVICE_TYPES.AIRPORT]: 2.5,
    [SERVICE_TYPES.OUTSTATION]: 3,
    [SERVICE_TYPES.HOURLY]: 3,
  },
  SURGE_MULTIPLIER: 1.0, // Will be dynamic based on demand
  MINIMUM_FARE: 50,
  MAXIMUM_FARE: 5000,
};

// Location Constants
export const LOCATION_CONFIG = {
  DEFAULT_LATITUDE: 28.6139, // Delhi coordinates
  DEFAULT_LONGITUDE: 77.2090,
  DEFAULT_ZOOM: 12,
  SEARCH_RADIUS_KM: 50,
  UPDATE_INTERVAL_MS: 5000, // 5 seconds
};

// UI Constants
export const UI_CONFIG = {
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    XLARGE: 16,
  },
  SPACING: {
    XS: 4,
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    XLARGE: 32,
    XXLARGE: 48,
  },
  FONT_SIZE: {
    XS: 12,
    SMALL: 14,
    MEDIUM: 16,
    LARGE: 18,
    XLARGE: 20,
    XXLARGE: 24,
    XXXLARGE: 32,
  },
  ICON_SIZE: {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
    XLARGE: 48,
  },
};

// Validation Constants
export const VALIDATION = {
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  LOCATION_PERMISSION_DENIED: 'Location permission is required for the app to work properly.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  BOOKING_FAILED: 'Failed to create booking. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
  LOCATION_NOT_FOUND: 'Unable to determine your location. Please enable location services.',
  NO_DRIVERS_AVAILABLE: 'No drivers available at the moment. Please try again later.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Booking created successfully!',
  PAYMENT_SUCCESSFUL: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  RATING_SUBMITTED: 'Thank you for your feedback!',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  APP_SETTINGS: 'app_settings',
  RECENT_LOCATIONS: 'recent_locations',
  FAVORITE_LOCATIONS: 'favorite_locations',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_ACCEPTED: 'booking_accepted',
  DRIVER_ARRIVED: 'driver_arrived',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
  PAYMENT_RECEIVED: 'payment_received',
  PROMOTION: 'promotion',
} as const;

// API Endpoints (relative to Supabase)
export const API_ENDPOINTS = {
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  USERS: 'users',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  NOTIFICATIONS: 'notifications',
} as const;