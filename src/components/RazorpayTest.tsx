import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { RazorpayExpoService } from '@/services/payment/razorpay-expo';
import { useTheme } from '@/contexts/ThemeContext';

export const RazorpayTest: React.FC = () => {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runMobileTest = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Running Expo Razorpay test...');
      const result = await RazorpayExpoService.testExpoSetup();
      setTestResults(result);
      console.log('🧪 Test result:', result);

      Alert.alert(
        'Test Results',
        `Platform: ${result.platform}\nWeb Compatible: ${result.webCompatible}\nMobile Compatible: ${result.mobileCompatible}\nMock Working: ${result.mockWorking}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('🧪 Test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const runPaymentFlowTest = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Running Expo payment flow test...');
      const result = await RazorpayExpoService.testExpoSetup();
      setTestResults(result);
      console.log('🧪 Payment flow test result:', result);

      Alert.alert(
        'Payment Flow Test',
        `Platform: ${result.platform}\nWeb: ${result.webCompatible ? '✅' : '❌'}\nMobile: ${result.mobileCompatible ? '✅' : '❌'}\nMock: ${result.mockWorking ? '✅' : '❌'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('🧪 Payment flow test failed:', error);
      Alert.alert('Payment Flow Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const runAutoFix = async () => {
    setIsTesting(true);
    try {
      console.log('🔧 Running Expo setup verification...');
      const result = await RazorpayExpoService.testExpoSetup();
      console.log('🔧 Expo setup result:', result);

      const message = result.webCompatible && result.mobileCompatible && result.mockWorking
        ? '✅ Expo Razorpay setup is working correctly!'
        : '⚠️ Some components may need attention. Check console logs.';

      Alert.alert(
        'Expo Setup Check',
        `${message}\n\nPlatform: ${result.platform}\nWeb: ${result.webCompatible ? '✅' : '❌'}\nMobile: ${result.mobileCompatible ? '✅' : '❌'}\nMock: ${result.mockWorking ? '✅' : '❌'}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('🔧 Setup check failed:', error);
      Alert.alert('Setup Check Failed', error.message);
    } finally {
      setIsTesting(false);
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
          4. Check console logs for detailed information{'\n\n'}
          Expected Results:{'\n'}
          • Library Loaded: true{'\n'}
          • Open Method: true{'\n'}
          • Can Create Instance: true{'\n'}
          • Direct Call: true
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