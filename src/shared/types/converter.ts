import { Place, UserMap, MapView } from './domain';
import {Timestamp} from "firebase/firestore";

export const placeConverter = {
  toFirestore: (place: Place) => {
    return {
      name: place.name,
      emoji: place.emoji,
      group: place.group,
      geometry: place.geometry,
      formattedAddress: place.formattedAddress,
      placeId: place.placeId,
      types: place.types,
      createdAt: place.createdAt || Timestamp.now(),
      updatedAt: place.updatedAt || Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
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
      data.formattedAddress,
      data.placeId,
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
      createdAt: map.createdAt || Timestamp.now(),
      updatedAt: map.updatedAt || Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new UserMap(
      data.name,
      data.owner,
      snapshot.id,
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
      displayName: mapView.displayName,
      createdAt: mapView.createdAt || Timestamp.now(),
      updatedAt: mapView.updatedAt || Timestamp.now(),
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new MapView(
      data.mapId,
      data.collaborator,
      data.role,
      data.displayName,
      data.createdAt,
      data.updatedAt
    );
  },
};
