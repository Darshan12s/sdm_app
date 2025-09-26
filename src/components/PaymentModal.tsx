import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PaymentWebView } from './PaymentWebView';
import { useTheme } from '@/contexts/ThemeContext';

interface PaymentModalProps {
  visible: boolean;
  paymentUrl: string;
  orderId: string;
  onPaymentSuccess: (paymentId: string, orderId: string) => void;
  onPaymentFailure: (error: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  paymentUrl,
  orderId,
  onPaymentSuccess,
  onPaymentFailure,
  onClose,
}) => {
  const { colors } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (paymentId: string, orderId: string) => {
    console.log('🎉 Payment completed successfully in modal');
    setIsProcessing(true);
    onPaymentSuccess(paymentId, orderId);
    // Close modal after a short delay to show success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    console.log('❌ Payment failed in modal:', error);
    onPaymentFailure(error);
    // Close modal after showing error
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={handleClose}
            disabled={isProcessing}
          >
            <MaterialIcons
              name="close"
              size={24}
              color={isProcessing ? colors.textMuted : colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Secure Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={[styles.processingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.processingText, { color: colors.text }]}>Processing payment...</Text>
            <Text style={[styles.processingSubtext, { color: colors.textSecondary }]}>Please wait</Text>
          </View>
        )}

        {/* Payment WebView */}
        <PaymentWebView
          paymentUrl={paymentUrl}
          orderId={orderId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={handleClose}
        />
      </View>
    </Modal>
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
    paddingTop: 50, // Account for status bar
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
});