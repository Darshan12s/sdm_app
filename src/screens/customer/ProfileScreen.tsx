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
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { AuthService } from '../../services/supabase/auth';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../services/supabase/client';
import { uploadWithRestAPI } from '../../utils/storageTest';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';

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

// Karnataka bounding box coordinates
const KARNATAKA_BOUNDS = {
  north: 18.4667,
  south: 11.6000,
  west: 74.0500,
  east: 78.6000
};

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Get user data from store
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
    latitude: 12.9716, // Bangalore coordinates
    longitude: 77.5946,
    latitudeDelta: 2.0, // Wider view to show more of Karnataka
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
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera and gallery permissions to make this work!');
        }
      
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
      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
      if (sessionError) throw sessionError;
    
      if (session?.user) {
        // Fetch user profile
        const profile = await AuthService.getUserProfile(session.user.id);
      
        if (profile) {
          setUserName(profile.full_name || '');
          setEmail(profile.email || '');
          setPhoneNumber(profile.phone_no || '');
        
          // Update store
          setUser(profile);
        
          // Fetch additional data
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
      // Fetch customer-specific data including DOB
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching customer data:', error);
        return;
      }
      if (data && data.dob) {
        const dob = new Date(data.dob);
        setSelectedDob(dob);
        const formatted = `${dob.getDate().toString().padStart(2, '0')}-${(dob.getMonth() + 1).toString().padStart(2, '0')}-${dob.getFullYear()}`;
        setFormattedDob(formatted);
      }
      // Fetch profile picture if exists
      await fetchProfileImage(userId);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchProfileImage = async (userId: string) => {
    try {
      // First try to get from user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();
      if (!userError && userData?.profile_picture_url) {
        setProfileImage(`${userData.profile_picture_url}?t=${Date.now()}`);
        return;
      }
      // Fallback: Check if profile image exists in storage
      const { data: listData, error: listError } = await supabase
        .storage
        .from('drivers_profile_pictures')
        .list(userId);
      if (listError) {
        console.error('Storage list error:', listError);
        return;
      }
      if (listData && listData.length > 0) {
        // Get the most recent profile image
        const sortedFiles = listData
          .filter(file => file.name && !file.name.startsWith('.'))
          .sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        if (sortedFiles.length > 0) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('drivers_profile_pictures')
            .getPublicUrl(`${userId}/${sortedFiles[0].name}`);
          if (publicUrl) {
            // Add a timestamp to avoid caching issues
            setProfileImage(`${publicUrl}?t=${Date.now()}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      // Don't show alert for fetch errors, just log them
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
      // Using mock data for now - replace with actual Supabase query
      setRating(4.5);
      setTotalTrips(12);
      setTotalSpent(245.75);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    try {
      console.log('🚀 Starting profile image upload...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      if (!session?.user) {
        throw new Error('No user session found');
      }
      console.log('✅ User session found:', session.user.id);
      // Convert image to blob
      console.log('📸 Fetching image from URI:', uri);
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('📦 Image blob size:', blob.size);
      if (blob.size === 0) throw new Error('Image file is empty');
      // Generate a unique filename
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;
      console.log('📁 Uploading to path:', filePath);
      // Skip bucket validation since user confirmed bucket exists
      console.log('🔍 Skipping bucket validation (user confirmed bucket exists)');
      console.log('📤 Proceeding with direct upload to drivers_profile_pictures...');
      // Try multiple upload methods
      console.log('📤 Starting upload to Supabase storage...');
      let uploadData, uploadError;
      // Method 1: Standard Supabase upload
      try {
        console.log('🔄 Trying standard upload method...');
        const result = await supabase.storage
          .from('drivers_profile_pictures')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '3600'
          });
        uploadData = result.data;
        uploadError = result.error;
      } catch (method1Error: any) {
        console.error('❌ Standard upload failed:', method1Error);
        // Method 2: Try with different options
        try {
          console.log('🔄 Trying alternative upload method...');
          const result = await supabase.storage
            .from('drivers_profile_pictures')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
              duplex: 'half'
            });
          uploadData = result.data;
          uploadError = result.error;
        } catch (method2Error: any) {
          console.error('❌ Alternative upload also failed:', method2Error);
          uploadError = method2Error;
        }
      }
      if (uploadError) {
        console.error('❌ Upload error details:', uploadError);
        console.error('❌ Upload error message:', uploadError.message);
        // Try REST API fallback for network issues
        if (uploadError.message?.includes('Network request failed') ||
            uploadError.message?.includes('Failed to fetch') ||
            uploadError.message?.includes('NetworkError') ||
            uploadError.message?.includes('StorageUnknownError')) {
          console.log('🔄 Primary upload failed, trying REST API fallback...');
          try {
            const restResult = await uploadWithRestAPI(filePath, blob, 'image/jpeg');
            if (restResult.success) {
              console.log('✅ REST API upload successful!');
              uploadData = restResult.data;
              uploadError = null;
            } else {
              console.error('❌ REST API fallback also failed:', restResult.error);
              throw new Error('Network connection issue. Both upload methods failed. Please check your internet connection and try again.');
            }
          } catch (restError: any) {
            console.error('❌ REST API fallback error:', restError);
            throw new Error('Network connection issue. Please check your internet connection and try again. If the problem persists, contact support.');
          }
        } else {
          // Handle other types of errors
          if (uploadError.message?.includes('Bucket not found')) {
            throw new Error('Storage bucket not configured. Please contact support.');
          } else if (uploadError.message?.includes('row-level security') ||
                     uploadError.message?.includes('RLS') ||
                     uploadError.message?.includes('violates row-level security policy')) {
            console.log('🔒 ROOT CAUSE FOUND: RLS Policy Issue');
            console.log('🔧 SOLUTION: Go to Supabase Dashboard > Storage > drivers_profile_pictures > Policies');
            console.log('🔧 1. Check if RLS is enabled');
            console.log('🔧 2. Create or update policies to allow uploads');
            console.log('🔧 3. Or disable RLS for this bucket');
            throw new Error('Upload blocked by security policy. Please check Supabase Storage policies for drivers_profile_pictures bucket.');
          } else if (uploadError.message?.includes('Unauthorized') ||
                     uploadError.message?.includes('403')) {
            throw new Error('Upload permission denied. Please try logging out and back in.');
          } else if (uploadError.message?.includes('Duplicate')) {
            throw new Error('File already exists. Please try again.');
          } else if (uploadError.message?.includes('Payload too large') ||
                     uploadError.message?.includes('413')) {
            throw new Error('Image file is too large. Please choose a smaller image.');
          } else if (uploadError.message?.includes('404')) {
            throw new Error('Storage bucket not found. Please contact support.');
          } else if (uploadError.message?.includes('CORS')) {
            throw new Error('CORS policy blocking upload. Please contact support.');
          } else if (uploadError.message?.includes('timeout')) {
            throw new Error('Upload timed out. Please check your connection and try again.');
          } else {
            throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
          }
        }
      }
      console.log('✅ Upload successful:', uploadData);
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drivers_profile_pictures')
        .getPublicUrl(filePath);
      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }
      console.log('🔗 Public URL generated:', publicUrl);
      // Update the profile image with cache busting
      const imageUrl = `${publicUrl}?t=${Date.now()}`;
      setProfileImage(imageUrl);
      // Update user profile with image URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      if (updateError) {
        console.error('⚠️ Profile update error:', updateError);
        // Don't throw here as the image was uploaded successfully
        Alert.alert('Warning', 'Image uploaded but profile update failed. Please refresh the page.');
      }
      console.log('🎉 Profile image upload completed successfully');
      Alert.alert('Success', 'Profile image uploaded successfully!');
    } catch (error: any) {
      console.error('💥 Upload image error:', error);
      console.error('💥 Error stack:', error.stack);
      const errorMessage = error.message || 'Failed to upload image';
      Alert.alert('Upload Error', errorMessage);
    }
  };

  const pickImageFromSource = async (source: 'camera' | 'gallery') => {
    try {
      let result;
    
      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
    
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
      // Upload image to Supabase bucket
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
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
      // Update user profile to remove image URL
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
      // List all files in the user's folder
      const { data: listData, error: listError } = await supabase
        .storage
        .from('user_profile_pictures')
        .list(session.user.id);
      if (listError) {
        console.error('Storage list error:', listError);
        // Still clear the image even if listing fails
        setProfileImage(null);
        Alert.alert('Success', 'Profile image removed!');
        return;
      }
      if (listData && listData.length > 0) {
        // Create an array of file paths to remove
        const filesToRemove = listData
          .filter(file => file.name && !file.name.startsWith('.'))
          .map(file => `${session.user.id}/${file.name}`);
        if (filesToRemove.length > 0) {
          // Remove all files
          const { error: removeError } = await supabase.storage
            .from('user_profile_pictures')
            .remove(filesToRemove);
          if (removeError) {
            console.error('Storage remove error:', removeError);
            // Don't throw here, still clear the image
          }
        }
      }
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
      // Save changes
      try {
        if (!user) throw new Error('No user found');
      
        // Only update fields that exist in your users table
        const updates = {
          full_name: tempUserName,
          email: tempEmail,
          // Remove phone if it doesn't exist in your users table
          // phone: tempPhoneNumber,
        };
      
        const { data, error } = await AuthService.updateProfile(user.id, updates);
      
        if (error) throw error;
        // Update customer data with DOB
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
        // Update phone number in users table
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
      // Start editing
      setTempUserName(userName);
      setTempPhoneNumber(phoneNumber);
      setTempEmail(email);
      setIsEditingPersonalInfo(true);
    }
  };

  // Handle predefined title selection
  const handleTitleSelection = (title: string, id: string) => {
    setNewAddressTitle(title);
    setSelectedTitleId(id);
  };

  // Clear title selection
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
    
      // If setting as default, remove default from other addresses
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
    // For Android, hide the picker after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  
    if (date && event.type !== 'dismissed') {
      setSelectedDob(date);
      const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      setFormattedDob(formatted);
    }
  };

  // Get current location function
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
      
      // Check if current location is within Karnataka
      if (location.coords.latitude >= KARNATAKA_BOUNDS.south &&
          location.coords.latitude <= KARNATAKA_BOUNDS.north &&
          location.coords.longitude >= KARNATAKA_BOUNDS.west &&
          location.coords.longitude <= KARNATAKA_BOUNDS.east) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        // Reverse geocode to get current address
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
            
            // Update selected location with current location data
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
        
        // Animate to current location
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
      // Get current location first
      await getCurrentLocation();
      setShowMap(true);
    } catch (error) {
      console.error('Error opening map:', error);
      // Still show map even if location fails
      setShowMap(true);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
  
    // Check if the tapped location is within Karnataka
    if (latitude >= KARNATAKA_BOUNDS.south &&
        latitude <= KARNATAKA_BOUNDS.north &&
        longitude >= KARNATAKA_BOUNDS.west &&
        longitude <= KARNATAKA_BOUNDS.east) {
    
      setSelectedLocation({ 
        latitude, 
        longitude,
        address: '' // Will be filled by reverse geocoding
      });
    
      try {
        // Reverse geocode to get address from coordinates
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
          // Update selected location with full address
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

  // New map control functions
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
      // Use Google Maps Places API to search for locations in Karnataka
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' Karnataka')}&key=${GOOGLE_MAPS_API_KEY}`
      );
    
      const data = await response.json();
    
      if (data.status === 'OK' && data.results.length > 0) {
        // Filter results to only include those within Karnataka
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
  
    // Center map on selected location
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
  
    // Set the address
    setNewAddress(result.formatted_address);
  
    // Clear search results
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity onPress={showImagePickerOptions} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#64748b" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{userName || 'Your Name'}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#f59e0b" />
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} ({totalTrips} trips)
            </Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={toggleEditPersonalInfo}>
              <Text style={styles.editButtonText}>
                {isEditingPersonalInfo ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="phone" size={20} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={tempPhoneNumber}
                  onChangeText={setTempPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{phoneNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="email" size={20} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{email}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="person" size={20} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles.input}
                  value={tempUserName}
                  onChangeText={setTempUserName}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles.infoValue}>{userName}</Text>
              )}
            </View>
          </View>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="cake" size={20} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <TouchableOpacity onPress={selectDateOfBirth}>
                <Text style={styles.infoValue}>
                  {formattedDob || 'Tap to select date of birth'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trip Statistics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Statistics</Text>
        
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
          
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Saved Addresses Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={toggleAddAddressForm}>
              <Text style={styles.editButtonText}>
                {showAddAddressForm ? 'Cancel' : 'Add New'}
              </Text>
            </TouchableOpacity>
          </View>
        
          {savedAddresses.map((address) => (
            <View key={address.id} style={styles.addressItem}>
              <View style={styles.addressContent}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressTitle}>{address.title}</Text>
                  {address.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{address.address}</Text>
                {address.latitude && address.longitude && (
                  <Text style={styles.coordinatesText}>
                    {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteAddress(address)}>
                <MaterialIcons name="delete" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
        
          {showAddAddressForm && (
            <View style={styles.addAddressForm}>
              {/* Predefined Title Banners */}
              <View style={styles.titleBannersContainer}>
                <Text style={styles.bannersTitle}>Quick Select:</Text>
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
                        selectedTitleId === titleItem.id && styles.titleBannerSelected
                      ]}
                      onPress={() => handleTitleSelection(titleItem.title, titleItem.id)}
                    >
                      <MaterialIcons 
                        name={titleItem.icon as any} 
                        size={16} 
                        color={selectedTitleId === titleItem.id ? '#fff' : '#64748b'} 
                      />
                      <Text 
                        style={[
                          styles.titleBannerText,
                          selectedTitleId === titleItem.id && styles.titleBannerTextSelected
                        ]}
                      >
                        {titleItem.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Clear selection button - show only if a title is selected */}
                {selectedTitleId && (
                  <TouchableOpacity 
                    style={styles.clearTitleButton}
                    onPress={clearTitleSelection}
                  >
                    <Text style={styles.clearTitleText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[
                  styles.input, 
                  styles.addressTitleInput,
                  selectedTitleId && styles.inputWithBannerSelected
                ]} 
                placeholder="Address Title (e.g., Home, Work)"
                value={newAddressTitle}
                onChangeText={(text) => {
                  setNewAddressTitle(text);
                  if (text && selectedTitleId) {
                    setSelectedTitleId(null);
                  }
                }}
                editable={!selectedTitleId} // Disable editing if banner is selected
              />
              
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Full Address"
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
                <View style={styles.searchingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.searchingText}>Searching...</Text>
                </View>
              )}
              
              {addressSuggestions.length > 0 && (
                <ScrollView style={styles.searchResultsContainer}>
                  {addressSuggestions.map((pred, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => selectAddressSuggestion(pred)}
                    >
                      <Ionicons name="location" size={20} color="#007AFF" />
                      <Text style={styles.searchResultText}>{pred.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            
              <TouchableOpacity style={styles.chooseOnMapButton} onPress={openMap}>
                <MaterialIcons name="map" size={20} color="#007AFF" />
                <Text style={styles.chooseOnMapText}>Choose on Map</Text>
              </TouchableOpacity>
            
              {selectedLocation && (
                <View style={styles.selectedLocationContainer}>
                  <Text style={styles.selectedLocationTitle}>Selected Location:</Text>
                  <Text style={styles.selectedLocationAddress}>{selectedLocation.address}</Text>
                  <Text style={styles.selectedLocationCoords}>
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
                    <Ionicons name="checkbox" size={24} color="#007AFF" />
                  ) : (
                    <Ionicons name="square-outline" size={24} color="#64748b" />
                  )}
                </TouchableOpacity>
                <Text style={styles.defaultAddressText}>Set as default address</Text>
              </View>
            
              <TouchableOpacity style={styles.saveAddressButton} onPress={addAddress}>
                <Text style={styles.saveAddressText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
          <View style={styles.mapContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location in Karnataka..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {isSearching && (
              <View style={styles.searchingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            )}
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResultsContainer}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Ionicons name="location" size={20} color="#007AFF" />
                    <Text style={styles.searchResultText}>{result.formatted_address}</Text>
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
              {/* Current Location Marker - Green */}
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
              
              {/* Selected Location Marker - Red */}
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
          
            {/* Map Controls */}
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
          
            <View style={styles.mapButtons}>
              <TouchableOpacity style={styles.cancelMapButton} onPress={() => setShowMap(false)}>
                <Text style={styles.cancelMapText}>Cancel</Text>
              </TouchableOpacity>
            
              <TouchableOpacity style={styles.confirmMapButton} onPress={confirmLocation}>
                <Text style={styles.confirmMapText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
            
            {/* Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ff0000' }]} />
                <Text style={styles.legendText}>Selected Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#00ff00' }]} />
                <Text style={styles.legendText}>Current Location</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 40,
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
  // New styles for title banners
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
  titleBannerSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  titleBannerText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  titleBannerTextSelected: {
    color: '#fff',
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
  inputWithBannerSelected: {
    backgroundColor: '#f8fafc',
    borderColor: '#007AFF',
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
  logoutButton: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  logoutText: {
    color: '#dc2626',
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
  locationInfoContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  locationInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationInfoAddress: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  locationInfoCoords: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
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
});