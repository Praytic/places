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
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import * as MapViewService from './MapViewService';
import { UserMap, UserRole } from '../shared/types/domain';

/**
 * Extended PlaceMap with userRole
 */
export interface PlaceMapWithRole extends UserMap {
  userRole: UserRole;
  mapViewId?: string;
  displayedName?: string;
}

/**
 * Get count of maps owned by user
 * @param userId - User email
 * @returns Number of maps owned by user
 */
export const getUserMapCount = async (userId: string): Promise<number> => {
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
 * @param ownerId - Owner's user ID (email)
 * @param name - Optional map name
 * @returns The created map
 */
export const createMap = async (
  ownerId: string,
  name: string = 'My Places',
): Promise<UserMap> => {
  try {
    // Check if user can create more maps (client-side validation)
    const mapCount = await getUserMapCount(ownerId);
    if (mapCount >= 5) {
      throw new Error('Maximum of 5 maps allowed per user');
    }

    const mapRef = doc(collection(db, 'maps'));
    const mapData: UserMap = {
      id: mapRef.id,
      name,
      owner: ownerId,
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
 * @param mapId - Map ID
 * @returns Map data or null
 */
export const getMap = async (mapId: string): Promise<UserMap | null> => {
  try {
    const mapDoc = await getDoc(doc(db, 'maps', mapId));
    if (mapDoc.exists()) {
      return { id: mapDoc.id, ...mapDoc.data() } as UserMap;
    }
    return null;
  } catch (error) {
    console.error('Error getting map:', error);
    throw error;
  }
};

/**
 * Get all maps accessible to a user
 * @param userId - User ID (email)
 * @returns Array of maps with user's role
 */
export const getUserMaps = async (userId: string): Promise<PlaceMapWithRole[]> => {
  try {
    // Fetch owned maps
    const ownedMapsQuery = query(
      collection(db, 'maps'),
      where('owner', '==', userId)
    );
    const ownedMapsSnapshot = await getDocs(ownedMapsQuery);
    const ownedMaps: PlaceMapWithRole[] = ownedMapsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      userRole: UserRole.OWNER
    } as PlaceMapWithRole));

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
 * @param userId - User ID (email)
 * @param callback - Callback with maps array
 * @returns Unsubscribe function
 */
export const subscribeToUserMaps = (
  userId: string,
  callback: (maps: PlaceMapWithRole[]) => void
): Unsubscribe => {
  try {
    let ownedMaps: PlaceMapWithRole[] = [];
    let sharedMaps: PlaceMapWithRole[] = [];

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
        userRole: UserRole.OWNER
      } as PlaceMapWithRole));
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
 * @param mapId - Map ID
 * @param updates - Fields to update
 */
export const updateMap = async (
  mapId: string,
  updates: Partial<Omit<UserMap, 'id' | 'owner' | 'createdAt'>>
): Promise<void> => {
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
 * @param mapId - Map ID
 */
export const deleteMap = async (mapId: string): Promise<void> => {
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
 * @param mapId - Map ID
 * @param userId - User ID (email) to share with
 * @param role - Role to grant
 */
export const shareMapWithUser = async (
  mapId: string,
  userId: string,
  role: UserRole = UserRole.VIEW
): Promise<void> => {
  try {
    // Get the map to get its name
    const map = await getMap(mapId);
    if (!map) {
      throw new Error('Map not found');
    }

    // Don't create MapView for owner - they work directly with the Map entity
    if (map.owner === userId) {
      return;
    }

    // Check if mapView already exists
    const existingMapView = await MapViewService.getMapView(mapId, userId);

    if (existingMapView) {
      // Update existing mapView role
      // MapView ID is now composite: {mapId}_{userId}
      const compositeId = `${mapId}_${userId}`;
      await MapViewService.updateMapViewRole(compositeId, role);
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
 * @param mapId - Map ID
 * @param userId - User ID (email) to unshare from
 */
export const unshareMapWithUser = async (mapId: string, userId: string): Promise<void> => {
  try {
    // MapView ID is composite: {mapId}_{userId}
    const compositeId = `${mapId}_${userId}`;

    // Direct delete using composite ID (no need to check existence first)
    await MapViewService.deleteMapView(compositeId);
  } catch (error) {
    // Silently ignore if mapView doesn't exist
    if ((error as any).code !== 'not-found') {
      console.error('Error unsharing map:', error);
      throw error;
    }
  }
};

/**
 * Get user's role for a map
 * @param userId - User ID (email)
 * @param mapId - Map ID
 * @returns Role or null
 */
export const getUserMapRole = async (userId: string, mapId: string): Promise<UserRole | null> => {
  try {
    // First check if user is the owner (owners don't have MapViews)
    const map = await getMap(mapId);
    if (map && map.owner === userId) {
      return UserRole.OWNER;
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
 * @param userId - User ID (email)
 * @param mapId - Map ID
 */
export const isMapOwner = async (userId: string, mapId: string): Promise<boolean> => {
  try {
    const map = await getMap(mapId);
    return map ? map.owner === userId : false;
  } catch (error) {
    console.error('Error checking map ownership:', error);
    return false;
  }
};

/**
 * Collaborator information
 */
export interface MapCollaborator {
  userId: string;
  userRole: UserRole;
  mapViewId?: string;
  displayedName?: string;
}

/**
 * Get all users with access to a map
 * @param mapId - Map ID
 * @returns Array of collaborator objects
 */
export const getMapCollaborators = async (mapId: string): Promise<MapCollaborator[]> => {
  try {
    return await MapViewService.getMapViewsForMap(mapId);
  } catch (error) {
    console.error('Error getting map collaborators:', error);
    return [];
  }
};

/**
 * Get list of users who shared their maps with current user
 * @param userId - User ID (email)
 * @returns Array of user emails
 */
export const getSharedFromUsers = async (userId: string): Promise<string[]> => {
  try {
    const maps = await getUserMaps(userId);

    const sharedFromSet = new Set<string>();
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
 * @param userId - User ID (email)
 * @returns Array of user emails
 */
export const getSharedWithUsers = async (userId: string): Promise<string[]> => {
  try {
    const maps = await getUserMaps(userId);
    const ownedMaps = maps.filter(m => m.owner === userId);

    const sharedWithSet = new Set<string>();

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
