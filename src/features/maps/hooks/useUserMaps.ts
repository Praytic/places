import { useState, useEffect } from 'react';
import { PlaceMapWithRole, UserRole } from '../../../shared/types';
import { subscribeUserToMap, createMap } from '../../../services/MapsService';

/**
 * Custom hook for managing user's maps with real-time Firestore subscription
 *
 * Subscribes to maps that the user owns or has been granted access to.
 * Automatically creates a default map for first-time users.
 * Handles map selection and persists the current map ID.
 *
 * @param {string | null} userId - The user's email address (used as user ID)
 * @returns {Object} Maps state and controls
 * @returns {PlaceMapWithRole[]} maps - Array of maps accessible to the user
 * @returns {boolean} loading - True while maps are being fetched
 * @returns {string | null} error - Error message if map operations fail
 * @returns {string | null} currentMapId - ID of the currently selected map
 * @returns {Function} setCurrentMapId - Function to change the current map
 *
 * @example
 * ```tsx
 * const { maps, loading, currentMapId, setCurrentMapId } = useUserMaps(user?.email);
 *
 * if (loading) return <Spinner />;
 * return (
 *   <select value={currentMapId} onChange={e => setCurrentMapId(e.target.value)}>
 *     {maps.map(map => <option key={map.id} value={map.id}>{map.name}</option>)}
 *   </select>
 * );
 * ```
 */
export const useUserMaps = (
  userId: string | null
): {
  maps: PlaceMapWithRole[];
  loading: boolean;
  error: string | null;
  currentMapId: string | null;
  setCurrentMapId: React.Dispatch<React.SetStateAction<string | null>>;
} => {
  const [maps, setMaps] = useState<PlaceMapWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setMaps([]);
      setLoading(false);
      setCurrentMapId(null);
      return;
    }

    let isFirstUpdate = true;

    const unsubscribe = subscribeUserToMap(userId, async (userMaps: PlaceMapWithRole[]) => {
      try {
        let updatedMaps = userMaps;

        // On first update, check if user needs a default map
        if (isFirstUpdate && userMaps.length === 0) {
          const newMap = await createMap(userId, 'My Places', true);
          updatedMaps = [{ ...newMap, userRole: UserRole.OWNER } as PlaceMapWithRole];
        }

        setMaps(updatedMaps);

        // Set current map ID on first update
        if (isFirstUpdate && updatedMaps.length > 0) {
          setCurrentMapId(updatedMaps[0]?.id ?? null);
        } else if (!isFirstUpdate && updatedMaps.length > 0) {
          // If current map was deleted, switch to first available
          setCurrentMapId((current) => {
            if (current && !updatedMaps.find((m) => m.id === current)) {
              return updatedMaps[0]?.id ?? null;
            }
            return current;
          });
        }

        isFirstUpdate = false;
        setLoading(false);
      } catch (err) {
        console.error('Error handling maps update:', err);
        setError('Failed to update maps');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return { maps, loading, error, currentMapId, setCurrentMapId };
};
