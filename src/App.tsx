import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from './api/config';
import { AdminState } from './api/types';
import LoginPage from './pages/LoginPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewFormPage from './pages/ReviewFormPage';
import AdminPage from './pages/AdminPage';
import { User } from './api/types';

function App() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const headerHeight = 60; // Fixed header height in pixels

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminState, setAdminState] = useState<AdminState | null>(() => {
    const saved = localStorage.getItem('admin');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = async (apiToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiToken })
      });

      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Invalid API token');
      }
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const handleAdminLogin = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const adminData = { token };
        localStorage.setItem('admin', JSON.stringify(adminData));
        setAdminState(adminData);
      } else {
        throw new Error('Invalid admin token');
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      localStorage.removeItem('admin');
      setAdminState(null);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    setUser(null);
    setAdminState(null);
  };

  return (
    <Router>
      <div className="app">
        <header>
          <h1><Link to="/dandi-notebook-review/" style={{ textDecoration: 'none', color: 'inherit' }}>DANDI Notebook Review</Link></h1>
          {(user || adminState) && (
            <div className="header-actions">
              {user && (
                <span className="user-info">Logged in as {user.email}&nbsp;&nbsp;&nbsp;</span>
              )}
              {adminState && (
                <span className="user-info">Admin Mode&nbsp;&nbsp;&nbsp;</span>
              )}
              <button onClick={handleLogout} className="logout-button">
                {adminState ? 'Admin Logout' : 'Logout'}
              </button>
            </div>
          )}
        </header>

        <Routes>
          <Route
            path="/dandi-notebook-review/"
            element={
              user ? <Navigate to="/dandi-notebook-review/reviews" /> : <LoginPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/dandi-notebook-review/reviews"
            element={user ? <ReviewsPage user={user} /> : <Navigate to="/dandi-notebook-review/" />}
          />
          <Route
            path="/dandi-notebook-review/review"
            element={<ReviewFormPage user={user || undefined} onLogin={handleLogin} width={windowDimensions.width} height={windowDimensions.height - headerHeight} />}
          />
          <Route
          path="/dandi-notebook-review/admin"
          element={adminState ? <AdminPage adminToken={adminState.token} /> : <LoginPage onLogin={handleAdminLogin} isAdminLogin />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
