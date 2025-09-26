import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { RazorpaySDKService } from '@/services/payment/razorpay-sdk';
import { useTheme } from '@/contexts/ThemeContext';

export const PaymentSDKTest: React.FC = () => {
  const { colors } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSDKTest = async () => {
    console.log('🧪 Testing Razorpay SDK integration...');
    const result = await RazorpaySDKService.testSDKIntegration();
    Alert.alert(
      result.success ? 'Payment System Ready!' : 'SDK Test Failed - Using Fallback',
      result.message
    );
  };

  const handleTestPayment = async () => {
    setIsProcessing(true);

    try {
      console.log('💳 Starting test payment with Razorpay SDK...');

      // Test payment details
      const amount = 100; // ₹1.00 for testing
      const orderId = `test_order_${Date.now()}`;
      const customerName = 'Test User';
      const customerEmail = 'test@example.com';
      const customerPhone = '9999999999';
      const description = 'Test Payment - SDK Integration';

      const result = await RazorpaySDKService.initiatePayment(
        amount,
        'INR',
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        description
      );

      if (result.success) {
        const successMessage = result.fallback
          ? `Payment processed via web integration!\n\nPayment ID: ${result.paymentId}\nOrder ID: ${result.orderId}\n\n${result.message || ''}`
          : `Payment ID: ${result.paymentId}\nOrder ID: ${result.orderId}`;

        Alert.alert(
          'Payment Successful!',
          successMessage,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Payment Failed', result.error?.message || 'Unknown error');
      }

    } catch (error: any) {
      console.error('❌ Test payment error:', error);
      Alert.alert('Error', error.message || 'Test payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrderTest = async () => {
    try {
      console.log('📝 Testing order creation...');

      const orderData = await RazorpaySDKService.createOrder(
        {
          serviceType: 'city',
          vehicleType: 'sedan',
          pickupLocation: 'Test Location',
          passengers: 1
        },
        10000, // ₹100.00
        'upi'
      );

      if (orderData) {
        Alert.alert(
          'Order Created',
          `Order ID: ${orderData.order_id}\nAmount: ₹${orderData.amount / 100}`
        );
      } else {
        Alert.alert('Order Creation Failed', 'Could not create test order');
      }

    } catch (error: any) {
      console.error('❌ Order creation test error:', error);
      Alert.alert('Error', error.message || 'Order creation test failed');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Payment System Test</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Test Razorpay integration with automatic fallback support</Text>

      <View style={[styles.testSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment System Tests</Text>

        <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.primary }]} onPress={handleSDKTest}>
          <Text style={[styles.testButtonText, { color: colors.surface }]}>Test SDK Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, { backgroundColor: colors.primary }]} onPress={handleCreateOrderTest}>
          <Text style={[styles.testButtonText, { color: colors.surface }]}>Test Order Creation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.testButton,
            { backgroundColor: colors.primary },
            isProcessing && [styles.testButtonDisabled, { backgroundColor: colors.border }]
          ]}
          onPress={handleTestPayment}
          disabled={isProcessing}
        >
          <Text style={[
            styles.testButtonText,
            { color: colors.surface },
            isProcessing && [styles.testButtonTextDisabled, { color: colors.textMuted }]
          ]}>
            {isProcessing ? 'Processing...' : 'Test Payment (₹1.00)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoSection, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.infoTitle, { color: colors.primary }]}>Test Information</Text>
        <Text style={[styles.infoText, { color: colors.primary }]}>
          • Smart payment system with automatic fallback{'\n'}
          • Uses native SDK when available, web integration otherwise{'\n'}
          • Platform: {Platform.OS}{'\n'}
          • Test Card: 4111 1111 1111 1111{'\n'}
          • Expiry: 12/25, CVV: 123
        </Text>
      </View>

      <View style={[styles.warningSection, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.warningTitle, { color: colors.primary }]}>⚠️ Important Notes</Text>
        <Text style={[styles.warningText, { color: colors.primary }]}>
          • SDK requires proper native setup for Expo development builds{'\n'}
          • If SDK fails, payment automatically falls back to web integration{'\n'}
          • Test payments use Razorpay test environment{'\n'}
          • Check console logs for detailed error information{'\n'}
          • For production, ensure proper Expo configuration
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  testSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonDisabled: {
    // Colors applied inline with theme
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    // Colors applied inline with theme
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningSection: {
    borderRadius: 12,
    padding: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
});