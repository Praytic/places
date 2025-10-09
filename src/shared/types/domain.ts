import { Timestamp } from 'firebase/firestore';

/**
 * User role types for map access control
 */
export enum UserRole {
  OWNER = 'owner',
  EDITOR = 'edit',
  VIEWER = 'viewer',
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
  mapId: string;
  name: string;
  emoji: string;
  group: PlaceGroup;
  geometry: Geometry;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userRole?: UserRole;
}

/**
 * Input type for creating a new place
 */
export interface PlaceInput {
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
 * Core PlaceMap entity (container for places)
 * Named PlaceMap to avoid conflict with JavaScript's built-in Map
 */
export interface PlaceMap {
  id: string;
  name: string;
  owner: string;
  isDefault?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userRole?: UserRole;
}

// Alias for backward compatibility
export type Map = PlaceMap;

/**
 * Input type for creating a new map
 */
export interface MapInput {
  name: string;
  isDefault?: boolean;
}

/**
 * Input type for updating a map
 */
export interface MapUpdate {
  name?: string;
  isDefault?: boolean;
}

/**
 * MapView entity (represents shared access to a map)
 */
export interface MapView {
  id: string;
  mapId: string;
  collaborator: string;
  role: UserRole;
  displayName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * User entity
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Map collaborator information
 */
export interface Collaborator {
  userId: string;
  role: UserRole;
  displayName?: string;
}

/**
 * Filter state for places
 */
export type FilterSet = Set<PlaceGroup>;

/**
 * Map visibility state
 */
export type VisibleMapIds = Set<string>;

/**
 * Extended PlaceMap with userRole and optional mapView fields
 */
export interface PlaceMapWithRole extends PlaceMap {
  userRole: UserRole;
  mapViewId?: string;
  displayedName?: string;
}

/**
 * Error types for the application
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Loading state
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}
