import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserMaps, ROLES } from './MapsService';

const PLACES_COLLECTION = 'places';
const USERS_COLLECTION = 'users';

// Re-export ROLES for backward compatibility
export { ROLES };

export class PlacesService {
  /**
   * Get all places for a specific map
   * @param {string} mapId - Map ID
   * @returns {Promise<Array>} Array of places
   */
  static async getPlacesForMap(mapId) {
    try {
      const placesQuery = query(
        collection(db, PLACES_COLLECTION),
        where('mapId', '==', mapId)
      );
      const placesSnapshot = await getDocs(placesQuery);

      const places = placesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt in descending order
      places.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      return places;
    } catch (error) {
      console.error('Error fetching places for map:', error);
      throw error;
    }
  }

  /**
   * Get all places accessible to the current user (from all their maps)
   * @param {string} userId - Current user's ID (email)
   * @returns {Promise<Array>} Array of places with userRole
   */
  static async getPlaces(userId) {
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
        }));
      });

      const placesArrays = await Promise.all(placesPromises);
      const allPlaces = placesArrays.flat();

      // Sort by createdAt in descending order
      allPlaces.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      return allPlaces;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  /**
   * Add a new place to a map
   * @param {Object} place - The place object to add
   * @param {string} mapId - The map ID to add the place to
   * @returns {Promise<Object>} The added place with Firestore ID
   */
  static async addPlace(place, mapId) {
    try {
      // Handle both LatLng objects and plain objects
      let location;
      if (place.geometry.location.lat && typeof place.geometry.location.lat === 'function') {
        location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
      } else {
        location = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        };
      }

      const placeData = {
        ...place,
        mapId,
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
      };
    } catch (error) {
      console.error('Error adding place:', error);
      throw error;
    }
  }

  /**
   * Update an existing place in Firestore
   * @param {string} placeId - The Firestore document ID
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  static async updatePlace(placeId, updates) {
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
   * @param {string} placeId - The Firestore document ID
   * @returns {Promise<void>}
   */
  static async deletePlace(placeId) {
    try {
      await deleteDoc(doc(db, PLACES_COLLECTION, placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for places accessible to the user (from all their maps)
   * @param {string} userId - Current user's ID (email)
   * @param {Function} callback - Callback function to handle data updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPlaces(userId, callback) {
    try {
      // Listen to user's maps first
      const userMapsRef = collection(db, 'users', userId, 'maps');

      return onSnapshot(userMapsRef, async (mapsSnapshot) => {
        try {
          if (mapsSnapshot.empty) {
            callback([]);
            return;
          }

          // Get map IDs
          const mapIds = mapsSnapshot.docs.map(doc => doc.id);
          const mapRoles = {};
          mapsSnapshot.docs.forEach(doc => {
            mapRoles[doc.id] = doc.data().role;
          });

          // Subscribe to places from all maps
          const placesQuery = query(
            collection(db, PLACES_COLLECTION),
            where('mapId', 'in', mapIds)
          );

          return onSnapshot(placesQuery, (placesSnapshot) => {
            const places = placesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              userRole: mapRoles[doc.data().mapId]
            }));

            // Sort by createdAt in descending order
            places.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(0);
              const bTime = b.createdAt?.toDate?.() || new Date(0);
              return bTime - aTime;
            });

            callback(places);
          });
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
   * @param {string} placeId - The Firestore document ID
   * @param {string} newGroup - The new group ('want to go' or 'favorite')
   * @returns {Promise<void>}
   */
  static async updatePlaceGroup(placeId, newGroup) {
    return this.updatePlace(placeId, { group: newGroup });
  }

  /**
   * Update a place's emoji
   * @param {string} placeId - The Firestore document ID
   * @param {string} emoji - The new emoji
   * @returns {Promise<void>}
   */
  static async updatePlaceEmoji(placeId, emoji) {
    return this.updatePlace(placeId, { emoji });
  }

  /**
   * Get or create user document
   * @param {string} userId - The user's ID (email)
   * @param {Object} userData - User data to store
   * @returns {Promise<Object>} User document
   */
  static async getOrCreateUser(userId, userData = {}) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: userId,
          ...userData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return {
          id: userId,
          email: userId,
          ...userData
        };
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw error;
    }
  }
}

export default PlacesService;
