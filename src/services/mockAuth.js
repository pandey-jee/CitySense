// Temporary mock authentication for development
// This bypasses Firebase authentication for testing purposes

export const mockAuth = {
  currentUser: null,
  users: new Map(),
  
  async signUpWithEmail(email, password) {
    // Mock user creation
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    
    this.users.set(email, { ...mockUser, password });
    this.currentUser = mockUser;
    
    return { user: mockUser };
  },
  
  async signInWithEmail(email, password) {
    // Mock user login
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.password !== password) {
      throw new Error('Invalid password');
    }
    
    this.currentUser = user;
    return { user };
  },
  
  async signOutUser() {
    this.currentUser = null;
  },
  
  async updateUserProfile(updates) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
    }
  },
  
  async getUserRole() {
    return 'user'; // Default role
  }
};

export default mockAuth;
