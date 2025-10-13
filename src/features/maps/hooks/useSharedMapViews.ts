import { useState, useEffect } from 'react';
import {MapView, UserMap} from '../../../shared/types';
import {getSharedMapViews} from "../../../services/MapViewService";

export const useSharedMapViews = (userMaps: UserMap[]): {
  sharedViews: Map<UserMap, MapView[]>;
  loading: boolean;
  error: string | null;
} => {
  const [sharedViews, setSharedViews] = useState<Map<UserMap, MapView[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViews = async () => {
      if (userMaps.length === 0) {
        setSharedViews(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const viewsPerUserMap = await getSharedMapViews(userMaps);
        setSharedViews(viewsPerUserMap);
      } catch (err) {
        setError('Failed to fetch map views');
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [userMaps]);

  return { sharedViews, loading, error };
};
