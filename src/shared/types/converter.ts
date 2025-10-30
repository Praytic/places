import type { Place, UserMap, MapView } from './domain';
import type { Timestamp, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Timestamp as TimestampClass } from 'firebase/firestore';

export const placeConverter = {
  toFirestore: (place: Place) => {
    return {
      name: place.name,
      emoji: place.emoji,
      group: place.group,
      geometry: place.geometry,
      formatted_address: place.formattedAddress,
      place_id: place.placeId,
      types: place.types,
      createdAt: place.createdAt || TimestampClass.now(),
      updatedAt: place.updatedAt || TimestampClass.now(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) => {
    const data = snapshot.data(options);
    // Extract mapId from path: maps/{mapId}/places/{placeId}
    const pathSegments = snapshot.ref.path.split('/');
    const mapId = pathSegments[1];
    return new Place(
      mapId,
      data.name,
      data.emoji,
      data.group,
      data.geometry,
      data.formatted_address,
      data.place_id,
      data.types,
      snapshot.id,
      data.createdAt,
      data.updatedAt
    );
  },
};

export const userMapConverter = {
  toFirestore: (map: UserMap) => {
    return {
      name: map.name,
      owner: map.owner,
      collaborators: map.collaborators,
      createdAt: map.createdAt || TimestampClass.now(),
      updatedAt: map.updatedAt || TimestampClass.now(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) => {
    const data = snapshot.data(options);
    // Handle migration from array to Record format
    let collaborators: Record<string, string> = {};
    if (Array.isArray(data.collaborators)) {
      // Old format: array of emails - convert to Record with default 'view' role
      data.collaborators.forEach((email: string) => {
        collaborators[email] = 'view';
      });
    } else {
      // New format: already a Record
      collaborators = data.collaborators || {};
    }
    return new UserMap(
      snapshot.id,
      data.name,
      data.owner,
      collaborators,
      data.createdAt,
      data.updatedAt
    );
  },
};

export const mapViewConverter = {
  toFirestore: (mapView: MapView) => {
    return {
      id: `${mapView.mapId}_${mapView.collaborator}`,
      mapId: mapView.mapId,
      collaborator: mapView.collaborator,
      role: mapView.role,
      name: mapView.name,
      createdAt: mapView.createdAt || TimestampClass.now(),
      updatedAt: mapView.updatedAt || TimestampClass.now(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) => {
    const data = snapshot.data(options);
    return new MapView(
      snapshot.id,
      data.mapId,
      data.collaborator,
      data.role,
      data.name,
      data.createdAt,
      data.updatedAt
    );
  },
};
