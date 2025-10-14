import {Place} from '../../../shared/types';

export interface IPlacesRepository {
  getPlacesForMap(place: Pick<Place, 'mapId'>): Promise<Place[]>;
  getPlacesForMaps(places: Pick<Place, 'mapId'>[]): Promise<Place[]>;
  createPlace(place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>): Promise<Place>;
  updatePlace(place: Pick<Place, 'group' | 'emoji' | 'mapId' | 'id'>): Promise<Place>;
  deletePlace(place: Pick<Place, 'id' | 'mapId'>): Promise<void>;
}
