import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as MapViewService from './MapViewService';

// Role constants
export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

/**
 * Get count of maps owned by user
 * @param {string} userId - User email
 * @returns {Promise<number>} Number of maps owned by user
 */
export const getUserMapCount = async (userId) => {
  try {
    const q = query(collection(db, 'maps'), where('owner', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting user map count:', error);
    return 0;
  }
};

/**
 * Create a new map (container for places)
 * @param {string} ownerId - Owner's user ID (email)
 * @param {string} name - Optional map name
 * @param {boolean} isDefault - Whether this is the user's default map
 * @returns {Promise<Object>} The created map
 */
export const createMap = async (ownerId, name = 'My Places', isDefault = false) => {
  try {
    // Check if user can create more maps (client-side validation)
    const mapCount = await getUserMapCount(ownerId);
    if (mapCount >= 5) {
      throw new Error('Maximum of 5 maps allowed per user');
    }

    const mapRef = doc(collection(db, 'maps'));
    const mapData = {
      id: mapRef.id,
      name,
      owner: ownerId,
      isDefault,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Create map document
    await setDoc(mapRef, mapData);

    // Note: Owners don't get MapViews - they work directly with the Map entity
    // MapViews are only created when sharing with other users

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
    // Fetch owned maps
    const ownedMapsQuery = query(
      collection(db, 'maps'),
      where('owner', '==', userId)
    );
    const ownedMapsSnapshot = await getDocs(ownedMapsQuery);
    const ownedMaps = ownedMapsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      userRole: ROLES.OWNER
    }));

    // Fetch shared maps (via MapViews)
    const sharedMaps = await MapViewService.getUserMapViews(userId);

    // Combine and return
    return [...ownedMaps, ...sharedMaps];
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
    let ownedMaps = [];
    let sharedMaps = [];

    const updateCallback = () => {
      callback([...ownedMaps, ...sharedMaps]);
    };

    // Subscribe to owned maps
    const ownedMapsQuery = query(
      collection(db, 'maps'),
      where('owner', '==', userId)
    );
    const unsubscribeOwned = onSnapshot(ownedMapsQuery, (snapshot) => {
      ownedMaps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userRole: ROLES.OWNER
      }));
      updateCallback();
    });

    // Subscribe to shared maps (via MapViews)
    const unsubscribeShared = MapViewService.subscribeToUserMapViews(userId, (maps) => {
      sharedMaps = maps;
      updateCallback();
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeOwned();
      unsubscribeShared();
    };
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
    // Delete all mapViews for this map FIRST (before deleting the map)
    // This is necessary because the Firestore rules check map ownership by fetching the map document
    await MapViewService.deleteMapViewsForMap(mapId);

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
    // Get the map to get its name
    const map = await getMap(mapId);
    if (!map) {
      throw new Error('Map not found');
    }

    // Don't create MapView for owner - they work directly with the Map entity
    if (map.owner === userId) {
      console.log('Skipping MapView creation for owner - they access the map directly');
      return;
    }

    // Check if mapView already exists
    const existingMapView = await MapViewService.getMapView(mapId, userId);

    if (existingMapView) {
      // Update existing mapView role
      await MapViewService.updateMapViewRole(existingMapView.id, role);
    } else {
      // Create new mapView
      await MapViewService.createMapView(mapId, userId, role, map.name);
    }
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
    const mapView = await MapViewService.getMapView(mapId, userId);
    if (mapView) {
      await MapViewService.deleteMapView(mapView.id);
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
    // First check if user is the owner (owners don't have MapViews)
    const map = await getMap(mapId);
    if (map && map.owner === userId) {
      return ROLES.OWNER;
    }

    // Then check MapViews for shared access
    return await MapViewService.getUserMapRole(userId, mapId);
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
    const map = await getMap(mapId);
    return map ? map.owner === userId : false;
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
    return await MapViewService.getMapViewsForMap(mapId);
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

