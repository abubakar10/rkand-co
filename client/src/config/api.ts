// Centralized API configuration
// In production, VITE_API_URL should be set to your backend URL
// Example: https://rkand-co.onrender.com/api
// 
// For production builds, set VITE_API_URL environment variable:
// VITE_API_URL=https://rkand-co.onrender.com/api npm run build
//
// Or create .env.production file with:
// VITE_API_URL=https://rkand-co.onrender.com/api

const getApiUrl = () => {
  let baseUrl = ''
  
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    baseUrl = import.meta.env.VITE_API_URL
  } else if (import.meta.env.PROD) {
    // In production mode, use production backend URL
    baseUrl = 'https://rkand-co.onrender.com'
  } else {
    // Development fallback
    baseUrl = 'http://localhost:5000'
  }
  
  // Ensure the URL ends with /api
  // Remove trailing slash if present
  baseUrl = baseUrl.replace(/\/$/, '')
  
  // Add /api if not already present
  if (!baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/api`
  }
  
  return baseUrl
}

export const API_URL = getApiUrl()

// Log the API URL for debugging (both dev and prod)
console.log('API URL:', API_URL)

