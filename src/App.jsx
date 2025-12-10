import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChange } from './services/auth';
import { getUserRole } from './services/auth';

// Components
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Report from './pages/Report';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

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
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
                      <AdminDashboard /> : 
                      <Navigate to="/" />
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
