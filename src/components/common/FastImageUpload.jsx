import React, { useState } from 'react';
import { Upload, Timer, FileImage, Zap } from 'lucide-react';
import { uploadImageToCloudinary } from '../../services/cloudinaryOptimized';

const FastImageUpload = ({ onUploadComplete, folder = 'citysense/issues' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress({ stage: 'Starting upload...', progress: 0 });
    
    try {
      const startTime = Date.now();
      
      // Show compression stage
      setUploadProgress({ stage: 'Compressing image...', progress: 25 });
      
      // Upload with progress simulation
      const uploadPromise = uploadImageToCloudinary(file, folder);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          stage: 'Uploading to Cloudinary...',
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 500);
      
      const result = await uploadPromise;
      clearInterval(progressInterval);
      
      const totalTime = Date.now() - startTime;
      
      setUploadProgress({ stage: 'Upload complete!', progress: 100 });
      
      // Show upload statistics
      setUploadStats({
        originalSize: (file.size / 1024).toFixed(1) + 'KB',
        compressedSize: result.metadata.compressedSize ? 
          (result.metadata.compressedSize / 1024).toFixed(1) + 'KB' : 'No compression',
        uploadTime: totalTime + 'ms',
        compressionRatio: result.metadata.compressionRatio || '0%',
        url: result.url
      });
      
      // Call parent callback
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStats(null);
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ stage: 'Upload failed: ' + error.message, progress: 0 });
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Fast Image Upload
      </h3>
      
      {/* Upload Input */}
      <div className="mb-4">
        <label className="block w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            uploading 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">
              {uploading ? 'Uploading...' : 'Click to select image'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              PNG, JPG, WebP up to 10MB
            </p>
          </div>
        </label>
      </div>
      
      {/* Progress Indicator */}
      {uploadProgress && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{uploadProgress.stage}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {uploadProgress.progress}%
          </div>
        </div>
      )}
      
      {/* Upload Statistics */}
      {uploadStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Upload Statistics
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Original Size:</span>
              <span className="ml-2 font-medium">{uploadStats.originalSize}</span>
            </div>
            <div>
              <span className="text-gray-600">Compressed:</span>
              <span className="ml-2 font-medium">{uploadStats.compressedSize}</span>
            </div>
            <div>
              <span className="text-gray-600">Upload Time:</span>
              <span className="ml-2 font-medium">{uploadStats.uploadTime}</span>
            </div>
            <div>
              <span className="text-gray-600">Saved:</span>
              <span className="ml-2 font-medium text-green-600">{uploadStats.compressionRatio}</span>
            </div>
          </div>
          {uploadStats.url && (
            <div className="mt-2">
              <img 
                src={uploadStats.url} 
                alt="Uploaded"
                className="w-20 h-20 object-cover rounded border"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Tips */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>💡 Speed Tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Images are automatically compressed for faster uploads</li>
          <li>JPEG format uploads faster than PNG</li>
          <li>Smaller images (under 2MB) upload instantly</li>
          <li>Progressive JPEG enables faster page loading</li>
        </ul>
      </div>
    </div>
  );
};

export default FastImageUpload;
