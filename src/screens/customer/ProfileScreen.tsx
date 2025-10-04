import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { AuthService } from '../../services/supabase/auth';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../services/supabase/client';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../contexts/ThemeContext';

// Address type definition
type Address = {
  id: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
};

// Predefined address titles
const PREDEFINED_TITLES = [
  { id: 'home', title: 'Home', icon: 'home' },
  { id: 'work', title: 'Work', icon: 'work' },
  { id: 'office', title: 'Office', icon: 'business-center' },
  { id: 'gym', title: 'Gym', icon: 'fitness-center' },
];

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';


// Simplified image processing for upload
const processImageForUpload = async (uri: string): Promise<{ base64Data: string; contentType: string }> => {
  try {
    const extension = uri.toLowerCase().split('.').pop();
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

    const base64Data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64Data || base64Data.length < 100) {
      throw new Error('Invalid image data');
    }

    return { base64Data, contentType };
  } catch (error: any) {
    throw error;
  }
};

// Karnataka bounding box coordinates
const KARNATAKA_BOUNDS = {
  north: 18.4667,
  south: 11.6000,
  west: 74.0500,
  east: 78.6000
};

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user, setUser } = useAppStore();
  
  // User information
  const [userName, setUserName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_no || '');
  const [email, setEmail] = useState(user?.email || '');
  const [formattedDob, setFormattedDob] = useState('');
  const [selectedDob, setSelectedDob] = useState<Date | null>(null);
  
  // Stats
  const [rating, setRating] = useState(0.0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  
  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  
  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  
  // Temporary editing values
  const [tempUserName, setTempUserName] = useState(user?.full_name || '');
  const [tempPhoneNumber, setTempPhoneNumber] = useState(user?.phone_no || '');
  const [tempEmail, setTempEmail] = useState(user?.email || '');
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  
  // Selected predefined title
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Map state
  const mapRef = useRef<MapView>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number; longitude: number; address: string} | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Address suggestions state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    loadProfileData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        // Request permissions one by one to avoid conflicts
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (libraryStatus !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need gallery permissions to make this work!');
        }

        // Request camera permission separately
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

        if (cameraStatus !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        }

        // Location permissions
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (locationStatus !== 'granted') {
          Alert.alert('Permission needed', 'This app needs location permissions to select addresses on map');
        }
      } catch (error) {
        console.error('Permission request error:', error);
      }
    }
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
      if (sessionError) throw sessionError;
    
      if (session?.user) {
        const profile = await AuthService.getUserProfile(session.user.id);
      
        if (profile) {
          setUserName(profile.full_name || '');
          setEmail(profile.email || '');
          setPhoneNumber(profile.phone_no || '');
          setUser(profile);
        
          await fetchCustomerData(session.user.id);
          await fetchUserAddresses(session.user.id);
          await fetchUserStats(session.user.id);
        }
      }
    
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
      setIsLoading(false);
    }
  };

  const fetchCustomerData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customer data:', error);
        return;
      }
      if (data && data.dob) {
        const dob = new Date(data.dob);
        setSelectedDob(dob);
        const formatted = `${dob.getDate().toString().padStart(2, '0')}-${(dob.getMonth() + 1).toString().padStart(2, '0')}-${dob.getFullYear()}`;
        setFormattedDob(formatted);
      }
      await fetchProfileImage(userId);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchProfileImage = async (userId: string) => {
    try {
      // Get profile picture URL from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();

      if (!userError && userData?.profile_picture_url) {
        let imageUrl = userData.profile_picture_url;

        // Ensure the URL is properly formatted for React Native
        if (!imageUrl.startsWith('http')) {
          // Simple URL construction
          const baseUrl = 'https://gmualcoqyztvtsqhjlzb.supabase.co/storage/v1/object/public/user_profile_pictures';
          const cleanPath = imageUrl.replace(/^public\//, '');
          imageUrl = `${baseUrl}/${cleanPath}`;
        } else {
          // Fix URL duplication issues
          imageUrl = imageUrl.replace('/object/ppublic/', '/object/public/');
          imageUrl = imageUrl.replace('/object/publlic/', '/object/public/');
          imageUrl = imageUrl.replace('ppublic', 'public');
          imageUrl = imageUrl.replace('publlic', 'public');
        }

        // Simple cache-busting
        const separator = imageUrl.includes('?') ? '&' : '?';
        imageUrl = `${imageUrl}${separator}t=${Date.now()}`;

        // Set storage image directly for immediate display
        setProfileImage(imageUrl);
        return;
      }

      // Fallback: Check storage directly
      const { data: listData, error: listError } = await supabase
        .storage
        .from('user_profile_pictures')
        .list(userId);
      
      if (listError) {
        console.error('Storage list error:', listError);
        return;
      }
      
      if (listData && listData.length > 0) {
        const sortedFiles = listData
          .filter(file => file.name && !file.name.startsWith('.'))
          .sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        
        if (sortedFiles.length > 0) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('user_profile_pictures')
            .getPublicUrl(`${userId}/${sortedFiles[0].name}`);
          
          if (publicUrl) {
            let imageUrl = publicUrl;
            if (!imageUrl.startsWith('http')) {
              // Simple URL construction
              const baseUrl = 'https://gmualcoqyztvtsqhjlzb.supabase.co/storage/v1/object/public/user_profile_pictures';
              imageUrl = `${baseUrl}/${userId}/${sortedFiles[0].name}`;
            } else {
              // Fix URL duplication issues
              imageUrl = imageUrl.replace('/object/ppublic/', '/object/public/');
              imageUrl = imageUrl.replace('/object/publlic/', '/object/public/');
              imageUrl = imageUrl.replace('ppublic', 'public');
              imageUrl = imageUrl.replace('publlic', 'public');
            }

            // Simple cache-busting
            const separator = imageUrl.includes('?') ? '&' : '?';
            imageUrl = `${imageUrl}${separator}t=${Date.now()}`;

            // Set image directly for immediate display
            setProfileImage(imageUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const fetchUserAddresses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setRating(4.5);
        setTotalTrips(0);
        setTotalSpent(0);
        return;
      }

      if (bookingsData && bookingsData.length > 0) {
        const completedBookings = bookingsData.filter(booking =>
          booking.status === 'completed'
        );

        const ratings = completedBookings
          .filter(booking => booking.rating !== null && booking.rating !== undefined)
          .map(booking => booking.rating);

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0;

        const totalSpentValue = completedBookings.reduce((sum, booking) =>
          sum + (booking.fare_amount || 0), 0
        );

        setRating(parseFloat(averageRating.toFixed(1)));
        setTotalTrips(bookingsData.length);
        setTotalSpent(totalSpentValue);
      } else {
        setRating(0);
        setTotalTrips(0);
        setTotalSpent(0);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setRating(4.5);
      setTotalTrips(0);
      setTotalSpent(0);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session found');

      const { base64Data, contentType } = await processImageForUpload(uri);
      if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid image data');
      }

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;

      const result = await supabase.storage
        .from('user_profile_pictures')
        .upload(filePath, base64Data, {
          contentType: contentType,
          upsert: true,
          cacheControl: '3600'
        });

      if (result.error) throw result.error;

      const { data: { publicUrl } } = supabase.storage
        .from('user_profile_pictures')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Failed to generate image URL');

      const cleanUrl = publicUrl.replace(/\/object\/p+ublic\//g, '/object/public/');
      const finalImageUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      await supabase
        .from('users')
        .update({
          profile_picture_url: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      // Update with final uploaded image URL
      setProfileImage(finalImageUrl);
      Alert.alert('Success', 'Profile image uploaded successfully!');

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
      // Don't clear the selected image if upload fails - keep showing the local image
    }
  };

  const pickImageFromSource = async (source: 'camera' | 'gallery') => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      let result;

      if (source === 'camera') {
        // Check camera permission before launching
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission', 'Camera access is required to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        // Check gallery permission before launching
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Gallery Permission', 'Gallery access is required to select photos');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Show selected image immediately with a unique key to force refresh
        const imageWithTimestamp = `${selectedImage.uri}?t=${Date.now()}`;
        setProfileImage(imageWithTimestamp);

        // Upload in background and update with final URL on success
        uploadProfileImage(selectedImage.uri).catch((uploadError) => {
          console.error('Upload failed, keeping local image:', uploadError);
          // Keep showing the selected image even if upload fails
          Alert.alert(
            'Upload Issue',
            'Image selected but upload had issues. The image will still be displayed.',
            [{ text: 'OK' }]
          );
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);

      // Handle specific error types
      if (error.message?.includes('ActivityResultLauncher')) {
        Alert.alert(
          'Camera Error',
          'Camera is not available. Please try selecting from gallery instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImageFromSource('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImageFromSource('gallery'),
        },
        ...(profileImage ? [{
          text: 'Remove Photo',
          onPress: () => removeProfileImage(),
          style: 'destructive' as 'destructive',
        }] : []),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };


  const removeProfileImage = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('No user session found');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.error('Profile update error:', updateError);
      }
      
      const { data: listData, error: listError } = await supabase
        .storage
        .from('user_profile_pictures')
        .list(session.user.id);
      
      if (listError) {
        console.error('Storage list error:', listError);
        setProfileImage(null);
        Alert.alert('Success', 'Profile image removed!');
        return;
      }
      
      if (listData && listData.length > 0) {
        const filesToRemove = listData
          .filter(file => file.name && !file.name.startsWith('.'))
          .map(file => `${session.user.id}/${file.name}`);
        
        if (filesToRemove.length > 0) {
          const { error: removeError } = await supabase.storage
            .from('user_profile_pictures')
            .remove(filesToRemove);
          
          if (removeError) {
            console.error('Storage remove error:', removeError);
          }
        }
      }
      
      // Immediately clear image and show placeholder
      setProfileImage(null);
      

      Alert.alert('Success', 'Profile image removed successfully!');
    } catch (error: any) {
      console.error('Remove image error:', error);
      const errorMessage = error.message || 'Failed to remove image';
      Alert.alert('Remove Error', errorMessage);
    }
  };

  const toggleEditPersonalInfo = async () => {
    if (isEditingPersonalInfo) {
      try {
        if (!user) throw new Error('No user found');
      
        const updates = {
          full_name: tempUserName,
          email: tempEmail,
        };
      
        const { data, error } = await AuthService.updateProfile(user.id, updates);
      
        if (error) throw error;
        
        if (selectedDob) {
          const { error: customerError } = await supabase
            .from('customers')
            .upsert({
              id: user.id,
              dob: selectedDob.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });
          if (customerError) console.error('Error updating customer data:', customerError);
        }
        
        if (tempPhoneNumber !== user?.phone_no) {
          const { error: phoneError } = await supabase
            .from('users')
            .update({
              phone_no: tempPhoneNumber,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
          if (phoneError) console.error('Error updating phone number:', phoneError);
        }
      
        setUserName(tempUserName);
        setPhoneNumber(tempPhoneNumber);
        setEmail(tempEmail);
        setIsEditingPersonalInfo(false);
        Alert.alert('Success', 'Changes saved successfully!');
      } catch (error) {
        console.error('Update profile error:', error);
        Alert.alert('Error', 'Failed to update profile');
      }
    } else {
      setTempUserName(userName);
      setTempPhoneNumber(phoneNumber);
      setTempEmail(email);
      setIsEditingPersonalInfo(true);
    }
  };

  const handleTitleSelection = (title: string, id: string) => {
    setNewAddressTitle(title);
    setSelectedTitleId(id);
  };

  const clearTitleSelection = () => {
    setNewAddressTitle('');
    setSelectedTitleId(null);
  };

  const addAddress = async () => {
    if (!newAddressTitle.trim() || !newAddress.trim()) {
      Alert.alert('Error', 'Please fill in both address title and address');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user found');
    
      if (isDefaultAddress) {
        await supabase
          .from('saved_locations')
          .update({ is_default: false })
          .eq('user_id', session.user.id)
          .eq('is_default', true);
      }
    
      const addressData = {
        user_id: session.user.id,
        title: newAddressTitle,
        address: newAddress,
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        is_default: isDefaultAddress,
      };
      
      const { data, error } = await supabase
        .from('saved_locations')
        .insert(addressData)
        .select()
        .single();
      
      if (error) throw error;
      
      setSavedAddresses([...savedAddresses, data]);
      setNewAddressTitle('');
      setNewAddress('');
      setSelectedLocation(null);
      setIsDefaultAddress(false);
      setSelectedTitleId(null);
      setShowAddAddressForm(false);
      setAddressSuggestions([]);
      Alert.alert('Success', 'Address added successfully!');
    } catch (error) {
      console.error('Add address error:', error);
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const deleteAddress = async (addressToDelete: Address) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', addressToDelete.id);
      if (error) throw error;
      setSavedAddresses(
        savedAddresses.filter(address => address.id !== addressToDelete.id)
      );
      Alert.alert('Success', 'Address deleted successfully!');
    } catch (error) {
      console.error('Delete address error:', error);
      Alert.alert('Error', 'Failed to delete address');
    }
  };

  const toggleAddAddressForm = () => {
    setShowAddAddressForm(!showAddAddressForm);
    if (showAddAddressForm) {
      setNewAddressTitle('');
      setNewAddress('');
      setSelectedLocation(null);
      setIsDefaultAddress(false);
      setSelectedTitleId(null);
      setAddressSuggestions([]);
    }
  };

  const selectDateOfBirth = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  
    if (date && event.type !== 'dismissed') {
      setSelectedDob(date);
      const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      setFormattedDob(formatted);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to use this feature');
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      if (location.coords.latitude >= KARNATAKA_BOUNDS.south &&
          location.coords.latitude <= KARNATAKA_BOUNDS.north &&
          location.coords.longitude >= KARNATAKA_BOUNDS.west &&
          location.coords.longitude <= KARNATAKA_BOUNDS.east) {
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        try {
          let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        
          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const formattedAddress = [
              address.name,
              address.street,
              address.city,
              address.region,
              address.postalCode,
              address.country
            ].filter(Boolean).join(', ');
            
            setSelectedLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address: formattedAddress
            });
            setNewAddress(formattedAddress);
          }
        } catch (geocodeError) {
          console.error('Reverse geocode error:', geocodeError);
          setNewAddress(`Lat: ${location.coords.latitude.toFixed(6)}, Long: ${location.coords.longitude.toFixed(6)}`);
        }
        
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setMapRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        Alert.alert('Outside Karnataka', 'Your current location is outside Karnataka. The map will remain focused on Karnataka.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const openMap = async () => {
    try {
      await getCurrentLocation();
      setShowMap(true);
    } catch (error) {
      console.error('Error opening map:', error);
      setShowMap(true);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
  
    if (latitude >= KARNATAKA_BOUNDS.south &&
        latitude <= KARNATAKA_BOUNDS.north &&
        longitude >= KARNATAKA_BOUNDS.west &&
        longitude <= KARNATAKA_BOUNDS.east) {
    
      setSelectedLocation({ 
        latitude, 
        longitude,
        address: ''
      });
    
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
      
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const formattedAddress = [
            address.name,
            address.street,
            address.city,
            address.region,
            address.postalCode,
            address.country
          ].filter(Boolean).join(', ');
        
          setNewAddress(formattedAddress);
          setSelectedLocation({
            latitude,
            longitude,
            address: formattedAddress
          });
        } else {
          const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
          setNewAddress(fallbackAddress);
          setSelectedLocation({
            latitude,
            longitude,
            address: fallbackAddress
          });
        }
      } catch (error) {
        console.error('Reverse geocode error:', error);
        const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
        setNewAddress(fallbackAddress);
        setSelectedLocation({
          latitude,
          longitude,
          address: fallbackAddress
        });
      }
    } else {
      Alert.alert('Location Outside Karnataka', 'Please select a location within Karnataka state boundaries.');
    }
  };

  const confirmLocation = () => {
    setShowMap(false);
    if (selectedLocation) {
      Alert.alert('Location Selected', `Address has been updated with your selected location:\n\n${selectedLocation.address}`);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
            
              if (error) throw error;
            
              Alert.alert('Success', 'You have been logged out successfully!');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const goToCurrentLocation = async () => {
    await getCurrentLocation();
  };

  const zoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta / 2,
        longitudeDelta: mapRegion.longitudeDelta / 2,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
  
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' Karnataka')}&key=${GOOGLE_MAPS_API_KEY}`
      );
    
      const data = await response.json();
    
      if (data.status === 'OK' && data.results.length > 0) {
        const karnatakaResults = data.results.filter((result: any) => {
          const lat = result.geometry.location.lat;
          const lng = result.geometry.location.lng;
          return (
            lat >= KARNATAKA_BOUNDS.south &&
            lat <= KARNATAKA_BOUNDS.north &&
            lng >= KARNATAKA_BOUNDS.west &&
            lng <= KARNATAKA_BOUNDS.east
          );
        });
      
        if (karnatakaResults.length > 0) {
          setSearchResults(karnatakaResults);
        } else {
          Alert.alert('No Results', 'No locations found within Karnataka. Please try a different search term.');
          setSearchResults([]);
        }
      } else {
        Alert.alert('No Results', 'No locations found. Please try a different search term.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for location. Please check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const location: {latitude: number; longitude: number; address: string} = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      address: result.formatted_address
    };
  
    setSelectedLocation(location);
  
    const newRegion = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  
    setMapRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  
    setNewAddress(result.formatted_address);
    setSearchResults([]);
    setSearchQuery('');
  };

  const fetchAddressSuggestions = async (query: string) => {
    setIsAddressSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query + ' Karnataka, India')}&key=${GOOGLE_MAPS_API_KEY}&components=country:IN`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setAddressSuggestions(data.predictions);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('Address suggestion error:', error);
      setAddressSuggestions([]);
    } finally {
      setIsAddressSearching(false);
    }
  };

  const selectAddressSuggestion = async (prediction: any) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        const result = data.result;
        const location = result.geometry.location;
        if (
          location.lat >= KARNATAKA_BOUNDS.south &&
          location.lat <= KARNATAKA_BOUNDS.north &&
          location.lng >= KARNATAKA_BOUNDS.west &&
          location.lng <= KARNATAKA_BOUNDS.east
        ) {
          setSelectedLocation({
            latitude: location.lat,
            longitude: location.lng,
            address: result.formatted_address
          });
          setNewAddress(result.formatted_address);
        } else {
          Alert.alert('Location Outside Karnataka', 'Please select a location within Karnataka state boundaries.');
        }
      }
    } catch (error) {
      console.error('Address details error:', error);
    } finally {
      setAddressSuggestions([]);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={showImagePickerOptions} style={styles.avatarContainer}>
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage,
                }}
                style={styles.avatar}
                resizeMode="cover"
                key={profileImage}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={20} color={colors.surface} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{userName || 'Your Name'}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {rating.toFixed(1)} ({totalTrips} trips)
            </Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
           <View style={styles.cardHeader}>
             <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Information</Text>
             <TouchableOpacity onPress={toggleEditPersonalInfo}>
               <Text style={[styles.editButtonText, { color: colors.primary }]}>
                 {isEditingPersonalInfo ? 'Save' : 'Edit'}
               </Text>
             </TouchableOpacity>
           </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={tempPhoneNumber}
                  onChangeText={setTempPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.infoValue, { color: colors.text }]}>{phoneNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="email" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter email"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="person" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Full Name</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={tempUserName}
                  onChangeText={setTempUserName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <Text style={[styles.infoValue, { color: colors.text }]}>{userName}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="cake" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
              <TouchableOpacity onPress={selectDateOfBirth}>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formattedDob || 'Tap to select date of birth'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trip Statistics Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
           <Text style={[styles.cardTitle, { color: colors.text }]}>Trip Statistics</Text>
        
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalTrips}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Trips</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{rating.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>${totalSpent.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Saved Addresses Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Saved Addresses</Text>
            <TouchableOpacity onPress={toggleAddAddressForm}>
              <Text style={[styles.editButtonText, { color: colors.primary }]}>
                {showAddAddressForm ? 'Cancel' : 'Add New'}
              </Text>
            </TouchableOpacity>
          </View>
        
          {savedAddresses.map((address) => (
            <View key={address.id} style={[styles.addressItem, { borderBottomColor: colors.border }]}>
              <View style={styles.addressContent}>
                <View style={styles.addressHeader}>
                  <Text style={[styles.addressTitle, { color: colors.text }]}>{address.title}</Text>
                  {address.is_default && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
                      <Text style={[styles.defaultBadgeText, { color: colors.surface }]}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.addressText, { color: colors.textSecondary }]}>{address.address}</Text>
                {address.latitude && address.longitude && (
                  <Text style={[styles.coordinatesText, { color: colors.textMuted }]}>
                    {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteAddress(address)}>
                <MaterialIcons name="delete" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        
          {showAddAddressForm && (
            <View style={styles.addAddressForm}>
              <View style={styles.titleBannersContainer}>
                <Text style={[styles.bannersTitle, { color: colors.text }]}>Quick Select:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.titleBannersScroll}
                  contentContainerStyle={styles.titleBannersContent}
                >
                  {PREDEFINED_TITLES.map((titleItem) => (
                    <TouchableOpacity
                      key={titleItem.id}
                      style={[
                        styles.titleBanner,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedTitleId === titleItem.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => handleTitleSelection(titleItem.title, titleItem.id)}
                    >
                      <MaterialIcons
                        name={titleItem.icon as any}
                        size={16}
                        color={selectedTitleId === titleItem.id ? colors.surface : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.titleBannerText,
                          { color: colors.textSecondary },
                          selectedTitleId === titleItem.id && { color: colors.surface }
                        ]}
                      >
                        {titleItem.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedTitleId && (
                  <TouchableOpacity
                    style={styles.clearTitleButton}
                    onPress={clearTitleSelection}
                  >
                    <Text style={[styles.clearTitleText, { color: colors.error }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[
                  styles.input,
                  styles.addressTitleInput,
                  { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
                  selectedTitleId && { backgroundColor: colors.surface, borderColor: colors.primary }
                ]}
                placeholder="Address Title (e.g., Home, Work)"
                placeholderTextColor={colors.inputPlaceholder}
                value={newAddressTitle}
                onChangeText={(text) => {
                  setNewAddressTitle(text);
                  if (text && selectedTitleId) {
                    setSelectedTitleId(null);
                  }
                }}
                editable={!selectedTitleId}
              />

              <TextInput
                style={[styles.input, { height: 80, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Full Address"
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                value={newAddress}
                onChangeText={(text) => {
                  setNewAddress(text);
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  if (text.length >= 3) {
                    searchTimer.current = setTimeout(() => fetchAddressSuggestions(text), 300);
                  } else {
                    setAddressSuggestions([]);
                  }
                }}
              />

              {isAddressSearching && (
                <View style={[styles.searchingIndicator, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.searchingText, { color: colors.textSecondary }]}>Searching...</Text>
                </View>
              )}

              {addressSuggestions.length > 0 && (
                <ScrollView style={[styles.searchResultsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                  {addressSuggestions.map((pred, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                      onPress={() => selectAddressSuggestion(pred)}
                    >
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <Text style={[styles.searchResultText, { color: colors.text }]}>{pred.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={[styles.chooseOnMapButton, { backgroundColor: colors.surface }]} onPress={openMap}>
                <MaterialIcons name="map" size={20} color={colors.primary} />
                <Text style={[styles.chooseOnMapText, { color: colors.primary }]}>Choose on Map</Text>
              </TouchableOpacity>

              {selectedLocation && (
                <View style={[styles.selectedLocationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.selectedLocationTitle, { color: colors.text }]}>Selected Location:</Text>
                  <Text style={[styles.selectedLocationAddress, { color: colors.textSecondary }]}>{selectedLocation.address}</Text>
                  <Text style={[styles.selectedLocationCoords, { color: colors.textMuted }]}>
                    Lat: {selectedLocation.latitude.toFixed(6)}, Long: {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              <View style={styles.defaultAddressContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsDefaultAddress(!isDefaultAddress)}
                >
                  {isDefaultAddress ? (
                    <Ionicons name="checkbox" size={24} color={colors.primary} />
                  ) : (
                    <Ionicons name="square-outline" size={24} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <Text style={[styles.defaultAddressText, { color: colors.textSecondary }]}>Set as default address</Text>
              </View>

              <TouchableOpacity style={[styles.saveAddressButton, { backgroundColor: colors.primary }]} onPress={addAddress}>
                <Text style={[styles.saveAddressText, { color: colors.surface }]}>Save Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.settingsButtonContent}>
              <MaterialIcons name="settings" size={24} color={colors.primary} />
              <Text style={[styles.settingsButtonText, { color: colors.text }]}>App Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDob || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Map Modal */}
        <Modal
          visible={showMap}
          animationType="slide"
          transparent={false}
        >
          <View style={[styles.mapContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Search for a location in Karnataka..."
                placeholderTextColor={colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
                <Ionicons name="search" size={20} color={colors.surface} />
              </TouchableOpacity>
            </View>
            {isSearching && (
              <View style={[styles.searchingIndicator, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.searchingText, { color: colors.textSecondary }]}>Searching...</Text>
              </View>
            )}
            {searchResults.length > 0 && (
              <ScrollView style={[styles.searchResultsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={[styles.searchResultText, { color: colors.text }]}>{result.formatted_address}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <MapView
              ref={mapRef}
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Current Location"
                  description="Green marker shows your current position"
                  pinColor="green"
                >
                  <View style={styles.customMarkerGreen}>
                    <View style={styles.greenMarkerContainer}>
                      <Ionicons name="location" size={24} color="#fff" />
                    </View>
                  </View>
                </Marker>
              )}
              
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  description={selectedLocation.address}
                  pinColor="red"
                >
                  <View style={styles.customMarkerRed}>
                    <View style={styles.redMarkerContainer}>
                      <Ionicons name="location" size={24} color="#fff" />
                    </View>
                  </View>
                </Marker>
              )}
            </MapView>
          
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.mapControlButton} onPress={goToCurrentLocation}>
                <View style={styles.currentLocationButton}>
                  <Ionicons name="locate" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapControlButton} onPress={zoomIn}>
                <View style={styles.zoomButton}>
                  <Ionicons name="add" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapControlButton} onPress={zoomOut}>
                <View style={styles.zoomButton}>
                  <Ionicons name="remove" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          
            <View style={[styles.mapButtons, { backgroundColor: colors.surface }]}>
              <TouchableOpacity style={[styles.cancelMapButton, { backgroundColor: colors.inputBackground }]} onPress={() => setShowMap(false)}>
                <Text style={[styles.cancelMapText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.confirmMapButton, { backgroundColor: colors.primary }]} onPress={confirmLocation}>
                <Text style={[styles.confirmMapText, { color: colors.surface }]}>Confirm Location</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.mapLegend, { backgroundColor: colors.surface }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Selected Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Current Location</Text>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  titleBannersContainer: {
    marginBottom: 12,
  },
  bannersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  titleBannersScroll: {
    maxHeight: 50,
  },
  titleBannersContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  titleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 70,
    justifyContent: 'center',
  },
  titleBannerText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  clearTitleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  clearTitleText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  addressTitleInput: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  addAddressForm: {
    marginTop: 16,
  },
  chooseOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  chooseOnMapText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedLocationContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  selectedLocationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  selectedLocationCoords: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  defaultAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  defaultAddressText: {
    color: '#64748b',
  },
  saveAddressButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveAddressText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  searchingText: {
    marginLeft: 8,
    color: '#64748b',
  },
  searchResultsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    marginLeft: 8,
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 120,
    zIndex: 1000,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customMarkerRed: {
    alignItems: 'center',
  },
  redMarkerContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarkerGreen: {
    alignItems: 'center',
  },
  greenMarkerContainer: {
    backgroundColor: '#44ff44',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationButton: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  cancelMapButton: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelMapText: {
    color: '#64748b',
    fontWeight: '500',
  },
  confirmMapButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmMapText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

