import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '@/services/supabase/client';
import Toast from 'react-native-toast-message';
import { useUser } from '@/stores/appStore';

// Import theme
import { useTheme } from '@/contexts/ThemeContext';

// Import types
import { DriverStackParamList } from '@/types/navigation';

// Use the global Booking type instead of local interface
import { Booking } from '@/types';

type AvailableRidesScreenProps = {
  navigation: StackNavigationProp<DriverStackParamList>;
};

export default function AvailableRidesScreen({ navigation }: AvailableRidesScreenProps) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [availableRides, setAvailableRides] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled'>('all');
  const user = useUser();

  useEffect(() => {
    fetchRides(activeTab);
  }, [activeTab, user]);

  const fetchRides = async (tab: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('bookings')
        .select(`
          *,
          user:users(full_name, phone_no, profile_picture_url, email, whatsapp_phone),
          driver:drivers(rating, total_rides),
          review:reviews(rating, comment)
        `)
        .order('created_at', { ascending: false });

      // Filter based on tab
      switch (tab) {
        case 'pending':
          query = query.eq('status', 'pending');
          break;
        case 'accepted':
          query = query.eq('status', 'accepted').eq('driver_id', user?.id);
          break;
        case 'started':
          query = query.eq('status', 'started').eq('driver_id', user?.id);
          break;
        case 'completed':
          query = query.eq('status', 'completed').eq('driver_id', user?.id);
          break;
        case 'cancelled':
          query = query.eq('status', 'cancelled').eq('driver_id', user?.id);
          break;
        case 'all':
        default:
          query = query.in('status', ['pending', 'accepted', 'started', 'completed', 'cancelled']);
          break;
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      const ridesWithTimeAgo = bookingsData?.map(booking => ({
        ...booking,
        requestedAt: calculateTimeAgo(booking.updated_at || booking.created_at),
      })) || [];

      setAvailableRides(ridesWithTimeAgo);
    } catch (error) {
      console.error(`Error fetching ${tab} rides:`, error);
      Toast.show({
        type: 'error',
        text1: `Failed to load ${tab} rides`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateTimeAgo = (dateString: string): string => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const calculateDuration = (distanceKm: number): string => {
    const minutes = Math.round((distanceKm / 30) * 60);
    return `${minutes} mins`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides(activeTab);
  };

  const handleAcceptRide = async (ride: Booking) => {
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
        .eq('id', ride.id);

      if (error) throw error;

      Alert.alert(
        'Ride Accepted',
        `You have accepted the ride from ${ride.user?.full_name || 'Customer'}\nContact: ${ride.user?.phone_no || 'N/A'}${
          ride.user?.whatsapp_phone ? `\nWhatsApp: ${ride.user.whatsapp_phone}` : ''
        }${ride.user?.email ? `\nEmail: ${ride.user.email}` : ''}`,
        [{ text: 'OK', onPress: () => fetchRides(activeTab) }],
      );
    } catch (error) {
      console.error('Error accepting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to accept ride',
      });
    }
  };

  const handleStartRide = async (ride: Booking) => {
    if (!user || ride.driver_id !== user.id) {
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
        .eq('id', ride.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Ride started successfully',
      });
      fetchRides(activeTab);
    } catch (error) {
      console.error('Error starting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to start ride',
      });
    }
  };

  const handleCompleteRide = async (ride: Booking) => {
    if (!user || ride.driver_id !== user.id) {
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
        .eq('id', ride.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Ride completed successfully',
      });
      fetchRides(activeTab);
    } catch (error) {
      console.error('Error completing ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to complete ride',
      });
    }
  };

  const handleRejectRide = async (rideId: string) => {
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
        .eq('id', rideId);

      if (error) throw error;

      setAvailableRides(prev => prev.filter(ride => ride.id !== rideId));
      Toast.show({
        type: 'success',
        text1: 'Ride cancelled successfully',
      });
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to reject ride',
      });
    }
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

  const renderActionButtons = (ride: Booking) => {
    if (ride.driver_id && ride.driver_id !== user?.id) {
      return (
        <View style={styles.actionsContainer}>
          <Text style={styles.assignedText}>Assigned to another driver</Text>
        </View>
      );
    }

    if (ride.driver_id === user?.id) {
      switch (ride.status) {
        case 'accepted':
          return (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                // style={[styles.actionButton, styles.actionButtonStart]}
                onPress={() => handleStartRide(ride)}
              >
                {/* <Text style={[styles.actionButtonText, styles.actionButtonTextStart]}>Start Ride</Text> */}
              </TouchableOpacity>
            </View>
          );
        case 'started':
          return (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                // style={[styles.actionButton, styles.actionButtonComplete]}
                onPress={() => handleCompleteRide(ride)}
              >
                {/* <Text style={[styles.actionButtonText, styles.actionButtonTextComplete]}>Complete Ride</Text> */}
              </TouchableOpacity>
            </View>
          );
        case 'completed':
           return null;
        default:
          return null;
      }
    }

    if (ride.status === 'pending' && !ride.driver_id) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSkip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleRejectRide(ride.id)}
          >
            <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonAccept, { backgroundColor: colors.success }]}
            onPress={() => handleAcceptRide(ride)}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextAccept]}>Accept Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderRideDetails = (ride: Booking) => {
    return (
      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => navigation.navigate('RideDetails', { booking: ride })}
      >
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {['all', 'pending', 'accepted', 'started', 'completed', 'cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, { backgroundColor: colors.card }, activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary }]]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && [styles.activeTabText, { color: colors.surface }]]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Rides</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {availableRides.length > 0 ? (
          <View style={styles.ridesList}>
            {availableRides.map(ride => (
              <View key={ride.id} style={[styles.rideCard, { backgroundColor: colors.card }]}>
                <View style={styles.rideHeader}>
                  <View style={styles.rideHeaderLeft}>
                     <View style={[styles.serviceTypeBadge, { backgroundColor: colors.surface }]}>
                       <Text style={[styles.serviceTypeText, { color: colors.textSecondary }]}>{ride.service_type.toUpperCase()}</Text>
                     </View>
                     
                {ride.scheduled_time && (
                  <View style={styles.scheduledTimeContainer}>
                    <MaterialIcons name="schedule" size={14} color="#3b82f6" />
                    <Text style={styles.scheduledTimeText}>
                      {new Date(ride.scheduled_time).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  </View>
                )}
                    <View style={styles.customerInfo}>
                      {ride.review?.rating && (
                        <View style={styles.customerRatingContainer}>
                          <MaterialIcons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.customerRating}>{ride.review.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.statusBadgeContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                      <Text style={styles.statusText}>
                        {ride.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                   
                  </View>
                </View>

                <View style={styles.routeContainer}>
                  <View style={styles.routeStep}>
                    <Text style={styles.pickupDot}>●</Text>
                    <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>{ride.pickup_address}</Text>
                  </View>
                  <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                  <View style={styles.routeStep}>
                    <Text style={styles.dropDot}>●</Text>
                    <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>{ride.dropoff_address}</Text>
                  </View>
                </View>


                <View style={styles.fareContainer}>
                  <Text style={[styles.fareText, { color: colors.success }]}>₹{ride.fare_amount?.toFixed(2) || '0.00'}</Text>
                  {renderRideDetails(ride)}
                  <Text style={[styles.requestedTime, { color: colors.textSecondary }]}>{ride.requestedAt}</Text>
                </View>
                
                {renderActionButtons(ride)}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-car" size={60} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeTab} rides</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'completed' ? 'Your completed rides will appear here' : 'New ride requests will appear here when available'}
            </Text>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.primary }]} onPress={onRefresh}>
              <Text style={[styles.refreshButtonText, { color: colors.surface }]}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  ridesList: {
    padding: 8,
  },
  rideCard: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rideHeaderLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerRating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  requestedTime: {
    fontSize: 12,
    color: '#64748b',
  },
  serviceTypeTextInline: {
    fontSize: 22,
    color: '#090B0EFF',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
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
    fontSize: 20,
    fontWeight: '500',
    color: '#64748b',
  },
  routeContainer: {
    marginBottom: 8,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeDot: {
    fontSize: 12,
    color: '#2563eb',
    marginRight: 8,
    width: 12,
    textAlign: 'center',
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
    fontSize: 20,
    flex: 1,
  },
  routeLine: {
    height: 16,
    width: 1,
    marginLeft: 5,
    marginBottom: 6,
  },
  scheduledTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduledTimeText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
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
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 14,
  },
  viewDetailsButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSkip: {
    borderWidth: 1,
  },
  actionButtonAccept: {
    flex: 2,
  },
  actionButtonStart: {
    flex: 1,
  },
  // actionButtonComplete: {
  //   flex: 1,
  //   backgroundColor: '#10b981',
  // },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonTextAccept: {
    fontWeight: '600',
  },
  actionButtonTextStart: {
    fontWeight: '600',
  },
  actionButtonTextComplete: {
    fontWeight: '600',
  },
  assignedText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  completedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});