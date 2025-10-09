import { Place, UserMap, MapView } from './domain';

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
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new Place(
      snapshot.id,
      data.name,
      data.emoji,
      data.group,
      data.geometry,
      data.formattedAddress,
      data.placeId,
      data.types,
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
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new UserMap(
      snapshot.id,
      data.name,
      data.owner,
      data.createdAt,
      data.updatedAt
    );
  },
};

export const mapViewConverter = {
  toFirestore: (mapView: MapView) => {
    return {
      mapId: mapView.mapId,
      collaborator: mapView.collaborator,
      role: mapView.role,
      displayName: mapView.displayName,
      createdAt: mapView.createdAt,
      updatedAt: mapView.updatedAt,
    };
  },
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new MapView(
      snapshot.id,
      data.mapId,
      data.collaborator,
      data.role,
      data.displayName,
      data.createdAt,
      data.updatedAt
    );
  },
};
