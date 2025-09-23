import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Database } from './client';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Booking['status'];

export interface BookingUpdateCallback {
  (booking: Booking): void;
}

export interface NotificationCallback {
  (notification: Database['public']['Tables']['notifications']['Row']): void;
}

export class RealtimeService {
  private static bookingChannels: Map<string, RealtimeChannel> = new Map();
  private static notificationChannel: RealtimeChannel | null = null;

  /**
   * Subscribe to booking status updates for a specific user
   */
  static subscribeToBookingUpdates(
    userId: string,
    userRole: 'customer' | 'driver',
    callback: BookingUpdateCallback
  ): string {
    const channelName = `booking_updates_${userId}`;

    // Remove existing subscription if any
    this.unsubscribeFromBookingUpdates(userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: userRole === 'customer'
            ? `customer_id=eq.${userId}`
            : `driver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Booking update received:', payload);
          if (payload.new) {
            callback(payload.new as Booking);
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Booking subscription status for ${userId}:`, status);
        if (err) {
          console.error('Booking subscription error:', err);
        }
      });

    this.bookingChannels.set(userId, channel);
    return channelName;
  }

  /**
   * Subscribe to notifications for a specific user
   */
  static subscribeToNotifications(
    userId: string,
    callback: NotificationCallback
  ): string {
    const channelName = `notifications_${userId}`;

    // Remove existing subscription if any
    this.unsubscribeFromNotifications();

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification received:', payload);
          if (payload.new) {
            callback(payload.new as Database['public']['Tables']['notifications']['Row']);
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Notification subscription status for ${userId}:`, status);
        if (err) {
          console.error('Notification subscription error:', err);
        }
      });

    this.notificationChannel = channel;
    return channelName;
  }

  /**
   * Subscribe to new booking requests (for drivers)
   */
  static subscribeToNewBookings(
    callback: BookingUpdateCallback
  ): string {
    const channelName = 'new_bookings';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('New booking received:', payload);
          if (payload.new) {
            callback(payload.new as Booking);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('New bookings subscription status:', status);
        if (err) {
          console.error('New bookings subscription error:', err);
        }
      });

    return channelName;
  }

  /**
   * Subscribe to payment status updates
   */
  static subscribeToPaymentUpdates(
    bookingId: string,
    callback: (payment: Database['public']['Tables']['payments']['Row']) => void
  ): string {
    const channelName = `payment_updates_${bookingId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('Payment update received:', payload);
          if (payload.new) {
            callback(payload.new as Database['public']['Tables']['payments']['Row']);
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`Payment subscription status for ${bookingId}:`, status);
        if (err) {
          console.error('Payment subscription error:', err);
        }
      });

    return channelName;
  }

  /**
   * Unsubscribe from booking updates for a specific user
   */
  static unsubscribeFromBookingUpdates(userId: string): void {
    const channel = this.bookingChannels.get(userId);
    if (channel) {
      supabase.removeChannel(channel);
      this.bookingChannels.delete(userId);
      console.log(`Unsubscribed from booking updates for ${userId}`);
    }
  }

  /**
   * Unsubscribe from notifications
   */
  static unsubscribeFromNotifications(): void {
    if (this.notificationChannel) {
      supabase.removeChannel(this.notificationChannel);
      this.notificationChannel = null;
      console.log('Unsubscribed from notifications');
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    // Unsubscribe from all booking channels
    for (const [userId, channel] of this.bookingChannels) {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from booking updates for ${userId}`);
    }
    this.bookingChannels.clear();

    // Unsubscribe from notifications
    if (this.notificationChannel) {
      supabase.removeChannel(this.notificationChannel);
      this.notificationChannel = null;
      console.log('Unsubscribed from notifications');
    }
  }

  /**
   * Get booking status change message
   */
  static getBookingStatusMessage(status: BookingStatus): string {
    switch (status) {
      case 'pending':
        return 'Your booking request has been submitted';
      case 'accepted':
        return 'Driver has accepted your booking';
      case 'in_progress':
        return 'Your ride is in progress';
      case 'completed':
        return 'Your ride has been completed';
      case 'cancelled':
        return 'Your booking has been cancelled';
      default:
        return 'Booking status updated';
    }
  }

  /**
   * Get notification type color
   */
  static getNotificationColor(type: string): string {
    switch (type) {
      case 'booking':
        return '#2563eb'; // blue
      case 'payment':
        return '#16a34a'; // green
      case 'system':
        return '#ca8a04'; // yellow
      case 'promotion':
        return '#dc2626'; // red
      default:
        return '#6b7280'; // gray
    }
  }
}