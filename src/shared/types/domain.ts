import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  OWNER = 'owner',
  EDIT = 'edit',
  VIEW = 'view',
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Geometry {
  location: Location;
}

export type PlaceGroup = 'want to go' | 'favorite';

export class Place {
  id: string;
  name: string;
  emoji: string;
  group: PlaceGroup;
  geometry: Geometry;
  formattedAddress?: string;
  placeId: string;
  types: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;

  constructor(
    id: string,
    name: string,
    emoji: string,
    group: PlaceGroup,
    geometry: Geometry,
    formattedAddress: string,
    placeId: string,
    types: string[],
    createdAt: Timestamp,
    updatedAt: Timestamp
  ) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
    this.group = group;
    this.geometry = geometry;
    this.formattedAddress = formattedAddress;
    this.placeId = placeId;
    this.types = types;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toString(): string {
    return `${this.emoji} ${this.name} (${this.group})`;
  }
}

export interface PlaceCreate {
  name: string;
  emoji?: string;
  group: PlaceGroup;
  geometry: Geometry;
}

export interface PlaceUpdate {
  name?: string;
  emoji?: string;
  group?: PlaceGroup;
  geometry?: Geometry;
}

export class UserMap {
  id: string;
  name: string;
  owner: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  constructor(
    id: string,
    name: string,
    owner: string,
    createdAt: Timestamp,
    updatedAt: Timestamp
  ) {
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toString(): string {
    return `${this.name} (${this.owner})`;
  }
}

export interface MapCreate {
  name: string;
}

export interface MapUpdate {
  name?: string;
}

export class MapView {
  id: string;
  mapId: string;
  collaborator: string;
  role: UserRole;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  constructor(
    id: string,
    mapId: string,
    collaborator: string,
    role: UserRole,
    displayName: string,
    createdAt: Timestamp,
    updatedAt: Timestamp
  ) {
    this.id = id;
    this.mapId = mapId;
    this.collaborator = collaborator;
    this.role = role;
    this.displayName = displayName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toString(): string {
    return `${this.displayName} (${this.role} access)`;
  }
}

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}
