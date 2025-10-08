import { useState, useEffect } from 'react';
import { Place, PlaceMap, UserRole } from '../../../shared/types';
import PlacesService from '../../../services/PlacesService';

/**
 * Custom hook for managing places with real-time Firestore subscription
 *
 * Subscribes to all places from the user's accessible maps and provides
 * both unfiltered and filtered views based on visible map IDs.
 * Manages selected place state for map interactions.
 *
 * @param {PlaceMap[]} maps - Array of maps accessible to the user
 * @param {Set<string>} visibleMapIds - Set of map IDs to show places from
 * @returns {Object} Places state and controls
 * @returns {Place[]} allPlaces - All places from accessible maps
 * @returns {Place[]} filteredPlaces - Places filtered by visible maps
 * @returns {boolean} loading - True while places are being fetched
 * @returns {Place | null} selectedPlace - Currently selected place on map
 * @returns {Function} setSelectedPlace - Function to update selected place
 *
 * @example
 * ```tsx
 * const { filteredPlaces, loading, selectedPlace, setSelectedPlace } = usePlaces(maps, visibleMapIds);
 *
 * return (
 *   <MapView
 *     places={filteredPlaces}
 *     onMarkerClick={setSelectedPlace}
 *     selectedPlace={selectedPlace}
 *   />
 * );
 * ```
 */
export const usePlaces = (
  maps: PlaceMap[],
  visibleMapIds: Set<string>
): {
  allPlaces: Place[];
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
} => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Subscribe to all places from user's maps
  useEffect(() => {
    if (maps.length === 0) {
      setAllPlaces([]);
      setLoading(false);
      return;
    }

    const mapIds = maps.map((m) => m.id);
    const mapRoles: Record<string, UserRole> = {};
    maps.forEach((m) => {
      if (m.userRole) {
        mapRoles[m.id] = m.userRole;
      }
    });

    const unsubscribe = PlacesService.subscribeToPlacesForMaps(mapIds, mapRoles, (placesData: any) => {
      setAllPlaces(placesData as Place[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [maps]);

  // Filter places based on visible map IDs
  useEffect(() => {
    const filtered = allPlaces.filter((place) => visibleMapIds.has(place.mapId));
    setFilteredPlaces(filtered);
  }, [allPlaces, visibleMapIds]);

  return {
    allPlaces,
    filteredPlaces,
    loading,
    selectedPlace,
    setSelectedPlace,
  };
};
