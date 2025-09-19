import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const TechnicalFAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'app-not-loading',
      question: 'App not loading properly',
      answer: 'If the app is not loading, try force closing and reopening it. Clear app cache in device settings. Ensure you have a stable internet connection. Update the app to the latest version from the app store. If issues persist, uninstall and reinstall the app.',
      category: 'technical',
    },
    {
      id: 'location-services',
      question: 'Location services not working',
      answer: 'Enable location services in your device settings and grant location permission to the app. Ensure GPS is turned on. Try restarting your device. If using Android, check that location accuracy is set to "High accuracy". Clear app cache and restart the app.',
      category: 'technical',
    },
    {
      id: 'payment-failed',
      question: 'Payment failed in app',
      answer: 'Check your internet connection and try again. Ensure your payment method has sufficient funds. Verify payment details are correct. Contact your bank if the issue persists. Try using a different payment method or contact our support team for assistance.',
      category: 'technical',
    },
    {
      id: 'app-update',
      question: 'How to update the app',
      answer: 'Go to Google Play Store or Apple App Store, search for "SDM Cab Hailing", and tap "Update" if available. Enable automatic updates in store settings. The app will notify you when updates are available. Keeping the app updated ensures best performance and security.',
      category: 'technical',
    },
    {
      id: 'login-issues',
      question: 'Login problems',
      answer: 'Ensure you\'re using the correct phone number and password. Check your internet connection. Try "Forgot Password" if you can\'t remember your password. Clear app cache or reinstall the app. Contact support if you\'re still unable to login.',
      category: 'technical',
    },
    {
      id: 'gps-accuracy',
      question: 'GPS location inaccurate',
      answer: 'Ensure you\'re in an open area with clear sky view. Enable high accuracy mode in location settings. Restart GPS services. Clear app cache. The app uses Google Maps for accurate location services. Try restarting your device if accuracy issues persist.',
      category: 'technical',
    },
    {
      id: 'notification-issues',
      question: 'Not receiving notifications',
      answer: 'Enable notifications for the app in device settings. Check that "Do Not Disturb" mode is off. Ensure the app has background refresh enabled. Restart your device. Update the app to the latest version. Reinstall the app if notifications still don\'t work.',
      category: 'technical',
    },
    {
      id: 'app-crashing',
      question: 'App keeps crashing',
      answer: 'Update the app to the latest version. Clear app cache and data. Restart your device. Ensure your device meets minimum requirements (Android 8.0+ or iOS 12.0+). Free up storage space. If crashes continue, uninstall and reinstall the app.',
      category: 'technical',
    },
  ];

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const renderFAQItem = (faq: FAQItem) => (
    <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => toggleFAQ(faq.id)}
      >
        <View style={styles.faqQuestionContainer}>
          <MaterialIcons name="help-outline" size={20} color={colors.primary} />
          <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
        </View>
        <MaterialIcons
          name={expandedFAQ === faq.id ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswerContainer}>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Technical FAQs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            App issues and technical problems
          </Text>
        </View>
      </View>

      {/* FAQ List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>

          {faqData.map(renderFAQItem)}

          {/* Contact Support */}
          <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="contact-support" size={24} color={colors.primary} />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                Contact our support team for personalized assistance
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Support' as never)}
            >
              <Text style={styles.contactButtonText}>Get Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  faqCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TechnicalFAQScreen;