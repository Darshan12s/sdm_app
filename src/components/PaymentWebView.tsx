import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface PaymentWebViewProps {
  paymentUrl: string;
  orderId: string;
  onPaymentSuccess: (paymentId: string, orderId: string) => void;
  onPaymentFailure: (error: string) => void;
  onClose: () => void;
}

export const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  paymentUrl,
  orderId,
  onPaymentSuccess,
  onPaymentFailure,
  onClose,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    console.log('🌐 WebView navigation:', navState.url);

    // Check for Razorpay payment completion
    if (navState.url.includes('razorpay_success') ||
        navState.url.includes('payment_success') ||
        navState.url.includes('success') ||
        navState.url.includes('callback')) {
      console.log('✅ Payment success detected');
      onPaymentSuccess(`webview_${Date.now()}`, orderId);
    } else if (navState.url.includes('razorpay_failure') ||
               navState.url.includes('payment_failure') ||
               navState.url.includes('failure') ||
               navState.url.includes('cancel')) {
      console.log('❌ Payment failure detected');
      onPaymentFailure('Payment was cancelled or failed');
    }

    // Check for Razorpay specific URLs
    if (navState.url.includes('checkout.razorpay.com') && navState.url.includes('success')) {
      console.log('✅ Razorpay success page detected');
      onPaymentSuccess(`razorpay_${Date.now()}`, orderId);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('🌐 WebView error:', nativeEvent);
    setError('Failed to load payment page');
    setIsLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('🌐 WebView HTTP error:', nativeEvent);
    setError(`HTTP Error: ${nativeEvent.statusCode}`);
    setIsLoading(false);
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color="#dc2626" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Payment Error</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => setError(null)}>
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payment page...</Text>
        </View>
      )}
    </View>
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});