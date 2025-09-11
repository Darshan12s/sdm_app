import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { ServiceType, VehicleType } from '@/types';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface ConfirmationStepProps {
  serviceType: ServiceType;
  tripType: 'oneway' | 'roundtrip' | 'pickup' | 'drop';
  isRoundTrip: boolean;
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: LocationData | null;
  dropoffCoords: LocationData | null;
  scheduledDate: Date | undefined;
  scheduledTime: string;
  returnDate: Date | undefined;
  returnTime: string;
  passengers: number;
  vehicleType: VehicleType;
  onLuggageCountChange: (count: number) => void;
  onHasPetChange: (hasPet: boolean) => void;
  onAdditionalInstructionsChange: (instructions: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
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
  onLuggageCountChange,
  onHasPetChange,
  onAdditionalInstructionsChange,
  onConfirm,
  onBack,
}) => {
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false);
  const [luggageCount, setLuggageCount] = useState(0);
  const [hasPet, setHasPet] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Update parent state when local state changes
  useEffect(() => {
    onLuggageCountChange(luggageCount);
  }, [luggageCount, onLuggageCountChange]);

  useEffect(() => {
    onHasPetChange(hasPet);
  }, [hasPet, onHasPetChange]);

  useEffect(() => {
    onAdditionalInstructionsChange(additionalInstructions);
  }, [additionalInstructions, onAdditionalInstructionsChange]);

  const getServiceTypeLabel = () => {
    switch (serviceType) {
      case 'city': return 'City Ride';
      case 'outstation': return 'Outstation';
      case 'airport': return 'Airport Taxi';
      case 'hourly': return 'Hourly Rental';
      default: return serviceType;
    }
  };

  const getVehicleTypeLabel = () => {
    switch (vehicleType) {
      case 'sedan': return 'Sedan';
      case 'suv': return 'SUV';
      case 'premium': return 'Premium';
      default: return vehicleType;
    }
  };

  const formatDateTime = (date: Date | undefined, time: string) => {
    if (!date) return 'Not scheduled';
    return `${date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${time}`;
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to proceed with this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Confirm</Text>
          <Text style={styles.subtitle}>Please review your booking details</Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>

          <View style={styles.summaryCard}>
            {/* Service Type */}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{getServiceTypeLabel()}</Text>
            </View>

            {/* Trip Type */}
            {(serviceType === 'outstation' || serviceType === 'airport') && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Trip Type</Text>
                <Text style={styles.summaryValue}>
                  {serviceType === 'outstation'
                    ? (isRoundTrip ? 'Round Trip' : 'One Way')
                    : (tripType === 'pickup' ? 'Airport Pickup' : 'Airport Drop-off')
                  }
                </Text>
              </View>
            )}

            {/* Locations */}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>From</Text>
              <Text style={styles.summaryValue}>{pickupLocation || 'Not selected'}</Text>
            </View>

            {serviceType !== 'hourly' && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>To</Text>
                <Text style={styles.summaryValue}>{dropoffLocation || 'Not selected'}</Text>
              </View>
            )}

            {/* Date & Time */}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pickup</Text>
              <Text style={styles.summaryValue}>
                {formatDateTime(scheduledDate, scheduledTime)}
              </Text>
            </View>

            {isRoundTrip && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Return</Text>
                <Text style={styles.summaryValue}>
                  {formatDateTime(returnDate, returnTime)}
                </Text>
              </View>
            )}

            {/* Passengers & Vehicle */}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Passengers</Text>
              <Text style={styles.summaryValue}>{passengers}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>{getVehicleTypeLabel()}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.specialInstructionsSection}>
          <TouchableOpacity
            style={styles.specialInstructionsToggle}
            onPress={() => setShowSpecialInstructions(!showSpecialInstructions)}
          >
            <Text style={styles.specialInstructionsLabel}>Special Instructions</Text>
            <Text style={styles.specialInstructionsIcon}>
              {showSpecialInstructions ? '−' : '+'}
            </Text>
          </TouchableOpacity>

          {showSpecialInstructions && (
            <View style={styles.specialInstructionsContent}>
              {/* Luggage */}
              <View style={styles.specialInstructionsRow}>
                <Text style={styles.specialInstructionsText}>Luggage Items</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{luggageCount}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setLuggageCount(Math.min(3, luggageCount + 1))}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pet */}
              <View style={styles.specialInstructionsRow}>
                <Text style={styles.specialInstructionsText}>Traveling with Pet</Text>
                <Switch
                  value={hasPet}
                  onValueChange={setHasPet}
                  trackColor={{ false: '#cbd5e1', true: '#3ccfa0' }}
                  thumbColor={hasPet ? '#ffffff' : '#f1f5f9'}
                />
              </View>

              {/* Additional Instructions */}
              <TextInput
                style={styles.additionalInstructionsInput}
                placeholder="Any additional requirements..."
                value={additionalInstructions}
                onChangeText={setAdditionalInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Important Notes</Text>
          <View style={styles.termsList}>
            <Text style={styles.termsItem}>• Driver will contact you 15 minutes before pickup</Text>
            <Text style={styles.termsItem}>• Please be ready at the pickup location</Text>
            <Text style={styles.termsItem}>• Cancellation charges may apply</Text>
            <Text style={styles.termsItem}>• Toll charges and parking fees are extra</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
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
    padding: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  summarySection: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1e293b',
    flex: 2,
    textAlign: 'right',
  },
  specialInstructionsSection: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  specialInstructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specialInstructionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  specialInstructionsIcon: {
    fontSize: 16,
    color: '#64748b',
  },
  specialInstructionsContent: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specialInstructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specialInstructionsText: {
    fontSize: 12,
    color: '#475569',
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
  },
  additionalInstructionsInput: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 12,
    color: '#1e293b',
  },
  termsSection: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  termsList: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsItem: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 16,
  },
  footer: {
    padding: 8,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#3ccfa0',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});