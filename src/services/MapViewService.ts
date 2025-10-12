import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Transaction,
  where,
} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {MapView} from '../shared/types/domain';
import {mapViewConverter} from "../shared/types";
import {useAuthUser} from "../components/Auth";
import {assertDefined} from "../shared/utils/asserts";

const getCompositeId = (mapId: string, collaborator: string): string => {
  return `${mapId}_${collaborator}`;
};

export const createMapView = async (
  mapView: Pick<MapView, 'mapId' | 'collaborator' | 'role' | 'name'>,
  transaction?: Transaction
): Promise<MapView> => {
  const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
  const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter)
  if (transaction) {
    transaction.set(mapViewRef, {...mapView});
    return getMapView(mapView, transaction)
  } else {
    return runTransaction(db, async (tx) => {
        tx.set(mapViewRef, {...mapView})
        return getMapView(mapView, tx);
      }
    );
  }
}

export const updateMapViewRole = async (mapView: Pick<MapView, 'mapId' | 'collaborator' | 'role'>): Promise<MapView> => {
  return runTransaction(db, async (tx) => {
    const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
    const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter);
    tx.update(mapViewRef, {
      role: mapView.role
    });
    return getMapView(mapView, tx);
  });
};

export const updateMapViewDisplayName = async (
  mapView: Pick<MapView, 'mapId' | 'collaborator' | 'name'>
): Promise<MapView> => {
  return runTransaction(db, async (tx) => {
    const compositeId = getCompositeId(mapView.mapId, mapView.collaborator);
    const mapViewRef = doc(db, 'mapViews', compositeId).withConverter(mapViewConverter);
    tx.update(mapViewRef, {displayName: mapView.name});
    return getMapView(mapView, tx);
  });
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

export const getUserMapViews = async (): Promise<MapView[]> => {
  const user = useAuthUser();
  const userMapViewsQuery = query(
    collection(db, 'mapViews'),
    where('collaborator', '==', user.email)
  ).withConverter(mapViewConverter);
  const mapViewsSnapshot = await getDocs(userMapViewsQuery);
  return mapViewsSnapshot.docs.map(doc => doc.data());
};
