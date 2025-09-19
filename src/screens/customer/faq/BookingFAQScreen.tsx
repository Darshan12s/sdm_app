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

const BookingFAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'cancel-booking',
      question: 'How do I cancel a booking?',
      answer: 'To cancel a booking, go to your active ride screen and tap the "Cancel Ride" button. You can cancel up to 2 minutes after booking without charges. After 2 minutes, cancellation fees may apply. If your driver is more than 3 minutes late, you can cancel for free.',
      category: 'booking',
    },
    {
      id: 'modify-booking',
      question: 'Can I modify my booking?',
      answer: 'You can modify your pickup location up to 2 minutes after booking by tapping "Change Location" on the ride tracking screen. However, you cannot change the destination once a driver has accepted your ride. For destination changes, please cancel the current booking and create a new one.',
      category: 'booking',
    },
    {
      id: 'driver-late',
      question: 'What if my driver is late?',
      answer: 'If your driver is running late, you will receive notifications with updated arrival times. If the driver is more than 5 minutes late, you can call our support team for assistance. In case of excessive delays (more than 15 minutes), you may be eligible for a full refund.',
      category: 'booking',
    },
    {
      id: 'change-pickup',
      question: 'How to change pickup location?',
      answer: 'You can change your pickup location by tapping the "Edit" button next to the pickup address on the booking confirmation screen, or by using the "Change Location" option in the active ride screen. Changes are only allowed before the driver arrives at your location.',
      category: 'booking',
    },
    {
      id: 'multiple-bookings',
      question: 'Can I book multiple rides at once?',
      answer: 'Currently, you can only have one active booking at a time. If you need to book another ride, please wait until your current ride is completed or cancelled. This ensures better service quality and driver availability.',
      category: 'booking',
    },
    {
      id: 'scheduled-rides',
      question: 'How do I book a ride for later?',
      answer: 'To book a scheduled ride, select your pickup and drop locations, then tap "Schedule for Later" and choose your preferred date and time. Scheduled rides are confirmed 30 minutes before the pickup time. You will receive a confirmation notification.',
      category: 'booking',
    },
    {
      id: 'ride-sharing',
      question: 'Is ride sharing available?',
      answer: 'Yes, we offer ride sharing options to reduce costs and environmental impact. When booking, you can choose "Share Ride" to be matched with other passengers going in the same direction. Shared rides cost 30-50% less than regular rides.',
      category: 'booking',
    },
    {
      id: 'vehicle-types',
      question: 'What vehicle types are available?',
      answer: 'We offer various vehicle types: Sedan (4 seats, AC), SUV (6-7 seats, AC), Hatchback (4 seats, economical), and Premium (luxury vehicles). Choose based on your group size, luggage, and budget. Prices vary by vehicle type and distance.',
      category: 'booking',
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
          {/* <Ionicons name="arrow-back" size={24} color={colors.text} /> */}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {/* <Text style={[styles.headerTitle, { color: colors.text }]}>Booking FAQs</Text> */}
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Common questions about booking rides
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

export default BookingFAQScreen;