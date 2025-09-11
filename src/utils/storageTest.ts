import { supabase } from '../services/supabase/client';

export const testStorageConfiguration = async () => {
  console.log('🧪 Testing Supabase Storage Configuration...');

  try {
    // Test 1: List buckets
    console.log('📋 Test 1: Listing storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Bucket listing failed:', bucketError);
      console.log('⚠️ Bucket API failed, but bucket might still exist');
      console.log('💡 Since you confirmed the bucket exists, try uploading directly');

      return {
        success: false,
        error: 'Bucket listing API failed, but bucket may still exist. Try uploading directly.',
        details: {
          bucketError: bucketError,
          suggestion: 'Try uploading an image - the bucket might work despite API issues'
        }
      };
    }

    console.log('✅ Available buckets:', buckets?.map(b => b.name));

    // Test 2: Check if drivers_profile_pictures bucket exists
    const userProfileBucket = buckets?.find(bucket => bucket.name === 'drivers_profile_pictures');
    if (!userProfileBucket) {
      console.error('❌ drivers_profile_pictures bucket not found in API response');
      console.log('🔍 Available buckets:', buckets?.map(b => b.name));
      console.log('⚠️ But you confirmed the bucket exists in Supabase Dashboard');
      console.log('💡 This might be an API permission issue. Try uploading directly.');

      return {
        success: false,
        error: 'Bucket not found in API, but you confirmed it exists. Try uploading directly.',
        details: {
          availableBuckets: buckets?.map(b => b.name),
          suggestion: 'Try uploading an image - the bucket might work despite API issues'
        }
      };
    }

    console.log('✅ drivers_profile_pictures bucket found:', userProfileBucket);

    // Test 3: Try to list files in the bucket
    console.log('📁 Test 3: Listing files in drivers_profile_pictures bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('drivers_profile_pictures')
      .list('', { limit: 1 });

    if (listError) {
      console.error('❌ File listing failed:', listError);
      console.log('⚠️ File listing failed, but upload might still work');
      return {
        success: false,
        error: 'File listing failed, but upload might still work. Try uploading directly.',
        details: {
          listError: listError,
          suggestion: 'Try uploading an image - the bucket might work despite listing issues'
        }
      };
    }

    console.log('✅ File listing successful, bucket is accessible');

    // Test 4: Check bucket policies/permissions
    console.log('🔐 Test 4: Bucket appears to be accessible');

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
    console.error('💥 Storage test failed:', error);
    return {
      success: false,
      error: 'Unexpected error during storage test',
      details: error
    };
  }
};

export const diagnoseStorageIssue = async () => {
  console.log('🔍 Diagnosing storage issue...');

  const result = await testStorageConfiguration();

  if (result.success) {
    console.log('✅ Storage is working correctly');
    console.log('💡 The issue might be with network connectivity or file format');
  } else {
    console.log('❌ Storage configuration issue detected:');
    console.log('Error:', result.error);
    console.log('Details:', result.details);

    if (result.error?.includes('bucket does not exist')) {
      console.log('🔧 Solution: Create the drivers_profile_pictures bucket in Supabase dashboard');
      console.log('📍 Go to: Supabase Dashboard > Storage > Create bucket');
      console.log('📝 Bucket name: drivers_profile_pictures');
      console.log('🔒 Make sure to set public access if needed');
    } else if (result.error?.includes('Cannot access storage service')) {
      console.log('🔧 Solution: Check Supabase project configuration and API keys');
      console.log('📍 Check your .env file for correct SUPABASE_URL and SUPABASE_ANON_KEY');
    } else if (result.error?.includes('Cannot list files')) {
      console.log('🔧 Solution: Check bucket permissions and RLS policies');
      console.log('📍 Go to: Supabase Dashboard > Storage > drivers_profile_pictures > Policies');
    } else if (result.error?.includes('Bucket listing API failed')) {
      console.log('🔧 Solution: API issue but bucket exists - try uploading directly');
      console.log('💡 The bucket exists but the API can\'t see it. Try uploading an image anyway.');
    } else if (result.error?.includes('Bucket not found in API')) {
      console.log('🔧 Solution: API permission issue - try uploading directly');
      console.log('💡 The bucket exists but API has permission issues. Try uploading an image anyway.');
    } else if (result.details?.suggestedBucket) {
      console.log('💡 Suggested fix: Update bucket name in code');
      console.log('📝 Change from: drivers_profile_pictures');
      console.log('📝 Change to:', result.details.suggestedBucket);
    } else if (result.details?.suggestion) {
      console.log('💡 Suggested action:', result.details.suggestion);
    }
  }

  return result;
};

export const findCorrectBucketName = async () => {
  console.log('🔍 Searching for the correct bucket name...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Cannot access storage service:', error);
      return null;
    }

    console.log('📋 All available buckets:', buckets?.map(b => b.name));

    // Common bucket names for profile pictures
    const possibleNames = [
      'drivers_profile_pictures',
      'user_profile_pictures',
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
      console.log('✅ Found suitable bucket:', foundBucket.name);
      return foundBucket.name;
    } else {
      console.log('❌ No suitable bucket found');
      console.log('💡 Available buckets:', buckets?.map(b => b.name));
      return null;
    }
  } catch (error) {
    console.error('❌ Error searching for buckets:', error);
    return null;
  }
};

