import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';

// Initialize Cloudinary instance
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'citysense_images'
};

/**
 * Upload image to Cloudinary with optimization
 * @param {File} file - Image file to upload
 * @param {string} folder - Cloudinary folder (default: 'citysense/issues')
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadImageToCloudinary = async (file, folder = 'citysense/issues', options = {}) => {
  try {
    console.log('🚀 Starting Cloudinary upload...');
    
    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    
    // Add timestamp and unique identifier
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    formData.append('public_id', `${timestamp}_${uniqueId}`);
    
    // Add transformation options
    const transformation = {
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 1200,
      height: 800,
      crop: 'limit',
      ...options.transformation
    };
    
    formData.append('transformation', JSON.stringify(transformation));
    
    // Add tags for better organization
    formData.append('tags', 'citysense,issue-report,user-upload');
    
    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    
    console.log('📤 Uploading to Cloudinary...');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    console.log('✅ Cloudinary upload successful:', result.public_id);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      originalUrl: result.secure_url,
      transformedUrl: generateOptimizedUrl(result.public_id),
      thumbnailUrl: generateThumbnailUrl(result.public_id),
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        folder: result.folder,
        tags: result.tags
      }
    };

  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const generateOptimizedUrl = (publicId, options = {}) => {
  try {
    const image = cloudinary.image(publicId);
    
    // Apply default optimizations
    image
      .resize(auto().width(options.width || 800).gravity(autoGravity()))
      .delivery(format('auto'))
      .delivery(quality('auto:good'));
    
    // Apply custom transformations if provided
    if (options.customTransformations) {
      options.customTransformations.forEach(transformation => {
        image.addTransformation(transformation);
      });
    }
    
    return image.toURL();
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${publicId}`;
  }
};

/**
 * Generate thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} size - Thumbnail size (default: 150)
 * @returns {string} Thumbnail URL
 */
export const generateThumbnailUrl = (publicId, size = 150) => {
  try {
    const image = cloudinary.image(publicId);
    
    image
      .resize(auto().width(size).height(size).gravity(autoGravity()))
      .delivery(format('auto'))
      .delivery(quality('auto:good'));
    
    return image.toURL();
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${size},h_${size},c_fill/${publicId}`;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    
    // This requires server-side implementation due to API secret requirement
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cloudinary/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId })
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    const result = await response.json();
    console.log('✅ Image deleted successfully');
    
    return result.success;
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return false;
  }
};

/**
 * Get image metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Image metadata
 */
export const getImageMetadata = async (publicId) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cloudinary/metadata/${publicId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching image metadata:', error);
    return null;
  }
};

/**
 * Compress image before upload (client-side)
 * @param {File} file - Original file
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<File>} Compressed file
 */
export const compressImageBeforeUpload = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw compressed image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Export configuration for use in other components
export const cloudinaryConfig = CLOUDINARY_CONFIG;
export default cloudinary;
