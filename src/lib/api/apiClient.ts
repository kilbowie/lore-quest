
/**
 * API Client for making network requests
 * This is a centralized place for all API calls
 */

// Define base API URL
const API_BASE_URL = process.env.API_URL || 'https://api.example.com';

// Generic request function with typescript generics
async function request<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const config = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, config);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Export specific HTTP method functions
export const apiClient = {
  /**
   * Make a GET request
   */
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  /**
   * Make a POST request
   */
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    request<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  /**
   * Make a PUT request
   */
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    
  /**
   * Make a DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' })
};
