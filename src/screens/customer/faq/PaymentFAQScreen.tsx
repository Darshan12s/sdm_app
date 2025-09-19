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

const PaymentFAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'add-payment-method',
      question: 'How do I add a payment method?',
      answer: 'To add a payment method, go to your Profile > Payment Methods and tap "Add Another Payment Method". Choose from Credit/Debit Card, UPI, Net Banking, or Wallet options. Follow the prompts to securely add your payment details. All payment information is encrypted and stored securely.',
      category: 'payment',
    },
    {
      id: 'payment-refund',
      question: 'Can I get a refund?',
      answer: 'Refunds are processed automatically for cancelled rides based on our cancellation policy. For completed rides, refunds are only available if there was a technical issue or service error. Contact support within 24 hours of the ride completion to request a refund. Processing takes 5-7 business days.',
      category: 'payment',
    },
    {
      id: 'extra-charges',
      question: 'Why was I charged extra?',
      answer: 'Extra charges may include toll fees, parking charges, waiting time, or surge pricing during peak hours. You will see a detailed breakdown in your ride receipt. Toll and parking fees are added automatically. Waiting charges apply after 3 minutes of waiting time.',
      category: 'payment',
    },
    {
      id: 'update-payment-details',
      question: 'How to update payment details?',
      answer: 'Go to Profile > Payment Methods, select the payment method you want to update, and tap the edit icon. You can update card details, UPI ID, or bank information. For security reasons, some details may require re-verification.',
      category: 'payment',
    },
    {
      id: 'failed-payment',
      question: 'What if my payment failed?',
      answer: 'If your payment fails, check your internet connection and try again. Ensure your payment method has sufficient balance/funds. For card payments, verify the card details and expiry date. Contact your bank if the issue persists. You can also try a different payment method.',
      category: 'payment',
    },
    {
      id: 'payment-security',
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard encryption (PCI DSS compliant) to protect your payment information. We never store your full card details on our servers. All transactions are processed through secure payment gateways with bank-level security.',
      category: 'payment',
    },
    {
      id: 'cash-payment',
      question: 'Do you accept cash payments?',
      answer: 'Cash payments are accepted for certain ride types, but we strongly recommend using digital payments for better security and convenience. Digital payments are mandatory for premium and shared rides. Check the payment options available for your specific ride type.',
      category: 'payment',
    },
    {
      id: 'receipts',
      question: 'How do I get ride receipts?',
      answer: 'Ride receipts are automatically sent to your registered email address after ride completion. You can also view and download receipts from your Ride History in the app. Receipts include complete fare breakdown, payment method, and trip details.',
      category: 'payment',
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payment FAQs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Questions about payments and billing
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

export default PaymentFAQScreen;