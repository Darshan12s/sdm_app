import { useState } from 'react';
import { RazorpayService, PaymentData, PaymentResult } from '../services/payment/razorpay';
import { useAppStore, useUser } from '../stores/appStore';
import { Alert } from 'react-native';

export const usePayment = () => {
  const user = useUser();
  const { updateBookingStatus } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (
    bookingId: string,
    amount: number,
    description: string
  ): Promise<PaymentResult> => {
    if (!user) {
      const result: PaymentResult = {
        success: false,
        error: 'User not authenticated'
      };
      return result;
    }

    setIsProcessing(true);

    try {
      const paymentData: PaymentData = {
        amount: RazorpayService.formatAmount(amount),
        currency: 'INR',
        bookingId,
        customerId: user.id,
        customerName: user.full_name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone_no || '',
        description: description || 'Cab booking payment',
      };

      const result = await RazorpayService.initiatePayment(paymentData);

      if (result.success) {
        // Update booking status to completed after successful payment
        updateBookingStatus('completed');

        Alert.alert(
          'Payment Successful',
          `Payment of ${RazorpayService.formatDisplayAmount(amount)} completed successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          result.error || 'Payment could not be processed. Please try again.',
          [{ text: 'Try Again' }]
        );
      }

      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      const result: PaymentResult = {
        success: false,
        error: 'An unexpected error occurred during payment processing'
      };

      Alert.alert(
        'Payment Error',
        result.error,
        [{ text: 'OK' }]
      );

      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentStatus = async (paymentId: string) => {
    return await RazorpayService.getPaymentStatus(paymentId);
  };

  return {
    processPayment,
    getPaymentStatus,
    isProcessing,
    formatAmount: RazorpayService.formatDisplayAmount,
  };
};