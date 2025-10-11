import {collection, doc, getDoc, getDocs, query, runTransaction, Transaction, where} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {createMapView, deleteMapView} from './MapViewService';
import {MapView, UserMap, UserRole} from '../shared/types';
import {userMapConverter} from "../shared/types";
import {useAuthUser} from "../components/Auth";
import {assertDefined} from "../shared/utils/asserts";

export const createMap = async (
  userMap: Pick<UserMap, 'name' | 'collaborators'>,
  mapViews: Pick<MapView, 'collaborator' | 'role'>[],
): Promise<UserMap> => {
  const user = useAuthUser()
  const email = user.email
  assertDefined(email)

  return runTransaction(db, async (tx) => {
    const mapRef = doc(db, 'maps').withConverter(userMapConverter);
    tx.set(mapRef, {...userMap, owner: email, id: mapRef.id});
    const map = await getUserMap(mapRef.id);
    await Promise.all(
      mapViews.map(mapView => {
        const displayName = `${map.name} (by ${map.owner})`;
        return createMapView({...mapView, mapId: mapRef.id, displayName: displayName})
      })
    );
    return map
  });
};

export const getUserMap = async (mapId: string, transaction?: Transaction): Promise<UserMap> => {
  const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
  const mapSnapshot = transaction ? await transaction.get(mapRef) : await getDoc(mapRef);
  const mapData = mapSnapshot.data();
  assertDefined(mapData);
  return mapData;
};

export const getUserMaps = async (): Promise<UserMap[]> => {
  const user = useAuthUser();
  const ownedMapsQuery = query(
    collection(db, 'maps'),
    where('owner', '==', user.email)
  ).withConverter(userMapConverter);
  const ownedMapsSnapshot = await getDocs(ownedMapsQuery);
  return ownedMapsSnapshot.docs.map(doc => doc.data());
};

export const updateMap = async (
  mapId: string,
  updates: Partial<Pick<UserMap, 'collaborators' | 'name'>>,
  mapViews?: Pick<MapView, 'collaborator' | 'mapId' | 'role'>[],
): Promise<UserMap> => {
  return runTransaction(db, async (tx) => {
    const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
    const oldMap = await getUserMap(mapId, tx);
    tx.set(
      mapRef,
      {...updates},
      {merge: true, mergeFields: ['collaborators', 'name', 'updatedAt']}
    );
    const newMap = await getUserMap(mapId, tx);

    const removedCollaborators = oldMap.collaborators.filter(x => !newMap.collaborators.includes(x));
    const addedCollaborators = newMap.collaborators.filter(x => !oldMap.collaborators.includes(x));
    await Promise.all(
      removedCollaborators.map(email => deleteMapView({mapId: mapId, collaborator: email}, tx))
    );
    await Promise.all(
      addedCollaborators.map(email => {
        const role = mapViews?.find(mapView => mapView.mapId === mapId && mapView.collaborator === email)?.role ?? UserRole.VIEW
        const displayName = `${newMap.name} (by ${newMap.owner})`
        createMapView({mapId: mapId, collaborator: email, role: role, displayName: displayName}, tx)
      })
    );

    return getUserMap(mapId, tx);
  });
};

export const deleteMap = async (mapId: string): Promise<void> => {
  return await runTransaction(db, async (tx) => {
    const userMap = await getUserMap(mapId, tx);
    await Promise.all(userMap.collaborators.map(email => deleteMapView({mapId: mapId, collaborator: email}, tx)));
    const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
    tx.delete(mapRef);
  });
};
