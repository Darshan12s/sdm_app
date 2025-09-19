import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase/client';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/contexts/ThemeContext';

interface PaymentMethod {
  id: string;
  type: 'bank_account' | 'upi' | 'card';
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  card_number?: string;
  card_type?: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  iconType: string;
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', iconType: 'MaterialIcons' },
  { id: 'upi', name: 'UPI', icon: 'smartphone', iconType: 'MaterialIcons' },
  { id: 'netbanking', name: 'Net Banking', icon: 'account-balance', iconType: 'MaterialIcons' },
  { id: 'wallet', name: 'Wallet', icon: 'account-balance-wallet', iconType: 'MaterialIcons' },
];

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (!user) return;

      // Try to fetch from driver_payment_methods table
      const { data: paymentData, error: paymentError } = await supabase
        .from('driver_payment_methods')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentError) {
        if (paymentError.code === '42P01') {
          console.log('Driver payment methods table does not exist yet');
          // Set some mock data for demonstration
          setPaymentMethods([
            {
              id: '1',
              type: 'bank_account',
              account_number: '****1234',
              bank_name: 'State Bank of India',
              ifsc_code: 'SBIN0001234',
              account_holder_name: 'John Driver',
              is_primary: true,
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: '2',
              type: 'upi',
              upi_id: 'john.driver@paytm',
              is_primary: false,
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        } else {
          console.error('Error fetching payment methods:', paymentError);
        }
      } else {
        setPaymentMethods(paymentData || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load payment methods',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddPaymentMethod = () => {
    setShowPaymentMethodModal(true);
  };

  const handleSelectPaymentMethod = (methodId: string) => {
    setShowPaymentMethodModal(false);
    Toast.show({
      type: 'info',
      text1: 'Add Payment Method',
      text2: `${PAYMENT_METHOD_OPTIONS.find(m => m.id === methodId)?.name} selected. Feature coming soon.`,
    });
  };

  const handleSetPrimary = (methodId: string) => {
    Alert.alert(
      'Set as Primary',
      'Set this payment method as your primary method for receiving payments?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Primary',
          onPress: () => {
            setPaymentMethods(prev =>
              prev.map(method => ({
                ...method,
                is_primary: method.id === methodId,
              }))
            );
            Toast.show({
              type: 'success',
              text1: 'Primary payment method updated',
            });
          },
        },
      ]
    );
  };

  const handleDeleteMethod = (methodId: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
            Toast.show({
              type: 'success',
              text1: 'Payment method deleted',
            });
          },
        },
      ]
    );
  };

  const getPaymentMethodIcon = (type: string): keyof typeof FontAwesome.glyphMap => {
    switch (type) {
      case 'bank_account':
        return 'bank';
      case 'upi':
        return 'mobile';
      case 'card':
        return 'credit-card';
      default:
        return 'money';
    }
  };

  const getPaymentMethodTitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'bank_account':
        return `${method.bank_name}`;
      case 'upi':
        return 'UPI Payment';
      case 'card':
        return `${method.card_type} Card`;
      default:
        return 'Payment Method';
    }
  };

  const getPaymentMethodSubtitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'bank_account':
        return `${method.account_number} • ${method.account_holder_name}`;
      case 'upi':
        return method.upi_id;
      case 'card':
        return method.card_number;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payment methods...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBackground} />
      
      {/* Header */}
      {/* <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.scrollView}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="credit-card" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No Payment Methods</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              Add a payment method to receive your earnings
            </Text>
            <TouchableOpacity style={[styles.addMethodButton, { backgroundColor: colors.primary }]} onPress={handleAddPaymentMethod}>
              <Text style={styles.addMethodButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Payment Methods</Text>

            {paymentMethods.map((method) => (
              <View key={method.id} style={[styles.paymentMethodCard, { backgroundColor: colors.card }]}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
                    <FontAwesome
                      name={getPaymentMethodIcon(method.type)}
                      size={24}
                      color={colors.primary}
                    />
                    <View style={styles.methodDetails}>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>
                        {getPaymentMethodTitle(method)}
                      </Text>
                      <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                        {getPaymentMethodSubtitle(method)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.methodActions}>
                    {method.is_primary && (
                      <View style={[styles.primaryBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                    {method.is_verified && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.methodFooter, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.methodDate, { color: colors.textMuted }]}>
                    Added {new Date(method.created_at).toLocaleDateString()}
                  </Text>

                  <View style={styles.methodButtons}>
                    {!method.is_primary && (
                      <TouchableOpacity
                        style={[styles.setPrimaryButton, { backgroundColor: colors.surface }]}
                        onPress={() => handleSetPrimary(method.id)}
                      >
                        <Text style={[styles.setPrimaryButtonText, { color: colors.primary }]}>Set Primary</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteMethod(method.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={[styles.addAnotherButton, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={handleAddPaymentMethod}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.addAnotherButtonText, { color: colors.primary }]}>Add Another Payment Method</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Payment Method</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentMethodModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.paymentMethodOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectPaymentMethod(method.id)}
                >
                  <View style={styles.optionContent}>
                    <MaterialIcons
                      name={method.icon as any}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {method.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addMethodButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMethodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  methodSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  methodDate: {
    fontSize: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setPrimaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  setPrimaryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addAnotherButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
});

export default PaymentMethodsScreen;