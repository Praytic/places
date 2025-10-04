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
  writeBatch,
  collectionGroup,
  FieldPath,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PLACES_COLLECTION = 'places';
const USERS_COLLECTION = 'users';

// Role types for access control
export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export class PlacesService {
  /**
   * Get all places accessible to the current user using collection group query
   * @param {string} userId - Current user's ID (email)
   * @returns {Promise<Array>} Array of places user has access to
   */
  static async getPlaces(userId) {
    try {
      // Query the user's accessible places index
      const accessQuery = query(
        collection(db, USERS_COLLECTION, userId, 'accessiblePlaces')
      );
      const accessSnapshot = await getDocs(accessQuery);

      // Get all place IDs with their roles
      const placeAccess = accessSnapshot.docs.map(doc => ({
        placeId: doc.id,
        role: doc.data().role
      }));

      if (placeAccess.length === 0) {
        return [];
      }

      // Fetch the actual place documents
      const placesPromises = placeAccess.map(async ({ placeId, role }) => {
        const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, placeId));
        if (placeDoc.exists()) {
          return {
            id: placeDoc.id,
            ...placeDoc.data(),
            userRole: role // Include user's role for this place
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
   * Add a new place to Firestore with access control
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
        owner: userId,
        access: {
          [userId]: ROLES.OWNER
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        geometry: {
          location: location
        }
      };

      // Use batch write to create place and access records atomically
      const batch = writeBatch(db);

      // Create the place document
      const placeRef = doc(collection(db, PLACES_COLLECTION));
      batch.set(placeRef, placeData);

      // Create access control record (for backward compatibility/subcollection support)
      const accessRef = doc(db, PLACES_COLLECTION, placeRef.id, 'access', userId);
      batch.set(accessRef, {
        role: ROLES.OWNER,
        grantedAt: new Date()
      });

      // Create user's accessible places index
      const userAccessRef = doc(db, USERS_COLLECTION, userId, 'accessiblePlaces', placeRef.id);
      batch.set(userAccessRef, {
        role: ROLES.OWNER,
        grantedAt: new Date()
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
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  }

  /**
   * Delete a place from Firestore (with all access records)
   * @param {string} placeId - The Firestore document ID
   * @param {string} userId - The user's ID (for verification)
   * @returns {Promise<void>}
   */
  static async deletePlace(placeId, userId) {
    try {
      // Get all access records for this place
      const accessQuery = query(collection(db, PLACES_COLLECTION, placeId, 'access'));
      const accessSnapshot = await getDocs(accessQuery);

      const batch = writeBatch(db);

      // Delete the place document
      batch.delete(doc(db, PLACES_COLLECTION, placeId));

      // Delete all access records
      accessSnapshot.docs.forEach((accessDoc) => {
        batch.delete(accessDoc.ref);
        // Also delete from user's accessible places index
        const userAccessRef = doc(db, USERS_COLLECTION, accessDoc.id, 'accessiblePlaces', placeId);
        batch.delete(userAccessRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for places accessible to the user
   * @param {string} userId - Current user's ID (email)
   * @param {Function} callback - Callback function to handle data updates
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPlaces(userId, callback) {
    try {
      // Listen to changes in user's accessible places index
      const accessQuery = query(
        collection(db, USERS_COLLECTION, userId, 'accessiblePlaces')
      );

      return onSnapshot(accessQuery, async (accessSnapshot) => {
        try {
          const placeAccess = accessSnapshot.docs.map(doc => ({
            placeId: doc.id,
            role: doc.data().role
          }));

          if (placeAccess.length === 0) {
            callback([]);
            return;
          }

          // Fetch the actual place documents
          const placesPromises = placeAccess.map(async ({ placeId, role }) => {
            const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, placeId));
            if (placeDoc.exists()) {
              return {
                id: placeDoc.id,
                ...placeDoc.data(),
                userRole: role
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
   * Share a place with another user
   * @param {string} placeId - The place ID
   * @param {string} collaboratorEmail - The collaborator's email
   * @param {string} role - The role to grant (OWNER, EDITOR, VIEWER)
   * @returns {Promise<void>}
   */
  static async sharePlaceWithUser(placeId, collaboratorEmail, role = ROLES.VIEWER) {
    try {
      // Ensure user exists
      await this.getOrCreateUser(collaboratorEmail);

      const batch = writeBatch(db);

      // Update the access map in the place document using FieldPath
      const placeRef = doc(db, PLACES_COLLECTION, placeId);
      batch.update(placeRef, {
        [new FieldPath('access', collaboratorEmail)]: role,
        updatedAt: new Date()
      });

      // Create access control record (for backward compatibility)
      const accessRef = doc(db, PLACES_COLLECTION, placeId, 'access', collaboratorEmail);
      batch.set(accessRef, {
        role: role,
        grantedAt: new Date()
      });

      // Add to user's accessible places index
      const userAccessRef = doc(db, USERS_COLLECTION, collaboratorEmail, 'accessiblePlaces', placeId);
      batch.set(userAccessRef, {
        role: role,
        grantedAt: new Date()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error sharing place:', error);
      throw error;
    }
  }

  /**
   * Remove access to a place from a user
   * @param {string} placeId - The place ID
   * @param {string} collaboratorEmail - The collaborator's email
   * @returns {Promise<void>}
   */
  static async unsharePlaceWithUser(placeId, collaboratorEmail) {
    try {
      const batch = writeBatch(db);

      // Remove from access map in place document
      const placeRef = doc(db, PLACES_COLLECTION, placeId);
      const placeDoc = await getDoc(placeRef);
      if (placeDoc.exists()) {
        const placeData = placeDoc.data();
        const newAccess = { ...placeData.access };
        delete newAccess[collaboratorEmail];

        batch.update(placeRef, {
          access: newAccess,
          updatedAt: new Date()
        });
      }

      // Remove access control record
      const accessRef = doc(db, PLACES_COLLECTION, placeId, 'access', collaboratorEmail);
      batch.delete(accessRef);

      // Remove from user's accessible places index
      const userAccessRef = doc(db, USERS_COLLECTION, collaboratorEmail, 'accessiblePlaces', placeId);
      batch.delete(userAccessRef);

      await batch.commit();
    } catch (error) {
      console.error('Error unsharing place:', error);
      throw error;
    }
  }

  /**
   * Share all user's places with another user
   * @param {string} ownerEmail - The owner's email
   * @param {string} collaboratorEmail - The collaborator's email
   * @param {string} role - The role to grant (default: VIEWER)
   * @returns {Promise<void>}
   */
  static async shareAllPlacesWithUser(ownerEmail, collaboratorEmail, role = ROLES.VIEWER) {
    try {
      // Get all places owned by the user
      const accessQuery = query(
        collection(db, USERS_COLLECTION, ownerEmail, 'accessiblePlaces'),
        where('role', '==', ROLES.OWNER)
      );
      const accessSnapshot = await getDocs(accessQuery);

      // Ensure collaborator user exists
      await this.getOrCreateUser(collaboratorEmail);

      // Share each place
      const sharePromises = accessSnapshot.docs.map(doc =>
        this.sharePlaceWithUser(doc.id, collaboratorEmail, role)
      );

      await Promise.all(sharePromises);

      // Update user documents to track sharing relationships
      await this.updateSharingRelationship(ownerEmail, collaboratorEmail);
    } catch (error) {
      console.error('Error sharing all places:', error);
      throw error;
    }
  }

  /**
   * Remove access to all owner's places from a user
   * @param {string} ownerEmail - The owner's email
   * @param {string} collaboratorEmail - The collaborator's email
   * @returns {Promise<void>}
   */
  static async unshareAllPlacesWithUser(ownerEmail, collaboratorEmail) {
    try {
      // Get all places the collaborator has access to from this owner
      const ownerPlacesQuery = query(
        collection(db, USERS_COLLECTION, ownerEmail, 'accessiblePlaces'),
        where('role', '==', ROLES.OWNER)
      );
      const ownerPlacesSnapshot = await getDocs(ownerPlacesQuery);

      const placeIds = ownerPlacesSnapshot.docs.map(doc => doc.id);

      // Remove access for each place
      const unsharePromises = placeIds.map(placeId =>
        this.unsharePlaceWithUser(placeId, collaboratorEmail)
      );

      await Promise.all(unsharePromises);

      // Update user documents to remove sharing relationship
      await this.removeSharingRelationship(ownerEmail, collaboratorEmail);
    } catch (error) {
      console.error('Error unsharing all places:', error);
      throw error;
    }
  }

  /**
   * Update sharing relationship between users
   * @param {string} ownerEmail - Owner's email
   * @param {string} collaboratorEmail - Collaborator's email
   * @returns {Promise<void>}
   */
  static async updateSharingRelationship(ownerEmail, collaboratorEmail) {
    try {
      const ownerRef = doc(db, USERS_COLLECTION, ownerEmail);
      const collaboratorRef = doc(db, USERS_COLLECTION, collaboratorEmail);

      const batch = writeBatch(db);

      // Get current data
      const [ownerDoc, collaboratorDoc] = await Promise.all([
        getDoc(ownerRef),
        getDoc(collaboratorRef)
      ]);

      const ownerData = ownerDoc.data() || {};
      const collaboratorData = collaboratorDoc.data() || {};

      const sharedWith = ownerData.sharedWith || [];
      const sharedFrom = collaboratorData.sharedFrom || [];

      if (!sharedWith.includes(collaboratorEmail)) {
        batch.update(ownerRef, {
          sharedWith: [...sharedWith, collaboratorEmail],
          updatedAt: new Date()
        });
      }

      if (!sharedFrom.includes(ownerEmail)) {
        batch.update(collaboratorRef, {
          sharedFrom: [...sharedFrom, ownerEmail],
          updatedAt: new Date()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error updating sharing relationship:', error);
      throw error;
    }
  }

  /**
   * Remove sharing relationship between users
   * @param {string} ownerEmail - Owner's email
   * @param {string} collaboratorEmail - Collaborator's email
   * @returns {Promise<void>}
   */
  static async removeSharingRelationship(ownerEmail, collaboratorEmail) {
    try {
      const ownerRef = doc(db, USERS_COLLECTION, ownerEmail);
      const collaboratorRef = doc(db, USERS_COLLECTION, collaboratorEmail);

      const batch = writeBatch(db);

      const [ownerDoc, collaboratorDoc] = await Promise.all([
        getDoc(ownerRef),
        getDoc(collaboratorRef)
      ]);

      const ownerData = ownerDoc.data() || {};
      const collaboratorData = collaboratorDoc.data() || {};

      const sharedWith = (ownerData.sharedWith || []).filter(e => e !== collaboratorEmail);
      const sharedFrom = (collaboratorData.sharedFrom || []).filter(e => e !== ownerEmail);

      batch.update(ownerRef, {
        sharedWith,
        updatedAt: new Date()
      });

      batch.update(collaboratorRef, {
        sharedFrom,
        updatedAt: new Date()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing sharing relationship:', error);
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
   * Migrate legacy markers (old collection) to new structure
   * @param {string} userId - The user's ID to assign legacy markers to
   * @returns {Promise<number>} Number of markers migrated
   */
  static async migrateLegacyMarkers(userId) {
    try {
      // Check if old 'markers' collection exists
      const legacyQuery = query(collection(db, 'markers'));
      const legacySnapshot = await getDocs(legacyQuery);

      if (legacySnapshot.empty) {
        return 0;
      }

      let migratedCount = 0;

      for (const legacyDoc of legacySnapshot.docs) {
        const legacyData = legacyDoc.data();

        // Skip if already migrated or belongs to someone else
        if (legacyData.owner || (legacyData.userId && legacyData.userId !== userId)) {
          continue;
        }

        try {
          // Create new place with access control
          const batch = writeBatch(db);

          const placeRef = doc(collection(db, PLACES_COLLECTION));
          batch.set(placeRef, {
            ...legacyData,
            owner: userId,
            access: {
              [userId]: ROLES.OWNER
            },
            updatedAt: new Date()
          });

          // Create access control record
          const accessRef = doc(db, PLACES_COLLECTION, placeRef.id, 'access', userId);
          batch.set(accessRef, {
            role: ROLES.OWNER,
            grantedAt: new Date()
          });

          // Create user's accessible places index
          const userAccessRef = doc(db, USERS_COLLECTION, userId, 'accessiblePlaces', placeRef.id);
          batch.set(userAccessRef, {
            role: ROLES.OWNER,
            grantedAt: new Date()
          });

          await batch.commit();
          migratedCount++;

          // Delete old marker
          await deleteDoc(doc(db, 'markers', legacyDoc.id));
        } catch (error) {
          console.error(`Error migrating marker ${legacyDoc.id}:`, error);
        }
      }

      console.log(`Migrated ${migratedCount} legacy markers to user ${userId}`);
      return migratedCount;
    } catch (error) {
      console.error('Error migrating legacy markers:', error);
      return 0;
    }
  }
}

export default PlacesService;
