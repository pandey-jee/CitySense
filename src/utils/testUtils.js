// Test utility to manually create issues for testing
import { createIssue } from '../services/database';

export const createTestIssue = async (user) => {
  if (!user) {
    console.error('No user provided for test issue');
    return;
  }

  const testIssueData = {
    title: 'Test Issue - Broken Streetlight',
    description: 'This is a test issue to verify user profile functionality',
    category: 'Broken Streetlight',
    location: 'Test Location, Test City',
    latitude: 28.6139,
    longitude: 77.2090,
    severity: 3,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName || user.email.split('@')[0],
    status: 'Open',
    upvotes: 0,
    downvotes: 0,
    votes: [],
    comments: [],
    viewCount: 0,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  try {
    console.log('🧪 Creating test issue with data:', testIssueData);
    const issueId = await createIssue(testIssueData);
    console.log('✅ Test issue created with ID:', issueId);
    alert(`Test issue created successfully! ID: ${issueId}`);
    return issueId;
  } catch (error) {
    console.error('❌ Failed to create test issue:', error);
    alert(`Failed to create test issue: ${error.message}`);
  }
};

export default createTestIssue;
