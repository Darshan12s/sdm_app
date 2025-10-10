import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Import global styles
// import './src/global.css'; // Not needed in React Native

// Import our services and stores
import { AuthService } from '@/services/supabase/auth';
import { useAppStore } from '@/stores/appStore';

// Import hooks
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

// Import navigation
import AppNavigator from '@/navigation/AppNavigator';

// Import toast configuration
import { createToastConfig } from '@/utils/toastConfig';

// Import theme provider
import ThemeProvider, { useTheme } from '@/contexts/ThemeContext';

// Component to handle theme-aware toast configuration
const AppContent = () => {
  const { isLoading, isAuthenticated } = useAppStore();
  const { colors, isDark } = useTheme();

  // Initialize real-time subscriptions
  useRealtimeSubscriptions();

  useEffect(() => {
    // Initialize auth state listener
    AuthService.initializeAuthListener();

    // Check if user is already authenticated
    const initializeAuth = async () => {
      const authenticated = await AuthService.isAuthenticated();
      useAppStore.getState().setAuthenticated(authenticated);
      useAppStore.getState().setLoading(false);
    };

    initializeAuth();
  }, []);

  // Create theme-aware toast config
  const toastConfig = createToastConfig(colors, isDark);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
      <Toast
        config={toastConfig}
        visibilityTime={2000}
        autoHide={true}
        topOffset={60}
        bottomOffset={70}
      />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light theme background
    alignItems: 'center',
    justifyContent: 'center',
  },
});
