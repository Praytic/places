import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Role constants
export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

/**
 * Create a new map (container for places)
 * @param {string} ownerId - Owner's user ID (email)
 * @param {string} name - Optional map name
 * @returns {Promise<Object>} The created map
 */
export const createMap = async (ownerId, name = 'My Places') => {
  try {
    const mapRef = doc(collection(db, 'maps'));
    const mapData = {
      id: mapRef.id,
      name,
      owner: ownerId,
      accessList: [ownerId],
      access: {
        [ownerId]: ROLES.OWNER
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Create map document
    await setDoc(mapRef, mapData);

    return mapData;
  } catch (error) {
    console.error('Error creating map:', error);
    throw error;
  }
};

/**
 * Get a map by ID
 * @param {string} mapId - Map ID
 * @returns {Promise<Object|null>} Map data or null
 */
export const getMap = async (mapId) => {
  try {
    const mapDoc = await getDoc(doc(db, 'maps', mapId));
    if (mapDoc.exists()) {
      return { id: mapDoc.id, ...mapDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting map:', error);
    throw error;
  }
};

/**
 * Get all maps accessible to a user
 * @param {string} userId - User ID (email)
 * @returns {Promise<Array>} Array of maps with user's role
 */
export const getUserMaps = async (userId) => {
  try {
    // Query maps where user is in accessList array
    const q = query(collection(db, 'maps'), where('accessList', 'array-contains', userId));
    const mapsSnapshot = await getDocs(q);

    if (mapsSnapshot.empty) {
      return [];
    }

    // Map to include user's role
    const maps = mapsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .map(map => ({
        ...map,
        userRole: map.access[userId]
      }));

    return maps;
  } catch (error) {
    console.error('Error getting user maps:', error);
    throw error;
  }
};

/**
 * Subscribe to user's maps in real-time
 * @param {string} userId - User ID (email)
 * @param {Function} callback - Callback with maps array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserMaps = (userId, callback) => {
  try {
    // Subscribe to maps where user is in accessList array
    const q = query(collection(db, 'maps'), where('accessList', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
      try {
        if (snapshot.empty) {
          callback([]);
          return;
        }

        // Map to include user's role
        const maps = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .map(map => ({
            ...map,
            userRole: map.access[userId]
          }));

        callback(maps);
      } catch (error) {
        console.error('Error in maps subscription:', error);
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error subscribing to user maps:', error);
    return () => {};
  }
};

/**
 * Update map details
 * @param {string} mapId - Map ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateMap = async (mapId, updates) => {
  try {
    const mapRef = doc(db, 'maps', mapId);
    await setDoc(mapRef, {
      ...updates,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating map:', error);
    throw error;
  }
};

/**
 * Delete a map and all its places
 * @param {string} mapId - Map ID
 * @returns {Promise<void>}
 */
export const deleteMap = async (mapId) => {
  try {
    const batch = writeBatch(db);

    // Delete map document
    batch.delete(doc(db, 'maps', mapId));

    // Delete all places in this map
    const placesQuery = query(collection(db, 'places'), where('mapId', '==', mapId));
    const placesSnapshot = await getDocs(placesQuery);

    placesSnapshot.docs.forEach((placeDoc) => {
      batch.delete(placeDoc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting map:', error);
    throw error;
  }
};

/**
 * Share a map with a user
 * @param {string} mapId - Map ID
 * @param {string} userId - User ID (email) to share with
 * @param {string} role - Role to grant
 * @returns {Promise<void>}
 */
export const shareMapWithUser = async (mapId, userId, role = ROLES.VIEWER) => {
  try {
    const mapRef = doc(db, 'maps', mapId);
    const mapDoc = await getDoc(mapRef);

    if (!mapDoc.exists()) {
      throw new Error('Map not found');
    }

    const mapData = mapDoc.data();
    const newAccessList = mapData.accessList || [];
    const newAccess = { ...(mapData.access || {}) };

    // Add user to accessList if not already present
    if (!newAccessList.includes(userId)) {
      newAccessList.push(userId);
    }

    // Update the role in access object
    newAccess[userId] = role;

    // Update both accessList and access role
    await setDoc(mapRef, {
      accessList: newAccessList,
      access: newAccess,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error sharing map:', error);
    throw error;
  }
};

/**
 * Unshare a map with a user
 * @param {string} mapId - Map ID
 * @param {string} userId - User ID (email) to unshare from
 * @returns {Promise<void>}
 */
export const unshareMapWithUser = async (mapId, userId) => {
  try {
    const mapRef = doc(db, 'maps', mapId);
    const mapDoc = await getDoc(mapRef);

    if (mapDoc.exists()) {
      const mapData = mapDoc.data();
      const newAccess = { ...mapData.access };
      delete newAccess[userId];

      // Remove user from accessList
      const newAccessList = (mapData.accessList || []).filter(id => id !== userId);

      await setDoc(mapRef, {
        access: newAccess,
        accessList: newAccessList,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error unsharing map:', error);
    throw error;
  }
};

/**
 * Get user's role for a map
 * @param {string} userId - User ID (email)
 * @param {string} mapId - Map ID
 * @returns {Promise<string|null>} Role or null
 */
export const getUserMapRole = async (userId, mapId) => {
  try {
    const mapDoc = await getDoc(doc(db, 'maps', mapId));
    if (mapDoc.exists()) {
      const mapData = mapDoc.data();
      return mapData.access?.[userId] || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user map role:', error);
    throw error;
  }
};

/**
 * Check if user is map owner
 * @param {string} userId - User ID (email)
 * @param {string} mapId - Map ID
 * @returns {Promise<boolean>}
 */
export const isMapOwner = async (userId, mapId) => {
  try {
    const role = await getUserMapRole(userId, mapId);
    return role === ROLES.OWNER;
  } catch (error) {
    console.error('Error checking map ownership:', error);
    return false;
  }
};

/**
 * Get all users with access to a map
 * @param {string} mapId - Map ID
 * @returns {Promise<Array>} Array of {userId, role} objects
 */
export const getMapCollaborators = async (mapId) => {
  try {
    const mapDoc = await getDoc(doc(db, 'maps', mapId));
    if (!mapDoc.exists()) {
      return [];
    }

    const mapData = mapDoc.data();
    const access = mapData.access || {};

    return Object.entries(access).map(([userId, userRole]) => ({
      userId,
      userRole
    }));
  } catch (error) {
    console.error('Error getting map collaborators:', error);
    return [];
  }
};

/**
 * Get list of users who shared their maps with current user
 * @param {string} userId - User ID (email)
 * @returns {Promise<Array<string>>} Array of user emails
 */
export const getSharedFromUsers = async (userId) => {
  try {
    const maps = await getUserMaps(userId);

    const sharedFromSet = new Set();
    maps.forEach(map => {
      if (map.owner !== userId) {
        sharedFromSet.add(map.owner);
      }
    });

    return Array.from(sharedFromSet);
  } catch (error) {
    console.error('Error getting shared from users:', error);
    return [];
  }
};

/**
 * Get list of users who current user shared maps with
 * @param {string} userId - User ID (email)
 * @returns {Promise<Array<string>>} Array of user emails
 */
export const getSharedWithUsers = async (userId) => {
  try {
    const maps = await getUserMaps(userId);
    const ownedMaps = maps.filter(m => m.owner === userId);

    const sharedWithSet = new Set();

    for (const map of ownedMaps) {
      const collaborators = await getMapCollaborators(map.id);
      collaborators.forEach(collab => {
        if (collab.userId !== userId) {
          sharedWithSet.add(collab.userId);
        }
      });
    }

    return Array.from(sharedWithSet);
  } catch (error) {
    console.error('Error getting shared with users:', error);
    return [];
  }
};
