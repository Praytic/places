// LocationService - Handles geolocation and localStorage for user location preferences

import { Location } from '../types';

const LOCATION_PERMISSION_KEY = 'locationPermissionGranted';

/**
 * Request current location from browser
 * @returns Promise with location coordinates
 */
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Check if user has granted location permission before
 * @returns boolean indicating permission status
 */
export const hasLocationPermission = (): boolean => {
  return localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';
};

/**
 * Save location permission preference
 * @param granted - Whether permission was granted
 */
export const setLocationPermission = (granted: boolean): void => {
  localStorage.setItem(LOCATION_PERMISSION_KEY, granted.toString());
};

/**
 * Check if this is the first time user is signing in
 * @param userId - User email
 * @returns boolean indicating if user is first-time
 */
export const isFirstTimeUser = (userId: string): boolean => {
  const key = `firstTimeUser_${userId}`;
  return localStorage.getItem(key) !== 'false';
};

/**
 * Mark user as no longer first-time
 * @param userId - User email
 */
export const setUserAsReturning = (userId: string): void => {
  const key = `firstTimeUser_${userId}`;
  localStorage.setItem(key, 'false');
};