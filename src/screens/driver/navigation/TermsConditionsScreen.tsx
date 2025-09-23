import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';

const TermsConditionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          {/* <Ionicons name="arrow-back" size={24} color={colors.text} /> */}
        </TouchableOpacity>
        {/* <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text> */}
        {/* <TouchableOpacity onPress={handleGoBack} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          This document outlines the terms and conditions ("Terms") for using the services offered by SDM E-Mobility Services Private Limited ("SDM," "we", "us", or "our"). These Terms govern your use of our electric vehicle (EV) rental services, including cab rentals, airport transfers, outstation trips, city rides, and taxi services.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acceptance of Terms</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            By using our services, booking a ride, or accessing our mobile application, you agree to be bound by these Terms. If you do not agree to all the Terms, you are not authorised to use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Offered</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            SDM provides a platform to connect you with eco-friendly electric vehicle (EV) transportation options. We offer the following services:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Cab Rentals: Book on EV cab for point-to-point travel within the city.
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Airport Transfers: Pre-book a comfortable and reliable EV for your airport arrival or departure.
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Outstation Trips: Travel to destinations outside the city limits in a spacious and efficient EV.
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • City Rides: Get around town conveniently with our on-demand EV taxi service.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking and Payment</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Bookings can be made through our mobile application, website, or by calling our customer service center. You will be provided with fare estimates during the booking process. Fares may vary based on distance, duration, service type, and any applicable taxes or fees. We accept various payment methods, including online payment gateways, debit/credit cards, and cash (subject to availability).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Eligibility</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            To use our services, you must be at least 18 years old and possess a valid government-issued ID. For airport transfers, you may be required to provide flight details during booking.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rider Conduct</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            You are responsible for the conduct of all passengers in the vehicle during your ride. Smoking, littering, and consumption of alcohol or illegal substances are strictly prohibited within the vehicle. We reserve the right to terminate your ride and remove you from the vehicle in case of disruptive or abusive behavior.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Availability and Condition</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We strive to provide you with a clean and well-maintained EV for your ride. While we make every effort to ensure vehicle availability, we cannot guarantee a specific EV model for your booking. We reserve the right to substitute a similar EV in case of unforeseen circumstances.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Charging and Range</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Our EVs are equipped with long-range batteries. You are not responsible for charging the vehicle during your ride. In case of low battery, the driver will take the most appropriate route to reach a charging station to ensure uninterrupted service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cancellations and Refunds</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Our cancellation policy is outlined during the booking process and may vary depending on the service type and notice period. Refunds, if applicable, will be processed in accordance with our policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Liability and Indemnification</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            SDM is not liable for any delays, accidents, or damages caused by factors beyond our control, including weather conditions, traffic congestion, or mechanical breakdowns. We are committed to your safety. However, you agree to indemnify and hold harmless SDM from any claims, damages, or losses arising from your use of our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We respect your privacy. Please refer to our separate Privacy Policy for details on how we collect, use, and disclose your personal information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Modifications to Terms</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We reserve the right to modify these Terms at any time. We will notify you of any significant changes by posting the updated Terms on our website or mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Governing Law and Dispute Resolution</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Mysuru, Karnataka and across India.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            If you have any questions regarding these Terms, please contact us at +91 9900992220 or info@sdm-emobility.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Thank you for choosing SDM E-Mobility Services! We are committed to providing you with a safe, convenient, and environmentally friendly transportation experience.
          </Text>
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletPoints: {
    marginTop: 8,
    paddingLeft: 16,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default TermsConditionsScreen;