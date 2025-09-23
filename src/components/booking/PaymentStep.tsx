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
import { RazorpayExpoService, PaymentData } from '@/services/payment/razorpay-expo';
import { supabase } from '@/services/supabase/client';
import { useFareCalculation } from '@/hooks/useFareCalculation';
import { RazorpaySDKService } from '@/services/payment/razorpay-sdk';

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
          status: 'confirmed',
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

  const handlePayment = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms and Conditions to proceed.');
      return;
    }

    // Test SDK integration first
    console.log('🧪 Testing Razorpay SDK integration...');
    const sdkTest = await RazorpaySDKService.testSDKIntegration();
    if (!sdkTest.success) {
      console.warn('SDK test failed:', sdkTest.message);
      Alert.alert('Payment Setup Issue', sdkTest.message);
      return;
    }

    setIsProcessing(true);

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

      // Create payment order
      console.log('📝 Creating payment order...');
      const orderData = await RazorpaySDKService.createOrder(
        bookingData,
        RazorpaySDKService.formatAmount(currentPaymentAmount),
        paymentMethod
      );

      if (!orderData) {
        Alert.alert('Payment Error', 'Failed to create payment order. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Order created:', orderData.order_id);

      // Prepare payment details
      const customerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
      const customerEmail = user.email || '';
      const customerPhone = user.user_metadata?.phone || '';
      const description = `${bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)} - ${bookingData.serviceType.charAt(0).toUpperCase() + bookingData.serviceType.slice(1)} Ride`;

      console.log('💳 Initiating Razorpay SDK payment...');

      // Initiate payment with SDK
      const paymentResult = await RazorpaySDKService.initiatePayment(
        orderData.amount,
        'INR',
        orderData.order_id,
        customerName,
        customerEmail,
        customerPhone,
        description
      );

      setIsProcessing(false);

      if (paymentResult.success) {
        console.log('✅ Payment successful:', paymentResult);

        // Update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: paymentAmount === 'full' ? 'completed' : 'partial',
            status: 'confirmed',
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error('❌ Booking update error:', updateError);
          Alert.alert('Error', 'Payment successful but booking update failed. Please contact support.');
          return;
        }

        console.log('✅ Booking updated successfully');

        // Call success handler
        onPaymentSuccess({
          bookingId: booking.id,
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId,
          amount: currentPaymentAmount,
          paymentType: paymentAmount,
          remainingAmount: remainingAmount,
        });

        Alert.alert(
          'Payment Successful!',
          `Your booking has been confirmed. ${paymentAmount === 'partial' ? `Remaining amount: ₹${remainingAmount}` : ''}`,
          [{ text: 'OK' }]
        );

      } else {
        console.error('❌ Payment failed:', paymentResult.error);

        // Handle specific error types
        let errorMessage = 'Payment failed';
        if (paymentResult.error?.code === 'PAYMENT_CANCELLED') {
          errorMessage = 'Payment was cancelled';
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Secure Payment</Text>
        <Text style={styles.subtitle}>Complete your payment to confirm your booking</Text>
      </View>

      {/* Trip Summary */}
      <View style={styles.card}>
        <View style={styles.summaryHeader}>
          <MaterialIcons name="location-on" size={20} color="#3ccfa0" />
          <Text style={styles.summaryTitle}>Trip Summary</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Type</Text>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>
              {bookingData.serviceType.charAt(0).toUpperCase() + bookingData.serviceType.slice(1)} {bookingData.tripType}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Vehicle</Text>
          <Text style={styles.summaryValue}>
              {bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1)}
            </Text>
          
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pickup Location</Text>
          <Text style={styles.summaryValue}>{bookingData.pickupLocation}</Text>
        </View>

        {bookingData.serviceType !== 'hourly' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Drop-off Location</Text>
            <Text style={styles.summaryValue}>{bookingData.dropoffLocation}</Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryIconLabel}>
            <MaterialIcons name="event" size={16} color="#64748b" />
            <Text style={styles.summaryLabel}>Scheduled Time</Text>
          </View>
          <Text style={styles.summaryValue}>
            {bookingData.scheduledDate ?
              `${bookingData.scheduledDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}, ${bookingData.scheduledTime}` :
              'Immediate pickup'}
          </Text>
        </View>

        {bookingData.isRoundTrip && bookingData.returnDate && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="event" size={16} color="#64748b" />
              <Text style={styles.summaryLabel}>Return Time</Text>
            </View>
            <Text style={styles.summaryValue}>
              {`${bookingData.returnDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}, ${bookingData.returnTime}`}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryIconLabel}>
            <MaterialIcons name="people" size={16} color="#64748b" />
            <Text style={styles.summaryLabel}>Passengers</Text>
          </View>
          <Text style={styles.summaryValue}>{bookingData.passengers}</Text>
        </View>

        {distanceKm > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="map" size={16} color="#64748b" />
              <Text style={styles.summaryLabel}>Distance</Text>
            </View>
            <Text style={styles.summaryValue}>{distanceKm.toFixed(1)} km</Text>
          </View>
        )}

        {durationMinutes > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconLabel}>
              <MaterialIcons name="schedule" size={16} color="#64748b" />
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <Text style={styles.summaryValue}>{Math.round(durationMinutes)} min</Text>
          </View>
        )}

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹{estimatedFare}</Text>
        </View>

        <View style={styles.fareNote}>
          <MaterialIcons name="info-outline" size={14} color="#3ccfa0" />
          <Text style={styles.fareNoteText}>
            (Includes driver allowance, toll fee, and other applicable charges)
          </Text>
          <TouchableOpacity
            style={styles.vehiclePriceContainer}
            onPress={() => setShowFareBreakdown(showFareBreakdown === bookingData.vehicleType ? null : bookingData.vehicleType)}
          >
            <MaterialIcons
              name={showFareBreakdown === bookingData.vehicleType ? "expand-less" : "expand-more"}
              size={16}
              color="#64748b"
              style={styles.expandIcon}
            />
            
            
          </TouchableOpacity>
          
        </View>

        {/* Fare Breakdown */}
        {showFareBreakdown === bookingData.vehicleType && adjustedFare && (
          <View style={styles.fareBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Fare</Text>
              <Text style={styles.breakdownValue}>₹{adjustedFare.baseFare}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Distance ({distanceKm.toFixed(1)} km)</Text>
              <Text style={styles.breakdownValue}>₹{adjustedFare.distanceFare}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Time ({Math.round(durationMinutes)} min)</Text>
              <Text style={styles.breakdownValue}>₹{adjustedFare.timeFare}</Text>
            </View>
            {adjustedFare.surgeMultiplier > 1 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Surge ({adjustedFare.surgeMultiplier}x)</Text>
                <Text style={styles.breakdownValue}>
                  ₹{Math.round((adjustedFare.baseFare + adjustedFare.distanceFare + adjustedFare.timeFare) * (adjustedFare.surgeMultiplier - 1))}
                </Text>
              </View>
            )}
            {adjustedFare.passengerSurcharge > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Passenger surcharge ({bookingData.passengers} guests)</Text>
                <Text style={styles.breakdownValue}>₹{adjustedFare.passengerSurcharge}</Text>
              </View>
            )}
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{adjustedFare.totalFare}</Text>
            </View>
          </View>
        )}
      </View>
      {/* Special Instructions */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.specialInstructionsHeader}
          onPress={toggleSpecialInstructions}
          accessibilityRole="button"
          accessibilityState={{ expanded: isSpecialInstructionsExpanded }}
          accessibilityLabel={`${isSpecialInstructionsExpanded ? 'Collapse' : 'Expand'} special instructions section`}
        >
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <View style={styles.expandIcon}>
            <MaterialIcons
              name={isSpecialInstructionsExpanded ? "expand-less" : "expand-more"}
              size={16}
              color="#64748b"
            />
          </View>
        </TouchableOpacity>

        {isSpecialInstructionsExpanded && (
          <View style={styles.specialInstructionsSection}>
            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Luggage Items</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease luggage count"
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue} accessibilityLabel={`Luggage count: ${luggageCount}`}>
                  {luggageCount}
                </Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setLuggageCount(Math.min(5, luggageCount + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Increase luggage count"
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.instructionRow}>
              <Text style={styles.instructionLabel}>Traveling with Pet</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setHasPet(!hasPet)}
                accessibilityRole="button"
                accessibilityState={{ checked: hasPet }}
                accessibilityLabel={`Traveling with pet: ${hasPet ? 'Yes' : 'No'}`}
              >
                <View style={[styles.instructionCheckbox, hasPet && styles.instructionCheckboxChecked]}>
                  {hasPet && <MaterialIcons name="check" size={16} color="#ffffff" />}
                </View>
                <Text style={styles.checkboxLabel}>{hasPet ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.instructionsInput}
              placeholder="Any additional requirements or instructions..."
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Choose Payment Amount</Text>
        <View style={styles.paymentAmountContainer}>
          <TouchableOpacity
            style={[
              styles.paymentAmountOption,
              paymentAmount === 'partial' && styles.paymentAmountOptionSelected,
            ]}
            onPress={() => setPaymentAmount('partial')}
          >
            <View style={styles.radioButton}>
              {paymentAmount === 'partial' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentAmountContent}>
              <Text style={styles.paymentAmountTitle}>
                Partial Payment (25%)
              </Text>
              <Text style={styles.paymentAmountDescription}>
                Pay remaining after ride
              </Text>
            </View>
            <Text style={styles.paymentAmountValue}>₹{partialPayment}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentAmountOption,
              paymentAmount === 'full' && styles.paymentAmountOptionSelected,
            ]}
            onPress={() => setPaymentAmount('full')}
          >
            <View style={styles.radioButton}>
              {paymentAmount === 'full' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentAmountContent}>
              <Text style={styles.paymentAmountTitle}>
                Full Payment
              </Text>
              <Text style={styles.paymentAmountDescription}>
                Pay complete fare now
              </Text>
            </View>
            <Text style={styles.paymentAmountValue}>₹{estimatedFare}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.remainingNote}>
          Remaining ₹{remainingAmount} will be collected after ride completion
        </Text>
      </View>

      

      {/* Payment Method Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Payment Method</Text>
        <View style={styles.paymentMethodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodOption,
                paymentMethod === method.id && styles.paymentMethodOptionSelected,
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.radioButton}>
                {paymentMethod === method.id && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.paymentMethodIcon}>
                <MaterialIcons
                  name={method.icon as any}
                  size={24}
                  color="#3ccfa0"
                />
              </View>
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodName}>
                  {method.name}
                </Text>
                <Text style={styles.paymentMethodDescription}>
                  {method.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Security Note */}
      <View style={styles.securityCard}>
        <MaterialIcons name="security" size={16} color="#3ccfa0" />
        <Text style={styles.securityText}>
          Secure Payment by Razorpay
        </Text>
      </View>

      {/* Terms and Conditions */}
      <View style={styles.termsCard}>
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <MaterialIcons name="check" size={16} color="#ffffff" />}
          </View>
          <Text style={styles.termsText}>
            I accept the{' '}
            <Text style={styles.termsLink}>Terms and Conditions</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[
          styles.payButton,
          (!acceptedTerms || isProcessing) && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={!acceptedTerms || isProcessing}
      >
        {isProcessing ? (
          <View style={styles.payButtonContent}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.payButtonText}>
              Processing...
            </Text>
          </View>
        ) : (
          <View style={styles.payButtonContent}>
            <MaterialIcons name="payment" size={20} color="#ffffff" />
            <Text style={styles.payButtonText}>
              Pay ₹{currentPaymentAmount} Now
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={isProcessing}
      >
        <View style={styles.backButtonContent}>
          <MaterialIcons name="arrow-back" size={16} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
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
    color: '#1e293b',
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
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  serviceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    color: '#3ccfa0',
    fontWeight: '500',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3ccfa0',
  },
  fareNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  fareNoteText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  paymentAmountContainer: {
    gap: 12,
  },
  paymentAmountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  paymentAmountOptionSelected: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3ccfa0',
  },
  paymentAmountContent: {
    flex: 1,
  },
  paymentAmountTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  paymentAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginLeft: 'auto',
  },
  paymentAmountDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  remainingNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentMethodOptionSelected: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  securityText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  termsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3ccfa0',
    borderColor: '#3ccfa0',
  },
  termsText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  termsLink: {
    color: '#3ccfa0',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#3ccfa0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    color: '#64748b',
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
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    color: '#3ccfa0',
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
    color: '#1e293b',
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
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
  },
  counterValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCheckboxChecked: {
    backgroundColor: '#3ccfa0',
    borderColor: '#3ccfa0',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  instructionsInput: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
  },
});

export default PaymentStep;