export type UserRole = 'customer' | 'driver' | 'admin' | 'vendor';

export type BookingStatus = 'pending' | 'accepted' | 'started' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ServiceType = 'city' | 'airport' | 'outstation' | 'hourly';

export type VehicleType = 'sedan' | 'suv' | 'premium' | 'hatchback';

export interface BookingDriver {
  id: string;
  vehicle_model?: string;
  license_plate?: string;
  rating?: number;
  user: {
    full_name: string;
    phone_no: string;
  };
}

export interface User {
  id: string;
  email: string | null;
  phone_no?: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  status?: 'active' | 'blocked' | 'suspended';
  blocked_at?: string | null;
  blocked_by?: string | null;
  block_reason?: string | null;
  deleted_at?: string | null;
  last_login_at?: string | null;
  profile_picture_url?: string | null;
  whatsapp_phone?: string | null;
  phone_verified?: boolean;
  phone_verification_completed_at?: string | null;
}

export interface Customer extends User {
  role: 'customer';
  preferred_payment_method?: string;
  total_rides?: number;
  rating?: number;
}

export interface Driver extends User {
  role: 'driver';
  license_number: string;
  vehicle_id?: string;
  is_online: boolean;
  current_location?: Location;
  rating?: number;
  total_rides?: number;
  earnings?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  type: VehicleType;
  model: string;
  license_plate: string;
  color: string;
  year: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  vehicle_id: string | undefined;
  waiting_time_minutes?: number;
  payment_status: string | undefined;
  fare_amount: number;
  driver?: BookingDriver | null;
  dropoff_address: string;
  pickup_address: string;
  id: string;
  customer_id: string;
  driver_id?: string;
  service_type: ServiceType;
  ride_type?: string;
  pickup_location: Location;
  drop_location?: Location;
  scheduled_time?: string;
  status: BookingStatus;
  vehicle_type: VehicleType;
  vehicle?: Vehicle | null;
  estimated_fare: number;
  actual_fare?: number;
  distance_km?: number;
  distance?: number;
  duration_minutes?: number;
  passenger_count: number;
  passengers?: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  trip_type?: string;
  is_round_trip?: boolean;
  cancellation_reason?: string;
  payment?: Payment | null;
  advance_amount?: number;
  payment_method?: string;
  remaining_amount?: number;
  user?: {
    full_name: string;
    phone_no: string;
    profile_picture_url?: string | null;
    email?: string | null;
    whatsapp_phone?: string | null;
  };
  review?: {
    rating: number;
    comment: string;
  } | null;
  requestedAt?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  start_time?: string | null;
  end_time?: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  gateway_response?: any;
  created_at: string;
  updated_at: string;
}

export interface RideHistory {
  id: string;
  booking: Booking;
  driver?: Driver;
  vehicle?: Vehicle;
  payment?: Payment;
  rating?: number;
  review?: string;
}

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system' | 'promotion';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentBooking: Booking | null;
  notifications: NotificationData[];
  location: Location | null;
  isOnline: boolean;
  isDarkMode: boolean;
}

export interface BookingFormData {
  service_type: ServiceType;
  pickup_location: Location;
  drop_location?: Location;
  scheduled_time?: Date;
  vehicle_type: VehicleType;
  passenger_count: number;
  special_instructions?: string;
}

export interface FareCalculation {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  total_fare: number;
  estimated_duration: number;
  estimated_distance: number;
}

// Settings and Preferences Types
export interface UserPreferences {
  user_id: string;
  dark_mode: boolean;
  notification_enabled: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: TransactionType;
  amount: number;
  description: string;
  reference_id?: string;
  status: TransactionStatus;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  total_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  total_rides: number;
  average_rating: number;
  commission_rate: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType = 'license' | 'insurance' | 'registration' | 'photo' | 'vehicle_photo';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DocumentType;
  document_url: string;
  status: DocumentStatus;
  expiry_date?: string;
  rejection_reason?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleExtended extends Vehicle {
  make: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  last_service_date?: string;
  next_service_due?: string;
}

// Settings Screen State Types
export interface SettingsScreenState {
  user: User | null;
  driver: Driver | null;
  userPreferences: UserPreferences | null;
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  vehicle: VehicleExtended | null;
  earnings: DriverEarnings | null;
  documents: DriverDocument[];
  loading: boolean;
  arePushNotificationsEnabled: boolean;
  isSoundEnabled: boolean;
  isLocationSharingEnabled: boolean;
  isDarkModeEnabled: boolean;
}

export enum SettingType {
  darkMode = 'darkMode',
  pushNotifications = 'pushNotifications',
  sound = 'sound',
  locationSharing = 'locationSharing'
}

export enum PaymentMethodType {
  visa = 'visa',
  mastercard = 'mastercard',
  paypal = 'paypal',
  upi = 'upi',
  cash = 'cash'
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  lastFourDigits?: string;
  expiryDate?: string;
  accountName?: string;
  upiId?: string;
  isDefault: boolean;
}

export interface HelpTopicData {
  title: string;
  description?: string;
  category?: string;
}

export interface FAQItemData {
  title: string;
  answer: string;
  category?: string;
}