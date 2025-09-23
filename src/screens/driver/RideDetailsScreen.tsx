import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import Toast from 'react-native-toast-message';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Config from 'react-native-config';


// Import types
import { Booking } from '@/types';
import { DriverStackParamList } from '@/types/navigation';

type RideDetailsScreenProps = {
  navigation: StackNavigationProp<DriverStackParamList>;
  route: { params: { booking: Booking } };
};

const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({ route, navigation }) => {
  const { booking } = route.params;
  const user = useUser();

  // Map tracking state
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    coordinates: any[];
  } | null>(null);

  // Google Maps API key
  const GOOGLE_MAPS_APIKEY = Config.GOOGLE_MAPS_API_KEY || 'AIzaSyAejqe2t4TAptcLnkpoFTTNMhm0SFHFJgQ';

  // Refresh map when booking status changes
  useEffect(() => {
    // Force re-render of map component when status changes
    setRouteLoading(true);
    setTimeout(() => setRouteLoading(false), 100);
  }, [booking.status]);

  // Recalculate route when coordinates change
  useEffect(() => {
    if (booking.pickup_latitude && booking.pickup_longitude &&
        booking.dropoff_latitude && booking.dropoff_longitude) {
      console.log('Coordinates changed, recalculating route');
      setRouteLoading(true);
      setRouteInfo(null);
      // The MapViewDirections component will automatically recalculate when coordinates change
    }
  }, [booking.pickup_latitude, booking.pickup_longitude, booking.dropoff_latitude, booking.dropoff_longitude]);

  const calculateDuration = (distanceKm: number): string => {
    const minutes = Math.round((distanceKm / 30) * 60);
    return `${minutes} mins`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'started': return '#10b981';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'Airport Transfer': return '#2563eb';
      case 'Outstation': return '#ca8a04';
      case 'Rental': return '#9333ea';
      default: return '#16a34a';
    }
  };

  const handleAcceptRide = async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'You must be logged in to accept rides',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          driver_id: user.id,
        })
        .eq('id', booking.id);

      if (error) throw error;

      Alert.alert(
        'Ride Accepted',
        `You have accepted the ride from ${booking.user?.full_name || 'Customer'}\nContact: ${booking.user?.phone_no || 'N/A'}${
          booking.user?.whatsapp_phone ? `\nWhatsApp: ${booking.user.whatsapp_phone}` : ''
        }${booking.user?.email ? `\nEmail: ${booking.user.email}` : ''}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error('Error accepting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to accept ride',
      });
    }
  };

 const handleStartRide = async () => {
  if (!user || booking.driver_id !== user.id) {
    Toast.show({
      type: 'error',
      text1: 'You are not authorized to start this ride',
    });
    return;
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'started',
        start_time: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (error) throw error;

    Toast.show({
      type: 'success',
      text1: 'Ride started successfully',
    });
    navigation.navigate('DriverTabs', { screen: 'ActiveRide' });
  } catch (error: any) {
    console.error('Error starting ride:', error);
    
    // Handle RLS policy violation specifically
    if (error.code === '42501') {
      Toast.show({
        type: 'error',
        text1: 'Permission denied. Please contact support.',
      });
    } 
    else {
      Toast.show({
        type: 'error',
        text1: 'Failed to start ride',
      });
    }
  }
};

  const handleCompleteRide = async () => {
    if (!user || booking.driver_id !== user.id) {
      Toast.show({
        type: 'error',
        text1: 'You are not authorized to complete this ride',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Ride completed successfully',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error completing ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to complete ride',
      });
    }
  };

  const handleRejectRide = async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'You must be logged in to reject rides',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Ride cancelled successfully',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to reject ride',
      });
    }
  };

  const renderActionButtons = () => {
    if (booking.driver_id && booking.driver_id !== user?.id) {
      return (
        <View style={styles.actionsContainer}>
          <Text style={styles.assignedText}>Assigned to another driver</Text>
        </View>
      );
    }

    if (booking.driver_id === user?.id) {
      switch (booking.status) {
        case 'accepted':
          return (
            <View style={[styles.actionsContainer, styles.actionsContainerRight]}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonStart]}
                onPress={handleStartRide}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonTextStart]}>Start Ride</Text>
              </TouchableOpacity>
            </View>
          );
        case 'started':
          return (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonComplete]}
                onPress={handleCompleteRide}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonTextComplete]}>Complete Ride</Text>
              </TouchableOpacity>
            </View>
          );
        case 'completed':
          return (
            <View style={styles.actionsContainer}>
             
            </View>
          );
        default:
          return null;
      }
    }

    if (booking.status === 'pending' && !booking.driver_id) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSkip]}
            onPress={handleRejectRide}
          >
            <Text style={styles.actionButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonAccept]}
            onPress={handleAcceptRide}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextAccept]}>Accept Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // Live Map Tracking Component
  const LiveMapTracking = ({
    pickup,
    dropoff,
    isActive
  }: {
    pickup: { lat: number; lng: number; address: string };
    dropoff: { lat: number; lng: number; address: string };
    isActive: boolean;
  }) => {
    // Coordinates validated and ready for map display

    // Ensure coordinates are valid numbers
    const isValidCoordinate = (coord: number) => {
      return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
    };

    if (!isValidCoordinate(pickup.lat) || !isValidCoordinate(pickup.lng) ||
        !isValidCoordinate(dropoff.lat) || !isValidCoordinate(dropoff.lng)) {
      return (
        <View style={styles.mapContainer}>
          <Text style={styles.noDataText}>Map coordinates not available</Text>
        </View>
      );
    }

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
          showsUserLocation={false}
          showsMyLocationButton={false}
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

          {/* Route from pickup to dropoff */}
          {isActive && (
            <MapViewDirections
              origin={{ latitude: pickup.lat, longitude: pickup.lng }}
              destination={{ latitude: dropoff.lat, longitude: dropoff.lng }}
              apikey={'AIzaSyAejqe2t4TAptcLnkpoFTTNMhm0SFHFJgQ'}
              strokeWidth={5}
              strokeColor="#1e40af"
              mode="DRIVING"
              optimizeWaypoints={true}
              precision="high"
              timePrecision="now"
              onReady={result => {
                console.log('Route calculated successfully:', {
                  distance: result.distance,
                  duration: result.duration,
                  coordinates: result.coordinates?.length
                });

                setRouteCoordinates(result.coordinates || []);
                setRouteInfo({
                  distance: result.distance,
                  duration: result.duration,
                  coordinates: result.coordinates || []
                });
                setRouteLoading(false);
              }}
              onError={(errorMessage) => {
                console.error('Route calculation failed:', errorMessage);
                setRouteLoading(false);
                // Fallback: draw straight line if route calculation fails
                setRouteCoordinates([
                  { latitude: pickup.lat, longitude: pickup.lng },
                  { latitude: dropoff.lat, longitude: dropoff.lng }
                ]);
              }}
            />
          )}

          {/* Fallback route line if directions fail */}
          {!isActive && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#1e40af"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Route Information */}
        {routeInfo && isActive && (
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeInfoRow}>
              <MaterialIcons name="directions" size={16} color="#1e40af" />
              <Text style={styles.routeInfoText}>
                Distance: {routeInfo.distance.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.routeInfoRow}>
              <MaterialIcons name="schedule" size={16} color="#1e40af" />
              <Text style={styles.routeInfoText}>
                Duration: {Math.round(routeInfo.duration)} mins
              </Text>
            </View>
          </View>
        )}

        {/* Loading indicator for route calculation */}
        {routeLoading && isActive && (
          <View style={styles.routeLoadingContainer}>
            <Text style={styles.routeLoadingText}>Calculating route...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.serviceTypeBadge, { backgroundColor: getServiceTypeColor(booking.service_type) }]}>
          <Text style={styles.serviceTypeText}>{booking.service_type}</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
       

        {/* Ride Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          <View style={styles.sectionContent}>
            <View style={styles.routeContainer}>
              <View style={styles.routeStep}>
                <Text style={styles.pickupDot}>●</Text>
                <Text style={styles.routeText} numberOfLines={2}>{booking.pickup_address}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeStep}>
                <Text style={styles.dropDot}>●</Text>
                <Text style={styles.routeText} numberOfLines={2}>{booking.dropoff_address}</Text>
              </View>
            </View>

            <View style={styles.rideMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Distance:</Text>
                <Text style={styles.metaValue}>{booking.distance_km ? `${booking.distance_km.toFixed(1)} km` : 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Duration:</Text>
                <Text style={styles.metaValue}>{booking.distance_km ? calculateDuration(booking.distance_km) : 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Fare:</Text>
                <Text style={styles.fareText}>₹{booking.fare_amount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>

            {booking.passengers && booking.passengers > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Passengers:</Text>
                <Text style={styles.detailValue}>{booking.passengers ?? 0}</Text>
              </View>
            )}

            {booking.special_instructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsLabel}>Instructions:</Text>
                <Text style={styles.instructionsText}>{booking.special_instructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Map Tracking Section */}
        {(() => {
          // Enhanced coordinate validation
          const isValidCoordinate = (coord: number | null | undefined) => {
            return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
          };

          const hasValidPickup = isValidCoordinate(booking.pickup_latitude) && isValidCoordinate(booking.pickup_longitude);
          const hasValidDropoff = isValidCoordinate(booking.dropoff_latitude) && isValidCoordinate(booking.dropoff_longitude);

          // Coordinate validation completed successfully

          if (hasValidPickup && hasValidDropoff) {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Route Map</Text>
                <LiveMapTracking
                  pickup={{
                    lat: booking.pickup_latitude!,
                    lng: booking.pickup_longitude!,
                    address: booking.pickup_address || 'Pickup Location'
                  }}
                  dropoff={{
                    lat: booking.dropoff_latitude!,
                    lng: booking.dropoff_longitude!,
                    address: booking.dropoff_address || 'Destination'
                  }}
                  isActive={booking.status === 'started' || booking.status === 'accepted'}
                />
              </View>
            );
          } else {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Route Map</Text>
                <View style={styles.mapContainer}>
                  <Text style={styles.noDataText}>
                    {!hasValidPickup && !hasValidDropoff
                      ? 'Map coordinates not available'
                      : !hasValidPickup
                        ? 'Pickup location coordinates not available'
                        : 'Destination coordinates not available'
                    }
                  </Text>
                </View>
              </View>
            );
          }
        })()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{booking.user?.full_name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{booking.user?.phone_no || 'N/A'}</Text>
            </View>
            {booking.user?.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{booking.user.email}</Text>
              </View>
            )}
            {booking.user?.whatsapp_phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>WhatsApp:</Text>
                <Text style={styles.detailValue}>{booking.user.whatsapp_phone}</Text>
              </View>
            )}
            {booking.review?.rating && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating:</Text>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>{booking.review.rating.toFixed(1)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.sectionContent}>
            {booking.advance_amount && (
              <View style={styles.infoRow}>
                <MaterialIcons name="payments" size={16} color="#3b82f6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Advance Paid</Text>
                  <Text style={styles.infoValue}>₹{booking.advance_amount}</Text>
                </View>
              </View>
            )}

            {booking.remaining_amount && (
              <View style={styles.infoRow}>
                <MaterialIcons name="money-off" size={16} color="#3b82f6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Remaining Amount</Text>
                  <Text style={styles.infoValue}>₹{booking.remaining_amount}</Text>
                </View>
              </View>
            )}

            {booking.payment?.amount_paid && (
              <View style={styles.infoRow}>
                <MaterialIcons name="payment" size={16} color="#3b82f6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Amount Paid</Text>
                  <Text style={styles.infoValue}>₹{booking.payment.amount_paid}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="payment" size={16} color="#3b82f6" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{(booking.payment_method) || 'Not specified'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <View style={[
                styles.paymentStatusBadge,
                booking.payment_status === 'paid' ? styles.paidStatus :
                booking.payment_status === 'pending' ? styles.pendingStatus :
                styles.failedStatus
              ]}>
                <Text style={styles.paymentStatusText}>{(booking.payment_status)}</Text>
              </View>
            </View>

            {booking.payment?.transaction_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transaction ID</Text>
                <Text style={styles.transactionId}>{booking.payment.transaction_id}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  serviceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeDot: {
    fontSize: 12,
    color: '#2563eb',
    marginRight: 8,
    marginTop: 2,
    width: 12,
    textAlign: 'center',
  },
  pickupDot: {
    fontSize: 12,
    color: '#16a34a',
    marginRight: 8,
    marginTop: 2,
    width: 12,
    textAlign: 'center',
  },
  dropDot: {
    fontSize: 12,
    color: '#ef4444',
    marginRight: 8,
    marginTop: 2,
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
    backgroundColor: '#e2e8f0',
    marginLeft: 5,
    marginBottom: 8,
  },
  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  instructionsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  instructionsLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e293b',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  actionsContainerRight: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSkip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionButtonAccept: {
    flex: 2,
    backgroundColor: '#16a34a',
  },
  actionButtonStart: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  actionButtonComplete: {
    flex: 1,
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  actionButtonTextAccept: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButtonTextStart: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButtonTextComplete: {
    color: '#ffffff',
    fontWeight: '600',
  },
  assignedText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  completedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidStatus: {
    backgroundColor: '#dcfce7',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  failedStatus: {
    backgroundColor: '#fee2e2',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  transactionId: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  // Map styles
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
  noDataText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 16,
  },
  routeInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
    fontWeight: '500',
  },
  routeLoadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  routeLoadingText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
});

export default RideDetailsScreen;