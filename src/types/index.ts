export type UserRole = 'customer' | 'driver' | 'admin' | 'vendor';

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ServiceType = 'city' | 'airport' | 'outstation' | 'hourly';

export type VehicleType = 'sedan' | 'suv' | 'premium' | 'hatchback';

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
  fare_amount: number;
  driver: any;
  dropoff_address: string;
  pickup_address: string;
  id: string;
  customer_id: string;
  driver_id?: string;
  service_type: ServiceType;
  pickup_location: Location;
  drop_location?: Location;
  scheduled_time?: string;
  status: BookingStatus;
  vehicle_type: VehicleType;
  estimated_fare: number;
  actual_fare?: number;
  distance_km?: number;
  duration_minutes?: number;
  passenger_count: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
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