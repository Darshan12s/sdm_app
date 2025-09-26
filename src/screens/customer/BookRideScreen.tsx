import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RazorpayTest } from '@/components/RazorpayTest';

// Import types and navigation
import { CustomerStackParamList } from '@/types/navigation';

// Import components
import { BookingFlow } from '@/components/booking/BookingFlow';

// Import theme
import { useTheme } from '../../contexts/ThemeContext';

type BookRideScreenNavigationProp = StackNavigationProp<CustomerStackParamList>;

export default function BookRideScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<BookRideScreenNavigationProp>();

  const handleBookingComplete = useCallback((bookingData: any) => {
    // Here you would typically send the booking data to your backend
    console.log('Booking completed:', bookingData);

    // Navigate to thank you page
    navigation.navigate('ThankYou', { bookingData });
  }, [navigation]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
      <BookingFlow onBookingComplete={handleBookingComplete} />
      {/* <RazorpayTest /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});