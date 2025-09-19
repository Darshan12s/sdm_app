import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/services/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, useIsDarkMode } from '@/stores/appStore';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import {
  User,
  Driver,
  UserPreferences,
  Wallet,
  WalletTransaction,
  VehicleExtended,
  DriverEarnings,
  DriverDocument,
  TransactionType,
  DocumentStatus
} from '@/types';

// Main Settings Screen Component
const SettingsScreen: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // State with proper TypeScript types
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [vehicle, setVehicle] = useState<VehicleExtended | null>(null);
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [arePushNotificationsEnabled, setArePushNotificationsEnabled] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState<boolean>(false);

  // Use global theme state
  const isDarkModeEnabled = useIsDarkMode();
  const setIsDarkMode = useAppStore(state => state.setIsDarkMode);

  // Fetch all settings data from backend
  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async (): Promise<void> => {
    try {
      setLoading(true);

      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
      }

      // Fetch driver profile data
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (driverError && driverError.code !== 'PGRST116') {
        console.error('Error fetching driver data:', driverError);
      }

      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', preferencesError);
      }

      // Fetch wallet data
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet data:', walletError);
      }

      // Fetch recent transactions only if wallet exists
      let transactionsData: WalletTransaction[] = [];
      if (walletData?.id) {
        const { data: fetchedTransactions, error: transactionsError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('transaction_date', { ascending: false })
          .limit(10);

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
        } else {
          transactionsData = fetchedTransactions || [];
        }
      }

      // Fetch vehicle information
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('assigned_driver_id', authUser.id)
        .single();

      if (vehicleError && vehicleError.code !== 'PGRST116') {
        console.error('Error fetching vehicle data:', vehicleError);
      }

      // Skip fetching earnings since table doesn't exist
      let earningsData: DriverEarnings | null = null;
      // Earnings functionality will be available when the table is created

      // Skip fetching documents since table doesn't exist
      let documentsData: DriverDocument[] = [];
      // Documents functionality will be available when the table is created

      // Update state with all fetched data
      setUser(userData || authUser);
      setDriver(driverData);
      setUserPreferences(preferencesData);
      setWallet(walletData);
      setTransactions(transactionsData);
      setVehicle(vehicleData);
      setEarnings(earningsData);
      setDocuments(documentsData || []);
      setArePushNotificationsEnabled(preferencesData?.notification_enabled || false);
      setIsSoundEnabled(preferencesData?.sound_enabled || true);
      setIsLocationSharingEnabled(preferencesData?.location_sharing || false);
      // Note: Theme is handled by the global theme context, not set here to avoid infinite loops

    } catch (error) {
      console.error('Error fetching settings data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load settings data',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPreference = async (key: string, value: boolean): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if the column exists in the user_preferences table
      const validColumns = ['dark_mode', 'notification_enabled', 'email_notifications'];
      if (!validColumns.includes(key)) {
        console.log(`Column '${key}' does not exist in user_preferences table`);
        Toast.show({
          type: 'info',
          text1: 'Setting updated locally',
          text2: 'This setting will be saved when the database is updated',
        });
        // Update local state only
        setUserPreferences(prev => prev ? { ...prev, [key]: value } : null);
        return;
      }

      const updateData: any = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
        [key]: value
      };

      // Try to upsert, but handle RLS policy errors gracefully
      const { error } = await supabase
        .from('user_preferences')
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) {
        if (error.code === '42501') {
          // RLS policy error - update locally and show info message
          console.log('RLS policy prevents update, updating locally only');
          Toast.show({
            type: 'info',
            text1: 'Setting updated locally',
            text2: 'Database permissions need to be configured',
          });
        } else if (error.code === 'PGRST204') {
          // Column not found error
          console.log(`Column '${key}' not found in user_preferences table`);
          Toast.show({
            type: 'info',
            text1: 'Setting updated locally',
            text2: 'This setting will be saved when the database is updated',
          });
        } else {
          throw error;
        }
      } else {
        Toast.show({
          type: 'success',
          text1: 'Setting updated successfully',
        });
      }

      // Update local state regardless of database success
      setUserPreferences(prev => prev ? { ...prev, [key]: value } : null);

    } catch (error) {
      console.error('Error updating user preference:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update preference',
        text2: 'Please try again later',
      });
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Toast.show({
        type: 'error',
        text1: 'Error signing out',
        text2: 'Please try again',
      });
    }
  };

  const handlePrivacySettings = (): void => {
    Toast.show({
      type: 'info',
      text1: 'Privacy Settings',
      text2: 'Opening privacy settings...',
    });
    // Navigate to privacy settings screen
  };

  const handlePaymentMethods = (): void => {
    try {
      (navigation as any).navigate('PaymentMethods');
    } catch (error) {
      console.error('Navigation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Navigation Error',
        text2: 'Could not open Payment Methods',
      });
    }
  };

  const handleBillingHistory = (): void => {
    try {
      (navigation as any).navigate('BillingHistory');
    } catch (error) {
      console.error('Navigation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Navigation Error',
        text2: 'Could not open Billing History',
      });
    }
  };

  const handleHelpCenter = (): void => {
    Toast.show({
      type: 'info',
      text1: 'Help Center',
      text2: 'Opening help center...',
    });
    // Navigate to help center screen
  };

  const handleRateApp = (): void => {
    Toast.show({
      type: 'info',
      text1: 'Rate App',
      text2: 'Opening app store...',
    });
    // Open app store for rating
  };

  const handleTermsConditions = (): void => {
    try {
      // Navigate to Terms & Conditions screen
      (navigation as any).navigate('TermsConditions');
    } catch (error) {
      console.error('Navigation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Navigation Error',
        text2: 'Could not open Terms & Conditions',
      });
    }
  };

  const getTransactionIcon = (type: TransactionType): keyof typeof Ionicons.glyphMap => {
    return type === 'credit' ? 'arrow-down' : 'arrow-up';
  };

  const getTransactionColor = (type: TransactionType): string => {
    return type === 'credit' ? '#4CAF50' : '#FF3B30';
  };

  const getDocumentStatusIcon = (status: DocumentStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      case 'expired': return 'warning';
      default: return 'document';
    }
  };

  const getDocumentStatusColor = (status: DocumentStatus): string => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#FF3B30';
      case 'expired': return '#FF5722';
      default: return '#666';
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account Information */}
      {user && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Account</Text>
          <View style={styles.listItem}>
            <Ionicons name="person" size={24} color="#666" />
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                {user.full_name || user.email || user.phone_no || 'User'}
              </Text>
              <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                Account ID: {user.id?.substring(0, 8)}...
              </Text>
            </View>
          </View>
          {driver && (
            <>
              <View style={styles.listItem}>
                <Ionicons name="car" size={24} color="#666" />
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>
                    License: {driver.license_number || 'Not provided'}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    Rating: {driver.rating || 0}/5 • Rides: {driver.total_rides || 0}
                  </Text>
                </View>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="location" size={24} color="#666" />
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>
                    Status: {driver.is_online ? 'Online' : 'Offline'}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    Earnings: {formatCurrency(driver.earnings || 0)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Vehicle Information */}
      {vehicle && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Vehicle Information</Text>
          <View style={styles.listItem}>
            <Ionicons name="car-sport" size={24} color="#666" />
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </Text>
              <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                License Plate: {vehicle.license_plate || 'Not provided'}
              </Text>
            </View>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="color-palette" size={24} color="#666" />
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                Color: {vehicle.color || 'Not specified'}
              </Text>
              <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                Type: {vehicle.type || 'Standard'} • Capacity: {vehicle.capacity || 4}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Wallet & Earnings */}
      {(wallet || earnings) && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Wallet & Earnings</Text>
          {wallet && (
            <View style={styles.listItem}>
              <Ionicons name="wallet" size={24} color="#666" />
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, { color: colors.text }]}>Wallet Balance</Text>
                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {formatCurrency(wallet.balance || 0)}
                </Text>
              </View>
            </View>
          )}
          {earnings && (
            <>
              <View style={styles.listItem}>
                <Ionicons name="trending-up" size={24} color="#666" />
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>Total Earnings</Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    {formatCurrency(earnings.total_earnings || 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="calendar" size={24} color="#666" />
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>This Month</Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    {formatCurrency(earnings.monthly_earnings || 0)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Transactions</Text>
          {transactions.slice(0, 3).map((transaction, index) => (
            <View key={transaction.id || index} style={styles.listItem}>
              <Ionicons 
                name={getTransactionIcon(transaction.transaction_type)} 
                size={24} 
                color={getTransactionColor(transaction.transaction_type)} 
              />
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, { color: colors.text }]}>
                  {transaction.description || 'Transaction'}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {formatDate(transaction.transaction_date)}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: getTransactionColor(transaction.transaction_type) }
              ]}>
                {transaction.transaction_type === 'credit' ? '+' : '-'}
                {formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Documents Status */}
      {documents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents Status</Text>
          {documents.map((doc, index) => (
            <View key={doc.id || index} style={styles.listItem}>
              <Ionicons 
                name={getDocumentStatusIcon(doc.status)} 
                size={24} 
                color={getDocumentStatusColor(doc.status)} 
              />
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, { color: colors.text }]}>
                  {doc.document_type?.replace('_', ' ').toUpperCase() || 'Document'}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  Status: {doc.status || 'Unknown'}
                  {doc.expiry_date && ` • Expires: ${formatDate(doc.expiry_date)}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Appearance Settings */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.listItem}>
          <Ionicons 
            name={isDarkModeEnabled ? "sunny" : "moon"} 
            size={24} 
            color={isDarkModeEnabled ? "#FFD700" : "#666"} 
          />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
              {isDarkModeEnabled ? 'Dark theme enabled' : 'Light theme enabled'}
            </Text>
          </View>
          <Switch
            value={isDarkModeEnabled}
            onValueChange={(value) => {
              setIsDarkMode(value);
              updateUserPreference('dark_mode', value);
              Toast.show({
                type: 'success',
                text1: value ? 'Switched to Dark Theme' : 'Switched to Light Theme',
              });
            }}
          />
        </View>
      </View>

      {/* Notification Settings */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.listItem}>
          <Ionicons name="notifications" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Push Notifications</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Receive ride updates and offers</Text>
          </View>
          <Switch
            value={arePushNotificationsEnabled}
            onValueChange={(value) => {
              setArePushNotificationsEnabled(value);
              updateUserPreference('notification_enabled', value);
              Toast.show({
                type: 'success',
                text1: value ? 'Push notifications enabled' : 'Push notifications disabled',
              });
            }}
          />
        </View>
        
        <View style={styles.listItem}>
          <Ionicons name="volume-high" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Sound</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Play sounds for notifications</Text>
          </View>
          <Switch
            value={isSoundEnabled}
            onValueChange={(value) => {
              setIsSoundEnabled(value);
              // Sound setting is handled locally only since column doesn't exist
              Toast.show({
                type: 'success',
                text1: value ? 'Sound notifications enabled' : 'Sound notifications disabled',
              });
            }}
          />
        </View>
      </View>

      {/* Privacy & Security */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Privacy & Security</Text>
        <TouchableOpacity style={styles.listItem} onPress={handlePrivacySettings}>
          <Ionicons name="shield" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Privacy Settings</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Manage your privacy preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.listItem}>
          <Ionicons name="location" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Location Sharing</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Share location during rides</Text>
          </View>
          <Switch
            value={isLocationSharingEnabled}
            onValueChange={(value) => {
              setIsLocationSharingEnabled(value);
              // Location sharing is handled locally only since column doesn't exist
              Toast.show({
                type: 'success',
                text1: value ? 'Location sharing enabled' : 'Location sharing disabled',
              });
            }}
          />
        </View>
      </View>

      {/* Payment & Billing */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Payment & Billing</Text>
        <TouchableOpacity style={styles.listItem} onPress={handlePaymentMethods}>
          <FontAwesome name="credit-card" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Payment Methods</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Manage your payment options</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.listItem} onPress={handleBillingHistory}>
          <Ionicons name="document-text" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Billing History</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>View your past transactions</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Support */}
      {/* <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Support</Text>
        <TouchableOpacity style={styles.listItem} onPress={handleHelpCenter}>
          <Ionicons name="help-circle" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Help Center</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Get help and support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.listItem} onPress={handleRateApp}>
          <Ionicons name="star" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Rate App</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Rate Green Mobility on the app store</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View> */}

      {/* Terms & Conditions */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Terms & Conditions</Text>
        <TouchableOpacity style={styles.listItem} onPress={handleTermsConditions}>
          <Ionicons name="document" size={24} color="#666" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.text }]}>Terms & Conditions</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>View terms and conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Account Actions</Text>
        <TouchableOpacity style={styles.listItem} onPress={signOut}>
          <Ionicons name="log-out" size={24} color="#FF3B30" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listItemTitle, { color: colors.error }]}>Log Out</Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  listItemTitle: {
    fontSize: 16,
  },
  listItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;