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
import { GOOGLE_PLACES_API_KEY } from '../../constants';

// Enhanced image upload handler with proper format handling for drivers
const uploadImageToStorage = async (uri: string, userId: string): Promise<string> => {
  console.log('📤 uploadImageToStorage called with URI:', uri, 'userId:', userId);

  try {
    // Generate a unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomId}.jpg`;
    const filePath = `${userId}/${fileName}`;
    console.log('📁 Generated filePath:', filePath);

    // Get file information first
    console.log('📋 Getting file information...');
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('📄 File info:', {
      exists: fileInfo.exists,
      uri: fileInfo.uri,
      isDirectory: fileInfo.isDirectory
    });

    if (!fileInfo.exists) {
      throw new Error(`File does not exist at path: ${uri}`);
    }

    if (fileInfo.isDirectory) {
      throw new Error('Selected path is a directory, not a file');
    }

    console.log('📖 Reading file with proper encoding...');
    let base64Data;

    try {
      base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('✅ File read successfully, base64 length:', base64Data.length);
    } catch (readError: any) {
      console.error('❌ File read error:', readError);
      throw new Error(`Failed to read file: ${readError.message || readError.toString()}`);
    }

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Base64 data is empty after reading file');
    }

    // Check if base64 data is valid (basic validation)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      console.warn('⚠️ Base64 format validation failed, but continuing with upload');
    }

    // Calculate expected file size from base64
    const expectedSize = (base64Data.length * 3) / 4;
    console.log('📊 Size validation:', {
      base64Length: base64Data.length,
      expectedSize: Math.round(expectedSize),
      actualSize: fileInfo.size
    });

    // Convert base64 to proper buffer format for upload
    console.log('🔄 Preparing data for upload...');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('🚀 Uploading to Supabase storage...');
    const { data, error } = await supabase.storage
      .from('drivers_profile_pictures')
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '31536000', // Cache for 1 year
      });

    if (error) {
      console.error('❌ Supabase upload error:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: (error as any).error,
        details: (error as any).details
      });
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful:', {
      path: data.path,
      fullPath: data.fullPath,
      id: data.id
    });

    // Verify the upload by getting the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drivers_profile_pictures')
      .getPublicUrl(filePath);

    console.log('🔗 Generated public URL:', publicUrl);

    // Validate the public URL format
    try {
      const url = new URL(publicUrl);
      console.log('✅ Public URL is valid:', {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        href: url.href
      });
    } catch (urlError) {
      console.error('❌ Invalid public URL format:', urlError);
      throw new Error(`Invalid public URL generated: ${publicUrl}`);
    }

    console.log('🎯 Upload process completed successfully');
    return filePath;
  } catch (error) {
    console.error('❌ Error in uploadImageToStorage:', error);
    throw error;
  }
};

