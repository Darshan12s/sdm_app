import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  screen: string;
}

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  
  // Check if we're in driver context
  const isDriverContext = useNavigationState((state) => {
    if (!state) return false;
    const hasDriverRoutes = state.routes.some(route =>
      route.name === 'DriverTabs' ||
      route.name === 'DriverHome' ||
      route.name === 'AvailableRides' ||
      route.name === 'ActiveRide' ||
      route.name === 'Earnings' ||
      route.name === 'DriverProfile'
    );
    return hasDriverRoutes;
  });

  // Driver support categories
  const driverCategories: SupportCategory[] = [
    {
      id: 'rides',
      title: 'Rides & Bookings',
      description: 'Ride acceptance, completion, and booking issues',
      icon: 'local-taxi',
      screen: 'DriverRidesFAQ',
    },
    {
      id: 'earnings',
      title: 'Earnings & Payments',
      description: 'Payment methods, earnings, and financial queries',
      icon: 'attach-money',
      screen: 'DriverEarningsFAQ',
    },
    {
      id: 'vehicle',
      title: 'Vehicle & Documents',
      description: 'Vehicle registration, documents, and maintenance',
      icon: 'directions-car',
      screen: 'DriverVehicleFAQ',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Manage your account and personal information',
      icon: 'person',
      screen: 'DriverAccountFAQ',
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'App issues, login problems, and technical help',
      icon: 'build',
      screen: 'DriverTechnicalFAQ',
    },
  ];

  const contactOptions = [
    {
      title: 'Call Support',
      subtitle: 'Speak to our support team',
      icon: 'phone',
      action: () => {
        const phoneNumber = '+91-1800-XXX-XXXX';
        Alert.alert(
          'Call Support',
          `Call ${phoneNumber}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
          ]
        );
      },
    },
    {
      title: 'Email Support',
      subtitle: 'Send us an email',
      icon: 'email',
      action: () => {
        const email = 'support@sdmcabhailing.com';
        const subject = 'Support Request';
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'WhatsApp Support',
      subtitle: 'Chat with us on WhatsApp',
      icon: 'chat',
      action: () => {
        const phoneNumber = '+91-9876543210';
        const message = 'Hi, I need help with SDM Cab Hailing';
        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'WhatsApp is not installed on this device');
        });
      },
    },
    {
      title: 'Live Chat',
      subtitle: 'Chat with our support bot',
      icon: 'smart-toy',
      action: () => {
        Alert.alert('Coming Soon', 'Live chat feature will be available soon!');
      },
    },
  ];

  const handleCategoryPress = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const renderCategory = (category: SupportCategory) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      onPress={() => handleCategoryPress(category.screen)}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <MaterialIcons name={category.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            {category.title}
          </Text>
          <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
            {category.description}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderContactOption = (option: typeof contactOptions[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.contactCard, { backgroundColor: colors.card }]}
      onPress={option.action}
    >
      <View style={styles.contactContent}>
        <View style={[styles.contactIconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons name={option.icon as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.contactTextContainer}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            {option.title}
          </Text>
          <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
            {option.subtitle}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="help-outline" size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isDriverContext 
                ? 'Get help with your driver experience' 
                : 'Get help with your SDM Cab Hailing experience'
              }
            </Text>
          </View>

          {/* Categories Section */}
          <View style={styles.categoriesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Browse by Category
            </Text>
            {driverCategories.map(renderCategory)}
          </View>

          {/* Contact Us Section */}
          <View style={styles.contactSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Us
            </Text>
            {contactOptions.map(renderContactOption)}
          </View>

          {/* Emergency Section */}
          <View style={styles.emergencySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency</Text>
            <View style={[styles.emergencyCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <View style={styles.emergencyContent}>
                <MaterialIcons name="warning" size={24} color="#dc2626" />
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyTitle, { color: '#dc2626' }]}>Emergency Contact</Text>
                  <Text style={[styles.emergencyDescription, { color: '#dc2626' }]}>
                    For immediate safety concerns, call emergency services
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: '#dc2626' }]}
                  onPress={() => Linking.openURL('tel:112')}
                >
                  <Text style={styles.emergencyButtonText}>Call 112</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.1)', // Light primary color
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  emergencySection: {
    marginBottom: 24,
  },
  emergencyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emergencyDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  emergencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});