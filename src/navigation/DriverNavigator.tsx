import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

// Import screensz
import DriverHomeScreen from '@/screens/driver/DriverHomeScreen';
import AvailableRidesScreen from '@/screens/driver/AvailableRidesScreen';
import ActiveRideScreen from '@/screens/driver/ActiveRideScreen';
import EarningsScreen from '@/screens/driver/EarningsScreen';
import DriverProfileScreen from '@/screens/driver/DriverProfileScreen';
import RideDetailsScreen from '@/screens/driver/RideDetailsScreen';
import VehicleInformationScreen from '@/screens/driver/navigation/VehicleInformationScreen';
import VehicleDocumentsScreen from '@/screens/driver/navigation/VehicleDocumentsScreen';
import DriverDocumentsScreen from '@/screens/driver/navigation/DriverDocumentsScreen';
import NotificationsScreen from '@/screens/driver/navigation/NotificationsScreen';

// Import components
import NotificationBell from '@/components/NotificationBell';

// Import types
import { DriverTabParamList, DriverStackParamList } from '@/types/navigation';
import SettingsScreen from '@/screens/driver/navigation/SettingsScreen';
import TermsConditionsScreen from '@/screens/driver/navigation/TermsConditionsScreen';
import PaymentMethodsScreen from '@/screens/driver/navigation/PaymentMethodsScreen';
import BillingHistoryScreen from '@/screens/driver/navigation/BillingHistoryScreen';
import SupportScreen from '@/screens/customer/SupportScreen';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createStackNavigator<DriverStackParamList>();

// Main tab navigator for driver
function DriverTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerTint,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AvailableRides"
        component={AvailableRidesScreen}
        options={{
          title: 'Available Rides',
          tabBarLabel: 'Rides',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{
          title: 'Active Ride',
          tabBarLabel: 'Active',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="play-circle-filled" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          title: 'Earnings',
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="attach-money" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
}

// Main driver navigator with stack for modals/details
export default function DriverNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.headerBackground,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.headerTint,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="DriverTabs"
        component={DriverTabNavigator}
        options={{ headerShown: false }}
      />
      {/* Additional screens can be added here for modals/details */}
      
      <Stack.Screen
        name="VehicleInformation"
        component={VehicleInformationScreen}
        options={{ title: 'Vehicle Information' }}
      />
      <Stack.Screen
        name="VehicleDocuments"
        component={VehicleDocumentsScreen}
        options={{ title: 'Vehicle Documents' }}
      />
      
      <Stack.Screen
        name="DriverDocuments"
        component={DriverDocumentsScreen}
        options={{ title: 'DriverDocuments' }}
      />

      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{ title: 'Ride Details' }}
      />
       <Stack.Screen
         name="Settings"
         component={SettingsScreen}
         options={{ title: 'Settings' }}
       />

       <Stack.Screen
         name="Notifications"
         component={NotificationsScreen}
         options={{ title: 'Notifications' }}
       />

       <Stack.Screen
         name="TermsConditions"
         component={TermsConditionsScreen}
         options={{ title: 'Terms & Conditions' }}
       />
      
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ title: 'Payment Methods' }}
      />
      
      <Stack.Screen
        name="BillingHistory"
        component={BillingHistoryScreen}
        options={{ title: 'Billing History' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: 'Support' }}
      />
  
    </Stack.Navigator>
    
  );
}
