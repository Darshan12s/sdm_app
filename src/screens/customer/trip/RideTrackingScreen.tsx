import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  Modal,
  Share,
  Image,
} from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import { Booking } from '@/types';
import { CustomerStackParamList } from '@/types/navigation';
import Toast from 'react-native-toast-message';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Config from 'react-native-config';

// Import theme
import { useTheme } from '../../../contexts/ThemeContext';

// Add your Google Maps API key here
const GOOGLE_MAPS_APIKEY = Config.GOOGLE_MAPS_API_KEY || 'AIzaSyC4Rx2LbWL5F2ilbio1WNaNEb-hS_focwg';


interface ActiveBooking {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  fare_amount: number;
  status: string;
  created_at: string;
  start_time: string;
  vehicle_type: string;
  driver_id: string;
  vehicle_id: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
}

interface Driver {
  id: string;
  license_number: string;
  current_latitude: number;
  current_longitude: number;
  status: string;
  rating: number;
  total_rides: number;
}

interface DriverUser {
  full_name: string;
  phone_no: string;
  profile_picture_url?: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  type?: string;
}

type RideTrackingScreenProps = {
  navigation: StackNavigationProp<CustomerStackParamList>;
  route: { params: { bookingId: string; driverId: string; vehicleId: string } };
};

