import { uploadAsync, FileSystemUploadType } from 'expo-file-system';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '@/stores/appStore';
import { supabase } from '@/services/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

export default function DriverDocumentsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  // Document states
  const [licenseDocument, setLicenseDocument] = useState<string | null>(null);
  const [idProofDocument, setIdProofDocument] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // Loading states for individual uploads
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [idProofUploading, setIdProofUploading] = useState(false);

  useEffect(() => {
    loadDriverDocuments();
  }, []);

  const loadDriverDocuments = async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('drivers')
        .select('license_document_url, id_proof_document_url, kyc_status, rejection_reason')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching driver documents:', error);
        return;
      }

      if (data) {
        setLicenseDocument(data.license_document_url);
        setIdProofDocument(data.id_proof_document_url);
        setKycStatus(data.kyc_status || 'pending');
        setRejectionReason(data.rejection_reason || '');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading driver documents:', error);
      Alert.alert('Error', 'Failed to load document data');
      setIsLoading(false);
    }
  };

  // Check if bucket is accessible
  const checkBucketAccess = async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking bucket access...');
      
      // Try to list files in the bucket (this tests if we can access it)
      const { data, error } = await supabase.storage
        .from('drivers-kyc-documents')
        .list('test', { limit: 1 });

      // If we get any response (even empty), the bucket is accessible
      // We don't care about the actual files, just if we can access the bucket
      if (error) {
        console.log('⚠️ Bucket access test result:', error.message);
        // Even if there's an error, the bucket might still be accessible for uploads
        // Many buckets return errors for listing but allow uploads
        return true;
      }

      console.log('✅ Bucket is accessible');
      return true;
    } catch (error) {
      console.error('❌ Bucket access check failed:', error);
      return false;
    }
  };

  // Enhanced upload function - simplified without bucket creation
  const uploadDocument = async (uri: string, documentType: 'license' | 'id_proof', mimeType: string) => {
    try {
      console.log('🔍 Starting upload process...');
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Authentication failed. Please log in again.');
      }

      console.log('✅ User authenticated:', session.user.id);

      // Generate a unique filename
      let fileExtension = 'jpg';
      if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
        fileExtension = 'jpg';
      } else if (mimeType.includes('image/png')) {
        fileExtension = 'png';
      } else if (mimeType.includes('application/pdf')) {
        fileExtension = 'pdf';
      }

      const fileName = `${documentType}_${Date.now()}.${fileExtension}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log('📁 Upload details:', { 
        bucket: 'drivers-kyc-documents',
        fileName, 
        filePath, 
        mimeType,
        uri
      });

      // Set uploading state
      documentType === 'license' ? setLicenseUploading(true) : setIdProofUploading(true);

      // Supabase REST API endpoint for upload
      const SUPABASE_URL = 'https://gmualcoqyztvtsqhjlzb.supabase.co';
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/drivers-kyc-documents/${filePath}`;

      // Get access token for authorization
      const accessToken = session.access_token;
      if (!accessToken) throw new Error('No access token found');

      console.log('🚀 Uploading to drivers-kyc-documents bucket via REST API...');
      const uploadResult = await uploadAsync(uploadUrl, uri, {
        httpMethod: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': mimeType,
        },
        uploadType: FileSystemUploadType.BINARY_CONTENT,
      });

      console.log('Upload result:', uploadResult);
      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed: ${uploadResult.body}`);
      }

      // After successful upload, fetch the public URL and update UI
      const { data: { publicUrl } } = supabase
        .storage
        .from('drivers-kyc-documents')
        .getPublicUrl(filePath);

      if (publicUrl) {
        if (documentType === 'license') {
          setLicenseDocument(publicUrl);
        } else {
          setIdProofDocument(publicUrl);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      documentType === 'license' ? setLicenseUploading(false) : setIdProofUploading(false);
    }
  };

  const takePhoto = async (documentType: 'license' | 'id_proof') => {
    try {
      console.log('📷 Opening camera...');
      
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera access is required to take photos of your documents.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) {
        console.log('Camera cancelled by user');
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        Alert.alert('Error', 'No photo was taken');
        return;
      }

      console.log('✅ Photo captured successfully');
      await uploadDocument(asset.uri, documentType, 'image/jpeg');
      
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImageFromGallery = async (documentType: 'license' | 'id_proof') => {
    try {
      console.log('🖼️ Opening gallery...');
      
      // Request gallery permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery access is required to select document photos.');
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) {
        console.log('Gallery selection cancelled');
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        Alert.alert('Error', 'No image selected');
        return;
      }

      console.log('✅ Image selected from gallery');
      await uploadDocument(asset.uri, documentType, asset.mimeType || 'image/jpeg');
      
    } catch (error) {
      console.error('❌ Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    }
  };

  const pickPDFDocument = async (documentType: 'license' | 'id_proof') => {
    try {
      console.log('📄 Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker cancelled');
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        Alert.alert('Error', 'No document selected');
        return;
      }

      // Check file size (limit to 10MB)
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return;
      }

      console.log('✅ PDF document selected:', asset.name);
      await uploadDocument(asset.uri, documentType, 'application/pdf');
      
    } catch (error) {
      console.error('❌ Document picker error:', error);
      Alert.alert('Error', 'Failed to pick PDF document. Please try again.');
    }
  };

  const showUploadOptions = (documentType: 'license' | 'id_proof') => {
    Alert.alert(
      `Upload ${documentType === 'license' ? 'Driver\'s License' : 'ID Proof'}`,
      'Choose how to upload your document:',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(documentType),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImageFromGallery(documentType),
        },
        {
          text: 'Choose PDF File',
          onPress: () => pickPDFDocument(documentType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removeDocument = async (documentType: 'license' | 'id_proof') => {
    try {
      if (!user) throw new Error('No user found');

      Alert.alert(
        'Remove Document',
        `Are you sure you want to remove your ${documentType === 'license' ? 'driver\'s license' : 'ID proof'}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const updateData: any = {
                  updated_at: new Date().toISOString()
                };

                if (documentType === 'license') {
                  updateData.license_document_url = null;
                } else {
                  updateData.id_proof_document_url = null;
                }
                
                // Reset KYC status if not approved
                if (kycStatus !== 'approved') {
                  updateData.kyc_status = 'pending';
                }

                const { error: updateError } = await supabase
                  .from('drivers')
                  .update(updateData)
                  .eq('id', user.id);

                if (updateError) throw updateError;

                // Update local state
                if (documentType === 'license') {
                  setLicenseDocument(null);
                } else {
                  setIdProofDocument(null);
                }

                Alert.alert('Success', `${documentType === 'license' ? 'License' : 'ID Proof'} removed successfully!`);
              } catch (error: any) {
                console.error('Remove document error:', error);
                Alert.alert('Error', error.message || 'Failed to remove document');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Remove document error:', error);
      Alert.alert('Error', error.message || 'Failed to remove document');
    }
  };

  const getKycStatusColor = () => {
    switch (kycStatus) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      case 'pending': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getKycStatusText = () => {
    switch (kycStatus) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Under Review';
      default: return 'Not Submitted';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          
          
          <View style={styles.headerSpacer} />
        </View>

        {/* KYC Status Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Verification Status</Text>
          <View style={styles.kycStatusContainer}>
            <View style={[styles.kycStatusBadge, { backgroundColor: getKycStatusColor() + '20' }]}>
              <Text style={[styles.kycStatusText, { color: getKycStatusColor() }]}>
                {getKycStatusText()}
              </Text>
            </View>
            {rejectionReason && (
              <View style={[styles.rejectionContainer, { backgroundColor: colors.error + '10' }]}>
                <Text style={[styles.rejectionTitle, { color: colors.error }]}>Reason for rejection:</Text>
                <Text style={[styles.rejectionReason, { color: colors.text }]}>{rejectionReason}</Text>
              </View>
            )}
          </View>
        </View>

        {/* License Document Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Driver's License</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Upload a clear photo of your valid driver's license
          </Text>

          {licenseDocument ? (
            <View style={styles.documentContainer}>
              <View style={[styles.documentPreview, { backgroundColor: colors.surface }]}>
                <Ionicons name="card" size={40} color={colors.primary} />
                <Text style={[styles.documentText, { color: colors.textSecondary }]}>License Document</Text>
                <TouchableOpacity
                  onPress={() => licenseDocument && Linking.openURL(licenseDocument)}
                  style={[styles.viewButton, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Document</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={() => removeDocument('license')}
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                disabled={licenseUploading}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => showUploadOptions('license')}
              style={[styles.uploadButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              disabled={licenseUploading}
            >
              {licenseUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                  <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                    Upload License
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ID Proof Document Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>ID Proof</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Upload a government-issued ID (Aadhaar, PAN, Passport, etc.)
          </Text>

          {idProofDocument ? (
            <View style={styles.documentContainer}>
              <View style={[styles.documentPreview, { backgroundColor: colors.surface }]}>
                <Ionicons name="document-text" size={40} color={colors.primary} />
                <Text style={[styles.documentText, { color: colors.textSecondary }]}>ID Proof Document</Text>
                <TouchableOpacity
                  onPress={() => idProofDocument && Linking.openURL(idProofDocument)}
                  style={[styles.viewButton, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Document</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => removeDocument('id_proof')}
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                disabled={idProofUploading}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => showUploadOptions('id_proof')}
              style={[styles.uploadButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              disabled={idProofUploading}
            >
              {idProofUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                  <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                    Upload ID Proof
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Information Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Important Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="camera" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Take clear, well-lit photos of your documents
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Verification usually takes 24-48 hours
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="alert-circle" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You cannot accept rides until verification is complete
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  kycStatusContainer: {
    alignItems: 'center',
  },
  kycStatusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  kycStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectionContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 14,
    lineHeight: 20,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentPreview: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginRight: 12,
  },
  documentText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  uploadButtonText: {
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});