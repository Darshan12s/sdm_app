import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ServiceType } from '@/types';

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
  const serviceTypes = [
    { id: 'city' as ServiceType, name: 'City Ride', icon: 'location-city', iconType: 'MaterialIcons', description: 'Local city transportation' },
    { id: 'outstation' as ServiceType, name: 'Outstation', icon: 'directions-car', iconType: 'MaterialIcons', description: 'Inter-city travel' },
    { id: 'airport' as ServiceType, name: 'Airport Taxi', icon: 'flight', iconType: 'MaterialIcons', description: 'Airport transfers' },
    // { id: 'hourly' as ServiceType, name: 'Ride Later', icon: 'schedule', iconType: 'MaterialIcons', description: 'Schedule for later' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Service Type</Text>
        <Text style={styles.subtitle}>Enter your trip details and see available options</Text>
      </View>
     
      <View style={styles.serviceTypeContainer}>
        <View style={styles.serviceGrid}>
          {serviceTypes.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                serviceType === service.id && styles.serviceCardActive,
              ]}
              onPress={() => onServiceTypeChange(service.id)}
            >
              <View style={[
                styles.serviceIconContainer,
                serviceType === service.id && styles.serviceIconContainerActive
              ]}>
                {service.iconType === 'MaterialIcons' ? (
                  <MaterialIcons 
                    name={service.icon as any} 
                    size={24} 
                    color={serviceType === service.id ? '#ffffff' : '#3ccfa0'} 
                  />
                ) : (
                  <Ionicons 
                    name={service.icon as any} 
                    size={24} 
                    color={serviceType === service.id ? '#ffffff' : '#3ccfa0'} 
                  />
                )}
              </View>
              <Text style={[
                styles.serviceName,
                serviceType === service.id && styles.serviceNameActive,
              ]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trip Type Selection */}
      {(serviceType === 'outstation' || serviceType === 'airport') && (
        <View style={styles.tripTypeSection}>
          <View style={styles.tripTypeContainer}>
            {serviceType === 'outstation' ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    tripType === 'oneway' && styles.tripTypeButtonActive,
                  ]}
                  onPress={() => {
                    onTripTypeChange('oneway');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    tripType === 'oneway' && styles.tripTypeButtonTextActive,
                  ]}>
                    One Way
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    tripType === 'roundtrip' && styles.tripTypeButtonActive,
                  ]}
                  onPress={() => {
                    onTripTypeChange('roundtrip');
                    onRoundTripChange(true);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    tripType === 'roundtrip' && styles.tripTypeButtonTextActive,
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
                    tripType === 'pickup' && styles.tripTypeButtonActive,
                  ]}
                  onPress={() => {
                    onTripTypeChange('pickup');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    tripType === 'pickup' && styles.tripTypeButtonTextActive,
                  ]}>
                    Pick-up From Airport
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tripTypeButton,
                    tripType === 'drop' && styles.tripTypeButtonActive,
                  ]}
                  onPress={() => {
                    onTripTypeChange('drop');
                    onRoundTripChange(false);
                  }}
                >
                  <Text style={[
                    styles.tripTypeButtonText,
                    tripType === 'drop' && styles.tripTypeButtonTextActive,
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
                  isRoundTrip && styles.checkboxChecked,
                ]}>
                  {isRoundTrip && (
                    <MaterialIcons name="check" size={14} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Round Trip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !serviceType && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!serviceType}
        >
          <Text style={[
            styles.nextButtonText,
            !serviceType && styles.nextButtonTextDisabled,
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  serviceTypeContainer: {
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
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  serviceCard: {
    width: 'auto',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceCardActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  serviceIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceIconContainerActive: {
    backgroundColor: '#3ccfa0',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  serviceNameActive: {
    color: '#3ccfa0',
    fontWeight: '600',
  },
  tripTypeSection: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: '#3ccfa0',
    borderColor: '#3ccfa0',
  },
  tripTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tripTypeButtonTextActive: {
    color: '#ffffff',
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
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3ccfa0',
    borderColor: '#3ccfa0',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  nextButton: {
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