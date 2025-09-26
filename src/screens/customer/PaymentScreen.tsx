import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { RazorpayService } from '../../services/payment/razorpay';
import { usePayment } from '../../hooks/usePayment';
import { useTheme } from '../../contexts/ThemeContext';

interface RouteParams {
  bookingId: string;
  amount: number;
  description: string;
}

export default function PaymentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { processPayment, isProcessing, formatAmount } = usePayment();

  const { bookingId, amount, description } = route.params as RouteParams;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', iconType: 'MaterialIcons' },
    { id: 'upi', name: 'UPI', icon: 'smartphone', iconType: 'MaterialIcons' },
    { id: 'netbanking', name: 'Net Banking', icon: 'account-balance', iconType: 'MaterialIcons' },
    { id: 'wallet', name: 'Wallet', icon: 'account-balance-wallet', iconType: 'MaterialIcons' },
  ];

  const handlePayment = async () => {
    const result = await processPayment(bookingId, amount, description || 'Cab booking payment');

    if (result.success) {
      navigation.goBack();
    }
    // Error handling is done in the hook
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => navigation.goBack(),
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Complete your booking payment</Text>
      </View>

      {/* Payment Summary */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>

        <View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Booking ID</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingId.slice(-8)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Description</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{description}</Text>
          </View>

          <View style={[styles.summaryDivider, { borderTopColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {formatAmount(amount)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Choose Payment Method</Text>

        <View>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedPaymentMethod === method.id && [
                  styles.paymentMethodSelected,
                  { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                ]
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <View style={styles.paymentMethodIcon}>
                <MaterialIcons name={method.icon as any} size={24} color={colors.textSecondary} />
              </View>
              <Text style={[
                styles.paymentMethodName,
                { color: colors.text },
                selectedPaymentMethod === method.id && [
                  styles.paymentMethodNameSelected,
                  { color: colors.primary, fontWeight: '600' as any }
                ]
              ]}>
                {method.name}
              </Text>
              {selectedPaymentMethod === method.id && (
                <MaterialIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: colors.border },
            selectedPaymentMethod && !isProcessing && [styles.payButtonActive, { backgroundColor: colors.primary }]
          ]}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.payButtonContent}>
              <ActivityIndicator color={colors.surface} size="small" />
              <Text style={[styles.payButtonText, { color: colors.surface }, styles.payButtonTextProcessing]}>Processing...</Text>
            </View>
          ) : (
            <Text style={[styles.payButtonText, { color: colors.surface }]}>
              Pay {formatAmount(amount)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isProcessing}
        >
          <Text style={[
            styles.cancelButtonText,
            { color: colors.textSecondary },
            isProcessing && [styles.cancelButtonTextDisabled, { color: colors.textMuted }]
          ]}>
            Cancel Payment
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <View style={[styles.securityCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <View style={styles.securityContent}>
            <MaterialIcons name="security" size={16} color={colors.primary} />
            <Text style={[styles.securityText, { color: colors.primary }]}>
              Your payment is secured with 256-bit SSL encryption
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryDivider: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    // Colors applied inline with theme
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
  },
  paymentMethodNameSelected: {
    // Colors applied inline with theme
  },
  paymentMethodCheck: {
    fontSize: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  payButtonActive: {
    // Colors applied inline with theme
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  payButtonTextProcessing: {
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonTextDisabled: {
    // Colors applied inline with theme
  },
  securityNote: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  securityCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    textAlign: 'center',
  },
});