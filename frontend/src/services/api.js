import axios from 'axios';

// Determine the base URL based on the environment
const API_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_DEV_API_URL || 'http://localhost:5000/api' // Default dev backend URL
  : process.env.REACT_APP_PROD_API_URL || '/api'; // Default prod backend URL (relative path for same-host deployment)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor to add the JWT token to requests if available.
 * This is another place you could manage adding the token, but AuthContext already does it.
 * Keeping it here for reference or if you prefer this pattern.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) { // Check if AuthContext already set it
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor to handle common API errors, like 401 for unauthorized access.
 * This could be used for global error handling, e.g., redirecting to login on 401.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., by logging out the user
      // This can be more complex if you're handling token refresh
      console.error('API request unauthorized (401). Token might be invalid or expired.');
      // Example: Trigger logout from AuthContext or redirect
      // This part needs careful consideration with AuthContext's role
      // For now, AuthContext handles token removal on its own initialization/error handling.
    }
    return Promise.reject(error);
  }
);

export default api;

