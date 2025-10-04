import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  createMap,
  getUserMaps,
  deletePlaceMaps,
  subscribeToUserMaps,
  ROLES
} from './MapsService';

const PLACES_COLLECTION = 'places';
const USERS_COLLECTION = 'users';

// Re-export ROLES for backward compatibility
export { ROLES };

export class PlacesService {
  /**
   * Get all places accessible to the current user via /maps collection
   * @param {string} userId - Current user's ID (email)
   * @returns {Promise<Array>} Array of places user has access to
   */
  static async getPlaces(userId) {
    try {
      // Query user's maps to get places and roles
      const userMaps = await getUserMaps(userId);

      if (userMaps.length === 0) {
        return [];
      }

      // Fetch the actual place documents
      const placesPromises = userMaps.map(async (map) => {
        const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, map.placeId));
        if (placeDoc.exists()) {
          return {
            id: placeDoc.id,
            ...placeDoc.data(),
            userRole: map.role // Include user's role for this place
          };
        }
        return null;
      });

      const places = (await Promise.all(placesPromises)).filter(p => p !== null);

      // Sort by createdAt in descending order
      places.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      return places;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  /**
   * Add a new place to Firestore with /maps entry
   * @param {Object} place - The place object to add
   * @param {string} userId - The user's ID (email)
   * @returns {Promise<Object>} The added place with Firestore ID
   */
  static async addPlace(place, userId) {
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        geometry: {
          location: location
        }
      };

      // Use batch write to create place and map entry atomically
      const batch = writeBatch(db);

      // Create the place document
      const placeRef = doc(collection(db, PLACES_COLLECTION));
      batch.set(placeRef, placeData);

      // Create map entry for owner
      const mapId = `${userId}_${placeRef.id}`;
      const mapRef = doc(db, 'maps', mapId);
      batch.set(mapRef, {
        id: mapId,
        placeId: placeRef.id,
        userId: userId,
        role: ROLES.OWNER,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await batch.commit();

      return {
        id: placeRef.id,
        ...placeData,
        userRole: ROLES.OWNER
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
   * Delete a place from Firestore (with all map entries)
   * @param {string} placeId - The Firestore document ID
   * @param {string} userId - The user's ID (for verification)
   * @returns {Promise<void>}
   */
  static async deletePlace(placeId, userId) {
    try {
      // Delete all map entries for this place
      await deletePlaceMaps(placeId);

      // Delete the place document
      await deleteDoc(doc(db, PLACES_COLLECTION, placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for places accessible to the user via /maps
   * @param {string} userId - Current user's ID (email)
   * @param {Function} callback - Callback function to handle data updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPlaces(userId, callback) {
    try {
      // Listen to changes in user's maps
      return subscribeToUserMaps(userId, async (maps) => {
        try {
          if (maps.length === 0) {
            callback([]);
            return;
          }

          // Fetch the actual place documents
          const placesPromises = maps.map(async (map) => {
            const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, map.placeId));
            if (placeDoc.exists()) {
              return {
                id: placeDoc.id,
                ...placeDoc.data(),
                userRole: map.role
              };
            }
            return null;
          });

          const places = (await Promise.all(placesPromises)).filter(p => p !== null);

          // Sort by createdAt in descending order
          places.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
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
   * Get user document by email
   * @param {string} email - The email to search for
   * @returns {Promise<Object|null>} User document or null
   */
  static async getUserByEmail(email) {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, email));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
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
