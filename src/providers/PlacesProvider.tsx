import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Place, PlaceGroup } from '../shared/types';
import { usePlaces, useActiveFilters } from '../features/places/hooks';
import { useMapsContext } from './MapsProvider';
import {createPlace, deletePlace, updatePlace} from '../services/PlacesService';

interface PlacesContextValue {
  allPlaces: Place[];
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  activeFilters: Set<PlaceGroup>;
  setSelectedPlace: (place: Place | null) => void;
  toggleFilter: (filter: PlaceGroup) => void;
  createPlace: (place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Place>;
  updatePlace: (place: Pick<Place, 'group' | 'emoji' | 'mapId' | 'id'>) => Promise<Place>;
  deletePlace: (place: Pick<Place, 'id' | 'mapId'>) => Promise<void>;
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
  const { maps, accessibleViews, visibleMapIds } = useMapsContext();
  const { allPlaces, filteredPlaces, loading, selectedPlace, setSelectedPlace } = usePlaces(
    maps,
    accessibleViews,
    visibleMapIds
  );
  const { activeFilters, toggleFilter } = useActiveFilters();

  const value: PlacesContextValue = useMemo(
    () => ({
      allPlaces,
      filteredPlaces,
      loading,
      selectedPlace,
      activeFilters,
      setSelectedPlace,
      toggleFilter,
      createPlace,
      updatePlace,
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
      createPlace,
      updatePlace,
      deletePlace,
    ]
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
};
