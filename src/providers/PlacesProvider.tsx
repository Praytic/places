import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Place, PlaceGroup, FilterSet } from '../shared/types';
import { usePlaces, useActiveFilters } from '../features/places/hooks';
import { useMapsContext } from './MapsProvider';
import PlacesService from '../services/PlacesService';

/**
 * Context value provided by PlacesProvider
 */
interface PlacesContextValue {
  allPlaces: Place[];
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  activeFilters: FilterSet;
  setSelectedPlace: (place: Place | null) => void;
  toggleFilter: (filter: PlaceGroup) => void;
  addPlace: (place: any, mapId: string) => Promise<void>;
  updatePlaceGroup: (mapId: string, placeId: string, group: PlaceGroup) => Promise<void>;
  updatePlaceEmoji: (mapId: string, placeId: string, emoji: string) => Promise<void>;
  deletePlace: (mapId: string, placeId: string) => Promise<void>;
}

const PlacesContext = createContext<PlacesContextValue | undefined>(undefined);

/**
 * Hook to access places context
 *
 * Must be used within a PlacesProvider component tree.
 * Provides access to places data, filters, selection state, and CRUD operations.
 *
 * @returns {PlacesContextValue} Current places state and operations
 * @throws {Error} If used outside of PlacesProvider
 *
 * @example
 * ```tsx
 * function PlacesList() {
 *   const { filteredPlaces, selectedPlace, setSelectedPlace } = usePlacesContext();
 *   return filteredPlaces.map(place => (
 *     <PlaceCard
 *       key={place.id}
 *       place={place}
 *       onClick={() => setSelectedPlace(place)}
 *       isSelected={selectedPlace?.id === place.id}
 *     />
 *   ));
 * }
 * ```
 */
export const usePlacesContext = (): PlacesContextValue => {
  const context = useContext(PlacesContext);
  if (!context) {
    throw new Error('usePlacesContext must be used within PlacesProvider');
  }
  return context;
};

interface PlacesProviderProps {
  children: ReactNode;
}

/**
 * Places Provider Component
 *
 * Wraps the application to provide places management state via React Context.
 * Manages places data, filtering, selection, and CRUD operations.
 * Requires both AuthProvider and MapsProvider as parents in the component tree.
 * All child components can access places state using the usePlacesContext hook.
 *
 * @param {PlacesProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <MapsProvider>
 *         <PlacesProvider>
 *           <MyPlacesApp />
 *         </PlacesProvider>
 *       </MapsProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const PlacesProvider: React.FC<PlacesProviderProps> = ({ children }) => {
  const { maps, visibleMapIds } = useMapsContext();
  const { allPlaces, filteredPlaces, loading, selectedPlace, setSelectedPlace } = usePlaces(
    maps,
    visibleMapIds
  );
  const { activeFilters, toggleFilter } = useActiveFilters();

  const addPlace = useCallback(async (place: any, mapId: string): Promise<void> => {
    await PlacesService.addPlace(place, mapId);
  }, []);

  const updatePlaceGroup = useCallback(async (mapId: string, placeId: string, group: PlaceGroup): Promise<void> => {
    await PlacesService.updatePlaceGroup(mapId, placeId, group);
  }, []);

  const updatePlaceEmoji = useCallback(async (mapId: string, placeId: string, emoji: string): Promise<void> => {
    await PlacesService.updatePlaceEmoji(mapId, placeId, emoji);
  }, []);

  const deletePlace = useCallback(async (mapId: string, placeId: string): Promise<void> => {
    await PlacesService.deletePlace(mapId, placeId);
  }, []);

  const value: PlacesContextValue = useMemo(
    () => ({
      allPlaces,
      filteredPlaces,
      loading,
      selectedPlace,
      activeFilters,
      setSelectedPlace,
      toggleFilter,
      addPlace,
      updatePlaceGroup,
      updatePlaceEmoji,
      deletePlace,
    }),
    [
      allPlaces,
      filteredPlaces,
      loading,
      selectedPlace,
      activeFilters,
      setSelectedPlace,
      toggleFilter,
      addPlace,
      updatePlaceGroup,
      updatePlaceEmoji,
      deletePlace,
    ]
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
};