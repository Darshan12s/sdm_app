import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { ServiceType, VehicleType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Review & Confirm</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Please review your booking details</Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Summary</Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Service Type */}
            <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{getServiceTypeLabel()}</Text>
            </View>

            {/* Trip Type */}
            {(serviceType === 'outstation' || serviceType === 'airport') && (
              <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Trip Type</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {serviceType === 'outstation'
                    ? (isRoundTrip ? 'Round Trip' : 'One Way')
                    : (tripType === 'pickup' ? 'Airport Pickup' : 'Airport Drop-off')
                  }
                </Text>
              </View>
            )}

            {/* Locations */}
            <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>From</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{pickupLocation || 'Not selected'}</Text>
            </View>

            {serviceType !== 'hourly' && (
              <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{dropoffLocation || 'Not selected'}</Text>
              </View>
            )}

            {/* Date & Time */}
            <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pickup</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatDateTime(scheduledDate, scheduledTime)}
              </Text>
            </View>

            {isRoundTrip && (
              <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Return</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatDateTime(returnDate, returnTime)}
                </Text>
              </View>
            )}

            {/* Passengers & Vehicle */}
            <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Passengers</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{passengers}</Text>
            </View>

            <View style={[styles.summaryItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Vehicle</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{getVehicleTypeLabel()}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.specialInstructionsSection}>
          <TouchableOpacity
            style={[styles.specialInstructionsToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowSpecialInstructions(!showSpecialInstructions)}
          >
            <Text style={[styles.specialInstructionsLabel, { color: colors.text }]}>Special Instructions</Text>
            <Text style={[styles.specialInstructionsIcon, { color: colors.textSecondary }]}>
              {showSpecialInstructions ? '−' : '+'}
            </Text>
          </TouchableOpacity>

          {showSpecialInstructions && (
            <View style={[styles.specialInstructionsContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Luggage */}
              <View style={styles.specialInstructionsRow}>
                <Text style={[styles.specialInstructionsText, { color: colors.textSecondary }]}>Luggage Items</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[styles.counterButton, { backgroundColor: colors.border }]}
                    onPress={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                  >
                    <Text style={[styles.counterButtonText, { color: colors.textSecondary }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: colors.text }]}>{luggageCount}</Text>
                  <TouchableOpacity
                    style={[styles.counterButton, { backgroundColor: colors.border }]}
                    onPress={() => setLuggageCount(Math.min(3, luggageCount + 1))}
                  >
                    <Text style={[styles.counterButtonText, { color: colors.textSecondary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Pet */}
              <View style={styles.specialInstructionsRow}>
                <Text style={[styles.specialInstructionsText, { color: colors.textSecondary }]}>Traveling with Pet</Text>
                <Switch
                  value={hasPet}
                  onValueChange={setHasPet}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={hasPet ? colors.surface : colors.border}
                />
              </View>

              {/* Additional Instructions */}
              <TextInput
                style={[styles.additionalInstructionsInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Any additional requirements..."
                placeholderTextColor={colors.textSecondary}
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
          <Text style={[styles.termsTitle, { color: colors.text }]}>Important Notes</Text>
          <View style={[styles.termsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.termsItem, { color: colors.textSecondary }]}>• Driver will contact you 15 minutes before pickup</Text>
            <Text style={[styles.termsItem, { color: colors.textSecondary }]}>• Please be ready at the pickup location</Text>
            <Text style={[styles.termsItem, { color: colors.textSecondary }]}>• Cancellation charges may apply</Text>
            <Text style={[styles.termsItem, { color: colors.textSecondary }]}>• Toll charges and parking fees are extra</Text>
          </View>
        </View>
      </ScrollView>

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
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.confirmButtonText, { color: colors.surface }]}>Confirm Booking</Text>
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
    padding: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  summarySection: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryCard: {
    borderRadius: 4,
    padding: 6,
    borderWidth: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 11,
    flex: 1,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '500',
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
    borderRadius: 8,
    borderWidth: 1,
  },
  specialInstructionsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  specialInstructionsIcon: {
    fontSize: 16,
  },
  specialInstructionsContent: {
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  specialInstructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specialInstructionsText: {
    fontSize: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  additionalInstructionsInput: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 12,
  },
  termsSection: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  termsList: {
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
  },
  termsItem: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 16,
  },
  footer: {
    padding: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
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
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});