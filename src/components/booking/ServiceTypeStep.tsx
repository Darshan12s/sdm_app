import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ServiceType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface ServiceTypeStepProps {
  serviceType: ServiceType;
  tripType: 'oneway' | 'roundtrip' | 'pickup' | 'drop';
  isRoundTrip: boolean;
  onServiceTypeChange: (serviceType: ServiceType) => void;
  onTripTypeChange: (tripType: 'oneway' | 'roundtrip' | 'pickup' | 'drop') => void;
  onRoundTripChange: (isRoundTrip: boolean) => void;
  onNext: () => void;
}

export const ServiceTypeStep: React.FC<ServiceTypeStepProps> = ({
  serviceType,
  tripType,
  isRoundTrip,
  onServiceTypeChange,
  onTripTypeChange,
  onRoundTripChange,
  onNext,
}) => {
  const { colors } = useTheme();
  const serviceTypes = [
    { id: 'city' as ServiceType, name: 'City Ride', icon: 'location-city', iconType: 'MaterialIcons', description: 'Local city transportation' },
    { id: 'outstation' as ServiceType, name: 'Outstation', icon: 'directions-car', iconType: 'MaterialIcons', description: 'Inter-city travel' },
    { id: 'airport' as ServiceType, name: 'Airport Taxi', icon: 'flight', iconType: 'MaterialIcons', description: 'Airport transfers' },
    // { id: 'hourly' as ServiceType, name: 'Ride Later', icon: 'schedule', iconType: 'MaterialIcons', description: 'Schedule for later' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Select Your Service Type</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your trip details and see available options</Text>
      </View>
     
      <View style={[styles.serviceTypeContainer, { backgroundColor: colors.card }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.serviceGrid}>
          {serviceTypes.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                serviceType === service.id && [styles.serviceCardActive, { borderColor: colors.primary, backgroundColor: colors.primary }],
              ]}
              onPress={() => onServiceTypeChange(service.id)}
            >
              <View style={[
                styles.serviceIconContainer,
                { backgroundColor: 'transparent' },
                serviceType === service.id && styles.serviceIconContainerActive
              ]}>
                {service.iconType === 'MaterialIcons' ? (
                  <MaterialIcons
                    name={service.icon as any}
                    size={24}
                    color={serviceType === service.id ? colors.surface : colors.text}
                  />
                ) : (
                  <Ionicons
                    name={service.icon as any}
                    size={24}
                    color={serviceType === service.id ? colors.surface : colors.text}
                  />
                )}
              </View>
              <Text style={[
                styles.serviceName,
                { color: colors.text },
                serviceType === service.id && [styles.serviceNameActive, { color: colors.surface }],
              ]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
      </View>

      {/* Trip Type Selection */}
      {(serviceType === 'outstation' || serviceType === 'airport') && (
        <View style={[styles.tripTypeSection, { backgroundColor: colors.card }]}>
          <View style={styles.tripTypeContainer}>
            {serviceType === 'outstation' ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    tripType === 'oneway' && [styles.tripTypeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    onTripTypeChange('oneway');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    { color: colors.textSecondary },
                    tripType === 'oneway' && [styles.tripTypeButtonTextActive, { color: colors.surface }],
                  ]}>
                    One Way
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    tripType === 'roundtrip' && [styles.tripTypeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    onTripTypeChange('roundtrip');
                    onRoundTripChange(true);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    { color: colors.textSecondary },
                    tripType === 'roundtrip' && [styles.tripTypeButtonTextActive, { color: colors.surface }],
                  ]}>
                    Round Trip
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    tripType === 'pickup' && [styles.tripTypeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    onTripTypeChange('pickup');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    { color: colors.textSecondary },
                    tripType === 'pickup' && [styles.tripTypeButtonTextActive, { color: colors.surface }],
                  ]}>
                    Pick-up From Airport
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    tripType === 'drop' && [styles.tripTypeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    onTripTypeChange('drop');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    { color: colors.textSecondary },
                    tripType === 'drop' && [styles.tripTypeButtonTextActive, { color: colors.surface }],
                  ]}>
                    Drop To Airport
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Round Trip Checkbox for Airport */}
          {serviceType === 'airport' && (
            <View style={styles.roundTripContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => onRoundTripChange(!isRoundTrip)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  isRoundTrip && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}>
                  {isRoundTrip && (
                    <MaterialIcons name="check" size={14} color={colors.surface} />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>Round Trip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            !serviceType && [styles.nextButtonDisabled, { backgroundColor: colors.border }]
          ]}
          onPress={onNext}
          disabled={!serviceType}
        >
          <Text style={[
            styles.nextButtonText,
            { color: colors.surface },
            !serviceType && [styles.nextButtonTextDisabled, { color: colors.textMuted }],
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
  },
  serviceTypeContainer: {
    borderRadius: 12,
    padding: 12,
    margin: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    minWidth: '100%',
    gap: 6,
  },
  serviceCard: {
    width: 100,
    height: 90,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 3,
  },
  serviceCardActive: {
    // Colors applied inline with theme
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceIconContainerActive: {
    // Background color applied inline with theme
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  serviceNameActive: {
    fontWeight: '600',
  },
  tripTypeSection: {
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    // Colors applied inline with theme
  },
  tripTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tripTypeButtonTextActive: {
    fontWeight: '600',
  },
  roundTripContainer: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    // Colors applied inline with theme
  },
  checkboxLabel: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  nextButton: {
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
