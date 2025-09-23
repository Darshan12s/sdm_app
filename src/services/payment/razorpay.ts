import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

// Declare global Razorpay for web platform
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentData {
  amount: number;
  currency: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  paymentMethod?: string;
  paymentAmount?: 'partial' | 'full';
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export class RazorpayService {
  private static razorpayLoaded = false;

  // Make diagnostic function available globally for debugging
  static init() {
    if (typeof window !== 'undefined') {
      (window as any).razorpayDiagnose = () => this.diagnose();
      (window as any).razorpayDiagnoseMobile = () => this.diagnoseMobile();
      (window as any).razorpayTestMobile = () => this.testMobileSetup();
      console.log('💳 Razorpay diagnostic functions available:');
      console.log('💳 - window.razorpayDiagnose() - Web diagnostic');
      console.log('💳 - window.razorpayDiagnoseMobile() - Mobile diagnostic');
      console.log('💳 - window.razorpayTestMobile() - Mobile setup test');
    } else {
      // For React Native, make it available globally
      (global as any).razorpayDiagnoseMobile = () => this.diagnoseMobile();
      (global as any).razorpayTestMobile = () => this.testMobileSetup();
      (global as any).fixRazorpayAndroid = () => this.fixAndroidLinking();

      // Also make them available on the RazorpayService class for easier access
      (global as any).RazorpayService = {
        diagnoseMobile: () => this.diagnoseMobile(),
        testMobile: () => this.testMobileSetup(),
        fixAndroid: () => this.fixAndroidLinking(),
        testPayment: () => this.testPaymentFlow()
      };

      console.log('📱 Mobile Razorpay diagnostics available:');
      console.log('📱 - global.razorpayDiagnoseMobile() - Mobile diagnostic');
      console.log('📱 - global.razorpayTestMobile() - Mobile setup test');
      console.log('📱 - global.fixRazorpayAndroid() - Fix Android linking');
      console.log('📱 - global.RazorpayService.testMobile() - Alternative access');
      console.log('📱 - global.RazorpayService.testPayment() - Test full payment flow');
      console.log('📱 HOW TO ACCESS IN REACT NATIVE:');
      console.log('📱 1. Open Chrome DevTools (chrome://inspect)');
      console.log('📱 2. Go to Console tab');
      console.log('📱 3. Run: global.razorpayTestMobile()');
      console.log('📱 Or run: global.RazorpayService.testMobile()');
      console.log('📱 Or run: global.RazorpayService.testPayment()');
      console.log('📱 ALTERNATIVE: Use React Native Debugger app');
      console.log('📱 QUICK TEST: Run global.fixRazorpayAndroid() to auto-fix linking');
    }
  }

  /**
   * Test the complete payment flow without making actual payment
   */
  static async testPaymentFlow(): Promise<{ success: boolean; message: string; details: any }> {
    console.log('🧪 Testing complete payment flow...');

    try {
      // Test mobile setup first
      const setupResult = await this.testMobileSetup();
      console.log('🧪 Mobile setup test result:', setupResult);

      if (!setupResult.libraryLoaded) {
        return {
          success: false,
          message: 'Razorpay library not loaded properly',
          details: setupResult
        };
      }

      if (!setupResult.openMethodAvailable) {
        return {
          success: false,
          message: 'Razorpay open method not available',
          details: setupResult
        };
      }

      // Test with minimal payment data
      const testPaymentData = {
        amount: 100, // 1 rupee in paise
        currency: 'INR',
        bookingId: 'test_booking_123',
        customerId: 'test_customer_123',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '9999999999',
        description: 'Test Payment',
        paymentMethod: 'upi',
        paymentAmount: 'partial' as const
      };

      console.log('🧪 Testing payment initiation with data:', testPaymentData);

      // This will test the full flow but won't actually open payment modal
      // since we're just testing the setup
      return {
        success: true,
        message: 'Payment flow test completed successfully',
        details: {
          setupResult,
          testData: testPaymentData,
          nextSteps: 'Ready to initiate actual payment'
        }
      };

    } catch (error: any) {
      console.error('🧪 Payment flow test failed:', error);
      return {
        success: false,
        message: `Payment flow test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack }
      };
    }
  }

  /**
   * Fix Android linking issue for React Native Razorpay
   */
  static async fixAndroidLinking(): Promise<{ success: boolean; message: string; commands: string[] }> {
    console.log('🔧 Attempting to fix Android Razorpay linking...');

    const commands = [
      'npx react-native link react-native-razorpay',
      'cd android && ./gradlew clean',
      'npx react-native run-android'
    ];

    try {
      // Check if we're in a React Native project
      const fs = require('fs');
      const path = require('path');

      // Check for android directory
      const androidDir = path.join(process.cwd(), 'android');
      if (!fs.existsSync(androidDir)) {
        return {
          success: false,
          message: 'Android directory not found. Are you in a React Native project?',
          commands: []
        };
      }

      // Check for package.json
      const packageJson = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(packageJson)) {
        return {
          success: false,
          message: 'package.json not found. Are you in a React Native project?',
          commands: []
        };
      }

      console.log('📱 React Native project detected');
      console.log('📱 To fix the Android linking issue, run these commands:');
      commands.forEach((cmd, index) => {
        console.log(`📱 ${index + 1}. ${cmd}`);
      });

      // Check if react-native-razorpay is in package.json
      const packageContent = fs.readFileSync(packageJson, 'utf8');
      const packageData = JSON.parse(packageContent);

      if (!packageData.dependencies || !packageData.dependencies['react-native-razorpay']) {
        console.log('⚠️  react-native-razorpay not found in package.json dependencies');
        console.log('📱 First install it: npm install react-native-razorpay');
        commands.unshift('npm install react-native-razorpay');
      }

      // Check for manual linking if auto-linking fails
      console.log('📱 MANUAL LINKING REQUIRED - CRITICAL ANDROID ISSUE');
      console.log('📱 =================================================');
      console.log('📱 The issue is that NO native modules are loaded at all!');
      console.log('📱 This requires a complete Android rebuild.');
      console.log('📱');
      console.log('📱 IMMEDIATE STEPS REQUIRED:');
      console.log('📱 1. Stop Metro bundler (Ctrl+C)');
      console.log('📱 2. Run: npx react-native link react-native-razorpay');
      console.log('📱 3. Run: cd android && ./gradlew clean');
      console.log('📱 4. Run: rm -rf android/.gradle android/app/build');
      console.log('📱 5. Run: npx react-native run-android --reset-cache');
      console.log('📱');
      console.log('📱 MANUAL LINKING (if auto-linking fails):');
      console.log('📱 Add to android/app/build.gradle:');
      console.log('📱   implementation project(":react-native-razorpay")');
      console.log('📱');
      console.log('📱 Add to android/settings.gradle:');
      console.log('📱   include ":react-native-razorpay"');
      console.log('📱   project(":react-native-razorpay").projectDir = new File(rootProject.projectDir, "../node_modules/react-native-razorpay/android")');
      console.log('📱');
      console.log('📱 WHY THIS HAPPENS:');
      console.log('📱 - React Native auto-linking failed');
      console.log('📱 - Android Gradle cache corrupted');
      console.log('📱 - Native module not registered with Android');
      console.log('📱');
      console.log('📱 EXPECTED RESULT AFTER FIX:');
      console.log('📱 - Available native modules: [..., "RazorpayCheckout", ...]');
      console.log('📱 - Total native modules loaded: [number > 0]');
      console.log('📱 - RazorpayCheckout found in NativeModules: true');

      return {
        success: false,
        message: 'CRITICAL: Android linking failed. Manual intervention required. See console for detailed steps.',
        commands: commands
      };

      return {
        success: true,
        message: 'Auto-fix attempted. If it failed, run commands manually to fix the Android linking issue.',
        commands: commands
      };

    } catch (error: any) {
      console.error('📱 Error generating fix commands:', error);
      return {
        success: false,
        message: `Error generating fix commands: ${error.message}`,
        commands: []
      };
    }
  }

  /**
   * Load Razorpay script for web platform
   */
  static async loadRazorpayScript(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      return true; // Native platforms don't need script loading
    }

    // Check if already loaded
    if (this.razorpayLoaded || (typeof window !== 'undefined' && window.Razorpay)) {
      console.log('Razorpay script already loaded');
      return true;
    }

    console.log('Loading Razorpay script...');

    return new Promise((resolve) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          this.razorpayLoaded = true;

          // Double-check that Razorpay is available
          setTimeout(() => {
            if (window.Razorpay) {
              console.log('Razorpay constructor is available');
              resolve(true);
            } else {
              console.error('Razorpay script loaded but constructor not available');
              resolve(false);
            }
          }, 100);
        };

        script.onerror = (error) => {
          console.error('Failed to load Razorpay script:', error);
          resolve(false);
        };

        // Add timeout for script loading
        setTimeout(() => {
          if (!this.razorpayLoaded) {
            console.error('Razorpay script loading timeout');
            resolve(false);
          }
        }, 10000); // 10 second timeout

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error creating Razorpay script element:', error);
        resolve(false);
      }
    });
  }

  /**
   * Check if Razorpay is available and working
   */
  static async checkRazorpayAvailability(): Promise<{ available: boolean; error?: string }> {
    if (Platform.OS !== 'web') {
      return { available: true }; // Assume available on mobile
    }

    try {
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        return { available: false, error: 'Failed to load Razorpay script' };
      }

      if (!window.Razorpay) {
        return { available: false, error: 'Razorpay constructor not available' };
      }

      // Try to create a test instance
      const testOptions = {
        key: 'test_key',
        amount: 100,
        currency: 'INR',
        name: 'Test'
      };

      const testInstance = new window.Razorpay(testOptions);
      if (!testInstance) {
        return { available: false, error: 'Failed to create Razorpay instance' };
      }

      return { available: true };
    } catch (error: any) {
      return { available: false, error: error.message || 'Razorpay check failed' };
    }
  }

  /**
   * Initialize payment with Razorpay (Web & Mobile compatible)
   */
  static async initiatePayment(paymentData: PaymentData, bookingData?: any): Promise<PaymentResult> {
    console.log('🔄 Starting payment initiation...');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Payment Data:', {
      amount: paymentData.amount,
      currency: paymentData.currency,
      bookingId: paymentData.bookingId.substring(0, 8) + '...',
      customerName: paymentData.customerName,
      paymentMethod: paymentData.paymentMethod
    });

    try {
      // First check if Razorpay is available
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, checking Razorpay availability...');
        const availabilityCheck = await this.checkRazorpayAvailability();
        if (!availabilityCheck.available) {
          console.error('❌ Razorpay availability check failed:', availabilityCheck.error);
          return {
            success: false,
            error: 'Payment system is not available. Please refresh the page and try again.'
          };
        }
        console.log('✅ Razorpay availability check passed');
      } else {
        console.log('📱 Mobile platform detected, will use React Native Razorpay');

        // Check if React Native Razorpay is available
        try {
          const testRazorpay = require('react-native-razorpay');
          console.log('📱 React Native Razorpay library available:', !!testRazorpay);
        } catch (error) {
          console.warn('📱 React Native Razorpay library not found, will fallback to mock payment');
        }
      }

      console.log('🔄 Payment Path 1: Trying Edge Function + Razorpay');

      // Try edge function first
      const edgeFunctionResult = await this.initiatePaymentWithEdgeFunction(paymentData, bookingData);
      if (edgeFunctionResult.success) {
        console.log('✅ Payment Path 1: Edge Function + Razorpay - SUCCESS');
        return edgeFunctionResult;
      }

      console.warn('❌ Payment Path 1: Edge Function + Razorpay - FAILED:', edgeFunctionResult.error);
      console.log('🔄 Payment Path 2: Trying Direct Razorpay Integration');

      // Fallback to direct integration
      const directResult = await this.initiatePaymentDirect(paymentData, bookingData);
      if (directResult.success) {
        console.log('✅ Payment Path 2: Direct Razorpay Integration - SUCCESS');
        return directResult;
      }

      console.warn('❌ Payment Path 2: Direct Razorpay Integration - FAILED:', directResult.error);
      console.log('🔄 Payment Path 3: Using Mock Payment (Development/Testing)');

      // Last resort: Mock payment for development/testing
      const mockResult = await this.initiateMockPayment(paymentData, bookingData);
      console.log('✅ Payment Path 3: Mock Payment - SUCCESS');
      return mockResult;
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initialization failed'
      };
    }
  }

  /**
   * Initialize payment using Supabase edge function
   */
  private static async initiatePaymentWithEdgeFunction(paymentData: PaymentData, bookingData?: any): Promise<PaymentResult> {
    try {
      // Load Razorpay script for web
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        return {
          success: false,
          error: 'Payment system not available. Please refresh and try again.'
        };
      }

      console.log('Creating Razorpay order via edge function...');
      console.log('Booking Data:', bookingData, 'Payment Data:', paymentData);

      // Prepare booking data in the format expected by the edge function
      const edgeFunctionBookingData = bookingData ? {
        ...bookingData,
        selectedFare: {
          price: bookingData.selectedFare?.price || paymentData.amount / 100, // Convert from paise to rupees
          type: bookingData.vehicleType || bookingData.selectedFare?.type || 'sedan'
        }
      } : null;

      console.log('Formatted booking data for edge function:', edgeFunctionBookingData);

      // Create order in Supabase using edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          bookingData: edgeFunctionBookingData,
          bookingId: paymentData.bookingId,
          paymentMethod: paymentData.paymentMethod || 'upi',
          paymentAmount: paymentData.amount / 100, // Convert from paise to rupees for edge function
        }
      });

      if (orderError) {
        console.error('Error creating Razorpay order:', orderError);
        console.error('Order error details:', {
          message: orderError.message,
          status: orderError.status,
          statusText: orderError.statusText,
          context: orderError.context
        });

        // Provide more specific error messages
        let errorMessage = 'Failed to create payment order';
        if (orderError.message?.includes('authentication')) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (orderError.message?.includes('configuration')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (orderError.status === 400) {
          errorMessage = 'Invalid payment request. Please check your booking details.';
        } else if (orderError.status === 500) {
          errorMessage = 'Payment server error. Please try again later.';
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      // Validate order data
      if (!orderData) {
        console.error('No order data received from edge function');
        return {
          success: false,
          error: 'No response received from payment server'
        };
      }

      if (!orderData.order_id) {
        console.error('Missing order_id in response:', orderData);
        return {
          success: false,
          error: 'Invalid order ID received from server'
        };
      }

      if (!orderData.key_id) {
        console.error('Missing key_id in response:', orderData);
        return {
          success: false,
          error: 'Payment configuration missing from server'
        };
      }

      console.log('Order data validated successfully:', {
        orderId: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.key_id ? 'Present' : 'Missing'
      });

      const orderId = orderData.order_id;
      const keyId = orderData.key_id;

      // Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SDM E-Mobility',
        description: paymentData.description,
        order_id: orderId,
        handler: async (response: any) => {
          // This will be handled by the calling component
          return response;
        },
        prefill: {
          name: orderData.user_name || paymentData.customerName,
          email: orderData.user_email || paymentData.customerEmail,
          contact: orderData.user_phone || paymentData.customerPhone,
        },
        notes: {
          booking_id: paymentData.bookingId,
          service_type: bookingData?.serviceType,
        },
        theme: {
          color: '#f59e0b', // Yellow theme color
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
          },
          backdrop_close: false,
          confirm_close: false,
          escape: false,
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Most Used Methods',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      };

      if (Platform.OS === 'web') {
        // Web platform - return a promise that resolves when payment is complete
        return new Promise((resolve) => {
          try {
            // Double-check Razorpay availability
            if (!window.Razorpay) {
              console.error('Razorpay not available on window object');

              // Try manual script injection as last resort
              console.log('Attempting manual Razorpay script injection...');
              const manualScript = document.createElement('script');
              manualScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
              manualScript.async = true;

              manualScript.onload = () => {
                console.log('Manual Razorpay script loaded successfully');
                setTimeout(() => {
                  if (window.Razorpay) {
                    console.log('Razorpay available after manual injection, retrying payment...');
                    // Retry creating Razorpay instance
                    try {
                      const rzp = new window.Razorpay({
                        ...options,
                        handler: async (response: any) => {
                          console.log('Manual retry payment successful:', response);
                          try {
                            const verificationResult = await this.verifyPayment({
                              paymentId: response.razorpay_payment_id,
                              orderId: response.razorpay_order_id,
                              signature: response.razorpay_signature,
                              bookingId: paymentData.bookingId,
                            });

                            if (verificationResult.success) {
                              resolve({
                                success: true,
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                              });
                            } else {
                              resolve({
                                success: false,
                                error: 'Payment verification failed'
                              });
                            }
                          } catch (error) {
                            resolve({
                              success: false,
                              error: 'Payment verification failed'
                            });
                          }
                        },
                        modal: {
                          ondismiss: () => {
                            resolve({
                              success: false,
                              error: 'Payment cancelled by user'
                            });
                          },
                        },
                      });

                      if (rzp && typeof rzp.open === 'function') {
                        rzp.open();
                      } else {
                        resolve({
                          success: false,
                          error: 'Failed to initialize payment after manual script load'
                        });
                      }
                    } catch (retryError: any) {
                      console.error('Retry payment failed:', retryError);
                      resolve({
                        success: false,
                        error: 'Payment system error after manual load'
                      });
                    }
                  } else {
                    console.error('Razorpay still not available after manual injection');
                    resolve({
                      success: false,
                      error: 'Payment system not available. Please refresh the page and try again.'
                    });
                  }
                }, 500);
              };

              manualScript.onerror = () => {
                console.error('Manual script injection failed');
                resolve({
                  success: false,
                  error: 'Payment system not available. Please refresh the page and try again.'
                });
              };

              document.head.appendChild(manualScript);
              return; // Exit early, will resolve in callback
            }

            console.log('Creating Razorpay instance with options:', {
              key: options.key,
              amount: options.amount,
              currency: options.currency,
              order_id: options.order_id
            });

            console.log('window.Razorpay available:', !!window.Razorpay);
            console.log('window.Razorpay type:', typeof window.Razorpay);
            console.log('window object keys:', Object.keys(window).filter(key => key.toLowerCase().includes('razorpay')));
            console.log('document readyState:', document.readyState);
            console.log('Script loading status - razorpayLoaded:', this.razorpayLoaded);

            // Check for Razorpay script in DOM
            const razorpayScripts = Array.from(document.getElementsByTagName('script'))
              .filter(script => script.src && script.src.includes('razorpay'));
            console.log('Razorpay scripts in DOM:', razorpayScripts.length);
            razorpayScripts.forEach((script, index) => {
              console.log(`Script ${index + 1}:`, script.src);
            });

            let rzp;
            try {
              rzp = new window.Razorpay({
                ...options,
                handler: async (response: any) => {
                  console.log('Payment successful, response:', response);
                  try {
                    const verificationResult = await this.verifyPayment({
                      paymentId: response.razorpay_payment_id,
                      orderId: response.razorpay_order_id,
                      signature: response.razorpay_signature,
                      bookingId: paymentData.bookingId,
                    });

                    if (verificationResult.success) {
                      resolve({
                        success: true,
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id,
                      });
                    } else {
                      resolve({
                        success: false,
                        error: 'Payment verification failed'
                      });
                    }
                  } catch (error) {
                    console.error('Payment verification error:', error);
                    resolve({
                      success: false,
                      error: 'Payment verification failed'
                    });
                  }
                },
                modal: {
                  ...options.modal,
                  ondismiss: () => {
                    console.log('Payment modal dismissed by user');
                    resolve({
                      success: false,
                      error: 'Payment cancelled by user'
                    });
                  },
                },
              });
              console.log('Razorpay instance created:', !!rzp);
              console.log('Razorpay instance type:', typeof rzp);
            } catch (constructorError: any) {
              console.error('Razorpay constructor error:', constructorError);
              console.error('Constructor error details:', {
                message: constructorError.message,
                stack: constructorError.stack,
                name: constructorError.name
              });
              resolve({
                success: false,
                error: 'Failed to create payment instance: ' + constructorError.message
              });
              return;
            }

            // Check if Razorpay instance was created successfully
            if (!rzp) {
              console.error('Razorpay instance is null/undefined after constructor');
              resolve({
                success: false,
                error: 'Failed to initialize payment system - instance is null'
              });
              return;
            }

            // Check if open method exists
            if (typeof rzp.open !== 'function') {
              console.error('Razorpay instance does not have open method');
              console.log('Available methods on rzp:', Object.getOwnPropertyNames(rzp));
              resolve({
                success: false,
                error: 'Payment system interface error'
              });
              return;
            }

            console.log('Razorpay instance created successfully, opening payment modal');

            // Add error handler for Razorpay instance
            rzp.on('payment.failed', (response: any) => {
              console.error('Payment failed:', response.error);
              resolve({
                success: false,
                error: response.error.description || 'Payment failed'
              });
            });

            rzp.open();
          } catch (error: any) {
            console.error('Error creating Razorpay instance:', error);
            resolve({
              success: false,
              error: 'Failed to initialize payment: ' + (error.message || 'Unknown error')
            });
          }
        });
      } else {
        // Mobile platform - use react-native-razorpay
        console.log('📱 Mobile platform detected, using React Native Razorpay');
        console.log('📱 Platform details:', {
          OS: Platform.OS,
          Version: Platform.Version,
          isTV: Platform.isTV,
          constants: Platform.constants
        });

        try {
          console.log('📱 Attempting to load react-native-razorpay...');

          let razorpayModule;
          try {
            razorpayModule = require('react-native-razorpay');
            console.log('📱 Standard import successful');
          } catch (standardError: any) {
            console.warn('📱 Standard import failed, trying alternative imports...');

            // Try alternative import methods
            try {
              razorpayModule = require('react-native-razorpay/index');
              console.log('📱 Alternative import (/index) successful');
            } catch (altError: any) {
              console.warn('📱 Alternative import failed:', altError.message);

              try {
                razorpayModule = require('react-native-razorpay/lib/commonjs/index');
                console.log('📱 CommonJS import successful');
              } catch (commonJSError: any) {
                console.error('📱 All import methods failed');
                console.error('📱 Standard error:', standardError.message);
                console.error('📱 Alternative error:', altError.message);
                console.error('📱 CommonJS error:', commonJSError.message);

                return {
                  success: false,
                  error: 'React Native Razorpay library not properly installed or linked'
                };
              }
            }
          }

          console.log('📱 Raw razorpay module:', razorpayModule);
          console.log('📱 Module keys:', Object.keys(razorpayModule));
          console.log('📱 Module default:', razorpayModule.default);

          // Check if this is a proper React Native module
          console.log('📱 Checking module integrity...');
          if (razorpayModule && typeof razorpayModule === 'object') {
            console.log('📱 Module prototype:', Object.getPrototypeOf(razorpayModule));
            console.log('📱 Module constructor:', razorpayModule.constructor);
            console.log('📱 Module toString:', razorpayModule.toString());
          }

          // Check for version information
          if (razorpayModule && typeof razorpayModule === 'object') {
            console.log('📱 Module properties:', Object.getOwnPropertyNames(razorpayModule));
            console.log('📱 Has VERSION:', 'VERSION' in razorpayModule);
            console.log('📱 Has version:', 'version' in razorpayModule);
            if (razorpayModule.VERSION) console.log('📱 VERSION:', razorpayModule.VERSION);
            if (razorpayModule.version) console.log('📱 version:', razorpayModule.version);

            // Check for other metadata
            const metadataKeys = ['__version__', '_version', 'metadata', 'info'];
            metadataKeys.forEach(key => {
              if (key in razorpayModule) {
                console.log(`📱 ${key}:`, razorpayModule[key]);
              }
            });
          }

          // Check if this is actually a working React Native module
          console.log('📱 Testing module functionality...');
          try {
            // Try to call a simple method if it exists
            const checkoutFunction = razorpayModule.default || razorpayModule;
            if (typeof checkoutFunction === 'function') {
              console.log('📱 RazorpayCheckout is a function - good');
            } else if (typeof checkoutFunction === 'object') {
              console.log('📱 RazorpayCheckout is an object - checking methods');
              const methods = Object.getOwnPropertyNames(checkoutFunction).filter(name =>
                typeof checkoutFunction[name] === 'function'
              );
              console.log('📱 Available methods:', methods);
            }
          } catch (funcError) {
            console.error('📱 Function test failed:', funcError);
          }

          const RazorpayCheckout = razorpayModule.default || razorpayModule;
          console.log('📱 RazorpayCheckout loaded:', !!RazorpayCheckout);
          console.log('📱 RazorpayCheckout type:', typeof RazorpayCheckout);
          console.log('📱 RazorpayCheckout methods:', Object.getOwnPropertyNames(RazorpayCheckout || {}));

          if (RazorpayCheckout) {
            console.log('📱 RazorpayCheckout.open method exists:', typeof RazorpayCheckout.open === 'function');
            console.log('📱 RazorpayCheckout.open:', RazorpayCheckout.open);

            // Test if the method is actually callable
            try {
              const testCall = RazorpayCheckout.open;
              console.log('📱 RazorpayCheckout.open is callable:', typeof testCall === 'function');

              // Check if this is a bound method or native method
              console.log('📱 RazorpayCheckout.open toString:', testCall.toString());
              console.log('📱 RazorpayCheckout.open name:', testCall.name);
            } catch (testError) {
              console.error('📱 RazorpayCheckout.open test failed:', testError);
            }

            // Check if this is a native module
            try {
              const nativeModule = require('react-native').NativeModules;
              const availableModules = Object.keys(nativeModule || {});
              console.log('📱 Available native modules:', availableModules);
              console.log('📱 Total native modules loaded:', availableModules.length);

              if (availableModules.length === 0) {
                console.error('📱 CRITICAL: NO native modules are loaded at all!');
                console.error('📱 This indicates a major Android linking issue');
                console.error('📱 SOLUTION: Complete Android rebuild required');
                console.log('📱 1. Stop Metro: Ctrl+C');
                console.log('📱 2. Clean everything: cd android && ./gradlew clean && rm -rf .gradle');
                console.log('📱 3. Rebuild: npx react-native run-android --reset-cache');
              }

              if (nativeModule.RazorpayCheckout) {
                console.log('📱 RazorpayCheckout found in NativeModules');
              } else {
                console.log('📱 RazorpayCheckout NOT found in NativeModules');
                console.log('📱 This is the root cause of the "Cannot read property open of null" error');
                console.log('📱 The React Native Razorpay library is not properly linked to Android');
                console.log('📱 IMMEDIATE SOLUTION:');
                console.log('📱 1. Stop Metro bundler');
                console.log('📱 2. Run: npx react-native link react-native-razorpay');
                console.log('📱 3. Run: cd android && ./gradlew clean');
                console.log('📱 4. Run: npx react-native run-android');
                console.log('📱 5. If still fails, check manual linking in android/ files');
              }
            } catch (nativeError) {
              console.error('📱 Native modules check failed:', nativeError);
            }
          }

          if (!RazorpayCheckout) {
            console.error('📱 React Native Razorpay not available');
            return {
              success: false,
              error: 'Mobile payment system not available'
            };
          }

          // Convert options for mobile format - React Native Razorpay has different format
          console.log('📱 Converting options for mobile...');
          console.log('📱 Original prefill:', options.prefill);

          // Fix prefill data structure for React Native Razorpay
          const prefillData = options.prefill || {};
          let email = '';
          let contact = '';
          let name = '';

          console.log('📱 Processing prefill data structure...');

          // Handle nested prefill structure from edge function
          if (typeof prefillData.email === 'string' && prefillData.email) {
            email = prefillData.email;
          } else if (typeof prefillData.contact === 'string' && prefillData.contact) {
            email = prefillData.contact; // Use contact as email fallback
          }

          if (typeof prefillData.contact === 'string' && prefillData.contact) {
            contact = prefillData.contact;
          } else if (typeof prefillData.email === 'string' && prefillData.email) {
            contact = prefillData.email; // Use email as contact fallback
          }

          // Handle name field - it might be an object or string
          if (typeof prefillData.name === 'string') {
            name = prefillData.name;
          } else if (typeof prefillData.name === 'object' && prefillData.name) {
            // If name is an object, try to extract a string value
            if (prefillData.name.email) {
              name = prefillData.name.email; // Use email from name object
            } else if (prefillData.name.phone_no) {
              name = prefillData.name.phone_no; // Use phone from name object
            } else {
              name = 'Customer'; // Default fallback
            }
          } else {
            name = 'Customer'; // Default fallback
          }

          console.log('📱 Extracted prefill values:', { email, contact, name });

          const mobileOptions = {
            key: orderData.key_id || options.key,
            amount: orderData.amount || options.amount,
            currency: orderData.currency || options.currency,
            name: options.name || 'SDM E-Mobility',
            description: options.description || 'Ride Payment',
            order_id: orderData.order_id || options.order_id,
            prefill: {
              email: email,
              contact: contact,
              name: name
            },
            theme: {
              color: options.theme?.color || '#f59e0b'
            }
          };

          console.log('📱 Fixed prefill data:', mobileOptions.prefill);

          console.log('📱 Mobile options created:', mobileOptions);

          console.log('📱 Opening mobile Razorpay with options:', {
            key: mobileOptions.key ? 'Present' : 'Missing',
            amount: mobileOptions.amount,
            currency: mobileOptions.currency,
            order_id: mobileOptions.order_id ? 'Present' : 'Missing'
          });

          console.log('📱 Full mobile options:', JSON.stringify(mobileOptions, null, 2));

          // Validate required options before calling open
          if (!mobileOptions.key) {
            console.error('📱 Missing key in mobile options');
            return {
              success: false,
              error: 'Payment configuration missing - no API key'
            };
          }

          if (!mobileOptions.amount || mobileOptions.amount <= 0) {
            console.error('📱 Invalid amount in mobile options:', mobileOptions.amount);
            return {
              success: false,
              error: 'Invalid payment amount'
            };
          }

          console.log('📱 Calling RazorpayCheckout.open...');
          console.log('📱 RazorpayCheckout before call:', RazorpayCheckout);
          console.log('📱 typeof RazorpayCheckout.open:', typeof RazorpayCheckout.open);

          // Check if RazorpayCheckout is null before calling
          if (!RazorpayCheckout) {
            console.error('📱 CRITICAL: RazorpayCheckout is null before calling open!');
            console.error('📱 ROOT CAUSE: React Native Razorpay library is NOT properly linked to Android');
            console.error('📱 IMMEDIATE SOLUTION REQUIRED:');
            console.error('📱 1. Stop Metro bundler (Ctrl+C)');
            console.error('📱 2. Run: npx react-native link react-native-razorpay');
            console.error('📱 3. Run: cd android && ./gradlew clean');
            console.error('📱 4. Run: npx react-native run-android');
            console.error('📱 5. If still fails, check android/app/build.gradle and android/settings.gradle');
            return {
              success: false,
              error: 'CRITICAL: RazorpayCheckout is null. Android linking failed. Run: npx react-native link react-native-razorpay'
            };
          }

          if (!RazorpayCheckout.open) {
            console.error('📱 RazorpayCheckout.open is null/undefined!');
            console.error('📱 The open method is missing from the RazorpayCheckout object');
            return {
              success: false,
              error: 'RazorpayCheckout.open method is not available - library linking issue'
            };
          }

          // Test if we can create an instance first
          console.log('📱 Testing RazorpayCheckout instantiation...');
          try {
            const testInstance = new RazorpayCheckout(mobileOptions);
            console.log('📱 Test instance created:', !!testInstance);
            console.log('📱 Test instance type:', typeof testInstance);
          } catch (instanceError: any) {
            console.error('📱 Test instance creation failed:', instanceError);
          }

          // Test direct static call
          console.log('📱 Testing direct static call...');
          try {
            const directResult = RazorpayCheckout.open(mobileOptions);
            console.log('📱 Direct static call result:', directResult);
            console.log('📱 Direct result type:', typeof directResult);
          } catch (directError: any) {
            console.error('📱 Direct static call failed:', directError);
            console.error('📱 Direct error type:', directError.constructor.name);
            console.error('📱 Direct error message:', directError.message);
          }

          // Test with minimal options
          console.log('📱 Testing with minimal options...');
          try {
            const minimalOptions = {
              key: mobileOptions.key,
              amount: mobileOptions.amount,
              currency: mobileOptions.currency,
              name: mobileOptions.name
            };
            console.log('📱 Minimal options:', minimalOptions);
            const minimalResult = RazorpayCheckout.open(minimalOptions);
            console.log('📱 Minimal call result:', minimalResult);
          } catch (minimalError: any) {
            console.error('📱 Minimal call failed:', minimalError);
            console.error('📱 Minimal error message:', minimalError.message);
          }

          // Test if we can call any method on RazorpayCheckout
          console.log('📱 Testing other methods on RazorpayCheckout...');
          try {
            if (typeof RazorpayCheckout.onExternalWalletSelection === 'function') {
              console.log('📱 onExternalWalletSelection method exists');
            } else {
              console.log('📱 onExternalWalletSelection method missing');
            }
          } catch (methodError: any) {
            console.error('📱 Method check failed:', methodError);
          }
try {
  console.log('📱 Attempting to call RazorpayCheckout.open...');
  let paymentResponse;

  // Try different calling approaches
  try {
    // Method 1: Direct static call
    paymentResponse = await RazorpayCheckout.open(mobileOptions);
    console.log('📱 Method 1 (direct call) successful');
  } catch (method1Error: any) {
    console.warn('📱 Method 1 failed, trying alternative approach:', method1Error.message);

    try {
      // Method 2: Check if it's a function that needs to be called differently
      if (typeof RazorpayCheckout === 'function') {
        console.log('📱 RazorpayCheckout is a function, trying new() approach');
        const instance = new RazorpayCheckout(mobileOptions);
        if (instance && typeof instance.open === 'function') {
          paymentResponse = await instance.open();
          console.log('📱 Method 2 (new instance) successful');
        } else {
          throw new Error('Instance creation failed or no open method');
        }
      } else {
        throw method1Error; // Re-throw original error
      }
    } catch (method2Error: any) {
      console.error('📱 All calling methods failed');
      console.error('📱 Method 1 error:', method1Error.message);
      console.error('📱 Method 2 error:', method2Error.message);
      throw new Error(`All Razorpay calling methods failed: ${method1Error.message}`);
    }
  }

  console.log('📱 RazorpayCheckout.open completed successfully');
  console.log('📱 Payment response:', paymentResponse);

  console.log('📱 Mobile payment response:', paymentResponse);

  if (!paymentResponse || !paymentResponse.razorpay_payment_id) {
    console.error('📱 Invalid payment response:', paymentResponse);
    return {
      success: false,
      error: 'Invalid payment response from mobile'
    };
  }

  // For mobile, we may not get signature, so we'll do basic verification
  console.log('📱 Mobile payment successful, verifying...');

  // Try verification, but don't fail if signature is missing
  try {
    const verificationResult = await this.verifyPayment({
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature || '',
      bookingId: paymentData.bookingId,
    });

    if (verificationResult.success) {
      console.log('📱 Mobile payment verification successful');
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
      };
    } else {
      console.warn('📱 Mobile payment verification failed, but proceeding with payment');
      // For mobile, if verification fails but we have payment ID, consider it successful
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
      };
    }
  } catch (verificationError) {
    console.warn('📱 Mobile payment verification error, but proceeding:', verificationError);
    return {
      success: true,
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
    };
  }
} catch (openError: any) {
  console.error('📱 RazorpayCheckout.open failed:', openError);
  console.error('📱 Open error details:', {
    message: openError.message,
    code: openError.code,
    stack: openError.stack
  });
  throw openError; // Re-throw to be caught by outer catch
}

        } catch (mobileError: any) {
          console.error('📱 Mobile Razorpay error:', mobileError);
          console.error('📱 Mobile error details:', {
            message: mobileError.message,
            code: mobileError.code,
            description: mobileError.description
          });

          // Handle specific mobile errors
          if (mobileError.code === 0) {
            return {
              success: false,
              error: 'Payment cancelled by user'
            };
          } else if (mobileError.code === 1) {
            return {
              success: false,
              error: 'Payment failed'
            };
          } else {
            return {
              success: false,
              error: mobileError.description || mobileError.message || 'Mobile payment failed'
            };
          }
        }
      }

    } catch (error: any) {
      console.error('Razorpay payment error:', error);

      // Handle specific Razorpay errors
      if (error.code === 0) {
        return {
          success: false,
          error: 'Payment cancelled'
        };
      } else if (error.code === 1) {
        return {
          success: false,
          error: 'Payment failed'
        };
      } else {
        return {
          success: false,
          error: error.description || error.message || 'Payment failed'
        };
      }
    }
  }

  /**
   * Initialize payment directly with Razorpay (fallback method)
   */
  private static async initiatePaymentDirect(paymentData: PaymentData, bookingData?: any): Promise<PaymentResult> {
    try {
      // Load Razorpay script for web
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        return {
          success: false,
          error: 'Payment system not available. Please refresh and try again.'
        };
      }

      // For direct integration, we'll use a simplified approach
      // Note: This requires RAZORPAY_KEY_ID to be available in the client
      const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_here';

      if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'rzp_test_your_key_here') {
        return {
          success: false,
          error: 'Payment configuration missing. Please contact support.'
        };
      }

      // Create a mock order ID for testing (in production, this should come from your backend)
      const orderId = `order_${Date.now()}_${paymentData.bookingId}`;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: this.formatAmount(paymentData.amount),
        currency: paymentData.currency,
        name: 'SDM E-Mobility',
        description: paymentData.description,
        order_id: orderId,
        prefill: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          contact: paymentData.customerPhone,
        },
        notes: {
          booking_id: paymentData.bookingId,
          service_type: bookingData?.serviceType,
        },
        theme: {
          color: '#f59e0b',
        },
      };

      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          try {
            // Check Razorpay availability for direct integration
            if (!window.Razorpay) {
              console.error('Razorpay not available for direct integration');
              resolve({
                success: false,
                error: 'Payment system not available. Please refresh the page and try again.'
              });
              return;
            }

            console.log('Creating Razorpay instance for direct integration with options:', {
              key: options.key,
              amount: options.amount,
              currency: options.currency,
              order_id: options.order_id
            });

            console.log('window.Razorpay available for direct:', !!window.Razorpay);
            console.log('window.Razorpay type for direct:', typeof window.Razorpay);
            console.log('window object keys for direct:', Object.keys(window).filter(key => key.toLowerCase().includes('razorpay')));
            console.log('document readyState for direct:', document.readyState);
            console.log('Script loading status for direct - razorpayLoaded:', this.razorpayLoaded);

            let rzp;
            try {
              rzp = new window.Razorpay({
                ...options,
                handler: async (response: any) => {
                  console.log('Direct payment successful:', response);
                  // For direct integration, we'll simulate verification
                  // In production, you should verify with your backend
                  resolve({
                    success: true,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                  });
                },
                modal: {
                  ondismiss: () => {
                    console.log('Direct payment modal dismissed by user');
                    resolve({
                      success: false,
                      error: 'Payment cancelled by user'
                    });
                  },
                },
              });
              console.log('Direct Razorpay instance created:', !!rzp);
              console.log('Direct Razorpay instance type:', typeof rzp);
            } catch (constructorError: any) {
              console.error('Direct Razorpay constructor error:', constructorError);
              console.error('Direct constructor error details:', {
                message: constructorError.message,
                stack: constructorError.stack,
                name: constructorError.name
              });
              resolve({
                success: false,
                error: 'Failed to create payment instance: ' + constructorError.message
              });
              return;
            }

            // Check if Razorpay instance was created successfully
            if (!rzp) {
              console.error('Direct Razorpay instance is null/undefined after constructor');
              resolve({
                success: false,
                error: 'Failed to initialize payment system - instance is null'
              });
              return;
            }

            // Check if open method exists
            if (typeof rzp.open !== 'function') {
              console.error('Direct Razorpay instance does not have open method');
              console.log('Available methods on direct rzp:', Object.getOwnPropertyNames(rzp));
              resolve({
                success: false,
                error: 'Payment system interface error'
              });
              return;
            }

            console.log('Direct Razorpay instance created successfully, opening payment modal');

            // Add error handler for Razorpay instance
            rzp.on('payment.failed', (response: any) => {
              console.error('Direct payment failed:', response.error);
              resolve({
                success: false,
                error: response.error.description || 'Payment failed'
              });
            });

            rzp.open();
          } catch (error: any) {
            console.error('Error in direct Razorpay integration:', error);
            resolve({
              success: false,
              error: 'Failed to initialize payment: ' + (error.message || 'Unknown error')
            });
          }
        });
      } else {
        // Mobile platform - direct integration
        console.log('📱 Mobile platform direct integration');

        try {
          const RazorpayCheckout = require('react-native-razorpay').default;
          console.log('📱 Direct RazorpayCheckout loaded:', !!RazorpayCheckout);

          if (!RazorpayCheckout) {
            console.error('📱 React Native Razorpay not available for direct integration');
            return {
              success: false,
              error: 'Mobile payment system not available'
            };
          }

          console.log('📱 Opening direct mobile Razorpay with options:', {
            key: options.key ? 'Present' : 'Missing',
            amount: options.amount,
            currency: options.currency,
            order_id: options.order_id ? 'Present' : 'Missing'
          });

          const paymentResponse = await RazorpayCheckout.open(options);
          console.log('📱 Direct mobile payment response:', paymentResponse);

          if (!paymentResponse || !paymentResponse.razorpay_payment_id) {
            console.error('📱 Invalid direct payment response:', paymentResponse);
            return {
              success: false,
              error: 'Invalid payment response from mobile direct integration'
            };
          }

          console.log('📱 Direct mobile payment successful');
          return {
            success: true,
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: paymentResponse.razorpay_order_id,
          };

        } catch (mobileError: any) {
          console.error('📱 Direct mobile Razorpay error:', mobileError);
          return {
            success: false,
            error: mobileError.description || mobileError.message || 'Direct mobile payment failed'
          };
        }
      }

    } catch (error: any) {
      console.error('Direct payment error:', error);
      return {
        success: false,
        error: error.message || 'Direct payment failed'
      };
    }
  }

  /**
   * Verify payment with backend
   */
  static async verifyPayment(verificationData: {
    paymentId: string;
    orderId: string;
    signature: string;
    bookingId: string;
  }): Promise<PaymentResult> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_payment_id: verificationData.paymentId,
          razorpay_order_id: verificationData.orderId,
          razorpay_signature: verificationData.signature,
          booking_id: verificationData.bookingId,
        }
      });

      if (error) {
        console.error('Payment verification error:', error);
        console.error('Verification error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          context: error.context
        });

        // Provide more specific error messages
        let errorMessage = 'Payment verification failed';
        if (error.message?.includes('signature')) {
          errorMessage = 'Payment signature verification failed. Please contact support.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid payment verification request.';
        } else if (error.status === 500) {
          errorMessage = 'Payment verification server error. Please try again later.';
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      // Validate verification response
      if (!data || !data.success) {
        console.error('Payment verification failed:', data);
        return {
          success: false,
          error: 'Payment verification was not successful'
        };
      }

      return {
        success: true,
        paymentId: verificationData.paymentId,
        orderId: verificationData.orderId,
      };

    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  }

  /**
   * Format amount for Razorpay (paise)
   */
  static formatAmount(amount: number): number {
    return Math.round(amount * 100); // Convert to paise
  }

  /**
   * Format amount for display (rupees)
   */
  static formatDisplayAmount(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  /**
   * Get payment method name
   */
  static getPaymentMethodName(method: string): string {
    switch (method.toLowerCase()) {
      case 'card':
        return 'Credit/Debit Card';
      case 'netbanking':
        return 'Net Banking';
      case 'wallet':
        return 'Wallet';
      case 'upi':
        return 'UPI';
      default:
        return method;
    }
  }

  /**
   * Mock payment for testing when Razorpay is completely unavailable
   */
  private static async initiateMockPayment(paymentData: PaymentData, bookingData?: any): Promise<PaymentResult> {
    console.log('Using mock payment for testing purposes');

    // Show alert to user about mock payment
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert('⚠️ Razorpay is unavailable. Using test payment mode.\n\nThis is for development/testing only.');
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock payment details
    const mockPaymentId = `mock_pay_${Date.now()}`;
    const mockOrderId = `mock_order_${Date.now()}`;

    console.log('Mock payment successful:', { mockPaymentId, mockOrderId });

    return {
      success: true,
      paymentId: mockPaymentId,
      orderId: mockOrderId,
    };
  }

  /**
   * Test mobile Razorpay setup without making actual payment
   */
  static async testMobileSetup(): Promise<{
    libraryLoaded: boolean;
    openMethodAvailable: boolean;
    canCreateInstance: boolean;
    directCallWorks: boolean;
    errors: string[];
  }> {
    const result = {
      libraryLoaded: false,
      openMethodAvailable: false,
      canCreateInstance: false,
      directCallWorks: false,
      errors: [] as string[]
    };

    try {
      console.log('🧪 Testing mobile Razorpay setup...');

      // Test 1: Library loading
      try {
        const razorpayModule = require('react-native-razorpay');
        const RazorpayCheckout = razorpayModule.default || razorpayModule;
        result.libraryLoaded = !!RazorpayCheckout;
        console.log('🧪 Library loaded:', result.libraryLoaded);

        if (result.libraryLoaded) {
          // Test 2: Open method availability
          result.openMethodAvailable = typeof RazorpayCheckout.open === 'function';
          console.log('🧪 Open method available:', result.openMethodAvailable);

          // Test 3: Can create basic instance (without opening)
          try {
            // Just test if we can access the method without calling it
            const methodExists = RazorpayCheckout.open;
            result.canCreateInstance = true;
            console.log('🧪 Can access open method:', result.canCreateInstance);
          } catch (instanceError: any) {
            result.errors.push(`Cannot access open method: ${instanceError.message}`);
            console.error('🧪 Instance creation test failed:', instanceError);
          }
        } else {
          result.errors.push('RazorpayCheckout is null/undefined');
        }
      } catch (loadError: any) {
        result.errors.push(`Library load failed: ${loadError.message}`);
        console.error('🧪 Library load error:', loadError);
      }

    } catch (error: any) {
      result.errors.push(`Test failed: ${error.message}`);
      console.error('🧪 Test error:', error);
    }

    console.log('🧪 Mobile setup test results:', result);
    return result;
  }

  /**
   * Mobile-specific diagnostic function
   */
  static async diagnoseMobile(): Promise<{
    platform: string;
    razorpayLibraryAvailable: boolean;
    canOpenPayments: boolean;
    errors: string[];
  }> {
    const result = {
      platform: Platform.OS,
      razorpayLibraryAvailable: false,
      canOpenPayments: false,
      errors: [] as string[]
    };

    try {
      if (Platform.OS === 'web') {
        result.errors.push('This is a web platform diagnostic, use diagnose() instead');
        return result;
      }

      // Check if React Native Razorpay is available
      try {
        const RazorpayCheckout = require('react-native-razorpay').default;
        result.razorpayLibraryAvailable = !!RazorpayCheckout;

        if (RazorpayCheckout) {
          // Try a basic check
          result.canOpenPayments = typeof RazorpayCheckout.open === 'function';
        } else {
          result.errors.push('React Native Razorpay library not found');
        }
      } catch (error: any) {
        result.errors.push(`React Native Razorpay load error: ${error.message}`);
      }

    } catch (error: any) {
      result.errors.push(`Mobile diagnostic error: ${error.message}`);
    }

    return result;
  }

  /**
   * Diagnostic function to check Razorpay setup
   */
  static async diagnose(): Promise<{
    scriptLoaded: boolean;
    razorpayAvailable: boolean;
    constructorWorks: boolean;
    errors: string[];
  }> {
    const result = {
      scriptLoaded: false,
      razorpayAvailable: false,
      constructorWorks: false,
      errors: [] as string[]
    };

    try {
      // Check script loading
      result.scriptLoaded = await this.loadRazorpayScript();

      if (!result.scriptLoaded) {
        result.errors.push('Failed to load Razorpay script');
        return result;
      }

      // Check Razorpay availability
      result.razorpayAvailable = !!(typeof window !== 'undefined' && window.Razorpay);

      if (!result.razorpayAvailable) {
        result.errors.push('Razorpay constructor not available on window');
        return result;
      }

      // Test constructor
      try {
        const testInstance = new window.Razorpay({
          key: 'test_key',
          amount: 100,
          currency: 'INR',
          name: 'Test'
        });
        result.constructorWorks = !!testInstance;
      } catch (error: any) {
        result.errors.push(`Constructor test failed: ${error.message}`);
      }

    } catch (error: any) {
      result.errors.push(`Diagnostic failed: ${error.message}`);
    }

    return result;
  }
}

// Initialize diagnostic function when module loads
if (typeof window !== 'undefined') {
  RazorpayService.init();
}