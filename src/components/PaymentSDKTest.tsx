import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { RazorpaySDKService } from '@/services/payment/razorpay-sdk';

export const PaymentSDKTest: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSDKTest = async () => {
    console.log('🧪 Testing Razorpay SDK integration...');
    const result = await RazorpaySDKService.testSDKIntegration();
    Alert.alert(
      result.success ? 'SDK Test Passed' : 'SDK Test Failed',
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
        Alert.alert(
          'Payment Successful!',
          `Payment ID: ${result.paymentId}\nOrder ID: ${result.orderId}`,
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
    <View style={styles.container}>
      <Text style={styles.title}>Razorpay SDK Test</Text>
      <Text style={styles.subtitle}>Test the official Razorpay React Native SDK integration</Text>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>SDK Integration Tests</Text>

        <TouchableOpacity style={styles.testButton} onPress={handleSDKTest}>
          <Text style={styles.testButtonText}>Test SDK Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={handleCreateOrderTest}>
          <Text style={styles.testButtonText}>Test Order Creation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, isProcessing && styles.testButtonDisabled]}
          onPress={handleTestPayment}
          disabled={isProcessing}
        >
          <Text style={styles.testButtonText}>
            {isProcessing ? 'Processing...' : 'Test Payment (₹1.00)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Test Information</Text>
        <Text style={styles.infoText}>
          • Uses official Razorpay React Native SDK{'\n'}
          • No WebView - direct native integration{'\n'}
          • Platform: {Platform.OS}{'\n'}
          • Test Card: 4111 1111 1111 1111{'\n'}
          • Expiry: 12/25, CVV: 123
        </Text>
      </View>

      <View style={styles.warningSection}>
        <Text style={styles.warningTitle}>⚠️ Important Notes</Text>
        <Text style={styles.warningText}>
          • SDK requires proper native setup{'\n'}
          • May need additional configuration for production{'\n'}
          • Test payments use Razorpay test environment{'\n'}
          • Check console logs for detailed error information
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3ccfa0',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  testSection: {
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#3ccfa0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3730a3',
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});