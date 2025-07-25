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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-primary-600 text-white">
          <h1 className="text-2xl font-bold">Report an Issue</h1>
          <p className="text-primary-100 mt-1">
            Help improve your community by reporting urban issues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.auth && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.auth}</p>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Detailed description of the issue"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {ISSUE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Address or landmark"
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.coordinates ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 28.6139"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.coordinates ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 77.2090"
              />
            </div>
          </div>

          {errors.coordinates && (
            <p className="text-red-600 text-sm">{errors.coordinates}</p>
          )}

          <div>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              📍 Use Current Location
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.image ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.image && (
              <p className="text-red-600 text-sm mt-1">{errors.image}</p>
            )}
            {image && (
              <div className="mt-2">
                <img
                  src={image}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md shadow-sm"
                />
              </div>
            )}
            {loading && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-5 h-5">
                  <LoadingSpinner />
                </div>
                <p className="text-sm text-gray-500">Uploading image...</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;
