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

const DriverEarningsFAQScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<DriverStackParamList>>();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'earnings-calculation',
      question: 'How are my earnings calculated?',
      answer: 'Your earnings are calculated as: Base fare + Distance fare + Time fare - Platform fee - Taxes. You can see the detailed breakdown for each ride in your earnings history. Weekly payouts are processed every Monday.',
      category: 'earnings',
    },
    {
      id: 'payment-methods',
      question: 'What payment methods are available?',
      answer: 'You can receive payments via Bank Transfer, UPI, or Paytm. Add your preferred payment method in Profile > Payment Methods. Ensure your bank details are accurate to avoid payment delays.',
      category: 'earnings',
    },
    {
      id: 'weekly-payouts',
      question: 'When do I get paid?',
      answer: 'Payments are processed weekly, every Monday for the previous week\'s earnings. You\'ll receive payment within 24-48 hours after processing. Check your transaction status in the Earnings section.',
      category: 'earnings',
    },
    {
      id: 'minimum-payout',
      question: 'Is there a minimum payout amount?',
      answer: 'Yes, the minimum payout amount is ₹100. If your weekly earnings are below ₹100, they will be carried forward to the next week until the minimum threshold is reached.',
      category: 'earnings',
    },
    {
      id: 'platform-fees',
      question: 'What are platform fees?',
      answer: 'Platform fees vary by city and vehicle type, typically ranging from 15-25% of the ride fare. This covers technology, insurance, and operational costs. Fees are automatically deducted from your earnings.',
      category: 'earnings',
    },
    {
      id: 'incentives-bonuses',
      question: 'How do incentives and bonuses work?',
      answer: 'Earn bonuses for completing certain number of rides, maintaining high ratings, or during peak hours. Bonuses are added to your weekly earnings and are paid out along with regular earnings.',
      category: 'earnings',
    },
    {
      id: 'taxes-deductions',
      question: 'What taxes are deducted?',
      answer: 'TDS (Tax Deducted at Source) of 1% is deducted on earnings above ₹50,000 per year. GST is also applicable on platform fees. All deductions are as per government regulations.',
      category: 'earnings',
    },
    {
      id: 'payment-issues',
      question: 'What if I don\'t receive payment?',
      answer: 'Check your payment method details and ensure they are correct. If payment is delayed beyond 48 hours, contact support with your transaction ID. Payments may be held for verification in case of suspicious activity.',
      category: 'earnings',
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

      {/* <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings FAQs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Payment methods and earnings
          </Text>
        </View>
      </View> */}

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

export default DriverEarningsFAQScreen;