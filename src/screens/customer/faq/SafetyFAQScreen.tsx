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

const SafetyFAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'emergency-contact',
      question: 'How to contact emergency services?',
      answer: 'For immediate emergencies, tap the Emergency button in the app or call 108 directly. The app automatically shares your location with emergency services. You can also use the emergency button during an active ride. Always prioritize your safety and call emergency services if you feel threatened.',
      category: 'safety',
    },
    {
      id: 'unsafe-situation',
      question: 'What if I feel unsafe?',
      answer: 'If you feel unsafe during a ride, immediately tap the Emergency button or call 108. The app will alert emergency services and share your location. You can also end the ride early and request a refund. Report the incident through the app after reaching a safe location.',
      category: 'safety',
    },
    {
      id: 'report-incident',
      question: 'How to report an incident?',
      answer: 'Go to Support > Report Incident or use the "Report" button after completing a ride. Provide details about what happened, including time, location, and description. You can also attach photos or videos. All reports are reviewed by our safety team within 24 hours.',
      category: 'safety',
    },
    {
      id: 'safety-tips',
      question: 'Safety tips for riders',
      answer: 'Share your ride details with trusted contacts. Verify your driver\'s identity matches the app. Sit in the back seat. Keep emergency contacts handy. Trust your instincts - if something feels wrong, cancel the ride. Use well-lit pickup locations. Never share personal information unnecessarily.',
      category: 'safety',
    },
    {
      id: 'driver-verification',
      question: 'How are drivers verified?',
      answer: 'All drivers undergo background checks, vehicle inspections, and document verification. They must have valid licenses, insurance, and clean driving records. Drivers are rated by passengers, and consistently low ratings result in account suspension. GPS tracking ensures route compliance.',
      category: 'safety',
    },
    {
      id: 'ride-tracking',
      question: 'How does ride tracking work?',
      answer: 'Real-time GPS tracking shows your driver\'s location and estimated arrival time. You can share your ride status with up to 3 trusted contacts. The app records the entire trip for safety purposes. Location data is encrypted and only used for safety and service purposes.',
      category: 'safety',
    },
    {
      id: 'sos-feature',
      question: 'What is the SOS feature?',
      answer: 'The SOS button in the app immediately alerts emergency services and shares your exact location. It also notifies your emergency contacts and our safety team. The feature works even without internet by sending SMS alerts. Use it only in genuine emergencies.',
      category: 'safety',
    },
    {
      id: 'child-safety',
      question: 'Safety measures for children?',
      answer: 'Children under 12 must be accompanied by an adult. Car seats are recommended for children under 7. Drivers are trained in child passenger safety. You can request child-friendly vehicles when booking. Always supervise children during the ride.',
      category: 'safety',
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Safety FAQs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Safety features and emergency procedures
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

export default SafetyFAQScreen;