import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useUser } from '@/stores/appStore';
import { supabase } from '@/services/supabase/client';

// Import theme
import { useTheme } from '@/contexts/ThemeContext';

// Notification interface based on schema
interface Notification {
  id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  title: string;
  message: string;
  sent_at: string;
  read: boolean;
  created_at: string;
  template_id?: string;
  campaign_id?: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivery_attempts: number;
  delivered_at?: string;
  failed_reason?: string;
  external_id?: string;
  metadata?: any;
}

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

              if (error) throw error;

              // Update local state
              setNotifications(prev =>
                prev.filter(notification => notification.id !== notificationId)
              );
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return 'mail';
      case 'sms': return 'chatbubble';
      case 'push': return 'notifications';
      case 'whatsapp': return 'logo-whatsapp';
      default: return 'notifications';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return colors.success;
      case 'sent': return colors.primary;
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          {/* <MaterialIcons name="arrow-back" size={24} color={colors.text} /> */}
        </TouchableOpacity>
        {/* <Text style={[styles.title, { color: colors.text }]}>Notifications</Text> */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && [styles.activeFilterTab, { backgroundColor: colors.primary }]]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            { color: filter === 'all' ? '#fff' : colors.textSecondary }
          ]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && [styles.activeFilterTab, { backgroundColor: colors.primary }]]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterText,
            { color: filter === 'unread' ? '#fff' : colors.textSecondary }
          ]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'read' && [styles.activeFilterTab, { backgroundColor: colors.primary }]]}
          onPress={() => setFilter('read')}
        >
          <Text style={[
            styles.filterText,
            { color: filter === 'read' ? '#fff' : colors.textSecondary }
          ]}>
            Read ({notifications.length - unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllButton, { backgroundColor: colors.primary }]}
          onPress={markAllAsRead}
        >
          <Text style={styles.markAllText}>Mark All as Read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' :
               'You don\'t have any notifications yet'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                { backgroundColor: colors.card },
                !notification.read && { borderLeftColor: colors.primary, borderLeftWidth: 4 }
              ]}
              onPress={() => !notification.read && markAsRead(notification.id)}
              onLongPress={() => deleteNotification(notification.id)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name={getChannelIcon(notification.channel) as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.notificationMeta}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {notification.title}
                  </Text>
                  <View style={styles.notificationSubInfo}>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                      {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(notification.delivery_status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(notification.delivery_status) }]}>
                        {notification.delivery_status}
                      </Text>
                    </View>
                  </View>
                </View>
                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                {notification.message}
              </Text>
              {notification.failed_reason && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Failed: {notification.failed_reason}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeFilterTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  markAllButton: {
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  markAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});