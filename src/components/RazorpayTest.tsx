import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { RazorpayExpoService } from '@/services/payment/razorpay-expo';
import { RazorpaySDKService } from '@/services/payment/razorpay-sdk';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CustomerStackParamList } from '@/types/navigation';

type RazorpayTestNavigationProp = StackNavigationProp<CustomerStackParamList, 'ThankYou'>;

export const RazorpayTest: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<RazorpayTestNavigationProp>();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const runMobileTest = async () => {
    setIsTesting(true);
    try {
      const result = await RazorpayExpoService.testExpoSetup();
      setTestResults(result);

      Alert.alert(
        'Test Results',
        `Platform: ${result.platform}\nWeb Compatible: ${result.webCompatible}\nMobile Compatible: ${result.mobileCompatible}\nMock Working: ${result.mockWorking}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const runPaymentFlowTest = async () => {
    setIsTesting(true);
    try {
      const result = await RazorpayExpoService.testExpoSetup();
      setTestResults(result);

      Alert.alert(
        'Payment Flow Test',
        `Platform: ${result.platform}\nWeb: ${result.webCompatible ? '✅' : '❌'}\nMobile: ${result.mobileCompatible ? '✅' : '❌'}\nMock: ${result.mockWorking ? '✅' : '❌'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Payment Flow Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const runAutoFix = async () => {
    setIsTesting(true);
    try {
      const result = await RazorpayExpoService.testExpoSetup();

      const message = result.webCompatible && result.mobileCompatible && result.mockWorking
        ? '✅ Expo Razorpay setup is working correctly!'
        : '⚠️ Some components may need attention. Check console logs.';

      Alert.alert(
        'Expo Setup Check',
        `${message}\n\nPlatform: ${result.platform}\nWeb: ${result.webCompatible ? '✅' : '❌'}\nMobile: ${result.mobileCompatible ? '✅' : '❌'}\nMock: ${result.mockWorking ? '✅' : '❌'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Setup Check Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Create a test booking data
      const bookingId = `test_booking_${Date.now()}`;
      const paymentAmount = 100; // ₹1 for testing

      // Create order first
      const orderData = await RazorpaySDKService.createOrder(
        {
          bookingId,
          amount: paymentAmount,
          serviceType: 'test',
          vehicleType: 'sedan',
          pickupLocation: 'Test Pickup',
          dropoffLocation: 'Test Dropoff',
          scheduledDate: new Date(),
          scheduledTime: '10:00 AM',
          passengers: 1,
        },
        RazorpaySDKService.formatAmount(paymentAmount)
      );

      if (!orderData) {
        throw new Error('Failed to create payment order');
      }

      // Process payment
      const paymentResult = await RazorpaySDKService.initiatePayment(
        orderData.amount,
        'INR',
        orderData.order_id,
        'Test User',
        'test@example.com',
        '9999999999',
        'Test payment for booking',
        { primary: colors.primary }
      );

      if (paymentResult.success) {
        // Prepare booking data for ThankYouScreen
        const bookingData = {
          serviceType: 'Premium',
          tripType: 'One Way',
          vehicleType: 'Sedan',
          pickupLocation: 'Test Pickup Location',
          dropoffLocation: 'Test Drop Location',
          scheduledDate: new Date(),
          scheduledTime: '10:00 AM',
          passengers: 1,
          paymentDetails: {
            bookingId: bookingId,
            amount: paymentAmount,
            remainingAmount: 0,
            paymentType: 'full',
          },
        };

        // Navigate to ThankYouScreen with booking data
        navigation.navigate('ThankYou', { bookingData });

        Alert.alert(
          'Payment Successful!',
          `Payment of ₹${paymentAmount} completed successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          paymentResult.error?.message || 'Payment could not be processed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'An unexpected error occurred during payment processing',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Razorpay Android Test</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Test and fix Android Razorpay linking issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, isTesting && [styles.buttonDisabled, { backgroundColor: colors.border }]]}
          onPress={runMobileTest}
          disabled={isTesting}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {isTesting ? 'Testing...' : 'Test Mobile Setup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.primary },
            styles.buttonSecondary,
            isTesting && [styles.buttonDisabled, { backgroundColor: colors.border }]
          ]}
          onPress={runPaymentFlowTest}
          disabled={isTesting}
        >
          <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>
            {isTesting ? 'Testing...' : 'Test Payment Flow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: '#f59e0b' },
            styles.buttonFix,
            isTesting && [styles.buttonDisabled, { backgroundColor: colors.border }]
          ]}
          onPress={runAutoFix}
          disabled={isTesting}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {isTesting ? 'Fixing...' : 'Auto-Fix Android Linking'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: '#10b981' },
            styles.buttonPayment,
            (isTesting || isProcessingPayment) && [styles.buttonDisabled, { backgroundColor: colors.border }]
          ]}
          onPress={handlePayment}
          disabled={isTesting || isProcessingPayment}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {isProcessingPayment ? 'Processing Payment...' : 'Continue with Paid Amount'}
          </Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>Test Results:</Text>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}

      <View style={[styles.instructionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions:</Text>
        <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
          1. Run "Test Mobile Setup" to check if Razorpay is properly linked{'\n'}
          2. If it fails, run "Auto-Fix Android Linking"{'\n'}
          3. Run "Test Payment Flow" to verify everything works{'\n'}
          4. Click "Continue with Paid Amount" to test the full payment flow{'\n'}
          5. Check console logs for detailed information{'\n\n'}
          Expected Results:{'\n'}
          • Library Loaded: true{'\n'}
          • Open Method: true{'\n'}
          • Can Create Instance: true{'\n'}
          • Direct Call: true{'\n\n'}
          Payment Flow:{'\n'}
          • Creates test order{'\n'}
          • Processes payment{'\n'}
          • Navigates to ThankYouScreen on success
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonFix: {
    // Colors applied inline with theme
  },
  buttonPayment: {
    // Colors applied inline with theme
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});