import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinaryOptimized';

// Issue categories
export const ISSUE_CATEGORIES = [
  'Pothole',
  'Broken Streetlight',
  'Garbage Dumping',
  'Waterlogging',
  'Broken Road',
  'Traffic Signal Issue',
  'Illegal Parking',
  'Noise Pollution',
  'Water Leakage',
  'Other'
];

// Issue status
export const ISSUE_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved'
};

// Add new issue with Cloudinary image upload
export const addIssue = async (issueData, imageFile) => {
  try {
    console.log('🚀 Starting issue creation with Cloudinary...');
    let imageData = null;
    
    // Upload image to Cloudinary if provided
    if (imageFile) {
      console.log('📸 Uploading image to Cloudinary...');
      
      try {
        const uploadResult = await uploadImageToCloudinary(imageFile, 'citysense/issues');
        
        imageData = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          thumbnailUrl: uploadResult.thumbnailUrl,
          transformedUrl: uploadResult.transformedUrl,
          metadata: uploadResult.metadata
        };
        
        console.log('✅ Image uploaded to Cloudinary successfully');
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }

    const issue = {
      ...issueData,
      imageURL: imageData?.url || null,
      imageData: imageData, // Store complete Cloudinary data
      status: ISSUE_STATUS.OPEN,
      upvotes: 0,
      upvotedBy: [],
      timestamp: Timestamp.now(),
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving issue to Firestore...');
    const docRef = await addDoc(collection(db, 'issues'), issue);
    
    console.log('✅ Issue created successfully:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error adding issue:', error);
    throw new Error(`Failed to create issue: ${error.message}`);
  }
};

// Update issue with optional new image
export const updateIssue = async (issueId, updateData, newImageFile = null) => {
  try {
    console.log('🔄 Updating issue:', issueId);
    
    const issueRef = doc(db, 'issues', issueId);
    let finalUpdateData = { ...updateData };
    
    // Handle new image upload
    if (newImageFile) {
      console.log('📸 Uploading new image to Cloudinary...');
      
      // Get current issue data to delete old image
      const currentIssue = await getDoc(issueRef);
      const currentData = currentIssue.data();
      
      try {
        // Upload new image
        const uploadResult = await uploadImageToCloudinary(newImageFile, 'citysense/issues');
        
        const newImageData = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          thumbnailUrl: uploadResult.thumbnailUrl,
          transformedUrl: uploadResult.transformedUrl,
          metadata: uploadResult.metadata
        };
        
        finalUpdateData.imageURL = newImageData.url;
        finalUpdateData.imageData = newImageData;
        
        console.log('✅ New image uploaded successfully');
        
        // Delete old image if it exists
        if (currentData?.imageData?.publicId) {
          console.log('🗑️ Deleting old image from Cloudinary...');
          try {
            await deleteImageFromCloudinary(currentData.imageData.publicId);
            console.log('✅ Old image deleted successfully');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete old image:', deleteError);
            // Don't fail the update if old image deletion fails
          }
        }
        
      } catch (uploadError) {
        console.error('❌ New image upload failed:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }
    
    // Add update timestamp
    finalUpdateData.updatedAt = new Date().toISOString();
    
    // If resolving the issue, add resolved timestamp
    if (finalUpdateData.status === ISSUE_STATUS.RESOLVED && !finalUpdateData.resolvedAt) {
      finalUpdateData.resolvedAt = new Date().toISOString();
    }
    
    await updateDoc(issueRef, finalUpdateData);
    console.log('✅ Issue updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating issue:', error);
    throw new Error(`Failed to update issue: ${error.message}`);
  }
};

// Delete issue and its Cloudinary image
export const deleteIssue = async (issueId) => {
  try {
    console.log('🗑️ Deleting issue:', issueId);
    
    const issueRef = doc(db, 'issues', issueId);
    
    // Get issue data to delete associated image
    const issueDoc = await getDoc(issueRef);
    if (!issueDoc.exists()) {
      throw new Error('Issue not found');
    }
    
    const issueData = issueDoc.data();
    
    // Delete image from Cloudinary if it exists
    if (issueData.imageData?.publicId) {
      console.log('🗑️ Deleting image from Cloudinary...');
      try {
        await deleteImageFromCloudinary(issueData.imageData.publicId);
        console.log('✅ Image deleted from Cloudinary');
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete image from Cloudinary:', deleteError);
        // Continue with issue deletion even if image deletion fails
      }
    }
    
    // Delete issue document
    await deleteDoc(issueRef);
    console.log('✅ Issue deleted successfully');
    
  } catch (error) {
    console.error('❌ Error deleting issue:', error);
    throw new Error(`Failed to delete issue: ${error.message}`);
  }
};

// Get all issues with enhanced image data
export const getIssues = async (filters = {}) => {
  try {
    console.log('📋 Fetching issues with filters:', filters);
    
    let q = collection(db, 'issues');
    
    // Apply filters
    if (filters.category && filters.category !== 'All') {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status && filters.status !== 'All') {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    
    // Apply sorting
    if (filters.sortBy) {
      const sortField = filters.sortBy === 'newest' ? 'timestamp' : 
                       filters.sortBy === 'oldest' ? 'timestamp' :
                       filters.sortBy === 'upvotes' ? 'upvotes' : 'timestamp';
      const sortDirection = filters.sortBy === 'oldest' ? 'asc' : 'desc';
      q = query(q, orderBy(sortField, sortDirection));
    } else {
      q = query(q, orderBy('timestamp', 'desc'));
    }
    
    // Apply limit
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const issues = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      issues.push({
        id: doc.id,
        ...data,
        // Ensure backwards compatibility
        imageURL: data.imageURL || data.imageData?.url || null,
        // Add enhanced image URLs if available
        thumbnailURL: data.imageData?.thumbnailUrl || data.imageURL,
        transformedURL: data.imageData?.transformedUrl || data.imageURL
      });
    });
    
    console.log(`✅ Retrieved ${issues.length} issues`);
    return issues;
    
  } catch (error) {
    console.error('❌ Error fetching issues:', error);
    throw new Error(`Failed to fetch issues: ${error.message}`);
  }
};

// Get single issue by ID
export const getIssueById = async (issueId) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    const issueDoc = await getDoc(issueRef);
    
    if (!issueDoc.exists()) {
      throw new Error('Issue not found');
    }
    
    const data = issueDoc.data();
    return {
      id: issueDoc.id,
      ...data,
      // Ensure backwards compatibility
      imageURL: data.imageURL || data.imageData?.url || null,
      // Add enhanced image URLs if available
      thumbnailURL: data.imageData?.thumbnailUrl || data.imageURL,
      transformedURL: data.imageData?.transformedUrl || data.imageURL
    };
    
  } catch (error) {
    console.error('❌ Error fetching issue:', error);
    throw new Error(`Failed to fetch issue: ${error.message}`);
  }
};