const RideTrackingScreen: React.FC<RideTrackingScreenProps> = ({ route }) => {
  const { colors } = useTheme();
  const user = useUser();
  const { bookingId, driverId, vehicleId } = route.params;
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverUser, setDriverUser] = useState<DriverUser | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveRide();
    }
  }, [user]);

  useEffect(() => {
    // Set up real-time subscription for driver location updates
    if (driverId) {
      const driverSubscription = supabase
        .channel('driver-location-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`
        }, (payload) => {
          setDriver(payload.new as Driver);
        })
        .subscribe();

      return () => {
        driverSubscription.unsubscribe();
      };
    }
  }, [driverId]);

  const handleCancelRide = async () => {
    if (!activeBooking || !cancelReason.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a cancellation reason' });
      return;
    }

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancelReason.trim()
        })
        .eq('id', activeBooking.id);

      if (bookingError) throw bookingError;

      const { error: cancellationError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: activeBooking.id,
          user_id: user?.id,
          reason: cancelReason.trim()
        });

      if (cancellationError) throw cancellationError;

      Toast.show({ type: 'success', text1: 'Ride cancelled successfully' });
      setCancelDialogOpen(false);
      setCancelReason('');
      setActiveBooking(null);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Toast.show({ type: 'error', text1: 'Failed to cancel ride' });
    }
  };

  const fetchActiveRide = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setActiveBooking(bookingData);

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, phone_no, profile_picture_url')
        .eq('id', driverId)
        .single();

      if (userError) throw userError;
      setDriverUser(userData);

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle({
        id: vehicleData.id,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        license_plate: vehicleData.license_plate,
        color: vehicleData.color,
        type: vehicleData.type || 'Standard'
      });
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Toast.show({ type: 'error', text1: 'Failed to load ride tracking information' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return { backgroundColor: colors.info + '20', color: colors.info, borderColor: colors.info + '50' };
      case 'started':
        return { backgroundColor: colors.success + '20', color: colors.success, borderColor: colors.success + '50' };
      case 'pending':
        return { backgroundColor: colors.warning + '20', color: colors.warning, borderColor: colors.warning + '50' };
      case 'completed':
        return { backgroundColor: colors.success + '20', color: colors.success, borderColor: colors.success + '50' };
      default:
        return { backgroundColor: colors.textMuted + '20', color: colors.textMuted, borderColor: colors.textMuted + '50' };
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCallDriver = () => {
    if (driverUser?.phone_no) {
      Alert.alert(
        'Call Driver',
        `Call ${driverUser.full_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${driverUser.phone_no}`) }
        ]
      );
    }
  };

  const handleMessageDriver = () => {
    if (driverUser?.phone_no) {
      Alert.alert(
        'Message Driver',
        `Send message to ${driverUser.full_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Message', onPress: () => Linking.openURL(`sms:${driverUser.phone_no}`) }
        ]
      );
    }
  };

  const handleWhatsAppDriver = () => {
    if (driverUser?.phone_no) {
      const phoneNumber = driverUser.phone_no.replace(/\D/g, '');
      const url = `whatsapp://send?phone=${phoneNumber}`;
      
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert(
              'WhatsApp Not Installed',
              'WhatsApp is not installed on your device. Please install it to message the driver.',
              [{ text: 'OK' }]
            );
          }
        })
        .catch((error) => {
          console.error('Error opening WhatsApp:', error);
          Toast.show({ type: 'error', text1: 'Failed to open WhatsApp' });
        });
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Support',
      'Call emergency support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+911234567890') }
      ]
    );
  };

  const handleShareTrip = async () => {
    try {
      const message = `I'm currently on a ride with ${driverUser?.full_name || 'my driver'}. 
      Pickup: ${activeBooking?.pickup_address}
      Destination: ${activeBooking?.dropoff_address}
      Vehicle: ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate})
      Driver: ${driverUser?.full_name} (${driverUser?.phone_no})`;

      await Share.share({
        message,
        title: 'My Ride Details'
      });
    } catch (error) {
      console.error('Error sharing trip:', error);
    }
  };

  const LiveMapTracking = ({ 
    pickup, 
    dropoff, 
    driverLocation,
    isActive 
  }: {
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    driverLocation?: { lat: number; lng: number };
    isActive: boolean;
  }) => {
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    
    const region = {
      latitude: (pickup.lat + dropoff.lat) / 2,
      longitude: (pickup.lng + dropoff.lng) / 2,
      latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 1.5 + 0.01,
      longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 1.5 + 0.01,
    };

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapTypeSelector}>
          <TouchableOpacity 
            style={[styles.mapTypeButton, mapType === 'standard' && styles.mapTypeButtonActive]}
            onPress={() => setMapType('standard')}
          >
            <Text style={[styles.mapTypeText, mapType === 'standard' && styles.mapTypeTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapTypeButton, mapType === 'satellite' && styles.mapTypeButtonActive]}
            onPress={() => setMapType('satellite')}
          >
            <Text style={[styles.mapTypeText, mapType === 'satellite' && styles.mapTypeTextActive]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
        
        <MapView 
          style={styles.map} 
          region={region}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          zoomEnabled={true}
          zoomControlEnabled={true}
        >
          {/* Pickup Marker */}
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup Location"
            description={pickup.address}
          >
            <View style={styles.marker}>
              <MaterialIcons name="location-pin" size={32} color="#10b981" />
            </View>
          </Marker>
          
          {/* Dropoff Marker */}
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title="Destination"
            description={dropoff.address}
          >
            <View style={styles.marker}>
              <MaterialIcons name="location-pin" size={32} color="#ef4444" />
            </View>
          </Marker>

          {/* Driver Marker */}
          {driverLocation && (
            <Marker
              coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
              title="Driver"
              description={driverUser?.full_name}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <MaterialIcons name="directions-car" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Route from pickup to dropoff */}
          {isActive && (
            <MapViewDirections
              origin={{ latitude: pickup.lat, longitude: pickup.lng }}
              destination={{ latitude: dropoff.lat, longitude: dropoff.lng }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={4}
              strokeColor="#1e40af"
              mode="DRIVING"
              onReady={(result: any) => {
                setRouteCoords(result.coordinates);
              }}
              onError={(errorMessage: string) => {
                console.log('Directions error:', errorMessage);
                // Fallback to straight line if directions API fails
                setRouteCoords([
                  { latitude: pickup.lat, longitude: pickup.lng },
                  { latitude: dropoff.lat, longitude: dropoff.lng }
                ]);
              }}
            />
          )}

          {/* Route from driver to pickup (if driver is en route) */}
          {isActive && driverLocation && (
            <MapViewDirections
              origin={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
              destination={{ latitude: pickup.lat, longitude: pickup.lng }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={3}
              strokeColor="#3b82f6"
              mode="DRIVING"
              onError={(errorMessage: string) => {
                console.log('Driver to pickup directions error:', errorMessage);
                // Fallback to straight line if directions API fails
              }}
            />
          )}
        </MapView>
      </View>
    );
  };

  const VehicleDriverDetails = ({ 
    vehicle, 
    driver, 
    driverUser 
  }: {
    vehicle: Vehicle | null;
    driver: Driver | null;
    driverUser: DriverUser | null;
  }) => {
    if (!driver || !driverUser) {
      return (
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Driver Information</Text>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>Driver details not available yet</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Driver Section */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Your Driver</Text>
          <View style={styles.driverInfo}>
            {driverUser.profile_picture_url ? (
              <Image 
                source={{ uri: driverUser.profile_picture_url }} 
                style={styles.driverAvatar}
              />
            ) : (
              <View style={styles.driverAvatar}>
                <MaterialIcons name="person" size={24} color="#3b82f6" />
              </View>
            )}
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: colors.text }]}>{driverUser.full_name}</Text>
              <Text style={[styles.driverRating, { color: colors.textSecondary }]}>
                ★ {driver.rating?.toFixed(1) || '5.0'} • {driver.total_rides || 0} trips
              </Text>
              <Text style={[styles.driverLicense, { color: colors.textSecondary }]}>License: {driver.license_number}</Text>
            </View>
          </View>
          
          <View style={styles.driverActions}>
            <TouchableOpacity
              style={[styles.driverActionButton, { borderColor: colors.border }]}
              onPress={handleCallDriver}
            >
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <Text style={[styles.driverActionText, { color: colors.textSecondary }]}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.driverActionButton, { borderColor: colors.border }]}
              onPress={handleMessageDriver}
            >
              <MaterialIcons name="message" size={20} color={colors.primary} />
              <Text style={[styles.driverActionText, { color: colors.textSecondary }]}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.driverActionButton, { borderColor: colors.border }]}
              onPress={handleWhatsAppDriver}
            >
              <FontAwesome name="whatsapp" size={20} color="#25D366" />
              <Text style={[styles.driverActionText, { color: colors.textSecondary }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Section */}
        {vehicle && (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Your Vehicle</Text>
            <Text style={[styles.vehicleSubHeader, { color: colors.textSecondary }]}>Vehicle</Text>
            <Text style={[styles.vehicleModel, { color: colors.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={[styles.vehicleDetails, { color: colors.textSecondary }]}>
              {vehicle.year} • {vehicle.color}
            </Text>

            <View style={styles.licensePlateContainer}>
              <Text style={[styles.licensePlateLabel, { color: colors.textSecondary }]}>License Plate</Text>
              <Text style={[styles.licensePlate, { color: colors.text }]}>{vehicle.license_plate}</Text>
            </View>

            <View style={styles.vehicleTypeContainer}>
              <View style={[styles.vehicleTypeBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.vehicleTypeText, { color: colors.primary }]}>{vehicle.type || 'Standard'}</Text>
              </View>
            </View>

            <Text style={[styles.lookForVehicle, { color: colors.primary }]}>Look for this vehicle</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ride Tracking</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ride Tracking</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track your current ride in real-time</Text>
      </View>

      <ScrollView style={styles.content}>
        {!activeBooking ? (
          <View style={[styles.noRideCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <MaterialIcons name="navigation" size={48} color={colors.textSecondary} />
            <Text style={[styles.noRideTitle, { color: colors.text }]}>No active rides</Text>
            <Text style={[styles.noRideText, { color: colors.textSecondary }]}>You don't have any active rides to track</Text>
          </View>
        ) : (
          <View style={styles.rideContainer}>
            {/* Live Map Tracking */}
            {activeBooking.pickup_latitude && activeBooking.pickup_longitude &&
             activeBooking.dropoff_latitude && activeBooking.dropoff_longitude && (
              <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Live Route Tracking</Text>
                <LiveMapTracking
                  pickup={{
                    lat: activeBooking.pickup_latitude,
                    lng: activeBooking.pickup_longitude,
                    address: activeBooking.pickup_address
                  }}
                  dropoff={{
                    lat: activeBooking.dropoff_latitude,
                    lng: activeBooking.dropoff_longitude,
                    address: activeBooking.dropoff_address
                  }}
                  driverLocation={
                    driver?.current_latitude && driver?.current_longitude
                      ? {
                          lat: driver.current_latitude,
                          lng: driver.current_longitude
                        }
                      : undefined
                  }
                  isActive={activeBooking.status === 'started' || activeBooking.status === 'accepted'}
                />
              </View>
            )}

            {/* Vehicle & Driver Information - Moved before Current Ride */}
            <VehicleDriverDetails 
              vehicle={vehicle}
              driver={driver}
              driverUser={driverUser}
            />

            {/* Ride Status */}
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Current Ride</Text>
                <View style={[styles.statusBadge, getStatusColor(activeBooking.status)]}>
                  <Text style={[styles.statusText, { color: getStatusColor(activeBooking.status).color }]}>
                    {activeBooking.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.rideDetails}>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.success} />
                  <View style={styles.locationText}>
                    <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Pickup Location</Text>
                    <Text style={[styles.locationValue, { color: colors.text }]}>{activeBooking.pickup_address}</Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.error} />
                  <View style={styles.locationText}>
                    <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Destination</Text>
                    <Text style={[styles.locationValue, { color: colors.text }]}>{activeBooking.dropoff_address}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Booking Time: </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatTime(activeBooking.created_at)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="directions-car" size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle Type: </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{activeBooking.vehicle_type || 'Standard'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="attach-money" size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Fare: </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>₹{activeBooking.fare_amount?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={handleEmergencyCall}
                >
                  <MaterialIcons name="phone" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Emergency Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={handleShareTrip}
                >
                  <MaterialIcons name="person" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Share Trip Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
                  onPress={() => setCancelDialogOpen(true)}
                >
                  <MaterialIcons name="cancel" size={20} color={colors.error} />
                  <Text style={[styles.actionText, styles.cancelText, { color: colors.error }]}>Cancel Ride</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cancel Ride Modal */}
      <Modal
        visible={cancelDialogOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelDialogOpen(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modal }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cancel Ride</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Are you sure you want to cancel this ride? Please provide a reason for cancellation.
            </Text>

            <TextInput
              style={[styles.reasonInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Please provide a reason for cancellation..."
              placeholderTextColor={colors.inputPlaceholder}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline={true}
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setCancelDialogOpen(false);
                  setCancelReason('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Keep Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmCancelButton, { backgroundColor: colors.error }]}
                onPress={handleCancelRide}
              >
                <Text style={[styles.modalButtonText, styles.confirmCancelText, { color: colors.surface }]}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  noRideText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  rideContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rideDetails: {
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  locationValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  driverLicense: {
    fontSize: 12,
    color: '#64748b',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  driverActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  driverActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleSubHeader: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  licensePlateContainer: {
    marginBottom: 16,
  },
  licensePlateLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  vehicleTypeContainer: {
    marginBottom: 16,
  },
  vehicleTypeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  lookForVehicle: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mapTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  mapTypeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
  mapTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  mapTypeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  mapTypeTextActive: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  marker: {
    padding: 4,
  },
  driverMarker: {
    backgroundColor: '#3b82f6',
    padding: 6,
    borderRadius: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  cancelButton: {
    borderColor: '#fecaca',
  },
  cancelText: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmCancelButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  confirmCancelText: {
    color: '#fff',
  },
});

export default RideTrackingScreen;