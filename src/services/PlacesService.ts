import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { getUserMaps, ROLES } from './MapsService';
import { Place, PlaceGroup, UserRole, Geometry } from '../shared/types/domain';

const PLACES_COLLECTION = 'places';

// Re-export ROLES for backward compatibility
export { ROLES };

/**
 * Extended Place with userRole
 */
export interface PlaceWithRole extends Place {
  userRole: UserRole;
}

/**
 * PlacesService class for managing places in Firestore
 */
export class PlacesService {
  /**
   * Get all places for a specific map
   * @param mapId - Map ID
   * @returns Array of places
   */
  static async getPlacesForMap(mapId: string): Promise<Place[]> {
    try {
      const placesQuery = query(
        collection(db, PLACES_COLLECTION),
        where('mapId', '==', mapId)
      );
      const placesSnapshot = await getDocs(placesQuery);

      const places: Place[] = placesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Place));

      // Sort by createdAt in descending order
      places.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return places;
    } catch (error) {
      console.error('Error fetching places for map:', error);
      throw error;
    }
  }

  /**
   * Get all places accessible to the current user (from all their maps)
   * @param userId - Current user's ID (email)
   * @returns Array of places with userRole
   */
  static async getPlaces(userId: string): Promise<PlaceWithRole[]> {
    try {
      // Get all maps user has access to
      const userMaps = await getUserMaps(userId);

      if (userMaps.length === 0) {
        return [];
      }

      // Fetch places from all maps
      const placesPromises = userMaps.map(async (map) => {
        const places = await this.getPlacesForMap(map.id);
        // Add userRole to each place based on their map role
        return places.map(place => ({
          ...place,
          userRole: map.userRole,
          mapId: map.id
        } as PlaceWithRole));
      });

      const placesArrays = await Promise.all(placesPromises);
      const allPlaces = placesArrays.flat();

      // Sort by createdAt in descending order
      allPlaces.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return allPlaces;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  /**
   * Add a new place to a map
   * @param place - The place object to add
   * @param mapId - The map ID to add the place to
   * @returns The added place with Firestore ID
   */
  static async addPlace(place: Partial<Place> & { geometry: Geometry; name: string; group: PlaceGroup }, mapId: string): Promise<Place> {
    try {
      // Handle both LatLng objects and plain objects
      let location;
      if (place.geometry.location && typeof (place.geometry.location as any).lat === 'function') {
        const latLng = place.geometry.location as any;
        location = {
          lat: latLng.lat(),
          lng: latLng.lng()
        };
      } else {
        location = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        };
      }

      const placeData: Omit<Place, 'id'> = {
        ...place as any,
        mapId,
        emoji: place.emoji || '📍',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        geometry: {
          location: location
        }
      };

      // Create the place document
      const placeRef = doc(collection(db, PLACES_COLLECTION));
      await setDoc(placeRef, placeData);

      return {
        id: placeRef.id,
        ...placeData
      } as Place;
    } catch (error) {
      console.error('Error adding place:', error);
      throw error;
    }
  }

  /**
   * Update an existing place in Firestore
   * @param placeId - The Firestore document ID
   * @param updates - The fields to update
   */
  static async updatePlace(placeId: string, updates: Partial<Omit<Place, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const placeRef = doc(db, PLACES_COLLECTION, placeId);
      await updateDoc(placeRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  }

  /**
   * Delete a place from Firestore
   * @param placeId - The Firestore document ID
   */
  static async deletePlace(placeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PLACES_COLLECTION, placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for places from specific maps
   * @param mapIds - Array of map IDs to subscribe to
   * @param mapRoles - Map of mapId -> role
   * @param callback - Callback function to handle data updates
   * @returns Unsubscribe function
   */
  static subscribeToPlacesForMaps(
    mapIds: string[],
    mapRoles: Record<string, UserRole>,
    callback: (places: PlaceWithRole[]) => void
  ): Unsubscribe {
    try {
      if (!mapIds || mapIds.length === 0) {
        callback([]);
        return () => {};
      }

      const placesQuery = query(
        collection(db, PLACES_COLLECTION),
        where('mapId', 'in', mapIds)
      );

      return onSnapshot(
        placesQuery,
        (placesSnapshot) => {
          const places: PlaceWithRole[] = placesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userRole: mapRoles[doc.data()['mapId']]
          } as PlaceWithRole));

          // Sort by createdAt in descending order
          places.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });

          callback(places);
        },
        (error) => {
          console.error('Error in places subscription:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up places subscription:', error);
      return () => {};
    }
  }

  /**
   * Set up real-time listener for places accessible to the user (from all their maps)
   * @deprecated Use subscribeToPlacesForMaps instead to avoid nested subscriptions
   * @param userId - Current user's ID (email)
   * @param callback - Callback function to handle data updates
   * @returns Unsubscribe function
   */
  static subscribeToPlaces(userId: string, callback: (places: PlaceWithRole[]) => void): Unsubscribe {
    try {
      // Query mapViews where user is the collaborator
      const mapViewsQuery = query(
        collection(db, 'mapViews'),
        where('collaborator', '==', userId)
      );

      return onSnapshot(mapViewsQuery, async (mapViewsSnapshot) => {
        try {
          if (mapViewsSnapshot.empty) {
            callback([]);
            return;
          }

          // Get map IDs and roles from mapViews
          const mapIds = mapViewsSnapshot.docs.map(doc => doc.data()['mapId']);
          const mapRoles: Record<string, UserRole> = {};
          mapViewsSnapshot.docs.forEach(doc => {
            const mapViewData = doc.data();
            mapRoles[mapViewData['mapId']] = mapViewData['role'];
          });

          // Fetch places directly (not nested subscription)
          const placesQuery = query(
            collection(db, PLACES_COLLECTION),
            where('mapId', 'in', mapIds)
          );

          const placesSnapshot = await getDocs(placesQuery);
          const places: PlaceWithRole[] = placesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            userRole: mapRoles[doc.data()['mapId']]
          } as PlaceWithRole));

          // Sort by createdAt in descending order
          places.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });

          callback(places);
        } catch (error) {
          console.error('Error processing places snapshot:', error);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up places subscription:', error);
      return () => {};
    }
  }

  /**
   * Update a place's group (like/dislike functionality)
   * @param placeId - The Firestore document ID
   * @param newGroup - The new group ('want to go' or 'favorite')
   */
  static async updatePlaceGroup(placeId: string, newGroup: PlaceGroup): Promise<void> {
    return this.updatePlace(placeId, { group: newGroup });
  }

  /**
   * Update a place's emoji
   * @param placeId - The Firestore document ID
   * @param emoji - The new emoji
   */
  static async updatePlaceEmoji(placeId: string, emoji: string): Promise<void> {
    return this.updatePlace(placeId, { emoji });
  }
}

export default PlacesService;