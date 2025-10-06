// LocationService.js - Handles geolocation and localStorage for user location preferences

const LOCATION_PERMISSION_KEY = 'locationPermissionGranted';

/**
 * Request current location from browser
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Check if user has granted location permission before
 * @returns {boolean}
 */
export const hasLocationPermission = () => {
  return localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';
};

/**
 * Save location permission preference
 * @param {boolean} granted
 */
export const setLocationPermission = (granted) => {
  localStorage.setItem(LOCATION_PERMISSION_KEY, granted.toString());
};

/**
 * Check if this is the first time user is signing in
 * @param {string} userId - User email
 * @returns {boolean}
 */
export const isFirstTimeUser = (userId) => {
  const key = `firstTimeUser_${userId}`;
  return localStorage.getItem(key) !== 'false';
};

/**
 * Mark user as no longer first-time
 * @param {string} userId - User email
 */
export const setUserAsReturning = (userId) => {
  const key = `firstTimeUser_${userId}`;
  localStorage.setItem(key, 'false');
};