// Optimized Firebase database operations for better performance
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
  Timestamp,
  writeBatch,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, connectStorageEmulator } from 'firebase/storage';
import { db, storage } from './firebase';

// Connection status
let isOnline = navigator.onLine;
window.addEventListener('online', () => { isOnline = true; });
window.addEventListener('offline', () => { isOnline = false; });

// Performance optimizations
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Helper function to check cache
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data;
  }
  return null;
};

// Helper function to set cache
const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Optimized image upload with compression
export const uploadImage = async (file, path = 'issues') => {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file);
    
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const imageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'originalName': file.name,
        'uploadedAt': new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(imageRef, compressedFile, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      size: snapshot.totalBytes
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

// Image compression function
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

// Optimized issue creation with batch operations
export const createIssue = async (issueData, imageFile) => {
  try {
    // Show loading state
    const loadingToast = showLoadingToast('Creating issue...');
    
    let imageData = null;
    
    // Upload image if provided
    if (imageFile) {
      updateLoadingToast(loadingToast, 'Uploading image...');
      imageData = await uploadImage(imageFile);
    }
    
    // Prepare issue document
    const issueDoc = {
      ...issueData,
      imageURL: imageData?.url || null,
      imagePath: imageData?.path || null,
      imageSize: imageData?.size || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'Open',
      upvotes: 0,
      downvotes: 0,
      comments: [],
      viewCount: 0
    };
    
    updateLoadingToast(loadingToast, 'Saving issue...');
    
    // Use batch write for better performance
    const batch = writeBatch(db);
    const issueRef = doc(collection(db, 'issues'));
    
    batch.set(issueRef, issueDoc);
    
    // Update user's issue count
    if (issueData.userId) {
      const userRef = doc(db, 'users', issueData.userId);
      batch.update(userRef, {
        issueCount: increment(1),
        lastActivity: Timestamp.now()
      });
    }
    
    await batch.commit();
    
    // Clear cache
    cache.clear();
    
    hideLoadingToast(loadingToast);
    
    return { id: issueRef.id, ...issueDoc };
    
  } catch (error) {
    console.error('Create issue failed:', error);
    throw new Error('Failed to create issue. Please check your connection and try again.');
  }
};

// Optimized issue fetching with caching
export const getIssues = async (filters = {}) => {
  try {
    const cacheKey = JSON.stringify(filters);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    let q = collection(db, 'issues');
    
    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    // Always order by creation date and limit results
    q = query(q, orderBy('createdAt', 'desc'), limit(filters.limit || 50));
    
    const snapshot = await getDocs(q);
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    setCachedData(cacheKey, issues);
    return issues;
    
  } catch (error) {
    console.error('Get issues failed:', error);
    throw new Error('Failed to fetch issues. Please try again.');
  }
};

// Optimized real-time updates with error handling
export const subscribeToIssues = (callback, filters = {}) => {
  try {
    let q = collection(db, 'issues');
    
    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(filters.limit || 20));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const issues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        callback(issues);
      },
      (error) => {
        console.error('Real-time subscription error:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
    
  } catch (error) {
    console.error('Subscribe to issues failed:', error);
    return () => {};
  }
};

// Loading toast helpers
const showLoadingToast = (message) => {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  toast.innerHTML = `
    <div class="flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  return toast;
};

const updateLoadingToast = (toast, message) => {
  if (toast && toast.querySelector('span')) {
    toast.querySelector('span').textContent = message;
  }
};

const hideLoadingToast = (toast) => {
  if (toast && toast.parentNode) {
    toast.parentNode.removeChild(toast);
  }
};

// Network status monitoring
export const monitorNetworkStatus = () => {
  if (!isOnline) {
    disableNetwork(db);
  } else {
    enableNetwork(db);
  }
};

// Initialize network monitoring
monitorNetworkStatus();

export default {
  uploadImage,
  createIssue,
  getIssues,
  subscribeToIssues,
  monitorNetworkStatus
};
