// Debug utility for testing user issue creation and retrieval
import { addDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

// Test function to manually create and retrieve user issues
export const testUserIssueFlow = async (userId) => {
  try {
    console.log('🧪 Testing user issue flow for userId:', userId);
    
    // Step 1: Create a test issue
    const testIssue = {
      userId: userId,
      title: 'Test Issue',
      description: 'This is a test issue to verify user linking',
      category: 'Other',
      severity: 1,
      location: 'Test Location',
      latitude: 0,
      longitude: 0,
      status: 'Open',
      upvotes: 0,
      upvotedBy: [],
      timestamp: new Date(),
      resolvedAt: null,
      resolvedBy: null
    };
    
    console.log('📝 Creating test issue:', testIssue);
    const docRef = await addDoc(collection(db, 'issues'), testIssue);
    console.log('✅ Test issue created with ID:', docRef.id);
    
    // Step 2: Query for user's issues
    console.log('🔍 Querying for user issues...');
    const q = query(
      collection(db, 'issues'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Query completed. Found', querySnapshot.size, 'issues');
    
    const issues = [];
    querySnapshot.forEach((doc) => {
      const issueData = {
        id: doc.id,
        ...doc.data()
      };
      console.log('📋 Issue found:', issueData);
      issues.push(issueData);
    });
    
    return {
      success: true,
      createdIssueId: docRef.id,
      retrievedIssues: issues,
      totalFound: issues.length
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to check if user is properly authenticated
export const checkUserAuth = () => {
  const user = JSON.parse(localStorage.getItem('user')) || null;
  console.log('👤 User from localStorage:', user);
  return user;
};

// Function to test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    const testQuery = query(collection(db, 'issues'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(testQuery);
    console.log('🔥 Firebase connection test: SUCCESS');
    console.log('📊 Total issues in database:', snapshot.size);
    return true;
  } catch (error) {
    console.error('🔥 Firebase connection test: FAILED', error);
    return false;
  }
};

export default {
  testUserIssueFlow,
  checkUserAuth,
  testFirebaseConnection
};
