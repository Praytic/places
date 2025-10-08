import { useState, useEffect } from 'react';
import { Location } from '../types';
import { getCurrentLocation, hasLocationPermission } from '../utils/locationService';

/**
 * Custom hook for accessing user's current geolocation
 *
 * Wraps the browser's Geolocation API with state management. Can optionally
 * request location automatically on mount if permission was previously granted.
 * Provides error handling for permission denials and geolocation failures.
 *
 * @param {boolean} autoRequest - If true, requests location on mount (when permission exists)
 * @returns {Object} Location state and controls
 * @returns {Location | null} location - User's current coordinates (lat/lng)
 * @returns {Function} requestLocation - Async function to request location
 * @returns {string | null} error - Error message if location request fails
 *
 * @example
 * ```tsx
 * // Auto-request on mount
 * const { location, error } = useCurrentLocation(true);
 *
 * // Manual request
 * const { location, requestLocation } = useCurrentLocation();
 * <button onClick={requestLocation}>Get My Location</button>
 * ```
 */
export const useCurrentLocation = (
  autoRequest = false
): {
  location: Location | null;
  requestLocation: () => Promise<void>;
  error: string | null;
} => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async (): Promise<void> => {
    try {
      setError(null);
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Error getting location:', err);
    }
  };

  useEffect(() => {
    if (autoRequest && hasLocationPermission()) {
      void requestLocation();
    }
  }, [autoRequest]);

  return { location, requestLocation, error };
};
