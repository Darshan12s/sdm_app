import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import DriverHomeScreen from '@/screens/driver/DriverHomeScreen';
import AvailableRidesScreen from '@/screens/driver/AvailableRidesScreen';
import ActiveRideScreen from '@/screens/driver/ActiveRideScreen';
import EarningsScreen from '@/screens/driver/EarningsScreen';
import DriverProfileScreen from '@/screens/driver/DriverProfileScreen';
import VehicleInformationScreen from '@/screens/driver/navigation/VehicleInformationScreen';
import VehicleDocumentsScreen from '@/screens/driver/navigation/VehicleDocumentsScreen';
import DriverDocumentsScreen from '@/screens/driver/navigation/DriverDocumentsScreen';

// Import components
import NotificationBell from '@/components/NotificationBell';

// Import types
import { DriverTabParamList, DriverStackParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createStackNavigator<DriverStackParamList>();

// Main tab navigator for driver
function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2dd4bf', // Teal color from the modern theme
        tabBarInactiveTintColor: '#64748b', // Slate gray for inactive items
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          elevation: 8,
          shadowColor: '#000000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#2dd4bf', // Teal color from the modern theme
        },
        headerTintColor: '#ffffff',
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2dd4bf', // Teal color from the modern theme
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: '#f8f9fa', // Light background color
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
    </Stack.Navigator>
    
  );
}
