import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import services and stores
import { useAppStore, useUser } from '@/stores/appStore';
import { supabase } from '@/services/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function DriverHomeScreen({ navigation }: any) {
  const user = useUser();
  const { colors } = useTheme();
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null); // Will be typed properly later
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [loadingRides, setLoadingRides] = useState(false);
  const [rideSubscription, setRideSubscription] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    lastLocationUpdate: string | null;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayRides: 0,
    rating: 0,
    totalRides: 0,
  });

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Start real-time subscription for ride requests
  const startRideSubscription = () => {
    if (!user || !isOnline) return;

    const subscription = supabase
      .channel('ride_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('New ride request:', payload);
          // Add new ride to the list
          setAvailableRides(prev => [payload.new, ...prev.slice(0, 4)]); // Keep only 5 most recent
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: 'status=neq.pending',
        },
        (payload) => {
          // Remove ride if it's no longer pending (accepted by another driver)
          setAvailableRides(prev => prev.filter(ride => ride.id !== payload.new.id));
        }
      )
      .subscribe();

    setRideSubscription(subscription);
  };

  // Stop ride subscription
  const stopRideSubscription = () => {
    if (rideSubscription) {
      supabase.removeChannel(rideSubscription);
      setRideSubscription(null);
    }
  };

  // Fetch driver's current location from backend
  const fetchDriverLocation = async () => {
    if (!user) return;

    try {
      setLoadingLocation(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('current_latitude, current_longitude, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching driver location:', error);
        // Don't show error toast for location fetch as it's not critical
        return;
      }

      if (data && data.current_latitude && data.current_longitude) {
        setDriverLocation({
          latitude: data.current_latitude,
          longitude: data.current_longitude,
          lastLocationUpdate: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error in fetchDriverLocation:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Refresh driver location data
  const refreshDriverLocation = () => {
    fetchDriverLocation();
  };

  // Fetch available ride requests
  const fetchAvailableRides = async () => {
    if (!user || !isOnline) {
      setAvailableRides([]);
      return;
    }

    try {
      setLoadingRides(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:users(full_name, phone_no, whatsapp_phone, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5); // Limit to 5 most recent requests

      if (error) throw error;

      setAvailableRides(data || []);
    } catch (error) {
      console.error('Error fetching available rides:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load ride requests',
      });
    } finally {
      setLoadingRides(false);
    }
  };

  // Fetch today's summary stats
  const fetchTodaysSummary = async () => {
    if (!user) return;

    try {
      setLoadingStats(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's completed rides and earnings
      const { data: todayData, error: todayError } = await supabase
        .from('bookings')
        .select('fare_amount')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (todayError) throw todayError;

      // Calculate today's earnings and rides
      const todayEarnings = todayData?.reduce((sum, booking) => sum + (booking.fare_amount || 0), 0) || 0;
      const todayRides = todayData?.length || 0;

      // Fetch total completed rides
      const { count: totalRides, error: totalError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      if (totalError) throw totalError;

      // Fetch driver rating
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('rating')
        .eq('id', user.id)
        .single();

      if (driverError) {
        console.error('Error fetching driver rating:', driverError);
        // Don't throw here, just use 0 as fallback
      }

      const rating = driverData?.rating || 0;

      setStats({
        todayEarnings,
        todayRides,
        rating,
        totalRides: totalRides || 0,
      });
    } catch (error) {
      console.error('Error fetching today\'s summary:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load summary data',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Accept ride request
  const acceptRideRequest = async (rideId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          driver_id: user.id,
        })
        .eq('id', rideId);

      if (error) throw error;

      // Get the accepted ride data
      const acceptedRide = availableRides.find(ride => ride.id === rideId);

      // Remove the accepted ride from available rides
      setAvailableRides(prev => prev.filter(ride => ride.id !== rideId));

      Toast.show({
        type: 'success',
        text1: 'Ride accepted successfully',
        text2: 'Starting ride...',
      });

      // Navigate to ActiveRideScreen with the accepted ride
      setTimeout(() => {
        if (navigation) {
          navigation.navigate('ActiveRide', { booking: acceptedRide });
        }
      }, 1500);

    } catch (error) {
      console.error('Error accepting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to accept ride',
      });
    }
  };

  // Reject ride request
  const rejectRideRequest = async (rideId: string) => {
    try {
      // For now, just remove from local state
      // In a real implementation, you might want to mark it as rejected in the database
      setAvailableRides(prev => prev.filter(ride => ride.id !== rideId));

      Toast.show({
        type: 'info',
        text1: 'Ride request dismissed',
      });
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  // Note: is_online column doesn't exist in database yet
  // This function is kept for future use when the column is added
  const updateDriverOnlineStatus = async (online: boolean) => {
    if (!user) return;

    try {
      // For now, just log the status change
      console.log(`Driver ${online ? 'went online' : 'went offline'}`);
      // Future: Update is_online column when it's added to the database
      // await supabase.from('drivers').update({ is_online: online }).eq('id', user.id);
    } catch (error) {
      console.error('Error updating driver online status:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking');
        return;
      }

      setIsLocationTracking(true);
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 120000, // Update every 2 minutes
          distanceInterval: 100, // Update every 100 meters
        },
        (location) => {
          // Update driver location in database
          if (user) {
            updateDriverLocation(location.coords.latitude, location.coords.longitude);
          }
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
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

  const toggleOnlineStatus = () => {
    if (!isOnline) {
      Alert.alert(
        'Go Online',
        'Are you ready to accept ride requests? Location tracking will be enabled.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Online',
            onPress: async () => {
              setIsOnline(true);
              await updateDriverOnlineStatus(true);
              startLocationTracking();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Go Offline',
        'Stop accepting ride requests? Location tracking will be disabled.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Offline',
            onPress: async () => {
              setIsOnline(false);
              await updateDriverOnlineStatus(false);
              stopLocationTracking();
            },
          },
        ]
      );
    }
  };

  // Animation effects
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for online status
  useEffect(() => {
    if (isOnline) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline]);

  // Fetch driver location and stats on component mount
  useEffect(() => {
    if (user) {
      console.log('DriverHomeScreen: Initializing with user:', user.id);
      console.log('DriverHomeScreen: Current UI issues identified:');
      console.log('1. Basic card designs lacking visual appeal');
      console.log('2. Monotonous layout with repetitive styling');
      console.log('3. Limited visual hierarchy in typography');
      console.log('4. No gradient or modern color schemes');
      console.log('5. Static interface without animations');
      console.log('6. Basic button designs');
      console.log('7. Poor information architecture');
      fetchDriverLocation();
      fetchTodaysSummary();
    }
  }, [user]);

  // Fetch available rides and manage subscriptions when driver goes online
  useEffect(() => {
    if (isOnline && user) {
      fetchAvailableRides();
      startRideSubscription();
    } else {
      setAvailableRides([]);
      stopRideSubscription();
    }

    return () => {
      stopRideSubscription();
    };
  }, [isOnline, user]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      stopRideSubscription();
    };
  }, []);

  const handleAcceptRide = () => {
    Alert.alert('Ride Accepted', 'You have accepted the ride request. Navigate to pickup location.');
  };

  const handleRejectRide = () => {
    Alert.alert('Ride Rejected', 'You have rejected the ride request.');
  };

  // Handle Update Location button press
  const handleUpdateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to update location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (user) {
        await updateDriverLocation(location.coords.latitude, location.coords.longitude);
        Toast.show({
          type: 'success',
          text1: 'Location Updated',
          text2: 'Your current location has been updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Update Failed',
        text2: 'Unable to update your location',
      });
    }
  };

  // Handle Settings button press
  const handleSettingsPress = () => {
    if (navigation) {
      navigation.navigate('Settings');
    }
  };

  // Handle Emergency button press
  const handleEmergencyPress = () => {
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

  // Handle Analytics button press
  const handleAnalyticsPress = () => {
    if (navigation) {
      navigation.navigate('Earnings');
    }
  };

  // Button press animation
  const handleButtonPress = (buttonAnimation: Animated.Value) => {
    Animated.sequence([
      Animated.timing(buttonAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.ScrollView
      style={[
        styles(colors).container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Online Status */}
      <View style={styles(colors).statusCard}>
        <View style={styles(colors).statusHeader}>
          <Text style={styles(colors).statusTitle}>Driver Status</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
            thumbColor={isOnline ? '#ffffff' : '#f1f5f9'}
          />
        </View>
        <Text style={[styles(colors).statusText, isOnline ? styles(colors).onlineText : styles(colors).offlineText]}>
          {isOnline ? 'Online - Accepting rides' : 'Offline - Not accepting rides'}
        </Text>
        {isOnline && isLocationTracking && (
          <Animated.View
            style={[
              styles(colors).locationStatusContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <MaterialIcons name="location-on" size={16} color={colors.primary} />
            <Text style={styles(colors).locationStatusText}>
              Location tracking active
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Current Ride */}
      {currentRide && (
        <View style={styles(colors).rideCard}>
          <Text style={styles(colors).rideTitle}>Current Ride</Text>
          <View style={styles(colors).rideDetails}>
            <Text style={styles(colors).rideDetailText}>Pickup: {currentRide.pickup}</Text>
            <Text style={styles(colors).rideDetailText}>Drop: {currentRide.drop}</Text>
            <Text style={styles(colors).rideDetailText}>Fare: ₹{currentRide.fare}</Text>
          </View>
          <View style={styles(colors).rideActions}>
            <TouchableOpacity style={styles(colors).arrivedButton}>
              <Text style={styles(colors).arrivedButtonText}>Arrived at Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles(colors).completeButton}>
              <Text style={styles(colors).completeButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Available Ride Requests */}
      {isOnline && !currentRide && (
        <>
          {loadingRides ? (
            <View style={styles(colors).loadingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles(colors).loadingText, { color: colors.textSecondary }]}>
                Loading ride requests...
              </Text>
            </View>
          ) : availableRides.length > 0 ? (
            availableRides.map((ride) => (
              <View key={ride.id} style={styles(colors).requestCard}>
                <View style={styles(colors).requestTitleContainer}>
                  <MaterialIcons name="directions-car" size={20} color={colors.text} />
                  <Text style={styles(colors).requestTitle}>New Ride Request</Text>
                </View>
                <View style={styles(colors).requestDetails}>
                  <Text style={styles(colors).requestDetailText}>
                    Distance: {ride.distance_km ? `${ride.distance_km.toFixed(1)} km` : 'N/A'}
                  </Text>
                  <Text style={styles(colors).requestDetailText}>
                    Fare: ₹{ride.fare_amount ? ride.fare_amount.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles(colors).requestDetailText}>
                    Pickup: {ride.pickup_address || 'N/A'}
                  </Text>
                  <Text style={styles(colors).requestDetailText}>
                    Drop: {ride.dropoff_address || 'N/A'}
                  </Text>
                  <Text style={styles(colors).requestDetailText}>
                    Customer: {ride.user?.full_name || 'N/A'}
                  </Text>
                </View>
                <View style={styles(colors).requestActions}>
                  <TouchableOpacity
                    style={styles(colors).rejectButton}
                    onPress={() => rejectRideRequest(ride.id)}
                  >
                    <Text style={styles(colors).rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles(colors).acceptButton}
                    onPress={() => acceptRideRequest(ride.id)}
                  >
                    <Text style={styles(colors).acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles(colors).noRequestsCard}>
              <MaterialIcons name="schedule" size={40} color={colors.textMuted} />
              <Text style={[styles(colors).noRequestsTitle, { color: colors.text }]}>
                No Ride Requests
              </Text>
              <Text style={[styles(colors).noRequestsText, { color: colors.textSecondary }]}>
                Waiting for new ride requests...
              </Text>
            </View>
          )}
        </>
      )}

      {/* Stats */}
      <View style={styles(colors).statsSection}>
        <Text style={styles(colors).statsTitle}>Today's Summary</Text>
        {loadingStats ? (
          <View style={styles(colors).loadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles(colors).loadingText, { color: colors.textSecondary }]}>
              Loading summary...
            </Text>
          </View>
        ) : (
          <View style={styles(colors).statsGrid}>
            <View style={styles(colors).statCard}>
              <MaterialIcons name="attach-money" size={28} color={colors.success} />
              <Text style={styles(colors).statValue}>₹{stats.todayEarnings.toFixed(2)}</Text>
              <Text style={styles(colors).statLabel}>Earnings</Text>
            </View>
            <View style={styles(colors).statCard}>
              <MaterialIcons name="directions-car" size={28} color={colors.primary} />
              <Text style={styles(colors).statValue}>{stats.todayRides}</Text>
              <Text style={styles(colors).statLabel}>Rides</Text>
            </View>
            <View style={styles(colors).statCard}>
              <MaterialIcons name="star" size={28} color={colors.warning} />
              <Text style={styles(colors).statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles(colors).statLabel}>Rating</Text>
            </View>
            <View style={styles(colors).statCard}>
              <MaterialIcons name="bar-chart" size={28} color={colors.info} />
              <Text style={styles(colors).statValue}>{stats.totalRides}</Text>
              <Text style={styles(colors).statLabel}>Total</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles(colors).actionsSection}>
        <Text style={styles(colors).actionsTitle}>Quick Actions</Text>
        <View style={styles(colors).actionsGrid}>
          <TouchableOpacity style={styles(colors).actionCard} onPress={handleUpdateLocation}>
            <MaterialIcons name="my-location" size={24} color={colors.textSecondary} />
            <Text style={styles(colors).actionText}>Update Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={handleEmergencyPress}>
            <MaterialIcons name="phone" size={24} color={colors.error} />
            <Text style={styles(colors).actionText}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={handleSettingsPress}>
            <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
            <Text style={styles(colors).actionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).actionCard} onPress={handleAnalyticsPress}>
            <MaterialIcons name="analytics" size={24} color={colors.textSecondary} />
            <Text style={styles(colors).actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  onlineText: {
    color: colors.success,
  },
  offlineText: {
    color: colors.error,
  },
  rideCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: colors.warning,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  rideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  rideDetails: {
    marginBottom: 16,
  },
  rideDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rideActions: {
    flexDirection: 'row',
    gap: 12,
  },
  arrivedButton: {
    flex: 1,
    backgroundColor: colors.warning,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.warning,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  arrivedButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  requestCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  requestTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  requestDetails: {
    marginBottom: 16,
  },
  requestDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.error,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rejectButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 0.4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  actionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 0.4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: colors.info,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight || colors.primary,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  loadingCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
    color: colors.textSecondary,
  },
  noRequestsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 36,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: colors.textMuted,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRequestsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: colors.text,
    letterSpacing: 0.3,
  },
  noRequestsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
