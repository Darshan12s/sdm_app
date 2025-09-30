import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import services and stores
import { AuthService } from '@/services/supabase/auth';
import { useAppStore, useUser } from '@/stores/appStore';
import { supabase } from '@/services/supabase/client';
import { uploadWithRestAPI } from '@/utils/storageTest';
import { useTheme } from '@/contexts/ThemeContext';

export default function DriverProfileScreen({ navigation }: { navigation: any }) {
  const user = useUser();
  const { setLoading } = useAppStore();
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
  // const [averageEarnings, setAverageEarnings] = useState(0);

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
  const [uploadAttempts, setUploadAttempts] = useState(0);

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
        // Fallback to mock data if there's an error
        
        return;
      }

      if (bookingsData && bookingsData.length > 0) {
        // Calculate statistics from real data
        const completedBookings = bookingsData.filter(booking => 
          booking.status === 'completed'
        );
        
        const cancelledBookings = bookingsData.filter(booking => 
          booking.status === 'cancelled'
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

        // Calculate average earnings per ride
        const averageEarningsValue = completedBookings.length > 0
          ? totalEarningsValue / completedBookings.length
          : 0;

        // Set the calculated values
        setRating(parseFloat(averageRating.toFixed(1)));
        setTotalTrips(bookingsData.length);
        setTotalEarnings(totalEarningsValue);
        // setAverageEarnings(averageEarningsValue);
      } else {
        // No bookings found, use mock data
       
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to mock data
      
    }
  };
  const uploadProfileImage = async (uri: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      setIsUploading(true);
      setUploadAttempts(retryCount + 1);

      console.log(`🚀 Starting driver profile image upload (attempt ${retryCount + 1})...`);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      if (!session?.user) {
        throw new Error('No user session found');
      }

      console.log('✅ User session found:', session.user.id);

      // Convert image to blob with timeout
      console.log('📸 Fetching image from URI:', uri);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let blob: Blob;
      try {
        const response = await fetch(uri, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
        console.log('📦 Image blob size:', blob.size);

        if (blob.size === 0) throw new Error('Image file is empty');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Image fetch timed out. Please try again.');
        }
        throw fetchError;
      }

      // Generate a unique filename
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log('📁 Uploading to path:', filePath);
      console.log('📤 Proceeding with upload to drivers_profile_pictures...');

      let uploadData, uploadError;

      // Try multiple upload methods with retry logic
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES}...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }

        try {
          console.log(`📤 Upload attempt ${attempt + 1}...`);
          const result = await supabase.storage
            .from('drivers_profile_pictures')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
              cacheControl: '3600'
            });
          uploadData = result.data;
          uploadError = result.error;
          break; // Success, exit retry loop
        } catch (methodError: any) {
          console.error(`❌ Upload attempt ${attempt + 1} failed:`, methodError);
          uploadError = methodError;

          // If it's the last attempt, try alternative method
          if (attempt === MAX_RETRIES) {
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
              break;
            } catch (altError: any) {
              console.error('❌ Alternative upload also failed:', altError);
              uploadError = altError;
            }
          }
        }
      }

      if (uploadError) {
        console.error('❌ Upload error details:', uploadError);
        console.error('❌ Upload error message:', uploadError.message);

        // Handle network-related errors with retry
        if (uploadError.message?.includes('Network request failed') ||
            uploadError.message?.includes('Failed to fetch') ||
            uploadError.message?.includes('NetworkError') ||
            uploadError.message?.includes('StorageUnknownError') ||
            uploadError.message?.includes('timeout')) {

          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Network error detected, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return uploadProfileImage(uri, retryCount + 1);
          } else {
            console.log('❌ Max retries reached for network error');
            // Don't show alert for network errors, just log them
            console.error('Network upload failed after max retries');
            return;
          }
        }

        // Handle other critical errors that should be shown to user
        if (uploadError.message?.includes('Bucket not found') ||
            uploadError.message?.includes('404')) {
          throw new Error('Storage service unavailable. Please contact support.');
        } else if (uploadError.message?.includes('row-level security') ||
                   uploadError.message?.includes('RLS') ||
                   uploadError.message?.includes('violates row-level security policy')) {
          throw new Error('Upload permission denied. Please try logging out and back in.');
        } else if (uploadError.message?.includes('Unauthorized') ||
                   uploadError.message?.includes('403')) {
          throw new Error('Upload permission denied. Please try logging out and back in.');
        } else if (uploadError.message?.includes('Payload too large') ||
                   uploadError.message?.includes('413')) {
          throw new Error('Image file is too large. Please choose a smaller image (under 5MB).');
        } else if (uploadError.message?.includes('CORS')) {
          throw new Error('Upload blocked by security policy. Please contact support.');
        } else {
          // For other errors, don't show to user unless it's critical
          console.error('Non-critical upload error:', uploadError.message);
          return;
        }
      }

      console.log('✅ Upload successful:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drivers_profile_pictures')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate image URL');
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
        // Show warning but don't fail the upload
        Alert.alert('Warning', 'Image uploaded but profile update failed. Please refresh the page.');
      }

      console.log('🎉 Driver profile image upload completed successfully');

      // Only show success message if it was a retry or took multiple attempts
      if (retryCount > 0) {
        Alert.alert('Success', 'Profile image uploaded successfully!');
      }

    } catch (error: any) {
      console.error('💥 Upload image error:', error);
      console.error('💥 Error stack:', error.stack);

      const errorMessage = error.message || 'Failed to upload image';

      // Only show critical errors to user, not network issues
      if (errorMessage.includes('permission denied') ||
          errorMessage.includes('too large') ||
          errorMessage.includes('contact support') ||
          errorMessage.includes('security policy')) {
        Alert.alert('Upload Error', errorMessage);
      } else {
        // For network or temporary errors, just log them
        console.error('Upload failed (non-critical):', errorMessage);
      }
    } finally {
      setIsUploading(false);
      setUploadAttempts(0);
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
        .from('drivers_profile_pictures')
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
            .from('drivers_profile_pictures')
            .remove(filesToRemove);

          if (removeError) {
            console.error('Storage remove error:', removeError);
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
              <Image source={{ uri: profileImage }} style={styles(colors).avatar} />
            ) : (
              <View style={styles(colors).avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles(colors).cameraButton}>
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="camera" size={20} color={colors.text} />
              )}
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
{/* 
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{averageEarnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Avg per Ride</Text>
            </View> */}
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
    backgroundColor: colors.text,
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
    backgroundColor: colors.primaryLight || colors.primary,
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
});


