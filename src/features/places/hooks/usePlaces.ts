import {useEffect, useMemo, useState} from 'react';
import {MapView, Place, UserMap, UserRole, placeConverter} from '../../../shared/types';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

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
  const [placesBySource, setPlacesBySource] = useState<Map<string, PlaceWithRole[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (maps.length === 0 && views.length === 0) {
      setPlacesBySource(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: Unsubscribe[] = [];

    // Subscribe to places for each owned map
    maps.forEach((map) => {
      const placesRef = collection(db, 'maps', map.id, 'places').withConverter(placeConverter);
      const unsubscribe = onSnapshot(
        placesRef,
        (snapshot) => {
          const places = snapshot.docs.map(doc => ({
            ...doc.data(),
            userRole: UserRole.EDIT
          }));

          setPlacesBySource(prev => {
            const next = new Map(prev);
            next.set(`map-${map.id}`, places);
            return next;
          });
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching places for map ${map.id}:`, error);
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    // Subscribe to places for each accessible view
    views.forEach((view) => {
      const placesRef = collection(db, 'maps', view.mapId, 'places').withConverter(placeConverter);
      const unsubscribe = onSnapshot(
        placesRef,
        (snapshot) => {
          const places = snapshot.docs.map(doc => ({
            ...doc.data(),
            userRole: view.role
          }));

          setPlacesBySource(prev => {
            const next = new Map(prev);
            next.set(`view-${view.id}`, places);
            return next;
          });
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching places for view ${view.mapId}:`, error);
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [maps, views]);

  const allPlaces = useMemo(() => {
    const placesMap = new Map<string, PlaceWithRole>();

    placesBySource.forEach((places) => {
      places.forEach(place => {
        const key = `${place.mapId}-${place.id}`;
        // If place already exists, keep the one with higher role (EDIT > VIEW)
        const existing = placesMap.get(key);
        if (!existing || (place.userRole === UserRole.EDIT && existing.userRole === UserRole.VIEW)) {
          placesMap.set(key, place);
        }
      });
    });

    return Array.from(placesMap.values());
  }, [placesBySource]);

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
