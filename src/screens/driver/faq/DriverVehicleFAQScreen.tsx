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

const DriverVehicleFAQScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<DriverStackParamList>>();
  const { colors, isDark } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 'vehicle-registration',
      question: 'How to register my vehicle?',
      answer: 'Go to Profile > Vehicle Information and tap "Add Vehicle". Enter your vehicle details including make, model, year, color, and license plate number. Upload photos of your vehicle registration, insurance, and permit. Your vehicle will be verified within 24-48 hours.',
      category: 'vehicle',
    },
    {
      id: 'vehicle-documents',
      question: 'What documents do I need for vehicle verification?',
      answer: 'You need: 1) Vehicle Registration Certificate (RC), 2) Valid Insurance Certificate, 3) Pollution Under Control (PUC) Certificate, 4) Driver\'s License, 5) Vehicle Permit, and 6) Recent vehicle photos. All documents must be clear and valid.',
      category: 'vehicle',
    },
    {
      id: 'multiple-vehicles',
      question: 'Can I register multiple vehicles?',
      answer: 'Yes, you can register up to 2 vehicles on your account. However, you can only be online with one vehicle at a time. Switch between vehicles in the app settings. Each vehicle needs separate verification.',
      category: 'vehicle',
    },
    {
      id: 'vehicle-inspection',
      question: 'What happens during vehicle inspection?',
      answer: 'Our team conducts a physical inspection of your vehicle to ensure it meets safety standards. This includes checking brakes, tires, lights, seatbelts, and overall condition. The inspection is usually done at your location and takes about 30 minutes.',
      category: 'vehicle',
    },
    {
      id: 'vehicle-maintenance',
      question: 'How to update vehicle maintenance?',
      answer: 'Keep your vehicle well-maintained for better ratings. Regularly check and update your PUC certificate. Ensure your vehicle is clean and mechanically sound. Report any maintenance issues to support immediately.',
      category: 'vehicle',
    },
    {
      id: 'vehicle-types',
      question: 'What vehicle types are accepted?',
      answer: 'We accept sedans, SUVs, hatchbacks, and premium vehicles. All vehicles must be 2010 or newer, have 4 doors, AC, and seatbelts for all passengers. Commercial vehicles are not accepted.',
      category: 'vehicle',
    },
    {
      id: 'insurance-requirements',
      question: 'What are the insurance requirements?',
      answer: 'Your vehicle must have comprehensive insurance covering passenger liability. Minimum coverage of ₹15 lakhs for passenger liability is required. Insurance must be valid and renewed annually.',
      category: 'vehicle',
    },
    {
      id: 'vehicle-rejection',
      question: 'Why was my vehicle rejected?',
      answer: 'Vehicles are rejected if they don\'t meet safety standards, have expired documents, or fail inspection. Common reasons include damaged body, faulty brakes, expired insurance, or incomplete documentation. Contact support for specific rejection reasons.',
      category: 'vehicle',
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
          {/* <Text style={[styles.headerTitle, { color: colors.text }]}>Vehicle FAQs</Text> */}
          {/* <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Vehicle registration and documents
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

export default DriverVehicleFAQScreen;