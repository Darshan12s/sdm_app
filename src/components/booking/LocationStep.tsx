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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Select Locations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose your pickup and drop-off locations</Text>
        </View>

        {/* Pickup Location */}
        <View style={styles.locationSection}>
          <Text style={[styles.locationLabel, { color: colors.text }]}>
            {serviceType === 'airport' && tripType === 'pickup' ? 'Select Terminal' : 'Pickup Location'}
          </Text>

          {serviceType === 'airport' && tripType === 'pickup' ? (
            <View style={styles.terminalContainer}>
              {Object.entries(airportTerminals).map(([key, terminal]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.terminalButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pickupLocation === terminal.address && [styles.terminalButtonActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]
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
                    pickupLocation === terminal.address && [styles.terminalTextActive, { color: colors.primary }]
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
            <Text style={[styles.locationLabel, { color: colors.text }]}>
              {serviceType === 'airport' && tripType === 'drop' ? 'Select Terminal' : 'Drop-off Location'}
            </Text>

            {serviceType === 'airport' && tripType === 'drop' ? (
              <View style={styles.terminalContainer}>
                {Object.entries(airportTerminals).map(([key, terminal]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.terminalButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      dropoffLocation === terminal.address && [styles.terminalButtonActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]
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
                      dropoffLocation === terminal.address && [styles.terminalTextActive, { color: colors.primary }]
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

      </ScrollView>

      {/* Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
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
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  locationSection: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  terminalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  terminalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
  },
  terminalButtonActive: {
    // Colors applied inline with theme
  },
  terminalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  terminalTextActive: {
    // Colors applied inline with theme
  },
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 6,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    zIndex: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    // Colors applied inline with theme
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    // Colors applied inline with theme
  },
});