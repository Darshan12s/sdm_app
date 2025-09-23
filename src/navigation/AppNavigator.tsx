import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import stores and types
import { useAppStore, useIsAuthenticated, useUserRole } from '@/stores/appStore';

// Import screens
import AuthNavigator from '@/navigation/AuthNavigator';
import CustomerNavigator from '@/navigation/CustomerNavigator';
import DriverNavigator from '@/navigation/DriverNavigator';

// Import types
import { UserRole } from '@/types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const isAuthenticated = useIsAuthenticated();
  const userRole = useUserRole();

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Show role-based navigation based on user role
  switch (userRole) {
    case 'customer':
      return <CustomerNavigator />;
    case 'driver':
      return <DriverNavigator />;
    case 'admin':
      // For now, show customer interface for admin
      return <CustomerNavigator />;
    case 'vendor':
      // For now, show customer interface for vendor
      return <CustomerNavigator />;
    default:
      return <AuthNavigator />;
  }
}

// Placeholder components for navigation (will be implemented in next steps)
export const PlaceholderScreen = ({ title }: { title: string }) => {
  return (
    <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <h1>{title}</h1>
      <p>This screen will be implemented in the next steps.</p>
    </div>
  );
};