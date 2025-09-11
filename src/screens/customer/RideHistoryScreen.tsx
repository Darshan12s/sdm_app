import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Import services and stores
import { supabase } from '../../services/supabase/client';
import { useUser } from '../../stores/appStore';

// Import types
import { Booking } from '../../types';

export default function RideHistoryScreen() {
  const user = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRideHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers!bookings_driver_id_fkey (
            id,
            user:users!drivers_id_fkey (
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ride history:', error);
        Alert.alert('Error', 'Failed to load ride history');
      } else {
        setRides(data || []);
      }
    } catch (error) {
      console.error('Error fetching ride history:', error);
      Alert.alert('Error', 'Failed to load ride history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideHistory();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#16a34a';
      case 'cancelled':
        return '#dc2626';
      case 'in_progress':
        return '#ca8a04';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>
          {rides.length} {rides.length === 1 ? 'ride' : 'rides'} completed
        </Text>
      </View>

      {/* Ride List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride history...</Text>
        </View>
      ) : rides.length > 0 ? (
        <View style={styles.rideList}>
          {rides.map((ride) => (
            <TouchableOpacity key={ride.id} style={styles.rideCard}>
              {/* Header */}
              <View style={styles.rideHeader}>
                <View style={styles.rideHeaderLeft}>
                  <Text style={styles.rideDate}>
                    {new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.rideService}>
                    {ride.service_type} Service
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(ride.status)}
                  </Text>
                </View>
              </View>

              {/* Route */}
              <View style={styles.routeContainer}>
                <View style={styles.routeStep}>
                  <Text style={styles.routeDot}>●</Text>
                  <Text style={styles.routeText}>
                    {ride.pickup_address || 'Pickup Location'}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeStep}>
                  <Text style={styles.routeDot}>●</Text>
                  <Text style={styles.routeText}>
                    {ride.dropoff_address || 'Drop Location'}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehicle:</Text>
                  <Text style={styles.detailValue}>
                    {ride.vehicle_type}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Driver:</Text>
                  <Text style={styles.detailValue}>
                    {ride.driver?.user?.full_name || 'Not assigned'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fare:</Text>
                  <Text style={styles.detailValue}>
                    ₹{ride.fare_amount || ride.estimated_fare || 0}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => Alert.alert('View Details', 'Detailed ride information coming soon')}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => Alert.alert('Book Again', 'Quick booking feature coming soon')}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Book Again</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="directions-car" size={60} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptyText}>
            Your completed rides will appear here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#64748b',
  },
  rideList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  rideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rideHeaderLeft: {
    flex: 1,
  },
  rideDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  rideService: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    fontSize: 14,
    color: '#2563eb',
    marginRight: 12,
    width: 16,
    textAlign: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  routeLine: {
    height: 20,
    width: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 7,
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#2563eb',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#1e293b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});