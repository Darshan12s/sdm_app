import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// Import services and stores
import { AuthService } from '../../services/supabase/auth';
import { useAppStore } from '../../stores/appStore';

// Import error message utilities
import { getUserFriendlyError } from '../../utils/errorMessages';

// Import types
import { AuthStackParamList } from '@/types/navigation';

type AuthFlowScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

export default function AuthFlowScreen() {
  const navigation = useNavigation<AuthFlowScreenNavigationProp>();
  const { setLoading } = useAppStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Timer state for resend OTP restriction
  const [sendTimer, setSendTimer] = useState(0);
  const [canSend, setCanSend] = useState(true);
  const sendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const SEND_COOLDOWN = 60; // 60 seconds cooldown

  // Timer effect for countdown
  useEffect(() => {
    if (sendTimer > 0) {
      sendTimerRef.current = setTimeout(() => {
        setSendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanSend(true);
    }

    // Cleanup timer on unmount or when timer reaches 0
    return () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
      }
    };
  }, [sendTimer]);

  // Start send cooldown timer
  const startSendCooldown = () => {
    setCanSend(false);
    setSendTimer(SEND_COOLDOWN);
  };

  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
      }
    };
  }, []);

  const handleSendOTP = async () => {
    if (!canSend) {
      Toast.show({
        type: 'warning',
        text1: 'Please Wait',
        text2: `You can send OTP again in ${sendTimer} seconds`,
      });
      return;
    }

    if (!phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your phone number',
      });
      return;
    }

    if (!AuthService.isValidPhone(phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return;
    }

    setIsLoading(true);
    // Don't call setLoading from appStore to avoid re-rendering AppNavigator

    try {
      const { data, error } = await AuthService.signInWithPhone(phoneNumber.trim());

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: getUserFriendlyError(error),
        });
      } else {
        console.log('OTP sent successfully, navigating to OTPVerification');
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Verification code sent to your phone',
        });

        console.log('Navigation object:', navigation);
        console.log('Navigation type:', typeof navigation);
        console.log('Navigation methods:', Object.keys(navigation));

        // Try different navigation approaches
        console.log('Current navigation state:', navigation.getState());

        // Try push first (adds to stack)
        try {
          navigation.push('OTPVerification', { phoneNumber: phoneNumber.trim() });
          console.log('Navigation.push called successfully');
        } catch (pushError) {
          console.error('Push failed:', pushError);
          // Try replace (replaces current screen)
          try {
            navigation.replace('OTPVerification', { phoneNumber: phoneNumber.trim() });
            console.log('Navigation.replace called successfully');
          } catch (replaceError) {
            console.error('Replace failed:', replaceError);
            // Final fallback: reset
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'OTPVerification',
                  params: { phoneNumber: phoneNumber.trim() }
                }
              ]
            });
            console.log('Navigation reset fallback successful');
          }
        }
        // Start cooldown timer after successful send
        startSendCooldown();
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getUserFriendlyError(error as Error),
      });
    } finally {
      setIsLoading(false);
      // Don't call setLoading(false) to avoid re-rendering AppNavigator
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Don't call setLoading from appStore to avoid re-rendering AppNavigator

    try {
      const { data, error } = await AuthService.signInWithGoogle();

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to sign in with Google',
        });
      } else {
        // Navigation will be handled automatically by the auth state listener
        console.log('Google sign-in initiated');
        Toast.show({
          type: 'info',
          text1: 'Google Sign-In',
          text2: 'Redirecting to Google...',
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getUserFriendlyError(error as Error),
      });
    } finally {
      setIsLoading(false);
      // Don't call setLoading(false) to avoid re-rendering AppNavigator
    }
  };

  const handleForgotPassword = () => {
    try {
      navigation.navigate('ForgotPassword');
    } catch (error) {
      console.error('Navigation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to navigate to forgot password screen',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <View style={styles.content}>
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image
              source={require('../../../assets/banner.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Welcome to SDM</Text>
              <Text style={styles.heroSubtitle}>
                Your journey to sustainable mobility starts here
              </Text>
            </View> */}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to SDM</Text>
            <Text style={styles.subtitle}>
               Your journey to sustainable mobility starts here
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  maxLength={10}
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* Forgot Password
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity> */}

            {/* Send OTP Button */}
            <TouchableOpacity
              onPress={handleSendOTP}
              style={[styles.button, (isLoading || !canSend) && styles.buttonDisabled]}
              disabled={isLoading || !canSend}
            >
              <Text style={styles.buttonText}>
                {isLoading
                  ? 'Sending OTP...'
                  : !canSend
                    ? `Send OTP in ${sendTimer}s`
                    : 'Send OTP'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Google Sign In */}
          {/* <View style={styles.googleSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  heroContainer: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 5,
    backgroundColor: '#f0f4f8',
    

  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(46, 139, 87, 0.85)', // Semi-transparent forest green
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#2E8B57', // Traditional forest green
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2E8B57', // Traditional forest green
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleSection: {
    marginTop: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});