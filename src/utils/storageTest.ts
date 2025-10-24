import { supabase } from '../services/supabase/client';

export const testStorageConfiguration = async () => {
  try {
    // Test 1: List buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      return {
        success: false,
        error: 'Bucket listing API failed, but bucket may still exist. Try uploading directly.',
        details: {
          bucketError: bucketError,
          suggestion: 'Try uploading an image - the bucket might work despite API issues'
        }
      };
    }

    // Test 2: Check if user_profile_pictures bucket exists
    const userProfileBucket = buckets?.find(bucket => bucket.name === 'user_profile_pictures');
    if (!userProfileBucket) {
      return {
        success: false,
        error: 'Bucket not found in API, but you confirmed it exists. Try uploading directly.',
        details: {
          availableBuckets: buckets?.map(b => b.name),
          suggestion: 'Try uploading an image - the bucket might work despite API issues'
        }
      };
    }

    // Test 3: Try to list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('user_profile_pictures')
      .list('', { limit: 1 });

    if (listError) {
      return {
        success: false,
        error: 'File listing failed, but upload might still work. Try uploading directly.',
        details: {
          listError: listError,
          suggestion: 'Try uploading an image - the bucket might work despite listing issues'
        }
      };
    }

    return {
      success: true,
      message: 'Storage configuration is working correctly',
      details: {
        buckets: buckets?.length,
        userProfileBucket: userProfileBucket.name,
        filesAccessible: true
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: 'Unexpected error during storage test',
      details: error
    };
  }
};

export const diagnoseStorageIssue = async () => {
  const result = await testStorageConfiguration();

  if (result.success) {
    return result;
  } else {
    return result;
  }
};

export const findCorrectBucketName = async () => {
   try {
     const { data: buckets, error } = await supabase.storage.listBuckets();

     if (error) {
       return null;
     }

     // Common bucket names for profile pictures
     const possibleNames = [
       'user_profile_pictures',
       'drivers_profile_pictures',
       'profile_pictures',
       'avatars',
       'images',
       'uploads',
       'media',
       'files',
       'drivers-kyc-documents'
     ];

     const foundBucket = buckets?.find(bucket =>
       possibleNames.includes(bucket.name)
     );

     if (foundBucket) {
       return foundBucket.name;
     } else {
       return null;
     }
   } catch (error) {
     return null;
   }
};

export const checkDriversKYCBucket = async () => {
  try {
    console.log('🔍 checkDriversKYCBucket: Listing all available buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ checkDriversKYCBucket: Cannot list buckets:', error);
      return {
        success: false,
        error: 'Cannot access storage service',
        details: error
      };
    }

    console.log('✅ checkDriversKYCBucket: Available buckets:', buckets?.map(b => b.name) || []);

    const kycBucket = buckets?.find(bucket => bucket.name === 'drivers-kyc-documents');
    console.log('🔍 checkDriversKYCBucket: Looking for drivers-kyc-documents bucket:', !!kycBucket);

    if (!kycBucket) {
      // Find alternative buckets that might work
      const alternativeBuckets = buckets?.filter(bucket =>
        bucket.name.includes('profile') ||
        bucket.name.includes('document') ||
        bucket.name.includes('upload') ||
        bucket.name.includes('file')
      ) || [];

      console.log('🔍 checkDriversKYCBucket: Found alternative buckets:', alternativeBuckets.map(b => b.name));

      return {
        success: false,
        error: 'drivers-kyc-documents bucket not found',
        solution: createDriversKYCBucketGuide(),
        availableBuckets: buckets?.map(b => b.name) || [],
        alternativeBuckets: alternativeBuckets.map(b => b.name),
        canUseAlternative: alternativeBuckets.length > 0
      };
    }

    // Test if we can list files in the bucket
    console.log('🔍 checkDriversKYCBucket: Testing bucket accessibility...');
    const { data: files, error: listError } = await supabase.storage
      .from('drivers-kyc-documents')
      .list('', { limit: 1 });

    if (listError) {
      console.error('❌ checkDriversKYCBucket: Cannot access bucket:', listError);
      return {
        success: false,
        error: 'Cannot access drivers-kyc-documents bucket',
        details: listError,
        solution: 'Check bucket permissions and RLS policies'
      };
    }

    console.log('✅ checkDriversKYCBucket: Bucket is accessible, files:', files?.length || 0);
    return {
      success: true,
      message: 'drivers-kyc-documents bucket is accessible',
      bucket: kycBucket
    };

  } catch (error: any) {
    console.error('❌ checkDriversKYCBucket: Unexpected error:', error);
    return {
      success: false,
      error: 'Error checking drivers-kyc-documents bucket',
      details: error
    };
  }
};

