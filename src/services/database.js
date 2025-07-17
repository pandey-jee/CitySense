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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

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

// Add new issue with performance optimizations
export const addIssue = async (issueData, imageFile) => {
  try {
    console.log('🚀 Starting issue creation...');
    let imageURL = null;
    
    // Upload image if provided with compression
    if (imageFile) {
      console.log('📸 Compressing and uploading image...');
      
      // Compress image before upload
      const compressedFile = await compressImage(imageFile);
      
      const timestamp = Date.now();
      const imageRef = ref(storage, `issues/${timestamp}_${imageFile.name}`);
      
      // Upload with progress tracking
      const snapshot = await uploadBytes(imageRef, compressedFile);
      imageURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Image uploaded successfully');
    }

    const issue = {
      ...issueData,
      imageURL,
      status: ISSUE_STATUS.OPEN,
      upvotes: 0,
      upvotedBy: [],
      timestamp: Timestamp.now(),
      resolvedAt: null,
      resolvedBy: null
    };

    console.log('💾 Saving issue to database...');
    const docRef = await addDoc(collection(db, 'issues'), issue);
    
    console.log('✅ Issue created successfully:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error adding issue:', error);
    throw new Error(`Failed to create issue: ${error.message}`);
  }
};

// Image compression function for better performance
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Upload image to Firebase Storage with optimizations
export const uploadImage = async (imageFile) => {
  try {
    console.log('📸 Starting image upload...');
    
    // Compress image first
    const compressedFile = await compressImage(imageFile);
    
    const timestamp = Date.now();
    const imageRef = ref(storage, `issues/${timestamp}_${imageFile.name}`);
    
    // Upload compressed image
    const snapshot = await uploadBytes(imageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Image uploaded:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Create issue function (separate from addIssue)
export const createIssue = async (issueData) => {
  try {
    const issue = {
      ...issueData,
      status: ISSUE_STATUS.OPEN,
      upvotes: 0,
      upvotedBy: [],
      timestamp: Timestamp.now(),
      resolvedAt: null,
      resolvedBy: null
    };
    
    const docRef = await addDoc(collection(db, 'issues'), issue);
    return docRef.id;
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};

// Get all issues with performance optimizations
export const getIssues = async (filters = {}) => {
  try {
    console.log('🔍 Fetching issues with filters:', filters);
    
    let q = collection(db, 'issues');
    
    // Apply filters efficiently
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    
    // Order by timestamp (newest first)
    q = query(q, orderBy('timestamp', 'desc'));
    
    // Apply limit for better performance (default 50)
    const itemLimit = filters.limit || 50;
    q = query(q, limit(itemLimit));
    
    const querySnapshot = await getDocs(q);
    const issues = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      issues.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });
    
    return issues;
  } catch (error) {
    console.error('Error getting issues:', error);
    throw error;
  }
};

// Get issues by user
export const getIssuesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'issues'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const issues = [];
    
    querySnapshot.forEach((doc) => {
      issues.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });
    
    return issues;
  } catch (error) {
    console.error('Error getting user issues:', error);
    throw error;
  }
};

// Update issue
export const updateIssue = async (issueId, updates) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, updates);
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
};

// Delete issue
export const deleteIssue = async (issueId) => {
  try {
    await deleteDoc(doc(db, 'issues', issueId));
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
};

// Upvote issue
export const upvoteIssue = async (issueId, userId) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    const issueDoc = await getDoc(issueRef);
    
    if (!issueDoc.exists()) {
      throw new Error('Issue not found');
    }
    
    const issueData = issueDoc.data();
    const upvotedBy = issueData.upvotedBy || [];
    
    if (upvotedBy.includes(userId)) {
      // Remove upvote
      await updateDoc(issueRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(userId)
      });
      return false; // Upvote removed
    } else {
      // Add upvote
      await updateDoc(issueRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId)
      });
      return true; // Upvote added
    }
  } catch (error) {
    console.error('Error upvoting issue:', error);
    throw error;
  }
};

// Resolve issue (admin only)
export const resolveIssue = async (issueId, adminId) => {
  try {
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, {
      status: ISSUE_STATUS.RESOLVED,
      resolvedAt: Timestamp.now(),
      resolvedBy: adminId
    });
  } catch (error) {
    console.error('Error resolving issue:', error);
    throw error;
  }
};

// Listen to issues in real-time
export const listenToIssues = (callback, filters = {}) => {
  let q = collection(db, 'issues');
  
  // Apply filters
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  // Order by timestamp (newest first)
  q = query(q, orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const issues = [];
    snapshot.forEach((doc) => {
      issues.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });
    callback(issues);
  });
};

// Get issue statistics
export const getIssueStats = async () => {
  try {
    const issues = await getIssues();
    
    const stats = {
      total: issues.length,
      open: issues.filter(issue => issue.status === ISSUE_STATUS.OPEN).length,
      inProgress: issues.filter(issue => issue.status === ISSUE_STATUS.IN_PROGRESS).length,
      resolved: issues.filter(issue => issue.status === ISSUE_STATUS.RESOLVED).length,
      categories: {},
      severityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    // Count by category
    issues.forEach(issue => {
      stats.categories[issue.category] = (stats.categories[issue.category] || 0) + 1;
      stats.severityDistribution[issue.severity] += 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting issue stats:', error);
    throw error;
  }
};

// Get users (for admin dashboard)
export const getUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
