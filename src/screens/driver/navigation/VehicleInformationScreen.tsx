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

export default function VehicleInformationScreen({ navigation }: { navigation: any }) {
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {vehicle ? (
          <View style={styles.card}>
            {vehicle.image_url && (
              <Image source={{ uri: vehicle.image_url }} style={styles.vehicleImage} />
            )}
            
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <InfoRow label="Make" value={vehicle.make} />
              <InfoRow label="Model" value={vehicle.model} />
              <InfoRow label="Year" value={vehicle.year} />
              <InfoRow label="Color" value={vehicle.color} />
              <InfoRow label="Type" value={vehicle.type} />
              <InfoRow label="License Plate" value={vehicle.license_plate} />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Capacity & Status</Text>
              <InfoRow label="Capacity" value={`${vehicle.capacity} persons`} />
              <InfoRow label="Status" value={vehicle.status} />
              <InfoRow label="Vendor" value={vehicle.vendor_id} />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Service Information</Text>
              <InfoRow label="Current Odometer" value={`${vehicle.current_odometer || 0} km`} />
              <InfoRow label="Last Service" value={vehicle.last_service_date || 'NA'} />
              <InfoRow label="Next Service Due" value={vehicle.next_service_due_date || 'NA'} />
              <InfoRow label="Fuel Economy" value={vehicle.average_fuel_economy ? `${vehicle.average_fuel_economy} km/L` : 'NA'} />
              <InfoRow label="Monthly Distance" value={vehicle.monthly_distance ? `${vehicle.monthly_distance} km` : 'NA'} />
            </View>

            <TouchableOpacity 
              style={styles.documentsButton}
              onPress={() => navigation.navigate('VehicleDocuments')}
            >
              <MaterialIcons name="description" size={20} color="#fff" />
              <Text style={styles.documentsButtonText}>View Documents</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="airport-shuttle" size={64} color="#64748b" />
            <Text style={styles.emptyStateText}>No Vehicle Assigned</Text>
            <Text style={styles.emptyStateSubtext}>
              You haven't been assigned a vehicle yet. Please contact your administrator.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'SDM'}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
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
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  documentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
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
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});