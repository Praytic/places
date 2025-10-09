import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
  Unsubscribe,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { MapView, UserRole } from '../shared/types/domain';
import { PlaceMapWithRole, MapCollaborator } from './MapsService';

// Role constants (re-exported from MapsService for consistency)
export const ROLES = {
  OWNER: 'owner' as UserRole,
  EDITOR: 'edit' as UserRole,
  VIEWER: 'viewer' as UserRole
};

/**
 * Create a new mapView (access record for a user to a map)
 * @param mapId - Map ID
 * @param collaborator - User email
 * @param role - User's role (owner/edit/viewer)
 * @param displayedName - Map name to display for this user
 * @returns The created mapView
 */
export const createMapView = async (
  mapId: string,
  collaborator: string,
  role: UserRole,
  displayedName: string
): Promise<MapView> => {
  try {
    // Use collaborator email as the view document ID
    const mapViewRef = doc(db, 'maps', mapId, 'views', collaborator);
    const mapViewData: MapView = {
      id: collaborator,
      mapId,
      collaborator,
      role,
      displayName: displayedName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(mapViewRef, mapViewData);
    return mapViewData;
  } catch (error) {
    console.error('Error creating mapView:', error);
    throw error;
  }
};

/**
 * Update a mapView's role
 * @param mapId - Map ID
 * @param collaborator - User email
 * @param newRole - New role
 */
export const updateMapViewRole = async (mapId: string, collaborator: string, newRole: UserRole): Promise<void> => {
  try {
    const mapViewRef = doc(db, 'maps', mapId, 'views', collaborator);
    await updateDoc(mapViewRef, {
      role: newRole,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating mapView role:', error);
    throw error;
  }
};

/**
 * Update a mapView's displayed name
 * @param mapId - Map ID
 * @param collaborator - User email
 * @param newDisplayedName - New displayed name
 */
export const updateMapViewDisplayedName = async (
  mapId: string,
  collaborator: string,
  newDisplayedName: string
): Promise<void> => {
  try {
    const mapViewRef = doc(db, 'maps', mapId, 'views', collaborator);
    await updateDoc(mapViewRef, {
      displayName: newDisplayedName,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating mapView displayed name:', error);
    throw error;
  }
};

/**
 * Delete a mapView
 * @param mapId - Map ID
 * @param collaborator - User email
 */
export const deleteMapView = async (mapId: string, collaborator: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'maps', mapId, 'views', collaborator));
  } catch (error) {
    console.error('Error deleting mapView:', error);
    throw error;
  }
};

/**
 * Get a specific mapView by mapId and collaborator
 * @param mapId - Map ID
 * @param collaborator - User email
 * @returns MapView or null if not found
 */
export const getMapView = async (mapId: string, collaborator: string): Promise<MapView | null> => {
  try {
    const mapViewRef = doc(db, 'maps', mapId, 'views', collaborator);
    const mapViewDoc = await getDoc(mapViewRef);

    if (!mapViewDoc.exists()) {
      return null;
    }

    return { id: mapViewDoc.id, ...mapViewDoc.data() } as MapView;
  } catch (error) {
    console.error('Error getting mapView:', error);
    throw error;
  }
};

/**
 * Get all mapViews for a user (with full map data joined)
 * @param userId - User email
 * @returns Array of maps with userRole
 */
export const getUserMapViews = async (userId: string): Promise<PlaceMapWithRole[]> => {
  try {
    // Query only views for this specific user using where clause
    const viewsQuery = query(
      collectionGroup(db, 'views'),
      where('collaborator', '==', userId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);

    if (viewsSnapshot.empty) {
      return [];
    }

    // Get all unique map IDs
    const mapIds = [...new Set(viewsSnapshot.docs.map(doc => doc.data()['mapId']))];

    // Fetch all maps in parallel
    const mapPromises = mapIds.map(mapId => getDoc(doc(db, 'maps', mapId)));
    const mapDocs = await Promise.all(mapPromises);

    // Create a map lookup
    const mapsById: Record<string, any> = {};
    mapDocs.forEach(mapDoc => {
      if (mapDoc.exists()) {
        mapsById[mapDoc.id] = { id: mapDoc.id, ...mapDoc.data() };
      }
    });

    // Join mapViews with maps
    const result = viewsSnapshot.docs
      .map(mapViewDoc => {
        const mapViewData = mapViewDoc.data();
        const mapData = mapsById[mapViewData['mapId']];

        if (!mapData) {
          return null; // Skip if map was deleted
        }

        return {
          ...mapData,
          userRole: mapViewData['role'],
          displayedName: mapViewData['displayName'],
          mapViewId: mapViewDoc.id
        } as PlaceMapWithRole;
      })
      .filter((item): item is PlaceMapWithRole => item !== null);

    return result;
  } catch (error) {
    console.error('Error getting user mapViews:', error);
    throw error;
  }
};

/**
 * Subscribe to user's mapViews in real-time
 * @param userId - User email
 * @param callback - Callback with maps array
 * @returns Unsubscribe function
 */
export const subscribeToUserMapViews = (
  userId: string,
  callback: (maps: PlaceMapWithRole[]) => void
): Unsubscribe => {
  try {
    // Query only views for this specific user using where clause
    const viewsQuery = query(
      collectionGroup(db, 'views'),
      where('collaborator', '==', userId)
    );

    return onSnapshot(viewsQuery, async (viewsSnapshot) => {
      try {
        if (viewsSnapshot.empty) {
          callback([]);
          return;
        }

        // Get all unique map IDs
        const mapIds = [...new Set(viewsSnapshot.docs.map(doc => doc.data()['mapId']))];

        // Fetch all maps in parallel
        const mapPromises = mapIds.map(mapId => getDoc(doc(db, 'maps', mapId)));
        const mapDocs = await Promise.all(mapPromises);

        // Create a map lookup
        const mapsById: Record<string, any> = {};
        mapDocs.forEach(mapDoc => {
          if (mapDoc.exists()) {
            mapsById[mapDoc.id] = { id: mapDoc.id, ...mapDoc.data() };
          }
        });

        // Join mapViews with maps
        const result = viewsSnapshot.docs
          .map(mapViewDoc => {
            const mapViewData = mapViewDoc.data();
            const mapData = mapsById[mapViewData['mapId']];

            if (!mapData) {
              return null; // Skip if map was deleted
            }

            return {
              ...mapData,
              userRole: mapViewData['role'],
              displayedName: mapViewData['displayName'],
              mapViewId: mapViewDoc.id
            } as PlaceMapWithRole;
          })
          .filter((item): item is PlaceMapWithRole => item !== null);

        callback(result);
      } catch (error) {
        console.error('Error in mapViews subscription:', error);
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error subscribing to user mapViews:', error);
    return () => {};
  }
};

/**
 * Get all mapViews (collaborators) for a specific map
 * @param mapId - Map ID
 * @returns Array of collaborator objects
 */
export const getMapViewsForMap = async (mapId: string): Promise<MapCollaborator[]> => {
  try {
    const viewsRef = collection(db, 'maps', mapId, 'views');
    const snapshot = await getDocs(viewsRef);

    return snapshot.docs.map(doc => ({
      userId: doc.data()['collaborator'],
      userRole: doc.data()['role'],
      mapViewId: doc.id,
      displayedName: doc.data()['displayName']
    }));
  } catch (error) {
    console.error('Error getting mapViews for map:', error);
    throw error;
  }
};

/**
 * Delete all mapViews for a map (when map is deleted)
 * @param mapId - Map ID
 */
export const deleteMapViewsForMap = async (mapId: string): Promise<void> => {
  try {
    const viewsRef = collection(db, 'maps', mapId, 'views');
    const snapshot = await getDocs(viewsRef);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting mapViews for map:', error);
    throw error;
  }
};

/**
 * Get user's role for a specific map
 * @param userId - User email
 * @param mapId - Map ID
 * @returns Role or null
 */
export const getUserMapRole = async (userId: string, mapId: string): Promise<UserRole | null> => {
  try {
    const mapView = await getMapView(mapId, userId);
    return mapView ? mapView.role : null;
  } catch (error) {
    console.error('Error getting user map role:', error);
    throw error;
  }
};
