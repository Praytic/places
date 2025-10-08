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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const MAP_VIEWS_COLLECTION = 'mapViews';

// Role constants (re-exported from MapsService for consistency)
export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

/**
 * Create a new mapView (access record for a user to a map)
 * @param {string} mapId - Map ID
 * @param {string} collaborator - User email
 * @param {string} role - User's role (owner/editor/viewer)
 * @param {string} displayedName - Map name to display for this user
 * @returns {Promise<Object>} The created mapView
 */
export const createMapView = async (mapId, collaborator, role, displayedName) => {
  try {
    // Use auto-generated ID from Firestore
    const mapViewRef = doc(collection(db, MAP_VIEWS_COLLECTION));
    const mapViewData = {
      id: mapViewRef.id,
      mapId,
      collaborator,
      role,
      displayedName,
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
 * @param {string} mapViewId - MapView ID
 * @param {string} newRole - New role
 * @returns {Promise<void>}
 */
export const updateMapViewRole = async (mapViewId, newRole) => {
  try {
    const mapViewRef = doc(db, MAP_VIEWS_COLLECTION, mapViewId);
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
 * @param {string} mapViewId - MapView ID
 * @param {string} newDisplayedName - New displayed name
 * @returns {Promise<void>}
 */
export const updateMapViewDisplayedName = async (mapViewId, newDisplayedName) => {
  try {
    const mapViewRef = doc(db, MAP_VIEWS_COLLECTION, mapViewId);
    await updateDoc(mapViewRef, {
      displayedName: newDisplayedName,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating mapView displayed name:', error);
    throw error;
  }
};

/**
 * Delete a mapView
 * @param {string} mapViewId - MapView ID
 * @returns {Promise<void>}
 */
export const deleteMapView = async (mapViewId) => {
  try {
    await deleteDoc(doc(db, MAP_VIEWS_COLLECTION, mapViewId));
  } catch (error) {
    console.error('Error deleting mapView:', error);
    throw error;
  }
};

/**
 * Get a specific mapView by mapId and collaborator
 * @param {string} mapId - Map ID
 * @param {string} collaborator - User email
 * @returns {Promise<Object|null>} MapView or null if not found
 */
export const getMapView = async (mapId, collaborator) => {
  try {
    const q = query(
      collection(db, MAP_VIEWS_COLLECTION),
      where('mapId', '==', mapId),
      where('collaborator', '==', collaborator)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const mapViewDoc = snapshot.docs[0];
    return { id: mapViewDoc.id, ...mapViewDoc.data() };
  } catch (error) {
    console.error('Error getting mapView:', error);
    throw error;
  }
};

/**
 * Get all mapViews for a user (with full map data joined)
 * @param {string} userId - User email
 * @returns {Promise<Array>} Array of maps with userRole
 */
export const getUserMapViews = async (userId) => {
  try {
    const q = query(
      collection(db, MAP_VIEWS_COLLECTION),
      where('collaborator', '==', userId)
    );
    const mapViewsSnapshot = await getDocs(q);

    if (mapViewsSnapshot.empty) {
      return [];
    }

    // Get all unique map IDs
    const mapIds = [...new Set(mapViewsSnapshot.docs.map(doc => doc.data().mapId))];

    // Fetch all maps in parallel
    const mapPromises = mapIds.map(mapId => getDoc(doc(db, 'maps', mapId)));
    const mapDocs = await Promise.all(mapPromises);

    // Create a map lookup
    const mapsById = {};
    mapDocs.forEach(mapDoc => {
      if (mapDoc.exists()) {
        mapsById[mapDoc.id] = { id: mapDoc.id, ...mapDoc.data() };
      }
    });

    // Join mapViews with maps
    const result = mapViewsSnapshot.docs
      .map(mapViewDoc => {
        const mapViewData = mapViewDoc.data();
        const mapData = mapsById[mapViewData.mapId];

        if (!mapData) {
          return null; // Skip if map was deleted
        }

        return {
          ...mapData,
          userRole: mapViewData.role,
          displayedName: mapViewData.displayedName,
          mapViewId: mapViewDoc.id
        };
      })
      .filter(item => item !== null);

    return result;
  } catch (error) {
    console.error('Error getting user mapViews:', error);
    throw error;
  }
};

/**
 * Subscribe to user's mapViews in real-time
 * @param {string} userId - User email
 * @param {Function} callback - Callback with maps array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserMapViews = (userId, callback) => {
  try {
    const q = query(
      collection(db, MAP_VIEWS_COLLECTION),
      where('collaborator', '==', userId)
    );

    return onSnapshot(q, async (mapViewsSnapshot) => {
      try {
        if (mapViewsSnapshot.empty) {
          callback([]);
          return;
        }

        // Get all unique map IDs
        const mapIds = [...new Set(mapViewsSnapshot.docs.map(doc => doc.data().mapId))];

        // Fetch all maps in parallel
        const mapPromises = mapIds.map(mapId => getDoc(doc(db, 'maps', mapId)));
        const mapDocs = await Promise.all(mapPromises);

        // Create a map lookup
        const mapsById = {};
        mapDocs.forEach(mapDoc => {
          if (mapDoc.exists()) {
            mapsById[mapDoc.id] = { id: mapDoc.id, ...mapDoc.data() };
          }
        });

        // Join mapViews with maps
        const result = mapViewsSnapshot.docs
          .map(mapViewDoc => {
            const mapViewData = mapViewDoc.data();
            const mapData = mapsById[mapViewData.mapId];

            if (!mapData) {
              return null; // Skip if map was deleted
            }

            return {
              ...mapData,
              userRole: mapViewData.role,
              displayedName: mapViewData.displayedName,
              mapViewId: mapViewDoc.id
            };
          })
          .filter(item => item !== null);

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
 * @param {string} mapId - Map ID
 * @returns {Promise<Array>} Array of {userId, userRole, mapViewId} objects
 */
export const getMapViewsForMap = async (mapId) => {
  try {
    const q = query(
      collection(db, MAP_VIEWS_COLLECTION),
      where('mapId', '==', mapId)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      userId: doc.data().collaborator,
      userRole: doc.data().role,
      mapViewId: doc.id,
      displayedName: doc.data().displayedName
    }));
  } catch (error) {
    console.error('Error getting mapViews for map:', error);
    throw error;
  }
};

/**
 * Delete all mapViews for a map (when map is deleted)
 * @param {string} mapId - Map ID
 * @returns {Promise<void>}
 */
export const deleteMapViewsForMap = async (mapId) => {
  try {
    const q = query(
      collection(db, MAP_VIEWS_COLLECTION),
      where('mapId', '==', mapId)
    );
    const snapshot = await getDocs(q);

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
 * @param {string} userId - User email
 * @param {string} mapId - Map ID
 * @returns {Promise<string|null>} Role or null
 */
export const getUserMapRole = async (userId, mapId) => {
  try {
    const mapView = await getMapView(mapId, userId);
    return mapView ? mapView.role : null;
  } catch (error) {
    console.error('Error getting user map role:', error);
    throw error;
  }
};
