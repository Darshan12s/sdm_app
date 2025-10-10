import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VehicleType, ServiceType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useFareCalculation } from '@/hooks/useFareCalculation';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface VehiclePassengerStepProps {
  passengers: number;
  vehicleType: VehicleType;
  serviceType: ServiceType;
  pickupCoords: LocationData | null;
  dropoffCoords: LocationData | null;
  onPassengersChange: (count: number) => void;
  onVehicleTypeChange: (type: VehicleType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VehiclePassengerStep: React.FC<VehiclePassengerStepProps> = ({
  passengers,
  vehicleType,
  serviceType,
  pickupCoords,
  dropoffCoords,
  onPassengersChange,
  onVehicleTypeChange,
  onNext,
  onBack,
}) => {
  const { colors } = useTheme();
  const [showPassengerModal, setShowPassengerModal] = useState(false);

  // Calculate distance and duration from coordinates
  const calculateDistanceAndDuration = () => {
    if (!pickupCoords || !dropoffCoords) return { distanceKm: 0, durationMinutes: 0 };

    const R = 6371; // Earth's radius in km
    const dLat = (dropoffCoords.lat - pickupCoords.lat) * Math.PI / 180;
    const dLng = (dropoffCoords.lng - pickupCoords.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(dropoffCoords.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate duration (average speed: 40 km/h for city driving)
    const durationMinutes = (distanceKm / 40) * 60;

    return { distanceKm, durationMinutes };
  };

  const { distanceKm, durationMinutes } = calculateDistanceAndDuration();

  // Calculate fare for each vehicle type individually using separate hook calls
  const sedanFare = useFareCalculation({
    serviceType,
    vehicleType: 'sedan',
    distanceKm,
    durationMinutes,
  });

  const suvFare = useFareCalculation({
    serviceType,
    vehicleType: 'suv',
    distanceKm,
    durationMinutes,
  });

  const premiumFare = useFareCalculation({
    serviceType,
    vehicleType: 'premium',
    distanceKm,
    durationMinutes,
  });

  // Vehicle type options with dynamic pricing using proper fare calculation
  const vehicleTypes = [
    {
      type: 'sedan' as VehicleType,
      label: 'Sedan',
      capacity: '4 passengers',
      description: 'Electric sedan - Comfortable and economical',
      price: sedanFare && distanceKm > 0 ? `₹${sedanFare.totalFare}` : '₹0',
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '0.0 km',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : '0 min',
      imageSource: require('../../../assets/sedan.png'),
    },
    {
      type: 'suv' as VehicleType,
      label: 'SUV',
      capacity: '6 passengers',
      description: 'Spacious for groups',
      price: suvFare && distanceKm > 0 ? `₹${suvFare.totalFare}` : '₹0',
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '0.0 km',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : '0 min',
      imageSource: require('../../../assets/suv.png'),
    },
    {
      type: 'premium' as VehicleType,
      label: 'Premium',
      capacity: '4 passengers',
      description: 'Luxury experience',
      price: premiumFare && distanceKm > 0 ? `₹${premiumFare.totalFare}` : '₹Calculating...',
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '0.0 km',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : '0 min',
      comingSoon: true,
      imageSource: require('../../../assets/premium_backup.png'),
    },
  ];

  const handlePassengerSelect = (count: number) => {
    onPassengersChange(count);
    setShowPassengerModal(false);
  };

  const handleVehicleSelect = (vehicleType: VehicleType) => {
    onVehicleTypeChange(vehicleType);
  };

  // Get dynamic header content based on selected vehicle
  const getHeaderContent = () => {
    const selectedVehicle = vehicleTypes.find(v => v.type === vehicleType);
    if (!selectedVehicle) {
      return {
        name: 'TATA TIGOR XPRES T EV XM',
        image: require('../../../assets/sedan.png')
      };
    }
    return {
      name: selectedVehicle.label === 'Sedan' ? 'TATA TIGOR XPRES T EV XM' :
            selectedVehicle.label === 'SUV' ? 'TATA NEXON EV' : 'Mercedes EQC',
      image: selectedVehicle.imageSource
    };
  };

  const headerContent = getHeaderContent();

  const isFormValid = () => {
    return passengers > 0 && vehicleType && !vehicleTypes.find(v => v.type === vehicleType)?.comingSoon;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with Car Name and Image */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerCarName, { color: colors.text }]}>
              {headerContent.name}
            </Text>
            <Image
              source={headerContent.image}
              style={styles.headerVehicleImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Passenger Selection Card */}
       <TouchableOpacity
          style={[styles.passengerSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowPassengerModal(true)}
        >
          <View style={styles.passengerContent}>
            <MaterialIcons name="people" size={20} color={colors.primary} />
            <Text style={[styles.passengerText, { color: colors.text }]}>
              {passengers} Guests
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Vehicle Selection Cards */}
        <View style={styles.vehicleGrid}>
          {vehicleTypes.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.type}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1
                },
                vehicleType === vehicle.type && [styles.vehicleCardActive, {
                  borderColor: colors.primary,
                  backgroundColor: colors.surface
                }],
              ]}
              onPress={() => handleVehicleSelect(vehicle.type)}
              disabled={vehicle.comingSoon}
              activeOpacity={0.95}
            >
              <View style={styles.vehicleCardContent}>
                <View style={styles.vehicleDetails}>
                  <View style={styles.vehicleNameRow}>
                    <Text style={[styles.vehicleName, { color: colors.text }]}>
                      {vehicle.label}
                    </Text>
                    {vehicle.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: '#3ace9f' }]}>
                        <Text style={[styles.comingSoonText, { color: '#ffffff' }]}>Coming Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.vehicleDescription, { color: colors.textSecondary }]}>
                    {vehicle.description}
                  </Text>
                  <View style={styles.vehicleMetaRow}>
                      <View style={[styles.vehicleMeta, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      }]}>
                        <MaterialIcons name="person" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.capacity.split(' ')[0]}</Text>
                      </View>
                      <View style={[styles.vehicleMeta, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      }]}>
                        <MaterialIcons name="map" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.distance}</Text>
                      </View>
                      <View style={[styles.vehicleMeta, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      }]}>
                        <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.duration}</Text>
                      </View>
                    </View>
                </View>

                <View style={[styles.vehiclePriceContainer, {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                }]}>
                  <Text style={[styles.vehiclePrice, {
                    color: colors.surface
                  }]}>{vehicle.price}</Text>
                  <Text style={styles.surgeText}>Distance fare • Time fare included</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Passenger Modal */}
      <Modal visible={showPassengerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Passengers</Text>

            <View style={styles.passengerGrid}>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.passengerOption,
                    { borderColor: colors.border },
                    passengers === count && [styles.passengerOptionActive, { borderColor: colors.primary }],
                  ]}
                  onPress={() => handlePassengerSelect(count)}
                >
                  <Text style={[
                    styles.passengerOptionText,
                    { color: colors.text },
                    passengers === count && [styles.passengerOptionTextActive, { color: colors.primary }],
                  ]}>
                    {count}
                  </Text>
                  <Text style={[
                    styles.passengerOptionLabel,
                    { color: colors.textSecondary },
                    passengers === count && [styles.passengerOptionLabelActive, { color: colors.primary }],
                  ]}>
                    {count === 1 ? 'Guest' : 'Guests'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.border }]}
              onPress={() => setShowPassengerModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButton, {
              borderColor: colors.border,
              backgroundColor: colors.surface
            }]}
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
  },

  scrollContent: {
    paddingBottom: 1,
  },
  header: {
    paddingHorizontal: 1,
    paddingVertical: 1,
    marginBottom: 2,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  headerCarName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  headerVehicleContainer: {
    width: 20,
    height: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerVehicleImage: {
    width: 550,
    height: 250,
  },
  headerPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  passengerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  passengerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passengerIcon: {
    fontSize: 24,
  },
  passengerTextContainer: {
    flex: 1,
  },
  passengerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  passengerText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  chevronContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chevronIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
 
  

  vehicleGrid: {
    gap: 4,
    paddingHorizontal: 2,
  },
  vehicleCard: {
    borderWidth: 0,
    borderRadius: 12,
    overflow: 'visible',
    marginBottom: 5,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  vehicleCardActive: {
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
    shadowColor: '#f0fdf4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    transform: [{ scale: 1.02 }],
  },
  vehicleCardContent: {
    flexDirection: 'row',
    padding: 9,
    alignItems: 'center',
    minHeight: 90,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'stretch',
  },
  vehicleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  vehicleImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  vehicleDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
    minHeight: 80,
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#3ace9f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#ffffff',
    position: 'absolute',
    top: 2,
    left:250,
    zIndex: 100,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  vehicleDescription: {
    fontSize: 12,
    marginBottom: 2,
    color: '#64748b',
    fontFamily: 'Inter-SemiBold',
    lineHeight: 14,
    fontWeight: '800',
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 45,
    justifyContent: 'center',

  },
  metaIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3ace9f',
    minWidth: 20,
    textAlign: 'center',
  },
  vehicleMetaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
  },
  vehiclePriceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
    marginLeft: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  vehiclePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    fontFamily: 'Inter-Black',
    letterSpacing: 0.3,
  },
  surgeText: {
    fontSize: 0,
    color: '#f59e0b',
    marginTop: 2,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    padding: 28,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter-Black',
    letterSpacing: 0.4,
  },
  passengerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  passengerOption: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  passengerOptionActive: {
    // Colors applied inline with theme
  },
  passengerOptionText: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'Inter-Black',
  },
  passengerOptionTextActive: {
    // Colors applied inline with theme
  },
  passengerOptionLabel: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  passengerOptionLabelActive: {
    // Colors applied inline with theme
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.15,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter-Black',
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
