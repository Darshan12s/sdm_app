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
      'files'
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

export const createRLSPolicyGuide = () => {
  return {
    message: 'RLS Policy Creation Guide for user_profile_pictures bucket',
    link: 'https://supabase.com/dashboard/project/gmualcoqyztvtsqhjlzb/storage/buckets/user_profile_pictures',
    policies: [
      `CREATE POLICY "Allow profile picture uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user_profile_pictures' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Allow profile picture reads" ON storage.objects FOR SELECT USING (bucket_id = 'user_profile_pictures' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Allow profile picture updates" ON storage.objects FOR UPDATE USING (bucket_id = 'user_profile_pictures' AND auth.role() = 'authenticated');`
    ],
    suggestion: 'Alternative Quick Fix: Disable RLS entirely for this bucket (Go to Policies tab and toggle "Enable Row Level Security" to OFF)'
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

export const uploadWithRestAPI = async (filePath: string, data: Blob | string, mimeType: string) => {
  try {
    // Get the Supabase URL and key from environment or configuration
    const supabaseUrl = 'https://gmualcoqyztvtsqhjlzb.supabase.co';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      throw new Error('Supabase anon key not found in environment variables');
    }

    // Create the upload URL (ensure clean URL construction)
    const cleanFilePath = filePath.replace(/^public\//, '');
    const uploadUrl = `${supabaseUrl}/storage/v1/object/public/user_profile_pictures/${cleanFilePath}`;

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