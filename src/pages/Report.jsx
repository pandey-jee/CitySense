import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue, ISSUE_CATEGORIES } from '../services/database';
import { uploadImageToCloudinaryFast } from '../services/cloudinaryOptimized';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

import { performanceMonitor, measureAsync } from '../utils/performance';

const Report = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 1,
    location: '',
    latitude: '',
    longitude: ''
  });
  const [imageURL, setImageURL] = useState(null);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: 'Please select a valid image file (JPEG, PNG, or WebP)'
      }));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        image: 'Image size should be less than 5MB'
      }));
      return;
    }

    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, image: null }));
      
      // Show preview
      setImage(URL.createObjectURL(file));
      
      // Upload to Cloudinary
      const result = await uploadImageToCloudinaryFast(file);
      setImageURL(result.optimizedUrl);
      
      console.log('✅ Image uploaded successfully:', result);
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      setErrors(prev => ({
        ...prev,
        image: 'Failed to upload image. Please try again.'
      }));
      setImage(null);
      setImageURL(null);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({
            ...prev,
            location: 'Unable to get current location'
          }));
          setLoading(false);
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        location: 'Geolocation is not supported by this browser'
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.coordinates = 'Please provide coordinates or use current location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Submit triggered - Current user:', user);
    
    if (!user) {
      console.log('❌ No user found - redirecting to login');
      setErrors({ auth: 'Please log in to report an issue' });
      return;
    }

    console.log('✅ User found:', { uid: user.uid, email: user.email, displayName: user.displayName });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Use performance monitoring for the entire submission process
      const result = await measureAsync('Issue Submission', async () => {
        const issueData = {
          ...formData,
          userId: user.uid,  // ✅ CRITICAL: Link issue to user account
          userEmail: user.email,  // User email for reference
          userName: user.displayName || user.email.split('@')[0], // User name for display
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          severity: parseInt(formData.severity),
          imageURL, // Use the fast-uploaded image URL
          status: 'Open',
          upvotes: 0,
          downvotes: 0,
          votes: [], // Track who voted and their vote type
          comments: [], // Initialize comments array
          viewCount: 0, // Track how many people viewed this issue
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        console.log('📋 Complete issue data being saved:', issueData);

        // Monitor database write
        const issueId = await measureAsync('Database Write', () => createIssue(issueData));
        
        console.log('🎉 Issue created with ID:', issueId, 'for user:', user.uid);
        
        return issueId;
      });

      console.log('✅ Issue created successfully:', result);
      alert('Issue reported successfully!');
      navigate('/');
      
    } catch (error) {
      console.error('❌ Error creating issue:', error);
      setErrors({ submit: `Failed to create issue: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h1 className="text-3xl font-bold flex items-center">
            <span className="mr-3 text-4xl">🚨</span>
            Report an Issue
          </h1>
          <p className="text-blue-100 mt-2 text-lg">
            Help improve your community by reporting urban issues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errors.auth && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-slide-down">
              <p className="text-red-700 font-medium">{errors.auth}</p>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-slide-down">
              <p className="text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Detailed description of the issue (minimum 20 characters)"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📁 Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                  errors.category ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {ISSUE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚡ Severity *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-300 bg-white"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Minor</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📍 Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.location ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Address or landmark"
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.location}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Latitude *
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.coordinates ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="e.g., 28.6139"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Longitude *
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.coordinates ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="e.g., 77.2090"
              />
            </div>
          </div>

          {errors.coordinates && (
            <p className="text-red-600 text-sm flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.coordinates}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center"
            >
              <span className="mr-2">📍</span>
              Use Current Location
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📷 Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.image ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {errors.image && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.image}
              </p>
            )}
            {image && (
              <div className="mt-4">
                <img
                  src={image}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl shadow-lg border-4 border-white"
                />
              </div>
            )}
            {loading && (
              <div className="mt-3 flex items-center space-x-3 bg-blue-50 p-3 rounded-xl">
                <div className="w-5 h-5">
                  <LoadingSpinner />
                </div>
                <p className="text-sm text-blue-700 font-medium">Uploading image...</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl font-medium"
            >
              {loading ? 'Submitting...' : '🚀 Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;
