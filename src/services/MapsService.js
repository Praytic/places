import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
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
 * Generate a map document ID from userId and placeId
 * Format: {userId}_{placeId}
 */
export const generateMapId = (userId, placeId) => {
  return `${userId}_${placeId}`;
};

/**
 * Parse a map document ID into userId and placeId
 */
export const parseMapId = (mapId) => {
  const parts = mapId.split('_');
  if (parts.length < 2) {
    throw new Error('Invalid map ID format');
  }
  // Handle case where userId might contain underscores (email)
  const placeId = parts[parts.length - 1];
  const userId = parts.slice(0, -1).join('_');
  return { userId, placeId };
};

/**
 * Create a new map entry (user-place access binding)
 */
export const createMap = async (placeId, userId, role = ROLES.VIEWER) => {
  try {
    const mapId = generateMapId(userId, placeId);
    const mapRef = doc(db, 'maps', mapId);

    const mapData = {
      id: mapId,
      placeId,
      userId,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(mapRef, mapData);
    return mapData;
  } catch (error) {
    console.error('Error creating map:', error);
    throw error;
  }
};

/**
 * Get a specific map entry
 */
export const getMap = async (userId, placeId) => {
  try {
    const mapId = generateMapId(userId, placeId);
    const mapRef = doc(db, 'maps', mapId);
    const mapSnap = await getDoc(mapRef);

    if (mapSnap.exists()) {
      return { id: mapSnap.id, ...mapSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting map:', error);
    throw error;
  }
};

/**
 * Get all maps for a specific user (all places they have access to)
 */
export const getUserMaps = async (userId) => {
  try {
    const mapsRef = collection(db, 'maps');
    const q = query(
      mapsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user maps:', error);
    throw error;
  }
};

/**
 * Get all maps for a specific place (all users who have access)
 */
export const getPlaceMaps = async (placeId) => {
  try {
    const mapsRef = collection(db, 'maps');
    const q = query(
      mapsRef,
      where('placeId', '==', placeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting place maps:', error);
    throw error;
  }
};

/**
 * Update a map entry's role
 */
export const updateMapRole = async (userId, placeId, newRole) => {
  try {
    const mapId = generateMapId(userId, placeId);
    const mapRef = doc(db, 'maps', mapId);

    await setDoc(mapRef, {
      role: newRole,
      updatedAt: Timestamp.now()
    }, { merge: true });

    return await getMap(userId, placeId);
  } catch (error) {
    console.error('Error updating map role:', error);
    throw error;
  }
};

/**
 * Delete a map entry
 */
export const deleteMap = async (userId, placeId) => {
  try {
    const mapId = generateMapId(userId, placeId);
    const mapRef = doc(db, 'maps', mapId);
    await deleteDoc(mapRef);
  } catch (error) {
    console.error('Error deleting map:', error);
    throw error;
  }
};

/**
 * Delete all maps for a specific place (when place is deleted)
 */
export const deletePlaceMaps = async (placeId) => {
  try {
    const placeMaps = await getPlaceMaps(placeId);

    if (placeMaps.length === 0) {
      return;
    }

    const batch = writeBatch(db);

    placeMaps.forEach(map => {
      const mapRef = doc(db, 'maps', map.id);
      batch.delete(mapRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting place maps:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for a user's maps
 */
export const subscribeToUserMaps = (userId, callback) => {
  try {
    const mapsRef = collection(db, 'maps');
    const q = query(
      mapsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const maps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(maps);
    }, (error) => {
      console.error('Error in maps subscription:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error subscribing to user maps:', error);
    throw error;
  }
};

/**
 * Check if a user has access to a place and return their role
 */
export const getUserPlaceRole = async (userId, placeId) => {
  try {
    const map = await getMap(userId, placeId);
    return map ? map.role : null;
  } catch (error) {
    console.error('Error getting user place role:', error);
    throw error;
  }
};

/**
 * Check if a user is the owner of a place
 */
export const isPlaceOwner = async (userId, placeId) => {
  try {
    const role = await getUserPlaceRole(userId, placeId);
    return role === ROLES.OWNER;
  } catch (error) {
    console.error('Error checking place ownership:', error);
    throw error;
  }
};

/**
 * Get owner of a place
 */
export const getPlaceOwner = async (placeId) => {
  try {
    const placeMaps = await getPlaceMaps(placeId);
    const ownerMap = placeMaps.find(map => map.role === ROLES.OWNER);
    return ownerMap ? ownerMap.userId : null;
  } catch (error) {
    console.error('Error getting place owner:', error);
    throw error;
  }
};

/**
 * Share a place with a user (create map entry for them)
 */
export const sharePlaceWithUser = async (placeId, ownerUserId, collaboratorUserId, role = ROLES.VIEWER) => {
  try {
    // Verify the owner has ownership
    const isOwner = await isPlaceOwner(ownerUserId, placeId);
    if (!isOwner) {
      throw new Error('Only the place owner can share access');
    }

    // Create map entry for collaborator
    return await createMap(placeId, collaboratorUserId, role);
  } catch (error) {
    console.error('Error sharing place:', error);
    throw error;
  }
};

/**
 * Unshare a place with a user (remove their map entry)
 */
export const unsharePlaceWithUser = async (placeId, ownerUserId, collaboratorUserId) => {
  try {
    // Verify the owner has ownership
    const isOwner = await isPlaceOwner(ownerUserId, placeId);
    if (!isOwner) {
      throw new Error('Only the place owner can revoke access');
    }

    // Don't allow owner to remove their own access
    if (ownerUserId === collaboratorUserId) {
      throw new Error('Cannot remove owner access');
    }

    // Delete the collaborator's map entry
    await deleteMap(collaboratorUserId, placeId);
  } catch (error) {
    console.error('Error unsharing place:', error);
    throw error;
  }
};

/**
 * Get all places owned by a user
 */
export const getUserOwnedPlaces = async (userId) => {
  try {
    const userMaps = await getUserMaps(userId);
    return userMaps.filter(map => map.role === ROLES.OWNER);
  } catch (error) {
    console.error('Error getting user owned places:', error);
    throw error;
  }
};

/**
 * Share all owned places with a user
 */
export const shareAllPlacesWithUser = async (ownerUserId, collaboratorUserId, role = ROLES.VIEWER) => {
  try {
    const ownedPlaces = await getUserOwnedPlaces(ownerUserId);

    if (ownedPlaces.length === 0) {
      return;
    }

    const batch = writeBatch(db);

    ownedPlaces.forEach(map => {
      const mapId = generateMapId(collaboratorUserId, map.placeId);
      const mapRef = doc(db, 'maps', mapId);

      batch.set(mapRef, {
        id: mapId,
        placeId: map.placeId,
        userId: collaboratorUserId,
        role,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error sharing all places:', error);
    throw error;
  }
};

/**
 * Unshare all owned places with a user
 */
export const unshareAllPlacesWithUser = async (ownerUserId, collaboratorUserId) => {
  try {
    const ownedPlaces = await getUserOwnedPlaces(ownerUserId);

    if (ownedPlaces.length === 0) {
      return;
    }

    const batch = writeBatch(db);

    ownedPlaces.forEach(map => {
      const mapId = generateMapId(collaboratorUserId, map.placeId);
      const mapRef = doc(db, 'maps', mapId);
      batch.delete(mapRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error unsharing all places:', error);
    throw error;
  }
};