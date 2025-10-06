import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator, Image, Animated } from 'react-native';
import { VehicleType, ServiceType } from '@/types';
import { useFareCalculation } from '@/hooks/useFareCalculation';
import { useTheme } from '@/contexts/ThemeContext';

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
  scheduledDate?: Date;
  scheduledTime?: string;
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
  scheduledDate,
  scheduledTime,
  onPassengersChange,
  onVehicleTypeChange,
  onNext,
  onBack,
}) => {
  const { colors } = useTheme();
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedCardScale] = useState(new Animated.Value(1));

  // Animation functions
  const animateCardPress = (pressed: boolean) => {
    Animated.spring(selectedCardScale, {
      toValue: pressed ? 0.95 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

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

    // Estimate duration (rough calculation: 30 km/h average speed)
    const durationMinutes = (distanceKm / 30) * 60;

    return { distanceKm, durationMinutes };
  };

  const { distanceKm, durationMinutes } = calculateDistanceAndDuration();

  // Create scheduled dateTime string for fare calculation
  const scheduledDateTime = scheduledDate && scheduledTime
    ? `${scheduledDate.toISOString().split('T')[0]}T${scheduledTime}:00`
    : undefined;

  // Calculate fares for each vehicle type with passenger multiplier
  const passengerMultiplier = passengers > 4 ? 1.1 : 1; // 10% surcharge for >4 passengers

  const sedanFare = useFareCalculation({
    serviceType,
    vehicleType: 'sedan',
    distanceKm,
    durationMinutes,
    scheduledDateTime,
  });

  const suvFare = useFareCalculation({
    serviceType,
    vehicleType: 'suv',
    distanceKm,
    durationMinutes,
    scheduledDateTime,
  });

  const premiumFare = useFareCalculation({
    serviceType,
    vehicleType: 'premium',
    distanceKm,
    durationMinutes,
    scheduledDateTime,
  });

  // Apply passenger multiplier to fares
  const adjustedSedanFare = sedanFare ? {
    ...sedanFare,
    totalFare: Math.round(sedanFare.totalFare * passengerMultiplier),
    passengerSurcharge: passengerMultiplier > 1 ? Math.round(sedanFare.totalFare * (passengerMultiplier - 1)) : 0
  } : null;

  const adjustedSuvFare = suvFare ? {
    ...suvFare,
    totalFare: Math.round(suvFare.totalFare * passengerMultiplier),
    passengerSurcharge: passengerMultiplier > 1 ? Math.round(suvFare.totalFare * (passengerMultiplier - 1)) : 0
  } : null;

  const adjustedPremiumFare = premiumFare ? {
    ...premiumFare,
    totalFare: Math.round(premiumFare.totalFare * passengerMultiplier),
    passengerSurcharge: passengerMultiplier > 1 ? Math.round(premiumFare.totalFare * (passengerMultiplier - 1)) : 0
  } : null;

  // Vehicle type options with dynamic pricing
  const vehicleTypes = [
    {
      type: 'sedan' as VehicleType,
      label: 'Sedan',
      capacity: '4 passengers',
      description: 'Comfortable and economical',
      fareData: adjustedSedanFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      features: ['AC', 'Music System', 'GPS'],
      imageSource: require('../../../assets/sedan.png'),
    },
    {
      type: 'suv' as VehicleType,
      label: 'SUV',
      capacity: '6 passengers',
      description: 'Spacious for groups',
      fareData: adjustedSuvFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      features: ['AC', 'Extra Space', 'GPS'],
      imageSource: require('../../../assets/suv.png'),
    },
    {
      type: 'premium' as VehicleType,
      label: 'Premium',
      capacity: '4 passengers',
      description: 'Luxury experience',
      fareData: adjustedPremiumFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      comingSoon: true,
      features: ['AC', 'Leather Seats', 'Music System', 'GPS'],
      imageSource: require('../../../assets/premium_backup.png'),
    },
  ];

  const handlePassengerSelect = (count: number) => {
    onPassengersChange(count);
    setShowPassengerModal(false);
  };

  const isFormValid = () => {
    return passengers > 0 && vehicleType && !vehicleTypes.find(v => v.type === vehicleType)?.comingSoon;
  };

  return (
    <View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Modern Header with Gradient Background */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>🚗</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: colors.surface }]}>Choose Your Perfect Ride</Text>
              <Text style={[styles.subtitle, { color: colors.surface }]}>Premium vehicles for every journey</Text>
            </View>
          </View>
        </View>

        {/* Passenger Selection Card */}
        <TouchableOpacity
          style={[styles.passengerSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowPassengerModal(true)}
          activeOpacity={0.9}
        >
          <View style={styles.passengerContent}>
            <View style={[styles.passengerIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.passengerIcon, { color: colors.primary }]}>👥</Text>
            </View>
            <View style={styles.passengerTextContainer}>
              <Text style={[styles.passengerLabel, { color: colors.textSecondary }]}>Number of Passengers</Text>
              <Text style={[styles.passengerText, { color: colors.text }]}>
                {passengers} {passengers === 1 ? 'Guest' : 'Guests'}
              </Text>
            </View>
          </View>
          <View style={[styles.chevronContainer, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.chevronIcon, { color: colors.primary }]}>⌄</Text>
          </View>
        </TouchableOpacity>

        {/* Vehicle Type Selection */}
        <View >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIcon, { color: colors.primary }]}>⭐</Text>
            <Text style={[styles.containerTitle, { color: colors.text }]}>Premium Vehicle Collection</Text>
          </View>
          <Text style={[styles.containerSubtitle, { color: colors.textSecondary }]}>Handpicked vehicles for exceptional journeys</Text>

          <View style={styles.vehicleGrid}>
            {vehicleTypes.map((vehicle, index) => (
              <Animated.View
                key={vehicle.type}
                style={[
                  { transform: [{ scale: vehicleType === vehicle.type ? selectedCardScale : 1 }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.vehicleCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    vehicleType === vehicle.type && styles.vehicleCardActive,
                  ]}
                  onPress={() => onVehicleTypeChange(vehicle.type)}
                  onPressIn={() => animateCardPress(true)}
                  onPressOut={() => animateCardPress(false)}
                  disabled={vehicle.comingSoon}
                  activeOpacity={0.95}
                >
                <View style={styles.vehicleCardContent}>
                  <View style={styles.vehicleIconContainer}>
                    <Image
                      source={vehicle.imageSource}
                      style={styles.vehicleImage}
                      resizeMode="contain"
                    />
                  </View>
                  
                  <View style={styles.vehicleDetails}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={[styles.vehicleName, { color: colors.text }]}>
                        {vehicle.label}
                      </Text>
                      {vehicle.comingSoon && (
                        <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.comingSoonText, { color: colors.surface }]}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.vehicleDescription, { color: colors.textSecondary }]}>
                      {vehicle.description}
                    </Text>
                    <View style={styles.vehicleMetaRow}>
                      <View style={styles.vehicleMeta}>
                        <Text style={[styles.metaIcon, { color: colors.textSecondary }]}>👤</Text>
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.capacity.split(' ')[0]}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <Text style={[styles.metaIcon, { color: colors.textSecondary }]}>📍</Text>
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.distance}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <Text style={[styles.metaIcon, { color: colors.textSecondary }]}>⏱️</Text>
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.duration}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.vehiclePriceContainer}>
                    {vehicle.fareData ? (
                      <>
                        <Text style={styles.vehiclePrice}>₹{vehicle.fareData.totalFare}</Text>
                        {vehicle.fareData.surgeMultiplier > 1 && (
                          <Text style={styles.surgeText}>
                            {vehicle.fareData.surgeReason}
                          </Text>
                        )}
                      </>
                    ) : distanceKm > 0 ? (
                      <Text style={styles.errorText}>Price unavailable</Text>
                    ) : (
                      <ActivityIndicator size="small" color="#3ccfa0" />
                    )}
                  </View>

                </View>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
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
                    passengers === count && [styles.passengerOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }],
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
            style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
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
 
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#3ace9f',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
    fontFamily: 'Inter-Black',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
    lineHeight: 26,
    letterSpacing: 0.3,
    fontWeight: '600',
    opacity: 0.95,
  },
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  passengerText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  chevronContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  containerTitle: {
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 8,
    fontFamily: 'Inter-Black',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  containerSubtitle: {
    fontSize: 18,
    marginBottom: 24,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 26,
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  vehicleGrid: {
    gap: 16,
    paddingHorizontal: 4,
  },
  vehicleCard: {
    borderWidth: 0,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  vehicleCardActive: {
    borderWidth: 0,
    backgroundColor: '#f0fdf4',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    transform: [{ scale: 1.02 }],
  },
  vehicleCardContent: {
    flexDirection: 'column',
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    width: '105%',
    alignSelf: 'stretch',
  },
  vehicleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
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
    borderRadius: 18,
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
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
  vehicleDescription: {
    fontSize: 14,
    marginBottom: 6,
    color: '#64748b',
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
    fontWeight: '600',
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaIcon: {
    fontSize: 14,
    color: '#3ace9f',
  },
  vehicleMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
  },
  vehiclePriceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginLeft: 12,
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  vehiclePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    fontFamily: 'Inter-Black',
    letterSpacing: 0.4,
  },
  surgeText: {
    fontSize: 10,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    padding: 24,
    paddingBottom: 36,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 20,
    borderRadius: 20,
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
    fontSize: 19,
    fontWeight: '900',
    fontFamily: 'Inter-Black',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextButtonTextDisabled: {
    color: '#94a3b8',
    fontWeight: '600',
  },
});
