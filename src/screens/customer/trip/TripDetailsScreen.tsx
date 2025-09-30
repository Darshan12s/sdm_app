import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

// Import services and stores
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';

// Import types
import { Booking } from '@/types';
import { CustomerTabParamList, CustomerStackParamList } from '@/types/navigation';

// Import theme
import { useTheme } from '../../../contexts/ThemeContext';

type TripDetailsScreenProps = {
  navigation: StackNavigationProp<CustomerStackParamList>;
  route: { params: { bookingId: string } };
};

const TripDetailsScreen: React.FC<TripDetailsScreenProps> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Fetch booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Fetch driver details if available
      let driverDetails = null;
      if (bookingData.driver_id) {
        const { data: driverData, error: driverError } = await supabase
          .from('users')
          .select('full_name, phone_no,profile_picture_url')
          .eq('id', bookingData.driver_id)
          .single();

        if (!driverError && driverData) {
          driverDetails = driverData;
        }
      }

      // Fetch vehicle details if available
      let vehicleDetails = null;
      if (bookingData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('model, license_plate, color')
          .eq('id', bookingData.vehicle_id)
          .single();

        if (!vehicleError && vehicleData) {
          vehicleDetails = vehicleData;
        }
      }

      // Fetch payment details if available
      let paymentDetails = null;
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('transaction_id, razorpay_payment_id, gateway_response, amount_paid')
        .eq('booking_id', bookingId)
        .single();

      if (!paymentError && paymentData) {
        paymentDetails = paymentData;
      }

      // Combine all data
      const completeBookingData = {
        ...bookingData,
        driver: driverDetails ? { user: driverDetails } : null,
        vehicle: vehicleDetails,
        payment: paymentDetails
      };

      setBooking(completeBookingData);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Toast.show({ type: 'error', text1: 'Failed to load trip details' });
    } finally {
      setLoading(false);
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
      case 'started':
        return { backgroundColor: colors.primary + '20', color: colors.primary, borderColor: colors.primary + '50' };
      default:
        return { backgroundColor: colors.textMuted + '20', color: colors.textMuted, borderColor: colors.textMuted + '50' };
    }
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTripDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.round(duration / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const capitalizeText = (text: string): string => {
    if (!text) return 'N/A';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleTrackRide = () => {
    if (booking?.driver_id && booking?.vehicle_id) {
      navigation.navigate('TrackRide', { 
        bookingId: booking.id,
        driverId: booking.driver_id,
        vehicleId: booking.vehicle_id
      });
    } else {
      Toast.show({
        type: 'info',
        text1: 'Tracking not available',
        text2: 'Driver or vehicle information is not available for this trip'
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.detailsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.detailsHeaderTitle, { color: colors.text }]}>Trip Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.detailsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Trip details not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* <View style={[styles.detailsHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.statusBadge, getStatusColor(booking.status)]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status).color }]}>
            {capitalizeText(booking.status)}
          </Text>
        </View>
      </View> */}

      <View style={styles.detailsContent}>
        {/* Trip Information */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trip Information</Text>
          <View style={styles.sectionContent}>
             <Text style={[styles.statusText, { color: getStatusColor(booking.status).color }]}>
            {capitalizeText(booking.status)}
          </Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="local-taxi" size={16} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service Type</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{capitalizeText(booking.service_type) || 'Standard'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="sync-alt" size={16} color={colors.info} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Trip Type</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{(booking.trip_type) || 'One Way'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color={colors.success} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pickup Location</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{booking.pickup_address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color={colors.error} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Drop-off Location</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{booking.dropoff_address}</Text>
              </View>
            </View>

            {booking.distance_km && (
              <View style={styles.infoRow}>
                <MaterialIcons name="straighten" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Distance</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.distance_km} km</Text>
                </View>
              </View>
            )}

            {booking.passengers && (
              <View style={styles.infoRow}>
                <MaterialIcons name="people" size={16} color={colors.info} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Passengers</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.passengers}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={16} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Booking Time</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDateTime(booking.created_at)}</Text>
              </View>
            </View>

            {booking.scheduled_time && (
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={16} color={colors.info} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Scheduled Time</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatDateTime(booking.scheduled_time)}</Text>
                </View>
              </View>
            )}

            {booking.started_at && booking.completed_at && (
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Trip Duration</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {calculateTripDuration(booking.started_at, booking.completed_at)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>


        {/* Vehicle & Driver Information */}
        {booking.driver && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Driver Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Driver Name</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.driver.user?.full_name || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Contact</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.driver.user?.phone_no || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Vehicle Information */}
        {booking.vehicle && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <MaterialIcons name="directions-car" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle Type</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{capitalizeText(booking.vehicle_type) || 'Standard'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="directions-car" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle Model</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.vehicle?.model}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="confirmation-number" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>License Plate</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{booking.vehicle?.license_plate}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <MaterialIcons name="attach-money" size={16} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Fare</Text>
                <Text style={[styles.totalFare, { color: colors.text }]}>₹{booking.fare_amount}</Text>
              </View>
            </View>

            {booking.advance_amount && (
              <View style={styles.infoRow}>
                <MaterialIcons name="payments" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Advance Paid</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>₹{booking.advance_amount}</Text>
                </View>
              </View>
            )}

            {booking.remaining_amount && (
              <View style={styles.infoRow}>
                <MaterialIcons name="money-off" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Remaining Amount</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>₹{booking.remaining_amount}</Text>
                </View>
              </View>
            )}

            {booking.payment?.amount_paid && (
              <View style={styles.infoRow}>
                <MaterialIcons name="payment" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>₹{booking.payment.amount_paid}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="payment" size={16} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Payment Method</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{(booking.payment_method) || 'Not specified'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="info" size={16} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Payment Status</Text>
                <View style={[
                  styles.paymentStatusBadge,
                  booking.payment_status === 'paid' ? { backgroundColor: colors.success + '20', borderColor: colors.success + '50' } :
                  booking.payment_status === 'pending' ? { backgroundColor: colors.warning + '20', borderColor: colors.warning + '50' } :
                  { backgroundColor: colors.error + '20', borderColor: colors.error + '50' }
                ]}>
                  <Text style={[styles.paymentStatusText, {
                    color: booking.payment_status === 'paid' ? colors.success :
                           booking.payment_status === 'pending' ? colors.warning :
                           colors.error
                  }]}>{(booking.payment_status)}</Text>
                </View>
              </View>
            </View>

            {booking.payment?.transaction_id && (
              <View style={styles.infoRow}>
                <MaterialIcons name="receipt" size={16} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                  <Text style={[styles.transactionId, { color: colors.textMuted }]}>{booking.payment.transaction_id}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {booking.special_instructions && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Instructions</Text>
            <View style={[styles.instructionsContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.instructionsText, { color: colors.text }]}>{booking.special_instructions}</Text>
            </View>
          </View>
        )}

        <View style={styles.tripIdContainer}>
          <Text style={[styles.tripIdText, { color: colors.textSecondary }]}>Trip ID: {booking.id}</Text>
        </View>
        {/* Track Ride Button - Only show for active trips */}
        {(booking.status === 'accepted' || booking.status === 'started') && (
          <TouchableOpacity style={[styles.trackButton, { backgroundColor: colors.primary }]} onPress={handleTrackRide}>
            <MaterialIcons name="my-location" size={20} color={colors.surface} />
            <Text style={[styles.trackButtonText, { color: colors.surface }]}>Track Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  detailsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
  detailsContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    width: '40%',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textTransform: 'capitalize',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  totalFare: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidStatus: {
    borderWidth: 1,
  },
  pendingStatus: {
    borderWidth: 1,
  },
  failedStatus: {
    borderWidth: 1,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
  },
  tripIdContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  tripIdText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripDetailsScreen;