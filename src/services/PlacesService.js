import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'markers';
const USERS_COLLECTION = 'users';

export class PlacesService {
  /**
   * Get all places from Firestore for current user and shared users
   * @param {string} userId - Current user's ID
   * @param {Array<string>} sharedUserIds - Array of user IDs that shared their places
   * @returns {Promise<Array>} Array of places
   */
  static async getPlaces(userId, sharedUserIds = []) {
    try {
      // Get all user IDs (current user + shared users)
      const allUserIds = [userId, ...sharedUserIds];

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', 'in', allUserIds)
      );
      const querySnapshot = await getDocs(q);

      // Sort in memory instead of using orderBy to avoid composite index requirement
      const places = querySnapshot.docs.map(doc => ({
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
      console.error('Error fetching places:', error);
      if (error.code === 'unavailable') {
        console.error('Firestore database is not available. Please check your Firebase setup and "markers" collection.');
      }
      throw error;
    }
  }

  /**
   * Add a new place to Firestore
   * @param {Object} place - The place object to add
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} The added place with Firestore ID
   */
  static async addPlace(place, userId) {
    try {
      // Handle both LatLng objects and plain objects
      let location;
      if (place.geometry.location.lat && typeof place.geometry.location.lat === 'function') {
        // Google Maps LatLng object
        location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
      } else {
        // Plain object
        location = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        };
      }

      const placeData = {
        ...place,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        geometry: {
          location: location
        }
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), placeData);

      return {
        id: docRef.id,
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
      const placeRef = doc(db, COLLECTION_NAME, placeId);
      await updateDoc(placeRef, {
        ...updates,
        updatedAt: new Date()
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
      await deleteDoc(doc(db, COLLECTION_NAME, placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for places collection
   * @param {string} userId - Current user's ID
   * @param {Array<string>} sharedUserIds - Array of user IDs that shared their places
   * @param {Function} callback - Callback function to handle data updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPlaces(userId, sharedUserIds, callback) {
    try {
      // Get all user IDs (current user + shared users)
      const allUserIds = [userId, ...sharedUserIds];

      // Query for all markers and filter in memory
      // This handles both user-specific and legacy markers without userId
      const q = query(collection(db, COLLECTION_NAME));

      return onSnapshot(q, (querySnapshot) => {
        const allPlaces = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter: include markers that belong to current user, shared users, or have no userId (legacy)
        const filteredPlaces = allPlaces.filter(place => {
          // Include legacy markers without userId
          if (!place.userId || place.userId === null || place.userId === undefined) {
            return true;
          }
          // Include markers from current user or shared users
          return allUserIds.includes(place.userId);
        });

        // Sort by createdAt in descending order
        filteredPlaces.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

        callback(filteredPlaces);
      }, (error) => {
        console.error('Error in places subscription:', error);
        callback([]);
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
          sharedWith: [],
          sharedFrom: [],
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return {
          id: userId,
          email: userId,
          sharedWith: [],
          sharedFrom: [],
          ...userData
        };
      }

      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw error;
    }
  }

  /**
   * Share access with another user by email
   * @param {string} ownerEmail - The owner's email
   * @param {string} collaboratorEmail - The collaborator's email
   * @returns {Promise<void>}
   */
  static async shareWithUser(ownerEmail, collaboratorEmail) {
    try {
      // Get or create both user documents
      await this.getOrCreateUser(ownerEmail);
      await this.getOrCreateUser(collaboratorEmail);

      const ownerRef = doc(db, USERS_COLLECTION, ownerEmail);
      const collaboratorRef = doc(db, USERS_COLLECTION, collaboratorEmail);

      // Add collaborator to owner's sharedWith list
      await updateDoc(ownerRef, {
        sharedWith: arrayUnion(collaboratorEmail),
        updatedAt: new Date()
      });

      // Add owner to collaborator's sharedFrom list
      await updateDoc(collaboratorRef, {
        sharedFrom: arrayUnion(ownerEmail),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error sharing with user:', error);
      throw error;
    }
  }

  /**
   * Remove shared access from a user
   * @param {string} ownerEmail - The owner's email
   * @param {string} collaboratorEmail - The collaborator's email
   * @returns {Promise<void>}
   */
  static async unshareWithUser(ownerEmail, collaboratorEmail) {
    try {
      const ownerRef = doc(db, USERS_COLLECTION, ownerEmail);
      const collaboratorRef = doc(db, USERS_COLLECTION, collaboratorEmail);

      // Remove collaborator from owner's sharedWith list
      await updateDoc(ownerRef, {
        sharedWith: arrayRemove(collaboratorEmail),
        updatedAt: new Date()
      });

      // Remove owner from collaborator's sharedFrom list
      await updateDoc(collaboratorRef, {
        sharedFrom: arrayRemove(ownerEmail),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error unsharing with user:', error);
      throw error;
    }
  }

  /**
   * Get list of users who shared their places with current user
   * @param {string} userId - The user's ID (email)
   * @returns {Promise<Array<string>>} Array of user emails
   */
  static async getSharedFromUsers(userId) {
    try {
      const userData = await this.getOrCreateUser(userId);
      return userData.sharedFrom || [];
    } catch (error) {
      console.error('Error getting shared from users:', error);
      return [];
    }
  }

  /**
   * Get list of users who current user shared places with
   * @param {string} userId - The user's ID (email)
   * @returns {Promise<Array<string>>} Array of user emails
   */
  static async getSharedWithUsers(userId) {
    try {
      const userData = await this.getOrCreateUser(userId);
      return userData.sharedWith || [];
    } catch (error) {
      console.error('Error getting shared with users:', error);
      return [];
    }
  }

  /**
   * Migrate legacy markers (without userId) to a specific user
   * @param {string} userId - The user's ID to assign legacy markers to
   * @returns {Promise<number>} Number of markers migrated
   */
  static async migrateLegacyMarkers(userId) {
    try {
      const legacyQuery = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', null)
      );
      const querySnapshot = await getDocs(legacyQuery);

      const batch = [];
      querySnapshot.docs.forEach((docSnapshot) => {
        batch.push(
          updateDoc(doc(db, COLLECTION_NAME, docSnapshot.id), {
            userId,
            updatedAt: new Date()
          })
        );
      });

      await Promise.all(batch);
      console.log(`Migrated ${batch.length} legacy markers to user ${userId}`);
      return batch.length;
    } catch (error) {
      console.error('Error migrating legacy markers:', error);
      throw error;
    }
  }
}

export default PlacesService;
