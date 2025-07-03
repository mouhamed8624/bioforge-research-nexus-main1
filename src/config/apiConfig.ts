
/**
 * Configuration for API endpoints based on environment
 */

// Determine the base API URL based on the environment
const getApiBaseUrl = () => {
  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // You can override this with a custom environment variable if needed
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }
  
  // For production
  // If you deploy your backend elsewhere, update this URL
  return import.meta.env.VITE_API_URL || 'https://api.yourdomain.com/api';
};

export const API_URL = getApiBaseUrl();

// Export other API-related configurations as needed
export const API_TIMEOUT = 30000; // 30 seconds timeout for API calls

// If you need to add authentication headers to your API calls
export const getApiHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  // const token = localStorage.getItem('auth_token');
  // if (token) {
  //   headers.Authorization = `Bearer ${token}`;
  // }
  
  return headers;
};
