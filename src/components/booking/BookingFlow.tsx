import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ScrollView, Text } from 'react-native';
import { ServiceType, VehicleType } from '@/types';
import { GoogleMap } from '@/components/GoogleMap';
import { ServiceTypeStep } from '@/components/booking/ServiceTypeStep';
import { LocationStep } from '@/components/booking/LocationStep';
import { DateTimeStep } from '@/components/booking/DateTimeStep';
import { VehiclePassengerStep } from '@/components/booking/VehiclePassengerStep';
import { ConfirmationStep } from '@/components/booking/ConfirmationStep';
import { PaymentStep } from '@/components/booking/PaymentStep';

// Import theme
import { useTheme } from '../../contexts/ThemeContext';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface BookingFlowProps {
  onBookingComplete: (bookingData: any) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onBookingComplete }) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType>('city');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'pickup' | 'drop'>('oneway');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Location state
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<LocationData | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LocationData | null>(null);
  const [pickupLocationError, setPickupLocationError] = useState('');
  const [dropoffLocationError, setDropoffLocationError] = useState('');

  // Date & Time state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [returnTime, setReturnTime] = useState('');

  // Vehicle & Passenger state
  const [passengers, setPassengers] = useState(2);
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');

  // Special instructions state
  const [luggageCount, setLuggageCount] = useState(0);
  const [hasPet, setHasPet] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Animation functions
  const animateStepTransition = (direction: 'forward' | 'backward') => {
    // Fade out current step
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -50 : 50,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Reset animations
        fadeAnim.setValue(0);
        slideAnim.setValue(direction === 'forward' ? 50 : -50);

        // Fade in new step
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  };

  const stepLabels = [
    'Service',
    'Locations',
    'Date & Time',
    'Vehicle',
    'Confirm',
    'Payment'
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      animateStepTransition('forward');
      setTimeout(() => setCurrentStep(currentStep + 1), 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateStepTransition('backward');
      setTimeout(() => setCurrentStep(currentStep - 1), 150);
    }
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    // Reset dependent fields when service type changes
    if (type === 'hourly') {
      setDropoffLocation('');
      setDropoffCoords(null);
      setDropoffLocationError('');
    }
  };

  const handleTripTypeChange = (type: 'oneway' | 'roundtrip' | 'pickup' | 'drop') => {
    setTripType(type);
    setIsRoundTrip(type === 'roundtrip');
  };

  const handleConfirmBooking = () => {
    // Move to payment step instead of completing booking
    handleNext();
  };

  const handlePaymentSuccess = (paymentDetails: any) => {
    const bookingData = {
      serviceType,
      tripType,
      isRoundTrip,
      pickupLocation,
      dropoffLocation,
      pickupCoords,
      dropoffCoords,
      scheduledDate,
      scheduledTime,
      returnDate,
      returnTime,
      passengers,
      vehicleType,
      luggageCount,
      hasPet,
      additionalInstructions,
      paymentDetails,
    };

    onBookingComplete(bookingData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ServiceTypeStep
            serviceType={serviceType}
            tripType={tripType}
            isRoundTrip={isRoundTrip}
            onServiceTypeChange={handleServiceTypeChange}
            onTripTypeChange={handleTripTypeChange}
            onRoundTripChange={setIsRoundTrip}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <LocationStep
            serviceType={serviceType}
            tripType={tripType}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            pickupLocationError={pickupLocationError}
            dropoffLocationError={dropoffLocationError}
            onPickupLocationChange={setPickupLocation}
            onDropoffLocationChange={setDropoffLocation}
            onPickupCoordsChange={setPickupCoords}
            onDropoffCoordsChange={setDropoffCoords}
            onPickupLocationError={setPickupLocationError}
            onDropoffLocationError={setDropoffLocationError}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <DateTimeStep
            serviceType={serviceType}
            isRoundTrip={isRoundTrip}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            returnDate={returnDate}
            returnTime={returnTime}
            onScheduledDateChange={setScheduledDate}
            onScheduledTimeChange={setScheduledTime}
            onReturnDateChange={setReturnDate}
            onReturnTimeChange={setReturnTime}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <VehiclePassengerStep
            passengers={passengers}
            vehicleType={vehicleType}
            onPassengersChange={setPassengers}
            onVehicleTypeChange={setVehicleType}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <ConfirmationStep
            serviceType={serviceType}
            tripType={tripType}
            isRoundTrip={isRoundTrip}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            returnDate={returnDate}
            returnTime={returnTime}
            passengers={passengers}
            vehicleType={vehicleType}
            onLuggageCountChange={setLuggageCount}
            onHasPetChange={setHasPet}
            onAdditionalInstructionsChange={setAdditionalInstructions}
            onConfirm={handleConfirmBooking}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <PaymentStep
            bookingData={{
              serviceType,
              tripType,
              isRoundTrip,
              pickupLocation,
              dropoffLocation,
              pickupCoords,
              dropoffCoords,
              scheduledDate,
              scheduledTime,
              returnDate,
              returnTime,
              passengers,
              vehicleType,
              luggageCount,
              hasPet,
              additionalInstructions,
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.stepIndicator}>
            {stepLabels.map((label, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  { backgroundColor: colors.textMuted },
                  index + 1 === currentStep ? [styles.stepDotActive, { backgroundColor: colors.primary }] :
                  index + 1 < currentStep ? [styles.stepDotCompleted, { backgroundColor: colors.success }] : {}
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepLabel, { color: colors.text }]}>
            Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
          </Text>
        </View>

        {/* Map Container */}
        <View style={[styles.mapContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <GoogleMap
            pickupLocation={pickupCoords}
            dropoffLocation={dropoffCoords}
            height={300}
            interactive={currentStep === 2} // Only interactive on location step
            showLocationButtons={true} // Always show location picking buttons
            onPickupChange={(location) => {
              setPickupCoords(location);
              setPickupLocation(location.address);
            }}
            onDropoffChange={(location) => {
              setDropoffCoords(location);
              setDropoffLocation(location.address);
            }}
            activeMarker="pickup"
          />
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Animated.View
              style={[
                styles.stepContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {renderCurrentStep()}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  topBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepDotCompleted: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 300, // Fixed height for map
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderBottomWidth: 1,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  stepContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});