export default function DriverProfileScreen({ navigation }: { navigation: any }) {
  const { user, setUser } = useAppStore();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // User information
  const [userName, setUserName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_no || '');
  const [email, setEmail] = useState(user?.email || '');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [formattedDob, setFormattedDob] = useState('');
  const [selectedDob, setSelectedDob] = useState<Date | null>(null);

  // Stats
  const [rating, setRating] = useState(0.0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // Temporary editing values
  const [tempUserName, setTempUserName] = useState(user?.full_name || '');
  const [tempPhoneNumber, setTempPhoneNumber] = useState(user?.phone_no || '');
  const [tempEmail, setTempEmail] = useState(user?.email || '');
  const [tempLicenseNumber, setTempLicenseNumber] = useState('');

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);

  // Menu items from the image
  const menuItems = [
    {
      title: 'Vehicle Information',
      subtitle: 'Manage your vehicle details',
      icon: 'airport-shuttle',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('VehicleInformation'),
    },
    {
      title: 'Vehicle Documents',
      subtitle: 'License, insurance, permits',
      icon: 'description',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('VehicleDocuments'),
    },
    {
      title: 'Driver Documents',
      subtitle: 'License, ID proof, and verification',
      icon: 'description',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('DriverDocuments'),
    },
    {
      title: 'Bank Details',
      subtitle: 'Update payment information',
      icon: 'account-balance',
      iconType: 'MaterialIcons',
      onPress: () => Alert.alert('Coming Soon', 'Bank details coming soon'),
    },
    {
      title: 'Notifications',
      subtitle: 'Manage app notifications',
      icon: 'notifications',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      title: 'Support',
      subtitle: 'Get help and contact us',
      icon: 'help',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('DriverSupport'),
    },
    {
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      icon: 'settings',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

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

          // Fetch additional data
          await fetchDriverData(session.user.id);
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

  const fetchDriverData = async (userId: string) => {
    try {
      // Fetch driver-specific data including license number
      const { data, error } = await supabase
        .from('drivers')
        .select('license_number')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching driver data:', error);
        return;
      }

      if (data) {
        setLicenseNumber(data.license_number || '');
        setTempLicenseNumber(data.license_number || '');
      }

      // Fetch profile picture if exists
      await fetchProfileImage(userId);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    }
  };

  const fetchProfileImage = async (userId: string) => {
    try {
      console.log('🔍 fetchProfileImage called for userId:', userId);
      const { data: userData, error } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user data:', error);
        return;
      }

      console.log('📋 userData from database:', userData);

      if (userData?.profile_picture_url) {
        let imageUrl = userData.profile_picture_url;
        console.log('🔗 Original imageUrl from database:', imageUrl);

        // Handle different types of image URLs
        if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
          console.log('📱 Local image URI detected, using directly:', imageUrl);
          // For local URIs, use them directly
          setProfileImage(imageUrl);
        } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          console.log('🌐 Remote URL detected, using directly:', imageUrl);
          // Already a full remote URL - use directly without cache busting
          setProfileImage(imageUrl);
        } else {
          // It's a Supabase storage path - construct the full URL without cache busting
          console.log('🏗️ Constructing Supabase URL for storage path:', imageUrl);
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('drivers_profile_pictures')
              .getPublicUrl(imageUrl);

            console.log('✅ Final Supabase URL:', publicUrl);

            // Validate the constructed URL
            try {
              new URL(publicUrl);
              console.log('✅ Constructed URL format is valid');
              setProfileImage(publicUrl);
            } catch (urlValidationError) {
              console.error('❌ Constructed URL is invalid:', urlValidationError);
              console.log('🔍 This might indicate an issue with the Supabase project URL or bucket configuration');
              setProfileImage(null);
            }
          } catch (urlError) {
            console.error('❌ Error constructing Supabase URL:', urlError);
            console.log('🔍 This might indicate an issue with Supabase client configuration or network');
            console.log('⚠️ Setting profile image to null due to URL construction failure');
            setProfileImage(null);
          }
        }
      } else {
        console.log('⚠️ No profile_picture_url found in database');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('❌ Error fetching profile image:', error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Fetch real statistics from bookings table
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', userId);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      if (bookingsData && bookingsData.length > 0) {
        // Calculate statistics from real data
        const completedBookings = bookingsData.filter(booking => 
          booking.status === 'completed'
        );
        
        // Calculate average rating
        const ratings = completedBookings
          .filter(booking => booking.rating !== null && booking.rating !== undefined)
          .map(booking => booking.rating);
        
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;
        
        // Calculate total earnings
        const totalEarningsValue = completedBookings.reduce((sum, booking) =>
          sum + (booking.fare_amount || 0), 0
        );

        // Set the calculated values
        setRating(parseFloat(averageRating.toFixed(1)));
        setTotalTrips(bookingsData.length);
        setTotalEarnings(totalEarningsValue);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    try {
      console.log('🚀 uploadProfileImage called with URI:', uri);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session found');

      console.log('👤 User session found, user ID:', session.user.id);
      const filePath = await uploadImageToStorage(uri, session.user.id);
      console.log('💾 File uploaded to path:', filePath);

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('drivers_profile_pictures')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL for storage:', publicUrl);

      // Store the file path (not the full URL) in the database
      console.log('💿 Updating user profile with filePath:', filePath);
      await supabase
        .from('users')
        .update({
          profile_picture_url: filePath, // Store the path, not the full URL
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      console.log('✅ Profile updated successfully');

      // Force refresh the profile image with cache busting
      await fetchProfileImage(session.user.id);

      Alert.alert('Success', 'Profile image uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Upload error:', error);

      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to upload image';
      if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('storage')) {
        errorMessage = 'Storage error. Please try again in a few moments.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please allow storage permissions and try again.';
      } else if (error.message?.includes('file')) {
        errorMessage = 'File error. Please select a valid image file and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Upload Failed', errorMessage);
    }
  };

  const pickImageFromSource = async (source: 'camera' | 'gallery') => {
    try {
      console.log('📸 pickImageFromSource called with source:', source);
      const options = {
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.7, // Reduced quality for better performance
        base64: false,
      };

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      console.log('📋 Image picker result:', result);

      if (!result.canceled && result.assets?.[0]) {
        const selectedAsset = result.assets[0];
        const originalUri = selectedAsset.uri;

        console.log('🖼️ Selected image asset:', {
          uri: originalUri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          fileSize: selectedAsset.fileSize
        });

        // First, set the local image for immediate display
        console.log('✅ Setting local image for immediate display:', originalUri);
        setProfileImage(originalUri);

        // Then start the upload process
        console.log('🚀 Starting upload process...');
        await uploadProfileImage(originalUri);
      } else {
        console.log('❌ Image picker was canceled or no asset found');
      }
    } catch (error: any) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
          style: 'destructive' as const,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session found');

      await supabase
        .from('users')
        .update({ profile_picture_url: null })
        .eq('id', session.user.id);

      setProfileImage(null);
      Alert.alert('Success', 'Profile image removed!');
    } catch (error: any) {
      console.error('❌ Remove image error:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to remove image';
      if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission error. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Remove Failed', errorMessage);
    }
  };

  const toggleEditPersonalInfo = async () => {
    if (isEditingPersonalInfo) {
      // Save changes
      try {
        if (!user) throw new Error('No user found');

        // Update user profile
        const updates = {
          full_name: tempUserName,
          email: tempEmail,
        };

        const { data, error } = await AuthService.updateProfile(user.id, updates);

        if (error) throw error;

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

        // Update license number in drivers table
        if (tempLicenseNumber !== licenseNumber) {
          const { error: licenseError } = await supabase
            .from('drivers')
            .update({
              license_number: tempLicenseNumber,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (licenseError) {
            console.error('Error updating license number:', licenseError);
            Alert.alert('Error', 'Failed to update license number');
            return;
          }
        }

        setUserName(tempUserName);
        setPhoneNumber(tempPhoneNumber);
        setEmail(tempEmail);
        setLicenseNumber(tempLicenseNumber);
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
      setTempLicenseNumber(licenseNumber);
      setIsEditingPersonalInfo(true);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles(colors).safeArea}>
        <View style={styles(colors).centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles(colors).safeArea}>
      <ScrollView style={styles(colors).container}>
        <View style={styles(colors).header}>
          <Text style={styles(colors).title}>Driver Profile</Text>
          <View style={styles(colors).headerSpacer} />
        </View>

        <View style={styles(colors).profileSection}>
          <TouchableOpacity onPress={showImagePickerOptions} style={styles(colors).avatarContainer}>
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage,
                  cache: 'reload' // Force reload to avoid caching issues
                }}
                style={styles(colors).avatar}
                resizeMode="cover"
                key={`profile-${profileImage}-${Date.now()}`} // Add timestamp to force re-render
                onError={(error) => {
                  console.error('❌ Image display error:', error.nativeEvent.error);
                  console.log('🔍 Image URI that failed:', profileImage);
                  console.log('📋 Full error details:', {
                    error: error.nativeEvent.error,
                    uri: profileImage,
                    isSupabaseUrl: profileImage?.includes('supabase.co'),
                    uriLength: profileImage?.length
                  });

                  // Handle different error types
                  const errorType = error.nativeEvent.error;
                  if (errorType === 'Network request failed' || errorType?.includes('Network')) {
                    console.log('🌐 Network error - image might be temporarily unavailable');
                    // Keep the current image URL but log the issue
                  } else {
                    console.log('🚫 Image format or availability issue detected');
                    // Clear the image on critical errors
                    setProfileImage(null);
                  }
                }}
                onLoadStart={() => {
                  console.log('🔄 Image loading started:', profileImage);
                }}
                onLoadEnd={() => {
                  console.log('✅ Image loaded successfully:', profileImage);
                }}
              />
            ) : (
              <View style={styles(colors).avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
             <View style={[styles(colors).cameraButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={20} color={colors.surface} />
             </View>
          </TouchableOpacity>
          <Text style={styles(colors).userName}>{userName || 'Driver'}</Text>
          <View style={styles(colors).ratingContainer}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <Text style={styles(colors).ratingText}>
              {rating.toFixed(1)} ({totalTrips} rides)
            </Text>
          </View>

         
        </View>

        {/* Personal Information Card */}
        <View style={styles(colors).card}>
          <View style={styles(colors).cardHeader}>
            <Text style={styles(colors).cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={toggleEditPersonalInfo}>
              <Text style={styles(colors).editButtonText}>
                {isEditingPersonalInfo ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles(colors).infoItem}>
            <View style={styles(colors).infoIcon}>
              <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Phone Number</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles(colors).input}
                  value={tempPhoneNumber}
                  onChangeText={setTempPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles(colors).infoValue}>{phoneNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles(colors).infoItem}>
            <View style={styles(colors).infoIcon}>
              <MaterialIcons name="email" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Email</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles(colors).input}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles(colors).infoValue}>{email}</Text>
              )}
            </View>
          </View>

          <View style={styles(colors).infoItem}>
            <View style={styles(colors).infoIcon}>
              <MaterialIcons name="person" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>Full Name</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles(colors).input}
                  value={tempUserName}
                  onChangeText={setTempUserName}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles(colors).infoValue}>{userName}</Text>
              )}
            </View>
          </View>

          <View style={styles(colors).infoItem}>
            <View style={styles(colors).infoIcon}>
              <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles(colors).infoContent}>
              <Text style={styles(colors).infoLabel}>License Number</Text>
              {isEditingPersonalInfo ? (
                <TextInput
                  style={styles(colors).input}
                  value={tempLicenseNumber}
                  onChangeText={setTempLicenseNumber}
                  placeholder="Enter license number"
                />
              ) : (
                <Text style={styles(colors).infoValue}>{licenseNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Driver Statistics Card */}
        <View style={styles(colors).card}>
          <Text style={styles(colors).cardTitle}>Driver Statistics</Text>

          <View style={styles(colors).statsContainer}>
            <View style={styles(colors).statItem}>
              <Text style={styles(colors).statValue}>{totalTrips.toLocaleString()}</Text>
              <Text style={styles(colors).statLabel}>Total Rides</Text>
            </View>

            <View style={styles(colors).statItem}>
              <Text style={styles(colors).statValue}>{rating.toFixed(1)}</Text>
              <Text style={styles(colors).statLabel}>Rating</Text>
            </View>

            <View style={styles(colors).statItem}>
              <Text style={styles(colors).statValue}>₹{totalEarnings.toLocaleString()}</Text>
              <Text style={styles(colors).statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Menu Items Card */}
        <View style={styles(colors).card}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles(colors).menuItem,
                index < menuItems.length - 1 && styles(colors).menuItemBorder
              ]}
              onPress={item.onPress}
            >
              
              <View style={styles(colors).menuItemIcon}>
                <MaterialIcons name={item.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles(colors).menuItemContent}>
                <Text style={styles(colors).menuItemTitle}>{item.title}</Text>
                <Text style={styles(colors).menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles(colors).logoutButton} onPress={handleLogout}>
          <Text style={styles(colors).logoutText}>Logout</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    left: 120,
  },
  headerSpacer: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
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
    backgroundColor: colors.placeholder || '#EEEEEE',
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
    color: colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.cardBackground || colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.shadow || '#000',
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
    color: colors.text,
  },
  editButtonText: {
    color: colors.primary,
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
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground || colors.background,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.errorBackground || '#fef2f2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  logoutText: {
    color: colors.error || '#dc2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
 
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight || colors.primary + '20',
    borderRadius: 16,
  },
  refreshText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  testConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testConnectionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});