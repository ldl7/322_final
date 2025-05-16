import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService, getUserProfile } from '../services/auth';
import api from '../services/api'; // For setting auth header

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Optional: Fetch user profile if token exists on initial load
          // This helps verify the token and get fresh user data
          // const currentUser = await getUserProfile(); // Assuming you have a getUserProfile service
          // setUser(currentUser);
          // For MVP, we can decode token or set user based on successful login
          // For now, if token exists, we assume it's valid until a protected route fails
          // or we implement token refresh and validation.
          // Simple user object from token (if needed and token contains user info)
          // const decodedToken = jwt_decode(token); // if using jwt-decode
          // setUser({ id: decodedToken.id, username: decodedToken.username });
          // For now, we will set the user upon login/register and clear on logout.
        } catch (err) {
          console.error('Auth init error:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          api.defaults.headers.common['Authorization'] = '';
        }
      } else {
        // Ensure auth header is cleared if no token
        api.defaults.headers.common['Authorization'] = '';
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const { accessToken, user: loggedInUser } = await loginService(credentials);
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      setUser(loggedInUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setLoading(false);
      return loggedInUser;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const registeredUser = await registerService(userData);
      setLoading(false);
      // Typically, after registration, the user should log in.
      // Some apps log in the user automatically.
      return registeredUser; 
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.defaults.headers.common['Authorization'] = '';
    // Optionally call a backend logout endpoint if you have one
    // await logoutService(); 
    // Redirect to login page or home page via navigate in component
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, error, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
