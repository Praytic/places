import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {MapView, Place, placeConverter, UserMap} from '../shared/types';
import {assertDefined} from '../shared/utils/asserts';

export const createPlace = async (
  place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>,
  transaction?: Transaction
): Promise<Place> => {
  const placeRef = doc(collection(db, 'maps', place.mapId, 'places')).withConverter(placeConverter);
  if (transaction) {
    transaction.set(placeRef, place);
    return getPlace({mapId: place.mapId, id: placeRef.id}, transaction);
  } else {
    return runTransaction(db, async (tx) => {
      tx.set(placeRef, place);
      return getPlace({mapId: place.mapId, id: placeRef.id}, tx);
    });
  }
};

export const getPlace = async (place: Pick<Place, 'id' | 'mapId'>, transaction?: Transaction): Promise<Place> => {
  const placeRef = doc(db, 'maps', place.mapId, 'places', place.id).withConverter(placeConverter);
  const placeDoc = transaction ? await transaction.get(placeRef) : await getDoc(placeRef);
  const placeData = placeDoc.data();
  assertDefined(placeData);
  return placeData;
};

export const getPlacesForMap = async (userMap: Pick<UserMap, 'id'>): Promise<Place[]> => {
  const placesRef = collection(db, 'maps', userMap.id, 'places').withConverter(placeConverter);
  const placesSnapshot = await getDocs(placesRef);
  return placesSnapshot.docs.map(doc => doc.data());
};

export const getPlacesForView = async (mapView: Pick<MapView, 'mapId'>): Promise<Place[]> => {
  const placesRef = collection(db, 'maps', mapView.mapId, 'places').withConverter(placeConverter);
  const placesSnapshot = await getDocs(placesRef);
  return placesSnapshot.docs.map(doc => doc.data());
};

export const updatePlace = async (
  place: Pick<Place, 'group' | 'emoji' | 'mapId' | 'id'>,
  transaction?: Transaction
): Promise<Place> => {
  const placeRef = doc(db, 'maps', place.mapId, 'places', place.id).withConverter(placeConverter);
  if (transaction) {
    transaction.update(placeRef, place);
    return getPlace(place, transaction);
  } else {
    return runTransaction(db, async (tx) => {
      tx.update(placeRef, place);
      return getPlace(place, tx);
    });
  }
};

export const deletePlace = async (place: Pick<Place, 'id' | 'mapId'>, transaction?: Transaction): Promise<void> => {
  const placeRef = doc(db, 'maps', place.mapId, 'places', place.id).withConverter(placeConverter);
  transaction ? transaction.delete(placeRef) : await deleteDoc(placeRef);
};
