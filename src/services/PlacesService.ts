import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  Transaction,
  updateDoc,
} from 'firebase/firestore';
import {db} from '../lib/firebase/config';
import {MapView, Place, placeConverter, UserMap} from '../shared/types';
import {assertDefined} from '../shared/utils/asserts';

export const createPlace = async (
  place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>,
  transaction?: Transaction
): Promise<Place> => {
  const placeRef = doc(collection(db, 'maps', place.mapId, 'places')).withConverter(placeConverter);
  const now = Timestamp.now();
  const newPlace = new Place(
    place.mapId,
    place.name,
    place.emoji,
    place.group,
    place.geometry!,
    place.formattedAddress!,
    place.placeId,
    place.types,
    placeRef.id,
    now,
    now
  );

  if (transaction) {
    transaction.set(placeRef, newPlace);
  } else {
    await setDoc(placeRef, newPlace);
  }
  return newPlace;
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
  const updates = {
    group: place.group,
    emoji: place.emoji,
    updatedAt: Timestamp.now()
  };

  if (transaction) {
    transaction.update(placeRef, updates);
  } else {
    await updateDoc(placeRef, updates);
  }

  // Fetch the updated place
  return getPlace(place, transaction);
};

export const deletePlace = async (place: Pick<Place, 'id' | 'mapId'>, transaction?: Transaction): Promise<void> => {
  const placeRef = doc(db, 'maps', place.mapId, 'places', place.id).withConverter(placeConverter);
  transaction ? transaction.delete(placeRef) : await deleteDoc(placeRef);
};