export const createDriversKYCBucketGuide = () => {
  return {
    message: 'Create drivers-kyc-documents bucket in Supabase Dashboard',
    steps: [
      '1. Go to your Supabase Dashboard',
      '2. Navigate to Storage',
      '3. Click "New Bucket"',
      '4. Enter bucket name: "drivers-kyc-documents"',
      '5. Set as PRIVATE bucket',
      '6. Click "Create Bucket"'
    ],
    policies: [
      `CREATE POLICY "Allow driver document uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drivers-kyc-documents' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Allow driver document reads" ON storage.objects FOR SELECT USING (bucket_id = 'drivers-kyc-documents' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Allow driver document updates" ON storage.objects FOR UPDATE USING (bucket_id = 'drivers-kyc-documents' AND auth.role() = 'authenticated');`
    ],
    alternative: 'Alternative: Disable RLS entirely for this bucket (Go to Policies tab and toggle "Enable Row Level Security" to OFF)',
    dashboardLink: 'https://supabase.com/dashboard/project/gmualcoqyztvtsqhjlzb/storage/buckets'
  };
};

export const testNetworkConnectivity = async () => {
  try {
    // Test 1: Basic connectivity to Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        error: 'Cannot connect to Supabase authentication service',
        details: sessionError
      };
    }

    // Test 2: Database connectivity
    const { data: testData, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (dbError) {
      return {
        success: false,
        error: 'Cannot connect to Supabase database',
        details: dbError
      };
    }

    // Test 3: Storage service connectivity
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

      if (storageError) {
        return {
          success: false,
          error: 'Storage service API failed, but service might still work',
          details: {
            storageError: storageError,
            suggestion: 'Try uploading directly - the storage service might work despite API issues'
          }
        };
      }

    } catch (storageTestError: any) {
      return {
        success: false,
        error: 'Storage service test failed',
        details: storageTestError
      };
    }

    return {
      success: true,
      message: 'All Supabase services are accessible',
      details: {
        auth: true,
        database: true,
        storage: true
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: 'Network connectivity test failed',
      details: {
        error: error,
        suggestion: 'Check your internet connection and Supabase configuration'
      }
    };
  }
};

export const uploadWithRestAPI = async (filePath: string, data: Blob | string, mimeType: string, bucketName: string = 'user_profile_pictures') => {
   try {
     // Get the Supabase URL and key from environment or configuration
     const supabaseUrl = 'https://gmualcoqyztvtsqhjlzb.supabase.co';
     const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

     if (!supabaseAnonKey) {
       throw new Error('Supabase anon key not found in environment variables');
     }

     // Create the upload URL (ensure clean URL construction)
     const cleanFilePath = filePath.replace(/^public\//, '');
     const uploadUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanFilePath}`;

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No auth token available');
    }

    // Prepare body data - handle both Blob and base64 string
    let bodyData: Blob | string = data;
    const headers: any = {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'x-upsert': 'true'
    };

    if (typeof data === 'string') {
      // If data is base64 string, set appropriate content type
      headers['Content-Type'] = 'image/jpeg';
      bodyData = data;
    } else {
      // If data is Blob, let fetch set the content type
      headers['Content-Type'] = mimeType;
      bodyData = data;
    }

    // Upload using fetch
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: bodyData
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check for various error types
      if (errorText.includes('row-level security policy') || errorText.includes('RLS')) {
        throw new Error(`RLS Policy Error: Upload blocked by Supabase security policies. Please check bucket policies in Supabase Dashboard > Storage > user_profile_pictures > Policies`);
      }

      if (errorText.includes('Invalid Compact JWS') || errorText.includes('invalid_jwt')) {
        // Retry with user access token instead of anon key
        const userResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': typeof data === 'string' ? 'image/jpeg' : mimeType,
            'x-upsert': 'true'
          },
          body: bodyData
        });

        if (!userResponse.ok) {
          const userErrorText = await userResponse.text();
          throw new Error(`Authentication failed. Please log out and log back in. Error: ${userErrorText}`);
        }

        const userResult = await userResponse.json();
        return {
          success: true,
          data: userResult,
          path: filePath
        };
      }

      throw new Error(`REST API upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
      path: filePath
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'REST API upload failed'
    };
  }
};