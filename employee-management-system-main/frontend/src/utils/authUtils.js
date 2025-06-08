/**
 * Authentication utilities for the application
 */

import axios from 'axios';

/**
 * Check if the current token is valid
 * @returns {boolean} True if the token is valid, false otherwise
 */
export const isTokenValid = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Check if token is a valid JWT format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error("Token is not in valid JWT format");
      return false;
    }

    // Decode the payload
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check if token is expired
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Token is valid if not expired
    return expirationTime > currentTime;
  } catch (error) {
    console.error("Error checking token validity:", error);
    return false;
  }
};

/**
 * Get auth headers for API requests
 * @returns {Object} Headers object with authorization token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Handle auth errors and potentially refresh token
 * @param {Error} error The error from an API request
 * @returns {boolean} True if it's an auth error, false otherwise
 */
export const handleAuthError = async (error) => {
  if (error.response && error.response.status === 401) {
    console.error("Authentication error:", error.response.data?.message || "Unauthorized");
    // Return true to indicate this was an auth error
    return true;
  }
  
  // Return false to indicate this was not an auth error
  return false;
};

/**
 * Make authenticated API request with proper error handling
 * @param {string} method HTTP method (get, post, put, patch, delete)
 * @param {string} url API endpoint URL
 * @param {Object} data Request payload (for POST, PUT, PATCH)
 * @returns {Promise<any>} Response data
 */
export const authRequest = async (method, url, data = null) => {
  try {
    // Check token validity first
    if (!isTokenValid()) {
      console.warn("Token validation failed in authRequest");
      const error = new Error('Token is invalid or expired');
      error.isAuthError = true;
      throw error;
    }
    
    const headers = getAuthHeaders();
    console.log(`Making ${method.toUpperCase()} request to: ${url}`);
    const config = { 
      headers,
      // Add timeout for requests
      timeout: 15000,
      // Add validation function to provide more details
      validateStatus: (status) => {
        // Only resolve for 2xx status codes
        return status >= 200 && status < 300;
      }
    };
    
    let response;
    method = method.toLowerCase();
    
    try {
      if (method === 'get') {
        response = await axios.get(url, config);
      } else if (method === 'post') {
        response = await axios.post(url, data, config);
      } else if (method === 'put') {
        response = await axios.put(url, data, config);
      } else if (method === 'patch') {
        response = await axios.patch(url, data, config);
      } else if (method === 'delete') {
        response = await axios.delete(url, config);
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      console.log(`Request to ${url} completed with status: ${response.status}`);
      return response.data;
    } catch (requestError) {
      console.error(`Error in ${method.toUpperCase()} request to ${url}:`, requestError.message);
      if (requestError.response) {
        console.error('Response status:', requestError.response.status);
        console.error('Response data:', requestError.response.data);
      } else if (requestError.request) {
        console.error('No response received:', requestError.request);
      }
      throw requestError;
    }
  } catch (error) {
    // Check if it's an auth error
    const isAuthError = await handleAuthError(error);
    
    // Add a flag to the error to make it easy for components to detect auth errors
    if (isAuthError) {
      console.log('Auth error detected, adding isAuthError flag');
      error.isAuthError = true;
    }
    
    throw error;
  }
}; 
 