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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { DriverStackParamList } from '@/types/navigation';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const DriverAccountFAQScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<DriverStackParamList>>();
  const { colors, isDark } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'change-phone-number',
      question: 'How to change my phone number?',
      answer: 'To change your phone number, go to Profile > Personal Information and tap the edit button. Update your phone number and verify it with the OTP sent to your new number. Your old number will be replaced once verification is complete. This change affects your login credentials.',
      category: 'account',
    },
    {
      id: 'delete-account',
      question: 'Can I delete my driver account?',
      answer: 'Yes, you can delete your account by going to Profile > Settings > Account Settings > Delete Account. Please note that account deletion is permanent and cannot be undone. All your data, ride history, earnings, and saved information will be permanently removed. Ensure you have settled all pending payments before deletion.',
      category: 'account',
    },
    {
      id: 'update-profile',
      question: 'How to update my driver profile?',
      answer: 'Go to your Profile screen and tap the edit button next to Personal Information. You can update your name, email, phone number, and date of birth. For profile picture, tap on the avatar and choose to take a photo or select from gallery. Keep your profile information current for better ride assignments.',
      category: 'account',
    },
    {
      id: 'forgot-password',
      question: 'Forgot password recovery',
      answer: 'If you forgot your password, tap "Forgot Password" on the login screen. Enter your registered phone number and you\'ll receive an OTP. Use the OTP to reset your password. Make sure to create a strong password with at least 8 characters including numbers and special characters.',
      category: 'account',
    },
    {
      id: 'change-email',
      question: 'How do I change my email address?',
      answer: 'Go to Profile > Personal Information > Edit, then update your email address. You\'ll receive a verification email at your new address. Click the verification link to confirm the change. Your old email will be replaced once verified.',
      category: 'account',
    },
    {
      id: 'account-verification',
      question: 'How to verify my driver account?',
      answer: 'Account verification is done automatically when you register. For additional verification (like adding payment methods or vehicle documents), you may need to provide additional documents. Go to Profile > Account Verification to check your verification status and complete any pending verifications.',
      category: 'account',
    },
    {
      id: 'driver-rating',
      question: 'How does driver rating work?',
      answer: 'Your rating is calculated from passenger feedback after each ride. Maintain a rating above 4.0 to receive more ride requests. Check your rating in the Profile section and focus on providing excellent service to improve it.',
      category: 'account',
    },
    {
      id: 'account-security',
      question: 'How to secure my driver account?',
      answer: 'Enable two-factor authentication in Profile > Settings > Security. Use a strong password and never share your login credentials. Enable biometric login if available. Regularly review your ride history and report any suspicious activity immediately.',
      category: 'account',
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          {/* <Ionicons name="arrow-back" size={24} color={colors.text} /> */}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {/* <Text style={[styles.headerTitle, { color: colors.text }]}>Account FAQs</Text> */}
          {/* <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Account management and settings
          </Text> */}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>

          {faqData.map(renderFAQItem)}

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
              onPress={() => navigation.navigate('Support')}
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

export default DriverAccountFAQScreen;