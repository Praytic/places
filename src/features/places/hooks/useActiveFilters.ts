import { useState, useEffect, useCallback } from 'react';
import { FilterSet, PlaceGroup } from '../../../shared/types';

const STORAGE_KEY = 'activeFilters';
const DEFAULT_FILTERS: PlaceGroup[] = ['favorite', 'want to go'];

/**
 * Custom hook for managing place filter state with localStorage persistence
 *
 * Manages which place groups (e.g., 'favorite', 'want to go') are actively
 * shown on the map. Filter state is persisted to localStorage and restored
 * on mount. Defaults to showing all place groups.
 *
 * @returns {Object} Filter state and controls
 * @returns {FilterSet} activeFilters - Set of active place groups
 * @returns {Function} toggleFilter - Toggle a place group on/off
 * @returns {Function} setActiveFilters - Direct setter for filter state
 *
 * @example
 * ```tsx
 * const { activeFilters, toggleFilter } = useActiveFilters();
 *
 * return (
 *   <FilterButtons>
 *     <button onClick={() => toggleFilter('favorite')}>
 *       Favorites {activeFilters.has('favorite') ? '✓' : ''}
 *     </button>
 *   </FilterButtons>
 * );
 * ```
 */
export const useActiveFilters = (): {
  activeFilters: FilterSet;
  toggleFilter: (filter: PlaceGroup) => void;
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterSet>>;
} => {
  const [activeFilters, setActiveFilters] = useState<FilterSet>(() => {
    // Load saved filters from localStorage or use default
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved) as PlaceGroup[]) : new Set(DEFAULT_FILTERS);
  });

  // Save active filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(activeFilters)));
  }, [activeFilters]);

  const toggleFilter = useCallback((filter: PlaceGroup) => {
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  }, []);

  return { activeFilters, toggleFilter, setActiveFilters };
};
