// screens/VehicleInformationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import { useTheme } from '@/contexts/ThemeContext';

export default function VehicleInformationScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    loadVehicleData();
  }, []);

  const loadVehicleData = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Fetch vehicle assigned to the driver - no join needed as type is in vehicles table
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_driver_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No vehicle found
          setVehicle(null);
        } else {
          console.error('Error fetching vehicle:', error);
          Alert.alert('Error', 'Failed to load vehicle information');
        }
      } else {
        setVehicle(data);
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {vehicle ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {vehicle.image_url && (
              <Image source={{ uri: vehicle.image_url }} style={styles.vehicleImage} />
            )}

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
              <InfoRow label="Make" value={vehicle.make} />
              <InfoRow label="Model" value={vehicle.model} />
              <InfoRow label="Year" value={vehicle.year} />
              <InfoRow label="Color" value={vehicle.color} />
              <InfoRow label="Type" value={vehicle.type} />
              <InfoRow label="License Plate" value={vehicle.license_plate} />
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Capacity & Status</Text>
              <InfoRow label="Capacity" value={`${vehicle.capacity} persons`} />
              <InfoRow label="Status" value={vehicle.status} />
              <InfoRow label="Vendor" value={vehicle.vendor_id} />
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Information</Text>
              <InfoRow label="Current Odometer" value={`${vehicle.current_odometer || 0} km`} />
              <InfoRow label="Last Service" value={vehicle.last_service_date || 'NA'} />
              <InfoRow label="Next Service Due" value={vehicle.next_service_due_date || 'NA'} />
              <InfoRow label="Fuel Economy" value={vehicle.average_fuel_economy ? `${vehicle.average_fuel_economy} km/L` : 'NA'} />
              <InfoRow label="Monthly Distance" value={vehicle.monthly_distance ? `${vehicle.monthly_distance} km` : 'NA'} />
            </View>

            <TouchableOpacity
              style={[styles.documentsButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('VehicleDocuments')}
            >
              <MaterialIcons name="description" size={20} color="#fff" />
              <Text style={styles.documentsButtonText}>View Documents</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="airport-shuttle" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No Vehicle Assigned</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              You haven't been assigned a vehicle yet. Please contact your administrator.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: any }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'SDM'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginVertical:25,
  },
  documentsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});