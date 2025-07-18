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
 * Compress image on client-side before upload (FASTER UPLOADS)
 * @param {File} file - Original file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
const compressImageFast = (file, options = {}) => {
  return new Promise((resolve) => {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: format === 'jpeg' ? 'image/jpeg' : 'image/webp',
            lastModified: Date.now()
          });
          
          console.log(`🗜️ Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
          resolve(compressedFile);
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/webp',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * OPTIMIZED: Fast image upload to Cloudinary
 * @param {File} file - Image file to upload
 * @param {string} folder - Cloudinary folder
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadImageToCloudinaryFast = async (file, folder = 'citysense/issues', options = {}) => {
  try {
    console.log('🚀 Starting FAST Cloudinary upload...');
    const startTime = Date.now();
    
    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Check file size (compress if > 2MB)
    const maxSizeBeforeCompression = 2 * 1024 * 1024; // 2MB
    let uploadFile = file;
    
    if (file.size > maxSizeBeforeCompression) {
      console.log('🗜️ File large, compressing before upload...');
      uploadFile = await compressImageFast(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
        format: 'jpeg' // JPEG compresses better than PNG
      });
    }

    // Check final file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(uploadFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Create optimized FormData
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    
    // Optimized transformations for faster processing
    const transformation = {
      quality: 'auto:fast', // Faster processing
      fetch_format: 'auto',
      flags: 'progressive', // Progressive JPEG for faster loading
      ...options.transformation
    };
    
    formData.append('transformation', JSON.stringify(transformation));
    formData.append('tags', 'citysense,issue-report,optimized');
    
    // OPTIMIZED: Upload with timeout and progress tracking
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    
    console.log('📤 Uploading to Cloudinary (Fast Mode)...');
    
    const response = await Promise.race([
      fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // Add headers for better performance
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      }),
      // 30 second timeout
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      )
    ]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const uploadTime = Date.now() - startTime;
    
    console.log(`✅ Fast upload completed in ${uploadTime}ms:`, result.public_id);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      originalUrl: result.secure_url,
      optimizedUrl: generateFastUrl(result.public_id),
      thumbnailUrl: generateThumbnailUrl(result.public_id),
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        uploadTime: uploadTime,
        originalSize: file.size,
        compressedSize: uploadFile.size,
        compressionRatio: ((file.size - uploadFile.size) / file.size * 100).toFixed(1) + '%'
      }
    };

  } catch (error) {
    console.error('❌ Fast upload failed:', error);
    throw new Error(`Fast upload failed: ${error.message}`);
  }
};

/**
 * Generate fast-loading optimized URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export const generateFastUrl = (publicId, options = {}) => {
  try {
    const image = cloudinary.image(publicId);
    
    // Fast loading optimizations
    image
      .delivery(quality('auto:fast'))
      .delivery(format('auto'))
      .resize(auto().width(options.width || 800));
    
    return image.toURL();
  } catch (error) {
    console.error('Error generating fast URL:', error);
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/q_auto:fast,f_auto,w_800/${publicId}`;
  }
};

/**
 * Generate thumbnail URL (Fast)
 * @param {string} publicId - Cloudinary public ID
 * @param {number} size - Thumbnail size
 * @returns {string} Thumbnail URL
 */
export const generateThumbnailUrl = (publicId, size = 150) => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${size},h_${size},c_fill,q_auto:fast,f_auto/${publicId}`;
};

/**
 * BATCH UPLOAD: Upload multiple images efficiently
 * @param {Array<File>} files - Array of image files
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array>} Upload results
 */
export const batchUploadImages = async (files, folder = 'citysense/issues') => {
  try {
    console.log(`🚀 Starting batch upload of ${files.length} images...`);
    
    // Limit concurrent uploads to prevent overwhelming
    const BATCH_SIZE = 3;
    const results = [];
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(file => 
        uploadImageToCloudinaryFast(file, folder)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Batch upload completed: ${results.filter(r => r.status === 'fulfilled').length}/${files.length}`);
    
    return results;
  } catch (error) {
    console.error('❌ Batch upload failed:', error);
    throw error;
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

// Export optimized functions

export {
  uploadImageToCloudinaryFast as uploadImageToCloudinary,
  compressImageFast,
  CLOUDINARY_CONFIG as cloudinaryConfig
};

export default cloudinary;
