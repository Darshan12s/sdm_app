import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  const [showFareBreakdown, setShowFareBreakdown] = useState<string | null>(null);

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
      icon: 'directions-car',
      iconType: 'MaterialIcons',
      description: 'Comfortable and economical',
      fareData: adjustedSedanFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      features: ['AC', 'Music System', 'GPS'],
    },
    {
      type: 'suv' as VehicleType,
      label: 'SUV',
      capacity: '6 passengers',
      icon: 'airport-shuttle',
      iconType: 'MaterialIcons',
      description: 'Spacious for groups',
      fareData: adjustedSuvFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      features: ['AC', 'Extra Space', 'GPS'],
    },
    {
      type: 'premium' as VehicleType,
      label: 'Premium',
      capacity: '4 passengers',
      icon: 'local-taxi',
      iconType: 'MaterialIcons',
      description: 'Luxury experience',
      fareData: adjustedPremiumFare,
      distance: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Calculating...',
      duration: durationMinutes > 0 ? `${Math.round(durationMinutes)} min` : 'Calculating...',
      comingSoon: true,
      features: ['AC', 'Leather Seats', 'Music System', 'GPS'],
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Choose Your Vehicle</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select the perfect vehicle for your journey</Text>
        </View>

        {/* Passenger Selection */}
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

        {/* Vehicle Type Selection */}
        <View style={[styles.vehicleContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.containerTitle, { color: colors.text }]}>Choose Your Vehicle</Text>
          <Text style={[styles.containerSubtitle, { color: colors.textSecondary }]}>Select the perfect ride for your journey</Text>
          
          <View style={styles.vehicleGrid}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  vehicleType === vehicle.type && [styles.vehicleCardActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }],
                ]}
                onPress={() => onVehicleTypeChange(vehicle.type)}
                disabled={vehicle.comingSoon}
              >
                <View style={styles.vehicleCardContent}>
                  <View style={[styles.vehicleIconContainer, { backgroundColor: colors.primaryLight }]}>
                    <MaterialIcons
                      name={vehicle.icon as any}
                      size={24}
                      color={colors.primary}
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
                        <MaterialIcons name="person" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.capacity.split(' ')[0]}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <MaterialIcons name="map" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.distance}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                        <Text style={[styles.vehicleMetaText, { color: colors.textSecondary }]}>{vehicle.duration}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.vehiclePriceContainer}
                    onPress={() => setShowFareBreakdown(showFareBreakdown === vehicle.type ? null : vehicle.type)}
                  >
                    {vehicle.fareData ? (
                      <>
                        <Text style={styles.vehiclePrice}>₹{vehicle.fareData.totalFare}</Text>
                        {vehicle.fareData.surgeMultiplier > 1 && (
                          <Text style={styles.surgeText}>
                            {vehicle.fareData.surgeReason}
                          </Text>
                        )}
                        <MaterialIcons
                          name={showFareBreakdown === vehicle.type ? "expand-less" : "expand-more"}
                          size={16}
                          color={colors.textSecondary}
                          style={styles.expandIcon}
                        />
                      </>
                    ) : distanceKm > 0 ? (
                      <Text style={styles.errorText}>Price unavailable</Text>
                    ) : (
                      <ActivityIndicator size="small" color="#3ccfa0" />
                    )}
                  </TouchableOpacity>

                  {/* Fare Breakdown */}
                  {showFareBreakdown === vehicle.type && vehicle.fareData && (
                    <View style={[styles.fareBreakdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Base Fare</Text>
                        <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{vehicle.fareData.baseFare}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Distance ({vehicle.distance})</Text>
                        <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{vehicle.fareData.distanceFare}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Time ({vehicle.duration})</Text>
                        <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{vehicle.fareData.timeFare}</Text>
                      </View>
                      {vehicle.fareData.surgeMultiplier > 1 && (
                        <View style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Surge ({vehicle.fareData.surgeMultiplier}x)</Text>
                          <Text style={[styles.breakdownValue, { color: colors.text }]}>
                            ₹{Math.round((vehicle.fareData.baseFare + vehicle.fareData.distanceFare + vehicle.fareData.timeFare) * (vehicle.fareData.surgeMultiplier - 1))}
                          </Text>
                        </View>
                      )}
                      {vehicle.fareData.passengerSurcharge > 0 && (
                        <View style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Passenger surcharge ({passengers} guests)</Text>
                          <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{vehicle.fareData.passengerSurcharge}</Text>
                        </View>
                      )}
                      <View style={[styles.breakdownRow, styles.totalRow, { borderTopColor: colors.border }]}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>₹{vehicle.fareData.totalFare}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
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
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  passengerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleContainer: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  containerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  vehicleGrid: {
    gap: 16,
  },
  vehicleCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  vehicleCardActive: {
    // Colors applied inline with theme
  },
  vehicleCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '500',
  },
  vehicleDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleMetaText: {
    fontSize: 12,
  },
  vehiclePriceContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  surgeText: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 2,
    textAlign: 'center',
  },
  expandIcon: {
    marginTop: 2,
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
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  passengerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  passengerOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerOptionActive: {
    // Colors applied inline with theme
  },
  passengerOptionText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  passengerOptionTextActive: {
    // Colors applied inline with theme
  },
  passengerOptionLabel: {
    fontSize: 12,
    marginTop: 4,
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
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    // Colors applied inline with theme
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    // Colors applied inline with theme
  },
});