import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Transaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {MapView, UserMap} from '../shared/types';
import {mapViewConverter} from "../shared/types";
import {assertDefined} from "../shared/utils/asserts";

const getCompositeId = (mapId: string, collaborator: string): string => {
  return `${mapId}_${collaborator}`;
};

export const createMapView = async (
  mapView: Pick<MapView, 'mapId' | 'collaborator' | 'role' | 'name'>,
  transaction?: Transaction
): Promise<void> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter)
  if (transaction) {
    transaction.set(mapViewRef, {...mapView, id: compositeId});
  } else {
    await setDoc(mapViewRef, {...mapView, id: compositeId});
  }
}

export const updateMapViewRole = async (mapView: Pick<MapView, 'mapId' | 'collaborator' | 'role'>): Promise<void> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter);
  await updateDoc(mapViewRef, {
    role: mapView.role
  });
};

export const updateMapViewDisplayName = async (
  mapView: Pick<MapView, 'mapId' | 'collaborator' | 'name'>
): Promise<void> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter);
  await updateDoc(mapViewRef, {name: mapView.name});
};

export const deleteMapView = async (mapView: Pick<MapView, 'mapId' | 'collaborator'>, transaction?: Transaction): Promise<void> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter)
  transaction ? transaction.delete(mapViewRef) : await deleteDoc(mapViewRef);
};

export const getMapView = async (mapView: Pick<MapView, 'mapId' | 'collaborator'>, transaction?: Transaction): Promise<MapView> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter)
  const mapViewDoc = transaction ? await transaction.get(mapViewRef) : await getDoc(mapViewRef);
  const retrievedMapView = mapViewDoc.data()
  assertDefined(retrievedMapView)
  return retrievedMapView;
};

export const getAccessibleMapViews = async (userEmail: string): Promise<MapView[]> => {
  const userMapViewsQuery = query(
    collection(db, 'mapViews'),
    where('collaborator', '==', userEmail)
  ).withConverter(mapViewConverter);
  const mapViewsSnapshot = await getDocs(userMapViewsQuery);
  return mapViewsSnapshot.docs.map(doc => doc.data());
};

export const getSharedMapViews = async (userMaps: UserMap[]): Promise<Map<UserMap, MapView[]>> => {
  const compositeIdToUserMap = new Map<string, UserMap>();
  const compositeIds = userMaps.flatMap(userMap =>
    Object.keys(userMap.collaborators).map(collaborator => {
      const compositeId = getCompositeId(userMap.id, collaborator);
      compositeIdToUserMap.set(compositeId, userMap);
      return compositeId;
    })
  );

  const mapViewPromises = compositeIds.map(async compositeId => {
    const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter);
    const snapshot = await getDoc(mapViewRef);
    return { compositeId, data: snapshot.data() };
  });

  const results = await Promise.all(mapViewPromises);
  const mapViewsByUserMap = new Map<UserMap, MapView[]>();

  for (const { compositeId, data } of results) {
    if (data) {
      const userMap = compositeIdToUserMap.get(compositeId)!;
      const existing = mapViewsByUserMap.get(userMap) || [];
      mapViewsByUserMap.set(userMap, [...existing, data]);
    }
  }

  return mapViewsByUserMap;
};
