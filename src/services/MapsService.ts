import {collection, doc, getDoc, getDocs, query, runTransaction, Transaction, where} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {createMapView, deleteMapView} from './MapViewService';
import {UserMap} from '../shared/types';
import {userMapConverter} from "../shared/types";
import {assertDefined} from "../shared/utils/asserts";

export const createMap = async (
  userMap: Pick<UserMap, 'name' | 'collaborators'>,
  userEmail: string,
): Promise<UserMap> => {
  assertDefined(userEmail)

  return runTransaction(db, async (tx) => {
    const mapRef = doc(collection(db, 'maps')).withConverter(userMapConverter);
    const newMap: UserMap = {...userMap, owner: userEmail, id: mapRef.id};
    tx.set(mapRef, newMap);

    await Promise.all(
      Object.entries(newMap.collaborators).map(([email, role]) => {
        const displayName = `${newMap.name} (by ${newMap.owner})`;
        return createMapView({collaborator: email, role, mapId: mapRef.id, name: displayName}, tx)
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
): Promise<void> => {
  return runTransaction(db, async (tx) => {
    const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
    const oldMap = await getUserMap(mapId, tx);

    const newCollaborators = updates.collaborators ?? oldMap.collaborators;
    const newName = updates.name ?? oldMap.name;

    tx.update(mapRef, updates);

    const oldEmails = Object.keys(oldMap.collaborators);
    const newEmails = Object.keys(newCollaborators);

    const removedCollaborators = oldEmails.filter(email => !newEmails.includes(email));
    const addedCollaborators = newEmails.filter(email => !oldEmails.includes(email));
    const existingCollaborators = newEmails.filter(email => oldEmails.includes(email));

    await Promise.all([
      ...removedCollaborators.map(email => deleteMapView({mapId: mapId, collaborator: email}, tx)),
      ...addedCollaborators.map(email => {
        const role = newCollaborators[email];
        assertDefined(role);
        const displayName = `${newName} (by ${oldMap.owner})`;
        return createMapView({mapId: mapId, collaborator: email, role: role, name: displayName}, tx);
      }),
      ...existingCollaborators.map(email => {
        const oldRole = oldMap.collaborators[email];
        const newRole = newCollaborators[email];
        if (oldRole !== newRole) {
          // Role changed - we need to update the mapView
          const mapViewRef = doc(db, 'mapViews', `${mapId}_${email}`);
          return tx.update(mapViewRef, { role: newRole });
        }
        return Promise.resolve();
      })
    ]);
  });
};

export const deleteMap = async (mapId: string): Promise<void> => {
  return await runTransaction(db, async (tx) => {
    const userMap = await getUserMap(mapId, tx);
    await Promise.all(
      Object.keys(userMap.collaborators).map(email => deleteMapView({mapId: mapId, collaborator: email}, tx))
    );
    const mapRef = doc(db, 'maps', mapId).withConverter(userMapConverter);
    tx.delete(mapRef);
  });
};