// Upvote issue
export const upvoteIssue = async (issueId, userId) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, {
      upvotes: increment(1),
      upvotedBy: arrayUnion(userId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Issue upvoted successfully');
  } catch (error) {
    console.error('❌ Error upvoting issue:', error);
    throw new Error(`Failed to upvote issue: ${error.message}`);
  }
};

// Remove upvote from issue
export const removeUpvote = async (issueId, userId) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, {
      upvotes: increment(-1),
      upvotedBy: arrayRemove(userId),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Upvote removed successfully');
  } catch (error) {
    console.error('❌ Error removing upvote:', error);
    throw new Error(`Failed to remove upvote: ${error.message}`);
  }
};

// Get users (for admin dashboard)
export const getUsers = async () => {
  try {
    console.log('👥 Fetching users...');
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Retrieved ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Subscribe to real-time updates
export const subscribeToIssues = (callback, filters = {}) => {
  try {
    let q = collection(db, 'issues');
    
    // Apply filters
    if (filters.category && filters.category !== 'All') {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status && filters.status !== 'All') {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Apply sorting
    q = query(q, orderBy('timestamp', 'desc'));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const issues = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        issues.push({
          id: doc.id,
          ...data,
          // Ensure backwards compatibility
          imageURL: data.imageURL || data.imageData?.url || null,
          // Add enhanced image URLs if available
          thumbnailURL: data.imageData?.thumbnailUrl || data.imageURL,
          transformedURL: data.imageData?.transformedUrl || data.imageURL
        });
      });
      callback(issues);
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Error setting up real-time subscription:', error);
    throw new Error(`Failed to subscribe to issues: ${error.message}`);
  }
};

// Batch operations for admin
export const batchUpdateIssues = async (issueIds, updateData) => {
  try {
    console.log(`🔄 Batch updating ${issueIds.length} issues...`);
    
    const updatePromises = issueIds.map(issueId => {
      const issueRef = doc(db, 'issues', issueId);
      return updateDoc(issueRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    });
    
    await Promise.all(updatePromises);
    console.log('✅ Batch update completed successfully');
    
  } catch (error) {
    console.error('❌ Error in batch update:', error);
    throw new Error(`Failed to batch update issues: ${error.message}`);
  }
};

export default {
  addIssue,
  updateIssue,
  deleteIssue,
  getIssues,
  getIssueById,
  upvoteIssue,
  removeUpvote,
  getUsers,
  subscribeToIssues,
  batchUpdateIssues,
  ISSUE_CATEGORIES,
  ISSUE_STATUS
};
