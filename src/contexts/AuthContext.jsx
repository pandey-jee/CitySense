import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChange, 
  getUserRole, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  updateUserProfile 
} from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('citizen');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        console.log('🔐 User logged in:', user);
        console.log('🔐 User UID:', user.uid);
        console.log('🔐 User email:', user.email);
        setUser(user);
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole('citizen');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const user = await signInWithEmail(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const user = await signUpWithEmail(email, password, displayName);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      await updateUserProfile(profileData);
      // Update local user state
      setUser(prev => ({
        ...prev,
        ...profileData
      }));
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
