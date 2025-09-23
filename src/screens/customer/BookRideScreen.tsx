import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { RazorpayTest } from '@/components/RazorpayTest';

// Import types and navigation
import { CustomerTabParamList } from '@/types/navigation';

// Import components
import { BookingFlow } from '@/components/booking/BookingFlow';

type BookRideScreenNavigationProp = StackNavigationProp<CustomerTabParamList, 'BookRide'>;

export default function BookRideScreen() {
  const navigation = useNavigation<BookRideScreenNavigationProp>();

  const handleBookingComplete = useCallback((bookingData: any) => {
    // Here you would typically send the booking data to your backend
    console.log('Booking completed:', bookingData);

    // Show success toast and navigate back
    Toast.show({
      type: 'success',
      text1: 'Booking Confirmed!',
      text2: 'Your ride has been booked successfully.',
      onPress: () => {
        navigation.navigate('Home');
      },
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <BookingFlow onBookingComplete={handleBookingComplete} />
      {/* <RazorpayTest /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});