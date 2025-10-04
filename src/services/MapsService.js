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
  Timestamp,
  FieldPath
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
      access: {
        [ownerId]: ROLES.OWNER
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const batch = writeBatch(db);

    // Create map document
    batch.set(mapRef, mapData);

    // Create user's map index entry
    const userMapRef = doc(db, 'users', ownerId, 'maps', mapRef.id);
    batch.set(userMapRef, {
      role: ROLES.OWNER,
      grantedAt: Timestamp.now()
    });

    await batch.commit();

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
    const userMapsRef = collection(db, 'users', userId, 'maps');
    const userMapsSnapshot = await getDocs(userMapsRef);

    if (userMapsSnapshot.empty) {
      return [];
    }

    // Fetch actual map documents
    const mapPromises = userMapsSnapshot.docs.map(async (userMapDoc) => {
      const mapId = userMapDoc.id;
      const role = userMapDoc.data().role;

      const mapDoc = await getDoc(doc(db, 'maps', mapId));
      if (mapDoc.exists()) {
        return {
          id: mapDoc.id,
          ...mapDoc.data(),
          userRole: role
        };
      }
      return null;
    });

    const maps = (await Promise.all(mapPromises)).filter(m => m !== null);
    return maps;
  } catch (error) {
    console.error('Error getting user maps:', error);
    throw error;
  }
};

/**
 * Subscribe to user's maps in real-time
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with maps array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserMaps = (userId, callback) => {
  try {
    const userMapsRef = collection(db, 'users', userId, 'maps');

    return onSnapshot(userMapsRef, async (snapshot) => {
      try {
        if (snapshot.empty) {
          callback([]);
          return;
        }

        const mapPromises = snapshot.docs.map(async (userMapDoc) => {
          const mapId = userMapDoc.id;
          const role = userMapDoc.data().role;

          const mapDoc = await getDoc(doc(db, 'maps', mapId));
          if (mapDoc.exists()) {
            return {
              id: mapDoc.id,
              ...mapDoc.data(),
              userRole: role
            };
          }
          return null;
        });

        const maps = (await Promise.all(mapPromises)).filter(m => m !== null);
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

    // Get map to find all users with access
    const mapDoc = await getDoc(doc(db, 'maps', mapId));
    if (!mapDoc.exists()) {
      throw new Error('Map not found');
    }

    const mapData = mapDoc.data();
    const userIds = Object.keys(mapData.access || {});

    // Delete map document
    batch.delete(doc(db, 'maps', mapId));

    // Delete from all users' map indexes
    for (const userId of userIds) {
      const userMapRef = doc(db, 'users', userId, 'maps', mapId);
      batch.delete(userMapRef);
    }

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
 * @param {string} userId - User ID to share with
 * @param {string} role - Role to grant
 * @returns {Promise<void>}
 */
export const shareMapWithUser = async (mapId, userId, role = ROLES.VIEWER) => {
  try {
    const batch = writeBatch(db);

    // Update map's access field
    const mapRef = doc(db, 'maps', mapId);
    batch.update(mapRef, {
      [new FieldPath('access', userId)]: role,
      updatedAt: Timestamp.now()
    });

    // Add to user's maps index
    const userMapRef = doc(db, 'users', userId, 'maps', mapId);
    batch.set(userMapRef, {
      role,
      grantedAt: Timestamp.now()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error sharing map:', error);
    throw error;
  }
};

/**
 * Unshare a map with a user
 * @param {string} mapId - Map ID
 * @param {string} userId - User ID to unshare from
 * @returns {Promise<void>}
 */
export const unshareMapWithUser = async (mapId, userId) => {
  try {
    const batch = writeBatch(db);

    // Remove from map's access field
    const mapRef = doc(db, 'maps', mapId);
    const mapDoc = await getDoc(mapRef);

    if (mapDoc.exists()) {
      const mapData = mapDoc.data();
      const newAccess = { ...mapData.access };
      delete newAccess[userId];

      batch.update(mapRef, {
        access: newAccess,
        updatedAt: Timestamp.now()
      });
    }

    // Remove from user's maps index
    const userMapRef = doc(db, 'users', userId, 'maps', mapId);
    batch.delete(userMapRef);

    await batch.commit();
  } catch (error) {
    console.error('Error unsharing map:', error);
    throw error;
  }
};

/**
 * Get user's role for a map
 * @param {string} userId - User ID
 * @param {string} mapId - Map ID
 * @returns {Promise<string|null>} Role or null
 */
export const getUserMapRole = async (userId, mapId) => {
  try {
    const userMapDoc = await getDoc(doc(db, 'users', userId, 'maps', mapId));
    if (userMapDoc.exists()) {
      return userMapDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user map role:', error);
    throw error;
  }
};

/**
 * Check if user is map owner
 * @param {string} userId - User ID
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

    return Object.entries(access).map(([userId, role]) => ({
      userId,
      role
    }));
  } catch (error) {
    console.error('Error getting map collaborators:', error);
    return [];
  }
};

/**
 * Get list of users who shared their maps with current user
 * @param {string} userId - User ID
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
 * @param {string} userId - User ID
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
