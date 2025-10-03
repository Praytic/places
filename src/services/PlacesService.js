import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'markers';

export class PlacesService {
  /**
   * Get all places from Firestore
   * @returns {Promise<Array>} Array of places
   */
  static async getPlaces() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
   * @returns {Promise<Object>} The added place with Firestore ID
   */
  static async addPlace(place) {
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
   * @param {Function} callback - Callback function to handle data updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPlaces(callback) {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

      return onSnapshot(q, (querySnapshot) => {
        const places = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(places);
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
}

export default PlacesService;
