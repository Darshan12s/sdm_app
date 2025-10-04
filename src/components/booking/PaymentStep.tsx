import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RazorpayExpoService, PaymentData } from '@/services/payment/razorpay-expo';
import { supabase } from '@/services/supabase/client';
import { useFareCalculation } from '@/hooks/useFareCalculation';
import { RazorpaySDKService } from '@/services/payment/razorpay-sdk';
import { RazorpayService } from '@/services/payment/razorpay';
import { CustomerStackParamList } from '@/types/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { PaymentModal } from '../PaymentModal';

interface PaymentStepProps {
  bookingData: any;
  onPaymentSuccess: (paymentDetails: any) => void;
  onBack: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  bookingData,
  onPaymentSuccess,
  onBack,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<CustomerStackParamList>>();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentAmount, setPaymentAmount] = useState<'partial' | 'full'>('partial');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState<string | null>(null);
  const [isSpecialInstructionsExpanded, setIsSpecialInstructionsExpanded] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState(bookingData.additionalInstructions || '');
  const [luggageCount, setLuggageCount] = useState(bookingData.luggageCount || 0);
  const [hasPet, setHasPet] = useState(bookingData.hasPet || false);

  // SDK integration state
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // PaymentModal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [modalOrderId, setModalOrderId] = useState('');


  // Calculate distance and duration from coordinates
  const calculateDistanceAndDuration = () => {
    if (!bookingData.pickupCoords || !bookingData.dropoffCoords) return { distanceKm: 0, durationMinutes: 0 };

    const R = 6371; // Earth's radius in km
    const dLat = (bookingData.dropoffCoords.lat - bookingData.pickupCoords.lat) * Math.PI / 180;
    const dLng = (bookingData.dropoffCoords.lng - bookingData.pickupCoords.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(bookingData.pickupCoords.lat * Math.PI / 180) * Math.cos(bookingData.dropoffCoords.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate duration (rough calculation: 30 km/h average speed)
    const durationMinutes = (distanceKm / 30) * 60;

    return { distanceKm, durationMinutes };
  };

  const { distanceKm, durationMinutes } = calculateDistanceAndDuration();

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Not scheduled';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Create scheduled dateTime string for fare calculation
  const scheduledDateTime = bookingData.scheduledDate && bookingData.scheduledTime
    ? `${bookingData.scheduledDate.toISOString().split('T')[0]}T${bookingData.scheduledTime}:00`
    : undefined;

  // Use fare calculation hook
  const fareData = useFareCalculation({
    serviceType: bookingData.serviceType,
    vehicleType: bookingData.vehicleType,
    distanceKm,
    durationMinutes,
    scheduledDateTime,
  });

  // Apply passenger multiplier
  const passengerMultiplier = bookingData.passengers > 4 ? 1.1 : 1;
  const adjustedFare = fareData ? {
    ...fareData,
    totalFare: Math.round(fareData.totalFare * passengerMultiplier),
    passengerSurcharge: passengerMultiplier > 1 ? Math.round(fareData.totalFare * (passengerMultiplier - 1)) : 0
  } : null;

  // Calculate payment amounts
  const estimatedFare = adjustedFare?.totalFare || getEstimatedFare(bookingData.vehicleType);
  const partialPayment = Math.ceil(estimatedFare * 0.25); // 25% advance
  const currentPaymentAmount = paymentAmount === 'full' ? estimatedFare : partialPayment;
  const remainingAmount = paymentAmount === 'full' ? 0 : estimatedFare - partialPayment;

  function getEstimatedFare(vehicleType: string): number {
    switch (vehicleType) {
      case 'sedan':
        return 3346;
      case 'suv':
        return 4065;
      case 'premium':
        return 5542;
      default:
        return 3346;
    }
  }

  const toggleSpecialInstructions = () => {
    setIsSpecialInstructionsExpanded(!isSpecialInstructionsExpanded);
  };

  const updateSpecialInstructions = () => {
    // If special instructions section is hidden, clear the instructions
    if (!isSpecialInstructionsExpanded) {
      setSpecialInstructions("");
      return "";
    }

    const parts = [];

    if (luggageCount > 0) {
      parts.push(`${luggageCount} luggage item${luggageCount !== 1 ? 's' : ''}`);
    }

    if (hasPet) {
      parts.push("Traveling with pet");
    }

    if (specialInstructions.trim()) {
      parts.push(specialInstructions.trim());
    }

    const combined = parts.join(", ");
    setSpecialInstructions(combined);
    return combined;
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: 'smartphone',
      description: 'PhonePe, GooglePay, Paytm',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      description: 'Visa, Mastercard, RuPay',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: 'account-balance-wallet',
      description: 'Paytm, Mobikwik, Amazon Pay',
    },
  ];

  const proceedWithMockPayment = async () => {
    console.log('💳 Proceeding with mock payment...');
    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Authentication Error', 'Please login to continue booking.');
        setIsProcessing(false);
        return;
      }

      // Create booking with mock payment
      const bookingPayload = {
        user_id: user.id,
        pickup_address: bookingData.pickupLocation,
        dropoff_address: bookingData.dropoffLocation,
        pickup_latitude: bookingData.pickupCoords?.lat,
        pickup_longitude: bookingData.pickupCoords?.lng,
        dropoff_latitude: bookingData.dropoffCoords?.lat,
        dropoff_longitude: bookingData.dropoffCoords?.lng,
        fare_amount: estimatedFare,
        status: 'pending',
        payment_status: 'pending',
        scheduled_time: bookingData.scheduledDate ?
          new Date(`${bookingData.scheduledDate.toISOString().split('T')[0]}T${bookingData.scheduledTime}:00`).toISOString() : null,
        service_type: bookingData.serviceType,
        is_scheduled: bookingData.scheduledDate ? true : false,
        is_round_trip: bookingData.isRoundTrip || false,
        vehicle_type: bookingData.vehicleType,
        passengers: bookingData.passengers || 1,
        advance_amount: currentPaymentAmount,
        remaining_amount: remainingAmount,
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        Alert.alert('Booking Error', 'Failed to create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Mock booking created:', booking.id);

      // Mock payment success
      const mockPaymentId = `mock_pay_${Date.now()}`;
      const mockOrderId = `mock_order_${Date.now()}`;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentAmount === 'full' ? 'completed' : 'pending',
          status: 'pending',
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Booking update error:', updateError);
      }

      // Call success handler
      onPaymentSuccess({
        bookingId: booking.id,
        paymentId: mockPaymentId,
        orderId: mockOrderId,
        amount: currentPaymentAmount,
        paymentType: paymentAmount,
        remainingAmount: remainingAmount,
      });

      Alert.alert(
        'Test Payment Successful!',
        `Mock payment completed. ${paymentAmount === 'partial' ? `Remaining amount: ₹${remainingAmount}` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Mock payment error:', error);
      Alert.alert('Error', 'Mock payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentModalSuccess = async (paymentId: string, orderId: string) => {
    console.log('✅ Web payment success:', { paymentId, orderId });
    setShowPaymentModal(false);
    setPaymentUrl('');
    setModalOrderId('');

    // Process successful payment and navigate to ThankYou screen
    try {
      // Update booking status to paid
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: paymentAmount === 'full' ? 'paid' : 'pending',
          status: 'confirmed',
        })
        .eq('payment_id', paymentId);

      if (updateError) {
        console.error('❌ Booking update error:', updateError);
      }

      // Navigate to ThankYou screen
      navigation.navigate('ThankYou', {
        bookingData: {
          ...bookingData,
          paymentDetails: {
            paymentId,
            orderId,
            amount: currentPaymentAmount,
            paymentType: paymentAmount,
            remainingAmount: remainingAmount,
          },
        }
      });
    } catch (error) {
      console.error('❌ Error processing payment success:', error);
      Alert.alert('Error', 'Payment successful but there was an error processing your booking. Please contact support.');
    }
  };

  const handlePaymentModalFailure = (error: string) => {
    console.log('❌ Web payment failed:', error);
    Alert.alert(
      'Payment Failed',
      `Payment failed: ${error}`,
      [
        {
          text: 'Try Again',
          onPress: () => {
            // Retry with same payment URL
            if (paymentUrl) {
              setShowPaymentModal(true);
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setShowPaymentModal(false);
            setPaymentUrl('');
            setModalOrderId('');
          }
        }
      ]
    );
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentUrl('');
    setModalOrderId('');
  };

  const handlePayment = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms and Conditions to proceed.');
      return;
    }

    // Test SDK integration first (but don't block if it fails)
    console.log('🧪 Testing Razorpay SDK integration...');
    const sdkTest = await RazorpaySDKService.testSDKIntegration();
    if (!sdkTest.success) {
      console.warn('SDK test failed, will use fallback payment method:', sdkTest.message);
      // Don't show alert or return - continue with fallback
    } else {
      console.log('✅ SDK test passed, using native payment');
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Authentication Error', 'Please login to continue booking.');
        setIsProcessing(false);
        return;
      }

      // Get service type ID with mapping
      const serviceTypeMapping: Record<string, string> = {
        'ride_later': 'ride_later',
        'airport': 'airport_transfer',
        'outstation': 'outstation',
        'car_rental': 'car_rental'
      };

      const mappedServiceType = serviceTypeMapping[bookingData.serviceType] || bookingData.serviceType;

      const { data: serviceType, error: serviceTypeError } = await supabase
        .from('service_types')
        .select('id')
        .eq('name', mappedServiceType)
        .maybeSingle();

      if (serviceTypeError) {
        console.warn('Service type fetch error:', serviceTypeError);
      }

      // Combine special instructions before creating booking
      const combinedSpecialInstructions = updateSpecialInstructions();

      // Create booking in database first
      const bookingPayload = {
        user_id: user.id,
        pickup_address: bookingData.pickupLocation,
        dropoff_address: bookingData.dropoffLocation,
        pickup_latitude: bookingData.pickupCoords?.lat,
        pickup_longitude: bookingData.pickupCoords?.lng,
        dropoff_latitude: bookingData.dropoffCoords?.lat,
        dropoff_longitude: bookingData.dropoffCoords?.lng,
        fare_amount: estimatedFare,
        status: 'pending',
        payment_status: 'pending',
        scheduled_time: bookingData.scheduledDate ?
          new Date(`${bookingData.scheduledDate.toISOString().split('T')[0]}T${bookingData.scheduledTime}:00`).toISOString() : null,
        service_type_id: serviceType?.id || null,
        service_type: bookingData.serviceType,
        is_scheduled: bookingData.scheduledDate ? true : false,
        is_round_trip: bookingData.isRoundTrip || false,
        return_scheduled_time: bookingData.returnDate && bookingData.returnTime ?
          new Date(`${bookingData.returnDate.toISOString().split('T')[0]}T${bookingData.returnTime}:00`).toISOString() : null,
        trip_type: bookingData.tripType,
        vehicle_type: bookingData.vehicleType,
        passengers: bookingData.passengers || 1,
        special_instructions: combinedSpecialInstructions,
        advance_amount: currentPaymentAmount,
        remaining_amount: remainingAmount,
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        Alert.alert('Booking Error', 'Failed to create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Booking created:', booking.id);

      // Create payment order with fallback
      console.log('📝 Creating payment order...');
      let orderData;

      try {
        orderData = await RazorpaySDKService.createOrder(
          bookingData,
          RazorpaySDKService.formatAmount(currentPaymentAmount),
          paymentMethod
        );
        console.log('✅ SDK order creation successful');
      } catch (sdkOrderError: any) {
        console.warn('⚠️ SDK order creation failed, this is expected if SDK is not configured:', sdkOrderError.message);
        // For fallback, we'll create a mock order or use the main service
        orderData = {
          order_id: `fallback_order_${Date.now()}`,
          amount: currentPaymentAmount
        };
        console.log('📝 Using fallback order for payment');
      }

      if (!orderData) {
        Alert.alert('Payment Error', 'Failed to create payment order. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Order created:', orderData.order_id);

      const userInfo = await supabase.from('users').select('*').eq('id', user.id).single();
      // Prepare payment details
      const customerName = userInfo.data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
      const customerEmail = userInfo.data.email || user.email || '';
      const customerPhone = userInfo.data.phone_no || user.phone || user;
      const description = `${bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)} - ${bookingData.serviceType.charAt(0).toUpperCase() + bookingData.serviceType.slice(1)} Ride`;

      console.log('💳 Initiating payment...');

      // Initiate payment with SDK fallback to main service
      let paymentResult;

      try {
        console.log('💳 Trying Razorpay SDK payment...');
        paymentResult = await RazorpaySDKService.initiatePayment(
          orderData.amount,
          'INR',
          orderData.order_id,
          customerName,
          customerEmail,
          customerPhone,
          description,
          {
            primary: colors.primary,
            background: colors.background,
            surface: colors.surface,
            text: colors.text,
          }
        );
        console.log('✅ SDK payment successful');
      } catch (sdkPaymentError: any) {
        console.warn('⚠️ SDK payment failed, falling back to main service:', sdkPaymentError.message);

        // Fallback to main Razorpay service
        const paymentData = {
          amount: orderData.amount,
          currency: 'INR',
          bookingId: booking.id,
          customerId: user.id,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          description: description,
        };

        paymentResult = await RazorpayService.initiatePayment(paymentData);
        console.log('✅ Fallback payment result:', paymentResult);

        // If main service also fails, try web-based payment modal
        if (!paymentResult.success) {
          setIsProcessing(false);
          return;
        }
      }

      setIsProcessing(false);

      if (paymentResult.success) {
        console.log('✅ Payment successful:', paymentResult);
        setPaymentStatus('success');

        // Update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: paymentAmount === 'full' ? 'paid' : 'pending',
            status: 'pending',
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error('❌ Booking update error:', updateError);
          Alert.alert('Error', 'Payment successful but booking update failed. Please contact support.');
          return;
        }

        console.log('✅ Booking updated successfully');

        // Prepare booking data for ThankYou screen
        const completeBookingData = {
          ...bookingData,
          paymentDetails: {
            bookingId: booking.id,
            paymentId: paymentResult.paymentId,
            orderId: paymentResult.orderId,
            amount: currentPaymentAmount,
            paymentType: paymentAmount,
            remainingAmount: remainingAmount,
          },
        };

        // Navigate to ThankYou screen (serialize Date objects)
        const serializedBookingData = {
          ...completeBookingData,
          scheduledDate: completeBookingData.scheduledDate?.toISOString(),
          returnDate: completeBookingData.returnDate?.toISOString(),
        };
        navigation.navigate('ThankYou', { bookingData: serializedBookingData });

      } else {
        console.error('❌ Payment failed:', paymentResult.error);
        setPaymentStatus('failed');

        // Handle specific error types
        let errorMessage = 'Payment failed';
        if (paymentResult.error?.code === 'PAYMENT_CANCELLED') {
          errorMessage = 'Payment was cancelled';
          // Stay on PaymentStep screen instead of going back
          Alert.alert('Payment Cancelled', 'You can try again or go back to modify your booking.');
          return;
        } else if (paymentResult.error?.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = paymentResult.error?.message || 'Payment failed';
        }

        Alert.alert('Payment Failed', errorMessage);
      }

    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      setIsProcessing(false);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
    }
  };


  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Secure Payment</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete your payment to confirm your booking</Text>

        {/* Payment Status Indicator */}
        {paymentStatus !== 'idle' && (
          <View style={[styles.statusContainer, { backgroundColor: colors.surface }]}>
            {paymentStatus === 'processing' && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                  Processing payment...
                </Text>
              </View>
            )}
            {paymentStatus === 'success' && (
              <View style={styles.statusRow}>
                <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  Payment successful!
                </Text>
              </View>
            )}
            {paymentStatus === 'failed' && (
              <View style={styles.statusRow}>
                <MaterialIcons name="error" size={16} color="#ff6b6b" />
                <Text style={[styles.statusText, { color: "#ff6b6b" }]}>
                  Payment failed - Please try again
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Trip Summary */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <MaterialIcons name="location-on" size={20} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Trip Summary</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Type</Text>
          <View style={[styles.serviceBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.serviceBadgeText, { color: colors.surface }]}>
              {bookingData.serviceType.charAt(0).toUpperCase() + bookingData.serviceType.slice(1)} {bookingData.tripType}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Vehicle</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
              {bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)}
            </Text>

        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pickup Location</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.pickupLocation}</Text>
        </View>

        {bookingData.serviceType !== 'hourly' && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Drop-off Location</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.dropoffLocation}</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryIconLabel}>
            <MaterialIcons name="event" size={16} color={colors.textSecondary} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Scheduled Time</Text>
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {bookingData.scheduledDate ?
              `${formatDate(bookingData.scheduledDate)}, ${bookingData.scheduledTime}` :
              'Immediate pickup'}
          </Text>
        </View>

        {bookingData.isRoundTrip && bookingData.returnDate && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="event" size={16} color={colors.textSecondary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Return Time</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {`${formatDate(bookingData.returnDate)}, ${bookingData.returnTime}`}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryIconLabel}>
            <MaterialIcons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Passengers</Text>
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.passengers}</Text>
        </View>

        {distanceKm > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="map" size={16} color={colors.textSecondary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Distance</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{distanceKm.toFixed(1)} km</Text>
          </View>
        )}

        {durationMinutes > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{Math.round(durationMinutes)} min</Text>
          </View>
        )}

        <View style={[styles.fareRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.fareLabel, { color: colors.text }]}>Total Fare</Text>
          <Text style={[styles.fareAmount, { color: colors.primary }]}>₹{estimatedFare}</Text>
        </View>

        <View style={styles.fareNote}>
          <MaterialIcons name="info-outline" size={14} color={colors.primary} />
          <Text style={[styles.fareNoteText, { color: colors.textSecondary }]}>
            (Includes driver allowance, toll fee, and other applicable charges)
          </Text>
          <TouchableOpacity
            style={styles.vehiclePriceContainer}
            onPress={() => setShowFareBreakdown(showFareBreakdown === bookingData.vehicleType ? null : bookingData.vehicleType)}
          >
            <MaterialIcons
              name={showFareBreakdown === bookingData.vehicleType ? "expand-less" : "expand-more"}
              size={16}
              color={colors.textSecondary}
              style={styles.expandIcon}
            />
            
            
          </TouchableOpacity>
          
        </View>

        {/* Fare Breakdown */}
        {showFareBreakdown === bookingData.vehicleType && adjustedFare && (
          <View style={[styles.fareBreakdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Base Fare</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{adjustedFare.baseFare}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Distance ({distanceKm.toFixed(1)} km)</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{adjustedFare.distanceFare}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Time ({Math.round(durationMinutes)} min)</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{adjustedFare.timeFare}</Text>
            </View>
            {adjustedFare.surgeMultiplier > 1 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Surge ({adjustedFare.surgeMultiplier}x)</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  ₹{Math.round((adjustedFare.baseFare + adjustedFare.distanceFare + adjustedFare.timeFare) * (adjustedFare.surgeMultiplier - 1))}
                </Text>
              </View>
            )}
            {adjustedFare.passengerSurcharge > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Passenger surcharge ({bookingData.passengers} guests)</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{adjustedFare.passengerSurcharge}</Text>
              </View>
            )}
            <View style={[styles.breakdownRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>₹{adjustedFare.totalFare}</Text>
            </View>
          </View>
        )}
      </View>
      {/* Special Instructions */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.specialInstructionsHeader}
          onPress={toggleSpecialInstructions}
          accessibilityRole="button"
          accessibilityState={{ expanded: isSpecialInstructionsExpanded }}
          accessibilityLabel={`${isSpecialInstructionsExpanded ? 'Collapse' : 'Expand'} special instructions section`}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Special Instructions</Text>
          <View style={styles.expandIcon}>
            <MaterialIcons
              name={isSpecialInstructionsExpanded ? "expand-less" : "expand-more"}
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isSpecialInstructionsExpanded && (
          <View style={styles.specialInstructionsSection}>
            <View style={styles.instructionRow}>
              <Text style={[styles.instructionLabel, { color: colors.text }]}>Luggage Items</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, { backgroundColor: colors.border }]}
                  onPress={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease luggage count"
                >
                  <Text style={[styles.counterButtonText, { color: colors.textSecondary }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: colors.text }]} accessibilityLabel={`Luggage count: ${luggageCount}`}>
                  {luggageCount}
                </Text>
                <TouchableOpacity
                  style={[styles.counterButton, { backgroundColor: colors.border }]}
                  onPress={() => setLuggageCount(Math.min(5, luggageCount + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Increase luggage count"
                >
                  <Text style={[styles.counterButtonText, { color: colors.textSecondary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.instructionRow}>
              <Text style={[styles.instructionLabel, { color: colors.text }]}>Traveling with Pet</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setHasPet(!hasPet)}
                accessibilityRole="button"
                accessibilityState={{ checked: hasPet }}
                accessibilityLabel={`Traveling with pet: ${hasPet ? 'Yes' : 'No'}`}
              >
                <View style={[styles.instructionCheckbox, { borderColor: colors.border }, hasPet && [styles.instructionCheckboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]}>
                  {hasPet && <MaterialIcons name="check" size={16} color={colors.surface} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>{hasPet ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.instructionsInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Any additional requirements or instructions..."
              placeholderTextColor={colors.textSecondary}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Additional instructions text input"
              accessibilityHint="Enter any special requirements or instructions for your ride"
            />
          </View>
        )}
      </View>

      {/* Payment Amount Selection */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Choose Payment Amount</Text>
        <View style={styles.paymentAmountContainer}>
          <TouchableOpacity
            style={[
              styles.paymentAmountOption,
              { borderColor: colors.border },
              paymentAmount === 'partial' && [styles.paymentAmountOptionSelected, { borderColor: colors.primary, backgroundColor: colors.primary }],
            ]}
            onPress={() => setPaymentAmount('partial')}
          >
            <View style={[styles.radioButton, { borderColor: colors.border }]}>
              {paymentAmount === 'partial' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
            <View style={styles.paymentAmountContent}>
              <Text style={[
                styles.paymentAmountTitle,
                { color: paymentAmount === 'partial' ? colors.surface : colors.text }
              ]}>
                Partial Payment (25%)
              </Text>
              <Text style={[
                styles.paymentAmountDescription,
                { color: paymentAmount === 'partial' ? colors.surface : colors.textSecondary }
              ]}>
                Pay remaining after ride
              </Text>
            </View>
            <Text style={[
              styles.paymentAmountValue,
              { color: paymentAmount === 'partial' ? colors.surface : colors.primary }
            ]}>₹{partialPayment}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentAmountOption,
              { borderColor: colors.border },
              paymentAmount === 'full' && [styles.paymentAmountOptionSelected, { borderColor: colors.primary, backgroundColor: colors.primary }],
            ]}
            onPress={() => setPaymentAmount('full')}
          >
            <View style={[styles.radioButton, { borderColor: colors.border }]}>
              {paymentAmount === 'full' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
            <View style={styles.paymentAmountContent}>
              <Text style={[
                styles.paymentAmountTitle,
                { color: paymentAmount === 'full' ? colors.surface : colors.text }
              ]}>
                Full Payment
              </Text>
              <Text style={[
                styles.paymentAmountDescription,
                { color: paymentAmount === 'full' ? colors.surface : colors.textSecondary }
              ]}>
                Pay complete fare now
              </Text>
            </View>
            <Text style={[
              styles.paymentAmountValue,
              { color: paymentAmount === 'full' ? colors.surface : colors.primary }
            ]}>₹{estimatedFare}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.remainingNote, { color: colors.textSecondary }]}>
          Remaining ₹{remainingAmount} will be collected after ride completion
        </Text>
      </View>

      

      {/* Payment Method Selection */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Select Payment Method</Text>
        <View style={styles.paymentMethodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodOption,
                { backgroundColor: colors.surface, borderColor: colors.border },
                paymentMethod === method.id && [styles.paymentMethodOptionSelected, { borderColor: colors.primary, backgroundColor: colors.primary }],
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={[styles.radioButton, { borderColor: colors.border }]}>
                {paymentMethod === method.id && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={styles.paymentMethodIcon}>
                <MaterialIcons
                  name={method.icon as any}
                  size={24}
                  color={paymentMethod === method.id ? colors.surface : colors.text}
                />
              </View>
              <View style={styles.paymentMethodDetails}>
                <Text style={[
                  styles.paymentMethodName,
                  { color: paymentMethod === method.id ? colors.surface : colors.text }
                ]}>
                  {method.name}
                </Text>
                <Text style={[
                  styles.paymentMethodDescription,
                  { color: paymentMethod === method.id ? colors.surface : colors.textSecondary }
                ]}>
                  {method.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Security Note */}
      <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="security" size={16} color={colors.primary} />
        <Text style={[styles.securityText, { color: colors.text }]}>
          Secure Payment by Razorpay
        </Text>
      </View>

      {/* Terms and Conditions */}
      <View style={[styles.termsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }, acceptedTerms && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]}>
            {acceptedTerms && <MaterialIcons name="check" size={16} color={colors.surface} />}
          </View>
          <Text style={[styles.termsText, { color: colors.text }]}>
            I accept the{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]} onPress={() => navigation.navigate('TermsConditions')}>
              Terms and Conditions
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[
          styles.payButton,
          { backgroundColor: colors.primary },
          (!acceptedTerms || isProcessing) && [styles.payButtonDisabled, { backgroundColor: colors.border }],
        ]}
        onPress={handlePayment}
        disabled={!acceptedTerms || isProcessing}
      >
        {isProcessing ? (
          <View style={styles.payButtonContent}>
            <ActivityIndicator color={colors.surface} size="small" />
            <Text style={[styles.payButtonText, { color: colors.surface }]}>
              Processing...
            </Text>
          </View>
        ) : (
          <View style={styles.payButtonContent}>
            <MaterialIcons name="payment" size={20} color={colors.surface} />
            <Text style={[styles.payButtonText, { color: colors.surface }]}>
              Pay ₹{currentPaymentAmount} Now
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onBack}
        disabled={isProcessing}
      >
        <View style={styles.backButtonContent}>
          <MaterialIcons name="arrow-back" size={16} color={colors.textSecondary} />
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>

    {/* Payment Modal for web-based payments */}
    <PaymentModal
      visible={showPaymentModal}
      paymentUrl={paymentUrl}
      orderId={modalOrderId}
      onPaymentSuccess={handlePaymentModalSuccess}
      onPaymentFailure={handlePaymentModalFailure}
      onClose={handlePaymentModalClose}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginBottom:16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fareNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  fareNoteText: {
    fontSize: 12,
    flex: 1,
  },
  paymentAmountContainer: {
    gap: 12,
  },
  paymentAmountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  paymentAmountOptionSelected: {
    // Colors applied inline with theme
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentAmountContent: {
    flex: 1,
  },
  paymentAmountTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  paymentAmountDescription: {
    fontSize: 12,
  },
  remainingNote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentMethodOptionSelected: {
    // Colors applied inline with theme
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 12,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  termsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    // Colors applied inline with theme
  },
  termsText: {
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    fontWeight: '500',
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  payButtonDisabled: {
    // Colors applied inline with theme
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehiclePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandIcon: {
    marginLeft: 4,
  },
  fareBreakdown: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  specialInstructionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  specialInstructionsSection: {
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCheckboxChecked: {
    // Colors applied inline with theme
  },
  checkboxLabel: {
    fontSize: 14,
  },
  instructionsInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
  },
});

export default PaymentStep;