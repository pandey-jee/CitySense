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

// Add new issue
export const addIssue = async (issueData, imageFile) => {
  try {
    let imageURL = null;
    
    // Upload image if provided
    if (imageFile) {
      const imageRef = ref(storage, `issues/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageURL = await getDownloadURL(snapshot.ref);
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
    
    const docRef = await addDoc(collection(db, 'issues'), issue);
    return docRef.id;
  } catch (error) {
    console.error('Error adding issue:', error);
    throw error;
  }
};

// Get all issues
export const getIssues = async (filters = {}) => {
  try {
    let q = collection(db, 'issues');
    
    // Apply filters
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
    
    // Apply limit if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
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
