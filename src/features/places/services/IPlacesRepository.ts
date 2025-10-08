import {
  Place,
  PlaceInput,
  PlaceUpdate,
  UnsubscribeFn,
  SubscriptionCallback,
} from '../../../shared/types';

/**
 * Repository interface for Places data access
 */
export interface IPlacesRepository {
  /**
   * Get all places for a specific map
   */
  getPlacesForMap(mapId: string): Promise<Place[]>;

  /**
   * Get all places for multiple maps
   */
  getPlacesForMaps(mapIds: string[], mapRoles: Record<string, string>): Promise<Place[]>;

  /**
   * Add a new place
   */
  addPlace(place: PlaceInput, mapId: string): Promise<Place>;

  /**
   * Update an existing place
   */
  updatePlace(placeId: string, updates: PlaceUpdate): Promise<void>;

  /**
   * Delete a place
   */
  deletePlace(placeId: string): Promise<void>;

  /**
   * Subscribe to places for multiple maps
   */
  subscribeToPlacesForMaps(
    mapIds: string[],
    mapRoles: Record<string, string>,
    callback: SubscriptionCallback<Place[]>
  ): UnsubscribeFn;
}