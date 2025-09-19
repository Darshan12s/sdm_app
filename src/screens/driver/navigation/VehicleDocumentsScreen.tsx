// screens/VehicleDocumentsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import * as mime from 'react-native-mime-types';
import { useTheme } from '@/contexts/ThemeContext';

export default function VehicleDocumentsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVehicleDocuments();
  }, []);

  const loadVehicleDocuments = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Fetch vehicle assigned to the driver
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('assigned_driver_id', user.id)
        .single();

      if (vehicleError || !vehicleData) {
        Alert.alert('Error', 'No vehicle assigned');
        return;
      }

      setVehicle(vehicleData);

      // Fetch vehicle documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicleData.id)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        Alert.alert('Error', 'Failed to load documents');
      } else {
        setDocuments(documentsData || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (documentType: string) => {
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${vehicle.id}/${fileName}`;

      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to array buffer
      const arrayBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

      // Get MIME type
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('vehicle_documents')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle_documents')
        .getPublicUrl(filePath);

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('vehicle_documents')
        .insert({
          vehicle_id: vehicle.id,
          document_type: documentType,
          document_url: publicUrl,
          issue_date: new Date().toISOString().split('T')[0],
          verified: false,
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Document uploaded successfully');
      loadVehicleDocuments(); // Refresh documents list
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this document type');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  // const documentTypes = [
  //   { key: 'insurance', label: 'Insurance Document', icon: 'verified' },
  //   { key: 'registration', label: 'Registration Certificate', icon: 'assignment' },
  //   { key: 'pollution', label: 'Pollution Certificate', icon: 'eco' },
  //   { key: 'license', label: 'Driving License', icon: 'card-membership' },
  // ];

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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container}>
        {!vehicle ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="error-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>No Vehicle Assigned</Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              You need to have a vehicle assigned to manage documents.
            </Text>
          </View>
        ) : (
          <>
            {/* Upload Section
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Upload New Document</Text>
              {documentTypes.map((docType) => (
                <TouchableOpacity
                  key={docType.key}
                  style={styles.uploadButton}
                  onPress={() => uploadDocument(docType.key)}
                  disabled={uploading}
                >
                  <MaterialIcons name={docType.icon as any} size={20} color="#3b82f6" />
                  <Text style={styles.uploadButtonText}>{docType.label}</Text>
                  {uploading && <ActivityIndicator size="small" color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </View> */}

            {/* Documents List */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Documents</Text>
              {documents.length === 0 ? (
                <Text style={[styles.noDocumentsText, { color: colors.textSecondary }]}>No documents uploaded yet</Text>
              ) : (
                documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.documentItem, { borderColor: colors.border }]}
                    onPress={() => openDocument(doc.document_url)}
                  >
                    <View style={styles.documentInfo}>
                      <MaterialIcons name="description" size={24} color={colors.primary} />
                      <View style={styles.documentDetails}>
                        <Text style={[styles.documentType, { color: colors.text }]}>
                          {doc.document_type.toUpperCase()}
                        </Text>
                        <Text style={[styles.documentDate, { color: colors.textSecondary }]}>
                          Issued: {new Date(doc.issue_date).toLocaleDateString()}
                          {doc.expiry_date && ` • Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                        </Text>
                        <Text style={[styles.documentStatus, { color: colors.textSecondary }]}>
                          Status: {doc.verified ? 'Verified' : 'Pending Verification'}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
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
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 12,
  },
  noDocumentsText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});