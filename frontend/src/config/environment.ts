// Environment configuration for the frontend application
export const config = {
  // Backend API base URL - loaded from environment variables with fallback
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://mg-api-g4gdhkgggag5a8eg.centralindia-01.azurewebsites.net/api',
  
  // Backend Socket.IO URL - loaded from environment variables with fallback
  SOCKET_BASE_URL: import.meta.env.VITE_SOCKET_BASE_URL || 'https://mg-api-g4gdhkgggag5a8eg.centralindia-01.azurewebsites.net',
  
  // LiveKit configuration - loaded from environment variables with fallback
  LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL || 'wss://testing-niurlhk3.livekit.cloud',
  
  // Environment detection
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // Vite environment info
  mode: import.meta.env.MODE,
} as const;

export default config;