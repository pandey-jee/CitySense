// Test Cloudinary Configuration
// Run this in your browser console or create a test component

const testCloudinaryConfig = () => {
  console.log('🧪 Testing Cloudinary Configuration...');
  
  // Check environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  console.log('📋 Configuration Check:');
  console.log('Cloud Name:', cloudName);
  console.log('API Key:', apiKey);
  console.log('Upload Preset:', uploadPreset);
  
  if (!cloudName || !apiKey || !uploadPreset) {
    console.error('❌ Missing Cloudinary configuration!');
    return false;
  }
  
  console.log('✅ Cloudinary configuration looks good!');
  
  // Test URL generation
  const testImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fill/sample`;
  console.log('🖼️ Test image URL:', testImageUrl);
  
  return true;
};

// Test function for image upload
const testImageUpload = async (file) => {
  try {
    console.log('🚀 Testing image upload...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'citysense/test');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export { testCloudinaryConfig, testImageUpload };
