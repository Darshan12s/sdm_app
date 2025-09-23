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

const DriverRidesFAQScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<DriverStackParamList>>();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'accepting-rides',
      question: 'How do I accept ride requests?',
      answer: 'When you\'re online, ride requests will appear as notifications. You have 15 seconds to accept or decline. Tap "Accept" to start the ride. If you don\'t respond, the request goes to another driver.',
      category: 'rides',
    },
    {
      id: 'ride-cancellation',
      question: 'What happens if I cancel a ride?',
      answer: 'Cancelling accepted rides affects your acceptance rate and may lead to penalties. Cancel only for genuine reasons. Multiple cancellations can result in temporary suspension. Always communicate with passengers before cancelling.',
      category: 'rides',
    },
    {
      id: 'passenger-no-show',
      question: 'What if passenger doesn\'t show up?',
      answer: 'Wait at the pickup location for 3 minutes. If the passenger doesn\'t arrive, mark them as "No Show" in the app. You\'ll still receive payment for waiting time. Contact support if this happens frequently.',
      category: 'rides',
    },
    {
      id: 'navigation-gps',
      question: 'How does in-app navigation work?',
      answer: 'The app provides turn-by-turn navigation to pickup and drop locations. Follow the GPS directions carefully. Update your location accuracy in phone settings for better navigation. Report any navigation issues to support.',
      category: 'rides',
    },
    {
      id: 'ride-completion',
      question: 'How to complete a ride?',
      answer: 'Once you reach the destination, tap "End Ride" in the app. Collect payment if cash ride, then rate the passenger. Ride completion confirms payment processing. Always verify the destination before ending the ride.',
      category: 'rides',
    },
    {
      id: 'peak-hours',
      question: 'What are peak hours?',
      answer: 'Peak hours are typically morning (8-10 AM) and evening (5-8 PM) on weekdays, and weekends. During peak hours, you may receive more ride requests and earn bonuses. Stay online during these times for maximum earnings.',
      category: 'rides',
    },
    {
      id: 'ride-sharing',
      question: 'How does ride sharing work for drivers?',
      answer: 'In ride sharing, multiple passengers going to nearby destinations are matched. You\'ll see multiple pickup/drop points. Complete all stops to finish the ride. Shared rides pay more than regular rides.',
      category: 'rides',
    },
    {
      id: 'emergency-situations',
      question: 'What to do in emergency situations?',
      answer: 'For any emergency during a ride, tap the emergency button in the app. It alerts authorities and shares your location. Stay calm, ensure passenger safety, and follow emergency protocols. Contact support immediately after.',
      category: 'rides',
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

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          {/* <Ionicons name="arrow-back" size={24} color={colors.text} /> */}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {/* <Text style={[styles.headerTitle, { color: colors.text }]}>Rides FAQs</Text> */}
          {/* <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Ride acceptance and completion
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

export default DriverRidesFAQScreen;