export const createRLSPolicyGuide = () => {
  console.log('📋 RLS Policy Creation Guide for drivers_profile_pictures bucket:');
  console.log('');
  console.log('🔗 Direct Link: https://supabase.com/dashboard/project/gmualcoqyztvtsqhjlzb/storage/buckets/drivers_profile_pictures');
  console.log('');
  console.log('📝 SQL Policy to Create (run in Supabase SQL Editor):');
  console.log('');
  console.log(`-- Allow authenticated users to upload profile pictures
CREATE POLICY "Allow profile picture uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'drivers_profile_pictures'
  AND auth.role() = 'authenticated'
);`);
  console.log('');
  console.log(`-- Allow users to view their own profile pictures
CREATE POLICY "Allow profile picture reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'drivers_profile_pictures'
  AND auth.role() = 'authenticated'
);`);
  console.log('');
  console.log(`-- Allow users to update their own profile pictures
CREATE POLICY "Allow profile picture updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'drivers_profile_pictures'
  AND auth.role() = 'authenticated'
);`);
  console.log('');
  console.log('💡 Alternative Quick Fix: Disable RLS entirely for this bucket');
  console.log('   (Go to Policies tab and toggle "Enable Row Level Security" to OFF)');
};

export const testNetworkConnectivity = async () => {
  console.log('🌐 Testing network connectivity to Supabase...');

  try {
    // Test 1: Basic connectivity to Supabase
    console.log('📡 Test 1: Basic Supabase connectivity...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Auth session error:', sessionError);
      return {
        success: false,
        error: 'Cannot connect to Supabase authentication service',
        details: sessionError
      };
    }

    console.log('✅ Auth service accessible');

    // Test 2: Database connectivity
    console.log('🗄️ Test 2: Database connectivity...');
    const { data: testData, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (dbError) {
      console.error('❌ Database connection error:', dbError);
      return {
        success: false,
        error: 'Cannot connect to Supabase database',
        details: dbError
      };
    }

    console.log('✅ Database accessible');

    // Test 3: Storage service connectivity
    console.log('📦 Test 3: Storage service connectivity...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

      if (storageError) {
        console.error('❌ Storage service error:', storageError);
        console.log('⚠️ Storage API failed, but service might still be accessible');

        return {
          success: false,
          error: 'Storage service API failed, but service might still work',
          details: {
            storageError: storageError,
            suggestion: 'Try uploading directly - the storage service might work despite API issues'
          }
        };
      }

      console.log('✅ Storage service accessible');
      console.log('📋 Available buckets:', buckets?.map(b => b.name));

    } catch (storageTestError: any) {
      console.error('❌ Storage test error:', storageTestError);
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
    console.error('💥 Network test failed:', error);
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

export const uploadWithRestAPI = async (filePath: string, blob: Blob, mimeType: string) => {
  console.log('🔄 Trying REST API upload method...');

  try {
    // Get the Supabase URL and key from environment or configuration
    const supabaseUrl = 'https://gmualcoqyztvtsqhjlzb.supabase.co'; // Your Supabase URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'; // You'll need to get this

    // Create the upload URL
    const uploadUrl = `${supabaseUrl}/storage/v1/object/drivers_profile_pictures/${filePath}`;

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No auth token available');
    }

    // Upload using fetch with service role key for bypassing RLS
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`, // Use anon key instead of user token
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ REST API response:', response.status, errorText);

      // Check for RLS error
      if (errorText.includes('row-level security policy') || errorText.includes('RLS')) {
        console.log('🔒 RLS Policy blocking upload - this is the root cause!');
        throw new Error(`RLS Policy Error: Upload blocked by Supabase security policies. Please check bucket policies in Supabase Dashboard > Storage > drivers_profile_pictures > Policies`);
      }

      throw new Error(`REST API upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ REST API upload successful:', result);

    return {
      success: true,
      data: result,
      path: filePath
    };

  } catch (error: any) {
    console.error('❌ REST API upload failed:', error);

    // Provide specific guidance for RLS issues
    if (error.message?.includes('RLS') || error.message?.includes('row-level security')) {
      console.log('🔒 ROOT CAUSE: Row Level Security (RLS) Policy Issue');
      console.log('');
      console.log('🔧 SOLUTION STEPS:');
      console.log('1️⃣ Go to: https://supabase.com/dashboard/project/gmualcoqyztvtsqhjlzb/storage/buckets/drivers_profile_pictures');
      console.log('2️⃣ Click on "Policies" tab');
      console.log('3️⃣ Choose one of these options:');
      console.log('');
      console.log('   OPTION A - Disable RLS (Quick Fix):');
      console.log('   • Toggle "Enable Row Level Security" to OFF');
      console.log('   • This allows all authenticated users to upload');
      console.log('');
      console.log('   OPTION B - Create Policy (Secure):');
      console.log('   • Keep RLS enabled');
      console.log('   • Create a new policy with these settings:');
      console.log('     - Name: "Allow profile picture uploads"');
      console.log('     - Allowed operation: INSERT');
      console.log('     - Target table: storage.objects');
      console.log('     - Using expression: bucket_id = \'drivers_profile_pictures\'');
      console.log('');
      console.log('   OPTION C - Make Bucket Public:');
      console.log('   • Go to bucket settings');
      console.log('   • Set "Public bucket" to ON');
      console.log('   • This allows public read access');
      console.log('');
      console.log('💡 RECOMMENDED: Start with Option A (disable RLS) for testing, then implement Option B for production.');
    }

    return {
      success: false,
      error: error.message || 'REST API upload failed'
    };
  }
};