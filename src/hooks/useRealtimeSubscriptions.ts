import { useEffect, useCallback } from 'react';
import { RealtimeService, BookingUpdateCallback, NotificationCallback } from '../services/supabase/realtime';
import { useAppStore, useUser } from '../stores/appStore';
import { Database } from '../services/supabase/client';
import { User } from '../types';
import { Alert } from 'react-native';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

export const useRealtimeSubscriptions = () => {
  const user = useUser() as User | null;
  const addNotification = useAppStore((state) => state.addNotification);

  // Handle booking status updates
  const handleBookingUpdate = useCallback((booking: Booking) => {
    console.log('Booking status updated:', booking);

    // Show alert for status changes
    const message = RealtimeService.getBookingStatusMessage(booking.status);
    Alert.alert('Booking Update', message);

    // Update local state if needed
    // You can add more logic here to update specific booking in local state
  }, []);

  // Handle new notifications
  const handleNotification = useCallback((notification: Notification) => {
    console.log('New notification received:', notification);

    // Add to local notifications store
    addNotification({
      id: notification.id,
      user_id: notification.user_id ?? '',
      title: notification.title ?? 'Notification',
      message: notification.message ?? '',
      type: 'system', // Default type since DB doesn't have type field
      is_read: notification.read,
      created_at: notification.sent_at,
      data: notification.metadata,
    });

    // Show alert for important notifications
    if (notification.channel === 'booking' || notification.channel === 'system') {
      Alert.alert(notification.title ?? 'Notification', notification.message ?? '');
    }
  }, [addNotification]);

  // Handle new booking requests (for drivers)
  const handleNewBooking = useCallback((booking: Booking) => {
    console.log('New booking request:', booking);

    // Show alert for new booking
    Alert.alert(
      'New Ride Request',
      'New booking request received',
      [
        { text: 'View Details', onPress: () => {
          // Navigate to available rides screen
          // This would need to be implemented based on navigation structure
        }},
        { text: 'Dismiss', style: 'cancel' }
      ]
    );
  }, []);

  // Subscribe to real-time updates when user is authenticated
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to booking updates (only for customer and driver roles)
    let bookingChannel: string | undefined;
    if (user.role === 'customer' || user.role === 'driver') {
      bookingChannel = RealtimeService.subscribeToBookingUpdates(
        user.id,
        user.role,
        handleBookingUpdate
      );
    }

    // Subscribe to notifications
    const notificationChannel = RealtimeService.subscribeToNotifications(
      user.id,
      handleNotification
    );

    // Subscribe to new bookings if user is a driver
    let newBookingChannel: string | undefined;
    if (user.role === 'driver') {
      newBookingChannel = RealtimeService.subscribeToNewBookings(handleNewBooking);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      if (bookingChannel) {
        RealtimeService.unsubscribeFromBookingUpdates(user.id);
      }
      RealtimeService.unsubscribeFromNotifications();
    };
  }, [user, handleBookingUpdate, handleNotification, handleNewBooking, addNotification]);

  // Return functions for manual subscription management
  return {
    subscribeToBookingUpdates: (userId: string, userRole: 'customer' | 'driver', callback: BookingUpdateCallback) => {
      return RealtimeService.subscribeToBookingUpdates(userId, userRole, callback);
    },

    subscribeToNotifications: (userId: string, callback: NotificationCallback) => {
      return RealtimeService.subscribeToNotifications(userId, callback);
    },

    subscribeToNewBookings: (callback: BookingUpdateCallback) => {
      return RealtimeService.subscribeToNewBookings(callback);
    },

    subscribeToPaymentUpdates: (bookingId: string, callback: (payment: any) => void) => {
      return RealtimeService.subscribeToPaymentUpdates(bookingId, callback);
    },

    unsubscribeAll: () => {
      RealtimeService.unsubscribeAll();
    },

    getBookingStatusMessage: (status: string) => {
      return RealtimeService.getBookingStatusMessage(status as any);
    },

    getNotificationColor: (type: string) => {
      return RealtimeService.getNotificationColor(type);
    },
  };
};