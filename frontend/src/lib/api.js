import axios from 'axios'

// Configure Axios with secure defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies and CSRF
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add CSRF token to headers if available
api.interceptors.request.use((config) => {
  // CSRF Double Submit Cookie approach
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
  }
  
  const csrfToken = getCookie('csrf_token')
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

export default api
