import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// Import services and stores
import { supabase } from '../../services/supabase/client';
import { useUser } from '../../stores/appStore';

// Import types
import { Booking } from '../../types';
import { CustomerTabParamList, CustomerStackParamList } from '../../types/navigation';

// Import theme
import { useTheme } from '../../contexts/ThemeContext';

const RideHistoryScreen = ({ navigation }: { navigation: CompositeNavigationProp<BottomTabNavigationProp<CustomerTabParamList>, StackNavigationProp<CustomerStackParamList>> }) => {
  const { colors } = useTheme();
  const user = useUser();

  // Dynamic styles that use theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: 16,
      backgroundColor: colors.background,
    },
    bookingCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      marginRight: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    paymentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    locationContainer: {
      marginBottom: 16,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    locationLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    locationText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 8,
    },
    detailsContainer: {
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    detailText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tripId: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.error + '20',
      borderRadius: 6,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    cancelButtonText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '500',
    },
    rateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      marginRight: 8,
    },
    rateButtonText: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
    detailsButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
    },
    detailsButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.background,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    bookButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    bookButtonText: {
      color: colors.surface,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modal,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      width: '100%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      padding: 12,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 24,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    modalButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginLeft: 8,
    },
    cancelModalButton: {
      backgroundColor: colors.surface,
    },
    cancelModalButtonText: {
      color: colors.textSecondary,
      fontWeight: '500',
    },
    confirmCancelButton: {
      backgroundColor: colors.error,
    },
    confirmCancelButtonText: {
      color: colors.surface,
      fontWeight: '500',
    },
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'started' | 'cancelled' | 'completed'>('pending');

  useEffect(() => {
    if (user) {
      fetchTripHistory();
    }
  }, [user]);

  const fetchTripHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const bookingsWithDrivers = await Promise.all(
        (data || []).map(async (booking) => {
          if (booking.driver_id) {
            const { data: driverData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', booking.driver_id)
              .single();
            
            return {
              ...booking,
              driver: {
                user: driverData
              }
            };
          }
          return booking;
        })
      );
      
      setBookings(bookingsWithDrivers);
    } catch (error) {
      console.error('Error fetching trip history:', error);
      Toast.show({ type: 'error', text1: 'Failed to load trip history' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId || !cancelReason.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a cancellation reason' });
      return;
    }

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancelReason.trim()
        })
        .eq('id', cancelBookingId);

      if (bookingError) throw bookingError;

      const { error: cancellationError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: cancelBookingId,
          user_id: user?.id,
          reason: cancelReason.trim()
        });

      if (cancellationError) throw cancellationError;

      Toast.show({ type: 'success', text1: 'Booking cancelled successfully' });
      setCancelDialogOpen(false);
      setCancelBookingId(null);
      setCancelReason('');
      fetchTripHistory();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Toast.show({ type: 'error', text1: 'Failed to cancel booking' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: colors.success + '20', color: colors.success, borderColor: colors.success + '50' };
      case 'cancelled':
        return { backgroundColor: colors.error + '20', color: colors.error, borderColor: colors.error + '50' };
      case 'pending':
        return { backgroundColor: colors.warning + '20', color: colors.warning, borderColor: colors.warning + '50' };
      case 'accepted':
        return { backgroundColor: colors.primary + '20', color: colors.primary, borderColor: colors.primary + '50' };
      case 'started':
        return { backgroundColor: colors.info + '20', color: colors.info, borderColor: colors.info + '50' };
      default:
        return { backgroundColor: colors.textMuted + '20', color: colors.textMuted, borderColor: colors.textMuted + '50' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRateTrip = (booking: Booking) => {
    if (!booking.driver_id || !booking.driver?.user?.full_name) {
      Toast.show({ type: 'error', text1: 'Driver information not available' });
      return;
    }

    navigation.navigate('ReviewModal', {
      bookingId: booking.id,
      driverId: booking.driver_id,
      driverName: booking.driver.user.full_name || 'Driver'
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripHistory();
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => (booking.status || 'pending') === activeTab);
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, getStatusColor(item.status || 'pending')]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status || 'pending').color }]}>
              {item.status || 'Pending'}
            </Text>
          </View>
          {/* <View style={[styles.paymentBadge, { borderColor: colors.border }]}>
            <Text style={[styles.paymentText, { color: colors.textSecondary }]}>{item.payment_status}</Text>
          </View> */}
        </View>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={14} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={colors.success} />
          <View>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{item.pickup_address || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={colors.error} />
          <View>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText}>{item.dropoff_address || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialIcons name="directions-car" size={14} color={colors.primary} />
          <Text style={styles.detailText}>{item.vehicle_type || 'Standard'}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="payment" size={14} color={((item.payment_status || 'pending') === 'paid' || (item.payment_status || 'pending') === 'completed') ? colors.success : colors.warning} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {((item.payment_status || 'pending') === 'paid' || (item.payment_status || 'pending') === 'completed') ? 'Paid' : 'Pending'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={14} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>₹{item.fare_amount || '0'}</Text>
        </View>
        {item.started_at && item.completed_at && (
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={14} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / (1000 * 60))} mins
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.tripId}>Trip ID: {item.id.slice(0, 8)}...</Text>
        <View style={styles.actionButtons}>
          {((item.status || 'pending') === 'pending' || (item.status || 'pending') === 'accepted') && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setCancelBookingId(item.id);
                setCancelDialogOpen(true);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {(item.status || 'pending') === 'completed' && item.driver_id && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleRateTrip(item)}
            >
              <MaterialIcons name="star" size={14} color={colors.warning} />
              <Text style={styles.rateButtonText}>Rate Trip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('TripDetails', { bookingId: item.id })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trip History</Text>
          <Text style={styles.headerSubtitle}>View all your past and current bookings</Text>
        </View>
        <View style={styles.tabsContainer}>
          {(['pending', 'accepted', 'started', 'cancelled', 'completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trip History</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>View all your past and current bookings</Text>
      </View> */}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['pending', 'accepted', 'started', 'cancelled', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {getFilteredBookings().length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="directions-car" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No {activeTab} trips</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'pending' ? 'You have no pending bookings' :
             activeTab === 'accepted' ? 'You have no accepted bookings' :
             activeTab === 'started' ? 'You have no started trips' :
             activeTab === 'cancelled' ? 'You have no cancelled bookings' :
             'You have no completed trips yet'}
          </Text>
          {activeTab === 'pending' && (
            <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('BookRide')}>
              <Text style={styles.bookButtonText}>Book a Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={getFilteredBookings()}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelDialogOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to cancel this booking? Please provide a reason for cancellation.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Please provide a reason for cancellation..."
              placeholderTextColor={colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline={true}
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setCancelReason('');
                  setCancelBookingId(null);
                  setCancelDialogOpen(false);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmCancelButton]}
                onPress={handleCancelBooking}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RideHistoryScreen;