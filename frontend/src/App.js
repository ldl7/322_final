import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import './App.css'; // General app styles

// Component to handle root navigation based on auth state
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>; // Or a global spinner
  }

  return isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<PrivateRoute />}>
              <Route index element={<ChatPage />} />
            </Route>
            <Route path="/" element={<RootNavigator />} />
            {/* You can add a 404 Not Found page here */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
