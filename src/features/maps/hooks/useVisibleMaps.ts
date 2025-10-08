import { useState, useEffect, useCallback } from 'react';
import { VisibleMapIds } from '../../../shared/types';

/**
 * Custom hook for managing map visibility with per-user localStorage persistence
 *
 * Controls which maps have their places shown on the map view. Visibility
 * preferences are stored separately for each user in localStorage. Defaults
 * to showing the provided default maps on first load.
 *
 * @param {string | null} userId - The user's ID (email) for storage key
 * @param {string[]} availableMapIds - All map IDs the user has access to
 * @param {string[]} defaultMapIds - Map IDs to show by default (typically first map)
 * @returns {Object} Visibility state and controls
 * @returns {VisibleMapIds} visibleMapIds - Set of map IDs currently visible
 * @returns {Function} toggleMapVisibility - Toggle a map's visibility on/off
 * @returns {Function} setVisibleMapIds - Direct setter for visibility state
 *
 * @example
 * ```tsx
 * const { visibleMapIds, toggleMapVisibility } = useVisibleMaps(
 *   user.email,
 *   maps.map(m => m.id),
 *   [maps[0]?.id]
 * );
 *
 * return maps.map(map => (
 *   <Checkbox
 *     checked={visibleMapIds.has(map.id)}
 *     onChange={() => toggleMapVisibility(map.id)}
 *   />
 * ));
 * ```
 */
export const useVisibleMaps = (
  userId: string | null,
  availableMapIds: string[],
  defaultMapIds: string[] = []
): {
  visibleMapIds: VisibleMapIds;
  toggleMapVisibility: (mapId: string) => void;
  setVisibleMapIds: React.Dispatch<React.SetStateAction<VisibleMapIds>>;
} => {
  const [visibleMapIds, setVisibleMapIds] = useState<VisibleMapIds>(new Set());

  // Load visible map IDs from localStorage on mount or when user changes
  useEffect(() => {
    if (!userId) {
      setVisibleMapIds(new Set());
      return;
    }

    const storageKey = `visibleMaps_${userId}`;
    const savedVisibleMaps = localStorage.getItem(storageKey);

    if (savedVisibleMaps) {
      const savedIds = JSON.parse(savedVisibleMaps) as string[];
      // Filter out IDs that are no longer available
      const validIds = savedIds.filter((id) => availableMapIds.includes(id));
      setVisibleMapIds(new Set(validIds));
    } else if (defaultMapIds.length > 0) {
      setVisibleMapIds(new Set(defaultMapIds));
    }
  }, [userId, availableMapIds, defaultMapIds]);

  // Save visible map IDs to localStorage when they change
  useEffect(() => {
    if (userId && visibleMapIds.size > 0) {
      const storageKey = `visibleMaps_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(visibleMapIds)));
    }
  }, [userId, visibleMapIds]);

  const toggleMapVisibility = useCallback((mapId: string) => {
    setVisibleMapIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mapId)) {
        newSet.delete(mapId);
      } else {
        newSet.add(mapId);
      }
      return newSet;
    });
  }, []);

  return { visibleMapIds, toggleMapVisibility, setVisibleMapIds };
};
