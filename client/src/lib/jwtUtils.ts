/**
 * JWT token utilities for client-side authentication
 */

// Key used to store the JWT token in localStorage
const TOKEN_STORAGE_KEY = 'syrian_ministry_auth_token';

/**
 * Save JWT token to localStorage
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
}

/**
 * Remove JWT token from localStorage (for logout)
 */
export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
}

/**
 * Check if JWT token is expired
 * Note: This is a simple client-side check and does not validate the token signature
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Split the token and get the payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    
    // Check if expired
    if (payload.exp) {
      const expiryTime = payload.exp * 1000; // Convert seconds to milliseconds
      return Date.now() >= expiryTime;
    }
    
    return true; // If no expiry claim, consider it expired
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Assume expired on error
  }
}

/**
 * Get Authorization header with JWT token
 */
export function getAuthHeader(): { Authorization?: string } {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Parse and save a refreshed token from X-Refresh-Token header
 */
export function handleTokenRefresh(response: Response): void {
  const refreshedToken = response.headers.get('X-Refresh-Token');
  if (refreshedToken) {
    saveToken(refreshedToken);
  }
}