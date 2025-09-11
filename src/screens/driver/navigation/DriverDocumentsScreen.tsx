import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '@/stores/appStore';
import { supabase } from '@/services/supabase/client';
import { uploadWithRestAPI } from '@/utils/storageTest';

export default function DriverDocumentsScreen({ navigation }: { navigation: any }) {
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
      
      // Fetch driver document data
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

  const uploadDocument = async (uri: string, documentType: 'license' | 'id_proof', mimeType: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('No user session found');

      // Convert file to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Document file is empty');

      // Generate a unique filename
      let fileExtension = 'pdf';
      if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
        fileExtension = 'jpg';
      } else if (mimeType.includes('image/png')) {
        fileExtension = 'png';
      } else if (mimeType.includes('application/pdf')) {
        fileExtension = 'pdf';
      }
      
      const fileName = `${documentType}_${Date.now()}.${fileExtension}`;
      const filePath = `${session.user.id}/${fileName}`;

      // Set uploading state
      documentType === 'license' ? setLicenseUploading(true) : setIdProofUploading(true);

      // Upload to Supabase storage
      let uploadData, uploadError;

      try {
        const result = await supabase.storage
          .from('drivers-kyc-documents')
          .upload(filePath, blob, {
            contentType: mimeType,
            upsert: true,
            cacheControl: '3600'
          });
        uploadData = result.data;
        uploadError = result.error;
      } catch (uploadError: any) {
        console.error('Upload failed:', uploadError);
        
        // Try REST API fallback for network issues
        if (uploadError.message?.includes('Network request failed')) {
          try {
            const restResult = await uploadWithRestAPI(filePath, blob, mimeType);
            if (restResult.success) {
              uploadData = restResult.data;
              uploadError = null;
            } else {
              throw new Error('Network connection issue');
            }
          } catch (restError: any) {
            throw new Error('Network connection issue');
          }
        } else {
          throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('drivers-kyc-documents')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Failed to get public URL');

      // Update the driver record with the document URL
      const updateData: any = {};
      if (documentType === 'license') {
        updateData.license_document_url = publicUrl;
      } else {
        updateData.id_proof_document_url = publicUrl;
      }
      
      // Reset KYC status to pending when new documents are uploaded
      updateData.kyc_status = 'pending';
      updateData.rejection_reason = null;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      if (documentType === 'license') {
        setLicenseDocument(publicUrl);
      } else {
        setIdProofDocument(publicUrl);
      }
      setKycStatus('pending');
      setRejectionReason('');

      Alert.alert('Success', `${documentType === 'license' ? 'License' : 'ID Proof'} uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload document error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload document');
    } finally {
      documentType === 'license' ? setLicenseUploading(false) : setIdProofUploading(false);
    }
  };

  const pickDocument = async (documentType: 'license' | 'id_proof') => {
    try {
      // First try to pick from camera for images
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted) {
        const actionSheetOptions = {
          title: `Select ${documentType === 'license' ? 'License' : 'ID Proof'}`,
          message: 'Choose how to upload your document',
          options: ['Take Photo', 'Choose from Gallery', 'Choose PDF File', 'Cancel'],
          cancelButtonIndex: 3,
        };

        // Show action sheet (you'll need to implement this or use a library)
        // For now, we'll default to document picker
      }

      // Use document picker for both images and PDFs
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      // Check file size (limit to 10MB)
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      // Determine MIME type
      let mimeType = asset.mimeType || 'application/pdf';
      if (asset.name?.toLowerCase().endsWith('.jpg') || asset.name?.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (asset.name?.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      }

      await uploadDocument(asset.uri, documentType, mimeType);
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async (documentType: 'license' | 'id_proof') => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      await uploadDocument(asset.uri, documentType, 'image/jpeg');
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImageFromGallery = async (documentType: 'license' | 'id_proof') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Gallery permission is needed to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;

      await uploadDocument(asset.uri, documentType, asset.mimeType || 'image/jpeg');
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const showUploadOptions = (documentType: 'license' | 'id_proof') => {
    Alert.alert(
      'Upload Option',
      'Choose how to upload your document',
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
          onPress: () => pickDocument(documentType),
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

      // Update the driver record to remove the document URL
      const updateData: any = {};
      if (documentType === 'license') {
        updateData.license_document_url = null;
      } else {
        updateData.id_proof_document_url = null;
      }
      updateData.updated_at = new Date().toISOString();
      kycStatus !== 'approved' && (updateData.kyc_status = 'pending');

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
      Alert.alert('Remove Error', error.message || 'Failed to remove document');
    }
  };

  const getKycStatusColor = () => {
    switch (kycStatus) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* KYC Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification Status</Text>
          <View style={styles.kycStatusContainer}>
            <View style={[styles.kycStatusBadge, { backgroundColor: getKycStatusColor() + '20' }]}>
              <Text style={[styles.kycStatusText, { color: getKycStatusColor() }]}>
                {getKycStatusText()}
              </Text>
            </View>
            {rejectionReason && (
              <View style={styles.rejectionContainer}>
                <Text style={styles.rejectionTitle}>Reason for rejection:</Text>
                <Text style={styles.rejectionReason}>{rejectionReason}</Text>
              </View>
            )}
          </View>
        </View>

        {/* License Document Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver's License</Text>
          <Text style={styles.cardSubtitle}>
            Upload a clear photo or scan of your driver's license (JPEG, PNG, or PDF)
          </Text>

          {licenseDocument ? (
            <View style={styles.documentContainer}>
              <View style={styles.documentPreview}>
                <Ionicons name="document-text" size={40} color="#3b82f6" />
                <Text style={styles.documentText}>License Document</Text>
                <TouchableOpacity 
                  onPress={() => licenseDocument && Linking.openURL(licenseDocument)}
                  style={styles.viewButton}
                >
                  <Text style={styles.viewButtonText}>View Document</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={() => removeDocument('license')}
                style={styles.removeButton}
                disabled={licenseUploading}
              >
                {licenseUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.removeButtonText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => showUploadOptions('license')}
              style={styles.uploadButton}
              disabled={licenseUploading}
            >
              {licenseUploading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#3b82f6" />
                  <Text style={styles.uploadButtonText}>Upload License</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ID Proof Document Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ID Proof</Text>
          <Text style={styles.cardSubtitle}>
            Upload a government-issued ID (Aadhaar, PAN, Passport, etc.) - JPEG, PNG, or PDF
          </Text>

          {idProofDocument ? (
            <View style={styles.documentContainer}>
              <View style={styles.documentPreview}>
                <Ionicons name="document-text" size={40} color="#3b82f6" />
                <Text style={styles.documentText}>ID Proof Document</Text>
                <TouchableOpacity 
                  onPress={() => idProofDocument && Linking.openURL(idProofDocument)}
                  style={styles.viewButton}
                >
                  <Text style={styles.viewButtonText}>View Document</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={() => removeDocument('id_proof')}
                style={styles.removeButton}
                disabled={idProofUploading}
              >
                {idProofUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.removeButtonText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => showUploadOptions('id_proof')}
              style={styles.uploadButton}
              disabled={idProofUploading}
            >
              {idProofUploading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#3b82f6" />
                  <Text style={styles.uploadButtonText}>Upload ID Proof</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Information</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Supported formats: JPEG, PNG images or PDF documents
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Documents must be clear and valid. Blurry or expired documents will be rejected.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Verification usually takes 24-48 hours. You'll be notified once completed.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              You cannot accept rides until your documents are approved.
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
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  kycStatusContainer: {
    alignItems: 'center',
  },
  kycStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  kycStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    width: '100%',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#dc2626',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentPreview: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginRight: 12,
  },
  documentText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 12,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
});