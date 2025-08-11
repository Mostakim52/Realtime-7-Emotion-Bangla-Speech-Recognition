// // Get the current host (either localhost or IP address)
// const getBackendUrl = () => {
//   const currentHost = window.location.hostname;
  
//   // If accessing via IP address, use the same IP for backend
//   if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
//     return `https://${currentHost}:5000`;
//   }
  
//   // Default to localhost for local development
//   return 'https://localhost:5000';
// };

// export const API_BASE_URL = getBackendUrl();
// export const ENDPOINTS = {
//   INCREMENTAL_TRAIN: `${API_BASE_URL}/incremental-train`,
//   DETECT_EMOTION: `${API_BASE_URL}/detect-emotion`,
//   GENERATE: `${API_BASE_URL}/generate`,
// };


// Get the current host (either localhost or IP address)
const getBackendUrl = () => {
  const currentHost = window.location.hostname;
  
  // If accessing via IP address, use the same IP for backend
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `https://${currentHost}:5000`;
  }
  
  // Default to localhost for local development
  return 'https://localhost:5000';
};

// Get the generate endpoint URL (uses different port and protocol)
const getGenerateUrl = () => {
  const currentHost = window.location.hostname;
  
  // If accessing via IP address, use the same IP for backend
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `https://${currentHost}:7000`;
  }
  
  // Default to localhost for local development
  return 'https://localhost:7000';
};

export const API_BASE_URL = getBackendUrl();
export const GENERATE_BASE_URL = getGenerateUrl();
export const ENDPOINTS = {
  INCREMENTAL_TRAIN: `${API_BASE_URL}/incremental-train`,
  DETECT_EMOTION: `${API_BASE_URL}/detect-emotion`,
  GENERATE: `${GENERATE_BASE_URL}/generate`,
};
