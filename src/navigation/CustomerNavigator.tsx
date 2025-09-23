import React from 'react';

// React Navigation imports
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Third-party imports
import { MaterialIcons } from '@expo/vector-icons';

// Context imports
import { useTheme } from '@/contexts/ThemeContext';

// Screen imports - Main customer screens
import HomeScreen from '@/screens/customer/HomeScreen';
import BookRideScreen from '@/screens/customer/BookRideScreen';
import RideHistoryScreen from '@/screens/customer/RideHistoryScreen';
import ProfileScreen from '@/screens/customer/ProfileScreen';
import SupportScreen from '@/screens/customer/SupportScreen';

// Screen imports - Payment and billing
import PaymentScreen from '@/screens/customer/PaymentScreen';
import PaymentMethodsScreen from '@/screens/customer/PaymentMethodsScreen';
import BillingHistoryScreen from '@/screens/customer/BillingHistoryScreen';

// Screen imports - Trip related
import TripDetailsScreen from '@/screens/customer/trip/TripDetailsScreen';
import RideTrackingScreen from '@/screens/customer/trip/RideTrackingScreen';
import ReviewModal from '@/screens/customer/ReviewModal';

// Screen imports - Settings and FAQ
import SettingsScreen from '@/screens/customer/SettingsScreen';
import BookingFAQScreen from '@/screens/customer/faq/BookingFAQScreen';
import PaymentFAQScreen from '@/screens/customer/faq/PaymentFAQScreen';
import AccountFAQScreen from '@/screens/customer/faq/AccountFAQScreen';
import SafetyFAQScreen from '@/screens/customer/faq/SafetyFAQScreen';
import TechnicalFAQScreen from '@/screens/customer/faq/TechnicalFAQScreen';

// Component imports
import NotificationBell from '@/components/NotificationBell';

// Type imports
import { CustomerTabParamList, CustomerStackParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createStackNavigator<CustomerStackParamList>();

// Main tab navigator for customer
function CustomerTabNavigator() {
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
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BookRide"
        component={BookRideScreen}
        options={{
          title: 'Book Ride',
          tabBarLabel: 'Book',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{
          title: 'Ride History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Support"
        component={SupportScreen}
        options={{
          title: 'Support',
          tabBarLabel: 'Support',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="help" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main customer navigator with stack for modals/details
export default function CustomerNavigator() {
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
        name="CustomerTabs"
        component={CustomerTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Payment',
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
        }}
      />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{
          title: 'Trip Details',
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
        }}
      />
      <Stack.Screen
        name="TrackRide"
        component={RideTrackingScreen}
        options={{
          title: 'Track Ride',
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
        }}
      />
      <Stack.Screen
        name="ReviewModal"
        component={ReviewModal}
        options={{
          title: 'Rate Your Trip',
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
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
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
        }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{
          title: 'Payment Methods',
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
        }}
      />
      <Stack.Screen
        name="BillingHistory"
        component={BillingHistoryScreen}
        options={{
          title: 'Billing History',
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
        }}
      />
      <Stack.Screen
        name="BookingFAQ"
        component={BookingFAQScreen}
        options={{
          title: 'Booking FAQs',
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
        }}
      />
      <Stack.Screen
        name="PaymentFAQ"
        component={PaymentFAQScreen}
        options={{
          title: 'Payment FAQs',
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
        }}
      />
      <Stack.Screen
        name="AccountFAQ"
        component={AccountFAQScreen}
        options={{
          title: 'Account FAQs',
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
        }}
      />
      <Stack.Screen
        name="SafetyFAQ"
        component={SafetyFAQScreen}
        options={{
          title: 'Safety FAQs',
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
        }}
      />
      <Stack.Screen
        name="TechnicalFAQ"
        component={TechnicalFAQScreen}
        options={{
          title: 'Technical FAQs',
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
        }}
      />
      {/* Additional screens can be added here for modals/details */}
    </Stack.Navigator>
  );
}
