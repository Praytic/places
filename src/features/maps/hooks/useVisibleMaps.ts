import { useState, useEffect, useCallback } from 'react';

export const useVisibleMaps = (
  availableMapIds: string[],
): {
  visibleMapIds: Set<string>;
  toggleMapVisibility: (mapId: string) => void;
  setVisibleMapIds: React.Dispatch<React.SetStateAction<Set<string>>>;
} => {
  const [visibleMapIds, setVisibleMapIds] = useState<Set<string>>(new Set());

  // Load visible map IDs from localStorage on mount or when user changes
  useEffect(() => {
    const storageKey = `visibleMaps`;
    const savedVisibleMaps = localStorage.getItem(storageKey);

    if (savedVisibleMaps) {
      const savedIds = JSON.parse(savedVisibleMaps) as string[];
      // Filter out IDs that are no longer available
      const validIds = savedIds.filter((id) => availableMapIds.includes(id));
      setVisibleMapIds(new Set(validIds));
    }
  }, [availableMapIds]);

  // Save visible map IDs to localStorage when they change
  useEffect(() => {
    if (visibleMapIds.size > 0) {
      const storageKey = `visibleMaps`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(visibleMapIds)));
    }
  }, [visibleMapIds]);

  const toggleMapVisibility = useCallback((mapId: string) => {
    setVisibleMapIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(mapId) ? newSet.delete(mapId) : newSet.add(mapId);
      return newSet;
    });
  }, []);

  return { visibleMapIds, toggleMapVisibility, setVisibleMapIds };
};
