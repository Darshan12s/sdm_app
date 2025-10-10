import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Text,
} from "react-native";
import { ServiceType, VehicleType } from "@/types";
import { GoogleMap } from "@/components/GoogleMap";
import { ServiceTypeStep } from "@/components/booking/ServiceTypeStep";
import { LocationStep } from "@/components/booking/LocationStep";
import { DateTimeStep } from "@/components/booking/DateTimeStep";
import { VehiclePassengerStep } from "@/components/booking/VehiclePassengerStep";
import { PaymentStep } from "@/components/booking/PaymentStep";
import { useTheme } from "@/contexts/ThemeContext";

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
interface BookingFlowProps {
  onBookingComplete: (bookingData: any) => void;
}

// Location validation
const validateLocationRadius = (lat: number, lng: number) => {
  const mysoreCoords = { lat: 12.2958, lng: 76.6394 };
  const bangaloreCoords = { lat: 12.9716, lng: 77.5946 };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distanceFromMysore = calculateDistance(
    lat,
    lng,
    mysoreCoords.lat,
    mysoreCoords.lng
  );
  const distanceFromBangalore = calculateDistance(
    lat,
    lng,
    bangaloreCoords.lat,
    bangaloreCoords.lng
  );

  return distanceFromMysore <= 50 || distanceFromBangalore <= 50;
};

