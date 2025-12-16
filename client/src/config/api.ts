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
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In production mode, use production backend URL
  if (import.meta.env.PROD) {
    return 'https://rkand-co.onrender.com/api'
  }
  
  // Development fallback
  return 'http://localhost:5000/api'
}

export const API_URL = getApiUrl()

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL)
}

