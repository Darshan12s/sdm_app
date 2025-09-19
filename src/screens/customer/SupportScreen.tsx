import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';

export default function SupportScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Check if we're in driver context by examining navigation state
  const isDriverContext = useNavigationState((state) => {
    if (!state) return false;
    // Check if any route in the state contains driver-specific screens
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

  const supportCategories = [
    {
      id: 'booking',
      title: isDriverContext ? 'Ride Management' : 'Booking Issues',
      description: isDriverContext ? 'Managing rides and passenger requests' : 'Problems with booking rides',
      icon: 'event-note',
      iconType: 'MaterialIcons',
      faqs: isDriverContext ? [
        'How to accept ride requests?',
        'What to do if passenger doesn\'t show up?',
        'How to cancel a ride?',
        'Managing ride status updates',
      ] : [
        'How do I cancel a booking?',
        'Can I modify my booking?',
        'What if my driver is late?',
        'How to change pickup location?',
      ],
      hasNavigation: !isDriverContext, // Only allow navigation for customers
    },
    {
      id: 'payment',
      title: 'Payment & Earnings',
      description: isDriverContext ? 'Payment methods and earnings tracking' : 'Payment methods and billing questions',
      icon: 'credit-card',
      iconType: 'MaterialIcons',
      faqs: isDriverContext ? [
        'How to receive payments?',
        'Earnings calculation',
        'Payment methods setup',
        'Commission structure',
      ] : [
        'How do I add a payment method?',
        'Can I get a refund?',
        'Why was I charged extra?',
        'How to update payment details?',
      ],
      hasNavigation: !isDriverContext, // Only allow navigation for customers
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Account settings and profile management',
      icon: 'person',
      iconType: 'MaterialIcons',
      faqs: [
        'How to change my phone number?',
        'Can I delete my account?',
        'How to update my profile?',
        'Forgot password recovery',
      ],
      hasNavigation: !isDriverContext, // Only allow navigation for customers
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      description: 'Safety features and emergency contacts',
      icon: 'security',
      iconType: 'MaterialIcons',
      faqs: [
        'How to contact emergency services?',
        'What if I feel unsafe?',
        'How to report an incident?',
        'Safety tips for riders',
      ],
      hasNavigation: !isDriverContext, // Only allow navigation for customers
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'App issues and technical problems',
      icon: 'build',
      iconType: 'MaterialIcons',
      faqs: [
        'App not loading properly',
        'Location services not working',
        'Payment failed in app',
        'How to update the app',
      ],
      hasNavigation: !isDriverContext, // Only allow navigation for customers
    },
  ];

  const contactOptions = [
    {
      title: 'Call Support',
      subtitle: 'Speak to our support team',
      icon: 'phone',
      iconType: 'MaterialIcons',
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
      iconType: 'MaterialIcons',
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
      iconType: 'MaterialIcons',
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
      iconType: 'MaterialIcons',
      action: () => {
        Alert.alert('Coming Soon', 'Live chat feature will be available soon!');
      },
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    // Find the selected category
    const selectedCategoryData = supportCategories.find(cat => cat.id === categoryId);

    if (!selectedCategoryData?.hasNavigation) {
      // For drivers or when navigation is disabled, show FAQ content directly
      Alert.alert(
        selectedCategoryData?.title || 'Support',
        'This feature is currently under development. Please contact support directly for assistance.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to the appropriate FAQ screen based on category (only for customers)
    const faqRoutes = {
      booking: 'BookingFAQ',
      payment: 'PaymentFAQ',
      account: 'AccountFAQ',
      safety: 'SafetyFAQ',
      technical: 'TechnicalFAQ',
    };

    const routeName = faqRoutes[categoryId as keyof typeof faqRoutes];
    if (routeName) {
      navigation.navigate(routeName as never);
    }
  };

  const handleFAQPress = (question: string) => {
    // This function is now deprecated since we navigate to full FAQ screens
    Alert.alert('FAQ', `${question}\n\nThis is a placeholder answer. Full FAQ system coming soon!`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          Get help with your SDM Cab Hailing experience
        </Text>
      </View>

      {/* Support Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        {supportCategories.map((category) => (
          <View key={category.id}>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <MaterialIcons name={category.icon as any} size={24} color="#64748b" />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
                <Text style={styles.categoryArrow}>
                  {selectedCategory === category.id ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>

            {selectedCategory === category.id && (
              <View style={styles.faqContainer}>
                {category.faqs.map((faq, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.faqItem}
                    onPress={() => handleFAQPress(faq)}
                  >
                    <Text style={styles.faqText}>{faq}</Text>
                    <Text style={styles.faqArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactCard}
            onPress={option.action}
          >
            <View style={styles.contactLeft}>
              <View style={styles.contactIcon}>
                <MaterialIcons name={option.icon as any} size={20} color="#64748b" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </View>
            </View>
            <Text style={styles.contactArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Contact */}
      <View style={styles.emergencySection}>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <MaterialIcons name="warning" size={24} color="#dc2626" />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Emergency</Text>
            <Text style={styles.emergencyDescription}>
              For immediate safety concerns, call emergency services
            </Text>
          </View>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Text style={styles.emergencyButtonText}>Call 112</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 16,
    width: 32,
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryArrow: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  faqContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  faqText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  faqArrow: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  contactArrow: {
    fontSize: 18,
    color: '#cbd5e1',
  },
  emergencySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  emergencyCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyIcon: {
    marginRight: 16,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 2,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#dc2626',
    opacity: 0.8,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});