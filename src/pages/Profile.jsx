import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getIssuesByUser } from '../services/database';
import IssueCard from '../components/common/IssueCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { createTestIssue } from '../utils/testUtils';
import { testUserIssueFlow, testFirebaseConnection } from '../utils/debugUtils';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [userIssues, setUserIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || ''
      });
      fetchUserIssues();
    }
  }, [user]);

  const fetchUserIssues = async () => {
    try {
      if (!user || !user.uid) {
        console.log('❌ No user or user.uid found');
        console.log('🔍 User object:', user);
        return;
      }
      
      console.log('🚀 Starting profile issue fetch...');
      console.log('👤 Fetching issues for user:', user.uid);
      console.log('👤 User object details:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      setLoading(true);
      const issues = await getIssuesByUser(user.uid);
      console.log('📋 Found user issues:', issues);
      console.log('📊 Total issues found:', issues.length);
      
      setUserIssues(issues);
    } catch (error) {
      console.error('❌ Error fetching user issues:', error);
      console.error('❌ Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to test the full flow
  const runDebugTest = async () => {
    console.log('🧪 Running debug test...');
    
    // Test Firebase connection
    await testFirebaseConnection();
    
    // Test user issue flow
    if (user?.uid) {
      const result = await testUserIssueFlow(user.uid);
      console.log('🧪 Debug test result:', result);
      
      // Refresh the user issues after test
      if (result.success) {
        await fetchUserIssues();
      }
    }
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    
    try {
      await updateProfile(formData);
      setErrors({ success: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ auth: 'Failed to update profile. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      case 4:
        return 'bg-red-100 text-red-800';
      case 5:
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-800">Authentication Required</h2>
          <p className="text-red-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account and view your reported issues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-primary-600 text-white">
              <h2 className="text-xl font-bold">Account Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-600">{errors.success}</p>
                </div>
              )}

              {errors.auth && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{errors.auth}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.displayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your display name"
                />
                {errors.displayName && (
                  <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={user.uid}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.isAdmin ? 'Administrator' : 'User'}
                </span>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Issues</span>
                <span className="font-semibold text-primary-600">{userIssues.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Open Issues</span>
                <span className="font-semibold text-red-600">
                  {userIssues.filter(issue => issue.status === 'Open').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-yellow-600">
                  {userIssues.filter(issue => issue.status === 'In Progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved</span>
                <span className="font-semibold text-green-600">
                  {userIssues.filter(issue => issue.status === 'Resolved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Upvotes</span>
                <span className="font-semibold text-blue-600">
                  {userIssues.reduce((total, issue) => total + (issue.upvotes || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Issues */}
      <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Your Reported Issues</h2>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                console.log('🔄 Refreshing user issues...');
                await fetchUserIssues();
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={async () => {
                console.log('🧪 Creating test issue...');
                await createTestIssue(user);
                console.log('✅ Test issue created, refreshing...');
                await fetchUserIssues();
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              🧪 Test Issue
            </button>
            <button
              onClick={async () => {
                console.log('🔍 === COMPREHENSIVE DEBUG ===');
                console.log('👤 Current user object:', user);
                console.log('� User UID:', user?.uid);
                console.log('👤 User email:', user?.email);
                console.log('📊 Current userIssues state:', userIssues);
                console.log('📊 UserIssues length:', userIssues.length);
                
                // Test database connection
                await testFirebaseConnection();
                
                // Test user issue flow
                await testUserIssueFlow(user?.uid);
                
                console.log('🔍 === DEBUG COMPLETE ===');
              }}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
            >
              🔍 Full Debug
            </button>
          </div>
        </div>

        <div className="p-6">
          {userIssues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven't reported any issues yet.</p>
              <a
                href="/report"
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                Report Your First Issue
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {userIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdate={fetchUserIssues}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
