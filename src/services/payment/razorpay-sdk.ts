import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

// Dynamic import for better error handling
let RazorpayCheckout: any = null;

try {
  // Try to import the SDK
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (error) {
  console.warn('Razorpay SDK not available:', error);
}

export interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: any;
}

export class RazorpaySDKService {
  private static RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

  /**
   * Initialize payment with Razorpay SDK
   */
  static async initiatePayment(
    amount: number,
    currency: string,
    orderId: string,
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    description: string
  ): Promise<PaymentResult> {
    console.log('🚀 Starting Razorpay SDK payment...');
    console.log('📱 Platform:', Platform.OS);
    console.log('💰 Amount:', amount, currency);
    console.log('📋 Order ID:', orderId);

    try {
      // Check if SDK is available
      if (!RazorpayCheckout) {
        throw new Error('Razorpay SDK is not available. Please ensure you are running a development build, not Expo Go.');
      }

      // Check if open method exists
      if (typeof RazorpayCheckout.open !== 'function') {
        throw new Error('Razorpay SDK open method is not available. SDK may not be properly linked.');
      }

      // Validate required parameters
      if (!this.RAZORPAY_KEY_ID) {
        throw new Error('Razorpay Key ID not found. Please check your environment variables.');
      }

      if (!orderId) {
        throw new Error('Order ID is required for payment');
      }

      // Prepare payment options
      const options: PaymentOptions = {
        key: this.RAZORPAY_KEY_ID,
        amount: amount, // Amount in paisa (multiply by 100 if needed)
        currency: currency,
        name: 'SDM E-Mobility',
        description: description,
        order_id: orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#3ccfa0',
        },
      };

      console.log('💳 Payment options prepared:', {
        key: options.key.substring(0, 10) + '...', // Mask key for security
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id,
        name: options.name,
        description: options.description,
      });

      console.log('🔓 Attempting to open Razorpay Checkout...');

      // Open Razorpay Checkout
      const paymentResponse = await RazorpayCheckout.open(options);

      console.log('✅ Payment completed successfully:', paymentResponse);

      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
      };

    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        description: error.description,
        stack: error.stack
      });

      // Handle different types of errors
      let errorMessage = 'Payment failed';

      if (error.code) {
        switch (error.code) {
          case 'PAYMENT_CANCELLED':
            errorMessage = 'Payment was cancelled by user';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          case 'INVALID_OPTIONS':
            errorMessage = 'Invalid payment options. Please try again.';
            break;
          default:
            errorMessage = error.description || error.message || 'Unknown payment error';
        }
      } else if (error.message) {
        // Handle specific error messages
        if (error.message.includes('Cannot read property \'open\' of null')) {
          errorMessage = 'Razorpay SDK is not properly initialized. Please ensure you are running a development build.';
        } else if (error.message.includes('not available')) {
          errorMessage = 'Razorpay SDK is not available on this platform. Please use a development build.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: {
          code: error.code,
          message: errorMessage,
          description: error.description,
        },
      };
    }
  }

  /**
   * Create payment order via Supabase Edge Function
   */
  static async createOrder(
    bookingData: any,
    paymentAmount: number,
    paymentMethod: string = 'upi'
  ): Promise<{ order_id: string; amount: number } | null> {
    try {
      console.log('📝 Creating payment order...');

      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          bookingData: bookingData ? {
            ...bookingData,
            selectedFare: {
              price: bookingData.selectedFare?.price || paymentAmount / 100,
              type: bookingData.vehicleType || 'sedan'
            }
          } : null,
          bookingId: `booking_${Date.now()}`,
          paymentMethod: paymentMethod,
          paymentAmount: paymentAmount / 100, // Convert to rupees
        }
      });

      if (orderError || !orderData?.order_id) {
        console.error('❌ Order creation failed:', orderError);
        throw new Error(orderError?.message || 'Failed to create payment order');
      }

      console.log('✅ Order created:', orderData.order_id);
      return orderData;

    } catch (error: any) {
      console.error('❌ Order creation error:', error);
      throw error;
    }
  }

  /**
   * Format amount for Razorpay (convert to paisa)
   */
  static formatAmount(amountInRupees: number): number {
    return Math.round(amountInRupees * 100); // Convert rupees to paisa
  }

  /**
   * Test SDK integration
   */
  static async testSDKIntegration(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing Razorpay SDK integration...');
      console.log('📱 Platform:', Platform.OS);
      console.log('🔑 API Key configured:', !!this.RAZORPAY_KEY_ID);

      // Check if SDK is available
      if (!RazorpayCheckout) {
        console.error('❌ RazorpayCheckout is null or undefined');
        return {
          success: false,
          message: 'Razorpay SDK not available. This usually means:\n\n1. You are running in Expo Go (use development build)\n2. SDK not properly linked\n3. App needs to be rebuilt\n\nRun: npx expo run:android/ios'
        };
      }

      // Check if open method exists
      if (typeof RazorpayCheckout.open !== 'function') {
        console.error('❌ RazorpayCheckout.open is not a function');
        return {
          success: false,
          message: 'Razorpay SDK open method not available. SDK may not be properly linked.'
        };
      }

      // Check platform compatibility
      if (Platform.OS === 'web') {
        return {
          success: false,
          message: 'Razorpay SDK is not supported on web platform. Use WebView integration instead.'
        };
      }

      // Check API key
      if (!this.RAZORPAY_KEY_ID) {
        return {
          success: false,
          message: 'Razorpay Key ID not configured. Please check your environment variables.\n\nExpected: EXPO_PUBLIC_RAZORPAY_KEY_ID'
        };
      }

      console.log('✅ Razorpay SDK integration test passed');
      console.log('🔧 SDK methods available:', Object.keys(RazorpayCheckout));

      return {
        success: true,
        message: `Razorpay SDK is properly configured and ready to use!\n\nPlatform: ${Platform.OS}\nAPI Key: ${this.RAZORPAY_KEY_ID.substring(0, 10)}...`
      };

    } catch (error: any) {
      console.error('❌ SDK integration test failed:', error);
      return {
        success: false,
        message: `SDK integration failed: ${error.message}\n\nThis usually indicates the SDK is not properly linked to your Expo development build.`
      };
    }
  }
}