import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Clipboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CustomerStackParamList } from '@/types/navigation';
import { useTheme } from '@/contexts/ThemeContext';

type ThankYouScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'ThankYou'>;
type ThankYouScreenRouteProp = RouteProp<CustomerStackParamList, 'ThankYou'>;

interface ThankYouScreenProps {}

export default function ThankYouScreen({}: ThankYouScreenProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<ThankYouScreenNavigationProp>();
  const route = useRoute<ThankYouScreenRouteProp>();

  // Get booking data from route params
  const bookingData = route.params?.bookingData;

  const handleGoHome = () => {
    navigation.navigate('CustomerTabs', { screen: 'Home' });
  };

  const handleViewBooking = () => {
    navigation.navigate('RideHistory');
  };

  const handleCopyBookingId = async () => {
    if (bookingData?.paymentDetails?.bookingId) {
      await Clipboard.setString(bookingData.paymentDetails.bookingId);
      Alert.alert('Copied!', 'Booking ID copied to clipboard');
    }
  };

  const formatDateTime = (date: Date, time: string) => {
    if (!date) return 'Immediate pickup';
    return `${date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}, ${time}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <MaterialIcons name="check" size={60} color={colors.surface} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Booking Confirmed!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your ride has been successfully booked. Our driver will contact you shortly.
          </Text>

          {/* Booking ID */}
          {bookingData?.paymentDetails?.bookingId && (
            <TouchableOpacity
              style={[styles.bookingIdContainer, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={handleCopyBookingId}
              activeOpacity={0.7}
            >
              <Text style={[styles.bookingIdLabel, { color: colors.primary }]}>Booking ID</Text>
              <View style={styles.bookingIdRow}>
                <Text style={[styles.bookingIdValue, { color: colors.text }]}>{bookingData.paymentDetails.bookingId}</Text>
                <MaterialIcons name="content-copy" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.copyHint, { color: colors.primary }]}>Tap to copy</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Booking Details Card */}
        <View style={[styles.bookingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Booking Details</Text>

          {/* Booking ID in details */}
          {bookingData?.paymentDetails?.bookingId && (
            <View style={styles.detailRow}>
              <MaterialIcons name="confirmation-number" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booking ID</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{bookingData.paymentDetails.bookingId}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialIcons name="local-taxi" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Service</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {bookingData?.serviceType?.charAt(0).toUpperCase() + bookingData?.serviceType?.slice(1)} {bookingData?.tripType}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="drive-eta" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vehicle</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {bookingData?.vehicleType?.charAt(0).toUpperCase() + bookingData?.vehicleType?.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pickup</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{bookingData?.pickupLocation}</Text>
            </View>
          </View>

          {bookingData?.dropoffLocation && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-off" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Drop-off</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{bookingData?.dropoffLocation}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Scheduled Time</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDateTime(bookingData?.scheduledDate, bookingData?.scheduledTime)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="people" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Passengers</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{bookingData?.passengers}</Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={[styles.paymentSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.paymentTitle, { color: colors.text }]}>Payment Information</Text>

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
              <Text style={[styles.paymentValue, { color: colors.text }]}>₹{bookingData?.paymentDetails?.amount || 0}</Text>
            </View>

            {bookingData?.paymentDetails?.remainingAmount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Remaining Amount</Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>₹{bookingData?.paymentDetails?.remainingAmount}</Text>
              </View>
            )}

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Type</Text>
              <Text style={[styles.paymentValue, { color: colors.text }]}>
                {bookingData?.paymentDetails?.paymentType === 'full' ? 'Full Payment' : 'Partial Payment (25%)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions Card */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>What's Next?</Text>

          <View style={styles.instructionItem}>
            <MaterialIcons name="phone" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Our driver will call you 15 minutes before pickup
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <MaterialIcons name="track-changes" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Track your ride in real-time from the app
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <MaterialIcons name="star" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Rate and review your ride after completion
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleGoHome}
          >
            <MaterialIcons name="home" size={20} color={colors.surface} />
            <Text style={[styles.primaryButtonText, { color: colors.surface }]}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={handleViewBooking}
          >
            <MaterialIcons name="receipt" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>View Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bookingIdContainer: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyHint: {
    fontSize: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  bookingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});