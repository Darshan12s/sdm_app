import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ServiceType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { GoogleMap } from '@/components/GoogleMap';

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
     {
       id: 'city' as ServiceType,
       name: 'City Ride',
       icon: 'location-city',
       iconType: 'MaterialIcons',
       description: 'Local city transportation',
       color: '#3ace9f',
       bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
       iconBg: '#e0f2fe',
       features: ['Quick & Easy', 'Local Routes', 'Best Price'],
       cardBg: '#f0fdf4',
       iconColor: '#059669'
     },
     {
       id: 'outstation' as ServiceType,
       name: 'Outstation',
       icon: 'directions-car',
       iconType: 'MaterialIcons',
       description: 'Inter-city travel',
       color: '#8b5cf6',
       bgColor: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
       iconBg: '#f3e8ff',
       features: ['Long Distance', 'Comfortable', 'Door-to-Door'],
       cardBg: '#faf5ff',
       iconColor: '#7c3aed'
     },
     {
       id: 'airport' as ServiceType,
       name: 'Airport Taxi',
       icon: 'flight-takeoff',
       iconType: 'MaterialIcons',
       description: 'Airport transfers',
       color: '#f59e0b',
       bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
       iconBg: '#fffbeb',
       features: ['Flight Tracking', 'Punctual', 'Safe & Secure'],
       cardBg: '#fffcf0',
       iconColor: '#d97706'
     },
   ];

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Choose Your Service</Text>
        
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
                serviceType === service.id && [styles.serviceCardActive, { borderColor: colors.primary }],
              ]}
              onPress={() => onServiceTypeChange(service.id)}
            >
              <View style={[
                styles.serviceIconContainer,
                { backgroundColor: service.iconBg },
                serviceType === service.id && styles.serviceIconContainerActive
              ]}>
                {service.iconType === 'MaterialIcons' ? (
                  <MaterialIcons
                    name={service.icon as any}
                    size={26}
                    color={serviceType === service.id ? '#ffffff' : service.iconColor}
                  />
                ) : (
                  <Ionicons
                    name={service.icon as any}
                    size={26}
                    color={serviceType === service.id ? '#ffffff' : service.iconColor}
                  />
                )}
              </View>
              <Text style={[
                styles.serviceName,
                { color: colors.text },
                serviceType === service.id && [styles.serviceNameActive, { color: colors.primary }],
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
  
  header: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
 
  serviceTypeContainer: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#3ace9f',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#F8E8F7FF',
    backgroundColor: '#ffffff',
    minWidth:'auto',
  },
  serviceGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      width: '100%',
      padding:4
  },
  serviceCard: {
    width: 78,
    height: 64,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginHorizontal: 4,

  },
  serviceCardActive: {
    color:'#3ace9f',
    borderColor: '#3ace9f',
    shadowColor: '#6D837CFF',
    transform: [{ scale: 1.05 }],
        shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',

  },
  serviceIconContainerActive: {
    backgroundColor: '#22CAF8FF',
    borderColor: '#3ace9f',
    borderWidth: 3,
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  serviceName: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 20,
    color: '#0f172a',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  serviceNameActive: {
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tripTypeSection: {
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 18,
    marginBottom: 8,
    shadowColor: '#3ace9f',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e8f8f0',
    backgroundColor: '#ffffff',
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 17,
    borderWidth:2,
    
    alignItems: 'center',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tripTypeButtonActive: {
    backgroundColor: '#3ace9f',
    borderColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  tripTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  tripTypeButtonTextActive: {
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
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
    width: 12,
    height: 12,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#3ace9f',
    borderColor: '#3ace9f',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'System',
  },
  footer: {
    padding: 12,
    paddingBottom: 16,
  },
  nextButton: {
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#3ace9f',
  },
  nextButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.15,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
  nextButtonTextDisabled: {
    color: '#94a3b8',
  },
});



