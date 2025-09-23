import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import Toast from 'react-native-toast-message';

// Import theme
import { useTheme } from '@/contexts/ThemeContext';

// Import types
import { DriverTabParamList } from '@/types/navigation';
import { Booking } from '@/types';

// Import GoogleMap component
import { GoogleMap } from '@/components/GoogleMap';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

// Location data interface
interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

type ActiveRideScreenProps = {
  navigation: StackNavigationProp<DriverTabParamList>;
};

export default function ActiveRideScreen({ navigation }: ActiveRideScreenProps) {
  const { colors } = useTheme();
  const [activeRide, setActiveRide] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState<'pickup' | 'in_progress' | 'completed'>('pickup');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [currentDriverLocation, setCurrentDriverLocation] = useState<LocationData | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const user = useUser();

  useEffect(() => {
    fetchActiveRide();
  }, [user]);

  // Start/stop location tracking based on active ride status
  useEffect(() => {
    if (activeRide && (rideStatus === 'pickup' || rideStatus === 'in_progress')) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [activeRide, rideStatus]);

  const fetchActiveRide = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:users(full_name, phone_no, whatsapp_phone, email),
          driver:drivers(rating, total_rides)
        `)
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'started'])
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows

      setActiveRide(data);
      if (data) {
        if (data.status === 'accepted') setRideStatus('pickup');
        else if (data.status === 'started') setRideStatus('in_progress');
        else if (data.status === 'completed') setRideStatus('completed');

        // Geocode pickup and dropoff addresses
        if (data.pickup_address) {
          geocodeAddress(data.pickup_address, 'pickup');
        }
        if (data.dropoff_address) {
          geocodeAddress(data.dropoff_address, 'dropoff');
        }
      }
    } catch (error) {
      console.error('Error fetching active ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load active ride',
      });
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string, type: 'pickup' | 'dropoff') => {
    if (!address || !GOOGLE_MAPS_API_KEY) return;

    try {
      setMapLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const locationData: LocationData = {
          lat: location.lat,
          lng: location.lng,
          address: data.results[0].formatted_address,
        };

        if (type === 'pickup') {
          setPickupLocation(locationData);
        } else {
          setDropoffLocation(locationData);
        }
      } else {
        console.error('Geocoding failed for address:', address);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const startLocationTracking = async () => {
    // Check if already tracking to avoid duplicate subscriptions
    if (isLocationTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking');
        return;
      }

      setIsLocationTracking(true);
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        (location) => {
          const locationData: LocationData = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            address: 'Current Location',
          };
          setCurrentDriverLocation(locationData);

          // Update driver location in database when driver is online (has accepted ride or active ride)
          if (user) {
            updateDriverLocation(location.coords.latitude, location.coords.longitude);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      setIsLocationTracking(false);
    }
  };

  const updateDriverLocation = async (lat: number, lng: number) => {
    if (!user) return;

    try {
      await supabase
        .from('drivers')
        .update({
          current_latitude: lat,
          current_longitude: lng,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  const handleArrivedAtPickup = async () => {
    if (!activeRide) return;

    try {
      // For now, just update local state since there's no specific "arrived" status
      setRideStatus('in_progress');
      Alert.alert('Status Updated', 'You have arrived at the pickup location');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide || !user) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'started',
          start_time: new Date().toISOString(),
        })
        .eq('id', activeRide.id);

      if (error) throw error;

      setRideStatus('in_progress');
      Toast.show({
        type: 'success',
        text1: 'Ride started successfully',
      });
    } catch (error) {
      console.error('Error starting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to start ride',
      });
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide || !user) return;

    Alert.alert(
      'Complete Ride',
      'Confirm ride completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({
                  status: 'completed',
                  end_time: new Date().toISOString(),
                })
                .eq('id', activeRide.id);

              if (error) throw error;

              Toast.show({
                type: 'success',
                text1: 'Ride completed successfully',
              });

              // Navigate to RideDetails with completed booking
              navigation.getParent()?.navigate('RideDetails', { booking: { ...activeRide, status: 'completed' } });
            } catch (error) {
              console.error('Error completing ride:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to complete ride',
              });
            }
          },
        },
      ]
    );
  };

  const handleCallCustomer = () => {
    if (!activeRide?.user?.phone_no) return;
    const phoneNumber = activeRide.user.phone_no;
    Alert.alert(
      'Call Customer',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL('tel:112');
          },
        },
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Are you in an emergency situation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          onPress: () => {
            Linking.openURL('tel:112');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const openMapForNavigation = (location: string, type: 'pickup' | 'dropoff') => {
    if (!activeRide) return;
    
    const address = type === 'pickup' ? activeRide.pickup_address : activeRide.dropoff_address;
    if (!address) return;

    // Encode the address for the Google Maps URL
    const encodedAddress = encodeURIComponent(address);
    
    // Create Google Maps URL with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      Toast.show({
        type: 'error',
        text1: 'Could not open maps app',
      });
    });
  };

  const trackRideLocation = () => {
    if (!activeRide) return;

    // Navigate to ride details screen for tracking
    navigation.getParent()?.navigate('RideDetails', {
      booking: activeRide
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading active ride...</Text>
      </View>
    );
  }

  if (!activeRide) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.noRideContainer}>
          <MaterialIcons name="directions-car" size={60} color={colors.textMuted} />
          <Text style={[styles.noRideTitle, { color: colors.text }]}>No Active Ride</Text>
          <Text style={[styles.noRideText, { color: colors.textSecondary }]}>You don't have any active rides at the moment</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Location Tracking Status */}
      {isLocationTracking && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.locationStatusContainer}>
            <MaterialIcons name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.locationStatusText, { color: colors.text }]}>
              Location tracking active - Updates every 5 seconds
            </Text>
          </View>
        </View>
      )}

      {/* Ride Status */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>Ride Status</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusStep}>
            <View style={[
              styles.statusDot,
              { backgroundColor: rideStatus === 'pickup' ? colors.primary : colors.textMuted }
            ]} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Pickup</Text>
          </View>
          <View style={[styles.statusLine, { backgroundColor: colors.border }]} />
          <View style={styles.statusStep}>
            <View style={[
              styles.statusDot,
              { backgroundColor: rideStatus === 'in_progress' ? colors.primary : colors.textMuted }
            ]} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
          <View style={[styles.statusLine, { backgroundColor: colors.border }]} />
          <View style={styles.statusStep}>
            <View style={[
              styles.statusDot,
              { backgroundColor: rideStatus === 'completed' ? colors.primary : colors.textMuted }
            ]} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Details</Text>
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.customerName, { color: colors.text }]}>{activeRide?.user?.full_name || 'N/A'}</Text>
          <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{activeRide?.user?.phone_no || 'N/A'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callButton, { backgroundColor: colors.primary }]}
          onPress={handleCallCustomer}
        >
          <View style={styles.callButtonContent}>
            <MaterialIcons name="phone" size={16} color="#ffffff" />
            <Text style={styles.callButtonText}>Call Customer</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Ride Details */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Ride Details</Text>

        <View style={styles.rideDetails}>
          <View style={styles.routeContainer}>
            <View style={styles.routeStep}>
              <Text style={styles.pickupDot}>●</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{activeRide?.pickup_address || 'N/A'}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            <View style={styles.routeStep}>
              <Text style={styles.dropDot}>●</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{activeRide?.dropoff_address || 'N/A'}</Text>
            </View>
          </View>

          {/* Location buttons for pickup and dropoff */}
          {/* <View style={styles.locationButtonsContainer}>
            <TouchableOpacity 
              style={[styles.locationButton, styles.pickupButton]}
              onPress={() => openMapForNavigation(activeRide.pickup_address, 'pickup')}
            >
              <MaterialIcons name="location-pin" size={16} color="#16a34a" />
              <Text style={styles.locationButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.locationButton, styles.dropoffButton]}
              onPress={() => openMapForNavigation(activeRide.dropoff_address, 'dropoff')}
            >
              <MaterialIcons name="location-pin" size={16} color="#ef4444" />
              <Text style={styles.locationButtonText}>Navigate to Dropoff</Text>
            </TouchableOpacity>
          </View> */}

          <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Distance:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{activeRide?.distance_km ? `${activeRide.distance_km.toFixed(1)} km` : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{activeRide?.distance_km ? `${Math.round((activeRide.distance_km / 30) * 60)} mins` : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vehicle:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{activeRide?.vehicle_type || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fare:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>₹{activeRide?.fare_amount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Map View */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Live Map</Text>
        <View style={styles.mapContainer}>
          <GoogleMap
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            height={300}
            interactive={false}
          />
          {mapLoading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.mapLoadingText}>Loading map...</Text>
            </View>
          )}
        </View>
      </View>
 {/* Location buttons for pickup and dropoff */}
          <View style={styles.locationButtonsContainer}>
            <TouchableOpacity 
              style={[styles.locationButton, styles.pickupButton]}
              onPress={() => openMapForNavigation(activeRide.pickup_address, 'pickup')}
            >
              <MaterialIcons name="location-pin" size={16} color="#16a34a" />
              <Text style={styles.locationButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.locationButton, styles.dropoffButton]}
              onPress={() => openMapForNavigation(activeRide.dropoff_address, 'dropoff')}
            >
              <MaterialIcons name="location-pin" size={16} color="#ef4444" />
              <Text style={styles.locationButtonText}>Navigate to Dropoff</Text>
            </TouchableOpacity>
          </View>
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {rideStatus === 'pickup' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleArrivedAtPickup}
            >
              <Text style={styles.actionButtonText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          </>
        )}


        {rideStatus === 'in_progress' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleCompleteRide}
            >
              <Text style={styles.actionButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          </>
        )}
 
        {rideStatus === 'completed' && (
          <View style={styles.completedCard}>
            <View style={styles.completedTitleContainer}>
              <MaterialIcons name="check-circle" size={20} color="#166534" />
              <Text style={styles.completedTitle}>Ride Completed</Text>
            </View>
            <Text style={styles.completedText}>
              Payment of ₹{activeRide?.fare_amount?.toFixed(2) || '0.00'} will be credited to your account
            </Text>
          </View>
        )}
      </View>

      {/* Emergency Button */}
      <View style={styles.emergencyContainer}>
        <TouchableOpacity
          style={[styles.emergencyButton, { backgroundColor: colors.error }]}
          onPress={handleEmergency}
        >
          <View style={styles.emergencyButtonContent}>
            <MaterialIcons name="warning" size={18} color="#ffffff" />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDotActive: {
  },
  statusDotInactive: {
  },
  statusText: {
    fontSize: 14,
    color: '#475569',
  },
  statusLine: {
    width: 1,
    height: 20,
    marginVertical: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  callButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  rideDetails: {
    marginBottom: 20,
  },
  routeContainer: {
    marginBottom: 20,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupDot: {
    fontSize: 18,
    color: '#16a34a',
    marginRight: 8,
    fontFamily:'system-ui',
    fontWeight:'900',
    width: 12,
    textAlign: 'center',
  },
  dropDot: {
    fontSize: 18,
    color: '#ef4444',
    fontFamily:'system-ui',
    fontWeight:'900',
    marginRight: 8,
    width: 12,
    textAlign: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  routeLine: {
    height: 20,
    width: 1,
    backgroundColor: '#2563eb',
    marginLeft: 7,
    marginBottom: 8,
    opacity: 0.6,
  },
// Update the location buttons styles in your StyleSheet

// Location buttons
locationButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  margin: 16,
  gap: 8,
},
locationButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  backgroundColor: '#ffffff',
},
pickupButton: {
  borderColor: '#16a34a',
  backgroundColor: '#f0fdf4',
},
dropoffButton: {
  borderColor: '#ef4444',
  backgroundColor: '#fef2f2',
},
locationButtonText: {
  fontSize: 14,
  fontWeight: '500',
  marginLeft: 6,
  color: '#374151',
},
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#2563eb',
  },
  actionButtonSuccess: {
    backgroundColor: '#16a34a',
  },
  actionButtonTrack: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtonTextTrack: {
    color: '#ffffff',
    fontWeight: '600',
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
  },
  completedText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
  },
  emergencyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  noRideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  noRideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  noRideText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  locationStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#0c4a6e',
  },
});