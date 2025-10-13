import { useState, useEffect } from 'react';
import {MapView, UserMap} from '../../../shared/types';
import {getSharedMapViews} from "../../../services/MapViewService";

export const useSharedMapViews = (userMap?: UserMap): {
  collaborators: Partial<MapView>[];
  setCollaborators: React.Dispatch<React.SetStateAction<Partial<MapView>[]>>;
  loading: boolean;
  error: string | null;
} => {
  const [sharedViews, setSharedViews] = useState<Partial<MapView>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      if (!userMap) {
        return;
      }

      setLoading(true);
      try {
        const viewsPerUserMap = await getSharedMapViews([userMap]);
        const mapViews = viewsPerUserMap.get(userMap)!;
        setSharedViews(mapViews);
      } catch (err) {
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  });

  return { collaborators: sharedViews, setCollaborators: setSharedViews, loading, error };
};
