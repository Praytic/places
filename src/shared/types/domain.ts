import { Timestamp } from 'firebase/firestore';

/**
 * User role types for map access control
 */
export enum UserRole {
  EDIT = 'edit',
  VIEW = 'view',
}

/**
 * Geographic location coordinates
 */
export interface Location {
  lat: number;
  lng: number;
}

/**
 * Place geometry containing location data
 */
export interface Geometry {
  location: Location;
}

/**
 * Place group types
 */
export type PlaceGroup = 'want to go' | 'favorite';

/**
 * Core Place entity
 */
export interface Place {
  id: string;
  name: string;
  emoji: string;
  group: PlaceGroup;
  geometry: Geometry;
  formattedAddress: string;
  placeId: string;
  types: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a new place
 */
export interface PlaceCreate {
  name: string;
  emoji?: string;
  group: PlaceGroup;
  geometry: Geometry;
}

/**
 * Input type for updating a place
 */
export interface PlaceUpdate {
  name?: string;
  emoji?: string;
  group?: PlaceGroup;
  geometry?: Geometry;
}

/**
 * Core entity that represents owner's view of a Map
 */
export interface UserMap {
  id: string;
  name: string;
  owner: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a new map
 */
export interface MapCreate {
  name: string;
}

/**
 * Input type for updating a map
 */
export interface MapUpdate {
  name?: string;
}

/**
 * MapView entity (represents shared access to a map)
 */
export interface MapView {
  id: string;
  mapId: string;
  collaborator: string;
  role: UserRole;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * User entity
 */
export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * Map collaborator information
 */
export interface Collaborator {
  userId: string;
  role: UserRole;
  displayName?: string;
}
