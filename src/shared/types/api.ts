/**
 * API request and response types
 */

import { Place, PlaceMap, MapView, UserRole } from './domain';

/**
 * Firebase document data (without id)
 */
export type FirebaseDocument<T> = Omit<T, 'id'>;

/**
 * Place document in Firestore
 */
export type PlaceDocument = FirebaseDocument<Place>;

/**
 * Map document in Firestore
 */
export type MapDocument = FirebaseDocument<PlaceMap>;

/**
 * MapView document in Firestore
 */
export type MapViewDocument = FirebaseDocument<MapView>;

/**
 * Share map request
 */
export interface ShareMapRequest {
  mapId: string;
  userId: string;
  role: UserRole;
}

/**
 * Unshare map request
 */
export interface UnshareMapRequest {
  mapId: string;
  userId: string;
}

/**
 * Create map request
 */
export interface CreateMapRequest {
  name: string;
  ownerId: string;
  isDefault?: boolean;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T> {
  data: T[];
  error?: Error;
}

/**
 * Subscription callback type
 */
export type SubscriptionCallback<T> = (data: T) => void;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFn = () => void;
