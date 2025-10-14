import {
  UserMap,
  MapCreate,
  MapUpdate,
  UserRole,
  Collaborator,
  UnsubscribeFn,
  SubscriptionCallback,
} from '../../../shared/types';

/**
 * Repository interface for Maps data access
 */
export interface IMapsRepository {
  /**
   * Create a new map
   */
  createMap(ownerId: string, mapInput: MapCreate): Promise<UserMap>;

  /**
   * Get a map by ID
   */
  getMap(mapId: string): Promise<UserMap | null>;

  /**
   * Get all maps accessible to a user
   */
  getUserMaps(userId: string): Promise<UserMap[]>;

  /**
   * Update map details
   */
  updateMap(mapId: string, updates: MapUpdate): Promise<void>;

  /**
   * Delete a map and all its places
   */
  deleteMap(mapId: string): Promise<void>;

  /**
   * Share a map with a user
   */
  shareMapWithUser(mapId: string, userId: string, role: UserRole): Promise<void>;

  /**
   * Unshare a map with a user
   */
  unshareMapWithUser(mapId: string, userId: string): Promise<void>;

  /**
   * Get user's role for a map
   */
  getUserMapRole(userId: string, mapId: string): Promise<UserRole | null>;

  /**
   * Check if user is map owner
   */
  isMapOwner(userId: string, mapId: string): Promise<boolean>;

  /**
   * Get all collaborators for a map
   */
  getMapCollaborators(mapId: string): Promise<Collaborator[]>;

  /**
   * Subscribe to user's maps in real-time
   */
  subscribeToUserMaps(userId: string, callback: SubscriptionCallback<UserMap[]>): UnsubscribeFn;

  /**
   * Get count of maps owned by user
   */
  getUserMapCount(userId: string): Promise<number>;
}
