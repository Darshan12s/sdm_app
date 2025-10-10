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

// Main Settings Screen Component
const SettingsScreen: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // State with proper TypeScript types
  const [user, setUser] = useState<any | null>(null);
  const [userPreferences, setUserPreferences] = useState<any | null>(null);
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

  // Refetch data when authentication state changes
  useEffect(() => {
    const currentState = useAppStore.getState();
    console.log('SettingsScreen: Auth state changed, refetching data:', {
      isAuthenticated: currentState.isAuthenticated,
      hasUser: !!currentState.user
    });

    if (currentState.isAuthenticated && currentState.user) {
      fetchSettingsData();
    }
  }, [useAppStore.getState().isAuthenticated, useAppStore.getState().user?.id]);

  const fetchSettingsData = async (): Promise<void> => {
    try {
      setLoading(true);

      console.log('SettingsScreen: fetchSettingsData called');

      // Check authentication state from store first
      const currentState = useAppStore.getState();
      console.log('SettingsScreen: Current auth state from store:', {
        isAuthenticated: currentState.isAuthenticated,
        hasUser: !!currentState.user,
        userId: currentState.user?.id
      });

      // Guard: Don't fetch data if user is not authenticated
      if (!currentState.isAuthenticated || !currentState.user) {
        console.log('SettingsScreen: User not authenticated, skipping data fetch');
        setLoading(false);
        return;
      }

      // Get authenticated user
      console.log('SettingsScreen: Calling supabase.auth.getUser()');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      console.log('SettingsScreen: supabase.auth.getUser() result:', {
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        authError: authError ? { message: authError.message, code: authError.code } : null
      });

      if (authError) {
        console.error('SettingsScreen: Auth error details:', authError);
        throw authError;
      }

      if (!authUser) {
        console.log('SettingsScreen: No authenticated user found, returning early');
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

      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', preferencesError);
      }

      // Update state with all fetched data
      setUser(userData || authUser);
      setUserPreferences(preferencesData);
      setArePushNotificationsEnabled(preferencesData?.notification_enabled || false);
      setIsSoundEnabled(preferencesData?.sound_enabled || true);
      setIsLocationSharingEnabled(preferencesData?.location_sharing || false);

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
        setUserPreferences((prev: any | null) => prev ? { ...prev, [key]: value } : null);
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
      setUserPreferences((prev: any | null) => prev ? { ...prev, [key]: value } : null);

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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading settings...</Text>
      </View>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: 18, marginTop: 16 }]}>
          Please sign in to access settings
        </Text>
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            console.log('SettingsScreen: Navigating to auth flow');
            // Navigate to auth flow - this would need to be implemented based on your navigation structure
          }}
        >
          <Text style={[styles.signInButtonText, { color: colors.background }]}>Sign In</Text>
        </TouchableOpacity>
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
    padding:6,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 8,
    borderRadius: 12,
    padding: 8,
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
  signInButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;