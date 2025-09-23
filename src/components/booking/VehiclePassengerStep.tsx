import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VehicleType, ServiceType } from '@/types';
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Vehicle</Text>
          <Text style={styles.subtitle}>Select the perfect vehicle for your journey</Text>
        </View>

        {/* Passenger Selection */}
        <TouchableOpacity
          style={styles.passengerSelector}
          onPress={() => setShowPassengerModal(true)}
        >
          <View style={styles.passengerContent}>
            <MaterialIcons name="people" size={20} color="#3ccfa0" />
            <Text style={styles.passengerText}>
              {passengers} Guests
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Vehicle Type Selection */}
        <View style={styles.vehicleContainer}>
          <Text style={styles.containerTitle}>Choose Your Vehicle</Text>
          <Text style={styles.containerSubtitle}>Select the perfect ride for your journey</Text>
          
          <View style={styles.vehicleGrid}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleCard,
                  vehicleType === vehicle.type && styles.vehicleCardActive,
                ]}
                onPress={() => onVehicleTypeChange(vehicle.type)}
                disabled={vehicle.comingSoon}
              >
                <View style={styles.vehicleCardContent}>
                  <View style={styles.vehicleIconContainer}>
                    <MaterialIcons 
                      name={vehicle.icon as any} 
                      size={24} 
                      color="#3ccfa0" 
                    />
                  </View>
                  
                  <View style={styles.vehicleDetails}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={styles.vehicleName}>
                        {vehicle.label}
                      </Text>
                      {vehicle.comingSoon && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.vehicleDescription}>
                      {vehicle.description}
                    </Text>
                    <View style={styles.vehicleMetaRow}>
                      <View style={styles.vehicleMeta}>
                        <MaterialIcons name="person" size={14} color="#64748b" />
                        <Text style={styles.vehicleMetaText}>{vehicle.capacity.split(' ')[0]}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <MaterialIcons name="map" size={14} color="#64748b" />
                        <Text style={styles.vehicleMetaText}>{vehicle.distance}</Text>
                      </View>
                      <View style={styles.vehicleMeta}>
                        <MaterialIcons name="schedule" size={14} color="#64748b" />
                        <Text style={styles.vehicleMetaText}>{vehicle.duration}</Text>
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
                          color="#64748b"
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
                    <View style={styles.fareBreakdown}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Base Fare</Text>
                        <Text style={styles.breakdownValue}>₹{vehicle.fareData.baseFare}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Distance ({vehicle.distance})</Text>
                        <Text style={styles.breakdownValue}>₹{vehicle.fareData.distanceFare}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Time ({vehicle.duration})</Text>
                        <Text style={styles.breakdownValue}>₹{vehicle.fareData.timeFare}</Text>
                      </View>
                      {vehicle.fareData.surgeMultiplier > 1 && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Surge ({vehicle.fareData.surgeMultiplier}x)</Text>
                          <Text style={styles.breakdownValue}>
                            ₹{Math.round((vehicle.fareData.baseFare + vehicle.fareData.distanceFare + vehicle.fareData.timeFare) * (vehicle.fareData.surgeMultiplier - 1))}
                          </Text>
                        </View>
                      )}
                      {vehicle.fareData.passengerSurcharge > 0 && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Passenger surcharge ({passengers} guests)</Text>
                          <Text style={styles.breakdownValue}>₹{vehicle.fareData.passengerSurcharge}</Text>
                        </View>
                      )}
                      <View style={[styles.breakdownRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{vehicle.fareData.totalFare}</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Passengers</Text>

            <View style={styles.passengerGrid}>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.passengerOption,
                    passengers === count && styles.passengerOptionActive,
                  ]}
                  onPress={() => handlePassengerSelect(count)}
                >
                  <Text style={[
                    styles.passengerOptionText,
                    passengers === count && styles.passengerOptionTextActive,
                  ]}>
                    {count}
                  </Text>
                  <Text style={[
                    styles.passengerOptionLabel,
                    passengers === count && styles.passengerOptionLabelActive,
                  ]}>
                    {count === 1 ? 'Guest' : 'Guests'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPassengerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!isFormValid()}
          >
            <Text style={[
              styles.nextButtonText,
              !isFormValid() && styles.nextButtonTextDisabled,
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
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
  },
  vehicleContainer: {
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  containerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  vehicleGrid: {
    gap: 16,
  },
  vehicleCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  vehicleCardActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
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
    backgroundColor: '#ecfdf5',
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
    color: '#1e293b',
  },
  comingSoonBadge: {
    backgroundColor: '#3ccfa0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  vehicleDescription: {
    fontSize: 12,
    color: '#64748b',
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
    color: '#64748b',
  },
  vehiclePriceContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3ccfa0',
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
    backgroundColor: '#ffffff',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerOptionActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  passengerOptionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  passengerOptionTextActive: {
    color: '#3ccfa0',
  },
  passengerOptionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  passengerOptionLabelActive: {
    color: '#3ccfa0',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3ccfa0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButtonTextDisabled: {
    color: '#94a3b8',
  },
});