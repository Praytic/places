import {useEffect, useMemo, useState} from 'react';
import {MapView, Place, UserMap, UserRole} from '../../../shared/types';
import {getPlacesForMap, getPlacesForView} from '../../../services/PlacesService';

type PlaceWithRole = Place & { userRole: UserRole };

export const usePlaces = (
  maps: UserMap[],
  views: MapView[],
  visibleMapIds: Set<string>
): {
  allPlaces: Place[];
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
} => {
  const [allPlaces, setAllPlaces] = useState<PlaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (maps.length === 0) {
      setAllPlaces([]);
      setLoading(false);
      return;
    }

    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const placesArrays = await Promise.all([
          ...maps.map(async (map) => {
            const places = await getPlacesForMap(map);
            return places.map(place => ({...place, userRole: UserRole.EDIT}));
          }),
          ...views.map(async (view) => {
            const places = await getPlacesForView(view);
            return places.map(place => ({...place, userRole: view.role}));
          })
        ]);

        const places = placesArrays.flat();
        setAllPlaces(places);
      } catch (error) {
        setAllPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [maps, views]);

  const filteredPlaces = useMemo(
    () => allPlaces.filter((place) => visibleMapIds.has(place.mapId)),
    [allPlaces, visibleMapIds]
  );

  return {
    allPlaces,
    filteredPlaces,
    loading,
    selectedPlace,
    setSelectedPlace,
  };
};
