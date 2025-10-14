import {collection, doc, getDoc, getDocs, query, runTransaction, Transaction, where} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {createMapView, deleteMapView} from './MapViewService';
import {MapView, UserMap, UserRole} from '../shared/types';
import {userMapConverter} from "../shared/types";
import {assertDefined} from "../shared/utils/asserts";

export const createMap = async (
  userMap: Pick<UserMap, 'name' | 'collaborators'>,
  mapViews: Pick<MapView, 'collaborator' | 'role'>[],
  userEmail: string,
): Promise<UserMap> => {
  assertDefined(userEmail)

  return runTransaction(db, async (tx) => {
    const mapRef = doc(collection(db, 'maps')).withConverter(userMapConverter);
    const newMap: UserMap = {...userMap, owner: userEmail, id: mapRef.id};
    tx.set(mapRef, newMap);

    await Promise.all(
      mapViews.map(mapView => {
        const displayName = `${newMap.name} (by ${newMap.owner})`;
        return createMapView({...mapView, mapId: mapRef.id, name: displayName}, tx)
      })
    );
    return newMap;
  });
};

export const getUserMap = async (mapId: string, transaction?: Transaction): Promise<UserMap> => {
  const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
  const mapSnapshot = transaction ? await transaction.get(mapRef) : await getDoc(mapRef);
  const mapData = mapSnapshot.data();
  assertDefined(mapData);
  return mapData;
};

export const getUserMaps = async (userEmail: string): Promise<UserMap[]> => {
  const ownedMapsQuery = query(
    collection(db, 'maps'),
    where('owner', '==', userEmail)
  ).withConverter(userMapConverter);
  const ownedMapsSnapshot = await getDocs(ownedMapsQuery);
  return ownedMapsSnapshot.docs.map(doc => doc.data());
};

export const updateMap = async (
  mapId: string,
  updates: Partial<Pick<UserMap, 'collaborators' | 'name'>>,
  mapViews?: Pick<MapView, 'collaborator' | 'mapId' | 'role'>[],
): Promise<void> => {
  return runTransaction(db, async (tx) => {
    const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
    const oldMap = await getUserMap(mapId, tx);

    const newCollaborators = updates.collaborators ?? oldMap.collaborators;
    const newName = updates.name ?? oldMap.name;

    tx.set(
      mapRef,
      {...updates},
      {merge: true, mergeFields: ['collaborators', 'name', 'updatedAt']}
    );

    const removedCollaborators = oldMap.collaborators.filter(x => !newCollaborators.includes(x));
    const addedCollaborators = newCollaborators.filter(x => !oldMap.collaborators.includes(x));
    await Promise.all(
      removedCollaborators.map(email => deleteMapView({mapId: mapId, collaborator: email}, tx))
    );
    await Promise.all(
      addedCollaborators.map(email => {
        const role = mapViews?.find(mapView => mapView.mapId === mapId && mapView.collaborator === email)?.role ?? UserRole.VIEW
        const displayName = `${newName} (by ${oldMap.owner})`
        return createMapView({mapId: mapId, collaborator: email, role: role, name: displayName}, tx)
      })
    );
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
