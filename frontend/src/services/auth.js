import api from './api';

/**
 * Logs in a user.
 * @param {object} credentials - User credentials (email, password).
 * @returns {Promise<object>} The response data containing accessToken and user.
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data; // Should contain { accessToken, user }
  } catch (error) {
    console.error('Login service error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Registers a new user.
 * @param {object} userData - User data (username, email, password, firstName, lastName).
 * @returns {Promise<object>} The response data containing the registered user.
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data; // Should contain the registered user object
  } catch (error) {
    console.error('Register service error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches the current user's profile.
 * Requires the JWT to be set in the Authorization header (handled by api.js interceptor or AuthContext).
 * @returns {Promise<object>} The user profile data.
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile'); // Assuming a '/users/profile' endpoint
    return response.data;
  } catch (error) {
    console.error('Get user profile service error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Logs out a user.
 * This might involve calling a backend endpoint to invalidate a refresh token.
 * @returns {Promise<object>} The response from the logout endpoint.
 */
export const logout = async () => {
  try {
    // Assuming backend has a /auth/logout endpoint that might invalidate refresh token in DB/cookie
    const response = await api.post('/auth/logout'); 
    return response.data;
  } catch (error) {
    console.error('Logout service error:', error.response?.data || error.message);
    // Even if backend logout fails, frontend should clear local state.
    // This error might be informational or handled if specific actions are needed.
    throw error; 
  }
};

