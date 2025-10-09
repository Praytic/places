import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { getUserMaps, ROLES } from './MapsService';
import { Place, PlaceGroup, UserRole, Geometry } from '../shared/types/domain';

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
      const placesRef = collection(db, 'maps', mapId, 'places');
      const placesSnapshot = await getDocs(placesRef);

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

      // Create the place document in nested collection
      const placeRef = doc(collection(db, 'maps', mapId, 'places'));
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
   * @param mapId - The map ID
   * @param placeId - The Firestore document ID
   * @param updates - The fields to update
   */
  static async updatePlace(mapId: string, placeId: string, updates: Partial<Omit<Place, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const placeRef = doc(db, 'maps', mapId, 'places', placeId);
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
   * @param mapId - The map ID
   * @param placeId - The Firestore document ID
   */
  static async deletePlace(mapId: string, placeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'maps', mapId, 'places', placeId));
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

      // Store places from each map subscription
      const placesMap: Record<string, PlaceWithRole[]> = {};
      const unsubscribers: Unsubscribe[] = [];

      const updateCallback = () => {
        // Combine all places from all maps
        const allPlaces = Object.values(placesMap).flat();

        // Sort by createdAt in descending order
        allPlaces.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

        callback(allPlaces);
      };

      // Subscribe to each map's places collection individually
      mapIds.forEach(mapId => {
        const placesRef = collection(db, 'maps', mapId, 'places');

        const unsubscribe = onSnapshot(
          placesRef,
          (snapshot) => {
            placesMap[mapId] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              userRole: mapRoles[mapId]
            } as PlaceWithRole));

            updateCallback();
          },
          (error) => {
            console.error(`Error in places subscription for map ${mapId}:`, error);
            placesMap[mapId] = [];
            updateCallback();
          }
        );

        unsubscribers.push(unsubscribe);
      });

      // Return combined unsubscribe function
      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Error setting up places subscription:', error);
      return () => {};
    }
  }

  /**
   * Update a place's group (like/dislike functionality)
   * @param mapId - The map ID
   * @param placeId - The Firestore document ID
   * @param newGroup - The new group ('want to go' or 'favorite')
   */
  static async updatePlaceGroup(mapId: string, placeId: string, newGroup: PlaceGroup): Promise<void> {
    return this.updatePlace(mapId, placeId, { group: newGroup });
  }

  /**
   * Update a place's emoji
   * @param mapId - The map ID
   * @param placeId - The Firestore document ID
   * @param emoji - The new emoji
   */
  static async updatePlaceEmoji(mapId: string, placeId: string, emoji: string): Promise<void> {
    return this.updatePlace(mapId, placeId, { emoji });
  }
}

export default PlacesService;
