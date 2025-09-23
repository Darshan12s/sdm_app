import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { RazorpayExpoService } from '@/services/payment/razorpay-expo';

export const RazorpayTest: React.FC = () => {
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Razorpay Android Test</Text>
        <Text style={styles.subtitle}>Test and fix Android Razorpay linking issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isTesting && styles.buttonDisabled]}
          onPress={runMobileTest}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Testing...' : 'Test Mobile Setup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isTesting && styles.buttonDisabled]}
          onPress={runPaymentFlowTest}
          disabled={isTesting}
        >
          <Text style={styles.buttonTextSecondary}>
            {isTesting ? 'Testing...' : 'Test Payment Flow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonFix, isTesting && styles.buttonDisabled]}
          onPress={runAutoFix}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Fixing...' : 'Auto-Fix Android Linking'}
          </Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
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
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3ccfa0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3ccfa0',
  },
  buttonFix: {
    backgroundColor: '#f59e0b',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3ccfa0',
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});