export const BookingFlow: React.FC<BookingFlowProps> = ({
  onBookingComplete,
}) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType>("city");
  const [tripType, setTripType] = useState<
    "oneway" | "roundtrip" | "pickup" | "drop"
  >("oneway");
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Location state
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<LocationData | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LocationData | null>(null);
  const [pickupLocationError, setPickupLocationError] = useState("");
  const [dropoffLocationError, setDropoffLocationError] = useState("");

  // Debug wrapper for state setters
  const debugSetPickupCoords = (coords: LocationData | null) => {
    console.log("BookingFlow: setPickupCoords called with:", coords);
    pickupCoordsRef.current = coords;
    setPickupCoords(coords);
  };

  const debugSetDropoffCoords = (coords: LocationData | null) => {
    console.log("BookingFlow: setDropoffCoords called with:", coords);
    dropoffCoordsRef.current = coords;
    setDropoffCoords(coords);
  };

  // Force re-render counter
  const [renderKey, setRenderKey] = useState(0);

  // Refs to track latest state values
  const pickupCoordsRef = React.useRef<LocationData | null>(null);
  const dropoffCoordsRef = React.useRef<LocationData | null>(null);

  // Sync refs with state
  React.useEffect(() => {
    pickupCoordsRef.current = pickupCoords;
    dropoffCoordsRef.current = dropoffCoords;
  }, [pickupCoords, dropoffCoords]);

  // Debug: Log state changes and force re-render
  React.useEffect(() => {
    console.log(
      "BookingFlow: State updated - pickupCoords:",
      pickupCoords,
      "dropoffCoords:",
      dropoffCoords
    );
    console.log(
      "BookingFlow: Ref values - pickupCoords:",
      pickupCoordsRef.current,
      "dropoffCoords:",
      dropoffCoordsRef.current
    );
    // Force re-render to ensure GoogleMap receives updated props
    setRenderKey((prev) => prev + 1);
  }, [pickupCoords, dropoffCoords]);

  // Debug: Log when rendering GoogleMap
  console.log(
    "BookingFlow: About to render GoogleMap with pickupCoords:",
    pickupCoords,
    "dropoffCoords:",
    dropoffCoords
  );
  console.log(
    "BookingFlow: Ref values when rendering - pickupCoords:",
    pickupCoordsRef.current,
    "dropoffCoords:",
    dropoffCoordsRef.current
  );

  // Date & Time state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [returnTime, setReturnTime] = useState("");

  // Vehicle & Passenger state
  const [passengers, setPassengers] = useState(2);
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");

  // Special instructions state
  const [luggageCount, setLuggageCount] = useState(0);
  const [hasPet, setHasPet] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Animation functions
  const animateStepTransition = (direction: "forward" | "backward") => {
    // Fade out current step
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: direction === "forward" ? -50 : 50,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Reset animations
        fadeAnim.setValue(0);
        slideAnim.setValue(direction === "forward" ? 50 : -50);

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
    "Service",
    "Locations",
    "Date & Time",
    "Vehicle",
    "Payment",
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      animateStepTransition("forward");
      setTimeout(() => setCurrentStep(currentStep + 1), 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateStepTransition("backward");
      setTimeout(() => setCurrentStep(currentStep - 1), 150);
    }
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    // Reset dependent fields when service type changes
    if (type === "hourly") {
      setDropoffLocation("");
      setDropoffCoords(null);
      setDropoffLocationError("");
    }
  };

  const handleTripTypeChange = (
    type: "oneway" | "roundtrip" | "pickup" | "drop"
  ) => {
    setTripType(type);
    setIsRoundTrip(type === "roundtrip");
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
            onPickupCoordsChange={debugSetPickupCoords}
            onDropoffCoordsChange={debugSetDropoffCoords}
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
            serviceType={serviceType}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            onPassengersChange={setPassengers}
            onVehicleTypeChange={setVehicleType}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
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
       <View style={styles.contentContainer}>
         {/* Map Container - Show only in steps 1, 2, 3 */}
         {currentStep <= 3 && (
           <View
             style={[
               styles.mapContainer,
               {
                 backgroundColor: colors.card,
                 borderBottomColor: colors.border,
               },
             ]}
           >
             <GoogleMap
               pickupLocation={pickupCoords}
               dropoffLocation={dropoffCoords}
               height={SCREEN_HEIGHT}
               interactive={currentStep <= 3} // Interactive in all steps where map is shown
               showLocationButtons={true} // Always show location picking buttons
               onPickupChange={(location) => {
                 const isValid = validateLocationRadius(
                   location.lat,
                   location.lng
                 );
                 if (!isValid) {
                   setPickupLocationError(
                     "❌ We're currently unavailable in this location. Please select a location near Mysore or Bangalore."
                   );
                   setPickupCoords(null);
                   setPickupLocation(location.address);
                 } else {
                   setPickupLocationError("");
                   setPickupCoords(location);
                   setPickupLocation(location.address);
                 }
               }}
               onDropoffChange={(location) => {
                 const isValid = validateLocationRadius(
                   location.lat,
                   location.lng
                 );
                 if (!isValid) {
                   setDropoffLocationError(
                     "❌ We're currently unavailable in this location. Please select a location near Mysore or Bangalore."
                   );
                   setDropoffCoords(null);
                   setDropoffLocation(location.address);
                 } else {
                   setDropoffLocationError("");
                   setDropoffCoords(location);
                   setDropoffLocation(location.address);
                 }
               }}
               activeMarker="pickup"
             />

           </View>
         )}

         {/* Form Container - Overlay */}
         <View
               style={[
                 styles.formContainer,
                 { backgroundColor: currentStep <= 3 ? 'transparent' : colors.background },
               ]}
             >
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
                 {
                   position: currentStep <= 3 ? "absolute" : "relative",
                   zIndex: currentStep <= 3 ? 100 : 1,
                   left: 0,
                   right:0,
                   bottom: currentStep <= 3 ? 0 : 'auto',
                   height: currentStep <= 3 ? 'auto' : '100%',
                   borderTopRightRadius: currentStep <= 3 ? 34 : 0,
                   borderTopLeftRadius: currentStep <= 3 ? 34 : 0,
                   borderWidth: currentStep <= 3 ? 2 : 0,
                   borderColor: currentStep <= 3 ? colors.border : 'transparent',
                   elevation: currentStep <= 3 ? 8 : 0,
                   backgroundColor: colors.card,
                   shadowColor: currentStep <= 3 ? "#3ace9f" : "transparent",
                   shadowOffset: currentStep <= 3 ? { width: 0, height: 6 } : { width: 0, height: 0 },
                   shadowOpacity: currentStep <= 3 ? 0.2 : 0,
                   shadowRadius: currentStep <= 3 ? 12 : 0,
                 },
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
   );
};

const styles = StyleSheet.create({
   contentContainer: {
     flex: 1,
     height: SCREEN_HEIGHT,
     position: 'relative',
   },
   mapContainer: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     shadowColor: "#3ace9f",
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 12,
     elevation: 1,
     backgroundColor: "#FFFFFFFF",
   },
   formContainer: {
     flex: 1,
     position: 'relative',
     backgroundColor: 'transparent',
   },
   stepContainer: {
     width: SCREEN_WIDTH,
     padding: 16,
     shadowColor: "#3ace9f",
     shadowOffset: { width: 0, height: 6 },
     shadowOpacity: 0.2,
     shadowRadius: 12,
     backgroundColor: "#ffffff",
     opacity: 1,
   },
   scrollContainer: {
     flex: 1,
   },
   scrollContent: {
     flexGrow: 1,
   },
 });
