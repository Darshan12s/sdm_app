import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PaymentModal } from './PaymentModal';

export const PaymentTest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');

  const handleTestPayment = () => {
    // Create a test payment URL (you would normally get this from your backend)
    const testUrl = 'https://checkout.razorpay.com/v1/payment?key=rzp_test_your_key_here&amount=10000&currency=INR&name=SDM+E-Mobility&description=Test+Payment&order_id=order_test_123&prefill_name=Test+User&prefill_email=test@example.com&prefill_contact=9999999999&theme_color=%233ccfa0';

    setPaymentUrl(testUrl);
    setOrderId('order_test_123');
    setShowModal(true);
  };

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    console.log('✅ Test payment success:', { paymentId, orderId });
    Alert.alert('Success', `Payment completed!\nPayment ID: ${paymentId}\nOrder ID: ${orderId}`);
  };

  const handlePaymentFailure = (error: string) => {
    console.log('❌ Test payment failed:', error);
    Alert.alert('Failed', `Payment failed: ${error}`);
  };

  const handleClose = () => {
    setShowModal(false);
    setPaymentUrl('');
    setOrderId('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Test</Text>
      <Text style={styles.subtitle}>Test the in-app Razorpay payment modal</Text>

      <TouchableOpacity style={styles.testButton} onPress={handleTestPayment}>
        <Text style={styles.testButtonText}>Test Payment Modal</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This will open Razorpay payment page within the app.{'\n'}
        Use test card: 4111 1111 1111 1111
      </Text>

      <PaymentModal
        visible={showModal}
        paymentUrl={paymentUrl}
        orderId={orderId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
        onClose={handleClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  testButton: {
    backgroundColor: '#3ccfa0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});