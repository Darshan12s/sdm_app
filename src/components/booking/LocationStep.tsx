import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ServiceType } from '@/types';
import { GooglePlacesInput } from '@/components/GooglePlacesInput';
import { useTheme } from '@/contexts/ThemeContext';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationStepProps {
  serviceType: ServiceType;
  tripType: 'oneway' | 'roundtrip' | 'pickup' | 'drop';
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: LocationData | null;
  dropoffCoords: LocationData | null;
  pickupLocationError: string;
  dropoffLocationError: string;
  onPickupLocationChange: (value: string) => void;
  onDropoffLocationChange: (value: string) => void;
  onPickupCoordsChange: (coords: LocationData | null) => void;
  onDropoffCoordsChange: (coords: LocationData | null) => void;
  onPickupLocationError: (error: string) => void;
  onDropoffLocationError: (error: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LocationStep: React.FC<LocationStepProps> = ({
  serviceType,
  tripType,
  pickupLocation,
  dropoffLocation,
  pickupCoords,
  dropoffCoords,
  pickupLocationError,
  dropoffLocationError,
  onPickupLocationChange,
  onDropoffLocationChange,
  onPickupCoordsChange,
  onDropoffCoordsChange,
  onPickupLocationError,
  onDropoffLocationError,
  onNext,
  onBack,
}) => {
  const { colors } = useTheme();
  // Refs to track if coordinates were just set to prevent reset
  const pickupCoordsJustSetRef = React.useRef(false);
  const dropoffCoordsJustSetRef = React.useRef(false);

  // Airport terminals
  const airportTerminals = {
    terminal1: { name: 'Terminal 1 (KIA)', address: 'Terminal 1, Kempegowda International Airport' },
    terminal2: { name: 'Terminal 2 (KIA)', address: 'Terminal 2, Kempegowda International Airport' }
  };

  // Location validation
  const validateLocationRadius = (lat: number, lng: number) => {
    console.log('LocationStep: Validating coordinates:', { lat, lng });

    const mysoreCoords = { lat: 12.2958, lng: 76.6394 };
    const bangaloreCoords = { lat: 12.9716, lng: 77.5946 };

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const distanceFromMysore = calculateDistance(lat, lng, mysoreCoords.lat, mysoreCoords.lng);
    const distanceFromBangalore = calculateDistance(lat, lng, bangaloreCoords.lat, bangaloreCoords.lng);

    console.log('LocationStep: Distance from Mysore:', distanceFromMysore, 'km');
    console.log('LocationStep: Distance from Bangalore:', distanceFromBangalore, 'km');
    console.log('LocationStep: Validation result:', distanceFromMysore <= 50 || distanceFromBangalore <= 50);

    return distanceFromMysore <= 50 || distanceFromBangalore <= 50;
  };

  const handlePickupSelect = (place: any) => {
    console.log('LocationStep: handlePickupSelect called with place:', place);

    // Validate place object structure
    if (!place || !place.geometry || !place.geometry.location || typeof place.geometry.location.lat !== 'number' || typeof place.geometry.location.lng !== 'number') {
      console.error('LocationStep: Invalid place object structure');
      onPickupLocationError("❌ Invalid location data. Please try selecting a different location.");
      onPickupCoordsChange(null);
      return;
    }

    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;

    // Check for invalid coordinates
    if (lat === 0 && lng === 0) {
      console.log('LocationStep: Invalid coordinates (0,0) detected');
      onPickupLocationError("❌ Unable to get accurate location data. Please try selecting a different location.");
      onPickupCoordsChange(null);
      onPickupLocationChange(place.description || '');
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('LocationStep: Coordinates out of valid range:', { lat, lng });
      onPickupLocationError("❌ Invalid location coordinates. Please try selecting a different location.");
      onPickupCoordsChange(null);
      onPickupLocationChange(place.description || '');
      return;
    }

    // Check for NaN values
    if (isNaN(lat) || isNaN(lng)) {
      console.log('LocationStep: NaN coordinates detected:', { lat, lng });
      onPickupLocationError("❌ Invalid location data. Please try selecting a different location.");
      onPickupCoordsChange(null);
      onPickupLocationChange(place.description || '');
      return;
    }

    const isWithinRadius = validateLocationRadius(lat, lng);

    console.log('LocationStep: Location validation result:', isWithinRadius);

    if (!isWithinRadius) {
      console.log('LocationStep: Location outside service area');
      onPickupLocationError("❌ We're currently unavailable in this location. Please select a location near Mysore or Bangalore.");
      onPickupCoordsChange(null);
      onPickupLocationChange(place.description || '');
      return;
    }

    console.log('LocationStep: Setting pickup coordinates');
    onPickupLocationError("");
    const coords = {
      lat: lat,
      lng: lng,
      address: place.description || ''
    };
    console.log('LocationStep: New pickup coords:', coords);
    console.log('LocationStep: Calling onPickupCoordsChange with:', coords);
    onPickupCoordsChange(coords);
    // Set ref to prevent reset in onChange handler
    console.log('LocationStep: Setting pickupCoordsJustSetRef to true');
    pickupCoordsJustSetRef.current = true;
    // Reset ref after a short delay
    setTimeout(() => {
      console.log('LocationStep: Resetting pickupCoordsJustSetRef to false');
      pickupCoordsJustSetRef.current = false;
    }, 100);
    console.log('LocationStep: Calling onPickupLocationChange with:', place.description || '');
    onPickupLocationChange(place.description || '');
    console.log('LocationStep: handlePickupSelect completed');
  };

  const handleDropoffSelect = (place: any) => {
    console.log('LocationStep: handleDropoffSelect called with place:', place);

    // Validate place object structure
    if (!place || !place.geometry || !place.geometry.location || typeof place.geometry.location.lat !== 'number' || typeof place.geometry.location.lng !== 'number') {
      console.error('LocationStep: Invalid place object structure for dropoff');
      onDropoffLocationError("❌ Invalid location data. Please try selecting a different location.");
      onDropoffCoordsChange(null);
      return;
    }

    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;

    // Check for invalid coordinates
    if (lat === 0 && lng === 0) {
      console.log('LocationStep: Invalid dropoff coordinates (0,0) detected');
      onDropoffLocationError("❌ Unable to get accurate location data. Please try selecting a different location.");
      onDropoffCoordsChange(null);
      onDropoffLocationChange(place.description || '');
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('LocationStep: Dropoff coordinates out of valid range:', { lat, lng });
      onDropoffLocationError("❌ Invalid location coordinates. Please try selecting a different location.");
      onDropoffCoordsChange(null);
      onDropoffLocationChange(place.description || '');
      return;
    }

    // Check for NaN values
    if (isNaN(lat) || isNaN(lng)) {
      console.log('LocationStep: NaN dropoff coordinates detected:', { lat, lng });
      onDropoffLocationError("❌ Invalid location data. Please try selecting a different location.");
      onDropoffCoordsChange(null);
      onDropoffLocationChange(place.description || '');
      return;
    }

    const isWithinRadius = validateLocationRadius(lat, lng);

    console.log('LocationStep: Dropoff location validation result:', isWithinRadius);

    if (!isWithinRadius) {
      console.log('LocationStep: Dropoff location outside service area');
      onDropoffLocationError("❌ We're currently unavailable in this location. Please select a location near Mysore or Bangalore.");
      onDropoffCoordsChange(null);
      onDropoffLocationChange(place.description || '');
      return;
    }

    console.log('LocationStep: Setting dropoff coordinates');
    onDropoffLocationError("");
    const coords = {
      lat: lat,
      lng: lng,
      address: place.description || ''
    };
    console.log('LocationStep: New dropoff coords:', coords);
    console.log('LocationStep: Calling onDropoffCoordsChange with:', coords);
    onDropoffCoordsChange(coords);
    // Set ref to prevent reset in onChange handler
    console.log('LocationStep: Setting dropoffCoordsJustSetRef to true');
    dropoffCoordsJustSetRef.current = true;
    // Reset ref after a short delay
    setTimeout(() => {
      console.log('LocationStep: Resetting dropoffCoordsJustSetRef to false');
      dropoffCoordsJustSetRef.current = false;
    }, 100);
    console.log('LocationStep: Calling onDropoffLocationChange with:', place.description || '');
    onDropoffLocationChange(place.description || '');
    console.log('LocationStep: handleDropoffSelect completed');
  };

  const isFormValid = () => {
    const hasPickup = !!pickupCoords;
    const hasDestination = serviceType === 'hourly' ? true : !!dropoffCoords;
    const noErrors = !pickupLocationError && !dropoffLocationError;
    return hasPickup && hasDestination && noErrors;
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Select Locations</Text>
      </View>

      {/* Pickup Location */}
      <View style={styles.locationSection}>
        {serviceType === 'airport' && tripType === 'pickup' ? (
          <View style={styles.terminalContainer}>
            {Object.entries(airportTerminals).map(([key, terminal]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.terminalButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pickupLocation === terminal.address && [styles.terminalButtonActive, { borderColor: colors.primary, backgroundColor: colors.primary }]
                ]}
                onPress={() => {
                  onPickupLocationChange(terminal.address);
                  onPickupCoordsChange({
                    lat: 13.1986, lng: 77.7066, address: terminal.address
                  });
                  onPickupLocationError('');
                }}
              >
                <Text style={[
                  styles.terminalText,
                  { color: colors.textSecondary },
                  pickupLocation === terminal.address && [styles.terminalTextActive, { color: colors.surface }]
                ]}>
                  {terminal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <GooglePlacesInput
            placeholder="Enter pickup location"
            value={pickupLocation}
            onChange={(value) => {
              console.log('LocationStep: Pickup onChange called with value:', value);
              console.log('LocationStep: pickupCoordsJustSetRef.current:', pickupCoordsJustSetRef.current);
              onPickupLocationChange(value);
              // Reset coordinates if input is cleared (empty value) or if coordinates weren't just set
              if (value.trim() === '' || !pickupCoordsJustSetRef.current) {
                console.log('LocationStep: Resetting pickup coordinates to null');
                onPickupCoordsChange(null);
              } else {
                console.log('LocationStep: Skipping coordinate reset - coordinates were just set');
              }
            }}
            onPlaceSelect={handlePickupSelect}
            icon="pickup"
            showCurrentLocation={true}
          />
        )}

        {pickupLocationError ? (
          <Text style={styles.errorText}>{pickupLocationError}</Text>
        ) : null}
      </View>

      {/* Dropoff Location */}
      {serviceType !== 'hourly' && (
        <View style={styles.locationSection}>
          {serviceType === 'airport' && tripType === 'drop' ? (
            <View style={styles.terminalContainer}>
              {Object.entries(airportTerminals).map(([key, terminal]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.terminalButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    dropoffLocation === terminal.address && [styles.terminalButtonActive, { borderColor: colors.primary, backgroundColor: colors.primary }]
                  ]}
                  onPress={() => {
                    onDropoffLocationChange(terminal.address);
                    onDropoffCoordsChange({
                      lat: 13.1986, lng: 77.7066, address: terminal.address
                    });
                    onDropoffLocationError('');
                  }}
                >
                  <Text style={[
                    styles.terminalText,
                    { color: colors.textSecondary },
                    dropoffLocation === terminal.address && [styles.terminalTextActive, { color: colors.surface }]
                  ]}>
                    {terminal.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <GooglePlacesInput
              placeholder="Enter drop-off location"
              value={dropoffLocation}
              onChange={(value) => {
                console.log('LocationStep: Dropoff onChange called with value:', value);
                console.log('LocationStep: dropoffCoordsJustSetRef.current:', dropoffCoordsJustSetRef.current);
                onDropoffLocationChange(value);
                // Reset coordinates if input is cleared (empty value) or if coordinates weren't just set
                if (value.trim() === '' || !dropoffCoordsJustSetRef.current) {
                  console.log('LocationStep: Resetting dropoff coordinates to null');
                  onDropoffCoordsChange(null);
                } else {
                  console.log('LocationStep: Skipping coordinate reset - coordinates were just set');
                }
              }}
              onPlaceSelect={handleDropoffSelect}
              icon="dropoff"
            />
          )}

          {dropoffLocationError ? (
            <Text style={styles.errorText}>{dropoffLocationError}</Text>
          ) : null}
        </View>
      )}

      {/* Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                shadowColor: '#000000'
              }
            ]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary },
              !isFormValid() && [styles.nextButtonDisabled, { backgroundColor: colors.border }]
            ]}
            onPress={onNext}
            disabled={!isFormValid()}
          >
            <Text style={[
              styles.nextButtonText,
              { color: colors.surface },
              !isFormValid() && [styles.nextButtonTextDisabled, { color: colors.textMuted }],
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  
  header: {
    padding: 4,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    color: '#0f172a',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(58, 206, 159, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  locationSection: {
    paddingHorizontal: 8,
    marginBottom: 6,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
    paddingVertical: 6,
  },
  locationLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  terminalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  terminalButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  terminalButtonActive: {
    backgroundColor: '#3ace9f',
    borderColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  terminalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
  terminalTextActive: {
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 8,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  footer: {
    padding: 28,
    paddingBottom: 12,
    
    zIndex: 0,
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth:2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
   
  },
  nextButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.15,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextButtonTextDisabled: {
    color: '#94a3b8',
    fontWeight: '600',
  },
});