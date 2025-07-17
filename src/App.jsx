import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChange } from './services/auth';
import { getUserRole } from './services/auth';

// Components
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import PerformanceDiagnostic from './components/common/PerformanceDiagnostic';

// Pages
import Home from './pages/Home';
import Report from './pages/Report';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('citizen');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar user={user} userRole={userRole} />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/report" 
                element={user ? <Report /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to="/" />} 
              />
              <Route 
                path="/profile" 
                element={user ? <Profile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  user && userRole === 'admin' ? 
                    <Dashboard /> : 
                    <Navigate to="/" />
                } 
              />
            </Routes>
          </main>
        </div>
        
        {/* Performance Diagnostic (remove in production) */}
        {process.env.NODE_ENV === 'development' && <PerformanceDiagnostic />}
      </Router>
    </AuthProvider>
  );
}

export default App;
